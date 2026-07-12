const mongoose = require("mongoose");

const customFieldSchema = new mongoose.Schema(
  {
    fieldName: { type: String, required: true, trim: true },
    fieldType: {
      type: String,
      enum: ["text", "number", "date", "boolean"],
      required: true,
    },
    required: { type: Boolean, default: false },
  },
  { _id: false }
);

const assetCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    customFields: {
      type: [customFieldSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AssetCategory", assetCategorySchema);
