const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    // Auto-generated tag e.g. AF-0001
    assetTag: {
      type: String,
      unique: true,
      trim: true,
    },
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
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssetCategory",
      default: null,
    },
    // 7-stage lifecycle status
    status: {
      type: String,
      enum: ["Available", "Allocated", "Reserved", "Under Maintenance", "Lost", "Retired", "Disposed"],
      default: "Available",
    },
    currentHolder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
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
      enum: ["Excellent", "Good", "Fair", "Damaged"],
      default: "Good",
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    acquisitionDate: {
      type: Date,
      default: null,
    },
    // Stored for ranking/reporting only — not linked to accounting
    acquisitionCost: {
      type: Number,
      default: null,
    },
    // Marks asset as shared/bookable in Resource Booking screen
    isBookable: {
      type: Boolean,
      default: false,
    },
    // Base64 encoded photos (max 5MB each, validated frontend)
    photos: {
      type: [String],
      default: [],
    },
    // Attached documents
    documents: {
      type: [
        {
          name: { type: String, trim: true },
          data: { type: String }, // base64
        },
      ],
      default: [],
    },
    // Category-specific custom field values
    customFieldValues: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Index for fast search
assetSchema.index({ assetTag: 1 });
assetSchema.index({ serialNumber: 1 });
assetSchema.index({ status: 1 });
assetSchema.index({ category: 1 });
assetSchema.index({ department: 1 });

module.exports = mongoose.model("Asset", assetSchema);
