const AuditCycle = require("../models/AuditCycle");
const AuditItem  = require("../models/AuditItem");
const Asset      = require("../models/Asset");
const User       = require("../models/User");
const { auditCycleSchema } = require("../utils/validation");
const { logActivity, createNotification } = require("../utils/helpers");

// @desc    Create an Audit Cycle and generate audit items for matching assets
// @route   POST /api/audit/cycles
// @access  Private (Admin or Asset Manager)
const createAuditCycle = async (req, res) => {
  try {
    const parsed = auditCycleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors.map((e) => e.message).join(". ") });
    }

    const { name, department, location, startDate, endDate, auditors } = parsed.data;

    // Check if cycle name already exists
    const exists = await AuditCycle.findOne({ name: name.trim() });
    if (exists) {
      return res.status(400).json({ message: `Audit cycle "${name}" already exists` });
    }

    // Verify auditors exist and are active
    const validAuditors = await User.find({ _id: { $in: auditors }, status: "Active" });
    if (validAuditors.length !== auditors.length) {
      return res.status(400).json({ message: "One or more selected auditors are invalid or inactive" });
    }

    const cycle = await AuditCycle.create({
      name,
      department: department || null,
      location: location || "",
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      auditors,
      status: "Active", // Cycles start as Active
    });

    // Find all assets in scope
    const filter = {};
    if (department) filter.department = department;
    if (location)   filter.location   = { $regex: location, $options: "i" };

    const matchingAssets = await Asset.find(filter);

    // Create AuditItem for each asset in scope
    const auditItemsData = matchingAssets.map((asset) => ({
      auditCycle: cycle._id,
      asset:      asset._id,
      status:     "Pending",
    }));

    if (auditItemsData.length > 0) {
      await AuditItem.insertMany(auditItemsData);
    }

    // Log Activity & Notify Auditors
    await logActivity(req.user._id, "Audit Cycle Created", `Created audit cycle "${name}" with ${matchingAssets.length} assets.`, req);

    for (const auditorId of auditors) {
      await createNotification(
        auditorId,
        "Audit",
        "Assigned to Audit Cycle",
        `You have been assigned as an auditor for cycle "${name}".`
      );
    }

    return res.status(201).json({
      message: "Audit Cycle created and activated successfully",
      cycle,
      assetsCount: matchingAssets.length,
    });
  } catch (error) {
    console.error("Create Audit Cycle Error:", error);
    return res.status(500).json({ message: "Server error creating audit cycle" });
  }
};

// @desc    Get all Audit Cycles
// @route   GET /api/audit/cycles
// @access  Private
const getAuditCycles = async (req, res) => {
  try {
    const cycles = await AuditCycle.find({})
      .populate("department", "name")
      .populate("auditors", "name email")
      .populate("closedBy", "name email")
      .sort({ createdAt: -1 });

    // For each cycle, append summary counts
    const enriched = await Promise.all(
      cycles.map(async (c) => {
        const items = await AuditItem.find({ auditCycle: c._id });
        const total = items.length;
        const pending = items.filter((i) => i.status === "Pending").length;
        const verified = items.filter((i) => i.status === "Verified").length;
        const missing = items.filter((i) => i.status === "Missing").length;
        const damaged = items.filter((i) => i.status === "Damaged").length;

        const obj = c.toObject();
        obj.counts = { total, pending, verified, missing, damaged };
        return obj;
      })
    );

    return res.json(enriched);
  } catch (error) {
    console.error("Get Audit Cycles Error:", error);
    return res.status(500).json({ message: "Server error fetching audit cycles" });
  }
};

// @desc    Get all items/assets for a specific Audit Cycle
// @route   GET /api/audit/cycles/:id/items
// @access  Private
const getAuditItems = async (req, res) => {
  try {
    const items = await AuditItem.find({ auditCycle: req.params.id })
      .populate({
        path: "asset",
        populate: [{ path: "category", select: "name" }, { path: "department", select: "name" }],
      })
      .populate("checkedBy", "name email")
      .sort({ status: 1 });

    return res.json(items);
  } catch (error) {
    console.error("Get Audit Items Error:", error);
    return res.status(500).json({ message: "Server error fetching audit items" });
  }
};

// @desc    Verify/Flag an asset under audit
// @route   PATCH /api/audit/items/:id
// @access  Private (Assigned Auditor or Admin)
const verifyAsset = async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!["Verified", "Missing", "Damaged"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'Verified', 'Missing', or 'Damaged'" });
    }

    const item = await AuditItem.findById(req.params.id).populate("auditCycle");
    if (!item) return res.status(404).json({ message: "Audit item not found" });

    if (item.auditCycle.status !== "Active") {
      return res.status(400).json({ message: "Cannot verify items on an inactive or closed audit cycle" });
    }

    // Verify user is assigned auditor or admin
    const isAuditor = item.auditCycle.auditors.some((a) => a.toString() === req.user._id.toString());
    const isAdmin = req.user.role === "Admin" || req.user.role === "Asset Manager";
    if (!isAuditor && !isAdmin) {
      return res.status(403).json({ message: "Access denied. You are not an auditor for this cycle." });
    }

    item.status = status;
    item.notes = notes || "";
    item.checkedBy = req.user._id;
    item.checkedAt = new Date();
    await item.save();

    return res.json({ message: "Asset verification logged successfully", item });
  } catch (error) {
    console.error("Verify Asset Error:", error);
    return res.status(500).json({ message: "Server error updating audit item" });
  }
};

// @desc    Close and lock an Audit Cycle
// @route   POST /api/audit/cycles/:id/close
// @access  Private (Admin or Asset Manager)
const closeAuditCycle = async (req, res) => {
  try {
    const cycle = await AuditCycle.findById(req.params.id);
    if (!cycle) return res.status(404).json({ message: "Audit cycle not found" });

    if (cycle.status === "Closed") {
      return res.status(400).json({ message: "Audit cycle is already closed" });
    }

    const items = await AuditItem.find({ auditCycle: cycle._id }).populate("asset");
    const pendingItems = items.filter((i) => i.status === "Pending");

    if (pendingItems.length > 0) {
      return res.status(400).json({
        message: `Cannot close audit cycle. There are still ${pendingItems.length} pending items.`,
      });
    }

    // Lock the cycle
    cycle.status = "Closed";
    cycle.closedAt = new Date();
    cycle.closedBy = req.user._id;
    await cycle.save();

    let missingCount = 0;
    let damagedCount = 0;

    // Apply asset updates based on discrepancy status
    for (const item of items) {
      const asset = await Asset.findById(item.asset._id || item.asset);
      if (!asset) continue;

      if (item.status === "Missing") {
        asset.status = "Lost";
        missingCount++;
        await asset.save();
      } else if (item.status === "Damaged") {
        asset.condition = "Damaged";
        damagedCount++;
        await asset.save();
      }
    }

    // Log Activity & Notify admin/managers of discrepancy report
    await logActivity(
      req.user._id,
      "Audit Cycle Closed",
      `Closed audit cycle "${cycle.name}". Flags: ${missingCount} Missing (marked Lost), ${damagedCount} Damaged.`,
      req
    );

    // Notify all auditors & system admins
    const admins = await User.find({ role: { $in: ["Admin", "Asset Manager"] } });
    const notificationReceivers = [...admins, ...cycle.auditors];
    const uniqueIds = [...new Set(notificationReceivers.map((r) => r._id.toString()))];

    for (const receiverId of uniqueIds) {
      await createNotification(
        receiverId,
        "Audit",
        "Audit Cycle Closed",
        `Audit cycle "${cycle.name}" has been closed. Discrepancy report generated (${missingCount} Missing, ${damagedCount} Damaged).`
      );
    }

    return res.json({
      message: `Audit cycle closed. ${missingCount} assets marked Lost, ${damagedCount} marked Damaged.`,
      cycle,
    });
  } catch (error) {
    console.error("Close Audit Cycle Error:", error);
    return res.status(500).json({ message: "Server error closing audit cycle" });
  }
};

module.exports = {
  createAuditCycle,
  getAuditCycles,
  getAuditItems,
  verifyAsset,
  closeAuditCycle,
};
