const { logger } = require("../utils/logger");
const Movie = require("../models/Movie");
const Cast = require("../models/Cast");
const moment = require("moment");
const { redisClient } = require("../config/redisConfig");
const {
  validateCreateMovie,
  validateMongoId,
  validateEditMovie,
} = require("../utils/validation");

const {
  createOrAddGenre,
  createCastDetails,
  updateOrCreateCastDetails,
} = require("../utils/dbUtils");

// Create a Movie
// Create a Movie
const createMovie = async (req, res) => {
  logger.info("Create Movie Endpoint Hit...");
  try {
    if (req.body.genre) {
      req.body.genre = await createOrAddGenre(req.body.genre);
    }

    const { error } = validateCreateMovie(req.body);
    if (error) {
      logger.error("Validation Error", error.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const newMovie = new Movie({
      title: req.body.title,
      description: req.body.description || null, // Optional, allow null if not provided
      releaseDate: req.body.releaseDate
        ? moment(req.body.releaseDate, "DD-MM-YYYY").toDate()
        : null, // Optional, allow null if not provided
      publishDate: req.body.publishDate
        ? moment(req.body.publishDate, "DD-MM-YYYY").toDate()
        : null, // Optional, allow null if not provided
      certificate: req.body.certificate || null, // Optional, allow null if not provided
      genre: req.body.genre || null, // Optional, allow null if not provided
      posterId: req.body.posterId || null, // Optional, allow null if not provided
      bannerId: req.body.bannerId || null, // Optional, allow null if not provided
      trailerId: req.body.trailerId || null, // Optional, allow null if not provided
      previewId: req.body.previewId || null, // Optional, allow null if not provided
      videoId: req.body.videoId || null, // Optional, allow null if not provided
      status: req.body.status || null, // Optional, allow null if not provided
      accessParams: req.body.accessParams || null, // Optional, allow null if not provided
    });

    if (req.body.castDetails) {
      newMovie.castDetails = await createCastDetails(
        req.body.castDetails,
        "movieId",
        newMovie._id
      );
    }

    await newMovie.save();
    logger.info("[Movie Creation] Successful : ", newMovie._id);

    // Clear the whole cache for the search_movie key after a new movie is created
    redisClient.keys("search_movie:*", (err, keys) => {
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
      message: "Movie Created Successfully",
      movieId: newMovie._id,
    });
  } catch (err) {
    logger.error("[Create Movie] Error Occured", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get Movie by ID
const getMovieById = async (req, res) => {
  logger.info("Get Movie by ID Endpoint Hit...");
  try {
    const { error } = validateMongoId(req.params);
    if (error) {
      logger.error("Validation Error", error.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const movie = await Movie.findById(req.params.id)
      .populate("castDetails")
      .populate("genre");
    if (!movie) {
      return res
        .status(404)
        .json({ success: false, message: "Movie not found" });
    }

    logger.info("[Get Movie by ID] Successful");
    res.status(200).json({
      success: true,
      message: "Movie fetched successfully",
      movie,
    });
  } catch (err) {
    logger.error("[Get Movie by ID] Error Occured", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get All Movies
const getAllMovies = async (req, res) => {
  logger.info("Get All Movies Endpoint Hit...");
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const movies = await Movie.find({})
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const totalNoOfMovies = await Movie.countDocuments({});

    const result = {
      currenetPage: page,
      totalPages: Math.ceil(totalNoOfMovies / limit),
      totalMovies: totalNoOfMovies,
      movies,
    };

    logger.info("[Get All Movies] Successful");
    res.status(200).json({
      success: true,
      message: "Movies fetched successfully",
      result,
    });
  } catch (err) {
    logger.error("[Create Movie] Error Occured", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
// Get All Rentable Movies
const getAllRentableMovies = async (req, res) => {
  logger.info("Get All Rentable Movies Endpoint Hit...");
  try {
    // Extract pagination parameters from the request query, with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    // Query to fetch rentable movies with pagination
    const rentableMovies = await Movie.find({
      "accessParams.accessType": "rentable",
    })
      .sort({ createdAt: -1 }) // Sort by creation date (or another field if needed)
      .skip(startIndex) // Skip the results to implement pagination
      .limit(limit);

    const totalNoOfRentableMovies = await Movie.countDocuments({
      "accessParams.accessType": "rentable",
    });

    const result = {
      currentPage: page,
      totalPages: Math.ceil(totalNoOfRentableMovies / limit),
      totalRentableMovies: totalNoOfRentableMovies,
      rentableMovies,
    };

    logger.info("[Get Rentable Movies] Successful");
    res.status(200).json({
      success: true,
      message: "Rentable movies fetched successfully",
      result,
    });
  } catch (err) {
    logger.error("[Get Rentable Movies] Error Occurred", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get All Free Movies
const getAllFreeMovies = async (req, res) => {
  logger.info("Get All Free Movies Endpoint Hit...");
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    // Query to fetch free movies with pagination
    const freeMovies = await Movie.find({
      "accessParams.accessType": "free",
    })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const totalNoOfFreeMovies = await Movie.countDocuments({
      "accessParams.accessType": "free",
    });

    const result = {
      currentPage: page,
      totalPages: Math.ceil(totalNoOfFreeMovies / limit),
      totalFreeMovies: totalNoOfFreeMovies,
      freeMovies,
    };

    logger.info("[Get Free Movies] Successful");
    res.status(200).json({
      success: true,
      message: "Free movies fetched successfully",
      result,
    });
  } catch (err) {
    logger.error("[Get Free Movies] Error Occurred", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Delete a Movie
// const deleteMovie = async (req, res) => {
//   logger.info("Delete Move Endpoint Hit...");
//   try {
//     const { error } = validateMongoId(req.params);
//     if (error) {
//       logger.error("Validation Error", error.details[0].message);
//       return res
//         .status(400)
//         .json({ success: false, message: error.details[0].message });
//     }

//     const deletedMovie = await Movie.findOneAndDelete({ _id: req.params.id });

//     if (!deletedMovie) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Movie not found" });
//     }

//     logger.info("[Delete Movie] Successful : ", deletedMovie._id);
//     res
//       .status(200)
//       .json({ success: true, message: "Movie deleted successfully" });
//   } catch (err) {
//     logger.error("[Delete Movie] Error Occured", err);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };
// Delete a Movie
// Delete a Movie
const deleteMovie = async (req, res) => {
  logger.info("Delete Movie Endpoint Hit...");
  try {
    const { error } = validateMongoId(req.params);
    if (error) {
      logger.error("Validation Error", error.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const deletedMovie = await Movie.findOneAndDelete({ _id: req.params.id });

    if (!deletedMovie) {
      return res
        .status(404)
        .json({ success: false, message: "Movie not found" });
    }

    // Clear the whole cache for the search_movie key
    redisClient.keys("search_movie:*", (err, keys) => {
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

    logger.info("[Delete Movie] Successful : ", deletedMovie._id);
    res
      .status(200)
      .json({ success: true, message: "Movie deleted successfully" });
  } catch (err) {
    logger.error("[Delete Movie] Error Occured", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Edit a Movie
// const editMovie = async (req, res) => {
//   logger.info("Edit Move Endpoint Hit...");
//   try {
//     const { error } = validateMongoId(req.params);
//     if (error) {
//       logger.error("Validation Error", error.details[0].message);
//       return res
//         .status(400)
//         .json({ success: false, message: error.details[0].message });
//     }

//     if (req.body.genre) {
//       req.body.genre = await createOrAddGenre(req.body.genre);
//     }

//     // Validate the update data
//     const { error: validationError } = validateEditMovie(req.body);
//     if (validationError) {
//       logger.error("Validation Error", validationError.details[0].message);
//       return res
//         .status(400)
//         .json({ success: false, message: validationError.details[0].message });
//     }

//     const movie = await Movie.findById({ _id: req.params.id });

//     if (!movie) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Movie not found" });
//     }

//     if (req.body.title !== undefined) movie.title = req.body.title;
//     if (req.body.description !== undefined)
//       movie.description = req.body.description;
//     if (req.body.releaseDate !== undefined && req.body.releaseDate !== null)
//       movie.releaseDate = moment(req.body.releaseDate, "DD/MM/YYYY").toDate();
//     if (req.body.publishDate !== undefined && req.body.publishDate !== null)
//       movie.publishDate = moment(req.body.publishDate, "DD/MM/YYYY").toDate();
//     if (req.body.certificate !== undefined)
//       movie.certificate = req.body.certificate;
//     if (req.body.genre !== undefined) movie.genre = req.body.genre;
//     if (req.body.posterId !== undefined) movie.posterId = req.body.posterId;
//     if (req.body.bannerId !== undefined) movie.bannerId = req.body.bannerId;
//     if (req.body.trailerId !== undefined) movie.trailerId = req.body.trailerId;
//     if (req.body.previewId !== undefined) movie.previewId = req.body.previewId;
//     if (req.body.videoId !== undefined) movie.videoId = req.body.videoId;
//     if (req.body.status !== undefined) movie.status = req.body.status;
//     if (req.body.accessParams !== undefined)
//       movie.accessParams = req.body.accessParams;

//     if (req.body.castDetails) {
//       await updateOrCreateCastDetails(
//         req.body.castDetails,
//         Movie,
//         "movieId",
//         movie._id
//       );
//     }

//     await movie.save();

//     logger.info("[Edit Movie] Successful : ", movie._id);
//     res.status(200).json({
//       success: true,
//       message: "Movie edited successfully",
//       movieId: movie._id,
//     });
//   } catch (error) {
//     logger.error("[Edit Movie] Error Occured", error);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };
// Edit a Movie
// Edit a Movie
const editMovie = async (req, res) => {
  logger.info("Edit Movie Endpoint Hit...");
  try {
    logger.info(`Received Body : ${JSON.stringify(req.body)}`);
    const { error } = validateMongoId(req.params);
    if (error) {
      logger.error("Validation Error", error.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    if (req.body.genre) {
      req.body.genre = await createOrAddGenre(req.body.genre);
    }

    // Validate the update data
    const { error: validationError } = validateEditMovie(req.body);
    if (validationError) {
      logger.error("Validation Error", validationError.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: validationError.details[0].message });
    }

    const movie = await Movie.findById({ _id: req.params.id });

    if (!movie) {
      return res
        .status(404)
        .json({ success: false, message: "Movie not found" });
    }

    // Remember the old title before updating it (for cache invalidation)
    const oldTitle = movie.title;

    if (req.body.title !== undefined) movie.title = req.body.title;
    if (req.body.description !== undefined)
      movie.description = req.body.description;
    if (req.body.releaseDate !== undefined && req.body.releaseDate !== null)
      movie.releaseDate = moment(req.body.releaseDate, "DD/MM/YYYY").toDate();
    if (req.body.publishDate !== undefined && req.body.publishDate !== null)
      movie.publishDate = moment(req.body.publishDate, "DD/MM/YYYY").toDate();
    if (req.body.certificate !== undefined)
      movie.certificate = req.body.certificate;
    if (req.body.genre !== undefined) movie.genre = req.body.genre;
    if (req.body.posterId !== undefined) movie.posterId = req.body.posterId;
    if (req.body.bannerId !== undefined) movie.bannerId = req.body.bannerId;
    if (req.body.trailerId !== undefined) movie.trailerId = req.body.trailerId;
    if (req.body.previewId !== undefined) movie.previewId = req.body.previewId;
    if (req.body.videoId !== undefined) movie.videoId = req.body.videoId;
    if (req.body.status !== undefined) movie.status = req.body.status;
    if (req.body.accessParams !== undefined)
      movie.accessParams = req.body.accessParams;

    if (req.body.castDetails) {
      await updateOrCreateCastDetails(
        req.body.castDetails,
        Movie,
        "movieId",
        movie._id
      );
    }

    if (req.body.accessParams.expiringHour) {
      // check if expiring hour is in whole int number
      if (req.body.accessParams.expiringHour % 1 !== 0) {
        return res.status(400).json({
          success: false,
          message: "Expiring hour should be a whole number",
        });
      }
      movie.accessParams.rentalDuration = req.body.accessParams.expiringHour;
    }
    await movie.save();

    logger.info(`Movie saved : ${JSON.stringify(movie)}`);

    // Clear the whole cache for the search_movie key
    redisClient.keys("search_movie:*", (err, keys) => {
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

    logger.info("[Edit Movie] Successful : ", movie._id);
    res.status(200).json({
      success: true,
      message: "Movie edited successfully",
      movieId: movie._id,
    });
  } catch (error) {
    logger.error("[Edit Movie] Error Occured", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  createMovie,
  deleteMovie,
  getMovieById,
  getAllMovies,
  getAllRentableMovies,
  getAllFreeMovies,
  editMovie,
};
