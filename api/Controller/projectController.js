const { createProjectBusiness } = require("../Business/projectBusiness");

const createProjectController = async (req, res) => {
  try {
    const projectDetails = await createProjectBusiness(req.body, req.user);
    return res.status(201).json({
      success: true,
      data: projectDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

module.exports = {
  createProjectController,
};
