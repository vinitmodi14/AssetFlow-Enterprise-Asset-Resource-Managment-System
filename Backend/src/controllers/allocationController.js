const Asset      = require("../models/Asset");
const Allocation = require("../models/Allocation");
const Transfer   = require("../models/Transfer");
const { allocationSchema, transferRequestSchema } = require("../utils/validation");

const allocateAsset = async (req, res) => {
  try {
    const result = allocationSchema.safeParse(req.body);
    if (!result.success)
      return res.status(400).json({ message: result.error.errors.map((e) => e.message).join(". ") });

    const { assetId, allocatedToUserId, departmentId, expectedReturnDate, notes } = result.data;

    const asset = await Asset.findById(assetId).populate("currentHolder", "name email");
    if (!asset) return res.status(404).json({ message: "Asset not found" });

    if (asset.status !== "Available") {
      return res.status(409).json({
        message: `Asset is currently ${asset.status}`,
        currentHolder: asset.currentHolder
          ? { name: asset.currentHolder.name, email: asset.currentHolder.email }
          : null,
        canRequestTransfer: asset.status === "Allocated",
      });
    }

    const allocation = await Allocation.create({
      asset:              assetId,
      allocatedTo:        allocatedToUserId,
      allocatedBy:        req.user._id,
      department:         departmentId || null,
      startDate:          new Date(),
      expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
      notes,
      status:             "Active",
    });

    asset.status            = "Allocated";
    asset.currentHolder     = allocatedToUserId;
    asset.expectedReturnDate = expectedReturnDate ? new Date(expectedReturnDate) : null;
    await asset.save();

    const populated = await Allocation.findById(allocation._id)
      .populate("allocatedTo", "name email")
      .populate("allocatedBy", "name email")
      .populate("department",  "name");

    return res.status(201).json({ message: "Asset allocated successfully", allocation: populated });
  } catch (err) {
    console.error("allocateAsset:", err);
    return res.status(500).json({ message: "Server error during allocation" });
  }
};

const returnAsset = async (req, res) => {
  try {
    const allocation = await Allocation.findById(req.params.id).populate("asset");
    if (!allocation) return res.status(404).json({ message: "Allocation record not found" });
    if (allocation.status !== "Active" && allocation.status !== "Overdue")
      return res.status(400).json({ message: "Allocation is not currently active" });

    const { returnConditionNotes } = req.body;

    allocation.status               = "Returned";
    allocation.returnedAt           = new Date();
    allocation.returnConditionNotes = returnConditionNotes || "";
    await allocation.save();

    const asset = await Asset.findById(allocation.asset._id || allocation.asset);
    if (asset) {
      asset.status             = "Available";
      asset.currentHolder      = null;
      asset.expectedReturnDate = null;
      if (returnConditionNotes) asset.condition = req.body.condition || asset.condition;
      await asset.save();
    }

    return res.json({ message: "Asset returned successfully", allocation });
  } catch (err) {
    console.error("returnAsset:", err);
    return res.status(500).json({ message: "Server error during return" });
  }
};

const getAllocations = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const allocations = await Allocation.find(filter)
      .populate("asset",       "assetTag name serialNumber status condition")
      .populate("allocatedTo", "name email")
      .populate("allocatedBy", "name email")
      .populate("department",  "name")
      .sort({ createdAt: -1 });

    const now = new Date();
    const enriched = allocations.map((a) => {
      const obj = a.toObject();
      obj.isOverdue = a.status === "Active" && a.expectedReturnDate && a.expectedReturnDate < now;
      return obj;
    });

    return res.json(enriched);
  } catch (err) {
    console.error("getAllocations:", err);
    return res.status(500).json({ message: "Server error fetching allocations" });
  }
};

const requestTransfer = async (req, res) => {
  try {
    const result = transferRequestSchema.safeParse(req.body);
    if (!result.success)
      return res.status(400).json({ message: result.error.errors.map((e) => e.message).join(". ") });

    const { assetId, toUserId, comments } = result.data;

    const asset = await Asset.findById(assetId).populate("currentHolder", "name email");
    if (!asset) return res.status(404).json({ message: "Asset not found" });
    if (asset.status !== "Allocated")
      return res.status(400).json({ message: "Transfer requests are only for currently allocated assets" });

    const activeAllocation = await Allocation.findOne({ asset: assetId, status: "Active" });

    const transfer = await Transfer.create({
      asset:       assetId,
      allocation:  activeAllocation?._id || null,
      fromUser:    asset.currentHolder._id,
      toUser:      toUserId,
      requestedBy: req.user._id,
      status:      "Requested",
      comments,
    });

    const populated = await Transfer.findById(transfer._id)
      .populate("asset",       "assetTag name")
      .populate("fromUser",    "name email")
      .populate("toUser",      "name email")
      .populate("requestedBy", "name email");

    return res.status(201).json({ message: "Transfer request submitted", transfer: populated });
  } catch (err) {
    console.error("requestTransfer:", err);
    return res.status(500).json({ message: "Server error during transfer request" });
  }
};

const approveTransfer = async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id)
      .populate("asset")
      .populate("allocation");

    if (!transfer) return res.status(404).json({ message: "Transfer not found" });
    if (transfer.status !== "Requested")
      return res.status(400).json({ message: "Transfer is not in Requested state" });

    if (transfer.allocation) {
      const oldAlloc = await Allocation.findById(transfer.allocation._id || transfer.allocation);
      if (oldAlloc) {
        oldAlloc.status    = "Transferred";
        oldAlloc.returnedAt = new Date();
        await oldAlloc.save();
      }
    }

    const newAllocation = await Allocation.create({
      asset:       transfer.asset._id,
      allocatedTo: transfer.toUser,
      allocatedBy: req.user._id,
      startDate:   new Date(),
      status:      "Active",
    });

    const asset = await Asset.findById(transfer.asset._id);
    if (asset) {
      asset.currentHolder = transfer.toUser;
      await asset.save();
    }

    transfer.status      = "Completed";
    transfer.approvedBy  = req.user._id;
    transfer.approvalDate = new Date();
    await transfer.save();

    return res.json({ message: "Transfer approved and completed", transfer, newAllocation });
  } catch (err) {
    console.error("approveTransfer:", err);
    return res.status(500).json({ message: "Server error approving transfer" });
  }
};

const rejectTransfer = async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    if (!transfer) return res.status(404).json({ message: "Transfer not found" });
    if (transfer.status !== "Requested")
      return res.status(400).json({ message: "Transfer is not in Requested state" });

    transfer.status          = "Rejected";
    transfer.approvedBy      = req.user._id;
    transfer.rejectionReason = req.body.rejectionReason || "";
    transfer.approvalDate    = new Date();
    await transfer.save();

    return res.json({ message: "Transfer request rejected", transfer });
  } catch (err) {
    console.error("rejectTransfer:", err);
    return res.status(500).json({ message: "Server error rejecting transfer" });
  }
};

const getAllTransfers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const transfers = await Transfer.find(filter)
      .populate("asset",       "assetTag name")
      .populate("fromUser",    "name email")
      .populate("toUser",      "name email")
      .populate("requestedBy", "name email")
      .populate("approvedBy",  "name email")
      .sort({ createdAt: -1 });

    return res.json(transfers);
  } catch (err) {
    console.error("getAllTransfers:", err);
    return res.status(500).json({ message: "Server error fetching transfers" });
  }
};

module.exports = {
  allocateAsset, returnAsset, getAllocations,
  requestTransfer, approveTransfer, rejectTransfer, getAllTransfers,
};
