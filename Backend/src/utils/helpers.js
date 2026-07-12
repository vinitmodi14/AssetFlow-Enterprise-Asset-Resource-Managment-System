const ActivityLog  = require("../models/ActivityLog");
const Notification = require("../models/Notification");

/**
 * Log an activity to the database.
 * @param {string} userId - User ID of the actor
 * @param {string} action - The action performed
 * @param {string} details - Additional context/details
 * @param {object} [req] - Optional Express request object for IP address
 */
const logActivity = async (userId, action, details = "", req = null) => {
  try {
    let ipAddress = "";
    if (req) {
      ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    }
    await ActivityLog.create({
      user: userId,
      action,
      details,
      ipAddress,
    });
  } catch (err) {
    console.error("logActivity error:", err.message);
  }
};

/**
 * Create a user notification in the database.
 * @param {string} userId - Target recipient User ID
 * @param {string} type - Enum value: Allocation | Maintenance | Booking | Transfer | Audit
 * @param {string} title - Notification title
 * @param {string} message - Message text
 */
const createNotification = async (userId, type, title, message) => {
  try {
    await Notification.create({
      user: userId,
      type,
      title,
      message,
      isRead: false,
    });
  } catch (err) {
    console.error("createNotification error:", err.message);
  }
};

module.exports = { logActivity, createNotification };
