const express = require("express");

const movieRoutes = require("./mediaRoutes/movieRoutes");
const documentaryRoutes = require("./mediaRoutes/documentaryRoutes");
const shortFilmRoutes = require("./mediaRoutes/shortFilmRoutes");
const videoSongRoutes = require("./mediaRoutes/videoSongRoutes");
const tvSeriesRoutes = require("./mediaRoutes/TVSeriesRoutes/tvSeriesRoutes");
const castRoutes = require("./mediaRoutes/castRoutes");
const userRoutes = require("./userRoutes/userMediaRoutes");
const {
  searchMovieController,
  searchDocumentaryController,
  searchTVSeriesController,
  searchVideoSongController,
  searchShortFilmController,
} = require("../controllers/searchController");
const {
  toggleFeatured,
  isFeatured,
  getAllFeaturedByType,
  updateRating,
  getRating,
  updateHomeContent,
  getHomeContent,
  updateSubscriptionSettings,
  getSubscriptionSettings,
} = require("../controllers/genericController");

const router = express.Router();

// movie routes
router.use("/movies", movieRoutes);
router.use("/documentaries", documentaryRoutes);
router.use("/shortfilms", shortFilmRoutes);
router.use("/videosongs", videoSongRoutes);

// TV Series Routes
router.use("/tvseries", tvSeriesRoutes);

// Cast Details Routes
router.use("/cast", castRoutes);
// Genre Routes

// Search Routes
router.use("/search/movies", searchMovieController);
router.use("/search/documentaries", searchDocumentaryController);
router.use("/search/tvseries", searchTVSeriesController);
router.use("/search/videosongs", searchVideoSongController);
router.use("/search/shortfilms", searchShortFilmController);

router.post("/featured", toggleFeatured);
router.get("/featured/:contentType", getAllFeaturedByType);
router.get("/featured/:contentType/:contentId", isFeatured);

router.post("/rating", updateRating);
router.get("/rating/:contentType/:contentId", getRating);

// Sections Route
router.post("/sections", updateHomeContent);
router.get("/sections/:contentType", getHomeContent);

// Settings Route
router.post("/settings/subscription", updateSubscriptionSettings);
router.get("/settings/subscription", getSubscriptionSettings);

// User Routes
router.use("/user", userRoutes);

module.exports = router;
