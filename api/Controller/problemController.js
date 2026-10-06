const biz = require("../Business/problemBusiness");
const { handle } = require("./sendError");

module.exports = {
  listProblemsController: handle((req) => biz.listProblemsBusiness(req.user.dbName)),                         // GET    /api/problems
  createProblemController: handle((req) => biz.createProblemBusiness(req.user.dbName, req.body), 201),        // POST   /api/problems
  updateProblemController: handle((req) => biz.updateProblemBusiness(req.user.dbName, req.params.id, req.body)), // PATCH /api/problems/:id
  deleteProblemController: handle((req) => biz.deleteProblemBusiness(req.user.dbName, req.params.id)),        // DELETE /api/problems/:id
};
