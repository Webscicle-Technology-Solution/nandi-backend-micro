const capitalizeFirst = (str) => {
  str = str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  return str;
};

const capitalizeName = (name) => {
  if (typeof name !== "string" || name.trim() === "") return name;
  return name
    .split(" ") // Split by spaces
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize each word
    .join(" "); // Join back to a string
};

// Utility function to capitalize cast-related fields
const capitalizeCastDetails = (castDetails) => {
  if (!castDetails) return castDetails;

  // Capitalize the names in the cast details if they are present
  if (castDetails.actors) {
    castDetails.actors = castDetails.actors.map(capitalizeName);
  }
  if (castDetails.producers) {
    castDetails.producers = castDetails.producers.map(capitalizeName);
  }
  if (castDetails.directors) {
    castDetails.directors = castDetails.directors.map(capitalizeName);
  }
  if (castDetails.singers) {
    castDetails.singers = castDetails.singers.map(capitalizeName);
  }
  if (castDetails.writers) {
    castDetails.writers = castDetails.writers.map(capitalizeName);
  }
  if (castDetails.composers) {
    castDetails.composers = castDetails.composers.map(capitalizeName);
  }

  return castDetails;
};

const convertContentType = (contentType) => {
  switch (contentType) {
    case "movie":
      return "Movie";
    case "tvseries":
      return "TVSeries";
    case "shortfilm":
      return "ShortFilm";
    case "documentary":
      return "Documentary";
    case "videosong":
      return "VideoSong";
    default:
      return false;
  }
};

module.exports = {
  capitalizeFirst,
  capitalizeName,
  capitalizeCastDetails,
  convertContentType,
};
