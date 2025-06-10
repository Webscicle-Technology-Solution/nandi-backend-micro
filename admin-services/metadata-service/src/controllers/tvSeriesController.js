const { logger } = require("../utils/logger");
const TVSeries = require("../models/TVSeriesModel/TVSeries");
const { redisClient } = require("../config/redisConfig");
const {
  validateCreateTVSeries,
  validateEditTVSeries,
  validateMongoId,
} = require("../utils/validation");
const {
  createOrAddGenre,
  updateOrCreateCastDetails,
  createCastDetails,
} = require("../utils/dbUtils");
const moment = require("moment");

// Create a TV Series
const createTVSeries = async (req, res) => {
  logger.info("Create TV Series Endpoint Hit...");
  try {
    if (req.body.genre) {
      req.body.genre = await createOrAddGenre(req.body.genre);
    }
    const { error } = validateCreateTVSeries(req.body);
    if (error) {
      logger.error("Validation Error", error.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const newTVSeries = new TVSeries({
      title: req.body.title,
      description: req.body.description || null,
      posterId: req.body.posterId || null,
      bannerId: req.body.bannerId || null,
      status: req.body.status || null,
      releaseDate: req.body.releaseDate
        ? moment(req.body.releaseDate, "DD-MM-YYYY").toDate()
        : null, // Optional, allow null if not provided
      publishDate: req.body.publishDate
        ? moment(req.body.publishDate, "DD-MM-YYYY").toDate()
        : null, // Optional, allow null if not provided
      createdAt: req.body.createdAt || Date.now(),
    });

    if (req.body.castDetails) {
      newTVSeries.castDetails = await createCastDetails(
        req.body.castDetails,
        "tvSeriesId",
        newTVSeries._id
      );
    }

    await newTVSeries.save();
    logger.info("[TV Series Creation] Successful : ", newTVSeries._id);

    // Invalidate the cache to refresh search results after creation
    redisClient.keys("search_tvseries:*", (err, keys) => {
      if (err) logger.error("Error clearing cache for TV Series search", err);
      if (keys.length) {
        redisClient.del(keys, (err) => {
          if (err) logger.error("Error deleting cache keys", err);
        });
      }
    });

    res.status(201).json({
      success: true,
      message: "TV Series Created Successfully",
      tvSeriesId: newTVSeries._id,
    });
  } catch (err) {
    logger.error("[Create TV Series] Error Occurred", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get TV Series by ID
const getTVSeriesById = async (req, res) => {
  logger.info("Get TV Series by ID Endpoint Hit...");
  try {
    const { error } = validateMongoId(req.params);
    if (error) {
      logger.error("Validation Error", error.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const tvSeries = await TVSeries.findById(req.params.id)
      .populate("castDetails")
      .populate("genre");
    if (!tvSeries) {
      return res
        .status(404)
        .json({ success: false, message: "TV Series not found" });
    }

    logger.info("[Get TV Series by ID] Successful");
    res.status(200).json({
      success: true,
      message: "TV Series fetched successfully",
      tvSeries,
    });
  } catch (err) {
    logger.error("[Get TV Series by ID] Error Occurred", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get All TV Series
const getAllTVSeries = async (req, res) => {
  logger.info("Get All TV Series Endpoint Hit...");
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const tvSeries = await TVSeries.find({})
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const totalNoOfTVSeries = await TVSeries.countDocuments({});

    const result = {
      currentPage: page,
      totalPages: Math.ceil(totalNoOfTVSeries / limit),
      totalTVSeries: totalNoOfTVSeries,
      tvSeries,
    };

    logger.info("[Get All TV Series] Successful");
    res.status(200).json({
      success: true,
      message: "TV Series fetched successfully",
      result,
    });
  } catch (err) {
    logger.error("[Get All TV Series] Error Occurred", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Delete a TV Series
const deleteTVSeries = async (req, res) => {
  logger.info("Delete TV Series Endpoint Hit...");
  try {
    const { error } = validateMongoId(req.params);
    if (error) {
      logger.error("Validation Error", error.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const deletedTVSeries = await TVSeries.findByIdAndDelete(req.params.id);
    if (!deletedTVSeries) {
      return res
        .status(404)
        .json({ success: false, message: "TV Series not found" });
    }

    // Invalidate the cache to refresh search results after deletion
    redisClient.keys("search_tvseries:*", (err, keys) => {
      if (err) logger.error("Error clearing cache for TV Series search", err);
      if (keys.length) {
        redisClient.del(keys, (err) => {
          if (err) logger.error("Error deleting cache keys", err);
        });
      }
    });

    logger.info("[Delete TV Series] Successful : ", deletedTVSeries._id);
    res.status(200).json({
      success: true,
      message: "TV Series deleted successfully",
    });
  } catch (err) {
    logger.error("[Delete TV Series] Error Occurred", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Edit a TV Series
const editTVSeries = async (req, res) => {
  logger.info("Edit TV Series Endpoint Hit...");
  try {
    if (req.body.genre) {
      req.body.genre = await createOrAddGenre(req.body.genre);
    }
    const { error } = validateMongoId(req.params);
    if (error) {
      logger.error("Validation Error", error.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    // Validate the update data
    const { error: validationError } = validateEditTVSeries(req.body);
    if (validationError) {
      logger.error("Validation Error", validationError.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: validationError.details[0].message });
    }

    const tvSeries = await TVSeries.findById(req.params.id);
    if (!tvSeries) {
      return res
        .status(404)
        .json({ success: false, message: "TV Series not found" });
    }

    // Update only provided fields
    if (req.body.title !== undefined) tvSeries.title = req.body.title;
    if (req.body.description !== undefined)
      tvSeries.description = req.body.description;
    if (req.body.posterId !== undefined) tvSeries.posterId = req.body.posterId;
    if (req.body.bannerId !== undefined) tvSeries.bannerId = req.body.bannerId;
    if (req.body.status !== undefined) tvSeries.status = req.body.status;
    if (req.body.releaseDate !== undefined && req.body.releaseDate !== null)
      tvSeries.releaseDate = moment(
        req.body.releaseDate,
        "DD/MM/YYYY"
      ).toDate();
    if (req.body.publishDate !== undefined && req.body.publishDate !== null)
      tvSeries.publishDate = moment(
        req.body.publishDate,
        "DD/MM/YYYY"
      ).toDate();

    if (req.body.castDetails) {
      await updateOrCreateCastDetails(
        req.body.castDetails,
        TVSeries,
        "tvSeriesId",
        tvSeries._id
      );
    }

    await tvSeries.save();

    // Invalidate the cache to refresh search results after editing
    redisClient.keys("search_tvseries:*", (err, keys) => {
      if (err) logger.error("Error clearing cache for TV Series search", err);
      if (keys.length) {
        redisClient.del(keys, (err) => {
          if (err) logger.error("Error deleting cache keys", err);
        });
      }
    });

    logger.info("[Edit TV Series] Successful : ", tvSeries._id);
    res.status(200).json({
      success: true,
      message: "TV Series edited successfully",
      tvSeriesId: tvSeries._id,
    });
  } catch (error) {
    logger.error("[Edit TV Series] Error Occurred", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  createTVSeries,
  getTVSeriesById,
  getAllTVSeries,
  deleteTVSeries,
  editTVSeries,
};
