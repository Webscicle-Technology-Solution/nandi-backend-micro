require("dotenv").config();
const mongoose = require("mongoose");
const { logger } = require("../utils/logger");
const multer = require("multer");
const Poster = require("../models/Poster");
const path = require("path");
const fs = require("fs"); // Use the regular fs module for streams
const fsPromises = require("fs").promises; // Use fs.promises for async file ops
const {
  uploadFileToAWS,
  uploadImgFileToAWS,
} = require("../services/uploadToAWS");
const { publishEvent } = require("../utils/rabbitmq");
const Banner = require("../models/Banner");
// Upload movie chunk
const uploadEpisodeChunk = async (req, res) => {
  logger.info("Movie upload Chunk Endpoint Hit...");

  // Log the incoming request body to debug
  logger.info(`Received request body: ${JSON.stringify(req.body)}`);
  logger.info(`Received file: ${JSON.stringify(req.file)}`);

  // Destructure movieId, index, and fileName from the form data
  const { movieId, index, fileName } = req.body;

  // Check for missing movieId in the request
  if (!movieId) {
    logger.warn("Missing movieId in the request body.");
    return res.status(400).send("Missing movieId in the request body.");
  }

  logger.info(
    `Received fileName: ${fileName}, index: ${index}, movieId: ${movieId}`
  );

  // Use the correct upload directory
  const uploadDir = path.join(
    __dirname,
    `../../uploads/movies/${movieId}/temp`
  );

  try {
    // Ensure the directory exists
    await fsPromises.mkdir(uploadDir, { recursive: true });

    // Path for the uploaded chunk
    const chunkPath = path.join(uploadDir, `${movieId}-${index}`);

    // Rename the file asynchronously
    await fsPromises.rename(req.file.path, chunkPath);
    logger.info(`Uploaded chunk ${index} to ${chunkPath}`);

    res.status(200).send({ message: "Chunk uploaded successfully." });
  } catch (error) {
    logger.error("Movie Chunk upload failed", error);
    res.status(500).send("File upload failed.");
  }
};

// Finalize movie upload
const finalizeEpisodeUpload = async (req, res) => {
  logger.info("Movie Finalize Upload Endpoint Hit...");

  const { fileName, totalChunks, movieId } = req.body;
  const uploadDir = path.join(
    __dirname,
    `../../uploads/movies/${movieId}/temp`
  );

  try {
    // Ensure the upload directory exists (this will be handled by the middleware, so this part might be redundant)
    await fsPromises.mkdir(uploadDir, { recursive: true });

    if (!fileName || !totalChunks) {
      res.status(400).send("Missing required fields.");
      return;
    }

    const finalPath = path.join(
      __dirname,
      `../../uploads/movies/${movieId}`,
      fileName
    );

    const writeStream = fs.createWriteStream(finalPath); // Use fs (not fs.promises) for stream operations
    logger.info("Assembling movie file...");

    // Assemble file asynchronously from chunks
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(uploadDir, `${movieId}-${i}`);

      // Ensure the chunk exists before reading
      try {
        const chunkData = await fsPromises.readFile(chunkPath);
        writeStream.write(chunkData);

        // Clean up chunk file asynchronously
        try {
          await fsPromises.unlink(chunkPath);
          logger.info(`Deleted chunk file: ${chunkPath}`);
        } catch (unlinkError) {
          logger.error(
            `Failed to delete chunk file: ${chunkPath}`,
            unlinkError
          );
        }
      } catch (readError) {
        logger.error(`Missing chunk file: ${chunkPath}`, readError);
        throw new Error(`Missing chunk: ${i}`);
      }
    }

    // Explicitly call end() to ensure the stream is finalized
    writeStream.end();

    // Handle the finish event
    writeStream.on("finish", () => {
      logger.info("Movie file uploaded successfully");
      res.status(200).send({
        message:
          "File uploaded successfully. Processing will continue in the background.",
      });
    });

    try {
      // Call the uploadFileToAWS function to upload the file to S3
      const key = `movies/${movieId}/raw/${fileName}`;
      const { data, error } = await uploadFileToAWS(
        finalPath,
        fileName,
        movieId,
        key
      );

      if (data) {
        logger.info(`Movie file ${fileName} uploaded to AWS S3 successfully.`);
        const rawFileUrl = `movies/${movieId}/raw/` + fileName;
        await publishEvent("movie.uploaded", {
          movieId: movieId.toString(),
          rawFileUrl: rawFileUrl,
        });
      }
    } catch (error) {
      logger.error("Error uploading movie file to AWS S3", error);
    }

    writeStream.on("error", (err) => {
      logger.error("Stream error:", err);
      res.status(500).send("File upload failed due to stream error.");
    });
  } catch (error) {
    logger.error("Movie upload failed", error);
    res.status(500).send("File upload failed.");
  }
};

// Upload poster img
const uploadEpisodePoster = async (req, res) => {
  logger.info("Episode upload poster Endpoint Hit...");

  try {
    const { episodeId, tvSeriesId } = req.body;
    const { originalname, mimetype, buffer } = req.file;

    if (!req.file) {
      logger.warn(`Attempted episode poster upload without a file`);
      return res.status(400).json({
        success: false,
        message: "Please upload a file",
      });
    }

    logger.info(`File Details : Name- ${originalname}, Type- ${mimetype}`);
    logger.info(`Uploading to AWS starting`);
    // call fileupload to aws handler here
    const fileName = `${episodeId}_poster_${originalname}`;
    const key = `tvseries/${tvSeriesId}/episodes/${episodeId}/processed/poster/${fileName}`;

    const uploadResult = await uploadImgFileToAWS(
      buffer,
      fileName,
      episodeId,
      key
    );

    // Check if the upload was successful
    if (uploadResult.error) {
      logger.error("Failed to upload to AWS", uploadResult.error);
      return res.status(500).json({
        success: false,
        message: "Failed to upload file to AWS",
      });
    }

    logger.info(`File uploaded to AWS successfully: ${key}`);
    // Update Poster Model
    const poster = await Poster.findOne({ episodeId: episodeId });

    if (!poster) {
      const newPoster = new Poster({
        episodeId: episodeId,
        urlPath: key,
      });
      await newPoster.save();
      logger.info(`New poster created: ${newPoster._id}`);
    } else {
      poster.urlPath = key;
      await poster.save();
    }

    await publishEvent("posterUploaded", {
      id: episodeId.toString(),
      urlPath: key,
      contentType: "episode",
    });

    return res.status(200).json({
      success: true,
      message: "File uploaded successfully!",
      fileUrl: key,
    });
  } catch (error) {
    logger.error("Episode poster upload failed", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
// Upload banner img
const uploadEpisodeBanner = async (req, res) => {
  logger.info("Episode upload banner Endpoint Hit...");

  try {
    const { episodeId, tvSeriesId } = req.body; // Assume you're passing these values
    const { originalname, mimetype, buffer } = req.file;

    if (!req.file) {
      logger.warn(`Attempted episode banner upload without a file`);
      return res.status(400).json({
        success: false,
        message: "Please upload a file",
      });
    }

    logger.info(`File Details : Name- ${originalname}, Type- ${mimetype}`);
    logger.info(`Uploading to AWS starting`);

    // Define the file name and the S3 key path
    const fileName = `${episodeId}_banner_${originalname}`;
    const key = `tvseries/${tvSeriesId}/episodes/${episodeId}/processed/banner/${fileName}`;

    // Call file upload to AWS handler here
    const uploadResult = await uploadImgFileToAWS(
      buffer,
      fileName,
      episodeId,
      key
    );

    // Check if the upload was successful
    if (uploadResult.error) {
      logger.error("Failed to upload to AWS", uploadResult.error);
      return res.status(500).json({
        success: false,
        message: "Failed to upload file to AWS",
      });
    }

    logger.info(`File uploaded to AWS successfully: ${key}`);

    // Update Banner Model
    const banner = await Banner.findOne({ episodeId: episodeId });

    if (!banner) {
      const newBanner = new Banner({
        episodeId: episodeId,
        urlPath: key, // Save the S3 path
      });
      await newBanner.save();
      logger.info(`New banner created: ${newBanner._id}`);
    } else {
      banner.urlPath = key;
      await banner.save();
    }

    // Publish Event (optional, if you have event publishing)
    await publishEvent("bannerUploaded", {
      id: episodeId.toString(),
      urlPath: key,
      contentType: "episode",
    });

    return res.status(200).json({
      success: true,
      message: "File uploaded successfully!",
      fileUrl: key, // The key will be the path on S3
    });
  } catch (error) {
    logger.error("Episode banner upload failed", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  uploadEpisodePoster,
  uploadEpisodeBanner,
};
