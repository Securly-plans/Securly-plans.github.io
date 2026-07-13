EmeraldOS Gold 1H
=================

This is a complete, standalone E.L.S.U.S.-compatible OS version folder.
It is not an overlay and does not require Gold_1G files.

UPLOAD LOCATION
---------------
EmeraldOS/
└── Gold_1H/
    ├── OS.html
    ├── gold1h-core.js
    ├── gold1h.js
    ├── gold1h-preboot.js
    ├── gold1h-core.css
    ├── gold1h.css
    ├── index.html
    ├── register.html
    ├── loading.html
    ├── bios.html
    ├── staff.html
    ├── auth-common.js
    ├── auth.css
    ├── firebase.js
    ├── firebase-config.js
    ├── emerald-gold-1h-logo.svg
    ├── app-logos/
    ├── FIREBASE_EMERALDGOLDLATEST_1H.json
    └── EMERALDOS_GOLD_1H_VIRTUAL_LICENSE.txt

E.L.S.U.S. RULES
----------------
- Folder: Gold_1H
- Entry: OS.html
- Version/build: 1H
- First-Boot Setup is per signed-in user across the compatible E.L.S.U.S. Gold line.
- Update Setup is per version and appears for existing users entering Gold 1H.
- VM data remains version-independent under emeraldOSUsers/{username}/goldVM/current.
- Users manually accept updates through the root E.L.S.U.S. shell.
- Gold 1H never auto-publishes on boot or through query strings.
- Publishing requires Staff Edition, Update Publisher Manager, the publisher PIN, and clicking Publish this Version.

FIREBASE
--------
The package works locally without Firebase.
For cloud login, registration, VM save/restore, and E.L.S.U.S. publishing, put the same Firebase web configuration used by your current EmeraldOS deployment into firebase-config.js, or set localStorage.emerald_firebase_config to the JSON configuration.

SYSTEM UPDATE PUBLISHING
------------------------
1. Upload the full Gold_1H folder beside the other Gold version folders.
2. Configure Firebase in firebase-config.js.
3. Sign into Gold Staff Edition using an authorized account.
4. Open Update Publisher Manager.
5. Enter the publisher PIN.
6. Click Publish this Version.

The published document is:
system/emeraldGoldLatest

MAJOR FEATURES
--------------
- Windows 10-inspired desktop, Start menu, taskbar, Search, Action Center, and Task View.
- Emerald Registry Editor with HKEY_CLASSES_ROOT, HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE, HKEY_USERS, and HKEY_CURRENT_CONFIG.
- Registry value editing, protected hives, import/export, history, and restore points.
- Window dragging, resizing, minimizing, maximizing, snapping, Alt+Tab, Win+R, Win+V, and Ctrl+Shift+Esc.
- File Explorer, Gold Office, Gold Mail, Notepad, Calendar, Calculator, Settings, Emerald DOS, Paint, Photos, People, Support, Security, Restore Center, User Appstore, Application Editor, Browser, Media Player, System Information, and Get Help.
- Split, quota-safe cloud VM category storage through Gold 1H.
- Local-only fallback when Firebase is unavailable.
