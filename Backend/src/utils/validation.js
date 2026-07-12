const { z } = require("zod");
const validator = require("validator");

const signupSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long" })
    .max(50, { message: "Name cannot exceed 50 characters" })
    .trim(),
  email: z
    .string()
    .trim()
    .refine((val) => validator.isEmail(val), {
      message: "Please enter a valid email address",
    }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
  department: z.string().optional().nullable(),
});

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .refine((val) => validator.isEmail(val), {
      message: "Please enter a valid email address",
    }),
  password: z
    .string()
    .min(1, { message: "Password is required" }),
});

const assetSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Asset name is required" })
    .trim(),
  serialNumber: z
    .string()
    .min(1, { message: "Serial number is required" })
    .trim(),
  category: z.string().optional().nullable(),
  status: z
    .enum(["Available", "Allocated", "Maintenance"])
    .default("Available"),
  department: z.string().optional().nullable(),
  condition: z.string().optional().default("Good"),
});

const bookingSchema = z.object({
  assetId: z.string().min(1, { message: "Asset ID is required" }),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid start date",
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid end date",
  }),
  purpose: z
    .string()
    .min(1, { message: "Purpose of booking is required" })
    .trim(),
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
  message: "End date must be on or after start date",
  path: ["endDate"],
});

const maintenanceSchema = z.object({
  assetId: z.string().min(1, { message: "Asset ID is required" }),
  type: z.enum(["Routine", "Repair", "Upgrade"]),
  description: z
    .string()
    .min(1, { message: "Description is required" })
    .trim(),
  priority: z.enum(["Low", "Medium", "High"]).default("Medium"),
});

const departmentSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Department name must be at least 2 characters" })
    .trim(),
  description: z.string().optional().default(""),
  head: z.string().optional().nullable(),        // ObjectId string
  parentDept: z.string().optional().nullable(),  // ObjectId string
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

const assetCategorySchema = z.object({
  name: z
    .string()
    .min(2, { message: "Category name must be at least 2 characters" })
    .trim(),
  description: z.string().optional().default(""),
  customFields: z
    .array(
      z.object({
        fieldName: z.string().min(1, { message: "Field name is required" }).trim(),
        fieldType: z.enum(["text", "number", "date", "boolean"]),
        required: z.boolean().default(false),
      })
    )
    .optional()
    .default([]),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

const registerAssetSchema = z.object({
  name: z.string().min(1, { message: "Asset name is required" }).trim(),
  serialNumber: z.string().min(1, { message: "Serial number is required" }).trim(),
  category: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  status: z
    .enum(["Available", "Allocated", "Reserved", "Under Maintenance", "Lost", "Retired", "Disposed"])
    .default("Available"),
  condition: z.enum(["Excellent", "Good", "Fair", "Damaged"]).default("Good"),
  location: z.string().optional().default(""),
  acquisitionDate: z.string().optional().nullable(),
  acquisitionCost: z.number().optional().nullable(),
  isBookable: z.boolean().default(false),
});

const allocationSchema = z.object({
  assetId: z.string().min(1, { message: "Asset ID is required" }),
  allocatedToUserId: z.string().min(1, { message: "Target user is required" }),
  departmentId: z.string().optional().nullable(),
  expectedReturnDate: z.string().optional().nullable(),
  notes: z.string().optional().default(""),
});

const transferRequestSchema = z.object({
  assetId: z.string().min(1, { message: "Asset ID is required" }),
  toUserId: z.string().min(1, { message: "Target user is required" }),
  comments: z.string().optional().default(""),
});

const createBookingSchema = z.object({
  assetId: z.string().min(1, { message: "Asset ID is required" }),
  startTime: z.string().refine((v) => !isNaN(Date.parse(v)), { message: "Invalid start datetime" }),
  endTime: z.string().refine((v) => !isNaN(Date.parse(v)), { message: "Invalid end datetime" }),
  purpose: z.string().min(1, { message: "Purpose is required" }).trim(),
}).refine((d) => new Date(d.endTime) > new Date(d.startTime), {
  message: "End time must be after start time",
  path: ["endTime"],
});

const maintenanceRequestSchema = z.object({
  assetId: z.string().min(1, { message: "Asset ID is required" }),
  type: z.enum(["Routine", "Repair", "Upgrade"]),
  description: z.string().min(1, { message: "Description is required" }).trim(),
  priority: z.enum(["Low", "Medium", "High"]).default("Medium"),
  photoUrl: z.string().optional().default(""),
});

module.exports = {
  signupSchema,
  loginSchema,
  assetSchema,
  bookingSchema,
  maintenanceSchema,
  departmentSchema,
  assetCategorySchema,
  registerAssetSchema,
  allocationSchema,
  transferRequestSchema,
  createBookingSchema,
  maintenanceRequestSchema,
};
