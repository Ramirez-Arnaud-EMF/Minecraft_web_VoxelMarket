const { Router } = require("express");
const { runTemporaryCommand } = require("../controllers/temporaryCommandController");

const router = Router();

// TEMPORARY: Allows executing a raw Minecraft command via RCON.
// POST /api/temp/command
// Body or query: { command: "time set day" }
router.post("/command", runTemporaryCommand);

module.exports = router;