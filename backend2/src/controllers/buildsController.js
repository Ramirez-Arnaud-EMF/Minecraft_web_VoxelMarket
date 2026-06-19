const buildsService = require("../services/buildsService");

async function listAvailableBuilds(req, res, next) {
  try {
    const builds = await buildsService.getAvailableBuilds();
    res.status(200).json(builds);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listAvailableBuilds
};
