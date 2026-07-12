EmeraldOS Gold 1.3.2

This patch fixes the gold13.js settingsTab boot loop and adds user-requested staff remote control.

This patch fixes the Gold 1.3 startup/login issue and improves Staff Edition authentication.

Main fixes:
- loading.html now routes to the normal EmeraldOS Gold login when no user session exists.
- OS.html now blocks direct desktop access until a normal login session is present.
- index.html is now a real EmeraldOS Gold login page instead of only a landing page.
- BIOS normal boot now opens login first when needed.
- Emerald DOS now includes LOGIN, LOGOUT, BOOT, DESKTOP, STAFF and other useful commands.
- Staff login now recognizes Administrator / Operator-style roles in addition to admin, mod, staff, executive, owner and VIP.
- Staff login now tries direct Firestore document lookup before scanning collections.
- Emerald Mail lookup now supports records stored by full email, username, or collection scan.
- Staff Edition includes a current-session login option for already signed-in staff users.

Normal boot flow:
index.html -> sign in -> OS.html
loading.html -> OS.html if logged in, otherwise index.html
F12 -> bios.html
F9 -> staff.html

Firestore collections used for login:
users
EmeraldMail

Expected EmeraldOS user fields:
username
passwordHash
role or role2
locked

Expected Emerald Mail fields:
email or address or mail
passwordHash or mailPasswordHash

Notes:
- Keep the gold13_ storage prefix for compatibility with Gold 1.3 / 1.3.2 data.
- Upload the full folder for this patch.
- If Firebase rules block reads of users or EmeraldMail, Staff Edition will show a clear error and the preview button can still test the UI locally.
Gold 1.3.2 changes:
- Fixed the boot loop caused by `settingsTab is not defined` in gold13.js.
- Added a stable settingsTab function so Settings can switch tabs without breaking the boot process.
- Added user-requested Remote Control sessions from Support Center.
- When a user requests remote help, Gold creates a visible remote-control session with an on-screen banner.
- Users can end remote control at any time from the banner or Remote Control app.
- Staff tools can send visible remote commands: open apps, open Support, open Settings, open Explorer, tile/cascade windows, save workspace, restore workspace, send a message, or end the session.
- Staff remote commands sync through localStorage for same-device testing and through Firestore collection `emeraldOSGoldRemoteSessions` when rules allow it.
- Remote control does not silently control the physical device and does not hide the user-facing banner.

Remote control flow:
1. User logs in normally.
2. User opens Support Center.
3. User opens Remote Assistance.
4. User clicks Request Remote Help + Grant Control.
5. A red remote-control banner appears.
6. Staff logs into staff.html.
7. Staff sends commands from Remote Control Sessions.
8. User can click End Remote Control any time.

Firestore collection used for cross-device remote control:
emeraldOSGoldRemoteSessions
