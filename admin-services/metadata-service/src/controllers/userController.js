const { logger } = require("../utils/logger");
const Episode = require("../models/TVSeriesModel/Episode");
const Movie = require("../models/Movie");
const Documentary = require("../models/Documentary");
const ShortFilm = require("../models/ShortFilm");
const VideoSong = require("../models/VideoSong");
const TVSeries = require("../models/TVSeriesModel/TVSeries");

// Shared filter logic
const getActiveOrPublishedFilter = () => ({
  isReady: true,
  $or: [
    { status: "active" },
    { status: "scheduled", publishDate: { $lte: new Date() } },
  ],
});
const getRentableFilter = () => ({
  status: { $in: ["active", "scheduled"] },
  $or: [
    { status: "active" },
    { status: "scheduled", publishDate: { $lte: new Date() } },
  ],
  "accessParams.isRentable": true,
});
const getFreeFilter = () => ({
  status: { $in: ["active", "scheduled"] },
  $or: [
    { status: "active" },
    { status: "scheduled", publishDate: { $lte: new Date() } },
  ],
  "accessParams.isFree": true,
});
const getComingSoonFilter = () => ({
  status: "scheduled",
  publishDate: { $gt: new Date() },
});

// Cleanup function
const cleanupScheduledItems = async () => {
  try {
    const models = [Movie, Documentary, ShortFilm, VideoSong, TVSeries];

    // Process all models in parallel to update items with past scheduled publish dates to active
    await Promise.all(
      models.map(async (Model) => {
        await Model.updateMany(
          {
            status: "scheduled",
            publishDate: { $lt: new Date() },
          },
          { status: "active" }
        );
        logger.info(`Successfully cleaned up ${Model.modelName}s.`);
      })
    );
  } catch (error) {
    logger.error("Error during cleanup of scheduled items", error);
  }
};

// Generic: latest 20 (no pagination)
const getLatest = (Model) => async (req, res) => {
  logger.info(`Get Latest ${Model.modelName}s Endpoint Hit...`);

  // Trigger the cleanup asynchronously in the background
  cleanupScheduledItems();

  try {
    const items = await Model.find(getActiveOrPublishedFilter())
      .sort({ publishDate: -1 })
      .limit(20);

    return res.status(200).json({ success: true, data: items });
  } catch (error) {
    logger.error(`Error fetching latest ${Model.modelName}s`, error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Generic: paginated latest items
const getAllLatest = (Model) => async (req, res) => {
  logger.info(`Get All Latest ${Model.modelName}s Endpoint Hit...`);

  // Trigger the cleanup asynchronously in the background
  cleanupScheduledItems();

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const filter = getActiveOrPublishedFilter();

    const items = await Model.find(filter)
      .sort({ publishDate: -1 })
      .skip(startIndex)
      .limit(limit);

    const totalItems = await Model.countDocuments(filter);

    const result = {
      items,
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
      totalItems,
    };

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error(`Error fetching all latest ${Model.modelName}s`, error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Generic: Get By Id
const getById = (Model, typeName) => async (req, res) => {
  logger.info(`Get ${typeName} by ID Endpoint Hit...`);

  try {
    const { id } = req.params;

    const item = await Model.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `${typeName} not found`,
      });
    }

    if (item.status !== "active" && item.status !== "scheduled") {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const isComingSoon =
      item.status === "scheduled" && item.publishDate > new Date();

    return res.status(200).json({
      success: true,
      message: `${typeName} retrieved successfully`,
      [typeName]: item,
      isComingSoon,
    });
  } catch (error) {
    logger.error(`Error fetching ${typeName} by ID`, error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Generic: Get Coming Soon (20 items)
const getComingSoon = (Model) => async (req, res) => {
  logger.info(`Get Coming Soon ${Model.modelName}s Endpoint Hit...`);

  try {
    const items = await Model.find(getComingSoonFilter())
      .sort({ publishDate: 1 })
      .limit(20);

    return res.status(200).json({ success: true, data: items });
  } catch (error) {
    logger.error(`Error fetching coming soon ${Model.modelName}s`, error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Generic: Get All Coming Soon (Paginated)
const getAllComingSoon = (Model) => async (req, res) => {
  logger.info(`Get All Coming Soon ${Model.modelName}s Endpoint Hit...`);

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const filter = getComingSoonFilter();

    const items = await Model.find(filter)
      .sort({ publishDate: 1 })
      .skip(startIndex)
      .limit(limit);

    const totalItems = await Model.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: {
        items,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
      },
    });
  } catch (error) {
    logger.error(`Error fetching all coming soon ${Model.modelName}s`, error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Movies : Get Rentable (20 items)
const getRentableMovies = async (req, res) => {
  logger.info("Get Rentable Movies Endpoint Hit...");

  try {
    const movies = await Movie.find(getRentableFilter())
      .sort({ publishDate: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      data: movies,
    });
  } catch (error) {
    logger.error("Error fetching rentable movies", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Movies : Get All Rentable (Paginated)
const getAllRentableMovies = async (req, res) => {
  logger.info("Get All Rentable Movies Endpoint Hit...");

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = getRentableFilter();

    const movies = await Movie.find(filter)
      .sort({ publishDate: -1 })
      .skip(skip)
      .limit(limit);

    const totalMovies = await Movie.countDocuments(filter);

    const result = {
      movies,
      currentPage: page,
      totalPages: Math.ceil(totalMovies / limit),
      totalMovies,
    };

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error fetching all rentable movies", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Movies : Get Free (20 items)
const getFreeMovies = async (req, res) => {
  logger.info("Get Free Movies Endpoint Hit...");

  try {
    const movies = await Movie.find(getFreeFilter())
      .sort({ publishDate: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      data: movies,
    });
  } catch (error) {
    logger.error("Error fetching free movies", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Movies : Get All Free (Paginated)
const getAllFreeMovies = async (req, res) => {
  logger.info("Get All Free Movies Endpoint Hit...");

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = getFreeFilter();

    const movies = await Movie.find(filter)
      .sort({ publishDate: -1 })
      .skip(skip)
      .limit(limit);

    const totalMovies = await Movie.countDocuments(filter);

    const result = {
      movies,
      currentPage: page,
      totalPages: Math.ceil(totalMovies / limit),
      totalMovies,
    };

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error fetching all free movies", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Exporting specific handlers for each model
module.exports = {
  // Movies
  getLatestMovies: getLatest(Movie),
  getAllLatestMovies: getAllLatest(Movie),
  getMovieById: getById(Movie, "movie"),
  getRentableMovies,
  getAllRentableMovies,
  getFreeMovies,
  getAllFreeMovies,
  getComingSoonMovies: getComingSoon(Movie),
  getAllComingSoonMovies: getAllComingSoon(Movie),

  // Documentaries
  getLatestDocumentaries: getLatest(Documentary),
  getAllLatestDocumentaries: getAllLatest(Documentary),
  getDocumentaryById: getById(Documentary, "documentary"),
  getComingSoonDocumentaries: getComingSoon(Documentary),
  getAllComingSoonDocumentaries: getAllComingSoon(Documentary),

  // Short Films
  getLatestShortFilms: getLatest(ShortFilm),
  getAllLatestShortFilms: getAllLatest(ShortFilm),
  getShortFilmById: getById(ShortFilm, "shortfilm"),
  getComingSoonShortFilms: getComingSoon(ShortFilm),
  getAllComingSoonShortFilms: getAllComingSoon(ShortFilm),

  // Video Songs
  getLatestVideoSongs: getLatest(VideoSong),
  getAllLatestVideoSongs: getAllLatest(VideoSong),
  getVideoSongById: getById(VideoSong, "videosong"),
  getComingSoonVideoSongs: getComingSoon(VideoSong),
  getAllComingSoonVideoSongs: getAllComingSoon(VideoSong),

  // TV Series
  getLatestTVSeries: getLatest(TVSeries),
  getAllLatestTVSeries: getAllLatest(TVSeries),
  getTVSeriesById: getById(TVSeries, "tvseries"),
  getComingSoonTVSeries: getComingSoon(TVSeries),
  getAllComingSoonTVSeries: getAllComingSoon(TVSeries),
};
