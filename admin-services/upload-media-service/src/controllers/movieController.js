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
const uploadMovieChunk = async (req, res) => {
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

// // Finalize movie upload
// const finalizeMovieUpload = async (req, res) => {
//   logger.info("Movie Finalize Upload Endpoint Hit...");

//   const { fileName, totalChunks, movieId } = req.body;
//   const uploadDir = path.join(
//     __dirname,
//     `../../uploads/movies/${movieId}/temp`
//   );

//   try {
//     // Ensure the upload directory exists (this will be handled by the middleware, so this part might be redundant)
//     await fsPromises.mkdir(uploadDir, { recursive: true });

//     if (!fileName || !totalChunks) {
//       res.status(400).send("Missing required fields.");
//       return;
//     }

//     const finalPath = path.join(
//       __dirname,
//       `../../uploads/movies/${movieId}`,
//       fileName
//     );

//     const writeStream = fs.createWriteStream(finalPath); // Use fs (not fs.promises) for stream operations
//     logger.info("Assembling movie file...");

//     // Assemble file asynchronously from chunks
//     for (let i = 0; i < totalChunks; i++) {
//       const chunkPath = path.join(uploadDir, `${movieId}-${i}`);

//       // Ensure the chunk exists before reading
//       try {
//         const chunkData = await fsPromises.readFile(chunkPath);
//         writeStream.write(chunkData);

//         // Clean up chunk file asynchronously
//         try {
//           await fsPromises.unlink(chunkPath);
//           logger.info(`Deleted chunk file: ${chunkPath}`);
//         } catch (unlinkError) {
//           logger.error(
//             `Failed to delete chunk file: ${chunkPath}`,
//             unlinkError
//           );
//         }
//       } catch (readError) {
//         logger.error(`Missing chunk file: ${chunkPath}`, readError);
//         throw new Error(`Missing chunk: ${i}`);
//       }
//     }

//     // Explicitly call end() to ensure the stream is finalized
//     writeStream.end();

//     // Handle the finish event
//     writeStream.on("finish", () => {
//       logger.info("Movie file uploaded successfully");
//       res.status(200).send({
//         message:
//           "File uploaded successfully. Processing will continue in the background.",
//       });
//     });

//     try {
//       // Call the uploadFileToAWS function to upload the file to S3
//       const key = `movies/${movieId}/raw/${fileName}`;
//       const { data, error } = await uploadFileToAWS(
//         finalPath,
//         fileName,
//         movieId,
//         key
//       );

//       if (data) {
//         logger.info(`Movie file ${fileName} uploaded to AWS S3 successfully.`);
//         const rawFileUrl = `movies/${movieId}/raw/` + fileName;
//         await publishEvent("movie.uploaded", {
//           movieId: movieId.toString(),
//           rawFileUrl: rawFileUrl,
//         });
//       }
//     } catch (error) {
//       logger.error("Error uploading movie file to AWS S3", error);
//     }

//     writeStream.on("error", (err) => {
//       logger.error("Stream error:", err);
//       res.status(500).send("File upload failed due to stream error.");
//     });
//   } catch (error) {
//     logger.error("Movie upload failed", error);
//     res.status(500).send("File upload failed.");
//   }
// };
const finalizeMovieUpload = async (req, res) => {
  logger.info("Movie Finalize Upload Endpoint Hit...");

  const { fileName, totalChunks, movieId } = req.body;
  const uploadDir = path.join(
    __dirname,
    `../../uploads/movies/${movieId}/temp`
  );

  try {
    // Ensure the upload directory exists
    await fsPromises.mkdir(uploadDir, { recursive: true });

    if (!fileName || !totalChunks) {
      res.status(400).send("Missing required fields.");
      return;
    }

    // Remove spaces from the fileName (or replace spaces with underscores)
    const sanitizedFileName = fileName.replace(/\s+/g, "_"); // Replaces all spaces with underscores
    logger.info(`Sanitized file name: ${sanitizedFileName}`);

    const finalPath = path.join(
      __dirname,
      `../../uploads/movies/${movieId}`,
      sanitizedFileName
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
      const key = `movies/${movieId}/raw/${sanitizedFileName}`;
      const { data, error } = await uploadFileToAWS(
        finalPath,
        sanitizedFileName,
        movieId,
        key
      );

      if (data) {
        logger.info(
          `Movie file ${sanitizedFileName} uploaded to AWS S3 successfully.`
        );
        const rawFileUrl = `movies/${movieId}/raw/` + sanitizedFileName;
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
const uploadMoviePoster = async (req, res) => {
  logger.info("Movie upload poster Endpoint Hit...");

  try {
    const { movieId } = req.body;
    const { originalname, mimetype, buffer } = req.file;

    if (!req.file) {
      logger.warn(`Attempted movie poster upload without a file`);
      return res.status(400).json({
        success: false,
        message: "Please upload a file",
      });
    }

    logger.info(`File Details : Name- ${originalname}, Type- ${mimetype}`);
    logger.info(`Uploading to AWS starting`);
    // call fileupload to aws handler here
    const fileName = `${movieId}_poster_${originalname}`;
    const key = `movies/${movieId}/processed/poster/${fileName}`;

    const uploadResult = await uploadImgFileToAWS(
      buffer,
      fileName,
      movieId,
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
    const poster = await Poster.findOne({ movieId: movieId });

    if (!poster) {
      const newPoster = new Poster({
        movieId: movieId,
        urlPath: key,
      });
      await newPoster.save();
      logger.info(`New poster created: ${newPoster._id}`);
    } else {
      poster.urlPath = key;
      await poster.save();
    }

    await publishEvent("posterUploaded", {
      id: movieId.toString(),
      urlPath: key,
      contentType: "movie",
    });

    return res.status(200).json({
      success: true,
      message: "File uploaded successfully!",
      fileUrl: key,
    });
  } catch (error) {
    logger.error("Movie poster upload failed", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
// Upload banner img
const uploadMovieBanner = async (req, res) => {
  logger.info("Movie upload poster Endpoint Hit...");

  try {
    const { movieId } = req.body;
    const { originalname, mimetype, buffer } = req.file;

    if (!req.file) {
      logger.warn(`Attempted movie poster upload without a file`);
      return res.status(400).json({
        success: false,
        message: "Please upload a file",
      });
    }

    logger.info(`File Details : Name- ${originalname}, Type- ${mimetype}`);
    logger.info(`Uploading to AWS starting`);
    // call fileupload to aws handler here
    const fileName = `${movieId}_banner_${originalname}`;
    const key = `movies/${movieId}/processed/banner/${fileName}`;

    const uploadResult = await uploadImgFileToAWS(
      buffer,
      fileName,
      movieId,
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
    const banner = await Banner.findOne({ movieId: movieId });

    if (!banner) {
      const newBanner = new Banner({
        movieId: movieId,
        urlPath: key,
      });
      await newBanner.save();
      logger.info(`New Banner created: ${newBanner._id}`);
    } else {
      banner.urlPath = uploadResult.data.Location;
      await banner.save();
    }

    await publishEvent("bannerUploaded", {
      id: movieId.toString(),
      urlPath: key,
      contentType: "movie",
    });

    return res.status(200).json({
      success: true,
      message: "File uploaded successfully!",
      fileUrl: uploadResult.data.Location,
    });
  } catch (error) {
    logger.error("Movie Banenr upload failed", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  uploadMovieChunk,
  finalizeMovieUpload,
  uploadMoviePoster,
  uploadMovieBanner,
};
