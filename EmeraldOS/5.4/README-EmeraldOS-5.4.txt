EmeraldOS 5.4 - Intelligence, Security & Management Update

This package is a full drop-in EmeraldOS 5.4 release folder.

Upload the whole folder to GitHub Pages. Keep firebase-config.js and firebase.js in the same folder.

Major additions:
- Application Editor: users can create sandboxed JavaScript applications and add them to the desktop.
- User Applications folder: saved custom apps appear in the desktop folder system.
- Files: folders, tags, starred files, recent files, Trash, details, version metadata, storage warnings, and direct sharing.
- File Sharing: share from Files, Shared by Me, Shared With Me, permissions, revoke access, and copy share info.
- Taskbar notification bell: unread notifications remain visible on the taskbar until marked read.
- Notification alerts for system events, file sharing, saved apps, storage warnings, and desktop tools.
- User blocking: block/unblock EmeraldOS users from People and Security tools.
- Emerald Chat hub with blocking links and communication tools.
- Emerald Assistant with offline tips and optional OpenAI-compatible endpoint settings.
- Emerald Office 5.4 improvements: Writer page layout, tables, print view, export HTML, and save to Files.
- Settings 3.0, Security & Privacy Center 2.0, Desktop Layout tools, App Manager, System Recovery, Moderation Center, and Administrative Panel.
- Window fix: maximized windows no longer minimize when clicked or interacted with.
- User-facing release labels are set to EmeraldOS 5.4.

Application Editor safety note:
Custom JavaScript applications run inside a restricted iframe sandbox. The default editor API allows drawing UI and sending notifications without giving direct access to EmeraldOS internals.

New terminal commands:
version
build
files
storage
sharing
office
writer
chat
users
block
notifications
bell
assistant
apps
app.editor
desktop.clean
desktop.lock
desktop.unlock
recovery
mod
admin
