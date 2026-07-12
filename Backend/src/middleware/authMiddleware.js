const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
   
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallbacksecret123");

      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        return res.status(401).json({ message: "Not authorized, user not found" });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "Admin") {
    next();
  } else {
    return res.status(403).json({ message: "Access denied. Admin role required." });
  }
};

const managerOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === "Admin" || req.user.role === "Asset Manager")) {
    next();
  } else {
    return res.status(403).json({ message: "Access denied. Admin or Asset Manager role required." });
  }
};

const managerOrDeptHead = (req, res, next) => {
  const allowed = ["Admin", "Asset Manager", "Department Head"];
  if (req.user && allowed.includes(req.user.role)) {
    next();
  } else {
    return res.status(403).json({ message: "Access denied. Manager or Department Head required." });
  }
};

module.exports = { protect, adminOnly, managerOrAdmin, managerOrDeptHead };
