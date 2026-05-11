const {
  createUserBusiness,
  findUserBusiness,
  findAllUserBusiness,
} = require("../Business/userBusiness");

const createUserController = async (req, res) => {
  try {
    const createUser = await createUserBusiness(req.body);
    return res.status(201).json({
      success: true,
      data: createUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const findUserController = async (req, res) => {
  try {
    const createUser = await findUserBusiness(req.body, req.query);
    return res.status(201).json({
      success: true,
      data: createUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const findAllUserController = async (req, res) => {
  try {
    const createUser = await findAllUserBusiness(req.body, req.query);
    return res.status(201).json({
      success: true,
      data: createUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

module.exports = {
  createUserController,
  findAllUserController,
  findUserController,
};
