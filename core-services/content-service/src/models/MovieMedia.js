const mongoose = require("mongoose");

const movieMediaSchema = new mongoose.Schema(
  {
    title: { type: String },
    description: { type: String },
    releaseDate: { type: Date },
    publishDate: { type: Date },
    certificate: { type: String },
    genre: { type: mongoose.Schema.Types.ObjectId, ref: "Genre" },
    castDetails: { type: mongoose.Schema.Types.ObjectId, ref: "Cast" },
    status: {
      type: String,
      enum: ["active", "inactive", "draft", "scheduled"], //Set by Admin Dashboard
      default: "draft",
    },
    isReady: { type: Boolean, default: false }, // Indicates backend processing is complete
    posterId: { type: mongoose.Schema.Types.ObjectId, ref: "Poster" },
    bannerId: { type: mongoose.Schema.Types.ObjectId, ref: "Banner" },
    trailerId: { type: mongoose.Schema.Types.ObjectId, ref: "Trailer" },
    previewId: { type: mongoose.Schema.Types.ObjectId, ref: "Preview" },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video" },
    accessParams: {
      accessType: { type: String, default: "free" }, // "free", "rentable", "subscription-only"
      isRentable: { type: Boolean, default: false },
      isFree: { type: Boolean, default: true },
      requiredSubscriptionType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubscriptionType",
      },
      rentalPrice: { type: Number, default: 0 },
    },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

movieMediaSchema.index({ title: "text" });
movieMediaSchema.index({ description: "text" });

const MovieMedia = mongoose.model("MovieMedia", movieMediaSchema);
module.exports = MovieMedia;
