const loginAttemptSchema = require("../../Schema/loginAttempt");
const dbConnect = require("../../utils/connectionSetup");
const { ACCOUNTS_DB } = require("../../utils/connectionSetup");

const getModel = async () => {
  const conn = await dbConnect(ACCOUNTS_DB());
  return conn.models.LoginAttempts || conn.model("LoginAttempts", loginAttemptSchema, "LoginAttempts");
};

const findRecentFailsService = async (ip, since) =>
  (await getModel()).find({ ip, createdAt: { $gte: since } }).sort({ createdAt: 1 }).lean();

const addFailService = async (ip) => (await getModel()).create({ ip });

const clearFailsService = async (ip) => (await getModel()).deleteMany({ ip });

module.exports = { findRecentFailsService, addFailService, clearFailsService };
