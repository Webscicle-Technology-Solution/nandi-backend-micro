const multer = require("multer");
const { logger } = require("../../utils/logger");

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
}).single("file");

// Middleware
const uploadImageMiddleware = (req, res, next) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      logger.error("Multer error while uploading: ", err);
      return res.status(400).json({
        success: false,
        message: "Multer error while uploading",
        error: err.message,
        stack: err.stack,
      });
    } else if (err) {
      logger.error("Unknown error while uploading: ", err);
      return res.status(400).json({
        success: false,
        message: "Unknown error while uploading",
        error: err.message,
        stack: err.stack,
      });
    }

    if (!req.file) {
      logger.error("No file found, Please add a file and try!");
      return res.status(400).json({
        success: false,
        message: "No file found, Please add a file and try!",
      });
    }

    next();
  });
};

module.exports = { uploadImageMiddleware };
