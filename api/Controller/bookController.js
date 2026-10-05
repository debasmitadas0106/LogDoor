const biz = require("../Business/bookBusiness");
const { sendError } = require("./sendError");

// One small helper instead of repeating try/catch in every controller (DRY)
const handle = (fn, status = 200) => async (req, res) => {
  try {
    const data = await fn(req);
    return res.status(status).json({ success: true, data });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  listBooksController: handle((req) => biz.listBooksBusiness(req.user.dbName)),                       // GET    /api/books
  createBookController: handle((req) => biz.createBookBusiness(req.user.dbName, req.body), 201),     // POST   /api/books
  updateBookController: handle((req) => biz.updateBookBusiness(req.user.dbName, req.params.id, req.body)), // PATCH /api/books/:id
  deleteBookController: handle((req) => biz.deleteBookBusiness(req.user.dbName, req.params.id)),     // DELETE /api/books/:id
  createGenreController: handle((req) => biz.createGenreBusiness(req.user.dbName, req.body), 201),   // POST   /api/genres
  deleteGenreController: handle((req) => biz.deleteGenreBusiness(req.user.dbName, req.params.id)),   // DELETE /api/genres/:id
};
