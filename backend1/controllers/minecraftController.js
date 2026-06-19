import {
  requestMinecraftLinkCodeForUser,
  confirmMinecraftLinkCodeForUser,
  getMinecraftLinkStatusForUser,
} from "../services/minecraftService.js";

export async function requestMinecraftLinkCode(req, res, next) {
  const { username, minecraftUsername } = req.validated;

  try {
    const result = await requestMinecraftLinkCodeForUser({ username, minecraftUsername });
    return res.status(201).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return next(error);
  }
}

export async function confirmMinecraftLinkCode(req, res, next) {
  const { username, minecraftUsername, code } = req.validated;

  try {
    const result = await confirmMinecraftLinkCodeForUser({ username, minecraftUsername, code });
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return next(error);
  }
}

export async function minecraftLinkStatus(req, res, next) {
  const { username } = req.validated;

  try {
    const result = await getMinecraftLinkStatusForUser({ username });
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return next(error);
  }
}