function badRequest(res, message) {
  return res.status(400).json({ message });
}

function normalizeUsername(value) {
  return String(value ?? "").trim();
}

function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeCode(value) {
  return String(value ?? "").trim();
}

export function validateRegisterRequest(req, res, next) {
  const { username, email, password } = req.body ?? {};

  if (!username || !email || !password) {
    return badRequest(res, "Pseudo, email et mot de passe requis.");
  }

  if (String(password).length < 6) {
    return badRequest(res, "Le mot de passe doit contenir au moins 6 caracteres.");
  }

  const normalizedUsername = normalizeUsername(username);
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedUsername || !normalizedEmail) {
    return badRequest(res, "Pseudo et email invalides.");
  }

  req.validated = {
    ...(req.validated || {}),
    username: normalizedUsername,
    email: normalizedEmail,
    password: String(password),
  };
  return next();
}

export function validateLoginRequest(req, res, next) {
  const { username, password } = req.body ?? {};
  const normalizedUsername = normalizeUsername(username);

  if (!normalizedUsername || !password) {
    return badRequest(res, "Username et password requis.");
  }

  req.validated = {
    ...(req.validated || {}),
    username: normalizedUsername,
    password: String(password),
  };
  return next();
}

export function validateMinecraftRequestCode(req, res, next) {
  const { username, minecraftUsername } = req.body ?? {};
  const normalizedUsername = normalizeUsername(username);
  const normalizedMinecraftUsername = normalizeUsername(minecraftUsername);

  if (!normalizedUsername || !normalizedMinecraftUsername) {
    return badRequest(res, "username et minecraftUsername requis.");
  }

  if (!/^[a-zA-Z0-9_]{3,16}$/.test(normalizedMinecraftUsername)) {
    return badRequest(res, "minecraftUsername invalide (3-16 caracteres, lettres/chiffres/_ seulement).");
  }

  req.validated = {
    ...(req.validated || {}),
    username: normalizedUsername,
    minecraftUsername: normalizedMinecraftUsername,
  };
  return next();
}

export function validateMinecraftConfirm(req, res, next) {
  const { username, minecraftUsername, code } = req.body ?? {};
  const normalizedUsername = normalizeUsername(username);
  const normalizedMinecraftUsername = normalizeUsername(minecraftUsername);
  const normalizedCode = normalizeCode(code);

  if (!normalizedUsername || !normalizedMinecraftUsername || !normalizedCode) {
    return badRequest(res, "username, minecraftUsername et code requis.");
  }

  if (!/^[a-zA-Z0-9_]{3,16}$/.test(normalizedMinecraftUsername)) {
    return badRequest(res, "minecraftUsername invalide (3-16 caracteres, lettres/chiffres/_ seulement).");
  }

  if (!/^\d{6}$/.test(normalizedCode)) {
    return badRequest(res, "Code invalide (6 chiffres requis).");
  }

  req.validated = {
    ...(req.validated || {}),
    username: normalizedUsername,
    minecraftUsername: normalizedMinecraftUsername,
    code: normalizedCode,
  };
  return next();
}

export function validateUsernameParam(req, res, next) {
  const normalizedUsername = normalizeUsername(req.params?.username);

  if (!normalizedUsername) {
    return badRequest(res, "username requis.");
  }

  req.validated = {
    ...(req.validated || {}),
    username: normalizedUsername,
  };
  return next();
}

export function validateWalletAdjust(req, res, next) {
  const { username, amount } = req.body ?? {};
  const normalizedUsername = normalizeUsername(username);

  if (!normalizedUsername || amount === undefined) {
    return badRequest(res, "username et amount requis.");
  }

  const normalizedAmount = Number(amount);
  if (!Number.isFinite(normalizedAmount) || normalizedAmount === 0) {
    return badRequest(res, "amount invalide.");
  }

  req.validated = {
    ...(req.validated || {}),
    username: normalizedUsername,
    amount: Number(normalizedAmount.toFixed(2)),
  };
  return next();
}