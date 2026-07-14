EMERALDOS GOLD 1N

Complete standalone E.L.S.U.S.-compatible release folder.

Gold 1N keeps the Windows 10-inspired Gold interface from Gold 1M while improving everyday usability, repairing application layout collisions, and adding a built-in E.L.S.U.S. Shell V2 compatibility test. It remains compatible with the original E.L.S.U.S. root shell.

USER IMPROVEMENTS
- Welcome Center with recent files, migration status, cloud-save status, and common actions.
- Feedback Hub for saving and exporting usability reports inside the user VM.
- Shell V2 Compatibility application with account-route, folder, version, login, and migration checks.
- Shell V2 settings page.
- More responsive taskbar behavior on medium-width displays.
- Clearer status cards, tables, application actions, and narrow-window layouts.

FULL CONTINUITY
Gold 1N carries forward all available files, folders, settings, preferences, registry data, mail, app data, custom logos, notes, tasks, events, contacts, tickets, notifications, Staff data, update preferences, Focus Sessions, and other Gold VM categories.

Gold 1N explicitly reads Gold 1M local namespaces and split-cloud schemas in addition to earlier Gold versions. Cloud autosave remains blocked until migration has been merged and validated. Files with conflicting IDs or names are preserved separately rather than replaced.

FILE VERSION COMPATIBILITY
Files created by previous EmeraldOS Gold versions remain supported. Gold 1N preserves unknown file metadata, normalizes known earlier file types, and keeps original content during migration.

E.L.S.U.S. SHELL V2 TESTING
Gold 1N preserves these routing parameters through its own login and startup pages:
- elsusShell
- elsusUser
- elsusVersion
- elsusFolder

Shell V2 identifies the user's active Gold route, then opens Gold_1N/index.html. Gold 1N still performs its own normal login. Shell V2 does not set the operating system login state and does not replace VM data.

ORIGINAL E.L.S.U.S. COMPATIBILITY
Gold 1N also continues to support the original E.L.S.U.S. flow:
1. Read system/emeraldGoldLatest.
2. Ask the user before updating.
3. Save and validate the shared cloud VM.
4. Write the pending update manifest locally.
5. Return to ../gold-shell.html?force=1.

PUBLISHING POLICY
Gold 1N never publishes during boot, login, migration, setup, update checks, Shell V2 testing, or query-string processing. The shared Firestore latest-version pointer can be written only after Staff Edition and Emerald Mail verification, the correct publisher PIN, and a direct click on Publish this Version.

Upload the folder as EmeraldOS/Gold_1N/.
The optional ELSUS_Shell_V2_1N_Test folder in the full ZIP can be copied into the EmeraldOS root when testing Shell V2.
