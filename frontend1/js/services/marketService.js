import { API_BASE } from "../config/appConfig.js";

function buildAuthorizationHeader(input) {
  if (!input) {
    return null;
  }

  const raw = String(input.authorization || "").trim();
  if (raw) {
    return raw;
  }

  const accessToken = String(input.accessToken || "").trim();
  if (!accessToken || accessToken === "undefined" || accessToken === "null") {
    return null;
  }

  const tokenType = String(input.tokenType || "Bearer").trim() || "Bearer";
  return `${tokenType} ${accessToken}`;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
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
    const err = new Error(payload?.message || payload?.error || "Erreur API");
    err.code = payload?.code || null;
    err.status = response.status;
    throw err;
  }

  return payload;
}

export function getWallet(userId) {
  return request(`/users/${userId}/wallet`);
}

export function resolveMarketUser(username) {
  return request("/users/resolve", {
    method: "POST",
    body: {
      username: String(username || "").trim(),
    },
  });
}

export function buyBuild({ userId, buildId, quantity = 1, authorization = null, accessToken = null, tokenType = null }) {
  const authHeader = buildAuthorizationHeader({ authorization, accessToken, tokenType });

  if (!authHeader) {
    throw new Error("Session invalide: reconnecte-toi avant d'acheter.");
  }

  return request("/achat", {
    method: "POST",
    headers: { Authorization: authHeader },
    body: { userId, buildId, quantity },
  });
}

export function getItemsEnVente() {
  return request("/items-en-vente");
}

export function sellItem({ userId, minecraftItemId, quantity = 1, minecraftUsername = null }) {
  return request("/vente", {
    method: "POST",
    body: { userId, minecraftItemId, quantity, minecraftUsername },
  });
}

export function requestMinecraftLinkCode(userId, minecraftUsername) {
  return request(`/users/${userId}/link/request-code`, {
    method: "POST",
    body: { minecraftUsername },
  });
}
