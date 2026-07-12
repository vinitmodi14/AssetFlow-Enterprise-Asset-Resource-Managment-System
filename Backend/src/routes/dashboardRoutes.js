const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  registerAsset,
  bookResource,
  raiseMaintenance,
} = require("../controllers/dashboardController");
const { protect, managerOrAdmin } = require("../middleware/authMiddleware");

router.get("/stats", protect, getDashboardStats);
router.post("/book-resource", protect, bookResource);
router.post("/raise-maintenance", protect, raiseMaintenance);

router.post("/register-asset", protect, managerOrAdmin, registerAsset);

module.exports = router;
