const { createApiKeyBusiness } = require("../Business/apiKeyBusiness");

const createApiKeyController = async (req, res) => {
  try {
    const apiKeyDetails = await createApiKeyBusiness(
      req.body,
      req.headers,
      req.user,
    );
    return res.status(200).json({
      success: true,
      data: apiKeyDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

module.exports = {
  createApiKeyController,
};
