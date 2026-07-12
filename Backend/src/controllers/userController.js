const User = require("../models/User");

// @desc    Get all users (directory)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ name: 1 });
    return res.json(users);
  } catch (error) {
    console.error("Get All Users Error:", error);
    return res.status(500).json({ message: "Server error fetching employee directory" });
  }
};

// @desc    Update user role (promote/demote)
// @route   PATCH /api/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ["Employee", "Asset Manager", "Department Head", "Admin"];

    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    const user = await User.findById(req.id || req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent Admin from removing their own admin role to avoid lockout
    if (user._id.toString() === req.user._id.toString() && role !== "Admin") {
      return res.status(400).json({ message: "Admin cannot demote themselves" });
    }

    user.role = role;
    await user.save();

    const updatedUser = await User.findById(user._id).select("-password");

    return res.json({
      message: `User role updated successfully to ${role}`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update User Role Error:", error);
    return res.status(500).json({ message: "Server error updating employee role" });
  }
};

module.exports = { getAllUsers, updateUserRole };
