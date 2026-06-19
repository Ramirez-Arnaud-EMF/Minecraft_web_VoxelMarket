import { LINK_API_BASE } from "../config/appConfig.js";

async function request(path, options = {}) {
  const response = await fetch(`${LINK_API_BASE}${path}`, {
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
    throw new Error(payload?.message || payload?.error || "Erreur API");
  }

  return payload;
}

export function confirmMinecraftLink(payload) {
  return request("/confirm", {
    method: "POST",
    body: {
      username: String(payload?.username || "").trim(),
      minecraftUsername: String(payload?.minecraftUsername || "").trim(),
      code: String(payload?.code || "").trim(),
    },
  });
}

export function requestMinecraftLinkCode(payload) {
  return request("/request-code", {
    method: "POST",
    body: {
      username: String(payload?.username || "").trim(),
      minecraftUsername: String(payload?.minecraftUsername || "").trim(),
    },
  });
}
