require("dotenv").config();
const path = require("path");
const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const fs = require("fs");
const { logger } = require("../utils/logger");
const ffmpeg = require("fluent-ffmpeg");
const axios = require("axios");
const crypto = require("crypto");
const { Upload } = require("@aws-sdk/lib-storage");

const DRM_SERVICE_URL = "http://localhost:3000/v1/drm";

// Initialize S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Function to download the raw file from S3
async function downloadRawFile(movieId, rawFileUrl, downloadDirectory) {
  logger.info("Downloading raw file from S3 for processing...");
  //   if file system doesnt exist, create one
  if (!fs.existsSync(downloadDirectory)) {
    fs.mkdirSync(downloadDirectory, { recursive: true }); // 'recursive: true' creates nested directories
  }
  const filename = path.basename(rawFileUrl);
  const localFilePath = path.join(downloadDirectory, `${filename}`);

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: rawFileUrl, // Example: "movies/123456/raw/original-file.mp4"
  };

  try {
    // Create the command to get the object from S3
    const command = new GetObjectCommand(params);
    const data = await s3.send(command);

    // Pipe the data to a file
    const writeStream = fs.createWriteStream(localFilePath);
    data.Body.pipe(writeStream);

    // Wait until the file is fully written
    return new Promise((resolve, reject) => {
      writeStream.on("finish", () => {
        logger.info(`Raw video downloaded successfully: ${localFilePath}`);
        resolve({ status: "success", filePath: localFilePath });
      });

      writeStream.on("error", (err) => {
        logger.error("Error writing file:", err);
        reject({ status: "error", message: err.message });
      });
    });
  } catch (error) {
    logger.error("Error downloading file from S3:", error);
    throw { status: "error", message: error.message };
  }
}

// Normalize encoding & format
async function normalizeToMP4(movieId, inputFile) {
  return new Promise((resolve, reject) => {
    const outputDir = path.join(inputFile, `../normalized`);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = path.join(outputDir, "normalized.mp4");

    logger.info(`
      Normalizing ${inputFile} to MP4 format with standard encoding...`);

    ffmpeg(inputFile)
      .output(outputFile)
      .videoCodec("libx264") // Standardized Video Codec
      .audioCodec("aac") // Standardized Audio Codec
      .fps(24) // Normalize Frame Rate to 30fps
      .outputOptions([
        "-preset fast", // Faster encoding with good quality
        "-crf 18", // High-quality variable bitrate
        "-g 24", // Force keyframe every 2 seconds (for 30fps)
        "-movflags +faststart", // Enable fast seeking for streaming
        "-pix_fmt yuv420p",
      ])
      .on("start", (cmd) => logger.info(`FFmpeg started: ${cmd}`))
      .on("progress", (progress) =>
        logger.info(`Progress: ${progress.percent}% done`)
      )
      .on("end", () => {
        logger.info(`Normalization complete: ${outputFile}`);
        resolve({ status: "success", filePath: outputFile });
      })
      .on("error", (err) => {
        logger.error("Error normalizing video:", err);
        reject({ status: "error", message: err.message });
      })
      .run();
  });
}

// Transcode To HLS
const transcodeToHLS = async (movieId, inputFile) => {
  return new Promise(async (resolve, reject) => {
    const outputDir = path.join(inputFile, `../../hls`);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    logger.info("Starting HLS transcoding...");

    const resolutions = [
      { name: "1080p", width: 1920, height: 1080, bitrate: "5000k" },
      { name: "720p", width: 1280, height: 720, bitrate: "2500k" },
      { name: "480p", width: 854, height: 480, bitrate: "1000k" },
    ];

    let totalSegments = 0;
    let playlistEntries = [];

    try {
      for (const res of resolutions) {
        const outputFile = path.join(outputDir, `${res.name}.m3u8`);
        const segmentPattern = path.join(outputDir, `${res.name}_%03d.ts`);

        await new Promise((resResolve, resReject) => {
          ffmpeg(inputFile)
            .output(outputFile)
            .videoCodec("libx264")
            .size(`${res.width}x${res.height}`)
            .videoBitrate(res.bitrate)
            .audioCodec("aac")
            .outputOptions([
              "-hls_time 10", // Segment duration
              "-hls_playlist_type vod",
              `-hls_segment_filename ${segmentPattern}`,
              "-movflags +faststart",
            ])
            .on("progress", (progress) =>
              logger.info(`${res.name}: ${progress.percent}% done`)
            )
            .on("end", () => {
              logger.info(`${res.name} HLS conversion complete.`);

              // 🔹 Count Number of Generated `.ts` Segments
              const segmentFiles = fs
                .readdirSync(outputDir)
                .filter(
                  (file) => file.startsWith(res.name) && file.endsWith(".ts")
                );
              totalSegments = Math.max(totalSegments, segmentFiles.length);

              // 🔹 Add to master playlist entries
              playlistEntries.push(
                `#EXT-X-STREAM-INF:BANDWIDTH=${res.bitrate.replace(
                  "k",
                  "000"
                )},RESOLUTION=${res.width}x${res.height}\n${res.name}.m3u8\n`
              );

              resResolve();
            })
            .on("error", (err) => {
              logger.error(`Error processing ${res.name}:`, err);
              resReject(err);
            })
            .run();
        });
      }

      // 🔹 **Create `master.m3u8`**
      const masterPlaylistPath = path.join(outputDir, "master.m3u8");
      fs.writeFileSync(
        masterPlaylistPath,
        `#EXTM3U\n${playlistEntries.join("")}`
      );

      logger.info(
        `HLS Transcoding complete. Master playlist created: ${masterPlaylistPath}`
      );

      resolve({
        status: "success",
        masterPlaylistUrl: masterPlaylistPath,
        totalSegments, // ✅ Now returning total number of segments
        hlsDirectory: outputDir, // ✅ Required for encryption & S3 upload
      });
    } catch (error) {
      logger.error(`HLS transcoding failed: ${error.message}`);
      reject({ status: "error", message: error.message });
    }
  });
};

const encryptHLSSegments = async (movieId, hlsDirectory, drmKeyList) => {
  return new Promise(async (resolve, reject) => {
    try {
      const fs = require("fs");
      const path = require("path");
      const ffmpeg = require("fluent-ffmpeg");

      if (!fs.existsSync(hlsDirectory)) {
        throw new Error(`❌ HLS directory not found: ${hlsDirectory}`);
      }

      const encryptedDir = path.join(hlsDirectory, "encrypted");
      if (!fs.existsSync(encryptedDir)) {
        fs.mkdirSync(encryptedDir, { recursive: true });
      }

      // Copy master.m3u8 to encrypted directory without the `encrypted_` prefix
      const masterPlaylistPath = path.join(hlsDirectory, "master.m3u8");
      if (fs.existsSync(masterPlaylistPath)) {
        const masterDestPath = path.join(encryptedDir, "master.m3u8"); // No `encrypted_` prefix
        fs.copyFileSync(masterPlaylistPath, masterDestPath);
        logger.info(
          "🔹 Copied master.m3u8 to encrypted directory without encryption prefix"
        );
      }

      const resolutionPlaylists = fs
        .readdirSync(hlsDirectory)
        .filter((file) => file.endsWith(".m3u8") && file !== "master.m3u8");

      if (resolutionPlaylists.length === 0) {
        throw new Error("❌ No resolution playlists found for encryption!");
      }

      let encryptedPlaylists = [];

      for (const resolutionPlaylist of resolutionPlaylists) {
        const resolutionName = resolutionPlaylist.replace(".m3u8", "");

        logger.info(`🔹 Encrypting ${resolutionName} with shared segment keys`);

        // **Encrypt segments**
        for (
          let segmentIndex = 0;
          segmentIndex < drmKeyList.length;
          segmentIndex++
        ) {
          const { keyId, encryptionKey, iv } = drmKeyList[segmentIndex];

          logger.info(
            `🔑 Using DRM Key for ${resolutionName} Segment ${segmentIndex}: keyId=${keyId}`
          );

          const keyBuffer = Buffer.from(encryptionKey, "hex");
          const ivHex = iv.toUpperCase();

          if (keyBuffer.length !== 16) {
            throw new Error(
              `❌ Invalid Key Length! Expected 16 bytes, got ${keyBuffer.length}`
            );
          }
          if (ivHex.length !== 32) {
            throw new Error(
              `❌ Invalid IV Length! Expected 32 hex characters, got ${ivHex.length}`
            );
          }

          // **Store Key & IV Locally**
          const keyFilePath = path.join(
            encryptedDir,
            `${resolutionName}_seg${segmentIndex}.key` // No `encrypted_` prefix
          );
          const keyBinPath = path.join(
            encryptedDir,
            `${resolutionName}_seg${segmentIndex}.bin` // No `encrypted_` prefix
          );

          fs.writeFileSync(keyBinPath, keyBuffer);
          fs.writeFileSync(
            keyFilePath,
            `${process.env.API_GATEWAY_URL}/v1/drm/getKey?keyId=${keyId}\n${keyBinPath}\n${ivHex}`
          );

          // **Encrypt HLS Segments**
          const encryptedPlaylist = path.join(
            encryptedDir,
            `${resolutionName}.m3u8` // No `encrypted_` prefix
          );
          const segmentFilePattern = path.join(
            encryptedDir,
            `${resolutionName}_${segmentIndex}_%03d.ts` // No `encrypted_` prefix
          );

          await new Promise((resResolve, resReject) => {
            ffmpeg(path.resolve(hlsDirectory, resolutionPlaylist))
              .output(encryptedPlaylist)
              .outputOptions([
                "-hls_time 10",
                "-hls_playlist_type vod",
                "-hls_segment_type mpegts",
                `-hls_key_info_file ${keyFilePath}`,
                "-hls_allow_cache 0",
                "-movflags +faststart",
                `-hls_segment_filename ${segmentFilePattern}`, // Correct segment filename
                "-c:v copy",
                "-c:a copy",
              ])
              .on("start", (cmd) =>
                logger.info(`🚀 FFmpeg started for ${resolutionName}: ${cmd}`)
              )
              .on("end", () => {
                logger.info(
                  `✅ Encryption complete for ${resolutionName} segment ${segmentIndex}`
                );
                resResolve();
              })
              .on("error", (err) => {
                logger.error(`❌ FFmpeg Error for ${resolutionName}:`, err);
                resReject(err);
              })
              .run();
          });
        }

        encryptedPlaylists.push({
          name: resolutionName,
          playlist: `encrypted/${resolutionName}.m3u8`, // No `encrypted_` prefix
        });
      }

      resolve({ status: "success", hlsDirectory: encryptedDir });
    } catch (error) {
      reject({ status: "error", message: error.message });
    }
  });
};

// const uploadHLSToS3 = async ({
//   movieId,
//   documentaryId,
//   videoSongId,
//   shortFilmId,
//   key = null,
//   hlsDirectory,
// }) => {
//   try {
//     if (key == null) {
//       key = `${mediaType}/${mediaId}/processed/${file}`;
//     }
//     logger.info("🔹 Uploading HLS to AWS S3, HlsDirectory:", hlsDirectory);
//     const files = fs.readdirSync(hlsDirectory);
//     logger.info(`Found files: ${files}`);
//     let mediaType = null;
//     let mediaId = null;
//     if (movieId) {
//       mediaType = "movies";
//       mediaId = movieId;
//     } else if (documentaryId) {
//       mediaType = "documentaries";
//       mediaId = documentaryId;
//     } else if (videoSongId) {
//       mediaType = "videosongs";
//       mediaId = videoSongId;
//     } else if (shortFilmId) {
//       mediaType = "shortfilms";
//       mediaId = shortFilmId;
//     }

//     for (const file of files) {
//       const filePath = path.join(hlsDirectory, file);
//       const fileStream = fs.createReadStream(filePath);
//       const fileSize = fs.statSync(filePath).size;

//       const params = {
//         Bucket: process.env.AWS_S3_BUCKET_NAME,
//         Key: key, // Ensure file is uploaded with the correct name
//         Body: fileStream,
//         ContentType: file.endsWith(".m3u8")
//           ? "application/vnd.apple.mpegurl"
//           : "video/MP2T",
//         ContentLength: fileSize,
//       };

//       logger.info(`Uploading To AWS S3: ${file}`);

//       try {
//         const upload = new Upload({ client: s3, params });
//         await upload.done();
//         logger.info(`✅ Uploaded: ${file}`);
//       } catch (uploadError) {
//         logger.error(`❌ Failed to upload ${file}: ${uploadError.message}`);
//       }
//     }

//     logger.info(
//       `✅ All HLS files uploaded successfully for mediaId: ${mediaId}`
//     );
//   } catch (error) {
//     logger.error(`❌ Error occurred while processing upload: ${error.message}`);
//   }
// };

const uploadHLSToS3 = async ({
  movieId,
  documentaryId,
  videoSongId,
  shortFilmId,
  episodeId,
  key = null,
  hlsDirectory,
}) => {
  try {
    if (key == null) {
      // Use fallback logic to maintain the existing structure
      let mediaType = null;
      let mediaId = null;

      if (movieId) {
        mediaType = "movies";
        mediaId = movieId;
      } else if (documentaryId) {
        mediaType = "documentaries";
        mediaId = documentaryId;
      } else if (videoSongId) {
        mediaType = "videosongs";
        mediaId = videoSongId;
      } else if (shortFilmId) {
        mediaType = "shortfilms";
        mediaId = shortFilmId;
      } else if (episodeId) {
        mediaType = "episodes";
        mediaId = episodeId;
      }

      // Fall back to the format using mediaType and mediaId
      key = `${mediaType}/${mediaId}/processed/`;
    }

    logger.info("🔹 Uploading HLS to AWS S3, HlsDirectory:", hlsDirectory);
    const files = fs.readdirSync(hlsDirectory);
    logger.info(`Found files: ${files}`);

    for (const file of files) {
      const filePath = path.join(hlsDirectory, file);
      const fileStream = fs.createReadStream(filePath);
      const fileSize = fs.statSync(filePath).size;

      const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `${key}${file}`, // Append file to the key
        Body: fileStream,
        ContentType: file.endsWith(".m3u8")
          ? "application/vnd.apple.mpegurl"
          : "video/MP2T",
        ContentLength: fileSize,
      };

      logger.info(`Uploading To AWS S3: ${file}`);

      try {
        const upload = new Upload({ client: s3, params });
        await upload.done();
        logger.info(`✅ Uploaded: ${file}`);
      } catch (uploadError) {
        logger.error(`❌ Failed to upload ${file}: ${uploadError.message}`);
      }
    }

    logger.info(`✅ All HLS files uploaded successfully.`);
  } catch (error) {
    logger.error(`❌ Error occurred while processing upload: ${error.message}`);
  }
};

const requestDRMKeys = async (movieId, totalSegments) => {
  try {
    console.log(`movieId: ${movieId}, totalSegments: ${totalSegments}`);
    const response = await axios.post(`${DRM_SERVICE_URL}/storeKeys`, {
      movieId,
      totalSegments,
    });

    if (response.status === 201 && response.data.keyIds) {
      return response.data.keyIds;
    } else {
      throw new Error("Invalid response from DRM service.");
    }
  } catch (error) {
    logger.error(`Failed to request DRM keys: ${error.message}`);
    return null;
  }
};

// const uploadHLSToS3 = async (movieId, hlsDirectory) => {
//   try {
//     const files = fs.readdirSync(hlsDirectory);

//     for (const file of files) {
//       const filePath = path.join(hlsDirectory, file);
//       const fileStream = fs.createReadStream(filePath);
//       const fileSize = fs.statSync(filePath).size; // ✅ Fix: Get file size

//       const params = {
//         Bucket: process.env.AWS_S3_BUCKET_NAME,
//         Key: `movies/${movieId}/processed/${file}`,
//         Body: fileStream,
//         ContentType: file.endsWith(".m3u8")
//           ? "application/vnd.apple.mpegurl"
//           : "video/MP2T",
//         ContentLength: fileSize, // ✅ Fix: Provide file size
//       };

//       logger.info(`Uploading To AWS S3: ${file}`);

//       try {
//         const upload = new Upload({ client: s3, params });
//         await upload.done();
//         logger.info(`✅ Uploaded: ${file}`);
//       } catch (uploadError) {
//         logger.error(`❌ Failed to upload ${file}: ${uploadError.message}`);
//       }
//     }

//     logger.info(
//       `✅ All HLS files uploaded successfully for movieId: ${movieId}`
//     );
//   } catch (error) {
//     logger.error(`❌ Error occurred while processing upload: ${error.message}`);
//   }
// };
// const uploadHLSToS3 = async (movieId, hlsDirectory) => {
//   try {
//     const files = fs.readdirSync(hlsDirectory);

//     for (const file of files) {
//       const filePath = path.join(hlsDirectory, file);
//       const fileStream = fs.createReadStream(filePath);
//       const fileSize = fs.statSync(filePath).size;

//       const params = {
//         Bucket: process.env.AWS_S3_BUCKET_NAME,
//         Key: `movies/${movieId}/processed/${file}`, // Ensure file is uploaded with the correct name
//         Body: fileStream,
//         ContentType: file.endsWith(".m3u8")
//           ? "application/vnd.apple.mpegurl"
//           : "video/MP2T",
//         ContentLength: fileSize,
//       };

//       logger.info(`Uploading To AWS S3: ${file}`);

//       try {
//         const upload = new Upload({ client: s3, params });
//         await upload.done();
//         logger.info(`✅ Uploaded: ${file}`);
//       } catch (uploadError) {
//         logger.error(`❌ Failed to upload ${file}: ${uploadError.message}`);
//       }
//     }

//     logger.info(
//       `✅ All HLS files uploaded successfully for movieId: ${movieId}`
//     );
//   } catch (error) {
//     logger.error(`❌ Error occurred while processing upload: ${error.message}`);
//   }
// };

module.exports = {
  downloadRawFile,
  normalizeToMP4,
  transcodeToHLS,
  requestDRMKeys,
  encryptHLSSegments,
  uploadHLSToS3,
};
