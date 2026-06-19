const RCON_HOST = process.env.RCON_HOST || "minecraft";
const RCON_PORT = Number(process.env.RCON_PORT || 25575);
const RCON_PASSWORD = process.env.RCON_PASSWORD || "emf1234";

module.exports = {
  RCON_HOST,
  RCON_PORT,
  RCON_PASSWORD
};
