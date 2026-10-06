const { default: mongoose } = require("mongoose");

const Schema = mongoose.Schema;

// One document per library item you've learned (spaced repetition)
const reviewSchema = new Schema(
  {
    itemId: { type: String, required: true, unique: true }, // e.g. "js-04"
    stage: { type: Number, default: 0 },     // how many "Easy" answers in a row
    due: { type: String, default: null },    // "YYYY-MM-DD", null once mastered
    mastered: { type: Boolean, default: false },
    reviews: { type: Number, default: 0 },   // total times reviewed
    lastResult: { type: String, enum: ["easy", "hard", null], default: null },
    lastReviewedOn: { type: String, default: null },
  },
  { timestamps: true },
);

module.exports = reviewSchema;
