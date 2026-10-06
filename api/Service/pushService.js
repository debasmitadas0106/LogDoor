const pushSubscriptionSchema = require("../../Schema/pushSubscription");
const dbConnect = require("../../utils/connectionSetup");
const { ACCOUNTS_DB } = require("../../utils/connectionSetup");

const getModel = async () => {
  const conn = await dbConnect(ACCOUNTS_DB());
  return conn.models.PushSubscriptions || conn.model("PushSubscriptions", pushSubscriptionSchema, "PushSubscriptions");
};

const upsertSubscriptionService = async (endpoint, data) =>
  (await getModel()).findOneAndUpdate({ endpoint }, { $set: { ...data, endpoint } }, { upsert: true, returnDocument: "after" }).lean();
const findSubscriptionService = async (condition) => (await getModel()).findOne(condition).lean();
const findSubscriptionsService = async (condition = {}) => (await getModel()).find(condition).lean();
const deleteSubscriptionService = async (condition) => (await getModel()).deleteOne(condition);
const markSentService = async (id, date) => (await getModel()).updateOne({ _id: id }, { $set: { lastSentDate: date } });

module.exports = {
  upsertSubscriptionService,
  findSubscriptionService,
  findSubscriptionsService,
  deleteSubscriptionService,
  markSentService,
};
