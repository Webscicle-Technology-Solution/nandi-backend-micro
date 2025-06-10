require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const connectDB = require("./config/dbConfig");
const corsConfig = require("./config/corsConfig");
const { logger } = require("./utils/logger");
const { RateLimiterRedis } = require("rate-limiter-flexible");
const { redisClient } = require("./config/redisConfig");
const { RedisStore } = require("rate-limit-redis");
const errorHandler = require("./middlewares/errorHandler");
const routes = require("./routes/paymentRoutes");
const cors = require("cors");
const { connectToRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const mongoose = require("mongoose");
const SubscriptionType = require("./models/SubscriptionTypes");
const { handleNewUser } = require("./eventHandlers/paymentEventHandler");

const app = express();
const PORT = process.env.PORT || 3009;
const MONGO_URI = process.env.MONGO_URI;
connectDB(MONGO_URI);

// Middlewares
app.use(helmet());
// app.use(corsConfig());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://nandi.webscicle.com",
      "https://nandi.webscicle.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "token",
      "Accept-Version",
    ],
  })
);
app.use(express.json());

// Logging requests
app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body, ${JSON.stringify(req.body)}`);
  // logger.info(`Request User: ${JSON.stringify(req.user)}`);
  next();
});

// DDOS Protection
// const rateLimiter = new RateLimiterRedis({
//   storeClient: redisClient,
//   keyPrefix: "ratelimit",
//   points: 10,
//   duration: 1,
// });

// app.use((req, res, next) => {
//   rateLimiter
//     .consume(req.ip)
//     .then(() => {
//       next();
//     })
//     .catch(() => {
//       logger.warn(`Rate limit exceeded For IP : ${req.ip}`);
//       res.status(429).json({ message: "Too many requests" });
//     });
// });

// Routes -> Pass redisClient to route
// ✅ Attach Redis Client in Middleware for ALL Requests
app.use((req, res, next) => {
  req.redisClient = redisClient; // ✅ Ensure req.redisClient is always available
  next();
});

app.use("/api/payments", routes);

// Error Handler
app.use(errorHandler);

// Start the server
async function startServer() {
  try {
    // Check if Free Type Subscription Exists in DB, if Not create it
    const freeTypeSubscription = await SubscriptionType.findOne({
      name: "Free",
    });
    logger.info(`FreeTypeSubscription : ${freeTypeSubscription}`);
    if (!freeTypeSubscription) {
      logger.info("Creating Free Subscription Type...");
      await SubscriptionType.create({
        name: "Free",
        price: 0,
        description: "Free Subscription With Ads",
        ad_enabled: true,
      });
    }

    // Check if Silver Type Subscription Exists in DB, if Not create it
    const silverTypeSubscription = await SubscriptionType.findOne({
      name: "Silver",
    });
    if (!silverTypeSubscription) {
      await SubscriptionType.create({
        name: "Silver",
        price: 200,
        description: "Silver Subscription Without Ads",
        ad_enabled: false,
      });
    }

    // Check if Gold Type Subscription Exists in DB, if Not create it
    const goldTypeSubscription = await SubscriptionType.findOne({
      name: "Gold",
    });
    if (!goldTypeSubscription) {
      await SubscriptionType.create({
        name: "Gold",
        price: 500,
        description: "Gold Subscription Without Ads",
        ad_enabled: false,
      });
    }
    await connectToRabbitMQ();
    // await consumeEvent("posterUploaded", handlePosterUpload);
    // await consumeEvent("bannerUploaded", handleBannerUpload);
    await consumeEvent("user.registered", handleNewUser);

    // Start the server
    app.listen(PORT, () => {
      logger.info(`Payment service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to connect to server", error);
    process.exit(1);
  }
}

startServer();
redisClient.on("connect", () => logger.info("🚀 Redis Connected!"));
redisClient.on("error", (err) => logger.error("Redis Error:", err));

// Unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error(err.stack);
  process.exit(1);
});
