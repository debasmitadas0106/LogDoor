const { default: mongoose } = require("mongoose");

const Schema = mongoose.Schema;

const bookSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    author: { type: String, default: "", trim: true, maxlength: 80 },
    genreId: { type: Schema.Types.ObjectId, required: true, index: true },
    status: { type: String, enum: ["to-read", "reading", "done"], default: "to-read" },
    why: { type: String, default: "", maxlength: 200 }, // one line on why to read it
  },
  { timestamps: true },
);

module.exports = bookSchema;
