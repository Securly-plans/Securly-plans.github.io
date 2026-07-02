EmeraldOS 5.1 - Office, Sharing & Storage Update

New in 5.1:
- Emerald Office 5.1 consolidated office suite.
- Emerald Writer 5.1 with richer document editing and saving to Files.
- Emerald Sheets, Slides, and Forms basic apps.
- Storage Center with file-size reporting and storage warnings.
- Files over 1 MB warn users before upload and continue to use Firebase Storage metadata support.
- Real file sharing system using the emeraldOSShares Firestore collection.
- Shared With Me app.
- EmeraldOS Users directory listing users from emeraldOSUsers.
- Terminal commands: office, writer, sheets, slides, storage, sharing, shared, users, build.

Required Firebase notes:
- Keep your existing firebase.js in this folder.
- firebase.js must export db and storage.
- Firestore rules must allow the intended users/admins to read emeraldOSUsers metadata and emeraldOSShares.
- Firebase Storage CORS still must be configured at the bucket level for large file previews/downloads.

Suggested Firestore collection for shares:
emeraldOSShares/{shareId}
- owner
- recipient
- ownerFileId
- fileName
- permission: view or edit
- createdAt
- updatedAt

EmeraldOS 4.x compatibility:
- Keeps the 40_ localStorage prefix.
- Default edition behavior remains compatible with the previous 5.0 build.
