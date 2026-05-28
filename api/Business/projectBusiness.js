const { createProjectService } = require("../Service/projectService");

const createProjectBusiness = async (payload, user={}) => {
  try {
    const { projectName, description, appUrl} = payload;
    const {dbName} = user
    //console.log(user, payload,"came till here")
    const createProjectDetails = await createProjectService(payload, dbName)
    return createProjectDetails;
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
    createProjectBusiness
}