const reviewSchema = require("../../Schema/review");
const dbConnect = require("../../utils/connectionSetup");

const getModel = async (dbName) => {
  const conn = await dbConnect(dbName);
  return conn.models.Reviews || conn.model("Reviews", reviewSchema, "Reviews");
};

const findDueReviewsService = async (dbName, date) =>
  (await getModel(dbName)).find({ mastered: false, due: { $lte: date } }).sort({ due: 1, createdAt: 1 }).lean();

const countReviewsService = async (dbName, condition) => (await getModel(dbName)).countDocuments(condition);

const findReviewIdsService = async (dbName) =>
  (await (await getModel(dbName)).find({}, { itemId: 1 }).lean()).map((r) => r.itemId);

const findReviewService = async (dbName, itemId) => (await getModel(dbName)).findOne({ itemId }).lean();

// Adds a review for each id, but leaves existing ones untouched ($setOnInsert)
const addReviewsService = async (dbName, itemIds, due) => {
  if (!itemIds.length) return;
  await (await getModel(dbName)).bulkWrite(
    itemIds.map((itemId) => ({
      updateOne: { filter: { itemId }, update: { $setOnInsert: { itemId, due, stage: 0 } }, upsert: true },
    })),
  );
};

// Un-ticking an item removes its review, unless you've already reviewed it
const removeUnstartedReviewsService = async (dbName, itemIds) => {
  if (!itemIds.length) return;
  await (await getModel(dbName)).deleteMany({ itemId: { $in: itemIds }, reviews: 0 });
};

const updateReviewService = async (dbName, itemId, set) =>
  (await getModel(dbName)).findOneAndUpdate({ itemId }, { $set: set, $inc: { reviews: 1 } }, { returnDocument: "after" }).lean();

module.exports = {
  findDueReviewsService,
  countReviewsService,
  findReviewIdsService,
  findReviewService,
  addReviewsService,
  removeUnstartedReviewsService,
  updateReviewService,
};
