const { getConnection } = require("../config/db");

async function listAvailableBuilds() {
  const connection = await getConnection();

  try {
    const [rows] = await connection.execute(
      `SELECT pk_build, nom, categorie, description, prix_build
       FROM t_build
       ORDER BY nom ASC`
    );
    return rows;
  } finally {
    connection.release();
  }
}

async function getBuildById(buildId, externalConnection) {
  const connection = externalConnection || (await getConnection());

  try {
    const [rows] = await connection.execute(
      `SELECT pk_build, nom, categorie, description, prix_build
       FROM t_build
       WHERE pk_build = ?
       LIMIT 1`,
      [buildId]
    );
    return rows[0] || null;
  } finally {
    if (!externalConnection) {
      connection.release();
    }
  }
}

async function createInventoryBuildEntry(clientId, buildId, quantity, externalConnection) {
  const connection = externalConnection || (await getConnection());

  try {
    const [result] = await connection.execute(
      `INSERT INTO t_inventaire_build (fk_client, fk_build, quantite_disponible)
       VALUES (?, ?, ?)`,
      [clientId, buildId, quantity]
    );
    return result.insertId;
  } finally {
    if (!externalConnection) {
      connection.release();
    }
  }
}

module.exports = {
  listAvailableBuilds,
  getBuildById,
  createInventoryBuildEntry
};
