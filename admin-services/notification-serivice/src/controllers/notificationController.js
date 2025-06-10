// const moment = require("moment");
// var admin = require("firebase-admin");
// var fcm = require("fcm-notify");
// var serviceAccount = require("../credentials/nandipictures-34c07-firebase-adminsdk-fbsvc-797cfc3a56.json");
// const certPath = admin.credential.cert(serviceAccount);
// var FCM = new fcm(certPath);
// require("dotenv").config();
// const axios = require("axios");
// const {logger} = require("../utils/logger");
// const cron = require("node-cron");

// // var Tokens = [
// //   "dJ-dOv7wSjGSBX8jJE5VJj:APA91bEj5POCqOLqc3153J3xjs0ShXSOAe_za_2WBun8foXxntA2OwomxXYx0COcEizQPvRc3FSqgSBppmpMUGErvomQrtecRY2nsU3eYA-rtsOrPobIueg",
// //   "fDS5_iV9QIW2qiagIp8mA8:APA91bGSs_v6unu6HiFGHOAzqug7HPSZAxIIgnmypYoL7fAAtqy3emlimK3Li6RXhiTCyihb1TGiKFHLKM8p9XTARBan0xr2hIvkikJ9VkH_5fIsuc-VGmo",
// // ];

// const AUTH_URL = process.env.AUTH_SERVICE_URL;

// // Function to schedule the push notification
// exports.schedulePushNotification = async (req, res, next) => {
//   let tokens = [];
//   const { date, time, title, message, pinCode } = req.body;

//   // Ensure that all required fields are provided
//   if (!date || !time || !title || !message) {
//     return res
//       .status(400)
//       .json("Missing required fields (date, time, title, message).");
//   }

//   // Combine the date and time into a single valid ISO format string
//   // Assume date is something like "Thu Apr 17 2025" and time is "11:30"
//   const combinedDateTime = `${date} ${time}`;

//   // Check if the combined string is a valid moment date
//   const scheduleTime = moment(combinedDateTime, "ddd MMM DD YYYY HH:mm");

//   if (!scheduleTime.isValid()) {
//     return res.status(400).json("Invalid date and time format.");
//   }

//   // Get the current time and check if the scheduled time is in the future
//   const now = moment().seconds(0).milliseconds(0);
//   if (scheduleTime.isBefore(now)) {
//     return res.status(400).json("Scheduled time must be in the future.");
//   }

//   // Calculate the delay in milliseconds
//   // const delayInMilliseconds = scheduleTime.diff(now, "milliseconds");

//   // Log the scheduling details for debugging
//   console.log(
//     `Scheduling push notification for: ${scheduleTime.format(
//       "YYYY-MM-DD HH:mm:ss"
//     )}`
//   );

//   // Fetch device tokens from auth service
//   if (!pinCode) {
//     // Fetch all deviceTokens
//     const response = await axios.get(
//       `${AUTH_URL}/api/auth/admin/device-tokens`
//     );
//     // Map through response.data.tokens and push to tokens array
//     response.data.tokens.forEach((token) => {
//       // check if token is not empty
//       if(token.deviceToken){
//         tokens.push(token.deviceToken);
//       }
//     });
//   } else {
//     // Fetch deviceTokens for specific pinCode
//     const response = await axios.get(
//       `${AUTH_URL}/api/auth/admin/device-tokens?pinCode=${pinCode}`
//     );
//     // Map through response.data.tokens and push to tokens array
//     response.data.tokens.forEach((token) => {
//       if(token.deviceToken) {
//       tokens.push(token.deviceToken);
//       }
//     });
//   }
//   logger.info(`Fetched Tokens : ${tokens}`);

//   let delayInMilliseconds = scheduleTime.diff(now, "milliseconds");
//   if(delayInMilliseconds<=0) {
//     delayInMilliseconds = 5
//   }
//   // Use setTimeout to schedule the notification
//   // setTimeout(() => {
//   //   // Your push notification logic here
//   //   sendPushNotification(title, message, res);
//   // }, delayInMilliseconds);

//   sendPushNotification(title, message,tokens, res);
//   // Confirm the job was scheduled
//   return res.status(200).json({
//     success: true,
//     message: `Push notification scheduled for ${scheduleTime.format(
//       "YYYY-MM-DD HH:mm:ss"
//     )}`,
//   });
// };

// // Your existing function to send the push notification (e.g., sendPushNotification)
// const sendPushNotification = (title, message,tokens, res) => {
//   // Logic to send the notification (same as before)
//   const messageObj = {
//     notification: {
//       title: title,
//       body: message,
//     },
//     data: {
//       orderId: "12345", // Example static data, can be dynamic if needed
//       orderDate: "2025-04-16", // Example static data, can be dynamic if needed
//     },
//   };

//   logger.info(`Attempting to send notification with title: ${title} and message: ${message}`);

//   // Send the notification (using FCM or another service)
//   FCM.sendToMultipleToken(messageObj, tokens, function (err, resp) {
//     if (err) {
//       // return res.status(500).json({ message: err });
//       console.error("Error sending push notification:", err);
//     }

//     console.log("Push notification sent successfully:", resp);
//     // else {
//     // //   return res.status(200).send({
//     // //     // message: "Notification sent"
//     // //   });
//     // }
//   });
// };


const moment = require("moment");
var admin = require("firebase-admin");
var fcm = require("fcm-notify");
var serviceAccount = require("../credentials/nandipictures-34c07-firebase-adminsdk-fbsvc-797cfc3a56.json");
const certPath = admin.credential.cert(serviceAccount);
var FCM = new fcm(certPath);
require("dotenv").config();
const axios = require("axios");
const { logger } = require("../utils/logger");
const cron = require("node-cron");
const AUTH_URL = process.env.AUTH_SERVICE_URL;

// Function to schedule the push notification
exports.schedulePushNotification = async (req, res, next) => {
  let tokens = [];
  const { date, time, title, message, pinCode } = req.body;

  logger.info(`request Body : ${JSON.stringify(req.body)}`);

  // Ensure that all required fields are provided
  if (!date || !time || !title || !message) {
    return res
      .status(400)
      .json("Missing required fields (date, time, title, message).");
  }

  // Combine the date and time into a single valid ISO format string
  const combinedDateTime = `${date} ${time}`;

  // Check if the combined string is a valid moment date
  const scheduleTime = moment(combinedDateTime, "ddd MMM DD YYYY HH:mm");

  if (!scheduleTime.isValid()) {
    return res.status(400).json("Invalid date and time format.");
  }

  // Get the current time and check if the scheduled time is in the future
  const now = moment().seconds(0).milliseconds(0);
  if (scheduleTime.isBefore(now)) {
    return res.status(400).json("Scheduled time must be in the future.");
  }

  // Log the scheduling details for debugging
  console.log(
    `Scheduling push notification for: ${scheduleTime.format(
      "YYYY-MM-DD HH:mm:ss"
    )}`
  );

  // Fetch device tokens from auth service
  if (!pinCode) {
    // Fetch all deviceTokens
    const response = await axios.get(`${AUTH_URL}/api/auth/admin/device-tokens`);
    // Map through response.data.tokens and push to tokens array
    response.data.tokens.forEach((token) => {
      if (token.deviceToken) {
        tokens.push(token.deviceToken);
      }
    });
  } else {
    // Fetch deviceTokens for specific pinCode
    const response = await axios.get(
      `${AUTH_URL}/api/auth/admin/device-tokens?pinCode=${pinCode}`
    );
    // Map through response.data.tokens and push to tokens array
    response.data.tokens.forEach((token) => {
      if (token.deviceToken) {
        tokens.push(token.deviceToken);
      }
    });
  }
  logger.info(`Fetched Tokens : ${tokens}`);

  // Convert the scheduled time into a cron expression
  const cronTime = scheduleTime.format("m H D M *");
  logger.info(`Cron Job Set for Crontime: ${cronTime}`);
  const curdate = new Date().toString();
  logger.info(`Current Timezone : ${curdate}`)

  // Use node-cron to schedule the notification
  cron.schedule(cronTime, () => {
    logger.info(`Executing cron job `);
    // Send the push notification at the scheduled time
    sendPushNotification(title, message, tokens);
  },
{
  scheduled: true,
  timezone: "Asia/Kolkata"
});

  // Confirm the job was scheduled
  return res.status(200).json({
    success: true,
    message: `Push notification scheduled for ${scheduleTime.format(
      "YYYY-MM-DD HH:mm:ss"
    )}`,
  });
};

// Function to send the push notification
const sendPushNotification = (title, message, tokens) => {
  // Logic to send the notification (same as before)
  const messageObj = {
    notification: {
      title: title,
      body: message,
    },
    data: {
      orderId: "12345", // Example static data
      orderDate: "2025-04-16", // Example static data
    },
  };

  logger.info(`Attempting to send notification with title: ${title} and message: ${message}`);

  // Send the notification (using FCM or another service)
  FCM.sendToMultipleToken(messageObj, tokens, function (err, resp) {
    if (err) {
      console.error("Error sending push notification:", err);
      // Log the error, no need to send a response to the client here
    }

    console.log("Push notification sent successfully:", resp);
    // Log the response, no need to send a response to the client here
  });
};
