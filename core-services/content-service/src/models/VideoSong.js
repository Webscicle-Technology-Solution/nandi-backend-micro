const mongoose = require("mongoose");

const videoSongSchema = new mongoose.Schema(
  {
    videoSongId: { type: String, unique: true },
    title: { type: String },
    description: { type: String },
    releaseDate: { type: Date },
    publishDate: { type: Date },
    genre: { type: mongoose.Schema.Types.ObjectId, ref: "Genre" },
    castDetails: { type: mongoose.Schema.Types.ObjectId, ref: "Cast" },
    posterId: { type: mongoose.Schema.Types.ObjectId, ref: "Poster" },
    bannerId: { type: mongoose.Schema.Types.ObjectId, ref: "Banner" },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video" },
  },
  {
    timestamps: true,
  }
);

// Index
videoSongSchema.index({ title: "text" });
videoSongSchema.index({ description: "text" });

const VideoSong = mongoose.model("VideoSong", videoSongSchema);
module.exports = VideoSong;
