const mongoose = require("mongoose");
const dotenv   = require("dotenv");
const User        = require("../models/User");
const Asset       = require("../models/Asset");
const Booking     = require("../models/Booking");
const Maintenance = require("../models/Maintenance");
const Transfer    = require("../models/Transfer");
const Department  = require("../models/Department");
const AssetCategory = require("../models/AssetCategory");
const Counter     = require("../models/Counter");
const Allocation  = require("../models/Allocation");

dotenv.config();

const seedData = async () => {
  try {
    console.log("Connecting to database for seeding...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected.");

    console.log("Clearing all collections...");
    await Promise.all([
      User.deleteMany({}), Asset.deleteMany({}),
      Booking.deleteMany({}), Maintenance.deleteMany({}),
      Transfer.deleteMany({}), Department.deleteMany({}),
      AssetCategory.deleteMany({}), Counter.deleteMany({}),
      Allocation.deleteMany({}),
    ]);
    console.log("Cleared.");

    try {
      await Promise.all([
        User.collection.dropIndexes(), Asset.collection.dropIndexes(),
        Department.collection.dropIndexes(), AssetCategory.collection.dropIndexes(),
        Allocation.collection.dropIndexes(), Booking.collection.dropIndexes(),
      ]);
    } catch (e) { console.log("Index drop skipped:", e.message); }

    await Counter.create({ name: "assetTag", seq: 0 });
    console.log("Counter seeded.");

    console.log("Seeding categories...");
    const [catElec, catFurniture, catVehicles, catOffice, catRooms] = await Promise.all([
      AssetCategory.create({ name: "Electronics",    description: "Computers, monitors, devices", customFields: [{ fieldName: "warrantyPeriod", fieldType: "number", required: true }, { fieldName: "modelNumber", fieldType: "text", required: false }], status: "Active" }),
      AssetCategory.create({ name: "Furniture",      description: "Office furniture and fittings", customFields: [{ fieldName: "material", fieldType: "text", required: false }], status: "Active" }),
      AssetCategory.create({ name: "Vehicles",       description: "Company fleet",  customFields: [{ fieldName: "registrationNumber", fieldType: "text", required: true }, { fieldName: "insuranceExpiry", fieldType: "date", required: true }], status: "Active" }),
      AssetCategory.create({ name: "Office Supplies", description: "Consumables and stationery", customFields: [], status: "Active" }),
      AssetCategory.create({ name: "Meeting Rooms",  description: "Bookable shared spaces", customFields: [{ fieldName: "capacity", fieldType: "number", required: true }], status: "Active" }),
    ]);
    console.log("Categories seeded.");

    console.log("Seeding departments...");
    const [deptIT, deptEng, deptMkt, deptLog] = await Promise.all([
      Department.create({ name: "IT Operations",  description: "Manages all internal IT infrastructure", status: "Active" }),
      Department.create({ name: "Engineering",    description: "Product engineering and R&D",           status: "Active" }),
      Department.create({ name: "Marketing",      description: "Brand, campaigns and communications",   status: "Active" }),
      Department.create({ name: "Logistics",      description: "Supply chain and procurement",          status: "Active" }),
    ]);
    await Department.create({ name: "Human Resources", description: "People ops", status: "Active" });
    console.log("Departments seeded.");

    console.log("Seeding users...");
    const admin = new User({ name:"System Admin",    email:"admin@assetflow.com",    password:"AdminPassword123",    role:"Admin",            department:deptIT._id,  status:"Active" });
    await admin.save();
    const manager = new User({ name:"Alice Manager", email:"manager@assetflow.com",  password:"ManagerPassword123",  role:"Asset Manager",    department:deptLog._id, status:"Active" });
    await manager.save();
    const deptHead = new User({ name:"Bob Head",     email:"head@assetflow.com",     password:"HeadPassword123",     role:"Department Head",  department:deptEng._id, status:"Active" });
    await deptHead.save();
    const emp1 = new User({ name:"Jane Employee",    email:"employee1@assetflow.com", password:"EmployeePassword123", role:"Employee",         department:deptEng._id, status:"Active" });
    await emp1.save();
    const emp2 = new User({ name:"John Worker",      email:"employee2@assetflow.com", password:"EmployeePassword123", role:"Employee",         department:deptMkt._id, status:"Active" });
    await emp2.save();
    console.log("Users seeded.");

    await Department.findByIdAndUpdate(deptIT._id,  { head: admin._id });
    await Department.findByIdAndUpdate(deptEng._id, { head: deptHead._id });
    await Department.findByIdAndUpdate(deptLog._id, { head: manager._id });

    const nextTag = async () => {
      const c = await Counter.findOneAndUpdate({ name: "assetTag" }, { $inc: { seq: 1 } }, { new: true });
      return `AF-${String(c.seq).padStart(4, "0")}`;
    };

    console.log("Seeding assets...");
    const now          = new Date();
    const fiveDays     = new Date(now.getTime() + 5  * 86400000);
    const fourDaysAgo  = new Date(now.getTime() - 4  * 86400000);
    const tenDaysAgo   = new Date(now.getTime() - 10 * 86400000);

    const a1 = await Asset.create({ assetTag: await nextTag(), name: 'MacBook Pro 16"',    serialNumber: "SN-MBP16-001",   category: catElec._id,      status: "Available",        department: deptIT._id,  condition: "Excellent", location: "IT Storage Room",   acquisitionDate: new Date("2024-01-15"), acquisitionCost: 2499,  isBookable: false, customFieldValues: { warrantyPeriod: 24, modelNumber: "MBP16-M3"  } });
    const a2 = await Asset.create({ assetTag: await nextTag(), name: "Dell XPS 15",        serialNumber: "SN-DELL-992",    category: catElec._id,      status: "Allocated",        department: deptEng._id, condition: "Good",      location: "Engineering Floor", acquisitionDate: new Date("2023-06-01"), acquisitionCost: 1799,  isBookable: false, customFieldValues: { warrantyPeriod: 12, modelNumber: "XPS15-9530" } });
    const a3 = await Asset.create({ assetTag: await nextTag(), name: "ThinkPad T14",       serialNumber: "SN-THINK-421",   category: catElec._id,      status: "Allocated",        department: deptMkt._id, condition: "Fair",      location: "Marketing Desk 3",  acquisitionDate: new Date("2023-03-10"), acquisitionCost: 1199,  isBookable: false, customFieldValues: { warrantyPeriod: 12 } });
    const a4 = await Asset.create({ assetTag: await nextTag(), name: 'LG UltraWide 34"',  serialNumber: "SN-LG34-082",    category: catElec._id,      status: "Available",        department: deptEng._id, condition: "Excellent", location: "Engineering Floor", acquisitionDate: new Date("2024-02-20"), acquisitionCost: 699,   isBookable: false, customFieldValues: { warrantyPeriod: 36 } });
    const a5 = await Asset.create({ assetTag: await nextTag(), name: 'iPad Pro 12.9"',    serialNumber: "SN-IPAD-773",    category: catElec._id,      status: "Under Maintenance",department: deptMkt._id, condition: "Damaged",   location: "IT Repair Bay",     acquisitionDate: new Date("2023-09-05"), acquisitionCost: 999,   isBookable: false, customFieldValues: { warrantyPeriod: 12 } });
    const a6 = await Asset.create({ assetTag: await nextTag(), name: "Conference Room A",  serialNumber: "ROOM-CONF-A",    category: catRooms._id,     status: "Available",        department: deptIT._id,  condition: "Excellent", location: "Building 1, Floor 2", acquisitionDate: null, acquisitionCost: null,  isBookable: true,  customFieldValues: { capacity: 12 } });
    const a7 = await Asset.create({ assetTag: await nextTag(), name: "Meeting Room B2",    serialNumber: "ROOM-MTG-B2",    category: catRooms._id,     status: "Available",        department: deptEng._id, condition: "Good",      location: "Building 2, Floor 1", acquisitionDate: null, acquisitionCost: null,  isBookable: true,  customFieldValues: { capacity: 6  } });
    const a8 = await Asset.create({ assetTag: await nextTag(), name: "Ergonomic Chair",    serialNumber: "SN-CHAIR-055",   category: catFurniture._id, status: "Allocated",        department: deptEng._id, condition: "Good",      location: "Engineering Floor", acquisitionDate: new Date("2022-11-01"), acquisitionCost: 450,   isBookable: false, customFieldValues: { material: "Mesh" } });
    await Asset.create(           { assetTag: await nextTag(), name: "Toyota Corolla",     serialNumber: "SN-CAR-KA01",    category: catVehicles._id,  status: "Available",        department: deptLog._id, condition: "Good",      location: "Basement Parking",  acquisitionDate: new Date("2023-01-20"), acquisitionCost: 18000, isBookable: false, customFieldValues: { registrationNumber: "KA01AB1234", insuranceExpiry: "2026-01-20" } });
    await Asset.create(           { assetTag: await nextTag(), name: "Projector Epson",    serialNumber: "SN-PROJ-301",    category: catElec._id,      status: "Retired",          department: deptIT._id,  condition: "Damaged",   location: "IT Storage Room",   acquisitionDate: new Date("2019-06-01"), acquisitionCost: 800,   isBookable: false, customFieldValues: { warrantyPeriod: 12 } });
    console.log("Assets seeded.");

    console.log("Seeding allocations...");
    const alloc2 = await Allocation.create({ asset: a2._id, allocatedTo: emp1._id, allocatedBy: manager._id, department: deptEng._id, startDate: tenDaysAgo, expectedReturnDate: fiveDays, status: "Active",   notes: "Regular workstation" });
    await Allocation.create(               { asset: a3._id, allocatedTo: emp2._id, allocatedBy: manager._id, department: deptMkt._id, startDate: tenDaysAgo, expectedReturnDate: fourDaysAgo, status: "Active", notes: "Marketing campaign work" });
    const alloc8 = await Allocation.create({ asset: a8._id, allocatedTo: deptHead._id, allocatedBy: admin._id, department: deptEng._id, startDate: new Date("2024-01-01"), status: "Active", notes: "Permanent desk assignment" });

    await Asset.findByIdAndUpdate(a2._id, { currentHolder: emp1._id,    expectedReturnDate: fiveDays });
    await Asset.findByIdAndUpdate(a3._id, { currentHolder: emp2._id,    expectedReturnDate: fourDaysAgo });
    await Asset.findByIdAndUpdate(a8._id, { currentHolder: deptHead._id });
    console.log("Allocations seeded.");

    await Transfer.create({ asset: a4._id, allocation: alloc2._id, fromUser: emp1._id, toUser: emp2._id, requestedBy: emp2._id, status: "Requested", comments: "John needs dual monitor for marketing project." });
    console.log("Transfer seeded.");

    console.log("Seeding bookings...");
    const todayBase = new Date(); todayBase.setHours(0,0,0,0);
    const t = (h, m=0) => new Date(todayBase.getTime() + h*3600000 + m*60000);

    await Booking.create({ asset: a6._id, bookedBy: emp1._id, startTime: t(9),   endTime: t(10),  purpose: "Sprint Planning",       status: "Upcoming" });
    await Booking.create({ asset: a6._id, bookedBy: emp2._id, startTime: t(14),  endTime: t(15),  purpose: "Client Call",           status: "Upcoming" });
    await Booking.create({ asset: a7._id, bookedBy: deptHead._id, startTime: t(11), endTime: t(12), purpose: "Design Review",        status: "Upcoming" });
    await Booking.create({ asset: a7._id, bookedBy: emp1._id, startTime: t(-24), endTime: t(-22), purpose: "Yesterday's Meeting",   status: "Completed" });
    console.log("Bookings seeded.");

    console.log("Seeding maintenance...");
    await Maintenance.create({ asset: a5._id, requestedBy: manager._id, type: "Repair",   description: "Replace cracked screen and test touch response.", priority: "High",   status: "In Progress",      approvedBy: admin._id, assignedTechnicianName: "Ravi Kumar", scheduledDate: now });
    await Maintenance.create({ asset: a1._id, requestedBy: emp1._id,    type: "Routine",  description: "Annual hardware check and software update.",       priority: "Low",    status: "Pending" });
    await Maintenance.create({ asset: a4._id, requestedBy: emp2._id,    type: "Repair",   description: "Monitor flickers intermittently on startup.",      priority: "Medium", status: "Approved",         approvedBy: manager._id });
    console.log("Maintenance seeded.");

    console.log("\n✅ Database seeding complete!\n");
    console.log("Admin:   admin@assetflow.com     / AdminPassword123");
    console.log("Manager: manager@assetflow.com   / ManagerPassword123");
    console.log("Head:    head@assetflow.com       / HeadPassword123");
    console.log("Emp1:    employee1@assetflow.com  / EmployeePassword123");
    console.log("Emp2:    employee2@assetflow.com  / EmployeePassword123");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  }
};

seedData();
