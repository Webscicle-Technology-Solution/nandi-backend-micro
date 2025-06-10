const mongoose = require("mongoose");

const subscriptionTypesSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    benefits: [{ type: String }],
    ad_enabled: { type: Boolean, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const SubscriptionType = mongoose.model(
  "SubscriptionType",
  subscriptionTypesSchema
);
module.exports = SubscriptionType;
