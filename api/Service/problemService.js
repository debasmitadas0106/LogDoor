const problemSchema = require("../../Schema/problem");
const dbConnect = require("../../utils/connectionSetup");

const getModel = async (dbName) => {
  const conn = await dbConnect(dbName);
  return conn.models.Problems || conn.model("Problems", problemSchema, "Problems");
};

const findProblemsService = async (dbName) =>
  (await getModel(dbName)).find().sort({ date: -1, createdAt: -1 }).lean();
const createProblemService = async (dbName, data) => (await (await getModel(dbName)).create(data)).toObject();
const updateProblemService = async (dbName, id, set) =>
  (await getModel(dbName)).findByIdAndUpdate(id, { $set: set }, { returnDocument: "after", runValidators: true }).lean();
const deleteProblemService = async (dbName, id) => (await getModel(dbName)).findByIdAndDelete(id).lean();

module.exports = { findProblemsService, createProblemService, updateProblemService, deleteProblemService };
