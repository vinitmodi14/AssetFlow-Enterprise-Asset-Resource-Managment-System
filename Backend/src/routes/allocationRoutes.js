const express = require("express");
const router  = express.Router();
const {
  allocateAsset, returnAsset, getAllocations,
  requestTransfer, approveTransfer, rejectTransfer, getAllTransfers,
} = require("../controllers/allocationController");
const { protect, managerOrAdmin } = require("../middleware/authMiddleware");

router.get("/",                protect, managerOrAdmin, getAllocations);
router.post("/",               protect, managerOrAdmin, allocateAsset);
router.patch("/:id/return",    protect, managerOrAdmin, returnAsset);

router.post("/transfer-request",           protect, requestTransfer);
router.get("/transfers",                   protect, managerOrAdmin, getAllTransfers);
router.patch("/transfers/:id/approve",     protect, managerOrAdmin, approveTransfer);
router.patch("/transfers/:id/reject",      protect, managerOrAdmin, rejectTransfer);

module.exports = router;
