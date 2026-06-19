import { getWalletForUser, adjustWalletForUser } from "../services/walletService.js";

export async function walletStatus(req, res, next) {
  const { username } = req.validated;

  try {
    const result = await getWalletForUser({ username });
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return next(error);
  }
}

export async function walletAdjust(req, res, next) {
  const { username, amount } = req.validated;

  try {
    const result = await adjustWalletForUser({ username, amount });
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return next(error);
  }
}