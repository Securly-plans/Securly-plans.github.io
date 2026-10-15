EmeraldOS Gold 4.0

Major focus:
- Restored user registration.
- Browser-based virtual machine login flow: sign in, boot, save, restore, and pick up where you left off.
- More Windows 10-inspired Gold UI polish and EmeraldOS branding.
- Emerald Systems BIOS A3 with expanded Emerald DOS commands.
- Improved User Appstore with JS-only upload support.
- Improved User Development with JS editor, preview, export, and Appstore submission.
- Gold VM Center for snapshots, save/restore, export/import backup.
- Firebase files included for login/registration/staff verification.

Important files:
- OS.html
- index.html
- register.html
- loading.html
- bios.html
- staff.html
- gold40.js
- gold40.css
- firebase.js
- firebase-config.js
- app-logos/

Upload the full EmeraldOS_Gold_4.0 folder.
Normal boot requires login. Registration writes to Firestore collection users with SHA-256 passwordHash.
Workspace cloud path: emeraldOSUsers/{username}/gold4/current
