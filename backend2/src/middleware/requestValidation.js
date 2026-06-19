const HttpError = require("../utils/httpError");

function parsePositiveInt(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, `${fieldName} doit etre un entier strictement positif`);
  }
  return parsed;
}

function normalizeUsername(value) {
  const username = String(value || "").trim();
  if (!username) {
    throw new HttpError(400, "username est obligatoire");
  }
  if (username.length > 255) {
    throw new HttpError(400, "username est trop long");
  }
  return username;
}

function normalizeMinecraftItemId(value) {
  const minecraftItemId = String(value || "").trim();
  if (!minecraftItemId) {
    throw new HttpError(400, "minecraftItemId est obligatoire (ex: minecraft:dirt)");
  }
  return minecraftItemId;
}

function validateWalletOrInventoryUserId(req, res, next) {
  try {
    req.params.userId = parsePositiveInt(req.params.userId, "userId");
    next();
  } catch (error) {
    next(error);
  }
}

function validateResolveUser(req, res, next) {
  try {
    req.body = {
      ...(req.body || {}),
      username: normalizeUsername(req.body?.username)
    };
    next();
  } catch (error) {
    next(error);
  }
}

function validateAchat(req, res, next) {
  try {
    const buildIdInput = req.body?.buildId ?? req.body?.itemId;
    req.body = {
      ...(req.body || {}),
      userId: parsePositiveInt(req.body?.userId, "userId"),
      buildId: parsePositiveInt(buildIdInput, "buildId"),
      quantity: parsePositiveInt(req.body?.quantity, "quantity")
    };
    next();
  } catch (error) {
    next(error);
  }
}

function validateVente(req, res, next) {
  try {
    req.body = {
      ...(req.body || {}),
      userId: parsePositiveInt(req.body?.userId, "userId"),
      minecraftItemId: normalizeMinecraftItemId(req.body?.minecraftItemId),
      quantity: parsePositiveInt(req.body?.quantity, "quantity")
    };
    next();
  } catch (error) {
    next(error);
  }
}

function validateTransactionsQuery(req, res, next) {
  try {
    const nextQuery = { ...(req.query || {}) };

    if (nextQuery.userId !== undefined) {
      nextQuery.userId = parsePositiveInt(nextQuery.userId, "userId");
    }

    if (nextQuery.type !== undefined) {
      if (!["achat", "vente"].includes(nextQuery.type)) {
        throw new HttpError(400, "type doit etre 'achat' ou 'vente'");
      }
    }

    req.query = nextQuery;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  validateWalletOrInventoryUserId,
  validateResolveUser,
  validateAchat,
  validateVente,
  validateTransactionsQuery
};