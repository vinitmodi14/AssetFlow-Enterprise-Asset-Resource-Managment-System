const Asset    = require("../models/Asset");
const Counter  = require("../models/Counter");
const Allocation   = require("../models/Allocation");
const Maintenance  = require("../models/Maintenance");
const { registerAssetSchema } = require("../utils/validation");

// ── Auto-generate asset tag (AF-0001, AF-0002 …) ──
const generateAssetTag = async () => {
  const counter = await Counter.findOneAndUpdate(
    { name: "assetTag" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `AF-${String(counter.seq).padStart(4, "0")}`;
};

// ─────────────────────────────────────────
// @desc  Register a new asset
// @route POST /api/assets
// @access Admin / Asset Manager
// ─────────────────────────────────────────
const registerAsset = async (req, res) => {
  try {
    const result = registerAssetSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.errors.map((e) => e.message).join(". ") });
    }

    const { name, serialNumber, category, department, status, condition,
            location, acquisitionDate, acquisitionCost, isBookable } = result.data;

    const exists = await Asset.findOne({ serialNumber });
    if (exists) return res.status(400).json({ message: "Asset with this serial number already registered" });

    const assetTag = await generateAssetTag();

    const asset = await Asset.create({
      assetTag, name, serialNumber,
      category:        category    || null,
      department:      department  || null,
      status, condition, location,
      acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : null,
      acquisitionCost: acquisitionCost ?? null,
      isBookable,
      photos:          req.body.photos || [],
      documents:       req.body.documents || [],
      customFieldValues: req.body.customFieldValues || {},
    });

    const populated = await Asset.findById(asset._id)
      .populate("category", "name")
      .populate("department", "name")
      .populate("currentHolder", "name email");

    return res.status(201).json({ message: "Asset registered successfully", asset: populated });
  } catch (err) {
    console.error("registerAsset:", err);
    return res.status(500).json({ message: "Server error during asset registration" });
  }
};

// ─────────────────────────────────────────
// @desc  List / search assets
// @route GET /api/assets?tag=&serial=&category=&status=&department=&location=&bookable=
// @access All authenticated
// ─────────────────────────────────────────
const getAllAssets = async (req, res) => {
  try {
    const { tag, serial, category, status, department, location, bookable, q } = req.query;
    const filter = {};

    if (q)          filter.$or = [
      { assetTag: { $regex: q, $options: "i" } },
      { name:      { $regex: q, $options: "i" } },
      { serialNumber: { $regex: q, $options: "i" } },
      { location:  { $regex: q, $options: "i" } },
    ];
    if (tag)        filter.assetTag     = { $regex: tag, $options: "i" };
    if (serial)     filter.serialNumber = { $regex: serial, $options: "i" };
    if (category)   filter.category     = category;
    if (status)     filter.status       = status;
    if (department) filter.department   = department;
    if (location)   filter.location     = { $regex: location, $options: "i" };
    if (bookable === "true") filter.isBookable = true;

    const assets = await Asset.find(filter)
      .populate("category",      "name customFields")
      .populate("department",    "name")
      .populate("currentHolder", "name email")
      .sort({ assetTag: 1 });

    return res.json(assets);
  } catch (err) {
    console.error("getAllAssets:", err);
    return res.status(500).json({ message: "Server error fetching assets" });
  }
};

// ─────────────────────────────────────────
// @desc  Get single asset with full history
// @route GET /api/assets/:id
// @access All authenticated
// ─────────────────────────────────────────
const getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate("category",      "name customFields")
      .populate("department",    "name")
      .populate("currentHolder", "name email department");

    if (!asset) return res.status(404).json({ message: "Asset not found" });
    return res.json(asset);
  } catch (err) {
    console.error("getAssetById:", err);
    return res.status(500).json({ message: "Server error fetching asset" });
  }
};

// ─────────────────────────────────────────
// @desc  Update asset metadata
// @route PATCH /api/assets/:id
// @access Admin / Asset Manager
// ─────────────────────────────────────────
const updateAsset = async (req, res) => {
  try {
    const allowed = ["name","condition","location","isBookable","status","department","category",
                     "acquisitionDate","acquisitionCost","customFieldValues","photos","documents"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const asset = await Asset.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate("category",      "name customFields")
      .populate("department",    "name")
      .populate("currentHolder", "name email");

    if (!asset) return res.status(404).json({ message: "Asset not found" });
    return res.json({ message: "Asset updated", asset });
  } catch (err) {
    console.error("updateAsset:", err);
    return res.status(500).json({ message: "Server error updating asset" });
  }
};

// ─────────────────────────────────────────
// @desc  Get allocation + maintenance history for an asset
// @route GET /api/assets/:id/history
// @access All authenticated
// ─────────────────────────────────────────
const getAssetHistory = async (req, res) => {
  try {
    const assetId = req.params.id;

    const [allocationHistory, maintenanceHistory] = await Promise.all([
      Allocation.find({ asset: assetId })
        .populate("allocatedTo", "name email")
        .populate("allocatedBy", "name email")
        .populate("department",  "name")
        .sort({ createdAt: -1 }),
      Maintenance.find({ asset: assetId })
        .populate("requestedBy", "name email")
        .populate("approvedBy",  "name email")
        .sort({ createdAt: -1 }),
    ]);

    return res.json({ allocationHistory, maintenanceHistory });
  } catch (err) {
    console.error("getAssetHistory:", err);
    return res.status(500).json({ message: "Server error fetching asset history" });
  }
};

module.exports = { registerAsset, getAllAssets, getAssetById, updateAsset, getAssetHistory };
