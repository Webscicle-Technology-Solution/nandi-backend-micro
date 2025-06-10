const mongoose = require("mongoose");

const drmKeysSchema = new mongoose.Schema({
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie" },
  documentaryId: { type: mongoose.Schema.Types.ObjectId, ref: "Documentary" },
  shortfilmId: { type: mongoose.Schema.Types.ObjectId, ref: "ShortFilm" },
  videoSongId: { type: mongoose.Schema.Types.ObjectId, ref: "VideoSong" },
  tvSeriesId: { type: mongoose.Schema.Types.ObjectId, ref: "TVSeries" },
  episodeId: { type: mongoose.Schema.Types.ObjectId, ref: "Episode" },
  videoType: { type: String }, //Trailer or Video
  segmentIndex: { type: Number, required: true },
  keyId: { type: String, required: true, unique: true },

  encryptionKey: { type: String, required: true },
  iv: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Index keyID

const DRMKeys = mongoose.model("DRMKeys", drmKeysSchema);
module.exports = DRMKeys;
