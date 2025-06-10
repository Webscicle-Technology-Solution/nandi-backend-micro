require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const corsConfig = require("./config/corsConfig");
const cookieParser = require("cookie-parser"); // Import cookie-parser
const { logger } = require("./utils/logger");
const { ratelimitOptions } = require("./config/rateLimitConfig");
const proxy = require("express-http-proxy");
const errorHandler = require("./middlewares/errorHandler");
const { urlVersion } = require("./middlewares/versionMiddleware");
const { proxyOptionsV1 } = require("./config/proxyOptions");
const {
  addRefreshTokenToRequestBody,
} = require("./middlewares/refreshTokenMiddleware");

const { proxyMiddleware } = require("./middlewares/multiPartUploadMiddleware");
const cors = require("cors");
const { authUser } = require("./middlewares/authMiddleware");
const gatewayRoutes = require("./routes/gatewayRoutes");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use(helmet());
// app.use(corsConfig());
// app.use(
//   cors({
//     origin: "*",
//   })
// );

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
// app.use(ratelimitOptions);
// Apply rate limiting to all routes except upload route
app.use((req, res, next) => {
  if (
    req.path.startsWith("/v1/admin/upload") ||
    req.path.startsWith("/v1/drm") ||
    req.path.startsWith("/v1/content")
  ) {
    // Skip rate limiting for the upload route
    return next();
  }

  // Apply rate limit middleware to other routes
  // ratelimitOptions(req, res, next);
  return next();
});

app.use((req, res, next) => {
  logger.info(`[API-Gateway] : Received ${req.method} request to ${req.url}`);
  logger.info(`[API-Gateway] : Request body, ${JSON.stringify(req.body)}`);
  console.log(req.body);
  next();
});

// Health Check Route
app.use(gatewayRoutes);

// Setting up proxy for our Auth service

const cookieOptions = {
  httpOnly: true, // Protects the cookie from client-side JavaScript access
  secure: false, // In non-HTTPS environments, set this to false (true if using HTTPS)
  sameSite: "None", // Allows cross-origin cookies to be sent
  domain: "localhost", // Cookies are valid for this domain (or you could omit this for localhost)
  maxAge: 60 * 60 * 24 * 30 * 1000, // 30 days expiration
};

app.use(authUser);
app.use(
  "/v1/auth",
  addRefreshTokenToRequestBody,

  proxy(process.env.AUTH_SERVICE_URL, {
    ...proxyOptionsV1,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Auth service, ${proxyRes.statusCode}`
      );
      let responseBody;

      try {
        responseBody = JSON.parse(proxyResData.toString("utf-8"));
        if (responseBody.refreshToken) {
          logger.info(
            `Setting refresh token in cookie : ${responseBody.refreshToken}`
          );
          userRes.cookie("refreshToken", responseBody.refreshToken, {
            httpOnly: false,
            secure: false, // Set to `true` in production with HTTPS
            sameSite: "Lax", // "Lax" is typically fine for most use cases
            maxAge: 60 * 60 * 24 * 30 * 1000, // 30 days
          });
          logger.info("Refresh token set in cookie");

          delete responseBody.refreshToken; // Invalidate the token in the body
        }
      } catch (error) {
        logger.error("");
      }

      return JSON.stringify(responseBody);
    },
  })
);

// Setting up proxy for Admin -> Metadata Service
app.use(
  "/v1/admin/meta",

  proxy(process.env.ADMIN_METADATA_SERVICE_URL, {
    ...proxyOptionsV1,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Admin Metadata service, ${proxyRes.statusCode}`
      );
      return proxyResData;
    },
  })
);

// Setting up proxy for Admin -> Notification Service
app.use(
  "/v1/admin/notification",

  proxy(process.env.ADMIN_NOTIFICATION_SERVICE_URL, {
    ...proxyOptionsV1,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Admin Notification service, ${proxyRes.statusCode}`
      );
      return proxyResData;
    },
  })
);

// Setting up proxy for Admin -> Upload Media Service
app.use("/v1/admin/upload", proxyMiddleware());

// Setting up proxy for DRM service

// Setting up proxy for Admin -> Metadata Service
app.use(
  "/v1/drm",

  proxy(process.env.DRM_SERVICE_URL, {
    ...proxyOptionsV1,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Admin Metadata service, ${proxyRes.statusCode}`
      );
      return proxyResData;
    },
  })
);

// Setting up proxy for Core -> content Service
app.use(
  "/v1/content",

  proxy(process.env.CONTENT_SERVICE_URL, {
    ...proxyOptionsV1,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Admin Metadata service, ${proxyRes.statusCode}`
      );
      return proxyResData;
    },
  })
);

// Setting up proxy for Core -> Payment Service
app.use(
  "/v1/payments",

  proxy(process.env.PAYMENT_SERVICE_URL, {
    ...proxyOptionsV1,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Payment service, ${proxyRes.statusCode}`
      );
      return proxyResData;
    },
  })
);

app.use(
  "/v1/admin/analytics",

  proxy(process.env.ANALYTICS_SERVICE_URL, {
    ...proxyOptionsV1,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Analytics service, ${proxyRes.statusCode}`
      );
      return proxyResData;
    },
  })
);

app.use(errorHandler);
app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info(
    `Auth service is running on port ${process.env.AUTH_SERVICE_URL}`
  );
  logger.info(
    `[ADMIN]: Metadata service is running on port ${process.env.ADMIN_METADATA_SERVICE_URL}`
  );
  logger.info(
    `[ADMIN]: Media Upload service is running on port ${process.env.ADMIN_UPLOAD_SERVICE_URL}`
  );

  logger.info(
    `[DRM]: DRM service is running on port ${process.env.DRM_SERVICE_URL}`
  );
  logger.info(
    `[CONTENT]: Content service is running on port ${process.env.CONTENT_SERVICE_URL}`
  );
  logger.info(
    `[PAYMENTS]: Payment service is running on port ${process.env.PAYMENT_SERVICE_URL}`
  );
  logger.info(
    `[ANALYTICS]: Analytics service is running on port ${process.env.ANALYTICS_SERVICE_URL}`
  );
  logger.info(
    `[NOTIFICATION]: Notification service is running on port ${process.env.ADMIN_NOTIFICATION_SERVICE_URL}`
  );

  logger.info(`Redis URL: ${process.env.REDIS_URL}`);
});

// Unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error(err.stack);
  process.exit(1);
});
