EmeraldOS Gold 1A
===================

This is ONLY the OS version folder for EmeraldOS Gold 1A. It does not include or replace the E.L.S.U.S. shell.

Upload layout:

EmeraldOS/
└─ Gold_1A/
   ├─ OS.html
   ├─ gold1a.js
   ├─ gold1a.css
   ├─ index.html
   ├─ register.html
   ├─ loading.html
   ├─ bios.html
   ├─ staff.html
   ├─ firebase.js
   ├─ firebase-config.js
   ├─ emerald-gold-1a-logo.svg
   └─ app-logos/

E.L.S.U.S. compatibility:
- Folder: Gold_1A
- Entry: OS.html
- Version/build: 1A
- VM data remains version-independent under goldVM/current.
- Users update manually through the existing EmeraldOS Live Service Update System shell.
- To publish this version as the newest available version, boot this folder manually once with:

  Gold_1A/OS.html?publishLatest=1

What changed from Gold 11.0:
- Built directly from Gold 11.0.
- Curated app catalog so visible apps do not share the same purpose.
- Added E.L.S.U.S. System Update app for publish/check/restart workflow.
- Added Cloud Sync Center, Gold VM Center, Theme Studio, Accessibility Center, Gold App Lab, App Packager, Browser, Terminal, Media Player, Snip Board, System Information, Resources, and Widgets as distinct-purpose apps.
- Removed duplicate-purpose shortcuts from the default catalog.
- Improved EmeraldOS Gold desktop styling and app logos.
- Added safer customization CSS variables so background color, wallpaper, taskbar, Start width, opacity, blur, icon scale, and desktop spacing should not break the shell UI.

Tested:
- gold1a.js syntax checked with Node.
- Embedded page scripts checked where possible.
- ZIP integrity verified.
