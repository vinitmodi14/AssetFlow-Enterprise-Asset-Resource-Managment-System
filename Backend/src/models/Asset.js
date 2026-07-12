const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    serialNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    // Upgraded from plain String to ObjectId reference
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssetCategory",
      default: null,
    },
    status: {
      type: String,
      enum: ["Available", "Allocated", "Maintenance"],
      default: "Available",
    },
    currentHolder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Upgraded from plain String to ObjectId reference
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    expectedReturnDate: {
      type: Date,
      default: null,
    },
    condition: {
      type: String,
      default: "Good",
    },
    // Stores values for category-specific custom fields
    customFieldValues: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Asset", assetSchema);
