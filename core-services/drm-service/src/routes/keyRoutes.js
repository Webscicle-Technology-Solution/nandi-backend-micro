const exoress = require("express");
const {
  storeKeysForMovie,
  getSegmentKey,
  getMasterPlaylist,
  getResolutionPlaylist,
  storeKeysForTrailerPreview,
  getResolutionPlaylistTrailerPreview,
  getMasterPlaylistTrailerPreview,
} = require("../controllers/drmController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = exoress.Router();

router.post("/storeKeys", storeKeysForMovie); // 🔐 Called by processing-service need middleware here to prevent user requests to this
router.post("/storeKeysTP", storeKeysForTrailerPreview);
router.get("/getKey", getSegmentKey); // 🎬 Called by Video.js. Need to work on this after debug to actually fetch userId

router.get(
  "/getmasterplaylist/:mediaType/:movieId",
  authMiddleware,
  getMasterPlaylist
);
router.get(
  "/getmasterplaylist/:mediaType/:mediaId/:videoType",
  authMiddleware,
  getMasterPlaylistTrailerPreview
);

router.get(
  "/getplaylist/:mediaType/:movieId/:resolution",
  authMiddleware,
  getResolutionPlaylist
);

router.get(
  "/getplaylist/:mediaType/:movieId/:videoType/:resolution",
  authMiddleware,
  getResolutionPlaylistTrailerPreview
);

module.exports = router;
