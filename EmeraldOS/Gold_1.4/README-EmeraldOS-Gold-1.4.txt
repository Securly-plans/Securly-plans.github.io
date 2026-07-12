EmeraldOS Gold 1.4
====================

This release upgrades EmeraldOS Gold 1.3.2 into Gold 1.4.

Main changes:
- Independent SVG logo files for every built-in Gold app in /app-logos.
- More Windows 10-inspired Gold UI polish: lighter desktop, Start menu, taskbar, Action Center, app icons, and window styling.
- Normal EmeraldOS Gold login remains required before OS.html opens.
- Staff tools are staff-only. Non-staff users are routed to staff.html for verification instead of seeing staff controls.
- Staff preview access was removed.
- Staff Edition uses EmeraldOS credentials plus Emerald Mail credentials and accepts staff/admin/mod/operator/executive/owner roles.
- Remote Assistance now includes a live remote desktop state view after the user requests help and grants control.
- Staff can view an updating desktop preview, see open windows/recent files, and send visible control commands.
- Users always see a remote-control banner and can revoke control at any time.

Remote desktop notes:
The remote view is an EmeraldOS-safe live state preview, not hidden device-level control. It sends staff-approved in-OS commands such as opening apps, tiling windows, saving workspace, and sending visible messages. Cross-device live state uses Firestore collection emeraldOSGoldRemoteSessions when rules allow access.

Upload the whole folder. OS.html loads gold13.css and gold13.js, now updated for Gold 1.4.
