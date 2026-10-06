const webpush = require("web-push");
const svc = require("../Service/pushService");
const { getDayBusiness } = require("./dayBusiness");
const { countReviewsService } = require("../Service/reviewService");
const { httpError, nowIn } = require("../../utils/dates");

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const SEND_WINDOW_MINUTES = 120; // if the job runs late (or after a deploy), don't nag at midnight

let configured = false;
const setup = () => {
  if (configured) return;
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) throw httpError(500, "Reminders aren't set up on the server (VAPID keys missing)");
  webpush.setVapidDetails(VAPID_SUBJECT || "mailto:admin@example.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configured = true;
};

const validTimeZone = (tz) => {
  try { new Intl.DateTimeFormat("en", { timeZone: tz }); return true; } catch { return false; }
};
const minutes = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));

// GET /api/push/key — the public half of the key pair, needed by the browser
const getPushKeyBusiness = () => {
  setup();
  return { publicKey: process.env.VAPID_PUBLIC_KEY };
};

// POST /api/push/subscription { subscription, time, timeZone }
const saveSubscriptionBusiness = async (user, { subscription, time = "20:30", timeZone = "Asia/Calcutta" } = {}) => {
  const endpoint = subscription?.endpoint;
  if (typeof endpoint !== "string" || !/^https:\/\//.test(endpoint)) throw httpError(400, "Invalid push subscription");
  const { p256dh, auth } = subscription.keys || {};
  if (typeof p256dh !== "string" || typeof auth !== "string") throw httpError(400, "Invalid push subscription keys");
  if (!TIME_REGEX.test(time)) throw httpError(400, "Time must look like 20:30");
  if (!validTimeZone(timeZone)) throw httpError(400, "Unknown time zone");
  const saved = await svc.upsertSubscriptionService(endpoint, {
    userId: user.userId, dbName: user.dbName, keys: { p256dh, auth }, time, timeZone,
  });
  return { enabled: true, time: saved.time };
};

// GET /api/push/subscription?endpoint=...
const getSubscriptionBusiness = async (user, { endpoint } = {}) => {
  if (!endpoint) return { enabled: false };
  const sub = await svc.findSubscriptionService({ endpoint, userId: user.userId });
  return sub ? { enabled: true, time: sub.time } : { enabled: false };
};

// DELETE /api/push/subscription { endpoint }
const deleteSubscriptionBusiness = async (user, { endpoint } = {}) => {
  if (!endpoint) throw httpError(400, "Missing endpoint");
  await svc.deleteSubscriptionService({ endpoint, userId: user.userId });
  return { enabled: false };
};

const send = async (sub, payload) => {
  try {
    await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, JSON.stringify(payload), { TTL: 3600 });
    return true;
  } catch (error) {
    // 404/410 = the phone unsubscribed or the app was removed: forget it
    if (error.statusCode === 404 || error.statusCode === 410) await svc.deleteSubscriptionService({ _id: sub._id });
    else console.error("Push failed", error.statusCode, error.body);
    return false;
  }
};

// POST /api/push/test
const sendTestBusiness = async (user) => {
  setup();
  const subs = await svc.findSubscriptionsService({ userId: user.userId });
  if (!subs.length) throw httpError(400, "Turn on reminders first");
  const results = await Promise.all(subs.map((s) => send(s, {
    title: "Study Tracker",
    body: "Reminders are working. See you this evening!",
    url: "/",
  })));
  return { sent: results.filter(Boolean).length };
};

// The message depends on what's left for the day
const buildMessage = (summary, dueReviews) => {
  const left = summary.total - summary.doneCount;
  const parts = [];
  if (left > 0) parts.push(`${left} of ${summary.total} task${summary.total > 1 ? "s" : ""} left today`);
  if (dueReviews > 0) parts.push(`${dueReviews} review${dueReviews > 1 ? "s" : ""} waiting`);
  if (!parts.length) return null; // all done: no need to remind
  return { title: summary.doneCount ? "Keep going!" : "Time to study", body: `${parts.join(" · ")}. One small step now?`, url: "/" };
};

// Runs every 15 minutes (netlify/functions/reminders.js)
const runRemindersBusiness = async (now = new Date()) => {
  setup();
  const subs = await svc.findSubscriptionsService();
  let sent = 0;
  for (const sub of subs) {
    try {
      const local = nowIn(sub.timeZone, now);
      const late = minutes(local.time) - minutes(sub.time);
      if (late < 0 || late > SEND_WINDOW_MINUTES || sub.lastSentDate === local.date) continue;

      const [day, dueReviews] = await Promise.all([
        getDayBusiness(sub.dbName, local.date),
        countReviewsService(sub.dbName, { mastered: false, due: { $lte: local.date } }),
      ]);
      const message = buildMessage(day.summary, dueReviews);
      if (message && (await send(sub, message))) sent++;
      await svc.markSentService(sub._id, local.date);
    } catch (error) {
      console.error("Reminder failed for one subscription", error);
    }
  }
  return { checked: subs.length, sent };
};

module.exports = {
  getPushKeyBusiness,
  saveSubscriptionBusiness,
  getSubscriptionBusiness,
  deleteSubscriptionBusiness,
  sendTestBusiness,
  runRemindersBusiness,
  buildMessage,
};
