const { default: mongoose } = require("mongoose");

const Schema = mongoose.Schema;

// One document per person, in the accounts database (Users collection).
// To add someone, insert a document in Atlas with just:
//   { "name": "Rahul", "passcode": "his-passcode" }
// On their first login the app hashes the passcode, removes the plain
// text, and gives them their own database (dbName).
const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 40 },
    passcode: { type: String },                    // plain text, only until first login
    passcodeHash: { type: String, unique: true, sparse: true },
    dbName: { type: String },                      // their personal database
    active: { type: Boolean, default: true },      // set false to block someone
    isOwner: { type: Boolean, default: false },
    lastLoginAt: Date,
  },
  { timestamps: true },
);

module.exports = userSchema;
