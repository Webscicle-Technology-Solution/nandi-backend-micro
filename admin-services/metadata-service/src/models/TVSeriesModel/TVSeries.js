const mongoose = require("mongoose");

const tvSeriesSchema = new mongoose.Schema(
  {
    title: { type: String },
    description: { type: String },
    genre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Genre",
    },
    releaseDate: { type: Date, default: null },
    publishDate: { type: Date, default: null },
    castDetails: { type: mongoose.Schema.Types.ObjectId, ref: "Cast" },
    posterId: { type: mongoose.Schema.Types.ObjectId, ref: "Poster" },
    bannerId: { type: mongoose.Schema.Types.ObjectId, ref: "Banner" },
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
tvSeriesSchema.index({ title: "text" });

const TVSeries = mongoose.model("TVSeries", tvSeriesSchema);
module.exports = TVSeries;
