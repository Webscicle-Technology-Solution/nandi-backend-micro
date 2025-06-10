const { logger } = require("../utils/logger");

const getMediaTypeFromUrl = (url) => {
  if (url.includes("/movies")) return "movies";
  if (url.includes("/shortfilms")) return "shortfilms";
  if (url.includes("/documentaries")) return "documentaries";
  if (url.includes("/tvseries")) return "tvseries";
  if (url.includes("/episodes")) return "episodes";
  if (url.includes("/videosongs")) return "videosongs";
  return null;
};

const getTrailerorPreviewTypeFromUrl = (url) => {
  if (url.includes("/trailer")) return "trailer";
  if (url.includes("/preview")) return "preview";
  return null;
};

module.exports = { getMediaTypeFromUrl, getTrailerorPreviewTypeFromUrl };
