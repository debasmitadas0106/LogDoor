const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { TOKEN_EXPIRY, LOGIN_MAX_FAILS, LOGIN_WINDOW_MINUTES } = require("../../middleware/constants");
const {
  findRecentFailsService,
  addFailService,
  clearFailsService,
} = require("../Service/loginAttemptService");
const {
  findUserService,
  createUserService,
  updateUserService,
} = require("../Service/userService");

const httpError = (status, message) => Object.assign(new Error(message), { status });

// The same passcode always gives the same hash, so we can look a user up by it.
// JWT_SECRET is mixed in, so a leaked database alone doesn't reveal passcodes.
// (If you change JWT_SECRET, everyone's passcode hash changes too.)
const hashPasscode = (passcode) =>
  crypto.createHmac("sha256", process.env.JWT_SECRET).update(String(passcode)).digest("hex");

// Hashing both sides gives equal-length buffers for a timing-safe compare
const sameSecret = (a, b) => {
  const h = (s) => crypto.createHash("sha256").update(String(s)).digest();
  return crypto.timingSafeEqual(h(a), h(b));
};

// e.g. "Rahul Kumar" + id -> "st_rahul_kumar_a1b2c3"
const makeDbName = (name, id) => {
  const slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 20) || "user";
  return `st_${slug}_${String(id).slice(-6)}`;
};

const findAccount = async (passcode, passcodeHash) => {
  // 1. Normal case: already logged in before, passcode stored as a hash
  const byHash = await findUserService({ passcodeHash });
  if (byHash) return byHash;

  // 2. Added by hand in the database with a plain passcode: secure it now
  const byPlain = await findUserService({ passcode });
  if (byPlain) {
    return updateUserService(byPlain._id, { passcodeHash }, { passcode: "" });
  }

  // 3. The owner's APP_PASSCODE from env (keeps your original login working)
  if (process.env.APP_PASSCODE && sameSecret(passcode, process.env.APP_PASSCODE)) {
    const owner = await findUserService({ isOwner: true });
    if (owner) return updateUserService(owner._id, { passcodeHash });
    return createUserService({
      name: process.env.OWNER_NAME || "Owner",
      passcodeHash,
      dbName: process.env.DB_NAME || "StudyTracker", // your existing data
      isOwner: true,
    });
  }
  return null;
};

// Stop someone guessing passcodes over and over from the same place
const assertNotLocked = async (ip) => {
  const since = new Date(Date.now() - LOGIN_WINDOW_MINUTES * 60 * 1000);
  const fails = await findRecentFailsService(ip, since);
  if (fails.length >= LOGIN_MAX_FAILS) {
    const unlockAt = new Date(fails[0].createdAt).getTime() + LOGIN_WINDOW_MINUTES * 60 * 1000;
    const minutes = Math.max(1, Math.ceil((unlockAt - Date.now()) / 60000));
    throw Object.assign(httpError(429, `Too many wrong tries. Try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`), {
      retryAfter: minutes * 60,
    });
  }
  return fails.length;
};

const loginBusiness = async ({ passcode } = {}, ip = "unknown") => {
  if (!process.env.JWT_SECRET) throw httpError(500, "Server is missing JWT_SECRET");
  if (typeof passcode !== "string" || !passcode.trim()) throw httpError(400, "Enter your passcode");

  const failsSoFar = await assertNotLocked(ip);
  let user = await findAccount(passcode, hashPasscode(passcode));
  if (!user) {
    await addFailService(ip);
    const left = LOGIN_MAX_FAILS - failsSoFar - 1;
    throw httpError(401, left > 0 ? `Wrong passcode. ${left} tr${left > 1 ? "ies" : "y"} left.` : "Wrong passcode.");
  }
  if (failsSoFar) await clearFailsService(ip);
  if (user.active === false) throw httpError(403, "This account is turned off");

  const set = { lastLoginAt: new Date() };
  if (!user.dbName) set.dbName = makeDbName(user.name, user._id); // first login
  user = await updateUserService(user._id, set);

  const token = jwt.sign(
    { userId: String(user._id), dbName: user.dbName, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY },
  );
  return { token, name: user.name };
};

// Fresh from the database, so a name you edit in Atlas shows up straight away
const getMeBusiness = async (userId) => {
  const user = await findUserService({ _id: userId });
  if (!user || user.active === false) throw httpError(401, "Please log in again");
  return { name: user.name };
};

module.exports = { loginBusiness, getMeBusiness };
