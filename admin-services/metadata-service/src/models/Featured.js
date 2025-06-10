const mongoose = require("mongoose");

const featuredSchema = new mongoose.Schema(
  {
    contentType: {
      type: String,
      required: true,
      enum: ["Movie", "TVSeries", "ShortFilm", "Documentary", "VideoSong"],
    },
    contentId: { type: mongoose.Schema.Types.ObjectId, refPath: "contentType" },
  },
  {
    timestamps: true,
  }
);

const Featured = mongoose.model("Featured", featuredSchema);
module.exports = Featured;
