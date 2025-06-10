const { logger } = require("../utils/logger");
const axios = require("axios");
const mongoose = require("mongoose");
const SubscriptionType = require("../models/SubscriptionTypes");

const handleNewUser = async (event) => {
  logger.info("Processing new user event...");
  const { userId } = event;
  try {
    if (!userId) {
      logger.warn("Missing userId in the request body.");
      throw new Error("Missing userId in the request body.");
    }
    const freeTypeSubscription = await SubscriptionType.findOne({
      name: "Free",
    });

    const subscription = new mongoose.model("Subscription", {
      subscriptionType: freeTypeSubscription._id,
      user: userId,
      status: "Active",
      startDate: new Date(),
      paymentId: null,
    });
    await subscription.save();
    logger.info("Subscription created successfully.");
    // Publish Event to Auth Service
    const authEvent = { userId: userId, subscriptionId: subscription._id };
    await axios.post(
      `${process.env.AUTH_SERVICE_URL}/api/auth/updatesubscription`,
      authEvent
    );
    logger.info("Event published to Auth Service.");
  } catch (error) {
    logger.error("Error processing new user event:", error);
    throw error;
  }
};

module.exports = { handleNewUser };
