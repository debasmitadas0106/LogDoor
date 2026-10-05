const { nextItems } = require("./library");

// Your study plan. Days: 0 = Sunday ... 6 = Saturday.
// kind "check": tick it off. kind "count": a counter (min = done, target = goal).
// kind "study": the app picks items for you from the library (see utils/library.js).
const PLAN = [
  {
    key: "core",
    label: "Core knowledge",
    hint: "3 questions · JS, Node, MongoDB, SQL, Networks · then Bits & Bytes",
    kind: "study",
    sources: [{ queue: "core", count: 3 }],
    days: [1, 2, 3, 4, 5, 6],
    skippableOnOuting: true,
  },
  {
    key: "linux",
    label: "Linux commands",
    hint: "5 commands a day",
    kind: "study",
    sources: [{ queue: "linux", count: 5 }],
    days: [0, 1, 2, 3, 4, 5, 6],
    skippableOnOuting: true,
  },
  {
    key: "math",
    label: "Maths",
    hint: "1 hour · Class 9",
    kind: "check",
    days: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    key: "problem",
    label: "Practice problems",
    hint: "1 is enough · 2 is the target",
    kind: "count",
    min: 1,
    target: 2,
    days: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    key: "systemDesign",
    label: "System design",
    hint: "1 problem + 2 architecture concepts",
    kind: "study",
    sources: [
      { queue: "sd", count: 1 },
      { queue: "arch", count: 2 },
    ],
    days: [3, 0],
  },
  {
    key: "reading",
    label: "Book reading",
    hint: "Tue · Thu · Sat · Sun",
    kind: "check",
    days: [2, 4, 6, 0],
  },
];

// Days saved on or after this date pick up tasks added to the plan later.
// Bump it whenever you add a new task to PLAN.
const PLAN_UPDATED_ON = "2026-10-05";

// Build the default task list for a date like "2026-10-05".
// `learned` is a Set of item ids you've already finished.
function tasksForDate(date, learned = new Set()) {
  const [y, m, d] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return PLAN.filter((t) => t.days.includes(weekday)).map((t) => ({
    key: t.key,
    label: t.label,
    hint: t.hint,
    kind: t.kind,
    min: t.min || 1,
    target: t.target || 1,
    skippableOnOuting: !!t.skippableOnOuting,
    custom: false,
    done: false,
    count: 0,
    items:
      t.kind === "study"
        ? t.sources.flatMap((s) => nextItems(s.queue, s.count, learned)).map((id) => ({ id, done: false }))
        : [],
  }));
}

module.exports = { PLAN, PLAN_UPDATED_ON, tasksForDate };
