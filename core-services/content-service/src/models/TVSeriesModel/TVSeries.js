const mongoose = require("mongoose");

const tvSeriesSchema = new mongoose.Schema(
  {
    title: { type: String },
    description: { type: String },
    releaseDate: { type: Date, default: null },
    publishDate: { type: Date, default: null },
    genre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Genre",
    },
    castDetails: { type: mongoose.Schema.Types.ObjectId, ref: "Cast" },
    posterId: { type: mongoose.Schema.Types.ObjectId, ref: "Poster" },
    bannerId: { type: mongoose.Schema.Types.ObjectId, ref: "Banner" },
    status: { type: mongoose.Schema.Types.ObjectId, ref: "Status" },
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
