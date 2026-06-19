import mysql from "mysql2/promise";

// Connexion pool vers la base de donnees client (DB_COMPTES)
const pool = mysql.createPool({
    host: process.env.DB_CLIENT_HOST || "localhost",
    port: Number(process.env.DB_CLIENT_PORT) || 3307,
    user: process.env.DB_CLIENT_USER || "client_user",
    password: process.env.DB_CLIENT_PASSWORD || "client_password",
    database: process.env.DB_CLIENT_NAME || "DB_COMPTES",
    waitForConnections: true,
    connectionLimit: 10,
});

export default pool;
