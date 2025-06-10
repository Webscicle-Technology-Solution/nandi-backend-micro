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

const uploadVideoSongPoster = async (req, res) => {
  logger.info("Video Song upload poster Endpoint Hit...");

  try {
    const { videoSongId } = req.body;
    const { originalname, mimetype, buffer } = req.file;

    if (!req.file) {
      logger.warn(`Attempted Video Song poster upload without a file`);
      return res.status(400).json({
        success: false,
        message: "Please upload a file",
      });
    }

    logger.info(`File Details : Name- ${originalname}, Type- ${mimetype}`);
    logger.info(`Uploading to AWS starting`);
    // call fileupload to aws handler here
    const fileName = `${videoSongId}_poster_${originalname}`;
    const key = `videosongs/${videoSongId}/processed/poster/${fileName}`;

    const uploadResult = await uploadImgFileToAWS(
      buffer,
      fileName,
      videoSongId,
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
    const poster = await Poster.findOne({ videoSongId: videoSongId });

    if (!poster) {
      const newPoster = new Poster({
        videoSongId: videoSongId,
        urlPath: key,
      });
      await newPoster.save();
      logger.info(`New poster created: ${newPoster._id}`);
    } else {
      poster.urlPath = key;
      await poster.save();
    }

    await publishEvent("posterUploaded", {
      id: videoSongId.toString(),
      urlPath: key,
      contentType: "videosong",
    });

    return res.status(200).json({
      success: true,
      message: "File uploaded successfully!",
      fileUrl: key,
    });
  } catch (error) {
    logger.error("videosong poster upload failed", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
// Upload banner img
const uploadVideoSongBanner = async (req, res) => {
  logger.info("videosong upload poster Endpoint Hit...");

  try {
    const { videoSongId } = req.body;
    const { originalname, mimetype, buffer } = req.file;

    if (!req.file) {
      logger.warn(`Attempted videosong poster upload without a file`);
      return res.status(400).json({
        success: false,
        message: "Please upload a file",
      });
    }

    logger.info(`File Details : Name- ${originalname}, Type- ${mimetype}`);
    logger.info(`Uploading to AWS starting`);
    // call fileupload to aws handler here
    const fileName = `${videoSongId}_banner_${originalname}`;
    const key = `videosongs/${videoSongId}/processed/banner/${fileName}`;

    const uploadResult = await uploadImgFileToAWS(
      buffer,
      fileName,
      videoSongId,
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
    const banner = await Banner.findOne({ videoSongId: videoSongId });

    if (!banner) {
      const newBanner = new Banner({
        videoSongId: videoSongId,
        urlPath: key,
      });
      await newBanner.save();
      logger.info(`New Banner created: ${newBanner._id}`);
    } else {
      banner.urlPath = uploadResult.data.Location;
      await banner.save();
    }

    await publishEvent("bannerUploaded", {
      id: videoSongId.toString(),
      urlPath: key,
      contentType: "videosong",
    });

    return res.status(200).json({
      success: true,
      message: "File uploaded successfully!",
      fileUrl: uploadResult.data.Location,
    });
  } catch (error) {
    logger.error("Videosong Banner upload failed", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = { uploadVideoSongPoster, uploadVideoSongBanner };
