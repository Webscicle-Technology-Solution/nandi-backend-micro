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
const { authMiddleware } = require("./middlewares/authMiddleware");
const routes = require("./routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 3008;
const MONGO_URI = process.env.MONGO_URI;
connectDB(MONGO_URI);

// Middlewares
app.use(helmet());
app.use(corsConfig());
app.use(express.json());

// Logging requests
app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body, ${req.body}`);
  next();
});

// DDOS Protection
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "ratelimit",
  points: 10,
  duration: 1,
});

app.use((req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => {
      next();
    })
    .catch(() => {
      logger.warn(`Rate limit exceeded For IP : ${req.ip}`);
      res.status(429).json({ message: "Too many requests" });
    });
});

app.use(authMiddleware);

// Routes
app.use("/api/user", routes);

// Error Handler
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`);
});

// Unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error(err.stack);
  process.exit(1);
});
