import promClient from "prom-client";

const httpRequestsTotal = new promClient.Counter({
    name: "http_requests_total",
    help: "Total HTTP requests",
    labelNames: ["method", "route", "status_code"],
});

const httpRequestDurationSeconds = new promClient.Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP request duration in seconds",
    labelNames: ["method", "route", "status_code"],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

function getRouteLabel(req) {
    if (req.route && req.route.path) {
        const routePath = Array.isArray(req.route.path) ? req.route.path[0] : req.route.path;
        return `${req.baseUrl || ""}${routePath}` || req.path;
    }

    return req.originalUrl?.split("?")[0] || req.path || "unknown";
}

export function metricsMiddleware(req, res, next) {
    if ((req.originalUrl || req.url || "").startsWith("/metrics")) {
        return next();
    }

    const endTimer = httpRequestDurationSeconds.startTimer();

    res.on("finish", () => {
        const labels = {
            method: req.method,
            route: getRouteLabel(req),
            status_code: String(res.statusCode),
        };

        httpRequestsTotal.inc(labels);
        endTimer(labels);
    });

    return next();
}
