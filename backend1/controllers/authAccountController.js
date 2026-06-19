import { getPublicConfig, registerUser, loginUser } from "../services/authAccountService.js";
import {
  recordAccountRegistrationSuccess,
  recordAccountRegistrationFailure,
  recordAccountLoginSuccess,
  recordAccountLoginFailure,
} from "../middlewares/businessMetrics.js";

export function config(_req, res) {
  const publicConfig = getPublicConfig();
  return res.status(200).json(publicConfig);
}

export async function register(req, res, next) {
  const { username, email, password } = req.validated;

  try {
    const user = await registerUser(username, email, password);
    recordAccountRegistrationSuccess();
    return res.status(201).json({ message: "Compte cree avec succes.", user });
  } catch (error) {
    recordAccountRegistrationFailure(error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return next(error);
  }
}

export async function login(req, res, next) {
  const { username, password } = req.validated;

  try {
    const tokens = await loginUser(username, password);
    recordAccountLoginSuccess();
    return res.status(200).json(tokens);
  } catch (error) {
    recordAccountLoginFailure(error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
        details: error.details,
      });
    }
    return next(error);
  }
}