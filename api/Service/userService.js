const userSchema = require("../../Schema/users");
const dbConnect = require("../../utils/connectionSetup");

const createUserService = async (data, dbUrl = "LogDoor") => {
  try {
    const conn = await dbConnect(dbUrl);
    const userDetails = await conn.model("Users", userSchema, "Users");
    const userDetailsCreate = await userDetails.create(data);
    return userDetailsCreate;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const findUserService = async (condition, dbUrl = "LogDoor") => {
  try {
    const conn = await dbConnect(dbUrl);
    const userDetails = await conn.model("Users", userSchema, "Users");
    const userDetailsCreate = await userDetails.findOne(condition);
    return userDetailsCreate;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const findAllUserService = async (condition, dbUrl = "LogDoor") => {
  try {
    const conn = await dbConnect(dbUrl);
    const userDetails = await conn.model("Users", userSchema, "Users");
    const userDetailsCreate = await userDetails.find(condition);
    return userDetailsCreate;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
module.exports = { createUserService, findUserService, findAllUserService };
