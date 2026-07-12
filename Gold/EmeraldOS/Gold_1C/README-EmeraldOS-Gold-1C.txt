EmeraldOS Gold 1C
OS folder only; compatible with EmeraldOS Live Service Update System (E.L.S.U.S.)

Upload layout:
EmeraldOS/
└─ Gold_1C/
   ├─ OS.html
   ├─ gold1c.js
   ├─ gold1c.css
   ├─ index.html
   ├─ register.html
   ├─ loading.html
   ├─ bios.html
   ├─ staff.html
   ├─ firebase.js
   ├─ firebase-config.js
   └─ app-logos/

Built from:
EmeraldOS Gold 1B

E.L.S.U.S. publishing:
Gold 1C can publish itself as the newest available folder, but publishing is gated.
The user must be signed into Gold Staff Edition and must unlock the Update Publisher Manager using the configured publisher PIN.

Manual publish URL:
Gold_1C/OS.html?publishLatest=1

This attempts to write:
system/emeraldGoldLatest → Gold_1C / OS.html

New in Gold 1C:
- Taskbar color customization.
- Taskbar text color customization.
- Start menu color customization.
- Movable desktop objects.
- Desktop Trash icon.
- Reset desktop positions.
- User rollback center for previous version folders.
- Emergency staff rollback publisher.
- Center-screen popups when apps/files refuse to load.
- EmeraldOS Gold crash screen / BSOD-style recovery screen.
- Crash Recovery app.
- Staff-only Update Publisher Manager.
- Publishing locked behind Staff Edition + publisher PIN.
- E.L.S.U.S. compatibility kept.

Rollback warning:
Rollback can cause instability with newer apps, files, settings, or cloud VM data. Create a snapshot before using rollback.

Important security note:
The frontend PIN is a convenience gate. Firestore rules should still restrict system/emeraldGoldLatest writes to authorized staff/admin users.
