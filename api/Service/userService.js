const userSchema = require("../../Schema/user");
const dbConnect = require("../../utils/connectionSetup");
const { ACCOUNTS_DB } = require("../../utils/connectionSetup");

const getModel = async () => {
  const conn = await dbConnect(ACCOUNTS_DB());
  return conn.models.Users || conn.model("Users", userSchema, "Users");
};

const findUserService = async (condition) => (await getModel()).findOne(condition).lean();

const createUserService = async (data) => (await (await getModel()).create(data)).toObject();

const updateUserService = async (id, set = {}, unset = {}) =>
  (await getModel())
    .findByIdAndUpdate(id, { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) }, { returnDocument: "after" })
    .lean();

module.exports = { findUserService, createUserService, updateUserService };
