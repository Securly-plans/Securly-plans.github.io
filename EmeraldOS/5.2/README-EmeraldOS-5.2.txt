EmeraldOS 5.2 - Integrated Chat, Files & Moderation Update

Drop-in upload notes:
1. Upload every file in this folder to the same EmeraldOS directory.
2. This build includes the provided firebase-config.js and firebase.js.
3. firebase.js must remain next to firebase-config.js because it imports ./firebase-config.js.
4. Keep Firestore and Storage rules aligned with your project policies.

Main additions:
- Integrated Emerald Chat replaces the old Emerald Games chat iframe.
- Emerald Chat works from Economy edition and higher.
- Direct messages between EmeraldOS users.
- User list pulled from emeraldOSUsers.
- Report message workflow.
- Developer mod/admin Chat Moderation tools.
- Executive Communication Audit app.
- Moderator tools include reports, recent messages, delete/restore message, mute/unmute user, warn user, and moderation log.
- Cloud storage, storage warnings, sharing, shared files, and user directory are consolidated into the Files app.
- File IDs are visible inside Files, but users can share by clicking Share next to a file.

New/updated apps:
- Files
- Emerald Chat
- Communication Center
- EmeraldOS Users
- Chat Moderation
- Moderation Log
- Communication Audit

Firestore collections used by 5.2:
- emeraldOSUsers
- emeraldOSUsers/{username}/drive
- emeraldOSShares
- emeraldOSChatRooms
- emeraldOSChatRooms/{roomId}/messages
- emeraldOSChatReports
- emeraldOSChatMutes
- emeraldOSModerationLogs

Terminal commands:
- chat
- emeraldchat
- comms
- communication
- users
- files
- storage
- sharing
- shared
- moderation
- mod
- modlog
- build
- version

Edition notes:
- Economy: Files, Emerald Chat, Communication Center, EmeraldOS Users.
- Home and higher: inherits Economy features plus existing Home features.
- Business and higher: inherits existing business/productivity features.
- Virtue and higher: inherits existing advanced tools.
- Developer: moderation tools for verified mod/admin users.
- Executive: communication audit and administrative-level review.
