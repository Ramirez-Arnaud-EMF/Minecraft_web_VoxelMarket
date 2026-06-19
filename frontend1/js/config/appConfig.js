export const API_BASE = window.VOXELMARKET_API_BASE || "http://localhost:3002/api";
export const INVENTORY_API_BASE =
  window.VOXELMARKET_INVENTORY_API_BASE || "http://localhost:3003/api";
export const LINK_API_BASE =
  window.VOXELMARKET_LINK_API_BASE || "http://localhost:3001/api/auth/minecraft";
export const SESSION_KEY = "voxelmarket.session";
export const MC_SERVER_IP =
  window.VOXELMARKET_MC_SERVER_IP || "play.voxelmarket.local:25565";
export const SIMULATED_ONLINE_PLAYERS = new Set(
  (window.VOXELMARKET_ONLINE_PLAYERS || ["steve_mc"]).map((value) =>
    String(value).trim().toLowerCase(),
  ),
);
