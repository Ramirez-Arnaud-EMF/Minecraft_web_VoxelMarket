import { formatPoints } from "./uiView.js";

export function renderAccount({ session, onLinkNow }) {
  const accountUsername = document.getElementById("accountUsername");
  const walletBadge = document.getElementById("walletBadge");
  const marketSubtitle = document.getElementById("marketSubtitle");
  const linkNotice = document.getElementById("linkNotice");
  const linkMinecraftButton = document.getElementById("linkMinecraftButton");

  if (!session) return;

  if (accountUsername) accountUsername.textContent = session.username;
  if (walletBadge) walletBadge.textContent = formatPoints(session.walletBalance || 0);
  if (marketSubtitle) {
    marketSubtitle.textContent =
      session.source === "backend1"
        ? "Compte backend1 / Keycloak"
        : "Marche des builds";
  }

  if (linkMinecraftButton) {
    linkMinecraftButton.classList.toggle("hidden", Boolean(session.linkedMinecraft));
    linkMinecraftButton.onclick = onLinkNow;
  }

  if (!linkNotice) return;

  if (session.linkedMinecraft) {
    linkNotice.classList.add("hidden");
    linkNotice.textContent = "";
    return;
  }

  linkNotice.innerHTML =
    "Attention : ton compte Minecraft n'est pas lie. Tu dois le lier pour pouvoir acheter des builds." +
    '<div class="notice-actions"><button type="button" class="button-secondary" id="linkFromNoticeButton">Lier maintenant</button></div>';
  linkNotice.classList.remove("hidden");

  const linkFromNoticeButton = document.getElementById("linkFromNoticeButton");
  linkFromNoticeButton?.addEventListener("click", onLinkNow);
}
