const express = require("express");
const path = require("path");
const marketRoutes = require("./routes/marketRoutes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const { metricsMiddleware, metricsHandler } = require("./metrics");

const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});
app.use(metricsMiddleware);
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/metrics", metricsHandler);

app.use("/api", marketRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
