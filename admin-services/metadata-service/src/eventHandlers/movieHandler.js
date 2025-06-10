const { logger } = require("../utils/logger");
const Movie = require("../models/Movie");
const Episode = require("../models/TVSeriesModel/Episode");
const VideoSong = require("../models/VideoSong");
const ShortFilm = require("../models/ShortFilm");
const Documentary = require("../models/Documentary");

const handleNewMoviePosterUpload = async (event) => {
  logger.info("Processing new upload event...");
  const { movieId, posterId } = event;

  try {
    if (!movieId || !posterId) {
      logger.warn("Missing movieId or posterId in the request body.");
      // throw error;
      throw new Error("Missing movieId or posterId in the request body.");
    }

    const movie = await Movie.findById(movieId);
    if (movie) {
      movie.posterId = posterId;
      await movie.save();
      logger.info("Movie poster updated successfully.");
    } else {
      logger.warn("Movie not found.");
      // Throw error
      throw new Error("Movie not found.");
    }
    return;
  } catch (error) {
    logger.error(`Error occurred while processing new upload event. ${error}`);
  }
};

const handleNewMovieBannerUpload = async (event) => {
  logger.info("Processing new upload event...");
  const { movieId, bannerId } = event;

  try {
    if (!movieId || !bannerId) {
      logger.warn("Missing movieId or bannerId in the request body.");
      // throw error;
      throw new Error("Missing movieId or bannerId in the request body.");
    }

    const movie = await Movie.findById(movieId);
    if (movie) {
      movie.bannerId = bannerId;
      await movie.save();
      logger.info("Movie banner updated successfully.");
    } else {
      logger.warn("Movie not found.");
      // Throw error
      throw new Error("Movie not found.");
    }
    return;
  } catch (error) {
    logger.error(`Error occurred while processing new upload event. ${error}`);
  }
};

const handleMovieDurationUpdate = async (event) => {
  logger.info("Processing new upload event...");
  try {
    const { movieId, totalLength, contentType } = event;

    if (!movieId || !totalLength || !contentType) {
      logger.warn("Missing movieId or totalLength in the request body.");
      // throw error;
      throw new Error("Missing movieId or totalLength in the request body.");
    }

    if (contentType === "movie") {
      const movie = await Movie.findById(movieId);
      if (movie) {
        movie.duration = totalLength;
        await movie.save();
        logger.info("Movie duration updated successfully.");
      } else {
        logger.warn("Movie not found.");
        // Throw error
        throw new Error("Movie not found.");
      }
    } else if (contentType === "episode") {
      const episode = await Episode.findById(movieId);
      if (episode) {
        episode.duration = totalLength;
        await episode.save();
        logger.info("Episode duration updated successfully.");
      } else {
        logger.warn("Episode not found.");
        // Throw error
        throw new Error("Episode not found.");
      }
    } else if (contentType === "videosong") {
      const videoSong = await VideoSong.findById(movieId);
      if (videoSong) {
        videoSong.duration = totalLength;
        await videoSong.save();
        logger.info("VideoSong duration updated successfully.");
      } else {
        logger.warn("VideoSong not found.");
        // Throw error
        throw new Error("VideoSong not found.");
      }
    } else if (contentType === "shortfilm") {
      const shortFilm = await ShortFilm.findById(movieId);
      if (shortFilm) {
        shortFilm.duration = totalLength;
        await shortFilm.save();
        logger.info("ShortFilm duration updated successfully.");
      } else {
        logger.warn("ShortFilm not found.");
        // Throw error
        throw new Error("ShortFilm not found.");
      }
    } else if (contentType === "documentary") {
      const documentary = await Documentary.findById(movieId);
      if (documentary) {
        documentary.duration = totalLength;
        await documentary.save();
        logger.info("Documentary duration updated successfully.");
      } else {
        logger.warn("Documentary not found.");
        // Throw error
        throw new Error("Documentary not found.");
      }
    }

    return;
  } catch (error) {
    logger.error(`Error occurred while processing new upload event. ${error}`);
    throw error;
  }
};
module.exports = {
  handleNewMoviePosterUpload,
  handleNewMovieBannerUpload,
  handleMovieDurationUpdate,
};
