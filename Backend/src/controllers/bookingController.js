const Booking = require("../models/Booking");
const Asset   = require("../models/Asset");
const { createBookingSchema } = require("../utils/validation");

// ─────────────────────────────────────────
// @desc  Get all bookable assets
// @route GET /api/bookings/bookable
// @access All authenticated
// ─────────────────────────────────────────
const getBookableAssets = async (req, res) => {
  try {
    const assets = await Asset.find({ isBookable: true, status: { $nin: ["Retired", "Disposed", "Lost"] } })
      .populate("category",   "name")
      .populate("department", "name")
      .sort({ name: 1 });
    return res.json(assets);
  } catch (err) {
    console.error("getBookableAssets:", err);
    return res.status(500).json({ message: "Server error fetching bookable assets" });
  }
};

// ─────────────────────────────────────────
// @desc  Get all bookings for a specific asset (calendar data)
// @route GET /api/bookings/asset/:assetId
// @access All authenticated
// ─────────────────────────────────────────
const getAssetBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      asset: req.params.assetId,
      status: { $in: ["Upcoming", "Ongoing"] },
    })
      .populate("bookedBy", "name email")
      .sort({ startTime: 1 });
    return res.json(bookings);
  } catch (err) {
    console.error("getAssetBookings:", err);
    return res.status(500).json({ message: "Server error fetching asset bookings" });
  }
};

// ─────────────────────────────────────────
// @desc  Get current user's bookings
// @route GET /api/bookings/mine
// @access All authenticated
// ─────────────────────────────────────────
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ bookedBy: req.user._id })
      .populate("asset", "assetTag name location")
      .sort({ startTime: -1 });
    return res.json(bookings);
  } catch (err) {
    console.error("getMyBookings:", err);
    return res.status(500).json({ message: "Server error fetching your bookings" });
  }
};

// ─────────────────────────────────────────
// @desc  Get all bookings (admin/manager view)
// @route GET /api/bookings
// @access Admin / Asset Manager
// ─────────────────────────────────────────
const getAllBookings = async (req, res) => {
  try {
    const filter = {};
    if (req.query.asset)  filter.asset  = req.query.asset;
    if (req.query.status) filter.status = req.query.status;

    const bookings = await Booking.find(filter)
      .populate("asset",    "assetTag name location")
      .populate("bookedBy", "name email")
      .sort({ startTime: 1 });
    return res.json(bookings);
  } catch (err) {
    console.error("getAllBookings:", err);
    return res.status(500).json({ message: "Server error fetching bookings" });
  }
};

// ─────────────────────────────────────────
// @desc  Create a booking with overlap validation
// @route POST /api/bookings
// @access All authenticated
// ─────────────────────────────────────────
const createBooking = async (req, res) => {
  try {
    const result = createBookingSchema.safeParse(req.body);
    if (!result.success)
      return res.status(400).json({ message: result.error.errors.map((e) => e.message).join(". ") });

    const { assetId, startTime, endTime, purpose } = result.data;
    const start = new Date(startTime);
    const end   = new Date(endTime);

    // Verify asset is bookable
    const asset = await Asset.findById(assetId);
    if (!asset)         return res.status(404).json({ message: "Asset not found" });
    if (!asset.isBookable) return res.status(400).json({ message: "This asset is not available for booking" });

    // ── Overlap validation ──
    // Reject if existing booking overlaps: existing.start < end AND existing.end > start
    // Equal boundary (start === other.end) is allowed per spec
    const overlap = await Booking.findOne({
      asset:  assetId,
      status: { $in: ["Upcoming", "Ongoing"] },
      startTime: { $lt: end },
      endTime:   { $gt: start },
    });

    if (overlap) {
      return res.status(409).json({
        message: `Slot conflicts with an existing booking (${new Date(overlap.startTime).toLocaleTimeString()} – ${new Date(overlap.endTime).toLocaleTimeString()})`,
        conflictingBooking: {
          startTime: overlap.startTime,
          endTime:   overlap.endTime,
          bookedBy:  overlap.bookedBy,
        },
      });
    }

    const booking = await Booking.create({
      asset:     assetId,
      bookedBy:  req.user._id,
      startTime: start,
      endTime:   end,
      purpose,
      status:    "Upcoming",
    });

    const populated = await Booking.findById(booking._id)
      .populate("asset",    "assetTag name location")
      .populate("bookedBy", "name email");

    return res.status(201).json({ message: "Booking confirmed", booking: populated });
  } catch (err) {
    console.error("createBooking:", err);
    return res.status(500).json({ message: "Server error creating booking" });
  }
};

// ─────────────────────────────────────────
// @desc  Cancel a booking
// @route PATCH /api/bookings/:id/cancel
// @access All authenticated (own bookings) / Admin
// ─────────────────────────────────────────
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Only the booker or admin can cancel
    const isOwner = booking.bookedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "Admin" || req.user.role === "Asset Manager";
    if (!isOwner && !isAdmin)
      return res.status(403).json({ message: "Not authorised to cancel this booking" });

    if (booking.status === "Completed" || booking.status === "Cancelled")
      return res.status(400).json({ message: `Booking is already ${booking.status}` });

    booking.status       = "Cancelled";
    booking.cancelReason = req.body.cancelReason || "";
    await booking.save();

    return res.json({ message: "Booking cancelled", booking });
  } catch (err) {
    console.error("cancelBooking:", err);
    return res.status(500).json({ message: "Server error cancelling booking" });
  }
};

module.exports = { getBookableAssets, getAssetBookings, getMyBookings, getAllBookings, createBooking, cancelBooking };
