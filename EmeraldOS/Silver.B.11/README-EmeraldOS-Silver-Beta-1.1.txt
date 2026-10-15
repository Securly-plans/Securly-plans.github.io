EmeraldOS Silver Beta 1.1
Customizable Desktop, Responsive UI, and Drive-like Office Update

This build expands Silver Beta into a more complete separate EmeraldOS product-line experience.

Major changes:
- Application folders remain part of Silver and are available in Silver Apps.
- Desktop folders can be removed from the desktop without deleting them from the system.
- Added Desktop Customizer for folders, pinned apps, icon size, density, wallpaper, sidebar, and base icon visibility.
- Added more Silver-specific applications and launchers.
- Added Silver Drive, a Google Drive-style Emerald Office workspace.
- Silver Office now centers around Drive, recent files, folders, starred items, trash, templates, Docs, Sheets, Slides, and Forms.
- Added cloud save/load support for the Silver Drive workspace using Firestore when firebase.js is available.
- Improved responsive layout for small, medium, and large screens.
- Improved Silver UI polish, window contents, taskbar sync button, Drive cards, and Office editors.

Important files:
- OS.html
- silver-beta11.css
- silver-beta11.js
- os.js
- os.css
- emerald57.js
- cloudstorage.js
- firebase.js
- firebase-config.js

Cloud continuity:
The Silver VM resume system still stores user session data in Firestore.
Silver Drive stores its Drive-style Office workspace in:

emeraldOSUsers/{username}/silverBeta11/drive

Upload the whole folder for this update because OS.html now loads silver-beta11.css and silver-beta11.js.
