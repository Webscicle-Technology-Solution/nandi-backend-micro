const { logger } = require("../utils/logger");
const jwt = require("jsonwebtoken");

const validateAPIKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  const token = authHeader && authHeader.split(" ")[1]; //split bearer and get token
  if (!token) {
    logger.warn(`Access attempt without valid token!`);
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn(`Invalid token!`);
      return res
        .status(429)
        .json({ success: false, message: "Authentication failed" });
    }

    req.user = user;
    next();
  });
};

const authUser = (req, res, next) => {
  req.body.user = null;
  const authHeader = req.headers["authorization"];
  // logger.info(`Auth Header : ${authHeader}`);
  const token = authHeader && authHeader.split(" ")[1]; // Split bearer and get token
  // const token = (authHeader && authHeader.split(" ")[1])
  //   ?.replace(/^"|"$/g, "")
  //   .trim();

  // logger.info(`Processed Token : ${token}`);
  if (!token) {
    // No token, proceed without setting user
    req.user = null;
    logger.warn("No user token found! Proceeding without login");
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      // Token invalid, proceed without setting user
      logger.warn("Invalid user token found! Proceeding without login", err);
      req.user = null;
    } else {
      // Token valid, set user details
      logger.info(
        `User token found! User ID : ${user.userId}, user: ${JSON.stringify(
          user
        )}`
      );
      req.user = user;
      req.body.user = user;
      req.acceessToken = token;
    }

    // Continue with request processing
    return next();
  });
};

module.exports = { authUser };
