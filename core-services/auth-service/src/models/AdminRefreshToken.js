const mongoose = require("mongoose");

const adminRefreshTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // expires 30 days from now
    },
  },
  {
    timestamps: true,
  }
);

adminRefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const AdminRefreshToken = mongoose.model(
  "AdminRefreshToken",
  adminRefreshTokenSchema
);

module.exports = AdminRefreshToken;
