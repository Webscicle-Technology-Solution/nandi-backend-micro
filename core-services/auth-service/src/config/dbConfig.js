const mongoose = require("mongoose");
const { logger } = require("../utils/logger");

const connectDB = async (MONGO_URI) => {
  try {
    mongoose.connect(MONGO_URI).then(() => {});
    logger.info("Connected to MongoDB");
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error}`);
  }
};

module.exports = connectDB;
