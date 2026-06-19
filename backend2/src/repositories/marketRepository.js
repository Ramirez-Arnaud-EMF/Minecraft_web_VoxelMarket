const { getConnection } = require("../config/db");

let usersTableEnsured = false;

async function ensureUsersTable(connection) {
  if (usersTableEnsured) {
    return;
  }

  await connection.execute(
    `CREATE TABLE IF NOT EXISTS users (
       id INT AUTO_INCREMENT PRIMARY KEY,
       username VARCHAR(255) NOT NULL UNIQUE,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );

  usersTableEnsured = true;
}

async function withConnection(externalConnection, operation) {
  const connection = externalConnection || await getConnection();
  try {
    return await operation(connection);
  } finally {
    if (!externalConnection) {
      connection.release();
    }
  }
}

async function getUserById(userId, externalConnection) {
  return withConnection(externalConnection, async (connection) => {
    await ensureUsersTable(connection);
    const [rows] = await connection.execute(
      "SELECT id, username FROM users WHERE id = ?",
      [userId]
    );
    return rows[0] || null;
  });
}

async function getOrCreateUserByUsername(username) {
  const connection = await getConnection();
  try {
    await ensureUsersTable(connection);
    const [result] = await connection.execute(
      `INSERT INTO users (username)
       VALUES (?)
       ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), username = VALUES(username)`,
      [username]
    );
    return getUserById(result.insertId, connection);
  } finally {
    connection.release();
  }
}

async function listItems() {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(
      "SELECT id, name, buy_price, sell_price, is_active FROM items WHERE is_active = 1 ORDER BY name"
    );
    return rows;
  } finally {
    connection.release();
  }
}

async function getInventoryByUserId(userId) {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT i.item_id, it.name, i.quantity
       FROM inventories i
       INNER JOIN items it ON it.id = i.item_id
       WHERE i.user_id = ? AND i.quantity > 0
       ORDER BY it.name`,
      [userId]
    );
    return rows;
  } finally {
    connection.release();
  }
}

async function listItemsEnVente() {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(
      "SELECT pk_item, item_id, nom_affichage, prix_vente FROM t_item_en_vente ORDER BY nom_affichage"
    );
    return rows;
  } finally {
    connection.release();
  }
}

async function getItemEnVenteByMinecraftId(minecraftItemId, externalConnection) {
  return withConnection(externalConnection, async (connection) => {
    const [rows] = await connection.execute(
      "SELECT pk_item, item_id, nom_affichage, prix_vente FROM t_item_en_vente WHERE item_id = ?",
      [minecraftItemId]
    );
    return rows[0] || null;
  });
}

async function listTransactions(filters = {}) {
  const connection = await getConnection();
  const whereClauses = [];
  const params = [];

  if (filters.userId) {
    whereClauses.push("t.user_id = ?");
    params.push(filters.userId);
  }

  if (filters.type) {
    whereClauses.push("t.type = ?");
    params.push(filters.type);
  }

  const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  try {
    const [rows] = await connection.execute(
      `SELECT t.id, t.user_id, u.username, t.item_id, i.name as item_name, t.type, t.quantity,
              t.unit_price, t.total_amount, t.created_at
       FROM transactions t
       INNER JOIN users u ON u.id = t.user_id
       INNER JOIN items i ON i.id = t.item_id
       ${where}
       ORDER BY t.created_at DESC, t.id DESC`,
      params
    );
    return rows;
  } finally {
    connection.release();
  }
}

module.exports = {
  getUserById,
  getOrCreateUserByUsername,
  listItems,
  listItemsEnVente,
  getInventoryByUserId,
  listTransactions,
  getItemEnVenteByMinecraftId
};
