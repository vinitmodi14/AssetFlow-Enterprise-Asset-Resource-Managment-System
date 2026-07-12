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

// All org routes require Admin role
router.use(protect, adminOnly);

// Department routes
router.get("/departments", getDepartments);
router.post("/departments", createDepartment);
router.patch("/departments/:id", updateDepartment);
router.delete("/departments/:id", deactivateDepartment);

// Asset Category routes
router.get("/categories", getCategories);
router.post("/categories", createCategory);
router.patch("/categories/:id", updateCategory);
router.delete("/categories/:id", deactivateCategory);

module.exports = router;
