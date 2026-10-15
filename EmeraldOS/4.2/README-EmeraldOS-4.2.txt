EmeraldOS 4.2 - Pinning & Control Update

This build continues the EmeraldOS 4.x line from EmeraldOS 4.1.

Main additions:
- Windows 95-style right-click desktop menu.
- Application pinning to Start, Desktop, and Taskbar.
- Pinned desktop apps are movable and saved with 40_ localStorage keys.
- Pin state attempts to sync through the existing Firebase user settings layer when available.
- New Pin Manager application.
- New Quick Launcher application.
- New System Control Center.
- New Display Settings panel.
- New Startup Manager.
- New Desktop Sync Center.
- New Session Manager.
- New Keyboard Shortcuts panel.
- New apps including Notepad Pro, File Search, Character Map, Timers & Alarms, Password Vault, Process Manager, Device Manager, Network Monitor, Release Builder, and Admin Verifier.
- Additional terminal commands:
  pins
  pin.start <appId>
  pin.desktop <appId>
  pin.taskbar <appId>
  unpin.start <appId>
  unpin.desktop <appId>
  unpin.taskbar <appId>
  app.search <text>
  sys.control
  quick
  build

Compatibility:
- Keeps the 40_ storage prefix for EmeraldOS 4.x upgrades.
- Keeps Virtue as the default edition.
- Keeps Executive restricted to Emerald Games administrator verification through BIOS.
- Keeps Firebase Storage support for files larger than 1 MB from EmeraldOS 4.1.

Required:
- Keep firebase.js in this folder.
- firebase.js must export db and storage for all cloud features to work.

Upload target:
EmeraldOS/EmeraldOS_4.2_PinningControlUpdate/ or rename the folder to your desired production path.
