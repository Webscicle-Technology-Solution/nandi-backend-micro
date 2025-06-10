const { sendFireBaseNotification } = require("../controllers/notificationController");

const scheduleNotification = (notificationData, scheduleAt) => {
  const delay = scheduleAt.getTime() - Date.now();

  console.log("⏰ Scheduling notification in", Math.round(delay / 1000), "seconds");

  setTimeout(async () => {
    try {
      const req = { body: notificationData };
      const res = {
        status: () => ({ json: (data) => console.log("Sent (status):", data) }),
        json: (data) => console.log("Sent (json):", data),
      };
      await sendFireBaseNotification(req, res);
    } catch (err) {
      console.error("❌ Error sending scheduled notification:", err);
    }
  }, delay);
};

module.exports = { scheduleNotification };
