const express = require("express");
const router  = express.Router();
const { getBookableAssets, getAssetBookings, getMyBookings, getAllBookings, createBooking, cancelBooking } = require("../controllers/bookingController");
const { protect, managerOrAdmin } = require("../middleware/authMiddleware");

router.get("/bookable",          protect, getBookableAssets);
router.get("/mine",              protect, getMyBookings);
router.get("/",                  protect, managerOrAdmin, getAllBookings);
router.get("/asset/:assetId",    protect, getAssetBookings);
router.post("/",                 protect, createBooking);
router.patch("/:id/cancel",      protect, cancelBooking);

module.exports = router;
