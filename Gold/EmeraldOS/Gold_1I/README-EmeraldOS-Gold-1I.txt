EmeraldOS Gold 1I
=================

This is a complete standalone E.L.S.U.S.-compatible release folder. Upload the
entire Gold_1I directory beside your other Gold version folders.

RELEASE IDENTITY
----------------
Product: EmeraldOS Gold
Version: 1I
Folder: Gold_1I
Entry page: OS.html
Update setup: Per user for Gold 1I
First-Boot Setup: Once per user across the compatible E.L.S.U.S. Gold line
Cloud VM path: emeraldOSUsers/{username}/goldVM/current

IMPORTANT E.L.S.U.S. PUBLISHING RULE
------------------------------------
Gold 1I does not write system/emeraldGoldLatest during boot, login, migration,
First-Boot Setup, Update Setup, cloud save, or update checks.

The shared Firestore version pointer can be changed only when all of these are
true:
1. The user enters Gold Staff Edition.
2. The EmeraldOS staff account verifies.
3. The Emerald Mail account verifies.
4. The correct publisher PIN is entered in Update Publisher Manager.
5. The user physically clicks Publish this Version.

MIGRATION
---------
Gold 1I keeps the version-independent gold1g_* local VM namespace so existing
preferences and application data remain available. The migration bridge also
checks and merges files from:
- Gold 1A through Gold 1I file keys
- Legacy monolithic Gold workspaces
- emerald_session, emerald_workspace, and older file-system objects
- Legacy cloud VM documents
- Gold 1H split-cloud categories
- Common historical drive/root, drive/files, and cloudDrive/current documents

Files are merged by ID and content signature. A same-name file is retained when
its content or folder differs. Migration reports are written locally to:
- gold1g_migration_1i_report
- gold1g_migration_1i_cloud_report

Migration never changes the shared E.L.S.U.S. Firestore release pointer.

SEARCH FIX
----------
Gold 1H recreated the search input on every keystroke. Gold 1I keeps one input
node and updates only the results list, so the search field stays focused while
the user types normally.

NEW UTILITY APPLICATIONS
------------------------
- Unit Converter: length, mass, temperature, data, and time conversions
- Character Map: browse and copy symbols and Unicode characters
- Text Tools: word/line counts, case conversion, trimming, sorting, and cleanup
- Checksum Utility: SHA-256 checksums for text and uploaded files
- Storage Manager: inspect local VM usage, export VM data, and clear safe caches

USER-FRIENDLINESS AND UI
------------------------
- Preserves the Windows 10-inspired Gold 1H appearance
- Removes nested Start-menu layouts that previously collided
- Keeps panels, taskbar, clock, flyouts, and windows in consistent stacking layers
- Improves taskbar compression and long-label handling
- Improves keyboard focus indicators and narrow-screen behavior
- Keeps app inputs within window boundaries
- Adds responsive utility layouts and clearer status text

INCLUDED SYSTEMS
----------------
The release includes 30 applications and system tools, including File Explorer,
Gold Office, Gold Mail, Notepad, Calendar, Calculator, Alarms & Clock, Settings,
Task Manager, Registry Editor, Control Panel, Emerald DOS, Paint, Photos, People,
Support Center, Security Center, Restore Center, User Appstore, Application
Editor, Emerald Browser, Media Player, System Update, System Information, Get
Help, and the five new utility applications.

LOGIN AND STAFF EDITION
-----------------------
Normal sign-in supports case-insensitive usernames, lowercase or original-case
Firestore document IDs, the users and emeraldOSUsers collections, SHA-256
password hashes, and local recovery accounts.

Staff Edition requires both an approved EmeraldOS staff role and a valid Emerald
Mail login. Passwords are not stored in the Staff Edition session.

FIREBASE
--------
firebase-config.js contains the current securly-plans-main web configuration and
also supports deployment overrides through window.EMERALD_FIREBASE_CONFIG or
localStorage.emerald_firebase_config.

UPLOAD
------
Upload as:
EmeraldOS/Gold_1I/

Do not rename the folder or OS.html unless you also update the E.L.S.U.S.
manifest and shell routing configuration.
