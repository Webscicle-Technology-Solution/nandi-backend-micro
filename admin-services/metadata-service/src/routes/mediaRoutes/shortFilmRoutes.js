const express = require("express");
const {
  createShortFilm,
  deleteShortFilm,
  getShortFilmById,
  getAllShortFilms,
  editShortFilm,
} = require("../../controllers/shortFilmController");

const router = express.Router();

router.post("/", createShortFilm);

router.delete("/:id", deleteShortFilm);
router.patch("/:id", editShortFilm);

router.get("/all", getAllShortFilms);
router.get("/:id", getShortFilmById);

module.exports = router;
