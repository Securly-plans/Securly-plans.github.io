EmeraldOS Silver Beta 1.0

This is the first Beta release of the EmeraldOS Silver product line.

Main goals:
- Make Silver feel like a separate virtual machine-style EmeraldOS product line.
- Give every Silver application its own distinct logo.
- Improve Emerald Office with a Silver Office Beta interface.
- Make notifications universal through the taskbar bell.
- Save and restore the Silver VM session across devices after login.

Key files:
- OS.html
- silver-beta1.css
- silver-beta1.js
- os.js
- os.css
- emerald57.js
- cloudstorage.js
- firebase.js
- firebase-config.js

New Silver Beta features:
- Silver-only desktop mode that hides base EmeraldOS desktop icons.
- Silver Apps launcher with unique app logos for each Silver app.
- Silver Home dashboard.
- Silver Office Beta with Writer, Sheets, Slides, Forms, Templates, and Vault.
- Universal Notifications through the taskbar bell.
- Resume Center for VM-like continuity.
- Cloud session path: emeraldOSUsers/{username}/silverBeta/current
- Local fallback storage when Firebase is not available.
- Silver Notes, Tasks, Journal, and Vault data included in session sync.

Device continuity:
Silver Beta saves the user session to Firestore after login. When the same EmeraldOS user signs in on another device, Silver Beta can restore recent Silver apps, Silver Office documents, notifications, notes, tasks, journal entries, and preferences.

Firestore requirement:
Your Firestore rules must allow the signed-in/verified EmeraldOS user to read and write their own document path:
emeraldOSUsers/{username}/silverBeta/current

This design is Vista-inspired/Silver-inspired only and does not include Microsoft logos, Windows icons, wallpapers, sounds, or copied assets.
