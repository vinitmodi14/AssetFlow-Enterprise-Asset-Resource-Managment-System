const express = require("express");
const router  = express.Router();
const { registerAsset, getAllAssets, getAssetById, updateAsset, getAssetHistory } = require("../controllers/assetController");
const { protect, managerOrAdmin } = require("../middleware/authMiddleware");

router.get("/",          protect, getAllAssets);
router.post("/",         protect, managerOrAdmin, registerAsset);
router.get("/:id",       protect, getAssetById);
router.patch("/:id",     protect, managerOrAdmin, updateAsset);
router.get("/:id/history", protect, getAssetHistory);

module.exports = router;
