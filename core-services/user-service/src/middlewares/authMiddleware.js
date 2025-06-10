const { logger } = require("../utils/logger");

const authMiddleware = (req, res, next) => {
  if (!req.user) {
    logger.warn("User not authenticated");
    return res
      .status(402)
      .json({ success: false, message: "User not authenticated" });
  }
  next();
};

module.exports = { authMiddleware };
