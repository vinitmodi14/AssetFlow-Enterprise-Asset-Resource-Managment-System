const mongoose = require("mongoose");

const auditItemSchema = new mongoose.Schema(
  {
    auditCycle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AuditCycle",
      required: true,
    },
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Verified", "Missing", "Damaged"],
      default: "Pending",
    },
    checkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    checkedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

// Indexes
auditItemSchema.index({ auditCycle: 1, asset: 1 }, { unique: true });
auditItemSchema.index({ auditCycle: 1, status: 1 });

module.exports = mongoose.model("AuditItem", auditItemSchema);
