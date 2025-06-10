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
    status: { type: mongoose.Schema.Types.ObjectId, ref: "Status" },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

seasonSchema.index({ seasonNumber: 1, tvSeries: 1 }, { unique: true });

const Season = mongoose.model("Season", seasonSchema);
module.exports = Season;
