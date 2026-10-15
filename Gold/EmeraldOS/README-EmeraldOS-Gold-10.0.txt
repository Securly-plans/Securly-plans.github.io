EmeraldOS Gold 10.0 Update-System Folder

Main launch file:
- gold-shell.html

Version folder:
- Gold_10.0/OS.html
- Gold_10.0/gold100.js
- Gold_10.0/gold100.css

What changed:
- Built from the fixed shell-update architecture.
- Adds a Gold_10.0 subfolder version.
- Root gold-shell.html is an invisible update launcher unless an error occurs.
- system/emeraldGoldLatest can point to Gold_10.0/OS.html.
- Adds first-run Firestore rules installer.
- Adds Security Rules Installer app for staff users.
- Adds FIRESTORE_RULES_GOLD_10.rules.
- Adds rules-installer.html.

Important:
Browser code cannot securely deploy Firestore Security Rules directly because that requires admin credentials. Gold 10.0 automatically stages the rules on first run and can call a secure backend deployer if you configure one. If no backend deployer is configured, copy/deploy FIRESTORE_RULES_GOLD_10.rules manually in Firebase Console or with Firebase CLI.

First-run rules behavior:
1. Gold_10.0 boots.
2. gold100.js checks localStorage gold100_rules_install_ran.
3. If it has not run, it stages the rules in Firestore.
4. If localStorage emeraldGoldRulesDeployerUrl exists, it POSTs the rules to that secure endpoint.
5. Staff can open Security Rules Installer inside Gold to review status and copy rules.

Seed latest pointer:
- Open seed-gold10-latest.html and click the button to write system/emeraldGoldLatest.
