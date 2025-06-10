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
const { connectToRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const cors = require("cors");
const {
  handleNewMovieUpload,
  handleNewDocumentaryUpload,
  handleNewVideoSongUpload,
  handleNewShortFilmUpload,
  handleNewTrailerPreviewUpload,
  handleEpisodeUpload,
} = require("./eventHandlers/processingEventHandlers");

const app = express();
const PORT = process.env.PORT || 3002;
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
  next();
});

// Routes
// app.use("/api/admin/upload", routes);

// Error Handler
app.use(errorHandler);

// Start the server
async function startServer() {
  try {
    await connectToRabbitMQ();

    //consume all the events
    await consumeEvent("movies.uploaded", handleNewMovieUpload);
    await consumeEvent(
      "movies.trailer.uploaded",
      handleNewTrailerPreviewUpload
    );
    await consumeEvent(
      "movies.preview.uploaded",
      handleNewTrailerPreviewUpload
    );
    await consumeEvent("documentaries.uploaded", handleNewDocumentaryUpload);
    await consumeEvent("videosongs.uploaded", handleNewVideoSongUpload);
    await consumeEvent("shortfilms.uploaded", handleNewShortFilmUpload);
    await consumeEvent("episodes.uploaded", handleEpisodeUpload);

    app.listen(PORT, () => {
      logger.info(`processing service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to connect to server", error);
    process.exit(1);
  }
}

startServer();

// unhandled promise rejection

process.on("unhandledRejection", (reason, promise) => {
  if (reason && reason.stack) {
    console.error(
      "Unhandled Rejection at:",
      promise,
      "reason stack:",
      reason.stack
    );
  } else {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
  }
});
