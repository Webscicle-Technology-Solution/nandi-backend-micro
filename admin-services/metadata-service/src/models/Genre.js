const mongoose = require("mongoose");

const genreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Index
genreSchema.index({ name: "text" });

genreSchema.pre("save", function (next) {
  if (this.name) {
    // Capitalize the first letter and make the rest lowercase
    this.name =
      this.name.charAt(0).toUpperCase() + this.name.slice(1).toLowerCase();
  }
  next();
});

const Genre = mongoose.model("Genre", genreSchema);
module.exports = Genre;
