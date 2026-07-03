EmeraldOS 5.6
User Experience, Reliability, Coding and Customization Update

Upload the full folder to your EmeraldOS GitHub Pages directory.
OS.html loads:
- os.js
- emerald56.js

Major goals:
- Better user experience
- Better desktop and window reliability
- Better settings, search, command palette, taskbar and notification center
- More coding tools
- More system customization tools
- User Applications and User Appstore require EmeraldOS Virtue or higher

Included 5.6 features:
- Welcome Setup
- Experience Center
- Home Dashboard
- Emerald Search
- Command Palette
- Quick Settings
- Settings 4.0
- Accessibility tools
- Taskbar notification bell
- Notification Center 6.0
- Window Management 2.0
- Desktop Layout tools
- Recovery Center
- Safe Mode
- Help System
- Feedback app
- Activity Center
- Files UX improvements
- Storage Center
- Shared With Me
- Shared By Me
- File sharing prompts
- Emerald Office 5.6
- Writer with toolbar, autosave, word count, tables, date insert, save to Files and HTML export
- Basic Sheets
- Basic Slides
- Basic Forms
- Emerald Chat tools
- Contacts
- User Profile
- Blocking Center
- Security & Privacy Center
- Moderation Center
- Appstore Moderation
- Administrative Panel
- User Administration

Coding and customization features:
- Application Editor 3.0
- Emerald App Library
- User Appstore
- App Permissions
- .eapp Installer
- Code Studio
- Custom App API Docs
- Code Snippets
- System Customizer for local CSS edits
- Registry Studio for local user registry edits
- Startup Script Center for sandboxed startup tools

User Appstore warning:
The first time a Virtue-or-higher user opens User Appstore, EmeraldOS shows this warning:
"Warning! By using this feature, you expose yourself to risk of infection. Use at your own risk."
The user must agree before continuing.

Edition change:
Application Editor, User Applications, Emerald App Library, .eapp Installer and User Appstore are now Virtue edition features.

Firestore collections used where rules allow:
- emeraldOSUsers
- emeraldOSProfiles
- emeraldOSShares
- emeraldOSAppStore
- emeraldOSAppStoreReports
- emeraldOSChatRooms
- emeraldOSChatReports
- emeraldOSFeedback
- emeraldOSBugReports
- emeraldOSAdminLogs

Terminal commands:
- version
- build
- search
- palette
- settings
- files
- office
- chat
- app.editor
- appstore
- code
- customizer
- recovery
- windows.reset
- windows.closeall
- desktop.clean
- desktop.reset

Keyboard shortcuts:
- Ctrl + Space: Emerald Search
- Ctrl + Shift + P: Command Palette
- Alt + Tab: cycle open windows
- Esc: close Command Palette

Notes:
- Keep firebase.js and firebase-config.js in the same folder.
- This package uses your existing Firebase configuration.
- User-created applications run in sandboxed iframes with permission controls.
- Safe Mode hides custom and Appstore apps temporarily.
