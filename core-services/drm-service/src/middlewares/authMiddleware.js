// const { logger } = require("../utils/logger");
// const axios = require("axios");
// const { redisClient } = require("../config/redisConfig");

// const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;
// const ADMIN_METADATA_SERVICE_URL = process.env.ADMIN_METADATA_SERVICE_URL;

// const authMiddleware = async (req, res, next) => {
//   const userId = req.user?.userId || req.body?.user?.userId;
//   const movieId = req.params?.movieId || req.body?.mediaId;
//   const movieIdStr = movieId?.toString() || "";
//   let userAccess = null;

//   // Check if url has trailer or preview in it
//   if (
//     req.originalUrl.includes("/trailer") ||
//     req.originalUrl.includes("/preview")
//   ) {
//     logger.info("[Auth Middleware] Skipping auth middleware for trailer");
//     return next();
//   }

//   if (!req.user && !req.body.user) {
//     logger.warn("[Auth Middleware] User not found");
//     return res.status(401).json({ success: false, message: "Unauthorized" });
//   }

//   // Fetch movie details from metadata service
//   // First try cache

//   let movie = await redisClient.get(`movie:${movieIdStr}`);

//   if (movie) {
//     logger.info(
//       `[Auth Middleware] Cache hit for movie ${movieIdStr}. Raw Cache: ${movie}`
//     );
//     try {
//       movie = JSON.parse(movie);
//       logger.info("[Auth Middleware] Parsed movie from cache:", movie);
//     } catch (err) {
//       logger.error(
//         `[Auth Middleware] Failed to parse cache data: ${err.message}`
//       );
//       return res.status(500).json({ success: false, message: "Cache Error" });
//     }
//   }
//   if (!movie) {
//     logger.info(`[Auth Middleware] Cache miss for movie ${movieIdStr}`);
//     const movieResponse = await axios.get(
//       `${ADMIN_METADATA_SERVICE_URL}/api/admin/meta/movies/${movieIdStr}`
//     );

//     if (movieResponse.status !== 200) {
//       logger.warn(
//         `[Auth Middleware] Failed to fetch movie details for movie ${movieId}`
//       );
//       return res
//         .status(404)
//         .json({ success: false, message: "Movie Not Found" });
//     }

//     movie = movieResponse.data.movie;

//     // Add Movie to Redis Cache
//     const movieCacheKey = `movie:${movieIdStr}`;
//     await redisClient.setex(
//       movieCacheKey,
//       300,
//       JSON.stringify({ movieId, ...movie })
//     );
//   }

//   if (movie.accessParams?.accessType === "free") {
//     return next();
//   }
//   try {
//     const cacheKey = `user:${userId}`;
//     const cachedUser = await redisClient.get(cacheKey);

//     if (cachedUser) {
//       logger.info(
//         `[Auth Middleware] Cache hit for user ${userId}. Raw Cache: ${cachedUser}`
//       );
//       try {
//         userAccess = JSON.parse(cachedUser);
//         logger.info(
//           "[Auth Middleware] Parsed user access from cache:",
//           userAccess
//         );
//       } catch (err) {
//         logger.error(
//           `[Auth Middleware] Failed to parse cache data: ${err.message}`
//         );
//         return res.status(500).json({ success: false, message: "Cache Error" });
//       }
//     } else {
//       logger.info(`[Auth Middleware] Cache miss for user ${userId}`);
//       const response = await axios.get(
//         `${AUTH_SERVICE_URL}/api/auth/access/${userId}`
//       );

//       logger.info("Received user access response:", response.data);
//       if (response.status === 200) {
//         userAccess = response.data.data;
//         await redisClient.setex(cacheKey, 300, JSON.stringify(userAccess));
//       } else {
//         logger.warn(
//           `[Auth Middleware] Failed to fetch user access for user ${userId}`
//         );
//         return res
//           .status(500)
//           .json({ success: false, message: "Internal Server Error" });
//       }
//     }

//     if (!userAccess || !Array.isArray(userAccess.rentals)) {
//       logger.warn(
//         `[Auth Middleware] User access or rentals not found for user ${userId}`
//       );
//       return res.status(403).json({ success: false, message: "Unauthorized" });
//     }
//   } catch (error) {
//     logger.error(
//       `[Auth Middleware] Error fetching user access for user ${userId}: ${error.message}`
//     );
//     return res
//       .status(500)
//       .json({ success: false, message: "Internal Server Error" });
//   }

//   if (userAccess.subscriptionType !== "Free") {
//     logger.info(
//       `[Auth Middleware] User has subscription type ${userAccess.subscriptionType}`
//     );
//     return next();
//   }

//   if (req.url.includes("movie") || req.url.includes("movies")) {
//     if (userAccess.subscriptionType !== "Free") {
//       logger.info(
//         `[Auth Middleware] User has subscription type ${userAccess.subscriptionType}`
//       );
//       return next();
//     }

//     const nowUTC = new Date(
//       new Date().getTime() - new Date().getTimezoneOffset() * 60000
//     );

//     const hasValidRental = userAccess.rentals.some((rental) => {
//       if (!rental || !rental.movieId) return false;
//       return (
//         rental.movieId.toString() === movieIdStr &&
//         new Date(rental.rentalExpiryDate) > nowUTC
//       );
//     });

//     if (hasValidRental) {
//       logger.info(
//         `[Auth Middleware] User has valid rental for movie ${movieId}`
//       );
//       return next();
//     } else {
//       logger.warn(
//         `[Auth Middleware] User does not have valid rental for movie ${movieId}`
//       );
//       return res.status(403).json({ success: false, message: "Unauthorized" });
//     }
//   }

//   logger.info("Failed all test case for auth middleware");
//   return res.status(403).json({ success: false, message: "Unauthorized" });
// };

// module.exports = { authMiddleware };

const { logger } = require("../utils/logger");
const axios = require("axios");
const { redisClient } = require("../config/redisConfig");

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;
const ADMIN_METADATA_SERVICE_URL = process.env.ADMIN_METADATA_SERVICE_URL;

const authMiddleware = async (req, res, next) => {
  const userId = req.user?.userId || req.body?.user?.userId;
  const movieId = req.params?.movieId || req.body?.mediaId;
  const movieIdStr = movieId?.toString() || "";
  let userAccess = null;

  if (
    req.originalUrl.includes("/trailer") ||
    req.originalUrl.includes("/preview")
  ) {
    logger.info("[Auth Middleware] Skipping auth middleware for trailer");
    return next();
  }

  if (userId === undefined) {
    logger.warn("[Auth Middleware] User not found");
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    // Fetch user access details from cache or API
    const cacheKey = `user:${userId}`;
    // const cachedUser = await redisClient.get(cacheKey);
    let cachedUser = false;

    if (cachedUser) {
      userAccess = JSON.parse(cachedUser);
      console.log(`Redis User Access : ${JSON.stringify(userAccess)}`);
    } else {
      const response = await axios.get(
        `${AUTH_SERVICE_URL}/api/auth/access/${userId}`
      );
      console.log(`Auth service Response: ${JSON.stringify(response.data)}`);
      if (response.data.success) {
        userAccess = response.data.data;
        await redisClient.setex(cacheKey, 300, JSON.stringify(userAccess));
      } else {
        logger.warn(
          `Failed auth service request : ${JSON.stringify(response.data)}`
        );
        return res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }
    }

    // If user is Free, deny access immediately for non-movie requests
    if (!req.url.includes("movie") && userAccess.subscriptionType === "Free") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    console.log(
      `User Access: ${JSON.stringify(userAccess)}, req urL : ${req.url}`
    );

    // If the request is NOT related to a movie, allow access
    if (!req.url.includes("movie") && userAccess.subscriptionType !== "Free") {
      return next();
    }

    if (!req.url.includes("movie") && usersAccess.subscriptionType === "Free") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (userAccess.subscriptionType !== "Free") {
      return next();
    }

    // Fetch movie details if required
    let movie = await redisClient.get(`movie:${movieIdStr}`);
    if (movie) {
      movie = JSON.parse(movie);
    } else {
      logger.info(`Attempting to fetch movie details for movie ${movieIdStr}`);
      const movieResponse = await axios.get(
        `${ADMIN_METADATA_SERVICE_URL}/api/admin/meta/movies/${movieIdStr}`
      );
      if (!movieResponse.data.success) {
        logger.warn(
          `Failed to fetch movie details for movie ${movieIdStr}. Response : ${JSON.stringify(
            movieResponse.data
          )}`
        );
        return res
          .status(404)
          .json({ success: false, message: "Movie Not Found" });
      }
      logger.info(
        `Fetched movie details for movie ${movieIdStr}. Movie: ${JSON.stringify(
          movieResponse.data
        )}`
      );
      movie = movieResponse.data.movie;
      await redisClient.setex(
        `movie:${movieIdStr}`,
        300,
        JSON.stringify({ movieId, ...movie })
      );
    }

    // If movie is free, allow access
    if (movie.accessParams?.accessType === "free") {
      return next();
    }

    // Check if user has valid rental
    const nowUTC = new Date(
      new Date().getTime() - new Date().getTimezoneOffset() * 60000
    );
    const hasValidRental = userAccess.rentals?.some(
      (rental) =>
        rental?.movieId?.toString() === movieIdStr &&
        new Date(rental.rentalExpiryDate) > nowUTC
    );

    if (hasValidRental) {
      logger.info(
        `[Auth Middleware] User has valid rental for movie ${movieId}`
      );
      return next();
    }

    logger.warn(
      `[Auth Middleware] User does not have valid rental for movie ${movieId}`
    );

    return res.status(403).json({ success: false, message: "Unauthorized" });
  } catch (error) {
    logger.error(`[Auth Middleware] Error: ${error.message}`);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = { authMiddleware };
