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
const { connectToRabbitMQ } = require("./utils/rabbitmq");
const cors = require("cors");

const routes = require("./routes/uploadRoutes");

const app = express();
const PORT = process.env.PORT || 3005;
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
      "https://adminnandi.webscicle.com",
      "https://www.adminnandi.webscicle.com",
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

// Logging Requests
app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body, ${req.body}`);
  console.log(req.body);
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
app.use("/api/admin/upload", routes);

// Error Handler
app.use(errorHandler);

// Start the server
async function startServer() {
  try {
    await connectToRabbitMQ();

    app.listen(PORT, () => {
      logger.info(`Post service running on port ${PORT}`);
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
