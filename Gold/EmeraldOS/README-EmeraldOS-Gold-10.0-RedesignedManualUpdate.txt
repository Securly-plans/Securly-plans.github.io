EmeraldOS Gold 10.0 - Redesigned Manual Update System

Upload layout:
EmeraldOS/
  gold-shell.html
  gold-shell.js
  gold-shell.css
  firebase.js
  firebase-config.js
  seed-gold10-latest.html
  Gold_10.0/
    OS.html
    gold100.js
    gold100.css
    index.html
    register.html
    staff.html
    bios.html

Architecture:
1. gold-shell.html is the permanent invisible update router.
2. The shell reads system/emeraldGoldLatest from Firebase.
3. The shell does NOT automatically force a user to the latest folder.
4. Each user has their own active Gold folder stored in localStorage and cloud VM metadata.
5. If Firebase says a newer build exists, the running OS shows an update notification after login.
6. The user can choose Update this VM now, Remind me later, or Skip this version.
7. When the user accepts, the OS saves a VM snapshot and restarts through gold-shell.html?applyUpdate=1.
8. Only then does the shell switch that user to the latest configured folder.

Publishing a new version:
Option A: Open Gold_10.0/OS.html?publishLatest=1 manually once as a staff account.
Option B: Open seed-gold10-latest.html and click Publish Gold_10.0 as latest.

Firestore pointer document:
Collection: system
Document: emeraldGoldLatest

Important:
Gold 10.0 no longer tries to auto-deploy Firestore Security Rules on first boot. It only stages/manages the update pointer and user-selected update flow.
