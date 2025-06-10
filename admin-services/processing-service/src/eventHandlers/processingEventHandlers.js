const { logger } = require("../utils/logger");
const {
  downloadRawFile,
  normalizeToMP4,
  transcodeToHLS,
  requestDRMKeys,
  encryptHLSSegments,
  uploadHLSToS3,
} = require("../services/processingService");
const path = require("path");
const axios = require("axios");
const ffmpeg = require("fluent-ffmpeg");
const { publishEvent } = require("../utils/rabbitmq");

const handleNewMovieUpload = async (event) => {
  logger.info("Processing new upload event...");
  const { mediaId, rawFileUrl } = event;
  const movieId = mediaId;

  try {
    // 1️⃣ Download Raw File
    const downloadDirectory = path.join(
      __dirname,
      `../downloads/movies/${movieId}`
    );
    const downloadResult = await downloadRawFile(
      movieId,
      rawFileUrl,
      downloadDirectory
    );

    if (downloadResult.status != "success") {
      throw new Error(downloadResult.message);
    }

    logger.info(
      `Download completed successfully. File saved to: ${downloadResult.filePath}`
    );

    // 2️⃣ Normalize to MP4
    const normalizedResult = await normalizeToMP4(
      movieId,
      downloadResult.filePath
    );
    logger.info(
      `Normalization completed successfully. File saved to: ${normalizedResult.filePath}`
    );

    const totalLength = await getMovieDuration(normalizedResult.filePath);

    await publishEvent("contentDuration.updated", {
      movieId: movieId.toString(),
      totalLength,
      contentType: "movie",
    });

    // 3️⃣ Transcode to HLS
    const hlsResult = await transcodeToHLS(movieId, normalizedResult.filePath);
    if (hlsResult.status !== "success") {
      throw new Error(hlsResult.message);
    }
    logger.info(`HLS transcoding completed: ${hlsResult.masterPlaylistUrl}`);

    // 4️⃣ Request DRM Keys for Each Segment
    const totalSegments = hlsResult.totalSegments;
    const apiUrl = `${process.env.API_GATEWAY_URL}/v1/drm/storeKeys`;
    console.log(`API Url : ${apiUrl}`);
    console.log(`movieId : ${movieId}, totalSegments : ${totalSegments}`);
    const drmKeyResponse = await axios.post(`${apiUrl}`, {
      movieId,
      totalSegments,
    });

    // ✅ Extract the array directly from the response
    const drmKeyList = drmKeyResponse.data.drmKeyList;

    if (!Array.isArray(drmKeyList) || drmKeyList.length === 0) {
      throw new Error("❌ Failed to generate DRM keys or invalid format.");
    }

    logger.info("✅ DRM keys received:", drmKeyList);

    // 5️⃣ Encrypt Each HLS Segment
    const encryptedHLSResult = await encryptHLSSegments(
      movieId,
      hlsResult.hlsDirectory,
      drmKeyList
    );
    logger.info(`HLS encryption completed.`);

    // 6️⃣ Upload Encrypted HLS to S3
    await uploadHLSToS3({
      movieId,
      hlsDirectory: encryptedHLSResult.hlsDirectory,
      drmKeyList,
    });
    logger.info(`Encrypted HLS uploaded to S3.`);
  } catch (error) {
    logger.error(`Error occurred while processing new upload event. ${error}`);
  }
};

const handleNewDocumentaryUpload = async (event) => {
  logger.info("Processing new upload event...");
  const { mediaId, rawFileUrl } = event;
  const documentaryId = mediaId;
  const movieId = mediaId;

  try {
    // 1️⃣ Download Raw File
    const downloadDirectory = path.join(
      __dirname,
      `../downloads/documentaries/${documentaryId}`
    );
    const downloadResult = await downloadRawFile(
      movieId,
      rawFileUrl,
      downloadDirectory
    );

    if (downloadResult.status != "success") {
      throw new Error(downloadResult.message);
    }

    logger.info(
      `Download completed successfully. File saved to: ${downloadResult.filePath}`
    );

    // 2️⃣ Normalize to MP4
    const normalizedResult = await normalizeToMP4(
      movieId,
      downloadResult.filePath
    );
    logger.info(
      `Normalization completed successfully. File saved to: ${normalizedResult.filePath}`
    );

    const totalLength = await getMovieDuration(normalizedResult.filePath);

    await publishEvent("contentDuration.updated", {
      movieId: movieId.toString(),
      totalLength,
      contentType: "documentary",
    });

    // 3️⃣ Transcode to HLS
    const hlsResult = await transcodeToHLS(movieId, normalizedResult.filePath);
    if (hlsResult.status !== "success") {
      throw new Error(hlsResult.message);
    }
    logger.info(`HLS transcoding completed: ${hlsResult.masterPlaylistUrl}`);

    // 4️⃣ Request DRM Keys for Each Segment
    const totalSegments = hlsResult.totalSegments;
    const apiUrl = `${process.env.API_GATEWAY_URL}/v1/drm/storeKeys`;
    console.log(`API Url : ${apiUrl}`);
    console.log(`documentaryId : ${movieId}, totalSegments : ${totalSegments}`);
    const drmKeyResponse = await axios.post(`${apiUrl}`, {
      documentaryId,
      totalSegments,
    });

    // ✅ Extract the array directly from the response
    const drmKeyList = drmKeyResponse.data.drmKeyList;

    if (!Array.isArray(drmKeyList) || drmKeyList.length === 0) {
      throw new Error("❌ Failed to generate DRM keys or invalid format.");
    }

    logger.info("✅ DRM keys received:", drmKeyList);
    logger.info(`hlsResult.hlsDirectory : ${hlsResult.hlsDirectory}`);

    // 5️⃣ Encrypt Each HLS Segment
    const encryptedHLSResult = await encryptHLSSegments(
      movieId,
      hlsResult.hlsDirectory,
      drmKeyList
    );

    logger.info(`HLS encryption completed.`);
    logger.info(`Encrypted HLS Result: ${encryptedHLSResult.hlsDirectory}`);

    // 6️⃣ Upload Encrypted HLS to S3
    await uploadHLSToS3({
      documentaryId,
      hlsDirectory: encryptedHLSResult.hlsDirectory,
      drmKeyList,
    });
    logger.info(`Encrypted HLS uploaded to S3.`);
  } catch (error) {
    logger.error(`Error occurred while processing new upload event. ${error}`);
  }
};

const handleNewVideoSongUpload = async (event) => {
  logger.info("Processing new upload event...");
  const { mediaId, rawFileUrl } = event;
  const videoSongId = mediaId;
  const movieId = mediaId;

  try {
    // 1️⃣ Download Raw File
    const downloadDirectory = path.join(
      __dirname,
      `../downloads/videosongs/${videoSongId}`
    );
    const downloadResult = await downloadRawFile(
      movieId,
      rawFileUrl,
      downloadDirectory
    );

    if (downloadResult.status != "success") {
      throw new Error(downloadResult.message);
    }

    logger.info(
      `Download completed successfully. File saved to: ${downloadResult.filePath}`
    );

    // 2️⃣ Normalize to MP4
    const normalizedResult = await normalizeToMP4(
      movieId,
      downloadResult.filePath
    );
    logger.info(
      `Normalization completed successfully. File saved to: ${normalizedResult.filePath}`
    );

    const totalLength = await getMovieDuration(normalizedResult.filePath);

    await publishEvent("contentDuration.updated", {
      movieId: movieId.toString(),
      totalLength,
      contentType: "videosong",
    });

    // 3️⃣ Transcode to HLS
    const hlsResult = await transcodeToHLS(movieId, normalizedResult.filePath);
    if (hlsResult.status !== "success") {
      throw new Error(hlsResult.message);
    }
    logger.info(`HLS transcoding completed: ${hlsResult.masterPlaylistUrl}`);

    // 4️⃣ Request DRM Keys for Each Segment
    const totalSegments = hlsResult.totalSegments;
    const apiUrl = `${process.env.API_GATEWAY_URL}/v1/drm/storeKeys`;
    console.log(`API Url : ${apiUrl}`);
    console.log(`documentaryId : ${movieId}, totalSegments : ${totalSegments}`);
    const drmKeyResponse = await axios.post(`${apiUrl}`, {
      videoSongId,
      totalSegments,
    });

    // ✅ Extract the array directly from the response
    const drmKeyList = drmKeyResponse.data.drmKeyList;

    if (!Array.isArray(drmKeyList) || drmKeyList.length === 0) {
      throw new Error("❌ Failed to generate DRM keys or invalid format.");
    }

    logger.info("✅ DRM keys received:", drmKeyList);
    logger.info(`hlsResult.hlsDirectory : ${hlsResult.hlsDirectory}`);

    // 5️⃣ Encrypt Each HLS Segment
    const encryptedHLSResult = await encryptHLSSegments(
      movieId,
      hlsResult.hlsDirectory,
      drmKeyList
    );

    logger.info(`HLS encryption completed.`);
    logger.info(`Encrypted HLS Result: ${encryptedHLSResult.hlsDirectory}`);

    // 6️⃣ Upload Encrypted HLS to S3
    await uploadHLSToS3({
      videoSongId,
      hlsDirectory: encryptedHLSResult.hlsDirectory,
      drmKeyList,
    });
    logger.info(`Encrypted HLS uploaded to S3.`);
  } catch (error) {
    logger.error(`Error occurred while processing new upload event. ${error}`);
  }
};

const handleNewShortFilmUpload = async (event) => {
  logger.info("Processing new upload event...");
  const { mediaId, rawFileUrl } = event;
  const shortFilmId = mediaId;
  const movieId = mediaId;

  try {
    // 1️⃣ Download Raw File
    const downloadDirectory = path.join(
      __dirname,
      `../downloads/shortfilms/${shortFilmId}`
    );
    const downloadResult = await downloadRawFile(
      movieId,
      rawFileUrl,
      downloadDirectory
    );

    if (downloadResult.status != "success") {
      throw new Error(downloadResult.message);
    }

    logger.info(
      `Download completed successfully. File saved to: ${downloadResult.filePath}`
    );

    // 2️⃣ Normalize to MP4
    const normalizedResult = await normalizeToMP4(
      movieId,
      downloadResult.filePath
    );
    logger.info(
      `Normalization completed successfully. File saved to: ${normalizedResult.filePath}`
    );

    const totalLength = await getMovieDuration(normalizedResult.filePath);

    await publishEvent("contentDuration.updated", {
      movieId: movieId.toString(),
      totalLength,
      contentType: "shortfilm",
    });

    // 3️⃣ Transcode to HLS
    const hlsResult = await transcodeToHLS(movieId, normalizedResult.filePath);
    if (hlsResult.status !== "success") {
      throw new Error(hlsResult.message);
    }
    logger.info(`HLS transcoding completed: ${hlsResult.masterPlaylistUrl}`);

    // 4️⃣ Request DRM Keys for Each Segment
    const totalSegments = hlsResult.totalSegments;
    const apiUrl = `${process.env.API_GATEWAY_URL}/v1/drm/storeKeys`;
    console.log(`API Url : ${apiUrl}`);
    console.log(`Shortfilm Id : ${movieId}, totalSegments : ${totalSegments}`);
    const drmKeyResponse = await axios.post(`${apiUrl}`, {
      shortFilmId,
      totalSegments,
    });

    // ✅ Extract the array directly from the response
    const drmKeyList = drmKeyResponse.data.drmKeyList;

    if (!Array.isArray(drmKeyList) || drmKeyList.length === 0) {
      throw new Error("❌ Failed to generate DRM keys or invalid format.");
    }

    logger.info("✅ DRM keys received:", drmKeyList);
    logger.info(`hlsResult.hlsDirectory : ${hlsResult.hlsDirectory}`);

    // 5️⃣ Encrypt Each HLS Segment
    const encryptedHLSResult = await encryptHLSSegments(
      movieId,
      hlsResult.hlsDirectory,
      drmKeyList
    );

    logger.info(`HLS encryption completed.`);
    logger.info(`Encrypted HLS Result: ${encryptedHLSResult.hlsDirectory}`);

    // 6️⃣ Upload Encrypted HLS to S3
    await uploadHLSToS3({
      shortFilmId,
      hlsDirectory: encryptedHLSResult.hlsDirectory,
      drmKeyList,
    });
    logger.info(`Encrypted HLS uploaded to S3.`);
  } catch (error) {
    logger.error(`Error occurred while processing new upload event. ${error}`);
  }
};

const handleEpisodeUpload = async (event) => {
  logger.info("Processing new upload event...");
  const { mediaId, rawFileUrl } = event;
  const episodeId = mediaId;
  const movieId = mediaId;

  try {
    // 1️⃣ Download Raw File
    const downloadDirectory = path.join(
      __dirname,
      `../downloads/episodes/${episodeId}`
    );
    const downloadResult = await downloadRawFile(
      movieId,
      rawFileUrl,
      downloadDirectory
    );

    if (downloadResult.status != "success") {
      throw new Error(downloadResult.message);
    }

    logger.info(
      `Download completed successfully. File saved to: ${downloadResult.filePath}`
    );

    // 2️⃣ Normalize to MP4
    const normalizedResult = await normalizeToMP4(
      movieId,
      downloadResult.filePath
    );
    logger.info(
      `Normalization completed successfully. File saved to: ${normalizedResult.filePath}`
    );

    const totalLength = await getMovieDuration(normalizedResult.filePath);

    await publishEvent("contentDuration.updated", {
      movieId: movieId.toString(),
      totalLength,
      contentType: "episode",
    });

    // 3️⃣ Transcode to HLS
    const hlsResult = await transcodeToHLS(movieId, normalizedResult.filePath);
    if (hlsResult.status !== "success") {
      throw new Error(hlsResult.message);
    }
    logger.info(`HLS transcoding completed: ${hlsResult.masterPlaylistUrl}`);

    // 4️⃣ Request DRM Keys for Each Segment
    const totalSegments = hlsResult.totalSegments;
    const apiUrl = `${process.env.API_GATEWAY_URL}/v1/drm/storeKeys`;
    console.log(`API Url : ${apiUrl}`);
    console.log(`episodeId Id : ${movieId}, totalSegments : ${totalSegments}`);
    const drmKeyResponse = await axios.post(`${apiUrl}`, {
      episodeId,
      totalSegments,
    });

    // ✅ Extract the array directly from the response
    const drmKeyList = drmKeyResponse.data.drmKeyList;

    if (!Array.isArray(drmKeyList) || drmKeyList.length === 0) {
      throw new Error("❌ Failed to generate DRM keys or invalid format.");
    }

    logger.info("✅ DRM keys received:", drmKeyList);
    logger.info(`hlsResult.hlsDirectory : ${hlsResult.hlsDirectory}`);

    // 5️⃣ Encrypt Each HLS Segment
    const encryptedHLSResult = await encryptHLSSegments(
      movieId,
      hlsResult.hlsDirectory,
      drmKeyList
    );

    logger.info(`HLS encryption completed.`);
    logger.info(`Encrypted HLS Result: ${encryptedHLSResult.hlsDirectory}`);

    // 6️⃣ Upload Encrypted HLS to S3
    await uploadHLSToS3({
      episodeId,
      hlsDirectory: encryptedHLSResult.hlsDirectory,
      drmKeyList,
    });
    logger.info(`Encrypted HLS uploaded to S3.`);
  } catch (error) {
    logger.error(`Error occurred while processing new upload event. ${error}`);
  }
};

const handleNewTrailerPreviewUpload = async (event) => {
  logger.info("Processing new upload event...");
  const { mediaId, mediaType, videoType, rawFileUrl } = event;
  let movieId = null;
  let shortFilmId = null;
  let videoSongId = null;
  let documentaryId = null;

  if (mediaType == "movies") {
    movieId = mediaId;
  } else if (mediaType == "shortfilms") {
    shortFilmId = mediaId;
  } else if (mediaType == "videosongs") {
    videoSongId = mediaId;
  } else if (mediaType == "documentaries") {
    documentaryId = mediaId;
  }

  try {
    // 1️⃣ Download Raw File
    const downloadDirectory = path.join(
      __dirname,
      `../downloads/${mediaType}/${mediaId}/${videoType}`
    );
    const downloadResult = await downloadRawFile(
      mediaId,
      rawFileUrl,
      downloadDirectory
    );

    if (downloadResult.status != "success") {
      throw new Error(downloadResult.message);
    }

    logger.info(
      `Download completed successfully. File saved to: ${downloadResult.filePath}`
    );

    // 2️⃣ Normalize to MP4
    const normalizedResult = await normalizeToMP4(
      mediaId,
      downloadResult.filePath
    );
    logger.info(
      `Normalization completed successfully. File saved to: ${normalizedResult.filePath}`
    );

    // 3️⃣ Transcode to HLS
    const hlsResult = await transcodeToHLS(mediaId, normalizedResult.filePath);
    if (hlsResult.status !== "success") {
      throw new Error(hlsResult.message);
    }
    logger.info(`HLS transcoding completed: ${hlsResult.masterPlaylistUrl}`);

    // 4️⃣ Request DRM Keys for Each Segment
    const totalSegments = hlsResult.totalSegments;
    const apiUrl = `${process.env.API_GATEWAY_URL}/v1/drm/storeKeysTP`;
    console.log(`API Url : ${apiUrl}`);
    console.log(`Media Id : ${mediaId}, totalSegments : ${totalSegments}`);
    const drmKeyResponse = await axios.post(`${apiUrl}`, {
      eventMediaId: mediaId,
      eventMediaType: mediaType,
      totalSegments,
    });

    // ✅ Extract the array directly from the response
    const drmKeyList = drmKeyResponse.data.drmKeyList;

    if (!Array.isArray(drmKeyList) || drmKeyList.length === 0) {
      throw new Error("❌ Failed to generate DRM keys or invalid format.");
    }

    logger.info("✅ DRM keys received:", drmKeyList);
    logger.info(`hlsResult.hlsDirectory : ${hlsResult.hlsDirectory}`);

    // 5️⃣ Encrypt Each HLS Segment
    const encryptedHLSResult = await encryptHLSSegments(
      movieId,
      hlsResult.hlsDirectory,
      drmKeyList
    );

    logger.info(`HLS encryption completed.`);
    logger.info(`Encrypted HLS Result: ${encryptedHLSResult.hlsDirectory}`);

    // 6️⃣ Upload Encrypted HLS to S3
    await uploadHLSToS3({
      movieId: movieId,
      shortFilmId: shortFilmId,
      videoSongId: videoSongId,
      documentaryId: documentaryId,
      hlsDirectory: encryptedHLSResult.hlsDirectory,
      key: `${mediaType}/${mediaId}/${videoType}/processed/`,
      drmKeyList,
    });
    logger.info(`Encrypted HLS uploaded to S3.`);
  } catch (error) {
    logger.error(`Error occurred while processing new upload event. ${error}`);
  }
};

// Function to calculate the duration of a video file using ffmpeg
const getMovieDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        return reject(new Error("Failed to get video duration"));
      }
      const durationInSeconds = metadata.format.duration;
      resolve(durationInSeconds);
    });
  });
};

module.exports = {
  handleNewMovieUpload,
  handleNewDocumentaryUpload,
  handleNewVideoSongUpload,
  handleNewShortFilmUpload,
  handleNewTrailerPreviewUpload,
  handleEpisodeUpload,
};
