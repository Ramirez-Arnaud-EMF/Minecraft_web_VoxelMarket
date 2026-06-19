const { executeRconCommand } = require("../services/rconService");

async function runTemporaryCommand(req, res, next) {
  const command = String(req.body?.command ?? req.query?.command ?? "").trim();

  if (!command) {
    return next(Object.assign(new Error("Le parametre 'command' est requis."), { status: 400 }));
  }

  try {
    const response = await executeRconCommand(command);

    return res.status(200).json({
      ok: true,
      temporary: true,
      command,
      response
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  runTemporaryCommand
};