import mysql from "mysql2/promise";

// Connexion pool vers la base de donnees Minecraft (DB_MINECRAFT)
const poolMinecraft = mysql.createPool({
    host: process.env.DB_MC_HOST || "localhost",
    port: Number(process.env.DB_MC_PORT) || 3308,
    user: process.env.DB_MC_USER || "market_user",
    password: process.env.DB_MC_PASSWORD || "market_password",
    database: process.env.DB_MC_NAME || "DB_MINECRAFT",
    waitForConnections: true,
    connectionLimit: 10,
});

export default poolMinecraft;
