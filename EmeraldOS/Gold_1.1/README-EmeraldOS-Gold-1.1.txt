EmeraldOS Gold 1.1
Staff Edition, Personalization, Settings and Windows-10-Inspired UI Update

Upload the full folder to your EmeraldOS Gold hosting location.

Important files:
- OS.html
- gold10.css
- gold10.js
- gold10-patch1.css
- gold10-patch1.js
- gold10-patch2.css
- gold10-patch2.js
- bios.html
- staff.html
- loading.html
- index.html
- firebase.js
- firebase-config.js

Main changes:
- Lighter Windows 10-inspired Gold UI.
- More personalization settings.
- More customization for taskbar, desktop apps, theme, accent, wallpaper, readable text, focus assist and lock screen.
- More functional Gold apps:
  Gold Settings
  Personalization
  Apps & Features
  Gold Staff Center
  Control Panel
  System Monitor
  Gold Update
  Network Center
  Gold Paint
  Whiteboard
  Clipboard
  Focus Assist
  Sound Center
  Get Started
  Emerald DOS
  Lock Screen
- F12 during startup opens Emerald Systems BIOS A1 / Emerald DOS.
- F9 during startup opens EmeraldOS Gold Staff Edition login.
- BIOS command STAFF opens the Staff Edition login page.
- In-OS Emerald DOS command STAFF opens the Staff Edition login page.

Staff Edition:
- staff.html verifies an EmeraldOS account from the users collection and an Emerald Mail account from the EmeraldMail collection when Firebase rules allow access.
- EmeraldOS password and Emerald Mail password are SHA-256 hashed in the browser and compared with passwordHash fields.
- Allowed staff roles include admin, administrator, mod, moderator, operator, staff, executive, owner and vip.
- A local preview mode exists for testing layout when Firebase is not available. It is marked as preview mode.
- Staff sessions are temporary and stored under localStorage key gold10_staffEditionSession.

Firestore collections expected for full Staff login:
- users
- EmeraldMail

Cloud restore path used by Gold 1.1:
- emeraldOSUsers/{username}/gold10/v11/current

Safety note:
This package does not include destructive mass-delete tools. Staff Center logs staff actions locally and focuses on repair, settings, diagnostics, and control surfaces.
