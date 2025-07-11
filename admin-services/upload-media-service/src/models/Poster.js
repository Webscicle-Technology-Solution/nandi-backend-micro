const mongoose = require("mongoose");

const posterSchema = new mongoose.Schema(
  {
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
    },
    tvSeriesId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TVSeries",
    },
    documentaryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Documentary",
    },
    videoSongId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VideoSong",
    },
    shortFilmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShortFilm",
    },
    episodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Episode",
    },

    urlPath: { type: String },

    createdAt: { type: Date, default: Date.now },
  },

  { timestamps: true }
);

const Poster = mongoose.model("Poster", posterSchema);
module.exports = Poster;
