const AUTH_API_BASE = window.VOXELMARKET_AUTH_API_BASE || "http://localhost:3001/api/auth";

async function request(path, options = {}) {
  const response = await fetch(`${AUTH_API_BASE}${path}`, {
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
    const message = payload?.message || payload?.error_description || "Erreur authentification";
    throw new Error(message);
  }

  return payload;
}

export function getAuthConfig() {
  return request("/config");
}

export function registerAccount(input) {
  return request("/register", {
    method: "POST",
    body: {
      username: String(input.username || "").trim(),
      email: String(input.email || "").trim(),
      password: String(input.password || "")
    }
  });
}

export function loginAccount(input) {
  return request("/login", {
    method: "POST",
    body: {
      username: String(input.username || "").trim(),
      password: String(input.password || "")
    }
  });
}

export function getMinecraftLinkStatus(username) {
  return request(`/minecraft/status/${encodeURIComponent(String(username || "").trim())}`);
}
