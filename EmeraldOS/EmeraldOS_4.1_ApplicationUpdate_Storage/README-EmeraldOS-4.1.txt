EmeraldOS 4.1 Application Update
=================================

This folder is a complete EmeraldOS 4.1 build based on the EmeraldOS 4.0/Virtue-default codebase.

Main updates:
- Rebranded to EmeraldOS 4.1 Application Update.
- Keeps 40_ localStorage keys so EmeraldOS 4.x settings, registry, layouts, and sessions can continue across later releases.
- Default edition remains EmeraldOS Virtue.
- Executive edition still requires Emerald Games admin verification in BIOS.
- Files larger than 1 MB are automatically stored in Firebase Storage.
- Firestore keeps file metadata, folder location, desktop pin state, timestamps, and Storage path.
- Small files still store directly in Firestore for speed and simplicity.
- Added Storage Manager and more application-update apps.

New applications:
- Release Notes
- Storage Manager
- PDF Viewer
- Image Gallery
- Media Studio
- Snippet Library
- Bookmarks
- Data Table
- SVG Viewer
- Backup & Restore

New terminal commands:
- storage.stats
- storage.large
- files.large
- open.storage
- app.update
- release
- apps.count

Required firebase.js export:
Your firebase.js in this folder must export storage in addition to db, for example:

export const storage = getStorage(app);

Firebase Storage rules must allow the logged-in/site user to write to:
emeraldOSUsers/{username}/driveBlobs/{fileId}

Upload note:
Copy your existing firebase.js into this folder before deploying, unless it is already present.
