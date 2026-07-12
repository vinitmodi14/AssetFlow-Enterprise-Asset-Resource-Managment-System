const mongoose = require("mongoose");

const auditCycleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    scopeType: {
      type: String,
      enum: ["department", "location"],
      required: true,
    },
    scopeDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    scopeLocation: {
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

auditCycleSchema.index({ status: 1 });
auditCycleSchema.index({ createdBy: 1 });
auditCycleSchema.index({ auditors: 1 });

module.exports = mongoose.model("AuditCycle", auditCycleSchema);
