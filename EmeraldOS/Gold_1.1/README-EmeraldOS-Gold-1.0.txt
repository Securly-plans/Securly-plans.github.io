EmeraldOS Gold 1.0
===================

EmeraldOS Gold 1.0 is an independent EmeraldOS product model inspired by the general Windows 10 desktop experience while using original EmeraldOS design, styling, code, and assets.

Main files
----------
OS.html
  Main desktop shell.

gold10.css
  Gold desktop styling, taskbar, Start menu, windows, built-in app styling, responsive layout, first-boot setup styling.

gold10.js
  Main application logic for desktop, windows, Start menu, Action Center, Explorer, Office, Mail, Chat, Store, Creator Studio, Restore Center, Settings, Gold setup, personalization, and built-in Gold apps.

bios.html
  Emerald Systems BIOS A1 with included Emerald DOS.

index.html
  Local test login page.

loading.html
  Gold startup screen.

firebase.js / firebase-config.js
  Firebase support files for optional cloud workspace save/restore.

New in Gold 1.0
---------------
- Product renamed to EmeraldOS Gold 1.0.
- First-boot setup wizard appears only once per device/profile.
- Emerald Systems BIOS A1.
- Integrated Emerald DOS with commands: HELP, VER, DIR, BOOT, GOLD, SETUP, RESTORE, CLEAR, TIME, MEM, EXIT.
- More Windows 10-inspired original layout: Start menu, taskbar, Action Center, Search, Task View, Widgets, Settings, Control Panel, Restore Center.
- More customization: theme, accent, desktop layout, tile size, density, taskbar mode, first-boot reset.
- Apps styled more like built-in modern pre-installed apps.
- New built-in apps: Gold Calculator, Gold Notepad, Gold Photos, Gold Calendar, Gold Weather, Gold Alarms & Clock, Gold Browser, Gold Camera, Feedback Hub, Gold Maps, Gold News.
- Existing functional apps retained: Explorer, Gold Office, Gold Mail, Gold Chat, People, Store, Creator Studio, Settings, Control Panel, Action Center, Restore Center, Update Center, Device Link, Security Center, Media Center, Help.

Cloud restore path
------------------
emeraldOSUsers/{username}/gold10/current

First boot setup
----------------
The setup wizard stores completion under the Gold localStorage setup key. To run setup again:
1. Open Settings.
2. Open Gold Personalization.
3. Click Reset First Boot.
4. Reload EmeraldOS Gold.

You can also open bios.html and use the DOS command:
SETUP

Notes
-----
This is a Windows 10-inspired original EmeraldOS product. It does not include Microsoft logos, icons, wallpapers, sounds, or copied Windows assets.
