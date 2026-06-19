const {
  sendMessageToPlayer,
  checkPlayerOnlineStatus
} = require("../services/rconService");

async function sendMessage(req, res, next) {
  // Support query params and JSON body for flexibility.
  const pseudo = req.body?.pseudo ?? req.query?.pseudo;
  const message = req.body?.message ?? req.query?.message;

  try {
    const result = await sendMessageToPlayer(pseudo, message);
    return res.status(200).json({
      ok: true,
      ...result
    });
  } catch (error) {
    return next(error);
  }
}

async function checkPlayerOnline(req, res, next) {
  // Support path param, query params and JSON body for flexibility.
  const pseudo = req.params?.pseudo ?? req.query?.pseudo ?? req.body?.pseudo;

  try {
    const result = await checkPlayerOnlineStatus(pseudo);
    return res.status(200).json({
      ok: true,
      ...result
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  sendMessage,
  checkPlayerOnline
};
