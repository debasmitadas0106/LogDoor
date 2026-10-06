const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TOKEN_EXPIRY = "30d";
const MAX_CUSTOM_TASKS = 5;
const MAX_NOTE_LENGTH = 2000;

module.exports = {
  DATE_REGEX,
  TOKEN_EXPIRY,
  MAX_CUSTOM_TASKS,
  MAX_NOTE_LENGTH,
};

// Login limits: this many wrong passcodes from one device/network...
const LOGIN_MAX_FAILS = 5;
// ...inside this window locks login for the rest of the window
const LOGIN_WINDOW_MINUTES = 15;

// Spaced repetition: days until the next review after each "Easy"
const REVIEW_INTERVALS = [1, 3, 7, 21, 60];

module.exports.LOGIN_MAX_FAILS = LOGIN_MAX_FAILS;
module.exports.LOGIN_WINDOW_MINUTES = LOGIN_WINDOW_MINUTES;
module.exports.REVIEW_INTERVALS = REVIEW_INTERVALS;
