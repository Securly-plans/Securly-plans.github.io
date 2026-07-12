EmeraldOS Gold 9.0 - Shell Update Architecture

Start here:
  gold-shell.html

Folder layout:
  gold-shell.html
  gold-shell.js
  gold-shell.css
  firebase.js
  firebase-config.js
  seed-gold9-latest.html
  Gold_9.0/
    OS.html
    gold90.js
    gold90.css

Firestore pointer:
  Collection: system
  Document: emeraldGoldLatest

Use seed-gold9-latest.html to write the Gold_9.0 pointer, or manually copy FIREBASE_EMERALDGOLDLATEST_9.0.json into system/emeraldGoldLatest.

How it works:
  1. User opens gold-shell.html.
  2. The shell reads system/emeraldGoldLatest.
  3. The shell saves a local/cloud VM snapshot when a version changes.
  4. The shell loads the configured folder and entry file, such as Gold_9.0/OS.html.
  5. The version folder still contains its own login, setup, Staff Edition, BIOS, and apps.

Cloud VM data target:
  emeraldOSUsers/{username}/goldVM/current
  emeraldOSUsers/{username}/goldVM/liveState
  emeraldOSUsers/{username}/goldVMUpdateHistory/{updateId}
  emeraldOSUsers/{username}/goldVMSnapshots/{snapshotId}

Important 10.0 note:
  A normal browser app should not and cannot safely rewrite Firestore Security Rules by itself.
  For Gold 10.0, build an admin-only Rules Assistant that generates/export rules, or connect a secured Cloud Function / Firebase Admin backend to deploy rules.
