const Movie = require("../models/Movie");
const Documentary = require("../models/Documentary");
const TVSeries = require("../models/TVSeriesModel/TVSeries");
const ShortFilm = require("../models/ShortFilm");
const VideoSong = require("../models/VideoSong");
const { logger } = require("../utils/logger");
const { redisClient } = require("../config/redisConfig");

// const searchMovieController = async (req, res) => {
//   logger.info("Search movie endpoint hit...");

//   try {
//     const { query } = req.query;

//     // Check if the query parameter is provided and valid
//     if (!query || typeof query !== "string" || query.trim() === "") {
//       return res.status(400).json({
//         success: false,
//         message: "Query parameter is required and must be a valid string",
//       });
//     }

//     // Pagination logic
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const startIndex = (page - 1) * limit;

//     // Redis cache key with pagination included
//     const cacheKey = `search_movie:${query}:page:${page}:limit:${limit}`;

//     // Check Redis cache first
//     redisClient.get(cacheKey, async (err, cachedData) => {
//       if (err) {
//         logger.error("Error while checking Redis cache", err);
//         return res
//           .status(500)
//           .json({ success: false, message: "Server error" });
//       }

//       if (cachedData) {
//         // If cached data exists, return it
//         return res.json({
//           success: true,
//           results: JSON.parse(cachedData), // Parse the cached JSON string back to an object
//         });
//       }

//       // Perform the search query on MongoDB with pagination
//       const results = await Movie.find(
//         {
//           $text: { $search: query },
//         },
//         {
//           score: { $meta: "textScore" },
//         }
//       )
//         .sort({ score: { $meta: "textScore" } })
//         .skip(startIndex) // Apply pagination (skip based on page)
//         .limit(limit); // Limit the number of results

//       // Get the total number of results for pagination
//       const totalMovies = await Movie.countDocuments({
//         $text: { $search: query },
//       });

//       // Prepare the paginated response
//       const result = {
//         movies: results,
//         currentPage: page,
//         totalPages: Math.ceil(totalMovies / limit),
//         totalMovies,
//       };

//       // Cache the MongoDB results in Redis for 1 hour (or appropriate TTL)
//       redisClient.setex(cacheKey, 3600, JSON.stringify(result));

//       // Send the response with the paginated results
//       res.json({
//         success: true,
//         results: result,
//       });
//     });
//   } catch (error) {
//     logger.error("Error while searching movies", error);
//     res.status(500).json({
//       success: false,
//       message: "Error while searching movies",
//     });
//   }
// };

// const searchMovieController = async (req, res) => {
//   logger.info("Search movie endpoint hit...");

//   try {
//     const { query } = req.query;

//     if (!query || typeof query !== "string" || query.trim() === "") {
//       return res.status(400).json({
//         success: false,
//         message: "Query parameter is required and must be a valid string",
//       });
//     }

//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const startIndex = (page - 1) * limit;
//     const cacheKey = `search_movie:${query}:page:${page}:limit:${limit}`;

//     redisClient.get(cacheKey, async (err, cachedData) => {
//       if (err) {
//         logger.error("Error while checking Redis cache", err);
//         return res
//           .status(500)
//           .json({ success: false, message: "Server error" });
//       }

//       if (cachedData) {
//         return res.json({ success: true, results: JSON.parse(cachedData) });
//       }

//       let results = [];
//       let totalMovies = 0;

//       // Step 1: Try $text search (gives relevance score)
//       results = await Movie.find(
//         { $text: { $search: query } },
//         { score: { $meta: "textScore" } }
//       )
//         .sort({ score: { $meta: "textScore" } }) // Sort by relevance
//         .skip(startIndex)
//         .limit(limit);

//       totalMovies = await Movie.countDocuments({ $text: { $search: query } });

//       // Step 2: If $text search has no results, fallback to $regex search
//       if (results.length === 0) {
//         results = await Movie.find({
//           title: { $regex: new RegExp(query, "i") },
//         })
//           .skip(startIndex)
//           .limit(limit);

//         totalMovies = await Movie.countDocuments({
//           title: { $regex: new RegExp(query, "i") },
//         });
//       }

//       const result = {
//         movies: results,
//         currentPage: page,
//         totalPages: Math.ceil(totalMovies / limit),
//         totalMovies,
//       };

//       redisClient.setex(cacheKey, 3600, JSON.stringify(result));

//       res.json({ success: true, results: result });
//     });
//   } catch (error) {
//     logger.error("Error while searching movies", error);
//     res.status(500).json({
//       success: false,
//       message: "Error while searching movies",
//     });
//   }
// };

const searchMovieController = async (req, res) => {
  logger.info("Search movie endpoint hit...");

  try {
    const { query } = req.query;

    if (!query || typeof query !== "string" || query.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Query parameter is required and must be a valid string",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const cacheKey = `search_movie:${query}:page:${page}:limit:${limit}`;

    redisClient.get(cacheKey, async (err, cachedData) => {
      if (err) {
        logger.error("Error while checking Redis cache", err);
        return res
          .status(500)
          .json({ success: false, message: "Server error" });
      }

      if (cachedData) {
        return res.json({ success: true, results: JSON.parse(cachedData) });
      }

      let results = [];
      let totalMovies = 0;

      // Step 1: Try $text search (best relevance ranking)
      results = await Movie.find(
        { $text: { $search: query } },
        { score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" } }) // Sort by relevance
        .skip(startIndex)
        .limit(limit);

      totalMovies = await Movie.countDocuments({ $text: { $search: query } });

      // Step 2: If no $text results, fallback to $regex on title
      if (results.length === 0) {
        results = await Movie.find({
          title: { $regex: new RegExp(query, "i") },
        })
          .skip(startIndex)
          .limit(limit);

        totalMovies = await Movie.countDocuments({
          title: { $regex: new RegExp(query, "i") },
        });
      }

      // Step 3: If no results from title regex, fallback to $regex on description
      if (results.length === 0) {
        results = await Movie.find({
          description: { $regex: new RegExp(query, "i") },
        })
          .skip(startIndex)
          .limit(limit);

        totalMovies = await Movie.countDocuments({
          description: { $regex: new RegExp(query, "i") },
        });
      }

      const result = {
        movies: results,
        currentPage: page,
        totalPages: Math.ceil(totalMovies / limit),
        totalMovies,
      };

      redisClient.setex(cacheKey, 3600, JSON.stringify(result));

      res.json({ success: true, results: result });
    });
  } catch (error) {
    logger.error("Error while searching movies", error);
    res.status(500).json({
      success: false,
      message: "Error while searching movies",
    });
  }
};

const searchDocumentaryController = async (req, res) => {
  logger.info("Search documentary endpoint hit...");

  try {
    const { query } = req.query;

    if (!query || typeof query !== "string" || query.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Query parameter is required and must be a valid string",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const cacheKey = `search_documentary:${query}:page:${page}:limit:${limit}`;

    redisClient.get(cacheKey, async (err, cachedData) => {
      if (err) {
        logger.error("Error while checking Redis cache", err);
        return res
          .status(500)
          .json({ success: false, message: "Server error" });
      }

      if (cachedData) {
        return res.json({ success: true, results: JSON.parse(cachedData) });
      }

      let results = [];
      let totalDocumentaries = 0;

      // Step 1: Try $text search (best relevance ranking)
      results = await Documentary.find(
        { $text: { $search: query } },
        { score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" } }) // Sort by relevance
        .skip(startIndex)
        .limit(limit);

      totalDocumentaries = await Documentary.countDocuments({
        $text: { $search: query },
      });

      // Step 2: If no $text results, fallback to $regex on title
      if (results.length === 0) {
        results = await Documentary.find({
          title: { $regex: new RegExp(query, "i") },
        })
          .skip(startIndex)
          .limit(limit);

        totalDocumentaries = await Documentary.countDocuments({
          title: { $regex: new RegExp(query, "i") },
        });
      }

      // Step 3: If no results from title regex, fallback to $regex on description
      if (results.length === 0) {
        results = await Documentary.find({
          description: { $regex: new RegExp(query, "i") },
        })
          .skip(startIndex)
          .limit(limit);

        totalDocumentaries = await Documentary.countDocuments({
          description: { $regex: new RegExp(query, "i") },
        });
      }

      const result = {
        ddocumentaries: results,
        currentPage: page,
        totalPages: Math.ceil(totalDocumentaries / limit),
        totalDocumentaries,
      };

      redisClient.setex(cacheKey, 3600, JSON.stringify(result));

      res.json({ success: true, results: result });
    });
  } catch (error) {
    logger.error("Error while searching movies", error);
    res.status(500).json({
      success: false,
      message: "Error while searching movies",
    });
  }
};

const searchTVSeriesController = async (req, res) => {
  logger.info("Search TV Series endpoint hit...");

  try {
    const { query } = req.query;

    if (!query || typeof query !== "string" || query.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Query parameter is required and must be a valid string",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const cacheKey = `search_tvseries:${query}:page:${page}:limit:${limit}`;

    redisClient.get(cacheKey, async (err, cachedData) => {
      if (err) {
        logger.error("Error while checking Redis cache", err);
        return res
          .status(500)
          .json({ success: false, message: "Server error" });
      }

      if (cachedData) {
        return res.json({ success: true, results: JSON.parse(cachedData) });
      }

      let results = [];
      let totalTVSeries = 0;

      // Step 1: Try $text search (best relevance ranking)
      results = await TVSeries.find(
        { $text: { $search: query } },
        { score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" } })
        .skip(startIndex)
        .limit(limit);

      totalTVSeries = await TVSeries.countDocuments({
        $text: { $search: query },
      });

      // Step 2: If no $text results, fallback to $regex on title
      if (results.length === 0) {
        results = await TVSeries.find({
          title: { $regex: new RegExp(query, "i") },
        })
          .skip(startIndex)
          .limit(limit);

        totalTVSeries = await TVSeries.countDocuments({
          title: { $regex: new RegExp(query, "i") },
        });
      }

      // Step 3: If no results from title regex, fallback to $regex on description
      if (results.length === 0) {
        results = await TVSeries.find({
          description: { $regex: new RegExp(query, "i") },
        })
          .skip(startIndex)
          .limit(limit);

        totalTVSeries = await TVSeries.countDocuments({
          description: { $regex: new RegExp(query, "i") },
        });
      }

      const result = {
        tvseries: results,
        currentPage: page,
        totalPages: Math.ceil(totalTVSeries / limit),
        totalTVSeries,
      };

      redisClient.setex(cacheKey, 3600, JSON.stringify(result));

      res.json({ success: true, results: result });
    });
  } catch (error) {
    logger.error("Error while searching TV Series", error);
    res.status(500).json({
      success: false,
      message: "Error while searching TV Series",
    });
  }
};

const searchVideoSongController = async (req, res) => {
  logger.info("Search Video Song endpoint hit...");

  try {
    const { query } = req.query;

    if (!query || typeof query !== "string" || query.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Query parameter is required and must be a valid string",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const cacheKey = `search_videosong:${query}:page:${page}:limit:${limit}`;

    redisClient.get(cacheKey, async (err, cachedData) => {
      if (err) {
        logger.error("Error while checking Redis cache", err);
        return res
          .status(500)
          .json({ success: false, message: "Server error" });
      }

      if (cachedData) {
        return res.json({ success: true, results: JSON.parse(cachedData) });
      }

      let results = [];
      let totalVideoSongs = 0;

      // Step 1: Try $text search (best relevance ranking)
      results = await VideoSong.find(
        { $text: { $search: query } },
        { score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" } })
        .skip(startIndex)
        .limit(limit);

      totalVideoSongs = await VideoSong.countDocuments({
        $text: { $search: query },
      });

      // Step 2: If no $text results, fallback to $regex on title
      if (results.length === 0) {
        results = await VideoSong.find({
          title: { $regex: new RegExp(query, "i") },
        })
          .skip(startIndex)
          .limit(limit);

        totalVideoSongs = await VideoSong.countDocuments({
          title: { $regex: new RegExp(query, "i") },
        });
      }

      // Step 3: If no results from title regex, fallback to $regex on description
      if (results.length === 0) {
        results = await VideoSong.find({
          description: { $regex: new RegExp(query, "i") },
        })
          .skip(startIndex)
          .limit(limit);

        totalVideoSongs = await VideoSong.countDocuments({
          description: { $regex: new RegExp(query, "i") },
        });
      }

      const result = {
        videosongs: results,
        currentPage: page,
        totalPages: Math.ceil(totalVideoSongs / limit),
        totalVideoSongs,
      };

      redisClient.setex(cacheKey, 3600, JSON.stringify(result));

      res.json({ success: true, results: result });
    });
  } catch (error) {
    logger.error("Error while searching Video Songs", error);
    res.status(500).json({
      success: false,
      message: "Error while searching Video Songs",
    });
  }
};

const searchShortFilmController = async (req, res) => {
  logger.info("Search Short Film endpoint hit...");

  try {
    const { query } = req.query;

    if (!query || typeof query !== "string" || query.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Query parameter is required and must be a valid string",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const cacheKey = `search_shortfilm:${query}:page:${page}:limit:${limit}`;

    redisClient.get(cacheKey, async (err, cachedData) => {
      if (err) {
        logger.error("Error while checking Redis cache", err);
        return res
          .status(500)
          .json({ success: false, message: "Server error" });
      }

      if (cachedData) {
        return res.json({ success: true, results: JSON.parse(cachedData) });
      }

      let results = [];
      let totalShortFilms = 0;

      // Step 1: Try $text search (best relevance ranking)
      results = await ShortFilm.find(
        { $text: { $search: query } },
        { score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" } })
        .skip(startIndex)
        .limit(limit);

      totalShortFilms = await ShortFilm.countDocuments({
        $text: { $search: query },
      });

      // Step 2: If no $text results, fallback to $regex on title
      if (results.length === 0) {
        results = await ShortFilm.find({
          title: { $regex: new RegExp(query, "i") },
        })
          .skip(startIndex)
          .limit(limit);

        totalShortFilms = await ShortFilm.countDocuments({
          title: { $regex: new RegExp(query, "i") },
        });
      }

      // Step 3: If no results from title regex, fallback to $regex on description
      if (results.length === 0) {
        results = await ShortFilm.find({
          description: { $regex: new RegExp(query, "i") },
        })
          .skip(startIndex)
          .limit(limit);

        totalShortFilms = await ShortFilm.countDocuments({
          description: { $regex: new RegExp(query, "i") },
        });
      }

      const result = {
        shortfilms: results,
        currentPage: page,
        totalPages: Math.ceil(totalShortFilms / limit),
        totalShortFilms,
      };

      redisClient.setex(cacheKey, 3600, JSON.stringify(result));

      res.json({ success: true, results: result });
    });
  } catch (error) {
    logger.error("Error while searching Short Films", error);
    res.status(500).json({
      success: false,
      message: "Error while searching Short Films",
    });
  }
};

module.exports = {
  searchMovieController,
  searchDocumentaryController,
  searchTVSeriesController,
  searchVideoSongController,
  searchShortFilmController,
};
