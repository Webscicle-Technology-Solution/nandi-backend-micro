const express = require("express");

const {
  createMovie,
  deleteMovie,
  getMovieById,
  getAllMovies,
  getAllRentableMovies,
  getAllFreeMovies,
  editMovie,
} = require("../../controllers/movieController");

const router = express.Router();

router.post("/", createMovie);

router.delete("/:id", deleteMovie);
router.patch("/:id", editMovie);

router.get("/all", getAllMovies);
router.get("/:id", getMovieById);
router.get("/all/rentable", getAllRentableMovies);
router.get("/all/free", getAllFreeMovies);

module.exports = router;
