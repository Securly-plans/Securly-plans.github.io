EMERALDOS GOLD 1O

Complete standalone E.L.S.U.S.-compatible flagship release folder.

INSTALLATION
Upload the folder as:

EmeraldOS/Gold_1O/

Gold 1O works with the original gold-shell.html and is also compatible with E.L.S.U.S. Shell V2. It keeps its own login page even when Shell V2 identifies and routes the user.

FLAGSHIP APPLICATIONS
- Gold Home
- Command Palette
- My Workspace
- Clipboard Manager
- Backup & Sync
- File Compatibility Center
- System Health
- Accessibility Center
- Routines

These are added alongside the full Gold application set from previous releases, including File Explorer, Gold Office, Gold Mail, Settings, Registry Editor, Task Manager, Control Panel, Emerald DOS, Appstore, Application Editor, Staff Center, Sticky Notes, Snipping Tool, Voice Recorder, Focus Sessions, update tools, and utilities.

FULL VM CONTINUITY
Gold 1O migrates and preserves all available files, folders, settings, preferences, Registry data, mail, application data, custom logos, notes, tasks, events, contacts, tickets, notifications, Staff data, update history, clipboard history, accessibility preferences, routines, backups, and other known VM categories.

Cloud autosave is blocked until migration has completed and been validated. Gold 1O recognizes Gold 1N split-cloud schemas and earlier Gold schemas. Conflicting files are preserved separately rather than overwritten.

FILE VERSION COMPATIBILITY
Files created by prior EmeraldOS Gold versions remain supported. File Compatibility Center checks metadata and safely fills missing identifiers, folders, types, and compatibility markers without rewriting file contents.

BACKUP POLICY
Backup & Sync creates local restore points and downloadable full-VM JSON backups. Restore and import operations merge files rather than deleting current files that are absent from an older backup.

E.L.S.U.S.
Original shell update flow:
1. Read system/emeraldGoldLatest.
2. Notify and ask the user before updating.
3. Save and validate the shared cloud VM.
4. Store the pending update manifest locally.
5. Return to ../gold-shell.html?force=1.

Shell V2 flow:
1. Shell V2 verifies the EmeraldOS account for routing.
2. Shell V2 finds the user's active Gold version.
3. Shell V2 opens Gold_1O/index.html when Gold 1O is the active route.
4. Gold 1O performs its own normal login.

PUBLISHING POLICY
Gold 1O does not publish on boot, login, setup, migration, update checking, Shell V2 routing, or query strings. system/emeraldGoldLatest is written only from Update Publisher Manager after Staff Edition verification, Emerald Mail verification, the publisher PIN, and clicking Publish this Version.

OPTIONAL SHELL V2 TEST
The combined distribution includes ELSUS_Shell_V2_1O_Test. Copy its contents to the EmeraldOS root only when testing Shell V2. Keep your existing version folders beside it.
