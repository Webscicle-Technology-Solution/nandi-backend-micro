const express = require("express");
const seasonRoutes = require("./seasonRoutes");
const episodeRoutes = require("./episodeRoutes");

const {
  createTVSeries,
  deleteTVSeries,
  getTVSeriesById,
  getAllTVSeries,
  editTVSeries,
} = require("../../../controllers/tvSeriesController");

const {
  editSeason,
  getSeasonById,
} = require("../../../controllers/seasonController");

const {
  getEpisodeById,
  editEpisode,
} = require("../../../controllers/episodeController");

const router = express.Router({ mergeParams: true });

// TV Series Routes
router.post("/", createTVSeries);
router.delete("/:id", deleteTVSeries);
router.patch("/:id", editTVSeries);
router.get("/all", getAllTVSeries);
router.get("/:id", getTVSeriesById);

// Sub-Routes for Seasons & Episodes
router.use("/:tvSeriesId/seasons", seasonRoutes); // Nested Seasons Route
router.use("/:tvSeriesId/episodes", episodeRoutes); // Nested Episodes Route

// Edit season
router.get("/seasons/:id", getSeasonById);
router.patch("/seasons/:id", editSeason);

// Get Episode By Id
router.get("/episodes/:id", getEpisodeById);
router.patch("/episodes/:id", editEpisode);

module.exports = router;
