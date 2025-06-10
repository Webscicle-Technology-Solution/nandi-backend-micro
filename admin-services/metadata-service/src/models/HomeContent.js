const mongoose = require("mongoose");

const homeContentSchema = new mongoose.Schema(
  {
    contentType: {
      type: String,
      required: true,
      enum: ["Movie", "TVSeries", "ShortFilm", "Documentary", "VideoSong"],
      unique: true,
    },
    isLatestVisible: {
      type: Boolean,
      required: true,
    },
    isTrendingVisible: {
      type: Boolean,
      required: true,
    },
    isHistoryVisible: {
      type: Boolean,
      required: true,
    },
    isFavoritesVisible: {
      type: Boolean,
      required: true,
    },
    isCategoriesVisible: {
      type: Boolean,
      default: false,
    },
    // categories: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

const HomeContent = mongoose.model("HomeContent", homeContentSchema);
module.exports = HomeContent;
