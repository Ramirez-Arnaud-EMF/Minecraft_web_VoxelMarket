const { getConnection } = require("../config/db");
const marketRepository = require("../repositories/marketRepository");
const buildsRepository = require("../repositories/buildsRepository");
const HttpError = require("../utils/httpError");
const { publishBuildPurchase } = require("./rabbitMqService");

function getBackend1Config() {
  return {
    baseUrl: process.env.BACKEND1_BASE_URL || "http://api:3000",
    authPrefix: process.env.BACKEND1_AUTH_PREFIX || "/api/auth"
  };
}

async function fetchBackend1Json(path, options = {}) {
  const backend1 = getBackend1Config();
  const response = await fetch(`${backend1.baseUrl}${backend1.authPrefix}${path}`, options);
  const text = await response.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const statusCode = response.status >= 500 ? 502 : response.status;
    throw new HttpError(statusCode, payload?.message || "Erreur backend1");
  }

  return payload;
}

async function getBackend1Wallet(username) {
  return fetchBackend1Json(`/wallet/${encodeURIComponent(username)}`);
}

async function adjustBackend1Wallet(username, amount) {
  return fetchBackend1Json("/wallet/adjust", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, amount })
  });
}

async function getBackend1MinecraftLinkStatus(username) {
  return fetchBackend1Json(`/minecraft/status/${encodeURIComponent(username)}`);
}

async function getBackend1Session(authorizationHeader) {
  return fetchBackend1Json("/session", {
    headers: {
      Authorization: String(authorizationHeader || "")
    }
  });
}

async function listItems() {
  return marketRepository.listItems();
}

async function listItemsEnVente() {
  return marketRepository.listItemsEnVente();
}

async function getWallet(userId) {
  const user = await marketRepository.getUserById(userId);

  if (!user) {
    throw new HttpError(404, "Utilisateur introuvable");
  }

  const wallet = await getBackend1Wallet(user.username);
  const minecraftStatus = await getBackend1MinecraftLinkStatus(user.username);

  return {
    userId: user.id,
    username: user.username,
    walletBalance: wallet.walletBalance,
    minecraftLinked: minecraftStatus.minecraftLinked,
    minecraftUsername: minecraftStatus.minecraftUsername
  };
}

async function resolveUser(payload) {
  const username = payload.username;
  const user = await marketRepository.getOrCreateUserByUsername(username);
  const wallet = await getBackend1Wallet(user.username);
  const minecraftStatus = await getBackend1MinecraftLinkStatus(user.username);

  return {
    userId: user.id,
    username: user.username,
    walletBalance: wallet.walletBalance,
    minecraftLinked: minecraftStatus.minecraftLinked,
    minecraftUsername: minecraftStatus.minecraftUsername
  };
}

async function getInventory(userId) {
  const user = await marketRepository.getUserById(userId);

  if (!user) {
    throw new HttpError(404, "Utilisateur introuvable");
  }

  const inventory = await marketRepository.getInventoryByUserId(userId);
  return {
    userId: user.id,
    username: user.username,
    inventory
  };
}

function validateAuthenticatedPurchase(auth, user) {
  const authenticatedUsername = String(auth?.username || "").trim().toLowerCase();
  const requestedUsername = String(user?.username || "").trim().toLowerCase();

  if (!authenticatedUsername || !requestedUsername || authenticatedUsername !== requestedUsername) {
    throw new HttpError(403, "Cette session Keycloak ne correspond pas a l'utilisateur demande");
  }
}

async function achat(payload, authorizationHeader) {
  const userId = payload.userId;
  const buildId = payload.buildId;
  const quantity = payload.quantity;

  const connection = await getConnection();
  await connection.beginTransaction();
  let walletDebited = false;
  let totalPrice = 0;
  let walletUsername = null;

  try {
    const user = await marketRepository.getUserById(userId, connection);
    if (!user) {
      throw new HttpError(404, "Utilisateur introuvable");
    }

    const session = await getBackend1Session(authorizationHeader);
    validateAuthenticatedPurchase(session, user);

    const minecraftStatus = await getBackend1MinecraftLinkStatus(user.username);
    if (!minecraftStatus.minecraftLinked || !minecraftStatus.minecraftUsername) {
      throw new HttpError(400, "Le compte Minecraft doit etre lie avant l'achat");
    }

    walletUsername = user.username;

    const wallet = await getBackend1Wallet(user.username);

    const build = await buildsRepository.getBuildById(buildId, connection);
    if (!build) {
      throw new HttpError(404, "Build introuvable");
    }

    const unitPrice = Number(build.prix_build);
    totalPrice = Number((unitPrice * quantity).toFixed(2));
    if (Number(wallet.walletBalance) < totalPrice) {
      throw new HttpError(400, "Solde insuffisant pour cet achat");
    }

    const adjustedWallet = await adjustBackend1Wallet(user.username, -totalPrice);
    walletDebited = true;

    await publishBuildPurchase({
      userId,
      username: user.username,
      minecraftUsername: minecraftStatus.minecraftUsername,
      buildId,
      buildName: build.nom,
      quantity,
      unitPrice,
      totalPrice,
      purchasedAt: new Date().toISOString()
    });

    const inventoryId = await buildsRepository.createInventoryBuildEntry(
      userId,
      buildId,
      quantity,
      connection
    );

    await connection.commit();
    connection.release();

    return {
      type: "achat-build",
      userId,
      buildId,
      buildName: build.nom,
      inventoryId,
      quantity,
      unitPrice,
      totalAmount: -totalPrice,
      walletBalance: adjustedWallet.walletBalance,
      queue: process.env.RABBITMQ_BUILD_PURCHASE_QUEUE || "voxelmarket.build.purchase"
    };
  } catch (error) {
    await connection.rollback();
    connection.release();

    if (walletDebited) {
      try {
        await adjustBackend1Wallet(walletUsername, totalPrice);
      } catch (refundError) {
        console.error("Echec de compensation du portefeuille apres erreur d'achat", refundError);
        throw new HttpError(502, "Achat interrompu apres debit. Compensation manuelle requise.");
      }
    }

    throw error;
  }
}

async function vente(payload) {
  const userId = payload.userId;
  const minecraftItemId = payload.minecraftItemId;
  const quantity = payload.quantity;

  // Vérifie que l'item est dans la liste des items en vente
  const itemEnVente = await marketRepository.getItemEnVenteByMinecraftId(minecraftItemId);
  if (!itemEnVente) {
    throw new HttpError(404, `L'item '${minecraftItemId}' n'est pas autorisé à la vente`);
  }

  const user = await marketRepository.getUserById(userId);
  if (!user) {
    throw new HttpError(404, "Utilisateur introuvable");
  }

  const minecraftStatus = await getBackend1MinecraftLinkStatus(user.username);
  const minecraftUsername = minecraftStatus.minecraftUsername;

  if (!minecraftStatus.minecraftLinked || !minecraftUsername) {
    throw new HttpError(400, "Aucun compte Minecraft lié à cet utilisateur");
  }

  // Appel backend3 pour retirer l'item de l'inventaire Minecraft
  const backend3Url = process.env.BACKEND3_BASE_URL || "http://backend3:3003";
  const backend3Response = await fetch(
    `${backend3Url}/api/inventory/${encodeURIComponent(minecraftUsername)}/items`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: minecraftItemId, amount: quantity })
    }
  );

  if (!backend3Response.ok) {
    const errorBody = await backend3Response.json().catch(() => ({}));
    throw new HttpError(
      502,
      errorBody.message || "Échec de la suppression de l'item dans Minecraft"
    );
  }

  // Crédite le portefeuille
  const totalPrice = itemEnVente.prix_vente * quantity;
  const adjustedWallet = await adjustBackend1Wallet(user.username, totalPrice);

  return {
    type: "vente",
    userId,
    minecraftUsername,
    minecraftItemId,
    nomItem: itemEnVente.nom_affichage,
    quantity,
    unitPrice: itemEnVente.prix_vente,
    totalAmount: totalPrice,
    walletBalance: adjustedWallet.walletBalance
  };
}

async function listTransactions(query) {
  const filters = {};

  if (query.userId !== undefined) {
    filters.userId = query.userId;
  }

  if (query.type !== undefined) {
    filters.type = query.type;
  }

  return marketRepository.listTransactions(filters);
}

module.exports = {
  listItems,
  listItemsEnVente,
  getWallet,
  resolveUser,
  getInventory,
  achat,
  vente,
  listTransactions
};
