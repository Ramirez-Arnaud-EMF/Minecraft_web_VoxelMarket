const HttpError = require("../utils/httpError");

function notFoundHandler(req, res, next) {
  next(new HttpError(404, "Route non trouvee"));
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Erreur interne du serveur";

  if (statusCode >= 500 && statusCode !== 503) {
    console.error(err);
  }

  const body = { error: message };
  if (err.code) {
    body.code = err.code;
  }

  res.status(statusCode).json(body);
}

module.exports = {
  notFoundHandler,
  errorHandler
};
