const mongoose = require("mongoose");

const mediaStatusSchema = new mongoose.Schema(
  {
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      unique: true,
    },
    episodeId: {
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

    uploadStatus: {
      type: String,
      enum: ["uploading", "uploaded", "processing", "failed", "completed"],
      default: "uploading",
    },
    resolutionsAvailable: {
      type: [String], //1080p, 720p, 480p
    },
    drmApplied: {
      type: Boolean,
      default: true,
    },
    masterPlaylistUrl: {
      type: String, // HLS Master Playlist URL
    },
    segmentBasePath: {
      type: String, // Base S3 Path for HLS Segments
    },
    rawFileUrl: {
      type: String, // Raw File URL
    },
    errorDetails: {
      type: String, // Stores error details if processing fails
    },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

const Video = mongoose.model("Video", mediaStatusSchema);
module.exports = Video;
