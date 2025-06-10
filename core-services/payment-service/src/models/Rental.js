const mongoose = require("mongoose");

const rentalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Movie",
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
    default: "Pending",
    enum: ["Active", "Cancelled", "Expired", "Pending"],
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction",
    unique: true,
  },
});

const Rental = mongoose.model("Rental", rentalSchema);
module.exports = Rental;
