const express = require("express");
const {
  getSignedPosterUrl,
  getSignedBannerUrl,
} = require("../controllers/contentHandler");

const router = express.Router();

// Get Poster Image Served
router.get("/poster/:type/:id", getSignedPosterUrl);

// Get Banner Image Served
router.get("/banner/:type/:id", getSignedBannerUrl);

module.exports = router;
