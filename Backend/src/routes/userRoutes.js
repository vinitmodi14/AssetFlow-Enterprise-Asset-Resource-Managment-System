const express = require("express");
const router = express.Router();
const { getAllUsers, updateUserRole } = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Both routes are protected and require Admin role
router.get("/", protect, adminOnly, getAllUsers);
router.patch("/:id/role", protect, adminOnly, updateUserRole);

module.exports = router;
