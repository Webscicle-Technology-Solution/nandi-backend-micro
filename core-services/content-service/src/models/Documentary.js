const mongoose = require("mongoose");

const documentarySchema = new mongoose.Schema(
  {
    title: { type: String },
    description: { type: String },
    releaseDate: { type: Date },
    publishDate: { type: Date },
    genre: { type: mongoose.Schema.Types.ObjectId, ref: "Genre" },
    castDetails: { type: mongoose.Schema.Types.ObjectId, ref: "Cast" },
    posterId: { type: mongoose.Schema.Types.ObjectId, ref: "Poster" },
    bannerId: { type: mongoose.Schema.Types.ObjectId, ref: "Banner" },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video" },
    status: { type: mongoose.Schema.Types.ObjectId, ref: "Status" },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Index
documentarySchema.index({ title: "text" });
documentarySchema.index({ description: "text" });

const Documentary = mongoose.model("Documentary", documentarySchema);
module.exports = Documentary;
