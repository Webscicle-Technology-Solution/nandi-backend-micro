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
const routes = require("./routes/auth.routes");
const Admin = require("./models/Admin");

const { connectToRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const {
  handleNewSubscription,
  handleNewRental,
} = require("./eventHandlers/paymentEventHandler");

const app = express();
const PORT = process.env.PORT || 3002;
const MONGO_URI = process.env.MONGO_URI;
connectDB(MONGO_URI);

// Middlewares
app.use(helmet());
app.use(corsConfig());
app.use(express.json());

// Logging requests
app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body, ${JSON.stringify(req.body)}`);
  next();
});

// DDOS Protection
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "ratelimit",
  points: 10,
  duration: 1,
});

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

// Routes
app.use("/api/auth", routes);

// Error Handler
app.use(errorHandler);

// Start the server
// app.listen(PORT, () => {
//   logger.info(`Server started on port ${PORT}`);
// });

async function startServer() {
  try {
    await connectToRabbitMQ();
    // await consumeEvent("posterUploaded", handlePosterUpload);
    // await consumeEvent("bannerUploaded", handleBannerUpload);

    await consumeEvent("subscription.created", handleNewSubscription);
    await consumeEvent("rental.created", handleNewRental);

    // Check if superadmin exists if not create one
    const superAdmin = await Admin.findOne({
      email: "nandipictures2023@gmail.com",
    });

    if (!superAdmin) {
      const newAdmin = new Admin({
        name: "Super Admin",
        email: "nandipictures2023@gmail.com",
        password: "qu5?/11-S6RB",
        permissions: {isSuperAdmin: true},
      });
      await newAdmin.save();
      logger.info("Super Admin created successfully");
    }

    app.listen(PORT, () => {
      logger.info(`Auth Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to connect to server", error);
    process.exit(1);
  }
}

startServer();

// Unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error(err.stack);
  process.exit(1);
});
