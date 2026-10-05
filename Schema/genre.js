const { default: mongoose } = require("mongoose");

const Schema = mongoose.Schema;

const genreSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 40 },
    // lowercase copy so "Fiction" and "fiction" count as the same genre
    nameKey: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

module.exports = genreSchema;
