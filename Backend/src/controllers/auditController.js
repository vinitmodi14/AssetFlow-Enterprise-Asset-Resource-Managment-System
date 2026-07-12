const AuditCycle = require("../models/AuditCycle");
const AuditItem  = require("../models/AuditItem");
const Asset      = require("../models/Asset");

// ─── POST /api/audits — Create an Audit Cycle ───
const createAuditCycle = async (req, res) => {
  try {
    const { name, scopeType, scopeDepartment, scopeLocation, startDate, endDate, auditors } = req.body;

    if (!name || !scopeType || !startDate || !endDate) {
      return res.status(400).json({ message: "Name, scope type, start date and end date are required." });
    }
    if (scopeType === "department" && !scopeDepartment) {
      return res.status(400).json({ message: "Department is required when scope is department." });
    }
    if (scopeType === "location" && !scopeLocation) {
      return res.status(400).json({ message: "Location is required when scope is location." });
    }
    if (!auditors || auditors.length === 0) {
      return res.status(400).json({ message: "At least one auditor must be assigned." });
    }

    // Find assets matching scope
    const assetFilter = {};
    if (scopeType === "department") assetFilter.department = scopeDepartment;
    if (scopeType === "location")  assetFilter.location = scopeLocation;

    const matchingAssets = await Asset.find(assetFilter);
    if (matchingAssets.length === 0) {
      return res.status(400).json({ message: "No assets found matching the selected scope." });
    }

    // Create the cycle
    const cycle = await AuditCycle.create({
      name,
      scopeType,
      scopeDepartment: scopeType === "department" ? scopeDepartment : null,
      scopeLocation:   scopeType === "location" ? scopeLocation : "",
      startDate: new Date(startDate),
      endDate:   new Date(endDate),
      auditors,
      createdBy: req.user._id,
      totalAssets: matchingAssets.length,
      status: "Planned",
    });

    // Bulk-create audit items (one per asset)
    const items = matchingAssets.map((asset) => ({
      auditCycle: cycle._id,
      asset: asset._id,
      status: "Pending",
    }));
    await AuditItem.insertMany(items);

    const populated = await AuditCycle.findById(cycle._id)
      .populate("scopeDepartment", "name")
      .populate("auditors", "name email")
      .populate("createdBy", "name email");

    return res.status(201).json({ message: `Audit cycle created with ${matchingAssets.length} assets.`, cycle: populated });
  } catch (err) {
    console.error("createAuditCycle:", err);
    return res.status(500).json({ message: "Server error creating audit cycle." });
  }
};

// ─── GET /api/audits — List all cycles ───
const getAllAuditCycles = async (req, res) => {
  try {
    const cycles = await AuditCycle.find()
      .populate("scopeDepartment", "name")
      .populate("auditors", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.json(cycles);
  } catch (err) {
    console.error("getAllAuditCycles:", err);
    return res.status(500).json({ message: "Server error fetching audit cycles." });
  }
};

// ─── GET /api/audits/mine — Cycles where I'm an auditor ───
const getMyAuditCycles = async (req, res) => {
  try {
    const cycles = await AuditCycle.find({ auditors: req.user._id })
      .populate("scopeDepartment", "name")
      .populate("auditors", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.json(cycles);
  } catch (err) {
    console.error("getMyAuditCycles:", err);
    return res.status(500).json({ message: "Server error fetching your audit cycles." });
  }
};

// ─── GET /api/audits/:id — Cycle detail with all items ───
const getAuditCycleById = async (req, res) => {
  try {
    const cycle = await AuditCycle.findById(req.params.id)
      .populate("scopeDepartment", "name")
      .populate("auditors", "name email")
      .populate("createdBy", "name email")
      .populate("closedBy", "name email")
      .populate("discrepancyReport.flaggedItems.auditedBy", "name email");

    if (!cycle) return res.status(404).json({ message: "Audit cycle not found." });

    const items = await AuditItem.find({ auditCycle: cycle._id })
      .populate("asset", "assetTag name serialNumber status condition location department")
      .populate("auditedBy", "name email")
      .sort({ createdAt: 1 });

    // Populate asset.department inside items
    await AuditItem.populate(items, { path: "asset.department", select: "name" });

    return res.json({ cycle, items });
  } catch (err) {
    console.error("getAuditCycleById:", err);
    return res.status(500).json({ message: "Server error fetching audit cycle." });
  }
};

// ─── PATCH /api/audits/items/:itemId — Mark an asset ───
const markAuditItem = async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!["Verified", "Missing", "Damaged"].includes(status)) {
      return res.status(400).json({ message: "Status must be Verified, Missing, or Damaged." });
    }

    const item = await AuditItem.findById(req.params.itemId);
    if (!item) return res.status(404).json({ message: "Audit item not found." });

    const cycle = await AuditCycle.findById(item.auditCycle);
    if (!cycle) return res.status(404).json({ message: "Associated audit cycle not found." });

    // Verify user is an auditor of this cycle
    const isAuditor = cycle.auditors.some((a) => a.toString() === req.user._id.toString());
    const isAdmin = req.user.role === "Admin" || req.user.role === "Asset Manager";
    if (!isAuditor && !isAdmin) {
      return res.status(403).json({ message: "You are not an auditor for this cycle." });
    }

    if (cycle.status === "Closed") {
      return res.status(400).json({ message: "This audit cycle is closed and locked." });
    }

    // Adjust counters if re-marking
    const prevStatus = item.status;
    if (prevStatus !== "Pending") {
      if (prevStatus === "Verified") cycle.verifiedCount = Math.max(0, cycle.verifiedCount - 1);
      if (prevStatus === "Missing")  cycle.missingCount  = Math.max(0, cycle.missingCount - 1);
      if (prevStatus === "Damaged")  cycle.damagedCount  = Math.max(0, cycle.damagedCount - 1);
    }

    if (status === "Verified") cycle.verifiedCount += 1;
    if (status === "Missing")  cycle.missingCount  += 1;
    if (status === "Damaged")  cycle.damagedCount  += 1;

    // Auto-progress cycle to In Progress on first mark
    if (cycle.status === "Planned") cycle.status = "In Progress";

    await cycle.save();

    // Update the item
    item.status    = status;
    item.notes     = notes || "";
    item.auditedBy = req.user._id;
    item.auditedAt = new Date();
    await item.save();

    const populated = await AuditItem.findById(item._id)
      .populate("asset", "assetTag name serialNumber status condition")
      .populate("auditedBy", "name email");

    return res.json({ message: `Asset marked as ${status}.`, item: populated });
  } catch (err) {
    console.error("markAuditItem:", err);
    return res.status(500).json({ message: "Server error marking audit item." });
  }
};

// ─── PATCH /api/audits/:id/complete — Mark cycle Completed ───
const completeCycle = async (req, res) => {
  try {
    const cycle = await AuditCycle.findById(req.params.id);
    if (!cycle) return res.status(404).json({ message: "Audit cycle not found." });
    if (cycle.status === "Closed") {
      return res.status(400).json({ message: "Cycle is already closed." });
    }

    cycle.status = "Completed";
    await cycle.save();

    return res.json({ message: "Audit cycle marked as Completed." });
  } catch (err) {
    console.error("completeCycle:", err);
    return res.status(500).json({ message: "Server error completing cycle." });
  }
};

// ─── PATCH /api/audits/:id/close — Close & Lock cycle, generate discrepancy report, update assets ───
const closeCycle = async (req, res) => {
  try {
    const cycle = await AuditCycle.findById(req.params.id);
    if (!cycle) return res.status(404).json({ message: "Audit cycle not found." });
    if (cycle.status === "Closed") {
      return res.status(400).json({ message: "Cycle is already closed." });
    }

    // Fetch all flagged (non-Verified, non-Pending) items
    const flaggedItems = await AuditItem.find({
      auditCycle: cycle._id,
      status: { $in: ["Missing", "Damaged"] },
    })
      .populate("asset", "assetTag name status")
      .populate("auditedBy", "name email");

    // Build discrepancy report and update asset statuses
    const reportItems = [];
    for (const item of flaggedItems) {
      const asset = await Asset.findById(item.asset._id || item.asset);
      if (!asset) continue;

      const previousStatus = asset.status;
      let newStatus = asset.status;

      if (item.status === "Missing") {
        newStatus = "Lost";
      } else if (item.status === "Damaged") {
        newStatus = "Under Maintenance";
      }

      // Update the actual asset status
      asset.status = newStatus;
      if (item.status === "Damaged") asset.condition = "Damaged";
      await asset.save();

      reportItems.push({
        asset: asset._id,
        assetTag: asset.assetTag,
        assetName: asset.name,
        previousStatus,
        auditResult: item.status,
        newStatus,
        notes: item.notes || "",
        auditedBy: item.auditedBy?._id || item.auditedBy,
      });
    }

    // Lock the cycle
    cycle.status = "Closed";
    cycle.closedAt = new Date();
    cycle.closedBy = req.user._id;
    cycle.discrepancyReport = {
      generatedAt: new Date(),
      flaggedItems: reportItems,
    };
    await cycle.save();

    // Re-populate for response
    const populated = await AuditCycle.findById(cycle._id)
      .populate("scopeDepartment", "name")
      .populate("auditors", "name email")
      .populate("createdBy", "name email")
      .populate("closedBy", "name email")
      .populate("discrepancyReport.flaggedItems.auditedBy", "name email");

    return res.json({
      message: `Audit cycle closed. ${reportItems.length} discrepancies found and asset statuses updated.`,
      cycle: populated,
    });
  } catch (err) {
    console.error("closeCycle:", err);
    return res.status(500).json({ message: "Server error closing audit cycle." });
  }
};

// ─── GET /api/audits/:id/report — Get discrepancy report ───
const getDiscrepancyReport = async (req, res) => {
  try {
    const cycle = await AuditCycle.findById(req.params.id)
      .populate("scopeDepartment", "name")
      .populate("createdBy", "name email")
      .populate("closedBy", "name email")
      .populate("discrepancyReport.flaggedItems.asset", "assetTag name serialNumber")
      .populate("discrepancyReport.flaggedItems.auditedBy", "name email");

    if (!cycle) return res.status(404).json({ message: "Audit cycle not found." });

    if (!cycle.discrepancyReport || !cycle.discrepancyReport.generatedAt) {
      return res.status(400).json({ message: "No discrepancy report available. Close the cycle first." });
    }

    return res.json({
      cycleName: cycle.name,
      status: cycle.status,
      closedAt: cycle.closedAt,
      closedBy: cycle.closedBy,
      totalAssets: cycle.totalAssets,
      verifiedCount: cycle.verifiedCount,
      missingCount: cycle.missingCount,
      damagedCount: cycle.damagedCount,
      report: cycle.discrepancyReport,
    });
  } catch (err) {
    console.error("getDiscrepancyReport:", err);
    return res.status(500).json({ message: "Server error fetching discrepancy report." });
  }
};

module.exports = {
  createAuditCycle,
  getAllAuditCycles,
  getMyAuditCycles,
  getAuditCycleById,
  markAuditItem,
  completeCycle,
  closeCycle,
  getDiscrepancyReport,
};
