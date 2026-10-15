EmeraldOS Gold 1.3
Experience, Support, BIOS, Staff Edition, Personalization and App Logic Update

Main files:
- OS.html
- gold13.css
- gold13.js
- bios.html
- staff.html
- loading.html
- index.html
- register.html
- plans.html
- firebase.js
- firebase-config.js
- emerald-gold-13-logo.svg

Major additions:
- Bell-style Emerald Systems BIOS A1.
- Built-in Emerald DOS.
- F12 startup options for BIOS/DOS, Safe Mode, Setup and Staff Edition.
- F9 startup shortcut for Gold Staff Edition.
- Support Center for ticket submission.
- Staff Center for ticket review, replies, resolving tickets, broadcast, remote assistance review and diagnostic requests.
- More safe remote-access-style staff controls. These tools are visible support tools, not silent destructive controls.
- More personalization settings including custom background URL, background upload, accent color, theme, taskbar search, Staff shortcut, icon size, labels, accessibility, focus assist and clock options.
- Better Windows 10-inspired Gold UI.
- App logos for each included app using original EmeraldOS CSS logo tiles.
- More working apps and stronger app logic.

Included apps:
- Gold Explorer
- Gold Office
- Gold Mail
- Gold Chat
- People
- Support Center
- Settings
- Personalization
- Gold Staff Center
- Emerald DOS
- BIOS Options
- Gold Store
- Creator Studio
- Calculator
- Notepad
- Sticky Notes
- Gold To Do
- Photos
- Calendar
- Weather
- Alarms & Clock
- Gold Paint
- Security Center
- Update Center
- Restore Center
- Feedback Hub
- Device Center

BIOS/DOS commands:
HELP, VER, DIR, BOOT, SAFE, SETUP, STAFF, RESTORE, RESET, DIAG, TIME, CLEAR, EXIT

Keyboard shortcuts:
- F1: Support Center
- F9: Staff Edition
- F12: Startup BIOS/DOS options
- Ctrl + Space: Search
- Ctrl + Shift + P: Command/Search palette
- Ctrl + Alt + S: Settings
- Ctrl + Alt + F: Gold Explorer
- Ctrl + Alt + O: Gold Office
- Alt + Tab: Task View

Cloud restore path:
emeraldOSUsers/{username}/gold13/current

Support tickets local storage key:
gold13_tickets

Optional Firestore collection for submitted tickets:
emeraldOSGoldTickets

Staff login:
The Staff Edition page tries to verify an EmeraldOS user from the Firestore users collection and an Emerald Mail account from the EmeraldMail collection. Passwords are SHA-256 hashed before comparison. Firestore security rules must allow the required reads for the logged-in staff process. A local preview mode is included for interface testing.

Notes:
- This is Windows 10-inspired only. It uses original EmeraldOS Gold styling, logos and assets.
- Upload the full folder because OS.html loads gold13.css and gold13.js.
