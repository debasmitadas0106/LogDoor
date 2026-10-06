const biz = require("../Business/pushBusiness");
const { handle } = require("./sendError");

module.exports = {
  pushKeyController: handle(() => biz.getPushKeyBusiness()),                                    // GET    /api/push/key
  getSubscriptionController: handle((req) => biz.getSubscriptionBusiness(req.user, req.query)), // GET    /api/push/subscription
  saveSubscriptionController: handle((req) => biz.saveSubscriptionBusiness(req.user, req.body)), // POST  /api/push/subscription
  deleteSubscriptionController: handle((req) => biz.deleteSubscriptionBusiness(req.user, req.body)), // DELETE /api/push/subscription
  testPushController: handle((req) => biz.sendTestBusiness(req.user)),                          // POST   /api/push/test
};
