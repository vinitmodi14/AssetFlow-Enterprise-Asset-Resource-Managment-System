# 🚀 AssetFlow - Enterprise Asset & Resource Management System

<div align="center">

![Status](https://img.shields.io/badge/Status-Completed-success)
![License](https://img.shields.io/badge/License-MIT-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![React](https://img.shields.io/badge/React-Frontend-61DAFB)
![MySQL](https://img.shields.io/badge/Database-MySQL-orange)

### A Complete Enterprise Asset & Resource Management System

Efficiently manage organizational assets, resource bookings, maintenance workflows, audits, and employee allocations through a centralized ERP platform.

</div>

---

# 📖 About

AssetFlow is a modern ERP-based Asset & Resource Management System developed during the **Odoo Hackathon**. It helps organizations digitize and automate asset tracking, resource allocation, maintenance approvals, booking management, audit cycles, and reporting.

Instead of relying on spreadsheets and manual processes, AssetFlow provides a centralized platform with role-based access control and real-time visibility into organizational assets.

---

# ✨ Key Features

## 🔐 Authentication

- Secure Login & Signup
- JWT Authentication
- Password Encryption using bcrypt
- Forgot Password
- Session Management
- Role-Based Access Control (RBAC)

---

## 📊 Dashboard

Real-time dashboard displaying:

- 📦 Total Assets
- ✅ Available Assets
- 👥 Allocated Assets
- 🔧 Maintenance Requests
- 📅 Active Resource Bookings
- 🔄 Pending Transfers
- ⏰ Upcoming Returns
- 🚨 Overdue Returns

---

## 🏢 Organization Management

### Department Management

- Create Department
- Update Department
- Deactivate Department
- Assign Department Head

### Asset Categories

- Create Categories
- Edit Categories
- Category-wise Asset Organization

### Employee Directory

- Employee Registration
- Department Assignment
- Role Assignment
- Employee Status Management

---

## 💻 Asset Management

- Register New Asset
- Auto-generated Asset Tag
- Asset Categories
- Serial Number Management
- Asset Location
- Asset Images/Documents
- Asset Search
- Asset Filters
- Asset History

### Asset Lifecycle

- Available
- Allocated
- Reserved
- Under Maintenance
- Lost
- Retired
- Disposed

---

## 👥 Asset Allocation

- Allocate Asset to Employee
- Allocate Asset to Department
- Expected Return Date
- Asset Return Workflow
- Transfer Requests
- Conflict Detection
- Allocation History

---

## 📅 Resource Booking

Book shared organizational resources like:

- Meeting Rooms
- Vehicles
- Projectors
- Equipment

Features:

- Calendar View
- Time Slot Booking
- Overlap Validation
- Booking Status
- Booking Cancellation
- Booking Reschedule
- Reminder Notifications

---

## 🔧 Maintenance Management

Complete maintenance workflow:

```
Pending
     ↓
Approved
     ↓
Technician Assigned
     ↓
In Progress
     ↓
Resolved
```

Features:

- Raise Maintenance Request
- Attach Images
- Set Priority
- Approval Workflow
- Maintenance History
- Automatic Asset Status Update

---

## 📝 Asset Audit

- Create Audit Cycle
- Assign Auditors
- Verify Assets
- Missing Asset Detection
- Damaged Asset Tracking
- Auto-generated Discrepancy Reports
- Audit History

---

## 📈 Reports & Analytics

Generate reports for:

- Asset Utilization
- Department-wise Allocation
- Maintenance Frequency
- Idle Assets
- Resource Booking Heatmap
- Retirement Forecast
- Export Reports

---

## 🔔 Notifications

Receive notifications for:

- Asset Allocation
- Asset Return
- Booking Confirmation
- Booking Reminder
- Maintenance Approval
- Maintenance Rejection
- Transfer Approval
- Overdue Return Alerts
- Audit Reports

---

# 👨‍💼 User Roles

## 👑 Admin

- Manage Departments
- Manage Asset Categories
- Manage Employees
- Assign Roles
- Manage Audit Cycles
- View Reports & Analytics
- Monitor Entire Organization

---

## 📦 Asset Manager

- Register Assets
- Allocate Assets
- Approve Transfers
- Approve Maintenance
- Verify Asset Returns

---

## 🏢 Department Head

- View Department Assets
- Approve Allocation Requests
- Approve Transfers
- Book Shared Resources

---

## 👤 Employee

- View Assigned Assets
- Book Shared Resources
- Raise Maintenance Requests
- Initiate Asset Return
- Request Asset Transfer

---

# 🔄 System Workflow

```
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
      ┌───────────┴───────────┐
      ▼                       ▼
Asset Allocation        Shared Resource
      │                  Booking
      ▼                       │
 Employee Uses Asset           │
      │                        │
      ├──────────────┐         │
      ▼              ▼         ▼
Maintenance      Transfer   Completion
      │              │
      ▼              ▼
Resolved      Reallocated
      │
      ▼
Asset Returned
      │
      ▼
Available Again
```

---

# 🏗️ System Architecture

```
               React.js Frontend
                      │
                      │ REST API
                      ▼
          Node.js + Express.js Backend
                      │
                      ▼
                  MySQL Database
```

---

# 🛠️ Tech Stack

## Frontend

- React.js
- Redux Toolkit
- Tailwind CSS
- React Router DOM
- Axios

---

## Backend

- Node.js
- Express.js
- JWT Authentication
- bcrypt.js
- Multer
- CORS
- dotenv

---

## Database

- MySQL
- SQL

---

## Tools

- Git
- GitHub
- Postman
- VS Code

---

# 💾 Database Design

Main database tables:

- Users
- Roles
- Departments
- Employees
- Asset Categories
- Assets
- Asset Allocations
- Asset Transfers
- Resource Bookings
- Maintenance Requests
- Audit Cycles
- Audit Items
- Notifications
- Activity Logs

---

# 📂 Project Structure

```
AssetFlow/
│
├── Frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── redux/
│   │   ├── services/
│   │   ├── utils/
│   │   └── App.jsx
│   │
│   └── package.json
│
├── Backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── database/
│   ├── utils/
│   ├── server.js
│   └── package.json
│
├── README.md
└── .gitignore
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/pratham9805/AssetFlow.git
```

---

## Move into Project

```bash
cd AssetFlow
```

---

## Install Backend Dependencies

```bash
cd Backend
npm install
```

---

## Install Frontend Dependencies

```bash
cd ../Frontend
npm install
```

---

# 🔑 Environment Variables

Create a `.env` file inside the Backend folder.

```env
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=assetflow

JWT_SECRET=your_jwt_secret


```

---

# ▶️ Run Backend

```bash
cd Backend
npm run dev
```

---

# ▶️ Run Frontend

```bash
cd Frontend
npm run dev
```

---

# 📊 MySQL Database Setup

Create a MySQL database:

```sql
CREATE DATABASE assetflow;
```

Update your `.env` file with your MySQL credentials.

Run your SQL schema and seed files (if available).

---

---

# 🚀 Future Enhancements

- QR Code Integration
- Barcode Scanner
- Email Notifications
- SMS Alerts
- AI-Based Asset Prediction
- Mobile Application
- RFID Support
- Multi-Organization Support
- Dark Mode
- Advanced Analytics
- Real-time Notifications using Socket.io

---

# 🤝 Contributors

Developed during the **Odoo Hackathon** by Team **AssetFlow**

---

# 📜 License

This project is licensed under the MIT License.

---

<div align="center">

### ⭐ Star this repository if you found it useful!

Made with ❤️ using React.js, Node.js, Express.js & MySQL

</div>
