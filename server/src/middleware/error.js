const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const notFound = (req, res) =>
  res.status(404).json({ message: "Route not found" });

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  let status = err.status || err.statusCode || 500;
  let message = err.message;

  if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors)[0]?.message || "Validation failed";
  } else if (err.name === "CastError") {
    status = 400;
    message = "Invalid data provided";
  } else if (err.code === 11000) {
    status = 409;
    message = "That value is already in use";
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Invalid JSON body";
  } else if (err.type === "entity.too.large") {
    status = 413;
    message = "Request is too large";
  } else if (!err.expose && status >= 500) {
    console.error(err);
    message = "Something went wrong on the server";
  }
  res.status(status).json({ message });
};

module.exports = { asyncHandler, notFound, errorHandler };
