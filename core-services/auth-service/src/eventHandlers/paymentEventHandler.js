const { logger } = require("../utils/logger");
const axios = require("axios");
const mongoose = require("mongoose");
const UserAccessDetails = require("../models/UserAccessDetails");
const { publishEvent } = require("../utils/rabbitmq");
const User = require("../models/User");

// const handleNewUser = async (event) => {
//   logger.info("Processing new user event...");
//   const { userId } = event;
//   try {
//     if (!userId) {
//       logger.warn("Missing userId in the request body.");
//       throw new Error("Missing userId in the request body.");
//     }
//     const freeTypeSubscription = await SubscriptionType.findOne({
//       name: "Free",
//     });

//     const subscription = new mongoose.model("Subscription", {
//       subscriptionType: freeTypeSubscription._id,
//       user: userId,
//       status: "Active",
//       startDate: new Date(),
//       paymentId: null,
//     });
//     await subscription.save();
//     logger.info("Subscription created successfully.");
//     // Publish Event to Auth Service
//     const authEvent = { userId: userId, subscriptionId: subscription._id };
//     await axios.post(
//       `${process.env.AUTH_SERVICE_URL}/api/auth/updatesubscription`,
//       authEvent
//     );
//     logger.info("Event published to Auth Service.");
//   } catch (error) {
//     logger.error("Error processing new user event:", error);
//     throw error;
//   }
// };

const handleNewSubscription = async (event) => {
  logger.info("Processing new subscription event...");
  const { populatedSubscription } = event;
  const subscriptionDetails = populatedSubscription;
  try {
    if (!subscriptionDetails) {
      logger.warn("Missing subscription details in the request body.");
      throw new Error("Missing subscription details in the request body.");
    }
    logger.info(`New Subscription Event Received : ${JSON.stringify(event)}`);

    let userAccessDetails = await UserAccessDetails.findOne({
      userId: subscriptionDetails.user,
    });

    if (!userAccessDetails) {
      userAccessDetails = new UserAccessDetails({
        userId: subscriptionDetails.user,
        subscriptionType: subscriptionDetails.subscriptionType.name,
        subscriptionExpiryDate: subscriptionDetails.endDate,
      });
    } else {
      userAccessDetails.subscriptionType =
        subscriptionDetails.subscriptionType.name;
      userAccessDetails.subscriptionExpiryDate = subscriptionDetails.endDate;
    }

    await userAccessDetails.save();
    logger.info("Subscription Details Updated Successfully.");
    const user = await User.findById(subscriptionDetails.user);
    await publishEvent("subscription.analytics", {
      transactionDetails: event,
      subscriptionDetails,
      user,
    });
  } catch (error) {
    logger.error("Error processing new subscription event:", error);
    throw error;
  }
};

const handleNewRental = async (event) => {
  logger.info("Processing new rental event...");
  const { rental } = event;
  const rentalDetails = rental;
  try {
    if (!rentalDetails) {
      logger.warn("Missing rental details in the request body.");
      throw new Error("Missing rental details in the request body.");
    }
    logger.info(`New Rental Event Received : ${JSON.stringify(event)}`);
    let userAccessDetails = await UserAccessDetails.findOne({
      userId: rentalDetails.user,
    });

    if (!userAccessDetails) {
      userAccessDetails = new UserAccessDetails({
        userId: rentalDetails.user,
        rentals: [
          {
            movieId: rentalDetails.movie,
            rentalExpiryDate: rentalDetails.endDate,
          },
        ],
      });
    } else {
      userAccessDetails.rentals.push({
        movieId: rentalDetails.movie,
        rentalExpiryDate: rentalDetails.endDate,
      });
    }

    await userAccessDetails.save();
    logger.info("Rental Details Updated Successfully.");
    const user = await User.findById(rentalDetails.user);
    await publishEvent("rental.analytics", {
      transactionDetails: event,
      rentalDetails,
      user,
    });
  } catch (error) {
    logger.error("Error processing new rental event:", error);
    throw error;
  }
};

module.exports = { handleNewSubscription, handleNewRental };
