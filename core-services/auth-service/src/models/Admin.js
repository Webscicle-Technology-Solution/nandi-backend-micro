const mongoose = require("mongoose");
const argon2 = require("argon2");
const axios = require("axios");
const { logger } = require("../utils/logger");
require("dotenv").config();

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
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
    permissions: {
      isSuperAdmin: {
        type: Boolean,
        default: false,
      },
      canManageUsers: {
        type: Boolean,
        default: false,
      },
      canManageSubscriptions: {
        type: Boolean,
        default: false,
      },
      canManageContent: {
        type: Boolean,
        default: false,
      },
      canManageSettings: {
        type: Boolean,
        default: false,
      },
      canManageReports: {
        type: Boolean,
        default: false,
      },
      canManagePayments: {
        type: Boolean,
        default: false,
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

adminSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    try {
      this.password = await argon2.hash(this.password);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

adminSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await argon2.verify(this.password, candidatePassword);
  } catch (error) {
    throw error;
  }
};

adminSchema.index({ email: "text" });
const Admin = mongoose.model("Admin", adminSchema);
module.exports = Admin;
