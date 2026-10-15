"use strict";

/* =========================================================
   EMERALDOS 5.6
   USER EXPERIENCE, RELIABILITY, CODING AND CUSTOMIZATION
========================================================= */

import { db } from "./firebase.js";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    loadDrive,
    createFile as cloudCreateFile,
    saveFile as cloudSaveFile,
    deleteFile as cloudDeleteFile,
    getFileContent
} from "./cloudstorage.js";

(function () {
    if (window.EmeraldOS56Loaded) return;
    window.EmeraldOS56Loaded = true;

    const BUILD = {
        product: "EmeraldOS",
        version: "5.6",
        displayName: "EmeraldOS 5.6",
        codename: "User Experience & Reliability Update",
        fileLimit: 1024 * 1024
    };

    const LS = {
        notifications: "56_notifications",
        setupDone: "56_setup_done",
        quickSettings: "56_quick_settings",
        accessibility: "56_accessibility",
        simpleMode: "56_simple_mode",
        desktopPrefs: "56_desktop_prefs",
        windowPrefs: "56_window_prefs",
        userApps: "56_user_apps",
        appVersions: "56_app_versions",
        appPermissions: "56_app_permissions",
        appstoreConsent: "56_user_appstore_risk_agreed",
        localStore: "56_local_appstore_cache",
        registry: "56_system_registry",
        customCSS: "56_custom_system_css",
        startupScripts: "56_startup_scripts",
        contacts: "56_contacts",
        blocked: "56_blocked_users",
        profile: "56_profile",
        activities: "56_activity_log",
        officeDraft: "56_writer_draft",
        recovery: "56_recovery",
        settings: "56_settings",
        errorReports: "56_error_reports",
        feedback: "56_feedback"
    };

    const COL = {
        users: "emeraldOSUsers",
        profiles: "emeraldOSProfiles",
        shares: "emeraldOSShares",
        appstore: "emeraldOSAppStore",
        appstoreReports: "emeraldOSAppStoreReports",
        chatRooms: "emeraldOSChatRooms",
        reports: "emeraldOSChatReports",
        feedback: "emeraldOSFeedback",
        bugReports: "emeraldOSBugReports",
        adminLogs: "emeraldOSAdminLogs"
    };

    const EDITION_ORDER = { economy: 1, home: 2, business: 3, virtue: 4, developer: 5, executive: 6 };

    function safe(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function text(value) { return String(value ?? ""); }
    function now() { return Date.now(); }
    function id(prefix = "id") { return prefix + "_" + Math.random().toString(36).slice(2) + Date.now().toString(36); }
    function uid(value = "") { return String(value || "").trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "_").slice(0, 80) || "user"; }
    function dateTime(ts) { try { return new Date(Number(ts || Date.now())).toLocaleString(); } catch { return ""; } }

    function getJSON(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
        catch { return fallback; }
    }

    function setJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

    function currentUser() {
        return String(
            localStorage.getItem("40_username") ||
            localStorage.getItem("username") ||
            localStorage.getItem("40_session") ||
            "Guest"
        ).trim() || "Guest";
    }

    function roleText() {
        return String(localStorage.getItem("40_developer_role") || localStorage.getItem("role") || "").toLowerCase();
    }

    function isExecutive() {
        return localStorage.getItem("40_executive_verified") === "true" || roleText() === "admin";
    }

    function isModerator() {
        return isExecutive() || (localStorage.getItem("40_developer_verified") === "true" && ["admin", "mod"].includes(roleText()));
    }

    function canSee(required = "economy") {
        if (required === "executive") return isExecutive();
        if (required === "developer") return isModerator();
        if (typeof window.canSeeEdition === "function") return window.canSeeEdition(required);
        const active = localStorage.getItem("40_edition") || "virtue";
        return (EDITION_ORDER[active] || 4) >= (EDITION_ORDER[required] || 1);
    }

    function byteSize(value = "") { try { return new Blob([String(value || "")]).size; } catch { return String(value || "").length; } }
    function formatBytes(bytes = 0) {
        const n = Number(bytes || 0);
        if (n < 1024) return `${n} B`;
        if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
        return `${(n / (1024 * 1024)).toFixed(2)} MB`;
    }

    function button(label, action, className = "") {
        return `<button class="win95-small-button emerald56-btn ${safe(className)}" onclick="${action}">${safe(label)}</button>`;
    }

    function win(title, html, app = "emerald56") {
        return window.openWindow?.(title, `<div class="emerald56-panel">${html}</div>`, app) || null;
    }

    function logActivity(title, detail = "", category = "system") {
        const list = getJSON(LS.activities, []);
        list.unshift({ id: id("activity"), title, detail, category, time: now() });
        setJSON(LS.activities, list.slice(0, 100));
    }

    function addNotice(title, message = "", type = "info", category = "system", action = "") {
        const list = getJSON(LS.notifications, []);
        list.unshift({ id: id("note"), title, message, type, category, action, read: false, time: now() });
        setJSON(LS.notifications, list.slice(0, 150));
        logActivity(title, message, category);
        try { window.notify?.(title, message, 3200, type); } catch {}
        refreshBell();
    }

    function notifications() { return getJSON(LS.notifications, []); }
    function unreadCount() { return notifications().filter(n => !n.read).length; }

    function markAllRead56() {
        const list = notifications().map(n => Object.assign({}, n, { read: true }));
        setJSON(LS.notifications, list);
        refreshBell();
        openNotificationCenter56();
    }

    function clearNotifications56() {
        if (!confirm("Clear all notifications?")) return;
        setJSON(LS.notifications, []);
        refreshBell();
        openNotificationCenter56();
    }

    function refreshBell() {
        const bell = document.getElementById("emerald56-bell");
        if (!bell) return;
        const count = unreadCount();
        bell.innerHTML = count > 0 ? `Bell <b>${count}</b>` : "Bell";
        bell.classList.toggle("emerald56-bell-hot", count > 0);
        bell.title = count > 0 ? `${count} unread notification(s)` : "Notifications";
    }

    function installBell() {
        if (document.getElementById("emerald56-bell")) return;
        const taskbar = document.getElementById("taskbar");
        const clock = document.getElementById("clock");
        if (!taskbar) return;
        const bell = document.createElement("button");
        bell.id = "emerald56-bell";
        bell.className = "emerald56-bell";
        bell.onclick = () => openNotificationCenter56();
        taskbar.insertBefore(bell, clock || null);
        refreshBell();
    }

    function openNotificationCenter56() {
        const rows = notifications().map(n => `
            <tr class="${n.read ? "" : "emerald56-unread"}">
                <td><b>${safe(n.title)}</b><br><span class="emerald56-note">${safe(n.message)}</span></td>
                <td>${safe(n.category || "system")}</td>
                <td>${dateTime(n.time)}</td>
                <td>${n.action ? button("Open", n.action) : ""}</td>
            </tr>`).join("") || `<tr><td colspan="4">No notifications yet.</td></tr>`;
        win("Notification Center", `
            <h2>Notification Center 6.0</h2>
            <div class="emerald56-toolbar">${button("Mark All Read", "markAllRead56()")}${button("Clear All", "clearNotifications56()")}${button("Settings", "openNotificationSettings56()")}</div>
            <table class="emerald56-table"><tr><th>Notification</th><th>Category</th><th>Time</th><th>Action</th></tr>${rows}</table>
        `, "notifications56");
    }

    function openNotificationSettings56() {
        const s = getJSON(LS.settings, { notifications: true, sounds: false, chat: true, sharing: true, appstore: true, storage: true });
        win("Notification Settings", `
            <h2>Notification Settings</h2>
            ${check("notif56Main", "Enable notifications", s.notifications)}
            ${check("notif56Sounds", "Enable notification sounds", s.sounds)}
            ${check("notif56Chat", "Chat notifications", s.chat)}
            ${check("notif56Sharing", "Shared document notifications", s.sharing)}
            ${check("notif56Appstore", "User Appstore notifications", s.appstore)}
            ${check("notif56Storage", "Storage warnings", s.storage)}
            <div class="emerald56-toolbar">${button("Save", "saveNotificationSettings56()")}</div>
        `, "notificationSettings56");
    }

    function saveNotificationSettings56() {
        const s = Object.assign(getJSON(LS.settings, {}), {
            notifications: !!document.getElementById("notif56Main")?.checked,
            sounds: !!document.getElementById("notif56Sounds")?.checked,
            chat: !!document.getElementById("notif56Chat")?.checked,
            sharing: !!document.getElementById("notif56Sharing")?.checked,
            appstore: !!document.getElementById("notif56Appstore")?.checked,
            storage: !!document.getElementById("notif56Storage")?.checked
        });
        setJSON(LS.settings, s);
        addNotice("Notification settings saved", "Your notification preferences were updated.", "success", "settings");
    }

    function check(idValue, label, checked) {
        return `<label class="emerald56-check"><input id="${safe(idValue)}" type="checkbox" ${checked ? "checked" : ""}> ${safe(label)}</label>`;
    }

    /* =====================================================
       WINDOW AND DESKTOP RELIABILITY PATCHES
    ===================================================== */

    function installWindowFixes() {
        document.addEventListener("click", e => {
            const btn = e.target.closest?.("#taskbar-apps .taskbar-item");
            if (!btn) return;
            e.preventDefault();
            e.stopImmediatePropagation();
            const wins = Array.from(window.openWindows || []);
            const target = wins.find(w => w.taskbarButton === btn);
            if (!target) return;
            target.style.display = "";
            target.dataset.minimized = "false";
            target.style.zIndex = String(9999 + Date.now() % 100000);
            btn.classList.add("active");
        }, true);

        document.addEventListener("mousedown", e => {
            const titleBar = e.target.closest?.(".title-bar");
            if (!titleBar) return;
            const w = titleBar.closest(".window");
            if (w?.dataset?.maximized === "true" && e.detail < 2) {
                e.stopImmediatePropagation();
            }
        }, true);

        document.addEventListener("dblclick", e => {
            const titleBar = e.target.closest?.(".title-bar");
            if (!titleBar) return;
            const w = titleBar.closest(".window");
            if (w && typeof window.toggleMaximize === "function") {
                try { window.toggleMaximize(w); } catch {}
            }
        }, true);
    }

    function resetWindows56() {
        Array.from(document.querySelectorAll(".window")).forEach((w, i) => {
            w.style.display = "";
            w.dataset.minimized = "false";
            w.dataset.maximized = "false";
            w.style.left = `${30 + i * 24}px`;
            w.style.top = `${30 + i * 24}px`;
            w.style.width = "720px";
            w.style.height = "480px";
            w.style.zIndex = String(200 + i);
        });
        addNotice("Windows reset", "Open windows were brought back on screen.", "success", "windows");
    }

    function closeAllWindows56() {
        if (!confirm("Close all open windows?")) return;
        Array.from(document.querySelectorAll(".window")).forEach(w => { w.taskbarButton?.remove?.(); w.remove(); });
        addNotice("Windows closed", "All windows were closed.", "info", "windows");
    }

    function openWindowManager56() {
        const rows = Array.from(document.querySelectorAll(".window")).map((w, i) => {
            const title = w.querySelector(".title-bar span")?.textContent || `Window ${i + 1}`;
            return `<tr><td>${safe(title)}</td><td>${safe(w.dataset.minimized === "true" ? "Minimized" : "Open")}</td><td>${safe(w.dataset.maximized === "true" ? "Maximized" : "Normal")}</td><td>${button("Focus", `focusWindow56(${i})`)}</td></tr>`;
        }).join("") || `<tr><td colspan="4">No open windows.</td></tr>`;
        win("Window Manager", `
            <h2>Window Management 2.0</h2>
            <div class="emerald56-toolbar">${button("Reset Windows", "resetWindows56()")}${button("Cascade", "cascadeWindows56()")}${button("Tile", "tileWindows56()")}${button("Close All", "closeAllWindows56()")}</div>
            <table class="emerald56-table"><tr><th>Window</th><th>Status</th><th>Size</th><th>Action</th></tr>${rows}</table>
        `, "windows56");
    }

    function focusWindow56(i) {
        const w = Array.from(document.querySelectorAll(".window"))[i];
        if (!w) return;
        w.style.display = "";
        w.dataset.minimized = "false";
        w.style.zIndex = String(9999 + Date.now() % 100000);
    }

    function cascadeWindows56() {
        Array.from(document.querySelectorAll(".window")).forEach((w, i) => {
            w.dataset.maximized = "false";
            w.style.display = "";
            w.style.left = `${20 + i * 26}px`;
            w.style.top = `${20 + i * 26}px`;
            w.style.width = "700px";
            w.style.height = "460px";
        });
    }

    function tileWindows56() {
        const wins = Array.from(document.querySelectorAll(".window"));
        if (!wins.length) return;
        const cols = Math.ceil(Math.sqrt(wins.length));
        const rows = Math.ceil(wins.length / cols);
        const width = Math.floor(window.innerWidth / cols);
        const height = Math.floor((window.innerHeight - 40) / rows);
        wins.forEach((w, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            w.dataset.maximized = "false";
            w.style.display = "";
            w.style.left = `${col * width}px`;
            w.style.top = `${row * height}px`;
            w.style.width = `${Math.max(320, width - 6)}px`;
            w.style.height = `${Math.max(220, height - 6)}px`;
        });
    }

    /* =====================================================
       USER APPLICATIONS, APPSTORE, CODING AND SYSTEM EDITING
    ===================================================== */

    const APP_TEMPLATES = {
        blank: `api.setTitle('Blank App');\napi.write('<h1>Blank Application</h1><p>Start building here.</p>');`,
        dashboard: `api.setTitle('Dashboard');\napi.write('<h1>Dashboard</h1><div id="stats">Ready</div>');\napi.button('Notify',()=>api.notify('Dashboard','Action completed.'));`,
        notes: `api.setTitle('Notes');\napi.write('<h1>Notes</h1><textarea id="note" style="width:100%;height:160px"></textarea><br>');\napi.button('Save',()=>{api.storeSet('note',document.getElementById('note').value);api.notify('Notes','Saved locally.');});\nsetTimeout(()=>{document.getElementById('note').value=api.storeGet('note','');},50);`,
        calculator: `api.setTitle('Calculator');\napi.write('<h1>Calculator</h1><input id="expr" style="width:100%" placeholder="2+2"><pre id="out"></pre>');\napi.button('Calculate',()=>{try{document.getElementById('out').textContent=Function('return ('+document.getElementById('expr').value+')')();}catch(e){document.getElementById('out').textContent=e.message;}});`,
        form: `api.setTitle('Form App');\napi.write('<h1>Form</h1><input id="name" placeholder="Name"><br><textarea id="msg" placeholder="Message"></textarea><pre id="out"></pre>');\napi.button('Submit',()=>{document.getElementById('out').textContent='Submitted: '+document.getElementById('name').value;api.notify('Form','Submission saved.');});`,
        fileUtility: `api.setTitle('File Utility');\napi.write('<h1>File Utility</h1><p>This demo exports a text file.</p>');\napi.button('Export Text',()=>api.download('export.txt','Created from a custom EmeraldOS app.'));`,
        commandTool: `api.setTitle('Command Tool');\napi.write('<h1>Command Tool</h1><input id="cmd" placeholder="Try: hello"><pre id="out"></pre>');\napi.button('Run',()=>{const c=document.getElementById('cmd').value;document.getElementById('out').textContent=c==='hello'?'Hello from EmeraldOS custom code.':'Unknown command: '+c;});`
    };

    function appList() { return getJSON(LS.userApps, []); }
    function saveAppList(list) { setJSON(LS.userApps, list); registerUserApps56(); rerender(); }
    function appPerms(appId) { return Object.assign({ notifications: true, localStorage: true, clipboard: false, links: false, username: false, downloads: true }, getJSON(LS.appPermissions, {})[appId] || {}); }

    function newAppId(name) { return "u" + uid(name).slice(0, 32) + "_" + Date.now().toString(36); }

    function openApplicationEditor56(appId = "") {
        if (!canSee("virtue")) return editionLock("Application Editor", "Virtue");
        const apps = appList();
        const selected = apps.find(a => a.id === appId) || { id: "", name: "My Application", icon: "APP", description: "A custom EmeraldOS application.", code: APP_TEMPLATES.dashboard };
        const savedRows = apps.map(a => `<tr><td><b>${safe(a.name)}</b><br><span class="emerald56-note">${safe(a.id)}</span></td><td>${safe(a.icon || "APP")}</td><td>${dateTime(a.updatedAt)}</td><td>${button("Edit", `openApplicationEditor56('${safe(a.id)}')`)} ${button("Run", `runUserApp56('${safe(a.id)}')`)} ${button("Export", `exportEapp56('${safe(a.id)}')`)} ${button("Delete", `deleteUserApp56('${safe(a.id)}')`)}</td></tr>`).join("") || `<tr><td colspan="4">No custom apps yet.</td></tr>`;
        win("Application Editor 3.0", `
            <h2>Application Editor 3.0</h2>
            <div class="emerald56-warn"><b>Virtue feature:</b> Custom apps run in a sandboxed application frame. Use the API documentation and permission controls before publishing.</div>
            <div class="emerald56-grid2">
                <div>
                    <label>Application Name</label><input id="app56Id" type="hidden" value="${safe(selected.id)}"><input id="app56Name" value="${safe(selected.name)}">
                    <label>Icon Label</label><input id="app56Icon" value="${safe(selected.icon || "APP")}">
                    <label>Description</label><textarea id="app56Description" style="height:70px">${safe(selected.description || "")}</textarea>
                    <label>Template</label><select id="app56Template">${Object.keys(APP_TEMPLATES).map(k => `<option value="${k}">${safe(k)}</option>`).join("")}</select>
                    <div class="emerald56-toolbar">${button("Insert Template", "insertTemplate56()")}${button("API Docs", "openAPIDocs56()")}${button("Snippets", "openCodeSnippets56()")}</div>
                </div>
                <div>
                    <label>Application JavaScript</label>
                    <textarea id="app56Code" class="emerald56-codearea" spellcheck="false">${safe(selected.code || "")}</textarea>
                </div>
            </div>
            <div class="emerald56-toolbar">
                ${button("Save", "saveUserApp56()")}
                ${button("Run Preview", "previewUserApp56()")}
                ${button("Version History", `openAppVersionHistory56('${safe(selected.id)}')`)}
                ${button("Permissions", `openAppPermissions56('${safe(selected.id)}')`)}
                ${button("Export .eapp", `exportEapp56('${safe(selected.id)}')`)}
                ${button("Publish", `openPublishApp56('${safe(selected.id)}')`)}
                ${button("App Library", "openAppLibrary56()")}
            </div>
            <h3>Saved User Applications</h3>
            <table class="emerald56-table"><tr><th>Name</th><th>Icon</th><th>Updated</th><th>Actions</th></tr>${savedRows}</table>
        `, "appEditor56");
    }

    function insertTemplate56() {
        const key = document.getElementById("app56Template")?.value || "blank";
        const area = document.getElementById("app56Code");
        if (area) area.value = APP_TEMPLATES[key] || APP_TEMPLATES.blank;
    }

    function saveUserApp56() {
        const idField = document.getElementById("app56Id");
        const name = document.getElementById("app56Name")?.value?.trim() || "Untitled Application";
        const icon = document.getElementById("app56Icon")?.value?.trim() || "APP";
        const description = document.getElementById("app56Description")?.value || "";
        const code = document.getElementById("app56Code")?.value || "";
        const list = appList();
        let appId = idField?.value || "";
        if (!appId) appId = newAppId(name);
        const existingIndex = list.findIndex(a => a.id === appId);
        if (existingIndex >= 0) saveAppVersion(appId, list[existingIndex]);
        const record = { id: appId, name, icon, description, code, edition: "virtue", updatedAt: now(), createdAt: existingIndex >= 0 ? list[existingIndex].createdAt : now() };
        if (existingIndex >= 0) list[existingIndex] = Object.assign({}, list[existingIndex], record);
        else list.push(record);
        saveAppList(list);
        addNotice("Application saved", `${name} was saved to User Applications.`, "success", "application-editor", `runUserApp56('${safe(appId)}')`);
        openApplicationEditor56(appId);
    }

    function saveAppVersion(appId, previous) {
        if (!appId || !previous) return;
        const versions = getJSON(LS.appVersions, {});
        versions[appId] = versions[appId] || [];
        versions[appId].unshift({ time: now(), app: previous });
        versions[appId] = versions[appId].slice(0, 10);
        setJSON(LS.appVersions, versions);
    }

    function openAppVersionHistory56(appId = "") {
        if (!appId) return alert("Save the app before opening version history.");
        const versions = getJSON(LS.appVersions, {})[appId] || [];
        const rows = versions.map((v, i) => `<tr><td>${dateTime(v.time)}</td><td>${safe(v.app?.name || "Application")}</td><td>${button("Restore", `restoreAppVersion56('${safe(appId)}',${i})`)}</td></tr>`).join("") || `<tr><td colspan="3">No previous versions saved yet.</td></tr>`;
        win("App Version History", `<h2>Version History</h2><table class="emerald56-table"><tr><th>Saved</th><th>Name</th><th>Action</th></tr>${rows}</table>`, "appVersions56");
    }

    function restoreAppVersion56(appId, index) {
        const versions = getJSON(LS.appVersions, {});
        const version = versions[appId]?.[index]?.app;
        if (!version) return alert("Version not found.");
        const list = appList();
        const i = list.findIndex(a => a.id === appId);
        if (i >= 0) list[i] = Object.assign({}, version, { updatedAt: now() });
        saveAppList(list);
        addNotice("Application restored", "A previous app version was restored.", "success", "application-editor");
        openApplicationEditor56(appId);
    }

    function deleteUserApp56(appId) {
        if (!confirm("Delete this custom application?")) return;
        saveAppList(appList().filter(a => a.id !== appId));
        addNotice("Application deleted", "The custom app was removed.", "info", "application-editor");
        openApplicationEditor56();
    }

    function previewUserApp56() {
        const temp = {
            id: "preview_" + Date.now(),
            name: document.getElementById("app56Name")?.value || "Preview",
            icon: document.getElementById("app56Icon")?.value || "APP",
            code: document.getElementById("app56Code")?.value || "",
            description: document.getElementById("app56Description")?.value || "Preview"
        };
        launchSandbox(temp);
    }

    function runUserApp56(appId) {
        if (!canSee("virtue")) return editionLock("User Applications", "Virtue");
        const app = appList().find(a => a.id === appId);
        if (!app) return alert("Application not found.");
        launchSandbox(app);
    }

    function launchSandbox(app) {
        const perms = appPerms(app.id);
        const frameId = "appframe56_" + Math.random().toString(36).slice(2);
        win(app.name || "User Application", `<iframe id="${frameId}" class="emerald56-app-frame" sandbox="allow-scripts allow-forms allow-modals allow-downloads"></iframe>`, "userapp56");
        setTimeout(() => {
            const frame = document.getElementById(frameId);
            if (!frame) return;
            const src = `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Tahoma,Arial,sans-serif;background:#fff;margin:0;padding:10px;color:#000}button,input,textarea,select{font-family:inherit;margin:3px}button{padding:4px 8px}.top{background:#c0c0c0;border:2px solid;border-color:#fff #808080 #808080 #fff;padding:6px;margin-bottom:8px}.card{border:1px solid #808080;background:#f5f5f5;padding:8px;margin:6px 0}table{border-collapse:collapse;width:100%}td,th{border:1px solid #808080;padding:4px}</style></head><body><div class="top"><b id="title"></b></div><div id="app"></div><script>const app=document.getElementById('app');const PERMS=${JSON.stringify(perms)};const APPID=${JSON.stringify(app.id)};const api={setTitle:t=>{document.getElementById('title').textContent=String(t||'')},write:h=>{app.innerHTML=String(h||'')},append:h=>{app.insertAdjacentHTML('beforeend',String(h||''))},text:t=>{app.textContent=String(t||'')},button:(label,fn)=>{const b=document.createElement('button');b.textContent=label;b.onclick=fn;app.appendChild(b);return b},input:(placeholder='')=>{const i=document.createElement('input');i.placeholder=placeholder;app.appendChild(i);return i},textarea:(placeholder='')=>{const t=document.createElement('textarea');t.placeholder=placeholder;t.style.width='100%';t.style.minHeight='90px';app.appendChild(t);return t},table:(rows)=>{const table=document.createElement('table');(rows||[]).forEach(r=>{const tr=document.createElement('tr');(r||[]).forEach(c=>{const td=document.createElement('td');td.textContent=String(c);tr.appendChild(td)});table.appendChild(tr)});app.appendChild(table);return table},notify:(title,message)=>{if(PERMS.notifications) parent.postMessage({type:'emerald56_notify',title:String(title||'Application'),message:String(message||''),appId:APPID},'*')},storeSet:(k,v)=>{if(PERMS.localStorage)localStorage.setItem('app_'+APPID+'_'+k,JSON.stringify(v))},storeGet:(k,f)=>{if(!PERMS.localStorage)return f;try{return JSON.parse(localStorage.getItem('app_'+APPID+'_'+k)||JSON.stringify(f))}catch{return f}},download:(name,content)=>{if(!PERMS.downloads)return;const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([String(content||'')]));a.download=name||'export.txt';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)},copyText:async(t)=>{if(PERMS.clipboard&&navigator.clipboard)await navigator.clipboard.writeText(String(t||''))},openLink:u=>{if(PERMS.links) window.open(String(u||''),'_blank')},getUsername:()=>PERMS.username?${JSON.stringify(currentUser())}:'',emit:(name,payload)=>parent.postMessage({type:'emerald56_event',name,payload,appId:APPID},'*')};try{api.setTitle(${JSON.stringify(app.name || "User Application")});new Function('api',${JSON.stringify(app.code || "api.write('<h1>Empty application</h1>');")})(api)}catch(err){app.innerHTML='<pre style="color:#800000;white-space:pre-wrap"></pre>';app.querySelector('pre').textContent='Application error: '+err.message;}<\/script></body></html>`;
            frame.srcdoc = src;
        }, 80);
    }

    window.addEventListener("message", ev => {
        if (ev.data?.type === "emerald56_notify") addNotice(ev.data.title || "Application", ev.data.message || "", "info", "custom-app");
        if (ev.data?.type === "emerald56_event") console.log("EmeraldOS app event", ev.data);
    });

    function openAppLibrary56() {
        if (!canSee("virtue")) return editionLock("Emerald App Library", "Virtue");
        const rows = appList().map(a => `<tr><td><b>${safe(a.name)}</b><br><span class="emerald56-note">${safe(a.description || a.id)}</span></td><td>${safe(a.icon || "APP")}</td><td>${safe(a.source || "Local")}</td><td>${button("Run", `runUserApp56('${safe(a.id)}')`)} ${button("Edit", `openApplicationEditor56('${safe(a.id)}')`)} ${button("Permissions", `openAppPermissions56('${safe(a.id)}')`)} ${button("Publish", `openPublishApp56('${safe(a.id)}')`)}</td></tr>`).join("") || `<tr><td colspan="4">No installed custom apps.</td></tr>`;
        win("Emerald App Library", `<h2>Emerald App Library</h2><div class="emerald56-toolbar">${button("Create App", "openApplicationEditor56()")}${button("Import .eapp", "openEappInstaller56()")}${button("User Appstore", "openUserAppstore56()")}</div><table class="emerald56-table"><tr><th>Application</th><th>Icon</th><th>Source</th><th>Actions</th></tr>${rows}</table>`, "appLibrary56");
    }

    function openAppPermissions56(appId = "") {
        if (!appId) {
            const rows = appList().map(a => `<tr><td>${safe(a.name)}</td><td>${button("Permissions", `openAppPermissions56('${safe(a.id)}')`)}</td></tr>`).join("") || `<tr><td colspan="2">No custom apps.</td></tr>`;
            return win("App Permissions", `<h2>App Permissions</h2><table class="emerald56-table"><tr><th>App</th><th>Action</th></tr>${rows}</table>`, "appPerms56");
        }
        const app = appList().find(a => a.id === appId);
        const p = appPerms(appId);
        win("App Permissions", `<h2>Permissions: ${safe(app?.name || appId)}</h2>${["notifications","localStorage","clipboard","links","username","downloads"].map(k => check("perm56_"+k, k, p[k])).join("")}<div class="emerald56-toolbar">${button("Save", `saveAppPermissions56('${safe(appId)}')`)}</div>`, "appPerms56");
    }

    function saveAppPermissions56(appId) {
        const all = getJSON(LS.appPermissions, {});
        all[appId] = {};
        ["notifications","localStorage","clipboard","links","username","downloads"].forEach(k => all[appId][k] = !!document.getElementById("perm56_" + k)?.checked);
        setJSON(LS.appPermissions, all);
        addNotice("Permissions saved", "Custom application permissions were updated.", "success", "custom-apps");
    }

    function exportEapp56(appId) {
        const app = appList().find(a => a.id === appId);
        if (!app) return alert("Save the app before exporting.");
        const payload = { format: "EmeraldOS .eapp", version: "5.6", exportedAt: now(), app };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${uid(app.name)}.eapp`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 500);
        addNotice("Application exported", `${app.name} was exported as .eapp.`, "success", "custom-apps");
    }

    function openEappInstaller56() {
        if (!canSee("virtue")) return editionLock(".eapp Installer", "Virtue");
        win(".eapp Installer", `<h2>.eapp Installer</h2><div class="emerald56-warn">Only install application packages from sources you trust.</div><textarea id="eapp56Text" class="emerald56-codearea" placeholder="Paste .eapp JSON here"></textarea><div class="emerald56-toolbar">${button("Install", "installEapp56()")}${button("Open App Library", "openAppLibrary56()")}</div>`, "eapp56");
    }

    function installEapp56() {
        try {
            const payload = JSON.parse(document.getElementById("eapp56Text")?.value || "{}");
            const app = payload.app || payload;
            if (!app.code || !app.name) throw new Error("Invalid .eapp package.");
            app.id = newAppId(app.name);
            app.source = ".eapp";
            app.installedAt = now();
            app.updatedAt = now();
            const list = appList();
            list.push(app);
            saveAppList(list);
            addNotice("Application installed", `${app.name} was installed from .eapp.`, "success", "custom-apps", `runUserApp56('${safe(app.id)}')`);
            openAppLibrary56();
        } catch (err) { alert("Install failed: " + err.message); }
    }

    async function appstoreDocs() {
        const list = [];
        try {
            const snap = await getDocs(collection(db, COL.appstore));
            snap.forEach(d => list.push(Object.assign({ storeId: d.id }, d.data() || {})));
        } catch (err) { console.warn("Appstore Firestore unavailable", err); }
        const local = getJSON(LS.localStore, []);
        const map = new Map();
        [...list, ...local].forEach(a => map.set(a.storeId || a.id, a));
        return Array.from(map.values()).sort((a, b) => Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0));
    }

    function showAppstoreRisk56() {
        if (!canSee("virtue")) return editionLock("User Appstore", "Virtue");
        const old = document.getElementById("emerald56-risk");
        if (old) old.remove();
        const modal = document.createElement("div");
        modal.id = "emerald56-risk";
        modal.className = "emerald56-modal-screen";
        modal.innerHTML = `<div class="emerald56-modal"><div class="emerald56-modal-title">User Appstore Warning</div><div class="emerald56-modal-body"><div class="emerald56-danger">Warning! By using this feature, you expose yourself to risk of infection. Use at your own risk.</div><p>User Appstore applications are created by other users. EmeraldOS uses sandboxing and permissions, but you should still review code and install only apps you trust.</p><div class="emerald56-toolbar right"><button class="win95-small-button" onclick="document.getElementById('emerald56-risk').remove()">Cancel</button><button class="win95-small-button" onclick="localStorage.setItem('${LS.appstoreConsent}','true');document.getElementById('emerald56-risk').remove();openUserAppstore56(true)">Agree and Continue</button></div></div></div>`;
        document.body.appendChild(modal);
    }

    async function openUserAppstore56(force = false) {
        if (!canSee("virtue")) return editionLock("User Appstore", "Virtue");
        if (!force && localStorage.getItem(LS.appstoreConsent) !== "true") return showAppstoreRisk56();
        win("User Appstore", `<h2>User Appstore</h2><div class="emerald56-warn">Loading community applications...</div>`, "appstore56");
        const apps = await appstoreDocs();
        const cards = apps.map(a => `<div class="emerald56-card"><h3>${safe(a.icon || "APP")} ${safe(a.name || "Untitled")}</h3><p>${safe(a.description || "No description provided.")}</p><div><span class="emerald56-pill">Publisher: ${safe(a.publisher || "Unknown")}</span><span class="emerald56-pill">Version: ${safe(a.version || "1.0")}</span><span class="emerald56-pill">Downloads: ${safe(a.downloads || 0)}</span></div><div class="emerald56-toolbar">${button("Install", `installStoreApp56('${safe(a.storeId || a.id)}')`)}${button("View Code", `viewStoreCode56('${safe(a.storeId || a.id)}')`)}${button("Report", `reportStoreApp56('${safe(a.storeId || a.id)}')`, "danger")}</div></div>`).join("") || `<div class="emerald56-inset">No applications have been published yet.</div>`;
        win("User Appstore", `<h2>User Appstore</h2><div class="emerald56-danger">Warning! By using this feature, you expose yourself to risk of infection. Use at your own risk.</div><div class="emerald56-toolbar">${button("Refresh", "openUserAppstore56(true)")}${button("Publish My App", "openPublishApp56()")}${button("Installed Apps", "openAppLibrary56()")}${button("Permissions", "openAppPermissions56()")}</div><div class="emerald56-gridcards">${cards}</div>`, "appstore56");
    }

    async function findStoreApp(storeId) { return (await appstoreDocs()).find(a => String(a.storeId || a.id) === String(storeId)); }

    async function installStoreApp56(storeId) {
        const app = await findStoreApp(storeId);
        if (!app) return alert("Application not found.");
        if (!confirm("Install this user-created application? Review the code first if you are not sure.")) return;
        const record = { id: newAppId(app.name || "Store App"), name: app.name || "Store App", icon: app.icon || "APP", description: app.description || "Installed from User Appstore.", code: app.code || "api.write('<h1>Empty app</h1>');", source: "User Appstore", publisher: app.publisher || "Unknown", sourceStoreId: storeId, edition: "virtue", installedAt: now(), updatedAt: now() };
        const list = appList(); list.push(record); saveAppList(list);
        try { if (app.storeId) await updateDoc(doc(db, COL.appstore, app.storeId), { downloads: Number(app.downloads || 0) + 1, lastDownloadedAt: now() }); } catch {}
        addNotice("Application installed", `${record.name} was installed into the Emerald App Library.`, "success", "appstore", `runUserApp56('${safe(record.id)}')`);
        openAppLibrary56();
    }

    async function viewStoreCode56(storeId) {
        const app = await findStoreApp(storeId);
        if (!app) return alert("Application not found.");
        win("App Code Review", `<h2>${safe(app.name || "Application")}</h2><div class="emerald56-danger">Review code before installing user applications.</div><pre class="emerald56-code-preview">${safe(app.code || "")}</pre><div class="emerald56-toolbar">${button("Install", `installStoreApp56('${safe(storeId)}')`)}</div>`, "codeReview56");
    }

    function openPublishApp56(appId = "") {
        if (!canSee("virtue")) return editionLock("Publish Application", "Virtue");
        const apps = appList();
        const opts = apps.map(a => `<option value="${safe(a.id)}" ${a.id === appId ? "selected" : ""}>${safe(a.name)}</option>`).join("");
        win("Publish Application", `<h2>Publish to User Appstore</h2><div class="emerald56-danger">Warning! By using this feature, you expose yourself to risk of infection. Use at your own risk.</div><label>Select App</label><select id="publish56App">${opts}</select><label>Description</label><textarea id="publish56Description" style="height:90px"></textarea><label>Category</label><input id="publish56Category" value="Productivity"><label>Version</label><input id="publish56Version" value="1.0"><div class="emerald56-toolbar">${button("Publish", "publishSelectedApp56()")}${button("Create App", "openApplicationEditor56()")}</div>`, "publish56");
    }

    async function publishSelectedApp56() {
        const appId = document.getElementById("publish56App")?.value;
        const app = appList().find(a => a.id === appId);
        if (!app) return alert("Choose an app first.");
        const record = { name: app.name, icon: app.icon || "APP", description: document.getElementById("publish56Description")?.value || app.description || "No description provided.", category: document.getElementById("publish56Category")?.value || "General", version: document.getElementById("publish56Version")?.value || "1.0", code: app.code || "", publisher: currentUser(), downloads: 0, createdAt: now(), updatedAt: now() };
        try {
            await addDoc(collection(db, COL.appstore), record);
            addNotice("Application published", `${app.name} was published to the User Appstore.`, "success", "appstore");
        } catch (err) {
            const local = getJSON(LS.localStore, []);
            local.unshift(Object.assign({ storeId: "local_" + newAppId(app.name) }, record));
            setJSON(LS.localStore, local.slice(0, 120));
            addNotice("Application saved locally", "Firestore was unavailable, so the app was saved to the local Appstore cache.", "warning", "appstore");
        }
        openUserAppstore56(true);
    }

    async function reportStoreApp56(storeId) {
        const reason = prompt("Why are you reporting this application?");
        if (!reason) return;
        try { await addDoc(collection(db, COL.appstoreReports), { storeId, reason, reporter: currentUser(), createdAt: now(), status: "open" }); }
        catch { const reports = getJSON("56_local_appstore_reports", []); reports.push({ storeId, reason, reporter: currentUser(), createdAt: now(), status: "open" }); setJSON("56_local_appstore_reports", reports); }
        addNotice("Application reported", "Your Appstore report was submitted.", "info", "appstore");
    }

    function openAPIDocs56() {
        win("Custom App API Docs", `<h2>Application Editor API</h2><table class="emerald56-table"><tr><th>API</th><th>Use</th></tr>${[
            ["api.setTitle(text)", "Set the app header title."], ["api.write(html)", "Replace app content."], ["api.append(html)", "Add content."], ["api.button(label, fn)", "Create a button."], ["api.input(placeholder)", "Create an input."], ["api.textarea(placeholder)", "Create a textarea."], ["api.table(rows)", "Create a table."], ["api.notify(title, message)", "Send an EmeraldOS notification."], ["api.storeSet(key, value)", "Save local app data."], ["api.storeGet(key, fallback)", "Read local app data."], ["api.download(name, content)", "Export a file."], ["api.copyText(text)", "Copy text if permission is enabled."], ["api.openLink(url)", "Open a link if permission is enabled."], ["api.getUsername()", "Get username if permission is enabled."]
        ].map(r => `<tr><td><code>${safe(r[0])}</code></td><td>${safe(r[1])}</td></tr>`).join("")}</table>`, "apiDocs56");
    }

    function openCodeSnippets56() {
        const snippets = Object.entries(APP_TEMPLATES).map(([k, v]) => `<h3>${safe(k)}</h3><pre class="emerald56-code-preview">${safe(v)}</pre>`).join("");
        win("Code Snippets", `<h2>Application Editor Snippets</h2>${snippets}`, "snippets56");
    }

    function openCodeStudio56() {
        win("Code Studio", `<h2>Code Studio</h2><p>Use this tool to test JavaScript in a safe custom-app style runner.</p><textarea id="codeStudio56" class="emerald56-codearea">api.setTitle('Code Studio Test');\napi.write('<h1>Code Studio Works</h1>');</textarea><div class="emerald56-toolbar">${button("Run as App", "runCodeStudio56()")}${button("Save as Application", "saveCodeStudioAsApp56()")}${button("API Docs", "openAPIDocs56()")}</div>`, "codeStudio56");
    }

    function runCodeStudio56() { launchSandbox({ id: "code_studio_preview", name: "Code Studio Preview", code: document.getElementById("codeStudio56")?.value || "" }); }
    function saveCodeStudioAsApp56() { openApplicationEditor56(); setTimeout(() => { const area = document.getElementById("app56Code"); if (area) area.value = document.getElementById("codeStudio56")?.value || ""; }, 200); }

    function openSystemCustomizer56() {
        const css = localStorage.getItem(LS.customCSS) || "/* Custom EmeraldOS CSS */\n#desktop { }\n.window { }";
        win("System Customizer", `<h2>System Customizer</h2><div class="emerald56-warn">This edits your local EmeraldOS appearance. Use Recovery Center if your layout becomes difficult to use.</div><textarea id="customCSS56" class="emerald56-codearea">${safe(css)}</textarea><div class="emerald56-toolbar">${button("Apply CSS", "saveCustomCSS56()")}${button("Reset CSS", "resetCustomCSS56()")}${button("Recovery Center", "openRecoveryCenter56()")}</div>`, "customizer56");
    }

    function injectCustomCSS56() {
        let style = document.getElementById("emerald56-custom-css");
        if (!style) { style = document.createElement("style"); style.id = "emerald56-custom-css"; document.head.appendChild(style); }
        style.textContent = localStorage.getItem(LS.customCSS) || "";
    }

    function saveCustomCSS56() { localStorage.setItem(LS.customCSS, document.getElementById("customCSS56")?.value || ""); injectCustomCSS56(); addNotice("Custom CSS applied", "System appearance changes were applied.", "success", "customize"); }
    function resetCustomCSS56() { localStorage.removeItem(LS.customCSS); injectCustomCSS56(); addNotice("Custom CSS reset", "System appearance returned to normal.", "info", "customize"); openSystemCustomizer56(); }

    function openRegistryStudio56() {
        const reg = JSON.stringify(getJSON(LS.registry, { "HKEY_CURRENT_USER\\Software\\EmeraldOS\\ExperienceMode": "standard", "HKEY_CURRENT_USER\\Software\\EmeraldOS\\DesktopLocked": false }), null, 2);
        win("Registry Studio", `<h2>Registry Studio</h2><div class="emerald56-warn">Local user registry editor. Invalid JSON will not be saved.</div><textarea id="registry56" class="emerald56-codearea">${safe(reg)}</textarea><div class="emerald56-toolbar">${button("Save Registry", "saveRegistry56()")}${button("Reset Registry", "resetRegistry56()")}</div>`, "registry56");
    }

    function saveRegistry56() { try { setJSON(LS.registry, JSON.parse(document.getElementById("registry56")?.value || "{}")); addNotice("Registry saved", "Local registry values were saved.", "success", "registry"); } catch (err) { alert("Registry JSON error: " + err.message); } }
    function resetRegistry56() { localStorage.removeItem(LS.registry); openRegistryStudio56(); }

    function openStartupEditor56() {
        const scripts = getJSON(LS.startupScripts, []);
        const rows = scripts.map(s => `<tr><td>${safe(s.name)}</td><td>${safe(s.enabled ? "Enabled" : "Disabled")}</td><td>${button("Run", `runStartupScript56('${safe(s.id)}')`)} ${button("Delete", `deleteStartupScript56('${safe(s.id)}')`)}</td></tr>`).join("") || `<tr><td colspan="3">No startup scripts.</td></tr>`;
        win("Startup Script Center", `<h2>Startup Script Center</h2><div class="emerald56-warn">Startup scripts are run as sandboxed custom app code, not as full OS code.</div><label>Name</label><input id="startup56Name" value="Startup Tool"><label>Script</label><textarea id="startup56Code" class="emerald56-codearea">api.notify('Startup Script','Sandbox script ran.');</textarea><div class="emerald56-toolbar">${button("Save Script", "saveStartupScript56()")}</div><h3>Saved Scripts</h3><table class="emerald56-table"><tr><th>Name</th><th>Status</th><th>Actions</th></tr>${rows}</table>`, "startupScripts56");
    }

    function saveStartupScript56() { const list = getJSON(LS.startupScripts, []); list.push({ id: id("startup"), name: document.getElementById("startup56Name")?.value || "Startup Script", code: document.getElementById("startup56Code")?.value || "", enabled: true, createdAt: now() }); setJSON(LS.startupScripts, list); openStartupEditor56(); }
    function runStartupScript56(scriptId) { const s = getJSON(LS.startupScripts, []).find(x => x.id === scriptId); if (s) launchSandbox({ id: s.id, name: s.name, code: s.code }); }
    function deleteStartupScript56(scriptId) { setJSON(LS.startupScripts, getJSON(LS.startupScripts, []).filter(s => s.id !== scriptId)); openStartupEditor56(); }

    /* =====================================================
       EXPERIENCE, SEARCH, SETTINGS, ACCESSIBILITY
    ===================================================== */

    function openWelcome56() {
        win("Welcome to EmeraldOS", `<h2>Welcome to EmeraldOS 5.6</h2><p>This setup helps you choose a comfortable experience.</p><div class="emerald56-gridcards"><div class="emerald56-card"><h3>Simple Mode</h3><p>Shows fewer apps and focuses on Files, Office, Chat, Settings, and Help.</p>${button("Use Simple Mode", "setSimpleMode56(true)")}</div><div class="emerald56-card"><h3>Advanced Mode</h3><p>Shows more tools including coding, appstore, customization, and system management.</p>${button("Use Advanced Mode", "setSimpleMode56(false)")}</div><div class="emerald56-card"><h3>Accessibility</h3><p>Adjust text size, icon size, contrast, and motion.</p>${button("Open Accessibility", "openAccessibility56()")}</div></div><div class="emerald56-toolbar">${button("Finish Setup", "finishSetup56()")}${button("Experience Center", "openExperienceCenter56()")}</div>`, "welcome56");
    }

    function finishSetup56() { localStorage.setItem(LS.setupDone, "true"); addNotice("Setup complete", "EmeraldOS is ready.", "success", "setup"); }
    function setSimpleMode56(value) { localStorage.setItem(LS.simpleMode, value ? "true" : "false"); addNotice("Experience mode changed", value ? "Simple Mode enabled." : "Advanced Mode enabled.", "success", "settings"); rerender(); }

    function openExperienceCenter56() {
        win("Experience Center", `<h2>Experience Center</h2><div class="emerald56-gridcards"><div class="emerald56-card"><h3>Getting Started</h3><p>Learn desktop basics, files, office, chat, and the appstore.</p>${button("Welcome Setup", "openWelcome56()")}${button("Help System", "openHelpSystem56()")}</div><div class="emerald56-card"><h3>Reliability</h3><p>Repair desktop, reset windows, recover drafts, and use Safe Mode.</p>${button("Recovery Center", "openRecoveryCenter56()")}${button("Window Manager", "openWindowManager56()")}</div><div class="emerald56-card"><h3>Personalization</h3><p>Change themes, layout, accessibility, and taskbar options.</p>${button("Settings", "openSettings56()")}${button("System Customizer", "openSystemCustomizer56()")}</div><div class="emerald56-card"><h3>Build Apps</h3><p>Use Application Editor, Code Studio, API Docs, and User Appstore.</p>${button("Application Editor", "openApplicationEditor56()")}${button("User Appstore", "openUserAppstore56()")}</div></div>`, "experience56");
    }

    function allSearchItems() {
        const apps = Object.entries(window.APPS || {}).filter(([id, app]) => appVisible(id)).map(([id, app]) => ({ type: "Application", title: app.name, detail: app.edition || "economy", action: `launchApp('${safe(id)}')` }));
        const notes = notifications().slice(0, 20).map(n => ({ type: "Notification", title: n.title, detail: n.message, action: "openNotificationCenter56()" }));
        const help = ["share a file", "install app", "create custom app", "reset desktop", "block user", "notifications", "storage warning"].map(h => ({ type: "Help", title: h, detail: "Help article", action: "openHelpSystem56()" }));
        return apps.concat(notes, help);
    }

    function openGlobalSearch56() {
        win("Emerald Search", `<h2>Emerald Search</h2><input id="search56Box" placeholder="Search apps, files, settings, users, help" oninput="renderSearch56()"><div id="search56Results" class="emerald56-results"></div>`, "search56");
        setTimeout(renderSearch56, 50);
    }

    function renderSearch56() {
        const q = String(document.getElementById("search56Box")?.value || "").toLowerCase();
        const results = allSearchItems().filter(i => !q || (i.title + " " + i.detail + " " + i.type).toLowerCase().includes(q)).slice(0, 80);
        const html = results.map(i => `<div class="emerald56-result" onclick="${i.action}"><b>${safe(i.title)}</b><span>${safe(i.type)} · ${safe(i.detail)}</span></div>`).join("") || `<div class="emerald56-inset">No results.</div>`;
        const el = document.getElementById("search56Results");
        if (el) el.innerHTML = html;
    }

    function openCommandPalette56() {
        const existing = document.getElementById("command56Overlay");
        if (existing) existing.remove();
        const div = document.createElement("div");
        div.id = "command56Overlay";
        div.className = "emerald56-command-overlay";
        div.innerHTML = `<div class="emerald56-command-box"><input id="command56Input" placeholder="Type a command: files, office, chat, settings, appstore"><div id="command56Results"></div></div>`;
        document.body.appendChild(div);
        document.getElementById("command56Input")?.focus();
        document.getElementById("command56Input")?.addEventListener("input", renderCommand56);
        renderCommand56();
    }

    function renderCommand56() {
        const q = String(document.getElementById("command56Input")?.value || "").toLowerCase();
        const cmds = [
            ["Open Files", "openFiles56()"], ["Open Emerald Office", "openOffice56()"], ["Open Chat", "openChat56()"], ["Open User Appstore", "openUserAppstore56()"], ["Create Application", "openApplicationEditor56()"], ["Open Settings", "openSettings56()"], ["Open Notifications", "openNotificationCenter56()"], ["Reset Windows", "resetWindows56()"], ["Open Recovery Center", "openRecoveryCenter56()"], ["Open Experience Center", "openExperienceCenter56()"]
        ].filter(c => !q || c[0].toLowerCase().includes(q));
        const html = cmds.map(c => `<div class="emerald56-result" onclick="${c[1]};document.getElementById('command56Overlay')?.remove()"><b>${safe(c[0])}</b><span>${safe(c[1])}</span></div>`).join("");
        const out = document.getElementById("command56Results");
        if (out) out.innerHTML = html;
    }

    function openQuickSettings56() {
        const s = getJSON(LS.quickSettings, { notifications: true, focus: false, desktopLocked: false, assistant: false, theme: "classic" });
        win("Quick Settings", `<h2>Quick Settings</h2><div class="emerald56-gridcards"><div class="emerald56-card"><h3>Notifications</h3>${check("qs56Notifications", "Enabled", s.notifications)}</div><div class="emerald56-card"><h3>Focus Mode</h3>${check("qs56Focus", "Reduce interruptions", s.focus)}</div><div class="emerald56-card"><h3>Desktop Lock</h3>${check("qs56Desktop", "Lock desktop layout", s.desktopLocked)}</div><div class="emerald56-card"><h3>Assistant</h3>${check("qs56Assistant", "Enable Emerald Assistant", s.assistant)}</div></div><div class="emerald56-toolbar">${button("Save", "saveQuickSettings56()")}${button("Settings", "openSettings56()")}</div>`, "quickSettings56");
    }

    function saveQuickSettings56() { setJSON(LS.quickSettings, { notifications: !!document.getElementById("qs56Notifications")?.checked, focus: !!document.getElementById("qs56Focus")?.checked, desktopLocked: !!document.getElementById("qs56Desktop")?.checked, assistant: !!document.getElementById("qs56Assistant")?.checked }); addNotice("Quick settings saved", "Settings were updated.", "success", "settings"); applyAccessibility56(); }

    function openSettings56() {
        win("Settings", `<h2>Settings 4.0</h2><div class="emerald56-gridcards">${[
            ["Account", "Username, role, edition, profile.", "openProfile56()"], ["Appearance", "Themes, wallpaper, sounds.", "openThemeManager56()"], ["Desktop", "Lock, align, reset layout.", "openDesktopLayout56()"], ["Taskbar", "Bell, clock, quick settings.", "openTaskbarSettings56()"], ["Files", "Storage and sharing preferences.", "openFiles56()"], ["Chat", "Messages and blocking.", "openChat56()"], ["Notifications", "Notification categories and unread count.", "openNotificationSettings56()"], ["Application Editor", "Templates, API docs, permissions.", "openApplicationEditor56()"], ["User Appstore", "Community apps and safety warning.", "openUserAppstore56()"], ["Accessibility", "Text size, contrast, motion.", "openAccessibility56()"], ["Security", "Privacy and blocked users.", "openSecurityCenter56()"], ["Recovery", "Repair OS experience.", "openRecoveryCenter56()"]
        ].map(i => `<div class="emerald56-card"><h3>${safe(i[0])}</h3><p>${safe(i[1])}</p>${button("Open", i[2])}</div>`).join("")}</div>`, "settings56");
    }

    function openAccessibility56() {
        const a = getJSON(LS.accessibility, { textSize: "normal", iconSize: "normal", contrast: false, reducedMotion: false, focus: true });
        win("Accessibility", `<h2>Accessibility</h2><label>Text size</label><select id="acc56Text"><option ${a.textSize === "normal" ? "selected" : ""}>normal</option><option ${a.textSize === "large" ? "selected" : ""}>large</option><option ${a.textSize === "xlarge" ? "selected" : ""}>xlarge</option></select><label>Icon size</label><select id="acc56Icon"><option ${a.iconSize === "compact" ? "selected" : ""}>compact</option><option ${a.iconSize === "normal" ? "selected" : ""}>normal</option><option ${a.iconSize === "large" ? "selected" : ""}>large</option></select>${check("acc56Contrast", "High contrast", a.contrast)}${check("acc56Motion", "Reduced motion", a.reducedMotion)}${check("acc56Focus", "Show keyboard focus outline", a.focus)}<div class="emerald56-toolbar">${button("Save", "saveAccessibility56()")}</div>`, "accessibility56");
    }

    function saveAccessibility56() { setJSON(LS.accessibility, { textSize: document.getElementById("acc56Text")?.value || "normal", iconSize: document.getElementById("acc56Icon")?.value || "normal", contrast: !!document.getElementById("acc56Contrast")?.checked, reducedMotion: !!document.getElementById("acc56Motion")?.checked, focus: !!document.getElementById("acc56Focus")?.checked }); applyAccessibility56(); addNotice("Accessibility saved", "Accessibility settings were applied.", "success", "settings"); }

    function applyAccessibility56() {
        const a = getJSON(LS.accessibility, {});
        document.body.classList.toggle("emerald56-large-text", a.textSize === "large");
        document.body.classList.toggle("emerald56-xlarge-text", a.textSize === "xlarge");
        document.body.classList.toggle("emerald56-high-contrast", !!a.contrast);
        document.body.classList.toggle("emerald56-reduced-motion", !!a.reducedMotion);
        document.body.classList.toggle("emerald56-hide-focus", a.focus === false);
    }

    /* =====================================================
       FILES, SHARING, STORAGE, OFFICE, CHAT, PEOPLE
    ===================================================== */

    async function loadFiles() { try { const f = await loadDrive() || {}; if (window.fileSystem) window.fileSystem.files = f; return f; } catch { return window.fileSystem?.files || {}; } }
    function fileSize(file = {}) { return Number(file.storageSize || file.size || byteSize(file.content || "") || 0); }
    function fileType(name = "") { const l = String(name).toLowerCase(); if (/\.eapp$/i.test(l)) return "Emerald Application"; if (/\.edoc|\.txt|\.md|\.html$/i.test(l)) return "Document"; if (/\.esheet|\.csv$/i.test(l)) return "Spreadsheet"; if (/\.eslide$/i.test(l)) return "Presentation"; if (/\.enote$/i.test(l)) return "Note"; return "File"; }

    async function openFiles56() {
        const files = await loadFiles();
        const entries = Object.entries(files || {});
        const total = entries.reduce((sum, [, f]) => sum + fileSize(f), 0);
        const rows = entries.map(([fid, f]) => `<tr><td><b>${safe(f.name || fid)}</b><br><span class="emerald56-note">ID: ${safe(fid)} · ${safe(fileType(f.name))}</span></td><td>${formatBytes(fileSize(f))}</td><td>${safe(f.folder || "Drive")}</td><td>${button("Open", `openFile56('${safe(fid)}')`)} ${button("Share", `shareFilePrompt56('${safe(fid)}')`)} ${button("Details", `fileDetails56('${safe(fid)}')`)} ${button("Trash", `trashFile56('${safe(fid)}')`)}</td></tr>`).join("") || `<tr><td colspan="4">No files found.</td></tr>`;
        win("Files", `<h2>Files</h2><div class="emerald56-toolbar">${button("New Document", "newWriterDoc56()")}${button("Storage", "openStorage56()")}${button("Shared With Me", "openSharedWithMe56()")}${button("Shared By Me", "openSharedByMe56()")}${button("Refresh", "openFiles56()")}</div><div class="emerald56-meter"><div style="width:${Math.min(100, total / BUILD.fileLimit * 100)}%"></div></div><p>Estimated local file usage: <b>${formatBytes(total)}</b> / ${formatBytes(BUILD.fileLimit)} standard limit.</p><table class="emerald56-table"><tr><th>File</th><th>Size</th><th>Folder</th><th>Actions</th></tr>${rows}</table>`, "files56");
    }

    async function openFile56(fid) {
        const files = await loadFiles();
        const f = files[fid];
        if (!f) return alert("File not found.");
        let content = f.content;
        try { if (!content && typeof getFileContent === "function") content = await getFileContent(fid, f); } catch {}
        win("File Preview", `<h2>${safe(f.name || fid)}</h2><div class="emerald56-toolbar">${button("Details", `fileDetails56('${safe(fid)}')`)}${button("Share", `shareFilePrompt56('${safe(fid)}')`)}</div><pre class="emerald56-code-preview">${safe(content || "No preview available.")}</pre>`, "filePreview56");
    }

    async function fileDetails56(fid) {
        const files = await loadFiles(); const f = files[fid]; if (!f) return alert("File not found.");
        win("File Details", `<h2>${safe(f.name || fid)}</h2><table class="emerald56-table"><tr><th>Property</th><th>Value</th></tr><tr><td>File ID</td><td>${safe(fid)}</td></tr><tr><td>Type</td><td>${safe(fileType(f.name))}</td></tr><tr><td>Size</td><td>${formatBytes(fileSize(f))}</td></tr><tr><td>Folder</td><td>${safe(f.folder || "Drive")}</td></tr><tr><td>Shared</td><td>${safe(f.shared ? "Yes" : "Unknown")}</td></tr></table>`, "fileDetails56");
    }

    async function trashFile56(fid) { if (!confirm("Move this file to Trash?")) return; try { await cloudSaveFile(fid, { folder: "Trash", trashedAt: now() }); addNotice("File moved to Trash", "The file was moved to Trash.", "info", "files"); openFiles56(); } catch (err) { alert("Trash failed: " + err.message); } }

    async function shareFilePrompt56(fid) {
        const target = prompt("Share with EmeraldOS username:"); if (!target) return;
        const permission = prompt("Permission: view or edit", "view") || "view";
        try { await addDoc(collection(db, COL.shares), { fileId: fid, owner: currentUser(), targetUser: target.trim(), permission, createdAt: now(), status: "active" }); addNotice("File shared", `File was shared with ${target}.`, "success", "sharing", "openSharedByMe56()"); }
        catch (err) { alert("Share failed. Check Firestore rules. " + err.message); }
    }

    async function openSharedByMe56() {
        const rows = [];
        try { const snap = await getDocs(collection(db, COL.shares)); snap.forEach(d => { const s = d.data(); if (s.owner === currentUser()) rows.push(Object.assign({ id: d.id }, s)); }); } catch {}
        win("Shared By Me", `<h2>Shared By Me</h2><table class="emerald56-table"><tr><th>File ID</th><th>User</th><th>Permission</th><th>Action</th></tr>${rows.map(r => `<tr><td>${safe(r.fileId)}</td><td>${safe(r.targetUser)}</td><td>${safe(r.permission)}</td><td>${button("Revoke", `revokeShare56('${safe(r.id)}')`)}</td></tr>`).join("") || `<tr><td colspan="4">No outgoing shares found.</td></tr>`}</table>`, "sharedByMe56");
    }

    async function openSharedWithMe56() {
        const rows = [];
        try { const snap = await getDocs(collection(db, COL.shares)); snap.forEach(d => { const s = d.data(); if (String(s.targetUser).toLowerCase() === currentUser().toLowerCase()) rows.push(Object.assign({ id: d.id }, s)); }); } catch {}
        win("Shared With Me", `<h2>Shared With Me</h2><table class="emerald56-table"><tr><th>File ID</th><th>Owner</th><th>Permission</th></tr>${rows.map(r => `<tr><td>${safe(r.fileId)}</td><td>${safe(r.owner)}</td><td>${safe(r.permission)}</td></tr>`).join("") || `<tr><td colspan="3">No shared files found.</td></tr>`}</table>`, "sharedWithMe56");
    }

    async function revokeShare56(shareId) { try { await deleteDoc(doc(db, COL.shares, shareId)); addNotice("Share revoked", "File access was revoked.", "info", "sharing"); openSharedByMe56(); } catch (err) { alert("Revoke failed: " + err.message); } }

    async function openStorage56() {
        const files = await loadFiles();
        const entries = Object.entries(files || {}).sort((a,b)=>fileSize(b[1])-fileSize(a[1]));
        const total = entries.reduce((s,[,f])=>s+fileSize(f),0);
        const pct = Math.min(100, total / BUILD.fileLimit * 100);
        win("Storage Center", `<h2>Storage Center</h2><div class="emerald56-meter"><div style="width:${pct}%"></div></div><p><b>${formatBytes(total)}</b> used out of the standard ${formatBytes(BUILD.fileLimit)} limit.</p>${pct > 85 ? `<div class="emerald56-danger">Storage warning: you are close to the standard file limit.</div>` : ""}<h3>Largest Files</h3><table class="emerald56-table"><tr><th>File</th><th>Size</th><th>Action</th></tr>${entries.slice(0,20).map(([fid,f])=>`<tr><td>${safe(f.name||fid)}</td><td>${formatBytes(fileSize(f))}</td><td>${button("Details",`fileDetails56('${safe(fid)}')`)}</td></tr>`).join("")||`<tr><td colspan="3">No files.</td></tr>`}</table>`, "storage56");
    }

    function openOffice56() {
        win("Emerald Office", `<h2>Emerald Office 5.6</h2><div class="emerald56-gridcards"><div class="emerald56-card"><h3>Writer</h3><p>Page layout, autosave, word count, export, and file save.</p>${button("Open Writer", "openWriter56()")}</div><div class="emerald56-card"><h3>Sheets</h3><p>Basic formulas, CSV tools, totals, and cell editing.</p>${button("Open Sheets", "openSheets56()")}</div><div class="emerald56-card"><h3>Slides</h3><p>Slide list, themes, and present mode.</p>${button("Open Slides", "openSlides56()")}</div><div class="emerald56-card"><h3>Forms</h3><p>Build simple forms and preview responses.</p>${button("Open Forms", "openForms56()")}</div></div>`, "office56");
    }

    function openWriter56() {
        const draft = localStorage.getItem(LS.officeDraft) || "";
        win("Emerald Writer", `<h2>Emerald Writer</h2><div class="emerald56-toolbar">${button("Bold", "document.execCommand('bold')")}${button("Italic", "document.execCommand('italic')")}${button("Underline", "document.execCommand('underline')")}${button("Bullets", "document.execCommand('insertUnorderedList')")}${button("Numbering", "document.execCommand('insertOrderedList')")}${button("Insert Date", "writerInsertDate56()")}${button("Insert Table", "writerInsertTable56()")}${button("Save Draft", "saveWriterDraft56()")}${button("Save to Files", "saveWriterToFiles56()")}${button("Export HTML", "exportWriterHTML56()")}</div><div id="writer56Editor" class="emerald56-writer" contenteditable="true">${draft}</div><div class="emerald56-status" id="writer56Stats">Ready</div>`, "writer56");
        setTimeout(() => { const ed = document.getElementById("writer56Editor"); if (ed) ed.addEventListener("input", () => { localStorage.setItem(LS.officeDraft, ed.innerHTML); updateWriterStats56(); }); updateWriterStats56(); }, 60);
    }

    function updateWriterStats56() { const t = document.getElementById("writer56Editor")?.innerText || ""; const el = document.getElementById("writer56Stats"); if (el) el.textContent = `${t.trim().split(/\s+/).filter(Boolean).length} words · ${t.length} characters · Autosaved locally`; }
    function writerInsertDate56() { document.execCommand("insertText", false, new Date().toLocaleDateString()); }
    function writerInsertTable56() { document.execCommand("insertHTML", false, "<table border='1' style='width:100%'><tr><td>Cell</td><td>Cell</td></tr><tr><td>Cell</td><td>Cell</td></tr></table>"); }
    function saveWriterDraft56() { localStorage.setItem(LS.officeDraft, document.getElementById("writer56Editor")?.innerHTML || ""); addNotice("Document saved", "Writer draft was saved locally.", "success", "office"); }
    async function saveWriterToFiles56() { const name = prompt("Document name", "Document.edoc") || "Document.edoc"; const content = document.getElementById("writer56Editor")?.innerHTML || ""; if (byteSize(content) > BUILD.fileLimit) addNotice("Storage warning", "This document is larger than the standard file limit.", "warning", "storage"); try { await cloudCreateFile(name, content); addNotice("Document saved to Files", `${name} was saved.`, "success", "office", "openFiles56()"); } catch (err) { alert("Save failed: " + err.message); } }
    function exportWriterHTML56() { const blob = new Blob([document.getElementById("writer56Editor")?.innerHTML || ""], { type: "text/html" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "document.html"; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),500); }
    function newWriterDoc56() { openWriter56(); }
    function openSheets56() { win("Emerald Sheets", `<h2>Emerald Sheets</h2><p>Basic grid, CSV export, and totals.</p><textarea id="sheet56Data" class="emerald56-codearea">Item,Amount\nExample,10\nAnother,15</textarea><div class="emerald56-toolbar">${button("Export CSV", "exportSheetCSV56()")}${button("Auto Total", "sheetAutoTotal56()")}</div><pre id="sheet56Out" class="emerald56-code-preview"></pre>`, "sheets56"); }
    function exportSheetCSV56() { const blob = new Blob([document.getElementById("sheet56Data")?.value || ""], { type: "text/csv" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "sheet.csv"; a.click(); }
    function sheetAutoTotal56() { const rows = (document.getElementById("sheet56Data")?.value || "").split(/\n/).slice(1); const total = rows.reduce((s,r)=>s+Number((r.split(',')[1]||0)),0); document.getElementById("sheet56Out").textContent = "Total: " + total; }
    function openSlides56() { win("Emerald Slides", `<h2>Emerald Slides</h2><textarea id="slides56Data" class="emerald56-codearea">Slide 1: Welcome\nSlide 2: Features\nSlide 3: Finish</textarea><div class="emerald56-toolbar">${button("Present", "presentSlides56()")}</div>`, "slides56"); }
    function presentSlides56() { const slides = (document.getElementById("slides56Data")?.value || "").split(/\n/).filter(Boolean).map(s=>`<div class="emerald56-card"><h1>${safe(s)}</h1></div>`).join(""); win("Slide Presentation", `<div class="emerald56-slides">${slides}</div>`, "present56"); }
    function openForms56() { win("Emerald Forms", `<h2>Emerald Forms</h2><label>Question</label><input id="form56Question" value="What do you think?"><label>Type</label><select id="form56Type"><option>short answer</option><option>paragraph</option><option>multiple choice</option></select><div class="emerald56-toolbar">${button("Preview", "previewForm56()")}</div><div id="form56Preview"></div>`, "forms56"); }
    function previewForm56() { const q = document.getElementById("form56Question")?.value || "Question"; const out = document.getElementById("form56Preview"); if (out) out.innerHTML = `<div class="emerald56-card"><b>${safe(q)}</b><br><input placeholder="Answer"></div>`; }

    async function openChat56() { win("Emerald Chat", `<h2>Emerald Chat 4.0</h2><div class="emerald56-toolbar">${button("Global Room", "openChatRoom56('global')")}${button("Message Requests", "openMessageRequests56()")}${button("Contacts", "openContacts56()")}${button("Blocking", "openBlocking56()")}</div><div id="chat56Area" class="emerald56-chat"><p>Select a room.</p></div>`, "chat56"); }
    async function openChatRoom56(roomId = "global") { const area = document.getElementById("chat56Area"); if (!area) return openChat56(); area.innerHTML = `<h3>${safe(roomId)}</h3><div id="messages56">Loading...</div><input id="chat56Input" placeholder="Message"><button onclick="sendChat56('${safe(roomId)}')">Send</button>`; try { const snap = await getDocs(collection(db, COL.chatRooms, roomId, "messages")); const msgs=[]; snap.forEach(d=>msgs.push(d.data())); document.getElementById("messages56").innerHTML = msgs.sort((a,b)=>a.createdAt-b.createdAt).slice(-60).map(m=>`<div class="emerald56-msg"><b>${safe(m.from)}</b>: ${safe(m.text)} <button onclick="reportChat56('${safe(roomId)}','${safe(m.id||'')}')">Report</button></div>`).join("") || "No messages."; } catch { document.getElementById("messages56").textContent = "Could not load chat. Check Firestore rules."; } }
    async function sendChat56(roomId) { const input = document.getElementById("chat56Input"); const msg = input?.value?.trim(); if (!msg) return; if (isBlockedUser("chat")) return; const record = { id: id("msg"), from: currentUser(), text: msg, createdAt: now() }; try { await addDoc(collection(db, COL.chatRooms, roomId, "messages"), record); input.value=""; addNotice("Message sent", "Your chat message was sent.", "info", "chat"); openChatRoom56(roomId); } catch (err) { alert("Send failed: " + err.message); } }
    function reportChat56(roomId, messageId) { addNotice("Message reported", "The message report was added to moderation review.", "info", "moderation"); }

    function contacts() { return getJSON(LS.contacts, []); }
    function blocked() { return getJSON(LS.blocked, []); }
    function isBlockedUser(u) { return blocked().map(x=>x.toLowerCase()).includes(String(u).toLowerCase()); }
    function openContacts56() { const rows = contacts().map(c=>`<tr><td>${safe(c)}</td><td>${button("Chat", `openChat56()`)} ${button("Remove", `removeContact56('${safe(c)}')`)} ${button("Block", `blockUser56('${safe(c)}')`)}</td></tr>`).join("") || `<tr><td colspan="2">No contacts.</td></tr>`; win("Contacts", `<h2>Contacts</h2><input id="contact56Name" placeholder="Username"><button onclick="addContact56()">Add Contact</button><table class="emerald56-table"><tr><th>User</th><th>Actions</th></tr>${rows}</table>`, "contacts56"); }
    function addContact56() { const u = document.getElementById("contact56Name")?.value?.trim(); if (!u) return; setJSON(LS.contacts, Array.from(new Set([...contacts(), u]))); openContacts56(); }
    function removeContact56(u) { setJSON(LS.contacts, contacts().filter(c=>c!==u)); openContacts56(); }
    function openBlocking56() { const rows = blocked().map(u=>`<tr><td>${safe(u)}</td><td>${button("Unblock", `unblockUser56('${safe(u)}')`)}</td></tr>`).join("") || `<tr><td colspan="2">No blocked users.</td></tr>`; win("Blocking Center", `<h2>Blocking Center</h2><input id="block56Name" placeholder="Username"><button onclick="blockUser56()">Block User</button><table class="emerald56-table"><tr><th>User</th><th>Action</th></tr>${rows}</table>`, "blocking56"); }
    function blockUser56(u = "") { const target = u || document.getElementById("block56Name")?.value?.trim(); if (!target) return; setJSON(LS.blocked, Array.from(new Set([...blocked(), target]))); addNotice("User blocked", `${target} was blocked.`, "info", "security"); openBlocking56(); }
    function unblockUser56(u) { setJSON(LS.blocked, blocked().filter(x=>x!==u)); addNotice("User unblocked", `${u} was unblocked.`, "info", "security"); openBlocking56(); }
    function openMessageRequests56() { win("Message Requests", `<h2>Message Requests</h2><p>No pending message requests. Blocked-user filtering is active.</p>`, "messageRequests56"); }
    function openProfile56() { const p = getJSON(LS.profile, { displayName: currentUser(), bio: "", status: "Available", color: "green" }); win("User Profile", `<h2>User Profile</h2><label>Display Name</label><input id="profile56Display" value="${safe(p.displayName)}"><label>Status</label><input id="profile56Status" value="${safe(p.status)}"><label>Bio</label><textarea id="profile56Bio">${safe(p.bio)}</textarea><div class="emerald56-toolbar">${button("Save", "saveProfile56()")}</div>`, "profile56"); }
    function saveProfile56() { setJSON(LS.profile, { displayName: document.getElementById("profile56Display")?.value || currentUser(), status: document.getElementById("profile56Status")?.value || "Available", bio: document.getElementById("profile56Bio")?.value || "" }); addNotice("Profile saved", "Your EmeraldOS profile was updated.", "success", "profile"); }

    /* =====================================================
       ADMIN, MODERATION, HELP, RECOVERY, SUPPORT UX
    ===================================================== */

    async function openAdminPanel56() {
        if (!isExecutive()) return editionLock("Administrative Panel", "Executive");
        let userCount = "Unknown";
        try { const snap = await getDocs(collection(db, COL.users)); userCount = String(snap.size); } catch {}
        win("Administrative Panel", `<h2>Administrative Panel</h2><div class="emerald56-gridcards"><div class="emerald56-card"><h3>Users</h3><p>Total EmeraldOS users: ${safe(userCount)}</p>${button("User Administration", "openUserAdmin56()")}</div><div class="emerald56-card"><h3>Files</h3><p>Review storage and sharing.</p>${button("Storage Administration", "openStorage56()")}${button("Sharing Admin", "openSharedByMe56()")}</div><div class="emerald56-card"><h3>Reports</h3><p>Review chat and appstore reports.</p>${button("Moderator Center", "openModerationCenter56()")}${button("Appstore Moderation", "openAppstoreModeration56()")}</div><div class="emerald56-card"><h3>Logs</h3><p>Admin action log and audit tools.</p>${button("Activity Center", "openActivityCenter56()")}</div></div>`, "admin56");
    }

    async function openUserAdmin56() {
        if (!isExecutive()) return editionLock("User Administration", "Executive");
        const rows = [];
        try { const snap = await getDocs(collection(db, COL.users)); snap.forEach(d => rows.push(Object.assign({ id: d.id }, d.data() || {}))); } catch {}
        win("User Administration", `<h2>User Administration</h2><input placeholder="Search users" oninput="filterTable56('usersAdmin56',this.value)"><table class="emerald56-table" id="usersAdmin56"><tr><th>User</th><th>Role</th><th>Actions</th></tr>${rows.map(u=>`<tr><td><b>${safe(u.username || u.id)}</b></td><td>${safe(u.role || "user")}</td><td>${button("View Files", `adminViewUserFiles56('${safe(u.username || u.id)}')`)} ${button("Note", `adminNote56('${safe(u.username || u.id)}')`)}</td></tr>`).join("") || `<tr><td colspan="3">No user list available. Check Firestore rules.</td></tr>`}</table>`, "userAdmin56");
    }

    function adminNote56(user) { const note = prompt("Admin note for " + user); if (note) addNotice("Admin note saved", `Note for ${user}: ${note}`, "info", "admin"); }
    function adminViewUserFiles56(user) { win("User Files", `<h2>${safe(user)} Files</h2><p>This view depends on Firestore rules allowing Executive users to read <code>emeraldOSUsers/${safe(user)}/drive</code>.</p>`, "adminFiles56"); }
    function openModerationCenter56() { if (!isModerator()) return editionLock("Moderation Center", "Developer/Moderator"); win("Moderation Center", `<h2>Moderation Center</h2><div class="emerald56-gridcards"><div class="emerald56-card"><h3>Report Queue</h3><p>Review chat, file, and app reports.</p>${button("Appstore Reports", "openAppstoreModeration56()")}</div><div class="emerald56-card"><h3>User Actions</h3><p>Warn, mute, or escalate users.</p>${button("Blocking Center", "openBlocking56()")}</div><div class="emerald56-card"><h3>Logs</h3><p>Review moderation activity.</p>${button("Activity Center", "openActivityCenter56()")}</div></div>`, "moderation56"); }
    function openAppstoreModeration56() { if (!isModerator()) return editionLock("Appstore Moderation", "Developer/Moderator"); const reports = getJSON("56_local_appstore_reports", []); win("Appstore Moderation", `<h2>Appstore Moderation</h2><table class="emerald56-table"><tr><th>App</th><th>Reason</th><th>Reporter</th></tr>${reports.map(r=>`<tr><td>${safe(r.storeId)}</td><td>${safe(r.reason)}</td><td>${safe(r.reporter)}</td></tr>`).join("") || `<tr><td colspan="3">No local reports.</td></tr>`}</table>`, "appstoreMod56"); }
    function openSecurityCenter56() { win("Security & Privacy Center", `<h2>Security & Privacy Center</h2><div class="emerald56-gridcards"><div class="emerald56-card"><h3>Account</h3><p>User: ${safe(currentUser())}<br>Role: ${safe(roleText() || "user")}</p></div><div class="emerald56-card"><h3>Blocked Users</h3><p>${blocked().length} blocked users.</p>${button("Open Blocking", "openBlocking56()")}</div><div class="emerald56-card"><h3>Shares</h3><p>Review shared files and revoke access.</p>${button("Shared By Me", "openSharedByMe56()")}</div><div class="emerald56-card"><h3>Local Cache</h3><p>Clear local UI cache and recovery data.</p>${button("Recovery Center", "openRecoveryCenter56()")}</div></div>`, "security56"); }
    function openHelpSystem56() { win("Help System", `<h2>EmeraldOS Help</h2><input placeholder="Search help" oninput="filterTable56('helpTable56',this.value)"><table class="emerald56-table" id="helpTable56"><tr><th>Article</th><th>Summary</th></tr>${[
        ["How to share a file", "Open Files, click Share next to a file, enter a username, and choose view or edit."], ["How to install a custom app", "Open User Appstore, agree to the warning, review code, then click Install."], ["How to build an app", "Open Application Editor, choose a template, use the API docs, preview, then save."], ["How to reset desktop", "Open Recovery Center or Desktop Layout and choose Reset Desktop."], ["How to block a user", "Open Blocking Center, enter a username, and click Block User."], ["How to recover a document", "Open Writer and check the autosaved draft, or open Recovery Center."], ["How to use Safe Mode", "Open Recovery Center and enable Safe Mode to disable custom and Appstore apps temporarily."]
    ].map(r=>`<tr><td><b>${safe(r[0])}</b></td><td>${safe(r[1])}</td></tr>`).join("")}</table>`, "help56"); }
    function openRecoveryCenter56() { win("Recovery Center", `<h2>Recovery Center</h2><div class="emerald56-gridcards"><div class="emerald56-card"><h3>Desktop</h3>${button("Reset Desktop", "desktopReset56()")}${button("Clean Desktop", "desktopClean56()")}</div><div class="emerald56-card"><h3>Windows</h3>${button("Reset Windows", "resetWindows56()")}${button("Close All", "closeAllWindows56()")}</div><div class="emerald56-card"><h3>Safe Mode</h3>${button("Enable Safe Mode", "enableSafeMode56()")}${button("Disable Safe Mode", "disableSafeMode56()")}</div><div class="emerald56-card"><h3>Cache</h3>${button("Clear Recovery Data", "clearRecovery56()")}${button("Reset Custom CSS", "resetCustomCSS56()")}</div></div>`, "recovery56"); }
    function enableSafeMode56() { localStorage.setItem("56_safe_mode", "true"); addNotice("Safe Mode enabled", "Custom and Appstore apps will be hidden until Safe Mode is disabled.", "warning", "recovery"); rerender(); }
    function disableSafeMode56() { localStorage.removeItem("56_safe_mode"); addNotice("Safe Mode disabled", "Custom and Appstore apps are available again.", "success", "recovery"); rerender(); }
    function clearRecovery56() { [LS.recovery, LS.officeDraft].forEach(k=>localStorage.removeItem(k)); addNotice("Recovery data cleared", "Recovery cache was cleared.", "info", "recovery"); }
    function openActivityCenter56() { const rows = getJSON(LS.activities, []).map(a=>`<tr><td><b>${safe(a.title)}</b><br><span class="emerald56-note">${safe(a.detail)}</span></td><td>${safe(a.category)}</td><td>${dateTime(a.time)}</td></tr>`).join("") || `<tr><td colspan="3">No recent activity.</td></tr>`; win("Activity Center", `<h2>Recent Activity</h2><table class="emerald56-table"><tr><th>Activity</th><th>Category</th><th>Time</th></tr>${rows}</table>`, "activity56"); }
    function openHomeDashboard56() { win("Home Dashboard", `<h2>Today</h2><div class="emerald56-gridcards"><div class="emerald56-card"><h3>Unread</h3><p>${unreadCount()} unread notifications.</p>${button("Notifications", "openNotificationCenter56()")}</div><div class="emerald56-card"><h3>Quick Actions</h3>${button("New Document", "openWriter56()")}${button("Files", "openFiles56()")}${button("Chat", "openChat56()")}</div><div class="emerald56-card"><h3>Custom Apps</h3><p>${appList().length} installed custom apps.</p>${button("App Library", "openAppLibrary56()")}</div></div>`, "dashboard56"); }
    function openFeedback56() { win("Feedback", `<h2>Feedback</h2><label>Type</label><select id="fb56Type"><option>bug</option><option>feature</option><option>experience</option></select><label>Message</label><textarea id="fb56Msg" class="emerald56-codearea"></textarea><div class="emerald56-toolbar">${button("Submit", "submitFeedback56()")}</div>`, "feedback56"); }
    async function submitFeedback56() { const record={type:document.getElementById("fb56Type")?.value||"feedback", message:document.getElementById("fb56Msg")?.value||"", user:currentUser(), createdAt:now()}; try{await addDoc(collection(db, COL.feedback), record);}catch{const list=getJSON(LS.feedback,[]);list.unshift(record);setJSON(LS.feedback,list);} addNotice("Feedback submitted", "Thank you for the feedback.", "success", "feedback"); }
    function openThemeManager56() { win("Theme Manager", `<h2>Theme Manager</h2><p>Choose a theme or open the System Customizer for CSS-level changes.</p><div class="emerald56-toolbar">${button("Classic", "setTheme?.('classic')")}${button("Dark", "setTheme?.('dark')")}${button("System Customizer", "openSystemCustomizer56()")}</div>`, "themes56"); }
    function openDesktopLayout56() { win("Desktop Layout", `<h2>Desktop Layout 3.0</h2>${button("Lock Desktop", "localStorage.setItem('56_desktop_locked','true');desktopClean56()")}${button("Unlock Desktop", "localStorage.removeItem('56_desktop_locked');desktopClean56()")}${button("Clean Desktop", "desktopClean56()")}${button("Reset Desktop", "desktopReset56()")}`, "desktop56"); }
    function openTaskbarSettings56() { win("Taskbar Settings", `<h2>Taskbar 2.0</h2><p>Taskbar includes active app handling, notification bell, quick settings, and window restoration behavior.</p>${button("Notifications", "openNotificationCenter56()")}${button("Quick Settings", "openQuickSettings56()")}${button("Window Manager", "openWindowManager56()")}`, "taskbar56"); }
    function openStartMenuSettings56() { win("Start Menu", `<h2>Start Menu 4.0</h2><p>Use search, pinned folders, recent apps, and sectioned app lists.</p>${button("Open Search", "openGlobalSearch56()")}${button("Command Palette", "openCommandPalette56()")}`, "start56"); }
    function desktopClean56() { rerender(); addNotice("Desktop cleaned", "Desktop folders were refreshed and aligned.", "success", "desktop"); }
    function desktopReset56() { localStorage.removeItem(LS.desktopPrefs); rerender(); addNotice("Desktop reset", "Desktop preferences were reset.", "info", "desktop"); }
    function editionLock(appName, edition) { win("Feature Locked", `<h2>${safe(appName)}</h2><p>This feature requires EmeraldOS ${safe(edition)} edition or higher.</p><p>Current edition: <b>${safe(localStorage.getItem("40_edition") || "virtue")}</b></p>`, "locked56"); }
    function filterTable56(idValue, query) { const q=String(query||"").toLowerCase(); document.querySelectorAll(`#${idValue} tr`).forEach((tr,i)=>{ if(i===0)return; tr.style.display=tr.textContent.toLowerCase().includes(q)?"":"none"; }); }

    /* =====================================================
       APP REGISTRY AND DESKTOP FOLDERS
    ===================================================== */

    const APPS = {
        homeDashboard56: { name: "Home Dashboard", icon: "HOME", edition: "economy", category: "experience", launch: openHomeDashboard56 },
        welcome56: { name: "Welcome Setup", icon: "WELCOME", edition: "economy", category: "experience", launch: openWelcome56 },
        experienceCenter56: { name: "Experience Center", icon: "HELP", edition: "economy", category: "experience", launch: openExperienceCenter56 },
        globalSearch56: { name: "Emerald Search", icon: "SEARCH", edition: "economy", category: "experience", launch: openGlobalSearch56 },
        commandPalette56: { name: "Command Palette", icon: "CMD", edition: "economy", category: "experience", launch: openCommandPalette56 },
        quickSettings56: { name: "Quick Settings", icon: "QUICK", edition: "economy", category: "system", launch: openQuickSettings56 },
        notifications56: { name: "Notification Center", icon: "BELL", edition: "economy", category: "system", launch: openNotificationCenter56 },
        settings56: { name: "Settings", icon: "SET", edition: "economy", category: "system", launch: openSettings56 },
        accessibility56: { name: "Accessibility", icon: "A11Y", edition: "economy", category: "system", launch: openAccessibility56 },
        files56: { name: "Files", icon: "FILES", edition: "economy", category: "files", launch: openFiles56 },
        storage56: { name: "Storage Center", icon: "STORE", edition: "economy", category: "files", launch: openStorage56 },
        sharedWithMe56: { name: "Shared With Me", icon: "IN", edition: "home", category: "files", launch: openSharedWithMe56 },
        sharedByMe56: { name: "Shared By Me", icon: "OUT", edition: "home", category: "files", launch: openSharedByMe56 },
        office56: { name: "Emerald Office", icon: "OFFICE", edition: "economy", category: "office", launch: openOffice56 },
        writer56: { name: "Emerald Writer", icon: "WRITE", edition: "economy", category: "office", launch: openWriter56 },
        sheets56: { name: "Emerald Sheets", icon: "SHEET", edition: "business", category: "office", launch: openSheets56 },
        slides56: { name: "Emerald Slides", icon: "SLIDE", edition: "business", category: "office", launch: openSlides56 },
        forms56: { name: "Emerald Forms", icon: "FORM", edition: "business", category: "office", launch: openForms56 },
        chat56: { name: "Emerald Chat", icon: "CHAT", edition: "home", category: "communication", launch: openChat56 },
        contacts56: { name: "Contacts", icon: "CONT", edition: "home", category: "people", launch: openContacts56 },
        profile56: { name: "User Profile", icon: "PROF", edition: "home", category: "people", launch: openProfile56 },
        blocking56: { name: "Blocking Center", icon: "BLOCK", edition: "home", category: "security", launch: openBlocking56 },
        security56: { name: "Security & Privacy", icon: "SEC", edition: "economy", category: "security", launch: openSecurityCenter56 },
        applicationEditor56: { name: "Application Editor", icon: "APPEDIT", edition: "virtue", category: "custom", launch: openApplicationEditor56 },
        appLibrary56: { name: "Emerald App Library", icon: "LIB", edition: "virtue", category: "custom", launch: openAppLibrary56 },
        userAppstore56: { name: "User Appstore", icon: "STORE", edition: "virtue", category: "custom", launch: openUserAppstore56 },
        appPermissions56: { name: "App Permissions", icon: "PERM", edition: "virtue", category: "custom", launch: openAppPermissions56 },
        eappInstaller56: { name: ".eapp Installer", icon: "EAPP", edition: "virtue", category: "custom", launch: openEappInstaller56 },
        codeStudio56: { name: "Code Studio", icon: "CODE", edition: "virtue", category: "coding", launch: openCodeStudio56 },
        apiDocs56: { name: "Custom App API Docs", icon: "API", edition: "virtue", category: "coding", launch: openAPIDocs56 },
        snippets56: { name: "Code Snippets", icon: "SNIP", edition: "virtue", category: "coding", launch: openCodeSnippets56 },
        systemCustomizer56: { name: "System Customizer", icon: "CSS", edition: "virtue", category: "coding", launch: openSystemCustomizer56 },
        registryStudio56: { name: "Registry Studio", icon: "REG", edition: "virtue", category: "coding", launch: openRegistryStudio56 },
        startupEditor56: { name: "Startup Script Center", icon: "START", edition: "virtue", category: "coding", launch: openStartupEditor56 },
        themeManager56: { name: "Theme Manager", icon: "THEME", edition: "economy", category: "system", launch: openThemeManager56 },
        desktopLayout56: { name: "Desktop Layout", icon: "DESK", edition: "economy", category: "system", launch: openDesktopLayout56 },
        taskbarSettings56: { name: "Taskbar Settings", icon: "TASK", edition: "economy", category: "system", launch: openTaskbarSettings56 },
        startMenuSettings56: { name: "Start Menu", icon: "START", edition: "economy", category: "system", launch: openStartMenuSettings56 },
        windowManager56: { name: "Window Manager", icon: "WIN", edition: "economy", category: "system", launch: openWindowManager56 },
        activityCenter56: { name: "Activity Center", icon: "ACT", edition: "economy", category: "experience", launch: openActivityCenter56 },
        helpSystem56: { name: "Help System", icon: "HELP", edition: "economy", category: "experience", launch: openHelpSystem56 },
        feedback56: { name: "Feedback", icon: "FDBK", edition: "economy", category: "experience", launch: openFeedback56 },
        recovery56: { name: "Recovery Center", icon: "REPAIR", edition: "economy", category: "system", launch: openRecoveryCenter56 },
        moderationCenter56: { name: "Moderation Center", icon: "MOD", edition: "developer", category: "moderation", launch: openModerationCenter56 },
        appstoreModeration56: { name: "Appstore Moderation", icon: "MODAPP", edition: "developer", category: "moderation", launch: openAppstoreModeration56 },
        adminPanel56: { name: "Administrative Panel", icon: "ADMIN", edition: "executive", category: "admin", launch: openAdminPanel56 },
        userAdmin56: { name: "User Administration", icon: "USERS", edition: "executive", category: "admin", launch: openUserAdmin56 }
    };

    const FOLDERS = {
        essential: { name: "Essential Apps", edition: "economy", apps: ["homeDashboard56", "files56", "office56", "settings56", "helpSystem56"] },
        experience: { name: "Experience Center", edition: "economy", apps: ["welcome56", "experienceCenter56", "globalSearch56", "commandPalette56", "activityCenter56", "feedback56"] },
        files: { name: "Files & Storage", edition: "economy", apps: ["files56", "storage56", "sharedWithMe56", "sharedByMe56"] },
        office: { name: "Office Apps", edition: "economy", apps: ["office56", "writer56", "sheets56", "slides56", "forms56"] },
        communication: { name: "Communication", edition: "home", apps: ["chat56", "contacts56", "profile56"] },
        security: { name: "Security & Privacy", edition: "economy", apps: ["security56", "blocking56"] },
        system: { name: "System Tools", edition: "economy", apps: ["settings56", "quickSettings56", "notifications56", "accessibility56", "themeManager56", "desktopLayout56", "taskbarSettings56", "startMenuSettings56", "windowManager56", "recovery56"] },
        custom: { name: "User Applications", edition: "virtue", apps: ["applicationEditor56", "appLibrary56", "userAppstore56", "appPermissions56", "eappInstaller56"] },
        coding: { name: "Coding & Customization", edition: "virtue", apps: ["codeStudio56", "apiDocs56", "snippets56", "systemCustomizer56", "registryStudio56", "startupEditor56"] },
        moderation: { name: "Moderation Tools", edition: "developer", apps: ["moderationCenter56", "appstoreModeration56"] },
        admin: { name: "Administrative Tools", edition: "executive", apps: ["adminPanel56", "userAdmin56"] }
    };

    function registerApp(idValue, app) { if (!window.APPS) window.APPS = {}; window.APPS[idValue] = Object.assign({ icon: "APP", edition: "economy", category: "general" }, app); }
    function installApps() { Object.entries(APPS).forEach(([key, app]) => registerApp(key, app)); registerUserApps56(); }
    function registerUserApps56() {
        if (!window.APPS) window.APPS = {};
        Object.keys(window.APPS).filter(key => key.startsWith("userapp56_")).forEach(key => delete window.APPS[key]);
        if (localStorage.getItem("56_safe_mode") === "true") return;
        appList().forEach(app => registerApp("userapp56_" + app.id, { name: app.name, icon: app.icon || "APP", edition: "virtue", category: "custom", launch: () => runUserApp56(app.id) }));
    }

    function appVisible(idValue) { const app = window.APPS?.[idValue]; if (!app) return false; if (localStorage.getItem("56_safe_mode") === "true" && (idValue.startsWith("userapp56_") || app.category === "custom")) return false; return canSee(app.edition || "economy"); }
    function folderVisible(folder) { return canSee(folder.edition || "economy") && (folder.apps || []).some(appVisible); }
    function folderData() {
        const folders = JSON.parse(JSON.stringify(FOLDERS));
        const userIds = appList().map(a => "userapp56_" + a.id);
        folders.custom.apps = Array.from(new Set([...(folders.custom.apps || []), ...userIds]));
        if (localStorage.getItem(LS.simpleMode) === "true") {
            return { essential: folders.essential, files: folders.files, office: folders.office, communication: folders.communication, system: folders.system };
        }
        return folders;
    }

    function openFolder56(folderId) {
        const f = folderData()[folderId]; if (!f) return;
        const cards = (f.apps || []).filter(appVisible).map(appId => { const app = window.APPS[appId]; return `<div class="emerald56-card emerald56-app-card" onclick="launchApp('${safe(appId)}')"><h3>${safe(app.icon || "APP")} ${safe(app.name)}</h3><p>Edition: ${safe(app.edition || "economy")}<br>Category: ${safe(app.category || "general")}</p></div>`; }).join("") || `<div class="emerald56-inset">No applications available.</div>`;
        win(f.name, `<h2>${safe(f.name)}</h2><input placeholder="Search folder" oninput="filterCards56(this.value)"><div class="emerald56-gridcards folder56Cards">${cards}</div>`, "folder56");
    }

    function filterCards56(query) { const q = String(query || "").toLowerCase(); document.querySelectorAll(".folder56Cards .emerald56-card").forEach(c => c.style.display = c.textContent.toLowerCase().includes(q) ? "" : "none"); }

    function renderDesktop56() {
        registerUserApps56();
        const desktop = document.getElementById("desktop"); if (!desktop) return;
        desktop.innerHTML = "";
        Object.entries(folderData()).forEach(([fid, folder]) => {
            if (!folderVisible(folder)) return;
            const icon = document.createElement("div");
            icon.className = "emerald56-folder-icon desktop-folder-icon";
            icon.tabIndex = -1;
            icon.innerHTML = `<div class="emerald56-folder-symbol">${safe(folder.name.split(" ")[0].slice(0, 6).toUpperCase())}</div><div class="emerald56-folder-label">${safe(folder.name)}</div>`;
            icon.ondblclick = () => openFolder56(fid);
            icon.onclick = () => setTimeout(() => icon.blur(), 0);
            desktop.appendChild(icon);
        });
    }

    function renderStartMenu56() {
        const results = document.getElementById("start-results"); if (!results) return;
        const search = document.getElementById("start-search"); const q = String(search?.value || "").toLowerCase();
        const folderItems = Object.entries(folderData()).filter(([, f]) => folderVisible(f) && (!q || f.name.toLowerCase().includes(q))).map(([fid, f]) => `<div class="start-item" onclick="openFolder56('${safe(fid)}')">${safe(f.name)}</div>`).join("");
        const appItems = Object.entries(window.APPS || {}).filter(([id, app]) => appVisible(id) && (!q || String(app.name).toLowerCase().includes(q))).slice(0, 200).map(([id, app]) => `<div class="start-item" onclick="launchApp('${safe(id)}')">${safe(app.name)}</div>`).join("");
        results.innerHTML = folderItems + (q ? appItems : "");
        if (search && !search.dataset.emerald56) { search.dataset.emerald56 = "true"; search.addEventListener("input", renderStartMenu56); }
    }

    function rerender() { setTimeout(() => { registerUserApps56(); window.EMERALDOS_APP_CATEGORIES = folderData(); renderDesktop56(); renderStartMenu56(); }, 60); }

    function installCommands() {
        const original = window.runTerminalCommand;
        window.runTerminalCommand = function(raw) {
            const cmd = String(raw || "").trim().toLowerCase();
            const map = {
                "version": () => "EmeraldOS 5.6 - User Experience & Reliability Update",
                "build": () => "EmeraldOS 5.6 - User Experience & Reliability Update",
                "search": () => { openGlobalSearch56(); return "Opening Emerald Search."; },
                "palette": () => { openCommandPalette56(); return "Opening Command Palette."; },
                "settings": () => { openSettings56(); return "Opening Settings."; },
                "files": () => { openFiles56(); return "Opening Files."; },
                "office": () => { openOffice56(); return "Opening Emerald Office."; },
                "chat": () => { openChat56(); return "Opening Emerald Chat."; },
                "app.editor": () => { openApplicationEditor56(); return "Opening Application Editor."; },
                "appstore": () => { openUserAppstore56(); return "Opening User Appstore."; },
                "code": () => { openCodeStudio56(); return "Opening Code Studio."; },
                "customizer": () => { openSystemCustomizer56(); return "Opening System Customizer."; },
                "recovery": () => { openRecoveryCenter56(); return "Opening Recovery Center."; },
                "windows.reset": () => { resetWindows56(); return "Windows reset."; },
                "windows.closeall": () => { closeAllWindows56(); return "Closing windows."; },
                "desktop.clean": () => { desktopClean56(); return "Desktop cleaned."; },
                "desktop.reset": () => { desktopReset56(); return "Desktop reset."; }
            };
            if (map[cmd]) return map[cmd]();
            return typeof original === "function" ? original(raw) : `Unknown command: ${raw}`;
        };
    }

    function installKeyboard() {
        document.addEventListener("keydown", e => {
            if (e.ctrlKey && e.code === "Space") { e.preventDefault(); openGlobalSearch56(); }
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "p") { e.preventDefault(); openCommandPalette56(); }
            if (e.altKey && e.key === "Tab") { e.preventDefault(); cycleWindow56(); }
            if (e.key === "Escape") { document.getElementById("command56Overlay")?.remove(); }
        });
    }

    function cycleWindow56() {
        const wins = Array.from(document.querySelectorAll(".window"));
        if (!wins.length) return;
        const top = wins.sort((a,b)=>Number(b.style.zIndex||0)-Number(a.style.zIndex||0))[0];
        const i = wins.indexOf(top);
        const next = wins[(i + 1) % wins.length];
        next.style.display = ""; next.dataset.minimized = "false"; next.style.zIndex = String(9999 + Date.now() % 100000);
    }

    function setBuild() {
        document.title = BUILD.displayName;
        localStorage.setItem("40_build_name", BUILD.displayName);
        localStorage.setItem("40_version", BUILD.version);
        const badge = document.getElementById("emerald40-build-badge");
        if (badge) badge.innerHTML = `<span class="emerald56-build-badge">${BUILD.displayName}</span>`;
        try { window.EmeraldOSRegistry?.set?.("HKEY_LOCAL_MACHINE\\System\\Build\\Version", BUILD.version); } catch {}
    }

    function installStyles() {
        if (document.getElementById("emerald56-styles")) return;
        const style = document.createElement("style");
        style.id = "emerald56-styles";
        style.textContent = `
        .emerald56-panel{font-family:"MS Sans Serif",Tahoma,Arial,sans-serif;font-size:12px;color:#000;line-height:1.35}.emerald56-panel input,.emerald56-panel textarea,.emerald56-panel select{box-sizing:border-box;width:100%;margin:3px 0 8px 0;background:#fff;color:#000;border:2px inset #fff;padding:4px;font:inherit;user-select:text}.emerald56-panel textarea{min-height:110px;resize:vertical}.emerald56-toolbar{display:flex;flex-wrap:wrap;gap:4px;margin:8px 0}.emerald56-toolbar.right{justify-content:flex-end}.emerald56-btn{margin:2px}.emerald56-table{width:100%;border-collapse:collapse;background:#fff}.emerald56-table th,.emerald56-table td{border:1px solid #808080;padding:5px;text-align:left;vertical-align:top}.emerald56-note{color:#404040;font-size:11px}.emerald56-warn{background:#fff7d6;border:1px solid #8a6d00;padding:8px;margin:8px 0}.emerald56-danger{background:#ffd9d9;border:2px solid #800000;padding:10px;margin:8px 0;font-weight:bold;text-align:center}.emerald56-gridcards{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:8px}.emerald56-grid2{display:grid;grid-template-columns:320px 1fr;gap:8px}.emerald56-card{background:#c0c0c0;border:2px solid;border-color:#fff #808080 #808080 #fff;padding:8px;min-height:90px}.emerald56-card h3{margin:0 0 6px 0}.emerald56-app-card{cursor:pointer}.emerald56-app-card:hover{outline:1px dotted #000}.emerald56-codearea{height:300px;font-family:Consolas,"Courier New",monospace}.emerald56-code-preview{white-space:pre-wrap;background:#fff;border:2px inset #fff;padding:8px;max-height:320px;overflow:auto}.emerald56-app-frame{width:100%;height:100%;min-height:360px;border:0;background:#fff}.emerald56-folder-icon{width:84px;min-height:84px;text-align:center;color:#fff;padding:6px;margin:6px;cursor:pointer;outline:none}.emerald56-folder-icon:focus{outline:none}.emerald56-folder-symbol{width:45px;height:32px;margin:0 auto 5px auto;background:#d8d8d8;border:2px solid;border-color:#fff #404040 #404040 #fff;color:#000;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold}.emerald56-folder-label{text-shadow:1px 1px 0 #000;word-break:break-word}.emerald56-bell{height:28px;margin-left:4px;background:#c0c0c0;border:2px solid;border-color:#fff #808080 #808080 #fff;font-family:inherit}.emerald56-bell-hot{background:#fff0a0;animation:emerald56Pulse 1.5s infinite}@keyframes emerald56Pulse{0%,100%{filter:none}50%{filter:brightness(1.2)}}.emerald56-unread td{background:#fffbe0;font-weight:bold}.emerald56-modal-screen{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:999999}.emerald56-modal{width:min(560px,92vw);background:#c0c0c0;border:2px solid;border-color:#fff #404040 #404040 #fff;box-shadow:4px 4px 0 #000}.emerald56-modal-title{background:#000080;color:#fff;font-weight:bold;padding:5px 8px}.emerald56-modal-body{padding:15px}.emerald56-pill{display:inline-block;background:#fff;border:1px solid #808080;padding:2px 5px;margin:2px}.emerald56-meter{height:14px;background:#fff;border:2px inset #fff;margin:6px 0}.emerald56-meter div{height:100%;background:#008000}.emerald56-writer{background:#fff;border:2px inset #fff;min-height:360px;padding:30px;margin:8px auto;max-width:760px;user-select:text}.emerald56-status{background:#c0c0c0;border-top:1px solid #808080;padding:4px}.emerald56-result{background:#fff;border:1px solid #808080;margin:4px 0;padding:6px;cursor:pointer}.emerald56-result span{display:block;color:#404040;font-size:11px}.emerald56-command-overlay{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:999998;display:flex;align-items:flex-start;justify-content:center;padding-top:80px}.emerald56-command-box{width:min(700px,90vw);background:#c0c0c0;border:2px solid;border-color:#fff #404040 #404040 #fff;box-shadow:4px 4px 0 #000;padding:8px}.emerald56-check{display:block;margin:6px 0}.emerald56-large-text{font-size:15px}.emerald56-xlarge-text{font-size:18px}.emerald56-high-contrast #desktop{background:#000!important}.emerald56-reduced-motion *{animation:none!important;transition:none!important}.emerald56-hide-focus *:focus{outline:none!important}.emerald56-build-badge{padding:2px 6px;background:#c0c0c0;border:1px solid #808080}.emerald56-inset{background:#fff;border:2px inset #fff;padding:8px}.emerald56-msg{background:#fff;border:1px solid #808080;margin:4px 0;padding:5px}@media(max-width:800px){.emerald56-grid2{grid-template-columns:1fr}.emerald56-folder-icon{width:76px}}
        `;
        document.head.appendChild(style);
    }

    function expose() {
        Object.assign(window, {
            markAllRead56, clearNotifications56, openNotificationCenter56, openNotificationSettings56, saveNotificationSettings56,
            resetWindows56, closeAllWindows56, openWindowManager56, focusWindow56, cascadeWindows56, tileWindows56,
            openApplicationEditor56, saveUserApp56, insertTemplate56, previewUserApp56, runUserApp56, deleteUserApp56, openAppVersionHistory56, restoreAppVersion56,
            openAppLibrary56, openAppPermissions56, saveAppPermissions56, exportEapp56, openEappInstaller56, installEapp56,
            openUserAppstore56, showAppstoreRisk56, installStoreApp56, viewStoreCode56, openPublishApp56, publishSelectedApp56, reportStoreApp56,
            openAPIDocs56, openCodeSnippets56, openCodeStudio56, runCodeStudio56, saveCodeStudioAsApp56, openSystemCustomizer56, saveCustomCSS56, resetCustomCSS56, openRegistryStudio56, saveRegistry56, resetRegistry56, openStartupEditor56, saveStartupScript56, runStartupScript56, deleteStartupScript56,
            openWelcome56, finishSetup56, setSimpleMode56, openExperienceCenter56, openGlobalSearch56, renderSearch56, openCommandPalette56, openQuickSettings56, saveQuickSettings56, openSettings56, openAccessibility56, saveAccessibility56,
            openFiles56, openFile56, fileDetails56, trashFile56, shareFilePrompt56, openSharedByMe56, openSharedWithMe56, revokeShare56, openStorage56,
            openOffice56, openWriter56, updateWriterStats56, writerInsertDate56, writerInsertTable56, saveWriterDraft56, saveWriterToFiles56, exportWriterHTML56, newWriterDoc56, openSheets56, exportSheetCSV56, sheetAutoTotal56, openSlides56, presentSlides56, openForms56, previewForm56,
            openChat56, openChatRoom56, sendChat56, reportChat56, openContacts56, addContact56, removeContact56, openBlocking56, blockUser56, unblockUser56, openMessageRequests56, openProfile56, saveProfile56,
            openAdminPanel56, openUserAdmin56, adminNote56, adminViewUserFiles56, openModerationCenter56, openAppstoreModeration56, openSecurityCenter56, openHelpSystem56, openRecoveryCenter56, enableSafeMode56, disableSafeMode56, clearRecovery56, openActivityCenter56, openHomeDashboard56, openFeedback56, submitFeedback56, openThemeManager56, openDesktopLayout56, openTaskbarSettings56, openStartMenuSettings56, desktopClean56, desktopReset56, filterTable56, openFolder56, filterCards56, renderDesktop56, renderStartMenu56
        });
    }

    function init() {
        installStyles();
        injectCustomCSS56();
        applyAccessibility56();
        expose();
        installWindowFixes();
        installBell();
        installApps();
        installCommands();
        installKeyboard();
        setBuild();
        window.EMERALDOS_APP_CATEGORIES = folderData();
        window.renderDesktop = renderDesktop56;
        window.renderStartMenu = renderStartMenu56;
        renderDesktop56();
        renderStartMenu56();
        addNotice("EmeraldOS 5.6 loaded", "User experience, reliability, coding tools, Virtue user applications, and the User Appstore are active.", "success", "system");
        if (localStorage.getItem(LS.setupDone) !== "true") setTimeout(openWelcome56, 600);
    }

    if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", () => setTimeout(init, 800));
    else setTimeout(init, 800);
})();
