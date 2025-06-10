const express = require("express");

const {
  createVideoSong,
  deleteVideoSong,
  getVideoSongById,
  getAllVideoSongs,
  editVideoSong,
} = require("../../controllers/videoSongController");

const router = express.Router();

router.post("/", createVideoSong);

router.delete("/:id", deleteVideoSong);
router.patch("/:id", editVideoSong);

router.get("/all", getAllVideoSongs);
router.get("/:id", getVideoSongById);

module.exports = router;
