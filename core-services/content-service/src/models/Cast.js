const mongoose = require("mongoose");
const capitalizeName = require("../utils/inputUtils");

const castSchema = new mongoose.Schema({
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", unique: true },
  tvSeriesId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TVSeries",
    unique: true,
  },
  documentaryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Documentary",
    unique: true,
  },
  shortFilmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ShortFilm",
    unique: true,
  },
  videoSongId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "VideoSong",
    unique: true,
  },
  actors: [String], // Array of string names
  producers: [String], // Array of string names
  directors: [String], // Array of string names
  singers: [String], // Array of string names
  writers: [String], // Array of string names
  composers: [String], // Array of string names
  createdAt: { type: Date, default: Date.now },
});

// castSchema.pre("save", function (next) {
//   // Capitalize names in arrays only if the field is modified
//   if (this.isModified("actors")) {
//     this.actors = this.actors.map(capitalizeName);
//   }
//   if (this.isModified("producers")) {
//     this.producers = this.producers.map(capitalizeName);
//   }
//   if (this.isModified("directors")) {
//     this.directors = this.directors.map(capitalizeName);
//   }
//   if (this.isModified("singers")) {
//     this.singers = this.singers.map(capitalizeName);
//   }
//   if (this.isModified("writers")) {
//     this.writers = this.writers.map(capitalizeName);
//   }
//   if (this.isModified("composers")) {
//     this.composers = this.composers.map(capitalizeName);
//   }

//   // Proceed with saving
//   next();
// });

const Cast = mongoose.model("Cast", castSchema);
module.exports = Cast;
