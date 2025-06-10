const { Invoice } = require("../models/Invoice");
const { logger } = require("../utils/logger");

const handleNewSubscriptionEvent = async (event) => {
  logger.info("Processing new subscription event...");

  try {
    const { transactionDetails, subscriptionDetails, user } = event;

    logger.info(`New Subscription Event Received : ${JSON.stringify(event)}`);

    const newInvoice = new Invoice({
      userId: transactionDetails.user,
      transactionId: transactionDetails.transaction._id,
      amount: transactionDetails.transaction.paymentAmount,

      type: "Subscription",
      subscriptionDetails: {
        planName: subscriptionDetails.subscriptionType.name,
        subscriptionTypeId: subscriptionDetails.subscriptionType._id,
        subscriptionId: subscriptionDetails._id,
      },
      user: {
        state: user.state,
        pincode: user.pincode,
        email: user.email,
        phone: user.phone,
        name: user.name,
      },
    });

    await newInvoice.save();
    logger.info("Invoice created successfully.");
  } catch (error) {
    logger.error(
      `Error occurred while processing new subscription event. ${error}`
    );
    throw error;
  }
};

const handleNewRentalEvent = async (event) => {
  logger.info("Processing new Rental event...");

  try {
    const { transactionDetails, rentalDetails, user } = event;

    logger.info(`New Rental Event Received : ${JSON.stringify(event)}`);
    logger.info(`RentalDetails: ${JSON.stringify(rentalDetails)}`);

    const newInvoice = new Invoice({
      userId: transactionDetails.user,
      transactionId: transactionDetails.transaction._id,
      amount: transactionDetails.transaction.paymentAmount,

      type: "Rental",
      rentalDetails: {
        movieId: rentalDetails.movie,
        rentalId: rentalDetails._id,
      },
      user: {
        state: user.state,
        pincode: user.pincode,
        email: user.email,
        phone: user.phone,
        name: user.name,
      },
    });

    await newInvoice.save();
    logger.info("Invoice created successfully.");
  } catch (error) {
    logger.error(
      `Error occurred while processing new subscription event. ${error}`
    );
    throw error;
  }
};

module.exports = { handleNewSubscriptionEvent, handleNewRentalEvent };
