const mongoose = require("mongoose");

const episodeSchema = new mongoose.Schema(
  {
    title: { type: String },
    description: { type: String },
    episodeNumber: { type: Number },
    releaseDate: { type: Date },
    publishDate: { type: Date },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video" },
    seasonId: { type: mongoose.Schema.Types.ObjectId, ref: "Season" },
    tvSeriesId: { type: mongoose.Schema.Types.ObjectId, ref: "TVSeries" },
    status: { type: mongoose.Schema.Types.ObjectId, ref: "Status" },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

episodeSchema.index({ episodeNumber: 1, season: 1 }, { unique: true }); // Ensure no duplicate episode numbers within the same season

const Episode = mongoose.model("Episode", episodeSchema);
module.exports = Episode;
