const { Router } = require("express");
const { giveBuild } = require("../controllers/buildController");

const router = Router();

// POST /api/build/give
// Body or query: { pseudo, amount }
router.post("/give", giveBuild);

module.exports = router;