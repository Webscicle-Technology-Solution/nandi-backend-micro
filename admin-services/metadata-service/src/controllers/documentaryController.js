const { logger } = require("../utils/logger");
const Documentary = require("../models/Documentary");
const {
  validateCreateDocumentary,
  validateEditDocumentary,
  validateMongoId,
} = require("../utils/validation");
const { redisClient } = require("../config/redisConfig");
const {
  createOrAddGenre,
  createCastDetails,
  updateOrCreateCastDetails,
} = require("../utils/dbUtils");
const moment = require("moment");

const { capitalizeCastDetails } = require("../utils/inputUtils");

// Create a Documentary
const createDocumentary = async (req, res) => {
  logger.info("Create Documentary Endpoint Hit...");
  try {
    if (req.body.genre) {
      req.body.genre = await createOrAddGenre(req.body.genre);
    }

    const { error } = validateCreateDocumentary(req.body);
    if (error) {
      logger.error("Validation Error", error.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const newDocumentary = new Documentary({
      title: req.body.title,
      description: req.body.description || null,
      releaseDate: req.body.releaseDate
        ? moment(req.body.releaseDate, "DD-MM-YYYY").toDate()
        : null, // Optional, allow null if not provided
      publishDate: req.body.publishDate
        ? moment(req.body.publishDate, "DD-MM-YYYY").toDate()
        : null, // Optional, allow null if not provided
      genre: req.body.genre || null,
      posterId: req.body.posterId || null,
      bannerId: req.body.bannerId || null,
      videoId: req.body.videoId || null,
      status: req.body.status || null,
      createdAt: req.body.createdAt || Date.now(),
    });

    if (req.body.castDetails) {
      newDocumentary.castDetails = await createCastDetails(
        req.body.castDetails,
        "documentaryId",
        newDocumentary._id
      );
    }

    await newDocumentary.save();
    logger.info("[Documentary Creation] Successful : ", newDocumentary._id);

    // Clear the whole cache for the search_documentary key after creating a new documentary
    redisClient.keys("search_documentary:*", (err, keys) => {
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
      message: "Documentary Created Successfully",
      documentaryId: newDocumentary._id,
    });
  } catch (err) {
    logger.error("[Create Documentary] Error Occured", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get Documentary by ID
const getDocumentaryById = async (req, res) => {
  logger.info("Get Documentary by ID Endpoint Hit...");
  try {
    const { error } = validateMongoId(req.params);
    if (error) {
      logger.error("Validation Error", error.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const documentary = await Documentary.findById(req.params.id)
      .populate("castDetails")
      .populate("genre");
    if (!documentary) {
      return res
        .status(404)
        .json({ success: false, message: "Documentary not found" });
    }

    logger.info("[Get Documentary by ID] Successful");
    res.status(200).json({
      success: true,
      message: "Documentary fetched successfully",
      documentary,
    });
  } catch (err) {
    logger.error("[Get Documentary by ID] Error Occured", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get All Documentaries
const getAllDocumentaries = async (req, res) => {
  logger.info("Get All Documentaries Endpoint Hit...");
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const documentaries = await Documentary.find({})
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const totalNoOfDocumentaries = await Documentary.countDocuments({});

    const result = {
      currenetPage: page,
      totalPages: Math.ceil(totalNoOfDocumentaries / limit),
      totalDocumentaries: totalNoOfDocumentaries,
      documentaries,
    };

    logger.info("[Get All Documentaries] Successful");
    res.status(200).json({
      success: true,
      message: "Documentaries fetched successfully",
      result,
    });
  } catch (err) {
    logger.error("[Get All Documentaries] Error Occured", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Delete a Documentary
const deleteDocumentary = async (req, res) => {
  logger.info("Delete Documentary Endpoint Hit...");
  try {
    const { error } = validateMongoId(req.params);
    if (error) {
      logger.error("Validation Error", error.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const deletedDocumentary = await Documentary.findOneAndDelete({
      _id: req.params.id,
    });

    if (!deletedDocumentary) {
      return res
        .status(404)
        .json({ success: false, message: "Documentary not found" });
    }

    // Clear the whole cache for the search_documentary key after deleting a documentary
    redisClient.keys("search_documentary:*", (err, keys) => {
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

    logger.info("[Delete Documentary] Successful : ", deletedDocumentary._id);
    res.status(200).json({
      success: true,
      message: "Documentary deleted successfully",
    });
  } catch (err) {
    logger.error("[Delete Documentary] Error Occured", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Edit a Documentary
const editDocumentary = async (req, res) => {
  logger.info("Edit Documentary Endpoint Hit...");
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

    const { error: validationError } = validateEditDocumentary(req.body);
    if (validationError) {
      logger.error("Validation Error", validationError.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: validationError.details[0].message });
    }

    const documentary = await Documentary.findById(req.params.id);

    if (!documentary) {
      return res
        .status(404)
        .json({ success: false, message: "Documentary not found" });
    }

    // Update the documentary fields
    if (req.body.title !== undefined) documentary.title = req.body.title;
    if (req.body.description !== undefined)
      documentary.description = req.body.description;
    if (req.body.releaseDate !== undefined && req.body.releaseDate !== null)
      documentary.releaseDate = moment(
        req.body.releaseDate,
        "DD/MM/YYYY"
      ).toDate();
    if (req.body.publishDate !== undefined && req.body.publishDate !== null)
      documentary.publishDate = moment(
        req.body.publishDate,
        "DD/MM/YYYY"
      ).toDate();
    if (req.body.genre !== undefined) documentary.genre = req.body.genre;
    if (req.body.posterId !== undefined)
      documentary.posterId = req.body.posterId;
    if (req.body.bannerId !== undefined)
      documentary.bannerId = req.body.bannerId;
    if (req.body.videoId !== undefined) documentary.videoId = req.body.videoId;
    if (req.body.status !== undefined) documentary.status = req.body.status;

    if (req.body.castDetails) {
      await updateOrCreateCastDetails(
        req.body.castDetails,
        Documentary,
        "documentaryId",
        documentary._id
      );
    }

    await documentary.save();

    // Clear the whole cache for the search_documentary key after editing a documentary
    redisClient.keys("search_documentary:*", (err, keys) => {
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

    logger.info("[Edit Documentary] Successful : ", documentary._id);
    res.status(200).json({
      success: true,
      message: "Documentary edited successfully",
      documentaryId: documentary._id,
    });
  } catch (error) {
    logger.error("[Edit Documentary] Error Occured", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  createDocumentary,
  getDocumentaryById,
  getAllDocumentaries,
  deleteDocumentary,
  editDocumentary,
};
