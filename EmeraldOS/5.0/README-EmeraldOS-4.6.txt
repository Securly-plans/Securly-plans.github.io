EmeraldOS 4.6 Office Suite & Desktop Consistency Update

This build is based on EmeraldOS 4.5 and keeps the 40_ storage prefix for 4.x compatibility.

Major fixes and additions:
- Fixes Office Apps missing from the desktop by forcing Office Apps to be an Economy-visible application folder.
- Adds Emerald 360 Hub as the main consolidated office suite.
- Adds Economy-level Word Lite, Sheet Lite, Slides Lite, and Document Viewer tools.
- Consolidates more same-purpose apps into suites.
- Adds more Home applications through Home Suite.
- Adds Emerald Assistant, an optional Clippy-like helper. It can use an OpenAI-compatible API only if the user supplies an API key in the app.
- Fixes taskbar behavior so clicking an already-visible maximized window's taskbar button focuses it instead of minimizing it.
- Adds a stronger folder-based desktop renderer for consistent desktop layout.
- Adds improved Win95 right-click menu entries for Office Apps, Emerald 360, display, system, desktop repair, files, and pinning.
- Keeps Developer gated to verified mod/admin and Executive gated to verified admin.

Required:
- Keep firebase.js in the same folder.
- If using Firebase Storage, firebase.js must export storage.
- Keep the existing cors.json if large file playback/downloads need CORS configuration.

Upload all files into your EmeraldOS 4.6 folder.
