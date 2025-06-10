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
const routes = require("./routes/metadataRoutes");
const { connectToRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const {
  handleNewMoviePosterUpload,
  handleNewMovieBannerUpload,
  handleMovieDurationUpdate,
} = require("./eventHandlers/movieHandler");
const HomeContent = require("./models/HomeContent");
const Settings = require("./models/Settings");

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
  logger.info(`Request body, ${JSON.stringify(req.body)}`);
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
app.use("/api/admin/meta", routes);

// Error Handler
app.use(errorHandler);

async function startServer() {
  try {
    await connectToRabbitMQ();

    //consume all the events
    // await consumeEvent("movie.posterUploaded", handleNewMoviePosterUpload);
    // await consumeEvent("movie.bannerUploaded", handleNewMovieBannerUpload);
    // Create Settings if it doesnt exist
    let settings = await Settings.findOne({
      name: "Settings",
    });
    if (!settings) {
      settings = new Settings({
        name: "Settings",
        isSubscriptionEnabled: false,
      });
      await settings.save();
    }
    // Create home content for movie if it doesnt exist
    let homeContent = await HomeContent.findOne({
      contentType: "Movie",
    });
    if (!homeContent) {
      homeContent = new HomeContent({
        contentType: "Movie",
        isLatestVisible: true,
        isTrendingVisible: false,
        isHistoryVisible: true,
        isFavoritesVisible: false,
        isCategoriesVisible: true,
      });
      await homeContent.save();
    }
    // TVSERIES HOme Content
    let tvHomeContent = await HomeContent.findOne({
      contentType: "TVSeries",
    });
    if (!tvHomeContent) {
      tvHomeContent = new HomeContent({
        contentType: "TVSeries",
        isLatestVisible: true,
        isTrendingVisible: false,
        isHistoryVisible: true,
        isFavoritesVisible: false,
        isCategoriesVisible: false,
      });
      await tvHomeContent.save();
    }

    // ShortFilm Home Content
    let shortFilmHomeContent = await HomeContent.findOne({
      contentType: "ShortFilm",
    });
    if (!shortFilmHomeContent) {
      shortFilmHomeContent = new HomeContent({
        contentType: "ShortFilm",
        isLatestVisible: true,
        isTrendingVisible: false,
        isHistoryVisible: true,
        isFavoritesVisible: false,
        isCategoriesVisible: false,
      });
      await shortFilmHomeContent.save();
    }

    // Documentary Home Content
    let documentaryHomeContent = await HomeContent.findOne({
      contentType: "Documentary",
    });
    if (!documentaryHomeContent) {
      documentaryHomeContent = new HomeContent({
        contentType: "Documentary",
        isLatestVisible: true,
        isTrendingVisible: false,
        isHistoryVisible: true,
        isFavoritesVisible: false,
        isCategoriesVisible: false,
      });
      await documentaryHomeContent.save();
    }

    // VideoSong Home Content
    let videoSongHomeContent = await HomeContent.findOne({
      contentType: "VideoSong",
    });
    if (!videoSongHomeContent) {
      videoSongHomeContent = new HomeContent({
        contentType: "VideoSong",
        isLatestVisible: true,
        isTrendingVisible: false,
        isHistoryVisible: true,
        isFavoritesVisible: false,
        isCategoriesVisible: false,
      });
      await videoSongHomeContent.save();
    }

    await consumeEvent("contentDuration.updated", handleMovieDurationUpdate);

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
  logger.error("Unhandled Rejection At ", promise, "Reason: ", reason);
});
