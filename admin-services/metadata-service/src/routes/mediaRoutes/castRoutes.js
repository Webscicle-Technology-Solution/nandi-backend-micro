const express = require("express");
const { getCastDetails } = require("../../controllers/castDetailsController");

const router = express.Router();

// get cast details
router.get("/:id", getCastDetails);

module.exports = router;
