EmeraldOS Gold Shell T.U. Update Test
=====================================

Purpose
-------
This package tests the new EmeraldOS Gold update architecture:

- One permanent shell stays in the main EmeraldOS folder.
- Each EmeraldOS Gold version lives in a sub-folder.
- Firebase stores the latest version pointer.
- The shell loads the folder Firebase points to.
- User VM data is stored outside the version folder so updates do not reset the user.

Recommended upload layout
-------------------------
Upload these files into your existing EmeraldOS folder:

EmeraldOS/
  gold-shell.html
  gold-shell.css
  gold-shell.js
  firebase.js
  firebase-config.js
  seed-update.html
  app-logos/
  updates/
  Gold_T.U.1/
  Gold_T.U.2/

Open this URL:

  /EmeraldOS/gold-shell.html

Test update flow
----------------
1. Open gold-shell.html.
2. Create a local account or Firebase account.
3. The shell loads Gold_T.U.1 by default.
4. Complete setup.
5. Customize the VM.
6. Create a file in Gold Office.
7. Open seed-update.html.
8. Click "Set latest to T.U.2".
9. Return to the shell.
10. Click "Check for updates".
11. The shell should save the VM, migrate state, and load Gold_T.U.2/OS.html.
12. Files, settings, tickets, user apps, and setup state should still be present.

Firebase latest version document
--------------------------------
The shell reads:

  system/emeraldGoldLatest

Example T.U.2 document:

{
  "product": "EmeraldOS Gold",
  "latestVersion": "T.U.2",
  "folder": "Gold_T.U.2",
  "entry": "OS.html",
  "channel": "stable",
  "status": "test",
  "releaseTitle": "EmeraldOS Gold T.U.2 Shell Update Test",
  "summary": "Updated folder loaded by shell, keeping cloud VM data and setup state.",
  "setupMode": "continue",
  "required": false,
  "migrationFrom": ["T.U.1"]
}

Cloud VM path
-------------
User data is saved here when Firebase rules allow it:

  emeraldOSUsers/{username}/goldVM/current
  emeraldOSUsers/{username}/goldVM/snapshots/{snapshotId}

Local fallback
--------------
If Firebase is unavailable, the shell still works locally with localStorage.
Use the Local test override buttons to load T.U.1 or T.U.2 without changing Firebase.

Keyboard shortcuts
------------------
Shell:
  Ctrl + Alt + U = Check for updates
  Ctrl + Alt + S = Save VM snapshot

Inside T.U.1/T.U.2:
  Ctrl + Alt + S = Settings
  Ctrl + Alt + O = Gold Office
  Ctrl + Alt + U = Updates

Important notes
---------------
This is a test build for the shell update system. It is intentionally smaller than the full Gold 8.0 branch, but it proves the version-router model:

- same parent EmeraldOS folder
- version sub-folders
- Firebase latest pointer
- VM data migration
- setup continues across updates
- manual fallback for testing without Firebase writes

Files checked
-------------
gold-shell.js
Gold_T.U.1/gold-tu1.js
Gold_T.U.2/gold-tu2.js
ZIP integrity
