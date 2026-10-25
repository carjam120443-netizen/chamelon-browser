<div align="center">

<img src="assets/chamelon-logo.svg" alt="Chamelon Browser logo" width="180" />

# Chamelon Browser

**A fresh, independently branded Windows browser prototype powered by Chromium.**

🟢 **Chamelon** · Dark UI · Mint accents · Chromium engine

</div>

An independently branded Windows browser prototype built with **Electron**, which embeds Chromium. This is a browser shell—not a full Chromium source fork—so we can iterate on the interface and features without maintaining a custom Chromium build.

## Current preview

- Chamelon dark/mint branding and custom new-tab page
- Address bar with URL detection and Google search fallback
- Back, forward, reload, home, quick links, and new-tab reset
- Windows installer and portable build targets via GitHub Actions
- No Node.js integration in web content; isolated preload and restrictive app permissions

## Run locally

Install Node.js (LTS recommended), then from the repository folder:

```powershell
npm install
npm start
```

Build Windows packages:

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
