const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
   
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
   
    acquisitionCost: {
      type: Number,
      default: null,
    },
    
    isBookable: {
      type: Boolean,
      default: false,
    },
    
    photos: {
      type: [String],
      default: [],
    },
   
    documents: {
      type: [
        {
          name: { type: String, trim: true },
          data: { type: String }, 
        },
      ],
      default: [],
    },
    
    customFieldValues: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);


assetSchema.index({ assetTag: 1 });
assetSchema.index({ serialNumber: 1 });
assetSchema.index({ status: 1 });
assetSchema.index({ category: 1 });
assetSchema.index({ department: 1 });

module.exports = mongoose.model("Asset", assetSchema);
