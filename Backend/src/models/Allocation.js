const mongoose = require("mongoose");

// Dedicated allocation record — forms the per-asset allocation history
const allocationSchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true,
    },
    allocatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    allocatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expectedReturnDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["Active", "Returned", "Overdue", "Transferred"],
      default: "Active",
    },
    returnedAt: {
      type: Date,
      default: null,
    },
    returnConditionNotes: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

allocationSchema.index({ asset: 1, status: 1 });
allocationSchema.index({ allocatedTo: 1 });

module.exports = mongoose.model("Allocation", allocationSchema);
