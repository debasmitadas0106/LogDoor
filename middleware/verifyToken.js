const jwt = require("jsonwebtoken");

// Every route registered after this middleware needs a valid token.
const verifyToken = (req, res, next) => {
  const authHeader = req.headers?.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Please log in" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Tokens from before accounts existed have no dbName: make them log in again
    if (!payload.dbName || !payload.userId) throw new Error("Old token");
    req.user = { userId: payload.userId, dbName: payload.dbName, name: payload.name };
    return next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Session expired, please log in again" });
  }
};

module.exports = { verifyToken };
