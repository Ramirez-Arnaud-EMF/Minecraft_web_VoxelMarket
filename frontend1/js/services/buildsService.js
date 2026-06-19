const MARKET_API_BASE = window.VOXELMARKET_API_BASE || "http://localhost:3002/api";

async function request(path, options = {}) {
  const response = await fetch(`${MARKET_API_BASE}${path}`, {
    method: options.method || "GET",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const text = await response.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || "Erreur API");
  }

  return payload;
}

export function getAvailableBuilds() {
  return request("/builds-disponibles");
}
