const { default: mongoose } = require("mongoose");

const Schema = mongoose.Schema;

const projectSchema = new Schema(
  {
    projectName: String,
    description: String,
    appUrl: String
  },
  {
    timestamps: true,
  },
);
module.exports = projectSchema;
