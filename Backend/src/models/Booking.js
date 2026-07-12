const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true,
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Full datetime (date + time combined) for overlap validation
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    purpose: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Upcoming", "Ongoing", "Completed", "Cancelled"],
      default: "Upcoming",
    },
    cancelReason: {
      type: String,
      trim: true,
      default: "",
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound index for fast overlap queries
bookingSchema.index({ asset: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ bookedBy: 1, status: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
