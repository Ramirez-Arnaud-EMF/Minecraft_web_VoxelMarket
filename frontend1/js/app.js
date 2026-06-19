import { bindAuthView, setAuthMode } from "./controllers/authController.js";
import { loadAvailableBuilds } from "./controllers/buildsController.js";
import { state } from "./models/appState.js";
import { MC_SERVER_IP } from "./config/appConfig.js";
import { loadSession, saveSession, clearSession } from "./services/sessionService.js";
import { getMinecraftLinkStatus } from "./services/authService.js";
import {
  getWallet,
  resolveMarketUser,
  buyBuild,
  getItemsEnVente,
  sellItem,
} from "./services/marketService.js";
import {
  requestMinecraftLinkCode,
  confirmMinecraftLink,
} from "./services/minecraftLinkService.js";
import {
  fetchInventoryByPseudo,
  logInventoryForSession,
} from "./services/inventoryService.js";
import { showToast, setLoading, escapeHtml, formatPoints } from "./views/uiView.js";
import { renderAccount as renderAccountView } from "./views/accountView.js";
import { renderInventory as renderInventoryView } from "./views/inventoryView.js";
import { renderCatalog as renderCatalogView } from "./views/catalogView.js";

const app = document.getElementById("app");

async function loadPage(page) {
  const response = await fetch(`./pages/${page}.html`);
  if (!response.ok) {
    throw new Error(`Impossible de charger la page ${page}`);
  }
  app.innerHTML = await response.text();
  state.view = page;
  bindCurrentView();
}

function bindCurrentView() {
  if (state.view === "login") {
    bindLoginView();
    return;
  }

  if (state.view === "market") {
    bindMarketView();
    return;
  }

  if (state.view === "inventory") {
    bindInventoryView();
    return;
  }

  if (state.view === "link-minecraft") {
    bindLinkMinecraftView();
  }
}

function setScreen(view) {
  state.view = view;
  app.dataset.view = view;
}

function renderAccount() {
  renderAccountView({
    session: state.session,
    onLinkNow: () => {
      void renderLinkMinecraftView();
    },
  });
}

function renderInventory() {
  renderInventoryView(state.inventory, {
    sellableItems: state.sellableItems || [],
    onSell: sellInventoryItem,
    walletBalance: state.session?.walletBalance || 0,
  });
}

function renderCatalog() {
  renderCatalogView({
    items: state.items,
    session: state.session,
    onBuy: buyItem,
  });
}

async function ensureMarketSessionUser() {
  if (!state.session?.username) {
    return null;
  }

  if (state.session.userId) {
    return state.session.userId;
  }

  const marketUser = await resolveMarketUser(state.session.username);
  state.session.userId = marketUser.userId;
  state.session.username = marketUser.username || state.session.username;
  state.session.walletBalance = marketUser.walletBalance;
  state.session.linkedMinecraft = Boolean(marketUser.minecraftLinked);
  state.session.minecraftUsername = marketUser.minecraftUsername || null;
  saveSession(state.session);

  return state.session.userId;
}

async function syncMinecraftLinkStatus() {
  if (!state.session?.username) {
    return;
  }

  const status = await getMinecraftLinkStatus(state.session.username);
  state.session.linkedMinecraft = Boolean(status.minecraftLinked);
  state.session.minecraftUsername = status.minecraftUsername || null;
  saveSession(state.session);
}

async function loadWalletAndInventory() {
  if (state.session?.username && !state.session.userId) {
    try {
      await ensureMarketSessionUser();
    } catch (error) {
      state.inventory = [];
      renderAccount();
      renderInventory();
      showToast(error.message, "error");
      return;
    }
  }

  if (!state.session?.userId) {
    state.inventory = [];
    renderAccount();
    renderInventory();
    return;
  }

  try {
    const walletResponse = await getWallet(state.session.userId);

    state.session.walletBalance = walletResponse.walletBalance;
    state.session.username = walletResponse.username || state.session.username;
    // Keep a previously confirmed link unless backend1 explicitly reports otherwise.
    state.session.linkedMinecraft =
      Boolean(state.session.linkedMinecraft) || Boolean(walletResponse.minecraftLinked);
    state.session.minecraftUsername = walletResponse.minecraftUsername || null;

    try {
      await syncMinecraftLinkStatus();
    } catch {
      // Keep market values if backend1 status cannot be fetched.
    }

    try {
      const inventoryPseudo = state.session.minecraftUsername || state.session.username;
      const inventoryData = await fetchInventoryByPseudo(inventoryPseudo);
      state.inventory = inventoryData.inventory || [];
    } catch (error) {
      state.inventory = [];
      showToast(error.message, "error");
    }

    saveSession(state.session);
  } catch (error) {
    showToast(error.message, "error");
  }

  renderAccount();
  renderInventory();
}

async function loadItems() {
  const catalogStatus = document.getElementById("catalogStatus");
  if (catalogStatus) catalogStatus.textContent = "Chargement des builds...";

  try {
    state.items = await loadAvailableBuilds();
    renderCatalog();
  } catch (error) {
    if (catalogStatus) catalogStatus.textContent = error.message;
    showToast(error.message, "error");
  }
}

async function loadSellableItems() {
  try {
    state.sellableItems = await getItemsEnVente();
  } catch {
    state.sellableItems = [];
  }
}

async function sellInventoryItem(minecraftItemId, button) {
  if (!state.session?.userId) {
    showToast("Connecte-toi avant de vendre.", "error");
    return;
  }

  if (!state.session.linkedMinecraft) {
    showToast("Le compte Minecraft doit etre lié pour vendre.", "error");
    return;
  }

  setLoading(button, true, "Vente en cours...");
  try {
    const result = await sellItem({
      userId: state.session.userId,
      minecraftItemId,
      quantity: 1,
      minecraftUsername: state.session.minecraftUsername,
    });

    state.session.walletBalance = result.walletBalance;
    saveSession(state.session);
    renderAccount();
    await loadWalletAndInventory();
    showToast(`Vendu : ${result.nomItem ?? minecraftItemId} pour ${result.unitPrice} pts.`, "success");
  } catch (error) {
    showToast(error.message, "error");
    setLoading(button, false, `<i class="bi bi-currency-exchange"></i> Vendre`);
  }
}

async function buyItem(itemId, button) {
  if (state.session?.username && !state.session.userId) {
    await ensureMarketSessionUser();
  }

  if (!state.session?.userId) {
    showToast("Connecte-toi avant d'acheter.", "error");
    return;
  }

  if (!state.session.linkedMinecraft) {
    showToast("Le compte Minecraft doit etre lie avant l'achat.", "error");
    return;
  }

  setLoading(button, true, "Achat en cours");
  try {
    const accessToken = state.session.accessToken || state.session.access_token;
    const tokenType = state.session.tokenType || state.session.token_type || "Bearer";

    const result = await buyBuild({
      userId: state.session.userId,
      buildId: itemId,
      quantity: 1,
      accessToken,
      tokenType,
    });

    state.session.walletBalance = result.walletBalance;
    saveSession(state.session);
    renderAccount();
    await loadWalletAndInventory();
    showToast(`Achat valide pour le build #${itemId}.`, "success");
  } catch (error) {
    if (error.code === "TOKEN_EXPIRED") {
      await logoutDueToExpiredToken();
      return;
    }
    const message = String(error?.message || "");
    if (/Session Keycloak|Authorization invalide|reconnecte-toi|401/i.test(message)) {
      showToast("Session invalide pour l'achat. Reconnecte-toi puis reessaie.", "error");
      return;
    }

    showToast(error.message, "error");
  } finally {
    setLoading(button, false, "Acheter");
    renderCatalog();
  }
}

function bindLoginView() {
  bindAuthView({
    state,
    setLoading,
    showToast,
    onAuthenticated: async ({ username, email, tokens }) => {
      state.session = {
        userId: null,
        username,
        email,
        walletBalance: 0,
        linkedMinecraft: false,
        minecraftUsername: null,
        source: "backend1",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenType: tokens.token_type,
        expiresIn: tokens.expires_in,
      };

      await ensureMarketSessionUser();
      try {
        await syncMinecraftLinkStatus();
      } catch {
        // Non-blocking: user can still use the app even if status sync fails.
      }
      saveSession(state.session);
      showToast("Connexion reussie.", "success");
      await renderMarketView();
    },
  });
}

function bindNavigationRoutes() {
  const routeButtons = Array.from(document.querySelectorAll("[data-route]"));

  routeButtons.forEach((button) => {
    const route = button.getAttribute("data-route");
    if (route === state.view) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }

    button.addEventListener("click", async () => {
      if (route === "market") {
        await renderMarketView();
        return;
      }

      if (route === "inventory") {
        await renderInventoryViewPage();
      }
    });
  });
}

function bindLogout(button) {
  button?.addEventListener("click", async () => {
    clearSession();
    state.session = null;
    state.items = [];
    state.inventory = [];
    await renderLoginView();
  });
}

async function logoutDueToExpiredToken() {
  clearSession();
  state.session = null;
  state.items = [];
  state.inventory = [];
  showToast("Ta session a expiré. Reconnecte-toi.", "error");
  await renderLoginView();
}

function bindMarketView() {
  const logoutButton = document.getElementById("logoutButton");
  const refreshItemsButton = document.getElementById("refreshItemsButton");
  const serverIpInfo = document.getElementById("serverIpInfo");

  if (serverIpInfo) {
    serverIpInfo.textContent = `IP: ${MC_SERVER_IP}`;
  }

  bindLogout(logoutButton);

  refreshItemsButton?.addEventListener("click", loadItems);

  bindNavigationRoutes();
}

function bindInventoryView() {
  const logoutButton = document.getElementById("logoutButton");
  const refreshInventoryButton = document.getElementById("refresh-inv");
  const serverIpInfo = document.getElementById("serverIpInfo");

  if (serverIpInfo) {
    serverIpInfo.textContent = `IP: ${MC_SERVER_IP}`;
  }

  bindLogout(logoutButton);

  refreshInventoryButton?.addEventListener("click", async () => {
    setLoading(refreshInventoryButton, true, "Actualisation...");
    try {
      const inventoryPseudo = state.session?.minecraftUsername || state.session?.username;
      if (!inventoryPseudo) {
        showToast("Aucun pseudo disponible pour charger l'inventaire.", "error");
        return;
      }
      const inventoryData = await fetchInventoryByPseudo(inventoryPseudo);
      state.inventory = inventoryData.inventory || [];
      renderInventory();
      showToast("Inventaire actualisé.", "success");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(refreshInventoryButton, false, "Rafraîchir l'inventaire");
    }
  });

  bindNavigationRoutes();
}

function bindLinkMinecraftView() {
  console.debug("[link] bindLinkMinecraftView mounted");
  const backToMarketButton = document.getElementById("backToMarketButton");
  const requestCodeForm = document.getElementById("requestCodeForm");
  const requestCodeButton = document.getElementById("requestCodeButton");
  const requestCodeStatus = document.getElementById("requestCodeStatus");
  const retryRequestCodeWrap = document.getElementById("retryRequestCodeWrap");
  const retryRequestCodeButton = document.getElementById(
    "retryRequestCodeButton",
  );
  const confirmSection = document.getElementById("confirmSection");
  const confirmCodeForm = document.getElementById("confirmCodeForm");
  const confirmCodeButton = document.getElementById("confirmCodeButton");
  const confirmCodeStatus = document.getElementById("confirmCodeStatus");
  const linkAccountUsername = document.getElementById("linkAccountUsername");
  const linkWalletBadge = document.getElementById("linkWalletBadge");
  const linkServerIp = document.getElementById("linkServerIp");
  const minecraftUsernameInput = document.getElementById("minecraftUsername");

  if (linkAccountUsername) {
    linkAccountUsername.textContent = state.session?.username || "-";
  }
  if (linkWalletBadge) {
    linkWalletBadge.textContent = formatPoints(state.session?.walletBalance || 0);
  }
  if (linkServerIp) {
    linkServerIp.textContent = MC_SERVER_IP;
  }
  if (minecraftUsernameInput && state.pendingLinkMinecraftUsername) {
    minecraftUsernameInput.value = state.pendingLinkMinecraftUsername;
  }

  retryRequestCodeButton?.addEventListener("click", () => {
    requestCodeForm?.requestSubmit();
  });

  requestCodeButton?.addEventListener("click", () => {
    console.debug("[link] requestCodeButton clicked");
  });

  requestCodeForm?.addEventListener(
    "invalid",
    (event) => {
      event.preventDefault();
      showToast("Renseigne le username Minecraft avant d'envoyer le code.", "error");
    },
    true,
  );

  backToMarketButton?.addEventListener("click", () => {
    void renderMarketView();
  });

  requestCodeForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    console.debug("[link] requestCodeForm submit");

    if (!state.session?.username) {
      showToast("Connecte-toi avant de lier ton compte Minecraft.", "error");
      return;
    }

    const minecraftUsername = minecraftUsernameInput?.value.trim() || "";
    if (!minecraftUsername) {
      showToast("Le username Minecraft est obligatoire.", "error");
      return;
    }

    if (retryRequestCodeWrap) {
      retryRequestCodeWrap.classList.add("hidden");
    }

    setLoading(requestCodeButton, true, "Envoi...");
    try {
      const result = await requestMinecraftLinkCode(
        {
          username: state.session.username,
          minecraftUsername,
        },
      );

      state.pendingLinkMinecraftUsername = minecraftUsername;
      if (requestCodeStatus) {
        requestCodeStatus.textContent = result.message;
      }
      if (confirmSection) {
        confirmSection.classList.remove("hidden");
      }
      showToast("Code de liaison envoye.", "success");
    } catch (error) {
      if (requestCodeStatus) {
        requestCodeStatus.innerHTML =
          `${escapeHtml(error.message)} ` +
          `Si besoin, connecte-toi au serveur <strong>${escapeHtml(MC_SERVER_IP)}</strong> puis renvoie le code.`;
      }
      if (retryRequestCodeWrap) {
        retryRequestCodeWrap.classList.remove("hidden");
      }
      showToast(error.message, "error");
    } finally {
      setLoading(requestCodeButton, false, "Demander un code");
    }
  });

  confirmCodeForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    console.debug("[link] confirmCodeForm submit");

    if (!state.session?.username) {
      showToast("Connecte-toi avant de lier ton compte Minecraft.", "error");
      return;
    }

    const code = document.getElementById("minecraftCode")?.value.trim() || "";
    if (!code) {
      showToast("Le code est obligatoire.", "error");
      return;
    }

    const minecraftUsername = state.pendingLinkMinecraftUsername || minecraftUsernameInput?.value.trim() || "";
    if (!minecraftUsername) {
      showToast("Renseigne d'abord le username Minecraft et demande un code.", "error");
      return;
    }

    setLoading(confirmCodeButton, true, "Validation...");
    try {
      const result = await confirmMinecraftLink({
        username: state.session.username,
        minecraftUsername,
        code,
      });

      state.session.linkedMinecraft = Boolean(result.minecraftLinked);
      state.session.minecraftUsername = result.minecraftUsername;
      state.pendingLinkMinecraftUsername = "";
      saveSession(state.session);
      if (confirmCodeStatus) {
        confirmCodeStatus.textContent = result.message;
      }
      showToast("Compte Minecraft lie avec succes.", "success");
      await renderMarketView();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(confirmCodeButton, false, "Valider le code");
    }
  });
}

async function renderLoginView() {
  setScreen("login");
  await loadPage("login");
  setAuthMode(state.authMode, state);
}

async function renderMarketView() {
  setScreen("market");
  await loadPage("market");
  renderAccount();
  renderInventory();
  await Promise.all([loadItems(), loadSellableItems()]);
  await loadWalletAndInventory();
}

async function renderInventoryViewPage() {
  setScreen("inventory");
  await loadPage("inventory");
  renderAccount();
  renderInventory();
  await loadSellableItems();
  await loadWalletAndInventory();
}

async function renderLinkMinecraftView() {
  setScreen("link-minecraft");
  await loadPage("link-minecraft");
}

async function init() {
  state.session = loadSession();

  if (state.session?.accessToken) {
    if (state.session.username && !state.session.userId) {
      try {
        await ensureMarketSessionUser();
      } catch (error) {
        showToast(error.message, "error");
      }
    }
    try {
      await syncMinecraftLinkStatus();
    } catch {
      // Non-blocking at startup.
    }
    await renderMarketView();
    return;
  }

  await renderLoginView();
}

window.addEventListener("DOMContentLoaded", () => {
  void init();
});

window.addEventListener("DOMContentLoaded", () => {
  void logInventoryForSession(state.session || loadSession()).catch((error) => {
    showToast(error.message, "error");
  });
});
