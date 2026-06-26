 EmeraldOS 4.0
==============

This package is conditioned from the previous TestOS 3.2.T.5 desktop-folder build into EmeraldOS 4.0.

Key changes:
- Product identity changed to EmeraldOS 4.0.
- LocalStorage keys now use the 40_ prefix instead of testos_.
- The default edition is EmeraldOS Virtue.
- Executive edition is admin-only.
- Executive can only be booted after verifying an Emerald Games account whose Firestore user document has role: admin.
- Locked edition apps remain hidden from desktop folders and Start menu.
- Desktop app folders remain enabled.
- Firebase-backed drive, registry/settings, and desktop layout sync remain enabled.

Important:
- Keep firebase.js inside this folder.
- Executive verification checks Firestore collection: users.
- It expects user documents with passwordHash and role fields.
- Admin users must have role set to admin.

Main boot path:
index.html -> bios.html -> loading.html -> OS.html

Default localStorage keys:
40_username
40_session
40_build_id
40_build_name
40_version
40_channel
40_test_build
40_edition
40_edition_name
40_executive_verified
40_executive_admin
40_executive_verified_at
40_theme
40_wallpaper
40_startup
40_registry_v3
40_desktop_positions_v5

Upload everything in this folder to your EmeraldOS repository as a standalone EmeraldOS 4.0 folder/build.
