const {
  getPlayerInventory,
  removeItemsByClear,
  removeItemBySlot
} = require("../services/rconService");

async function getInventory(req, res, next) {
  const pseudo = req.params?.pseudo;

  try {
    const result = await getPlayerInventory(pseudo);
    return res.status(200).json({
      ok: true,
      ...result
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteInventoryItems(req, res, next) {
  const pseudo = req.params?.pseudo;
  const itemId = req.body?.itemId ?? req.query?.itemId;
  const amount = req.body?.amount ?? req.query?.amount;

  try {
    const result = await removeItemsByClear(pseudo, itemId, amount);
    return res.status(200).json({
      ok: true,
      mode: "clear",
      ...result
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteInventorySlot(req, res, next) {
  const pseudo = req.params?.pseudo ?? req.body?.pseudo ?? req.query?.pseudo;
  const slot = req.params?.slot ?? req.body?.slot ?? req.query?.slot;

  try {
    const result = await removeItemBySlot(pseudo, slot);
    return res.status(200).json({
      ok: true,
      mode: "slot",
      ...result
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getInventory,
  deleteInventoryItems,
  deleteInventorySlot
};