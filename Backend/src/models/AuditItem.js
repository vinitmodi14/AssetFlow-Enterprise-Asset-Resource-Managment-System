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
    auditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    auditedAt: {
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

auditItemSchema.index({ auditCycle: 1 });
auditItemSchema.index({ asset: 1 });
auditItemSchema.index({ status: 1 });

module.exports = mongoose.model("AuditItem", auditItemSchema);
