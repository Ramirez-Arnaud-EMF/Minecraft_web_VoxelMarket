import { INVENTORY_API_BASE } from "../config/appConfig.js";

async function requestInventory(pseudo) {
  const response = await fetch(
    `${INVENTORY_API_BASE}/inventory/${encodeURIComponent(pseudo)}`,
  );

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
    throw new Error(
      payload?.message || payload?.error || "Erreur API inventaire",
    );
  }

  return payload;
}

export async function fetchInventoryByPseudo(pseudo) {
  if (!pseudo) {
    throw new Error("Pseudo manquant pour charger l'inventaire");
  }

  return requestInventory(pseudo);
}

export async function logInventoryForSession(session) {
  const pseudo = session?.minecraftUsername || session?.username;

  if (!pseudo) {
    console.warn("Impossible de charger l'inventaire sans pseudo.");
    return null;
  }

  const payload = await requestInventory(pseudo);
  console.log(payload);
  return payload;
}
