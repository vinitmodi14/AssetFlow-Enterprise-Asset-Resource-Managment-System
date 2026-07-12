const Asset       = require("../models/Asset");
const Allocation  = require("../models/Allocation");
const Booking     = require("../models/Booking");
const Maintenance = require("../models/Maintenance");
const Department  = require("../models/Department");

// @desc    Get structured reports and analytics data
// @route   GET /api/reports/analytics
// @access  Private (Admin, Manager, Department Head)
const getReportsData = async (req, res) => {
  try {
    // 1. Department-wise Allocation Summary
    const deptStats = await Asset.aggregate([
      { $match: { status: "Allocated", department: { $ne: null } } },
      { $group: { _id: "$department", count: { $sum: 1 } } }
    ]);
    const populatedDeptStats = await Department.populate(deptStats, { path: "_id", select: "name" });
    const departmentSummary = populatedDeptStats.map(ds => ({
      departmentName: ds._id ? ds._id.name : "Unassigned",
      count: ds.count
    }));

    // 2. Asset utilization trends (Most used vs. Idle assets)
    const allAssets = await Asset.find({ status: { $nin: ["Retired", "Disposed"] } }).select("name assetTag status");
    
    // Count bookings per asset
    const bookingCounts = await Booking.aggregate([
      { $group: { _id: "$asset", count: { $sum: 1 } } }
    ]);
    const bookingCountMap = bookingCounts.reduce((acc, curr) => {
      acc[curr._id.toString()] = curr.count;
      return acc;
    }, {});

    // Count allocations per asset
    const allocationCounts = await Allocation.aggregate([
      { $group: { _id: "$asset", count: { $sum: 1 } } }
    ]);
    const allocationCountMap = allocationCounts.reduce((acc, curr) => {
      acc[curr._id.toString()] = curr.count;
      return acc;
    }, {});

    const enrichedUtilization = allAssets.map(asset => {
      const bCount = bookingCountMap[asset._id.toString()] || 0;
      const aCount = allocationCountMap[asset._id.toString()] || 0;
      const totalUses = bCount + aCount;
      return {
        _id: asset._id,
        name: asset.name,
        assetTag: asset.assetTag,
        status: asset.status,
        totalUses
      };
    });

    const mostUsed = [...enrichedUtilization].sort((a, b) => b.totalUses - a.totalUses).slice(0, 5);
    const idleAssets = enrichedUtilization.filter(u => u.totalUses === 0).slice(0, 5);

    // 3. Maintenance frequency by asset and category
    const maintenanceCounts = await Maintenance.aggregate([
      { $group: { _id: "$asset", count: { $sum: 1 } } }
    ]);
    const maintenanceCountMap = maintenanceCounts.reduce((acc, curr) => {
      acc[curr._id.toString()] = curr.count;
      return acc;
    }, {});

    const populatedMaintAssets = await Asset.find({ _id: { $in: Object.keys(maintenanceCountMap) } })
      .populate("category", "name")
      .select("name category assetTag");

    const maintenanceFrequency = populatedMaintAssets.map(asset => ({
      name: asset.name,
      assetTag: asset.assetTag,
      category: asset.category ? asset.category.name : "Uncategorized",
      count: maintenanceCountMap[asset._id.toString()] || 0
    })).sort((a, b) => b.count - a.count);

    // Group maintenance frequency by category
    const maintByCat = await Maintenance.aggregate([
      {
        $lookup: {
          from: "assets",
          localField: "asset",
          foreignField: "_id",
          as: "assetInfo"
        }
      },
      { $unwind: "$assetInfo" },
      {
        $group: {
          _id: "$assetInfo.category",
          count: { $sum: 1 }
        }
      }
    ]);
    const populatedCatMaint = await require("../models/AssetCategory").populate(maintByCat, { path: "_id", select: "name" });
    const categoryMaintFreq = populatedCatMaint.map(cm => ({
      categoryName: cm._id ? cm._id.name : "Uncategorized",
      count: cm.count
    }));

    // 4. Assets due for maintenance or nearing retirement
    // Nearing retirement: condition is Damaged or Fair, OR age > 2 years (for electronics) or warranty nearing expiration
    const now = new Date();
    const nearingRetirement = await Asset.find({
      status: { $nin: ["Retired", "Disposed"] },
      $or: [
        { condition: { $in: ["Damaged", "Fair"] } },
        { expectedReturnDate: { $lt: now } } // overdue items
      ]
    }).populate("category", "name").limit(10);

    // 5. Resource booking heatmap (Peak usage slots by hour of day)
    const bookings = await Booking.find({ status: { $ne: "Cancelled" } }).select("startTime endTime");
    const hourlyHeatmap = Array.from({ length: 24 }).map((_, hour) => ({
      hour: `${String(hour).padStart(2, "0")}:00`,
      count: 0
    }));

    bookings.forEach(b => {
      const startHour = new Date(b.startTime).getHours();
      const endHour = new Date(b.endTime).getHours();
      for (let h = startHour; h <= endHour && h < 24; h++) {
        hourlyHeatmap[h].count++;
      }
    });

    return res.json({
      departmentSummary,
      utilization: {
        mostUsed,
        idleAssets
      },
      maintenance: {
        frequencyByAsset: maintenanceFrequency.slice(0, 10),
        frequencyByCategory: categoryMaintFreq
      },
      nearingRetirement,
      hourlyHeatmap
    });
  } catch (error) {
    console.error("Get Reports Data Error:", error);
    return res.status(500).json({ message: "Server error generating reports" });
  }
};

module.exports = {
  getReportsData,
};
