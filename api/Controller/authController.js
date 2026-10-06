const { loginBusiness, getMeBusiness } = require("../Business/authBusiness");
const { sendError } = require("./sendError");

// Netlify puts the visitor's real IP in this header
const clientIp = (req) =>
  req.headers["x-nf-client-connection-ip"] ||
  String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
  req.socket?.remoteAddress ||
  "unknown";

// POST /api/login
const loginController = async (req, res) => {
  try {
    const data = await loginBusiness(req.body, clientIp(req));
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
