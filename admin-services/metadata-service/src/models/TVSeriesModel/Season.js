const mongoose = require("mongoose");

const seasonSchema = new mongoose.Schema(
  {
    seasonNumber: { type: Number, required: true },
    releaseDate: { type: Date },
    publishDate: { type: Date },
    tvSeriesId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TVSeries",
      required: true,
    },
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

const Season = mongoose.model("Season", seasonSchema);
module.exports = Season;
