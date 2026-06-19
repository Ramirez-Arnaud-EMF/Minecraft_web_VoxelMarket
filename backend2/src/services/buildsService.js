const buildsRepository = require("../repositories/buildsRepository");

function mapBuildRow(row) {
  return {
    id: row.pk_build,
    name: row.nom,
    category: row.categorie,
    description: row.description,
    buy_price: Number(row.prix_build)
  };
}

async function getAvailableBuilds() {
  const rows = await buildsRepository.listAvailableBuilds();
  return rows.map(mapBuildRow);
}

module.exports = {
  getAvailableBuilds
};
