// const express = require("express");
// const { sendFireBaseNotification, sendMultipleFireBaseNotification } = require("../controllers/notificationController");
// const { getDeviceTokensByPincode } = require("../utils/deviceToken");

// const router = express.Router();

// // router.post("/send-notification", async (req, res)=> {
// //     const result = await sendFireBaseNotification(req, res);
// //     return res.send(result);
// // })

// const NotificationScheduler = require("../utils/notificationScheduler");
// // router.post("/send-notification", async (req, res) => {
// //     const { deviceToken, pincode, schedule } = req.body;

// //     const scheduleAt = schedule && schedule !== 'Send Now' ? new Date(schedule) : null;

// //     const sendFn = async () => {
// //       if (deviceToken) {
// //         return await sendFireBaseNotification({ body: req.body }, res);
// //       } else if (pincode) {
// //         // Look up tokens by pincode from DB
// //         const tokens = await getDeviceTokensByPincode(pincode); // your function
// //         if (tokens.length === 0) {
// //           return res.status(404).json({ success: false, message: "No users found for this pincode" });
// //         }
// //         return await sendMultipleFireBaseNotification({ body: { ...req.body, deviceTokens: tokens } }, res);
// //       } else {
// //         return res.status(400).json({ success: false, message: "No deviceToken or pincode provided" });
// //       }
// //     };

// //     if (scheduleAt && scheduleAt > new Date()) {
// //       NotificationScheduler.scheduleNotification(req.body, scheduleAt, sendFn);
// //       return res.json({ success: true, message: "Notification scheduled" });
// //     } else {
// //       return await sendFn();
// //     }
// //   });
// router.post("/send-notification", async (req, res) => {
//   const { deviceToken, deviceTokens, pincode, schedule } = req.body;

//   const scheduleAt = schedule && schedule !== 'Send Now' ? new Date(schedule) : null;

//   const sendFn = async () => {
//     if (deviceTokens && deviceTokens.length > 0) {
//       return await sendMultipleFireBaseNotification({ body: req.body }, res);
//     } else if (deviceToken) {
//       return await sendFireBaseNotification({ body: req.body }, res);
//     } else if (pincode) {
//       const tokens = await getDeviceTokensByPincode(pincode);
//       if (tokens.length === 0) {
//         return res.status(404).json({ success: false, message: "No users found for this pincode" });
//       }
//       return await sendMultipleFireBaseNotification({ body: { ...req.body, deviceTokens: tokens } }, res);
//     } else {
//       return res.status(400).json({ success: false, message: "No deviceToken, deviceTokens, or pincode provided" });
//     }
//   };

//   if (scheduleAt && scheduleAt > new Date()) {
//       NotificationScheduler.scheduleNotification(req.body, scheduleAt, sendFn);
//       return res.json({ success: true, message: "Notification scheduled" });
//   } else {
//       return await sendFn(); // send immediately
//   }
// });

// router.post("/send-multiple-notification", async (req, res)=> {
//     const result = await sendMultipleFireBaseNotification(req, res);
//     return res.send(result);
// })

// module.exports = router;

const {
  schedulePushNotification,
} = require("../controllers/notificationController");
const express = require("express");
const router = express.Router();

router.post("/sendnotification", schedulePushNotification);
module.exports = router;
