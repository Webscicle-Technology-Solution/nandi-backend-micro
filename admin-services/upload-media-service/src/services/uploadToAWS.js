const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { logger } = require("../utils/logger");
const fsPromises = require("fs/promises");
const fs = require("fs");
const path = require("path");
const { error } = require("console");

// Initialize the S3 Client (AWS SDK v3)
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Function to upload file to AWS S3
const uploadFileToAWS = async (filePath, fileName, movieId, key) => {
  try {
    logger.info(
      `Starting upload to AWS S3 for mediaId: ${movieId}, fileName: ${fileName}`
    );

    // Read the file buffer
    const fileBuffer = await fsPromises.readFile(filePath);

    // Configure S3 upload params
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key, // Define the S3 path
      Body: fileBuffer,
      ContentType: "video/mp4", // Adjust content type if needed
    };

    // Create the PutObjectCommand
    const command = new PutObjectCommand(params);

    // Upload the file to S3
    const data = await s3Client.send(command);
    logger.info(
      `File uploaded to S3 successfully: ${data.Location || data.ETag}`
    );

    // Optionally, delete the local file after uploading to S3
    await fsPromises.unlink(filePath);
    logger.info(`Deleted local file after uploading to S3: ${filePath}`);
    return { data, error: null };
  } catch (error) {
    logger.error("Error uploading file to AWS S3:", error);
    const data = null;
    return { data, error };
  }
};

const uploadImgFileToAWS = async (fileBuffer, fileName, movieId, key) => {
  try {
    logger.info(`Starting upload to AWS S3 for fileName: ${fileName}`);

    // Configure S3 upload params
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key, // Define the S3 path
      Body: fileBuffer, // Directly use the buffer from multer
      ContentType: "image/jpeg", // Adjust the content type based on the file type
    };

    // Create the PutObjectCommand
    const command = new PutObjectCommand(params);

    // Upload the file to S3
    const data = await s3Client.send(command);
    logger.info(
      `File uploaded to S3 successfully: ${data.Location || data.ETag}`
    );

    // Return the upload result
    return { data, error: null };
  } catch (error) {
    logger.error("Error uploading file to AWS S3:", error);
    const data = null;
    return { data, error };
  }
};

module.exports = { uploadFileToAWS, uploadImgFileToAWS };
