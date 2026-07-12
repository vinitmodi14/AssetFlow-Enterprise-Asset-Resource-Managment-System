const Asset = require("../models/Asset");
const Booking = require("../models/Booking");
const Maintenance = require("../models/Maintenance");
const Transfer = require("../models/Transfer");
const { assetSchema, bookingSchema, maintenanceSchema } = require("../utils/validation");

const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();

    const availableAssetsCount = await Asset.countDocuments({ status: "Available" });

    const allocatedAssetsCount = await Asset.countDocuments({ status: "Allocated" });

    const maintenanceCount = await Maintenance.countDocuments({
      status: { $in: ["Pending", "In Progress"] },
    });

    const activeBookingsCount = await Booking.countDocuments({ status: "Active" });

    const pendingTransfersCount = await Transfer.countDocuments({ status: "Pending" });

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);
    const upcomingReturnsCount = await Asset.countDocuments({
      status: "Allocated",
      expectedReturnDate: { $gt: now, $lte: sevenDaysFromNow },
    });

    const overdueReturns = await Asset.find({
      status: "Allocated",
      expectedReturnDate: { $lt: now },
    }).populate("currentHolder", "name email department");

    const upcomingReturns = await Asset.find({
      status: "Allocated",
      expectedReturnDate: { $gt: now, $lte: sevenDaysFromNow },
    }).populate("currentHolder", "name email department");

    const allAssets = await Asset.find({});

    return res.json({
      stats: {
        availableAssets: availableAssetsCount,
        allocatedAssets: allocatedAssetsCount,
        maintenanceCount,
        activeBookings: activeBookingsCount,
        pendingTransfers: pendingTransfersCount,
        upcomingReturns: upcomingReturnsCount,
      },
      overdueReturns,
      upcomingReturns,
      allAssets,
    });
  } catch (error) {
    console.error("Get Dashboard Stats Error:", error);
    return res.status(500).json({ message: "Server error generating dashboard analytics" });
  }
};

const registerAsset = async (req, res) => {
  try {
    const validationResult = assetSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => err.message);
      return res.status(400).json({ message: errors.join(". ") });
    }

    const { name, serialNumber, category, status, department, condition } = validationResult.data;

    const exists = await Asset.findOne({ serialNumber });
    if (exists) {
      return res.status(400).json({ message: "Asset with this serial number already registered" });
    }

    const asset = await Asset.create({
      name,
      serialNumber,
      category,
      status,
      department,
      condition,
    });

    return res.status(201).json({
      message: "Asset registered successfully",
      asset,
    });
  } catch (error) {
    console.error("Register Asset Error:", error);
    return res.status(500).json({ message: "Server error during asset registration" });
  }
};

const bookResource = async (req, res) => {
  try {
    const validationResult = bookingSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => err.message);
      return res.status(400).json({ message: errors.join(". ") });
    }

    const { assetId, startDate, endDate, purpose } = validationResult.data;

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    if (asset.status !== "Available") {
      return res.status(400).json({ message: `Asset is currently ${asset.status.toLowerCase()}` });
    }

    const booking = await Booking.create({
      asset: assetId,
      user: req.user._id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      purpose,
      status: "Active",
    });

    asset.status = "Allocated";
    asset.currentHolder = req.user._id;
    asset.expectedReturnDate = new Date(endDate);
    await asset.save();

    return res.status(201).json({
      message: "Resource booked successfully",
      booking,
      asset,
    });
  } catch (error) {
    console.error("Book Resource Error:", error);
    return res.status(500).json({ message: "Server error during booking" });
  }
};

const raiseMaintenance = async (req, res) => {
  try {
    const validationResult = maintenanceSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => err.message);
      return res.status(400).json({ message: errors.join(". ") });
    }

    const { assetId, type, description, priority } = validationResult.data;

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    const maintenance = await Maintenance.create({
      asset: assetId,
      requestedBy: req.user._id,
      type,
      description,
      priority,
      status: "Pending",
    });

    asset.status = "Maintenance";
    asset.expectedReturnDate = null; 
    await asset.save();

    return res.status(201).json({
      message: "Maintenance request raised successfully",
      maintenance,
      asset,
    });
  } catch (error) {
    console.error("Raise Maintenance Error:", error);
    return res.status(500).json({ message: "Server error processing maintenance ticket" });
  }
};

module.exports = {
  getDashboardStats,
  registerAsset,
  bookResource,
  raiseMaintenance,
};
