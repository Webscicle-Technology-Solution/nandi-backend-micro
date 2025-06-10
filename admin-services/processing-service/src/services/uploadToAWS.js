const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { logger } = require("../utils/logger");
const fsPromises = require("fs/promises");
const fs = require("fs");
const path = require("path");

// Initialize the S3 Client (AWS SDK v3)
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Function to upload file to AWS S3
const uploadFileToAWS = async (filePath, fileName, movieId) => {
  try {
    logger.info(
      `Starting upload to AWS S3 for movieId: ${movieId}, fileName: ${fileName}`
    );

    // Read the file buffer
    const fileBuffer = await fsPromises.readFile(filePath);

    // Configure S3 upload params
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `movies/${movieId}/raw/${fileName}`, // Define the S3 path
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
  } catch (error) {
    logger.error("Error uploading file to AWS S3:", error);
  }
};

module.exports = { uploadFileToAWS };
