const {
  getDayBusiness,
  updateDayBusiness,
  listDaysBusiness,
  getProgressBusiness,
} = require("../Business/dayBusiness");
const { sendError } = require("./sendError");

// GET /api/days/:date
const getDayController = async (req, res) => {
  try {
    const data = await getDayBusiness(req.user.dbName, req.params.date);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendError(res, error);
  }
};

// PUT /api/days/:date
const updateDayController = async (req, res) => {
  try {
    const data = await updateDayBusiness(req.user.dbName, req.params.date, req.body);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendError(res, error);
  }
};

// GET /api/days?from=YYYY-MM-DD&to=YYYY-MM-DD
const listDaysController = async (req, res) => {
  try {
    const data = await listDaysBusiness(req.user.dbName, req.query);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendError(res, error);
  }
};

// GET /api/progress
const getProgressController = async (req, res) => {
  try {
    const data = await getProgressBusiness(req.user.dbName);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  getProgressController,
  getDayController,
  updateDayController,
  listDaysController,
};
