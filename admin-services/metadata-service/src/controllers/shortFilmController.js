const { logger } = require("../utils/logger");
const ShortFilm = require("../models/ShortFilm");
const { redisClient } = require("../config/redisConfig");
const {
  validateCreateShortFilm,
  validateEditShortFilm,
  validateMongoId,
} = require("../utils/validation");
const {
  createOrAddGenre,
  updateOrCreateCastDetails,
  createCastDetails,
} = require("../utils/dbUtils");
const moment = require("moment");

// Create a ShortFilm
const createShortFilm = async (req, res) => {
  logger.info("Create ShortFilm Endpoint Hit...");
  try {
    if (req.body.genre) {
      req.body.genre = await createOrAddGenre(req.body.genre);
    }
    const { error } = validateCreateShortFilm(req.body);
    if (error) {
      logger.error("Validation Error", error.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const newShortFilm = new ShortFilm({
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
      newShortFilm.castDetails = await createCastDetails(
        req.body.castDetails,
        "shortFilmId",
        newShortFilm._id
      );
    }

    await newShortFilm.save();

    // Clear cache for search_shortfilm:* after creating a new short film
    redisClient.keys("search_shortfilm:*", (err, keys) => {
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

    logger.info("[ShortFilm Creation] Successful : ", newShortFilm._id);
    res.status(201).json({
      success: true,
      message: "ShortFilm Created Successfully",
      shortFilmId: newShortFilm._id,
    });
  } catch (err) {
    logger.error("[Create ShortFilm] Error Occurred", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get ShortFilm by ID
const getShortFilmById = async (req, res) => {
  logger.info("Get ShortFilm by ID Endpoint Hit...");
  try {
    const { error } = validateMongoId(req.params);
    if (error) {
      logger.error("Validation Error", error.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const shortFilm = await ShortFilm.findById(req.params.id)
      .populate("castDetails")
      .populate("genre");
    if (!shortFilm) {
      return res
        .status(404)
        .json({ success: false, message: "ShortFilm not found" });
    }

    logger.info("[Get ShortFilm by ID] Successful");
    res.status(200).json({
      success: true,
      message: "ShortFilm fetched successfully",
      shortFilm,
    });
  } catch (err) {
    logger.error("[Get ShortFilm by ID] Error Occured", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get All ShortFilms
const getAllShortFilms = async (req, res) => {
  logger.info("Get All ShortFilms Endpoint Hit...");
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const shortFilms = await ShortFilm.find({})
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const totalNoOfShortFilms = await ShortFilm.countDocuments({});

    const result = {
      currenetPage: page,
      totalPages: Math.ceil(totalNoOfShortFilms / limit),
      totalShortFilms: totalNoOfShortFilms,
      shortFilms,
    };

    logger.info("[Get All ShortFilms] Successful");
    res.status(200).json({
      success: true,
      message: "ShortFilms fetched successfully",
      result,
    });
  } catch (err) {
    logger.error("[Get All ShortFilms] Error Occured", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Delete a ShortFilm
const deleteShortFilm = async (req, res) => {
  logger.info("Delete ShortFilm Endpoint Hit...");
  try {
    const { error } = validateMongoId(req.params);
    if (error) {
      logger.error("Validation Error", error.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const deletedShortFilm = await ShortFilm.findOneAndDelete({
      _id: req.params.id,
    });

    if (!deletedShortFilm) {
      return res
        .status(404)
        .json({ success: false, message: "ShortFilm not found" });
    }

    // Clear the whole cache for search_shortfilm:* after deleting a short film
    redisClient.keys("search_shortfilm:*", (err, keys) => {
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

    logger.info("[Delete ShortFilm] Successful : ", deletedShortFilm._id);
    res.status(200).json({
      success: true,
      message: "ShortFilm deleted successfully",
    });
  } catch (err) {
    logger.error("[Delete ShortFilm] Error Occurred", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Edit ShortFilm
const editShortFilm = async (req, res) => {
  logger.info("Edit ShortFilm Endpoint Hit...");
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

    const { error: validationError } = validateEditShortFilm(req.body);
    if (validationError) {
      logger.error("Validation Error", validationError.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: validationError.details[0].message });
    }

    const shortFilm = await ShortFilm.findById(req.params.id);

    if (!shortFilm) {
      return res
        .status(404)
        .json({ success: false, message: "ShortFilm not found" });
    }

    // Update the short film fields
    if (req.body.title !== undefined) shortFilm.title = req.body.title;
    if (req.body.description !== undefined)
      shortFilm.description = req.body.description;
    if (req.body.releaseDate !== undefined && req.body.releaseDate !== null)
      shortFilm.releaseDate = moment(
        req.body.releaseDate,
        "DD/MM/YYYY"
      ).toDate();
    if (req.body.publishDate !== undefined && req.body.publishDate !== null)
      shortFilm.publishDate = moment(
        req.body.publishDate,
        "DD/MM/YYYY"
      ).toDate();
    if (req.body.genre !== undefined) shortFilm.genre = req.body.genre;
    if (req.body.posterId !== undefined) shortFilm.posterId = req.body.posterId;
    if (req.body.bannerId !== undefined) shortFilm.bannerId = req.body.bannerId;
    if (req.body.videoId !== undefined) shortFilm.videoId = req.body.videoId;
    if (req.body.status !== undefined) shortFilm.status = req.body.status;

    if (req.body.castDetails) {
      await updateOrCreateCastDetails(
        req.body.castDetails,
        ShortFilm,
        "shortFilmId",
        shortFilm._id
      );
    }

    await shortFilm.save();

    // Clear the cache for search_shortfilm:* after editing a short film
    redisClient.keys("search_shortfilm:*", (err, keys) => {
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

    logger.info("[Edit ShortFilm] Successful : ", shortFilm._id);
    res.status(200).json({
      success: true,
      message: "ShortFilm edited successfully",
      shortFilmId: shortFilm._id,
    });
  } catch (error) {
    logger.error("[Edit ShortFilm] Error Occurred", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  createShortFilm,
  getShortFilmById,
  getAllShortFilms,
  deleteShortFilm,
  editShortFilm,
};
