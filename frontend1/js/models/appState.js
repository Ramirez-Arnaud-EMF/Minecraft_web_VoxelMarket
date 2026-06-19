export const demoAccounts = {
  steve: {
    userId: 1,
    username: "steve",
    email: "steve@voxelmarket.local",
    minecraftLinked: true,
    walletBalance: 1000,
    isDemo: true,
  },
  alex: {
    userId: 2,
    username: "alex",
    email: "alex@voxelmarket.local",
    minecraftLinked: false,
    walletBalance: 700,
    isDemo: true,
  },
};

export const state = {
  view: "market",
  authMode: "login",
  session: null,
  items: [],
  inventory: [],
  sellableItems: [],
  pendingLinkMinecraftUsername: "",
};

export function resolveBackendUserId(username) {
  const normalized = String(username || "")
    .trim()
    .toLowerCase();
  return demoAccounts[normalized]?.userId ?? null;
}
