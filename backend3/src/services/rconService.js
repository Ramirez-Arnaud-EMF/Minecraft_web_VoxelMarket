const { Rcon } = require("rcon-client");
const { RCON_HOST, RCON_PORT, RCON_PASSWORD } = require("../config/rconConfig");

async function executeRconCommand(command) {
  const rcon = await Rcon.connect({
    host: RCON_HOST,
    port: RCON_PORT,
    password: RCON_PASSWORD
  });

  try {
    return await rcon.send(command);
  } finally {
    await rcon.end();
  }
}

function createHttpError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizeMessage(text) {
  return String(text || "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function validatePseudoInput(pseudo) {
  const normalizedPseudo = String(pseudo || "").trim();

  if (!normalizedPseudo) {
    const error = new Error("Le parametre 'pseudo' est requis.");
    error.status = 400;
    throw error;
  }

  if (!/^[a-zA-Z0-9_]{3,16}$/.test(normalizedPseudo)) {
    const error = new Error("Le pseudo Minecraft est invalide (3-16 caracteres alphanumeriques ou underscore).");
    error.status = 400;
    throw error;
  }

  return normalizedPseudo;
}

function validateSendMessageInput(pseudo, message) {
  const normalizedPseudo = validatePseudoInput(pseudo);
  const normalizedMessage = normalizeMessage(message);

  if (!normalizedMessage) {
    const error = new Error("Le parametre 'message' est requis.");
    error.status = 400;
    throw error;
  }

  return {
    pseudo: normalizedPseudo,
    message: normalizedMessage
  };
}

function validatePseudo(pseudo) {
  const normalizedPseudo = String(pseudo || "").trim();

  if (!normalizedPseudo) {
    throw createHttpError("Le parametre 'pseudo' est requis.", 400);
  }

  if (!/^[a-zA-Z0-9_]{3,16}$/.test(normalizedPseudo)) {
    throw createHttpError("Le pseudo Minecraft est invalide (3-16 caracteres alphanumeriques ou underscore).", 400);
  }

  return normalizedPseudo;
}

function validateItemId(itemId) {
  const normalizedItemId = String(itemId || "").trim();

  if (!normalizedItemId) {
    throw createHttpError("Le parametre 'itemId' est requis.", 400);
  }

  if (!/^[a-z0-9_.-]+:[a-z0-9_./-]+$/i.test(normalizedItemId)) {
    throw createHttpError("Le parametre 'itemId' est invalide (ex: minecraft:diamond).", 400);
  }

  return normalizedItemId;
}

function validatePositiveInteger(value, fieldName) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createHttpError(`Le parametre '${fieldName}' doit etre un entier positif.`, 400);
  }

  return parsed;
}

function validateSlot(slot) {
  const parsedSlot = Number(slot);

  if (!Number.isInteger(parsedSlot)) {
    throw createHttpError("Le parametre 'slot' doit etre un entier.", 400);
  }

  if (!KNOWN_INVENTORY_SLOTS.includes(parsedSlot)) {
    throw createHttpError("Le slot est invalide. Valeurs autorisees: 0-35, 100-103, -106.", 400);
  }

  return parsedSlot;
}

function stripMinecraftNumberSuffixes(snbt) {
  return snbt.replace(/(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)([bBsSlLfFdD])/g, "$1");
}

function normalizeSnbtToJsonString(snbt) {
  let normalized = stripMinecraftNumberSuffixes(snbt);

  // Converts typed arrays [I; ...], [B; ...], [L; ...] into standard JSON arrays.
  normalized = normalized.replace(/\[(\s*)[BIL](\s*);/g, "[$1");

  // Quotes unquoted keys including namespaced ones such as minecraft:custom_name.
  normalized = normalized.replace(/([\{,]\s*)([A-Za-z_][A-Za-z0-9_:\.-]*)\s*:/g, '$1"$2":');

  return normalized;
}

function extractSnbtPayload(rawResponse) {
  const text = String(rawResponse || "").trim();
  const match = text.match(/^[^:]+:\s*(.+)$/s);
  return match ? match[1].trim() : text;
}

function parseInventoryResponse(rawResponse) {
  const responseText = String(rawResponse || "");
  const payload = extractSnbtPayload(responseText);

  if (!payload) {
    return [];
  }

  const normalized = normalizeSnbtToJsonString(payload);

  try {
    const parsed = JSON.parse(normalized);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    throw createHttpError(`Impossible de parser l'inventaire SNBT. Reponse brute: ${responseText}`, 502);
  }
}

function mapSlotInfo(slot) {
  if (slot >= 0 && slot <= 8) {
    return { slotType: "hotbar" };
  }

  if (slot >= 9 && slot <= 35) {
    return { slotType: "main_inventory" };
  }

  if (slot === 100) {
    return { slotType: "armor", armorPart: "feet" };
  }

  if (slot === 101) {
    return { slotType: "armor", armorPart: "legs" };
  }

  if (slot === 102) {
    return { slotType: "armor", armorPart: "chest" };
  }

  if (slot === 103) {
    return { slotType: "armor", armorPart: "head" };
  }

  if (slot === -106) {
    return { slotType: "offhand" };
  }

  return { slotType: "unknown" };
}

function normalizeInventoryItem(item) {
  const slot = Number(item?.Slot ?? item?.slot);
  const count = Number(item?.count ?? item?.Count ?? 0);
  const itemId = String(item?.id || "");

  return {
    slot,
    ...mapSlotInfo(slot),
    itemId,
    count,
    components: item?.components || null,
    raw: item
  };
}

function assertRconInventoryResponse(rawResponse) {
  const responseText = String(rawResponse || "");

  if (/No entity was found/i.test(responseText)) {
    throw createHttpError("Aucune entite trouvee. Le joueur est probablement hors ligne.", 404);
  }

  if (/No items were found/i.test(responseText)) {
    throw createHttpError("Aucun item trouve pour ce joueur au moment de la requete.", 409);
  }
}

function assertNoEntityError(rawResponse) {
  const responseText = String(rawResponse || "");

  if (/No entity was found/i.test(responseText)) {
    throw createHttpError("Aucune entite trouvee. Le joueur est probablement hors ligne.", 404);
  }
}

const KNOWN_INVENTORY_SLOTS = [
  0, 1, 2, 3, 4, 5, 6, 7, 8,
  9, 10, 11, 12, 13, 14, 15, 16, 17,
  18, 19, 20, 21, 22, 23, 24, 25, 26,
  27, 28, 29, 30, 31, 32, 33, 34, 35,
  100, 101, 102, 103,
  -106
];

function formatSlotForNbt(slot) {
  return `${slot}b`;
}

function extractValueAfterColon(text) {
  const match = String(text || "").match(/^[^:]+:\s*(.+)$/s);
  return match ? match[1].trim() : "";
}

function parseNbtStringValue(responseText) {
  const raw = extractValueAfterColon(responseText);
  const quoted = raw.match(/^"([\s\S]*)"$/);
  if (quoted) {
    return quoted[1];
  }
  return raw;
}

function parseNbtNumericValue(responseText) {
  const raw = extractValueAfterColon(responseText);
  const match = raw.match(/^(-?\d+(?:\.\d+)?)(?:[bBsSlLfFdD])?$/);
  return match ? Number(match[1]) : 0;
}

function isMissingSlotResponse(responseText) {
  return /Found no elements matching|No items were found/i.test(String(responseText || ""));
}

function parseRemovedCount(responseText) {
  const match = String(responseText || "").match(/Removed\s+(\d+)\s+items?/i);
  return match ? Number(match[1]) : null;
}

function mapSlotToItemReplaceTarget(slot) {
  if (slot >= 0 && slot <= 8) {
    return `hotbar.${slot}`;
  }

  if (slot >= 9 && slot <= 35) {
    return `inventory.${slot - 9}`;
  }

  if (slot === 100) {
    return "armor.feet";
  }

  if (slot === 101) {
    return "armor.legs";
  }

  if (slot === 102) {
    return "armor.chest";
  }

  if (slot === 103) {
    return "armor.head";
  }

  if (slot === -106) {
    return "weapon.offhand";
  }

  throw createHttpError("Le slot est invalide pour la suppression.", 400);
}

async function getItemInSlot(pseudo, slot) {
  const slotNbt = formatSlotForNbt(slot);
  const idCommand = `data get entity ${pseudo} Inventory[{Slot:${slotNbt}}].id`;
  const idResponse = await executeRconCommand(idCommand);

  assertNoEntityError(idResponse);

  if (isMissingSlotResponse(idResponse)) {
    return null;
  }

  const countCommand = `data get entity ${pseudo} Inventory[{Slot:${slotNbt}}].count`;
  const countResponse = await executeRconCommand(countCommand);

  assertNoEntityError(countResponse);

  return {
    slot,
    ...mapSlotInfo(slot),
    itemId: parseNbtStringValue(idResponse),
    count: parseNbtNumericValue(countResponse),
    raw: {
      idResponse,
      countResponse
    }
  };
}

async function getInventoryByKnownSlots(pseudo) {
  const items = [];

  for (const slot of KNOWN_INVENTORY_SLOTS) {
    const slotNbt = formatSlotForNbt(slot);
    const idCommand = `data get entity ${pseudo} Inventory[{Slot:${slotNbt}}].id`;
    const idResponse = await executeRconCommand(idCommand);

    if (/No entity was found/i.test(idResponse)) {
      throw createHttpError("Aucune entite trouvee. Le joueur est probablement hors ligne.", 404);
    }

    if (isMissingSlotResponse(idResponse)) {
      continue;
    }

    const countCommand = `data get entity ${pseudo} Inventory[{Slot:${slotNbt}}].count`;
    const countResponse = await executeRconCommand(countCommand);

    if (/No entity was found/i.test(countResponse)) {
      throw createHttpError("Aucune entite trouvee. Le joueur est probablement hors ligne.", 404);
    }

    const itemId = parseNbtStringValue(idResponse);
    const count = parseNbtNumericValue(countResponse);

    items.push({
      slot,
      ...mapSlotInfo(slot),
      itemId,
      count,
      components: null,
      raw: {
        idResponse,
        countResponse
      }
    });
  }

  return items;
}

async function getPlayerInventory(pseudo) {
  const normalizedPseudo = validatePseudo(pseudo);
  const command = `data get entity ${normalizedPseudo} Inventory`;
  const response = await executeRconCommand(command);

  if (/No entity was found/i.test(String(response || ""))) {
    throw createHttpError("Aucune entite trouvee. Le joueur est probablement hors ligne.", 404);
  }

  let items = [];

  if (!/No items were found/i.test(String(response || ""))) {
    try {
      items = parseInventoryResponse(response).map(normalizeInventoryItem);
    } catch (_error) {
      // Fallback robuste si la sortie SNBT varie selon la version serveur.
      items = await getInventoryByKnownSlots(normalizedPseudo);
    }
  }

  return {
    pseudo: normalizedPseudo,
    count: items.length,
    command,
    response,
    inventory: items,
  };
}

async function removeItemsByClear(pseudo, itemId, amount) {
  const normalizedPseudo = validatePseudo(pseudo);
  const normalizedItemId = validateItemId(itemId);
  const normalizedAmount = validatePositiveInteger(amount, "amount");

  const command = `clear ${normalizedPseudo} ${normalizedItemId} ${normalizedAmount}`;
  const response = await executeRconCommand(command);

  assertNoEntityError(response);

  if (/No items were found/i.test(response)) {
    throw createHttpError("Aucun item trouve. Le joueur a peut-etre deplace ou jete l'item.", 409);
  }

  const removedCount = parseRemovedCount(response);

  if (removedCount === null) {
    throw createHttpError("Transaction non validee: la reponse RCON ne confirme pas la suppression.", 409);
  }

  if (removedCount !== normalizedAmount) {
    throw createHttpError(
      `Transaction non validee: suppression partielle (${removedCount}/${normalizedAmount}).`,
      409
    );
  }

  return {
    pseudo: normalizedPseudo,
    itemId: normalizedItemId,
    amountRequested: normalizedAmount,
    amountRemoved: removedCount,
    command,
    response
  };
}

async function removeItemBySlot(pseudo, slot) {
  const normalizedPseudo = validatePseudo(pseudo);
  const normalizedSlot = validateSlot(slot);
  const target = mapSlotToItemReplaceTarget(normalizedSlot);

  const before = await getItemInSlot(normalizedPseudo, normalizedSlot);

  if (!before) {
    throw createHttpError("Aucun item trouve dans ce slot.", 409);
  }

  const command = `item replace entity ${normalizedPseudo} ${target} with air`;
  const response = await executeRconCommand(command);

  assertNoEntityError(response);

  if (/No items were found/i.test(response)) {
    throw createHttpError("Aucun item trouve. Le joueur a peut-etre deplace ou jete l'item.", 409);
  }

  const after = await getItemInSlot(normalizedPseudo, normalizedSlot);

  if (after && after.count > 0) {
    throw createHttpError("Transaction non validee: le slot contient encore un item apres suppression.", 409);
  }

  return {
    pseudo: normalizedPseudo,
    slot: normalizedSlot,
    removedItemId: before.itemId,
    amountRemoved: before.count,
    command,
    response
  };
}

async function sendMessageToPlayer(pseudo, message) {
  const input = validateSendMessageInput(pseudo, message);
  const command = `msg ${input.pseudo} ${input.message}`;
  const response = await executeRconCommand(command);

  return {
    pseudo: input.pseudo,
    message: input.message,
    command,
    response
  };
}

async function checkPlayerOnlineStatus(pseudo) {
  const normalizedPseudo = validatePseudo(pseudo);
  const command = "list";
  const response = await executeRconCommand(command);

  const playersSegment = String(response || "").split(":").slice(1).join(":").trim();
  const onlinePlayers = playersSegment
    ? playersSegment
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : [];

  const online = onlinePlayers.some(
    (player) => player.toLowerCase() === normalizedPseudo.toLowerCase()
  );

  return {
    pseudo: normalizedPseudo,
    online,
    onlinePlayers,
    command,
    response
  };
}

async function giveHouseBuildToPlayer(pseudo, amount) {
  const normalizedPseudo = validatePseudo(pseudo);
  const normalizedAmount = validatePositiveInteger(amount, "amount");
  const command = `giveplacehouselosakan ${normalizedPseudo} ${normalizedAmount}`;
  const response = await executeRconCommand(command);

  return {
    pseudo: normalizedPseudo,
    amount: normalizedAmount,
    command,
    response
  };
}

module.exports = {
  getPlayerInventory,
  removeItemsByClear,
  removeItemBySlot,
  sendMessageToPlayer,
  checkPlayerOnlineStatus,
  executeRconCommand,
  giveHouseBuildToPlayer
};
