const mysql = require("mysql2/promise");

let pool;

async function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || "market_user",
      password: process.env.DB_PASSWORD || "market_password",
      database: process.env.DB_NAME || "DB_MINECRAFT",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      supportBigNumbers: true,
      bigNumberStrings: true
    });
  }

  return pool;
}

async function getConnection() {
  const pool = await getPool();
  return await pool.getConnection();
}

module.exports = {
  getConnection,
  getPool
};