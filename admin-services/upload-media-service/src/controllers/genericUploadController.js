const path = require("path");
const fs = require("fs"); // Use the regular fs module for streams
const fsPromises = require("fs").promises; // Use fs.promises for async file ops
const { logger } = require("../utils/logger");
const { uploadFileToAWS } = require("../services/uploadToAWS");
const {
  getMediaTypeFromUrl,
  getTrailerorPreviewTypeFromUrl,
} = require("../utils/requestParser");
const { publishEvent } = require("../utils/rabbitmq");

const uploadMediaChunk = async (req, res) => {
  logger.info("Media upload Chunk Endpoint Hit...");

  // Log the incoming request body to debug
  logger.info(`Received request body: ${JSON.stringify(req.body)}`);
  logger.info(`Received file: ${JSON.stringify(req.file)}`);

  // Destructure movieId, index, and fileName from the form data
  const { mediaId, index, fileName } = req.body;

  req.mediaType = getMediaTypeFromUrl(req.originalUrl);

  if (!req.mediaType) {
    logger.warn("Invalid URL, missing media type.");
    return res.status(400).send("Invalid URL, missing media type.");
  }

  // Check for missing movieId in the request
  if (!mediaId) {
    logger.warn("Missing Media ID in the request body.");
    return res.status(400).send("Missing MediaID in the request body.");
  }

  logger.info(
    `Received fileName: ${fileName}, index: ${index}, mediaId: ${mediaId}`
  );

  // Use the correct upload directory
  const uploadDir = path.join(
    __dirname,
    `../../uploads/${req.mediaType}/${mediaId}/temp`
  );

  try {
    // Ensure the directory exists
    await fsPromises.mkdir(uploadDir, { recursive: true });

    // Path for the uploaded chunk
    const chunkPath = path.join(uploadDir, `${mediaId}-${index}`);

    // Rename the file asynchronously
    await fsPromises.rename(req.file.path, chunkPath);
    logger.info(`Uploaded chunk ${index} to ${chunkPath}`);

    res.status(200).send({ message: "Chunk uploaded successfully." });
  } catch (error) {
    logger.error("Media Chunk upload failed", error);
    res.status(500).send("File upload failed.");
  }
};

const uploadTrailerPreviewChunk = async (req, res) => {
  logger.info("Trailer Preview upload Chunk Endpoint Hit...");

  // Log the incoming request body to debug
  logger.info(`Received request body: ${JSON.stringify(req.body)}`);
  logger.info(`Received file: ${JSON.stringify(req.file)}`);

  // Destructure movieId, index, and fileName from the form data
  const { mediaId, index, fileName } = req.body;

  req.mediaType = getMediaTypeFromUrl(req.originalUrl);
  req.videoType = getTrailerorPreviewTypeFromUrl(req.originalUrl);

  if (!req.mediaType || !req.videoType) {
    logger.warn("Invalid URL, missing media type.");
    return res.status(400).send("Invalid URL, missing media type.");
  }

  // Check for missing movieId in the request
  if (!mediaId) {
    logger.warn("Missing Media ID in the request body.");
    return res.status(400).send("Missing MediaID in the request body.");
  }

  logger.info(
    `Received fileName: ${fileName}, index: ${index}, mediaId: ${mediaId}`
  );

  // Use the correct upload directory
  const uploadDir = path.join(
    __dirname,
    `../../uploads/${req.mediaType}/${mediaId}/${req.videoType}/temp`
  );

  try {
    // Ensure the directory exists
    await fsPromises.mkdir(uploadDir, { recursive: true });

    // Path for the uploaded chunk
    const chunkPath = path.join(uploadDir, `${mediaId}-${index}`);

    // Rename the file asynchronously
    await fsPromises.rename(req.file.path, chunkPath);
    logger.info(`Uploaded chunk ${index} to ${chunkPath}`);

    res.status(200).send({ message: "Chunk uploaded successfully." });
  } catch (error) {
    logger.error("Media Chunk upload failed", error);
    res.status(500).send("File upload failed.");
  }
};

const uploadEpisodeChunk = async (req, res) => {
  logger.info("Episode upload Chunk Endpoint Hit...");

  // Log the incoming request body to debug
  logger.info(`Received request body: ${JSON.stringify(req.body)}`);
  logger.info(`Received file: ${JSON.stringify(req.file)}`);

  // Destructure movieId, index, and fileName from the form data
  const { tvSeriesId, episodeId, index, fileName } = req.body;
  console.log(`req.body: ${JSON.stringify(req.body)}`);

  req.mediaType = getMediaTypeFromUrl(req.originalUrl);

  if (!req.mediaType) {
    logger.warn("Invalid URL, missing media type.");
    return res.status(400).send("Invalid URL, missing media type.");
  }

  // Check for missing movieId in the request
  if (!episodeId || !tvSeriesId) {
    logger.warn("Missing Media ID in the request body.");
    return res.status(400).send("Missing MediaID in the request body.");
  }

  logger.info(
    `Received fileName: ${fileName}, index: ${index}, episodeId: ${episodeId}`
  );

  // Use the correct upload directory
  const uploadDir = path.join(
    __dirname,
    `../../uploads/${req.mediaType}/${tvSeriesId}/${episodeId}/temp`
  );

  try {
    // Ensure the directory exists
    await fsPromises.mkdir(uploadDir, { recursive: true });

    // Path for the uploaded chunk
    const chunkPath = path.join(uploadDir, `${episodeId}-${index}`);

    // Rename the file asynchronously
    await fsPromises.rename(req.file.path, chunkPath);
    logger.info(`Uploaded chunk ${index} to ${chunkPath}`);

    res.status(200).send({ message: "Chunk uploaded successfully." });
  } catch (error) {
    logger.error("Media Chunk upload failed", error);
    res.status(500).send("File upload failed.");
  }
};

const finalizeMediaUpload = async (req, res) => {
  logger.info("Media Finalize Upload Endpoint Hit...");

  const { fileName, totalChunks, mediaId } = req.body;

  logger.info(`Req.originalURl : ${req.originalUrl}`);

  const mediaType = getMediaTypeFromUrl(req.originalUrl);

  if (!mediaType) {
    logger.warn("Invalid URL, missing media type.");
    return res.status(400).send("Invalid URL, missing media type.");
  }
  const uploadDir = path.join(
    __dirname,
    `../../uploads/${mediaType}/${mediaId}/temp`
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
      `../../uploads/${mediaType}/${mediaId}`,
      sanitizedFileName
    );

    const writeStream = fs.createWriteStream(finalPath); // Use fs (not fs.promises) for stream operations
    logger.info("Assembling movie file...");

    // Assemble file asynchronously from chunks
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(uploadDir, `${mediaId}-${i}`);

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
      logger.info("Media file uploaded successfully");
      res.status(200).send({
        message:
          "File uploaded successfully. Processing will continue in the background.",
      });
    });

    try {
      // Call the uploadFileToAWS function to upload the file to S3
      const key = `${mediaType}/${mediaId}/raw/${sanitizedFileName}`;
      const { data, error } = await uploadFileToAWS(
        finalPath,
        sanitizedFileName,
        mediaId,
        key
      );

      if (data) {
        logger.info(
          `Media file ${sanitizedFileName} uploaded to AWS S3 successfully.`
        );
        const rawFileUrl = `${mediaType}/${mediaId}/raw/` + sanitizedFileName;
        await publishEvent(`${mediaType}.uploaded`, {
          mediaId: mediaId.toString(),
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
    logger.error("Media upload failed", error);
    res.status(500).send("File upload failed.");
  }
};

const finalizeTrailerPreviewUpload = async (req, res) => {
  logger.info("Trailer Preview Media Finalize Upload Endpoint Hit...");

  const { fileName, totalChunks, mediaId } = req.body;

  logger.info(`Req.originalURl : ${req.originalUrl}`);

  const mediaType = getMediaTypeFromUrl(req.originalUrl);
  const videoType = getTrailerorPreviewTypeFromUrl(req.originalUrl);

  if (!mediaType) {
    logger.warn("Invalid URL, missing media type.");
    return res.status(400).send("Invalid URL, missing media type.");
  }
  const uploadDir = path.join(
    __dirname,
    `../../uploads/${mediaType}/${mediaId}/${videoType}/temp`
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
      `../../uploads/${mediaType}/${mediaId}/${videoType}`,
      sanitizedFileName
    );

    const writeStream = fs.createWriteStream(finalPath); // Use fs (not fs.promises) for stream operations
    logger.info("Assembling movie file...");

    // Assemble file asynchronously from chunks
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(uploadDir, `${mediaId}-${i}`);

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
      logger.info("Media file uploaded successfully");
      res.status(200).send({
        message:
          "File uploaded successfully. Processing will continue in the background.",
      });
    });

    try {
      // Call the uploadFileToAWS function to upload the file to S3
      const key = `${mediaType}/${mediaId}/${videoType}/raw/${sanitizedFileName}`;
      const { data, error } = await uploadFileToAWS(
        finalPath,
        sanitizedFileName,
        mediaId,
        key
      );

      if (data) {
        logger.info(
          `Media file ${sanitizedFileName} uploaded to AWS S3 successfully.`
        );
        const rawFileUrl = key;
        await publishEvent(`${mediaType}.${videoType}.uploaded`, {
          mediaType: mediaType,
          mediaId: mediaId.toString(),
          videoType: videoType,
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
    logger.error("Media upload failed", error);
    res.status(500).send("File upload failed.");
  }
};

const finalizeEpisodeUpload = async (req, res) => {
  logger.info("Episode Finalize Upload Endpoint Hit...");

  const { fileName, totalChunks, episodeId, tvSeriesId } = req.body;
  const mediaId = episodeId;

  logger.info(`Req.originalURl : ${req.originalUrl}`);

  const mediaType = getMediaTypeFromUrl(req.originalUrl);

  if (!mediaType) {
    logger.warn("Invalid URL, missing media type.");
    return res.status(400).send("Invalid URL, missing media type.");
  }
  const uploadDir = path.join(
    __dirname,
    `../../uploads/${mediaType}/${tvSeriesId}/${episodeId}/temp`
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
      `../../uploads/${mediaType}/${tvSeriesId}/${episodeId}`,
      sanitizedFileName
    );

    const writeStream = fs.createWriteStream(finalPath); // Use fs (not fs.promises) for stream operations
    logger.info("Assembling movie file...");

    // Assemble file asynchronously from chunks
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(uploadDir, `${episodeId}-${i}`);

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
      logger.info("Media file uploaded successfully");
      res.status(200).send({
        message:
          "File uploaded successfully. Processing will continue in the background.",
      });
    });

    try {
      // Call the uploadFileToAWS function to upload the file to S3
      const key = `${mediaType}/${episodeId}/raw/${sanitizedFileName}`;
      const { data, error } = await uploadFileToAWS(
        finalPath,
        sanitizedFileName,
        mediaId,
        key
      );

      if (data) {
        logger.info(
          `Media file ${sanitizedFileName} uploaded to AWS S3 successfully.`
        );
        const rawFileUrl = `${mediaType}/${mediaId}/raw/` + sanitizedFileName;
        await publishEvent(`${mediaType}.uploaded`, {
          mediaId: mediaId.toString(),
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
    logger.error("Media upload failed", error);
    res.status(500).send("File upload failed.");
  }
};

module.exports = {
  uploadMediaChunk,
  finalizeMediaUpload,
  finalizeEpisodeUpload,
  uploadEpisodeChunk,
  uploadTrailerPreviewChunk,
  finalizeTrailerPreviewUpload,
};
