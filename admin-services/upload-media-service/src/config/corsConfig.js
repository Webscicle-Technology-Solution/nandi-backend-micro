const cors = require("cors");
const { logger } = require("../utils/logger");

const corsConfig = () => {
  return cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        "*",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "https://nandipictures.com",
        "htttps://demoapinandi.webscicle.com",
      ];

      // Allow all origins or check if origin is allowed
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        logger.warn(`CORS origin ${origin} was not allowed`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // Include OPTIONS
    allowedHeaders: [
      "Content-Type", // Allow multipart/form-data
      "Authorization",
      "token",
      "Accept-Version",
      "X-API-KEY",
      "Transfer-Encoding", // Allow transfer-encoding header (needed for chunked uploads)
      "X-Requested-With", // Sometimes needed for AJAX requests
    ],
    exposedHeaders: ["X-Total-Count", "Content-Range"],
    credentials: true,
    preflightContinue: false, // Don't manually handle OPTIONS requests
    maxAge: 600, // Cache Pre Flight Responses for 10 mins
    optionsSuccessStatus: 200,
  });
};

module.exports = corsConfig;
