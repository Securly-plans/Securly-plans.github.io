EmeraldOS Gold 1.2
UX, Staff Edition, Office, Settings and Personalization Update

This package is a full drop-in EmeraldOS Gold build. It is independent from Silver and uses its own Gold 1.2 shell files:

- OS.html
- gold12.css
- gold12.js
- bios.html
- staff.html
- loading.html
- index.html
- register.html
- plans.html
- emerald-gold-logo.svg
- firebase.js
- firebase-config.js

Major improvements:

1. Fixed and improved Gold Office
- Gold Office now has working Docs, Sheets, Slides, Forms, Templates and Vault/Drive-style views.
- Docs support rich content editing, save, export HTML, export TXT and print.
- Sheets support editable cells, CSV export, row adding, and simple formula display for SUM/AVG ranges.
- Slides support edit/save, add slide and present mode.
- Forms support question editing, add question and preview.
- Office files save into Gold Explorer / Gold Drive records.

2. Better Windows 10-inspired Gold UI
- Lighter Windows 10-style EmeraldOS Gold shell.
- Modern taskbar, Start menu, tile-style pinned apps, Action Center, Search, Task View, and window controls.
- Vista/Silver files are not required for this Gold version.
- Original EmeraldOS styling only; no Microsoft assets are included.

3. More personalization/customization
- Themes: Gold Light, Blue Light, Emerald Light, Dark, High Contrast.
- Accent color picker.
- Built-in backgrounds and custom background image upload/URL.
- Desktop icon size, density, labels, taskbar buttons, Staff button, widgets, and accessibility toggles.
- First-boot setup wizard appears only once and can be reset.

4. Better Staff Edition
- staff.html is a dedicated Staff Edition login page.
- Staff login asks for EmeraldOS username/password and Emerald Mail account/password.
- When Firebase rules allow it, staff.html and the Staff Center try to verify against users and EmeraldMail.
- Staff Preview Mode is included for local testing when Firebase is unavailable.
- Staff Center includes file, mail, workspace, security and system control shortcuts.

5. Emerald Systems BIOS A1 and DOS
- F12 during loading opens Emerald Systems BIOS A1.
- F9 during loading opens Staff Edition.
- BIOS/DOS supports commands: HELP, VER, DIR, BOOT, GOLD, STAFF, SETUP, RESTORE, CLEAR, TIME, MEM, EXIT.
- The DOS command STAFF opens staff.html.

6. Working built-in apps
- Gold Explorer
- Gold Office
- Gold Mail
- Gold Chat
- People
- Settings
- Personalization
- Staff Center
- Emerald DOS
- Gold Store
- Creator Studio
- Calculator
- Notepad
- Photos
- Calendar
- Weather
- Alarms & Clock
- Gold To Do
- Sticky Notes
- Gold Paint
- Snip Board
- Voice Recorder
- Maps
- News
- Get Started
- Help + Support
- Restore Center
- Gold Update
- Security Center
- Feedback Hub

Cloud restore path:
emeraldOSUsers/{username}/gold12/current

Notes:
- Keep firebase.js and firebase-config.js in the same folder if you want Firebase sync and Staff verification.
- If Firebase permissions block reads/writes, Gold 1.2 still works locally through localStorage.
- Voice Recorder requires browser microphone permission and MediaRecorder support.
- This is Windows 10-inspired, but uses original EmeraldOS Gold CSS, logos, and app designs only.
