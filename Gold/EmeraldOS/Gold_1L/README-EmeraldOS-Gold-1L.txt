EMERALDOS GOLD 1L

Complete standalone E.L.S.U.S.-compatible release folder.

Gold 1L keeps the Gold 1K Windows 10-inspired appearance, active update notifications, Focus Sessions, Quick Settings, Staff Center, live staff-control, custom application logos, and staff verification for user applications.

E.L.S.U.S. COMPATIBILITY
Gold 1L intentionally uses the original E.L.S.U.S. implementation from Gold 1I. It requires no additional root-shell patch, command bridge, heartbeat, or capability-negotiation layer.

Update flow:
1. Read system/emeraldGoldLatest.
2. Ask the user before updating.
3. Save emeraldOSUsers/{username}/goldVM/current.
4. Write emeraldGoldShell_pendingManifest locally.
5. Return to ../gold-shell.html?force=1.

PUBLISHING POLICY
Gold 1L never publishes itself during boot, login, migration, setup, update checking, or query-string processing. The shared Firestore version pointer is written only after Staff Edition and Emerald Mail verification, the correct publisher PIN, and a direct click on Publish this Version.

Upload this folder as EmeraldOS/Gold_1L/.
