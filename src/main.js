const { app, BrowserWindow, session, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { spawn } = require("node:child_process");

const BROWSER_PARTITION = "persist:chamelon";
const TOR_SOCKS_PORT = 9150;
let browserSession = null;
let torProcess = null;
let torState = "off";
let torError = "";

function getTorExecutable() {
  const candidates = app.isPackaged
    ? [path.join(process.resourcesPath, "tor", "tor.exe")]
    : [
        path.join(__dirname, "..", "vendor", "tor", "tor.exe"),
        path.join(process.resourcesPath, "tor", "tor.exe")
      ];
  return candidates.find(candidate => fs.existsSync(candidate)) || null;
}

function setTorState(state, error = "") {
  torState = state;
  torError = error;
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send("tor-state", { state, error });
  }
}

function stopTorProcess() {
  if (torProcess && !torProcess.killed) {
    try { torProcess.kill(); } catch {}
  }
  torProcess = null;
}

async function stopTor() {
  setTorState("stopping");
  try {
    await browserSession.setProxy({ mode: "direct" });
    await browserSession.closeAllConnections();
  } catch (error) {
    console.error("Could not reset browser proxy:", error);
  }
  stopTorProcess();
  setTorState("off");
  return { state: torState };
}

async function startTor() {
  if (torState === "on") return { state: torState };
  if (torState === "starting") return { state: torState };
  const executable = getTorExecutable();
  if (!executable) {
    const message = "Tor is not bundled in this development build. Build through GitHub Actions or prepare vendor/tor/tor.exe.";
    setTorState("error", message);
    return { state: torState, error: message };
  }

  const dataDirectory = path.join(app.getPath("userData"), "tor-data");
  fs.mkdirSync(dataDirectory, { recursive: true });
  setTorState("starting");

  return new Promise(resolve => {
    let settled = false;
    let output = "";
    let readyTimer;

    const finish = result => {
      if (settled) return;
      settled = true;
      clearTimeout(readyTimer);
      resolve(result);
    };

    try {
      torProcess = spawn(executable, [
        "--SocksPort", `127.0.0.1:${TOR_SOCKS_PORT}`,
        "--DataDirectory", dataDirectory,
        "--Log", "notice stdout"
      ], {
        cwd: path.dirname(executable),
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"]
      });
    } catch (error) {
      const message = "Could not launch Tor: " + error.message;
      setTorState("error", message);
      finish({ state: torState, error: message });
      return;
    }

    const onOutput = chunk => {
      output = (output + chunk.toString()).slice(-12000);
      if (/Bootstrapped 100% \(done\)/i.test(output)) {
        (async () => {
          try {
            // No direct:// fallback: if Tor is unavailable, proxied navigation must fail.
            await browserSession.setProxy({
              proxyRules: `socks5://127.0.0.1:${TOR_SOCKS_PORT}`,
              proxyBypassRules: ""
            });
            await browserSession.closeAllConnections();
            setTorState("on");
            finish({ state: "on" });
          } catch (error) {
            const message = "Tor connected, but the browser proxy could not be enabled: " + error.message;
            stopTorProcess();
            setTorState("error", message);
            finish({ state: "error", error: message });
          }
        })();
      }
    };

    torProcess.stdout.on("data", onOutput);
    torProcess.stderr.on("data", onOutput);
    torProcess.once("error", error => {
      const message = "Could not launch Tor: " + error.message;
      setTorState("error", message);
      finish({ state: "error", error: message });
    });
    torProcess.once("exit", code => {
      if (torState === "starting" || torState === "on") {
        const message = `Tor exited (code ${code ?? "unknown"}). Tor mode has been disabled.`;
        browserSession.setProxy({ mode: "direct" })
          .then(() => browserSession.closeAllConnections())
          .catch(() => {})
          .finally(() => {
            torProcess = null;
            setTorState("error", message);
          });
        finish({ state: "error", error: message });
      }
    });

    readyTimer = setTimeout(() => {
      if (torState !== "starting") return;
      const message = "Tor did not finish connecting in time. Check your network and try again.";
      stopTorProcess();
      setTorState("error", message);
      finish({ state: "error", error: message });
    }, 120000);
  });
}

ipcMain.handle("tor-toggle", async () => {
  if (torState === "on" || torState === "starting") return stopTor();
  return startTor();
});
ipcMain.handle("tor-get-state", () => ({ state: torState, error: torError }));

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
    win.webContents.send("open-url", url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  app.setAppUserModelId("net.carjam120443.chamelonbrowser");
  browserSession = session.fromPartition(BROWSER_PARTITION);
  browserSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    const safeDefaults = new Set(["fullscreen", "pointerLock"]);
    callback(safeDefaults.has(permission));
  });
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("before-quit", () => {
  stopTorProcess();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
