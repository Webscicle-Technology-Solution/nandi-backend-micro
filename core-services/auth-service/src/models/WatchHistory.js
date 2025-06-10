const mongoose = require("mongoose");

const watchHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    contentType: {
      type: String,
      required: true,
      enum: ["Movie", "TVSeries", "ShortFilm", "Documentary", "VideoSong"],
    },
    contentId: { type: mongoose.Schema.Types.ObjectId, refPath: "contentType" },
    tvSeriesId: { type: mongoose.Schema.Types.ObjectId, ref: "TVSeries" },
    watchTime: { type: Number, required: true }, //Last watched time in seconds
    isCompleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const WatchHistory = mongoose.model("WatchHistory", watchHistorySchema);

module.exports = WatchHistory;
