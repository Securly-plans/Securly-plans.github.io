EMERALDOS GOLD 1V

INSTALLATION
Place the complete Gold_1V folder beside the other E.L.S.U.S. Gold version folders. Keep the folder name and OS.html entry unchanged.

BASE AND COMPATIBILITY
Gold 1V is built from Gold 1U and preserves its interface, private per-user VM, Universal File System, protected permanent deletion, explicit file sharing, app notification permissions, games, radio, guide, Application Editor iframe compatibility, Staff Center, and manual Publisher Manager.

NEW APPLICATIONS
- Personalization Studio
- Utility Center
- File Finder

MIGRATION
Gold 1V recognizes Gold 1U and earlier supported local categories and split-cloud schemas. Cloud autosave remains blocked until the authoritative cloud scan completes. Migration now runs with per-operation timeouts, retries, progress reporting, automatic continuation, and a manual Retry cloud migration control.

PRIVACY
Files, preferences, application data, customization profiles, and utility history remain separated by authenticated user ID. Production privacy still requires Firebase Authentication and correctly deployed Firestore rules. Read PRIVACY-AND-SHARING-DEPLOYMENT-1V.txt before production deployment.

APPLICATION EDITOR
User-app iframe wrappers retain allow-same-origin and the guarded SAFE_CACHES facade. Only trusted user code should be previewed with allow-scripts and allow-same-origin together.

PUBLISHING
Do not write system/emeraldGoldLatest from boot, setup, migration, or routing code. Use the verified Staff Edition Update Publisher Manager, Emerald Mail verification, publisher PIN, and Publish this Version button.

FILE MAP
Read Locations.txt for the exact location and purpose of each Gold 1V file.
