const User = require("../models/User");

// @desc    Get all users (employee directory)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .populate("department", "name status")
      .sort({ name: 1 });
    return res.json(users);
  } catch (error) {
    console.error("Get All Users Error:", error);
    return res.status(500).json({ message: "Server error fetching employee directory" });
  }
};

// @desc    Update user role (promote/demote) — Admin only via Org Setup Tab C
// @route   PATCH /api/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ["Employee", "Asset Manager", "Department Head", "Admin"];

    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Prevent Admin from removing their own admin role
    if (user._id.toString() === req.user._id.toString() && role !== "Admin") {
      return res.status(400).json({ message: "Admin cannot demote themselves" });
    }

    user.role = role;
    await user.save();

    const updatedUser = await User.findById(user._id)
      .select("-password")
      .populate("department", "name status");

    return res.json({ message: `Role updated to "${role}" successfully`, user: updatedUser });
  } catch (error) {
    console.error("Update User Role Error:", error);
    return res.status(500).json({ message: "Server error updating employee role" });
  }
};

// @desc    Update user status (Active / Inactive)
// @route   PATCH /api/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !["Active", "Inactive"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'Active' or 'Inactive'" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Prevent Admin from deactivating themselves
    if (user._id.toString() === req.user._id.toString() && status === "Inactive") {
      return res.status(400).json({ message: "Admin cannot deactivate their own account" });
    }

    user.status = status;
    await user.save();

    const updatedUser = await User.findById(user._id)
      .select("-password")
      .populate("department", "name status");

    return res.json({ message: `User status set to "${status}"`, user: updatedUser });
  } catch (error) {
    console.error("Update User Status Error:", error);
    return res.status(500).json({ message: "Server error updating user status" });
  }
};

// @desc    Update user department assignment
// @route   PATCH /api/users/:id/department
// @access  Private/Admin
const updateUserDepartment = async (req, res) => {
  try {
    const { departmentId } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.department = departmentId || null;
    await user.save();

    const updatedUser = await User.findById(user._id)
      .select("-password")
      .populate("department", "name status");

    return res.json({ message: "Department updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Update User Department Error:", error);
    return res.status(500).json({ message: "Server error updating department" });
  }
};

module.exports = { getAllUsers, updateUserRole, updateUserStatus, updateUserDepartment };
