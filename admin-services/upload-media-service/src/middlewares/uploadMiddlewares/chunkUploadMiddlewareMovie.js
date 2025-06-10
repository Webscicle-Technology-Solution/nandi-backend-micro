const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { logger } = require("../../utils/logger");
const {
  getMediaTypeFromUrl,
  getTrailerorPreviewTypeFromUrl,
} = require("../../utils/requestParser");

// Set up Multer for chunk upload
const tempDir = path.join(__dirname, "../../uploads/temp");
const upload = multer({ dest: tempDir });

// Ensure directories exist
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Middleware to handle single file upload
// Middleware to handle single file upload
const chunkUploadMiddlewareMovie = (req, res, next) => {
  logger.info("Chunk Upload Middleware Hit...");

  // Use the directory for the specific movie (movieId) where chunks should be stored
  const uploadDir = path.join(
    __dirname,
    `../../../uploads/movies/${req.body.movieId}/temp`
  );

  // Ensure the temp directory exists
  fs.mkdirSync(uploadDir, { recursive: true });

  // Set the destination for the multer upload (the temp directory for the specific movie)
  const upload = multer({ dest: uploadDir });

  upload.single("chunk")(req, res, (err) => {
    if (err) {
      logger.error("File upload failed.", err);
      return res.status(500).send("File upload failed.");
    }
    next();
  });
};

const chunkUploadMiddlewareGeneric = (req, res, next) => {
  logger.info("Chunk Upload Middleware Hit...");
  console.log("req.body : ", req.body);
  // let mediaType = null;
  logger.info(`Req.originalURl : ${req.originalUrl}`);

  const mediaType = getMediaTypeFromUrl(req.originalUrl);

  if (!mediaType) {
    logger.warn("Invalid URL, missing media type.");
    return res.status(400).send("Invalid URL, missing media type.");
  }

  const { mediaId } = req.body;

  if (mediaId) {
    logger.warn("Missing mediaId in request body.");
    console.log(req.body);
    return res
      .status(400)
      .json({ success: false, message: "Missing mediaId in request body." });
  }

  // Use the directory for the specific movie (movieId) where chunks should be stored
  const uploadDir = path.join(
    __dirname,
    `../../../uploads/${mediaType}/${req.body.mediaId}/temp`
  );

  // Ensure the temp directory exists
  fs.mkdirSync(uploadDir, { recursive: true });

  // Set the destination for the multer upload (the temp directory for the specific movie)
  const upload = multer({ dest: uploadDir });

  upload.single("chunk")(req, res, (err) => {
    if (err) {
      logger.error("File upload failed.", err);
      return res.status(500).send("File upload failed.");
    }
    next();
  });
};
const chunkUploadMiddlewareEpisode = (req, res, next) => {
  logger.info("Chunk Upload Middleware Hit...");
  console.log("req.body : ", req.body);
  // let mediaType = null;
  logger.info(`Req.originalURl : ${req.originalUrl}`);

  const mediaType = getMediaTypeFromUrl(req.originalUrl);

  if (!mediaType) {
    logger.warn("Invalid URL, missing media type.");
    return res.status(400).send("Invalid URL, missing media type.");
  }

  const { tvSeriesId, episodeId } = req.body;

  // if (mediaId) {
  //   logger.warn("Missing mediaId in request body.");
  //   console.log(req.body);
  //   return res
  //     .status(400)
  //     .json({ success: false, message: "Missing mediaId in request body." });
  // }

  // Use the directory for the specific movie (movieId) where chunks should be stored
  const uploadDir = path.join(
    __dirname,
    `../../../uploads/${mediaType}/${tvSeriesId}/${episodeId}/temp`
  );

  // Ensure the temp directory exists
  fs.mkdirSync(uploadDir, { recursive: true });

  // Set the destination for the multer upload (the temp directory for the specific movie)
  const upload = multer({ dest: uploadDir });

  upload.single("chunk")(req, res, (err) => {
    if (err) {
      logger.error("File upload failed.", err);
      return res.status(500).send("File upload failed.");
    }
    next();
  });
};

const chunkUploadMiddlewareTrailerPreview = (req, res, next) => {
  logger.info("Chunk Upload Middleware Hit...");
  console.log("req.body : ", req.body);
  // let mediaType = null;
  logger.info(`Req.originalURl : ${req.originalUrl}`);

  const mediaType = getMediaTypeFromUrl(req.originalUrl);
  const videoType = getTrailerorPreviewTypeFromUrl(req.originalUrl);

  if (!mediaType || !videoType) {
    logger.warn("Invalid URL, missing media type.");
    return res.status(400).send("Invalid URL, missing media type.");
  }

  const { mediaId } = req.body;

  if (mediaId) {
    logger.warn("Missing mediaId in request body.");
    console.log(req.body);
    return res
      .status(400)
      .json({ success: false, message: "Missing mediaId in request body." });
  }

  // Use the directory for the specific movie (movieId) where chunks should be stored
  const uploadDir = path.join(
    __dirname,
    `../../../uploads/${mediaType}/${req.body.mediaId}/${videoType}/temp`
  );

  // Ensure the temp directory exists
  fs.mkdirSync(uploadDir, { recursive: true });

  // Set the destination for the multer upload (the temp directory for the specific movie)
  const upload = multer({ dest: uploadDir });

  upload.single("chunk")(req, res, (err) => {
    if (err) {
      logger.error("File upload failed.", err);
      return res.status(500).send("File upload failed.");
    }
    next();
  });
};

module.exports = {
  chunkUploadMiddlewareMovie,
  chunkUploadMiddlewareGeneric,
  chunkUploadMiddlewareEpisode,
  chunkUploadMiddlewareTrailerPreview,
};
