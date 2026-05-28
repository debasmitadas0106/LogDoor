const projectSchema = require("../../Schema/project");
const dbConnect = require("../../utils/connectionSetup");

const createProjectService = async (data, dbUrl = "LogDoor") => {
  try {
    const conn = await dbConnect(dbUrl);
    const projectDetails = await conn.model(
      "Projects",
      projectSchema,
      "Projects",
    );
    const projectDetailsCreate = await projectDetails.create(data);
    return projectDetailsCreate;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const findProjectService = async (data, condition, dbUrl = "LogDoor") => {
  try {
    const conn = await dbConnect(dbUrl);
    const projectDetails = await conn.model(
      "Projects",
      projectSchema,
      "Projects",
    );
    const projectDetailsCreate = await projectDetails.find(condition);
    return projectDetailsCreate;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
const findProjectServiceOne = async (data, condition, dbUrl = "LogDoor") => {
  try {
    const conn = await dbConnect(dbUrl);
    const projectDetails = await conn.model(
      "Projects",
      projectSchema,
      "Projects",
    );
    const projectDetailsCreate = await projectDetails.findOne(condition);
    return projectDetailsCreate;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
module.exports = {
  createProjectService,
  findProjectService,
  findProjectServiceOne,
};
