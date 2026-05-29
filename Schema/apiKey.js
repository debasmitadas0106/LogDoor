const { default: mongoose, mongo } = require("mongoose");
const { ObjectId } = mongoose.Types;
const Schema = mongoose.Schema;

const apiKeySchema = new Schema(
  {
    dbName: String,
    email: String,
    userId: ObjectId,
    apiKey: String,
    role: String,
    expiresIn: Number,
    lastUsed: Date,
  },
  {
    timestamps: true,
  },
);
module.exports = apiKeySchema;
