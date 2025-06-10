const express = require("express");

const {
  createDocumentary,
  deleteDocumentary,
  getDocumentaryById,
  getAllDocumentaries,
  editDocumentary,
} = require("../../controllers/documentaryController");

const router = express.Router();

router.post("/", createDocumentary);

router.delete("/:id", deleteDocumentary);
router.patch("/:id", editDocumentary);

router.get("/all", getAllDocumentaries);
router.get("/:id", getDocumentaryById);

module.exports = router;
