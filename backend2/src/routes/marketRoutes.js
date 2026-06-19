const express = require("express");
const marketController = require("../controllers/marketController");
const {
	validateWalletOrInventoryUserId,
	validateResolveUser,
	validateAchat,
	validateVente,
	validateTransactionsQuery
} = require("../middleware/requestValidation");

const router = express.Router();

router.get("/items", marketController.listItems);

router.get("/items-en-vente", marketController.listItemsEnVente);

router.get("/users/:userId/wallet", validateWalletOrInventoryUserId, marketController.getWallet);

router.post("/users/resolve", validateResolveUser, marketController.resolveUser);

router.get("/users/:userId/inventory", validateWalletOrInventoryUserId, marketController.getInventory);

router.post("/achat", validateAchat, marketController.achat);

router.post("/vente", validateVente, marketController.vente);

router.get("/transactions", validateTransactionsQuery, marketController.listTransactions);

module.exports = router;
