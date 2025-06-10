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
        "http://nandi.webscicle.com",
        "https://nandi.webscicle.com",
      ];

      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        logger.warn(`CORS origin ${origin} was not allowed`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "token",
      "Accept-Version",
      "X-API-KEY",
    ],
    exposedHeaders: ["X-Total-Count", "Content-Range"],
    credentials: true,
    preflightContinue: true,
    maxAge: 600, //Cache Pre Flight Responses for 10 mins
    optionsSuccessStatus: 200,
  });
};

module.exports = corsConfig;
