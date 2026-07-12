# 🚀 AssetFlow - Enterprise Asset & Resource Management System

<div align="center">

### Streamline Asset Tracking, Resource Booking & Maintenance Management

An Enterprise Asset & Resource Management System built to help organizations efficiently manage assets, shared resources, maintenance workflows, audits, and employee allocations through a centralized ERP platform.

</div>

---

## 📖 Overview

AssetFlow is a modern ERP solution designed to simplify how organizations manage physical assets and shared resources.

Instead of relying on spreadsheets or manual records, AssetFlow provides a centralized platform to:

- Track assets throughout their lifecycle
- Allocate assets to employees and departments
- Manage shared resource bookings
- Handle maintenance approvals
- Conduct asset audits
- Monitor organization-wide analytics

The system is designed with scalability, security, and role-based workflows in mind.

---

# ✨ Features

## 🔐 Authentication

- Secure Login & Signup
- JWT Authentication
- Forgot Password
- Session Validation
- Role Based Access Control (RBAC)

---

## 📊 Dashboard

Real-time KPI Dashboard including:

- Available Assets
- Allocated Assets
- Active Bookings
- Maintenance Requests
- Pending Transfers
- Upcoming Returns
- Overdue Notifications

---

## 🏢 Organization Management

Admin can manage:

- Departments
- Employee Directory
- Asset Categories
- Department Heads
- Asset Managers

---

## 💻 Asset Management

- Register Assets
- Asset Categories
- Asset Tags
- QR Code Support
- Asset Lifecycle Tracking
- Upload Asset Documents
- Asset History
- Asset Search & Filters

Supported Asset States:

- Available
- Allocated
- Reserved
- Under Maintenance
- Lost
- Retired
- Disposed

---

## 👥 Asset Allocation

- Allocate Assets
- Return Assets
- Transfer Requests
- Conflict Detection
- Expected Return Date
- Allocation History

---

## 📅 Resource Booking

Book shared resources like:

- Meeting Rooms
- Vehicles
- Equipment

Features:

- Calendar View
- Time Slot Booking
- Overlap Validation
- Booking Status
- Reminder Notifications

---

## 🔧 Maintenance Management

Workflow:

Pending
→ Approved / Rejected
→ Technician Assigned
→ In Progress
→ Resolved

Includes:

- Priority Management
- Issue Description
- Image Upload
- Maintenance History

---

## 📝 Asset Audits

- Audit Cycle Creation
- Assign Auditors
- Verify Assets
- Missing Assets
- Damaged Assets
- Auto-generated Discrepancy Reports

---

## 📈 Reports & Analytics

Generate reports for:

- Asset Utilization
- Department Allocations
- Maintenance Trends
- Idle Assets
- Booking Heatmaps
- Retirement Forecasts

---

## 🔔 Notifications

Receive notifications for:

- Asset Allocation
- Asset Return
- Booking Confirmation
- Booking Reminder
- Maintenance Approval
- Transfer Approval
- Audit Reports
- Overdue Returns

---

# 👨‍💼 User Roles

## 👑 Admin

- Manage Departments
- Manage Asset Categories
- Employee Management
- Assign Roles
- View Analytics
- Manage Audit Cycles

---

## 📦 Asset Manager

- Register Assets
- Allocate Assets
- Approve Transfers
- Approve Maintenance
- Approve Returns

---

## 🏢 Department Head

- View Department Assets
- Approve Transfers
- Approve Allocations
- Book Shared Resources

---

## 👤 Employee

- View Assigned Assets
- Book Resources
- Raise Maintenance Requests
- Initiate Returns
- Request Transfers

---

# 🔄 Asset Workflow

```text
Admin
      │
      ▼
Organization Setup
      │
      ▼
Asset Registration
      │
      ▼
Asset Available
      │
      ▼
Asset Allocation
      │
      ▼
Employee Uses Asset
      │
      ├──────────────┐
      ▼              ▼
Maintenance      Transfer
      │              │
      ▼              ▼
Resolved      Reallocated
      │
      ▼
Returned
      │
      ▼
Available Again
```

---

# 🏗️ Project Architecture

```
Frontend (React.js)
        │
        ▼
REST APIs
        │
        ▼
Backend (Node.js + Express.js)
        │
        ▼
MongoDB Database
```

---

# 🛠️ Tech Stack

## Frontend

- React.js
- Tailwind CSS
- Redux Toolkit
- React Router
- Axios

## Backend

- Node.js
- Express.js
- JWT Authentication
- Multer
- Cloudinary

## Database

- MongoDB
- Mongoose

## Other Tools

- Git
- GitHub
- Postman

---

# 📂 Project Structure

```
AssetFlow/
│
├── Frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── redux/
│   └── services/
│
├── Backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   └── utils/
│
├── README.md
└── package.json
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/your-username/AssetFlow.git
```

Move into project

```bash
cd AssetFlow
```

Install Backend

```bash
cd Backend
npm install
```

Install Frontend

```bash
cd ../Frontend
npm install
```

Run Backend

```bash
npm run dev
```

Run Frontend

```bash
npm run dev
```

---

# 🌟 Future Enhancements

- QR Code Scanner
- Barcode Support
- Email Notifications
- SMS Notifications
- AI-powered Asset Prediction
- Mobile Application
- RFID Integration
- Multi-Organization Support
- Real-time Dashboard
- Export PDF & Excel Reports

---

# 🤝 Contributors

Developed during the **Odoo Hackathon** by Team **AssetFlow**.

---

# 📄 License

This project is developed for educational and hackathon purposes.

---

<div align="center">

### ⭐ If you like this project, don't forget to give it a Star!

Made with ❤️ using MERN Stack

</div>
