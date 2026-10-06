const svc = require("../Service/reviewService");
const { findLearnedIdsService } = require("../Service/dayService");
const { ALL_IDS } = require("../../utils/library");
const { REVIEW_INTERVALS } = require("../../middleware/constants");
const { httpError, assertDate, addDaysKey } = require("../../utils/dates");

// Items you ticked before reviews existed get a review starting today
const backfill = async (dbName, date) => {
  const [learned, existing] = await Promise.all([findLearnedIdsService(dbName), svc.findReviewIdsService(dbName)]);
  const have = new Set(existing);
  await svc.addReviewsService(dbName, learned.filter((id) => !have.has(id) && ALL_IDS.has(id)), date);
};

// GET /api/reviews?date=YYYY-MM-DD  (your local "today")
const getDueReviewsBusiness = async (dbName, { date } = {}) => {
  assertDate(date);
  await backfill(dbName, date);
  const [due, upcoming, mastered] = await Promise.all([
    svc.findDueReviewsService(dbName, date),
    svc.countReviewsService(dbName, { mastered: false, due: { $gt: date } }),
    svc.countReviewsService(dbName, { mastered: true }),
  ]);
  return {
    due: due.map((r) => ({ itemId: r.itemId, stage: r.stage, due: r.due })),
    upcoming,
    mastered,
    intervals: REVIEW_INTERVALS,
  };
};

// POST /api/reviews/:itemId  { result: "easy" | "hard", date }
//  easy -> wait longer next time (1 -> 3 -> 7 -> 21 -> 60 days, then mastered)
//  hard -> start again tomorrow
const answerReviewBusiness = async (dbName, itemId, { result, date } = {}) => {
  if (!ALL_IDS.has(itemId)) throw httpError(404, "Unknown item");
  if (!["easy", "hard"].includes(result)) throw httpError(400, "Result must be easy or hard");
  assertDate(date);
  const review = await svc.findReviewService(dbName, itemId);
  if (!review) throw httpError(404, "This item isn't in your reviews yet");

  let set;
  if (result === "hard") {
    set = { stage: 0, due: addDaysKey(date, 1), mastered: false };
  } else {
    const stage = review.stage + 1;
    set = stage >= REVIEW_INTERVALS.length
      ? { stage, due: null, mastered: true }
      : { stage, due: addDaysKey(date, REVIEW_INTERVALS[stage]), mastered: false };
  }
  const saved = await svc.updateReviewService(dbName, itemId, { ...set, lastResult: result, lastReviewedOn: date });
  return { itemId, stage: saved.stage, due: saved.due, mastered: saved.mastered };
};

// Called when a day is saved: new ticks start reviewing tomorrow
const syncReviewsForDay = async (dbName, date, beforeTasks, afterTasks) => {
  const doneIds = (tasks) => new Set(tasks.flatMap((t) => (t.items || []).filter((i) => i.done).map((i) => i.id)));
  const before = doneIds(beforeTasks);
  const after = doneIds(afterTasks);
  const added = [...after].filter((id) => !before.has(id));
  const removed = [...before].filter((id) => !after.has(id));
  await Promise.all([
    svc.addReviewsService(dbName, added, addDaysKey(date, REVIEW_INTERVALS[0])),
    svc.removeUnstartedReviewsService(dbName, removed),
  ]);
};

module.exports = { getDueReviewsBusiness, answerReviewBusiness, syncReviewsForDay };
