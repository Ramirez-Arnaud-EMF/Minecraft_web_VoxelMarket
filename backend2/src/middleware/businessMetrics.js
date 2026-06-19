const promClient = require("prom-client");
const { register } = require("../metrics");

const marketPurchasesTotal = new promClient.Counter({
  name: "backend2_market_purchases_total",
  help: "Total market purchase operations handled by backend2",
  labelNames: ["outcome"],
  registers: [register],
});

const marketSalesTotal = new promClient.Counter({
  name: "backend2_market_sales_total",
  help: "Total market sale operations handled by backend2",
  labelNames: ["outcome"],
  registers: [register],
});

function normalizeOutcome(outcome) {
  const value = String(outcome || "unknown").trim().toLowerCase();

  if (value === "success") {
    return "success";
  }

  if (value === "client_error") {
    return "client_error";
  }

  if (value === "server_error") {
    return "server_error";
  }

  return "unknown";
}

function outcomeFromError(error) {
  const statusCode = Number(error?.statusCode || error?.status || 0);

  if (statusCode >= 400 && statusCode < 500) {
    return "client_error";
  }

  if (statusCode >= 500) {
    return "server_error";
  }

  return "unknown";
}

function recordPurchaseSuccess() {
  marketPurchasesTotal.inc({ outcome: "success" });
}

function recordPurchaseFailure(error) {
  marketPurchasesTotal.inc({ outcome: normalizeOutcome(outcomeFromError(error)) });
}

function recordSaleSuccess() {
  marketSalesTotal.inc({ outcome: "success" });
}

function recordSaleFailure(error) {
  marketSalesTotal.inc({ outcome: normalizeOutcome(outcomeFromError(error)) });
}

module.exports = {
  recordPurchaseSuccess,
  recordPurchaseFailure,
  recordSaleSuccess,
  recordSaleFailure,
};
