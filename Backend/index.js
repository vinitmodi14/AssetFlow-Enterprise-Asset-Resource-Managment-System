const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
// Increase body size limit for base64 photo uploads
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.use("/api/auth",        require("./src/routes/authRoutes"));
app.use("/api/users",       require("./src/routes/userRoutes"));
app.use("/api/dashboard",   require("./src/routes/dashboardRoutes"));
app.use("/api/org",         require("./src/routes/organizationRoutes"));
app.use("/api/assets",      require("./src/routes/assetRoutes"));
app.use("/api/allocations", require("./src/routes/allocationRoutes"));
app.use("/api/bookings",    require("./src/routes/bookingRoutes"));
app.use("/api/maintenance", require("./src/routes/maintenanceRoutes"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
