EmeraldOS 4.2.6 Context Menu & Pinning Fix

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


Hotfix included: final right-click handler now blocks old unstyled menus, positions the Win95 menu at the mouse, keeps it onscreen, preserves folder-based desktop pinning, and forces Win95 bottom-right toast styling.


EMERALDOS 4.2.6 HOTFIX
=======================

Changes:
- Audio Notes now has real recording logic using MediaRecorder.
- Audio notes save as audio files in Files and appear directly on the desktop.
- Audio files can be opened, played, moved, downloaded, and pinned/unpinned like other files.
- Large audio notes still use Firebase Storage when larger than 1 MB.
- cloudstorage.js now restores large stored media as data URLs when possible.
- Added cors.json for configuring Firebase Storage / Google Cloud Storage CORS.

Firebase Storage CORS setup:
1. Keep firebase.js in this folder and make sure it exports storage.
2. Upload cors.json to your machine or Cloud Shell.
3. Run one of these commands, replacing BUCKET_NAME with your Firebase Storage bucket name:

   gcloud storage buckets update gs://BUCKET_NAME --cors-file=cors.json

   or, if using gsutil:

   gsutil cors set cors.json gs://BUCKET_NAME

Your bucket name usually looks like project-id.appspot.com or project-id.firebasestorage.app.

Important: CORS is a bucket-level setting. It cannot be fully fixed from frontend JavaScript alone.
