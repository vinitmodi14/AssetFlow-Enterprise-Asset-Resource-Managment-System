const express = require("express");
const router  = express.Router();
const {
  createRequest, approveRequest, rejectRequest,
  assignTechnician, startWork, resolveRequest,
  getAllRequests, getMyRequests,
} = require("../controllers/maintenanceController");
const { protect, managerOrAdmin } = require("../middleware/authMiddleware");

router.get("/mine",           protect, getMyRequests);
router.get("/",               protect, managerOrAdmin, getAllRequests);
router.post("/",              protect, createRequest);
router.patch("/:id/approve",  protect, managerOrAdmin, approveRequest);
router.patch("/:id/reject",   protect, managerOrAdmin, rejectRequest);
router.patch("/:id/assign",   protect, managerOrAdmin, assignTechnician);
router.patch("/:id/start",    protect, managerOrAdmin, startWork);
router.patch("/:id/resolve",  protect, managerOrAdmin, resolveRequest);

module.exports = router;
