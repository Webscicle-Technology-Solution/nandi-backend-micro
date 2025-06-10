const {
  generateDRMKeysForMovie,
  getEncryptedKeyForUser,
} = require("../services/keyService");

const { logger } = require("../utils/logger");
const path = require("path");
const fs = require("fs");
const DRMKey = require("../models/DRMKeys");
const crypto = require("crypto");

const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

// Initialize AWS S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
//sent by processing service
const storeKeysForMovie = async (req, res) => {
  logger.info("storeKeysForMovie Endpoint Hit...");
  try {
    const {
      movieId,
      tvSeriesId,
      episodeId,
      documentaryId,
      shortFilmId,
      videoSongId,
      videoType,
      videoId,
      eventMediaId,
      eventMediaType,
      totalSegments,
    } = req.body;

    let mediaType = null;
    let mediaId = null;
    if (movieId) {
      mediaType = "movieId";
      mediaId = movieId;
    } else if (tvSeriesId) {
      mediaType = "tvSeriesId";
      mediaId = tvSeriesId;
    } else if (episodeId) {
      mediaType = "episodeId";
      mediaId = episodeId;
    } else if (documentaryId) {
      mediaType = "documentaryId";
      mediaId = documentaryId;
    } else if (shortFilmId) {
      mediaType = "shortFilmId";
      mediaId = shortFilmId;
    } else if (videoSongId) {
      mediaType = "videoSongId";
      mediaId = videoSongId;
    } else if (eventMediaId) {
      mediaType = eventMediaType;
      mediaId = eventMediaId;
    }
    if (!mediaType || !totalSegments) {
      logger.error("❌ Media ID & totalSegments required");
      return res
        .status(400)
        .json({ error: "❌ Media ID & totalSegments required" });
    }

    const drmKeyList = [];

    for (let i = 0; i < totalSegments; i++) {
      const keyId = crypto.randomUUID();
      const encryptionKey = crypto.randomBytes(16).toString("hex");
      const iv = crypto.randomBytes(16).toString("hex");

      await DRMKey.create({
        mediaType: mediaId,
        segmentIndex: i,
        keyId,
        encryptionKey,
        iv,
      });

      drmKeyList.push({ keyId, encryptionKey, iv }); // ✅ Store actual encryption key & IV
    }

    logger.info(
      `✅ DRM Keys generated for ${movieId}:`,
      JSON.stringify(drmKeyList, null, 2)
    );

    res.status(201).json({ drmKeyList }); // ✅ Send encryptionKey & IV directly
  } catch (error) {
    logger.error("❌ [storeKeysForMovie] Error Occurred", error);
    res.status(500).json({ error: error.message });
  }
};

const storeKeysForTrailerPreview = async (req, res) => {
  logger.info("storeKeysForTrailerPreview Endpoint Hit...");
  try {
    const { videoType, videoId, eventMediaId, eventMediaType, totalSegments } =
      req.body;

    let mediaType = null;
    let mediaId = eventMediaId;
    let eventVideoType = videoType === "trailer" ? "trailerId" : "previewId";

    // Set mediaType dynamically based on eventMediaType
    if (eventMediaType == "movies") {
      mediaType = "movieId";
    } else if (eventMediaType == "shortfilms") {
      mediaType = "shortFilmId";
    } else if (eventMediaType == "videosongs") {
      mediaType = "videoSongId";
    } else if (eventMediaType == "documentaries") {
      mediaType = "documentaryId";
    } else if (eventMediaType == "tvseries") {
      mediaType = "tvSeriesId";
    }

    // Validate required fields
    if (!eventMediaType || !totalSegments) {
      logger.error("❌ Media ID & totalSegments required");
      return res
        .status(400)
        .json({ error: "❌ Media ID & totalSegments required" });
    }

    const drmKeyList = [];

    // Iterate over total segments to generate keys
    for (let i = 0; i < totalSegments; i++) {
      const keyId = crypto.randomUUID();
      const encryptionKey = crypto.randomBytes(16).toString("hex");
      const iv = crypto.randomBytes(16).toString("hex");

      // Dynamically create the object to insert the correct field based on mediaType
      const drmKeyData = {
        [mediaType]: mediaId, // Dynamically set the correct field (e.g., movieId)
        videoType: eventVideoType,
        segmentIndex: i,
        keyId,
        encryptionKey,
        iv,
      };

      // Create the record in DB
      await DRMKey.create(drmKeyData);

      // Push the key data to the list
      drmKeyList.push({ keyId, encryptionKey, iv });
    }

    logger.info(
      `✅ DRM Keys generated for ${mediaId}:`,
      JSON.stringify(drmKeyList, null, 2)
    );

    res.status(201).json({ drmKeyList });
  } catch (error) {
    logger.error("❌ [storeKeysForMovie] Error Occurred", error);
    res.status(500).json({ error: error.message });
  }
};

// 🔑 **User Requests DRM Key for a Video Segment**
const getSegmentKey = async (req, res) => {
  try {
    const { keyId } = req.query;
    logger.info(`[getSegmentKey] Endpoint Hit... keyId: ${keyId}`);

    if (!keyId) {
      return res.status(400).json({ error: "Missing keyId" });
    }

    const drmKey = await DRMKey.findOne({ keyId });

    if (!drmKey) {
      return res.status(404).json({ error: "DRM key not found" });
    }

    logger.info(`✅ DRM key found! Returning key for keyId: ${keyId}`);

    // 🔹 Convert HEX key to raw binary before sending
    const rawKeyBuffer = Buffer.from(drmKey.encryptionKey, "hex");

    // ✅ Send raw binary key directly (Content-Type must be set)
    res.setHeader("Content-Type", "application/octet-stream");
    res.send(rawKeyBuffer);
  } catch (error) {
    logger.error("[getSegmentKey] ❌ Error Occurred", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 📌 Fetch `master.m3u8` from S3// Replace relative URLs in `master.m3u8` with absolute URLs
const getMasterPlaylist = async (req, res) => {
  try {
    const movieId = req.params.movieId;
    const mediaType = req.params.mediaType;
    const s3Key = `${mediaType}/${movieId}/processed/master.m3u8`; // No change needed here

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
    });

    const s3Response = await s3.send(command);
    let playlistContent = await s3Response.Body.transformToString("utf-8");

    // ✅ Convert relative playlist URLs to absolute URLs
    // Now there's no "encrypted_" prefix in the playlist file names
    playlistContent = playlistContent.replace(
      /(\d+p\.m3u8)/g, // Match resolution-based filenames (e.g., 1080p.m3u8)
      (match, p1) => {
        // Construct the URL for each resolution (e.g., 1080p.m3u8 becomes the correct API route)
        return `${process.env.API_GATEWAY_URL}/v1/drm/getplaylist/${mediaType}/${movieId}/${p1}`;
      }
    );

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.send(playlistContent); // Send the updated playlist
  } catch (error) {
    logger.error("❌ Error fetching master.m3u8 from S3:", error);
    res.status(500).json({ error: "Failed to retrieve master.m3u8" });
  }
};

const getMasterPlaylistTrailerPreview = async (req, res) => {
  try {
    const mediaId = req.params.mediaId;
    const mediaType = req.params.mediaType;
    const videoType = req.params.videoType;
    const s3Key = `${mediaType}/${mediaId}/${videoType}/processed/master.m3u8`; // No change needed here

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
    });

    const s3Response = await s3.send(command);
    let playlistContent = await s3Response.Body.transformToString("utf-8");

    // ✅ Convert relative playlist URLs to absolute URLs
    // Now there's no "encrypted_" prefix in the playlist file names
    playlistContent = playlistContent.replace(
      /(\d+p\.m3u8)/g, // Match resolution-based filenames (e.g., 1080p.m3u8)
      (match, p1) => {
        // Construct the URL for each resolution (e.g., 1080p.m3u8 becomes the correct API route)
        return `${process.env.API_GATEWAY_URL}/v1/drm/getplaylist/${mediaType}/${mediaId}/${videoType}/${p1}`;
      }
    );

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.send(playlistContent); // Send the updated playlist
  } catch (error) {
    logger.error("❌ Error fetching master.m3u8 from S3:", error);
    res.status(500).json({ error: "Failed to retrieve master.m3u8" });
  }
};

// Serve resolution-specific playlists from S3 (e.g., 1080p.m3u8, etc.)
const getResolutionPlaylist = async (req, res) => {
  logger.info(`[getResolutionPlaylist] Endpoint Hit...`);
  try {
    const { movieId, mediaType } = req.params;
    const resolution = req.params.resolution; // e.g., "1080p.m3u8" instead of "encrypted_1080p.m3u8"
    const s3Key = `${mediaType}/${movieId}/processed/${resolution}`; // No "encrypted_" prefix in the key

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
    });

    const s3Response = await s3.send(command);

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Content-Disposition", "inline"); // Prevent download
    s3Response.Body.pipe(res);
  } catch (error) {
    logger.error(`Error fetching ${req.params.resolution} from S3:`, error);
    res.status(500).json({ error: "Failed to retrieve playlist" });
  }
};

const getResolutionPlaylistTrailerPreview = async (req, res) => {
  try {
    const { movieId, mediaType, videoType } = req.params;
    const resolution = req.params.resolution; // e.g., "1080p.m3u8" instead of "encrypted_1080p.m3u8"
    const s3Key = `${mediaType}/${movieId}/${videoType}/processed/${resolution}`; // No "encrypted_" prefix in the key

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
    });

    const s3Response = await s3.send(command);

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Content-Disposition", "inline"); // Prevent download
    s3Response.Body.pipe(res);
  } catch (error) {
    logger.error(`Error fetching ${req.params.resolution} from S3:`, error);
    res.status(500).json({ error: "Failed to retrieve playlist" });
  }
};

module.exports = {
  storeKeysForMovie,
  getSegmentKey,
  getMasterPlaylist,
  getResolutionPlaylist,
  storeKeysForTrailerPreview,
  getMasterPlaylistTrailerPreview,
  getResolutionPlaylistTrailerPreview,
};
