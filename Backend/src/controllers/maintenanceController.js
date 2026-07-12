const Maintenance = require("../models/Maintenance");
const Asset       = require("../models/Asset");
const { maintenanceRequestSchema } = require("../utils/validation");

const createRequest = async (req, res) => {
  try {
    const result = maintenanceRequestSchema.safeParse(req.body);
    if (!result.success)
      return res.status(400).json({ message: result.error.errors.map((e) => e.message).join(". ") });

    const { assetId, type, description, priority, photoUrl } = result.data;

    const asset = await Asset.findById(assetId);
    if (!asset) return res.status(404).json({ message: "Asset not found" });

    const maintenance = await Maintenance.create({
      asset: assetId, requestedBy: req.user._id,
      type, description, priority, photoUrl,
      status: "Pending",
    });

    const populated = await Maintenance.findById(maintenance._id)
      .populate("asset",       "assetTag name")
      .populate("requestedBy", "name email");

    return res.status(201).json({ message: "Maintenance request raised", maintenance: populated });
  } catch (err) {
    console.error("createRequest:", err);
    return res.status(500).json({ message: "Server error raising maintenance request" });
  }
};

const approveRequest = async (req, res) => {
  try {
    const maint = await Maintenance.findById(req.params.id).populate("asset");
    if (!maint) return res.status(404).json({ message: "Maintenance request not found" });
    if (maint.status !== "Pending")
      return res.status(400).json({ message: "Only Pending requests can be approved" });

    maint.status     = "Approved";
    maint.approvedBy = req.user._id;
    await maint.save();

    await Asset.findByIdAndUpdate(maint.asset._id || maint.asset, { status: "Under Maintenance" });

    const populated = await Maintenance.findById(maint._id)
      .populate("asset",       "assetTag name status")
      .populate("requestedBy", "name email")
      .populate("approvedBy",  "name email");

    return res.json({ message: "Maintenance request approved. Asset is now Under Maintenance.", maintenance: populated });
  } catch (err) {
    console.error("approveRequest:", err);
    return res.status(500).json({ message: "Server error approving request" });
  }
};

const rejectRequest = async (req, res) => {
  try {
    const maint = await Maintenance.findById(req.params.id);
    if (!maint) return res.status(404).json({ message: "Maintenance request not found" });
    if (maint.status !== "Pending")
      return res.status(400).json({ message: "Only Pending requests can be rejected" });

    maint.status          = "Rejected";
    maint.approvedBy      = req.user._id;
    maint.rejectionReason = req.body.rejectionReason || "";
    await maint.save();

    return res.json({ message: "Maintenance request rejected", maintenance: maint });
  } catch (err) {
    console.error("rejectRequest:", err);
    return res.status(500).json({ message: "Server error rejecting request" });
  }
};

const assignTechnician = async (req, res) => {
  try {
    const maint = await Maintenance.findById(req.params.id);
    if (!maint) return res.status(404).json({ message: "Maintenance request not found" });
    if (maint.status !== "Approved")
      return res.status(400).json({ message: "Request must be Approved before assigning technician" });

    const { technicianName, technicianUserId, scheduledDate } = req.body;
    maint.status                  = "Technician Assigned";
    maint.assignedTechnicianName  = technicianName || "";
    maint.assignedTechnicianUser  = technicianUserId || null;
    maint.scheduledDate           = scheduledDate ? new Date(scheduledDate) : null;
    await maint.save();

    return res.json({ message: "Technician assigned", maintenance: maint });
  } catch (err) {
    console.error("assignTechnician:", err);
    return res.status(500).json({ message: "Server error assigning technician" });
  }
};

const startWork = async (req, res) => {
  try {
    const maint = await Maintenance.findById(req.params.id);
    if (!maint) return res.status(404).json({ message: "Maintenance request not found" });
    if (maint.status !== "Technician Assigned")
      return res.status(400).json({ message: "Technician must be assigned before work can start" });

    maint.status = "In Progress";
    await maint.save();
    return res.json({ message: "Work marked as In Progress", maintenance: maint });
  } catch (err) {
    console.error("startWork:", err);
    return res.status(500).json({ message: "Server error starting work" });
  }
};

const resolveRequest = async (req, res) => {
  try {
    const maint = await Maintenance.findById(req.params.id).populate("asset");
    if (!maint) return res.status(404).json({ message: "Maintenance request not found" });
    if (maint.status !== "In Progress")
      return res.status(400).json({ message: "Only In Progress requests can be resolved" });

    maint.status          = "Resolved";
    maint.resolvedAt      = new Date();
    maint.resolutionNotes = req.body.resolutionNotes || "";
    await maint.save();

    await Asset.findByIdAndUpdate(maint.asset._id || maint.asset, {
      status:    "Available",
      condition: req.body.postRepairCondition || undefined,
    });

    const populated = await Maintenance.findById(maint._id)
      .populate("asset",       "assetTag name status condition")
      .populate("requestedBy", "name email")
      .populate("approvedBy",  "name email");

    return res.json({ message: "Maintenance resolved. Asset is now Available.", maintenance: populated });
  } catch (err) {
    console.error("resolveRequest:", err);
    return res.status(500).json({ message: "Server error resolving request" });
  }
};

const getAllRequests = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status)   filter.status   = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.asset)    filter.asset    = req.query.asset;

    const requests = await Maintenance.find(filter)
      .populate("asset",                "assetTag name serialNumber")
      .populate("requestedBy",          "name email")
      .populate("approvedBy",           "name email")
      .populate("assignedTechnicianUser","name email")
      .sort({ createdAt: -1 });

    return res.json(requests);
  } catch (err) {
    console.error("getAllRequests:", err);
    return res.status(500).json({ message: "Server error fetching maintenance requests" });
  }
};

const getMyRequests = async (req, res) => {
  try {
    const requests = await Maintenance.find({ requestedBy: req.user._id })
      .populate("asset",       "assetTag name")
      .populate("approvedBy",  "name email")
      .sort({ createdAt: -1 });
    return res.json(requests);
  } catch (err) {
    console.error("getMyRequests:", err);
    return res.status(500).json({ message: "Server error fetching your maintenance requests" });
  }
};

module.exports = {
  createRequest, approveRequest, rejectRequest,
  assignTechnician, startWork, resolveRequest,
  getAllRequests, getMyRequests,
};
