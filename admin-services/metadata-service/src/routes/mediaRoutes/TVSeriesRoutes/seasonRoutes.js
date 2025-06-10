const express = require("express");

const {
  createSeason,
  deleteSeason,
  getSeasonById,
  getAllSeasons,
  editSeason,
} = require("../../../controllers/seasonController");

const router = express.Router({ mergeParams: true });

// Season Routes
router.post("/", createSeason);
router.delete("/:id", deleteSeason);
router.patch("/:id", editSeason);
router.get("/all", getAllSeasons);
router.get("/:id", getSeasonById);

module.exports = router;
