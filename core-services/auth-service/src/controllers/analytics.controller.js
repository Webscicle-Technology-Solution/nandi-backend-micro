const { logger } = require("../utils/logger");
const WatchHistory = require("../models/WatchHistory");
const UserAccessDetails = require("../models/UserAccessDetails");
const moment = require("moment");

// const getTopMovies = async (req, res) => {
//   logger.info("Get Top Movies Endpoint Hit... ");

//   try {
//     const { days } = req.query;
//     const currentDate = new Date();
//     let startDate;

//     // Determine the start date based on the 'days' parameter
//     if (days === "28") {
//       startDate = moment().subtract(28, "days").toDate();
//     } else if (days === "90") {
//       startDate = moment().subtract(3, "months").toDate();
//     } else if (days === "180") {
//       startDate = moment().subtract(6, "months").toDate();
//     } else {
//       return res.status(400).json({ message: "Invalid 'days' parameter" });
//     }

//     // Aggregate the watch history to calculate views and watch time
//     const result = await WatchHistory.aggregate([
//       {
//         $match: {
//           contentType: "Movie", // Filter only movies
//           createdAt: { $gte: startDate }, // Filter by date range
//         },
//       },
//       {
//         $group: {
//           _id: "$contentId", // Group by movie ID (contentId)
//           views: { $sum: 1 }, // Count the views (number of records)
//           totalWatchTime: { $sum: "$watchTime" }, // Sum the watch time
//         },
//       },
//       {
//         $project: {
//           movieId: "$_id", // Rename _id to movieId
//           views: 1,
//           totalWatchTime: 1,
//           score: {
//             $add: [
//               { $multiply: ["$views", 10] }, // Weight the views (adjust multiplier as needed)
//               { $multiply: ["$totalWatchTime", 0.1] }, // Weight the watch time (adjust multiplier as needed)
//             ],
//           },
//         },
//       },
//       {
//         $sort: { score: -1 }, // Sort by score (desc)
//       },
//       {
//         $limit: 10, // Limit to top 10
//       },
//     ]);

//     // Return the result as a response
//     res.status(200).json({ topMovies: result });
//   } catch (error) {
//     logger.error("Error getting top movies", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

const getTopTvSeries = async (req, res) => {
  logger.info("Get Top TV Series Endpoint Hit...");

  try {
    const { days } = req.query;
    let startDate;

    if (days === "28") {
      startDate = moment().subtract(28, "days").toDate();
    } else if (days === "90") {
      startDate = moment().subtract(3, "months").toDate();
    } else if (days === "180") {
      startDate = moment().subtract(6, "months").toDate();
    } else {
      return res.status(400).json({ message: "Invalid 'days' parameter" });
    }

    const result = await WatchHistory.aggregate([
      {
        $match: {
          contentType: "TVSeries",
          createdAt: { $gte: startDate },
          tvSeriesId: { $ne: null }, // Make sure it's present
        },
      },
      {
        $group: {
          _id: "$tvSeriesId", // Group by series
          views: { $sum: 1 },
          totalWatchTime: { $sum: "$watchTime" },
        },
      },
      {
        $project: {
          tvSeriesId: "$_id",
          views: 1,
          totalWatchTime: 1,
          score: {
            $add: [
              { $multiply: ["$views", 10] },
              { $multiply: ["$totalWatchTime", 0.1] },
            ],
          },
        },
      },
      {
        $sort: { score: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    res.status(200).json({ topContent: result });
  } catch (error) {
    logger.error("Error getting top TV series", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getTopContent = async (
  req,
  res,
  contentType,
  groupByField = "$contentId"
) => {
  logger.info(`Get Top ${contentType} Endpoint Hit...`);

  try {
    const { days } = req.query;
    let startDate;

    if (days === "28") {
      startDate = moment().subtract(28, "days").toDate();
    } else if (days === "90") {
      startDate = moment().subtract(3, "months").toDate();
    } else if (days === "180") {
      startDate = moment().subtract(6, "months").toDate();
    } else {
      return res.status(400).json({ message: "Invalid 'days' parameter" });
    }

    const result = await WatchHistory.aggregate([
      {
        $match: {
          contentType,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: groupByField,
          views: { $sum: 1 },
          totalWatchTime: { $sum: "$watchTime" },
        },
      },
      {
        $project: {
          contentId: "$_id",
          views: 1,
          totalWatchTime: 1,
          score: {
            $add: [
              { $multiply: ["$views", 10] },
              { $multiply: ["$totalWatchTime", 0.1] },
            ],
          },
        },
      },
      {
        $sort: { score: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    res.status(200).json({ topContent: result });
  } catch (error) {
    logger.error(`Error getting top ${contentType}`, error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getTopDocumentaries = (req, res) =>
  getTopContent(req, res, "Documentary");

const getTopVideoSongs = (req, res) => getTopContent(req, res, "VideoSong");

const getTopShortFilms = (req, res) => getTopContent(req, res, "ShortFilm");
const getTopMovies = (req, res) => getTopContent(req, res, "Movie");

const countUsersBySubscriptionType = async (req, res) => {
  logger.info("Counting users by subscription type...");
  try {
    const result = await UserAccessDetails.aggregate([
      {
        $group: {
          _id: "$subscriptionType",
          count: { $sum: 1 },
        },
      },
    ]);

    // Format result into an object with all subscription types
    const counts = { Free: 0, Silver: 0, Gold: 0 };

    result.forEach((entry) => {
      counts[entry._id] = entry.count;
    });

    res.status(200).json({ success: true, counts });
  } catch (error) {
    logger.error("Error counting users by subscription type", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  getTopMovies,
  getTopTvSeries,
  getTopDocumentaries,
  getTopVideoSongs,
  getTopShortFilms,
  countUsersBySubscriptionType,
};
