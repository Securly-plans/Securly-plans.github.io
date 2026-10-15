EmeraldOS 4.2.5 Context Menu & Pinning Fix

This build patches EmeraldOS 4.2 with:

- Fixed Win95-style desktop right-click menu.
- Context menu now positions relative to the mouse and clamps to the viewport.
- Context menu actions are wired through safe event handlers instead of relying on broken inline behavior.
- Desktop app pinning no longer reverts to the pre-folder desktop layout.
- Desktop remains folder-based, with pinned apps added alongside folders only when explicitly pinned.
- Pinned desktop app positions are movable and saved.
- Toast notifications are restyled in Windows 95 style.
- Toast notifications now appear in the bottom-right corner above the taskbar.

Keep firebase.js in this folder after upload. The build keeps the 40_ localStorage prefix for EmeraldOS 4.x compatibility.
