const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    content: {
      contentId: { type: mongoose.Schema.Types.ObjectId, required: true },
      contentType: { type: String, required: true }, // "movie" or "tvseries"
    },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    rating: { type: Number, required: true, min: 0, max: 5 }, // Ensure rating is between 1 and 5
  },
  {
    timestamps: true,
  }
);

// Create a compound unique index for contentId, userId, and contentType to ensure one rating per user per content
ratingSchema.index(
  { "content.contentId": 1, "content.contentType": 1, userId: 1 },
  { unique: true }
);

const Rating = mongoose.model("Rating", ratingSchema);
module.exports = Rating;
