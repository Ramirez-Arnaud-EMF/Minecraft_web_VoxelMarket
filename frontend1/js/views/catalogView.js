import { escapeHtml, formatPrice } from "./uiView.js";

export function renderCatalog({ items, session, onBuy }) {
  const catalogStatus = document.getElementById("catalogStatus");
  const catalogGrid = document.getElementById("catalogGrid");

  if (!catalogStatus || !catalogGrid) return;

  if (!items.length) {
    catalogGrid.innerHTML = '<div class="hint">Aucun build disponible.</div>';
    catalogStatus.textContent = "Aucun build trouve.";
    return;
  }

  const canBuy = Boolean(session?.userId) && Boolean(session?.linkedMinecraft);
  catalogStatus.textContent = `${items.length} build(s) trouve(s).`;

  catalogGrid.innerHTML = items
    .map((item) => {
      const disabled = canBuy ? "" : "disabled";
      const buttonText = canBuy ? "Acheter" : "Compte non lie";
      return `
        <article class="item-card">
          <div class="item-meta">
            <span class="badge">Build #${escapeHtml(String(item.id))}</span>
            <span class="muted">Disponible</span>
          </div>
          <div>
            <h3>${escapeHtml(item.name)}</h3>
            ${item.category ? `<p class="muted" style="margin-top: 8px">Categorie: ${escapeHtml(item.category)}</p>` : ""}
            ${item.description ? `<p class="hint" style="margin-top: 8px">${escapeHtml(item.description)}</p>` : ""}
            <p class="hint" style="margin-top: 8px">Prix affiche au moment de l'achat: ${escapeHtml(String(item.buy_price))} points</p>
          </div>
          <div class="price-row">
            <span>Prix</span>
            <span class="price">${formatPrice(item.buy_price)}</span>
          </div>
          <button class="button" type="button" data-buy-id="${escapeHtml(String(item.id))}" ${disabled}>${buttonText}</button>
        </article>`;
    })
    .join("");

  document.querySelectorAll("[data-buy-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const itemId = Number(button.getAttribute("data-buy-id"));
      await onBuy(itemId, button);
    });
  });
}
