const { loginBusiness } = require("../Business/loginBusiness");

const loginUserController = async (req, res) => {
  try {
    const userDetails = await loginBusiness(req.body, req.query);
    return res.status(201).json({
      success: true,
      data: userDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

module.exports ={
    loginUserController
}