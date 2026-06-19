const moneyFormatter = new Intl.NumberFormat("fr-FR");

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatPoints(value) {
  return `${moneyFormatter.format(Number(value || 0))} points`;
}

export function formatPrice(value) {
  return moneyFormatter.format(Number(value || 0));
}

export function showToast(message, type = "success") {
  const zone = document.getElementById("toastZone") || createToastZone();
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  zone.appendChild(toast);
  window.setTimeout(() => toast.remove(), 3600);
}

export function setLoading(button, isLoading, label) {
  if (!button) return;
  button.disabled = isLoading;
  button.innerHTML = isLoading
    ? `<span class="spinner"></span> ${label}`
    : label;
}

function createToastZone() {
  const zone = document.createElement("div");
  zone.id = "toastZone";
  zone.className = "toast-zone";
  document.body.appendChild(zone);
  return zone;
}
