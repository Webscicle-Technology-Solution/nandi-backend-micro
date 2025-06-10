const express = require("express");
const {
  uploadMovieChunk,
  finalizeMovieUpload,
  uploadMoviePoster,
  uploadMovieBanner,
} = require("../controllers/movieController");

const {
  uploadSeriesPoster,
  uploadSeriesBanner,
} = require("../controllers/tvSeriesController");

const {
  uploadShortfilmBanner,
  uploadShortfilmPoster,
} = require("../controllers/shortFilm");

const {
  uploadDocumentaryPoster,
  uploadDocumentaryBanner,
} = require("../controllers/documentaryController");

const {
  uploadVideoSongPoster,
  uploadVideoSongBanner,
} = require("../controllers/videoSongController");

const {
  uploadEpisodePoster,
  uploadEpisodeBanner,
} = require("../controllers/episodeController");

const {
  chunkUploadMiddlewareMovie,
  chunkUploadMiddlewareGeneric,
  chunkUploadMiddlewareEpisode,
  chunkUploadMiddlewareTrailerPreview,
} = require("../middlewares/uploadMiddlewares/chunkUploadMiddlewareMovie");

const {
  uploadImageMiddleware,
} = require("../middlewares/uploadMiddlewares/uploadImageMiddleware");
const {
  uploadMediaChunk,
  finalizeMediaUpload,
  uploadEpisodeChunk,
  finalizeEpisodeUpload,
  uploadTrailerPreviewChunk,
  finalizeTrailerPreviewUpload,
} = require("../controllers/genericUploadController");

const router = express.Router();

// MOVIES
router.post("/movies/chunk", chunkUploadMiddlewareGeneric, uploadMediaChunk);
router.post("/movies/finalize", finalizeMediaUpload);
router.post("/movies/poster", uploadImageMiddleware, uploadMoviePoster);
router.post("/movies/banner", uploadImageMiddleware, uploadMovieBanner);
router.post(
  "/movies/trailer/chunk",
  chunkUploadMiddlewareTrailerPreview,
  uploadTrailerPreviewChunk
);
router.post("/movies/trailer/finalize", finalizeTrailerPreviewUpload);
router.post(
  "/movies/preview/chunk",
  chunkUploadMiddlewareTrailerPreview,
  uploadTrailerPreviewChunk
);
router.post("/movies/preview/finalize", finalizeTrailerPreviewUpload);

// TV Series
router.post("/tvseries/poster", uploadImageMiddleware, uploadSeriesPoster);
router.post("/tvseries/banner", uploadImageMiddleware, uploadSeriesBanner);

// Shortfilms
router.post("/shortfilms/poster", uploadImageMiddleware, uploadShortfilmPoster);
router.post("/shortfilms/banner", uploadImageMiddleware, uploadShortfilmBanner);
router.post(
  "/shortfilms/chunk",
  chunkUploadMiddlewareGeneric,
  uploadMediaChunk
);
router.post("/shortfilms/finalize", finalizeMediaUpload);

// Documentaries
router.post(
  "/documentaries/chunk",
  chunkUploadMiddlewareGeneric,
  uploadMediaChunk
);
router.post("/documentaries/finalize", finalizeMediaUpload);
router.post(
  "/documentaries/poster",
  uploadImageMiddleware,
  uploadDocumentaryPoster
);
router.post(
  "/documentaries/banner",
  uploadImageMiddleware,
  uploadDocumentaryBanner
);

// Episodes
router.post(
  "/episodes/chunk",
  chunkUploadMiddlewareEpisode,
  uploadEpisodeChunk
);

// router.post(
//   "/episodes/chunk",
//   chunkUploadMiddlewareGeneric,
//   uploadEpisodeChunk
// );
router.post("/episodes/finalize", finalizeEpisodeUpload);
router.post("/episodes/poster", uploadImageMiddleware, uploadEpisodePoster);
router.post("/episodes/banner", uploadImageMiddleware, uploadEpisodeBanner);

// Videosongs
router.post(
  "/videosongs/chunk",
  chunkUploadMiddlewareGeneric,
  uploadMediaChunk
);
router.post("/videosongs/finalize", finalizeMediaUpload);
router.post("/videosongs/poster", uploadImageMiddleware, uploadVideoSongPoster);
router.post("/videosongs/banner", uploadImageMiddleware, uploadVideoSongBanner);

module.exports = router;
