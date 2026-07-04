EmeraldOS 5.7
Assistant, Creator Platform, Office and Mail Update

Upload the full folder to your EmeraldOS GitHub Pages directory.

OS.html loads:
- os.js
- emerald57.js

Major goals:
- Better assistant configuration through a Cloudflare Worker endpoint
- Better user experience, taskbar notifications, search, settings and recovery
- More coding and customization tools for Virtue and higher
- Better User Appstore and user application management
- Improved Emerald Office
- New Emerald Mail internal email service for EmeraldOS users

Included 5.7 features:
- Welcome Setup
- Experience Center
- Home Dashboard
- Emerald Search
- Command Palette
- Quick Settings
- Settings
- Accessibility tools
- Taskbar notification bell
- Notification Center
- Window Management
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
- Emerald Chat tools
- Contacts
- User Profile
- Blocking Center
- Security & Privacy Center
- Moderation Center
- Appstore Moderation
- Administrative Panel
- User Administration

Assistant features:
- Emerald Assistant app
- Assistant Settings app
- Assistant Sidebar
- Offline tips mode
- API mode with Cloudflare Worker endpoint
- Test Connection button
- Local assistant history
- Clear assistant history

Emerald Office 5.7 improvements:
- Emerald Office Hub
- Emerald Writer
- Writer templates: letter, memo, policy, report and meeting notes
- Writer toolbar: bold, italic, underline, bullets, numbering, date, table, template, print, save draft, save to Files, export HTML and export TXT
- Word and character count
- Local autosave draft
- Document Vault for Office files saved in Files
- Office Templates app
- Basic Sheets
- Basic Slides
- Basic Forms

Emerald Mail features:
- Internal EmeraldOS email-style messaging
- User addresses in the format username@emeraldos.mail
- Inbox
- Sent mail
- Compose
- Reply
- Delete from mailbox
- Save local mail draft
- Emerald Mail user directory from emeraldOSUsers
- Unread mail notification through the taskbar bell
- Uses Firestore collection emeraldOSMail

Coding and customization features:
- Application Editor
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
Application Editor, User Applications, Emerald App Library, .eapp Installer and User Appstore are Virtue edition features.

Firestore collections used where rules allow:
- emeraldOSUsers
- emeraldOSProfiles
- emeraldOSShares
- emeraldOSAppStore
- emeraldOSAppStoreReports
- emeraldOSChatRooms
- emeraldOSChatReports
- emeraldOSMail
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
- mail
- emeraldmail
- inbox
- assistant
- assistant.settings
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
- Emerald Mail is internal to EmeraldOS and does not send to outside internet email addresses.
