const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const RefreshToken = require("../models/RefreshToken");
const AdminRefreshToken = require("../models/AdminRefreshToken");
const { logger } = require("../utils/logger");

const generateTokens = async (user) => {
  const accessToken = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "60m" }
  );

  // { expiresIn: "15m" }

  const refreshToken = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); //RT Expires in 30 Days

  // Delete old refreshtoken if it exists for user
  await RefreshToken.findOneAndDelete({ user: user._id });

  await RefreshToken.create({
    token: refreshToken,
    user: user._id,
    expiresAt,
  });
  logger.info(
    `Created Refresh Token for user ${user._id} as : ${refreshToken}`
  );

  return { accessToken, refreshToken, expiresAt };
};

const generateAt = async (user) => {
  const accessToken = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
  return accessToken;
};

// Admin
const generateAdminTokens = async (user) => {
  
  const accessToken = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "60m" }
  );

  // { expiresIn: "15m" }

  const refreshToken = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); //RT Expires in 30 Days

  // Delete old refreshtoken if it exists for user
  await AdminRefreshToken.findOneAndDelete({ user: user._id });

  await AdminRefreshToken.create({
    token: refreshToken,
    user: user._id,
    expiresAt,
  });
  logger.info(
    `Created Refresh Token for Admin ${user._id} as : ${refreshToken}`
  );

  return { accessToken, refreshToken, expiresAt };
};

module.exports = { generateTokens, generateAt, generateAdminTokens };
