const { DATE_REGEX } = require("../middleware/constants");

// An Error that also carries an HTTP status for the controller
const httpError = (status, message) => Object.assign(new Error(message), { status });

const isDateKey = (s) => typeof s === "string" && DATE_REGEX.test(s) && !isNaN(Date.parse(s));

const assertDate = (date) => {
  if (!isDateKey(date)) throw httpError(400, "Date must look like YYYY-MM-DD");
};

// "2026-10-05" + 3 -> "2026-10-08" (done in UTC so timezones don't shift the day)
const addDaysKey = (key, n) => {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
};

// Today's date and time in a timezone, e.g. { date: "2026-10-05", time: "20:45" }
const nowIn = (timeZone, now = new Date()) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(now).map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
};

module.exports = { httpError, isDateKey, assertDate, addDaysKey, nowIn };
