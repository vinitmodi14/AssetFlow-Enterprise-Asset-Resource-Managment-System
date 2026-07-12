const express = require("express");
const router = express.Router();
const {
  getDepartments,
  createDepartment,
  updateDepartment,
  deactivateDepartment,
  getCategories,
  createCategory,
  updateCategory,
  deactivateCategory,
} = require("../controllers/organizationController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/departments", protect, getDepartments);
router.get("/categories", protect, getCategories);

router.post("/departments", protect, adminOnly, createDepartment);
router.patch("/departments/:id", protect, adminOnly, updateDepartment);
router.delete("/departments/:id", protect, adminOnly, deactivateDepartment);

router.post("/categories", protect, adminOnly, createCategory);
router.patch("/categories/:id", protect, adminOnly, updateCategory);
router.delete("/categories/:id", protect, adminOnly, deactivateCategory);

module.exports = router;
