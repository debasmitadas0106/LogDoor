const biz = require("../Business/reviewBusiness");
const { handle } = require("./sendError");

module.exports = {
  // GET  /api/reviews?date=YYYY-MM-DD
  listDueReviewsController: handle((req) => biz.getDueReviewsBusiness(req.user.dbName, req.query)),
  // POST /api/reviews/:itemId
  answerReviewController: handle((req) => biz.answerReviewBusiness(req.user.dbName, req.params.itemId, req.body)),
};
