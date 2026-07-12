const Asset = require("../models/Asset");
const Maintenance = require("../models/Maintenance");
const Booking = require("../models/Booking");
const Department = require("../models/Department");

// 1. Maintenance & Retirement Analytics
const getMaintenanceAnalytics = async (req, res) => {
  try {
    // 1a. Maintenance Frequency by Asset (Top 5 Frequently Repaired)
    const freqByAsset = await Maintenance.aggregate([
      { $group: { _id: "$asset", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "assets",
          localField: "_id",
          foreignField: "_id",
          as: "assetInfo"
        }
      },
      { $unwind: "$assetInfo" },
      {
        $project: {
          assetName: "$assetInfo.name",
          assetTag: "$assetInfo.assetTag",
          count: 1
        }
      }
    ]);

    // 1b. Maintenance Frequency by Category
    const freqByCategory = await Maintenance.aggregate([
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
        $lookup: {
          from: "assetcategories",
          localField: "assetInfo.category",
          foreignField: "_id",
          as: "categoryInfo"
        }
      },
      {
        $unwind: {
          path: "$categoryInfo",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: "$categoryInfo.name",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      {
        $project: {
          categoryName: { $ifNull: ["$_id", "Uncategorized"] },
          count: 1,
          _id: 0
        }
      }
    ]);

    // 1c. Assets Due for Maintenance (Condition = Fair/Damaged, Status != Under Maintenance, Retired, Disposed, Lost)
    const dueForMaintenance = await Asset.find({
      condition: { $in: ["Fair", "Damaged"] },
      status: { $nin: ["Under Maintenance", "Retired", "Disposed", "Lost"] }
    }).select("name assetTag condition status");

    // 1d. Assets Nearing Retirement (Older than 4 years, not retired yet)
    const fourYearsAgo = new Date();
    fourYearsAgo.setFullYear(fourYearsAgo.getFullYear() - 4);
    
    const nearingRetirement = await Asset.find({
      acquisitionDate: { $lte: fourYearsAgo },
      status: { $nin: ["Retired", "Disposed"] }
    }).select("name assetTag acquisitionDate condition status");

    return res.json({
      frequentAssets: freqByAsset,
      frequentCategories: freqByCategory,
      dueForMaintenance,
      nearingRetirement
    });
  } catch (err) {
    console.error("getMaintenanceAnalytics:", err);
    return res.status(500).json({ message: "Server error fetching maintenance analytics." });
  }
};

// 2. Department Allocation Summary
const getDepartmentAnalytics = async (req, res) => {
  try {
    const summary = await Asset.aggregate([
      {
        $lookup: {
          from: "departments",
          localField: "department",
          foreignField: "_id",
          as: "deptInfo"
        }
      },
      {
        $unwind: {
          path: "$deptInfo",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: "$deptInfo.name",
          totalAssets: { $sum: 1 },
          availableAssets: {
            $sum: { $cond: [{ $eq: ["$status", "Available"] }, 1, 0] }
          },
          allocatedAssets: {
            $sum: { $cond: [{ $eq: ["$status", "Allocated"] }, 1, 0] }
          },
          idleAssets: {
             // Assuming available but not currently booked - simplified as 'Available' here
             $sum: { $cond: [{ $eq: ["$status", "Available"] }, 1, 0] }
          }
        }
      },
      { $sort: { totalAssets: -1 } },
      {
        $project: {
          departmentName: { $ifNull: ["$_id", "Unassigned"] },
          totalAssets: 1,
          availableAssets: 1,
          allocatedAssets: 1,
          idleAssets: 1,
          _id: 0
        }
      }
    ]);

    return res.json(summary);
  } catch (err) {
    console.error("getDepartmentAnalytics:", err);
    return res.status(500).json({ message: "Server error fetching department analytics." });
  }
};

// 3. Resource Booking Heatmap
const getBookingHeatmap = async (req, res) => {
  try {
    // We want to find peak usage days and time windows
    // Day of week (1=Sunday, 7=Saturday) and Hour of day (0-23)
    const heatmap = await Booking.aggregate([
      {
        $match: {
          status: { $in: ["Upcoming", "Ongoing", "Completed"] }
        }
      },
      {
        $project: {
          dayOfWeek: { $dayOfWeek: "$startTime" },
          hourOfDay: { $hour: "$startTime" }
        }
      },
      {
        $group: {
          _id: { day: "$dayOfWeek", hour: "$hourOfDay" },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          day: "$_id.day",
          hour: "$_id.hour",
          count: 1
        }
      },
      { $sort: { day: 1, hour: 1 } }
    ]);

    // Format output to be easy for charting (e.g. matrix or flat array with day names)
    const daysMap = { 1: "Sun", 2: "Mon", 3: "Tue", 4: "Wed", 5: "Thu", 6: "Fri", 7: "Sat" };
    const formatted = heatmap.map(h => ({
      day: daysMap[h.day],
      dayNum: h.day,
      hour: h.hour,
      count: h.count
    }));

    return res.json(formatted);
  } catch (err) {
    console.error("getBookingHeatmap:", err);
    return res.status(500).json({ message: "Server error fetching booking heatmap." });
  }
};

module.exports = {
  getMaintenanceAnalytics,
  getDepartmentAnalytics,
  getBookingHeatmap
};
