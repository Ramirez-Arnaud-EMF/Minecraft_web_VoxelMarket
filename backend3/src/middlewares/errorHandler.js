function notFound(req, res) {
  return res.status(404).json({
    ok: false,
    error: `Route introuvable: ${req.method} ${req.originalUrl}`
  });
}

function errorHandler(err, _req, res, _next) {
  const status = Number(err.status || err.statusCode || 500);
  return res.status(status).json({
    ok: false,
    error: err.message || "Erreur interne"
  });
}

module.exports = {
  notFound,
  errorHandler
};
