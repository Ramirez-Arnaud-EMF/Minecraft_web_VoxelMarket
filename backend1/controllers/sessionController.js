import { validateAccessTokenSession } from "../services/sessionService.js";

export async function sessionStatus(req, res, next) {
  try {
    const session = await validateAccessTokenSession(req.headers.authorization);
    return res.status(200).json(session);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return next(error);
  }
}