const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["SubscriptionType", "Rental"],
    required: true,
  },
  typeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "type",
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["Pending", "Confirmed", "Cancelled", "Refunded"],
    default: "Pending",
  },
  confirmedDate: {
    type: Date,
  },
  paymentAmount: {
    type: Number,
    required: true,
  },
});

const Transaction = mongoose.model("Transaction", transactionSchema);
module.exports = Transaction;
