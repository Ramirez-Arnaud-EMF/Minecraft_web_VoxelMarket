require("dotenv").config();

const express = require("express");
const path = require("path");
const promClient = require("prom-client");
const { getPool } = require("./config/db");
const marketRoutes = require("./routes/marketRoutes");
const buildsRoutes = require("./routes/buildsRoutes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const { metricsMiddleware } = require("./middleware/metrics");

const PORT = Number(process.env.PORT) || 3002;
const app = express();

promClient.collectDefaultMetrics();

app.use(express.json());
app.use(metricsMiddleware);
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
app.get("/metrics", async (_req, res) => {
  res.setHeader("Content-Type", promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

app.use("/api", marketRoutes);
app.use("/api", buildsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    await getPool();
    app.listen(PORT, () => {
      console.log(`backend2 vente/achat running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Echec du demarrage du serveur", error);
    process.exit(1);
  }
}

startServer();
