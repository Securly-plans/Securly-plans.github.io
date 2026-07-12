EmeraldOS Gold 8.0.1 Boot Fix

This patch fixes the Gold 8.0 boot-blocking JavaScript error:

  Uncaught ReferenceError: openCloudSyncCenter80 is not defined

Fixes included:
- Removed the early startup reference to scoped Gold 8 Cloud Sync handlers.
- Exposes Cloud Sync Center, Settings 8.0, Theme Studio 8.0, BIOS options, cloud save, cloud restore, and cloud status after the Gold 8 setup handlers are loaded.
- Keeps EmeraldOS Gold 8.0 apps and features intact.
- Updates visible build text to EmeraldOS Gold 8.0.1.
- Keeps the cloud VM path at emeraldOSUsers/{username}/gold8/current for compatibility.

Upload the full EmeraldOS_Gold_8.0.1_BootFix folder, or replace gold80.js in your Gold 8.0 deployment with this fixed version.
