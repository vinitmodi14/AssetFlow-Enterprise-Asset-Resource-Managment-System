const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  updateUserRole,
  updateUserStatus,
  updateUserDepartment,
} = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/", protect, getAllUsers);
router.patch("/:id/role", protect, adminOnly, updateUserRole);
router.patch("/:id/status", protect, adminOnly, updateUserStatus);
router.patch("/:id/department", protect, adminOnly, updateUserDepartment);

module.exports = router;
