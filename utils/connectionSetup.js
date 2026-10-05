require("dotenv").config();
const mongoose = require("mongoose");

// One connection to the cluster, shared by everyone.
// Each account gets its own database on it via useDb(dbName),
// the same idea LogDoor used with dbName per user.
// On Netlify a warm function container reuses this cached connection.
let base = null;
let connecting = null;

async function getBase() {
  if (base && base.readyState === 1) return base;
  if (!connecting) {
    connecting = mongoose
      .createConnection(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 })
      .asPromise()
      .then((conn) => {
        base = conn;
        console.log("Connected to MongoDB cluster");
        return conn;
      })
      .catch((error) => {
        connecting = null; // let the next request retry
        throw error;
      });
  }
  return connecting;
}

// Database holding the list of accounts (Users collection)
const ACCOUNTS_DB = () => process.env.ACCOUNTS_DB || "StudyTrackerAccounts";

async function dbConnect(dbName) {
  if (!dbName) throw new Error("dbConnect needs a database name");
  const conn = await getBase();
  return conn.useDb(dbName, { useCache: true });
}

module.exports = dbConnect;
module.exports.ACCOUNTS_DB = ACCOUNTS_DB;
