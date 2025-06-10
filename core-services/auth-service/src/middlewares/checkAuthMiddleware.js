const User = require("../models/User");
const Admin = require("../models/Admin");
const { logger } = require("../utils/logger");

const checkAuthMiddleware = async (req, res, next) => {
  logger.info(
    `[Checkauth Middleware Triggered] Received ${req.method} request to ${
      req.url
    }, request body: ${JSON.stringify(
      req.body
    )}, request User : ${JSON.stringify(req.body.user)}`
  );
  const userId = req.body?.user?.userId || req.user?.userId || null;
  if (userId == null) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  if (!userId) {
    logger.warn("[Checkauth Middleware] User ID not found in request body");
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const user = await User.findById(userId);

  if (!user) {
    logger.warn("[Checkauth Middleware] User not found");
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  req.user = user;

  next();
};

const checkAdminAuthMiddleware = async (req, res, next) => {
  logger.info(
    `[Checkauth Admin Middleware Triggered] Received ${req.method} request to ${
      req.url
    }, request body: ${JSON.stringify(
      req.body
    )}, request User : ${JSON.stringify(req.body.user)}`
  );
  const userId = req.body?.user?.userId || req.user?.userId || null;
  if (userId == null) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  if (!userId) {
    logger.warn("[Checkauth Middleware] User ID not found in request body");
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const user = await Admin.findById(userId);

  if (!user) {
    logger.warn("[Checkauth Middleware] Admin User not found");
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  req.user = user;

  next();
};

module.exports = { checkAuthMiddleware, checkAdminAuthMiddleware };
