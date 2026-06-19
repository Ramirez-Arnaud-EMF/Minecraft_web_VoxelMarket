const { Router } = require("express");
const {
	sendMessage,
	checkPlayerOnline
} = require("../controllers/messageController");

const router = Router();

// POST /api/messages/send
// Accepts either JSON body or query parameters:
// { pseudo: "playerName", message: "Bonjour" }
router.post("/send", sendMessage);

// GET /api/messages/online/:pseudo
// Also supports ?pseudo=playerName and JSON body { pseudo: "playerName" }
router.get("/online/:pseudo?", checkPlayerOnline);

module.exports = router;
