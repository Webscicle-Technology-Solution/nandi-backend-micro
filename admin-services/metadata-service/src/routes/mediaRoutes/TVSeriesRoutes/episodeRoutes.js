const express = require("express");

const {
  createEpisode,
  deleteEpisode,
  getEpisodeById,
  getAllEpisodes,
  editEpisode,
} = require("../../../controllers/episodeController");

const router = express.Router({ mergeParams: true });

// Episode Routes
router.post("/", createEpisode);
router.delete("/:id", deleteEpisode);
router.patch("/:id", editEpisode);
router.get("/:seasonId/all", getAllEpisodes);
router.get("/:id", getEpisodeById);

module.exports = router;
