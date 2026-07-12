const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");
const Asset = require("../models/Asset");
const Booking = require("../models/Booking");
const Maintenance = require("../models/Maintenance");
const Transfer = require("../models/Transfer");
const Department = require("../models/Department");
const AssetCategory = require("../models/AssetCategory");

dotenv.config();

const seedData = async () => {
  try {
    console.log("Connecting to database for seeding...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected.");

    // ── Clear all collections ──
    console.log("Clearing collections...");
    await User.deleteMany({});
    await Asset.deleteMany({});
    await Booking.deleteMany({});
    await Maintenance.deleteMany({});
    await Transfer.deleteMany({});
    await Department.deleteMany({});
    await AssetCategory.deleteMany({});
    console.log("Cleared.");

    // ── Drop legacy indexes ──
    try {
      await User.collection.dropIndexes();
      await Asset.collection.dropIndexes();
      await Department.collection.dropIndexes();
      await AssetCategory.collection.dropIndexes();
    } catch (e) {
      console.log("Index drop skipped:", e.message);
    }

    // ── Seed Asset Categories ──
    console.log("Seeding asset categories...");
    const catElectronics = await AssetCategory.create({
      name: "Electronics",
      description: "Computing and electronic devices",
      customFields: [
        { fieldName: "warrantyPeriod", fieldType: "number", required: true },
        { fieldName: "modelNumber", fieldType: "text", required: false },
      ],
      status: "Active",
    });
    const catFurniture = await AssetCategory.create({
      name: "Furniture",
      description: "Office furniture and fittings",
      customFields: [
        { fieldName: "material", fieldType: "text", required: false },
      ],
      status: "Active",
    });
    const catVehicles = await AssetCategory.create({
      name: "Vehicles",
      description: "Company fleet and transport assets",
      customFields: [
        { fieldName: "registrationNumber", fieldType: "text", required: true },
        { fieldName: "insuranceExpiry", fieldType: "date", required: true },
      ],
      status: "Active",
    });
    await AssetCategory.create({
      name: "Office Supplies",
      description: "Consumables and stationery",
      customFields: [],
      status: "Active",
    });
    console.log("Asset categories seeded.");

    // ── Seed Departments (no head yet — set after users) ──
    console.log("Seeding departments...");
    const deptIT = await Department.create({
      name: "IT Operations",
      description: "Manages all internal IT infrastructure and systems",
      status: "Active",
    });
    const deptEng = await Department.create({
      name: "Engineering",
      description: "Product engineering and R&D",
      status: "Active",
    });
    const deptMkt = await Department.create({
      name: "Marketing",
      description: "Brand, campaigns and communications",
      status: "Active",
    });
    const deptLog = await Department.create({
      name: "Logistics",
      description: "Supply chain, procurement and asset logistics",
      status: "Active",
    });
    await Department.create({
      name: "Human Resources",
      description: "People operations and talent management",
      status: "Active",
    });
    console.log("Departments seeded.");

    // ── Seed Users ──
    console.log("Seeding users...");
    const admin = new User({
      name: "System Admin",
      email: "admin@assetflow.com",
      password: "AdminPassword123",
      role: "Admin",
      department: deptIT._id,
      status: "Active",
    });
    await admin.save();

    const manager = new User({
      name: "Alice Manager",
      email: "manager@assetflow.com",
      password: "ManagerPassword123",
      role: "Asset Manager",
      department: deptLog._id,
      status: "Active",
    });
    await manager.save();

    const deptHead = new User({
      name: "Bob Head",
      email: "head@assetflow.com",
      password: "HeadPassword123",
      role: "Department Head",
      department: deptEng._id,
      status: "Active",
    });
    await deptHead.save();

    const emp1 = new User({
      name: "Jane Employee",
      email: "employee1@assetflow.com",
      password: "EmployeePassword123",
      role: "Employee",
      department: deptEng._id,
      status: "Active",
    });
    await emp1.save();

    const emp2 = new User({
      name: "John Worker",
      email: "employee2@assetflow.com",
      password: "EmployeePassword123",
      role: "Employee",
      department: deptMkt._id,
      status: "Active",
    });
    await emp2.save();
    console.log("Users seeded.");

    // ── Assign Department Heads ──
    await Department.findByIdAndUpdate(deptIT._id, { head: admin._id });
    await Department.findByIdAndUpdate(deptEng._id, { head: deptHead._id });
    await Department.findByIdAndUpdate(deptLog._id, { head: manager._id });
    console.log("Department heads assigned.");

    // ── Seed Assets ──
    console.log("Seeding assets...");
    const fiveDaysAhead = new Date();
    fiveDaysAhead.setDate(fiveDaysAhead.getDate() + 5);

    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

    const asset1 = await Asset.create({
      name: 'MacBook Pro 16"',
      serialNumber: "SN-MBP16-001",
      category: catElectronics._id,
      status: "Available",
      department: deptIT._id,
      condition: "Excellent",
      customFieldValues: { warrantyPeriod: 24, modelNumber: "MBP16-M3" },
    });

    const asset2 = await Asset.create({
      name: "Dell XPS 15",
      serialNumber: "SN-DELL-992",
      category: catElectronics._id,
      status: "Allocated",
      currentHolder: emp1._id,
      department: deptEng._id,
      expectedReturnDate: fiveDaysAhead,
      condition: "Good",
      customFieldValues: { warrantyPeriod: 12, modelNumber: "XPS15-9530" },
    });

    const asset3 = await Asset.create({
      name: "ThinkPad T14",
      serialNumber: "SN-THINK-421",
      category: catElectronics._id,
      status: "Allocated",
      currentHolder: emp2._id,
      department: deptMkt._id,
      expectedReturnDate: fourDaysAgo,
      condition: "Fair",
      customFieldValues: { warrantyPeriod: 12 },
    });

    const asset4 = await Asset.create({
      name: 'LG UltraWide 34"',
      serialNumber: "SN-LG34-082",
      category: catElectronics._id,
      status: "Available",
      department: deptEng._id,
      condition: "Excellent",
      customFieldValues: { warrantyPeriod: 36 },
    });

    const asset5 = await Asset.create({
      name: 'iPad Pro 12.9"',
      serialNumber: "SN-IPAD-773",
      category: catElectronics._id,
      status: "Maintenance",
      department: deptMkt._id,
      condition: "Damaged Screen",
      customFieldValues: { warrantyPeriod: 12 },
    });
    console.log("Assets seeded.");

    // ── Seed Bookings ──
    await Booking.create({
      asset: asset2._id,
      user: emp1._id,
      startDate: new Date(),
      endDate: fiveDaysAhead,
      purpose: "Regular Workstation",
      status: "Active",
    });
    await Booking.create({
      asset: asset3._id,
      user: emp2._id,
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      endDate: fourDaysAgo,
      purpose: "Marketing Campaign Design",
      status: "Active",
    });
    console.log("Bookings seeded.");

    // ── Seed Maintenance ──
    await Maintenance.create({
      asset: asset5._id,
      requestedBy: manager._id,
      type: "Repair",
      description: "Replace cracked screen and test touch response.",
      priority: "High",
      status: "In Progress",
      scheduledDate: new Date(),
    });
    console.log("Maintenance seeded.");

    // ── Seed Transfers ──
    await Transfer.create({
      asset: asset4._id,
      fromUser: emp1._id,
      toUser: emp2._id,
      status: "Pending",
      comments: "John needs dual monitor for marketing project.",
    });
    console.log("Transfers seeded.");

    console.log("\n✅ Database seeding complete!\n");
    console.log("Admin credentials: admin@assetflow.com / AdminPassword123");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  }
};

seedData();
