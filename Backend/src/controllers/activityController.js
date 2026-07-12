const ActivityLog  = require("../models/ActivityLog");
const Notification = require("../models/Notification");

// @desc    Get all administrative action logs
// @route   GET /api/logs
// @access  Private (Admin, Manager, Department Head)
const getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find({})
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json(logs);
  } catch (error) {
    console.error("Get Activity Logs Error:", error);
    return res.status(500).json({ message: "Server error fetching activity logs" });
  }
};

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json(notifications);
  } catch (error) {
    console.error("Get Notifications Error:", error);
    return res.status(500).json({ message: "Server error fetching notifications" });
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read
// @access  Private
const readNotifications = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    return res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Read Notifications Error:", error);
    return res.status(500).json({ message: "Server error updating notifications" });
  }
};

module.exports = {
  getActivityLogs,
  getNotifications,
  readNotifications,
};
