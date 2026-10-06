const { default: mongoose } = require("mongoose");

const Schema = mongoose.Schema;

// One document per practice problem you solved
const problemSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    link: { type: String, default: "", maxlength: 500 },
    topic: { type: String, default: "", trim: true, maxlength: 40 },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    tricked: { type: String, default: "", maxlength: 1000 }, // "what tricked me"
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/, index: true },
    revisit: { type: Boolean, default: false }, // flag it to solve again later
  },
  { timestamps: true },
);

module.exports = problemSchema;
