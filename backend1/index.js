import "dotenv/config";

import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import promClient from "prom-client";
import authRoutes from "./routes/authRoutes.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";
import { metricsMiddleware } from "./middlewares/metrics.js";

const app = express();
const API_PREFIX = process.env.API_PREFIX || "/api";
const PORT = Number(process.env.PORT) || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");

promClient.collectDefaultMetrics();

app.use(express.json());
app.use(metricsMiddleware);

app.use((req, res, next) => {
    const allowedOrigins = new Set([
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:3001",
        "http://localhost:3001",
        "http://127.0.0.1:8081",
        "http://localhost:8081",
    ]);

    const origin = req.headers.origin;
    if (origin && allowedOrigins.has(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
    }

    res.header("Vary", "Origin");
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    return next();
});

app.use(`${API_PREFIX}/auth`, authRoutes);
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});
app.get("/metrics", async (_req, res) => {
    res.setHeader("Content-Type", promClient.register.contentType);
    res.end(await promClient.register.metrics());
});

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
    console.log(`API prefix set to ${API_PREFIX}`);
});