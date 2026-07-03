EmeraldOS 5.5 - Applications, Files & Communication Update

This package is a full drop-in EmeraldOS 5.5 release folder.

Major features included:

- Application Editor 2.0.
- User-created JavaScript applications.
- Sandboxed user applications.
- User Appstore for publishing and installing user-created applications.
- Required center-screen warning before using User Appstore:
  "Warning! By using this feature, you expose yourself to risk of infection. Use at your own risk."
- Emerald App Library for installed custom apps.
- Application Templates.
- Application permissions panel.
- .eapp export and installer support.
- Real EmeraldOS file-type mapping for .edoc, .esheet, .eslide, .enote, .eapp, .etask, and .eform.
- Files, storage, sharing, Shared With Me, and Shared by Me remain consolidated into Files-related tools.
- Emerald Office improvements and Office 5.5 Hub.
- Integrated communication tools, profiles, contacts, message requests, and blocking tools.
- Notification bell remains visible on the taskbar for unread events such as shared documents and chat messages.
- Moderator tools and Appstore moderation tools.
- Administrative Panel and Application Administration tools.
- Desktop Layout tools, App Manager, Security Center, Settings, Recovery, and Assistant tools.

Important notes:

- Upload the full folder, not only emerald55.js.
- OS.html loads os.js and emerald55.js.
- firebase.js and firebase-config.js are included from the existing Firebase setup.
- User Appstore publishing uses Firestore collection emeraldOSAppStore when rules allow it.
- Appstore reports use emeraldOSAppStoreReports when rules allow it.
- User applications are sandboxed, but user-created JavaScript always carries risk. The warning modal is intentionally required before the User Appstore opens.

New / emphasized terminal commands:

version
build
appstore
store
app.library
app.templates
app.permissions
eapp
file.types
open.with
office55
profiles
requests
desktop.layout
admin.apps

Recommended upload order:

1. Upload all files from this folder.
2. Confirm OS.html loads emerald55.js.
3. Confirm firebase-config.js and firebase.js are in the same folder.
4. Boot EmeraldOS.
5. Open Applications > User Appstore and accept the warning.
6. Test Application Editor, App Library, .eapp Installer, and App Permissions.
