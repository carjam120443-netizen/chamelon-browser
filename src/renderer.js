const view = document.getElementById("view");
const welcome = document.getElementById("welcome");
const address = document.getElementById("address");
const status = document.getElementById("status");
const addressForm = document.getElementById("address-form");
const searchForm = document.getElementById("search-form");

function normalizeInput(value) {
  const input = value.trim();
  if (!input) return null;
  if (/^(about:|https?:\/\/)/i.test(input)) return input;
  if (/^(localhost|127\.0\.0\.1)(:\d+)?([/?#].*)?$/i.test(input)) return "http://" + input;
  if (/^[^\s]+\.[^\s]+$/.test(input) && !input.includes(" ")) return "https://" + input;
  return "https://www.google.com/search?q=" + encodeURIComponent(input);
}
function navigate(value) {
  const target = normalizeInput(value);
  if (!target) return;
  welcome.style.display = "none";
  view.classList.add("active");
  if (target === "about:blank") {
    view.src = target;
  } else {
    view.src = target;
    address.value = target;
  }
  status.textContent = "Loading…";
}
addressForm.addEventListener("submit", event => { event.preventDefault(); navigate(address.value); });
searchForm.addEventListener("submit", event => { event.preventDefault(); navigate(document.getElementById("search").value); });
document.getElementById("back").addEventListener("click", () => { if (view.canGoBack()) view.goBack(); });
document.getElementById("forward").addEventListener("click", () => { if (view.canGoForward()) view.goForward(); });
document.getElementById("reload").addEventListener("click", () => { if (view.src !== "about:blank") view.reload(); });
document.getElementById("home").addEventListener("click", () => {
  view.classList.remove("active"); view.src = "about:blank"; welcome.style.display = "flex";
  address.value = ""; status.textContent = "Ready when you are";
});
document.getElementById("new-tab").addEventListener("click", () => {
  view.classList.remove("active"); view.src = "about:blank"; welcome.style.display = "flex";
  address.value = ""; status.textContent = "New tab";
});
document.querySelectorAll("[data-url]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.url)));
view.addEventListener("did-start-loading", () => { status.textContent = "Loading…"; });
view.addEventListener("did-stop-loading", () => {
  try { address.value = view.getURL(); status.textContent = view.getTitle() || "Page loaded"; }
  catch { status.textContent = "Page loaded"; }
});
view.addEventListener("page-title-updated", event => { document.title = (event.title || "New tab") + " — Chamelon Browser"; });
view.addEventListener("did-fail-load", event => {
  if (event.errorCode !== -3) status.textContent = "Could not load page (" + event.errorCode + ")";
});
if (window.chamelon) window.chamelon.onOpenUrl(url => navigate(url));
document.addEventListener("keydown", event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "l") {
    event.preventDefault(); address.focus(); address.select();
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "r") {
    event.preventDefault(); if (view.src !== "about:blank") view.reload();
  }
});