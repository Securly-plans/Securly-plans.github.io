EmeraldOS 5.0 - Major Release & Administrative Panel Update

Base: EmeraldOS 4.6 Office Suite & Desktop Consistency Update

Major changes:
- Adds Emerald Office as the consolidated office/productivity suite.
- Keeps the folder-based desktop model from 4.6.
- Removes the persistent blue selection box around desktop icons after opening apps.
- Adds Administrative Panel for Executive/admin users.
- Administrative Panel can list Emerald Games users and show their EmeraldOS saved file metadata.
- Password hashes are never displayed in the Administrative Panel.
- Adds Cloud Governance, Security Center, System Hub, Creative Hub, Developer Hub, and Productivity Hub.
- Adds more terminal commands: office, writer, sheet, slides, admin, security, desktop.repair50, hub.
- Keeps 40_ localStorage prefixes for EmeraldOS 4.x/5.x continuity.
- Developer edition remains staff-gated and Executive remains admin-gated.

Important:
- Keep your existing firebase.js in this folder.
- firebase.js must export db, and cloudstorage.js also expects storage for Firebase Storage.
- Admin Panel requires Firestore security rules that allow verified admins to read users and emeraldOSUsers drive metadata.
- If Firestore rules block reading, the panel will show a permission error rather than exposing data.
