import React, { useState } from "react";
import { useEffect } from "react";
import {
    Bell,
    Search,
    CheckCircle,
    AlertTriangle,
    Wrench,
    ArrowRightLeft,
    CalendarCheck,
    ClipboardList,
    Package,
} from "lucide-react";

const initialNotifications = [
    {
        id: 1,
        type: "Asset Assigned",
        message: "Laptop AF-101 assigned to Rahul Patel",
        time: "2 mins ago",
        icon: <Package size={18} />,
        color: "#22c55e",
    },
    {
        id: 2,
        type: "Maintenance Approved",
        message: "Maintenance request approved for Printer AF-22",
        time: "10 mins ago",
        icon: <Wrench size={18} />,
        color: "#3b82f6",
    },
    {
        id: 3,
        type: "Booking Confirmed",
        message: "Conference Room B booked successfully",
        time: "25 mins ago",
        icon: <CalendarCheck size={18} />,
        color: "#8b5cf6",
    },
    {
        id: 4,
        type: "Transfer Approved",
        message: "Transfer request approved",
        time: "Today",
        icon: <ArrowRightLeft size={18} />,
        color: "#06b6d4",
    },
    {
        id: 5,
        type: "Overdue Return",
        message: "Projector AF-55 overdue by 3 days",
        time: "Yesterday",
        icon: <AlertTriangle size={18} />,
        color: "#ef4444",
    },
];

const activityData = [
    {
        id: 1,
        user: "Admin",
        action: "Registered new Laptop",
        target: "Dell Latitude",
        time: "Today 09:20",
    },
    {
        id: 2,
        user: "Manager",
        action: "Approved Maintenance",
        target: "Printer AF-22",
        time: "Today 10:05",
    },
    {
        id: 3,
        user: "Employee",
        action: "Booked Conference Room",
        target: "Room B",
        time: "Today 11:00",
    },
    {
        id: 4,
        user: "Admin",
        action: "Transferred Asset",
        target: "Laptop AF-101",
        time: "Yesterday",
    },
];

export default function ActivityLogs() {
    const [filter, setFilter] = useState("All");
    const [notifications, setNotifications] =
        useState(initialNotifications);
    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {

        const timer = setInterval(() => {

            setCurrentTime(new Date());

        }, 1000);

        return () => clearInterval(timer);

    }, []);
    const filteredNotifications = notifications.filter((item) => {
        const matchesSearch =
            item.message.toLowerCase().includes(search.toLowerCase()) ||
            item.type.toLowerCase().includes(search.toLowerCase());

        const matchesFilter =
            filter === "All" ||
            item.type.toLowerCase().includes(filter.toLowerCase());

        return matchesSearch && matchesFilter;
    });

    const filteredActivities = activityData.filter((item) => {
        const matchesSearch =
            item.user.toLowerCase().includes(search.toLowerCase()) ||
            item.action.toLowerCase().includes(search.toLowerCase()) ||
            item.target.toLowerCase().includes(search.toLowerCase());

        const matchesFilter =
            filter === "All" ||
            item.action.toLowerCase().includes(filter.toLowerCase());

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="page-container">

            {/* Page Header */}

            <div className="page-header">
                <div>
                    <h2 className="section-title">
                        <Bell size={24} />
                        Activity Logs & Notifications
                    </h2>
                    <p className="section-subtitle">
                        Keep every role informed with real-time notifications and audit logs.
                    </p>
                </div>
            </div>

            {/* Summary Cards */}

            <div className="stats-grid">

                <div className="stat-card">
                    <Bell size={22} />
                    <div>
                        <h3>{notifications.length}</h3>
                        <p>Total Notifications</p>
                    </div>
                </div>

                <div className="stat-card">
                    <CheckCircle size={22} />
                    <div>
                        <h3>{notifications.length}</h3>
                        <p>Unread</p>
                    </div>
                </div>

                <div className="stat-card">
                    <ClipboardList size={22} />
                    <div>
                        <h3>{activityData.length}</h3>
                        <p>Today's Activities</p>
                    </div>
                </div>

                <div className="stat-card">
                    <AlertTriangle size={22} />
                    <div>
                        <h3>1</h3>
                        <p>Critical Alerts</p>
                    </div>
                </div>

            </div>

            {/* Search */}

            <div className="table-toolbar">

                <div className="search-box">

                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="Search notifications or activities..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                </div>
                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                        marginBottom: "20px",
                        flexWrap: "wrap",
                    }}
                >
                    <button
                        className={`btn-secondary ${filter === "All" ? "active" : ""}`}
                        onClick={() => setFilter("All")}
                    >
                        All
                    </button>
                    <button
                        className={`btn-secondary ${filter === "Asset" ? "active" : ""}`}
                        onClick={() => setFilter("Asset")}
                    >
                        Asset
                    </button>

                    <button
                        className={`btn-secondary ${filter === "Maintenance" ? "active" : ""}`}
                        onClick={() => setFilter("Maintenance")}
                    >
                        Maintenance
                    </button>

                    <button
                        className={`btn-secondary ${filter === "Booking" ? "active" : ""}`}
                        onClick={() => setFilter("Booking")}
                    >
                        Booking
                    </button>

                    <button
                        className={`btn-secondary ${filter === "Transfer" ? "active" : ""}`}
                        onClick={() => setFilter("Transfer")}
                    >
                        Transfer
                    </button>

                    <button
                        className={`btn-secondary ${filter === "Audit" ? "active" : ""}`}
                        onClick={() => setFilter("Audit")}
                    >
                        Audit
                    </button>
                </div>

            </div>
            {/* Notifications */}

            <div className="data-panel">

                <div className="panel-header">
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px"
                        }}
                    >
                        <div
                            style={{
                                position: "relative"
                            }}
                        >

                            <Bell size={20} />

                            <span
                                style={{
                                    position: "absolute",
                                    top: -6,
                                    right: -8,
                                    width: 18,
                                    height: 18,
                                    borderRadius: "50%",
                                    background: "#ef4444",
                                    color: "white",
                                    fontSize: 10,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}
                            >

                                {notifications.length}

                            </span>

                        </div>

                        <h3>Notifications</h3>

                        <span
                            style={{
                                background: "#2563eb",
                                color: "white",
                                padding: "2px 10px",
                                borderRadius: "20px",
                                fontSize: "12px"
                            }}
                        >
                            {filteredNotifications.length}
                        </span>
                    </div>

                    <button
                        className="btn-secondary"
                        onClick={() => setNotifications([])}
                    >
                        Mark all as read
                    </button>
                </div>

                <div className="notification-list">

                    {filteredNotifications.length === 0 ? (

                        <div className="empty-state">
                            No notifications found.
                        </div>

                    ) : (

                        filteredNotifications.map((item) => (

                            <div
                                className="notification-card"
                                style={{
                                    borderLeft:
                                        item.type === "Overdue Return"
                                            ? "5px solid #ef4444"
                                            : item.type.includes("Maintenance")
                                                ? "5px solid #3b82f6"
                                                : item.type.includes("Booking")
                                                    ? "5px solid #8b5cf6"
                                                    : "5px solid #22c55e"
                                }}
                            >

                                <div
                                    className="notification-icon"
                                    style={{
                                        background: `${item.color}20`,
                                        color: item.color,
                                    }}
                                >
                                    {item.icon}
                                </div>

                                <div className="notification-content">

                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            marginBottom: "6px",
                                        }}
                                    >
                                        <h4 style={{ margin: 0 }}>{item.type}</h4>

                                        <span
                                            style={{
                                                padding: "4px 10px",
                                                borderRadius: "20px",
                                                fontSize: "11px",
                                                fontWeight: "600",
                                                backgroundColor:
                                                    item.type === "Overdue Return"
                                                        ? "#fee2e2"
                                                        : item.type.includes("Maintenance")
                                                            ? "#dbeafe"
                                                            : item.type.includes("Booking")
                                                                ? "#ede9fe"
                                                                : "#dcfce7",
                                                color:
                                                    item.type === "Overdue Return"
                                                        ? "#dc2626"
                                                        : item.type.includes("Maintenance")
                                                            ? "#2563eb"
                                                            : item.type.includes("Booking")
                                                                ? "#7c3aed"
                                                                : "#16a34a",
                                            }}
                                        >
                                            {item.type}
                                        </span>
                                    </div>

                                    <p
                                        style={{
                                            color: "#64748b",
                                            fontSize: "14px",
                                            marginTop: "4px",
                                            marginBottom: "0",
                                            lineHeight: "1.5",
                                        }}
                                    >
                                        {item.message}
                                    </p>

                                </div>

                                <div
                                    style={{
                                        textAlign: "right",
                                        minWidth: "90px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: "12px",
                                            color: "#94a3b8",
                                            fontWeight: "500",
                                        }}
                                    >
                                        {item.time}
                                    </span>
                                </div>

                            </div>

                        ))

                    )}

                </div>

            </div>
            {/* Activity Logs */}

            <div className="data-panel">

                <div className="panel-header">
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px"
                        }}
                    >
                        <ClipboardList size={20} />
                        <h3>Activity Logs</h3>

                        <span
                            style={{
                                background: "#10b981",
                                color: "white",
                                padding: "2px 10px",
                                borderRadius: "20px",
                                fontSize: "12px"
                            }}
                        >
                            {filteredActivities.length}
                        </span>

                    </div>
                </div>

                <div className="table-wrapper">

                    <table className="directory-table">

                        <thead>

                            <tr>
                                <th>User Role</th>
                                <th>Action</th>
                                <th>Target</th>
                                <th>Time</th>
                            </tr>

                        </thead>

                        <tbody>

                            {filteredActivities.length === 0 ? (

                                <tr>
                                    <td
                                        colSpan="4"
                                        style={{
                                            textAlign: "center",
                                            padding: "30px",
                                        }}
                                    >
                                        <div className="empty-state">
                                            <ClipboardList size={40} />
                                            <h3>No Activity Found</h3>
                                            <p>No actions match your current search.</p>
                                        </div>
                                    </td>
                                </tr>

                            ) : (

                                filteredActivities.map((activity) => (

                                    <tr key={activity.id}>

                                        <td>
                                            <span
                                                style={{
                                                    padding: "6px 12px",
                                                    borderRadius: "20px",
                                                    fontSize: "12px",
                                                    fontWeight: "600",
                                                    backgroundColor:
                                                        activity.user === "Admin"
                                                            ? "#dbeafe"
                                                            : activity.user === "Manager"
                                                                ? "#dcfce7"
                                                                : "#fef3c7",
                                                    color:
                                                        activity.user === "Admin"
                                                            ? "#2563eb"
                                                            : activity.user === "Manager"
                                                                ? "#16a34a"
                                                                : "#ca8a04",
                                                }}
                                            >
                                                {activity.user}
                                            </span>
                                        </td>

                                        <td>
                                            <strong>{activity.action}</strong>
                                        </td>

                                        <td>
                                            <code
                                                style={{
                                                    background: "#f1f5f9",
                                                    padding: "4px 8px",
                                                    borderRadius: "6px",
                                                    color: "#334155",
                                                    fontWeight: "600",
                                                }}
                                            >
                                                {activity.target}
                                            </code>
                                        </td>

                                        <td
                                            style={{
                                                color: "#64748b",
                                                fontSize: "13px",
                                            }}
                                        >
                                            {activity.time}
                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

            </div>
            <div
                style={{
                    textAlign: "center",
                    marginTop: "30px",
                    color: "#94a3b8",
                    fontSize: "13px"
                }}
            >
                <div
                    style={{
                        textAlign: "right",
                        marginTop: 25,
                        fontSize: 13,
                        color: "#64748b"
                    }}
                >

                    Updated at

                    {" "}

                    {currentTime.toLocaleTimeString()}

                </div>
            </div>

        </div>
    );
}