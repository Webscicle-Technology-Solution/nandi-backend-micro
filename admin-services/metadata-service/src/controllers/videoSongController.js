const { logger } = require("../utils/logger");
const VideoSong = require("../models/VideoSong");
const { redisClient } = require("../config/redisConfig");
const {
  validateCreateVideoSong,
  validateEditVideoSong,
  validateMongoId,
} = require("../utils/validation");
const {
  createOrAddGenre,
  updateOrCreateCastDetails,
  createCastDetails,
} = require("../utils/dbUtils");
const TVSeries = require("../models/TVSeriesModel/TVSeries");
const moment = require("moment");

// Create a VideoSong
const createVideoSong = async (req, res) => {
  logger.info("Create VideoSong Endpoint Hit...");

  try {
    if (req.body.genre) {
      req.body.genre = await createOrAddGenre(req.body.genre);
    }

    const { error } = validateCreateVideoSong(req.body);
    if (error) {
      logger.error("Validation Error", error.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const newVideoSong = new VideoSong({
      title: req.body.title,
      description: req.body.description || null,
      releaseDate: req.body.releaseDate
        ? moment(req.body.releaseDate, "DD-MM-YYYY").toDate()
        : null,
      publishDate: req.body.publishDate
        ? moment(req.body.publishDate, "DD-MM-YYYY").toDate()
        : null,
      genre: req.body.genre || null,
      posterId: req.body.posterId || null,
      bannerId: req.body.bannerId || null,
      videoId: req.body.videoId || null,
      status: req.body.status || null,
      createdAt: req.body.createdAt || Date.now(),
    });

    if (req.body.castDetails) {
      newVideoSong.castDetails = await createCastDetails(
        req.body.castDetails,
        "videoSongId",
        newVideoSong._id
      );
    }

    await newVideoSong.save();
    logger.info("[VideoSong Creation] Successful : ", newVideoSong._id);

    // Clear the cache for the search_videosong key after creating a new video song
    redisClient.keys("search_videosong:*", (err, keys) => {
      if (err) {
        logger.error("Error while fetching keys for cache clearing", err);
      } else {
        keys.forEach((key) => {
          redisClient.del(key, (err, response) => {
            if (err) {
              logger.error(`Error while deleting cache for key ${key}`, err);
            } else {
              logger.info(`Cache cleared for key: ${key}`);
            }
          });
        });
      }
    });

    res.status(201).json({
      success: true,
      message: "VideoSong Created Successfully",
      videoSongId: newVideoSong._id,
    });
  } catch (err) {
    logger.error("[Create VideoSong] Error Occurred", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get VideoSong by ID
const getVideoSongById = async (req, res) => {
  logger.info("Get VideoSong by ID Endpoint Hit...");
  try {
    const { error } = validateMongoId(req.params);
    if (error) {
      logger.error("Validation Error", error.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const videoSong = await VideoSong.findById(req.params.id)
      .populate("castDetails")
      .populate("genre");
    if (!videoSong) {
      return res
        .status(404)
        .json({ success: false, message: "VideoSong not found" });
    }

    logger.info("[Get VideoSong by ID] Successful");
    res.status(200).json({
      success: true,
      message: "VideoSong fetched successfully",
      videoSong,
    });
  } catch (err) {
    logger.error("[Get VideoSong by ID] Error Occured", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get All VideoSongs
const getAllVideoSongs = async (req, res) => {
  logger.info("Get All VideoSongs Endpoint Hit...");
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const videoSongs = await VideoSong.find({})
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const totalNoOfVideoSongs = await VideoSong.countDocuments({});

    const result = {
      currenetPage: page,
      totalPages: Math.ceil(totalNoOfVideoSongs / limit),
      totalVideoSongs: totalNoOfVideoSongs,
      videoSongs,
    };

    logger.info("[Get All VideoSongs] Successful");
    res.status(200).json({
      success: true,
      message: "VideoSongs fetched successfully",
      result,
    });
  } catch (err) {
    logger.error("[Get All VideoSongs] Error Occured", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Delete a VideoSong
const deleteVideoSong = async (req, res) => {
  logger.info("Delete VideoSong Endpoint Hit...");
  try {
    const { error } = validateMongoId(req.params);
    if (error) {
      logger.error("Validation Error", error.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const deletedVideoSong = await VideoSong.findOneAndDelete({
      _id: req.params.id,
    });

    if (!deletedVideoSong) {
      return res
        .status(404)
        .json({ success: false, message: "VideoSong not found" });
    }

    // Clear the whole cache for the search_videosong key after deleting a video song
    redisClient.keys("search_videosong:*", (err, keys) => {
      if (err) {
        logger.error("Error while fetching keys for cache clearing", err);
      } else {
        keys.forEach((key) => {
          redisClient.del(key, (err, response) => {
            if (err) {
              logger.error(`Error while deleting cache for key ${key}`, err);
            } else {
              logger.info(`Cache cleared for key: ${key}`);
            }
          });
        });
      }
    });

    logger.info("[Delete VideoSong] Successful : ", deletedVideoSong._id);
    res.status(200).json({
      success: true,
      message: "VideoSong deleted successfully",
    });
  } catch (err) {
    logger.error("[Delete VideoSong] Error Occurred", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Edit a VideoSong
const editVideoSong = async (req, res) => {
  logger.info("Edit VideoSong Endpoint Hit...");
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

    const { error: validationError } = validateEditVideoSong(req.body);
    if (validationError) {
      logger.error("Validation Error", validationError.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: validationError.details[0].message });
    }

    const videoSong = await VideoSong.findById(req.params.id);
    if (!videoSong) {
      return res
        .status(404)
        .json({ success: false, message: "VideoSong not found" });
    }

    // Update the video song fields
    if (req.body.title !== undefined) videoSong.title = req.body.title;
    if (req.body.description !== undefined)
      videoSong.description = req.body.description;
    if (req.body.releaseDate !== undefined && req.body.releaseDate !== null)
      videoSong.releaseDate = moment(
        req.body.releaseDate,
        "DD/MM/YYYY"
      ).toDate();
    if (req.body.publishDate !== undefined && req.body.publishDate !== null)
      videoSong.publishDate = moment(
        req.body.publishDate,
        "DD/MM/YYYY"
      ).toDate();
    if (req.body.genre !== undefined) videoSong.genre = req.body.genre;
    if (req.body.posterId !== undefined) videoSong.posterId = req.body.posterId;
    if (req.body.bannerId !== undefined) videoSong.bannerId = req.body.bannerId;
    if (req.body.videoId !== undefined) videoSong.videoId = req.body.videoId;
    if (req.body.status !== undefined) videoSong.status = req.body.status;

    if (req.body.castDetails) {
      await updateOrCreateCastDetails(
        req.body.castDetails,
        VideoSong,
        "videoSongId",
        videoSong._id
      );
    }

    await videoSong.save();

    // Clear the whole cache for the search_videosong key after editing a video song
    redisClient.keys("search_videosong:*", (err, keys) => {
      if (err) {
        logger.error("Error while fetching keys for cache clearing", err);
      } else {
        keys.forEach((key) => {
          redisClient.del(key, (err, response) => {
            if (err) {
              logger.error(`Error while deleting cache for key ${key}`, err);
            } else {
              logger.info(`Cache cleared for key: ${key}`);
            }
          });
        });
      }
    });

    logger.info("[Edit VideoSong] Successful : ", videoSong._id);
    res.status(200).json({
      success: true,
      message: "VideoSong edited successfully",
      videoSongId: videoSong._id,
    });
  } catch (error) {
    logger.error("[Edit VideoSong] Error Occurred", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  createVideoSong,
  getVideoSongById,
  getAllVideoSongs,
  deleteVideoSong,
  editVideoSong,
};
