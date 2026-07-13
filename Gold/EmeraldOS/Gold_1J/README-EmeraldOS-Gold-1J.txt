EmeraldOS Gold 1J
=================

EmeraldOS Gold 1J is a complete standalone E.L.S.U.S.-compatible release that
keeps the Windows 10-inspired Gold 1H/1I appearance while restoring and expanding
shell integration, Staff Center administration, custom application logos, and
staff verification for user-created applications.

RELEASE IDENTITY
----------------
Product: EmeraldOS Gold
Version: 1J
Folder: Gold_1J
Entry page: OS.html
Update setup: Once per user for Gold 1J
First-Boot Setup: Once per user across the compatible E.L.S.U.S. Gold line
Cloud VM path: emeraldOSUsers/{username}/goldVM/current
Minimum optional root-shell bridge version: 1.1

E.L.S.U.S. SHELL COMPATIBILITY
------------------------------
Gold 1J includes an in-OS shell bridge that:
- Announces the running version, folder, user, entry page, and capabilities.
- Maintains ready/acknowledgement and heartbeat state.
- Accepts safe shell commands to open apps, save the VM, change theme, navigate,
  apply live staff controls, sign out, and deliver current release metadata.
- Saves the Gold VM before requesting a version change.
- Hands version changes to the parent shell when embedded.
- Falls back to safe standalone navigation when no parent shell is connected.
- Exposes an E.L.S.U.S. status application and taskbar connection indicator.

The ZIP also includes ELSUS_ROOT_PATCH/gold-shell-1j-bridge.js for the optional
root gold-shell.html side of the protocol.

RESTORED LIVE STAFF CENTER
--------------------------
A verified Gold Staff Edition session adds:
- Staff Center
- Live Staff Control
- Staff App Verification

The Staff Center provides live operational status, maintenance/support-only
controls, announcements, emergency notices, user-app restrictions, Application
Editor restrictions, Gold Mail restrictions, Focus Assist enforcement, active
Gold VM sessions, staff activity logs, app review, E.L.S.U.S. status, cloud VM
save controls, and access to the guarded Update Publisher Manager.

Cloud-backed controls use Firestore listeners. If Firestore is unavailable or
permissions block access, the Staff Center clearly reports the issue and keeps a
local fallback rather than breaking the desktop.

USER APPLICATION VERIFICATION
-----------------------------
User applications now use a complete staff review lifecycle:
- Draft: editable and previewable only by the creator.
- Pending staff review: submitted to emeraldGoldAppSubmissions.
- Staff verified: available for normal sandboxed launch and catalog install.
- Rejected: blocked from normal launch with staff notes retained.

Staff reviewers can inspect source code, declared capabilities, static risk
indicators, owner information, and SHA-256 source hashes before approving or
rejecting an application.

At every normal launch, Gold 1J recalculates the SHA-256 hash. A code change after
approval automatically invalidates verification and returns the app to Draft.
User app code runs in a sandboxed iframe and receives only the limited Gold app
API supplied by the Application Editor runtime.

CUSTOM APPLICATION LOGOS
------------------------
Gold 1J restores custom application logos for built-in and verified user apps.
Settings > Apps allows a user to choose, replace, reset, or reset all app logos.
Custom logos appear in the desktop, Start, taskbar, application windows, User
Appstore, and Staff App Verification views. They are included in VM cloud saves,
exports, imports, and migration categories.

WINDOWS 10-STYLE FEATURES AND SETTINGS
--------------------------------------
Gold 1J preserves the existing Windows 10-inspired shell and expands:
- System, Devices, Network, Personalization, Apps, Accounts, Time & Language,
  Gaming, Ease of Access, Search, Privacy, Update & Security, E.L.S.U.S., and
  staff settings categories.
- Taskbar search modes, small taskbar buttons, labels, and taskbar positioning.
- Default-app selections and custom-logo controls.
- Virtual desktops and Task View desktop controls.
- Sticky Notes, Snipping Tool, and Voice Recorder.
- Network status, offline fallback, clipboard and privacy controls.
- Time format, locale, text scale, reduced motion, high contrast, touch spacing,
  keyboard hints, and pointer-target settings.
- Shell heartbeat, safe shell commands, update routing, and connection status.

MIGRATION AND VM CONTINUITY
---------------------------
Gold 1J retains the stable gold1g_* local VM namespace and the shared cloud VM
path. Migration checks Gold 1A through 1I data, legacy monolithic workspaces,
split-cloud categories, historical drive documents, and common older file-system
objects. It merges files by ID and content signature so same-name files with
different contents or folders are preserved.

Gold 1J additionally saves and restores custom app logos, app verification cache,
E.L.S.U.S. shell state, Sticky Notes, voice-recording metadata, and user apps.
Migration never writes the shared Firestore release pointer.

LOGIN AND STAFF VERIFICATION
----------------------------
Normal sign-in supports case-insensitive usernames, lowercase and original-case
Firestore document IDs, users and emeraldOSUsers collections, SHA-256 password
hashes, and local recovery accounts.

Staff Edition requires both:
1. An approved EmeraldOS staff account.
2. A valid Emerald Mail account and password.

Passwords are not retained in the verified Staff Edition session.

PUBLISHING SAFETY
-----------------
Gold 1J does not write system/emeraldGoldLatest during boot, login, migration,
setup, cloud save, update checks, Staff Center operations, or shell switching.
The shared pointer is written only after a verified Staff Edition user opens
Update Publisher Manager, enters the correct publisher PIN, and clicks Publish
this Version.

UPLOAD
------
Upload the folder as:

EmeraldOS/Gold_1J/

Keep the folder and OS.html names aligned with the E.L.S.U.S. manifest.
