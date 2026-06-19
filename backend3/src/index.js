const express = require("express");
const promClient = require("prom-client");
const messageRoutes = require("./routes/messageRoutes");
const buildRoutes = require("./routes/buildRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const temporaryCommandRoutes = require("./routes/temporaryCommandRoutes");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const { startBuildPurchaseConsumer } = require("./services/buildPurchaseConsumer");
const { metricsMiddleware } = require("./middlewares/metrics");

const app = express();
const PORT = Number(process.env.PORT || 3003);
const API_PREFIX = process.env.API_PREFIX || "/api";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

app.use(express.json());
app.use(metricsMiddleware);
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", CORS_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});
promClient.collectDefaultMetrics();
app.get("/metrics", async (_req, res) => {
  res.setHeader("Content-Type", promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

app.use(`${API_PREFIX}/messages`, messageRoutes);
app.use(`${API_PREFIX}/build`, buildRoutes);
app.use(`${API_PREFIX}/inventory`, inventoryRoutes);
app.use(`${API_PREFIX}/temp`, temporaryCommandRoutes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  await startBuildPurchaseConsumer();

  app.listen(PORT, () => {
    console.log(`backend3 RCON API running on http://localhost:${PORT}`);
    console.log(`Route active: POST ${API_PREFIX}/messages/send`);
    console.log(`Route active: POST ${API_PREFIX}/build/give`);
    console.log(`Route active: GET ${API_PREFIX}/inventory/:pseudo`);
    console.log(`Route temporaire active: POST ${API_PREFIX}/temp/command`);
  });
}

start().catch((error) => {
  console.error("Echec du demarrage du consumer RabbitMQ", error);
  process.exit(1);
});
