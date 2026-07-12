EmeraldOS Gold 9.0 Rebuilt Update System

Purpose
-------
This rebuild turns the root Gold shell into a small invisible updater/boot loader.
It does not remain visible after boot and it does not run EmeraldOS Gold inside an iframe.

Upload layout
-------------
EmeraldOS/
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
    index.html
    register.html
    staff.html
    bios.html

How it works
------------
1. User opens gold-shell.html.
2. The updater reads Firestore document system/emeraldGoldLatest.
3. The updater saves a local/cloud update snapshot when the configured folder changes.
4. The updater redirects to the configured folder and entry file.
5. EmeraldOS Gold runs normally from that folder.
6. The shell is no longer visible after boot.

Firestore pointer
-----------------
Collection: system
Document: emeraldGoldLatest

Suggested data:
{
  "product": "EmeraldOS Gold",
  "latestVersion": "9.0",
  "build": "9.0",
  "folder": "Gold_9.0",
  "entry": "OS.html",
  "channel": "stable",
  "status": "stable",
  "required": false,
  "enabled": true,
  "setupMode": "continue",
  "releaseTitle": "EmeraldOS Gold 9.0",
  "summary": "EmeraldOS Gold update-system build.",
  "migrationFrom": ["8.0", "8.0.1"],
  "migrationId": "gold8-to-gold9-direct-shell",
  "minShellVersion": "1.0",
  "rollbackFolder": "Gold_9.0",
  "rollbackVersion": "9.0"
}

Fixed error
-----------
Fixed boot failure:
Uncaught ReferenceError: openGoldUpdateCenter90 is not defined

System Update app
-----------------
Inside EmeraldOS Gold, open System Update / Gold Update Center.
It can:
- check Firebase for the latest configured folder
- save a VM snapshot
- restart through gold-shell.html
- apply the Firebase folder pointer

Notes
-----
For future releases, upload new version folders beside Gold_9.0, such as:
Gold_9.1/
Gold_10.0/

Then update system/emeraldGoldLatest.folder and latestVersion.
