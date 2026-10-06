const {
  findDayService,
  upsertDayService,
  findDaysInRangeService,
  findLearnedIdsService,
} = require("../Service/dayService");
const { tasksForDate, PLAN_UPDATED_ON } = require("../../utils/plan");
const { syncReviewsForDay } = require("./reviewBusiness");
const {
  DATE_REGEX,
  MAX_CUSTOM_TASKS,
  MAX_NOTE_LENGTH,
} = require("../../middleware/constants");

// An Error that also carries an HTTP status for the controller
const httpError = (status, message) =>
  Object.assign(new Error(message), { status });

const assertDate = (date) => {
  if (!DATE_REGEX.test(date || "") || isNaN(Date.parse(date))) {
    throw httpError(400, "Date must look like YYYY-MM-DD");
  }
};

const isTaskDone = (task) => {
  if (task.kind === "count") return task.count >= task.min;
  if (task.kind === "study") return task.items.length > 0 && task.items.every((i) => i.done);
  return task.done;
};

// Tasks marked skippable don't count on a day you go out
const summarize = (day) => {
  const active = day.tasks.filter((t) => !(day.outing && t.skippableOnOuting));
  const doneCount = active.filter(isTaskDone).length;
  return {
    date: day.date,
    outing: day.outing,
    total: active.length,
    doneCount,
    percent: active.length ? Math.round((doneCount / active.length) * 100) : 0,
  };
};

const learnedSet = async (dbName) => new Set(await findLearnedIdsService(dbName));

// Work out the tasks for a day:
// - nothing saved yet -> fresh plan, with study items picked for you
// - saved before the plan last changed -> keep exactly what was saved
// - saved after -> keep saved progress, but add any plan tasks it's missing
const resolveTasks = async (dbName, date, doc) => {
  const saved = (doc?.tasks || []).map((t) => ({ ...t, items: t.items || [] }));
  if (saved.length && date < PLAN_UPDATED_ON) return saved;

  const savedByKey = new Map(saved.map((t) => [t.key, t]));
  const needsPlan = !saved.length || tasksForDate(date).some((t) => {
    const s = savedByKey.get(t.key);
    return !s || (t.kind === "study" && s.kind !== "study");
  });
  if (!needsPlan) return saved;

  const plan = tasksForDate(date, await learnedSet(dbName));
  const planTasks = plan.map((t) => {
    const s = savedByKey.get(t.key);
    return s && !(t.kind === "study" && s.kind !== "study") ? s : t;
  });
  return [...planTasks, ...saved.filter((t) => t.custom)];
};

const shapeDay = (date, doc, tasks) => {
  const day = {
    date,
    outing: doc?.outing || false,
    note: doc?.note || "",
    tasks,
  };
  return { ...day, summary: summarize(day) };
};

const getDayBusiness = async (dbName, date) => {
  assertDate(date);
  const doc = await findDayService(dbName, date);
  return shapeDay(date, doc, await resolveTasks(dbName, date, doc));
};

const updateDayBusiness = async (dbName, date, payload = {}) => {
  assertDate(date);
  const existing = await findDayService(dbName, date);
  const baseTasks = await resolveTasks(dbName, date, existing);
  const incoming = Array.isArray(payload.tasks) ? payload.tasks : [];
  const incomingByKey = new Map(incoming.map((t) => [t?.key, t]));

  // Plan tasks: only progress can change, never the label, rules or which items
  const planTasks = baseTasks
    .filter((t) => !t.custom)
    .map((t) => {
      const update = incomingByKey.get(t.key) || {};
      const doneById = new Map(
        (Array.isArray(update.items) ? update.items : []).map((i) => [i?.id, i?.done]),
      );
      return {
        ...t,
        done: typeof update.done === "boolean" ? update.done : t.done,
        count: Number.isInteger(update.count)
          ? Math.min(Math.max(update.count, 0), 20)
          : t.count,
        items: t.items.map((i) => ({
          id: i.id,
          done: typeof doneById.get(i.id) === "boolean" ? doneById.get(i.id) : i.done,
        })),
      };
    });

  // Custom tasks: whatever the client sends, cleaned up
  const customTasks = incoming
    .filter((t) => t?.custom && typeof t.label === "string" && t.label.trim())
    .slice(0, MAX_CUSTOM_TASKS)
    .map((t, i) => ({
      key: /^custom-[a-z0-9]{1,20}$/.test(t.key) ? t.key : `custom-${Date.now().toString(36)}${i}`,
      label: t.label.trim().slice(0, 80),
      kind: "check",
      done: !!t.done,
      count: 0,
      min: 1,
      target: 1,
      skippableOnOuting: false,
      custom: true,
      items: [],
    }));

  const update = {
    tasks: [...planTasks, ...customTasks],
    outing: typeof payload.outing === "boolean" ? payload.outing : existing?.outing || false,
    note:
      typeof payload.note === "string"
        ? payload.note.slice(0, MAX_NOTE_LENGTH)
        : existing?.note || "",
  };

  const saved = await upsertDayService(dbName, date, update);
  await syncReviewsForDay(dbName, date, baseTasks, saved.tasks);
  return shapeDay(date, saved, saved.tasks);
};

const listDaysBusiness = async (dbName, { from, to } = {}) => {
  assertDate(from);
  assertDate(to);
  if (from > to) throw httpError(400, "'from' must be before 'to'");
  const docs = await findDaysInRangeService(dbName, from, to);
  return docs.map((doc) => shapeDay(doc.date, doc, doc.tasks.map((t) => ({ ...t, items: t.items || [] }))).summary);
};

const getProgressBusiness = async (dbName) => ({ learned: await findLearnedIdsService(dbName) });

module.exports = {
  getDayBusiness,
  updateDayBusiness,
  listDaysBusiness,
  getProgressBusiness,
};
