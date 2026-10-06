// Scheduled function: Netlify runs this every 15 minutes (see netlify.toml).
// It sends the evening reminder to anyone whose reminder time has arrived.
const { runRemindersBusiness } = require("../../api/Business/pushBusiness");

module.exports.handler = async () => {
  const result = await runRemindersBusiness();
  console.log("Reminders:", result);
  return { statusCode: 200, body: JSON.stringify(result) };
};
