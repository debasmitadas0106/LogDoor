// Errors with a status (400, 401...) are safe to show; anything else is a 500.
const sendError = (res, error) => {
  const status = error.status || 500;
  if (status === 500) console.error(error);
  return res.status(status).json({
    success: false,
    message: status === 500 ? "Something went wrong" : error.message,
  });
};

module.exports = { sendError };
