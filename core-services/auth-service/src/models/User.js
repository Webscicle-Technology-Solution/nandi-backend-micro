const mongoose = require("mongoose");
const argon2 = require("argon2");
const axios = require("axios");
const { logger } = require("../utils/logger");
require("dotenv").config();

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "unverified",
    },
    state: {
      type: String,
    },
    city: {
      type: String,
    },
    pincode: {
      type: Number,
    },
    email: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      select: false,
    },
    phone: {
      type: String,
      required: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    deviceToken: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// userSchema.pre("save", async function (next) {
//   if (this.isModified("password")) {
//     try {
//       this.password = await argon2.hash(this.password);
//     } catch (error) {
//       return next(error);
//     }
//   }

//   if (this.isNew) {
//     logger.info("New User : Attempting to create a new Free type subscription");
//     try {
//       const response = await axios.post(
//         `${process.env.PAYMENT_SERVICE_URL}/api/payments/subscription`,
//         {
//           userId: this._id,
//           subscriptionName: "Free",
//           status: "Active",
//         }
//       );
//       const subscription = response.data.data;
//       this.subscriptionId = subscription._id;
//       next();
//     } catch (error) {
//       return next(error);
//     }
//   }
// });

userSchema.pre("save", async function (next) {
  if (this.isNew) {
    logger.info("New User : Attempting to create a new Free type subscription");
    try {
      const response = await axios.post(
        `${process.env.PAYMENT_SERVICE_URL}/api/payments/subscription`,
        {
          userId: this._id,
          subscriptionName: "Free",
          status: "Active",
        }
      );
      const subscription = response.data.data;
      this.subscriptionId = subscription._id;
      next();
    } catch (error) {
      return next(error);
    }
  }
});

// userSchema.methods.comparePassword = async function (candidatePassword) {
//   try {
//     return await argon2.verify(this.password, candidatePassword);
//   } catch (error) {
//     throw error;
//   }
// };

// Post-query hook to automatically populate subscription data from the subscription service for `findOne`
// userSchema.post("findOne", async function (doc) {
//   if (doc && doc.subscriptionId) {
//     try {
//       // Fetch subscription details from the subscription microservice
//       const subscriptionResponse = await axios.get(
//         `${process.env.PAYMENT_SERVICE_URL}/api/payments/${doc.subscriptionId}`
//       );

//       // Add the subscription data to the user document
//       doc.subscription = subscriptionResponse.data;
//     } catch (error) {
//       console.error("Error fetching subscription data:", error);
//       // Handle error gracefully, maybe logging it
//       doc.subscription = null; // Optionally, handle missing subscription data here
//     }
//   }
// });

userSchema.index({ email: "text" });
const User = mongoose.model("User", userSchema);
module.exports = User;
