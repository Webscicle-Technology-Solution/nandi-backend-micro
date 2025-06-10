const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    content: [
      {
        contentType: {
          type: String,
          enum: ["movie", "tvseries", "shortfilm", "documentary", "videosong"],
        },
        contentId: { type: mongoose.Schema.Types.ObjectId },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Favorite = mongoose.model("Favorite", favoriteSchema);

module.exports = Favorite;
