const { verifyEmailBusiness } = require("../Business/verifyEmailBusiness");

const verifyEmailController = async (req, res) => {
  try {
    const verifyEmail = await verifyEmailBusiness(req.body);
    return res.status(201).json({
      success: true,
      data: verifyEmail,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

module.exports = {
  verifyEmailController,
};
