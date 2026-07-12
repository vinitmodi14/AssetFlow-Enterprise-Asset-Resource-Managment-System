const mongoose = require("mongoose");

const maintenanceSchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["Routine", "Repair", "Upgrade"],
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Technician Assigned", "In Progress", "Resolved"],
      default: "Pending",
    },
    
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },
   
    assignedTechnicianName: {
      type: String,
      trim: true,
      default: "",
    },
    assignedTechnicianUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    scheduledDate: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolutionNotes: {
      type: String,
      trim: true,
      default: "",
    },
   
    photoUrl: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

maintenanceSchema.index({ asset: 1 });
maintenanceSchema.index({ status: 1 });
maintenanceSchema.index({ requestedBy: 1 });

module.exports = mongoose.model("Maintenance", maintenanceSchema);
