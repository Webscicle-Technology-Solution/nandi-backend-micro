// const { logger } = require("../utils/logger");
// const PosterMedia = require("../models/PosterMedia");
// const BannerMedia = require("../models/BannerMedia");
// const { generateSignedUrl } = require("../services/generateSignedUrl");
// const { redisClient } = require("../config/redisConfig");

// const getSignedPosterUrl = async (req, res) => {
//   logger.info("GET Signed Poster Url Endpoint Hit ...");

//   try {
//     const { id, type } = req.params;
//     const cacheKey = `signedUrl:poster:${type}:${id}`;

//     // Check if URL exists in Redis cache
//     const cachedUrl = await redisClient.get(cacheKey);
//     if (cachedUrl) {
//       logger.info(`Cache hit: Signed URL fetched from Redis for ${cacheKey}`);
//       return res.status(200).json({ success: true, contentUrl: cachedUrl });
//     }

//     // Find by ID and type of parent
//     const poster = await PosterMedia.findOne({
//       "parent.id": id,
//       "parent.type": type,
//     });

//     if (!poster) {
//       return res.status(404).json({
//         success: false,
//         message: "Media not found",
//       });
//     }

//     const bufferTime = 3 * 60 * 1000; // 3 minutes in milliseconds
//     const currentTime = new Date();
//     const expiryWithBuffer = new Date(poster.expiryTimeStamp - bufferTime);

//     let signedUrl = poster.signedUrl;

//     if (expiryWithBuffer <= currentTime) {
//       logger.info(`Signed URL expired, regenerating...`);

//       // Generate new signed URL
//       signedUrl = await generateSignedUrl(poster.urlPath);

//       // Set new expiry (e.g., 7 days)
//       const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

//       // Update in database
//       poster.signedUrl = signedUrl;
//       poster.expiryTimeStamp = newExpiry;
//       await poster.save();

//       // Cache the new signed URL in Redis
//       await redisClient.setex(cacheKey, 7 * 24 * 60 * 60, signedUrl); // Cache for 7 days
//     } else {
//       // Cache the existing signed URL in Redis if it's not already there
//       await redisClient.setex(cacheKey, 7 * 24 * 60 * 60, signedUrl);
//     }

//     // Redirect to the generated signed URL
//     return res.status(200).json({
//       success: true,
//       contentUrl: signedUrl,
//     });
//   } catch (error) {
//     logger.error(`Error generating signed URL: ${error}`);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

// const getSignedBannerUrl = async (req, res) => {
//   logger.info("GET Signed Banner Url Endpoint Hit ...");

//   try {
//     const { id, type } = req.params;
//     const cacheKey = `signedUrl:banner:${type}:${id}`;

//     // Check if URL exists in Redis cache
//     const cachedUrl = await redisClient.get(cacheKey);
//     if (cachedUrl) {
//       logger.info(`Cache hit: Signed URL fetched from Redis for ${cacheKey}`);
//       return res.status(200).json({ success: true, contentUrl: cachedUrl });
//     }

//     // Find by ID and type of parent
//     const banner = await BannerMedia.findOne({
//       "parent.id": id,
//       "parent.type": type,
//     });

//     if (!banner) {
//       return res.status(404).json({
//         success: false,
//         message: "Media not found",
//       });
//     }

//     const bufferTime = 3 * 60 * 1000; // 3 minutes in milliseconds
//     const currentTime = new Date();
//     const expiryWithBuffer = new Date(banner.expiryTimeStamp - bufferTime);

//     let signedUrl = banner.signedUrl;

//     if (expiryWithBuffer <= currentTime) {
//       logger.info(`Signed URL expired, regenerating...`);

//       // Generate new signed URL
//       signedUrl = await generateSignedUrl(banner.urlPath);

//       // Set new expiry (e.g., 7 days)
//       const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

//       // Update in database
//       banner.signedUrl = signedUrl;
//       banner.expiryTimeStamp = newExpiry;
//       await banner.save();

//       // Cache the new signed URL in Redis
//       await redisClient.setex(cacheKey, 7 * 24 * 60 * 60, signedUrl); // Cache for 7 days
//     } else {
//       // Cache the existing signed URL in Redis if it's not already there
//       await redisClient.setex(cacheKey, 7 * 24 * 60 * 60, signedUrl);
//     }

//     // Redirect to the generated signed URL
//     return res.status(200).json({
//       success: true,
//       contentUrl: signedUrl,
//     });
//   } catch (error) {
//     logger.error(`Error generating signed URL: ${error}`);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

// module.exports = { getSignedPosterUrl, getSignedBannerUrl };

const { logger } = require("../utils/logger");
const PosterMedia = require("../models/PosterMedia");
const BannerMedia = require("../models/BannerMedia");
const { generateSignedUrl } = require("../services/generateSignedUrl");
const { redisClient } = require("../config/redisConfig");

const isUrlValid = async (url) => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch (error) {
    logger.warn(`Signed URL check failed: ${error.message}`);
    return false;
  }
};

const getSignedUrl = async (req, res, mediaType) => {
  logger.info(`GET Signed ${mediaType} Url Endpoint Hit ...`);

  try {
    const { id, type } = req.params;
    const cacheKey = `signedUrl:${mediaType}:${type}:${id}`;
    const model = mediaType === "poster" ? PosterMedia : BannerMedia;

    // Check Redis cache first
    const cachedUrl = await redisClient.get(cacheKey);
    if (cachedUrl && (await isUrlValid(cachedUrl))) {
      logger.info(`Cache hit: Signed URL fetched from Redis for ${cacheKey}`);
      return res.status(200).json({ success: true, contentUrl: cachedUrl });
    }

    // Fetch media from DB
    const media = await model.findOne({ "parent.id": id, "parent.type": type });
    if (!media) {
      return res
        .status(404)
        .json({ success: false, message: "Media not found" });
    }

    const bufferTime = 3 * 60 * 1000; // 3 minutes in milliseconds
    const expiryWithBuffer = new Date(media.expiryTimeStamp - bufferTime);
    let signedUrl = media.signedUrl;

    // Validate if existing signed URL is still accessible
    if (expiryWithBuffer <= new Date() || !(await isUrlValid(signedUrl))) {
      logger.info(`Signed URL expired or invalid, regenerating...`);
      signedUrl = await generateSignedUrl(media.urlPath);
      media.signedUrl = signedUrl;
      media.expiryTimeStamp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await media.save();
    }

    // Cache new URL in Redis
    await redisClient.setex(cacheKey, 7 * 24 * 60 * 60, signedUrl);

    return res.status(200).json({ success: true, contentUrl: signedUrl });
  } catch (error) {
    logger.error(`Error generating signed URL: ${error.message}`);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const getSignedPosterUrl = (req, res) => getSignedUrl(req, res, "poster");
const getSignedBannerUrl = (req, res) => getSignedUrl(req, res, "banner");

module.exports = { getSignedPosterUrl, getSignedBannerUrl };
