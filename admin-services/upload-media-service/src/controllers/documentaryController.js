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

const uploadDocumentaryPoster = async (req, res) => {
  logger.info("documentaries upload poster Endpoint Hit...");

  try {
    const { documentaryId } = req.body;
    const { originalname, mimetype, buffer } = req.file;

    if (!req.file) {
      logger.warn(`Attempted documentaries poster upload without a file`);
      return res.status(400).json({
        success: false,
        message: "Please upload a file",
      });
    }

    logger.info(`File Details : Name- ${originalname}, Type- ${mimetype}`);
    logger.info(`Uploading to AWS starting`);
    // call fileupload to aws handler here
    const fileName = `${documentaryId}_poster_${originalname}`;
    const key = `documentaries/${documentaryId}/processed/poster/${fileName}`;

    const uploadResult = await uploadImgFileToAWS(
      buffer,
      fileName,
      documentaryId,
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
    const poster = await Poster.findOne({ documentaryId: documentaryId });

    if (!poster) {
      const newPoster = new Poster({
        documentaryId: documentaryId,
        urlPath: key,
      });
      await newPoster.save();
      logger.info(`New poster created: ${newPoster._id}`);
    } else {
      poster.urlPath = key;
      await poster.save();
    }

    logger.info(`Publishing poster upload event...`);
    await publishEvent("posterUploaded", {
      id: documentaryId.toString(),
      urlPath: key,
      contentType: "documentary",
    });

    return res.status(200).json({
      success: true,
      message: "File uploaded successfully!",
      fileUrl: key,
    });
  } catch (error) {
    logger.error("documentaries poster upload failed", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
// Upload banner img
const uploadDocumentaryBanner = async (req, res) => {
  logger.info("documentaries upload poster Endpoint Hit...");

  try {
    const { documentaryId } = req.body;
    const { originalname, mimetype, buffer } = req.file;

    if (!req.file) {
      logger.warn(`Attempted documentaries poster upload without a file`);
      return res.status(400).json({
        success: false,
        message: "Please upload a file",
      });
    }

    logger.info(`File Details : Name- ${originalname}, Type- ${mimetype}`);
    logger.info(`Uploading to AWS starting`);
    // call fileupload to aws handler here
    const fileName = `${documentaryId}_banner_${originalname}`;
    const key = `documentaries/${documentaryId}/processed/banner/${fileName}`;

    const uploadResult = await uploadImgFileToAWS(
      buffer,
      fileName,
      documentaryId,
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
    const banner = await Banner.findOne({ documentaryId: documentaryId });

    if (!banner) {
      const newBanner = new Banner({
        documentaryId: documentaryId,
        urlPath: key,
      });
      await newBanner.save();
      logger.info(`New Banner created: ${newBanner._id}`);
    } else {
      banner.urlPath = uploadResult.data.Location;
      await banner.save();
    }

    await publishEvent("bannerUploaded", {
      id: documentaryId.toString(),
      urlPath: key,
      contentType: "documentary",
    });

    return res.status(200).json({
      success: true,
      message: "File uploaded successfully!",
      fileUrl: uploadResult.data.Location,
    });
  } catch (error) {
    logger.error("documentariess Banner upload failed", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = { uploadDocumentaryPoster, uploadDocumentaryBanner };
