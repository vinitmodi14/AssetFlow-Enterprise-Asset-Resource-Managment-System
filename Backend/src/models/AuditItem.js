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
<<<<<<< HEAD
    checkedBy: {
=======
    auditedBy: {
>>>>>>> ad464a556cdd42c48bcd0aa2edfe0f24278bdd35
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
<<<<<<< HEAD
    checkedAt: {
=======
    auditedAt: {
>>>>>>> ad464a556cdd42c48bcd0aa2edfe0f24278bdd35
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

<<<<<<< HEAD
// Indexes
auditItemSchema.index({ auditCycle: 1, asset: 1 }, { unique: true });
auditItemSchema.index({ auditCycle: 1, status: 1 });
=======
auditItemSchema.index({ auditCycle: 1 });
auditItemSchema.index({ asset: 1 });
auditItemSchema.index({ status: 1 });
>>>>>>> ad464a556cdd42c48bcd0aa2edfe0f24278bdd35

module.exports = mongoose.model("AuditItem", auditItemSchema);
