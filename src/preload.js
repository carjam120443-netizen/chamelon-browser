const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("chamelon", {
  onOpenUrl(callback) {
    if (typeof callback !== "function") return;
    ipcRenderer.on("open-url", (_event, url) => callback(url));
  },
  toggleTor() {
    return ipcRenderer.invoke("tor-toggle");
  },
  getTorState() {
    return ipcRenderer.invoke("tor-get-state");
  },
  onTorState(callback) {
    if (typeof callback !== "function") return;
    ipcRenderer.on("tor-state", (_event, state) => callback(state));
  }
});
