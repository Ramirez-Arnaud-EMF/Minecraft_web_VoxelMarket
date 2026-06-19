import { escapeHtml, formatPoints } from "./uiView.js";

export function renderInventory(
  inventory,
  { sellableItems = [], onSell, walletBalance = 0 } = {},
) {
  const summaryInventoryCount = document.getElementById("summaryInventoryCount");
  const summaryWallet = document.getElementById("summaryWallet");
  const inventoryList = document.getElementById("inventoryList");

  if (!summaryInventoryCount || !inventoryList) return;

  if (summaryWallet) {
    summaryWallet.textContent = formatPoints(walletBalance);
  }

  const total = inventory.reduce(
    (sum, entry) => sum + Number(entry.count ?? entry.quantity ?? 0),
    0,
  );
  summaryInventoryCount.textContent = `${total} item(s)`;

  if (!inventory.length) {
    inventoryList.innerHTML =
      '<div class="hint">Aucun item dans l\'inventaire.</div>';
    return;
  }

  // Build a Set of sellable minecraft item ids for O(1) lookup
  const sellableIds = new Set(sellableItems.map((i) => i.item_id));
  const priceMap = Object.fromEntries(sellableItems.map((i) => [i.item_id, i.prix_vente]));

  inventoryList.innerHTML = inventory
    .map((entry) => {
      const rawId = entry.itemId ?? entry.item_id ?? "";
      const displayName = rawId.replace("minecraft:", "").replace(/_/g, " ");
      const slotLabel = entry.slotType ? ` · ${escapeHtml(entry.slotType)} #${entry.slot}` : "";
      const qty = entry.count ?? entry.quantity ?? 0;
      const canSell = sellableIds.has(rawId);
      const sellBtn = canSell
        ? `<button class="button-sell" type="button" data-sell-item="${escapeHtml(rawId)}" title="Vendre 1 ${escapeHtml(displayName)} pour ${priceMap[rawId]} pts">
             <i class="bi bi-currency-exchange"></i> Vendre (${priceMap[rawId]} pts)
           </button>`
        : "";
      return `
        <div class="inventory-row">
          <div>
            <strong>${escapeHtml(displayName)}</strong>
            <span class="muted">${escapeHtml(rawId)}${slotLabel}</span>
          </div>
          <div class="inventory-row-actions">
            <span class="price">x${escapeHtml(String(qty))}</span>
            ${sellBtn}
          </div>
        </div>`;
    })
    .join("");

  if (onSell) {
    inventoryList.querySelectorAll("[data-sell-item]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const minecraftItemId = btn.getAttribute("data-sell-item");
        onSell(minecraftItemId, btn);
      });
    });
  }
}
