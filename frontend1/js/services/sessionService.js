import { SESSION_KEY } from "../config/appConfig.js";

function normalizeSessionShape(session) {
  if (!session || typeof session !== "object") {
    return session;
  }

  if (!session.accessToken && session.access_token) {
    session.accessToken = session.access_token;
  }

  if (!session.refreshToken && session.refresh_token) {
    session.refreshToken = session.refresh_token;
  }

  if (!session.tokenType && session.token_type) {
    session.tokenType = session.token_type;
  }

  if (typeof session.linkedMinecraft === "undefined" && typeof session.minecraftLinked !== "undefined") {
    session.linkedMinecraft = Boolean(session.minecraftLinked);
  }

  return session;
}

export function loadSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if (!session) {
      return null;
    }

    return normalizeSessionShape(session);
  } catch {
    return null;
  }
}

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
