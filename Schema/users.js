const { default: mongoose } = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    email: String,
    password: String,
    role: { type: String, required: false },
    phone: String,
    firstName: String,
    lastName: String,
    dbName: String,
    interests: { type: Array, required: false },
    token: String,
    verified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);
module.exports = userSchema;
