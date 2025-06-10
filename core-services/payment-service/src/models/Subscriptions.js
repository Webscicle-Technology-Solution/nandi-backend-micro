const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    subscriptionType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionType",
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date, //Default 30 days
      default: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    status: {
      type: String,
      default: "Active",
      enum: ["Active", "Cancelled", "Expired", "Pending"],
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
    },
  },
  {
    timestamps: true,
  }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);
module.exports = Subscription;
