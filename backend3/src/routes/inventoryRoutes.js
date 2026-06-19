const { Router } = require("express");
const {
	getInventory,
	deleteInventoryItems,
	deleteInventorySlot
} = require("../controllers/inventoryController");

const router = Router();

// DELETE /api/inventory/:pseudo/items
// Body or query: { itemId, amount }
router.delete("/:pseudo/items", deleteInventoryItems);

// DELETE /api/inventory/slots/:slot
// DELETE /api/inventory/:pseudo/slots/:slot
// Body or query fallback: { pseudo, slot }
router.delete("/slots/:slot", deleteInventorySlot);
router.delete("/:pseudo/slots/:slot", deleteInventorySlot);

// GET /api/inventory/:pseudo
router.get("/:pseudo", getInventory);

module.exports = router;