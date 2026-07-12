const mongoose = require("mongoose");

const auditCycleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
<<<<<<< HEAD
    department: {
=======
    scopeType: {
      type: String,
      enum: ["department", "location"],
      required: true,
    },
    scopeDepartment: {
>>>>>>> ad464a556cdd42c48bcd0aa2edfe0f24278bdd35
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
<<<<<<< HEAD
    location: {
=======
    scopeLocation: {
>>>>>>> ad464a556cdd42c48bcd0aa2edfe0f24278bdd35
      type: String,
      trim: true,
      default: "",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    auditors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
<<<<<<< HEAD
        required: true,
      },
    ],
    status: {
      type: String,
      enum: ["Draft", "Active", "Closed"],
      default: "Draft",
=======
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["Planned", "In Progress", "Completed", "Closed"],
      default: "Planned",
    },
    totalAssets: {
      type: Number,
      default: 0,
    },
    verifiedCount: {
      type: Number,
      default: 0,
    },
    missingCount: {
      type: Number,
      default: 0,
    },
    damagedCount: {
      type: Number,
      default: 0,
    },
    // Discrepancy report generated on close
    discrepancyReport: {
      generatedAt: { type: Date, default: null },
      flaggedItems: [
        {
          asset: { type: mongoose.Schema.Types.ObjectId, ref: "Asset" },
          assetTag: String,
          assetName: String,
          previousStatus: String,
          auditResult: { type: String, enum: ["Missing", "Damaged"] },
          newStatus: String,
          notes: String,
          auditedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        },
      ],
>>>>>>> ad464a556cdd42c48bcd0aa2edfe0f24278bdd35
    },
    closedAt: {
      type: Date,
      default: null,
    },
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

<<<<<<< HEAD
=======
auditCycleSchema.index({ status: 1 });
auditCycleSchema.index({ createdBy: 1 });
auditCycleSchema.index({ auditors: 1 });

>>>>>>> ad464a556cdd42c48bcd0aa2edfe0f24278bdd35
module.exports = mongoose.model("AuditCycle", auditCycleSchema);
