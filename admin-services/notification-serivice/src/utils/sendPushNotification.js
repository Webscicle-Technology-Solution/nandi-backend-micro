// const admin = require("../config/firebaseConfig");

// const sendPushNotification = async (tokens, message) => {
//   const payload = {
//     notification: {
//       title: "Notification",
//       body: message,
//     },
//   };

//   try {
//     const response = await admin.messaging().sendToDevice(tokens, payload);
//     console.log("✅ Notifications sent:", response.successCount);
//   } catch (error) {
//     console.error("❌ FCM Error:", error);
//   }
// };

// module.exports = sendPushNotification;