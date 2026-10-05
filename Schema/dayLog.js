const { default: mongoose } = require("mongoose");

const Schema = mongoose.Schema;

const itemSchema = new Schema(
  {
    id: { type: String, required: true }, // e.g. "lx-001", "js-04", "sd-e01"
    done: { type: Boolean, default: false },
  },
  { _id: false },
);

const taskSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true, maxlength: 80 },
    hint: String,
    kind: { type: String, enum: ["check", "count", "study"], default: "check" },
    done: { type: Boolean, default: false },
    count: { type: Number, default: 0, min: 0, max: 20 },
    min: { type: Number, default: 1 },
    target: { type: Number, default: 1 },
    skippableOnOuting: { type: Boolean, default: false },
    custom: { type: Boolean, default: false },
    items: { type: [itemSchema], default: [] },
  },
  { _id: false },
);

// One document per day
const dayLogSchema = new Schema(
  {
    date: { type: String, required: true, unique: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    outing: { type: Boolean, default: false },
    note: { type: String, default: "", maxlength: 2000 },
    tasks: [taskSchema],
  },
  {
    timestamps: true,
  },
);

module.exports = dayLogSchema;
