const { findUserService } = require("../api/Service/userService");

const verifyDatabase = async (req, res, next) => {
  try {
    if (VERIFY_BLACKLIST_URLS.includes(req.url)) {
      console.log("authorization bypassed");
      return next();
    }
    if (!req.headers?.authorization.startsWith("Bearer ")) {
      return next();
    }
    const userDetails = await findUserService({ _id: req?.user?.userId });
    //console.log(userDetails,"userrrrr")
    if (!userDetails) {
      return res.status(401).json({
        message: "the user is not authenticated",
      });
    }
    if (userDetails?.dbName != req.headers?.dbname) {
      return res.status(401).json({
        message: "the user is not authenticated",
      });
    }
    req.user = {
      userId: userDetails?._id,
      dbName: userDetails?.dbName,
    };
    return next();
  } catch (error) {
    console.log(error);
  }
};

module.exports = { verifyDatabase };
