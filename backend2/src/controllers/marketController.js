const marketService = require("../services/marketService");
const {
  recordPurchaseSuccess,
  recordPurchaseFailure,
  recordSaleSuccess,
  recordSaleFailure,
} = require("../middleware/businessMetrics");

async function listItems(req, res, next) {
  try {
    const items = await marketService.listItems();
    res.json(items);
  } catch (error) {
    next(error);
  }
}

async function listItemsEnVente(req, res, next) {
  try {
    const items = await marketService.listItemsEnVente();
    res.json(items);
  } catch (error) {
    next(error);
  }
}

async function getWallet(req, res, next) {
  try {
    const wallet = await marketService.getWallet(req.params.userId);
    res.json(wallet);
  } catch (error) {
    next(error);
  }
}

async function resolveUser(req, res, next) {
  try {
    const user = await marketService.resolveUser(req.body);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

async function getInventory(req, res, next) {
  try {
    const inventory = await marketService.getInventory(req.params.userId);
    res.json(inventory);
  } catch (error) {
    next(error);
  }
}

async function achat(req, res, next) {
  try {
    const result = await marketService.achat(req.body, req.headers.authorization);
    recordPurchaseSuccess();
    res.status(201).json(result);
  } catch (error) {
    recordPurchaseFailure(error);
    next(error);
  }
}

async function vente(req, res, next) {
  try {
    const result = await marketService.vente(req.body);
    recordSaleSuccess();
    res.status(201).json(result);
  } catch (error) {
    recordSaleFailure(error);
    next(error);
  }
}

async function listTransactions(req, res, next) {
  try {
    const transactions = await marketService.listTransactions(req.query);
    res.json(transactions);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listItems,
  listItemsEnVente,
  getWallet,
  resolveUser,
  getInventory,
  achat,
  vente,
  listTransactions
};