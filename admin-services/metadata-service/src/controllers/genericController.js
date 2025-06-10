const { logger } = require("../utils/logger");
const Featured = require("../models/Featured");
const Movie = require("../models/Movie");
const Documentary = require("../models/Documentary");
const TVSeries = require("../models/TVSeriesModel/TVSeries");
const ShortFilm = require("../models/ShortFilm");
const VideoSong = require("../models/VideoSong");
const { convertContentType } = require("../utils/inputUtils");
const Rating = require("../models/Rating");
const mongoose = require("mongoose");
const HomeContent = require("../models/HomeContent");
const Settings = require("../models/Settings");

// Create new featured
const toggleFeatured = async (req, res) => {
  try {
    const { contentType, contentId } = req.body;
    const finalContentType = convertContentType(contentType);
    if (!finalContentType || !contentId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Request" });
    }
    let content = null;
    // Fetch content based on the content type
    if (contentType === "movie") {
      content = await Movie.findById(contentId);
    } else if (contentType === "tvseries") {
      content = await TVSeries.findById(contentId);
    } else if (contentType === "shortfilm") {
      content = await ShortFilm.findById(contentId);
    } else if (contentType === "documentary") {
      content = await Documentary.findById(contentId);
    } else if (contentType === "videosong") {
      content = await VideoSong.findById(contentId);
    }

    // If content is not found, return 404
    if (!content) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid Media Id" });
    }

    // Check if the content is already featured
    const existingFeatured = await Featured.findOne({
      contentType: finalContentType,
      contentId,
    })
      .populate("contentId")
      .exec();

    if (existingFeatured) {
      // Delete the existing featured content
      await Featured.deleteOne({ _id: existingFeatured._id });
      return res
        .status(200)
        .json({ success: true, message: "Removed", data: existingFeatured });
    }

    // Add new featured content
    const newFeatured = new Featured({
      contentType: finalContentType,
      contentId,
    });
    await newFeatured.save();
    return res.status(200).json({ success: true, featured: newFeatured });
  } catch (error) {
    logger.error("[Create Featured] Error Occured", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get all featured by contentType
const getAllFeaturedByType = async (req, res) => {
  logger.info("Get All Featured Endpoint Hit...");
  try {
    const { contentType } = req.params;
    const finalContentType = convertContentType(contentType);
    if (!finalContentType) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid Content Type" });
    }
    const featured = await Featured.find({ contentType: finalContentType })
      .populate("contentId")
      .exec();
    //   .populate("contentId")
    //   .exec();
    logger.info("[Get All Featured] Successful");
    res
      .status(200)
      .json({ success: true, message: "Featured fetched", data: featured });
  } catch (error) {
    logger.error("[Get All Featured] Error Occured", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get featured by contentType and content ID
const isFeatured = async (req, res) => {
  logger.info("Is Featured Endpoint Hit...");
  try {
    const { contentType, contentId } = req.params;
    const finalContentType = convertContentType(contentType);
    if (!finalContentType || !contentId) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid Media Id" });
    }
    const isFeatured = await Featured.findOne({
      contentType: finalContentType,
      contentId,
    })
      .populate("contentId")
      .exec();
    logger.info("[Is Featured] Successful");
    if (isFeatured) {
      res.status(200).json({ success: true, isFeatured: true });
    } else {
      res.status(200).json({ success: true, isFeatured: false });
    }
  } catch (error) {
    logger.error("[Is Featured] Error Occured", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const updateRating = async (req, res) => {
  logger.info("Update Rating Endpoint Hit...");
  try {
    const userId = req.body?.user?.userId || req.user?.userId || null;
    const { contentType, contentId, rating } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Please Login to Rate a Movie",
      });
    }

    if (!contentType) {
      return res.status(400).json({
        success: false,
        message: "Please provide contentType",
      });
    }

    if (!contentId) {
      return res.status(400).json({
        success: false,
        message: "Please provide contentId",
      });
    }

    // check if type of contentId is mongoose objectId
    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid contentId",
      });
    }

    if (!rating || isNaN(rating)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid rating",
      });
    }

    // Convert the contentType if necessary
    const finalContentType = convertContentType(contentType);

    // Validate input
    if (!finalContentType) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid contentType",
      });
    }

    if (!userId || !finalContentType || !contentId || !rating) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields. Please ensure userId, contentType, contentId, and rating are provided.",
      });
    }

    // Ensure the rating is within the valid range
    if (rating < 0 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 0 and 5.",
      });
    }

    // Check if the user has already rated this content
    const existingRating = await Rating.findOne({
      "content.contentId": contentId,
      "content.contentType": finalContentType,
      userId,
    });

    let updatedRating = null;

    if (existingRating) {
      // If rating already exists, update it
      existingRating.rating = rating;
      updatedRating = await existingRating.save();
    } else {
      // If no existing rating, create a new one
      const newRating = new Rating({
        content: {
          contentId,
          contentType: finalContentType,
        },
        userId,
        rating,
      });
      updatedRating = await newRating.save();
    }

    // Now, update the aggregate average rating for the movie or TV series
    const ratings = await Rating.aggregate([
      {
        $match: {
          "content.contentId": contentId,
          "content.contentType": finalContentType,
        },
      },
      {
        $group: {
          _id: "$content.contentId",
          averageRating: { $avg: "$rating" },
          ratingCount: { $sum: 1 },
        },
      },
    ]);

    if (ratings.length > 0) {
      const aggregateRating = ratings[0]; // Get the average rating and count
      const { averageRating, ratingCount } = aggregateRating;

      // Update the Movie or TV series document with the new aggregate rating
      if (finalContentType === "movie") {
        await Movie.findByIdAndUpdate(contentId, {
          "rating.averageRating": averageRating,
          "rating.ratingCount": ratingCount,
        });
      } else if (finalContentType === "tvseries") {
        await TvSeries.findByIdAndUpdate(contentId, {
          "rating.averageRating": averageRating,
          "rating.ratingCount": ratingCount,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: existingRating
        ? "Rating updated successfully."
        : "New rating added successfully.",
      data: updatedRating,
    });
  } catch (error) {
    logger.error("[Update Rating] Error Occurred", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getRating = async (req, res) => {
  logger.info("Get Rating Endpoint Hit...");
  try {
    const { contentType, contentId } = req.params;
    const userId = req.body?.user?.userId || req.user?.userId || null;

    if (!contentType || !contentId) {
      return res.status(400).json({
        success: false,
        message: "Please provide contentType and contentId.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contentId provided.",
      });
    }

    const finalContentType = convertContentType(contentType);

    if (!finalContentType) {
      return res.status(400).json({
        success: false,
        message: "Invalid contentType provided.",
      });
    }

    // 1. Get aggregate average rating and count
    const ratings = await Rating.aggregate([
      {
        $match: {
          "content.contentId": new mongoose.Types.ObjectId(contentId),
          "content.contentType": finalContentType,
        },
      },
      {
        $group: {
          _id: "$content.contentId",
          averageRating: { $avg: "$rating" },
          ratingCount: { $sum: 1 },
        },
      },
    ]);

    const aggregate = ratings[0] || {
      averageRating: 0,
      ratingCount: 0,
    };

    // 2. Get the current user's rating if userId is available
    let userRating = null;

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      const userRatingDoc = await Rating.findOne({
        "content.contentId": contentId,
        "content.contentType": finalContentType,
        userId,
      });

      userRating = userRatingDoc?.rating ?? null;
    }

    return res.status(200).json({
      success: true,
      message: "Rating fetched successfully.",
      data: {
        averageRating: aggregate.averageRating,
        ratingCount: aggregate.ratingCount,
        userRating, // null if not found or not logged in
      },
    });
  } catch (error) {
    logger.error("[Get Rating] Error Occurred", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const updateHomeContent = async (req, res) => {
  logger.info("Update Home Content Endpoint Hit...");
  try {
    const {
      contentType,
      isLatestVisible,
      isTrendingVisible,
      isHistoryVisible,
      isFavoritesVisible,
      isCategoriesVisible,
    } = req.body;
    const finalContentType = convertContentType(contentType);
    if (!finalContentType) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Content Type" });
    }
    const homeContent = await HomeContent.findOne({
      contentType: finalContentType,
    });
    if (!homeContent) {
      return res
        .status(404)
        .json({ success: false, message: "Home Content not found" });
    }
    homeContent.isLatestVisible = isLatestVisible;
    homeContent.isTrendingVisible = isTrendingVisible;
    homeContent.isHistoryVisible = isHistoryVisible;
    homeContent.isFavoritesVisible = isFavoritesVisible;
    homeContent.isCategoriesVisible = isCategoriesVisible;
    await homeContent.save();
    logger.info("[Update Home Content] Successful");
    return res.status(200).json({
      success: true,
      message: "Home Content updated successfully",
    });
  } catch (error) {
    logger.error("[Update Home Content] Error Occured", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getHomeContent = async (req, res) => {
  logger.info("Get Home Content Endpoint Hit...");
  try {
    const { contentType } = req.params;
    const finalContentType = convertContentType(contentType);
    if (!finalContentType) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Content Type" });
    }
    const homeContent = await HomeContent.findOne({
      contentType: finalContentType,
    });
    if (!homeContent) {
      return res
        .status(404)
        .json({ success: false, message: "Home Content not found" });
    }
    logger.info("[Get Home Content] Successful");
    return res.status(200).json({
      success: true,
      message: "Home Content fetched successfully",
      data: homeContent,
    });
  } catch (error) {
    logger.error("[Get Home Content] Error Occured", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Settings
const updateSubscriptionSettings = async (req, res) => {
  logger.info("Toggle Subscription Endpoint Hit...");
  try {
    const { isSubscriptionEnabled } = req.body;
    const settings = await Settings.findOne({
      name: "Settings",
    });

    if (![true, false].includes(isSubscriptionEnabled)) {
      return res.status(400).json({
        success: false,
        message: "Invalid isSubscriptionEnabled provided.",
      });
    }

    settings.isSubscriptionEnabled = isSubscriptionEnabled;

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully.",
    });
  } catch (error) {
    logger.error("[Toggle Subscription] Error Occurred", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getSubscriptionSettings = async (req, res) => {
  logger.info("Get Subscription Settings Endpoint Hit...");
  try {
    const settings = await Settings.findOne({
      name: "Settings",
    });
    return res.status(200).json({
      success: true,
      message: "Settings fetched successfully.",
      data: settings,
    });
  } catch (error) {
    logger.error("[Get Subscription Settings] Error Occurred", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  toggleFeatured,
  getAllFeaturedByType,
  isFeatured,
  updateRating,
  getRating,
  updateHomeContent,
  getHomeContent,
  updateSubscriptionSettings,
  getSubscriptionSettings,
};
