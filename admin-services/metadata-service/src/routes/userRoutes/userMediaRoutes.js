const {
  getLatestMovies,
  getAllRentableMovies,
  getAllFreeMovies,
  getAllLatestMovies,
  getLatestTVSeries,
  getAllLatestTVSeries,
  getMovieById,
  getTVSeriesById,
  getLatestDocumentaries,
  getAllLatestDocumentaries,
  getDocumentaryById,
  getLatestShortFilms,
  getAllLatestShortFilms,
  getShortFilmById,
  getLatestVideoSongs,
  getAllLatestVideoSongs,
  getVideoSongById,
  getComingSoonMovies,
  getAllComingSoonMovies,
  getComingSoonTVSeries,
  getAllComingSoonTVSeries,
  getComingSoonDocumentaries,
  getAllComingSoonDocumentaries,
  getComingSoonShortFilms,
  getAllComingSoonShortFilms,
  getComingSoonVideoSongs,
  getAllComingSoonVideoSongs,
} = require("../../controllers/userController");

const express = require("express");

const router = express.Router();

// Movie Routes
router.get("/movies", getLatestMovies);
router.get("/movies/all", getAllLatestMovies);
router.get("/movies/all/rentable", getAllRentableMovies);
router.get("/movies/all/free", getAllFreeMovies);
router.get("/movies/:id", getMovieById);
router.get("/movies/comingsoon", getComingSoonMovies);
router.get("/movies/all/comingsoon", getAllComingSoonMovies);

// TV Series Routes
router.get("/tvseries", getLatestTVSeries);
router.get("/tvseries/all", getAllLatestTVSeries);
router.get("/tvseries/:id", getTVSeriesById);
router.get("/tvseries/comingsoon", getComingSoonTVSeries);
router.get("/tvseries/all/comingsoon", getAllComingSoonTVSeries);

// Documentaries Routes
router.get("/documentaries", getLatestDocumentaries);
router.get("/documentaries/all", getAllLatestDocumentaries);
router.get("/documentaries/:id", getDocumentaryById);
router.get("/documentaries/comingsoon", getComingSoonDocumentaries);
router.get("/documentaries/all/comingsoon", getAllComingSoonDocumentaries);

// Short Films Routes
router.get("/shortfilms", getLatestShortFilms);
router.get("/shortfilms/all", getAllLatestShortFilms);
router.get("/shortfilms/:id", getShortFilmById);
router.get("/shortfilms/comingsoon", getComingSoonShortFilms);
router.get("/shortfilms/all/comingsoon", getAllComingSoonShortFilms);

// Video Songs Routes
router.get("/videosongs", getLatestVideoSongs);
router.get("/videosongs/all", getAllLatestVideoSongs);
router.get("/videosongs/:id", getVideoSongById);
router.get("/videosongs/comingsoon", getComingSoonVideoSongs);
router.get("/videosongs/all/comingsoon", getAllComingSoonVideoSongs);

module.exports = router;
