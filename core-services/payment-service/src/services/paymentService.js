const axios = require("axios");
const sha256 = require("sha256");
const { logger } = require("../utils/logger");
const cron = require("node-cron");
const Transaction = require("../models/Transactions");
const Subscription = require("../models/Subscriptions");
const Rental = require("../models/Rental");

const { publishEvent } = require("../utils/rabbitmq");

const PHONE_PE_HOST_URL = process.env.PHONE_PE_HOST_URL;
const MERCHANT_ID = process.env.PHONE_PE_MERCHANT_ID;
const SALT_KEY = process.env.PHONE_PE_SALT_KEY;
const SALT_INDEX = process.env.PHONE_PE_SALT_INDEX;
const activeCronJobs = new Map();

const generateXVerify = (endpoint, saltKey, saltIndex) => {
  return sha256(endpoint + saltKey) + "###" + saltIndex;
};

const fetchPaymentStatus = async (transactionId) => {
  const statusEndpoint = `/pg/v1/status/${MERCHANT_ID}/${transactionId}`;
  const xVerify = generateXVerify(statusEndpoint, SALT_KEY, SALT_INDEX);
  const options = {
    method: "get",
    url: `${PHONE_PE_HOST_URL}${statusEndpoint}`,
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      "X-VERIFY": xVerify,
      "X-MERCHANT-ID": MERCHANT_ID,
    },
  };

  try {
    const response = await axios(options);
    return response.data;
  } catch (error) {
    logger.warn("[Fetch Payment Status] Error Occured", error);
    return null;
  }
};

const initiatePayment = async ({
  amount,
  redirectUrl,
  merchantTransactionId,
  merchantUserId,
  message,
}) => {
  // Print all env variables
  // logger.info(`PHONE_PE_HOST_URL: ${PHONE_PE_HOST_URL}`, {
  //   MERCHANT_ID,
  //   SALT_KEY,
  //   SALT_INDEX,
  // });
  const payEndpoint = "/pg/v1/pay";
  const payload = {
    merchantId: MERCHANT_ID,
    merchantTransactionId,
    merchantUserId,
    amount,
    redirectUrl,
    message,
    paymentInstrument: {
      type: "PAY_PAGE",
    },
  };

  // logger.info(`[Initiate Payment] Payload: ${JSON.stringify(payload)}`);

  const base64EncodedPayload = Buffer.from(
    JSON.stringify(payload),
    "utf8"
  ).toString("base64");

  const xVerify = generateXVerify(
    base64EncodedPayload + payEndpoint,
    SALT_KEY,
    SALT_INDEX
  );

  const options = {
    method: "POST",
    url: `${PHONE_PE_HOST_URL}${payEndpoint}`,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "X-VERIFY": xVerify,
    },
    data: { request: base64EncodedPayload },
  };

  try {
    const response = await axios(options);
    // logger.info(
    //   `[Initiate Payment] Response: ${JSON.stringify(response.data)}`
    // );
    if (response.data.success) {
      const paymentUrl = response.data.data.instrumentResponse.redirectInfo.url;
      // Schedule payment check
      schedulePaymentStatusCheck(merchantTransactionId);
      return { response: response.data, paymentUrl, success: true };
    } else {
      logger.warn(
        `[Initiate Payment] Payment failed for transaction ${merchantTransactionId}. Error: ${response.data}`
      );
      return { response: response.data, success: false };
    }
  } catch (error) {
    logger.warn("[Initiate Payment] Error Occured", error);
    return { response: error, success: false };
  }
};

// Helper function to update transaction and create subscription if needed
const updateTransactionAndCreateSubscription = async (
  transaction,
  paymentStatus
) => {
  if (paymentStatus.success && paymentStatus.code === "PAYMENT_SUCCESS") {
    logger.info(
      `[Payment Status Check] Payment completed or successful for transaction ${transaction._id}`
    );
    // Update Transaction
    transaction.status = "Confirmed";
    transaction.confirmedDate = new Date();

    // Check if transaction is for subscription and create one
    if (transaction.type === "SubscriptionType") {
      const subscription = new Subscription({
        user: transaction.user,
        subscriptionType: transaction.typeId,
        startDate: transaction.confirmedDate,
        endDate: new Date(
          transaction.confirmedDate.getTime() + 30 * 24 * 60 * 60 * 1000 // 30 days
        ),
        status: "Active",
        paymentId: transaction._id,
      });

      await subscription.save();
      logger.info(
        `[Payment Status Check] Subscription created for transaction ${transaction._id}`
      );
      const populatedSubscription = await Subscription.findById(
        subscription._id
      ).populate("subscriptionType");
      await publishEvent("subscription.created", {
        populatedSubscription,
        transaction,
      });
    } else if (transaction.type === "Rental") {
      logger.info(
        `[Payment Status Check] Creating Rental for transaction ${transaction._id} with movieId: ${transaction.typeId}`
      );
      const rental = new Rental({
        user: transaction.user,
        movie: transaction.typeId,
        startDate: transaction.confirmedDate,
        endDate: new Date(
          transaction.confirmedDate.getTime() + 24 * 60 * 60 * 1000 // 24 Hours
        ),
        status: "Active",
        paymentId: transaction._id,
      });

      await rental.save();
      logger.info(
        `[Payment Status Check] Rental created for transaction ${transaction._id}`
      );
      await publishEvent("rental.created", { rental, transaction });
    }

    await transaction.save();
    return true; // Successful payment and update
  }
  return false; // Payment failed or not successful
};

// // Function to handle the payment status check logic
// const handlePaymentStatusCheck = async (transactionId, checkCount) => {
//   const transaction = await Transaction.findById(transactionId).populate(
//     "typeId"
//   );

//   logger.info(
//     `[Payment Status Check] Checking status for transaction ${transactionId} (Attempt #${
//       checkCount + 1
//     })`
//   );

//   // Before checking payment status, check the transaction status
//   if (transaction.status !== "Pending") {
//     logger.info(
//       `[Payment Status Check] Transaction ${transactionId} is already ${transaction.status}. Stopping the cron job.`
//     );
//     checkCount = 100;
//     cron.stop(); // Stop the cron job if the transaction is not pending
//     return true;
//   }

//   // Proceed with fetching payment status if the transaction is still pending
//   const paymentStatus = await fetchPaymentStatus(transactionId);
//   if (paymentStatus) {
//     logger.info(
//       `[Payment Status Check] Payment Status: ${JSON.stringify(paymentStatus)}`
//     );

//     // Update the transaction and create subscription if payment is successful
//     const isSuccessful = await updateTransactionAndCreateSubscription(
//       transaction,
//       paymentStatus
//     );

//     // Stop the cron job if payment is successful
//     if (isSuccessful) {
//       logger.info(
//         `[Payment Status Check] Payment successful for transaction ${transactionId}`
//       );
//       cron.stop(); // Stop cron job if payment is successful
//       return true;
//     }
//     // Handle payment failure
//     else if (
//       paymentStatus.success &&
//       (paymentStatus.code === "PAYMENT_DECLINED" ||
//         paymentStatus.code === "TIMED_OUT" ||
//         paymentStatus.code === "PAYMENT_ERROR")
//     ) {
//       logger.info(
//         `[Payment Status Check] Payment failed for transaction ${transactionId}`
//       );
//       // Update Transaction status to "Cancelled"
//       transaction.status = "Cancelled";
//       await transaction.save();
//       cron.stop(); // Stop cron job if payment failed
//       return true;
//     } else if (
//       paymentStatus.success &&
//       paymentStatus.code === "PAYMENT_PENDING"
//     ) {
//       return false;
//     }
//   }
//   return true;
// };

// // Function to schedule the cron job for payment status checks
// const schedulePaymentStatusCheck = async (transactionId) => {
//   let checkCount = 0;

//   // First check after 20 seconds
//   cron.schedule("*/20 * * * * *", async () => {
//     if (checkCount === 0) {
//       const result = await handlePaymentStatusCheck(transactionId, checkCount);
//       checkCount++;
//       if (result) {
//         cron.stop();
//         checkCount = 100;
//       }
//     }
//   });

//   // Next check every 3 seconds for the next 30 seconds
//   cron.schedule("*/3 * * * * *", async () => {
//     if (checkCount > 0 && checkCount <= 10) {
//       const result = await handlePaymentStatusCheck(transactionId, checkCount);
//       checkCount++;
//       if (result) {
//         cron.stop();
//         checkCount = 100;
//       }
//     }
//   });

//   // Next check every 6 seconds for the next 60 seconds
//   cron.schedule("*/6 * * * * *", async () => {
//     if (checkCount > 10 && checkCount <= 20) {
//       const result = await handlePaymentStatusCheck(transactionId, checkCount);
//       checkCount++;
//       if (result) {
//         cron.stop();
//         checkCount = 100;
//       }
//     }
//   });

//   // Next check every 10 seconds for the next 60 seconds
//   cron.schedule("*/10 * * * * *", async () => {
//     if (checkCount > 20 && checkCount <= 30) {
//       const result = await handlePaymentStatusCheck(transactionId, checkCount);
//       checkCount++;
//       if (result) {
//         cron.stop();
//         checkCount = 100;
//       }
//     }
//   });

//   // Next check every 30 seconds for the next 60 seconds
//   cron.schedule("*/30 * * * * *", async () => {
//     if (checkCount > 30 && checkCount <= 40) {
//       const result = await handlePaymentStatusCheck(transactionId, checkCount);
//       checkCount++;
//       if (result) {
//         cron.stop();
//         checkCount = 100;
//       }
//     }
//   });

//   // Final check every 1 minute (60 seconds) until timeout (20 minutes)
//   cron.schedule("*/60 * * * * *", async () => {
//     if (checkCount > 40 && checkCount <= 60) {
//       const result = await handlePaymentStatusCheck(transactionId, checkCount);
//       checkCount++;
//       if (result) {
//         cron.stop();
//         checkCount = 100;
//       }
//     } else {
//       cron.stop(); // Stop after reaching timeout (20 minutes or 60 checks)
//     }
//   });
// };

// Function to handle the payment status check logic
const handlePaymentStatusCheck = async (transactionId, checkCount) => {
  const transaction = await Transaction.findById(transactionId);

  // logger.info(`Populated Transaction: ${JSON.stringify(transaction)}`);

  logger.info(
    `[Payment Status Check] Checking status for transaction ${transactionId} (Attempt #${
      checkCount + 1
    })`
  );

  if (transaction.status !== "Pending") {
    logger.info(
      `[Payment Status Check] Transaction ${transactionId} is already ${transaction.status}. Stopping the cron job.`
    );
    stopCronJob(transactionId);
    return true;
  }

  const paymentStatus = await fetchPaymentStatus(transactionId);
  if (paymentStatus) {
    logger.info(
      `[Payment Status Check] Payment Status: ${JSON.stringify(paymentStatus)}`
    );

    const isSuccessful = await updateTransactionAndCreateSubscription(
      transaction,
      paymentStatus
    );

    if (isSuccessful) {
      logger.info(
        `[Payment Status Check] Payment successful for transaction ${transactionId}`
      );
      stopCronJob(transactionId);
      return true;
    }
    //  else {
    //   logger.info(
    //     `[Payment Status Check] Payment failed for transaction ${transactionId}`
    //   );
    //   transaction.status = "Cancelled";
    //   await transaction.save();
    //   stopCronJob(transactionId);
    //   return true;
    // }

    if (
      paymentStatus.code === "PAYMENT_DECLINED" ||
      paymentStatus.code === "TIMED_OUT" ||
      paymentStatus.code === "PAYMENT_ERROR"
    ) {
      logger.info(
        `[Payment Status Check] Payment failed for transaction ${transactionId}`
      );
      transaction.status = "Cancelled";
      await transaction.save();
      stopCronJob(transactionId);
      return true;
    }
  }
  return false;
};

// Function to schedule the cron job for payment status checks
const schedulePaymentStatusCheck = async (transactionId) => {
  let checkCount = 0;
  const cronJobs = [];

  const scheduleJob = (interval, limit) => {
    const job = cron.schedule(interval, async () => {
      if (checkCount <= limit) {
        const result = await handlePaymentStatusCheck(
          transactionId,
          checkCount
        );
        checkCount++;
        if (result) {
          stopCronJob(transactionId);
        }
      }
    });
    cronJobs.push(job);
  };

  scheduleJob("*/20 * * * * *", 0);
  scheduleJob("*/3 * * * * *", 10);
  scheduleJob("*/6 * * * * *", 20);
  scheduleJob("*/10 * * * * *", 30);
  scheduleJob("*/30 * * * * *", 40);
  scheduleJob("*/60 * * * * *", 60);

  activeCronJobs.set(transactionId, cronJobs);
};

const stopCronJob = (transactionId) => {
  if (activeCronJobs.has(transactionId)) {
    activeCronJobs.get(transactionId).forEach((job) => job.stop());
    activeCronJobs.delete(transactionId);
    logger.info(
      `[Payment Status Check] Stopped cron job for transaction ${transactionId}`
    );
  }
};

module.exports = { schedulePaymentStatusCheck, initiatePayment };
