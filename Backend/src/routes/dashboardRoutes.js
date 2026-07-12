const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  registerAsset,
  bookResource,
  raiseMaintenance,
} = require("../controllers/dashboardController");
const { protect, managerOrAdmin } = require("../middleware/authMiddleware");

// All routes require token authentication
router.get("/stats", protect, getDashboardStats);
router.post("/book-resource", protect, bookResource);
router.post("/raise-maintenance", protect, raiseMaintenance);

// Only Asset Manager or Admin can register a new asset
router.post("/register-asset", protect, managerOrAdmin, registerAsset);

module.exports = router;
