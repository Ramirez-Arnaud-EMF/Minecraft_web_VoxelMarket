import crypto from "node:crypto";
import poolClient from "../config/dbClient.js";
import poolMinecraft from "../config/dbMinecraft.js";

function getBackend3Config() {
  return {
    baseUrl: process.env.BACKEND3_BASE_URL || "http://localhost:3003",
    messagesPrefix: process.env.BACKEND3_MESSAGES_PREFIX || "/api/messages",
  };
}

function normalizeWebsiteUsername(username) {
  return String(username || "").trim();
}

function normalizeMinecraftUsername(username) {
  return String(username || "").trim();
}

function normalizeLinkCode(value) {
  return String(value || "").trim();
}

async function fetchBackend3Json(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const err = new Error(payload?.error || "Erreur de communication avec backend3.");
    err.statusCode = response.status;
    throw err;
  }

  return payload;
}

async function getClientByWebsiteUsername(username) {
  const [rows] = await poolClient.execute("SELECT pk_client, pseudo FROM t_client WHERE pseudo = ? LIMIT 1", [username]);
  return rows[0] || null;
}

async function ensureMinecraftPlayerOnline(minecraftUsername) {
  const backend3 = getBackend3Config();
  const url = `${backend3.baseUrl}${backend3.messagesPrefix}/online/${encodeURIComponent(minecraftUsername)}`;
  const payload = await fetchBackend3Json(url);

  if (!payload?.online) {
    const err = new Error("Connecte-toi au serveur Minecraft");
    err.statusCode = 400;
    throw err;
  }
}

async function sendLinkCodeInGame(minecraftUsername, code) {
  const backend3 = getBackend3Config();
  const url = `${backend3.baseUrl}${backend3.messagesPrefix}/send`;
  const message = `VoxelMarket: ton code de liaison est ${code}. Il expire dans 5 minutes.`;

  await fetchBackend3Json(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pseudo: minecraftUsername, message }),
  });
}

function generateTemporaryCode() {
  return String(crypto.randomInt(100000, 1000000));
}

export async function requestMinecraftLinkCodeForUser({ username, minecraftUsername }) {
  const normalizedUsername = normalizeWebsiteUsername(username);
  const normalizedMinecraftUsername = normalizeMinecraftUsername(minecraftUsername);
  const client = await getClientByWebsiteUsername(normalizedUsername);

  if (!client) {
    const err = new Error("Utilisateur introuvable.");
    err.statusCode = 404;
    throw err;
  }

  await ensureMinecraftPlayerOnline(normalizedMinecraftUsername);

  const code = generateTemporaryCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  const conn = await poolMinecraft.getConnection();

  try {
    await conn.beginTransaction();
    await conn.execute("UPDATE t_code_liaison SET etat_code = 'EXPIRE' WHERE fk_client = ? AND etat_code = 'ACTIF'", [client.pk_client]);
    await conn.execute(
      `INSERT INTO t_code_liaison (fk_client, valeur_code, date_expiration, etat_code)
       VALUES (?, ?, ?, 'ACTIF')`,
      [client.pk_client, code, expiresAt],
    );
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }

  await sendLinkCodeInGame(normalizedMinecraftUsername, code);
  return {
    message: "Code de verification envoye en jeu.",
    expiresAt: expiresAt.toISOString(),
  };
}

export async function confirmMinecraftLinkCodeForUser({ username, minecraftUsername, code }) {
  const normalizedUsername = normalizeWebsiteUsername(username);
  const normalizedMinecraftUsername = normalizeMinecraftUsername(minecraftUsername);
  const normalizedCode = normalizeLinkCode(code);
  const client = await getClientByWebsiteUsername(normalizedUsername);

  if (!client) {
    const err = new Error("Utilisateur introuvable.");
    err.statusCode = 404;
    throw err;
  }

  const conn = await poolMinecraft.getConnection();
  try {
    await conn.beginTransaction();
    const [codeRows] = await conn.execute(
      `SELECT pk_code
       FROM t_code_liaison
       WHERE fk_client = ?
         AND valeur_code = ?
         AND etat_code = 'ACTIF'
         AND date_utilisation IS NULL
         AND date_expiration > CURRENT_TIMESTAMP
       ORDER BY pk_code DESC
       LIMIT 1`,
      [client.pk_client, normalizedCode],
    );

    const linkCode = codeRows[0];
    if (!linkCode) {
      const err = new Error("Code invalide ou expire.");
      err.statusCode = 400;
      throw err;
    }

    await conn.execute(
      "UPDATE t_code_liaison SET etat_code = 'UTILISE', date_utilisation = CURRENT_TIMESTAMP WHERE pk_code = ?",
      [linkCode.pk_code],
    );

    const [existingRows] = await conn.execute("SELECT pk_compte_mc FROM t_compte_minecraft WHERE fk_client = ? LIMIT 1", [client.pk_client]);
    if (existingRows.length > 0) {
      await conn.execute("UPDATE t_compte_minecraft SET pseudo_minecraft = ? WHERE fk_client = ?", [normalizedMinecraftUsername, client.pk_client]);
    } else {
      await conn.execute("INSERT INTO t_compte_minecraft (fk_client, pseudo_minecraft) VALUES (?, ?)", [client.pk_client, normalizedMinecraftUsername]);
    }

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }

  return {
    minecraftLinked: true,
    minecraftUsername: normalizedMinecraftUsername,
    message: "Compte Minecraft lie avec succes.",
  };
}

export async function getMinecraftLinkStatusForUser({ username }) {
  const normalizedUsername = normalizeWebsiteUsername(username);
  const client = await getClientByWebsiteUsername(normalizedUsername);

  if (!client) {
    const err = new Error("Utilisateur introuvable.");
    err.statusCode = 404;
    throw err;
  }

  const [rows] = await poolMinecraft.execute("SELECT pseudo_minecraft FROM t_compte_minecraft WHERE fk_client = ? LIMIT 1", [client.pk_client]);
  const minecraftUsername = rows[0]?.pseudo_minecraft || null;

  return {
    username: normalizedUsername,
    minecraftLinked: Boolean(minecraftUsername),
    minecraftUsername,
  };
}