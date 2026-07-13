EmeraldOS Gold 1F OS Folder

This is only the OS version folder for E.L.S.U.S.; it does not include the shell.

Upload as:
EmeraldOS/Gold_1F/

Gold 1F is built from Gold 1E and fixes:
- Update Setup not loading.
- Normal users being sent to Staff Edition after normal login.
- First-Boot Setup appearing per-version instead of once per E.L.S.U.S. compatible Gold VM user.
- Safer shell-login behavior when the shell passes a next URL.

Setup behavior:
- First-Boot Setup runs only if the signed-in user has never completed setup in an E.L.S.U.S. compatible Gold version.
- Update Setup runs when an existing Gold VM user updates to Gold 1F.
- Both setup flows still require the virtual license/TOS agreement.

Staff behavior:
- Normal login always opens the normal Gold desktop.
- Staff apps/resources remain hidden or gated until Staff Edition verification.
- Staff-only tools show a Staff Edition required panel instead of forcing normal users away from the desktop.

To publish through E.L.S.U.S., sign in through Staff Edition, open Update Publisher Manager, enter the publisher PIN, and publish Gold 1F.
