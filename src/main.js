const { app, BrowserWindow, session } = require("electron");
const path = require("node:path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 760,
    minHeight: 520,
    title: "Chamelon Browser",
    backgroundColor: "#101820",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      sandbox: true
    }
  });

  win.loadFile(path.join(__dirname, "index.html"));
  win.webContents.setWindowOpenHandler(({ url }) => {
    // Keep popups inside the browser UI rather than spawning untrusted windows.
    win.webContents.send("open-url", url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  app.setAppUserModelId("net.carjam120443.chamelonbrowser");
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    // Ask users before enabling sensitive browser permissions in a future permission UI.
    const safeDefaults = new Set(["fullscreen", "pointerLock"]);
    callback(safeDefaults.has(permission));
  });
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});