TestOS 3.2.T.1 - True Edition System
Built on EmeraldOS 3.2

Install:
1. Upload every file in this folder into your Test-OS folder.
2. Keep firebase.js in Test-OS if your login/cloud storage already uses it.
3. Open Test-OS/index.html.
4. Login or register, then TestBIOS opens.
5. Choose the edition in TestBIOS.
6. TestOS loads with only that edition's apps visible.

Edition behavior:
- Home: Files, Notes, Docs, Calendar, Calculator, Clock, System, Plans, About.
- Business: Home + Workspace, Browser, App Store, Chat, Media Player.
- Virtue: Business + Terminal, Developer Tools, System Monitor, Wallpaper Manager, Desktop Manager, Paint.
- Executive: Virtue + Games, Executive Dashboard.

Permission rule:
Locked apps are hidden from the desktop, Start menu, startup apps, and restored sessions.
The OS does not display locked app buttons.

Important:
- OS.html intentionally does not load the old applications.js logic.
- applications.js is a safe compatibility stub to prevent duplicate declaration errors.
- The main app registry and edition filtering are in os.js.
- TestOS build data, badges, edition metadata, and helper apps are in testos32t1.js.
