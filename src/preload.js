const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("chamelon", {
  onOpenUrl(callback) {
    if (typeof callback !== "function") return;
    ipcRenderer.on("open-url", (_event, url) => callback(url));
  }
});