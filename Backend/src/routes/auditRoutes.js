const express = require("express");
const router  = express.Router();
const {
  createAuditCycle,
  getAllAuditCycles,
  getMyAuditCycles,
  getAuditCycleById,
  markAuditItem,
  completeCycle,
  closeCycle,
  getDiscrepancyReport,
} = require("../controllers/auditController");
const { protect, managerOrAdmin } = require("../middleware/authMiddleware");

// Auditor routes (any logged-in user who is assigned)
router.get("/mine",               protect, getMyAuditCycles);

// Admin/Manager routes
router.get("/",                   protect, managerOrAdmin, getAllAuditCycles);
router.post("/",                  protect, managerOrAdmin, createAuditCycle);

// Detail (auditor can view their assigned cycles)
router.get("/:id",                protect, getAuditCycleById);
router.get("/:id/report",         protect, getDiscrepancyReport);

// Auditor marks individual items
router.patch("/items/:itemId",    protect, markAuditItem);

// Admin/Manager lifecycle
router.patch("/:id/complete",     protect, managerOrAdmin, completeCycle);
router.patch("/:id/close",        protect, managerOrAdmin, closeCycle);

module.exports = router;
