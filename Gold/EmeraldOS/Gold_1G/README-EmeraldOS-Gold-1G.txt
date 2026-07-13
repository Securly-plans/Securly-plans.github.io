EmeraldOS Gold 1G — Redesigned Fix Build
=========================================

Folder name:
Gold_1G

Entry file:
OS.html

This is an OS-folder-only E.L.S.U.S.-compatible build.
Do not upload it as a replacement for the E.L.S.U.S. shell.

Fixes in this redesigned 1G package:
- Fixed the gold1gLocalState ReferenceError by adding a top-level VM state collector used by cloud saves.
- Included firebase.js and firebase-config.js inside the Gold_1G folder so dynamic import('./firebase.js') works when this version is booted from its own folder.
- Removed the embedded TOS iframe from setup to prevent automatic /TOS.html 404 resource warnings. The TOS now opens in a new tab from https://securly-plans.github.io/TOS.html.
- Added Gold 1F local migration so existing Gold 1F users keep their E.L.S.U.S. first-boot setup state.
- First-Boot Setup remains one-time per signed-in user across all E.L.S.U.S.-compatible Gold versions.
- Update Setup remains per-version and should show for users updating into Gold 1G.
- Publishing is Staff Edition + Update Publisher Manager + publisher PIN + clicking Publish this Version only.
- No query-string or first-boot auto-publishing is used.

Cloud VM paths:
- emeraldOSUsers/{username}/goldVM/current
- emeraldOSUsers/{username}/goldVM/setup

Upload as:
EmeraldOS/Gold_1G/

Required sibling shell files remain outside this OS folder.
