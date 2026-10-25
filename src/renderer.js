const view = document.getElementById("view");
const welcome = document.getElementById("welcome");
const address = document.getElementById("address");
const status = document.getElementById("status");
const addressForm = document.getElementById("address-form");
const searchForm = document.getElementById("search-form");
const torToggle = document.getElementById("tor-toggle");
const torLabel = document.getElementById("tor-label");
let torMode = false;
let torBusy = false;

function normalizeInput(value) {
  const input = value.trim();
  if (!input) return null;
  if (/^(about:|https?:\/\/)/i.test(input)) return input;
  if (/^(localhost|127\.0\.0\.1)(:\d+)?([/?#].*)?$/i.test(input)) return "http://" + input;
  if (/^[^\s]+\.[^\s]+$/.test(input) && !input.includes(" ")) return "https://" + input;
  return "https://duckduckgo.com/?q=" + encodeURIComponent(input);
}
function navigate(value) {
  const target = normalizeInput(value);
  if (!target) return;
  welcome.style.display = "none";
  view.classList.add("active");
  view.src = target;
  if (target !== "about:blank") address.value = target;
  status.textContent = torMode ? "Loading via Tor…" : "Loading…";
}
function renderTorState(payload) {
  const state = payload?.state || "off";
  torMode = state === "on";
  torBusy = state === "starting" || state === "stopping";
  torToggle.classList.toggle("enabled", torMode);
  torToggle.classList.toggle("busy", torBusy);
  torToggle.setAttribute("aria-pressed", String(torMode));
  torToggle.disabled = torBusy;
  torLabel.textContent = state === "on" ? "Tor on" : state === "starting" ? "Connecting…" : state === "stopping" ? "Turning off…" : state === "error" ? "Tor error" : "Tor off";
  document.getElementById("footer-mode").innerHTML = torMode
    ? 'CHAMELON <b>·</b> TOR ROUTING ON'
    : 'CHAMELON BROWSER <b>·</b> PREVIEW';
  if (state === "on") status.textContent = "Tor connected · Routing enabled";
  else if (state === "off") status.textContent = "Tor routing off";
  else if (state === "error") status.textContent = payload.error || "Tor could not start";
  else if (state === "starting") status.textContent = "Connecting to Tor network…";
  else if (state === "stopping") status.textContent = "Disabling Tor routing…";
}
torToggle.addEventListener("click", async () => {
  if (!window.chamelon || torBusy) return;
  torToggle.disabled = true;
  status.textContent = torMode ? "Disabling Tor routing…" : "Starting Tor…";
  try {
    const result = await window.chamelon.toggleTor();
    renderTorState(result);
    if (result?.state === "on" && view.src !== "about:blank") view.reload();
    if (result?.state === "off" && view.src !== "about:blank") view.reload();
  } catch (error) {
    renderTorState({ state: "error", error: error.message || "Tor operation failed" });
  }
});
if (window.chamelon) {
  window.chamelon.onTorState(renderTorState);
  window.chamelon.getTorState().then(renderTorState).catch(() => {});
}
addressForm.addEventListener("submit", event => { event.preventDefault(); navigate(address.value); });
searchForm.addEventListener("submit", event => { event.preventDefault(); navigate(document.getElementById("search").value); });
document.getElementById("back").addEventListener("click", () => { if (view.canGoBack()) view.goBack(); });
document.getElementById("forward").addEventListener("click", () => { if (view.canGoForward()) view.goForward(); });
document.getElementById("reload").addEventListener("click", () => { if (view.src !== "about:blank") view.reload(); });
document.getElementById("home").addEventListener("click", () => {
  view.classList.remove("active"); view.src = "about:blank"; welcome.style.display = "flex";
  address.value = ""; status.textContent = torMode ? "Tor routing on" : "Ready when you are";
});
document.getElementById("new-tab").addEventListener("click", () => {
  view.classList.remove("active"); view.src = "about:blank"; welcome.style.display = "flex";
  address.value = ""; status.textContent = torMode ? "Tor routing on" : "New tab";
});
document.querySelectorAll("[data-url]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.url)));
view.addEventListener("did-start-loading", () => { status.textContent = torMode ? "Loading via Tor…" : "Loading…"; });
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
