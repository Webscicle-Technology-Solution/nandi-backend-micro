const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  isSubscriptionEnabled: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Settings = mongoose.model("Settings", settingsSchema);
module.exports = Settings;
