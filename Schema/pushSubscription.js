const { default: mongoose } = require("mongoose");

const Schema = mongoose.Schema;

// One document per phone/browser that turned on the evening reminder.
// Lives in the accounts database so the reminder job can see everyone.
const pushSubscriptionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    dbName: { type: String, required: true },
    endpoint: { type: String, required: true, unique: true }, // the browser's push address
    keys: { p256dh: String, auth: String },
    time: { type: String, default: "20:30" },          // reminder time, "HH:MM"
    timeZone: { type: String, default: "Asia/Calcutta" },
    lastSentDate: { type: String, default: null },     // so we send once per day
  },
  { timestamps: true },
);

module.exports = pushSubscriptionSchema;
