const express = require("express");
const router  = express.Router();
const {
  getMaintenanceAnalytics,
  getDepartmentAnalytics,
  getBookingHeatmap
} = require("../controllers/analyticsController");
const { protect, managerOrAdmin } = require("../middleware/authMiddleware");

// All analytics are restricted to Manager or Admin
router.get("/maintenance", protect, managerOrAdmin, getMaintenanceAnalytics);
router.get("/department",  protect, managerOrAdmin, getDepartmentAnalytics);
router.get("/bookings",    protect, managerOrAdmin, getBookingHeatmap);

module.exports = router;
