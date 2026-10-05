const { loginBusiness, getMeBusiness } = require("../Business/authBusiness");
const { sendError } = require("./sendError");

// POST /api/login
const loginController = async (req, res) => {
  try {
    const data = await loginBusiness(req.body);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendError(res, error);
  }
};

// GET /api/me
const meController = async (req, res) => {
  try {
    const data = await getMeBusiness(req.user.userId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = { loginController, meController };
