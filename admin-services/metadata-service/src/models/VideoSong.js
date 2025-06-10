const mongoose = require("mongoose");

const videoSongSchema = new mongoose.Schema(
  {
    title: { type: String },
    description: { type: String },
    duration: { type: Number },
    releaseDate: { type: Date },
    publishDate: { type: Date },
    genre: { type: mongoose.Schema.Types.ObjectId, ref: "Genre" },
    castDetails: { type: mongoose.Schema.Types.ObjectId, ref: "Cast" },
    posterId: { type: mongoose.Schema.Types.ObjectId, ref: "Poster" },
    bannerId: { type: mongoose.Schema.Types.ObjectId, ref: "Banner" },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video" },
    status: {
      type: String,
      enum: ["active", "inactive", "draft", "scheduled"], //Set by Admin Dashboard
      default: "draft",
    },
    createdAt: { type: Date, default: Date.now },
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
