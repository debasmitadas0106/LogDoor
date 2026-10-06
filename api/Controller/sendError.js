// Errors with a status (400, 401...) are safe to show; anything else is a 500.
const sendError = (res, error) => {
  const status = error.status || 500;
  if (status === 500) console.error(error);
  if (error.retryAfter) res.set("Retry-After", String(error.retryAfter));
  return res.status(status).json({
    success: false,
    message: status === 500 ? "Something went wrong" : error.message,
  });
};

// Wraps a function so controllers don't repeat try/catch (DRY)
const handle = (fn, status = 200) => async (req, res) => {
  try {
    const data = await fn(req);
    return res.status(status).json({ success: true, data });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = { sendError, handle };
