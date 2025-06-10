const express = require("express");
const {
  sensitiveEndPointsLimiter,
} = require("../middlewares/sensitiveEndpointRatelimiter");

const {
  registerUser,
  loginUser,
  logoutUser,
  getNewTokens,
} = require("../controllers/userController");

const router = express.Router();

// router.post("/register", sensitiveEndPointsLimiter, registerUser);
// router.post("/login", sensitiveEndPointsLimiter, loginUser);
// router.post("/logout", logoutUser);
// router.post("/refresh", getNewTokens);

module.exports = router;
