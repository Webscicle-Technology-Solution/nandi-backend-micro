const mongoose = require("mongoose");

const episodeSchema = new mongoose.Schema(
  {
    title: { type: String },
    description: { type: String },
    episodeNumber: { type: Number },
    duration: { type: Number },
    releaseDate: { type: Date },
    publishDate: { type: Date },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video" },
    seasonId: { type: mongoose.Schema.Types.ObjectId, ref: "Season" },
    tvSeriesId: { type: mongoose.Schema.Types.ObjectId, ref: "TVSeries" },
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

const Episode = mongoose.model("Episode", episodeSchema);
module.exports = Episode;
