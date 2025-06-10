const mongoose = require("mongoose");

const userAccessDetailsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },
    subscriptionType: {
      type: String,
      enum: ["Free", "Silver", "Gold"],
      default: "Free",
    },
    subscriptionExpiryDate: { type: Date },
    // Rentals: Array of movieDetails
    rentals: [
      {
        movieId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Movie",
        },
        rentalExpiryDate: { type: Date },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const UserAccessDetails = mongoose.model(
  "UserAccessDetails",
  userAccessDetailsSchema
);
module.exports = UserAccessDetails;
