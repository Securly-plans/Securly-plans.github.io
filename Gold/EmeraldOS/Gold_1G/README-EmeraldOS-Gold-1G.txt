EmeraldOS Gold 1G OS Folder

This is only the OS version folder for E.L.S.U.S.; it does not include the shell.

Upload as:
EmeraldOS/Gold_1G/

Gold 1G is built from Gold 1F and applies the corrected E.L.S.U.S. VM model:
- First-Boot Setup is per signed-in user across the entire E.L.S.U.S. line, not per version.
- First-Boot Setup state is tracked locally and, when Firebase rules allow it, in emeraldOSUsers/{username}/goldVM/setup.
- User VM state is saved/restored from emeraldOSUsers/{username}/goldVM/current.
- Update Setup is per-version and runs for existing E.L.S.U.S. users updating into Gold 1G.
- Normal users no longer get redirected into Staff Edition after normal login.
- Staff apps/resources are gated in-place instead of hijacking the user desktop.
- Publishing requires Staff Edition, Update Publisher Manager, the publisher PIN, and clicking Publish this Version.
- No query string or first-boot flow auto-publishes the version.

Gold 1G also improves user experience:
- Cleaner EmeraldOS Gold desktop and taskbar behavior.
- Better VM continuity wording and setup flow.
- Improved Theme Studio and Accessibility behavior.
- Retains Task Manager, Staff Mail Portal, Gold Games, Update Setup, First-Boot Setup, and the virtual license/TOS agreement.

Recommended Firestore VM paths:
emeraldOSUsers/{username}/goldVM/setup
emeraldOSUsers/{username}/goldVM/current
emeraldOSUsers/{username}/goldVMSnapshots/{snapshotId}

To publish through E.L.S.U.S.:
1. Upload EmeraldOS/Gold_1G/.
2. Open Gold 1G normally.
3. Sign into Staff Edition.
4. Open Update Publisher Manager.
5. Enter the publisher PIN.
6. Click Publish this Version.


Quota-safe redesign patch:
- Gold 1G no longer writes the full cloud VM state into localStorage key gold1g_workspace.
- Full VM state saves to Firebase at emeraldOSUsers/{username}/goldVM/current when Firebase is available.
- Browser localStorage now keeps only gold1g_workspace_manifest, a compact pointer/summary.
- Oversized legacy workspace keys are cleaned up automatically if the browser reports QuotaExceededError.
- This prevents the crash: Failed to execute setItem on Storage: gold1g_workspace exceeded the quota.
