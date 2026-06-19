const { giveHouseBuildToPlayer } = require("../services/rconService");

async function giveBuild(req, res, next) {
  const pseudo = String(req.body?.pseudo ?? req.query?.pseudo ?? "").trim();
  const amount = req.body?.amount ?? req.query?.amount;

  try {
    const result = await giveHouseBuildToPlayer(pseudo, amount);

    return res.status(200).json({
      ok: true,
      ...result
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  giveBuild
};