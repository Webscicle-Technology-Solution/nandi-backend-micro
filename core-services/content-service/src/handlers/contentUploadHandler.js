const { logger } = require("../utils/logger");
const PosterMedia = require("../models/PosterMedia");
const BannerMedia = require("../models/BannerMedia");
const { redisClient } = require("../config/redisConfig");
const { generateSignedUrl } = require("../services/generateSignedUrl");

const handlePosterUpload = async (event) => {
  logger.info("Processing new upload event...");
  const { id, contentType, urlPath } = event;

  try {
    if (!id || !contentType || !urlPath) {
      logger.warn("Missing content ID or content type in the request body.");
      throw new Error(
        "Missing content ID or content type in the request body."
      );
    }

    const cacheKey = `signedUrl:poster:${contentType}:${id}`;

    // Check if the PosterMedia already exists
    let poster = await PosterMedia.findOne({
      "parent.id": id,
      "parent.type": contentType,
    });

    // If PosterMedia exists, invalidate the cache for that poster
    if (poster) {
      await redisClient.del(cacheKey); // Invalidate the cache
      logger.info(`Cache invalidated for ${cacheKey}`);
      poster.urlPath = urlPath;
      poster.expiryTimeStamp = new Date();
    }

    // If PosterMedia doesn't exist, create a new one
    if (!poster) {
      const newPosterMedia = new PosterMedia({
        parent: {
          type: contentType,
          id: id,
        },
        urlPath: urlPath,
        signedUrl: urlPath, // Temporary: Set the urlPath until the signed URL is generated
        expiryTimeStamp: new Date(),
      });

      // Save the new poster media document
      poster = await newPosterMedia.save();
      logger.info("New PosterMedia created");
    }

    // Generate a new signed URL
    const signedUrl = await generateSignedUrl(poster.urlPath);

    // Set new expiry (e.g., 7 days from now)
    const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    // Update the PosterMedia document with the new signed URL and expiry timestamp
    poster.signedUrl = signedUrl;
    poster.expiryTimeStamp = newExpiry;
    await poster.save();
    logger.info("PosterMedia updated with new signed URL");

    // Store the signed URL in Redis cache for faster access
    await redisClient.setex(cacheKey, 7 * 24 * 60 * 60, signedUrl); // Cache for 7 days
    logger.info(`Signed URL cached in Redis for ${cacheKey}`);
  } catch (error) {
    logger.error(`Error occurred while processing new upload event: ${error}`);
  }
};

const handleBannerUpload = async (event) => {
  logger.info("Processing new banner upload event...");
  const { id, contentType, urlPath } = event;

  try {
    if (!id || !contentType || !urlPath) {
      logger.warn("Missing content ID or content type in the request body.");
      throw new Error(
        "Missing content ID or content type in the request body."
      );
    }

    const cacheKey = `signedUrl:banner:${contentType}:${id}`;

    // Check if the BannerMedia already exists
    let banner = await BannerMedia.findOne({
      "parent.id": id,
      "parent.type": contentType,
    });

    // If BannerMedia exists, invalidate the cache for that banner
    if (banner) {
      await redisClient.del(cacheKey); // Invalidate the cache
      logger.info(`Cache invalidated for ${cacheKey}`);
      banner.urlPath = urlPath;
      banner.expiryTimeStamp = new Date();
    }

    // If BannerMedia doesn't exist, create a new one
    if (!banner) {
      const newBannerMedia = new BannerMedia({
        parent: {
          type: contentType,
          id: id,
        },
        urlPath: urlPath,
        signedUrl: urlPath, // Temporary: Set the urlPath until the signed URL is generated
        expiryTimeStamp: new Date(),
      });

      // Save the new banner media document
      banner = await newBannerMedia.save();
      logger.info("New BannerMedia created");
    }

    // Generate a new signed URL
    const signedUrl = await generateSignedUrl(banner.urlPath);

    // Set new expiry (e.g., 7 days from now)
    const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    // Update the BannerMedia document with the new signed URL and expiry timestamp
    banner.signedUrl = signedUrl;
    banner.expiryTimeStamp = newExpiry;
    await banner.save();
    logger.info("BannerMedia updated with new signed URL");

    // Store the signed URL in Redis cache for faster access
    await redisClient.setex(cacheKey, 7 * 24 * 60 * 60, signedUrl); // Cache for 7 days
    logger.info(`Signed URL cached in Redis for ${cacheKey}`);
  } catch (error) {
    logger.error(
      `Error occurred while processing new banner upload event: ${error}`
    );
  }
};

module.exports = { handlePosterUpload, handleBannerUpload };
