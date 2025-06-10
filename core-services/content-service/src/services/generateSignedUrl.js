const { logger } = require("../utils/logger");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// Configure AWS SDK
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const generateSignedUrl = async (key) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME, // Your S3 bucket name
      Key: key, // The path/key to the object in your S3 bucket
    };

    const command = new GetObjectCommand(params);

    // Generate a signed URL with a 5-minute expiration
    const url = await getSignedUrl(s3Client, command, {
      expiresIn: 60 * 60 * 24 * 6,
    }); // Expires in 6 Days

    logger.info("Successfully generated signed URL", url);
    return url;
  } catch (err) {
    logger.error("Error generating signed URL for S3 object", err);
    throw err;
  }
};

module.exports = { generateSignedUrl };
