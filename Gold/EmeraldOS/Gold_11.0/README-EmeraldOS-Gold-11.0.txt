EmeraldOS Gold 11.0

This package is ONLY the OS version folder. It does not include the shell system.

Upload this folder as:

EmeraldOS/Gold_11.0/

Manual publish flow:
1. Upload Gold_11.0 next to your existing Gold_10.0 and gold-shell.html.
2. Open Gold_11.0/OS.html?publishLatest=1 once as a staff/admin user with Firestore write permission.
3. That publishes system/emeraldGoldLatest with folder: Gold_11.0.
4. Existing users keep their active version until they manually accept the update from System Update or from the shell login prompt.

This keeps the shell separate and lets each user update manually.

Important files:
- OS.html
- gold110.js
- gold110.css
- index.html
- register.html
- staff.html
- bios.html
- FIREBASE_EMERALDGOLDLATEST_11.0.json
