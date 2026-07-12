const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");
const Asset = require("../models/Asset");
const Booking = require("../models/Booking");
const Maintenance = require("../models/Maintenance");
const Transfer = require("../models/Transfer");

dotenv.config();

const seedData = async () => {
  try {
    // Connect to database
    console.log("Connecting to database for seeding...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected successfully.");

    // Clear existing data
    console.log("Cleaning database collections...");
    await User.deleteMany({});
    await Asset.deleteMany({});
    await Booking.deleteMany({});
    await Maintenance.deleteMany({});
    await Transfer.deleteMany({});
    console.log("Existing collections cleared.");

    try {
      console.log("Dropping old indexes...");
      await User.collection.dropIndexes();
      await Asset.collection.dropIndexes();
      console.log("Old indexes dropped.");
    } catch (idxErr) {
      console.log("Index dropping bypassed: ", idxErr.message);
    }

    // Create Users
    console.log("Creating user directory...");
    
    // We will save users sequentially to invoke pre("save") hashing correctly
    const admin = new User({
      name: "System Admin",
      email: "admin@assetflow.com",
      password: "AdminPassword123",
      role: "Admin",
      department: "IT Operations",
    });
    await admin.save();

    const manager = new User({
      name: "Alice Manager",
      email: "manager@assetflow.com",
      password: "ManagerPassword123",
      role: "Asset Manager",
      department: "Logistics",
    });
    await manager.save();

    const deptHead = new User({
      name: "Bob Head",
      email: "head@assetflow.com",
      password: "HeadPassword123",
      role: "Department Head",
      department: "Engineering",
    });
    await deptHead.save();

    const emp1 = new User({
      name: "Jane Employee",
      email: "employee1@assetflow.com",
      password: "EmployeePassword123",
      role: "Employee",
      department: "Engineering",
    });
    await emp1.save();

    const emp2 = new User({
      name: "John Worker",
      email: "employee2@assetflow.com",
      password: "EmployeePassword123",
      role: "Employee",
      department: "Marketing",
    });
    await emp2.save();

    console.log("Users created successfully.");

    // Create Assets
    console.log("Creating assets catalog...");

    // 1. Available Asset
    const asset1 = await Asset.create({
      name: 'MacBook Pro 16"',
      serialNumber: "SN-MBP16-001",
      category: "Laptops",
      status: "Available",
      department: "IT Operations",
      condition: "Excellent",
    });

    // 2. Allocated Asset (Upcoming Return)
    const fiveDaysInFuture = new Date();
    fiveDaysInFuture.setDate(fiveDaysInFuture.getDate() + 5);
    const asset2 = await Asset.create({
      name: "Dell XPS 15",
      serialNumber: "SN-DELL-992",
      category: "Laptops",
      status: "Allocated",
      currentHolder: emp1._id,
      department: "Engineering",
      expectedReturnDate: fiveDaysInFuture,
      condition: "Good",
    });

    // 3. Allocated Asset (Overdue Return)
    const fourDaysInPast = new Date();
    fourDaysInPast.setDate(fourDaysInPast.getDate() - 4);
    const asset3 = await Asset.create({
      name: "ThinkPad T14",
      serialNumber: "SN-THINK-421",
      category: "Laptops",
      status: "Allocated",
      currentHolder: emp2._id,
      department: "Marketing",
      expectedReturnDate: fourDaysInPast,
      condition: "Fair",
    });

    // 4. Available Asset (Monitor)
    const asset4 = await Asset.create({
      name: 'LG UltraWide 34"',
      serialNumber: "SN-LG34-082",
      category: "Monitors",
      status: "Available",
      department: "Engineering",
      condition: "Excellent",
    });

    // 5. Asset in Maintenance
    const asset5 = await Asset.create({
      name: 'iPad Pro 12.9"',
      serialNumber: "SN-IPAD-773",
      category: "Tablets",
      status: "Maintenance",
      department: "Marketing",
      condition: "Damaged Screen",
    });

    console.log("Assets catalog created.");

    // Create Bookings
    console.log("Creating bookings logs...");
    
    // Booking 1 - active, upcoming
    await Booking.create({
      asset: asset2._id,
      user: emp1._id,
      startDate: new Date(),
      endDate: fiveDaysInFuture,
      purpose: "Regular Workstation",
      status: "Active",
    });

    // Booking 2 - active, overdue
    await Booking.create({
      asset: asset3._id,
      user: emp2._id,
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      endDate: fourDaysInPast,
      purpose: "Marketing Campaign Design",
      status: "Active", // Still marked as active booking, but is overdue
    });

    console.log("Bookings registered.");

    // Create Maintenance Requests
    console.log("Creating maintenance tickets...");
    await Maintenance.create({
      asset: asset5._id,
      requestedBy: manager._id,
      type: "Repair",
      description: "Replace cracked screen and test touch response.",
      priority: "High",
      status: "In Progress",
      scheduledDate: new Date(),
    });
    console.log("Maintenance records added.");

    // Create Transfers
    console.log("Creating transfer requests...");
    await Transfer.create({
      asset: asset4._id,
      fromUser: emp1._id,
      toUser: emp2._id,
      status: "Pending",
      comments: "John needs the dual monitor setup for the marketing project.",
      requestDate: new Date(),
    });
    console.log("Transfer logs added.");

    console.log("✅ Database seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  }
};

seedData();
