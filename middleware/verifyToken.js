const jwt = require("jsonwebtoken");
const { findUserService } = require("../api/Service/userService");
const { VERIFY_BLACKLIST_URLS } = require("./constants");

const verifyToken = async (req, res, next) => {
  try {
    console.log(req.url,"reqqqqqq")
    if(VERIFY_BLACKLIST_URLS.includes(req.url)){
        console.log("authorization bypassed")
        return next();
    }
    const authHeader = req?.headers?.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Missing authorization header",
      });
    }

    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      const userDetails = jwt.verify(token, process.env.JWT_SECRET);

      req.user = {
        userId: userDetails?.userId,
        email: userDetails?.email,
      };

      return next();
    }

    // API key validation
    const apikeyDetails = await verifyAPIkey(authHeader);
    req.user = {
      dbName: apikeyDetails?.dbName,
      userId: apikeyDetails?.userId,
    };
    return next();
  } catch (error) {
    console.log(error);

    return res.status(401).json({
      message: "Invalid token",
    });
  }
};
const verifyAPIkey = async (key) => {
  const apikeydetails = await getApiKeyService({ apikey: key });
  if (!apikeydetails) {
    throw new Error("API key expired");
  }
  let now = new Date().getTime();
  if (apikeydetails?.expiresIn < now) {
    throw new Error(
      "API key has expired. Contact support team or mail at support@logdoor.com",
    );
  }
  const userDetails = await findUserService({ _id: apikeydetails?.userId });
  if (!userDetails) {
    throw new Error("User not found or api key is not valid");
  }
  return apikeydetails;
};
module.exports = { verifyToken };
