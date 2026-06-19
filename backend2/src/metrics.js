const client = require("prom-client");

const register = new client.Registry();

client.collectDefaultMetrics({
  register,
  prefix: "backend2_"
});

const httpRequestsTotal = new client.Counter({
  name: "backend2_http_requests_total",
  help: "Nombre total de requetes HTTP reçues",
  labelNames: ["method", "route", "status_code"],
  registers: [register]
});

const httpRequestErrorsTotal = new client.Counter({
  name: "backend2_http_request_errors_total",
  help: "Nombre total de requetes HTTP en erreur (status >= 400)",
  labelNames: ["method", "route", "status_code"],
  registers: [register]
});

const httpRequestDurationSeconds = new client.Histogram({
  name: "backend2_http_request_duration_seconds",
  help: "Duree des requetes HTTP en secondes",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [register]
});

function normalizeRoute(req) {
  const path = (req.originalUrl || req.url || "").split("?")[0];

  if (path === "/health" || path === "/metrics") {
    return path;
  }

  if (path === "/api/items") {
    return "/api/items";
  }

  if (path === "/api/achat") {
    return "/api/achat";
  }

  if (path === "/api/vente") {
    return "/api/vente";
  }

  if (path === "/api/transactions") {
    return "/api/transactions";
  }

  if (/^\/api\/users\/[^/]+\/wallet$/.test(path)) {
    return "/api/users/:userId/wallet";
  }

  if (/^\/api\/users\/[^/]+\/inventory$/.test(path)) {
    return "/api/users/:userId/inventory";
  }

  if (/^\/api\/users\/[^/]+\/link\/request-code$/.test(path)) {
    return "/api/users/:userId/link/request-code";
  }

  if (/^\/api\/users\/[^/]+\/link\/confirm$/.test(path)) {
    return "/api/users/:userId/link/confirm";
  }

  return path || "unknown";
}

function metricsMiddleware(req, res, next) {
  if (req.path === "/metrics") {
    return next();
  }

  const stopTimer = httpRequestDurationSeconds.startTimer();

  res.on("finish", () => {
    const route = normalizeRoute(req);
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode)
    };

    httpRequestsTotal.inc(labels);

    if (res.statusCode >= 400) {
      httpRequestErrorsTotal.inc(labels);
    }

    stopTimer(labels);
  });

  next();
}

async function metricsHandler(req, res) {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
}

module.exports = {
  register,
  metricsMiddleware,
  metricsHandler
};