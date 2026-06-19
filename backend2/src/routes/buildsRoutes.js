const express = require("express");
const buildsController = require("../controllers/buildsController");

const router = express.Router();

router.get("/builds-disponibles", buildsController.listAvailableBuilds);

module.exports = router;
