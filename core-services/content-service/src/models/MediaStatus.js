const mongoose = require("mongoose");

const mediaStatusSchema = new mongoose.Schema(
  {
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      unique: true,
    },
    tvSeriesId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TVSeries",
      unique: true,
    },
    documentaryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Documentary",
      unique: true,
    },
    shortFilmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShortFilm",
      unique: true,
    },
    videoSongId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VideoSong",
      unique: true,
    },
    mediaStatus: {
      type: String,
      enum: ["active", "inactive", "draft"],
      default: "inactive",
    },
    isUploadCompleted: { type: Boolean, default: false },
    isProcessingComplete: { type: Boolean, default: false },
    isDRMComplete: { type: Boolean, default: false },
    isMediaReady: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);
