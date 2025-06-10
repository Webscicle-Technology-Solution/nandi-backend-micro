const mongoose = require("mongoose");

const bannerMediaSchema = new mongoose.Schema({
  parent: {
    type: {
      type: String,
      enum: [
        "movie",
        "tvseries",
        "shortfilm",
        "documentary",
        "videosong",
        "episode",
      ], // Ensuring valid types
      required: true,
    },
    id: {
      type: String, // Reference to the media item
      required: true,
    },
  },
  urlPath: { type: String, required: true }, //S3 Key
  signedUrl: { type: String, required: true }, //S3 Signed URL
  expiryTimeStamp: { type: Date, required: true },
});

// Index
bannerMediaSchema.index({ parent: 1, urlPath: 1 }, { unique: true });

const BannerMedia = mongoose.model("BannerMedia", bannerMediaSchema);
module.exports = BannerMedia;
