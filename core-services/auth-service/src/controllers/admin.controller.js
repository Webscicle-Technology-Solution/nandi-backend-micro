const Admin = require("../models/Admin");
const { logger } = require("../utils/logger");
const { generateAdminTokens, generateAt } = require("../utils/generateToken");
// Validation Import TBD
const AdminRefreshToken = require("../models/AdminRefreshToken");
const { validateLogin, validateRefreshToken } = require("../utils/validation");

const registerAdmin = async (req, res) => {
  logger.info("Registering new admin");
  try {
    // Check if user has permissions to register new admin
    logger.info(`Received Admin User : ${JSON.stringify(req.user)}`);
    const user = await Admin.findById(req.user._id);
    if(!user) {
      return res.status(401).json({ message: "user not logged in" });
    }

    if (!user.permissions?.isSuperAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    // Check if email already exists
    const existingAdmin = await Admin.findOne({
      email: req.body.email,
    });
    if (existingAdmin) {
      return res.status(409).json({ message: "Email already exists" });
    }
    // Check if all data is given
    if (
      !req.body.name ||
      !req.body.email ||
      !req.body.password ||
      !req.body.permissions
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }
    // Create new admin
    const newAdmin = new Admin({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      permissions: req.body.permissions,
    });
    // Save new admin to database
    await newAdmin.save();

    return res.status(201).json({ success: true, message: "Admin registered successfully" });
  } catch (error) {
    logger.error("Error registering new admin", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const loginAdmin = async (req, res) => {
  logger.info("Logging in admin");
  try {
    // Validate login data
    const { error } = validateLogin(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const admin = await Admin.findOne({ email: req.body.email }).select(
      "+password"
    );
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Validate Password
    const isMatch = await admin.comparePassword(req.body.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate Tokens
    const { accessToken, refreshToken } = await generateAdminTokens(admin._id);
    logger.info(`Generated Tokens for Admin ${admin._id} as : ${refreshToken}`);
    return res.status(200).json({
      success: true,
      message: "Logged In Successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("Error logging in admin", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const checkAdminAuth = async (req, res) => {
  logger.info("Check Admin Auth Endpoint Hit...");
  try {
    if (!req.user) {
      // Check if RT Exists
      const { error } = validateRefreshToken(req.body);
      if (error) {
        logger.warn("[Check Auth] Validation Error", error.details[0].message);
        return res
          .status(401)
          .json({ success: false, message: "Invalid Refresh Token" });
      }

      const { refreshToken } = req.body;

      const storedToken = await AdminRefreshToken.findOne({
        token: refreshToken,
      });
      console.log(
        `Checking received RefreshToken ${refreshToken}, stored Token : ${storedToken}`
      );
      if (!storedToken || storedToken.expiresAt < Date.now()) {
        logger.warn("[Check Auth] Expired Refresh Token");
        return res
          .status(401)
          .json({ success: false, message: "Expired Refresh Token" });
      }

      const user = await Admin.findById(storedToken.user);

      if (!user) {
        logger.warn("[Check Auth] User not found");
        return res
          .status(401)
          .json({ success: false, message: "User not found" });
      }

      // Generate new tokens
      const accessToken = await generateAt(user);
      // Extend expiry of RT by 30 days
      await AdminRefreshToken.findOneAndUpdate(
        { user: user._id },
        { expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
      );

      return res.status(200).json({
        success: true,
        message: "Tokens Refreshed Successfully",
        accessToken,
        user,
      });
    }
    if (req.user) {
      logger.info("[Check Auth] Admin logged in successfully", req.user._id);
      // Extend RT Expiry by 30Days
      await AdminRefreshToken.findOneAndUpdate(
        { user: req.user._id },
        { expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
      );
      // Generate new AT and RT
      const accessToken = await generateAt(req.user);
      return res.status(200).json({
        success: true,
        message: "Tokens Refreshed Successfully",
        accessToken,
        user: req.user,
      });
    }
  } catch (error) {
    logger.warn("[Check Auth] Error Occured", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// User Logout
const logoutAdmin = async (req, res) => {
  logger.info("Logout Endpoint Hit...");
  try {
    const { error } = validateRefreshToken(req.body);
    if (error) {
      logger.warn("[Admin Logout] Validation Error", error.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: "Invalid Refresh Token" });
    }

    const refreshToken = req.body.refreshToken;
    const user = await AdminRefreshToken.findOne({ token: refreshToken });
    if (!user) {
      logger.warn("[Admin Logout] Invalid Refresh Token");
      return res
        .status(400)
        .json({ success: false, message: "Invalid Refresh Token" });
    }

    await AdminRefreshToken.deleteOne({ token: refreshToken });
    logger.info("[Admin Logout] Admin logged out successfully", user._id);
    return res.status(200).json({ success: true, message: "Logged Out" });
  } catch (error) {
    logger.info("[Admin Logout] Error Occured", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const getAllAdmins = async (req, res) => {
  logger.info("Get All Admins Endpoint Hit...");
  try {
    const admins = await Admin.find({}).select("-password");
    return res.status(200).json({ success: true, admins });
  } catch (error) {
    logger.error("[Get All Admins] Error Occured", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const editAdminDetails = async (req, res) => {
  logger.info("Edit Admin Details Endpoint Hit...");
  try {
    const user = await Admin.findById(req.user._id);
    
    if (!user.permissions?.isSuperAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const { adminId } = req.params;
    const { name, password, permissions } = req.body;
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    if (name) {
      admin.name = name;
    }
    if (password) {
      admin.password = password;
    }
    if (permissions) {
      admin.permissions = permissions;
    }
    await admin.save();
    return res.status(200).json({ success: true, message: "Admin updated" });
  } catch (error) {
    logger.error("[Edit Admin] Error Occured", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  registerAdmin,
  loginAdmin,
  checkAdminAuth,
  logoutAdmin,
  getAllAdmins,
  editAdminDetails,
};
