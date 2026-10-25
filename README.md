<div align="center">

<img src="assets/chamelon-logo.svg" alt="Chamelon Browser logo" width="180" />

# Chamelon Browser

**A fresh, independently branded Windows browser prototype powered by Chromium.**

🟢 **Chamelon** · Dark UI · Mint accents · Optional Tor routing

</div>

An independently branded Windows browser prototype built with **Electron**, which embeds Chromium. This is a browser shell—not a full Chromium source fork—so we can iterate on the interface and features without maintaining a custom Chromium build.

## Current preview

- Chamelon dark/mint branding and custom new-tab page
- Address bar with URL detection and **DuckDuckGo** search fallback
- Back, forward, reload, home, quick links, and new-tab reset
- Optional Tor routing through a bundled Tor Expert Bundle
- Windows installer and portable build targets via GitHub Actions
- No Node.js integration in web content; isolated preload and restrictive app permissions

## Tor routing

Click **Tor off** in the browser toolbar to start the bundled Tor process and enable proxy routing. Chamelon waits for Tor to finish connecting before switching the browser session to its SOCKS proxy. When Tor mode is disabled, the browser returns to normal direct routing.

The Windows build downloads the Tor Expert Bundle from the official Tor Project distribution server, verifies its SHA-256 hash against the published checksum list, and includes the bundle in both the installer and portable package. The bundle version is pinned in `scripts/prepare-tor.ps1` and should be deliberately updated as stable releases arrive.

**Important privacy limitation:** The Tor Project recommends using Tor Browser rather than routing other browsers through Tor. Chamelon is an Electron/Chromium browser and does not include Tor Browser's full anti-fingerprinting protections. Tor routing can change the network path and the IP address websites see, but it does not make Chamelon anonymous or prevent all identifying leaks. Avoid relying on it for sensitive activity.

## Run locally

Install Node.js (LTS recommended), then from the repository folder:

```powershell
npm install
npm start
```

Local development does not automatically download Tor. To prepare the bundled Tor executable before running locally, use:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/prepare-tor.ps1
npm start
```

Build Windows packages (this downloads and verifies Tor automatically):

```powershell
npm run dist
```

Artifacts are written to `dist/`. The installer is per-user by default and lets you choose an installation folder.

## Roadmap

- Real tab strip and tab management
- Bookmarks, history, downloads, and settings
- Permission prompts and site controls
- Dedicated app icon, installer polish, and signed releases
- Update mechanism and automated dependency/security updates

## Important notes

This is an early prototype. Do not use it as your primary browser for sensitive accounts yet. Electron/Chromium updates are important for security, and this project does not yet have a complete browser permission UI, password manager, sync, or mature download handling. Website compatibility varies.

Electron and Chromium are trademarks of their respective owners. Chamelon Browser is an independent project and is not affiliated with Google or the Chromium project.

## License

MIT (project code). Third-party dependencies retain their own licenses.
