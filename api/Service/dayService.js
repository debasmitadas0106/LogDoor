const dayLogSchema = require("../../Schema/dayLog");
const dbConnect = require("../../utils/connectionSetup");

// Every function takes the account's dbName first, so each person's
// days live in their own database.
const getModel = async (dbName) => {
  const conn = await dbConnect(dbName);
  return conn.models.DayLogs || conn.model("DayLogs", dayLogSchema, "DayLogs");
};

const findDayService = async (dbName, date) => {
  const DayLogs = await getModel(dbName);
  return DayLogs.findOne({ date }).lean();
};

const upsertDayService = async (dbName, date, data) => {
  const DayLogs = await getModel(dbName);
  return DayLogs.findOneAndUpdate(
    { date },
    { $set: { ...data, date } },
    { upsert: true, returnDocument: "after", runValidators: true },
  ).lean();
};

const findDaysInRangeService = async (dbName, from, to) => {
  const DayLogs = await getModel(dbName);
  return DayLogs.find({ date: { $gte: from, $lte: to } })
    .sort({ date: 1 })
    .lean();
};

// Every item id you've ticked on any day, e.g. ["lx-001", "js-01"]
const findLearnedIdsService = async (dbName) => {
  const DayLogs = await getModel(dbName);
  const result = await DayLogs.aggregate([
    { $unwind: "$tasks" },
    { $unwind: "$tasks.items" },
    { $match: { "tasks.items.done": true } },
    { $group: { _id: null, ids: { $addToSet: "$tasks.items.id" } } },
  ]);
  return result[0]?.ids || [];
};

module.exports = {
  findDayService,
  upsertDayService,
  findDaysInRangeService,
  findLearnedIdsService,
};
