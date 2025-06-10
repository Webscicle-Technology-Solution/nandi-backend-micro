const User = require("../models/User");
const { logger } = require("../utils/logger");

const getUserProfile = async (req, res) => {
  logger.info("Get User Profile Endpoint Hit...");

  try {
    const user = await User.findOne({ userId: req.user.userId });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    } else {
      return res.status(200).json({ success: true, data: user });
    }
  } catch (error) {
    logger.error("[Get User Profile] Error Occured", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = { getUserProfile };
