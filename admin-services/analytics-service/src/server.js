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
// const routes = require("./routes/metadataRoutes");
const routes = require("./routes/analyticsRoute");
const { connectToRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const {
  handleNewSubscriptionEvent,
  handleNewRentalEvent,
} = require("./eventHandlers/analyticsHandler");
// const {
//   handleNewMoviePosterUpload,
//   handleNewMovieBannerUpload,
//   handleMovieDurationUpdate,
// } = require("./eventHandlers/movieHandler");

// ROUTE IMPORT HERE
const app = express();
const PORT = process.env.PORT || 3003;
const MONGO_URI = process.env.MONGO_URI;
connectDB(MONGO_URI);

// Middlewares
app.use(helmet());
app.use(corsConfig());
app.use(express.json());

// Logging Requests
app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body, ${req.body}`);
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

// Routes
// app.use("/api/admin/meta", routes);

// Error Handler
app.use(errorHandler);

app.use("/api/admin/analytics", routes);

async function startServer() {
  try {
    await connectToRabbitMQ();

    //consume all the events
    // await consumeEvent("movie.posterUploaded", handleNewMoviePosterUpload);
    // await consumeEvent("movie.bannerUploaded", handleNewMovieBannerUpload);
    // await consumeEvent("contentDuration.updated", handleMovieDurationUpdate);
    await consumeEvent("subscription.analytics", handleNewSubscriptionEvent);
    await consumeEvent("rental.analytics", handleNewRentalEvent);

    app.listen(PORT, () => {
      logger.info(`Analytics service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to connect to server", error);
    process.exit(1);
  }
}

startServer();

// unhandled promise rejection

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection At ", promise, "Reason: ", reason);
});
