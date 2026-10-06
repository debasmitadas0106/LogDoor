const { default: mongoose } = require("mongoose");
const { LOGIN_WINDOW_MINUTES } = require("../middleware/constants");

const Schema = mongoose.Schema;

// One document per wrong passcode. MongoDB deletes each one automatically
// after the window (a TTL index), so old mistakes are forgotten.
const loginAttemptSchema = new Schema({
  ip: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now, expires: LOGIN_WINDOW_MINUTES * 60 },
});

module.exports = loginAttemptSchema;
