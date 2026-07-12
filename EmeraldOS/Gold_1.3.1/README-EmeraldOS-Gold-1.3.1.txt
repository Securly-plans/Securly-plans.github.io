EmeraldOS Gold 1.3.1
Boot, Login and Staff Edition Fix

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
- Keep the gold13_ storage prefix for compatibility with Gold 1.3 data.
- Upload the full folder for this patch.
- If Firebase rules block reads of users or EmeraldMail, Staff Edition will show a clear error and the preview button can still test the UI locally.
