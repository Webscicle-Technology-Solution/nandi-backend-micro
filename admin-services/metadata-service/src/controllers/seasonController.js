const { logger } = require("../utils/logger");
const Season = require("../models/TVSeriesModel/Season");
const TVSeries = require("../models/TVSeriesModel/TVSeries");
const {
  validateCreateSeason,
  validateEditSeason,
  validateMongoId,
} = require("../utils/validation");
const moment = require("moment");

// Create a Season
const createSeason = async (req, res) => {
  logger.info(
    `Create Season Endpoint Hit... Request params: ${req.params.tvSeriesId}`
  );

  try {
    const { error } = validateCreateSeason(req.body);
    if (error) {
      logger.error("Validation Error", error.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    if (!req.params.tvSeriesId) {
      logger.error("Validation Error", "TV Series ID is required");
      return res
        .status(400)
        .json({ success: false, message: "TV Series ID is required" });
    }

    const tvSeries = await TVSeries.findById(req.params.tvSeriesId);
    if (!tvSeries) {
      logger.error(
        `[Create Season] Error TV Series not found with ID ${req.params.tvSeriesId}`
      );
      return res.status(404).json({
        success: false,
        message: "TV Series not found",
      });
    }

    // get all existing seasons
    const existingSeasons = await Season.find({
      tvSeriesId: req.params.tvSeriesId,
    });

    // check if season number already exists
    const seasonNumberExists = existingSeasons.some(
      (season) => season.seasonNumber == Number(req.body.seasonNumber)
    );

    if (seasonNumberExists) {
      logger.error(
        `[Create Season] Error Season number ${req.body.seasonNumber} already exists for TV Series ID ${req.params.tvSeriesId}`
      );
      return res.status(400).json({
        success: false,
        message: "Season number already exists",
      });
    }

    const newSeason = new Season({
      tvSeriesId: req.params.tvSeriesId,
      seasonNumber: req.body.seasonNumber,
      releaseDate: req.body.releaseDate
        ? moment(req.body.releaseDate, "DD-MM-YYYY").toDate()
        : null, // Optional, allow null if not provided
      publishDate: req.body.publishDate
        ? moment(req.body.publishDate, "DD-MM-YYYY").toDate()
        : null, // Optional, allow null if not provided
      status: req.body.status || null,
      createdAt: req.body.createdAt || Date.now(),
    });

    await newSeason.save();
    logger.info("[Season Creation] Successful : ", newSeason._id);
    res.status(201).json({
      success: true,
      message: "Season Created Successfully",
      seasonId: newSeason._id,
    });
  } catch (err) {
    logger.error("[Create Season] Error Occurred", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get Season by ID
const getSeasonById = async (req, res) => {
  logger.info("Get Season by ID Endpoint Hit...");
  try {
    // const { error } = validateMongoId(req.params);
    // if (error) {
    //   logger.error("Validation Error", error.details[0].message);
    //   return res
    //     .status(400)
    //     .json({ success: false, message: error.details[0].message });
    // }

    if (!req.params.id) {
      logger.error("Validation Error", "Season ID is required");
      return res
        .status(400)
        .json({ success: false, message: "Season ID is required" });
    }

    const season = await Season.findById(req.params.id);
    if (!season) {
      return res
        .status(404)
        .json({ success: false, message: "Season not found" });
    }

    logger.info("[Get Season by ID] Successful");
    res.status(200).json({
      success: true,
      message: "Season fetched successfully",
      season,
    });
  } catch (err) {
    logger.error("[Get Season by ID] Error Occurred", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get All Seasons
const getAllSeasons = async (req, res) => {
  logger.info("Get All Seasons Endpoint Hit...");
  try {
    const tvSeriesId = req.params.tvSeriesId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    if (!tvSeriesId) {
      logger.error("Validation Error", "TV Series ID is required");
      return res
        .status(400)
        .json({ success: false, message: "TV Series ID is required" });
    }

    const seasons = await Season.find({ tvSeriesId: tvSeriesId })
      .sort({ seasonNumber: 1 })
      .skip(startIndex)
      .limit(limit);

    const totalNoOfSeasons = await Season.countDocuments({
      tvSeriesId: tvSeriesId,
    });

    const result = {
      currentPage: page,
      totalPages: Math.ceil(totalNoOfSeasons / limit),
      totalSeasons: totalNoOfSeasons,
      seasons,
    };

    logger.info("[Get All Seasons] Successful");
    res.status(200).json({
      success: true,
      message: "Seasons fetched successfully",
      result,
    });
  } catch (err) {
    logger.error("[Get All Seasons] Error Occurred", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Delete a Season
const deleteSeason = async (req, res) => {
  logger.info("Delete Season Endpoint Hit...");
  try {
    // const { error } = validateMongoId(req.params);
    // if (error) {
    //   logger.error("Validation Error", error.details[0].message);
    //   return res
    //     .status(400)
    //     .json({ success: false, message: error.details[0].message });
    // }

    if (!req.params.id) {
      logger.error("Validation Error", "Season ID is required");
      return res
        .status(400)
        .json({ success: false, message: "Season ID is required" });
    }

    const deletedSeason = await Season.findByIdAndDelete(req.params.id);
    if (!deletedSeason) {
      return res
        .status(404)
        .json({ success: false, message: "Season not found" });
    }

    logger.info("[Delete Season] Successful : ", deletedSeason._id);
    res.status(200).json({
      success: true,
      message: "Season deleted successfully",
    });
  } catch (err) {
    logger.error("[Delete Season] Error Occurred", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Edit a Season
// const editSeason = async (req, res) => {
//   logger.info("Edit Season Endpoint Hit...");
//   try {
//     // const { error } = validateMongoId(req.params);
//     // if (error) {
//     //   logger.error("Validation Error", error.details[0].message);
//     //   return res
//     //     .status(400)
//     //     .json({ success: false, message: error.details[0].message });
//     // }

//     const { error: validationError } = validateEditSeason(req.body);
//     if (validationError) {
//       logger.error("Validation Error", validationError.details[0].message);
//       return res
//         .status(400)
//         .json({ success: false, message: validationError.details[0].message });
//     }

//     const season = await Season.findById(req.params.id);
//     if (!season) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Season not found" });
//     }

//     // Get all existing seasons for the TV Series and check if the season number already exists
//     const existingSeasons = await Season.find({
//       tvSeriesId: season.tvSeriesId,
//     });
//     // Get ID of season if season number exists
//     const existingSeasonIds = existingSeasons.map((season) => season._id);
//     if (existingSeasonIds.includes(Number(req.body.seasonNumber))) {
//       // check if the id of the season being edited is same as existing season ID
//       if (!existingSeasonIds.includes(season._id)) {
//         return res
//           .status(400)
//           .json({ success: false, message: "Season number already exists" });
//       }
//     }

//     if (req.body.seasonNumber !== undefined)
//       season.seasonNumber = req.body.seasonNumber;
//     if (req.body.releaseDate !== undefined && req.body.releaseDate !== null)
//       season.releaseDate = moment(req.body.releaseDate, "DD/MM/YYYY").toDate();
//     if (req.body.publishDate !== undefined && req.body.publishDate !== null)
//       season.publishDate = moment(req.body.publishDate, "DD/MM/YYYY").toDate();
//     if (req.body.status !== undefined) season.status = req.body.status;

//     await season.save();

//     logger.info("[Edit Season] Successful : ", season._id);
//     res.status(200).json({
//       success: true,
//       message: "Season edited successfully",
//       seasonId: season._id,
//     });
//   } catch (error) {
//     logger.error("[Edit Season] Error Occurred", error);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };

const editSeason = async (req, res) => {
  logger.info("Edit Season Endpoint Hit...");
  try {
    const { error: validationError } = validateEditSeason(req.body);
    if (validationError) {
      logger.error("Validation Error", validationError.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: validationError.details[0].message });
    }

    const season = await Season.findById(req.params.id);
    if (!season) {
      return res
        .status(404)
        .json({ success: false, message: "Season not found" });
    }

    // Get all existing seasons for the TV series and check if the new season number already exists (excluding the current season)
    const existingSeasons = await Season.find({
      tvSeriesId: season.tvSeriesId,
    });

    // Check if the new season number exists in the existing seasons (excluding the current one)
    const seasonNumberExists = existingSeasons.some(
      (existingSeason) =>
        existingSeason.seasonNumber === Number(req.body.seasonNumber) &&
        existingSeason._id.toString() !== season._id.toString()
    );

    if (seasonNumberExists) {
      logger.error(
        `[Edit Season] Error Season number ${req.body.seasonNumber} already exists for TV Series ID ${season.tvSeriesId}`
      );
      return res.status(400).json({
        success: false,
        message: "Season number already exists",
      });
    }

    // Proceed with editing the season
    if (req.body.seasonNumber !== undefined) {
      season.seasonNumber = req.body.seasonNumber;
    }
    if (req.body.releaseDate !== undefined && req.body.releaseDate !== null) {
      season.releaseDate = moment(req.body.releaseDate, "DD/MM/YYYY").toDate();
    }
    if (req.body.publishDate !== undefined && req.body.publishDate !== null) {
      season.publishDate = moment(req.body.publishDate, "DD/MM/YYYY").toDate();
    }
    if (req.body.status !== undefined) {
      season.status = req.body.status;
    }

    await season.save();

    logger.info("[Edit Season] Successful : ", season._id);
    res.status(200).json({
      success: true,
      message: "Season edited successfully",
      seasonId: season._id,
    });
  } catch (error) {
    logger.error("[Edit Season] Error Occurred", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  createSeason,
  getSeasonById,
  getAllSeasons,
  deleteSeason,
  editSeason,
};
