EmeraldOS Gold 10.0 does not expose Firebase Admin credentials in browser code.

On first boot, Gold_10.0 stages the recommended Firestore rules in:
- system/emeraldGoldRulesVersion
- emeraldGoldRulesInstallRequests

If you want automatic live deployment, create your own secured backend endpoint and set these in localStorage before first boot:
- emeraldGoldRulesDeployerUrl
- emeraldGoldRulesDeployerKey

The backend should verify the caller is staff/admin, then deploy FIRESTORE_RULES_GOLD_10.rules using Firebase CLI/Admin infrastructure. Do not put service-account private keys in any browser file.
