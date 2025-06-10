const { logger } = require("../utils/logger");
const Episode = require("../models/TVSeriesModel/Episode");
const {
  validateCreateEpisode,
  validateEditEpisode,
  validateMongoId,
} = require("../utils/validation");
const Season = require("../models/TVSeriesModel/Season");
const TVSeries = require("../models/TVSeriesModel/TVSeries");
const moment = require("moment");

// Create an Episode
const createEpisode = async (req, res) => {
  logger.info("Create Episode Endpoint Hit...");
  try {
    const { error } = validateCreateEpisode(req.body);
    if (error) {
      logger.error("Validation Error", error.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const season = await Season.findById(req.body.seasonId);
    if (!season) {
      return res
        .status(404)
        .json({ success: false, message: "Season not found" });
    }
    const tvSeries = await TVSeries.findById(season.tvSeriesId);

    if (!tvSeries) {
      return res
        .status(404)
        .json({ success: false, message: "TV Series not found" });
    }

    // Get all existing episodes for the given season
    const existingEpisodes = await Episode.find({
      seasonId: req.body.seasonId,
    });

    // Check if the episode number already exists in the season
    const episodeNumberExists = existingEpisodes.some(
      (episode) => episode.episodeNumber === Number(req.body.episodeNumber)
    );

    if (episodeNumberExists) {
      logger.error(
        `[Create Episode] Error Episode number ${req.body.episodeNumber} already exists for Season ID ${req.body.seasonId}`
      );
      return res.status(400).json({
        success: false,
        message: "Episode number already exists in this season",
      });
    }

    const newEpisode = new Episode({
      title: req.body.title,
      seasonId: req.body.seasonId,
      tvSeriesId: tvSeries._id,
      releaseDate: req.body.releaseDate
        ? moment(req.body.releaseDate, "DD-MM-YYYY").toDate()
        : null, // Optional, allow null if not provided
      publishDate: req.body.publishDate
        ? moment(req.body.publishDate, "DD-MM-YYYY").toDate()
        : null, // Optional, allow null if not provided
      episodeNumber: req.body.episodeNumber,
      status: req.body.status || null,
      createdAt: req.body.createdAt || Date.now(),
    });

    await newEpisode.save();
    logger.info("[Episode Creation] Successful : ", newEpisode._id);
    res.status(201).json({
      success: true,
      message: "Episode Created Successfully",
      episodeId: newEpisode._id,
    });
  } catch (err) {
    logger.error("[Create Episode] Error Occurred", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get Episode by ID
const getEpisodeById = async (req, res) => {
  logger.info("Get Episode by ID Endpoint Hit...");
  try {
    // const { error } = validateMongoId(req.params);
    // if (error) {
    //   logger.error("Validation Error", error.details[0].message);
    //   return res
    //     .status(400)
    //     .json({ success: false, message: error.details[0].message });
    // }

    if (!req.params.id) {
      logger.error("Validation Error", "Episode ID is required");
      return res
        .status(400)
        .json({ success: false, message: "Episode ID is required" });
    }
    const episode = await Episode.findById(req.params.id);
    if (!episode) {
      return res
        .status(404)
        .json({ success: false, message: "Episode not found" });
    }

    logger.info("[Get Episode by ID] Successful");
    res.status(200).json({
      success: true,
      message: "Episode fetched successfully",
      episode,
    });
  } catch (err) {
    logger.error("[Get Episode by ID] Error Occurred", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get All Episodes
const getAllEpisodes = async (req, res) => {
  logger.info("Get All Episodes Endpoint Hit...");
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    if (!req.params.seasonId) {
      logger.error("Validation Error", "Season ID is required");
      return res
        .status(400)
        .json({ success: false, message: "Season ID is required" });
    }

    const episodes = await Episode.find({ seasonId: req.params.seasonId })
      .sort({ episodeNumber: 1 })
      .skip(startIndex)
      .limit(limit);

    const totalNoOfEpisodes = await Episode.countDocuments({
      seasonId: req.params.seasonId,
    });

    const result = {
      currentPage: page,
      totalPages: Math.ceil(totalNoOfEpisodes / limit),
      totalEpisodes: totalNoOfEpisodes,
      episodes,
    };

    logger.info("[Get All Episodes] Successful");
    res.status(200).json({
      success: true,
      message: "Episodes fetched successfully",
      result,
    });
  } catch (err) {
    logger.error("[Get All Episodes] Error Occurred", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Delete an Episode
const deleteEpisode = async (req, res) => {
  logger.info("Delete Episode Endpoint Hit...");
  try {
    // const { error } = validateMongoId(req.params);
    // if (error) {
    //   logger.error("Validation Error", error.details[0].message);
    //   return res
    //     .status(400)
    //     .json({ success: false, message: error.details[0].message });
    // }
    if (!req.params.id) {
      logger.error("Validation Error", "Episode ID is required");
      return res
        .status(400)
        .json({ success: false, message: "Episode ID is required" });
    }
    const deletedEpisode = await Episode.findByIdAndDelete(req.params.id);
    if (!deletedEpisode) {
      return res
        .status(404)
        .json({ success: false, message: "Episode not found" });
    }

    logger.info("[Delete Episode] Successful : ", deletedEpisode._id);
    res.status(200).json({
      success: true,
      message: "Episode deleted successfully",
    });
  } catch (err) {
    logger.error("[Delete Episode] Error Occurred", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Edit an Episode
const editEpisode = async (req, res) => {
  logger.info("Edit Episode Endpoint Hit...");
  try {
    // Validation for Episode ID
    if (!req.params.id) {
      logger.error("Validation Error", "Episode ID is required");
      return res
        .status(400)
        .json({ success: false, message: "Episode ID is required" });
    }

    const { error: validationError } = validateEditEpisode(req.body);
    if (validationError) {
      logger.error("Validation Error", validationError.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: validationError.details[0].message });
    }

    const episode = await Episode.findById(req.params.id);
    if (!episode) {
      return res
        .status(404)
        .json({ success: false, message: "Episode not found" });
    }

    const season = await Season.findById(episode.seasonId);
    if (!season) {
      return res
        .status(404)
        .json({ success: false, message: "Season not found" });
    }

    // Get all episodes for the same season to check for duplicate episode numbers
    const existingEpisodes = await Episode.find({ seasonId: season._id });

    // Check if the episode number already exists for another episode in the same season (excluding the current episode)
    const episodeNumberExists = existingEpisodes.some(
      (existingEpisode) =>
        existingEpisode.episodeNumber === Number(req.body.episodeNumber) &&
        existingEpisode._id.toString() !== episode._id.toString()
    );

    if (episodeNumberExists) {
      logger.error(
        `[Edit Episode] Error Episode number ${req.body.episodeNumber} already exists for Season ID ${season._id}`
      );
      return res.status(400).json({
        success: false,
        message: "Episode number already exists for this season",
      });
    }

    // Proceed with editing the episode details
    if (req.body.title !== undefined) episode.title = req.body.title;
    if (req.body.episodeNumber !== undefined)
      episode.episodeNumber = req.body.episodeNumber;
    if (req.body.description !== undefined)
      episode.description = req.body.description;
    if (req.body.releaseDate !== undefined && req.body.releaseDate !== null)
      episode.releaseDate = moment(req.body.releaseDate, "DD/MM/YYYY").toDate();
    if (req.body.publishDate !== undefined && req.body.publishDate !== null)
      episode.publishDate = moment(req.body.publishDate, "DD/MM/YYYY").toDate();
    if (req.body.status !== undefined) episode.status = req.body.status;

    await episode.save();

    logger.info("[Edit Episode] Successful : ", episode._id);
    res.status(200).json({
      success: true,
      message: "Episode edited successfully",
      episodeId: episode._id,
    });
  } catch (error) {
    logger.error("[Edit Episode] Error Occurred", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  createEpisode,
  getEpisodeById,
  getAllEpisodes,
  deleteEpisode,
  editEpisode,
};
