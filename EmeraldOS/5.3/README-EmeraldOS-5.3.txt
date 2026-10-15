EmeraldOS 5.3 - Communication, Profiles & Files Update

Install:
1. Upload this folder to the EmeraldOS directory on GitHub Pages.
2. Keep firebase-config.js and firebase.js in the same folder as OS.html.
3. Open OS.html after logging in.

Main improvements:
- Fixes the maximized-window interaction bug so clicking inside a maximized window no longer minimizes it.
- Taskbar buttons now focus or restore windows instead of minimizing active windows.
- Uses only EmeraldOS 5.3 release labels in user-facing screens.
- Keeps the consolidated desktop folder layout.
- Removes persistent blue focus boxes around desktop app and folder icons.

Application additions:
- Emerald Office
- Emerald Writer
- Emerald Sheets
- Emerald Slides
- Emerald Forms
- Templates
- Document Vault
- Files
- Storage Center
- File Sharing
- Shared With Me
- Shared by Me
- Trash
- Emerald Chat
- Chat Rooms
- Direct Messages
- Communication Center
- EmeraldOS Users
- My Profile
- Contacts
- Friends
- Settings
- Notification Center
- Security & Privacy
- Privacy Center
- Emerald Assistant
- Desktop Tools
- App Manager
- Task Board
- Planner
- Reports
- Moderator Console
- Reports Review
- Communication Audit
- Moderation Log
- Administrative Panel
- User Administration
- Storage Administration
- Sharing Administration
- Security Audit

Firestore collections used:
- emeraldOSUsers
- emeraldOSUsers/{username}/drive
- emeraldOSUsers/{username}/contacts
- emeraldOSProfiles
- emeraldOSShares
- emeraldOSChatRooms
- emeraldOSChatRooms/{roomId}/messages
- emeraldOSChatReports
- emeraldOSChatMutes
- emeraldOSWarnings
- emeraldOSModerationLogs

Terminal commands:
version
build
office
writer
sheets
slides
files
storage
sharing
shared
chat
rooms
dm
users
profile
contacts
settings
notifications
assistant
desktop.clean
desktop.lock
desktop.unlock
moderation
mod
admin

Notes:
- Developer apps require verified mod/admin access.
- Executive apps require verified administrator access.
- The optional assistant can run in offline tips mode or connect to an OpenAI-compatible endpoint entered by the user in Settings.
