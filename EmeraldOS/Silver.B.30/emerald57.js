"use strict";

/* =========================================================
   EMERALDOS 5.7
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
    if (window.EmeraldOS57Loaded) return;
    window.EmeraldOS57Loaded = true;

    const BUILD = {
        product: "EmeraldOS",
        version: "5.7",
        displayName: "EmeraldOS 5.7",
        codename: "User Experience & Reliability Update",
        fileLimit: 1024 * 1024
    };

    const LS = {
        notifications: "57_notifications",
        setupDone: "57_setup_done",
        quickSettings: "57_quick_settings",
        accessibility: "57_accessibility",
        simpleMode: "57_simple_mode",
        desktopPrefs: "57_desktop_prefs",
        windowPrefs: "57_window_prefs",
        userApps: "57_user_apps",
        appVersions: "57_app_versions",
        appPermissions: "57_app_permissions",
        appstoreConsent: "57_user_appstore_risk_agreed",
        localStore: "57_local_appstore_cache",
        registry: "57_system_registry",
        customCSS: "57_custom_system_css",
        startupScripts: "57_startup_scripts",
        contacts: "57_contacts",
        blocked: "57_blocked_users",
        profile: "57_profile",
        activities: "57_activity_log",
        officeDraft: "57_writer_draft",
        recovery: "57_recovery",
        settings: "57_settings",
        errorReports: "57_error_reports",
        feedback: "57_feedback"
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
        adminLogs: "emeraldOSAdminLogs",
        mail: "emeraldOSMail"
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
        return `<button class="win95-small-button emerald57-btn ${safe(className)}" onclick="${action}">${safe(label)}</button>`;
    }

    function win(title, html, app = "emerald57") {
        return window.openWindow?.(title, `<div class="emerald57-panel">${html}</div>`, app) || null;
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

    function markAllRead57() {
        const list = notifications().map(n => Object.assign({}, n, { read: true }));
        setJSON(LS.notifications, list);
        refreshBell();
        openNotificationCenter57();
    }

    function clearNotifications57() {
        if (!confirm("Clear all notifications?")) return;
        setJSON(LS.notifications, []);
        refreshBell();
        openNotificationCenter57();
    }

    function refreshBell() {
        const bell = document.getElementById("emerald57-bell");
        if (!bell) return;
        const count = unreadCount();
        bell.innerHTML = count > 0 ? `Bell <b>${count}</b>` : "Bell";
        bell.classList.toggle("emerald57-bell-hot", count > 0);
        bell.title = count > 0 ? `${count} unread notification(s)` : "Notifications";
    }

    function installBell() {
        if (document.getElementById("emerald57-bell")) return;
        const taskbar = document.getElementById("taskbar");
        const clock = document.getElementById("clock");
        if (!taskbar) return;
        const bell = document.createElement("button");
        bell.id = "emerald57-bell";
        bell.className = "emerald57-bell";
        bell.onclick = () => openNotificationCenter57();
        taskbar.insertBefore(bell, clock || null);
        refreshBell();
    }

    function openNotificationCenter57() {
        const rows = notifications().map(n => `
            <tr class="${n.read ? "" : "emerald57-unread"}">
                <td><b>${safe(n.title)}</b><br><span class="emerald57-note">${safe(n.message)}</span></td>
                <td>${safe(n.category || "system")}</td>
                <td>${dateTime(n.time)}</td>
                <td>${n.action ? button("Open", n.action) : ""}</td>
            </tr>`).join("") || `<tr><td colspan="4">No notifications yet.</td></tr>`;
        win("Notification Center", `
            <h2>Notification Center 6.0</h2>
            <div class="emerald57-toolbar">${button("Mark All Read", "markAllRead57()")}${button("Clear All", "clearNotifications57()")}${button("Settings", "openNotificationSettings57()")}</div>
            <table class="emerald57-table"><tr><th>Notification</th><th>Category</th><th>Time</th><th>Action</th></tr>${rows}</table>
        `, "notifications57");
    }

    function openNotificationSettings57() {
        const s = getJSON(LS.settings, { notifications: true, sounds: false, chat: true, sharing: true, appstore: true, storage: true });
        win("Notification Settings", `
            <h2>Notification Settings</h2>
            ${check("notif57Main", "Enable notifications", s.notifications)}
            ${check("notif57Sounds", "Enable notification sounds", s.sounds)}
            ${check("notif57Chat", "Chat notifications", s.chat)}
            ${check("notif57Sharing", "Shared document notifications", s.sharing)}
            ${check("notif57Appstore", "User Appstore notifications", s.appstore)}
            ${check("notif57Storage", "Storage warnings", s.storage)}
            <div class="emerald57-toolbar">${button("Save", "saveNotificationSettings57()")}</div>
        `, "notificationSettings57");
    }

    function saveNotificationSettings57() {
        const s = Object.assign(getJSON(LS.settings, {}), {
            notifications: !!document.getElementById("notif57Main")?.checked,
            sounds: !!document.getElementById("notif57Sounds")?.checked,
            chat: !!document.getElementById("notif57Chat")?.checked,
            sharing: !!document.getElementById("notif57Sharing")?.checked,
            appstore: !!document.getElementById("notif57Appstore")?.checked,
            storage: !!document.getElementById("notif57Storage")?.checked
        });
        setJSON(LS.settings, s);
        addNotice("Notification settings saved", "Your notification preferences were updated.", "success", "settings");
    }

    function check(idValue, label, checked) {
        return `<label class="emerald57-check"><input id="${safe(idValue)}" type="checkbox" ${checked ? "checked" : ""}> ${safe(label)}</label>`;
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

    function resetWindows57() {
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

    function closeAllWindows57() {
        if (!confirm("Close all open windows?")) return;
        Array.from(document.querySelectorAll(".window")).forEach(w => { w.taskbarButton?.remove?.(); w.remove(); });
        addNotice("Windows closed", "All windows were closed.", "info", "windows");
    }

    function openWindowManager57() {
        const rows = Array.from(document.querySelectorAll(".window")).map((w, i) => {
            const title = w.querySelector(".title-bar span")?.textContent || `Window ${i + 1}`;
            return `<tr><td>${safe(title)}</td><td>${safe(w.dataset.minimized === "true" ? "Minimized" : "Open")}</td><td>${safe(w.dataset.maximized === "true" ? "Maximized" : "Normal")}</td><td>${button("Focus", `focusWindow57(${i})`)}</td></tr>`;
        }).join("") || `<tr><td colspan="4">No open windows.</td></tr>`;
        win("Window Manager", `
            <h2>Window Management 2.0</h2>
            <div class="emerald57-toolbar">${button("Reset Windows", "resetWindows57()")}${button("Cascade", "cascadeWindows57()")}${button("Tile", "tileWindows57()")}${button("Close All", "closeAllWindows57()")}</div>
            <table class="emerald57-table"><tr><th>Window</th><th>Status</th><th>Size</th><th>Action</th></tr>${rows}</table>
        `, "windows57");
    }

    function focusWindow57(i) {
        const w = Array.from(document.querySelectorAll(".window"))[i];
        if (!w) return;
        w.style.display = "";
        w.dataset.minimized = "false";
        w.style.zIndex = String(9999 + Date.now() % 100000);
    }

    function cascadeWindows57() {
        Array.from(document.querySelectorAll(".window")).forEach((w, i) => {
            w.dataset.maximized = "false";
            w.style.display = "";
            w.style.left = `${20 + i * 26}px`;
            w.style.top = `${20 + i * 26}px`;
            w.style.width = "700px";
            w.style.height = "460px";
        });
    }

    function tileWindows57() {
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
    function saveAppList(list) { setJSON(LS.userApps, list); registerUserApps57(); rerender(); }
    function appPerms(appId) { return Object.assign({ notifications: true, localStorage: true, clipboard: false, links: false, username: false, downloads: true }, getJSON(LS.appPermissions, {})[appId] || {}); }

    function newAppId(name) { return "u" + uid(name).slice(0, 32) + "_" + Date.now().toString(36); }

    function openApplicationEditor57(appId = "") {
        if (!canSee("virtue")) return editionLock("Application Editor", "Virtue");
        const apps = appList();
        const selected = apps.find(a => a.id === appId) || { id: "", name: "My Application", icon: "APP", description: "A custom EmeraldOS application.", code: APP_TEMPLATES.dashboard };
        const savedRows = apps.map(a => `<tr><td><b>${safe(a.name)}</b><br><span class="emerald57-note">${safe(a.id)}</span></td><td>${safe(a.icon || "APP")}</td><td>${dateTime(a.updatedAt)}</td><td>${button("Edit", `openApplicationEditor57('${safe(a.id)}')`)} ${button("Run", `runUserApp57('${safe(a.id)}')`)} ${button("Export", `exportEapp57('${safe(a.id)}')`)} ${button("Delete", `deleteUserApp57('${safe(a.id)}')`)}</td></tr>`).join("") || `<tr><td colspan="4">No custom apps yet.</td></tr>`;
        win("Application Editor 3.0", `
            <h2>Application Editor 3.0</h2>
            <div class="emerald57-warn"><b>Virtue feature:</b> Custom apps run in a sandboxed application frame. Use the API documentation and permission controls before publishing.</div>
            <div class="emerald57-grid2">
                <div>
                    <label>Application Name</label><input id="app57Id" type="hidden" value="${safe(selected.id)}"><input id="app57Name" value="${safe(selected.name)}">
                    <label>Icon Label</label><input id="app57Icon" value="${safe(selected.icon || "APP")}">
                    <label>Description</label><textarea id="app57Description" style="height:70px">${safe(selected.description || "")}</textarea>
                    <label>Template</label><select id="app57Template">${Object.keys(APP_TEMPLATES).map(k => `<option value="${k}">${safe(k)}</option>`).join("")}</select>
                    <div class="emerald57-toolbar">${button("Insert Template", "insertTemplate57()")}${button("API Docs", "openAPIDocs57()")}${button("Snippets", "openCodeSnippets57()")}</div>
                </div>
                <div>
                    <label>Application JavaScript</label>
                    <textarea id="app57Code" class="emerald57-codearea" spellcheck="false">${safe(selected.code || "")}</textarea>
                </div>
            </div>
            <div class="emerald57-toolbar">
                ${button("Save", "saveUserApp57()")}
                ${button("Run Preview", "previewUserApp57()")}
                ${button("Version History", `openAppVersionHistory57('${safe(selected.id)}')`)}
                ${button("Permissions", `openAppPermissions57('${safe(selected.id)}')`)}
                ${button("Export .eapp", `exportEapp57('${safe(selected.id)}')`)}
                ${button("Publish", `openPublishApp57('${safe(selected.id)}')`)}
                ${button("App Library", "openAppLibrary57()")}
            </div>
            <h3>Saved User Applications</h3>
            <table class="emerald57-table"><tr><th>Name</th><th>Icon</th><th>Updated</th><th>Actions</th></tr>${savedRows}</table>
        `, "appEditor57");
    }

    function insertTemplate57() {
        const key = document.getElementById("app57Template")?.value || "blank";
        const area = document.getElementById("app57Code");
        if (area) area.value = APP_TEMPLATES[key] || APP_TEMPLATES.blank;
    }

    function saveUserApp57() {
        const idField = document.getElementById("app57Id");
        const name = document.getElementById("app57Name")?.value?.trim() || "Untitled Application";
        const icon = document.getElementById("app57Icon")?.value?.trim() || "APP";
        const description = document.getElementById("app57Description")?.value || "";
        const code = document.getElementById("app57Code")?.value || "";
        const list = appList();
        let appId = idField?.value || "";
        if (!appId) appId = newAppId(name);
        const existingIndex = list.findIndex(a => a.id === appId);
        if (existingIndex >= 0) saveAppVersion(appId, list[existingIndex]);
        const record = { id: appId, name, icon, description, code, edition: "virtue", updatedAt: now(), createdAt: existingIndex >= 0 ? list[existingIndex].createdAt : now() };
        if (existingIndex >= 0) list[existingIndex] = Object.assign({}, list[existingIndex], record);
        else list.push(record);
        saveAppList(list);
        addNotice("Application saved", `${name} was saved to User Applications.`, "success", "application-editor", `runUserApp57('${safe(appId)}')`);
        openApplicationEditor57(appId);
    }

    function saveAppVersion(appId, previous) {
        if (!appId || !previous) return;
        const versions = getJSON(LS.appVersions, {});
        versions[appId] = versions[appId] || [];
        versions[appId].unshift({ time: now(), app: previous });
        versions[appId] = versions[appId].slice(0, 10);
        setJSON(LS.appVersions, versions);
    }

    function openAppVersionHistory57(appId = "") {
        if (!appId) return alert("Save the app before opening version history.");
        const versions = getJSON(LS.appVersions, {})[appId] || [];
        const rows = versions.map((v, i) => `<tr><td>${dateTime(v.time)}</td><td>${safe(v.app?.name || "Application")}</td><td>${button("Restore", `restoreAppVersion57('${safe(appId)}',${i})`)}</td></tr>`).join("") || `<tr><td colspan="3">No previous versions saved yet.</td></tr>`;
        win("App Version History", `<h2>Version History</h2><table class="emerald57-table"><tr><th>Saved</th><th>Name</th><th>Action</th></tr>${rows}</table>`, "appVersions57");
    }

    function restoreAppVersion57(appId, index) {
        const versions = getJSON(LS.appVersions, {});
        const version = versions[appId]?.[index]?.app;
        if (!version) return alert("Version not found.");
        const list = appList();
        const i = list.findIndex(a => a.id === appId);
        if (i >= 0) list[i] = Object.assign({}, version, { updatedAt: now() });
        saveAppList(list);
        addNotice("Application restored", "A previous app version was restored.", "success", "application-editor");
        openApplicationEditor57(appId);
    }

    function deleteUserApp57(appId) {
        if (!confirm("Delete this custom application?")) return;
        saveAppList(appList().filter(a => a.id !== appId));
        addNotice("Application deleted", "The custom app was removed.", "info", "application-editor");
        openApplicationEditor57();
    }

    function previewUserApp57() {
        const temp = {
            id: "preview_" + Date.now(),
            name: document.getElementById("app57Name")?.value || "Preview",
            icon: document.getElementById("app57Icon")?.value || "APP",
            code: document.getElementById("app57Code")?.value || "",
            description: document.getElementById("app57Description")?.value || "Preview"
        };
        launchSandbox(temp);
    }

    function runUserApp57(appId) {
        if (!canSee("virtue")) return editionLock("User Applications", "Virtue");
        const app = appList().find(a => a.id === appId);
        if (!app) return alert("Application not found.");
        launchSandbox(app);
    }

    function launchSandbox(app) {
        const perms = appPerms(app.id);
        const frameId = "appframe57_" + Math.random().toString(36).slice(2);
        win(app.name || "User Application", `<iframe id="${frameId}" class="emerald57-app-frame" sandbox="allow-scripts allow-forms allow-modals allow-downloads"></iframe>`, "userapp57");
        setTimeout(() => {
            const frame = document.getElementById(frameId);
            if (!frame) return;
            const src = `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Tahoma,Arial,sans-serif;background:#fff;margin:0;padding:10px;color:#000}button,input,textarea,select{font-family:inherit;margin:3px}button{padding:4px 8px}.top{background:#c0c0c0;border:2px solid;border-color:#fff #808080 #808080 #fff;padding:6px;margin-bottom:8px}.card{border:1px solid #808080;background:#f5f5f5;padding:8px;margin:6px 0}table{border-collapse:collapse;width:100%}td,th{border:1px solid #808080;padding:4px}</style></head><body><div class="top"><b id="title"></b></div><div id="app"></div><script>const app=document.getElementById('app');const PERMS=${JSON.stringify(perms)};const APPID=${JSON.stringify(app.id)};const api={setTitle:t=>{document.getElementById('title').textContent=String(t||'')},write:h=>{app.innerHTML=String(h||'')},append:h=>{app.insertAdjacentHTML('beforeend',String(h||''))},text:t=>{app.textContent=String(t||'')},button:(label,fn)=>{const b=document.createElement('button');b.textContent=label;b.onclick=fn;app.appendChild(b);return b},input:(placeholder='')=>{const i=document.createElement('input');i.placeholder=placeholder;app.appendChild(i);return i},textarea:(placeholder='')=>{const t=document.createElement('textarea');t.placeholder=placeholder;t.style.width='100%';t.style.minHeight='90px';app.appendChild(t);return t},table:(rows)=>{const table=document.createElement('table');(rows||[]).forEach(r=>{const tr=document.createElement('tr');(r||[]).forEach(c=>{const td=document.createElement('td');td.textContent=String(c);tr.appendChild(td)});table.appendChild(tr)});app.appendChild(table);return table},notify:(title,message)=>{if(PERMS.notifications) parent.postMessage({type:'emerald57_notify',title:String(title||'Application'),message:String(message||''),appId:APPID},'*')},storeSet:(k,v)=>{if(PERMS.localStorage)localStorage.setItem('app_'+APPID+'_'+k,JSON.stringify(v))},storeGet:(k,f)=>{if(!PERMS.localStorage)return f;try{return JSON.parse(localStorage.getItem('app_'+APPID+'_'+k)||JSON.stringify(f))}catch{return f}},download:(name,content)=>{if(!PERMS.downloads)return;const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([String(content||'')]));a.download=name||'export.txt';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)},copyText:async(t)=>{if(PERMS.clipboard&&navigator.clipboard)await navigator.clipboard.writeText(String(t||''))},openLink:u=>{if(PERMS.links) window.open(String(u||''),'_blank')},getUsername:()=>PERMS.username?${JSON.stringify(currentUser())}:'',emit:(name,payload)=>parent.postMessage({type:'emerald57_event',name,payload,appId:APPID},'*')};try{api.setTitle(${JSON.stringify(app.name || "User Application")});new Function('api',${JSON.stringify(app.code || "api.write('<h1>Empty application</h1>');")})(api)}catch(err){app.innerHTML='<pre style="color:#800000;white-space:pre-wrap"></pre>';app.querySelector('pre').textContent='Application error: '+err.message;}<\/script></body></html>`;
            frame.srcdoc = src;
        }, 80);
    }

    window.addEventListener("message", ev => {
        if (ev.data?.type === "emerald57_notify") addNotice(ev.data.title || "Application", ev.data.message || "", "info", "custom-app");
        if (ev.data?.type === "emerald57_event") console.log("EmeraldOS app event", ev.data);
    });

    function openAppLibrary57() {
        if (!canSee("virtue")) return editionLock("Emerald App Library", "Virtue");
        const rows = appList().map(a => `<tr><td><b>${safe(a.name)}</b><br><span class="emerald57-note">${safe(a.description || a.id)}</span></td><td>${safe(a.icon || "APP")}</td><td>${safe(a.source || "Local")}</td><td>${button("Run", `runUserApp57('${safe(a.id)}')`)} ${button("Edit", `openApplicationEditor57('${safe(a.id)}')`)} ${button("Permissions", `openAppPermissions57('${safe(a.id)}')`)} ${button("Publish", `openPublishApp57('${safe(a.id)}')`)}</td></tr>`).join("") || `<tr><td colspan="4">No installed custom apps.</td></tr>`;
        win("Emerald App Library", `<h2>Emerald App Library</h2><div class="emerald57-toolbar">${button("Create App", "openApplicationEditor57()")}${button("Import .eapp", "openEappInstaller57()")}${button("User Appstore", "openUserAppstore57()")}</div><table class="emerald57-table"><tr><th>Application</th><th>Icon</th><th>Source</th><th>Actions</th></tr>${rows}</table>`, "appLibrary57");
    }

    function openAppPermissions57(appId = "") {
        if (!appId) {
            const rows = appList().map(a => `<tr><td>${safe(a.name)}</td><td>${button("Permissions", `openAppPermissions57('${safe(a.id)}')`)}</td></tr>`).join("") || `<tr><td colspan="2">No custom apps.</td></tr>`;
            return win("App Permissions", `<h2>App Permissions</h2><table class="emerald57-table"><tr><th>App</th><th>Action</th></tr>${rows}</table>`, "appPerms57");
        }
        const app = appList().find(a => a.id === appId);
        const p = appPerms(appId);
        win("App Permissions", `<h2>Permissions: ${safe(app?.name || appId)}</h2>${["notifications","localStorage","clipboard","links","username","downloads"].map(k => check("perm57_"+k, k, p[k])).join("")}<div class="emerald57-toolbar">${button("Save", `saveAppPermissions57('${safe(appId)}')`)}</div>`, "appPerms57");
    }

    function saveAppPermissions57(appId) {
        const all = getJSON(LS.appPermissions, {});
        all[appId] = {};
        ["notifications","localStorage","clipboard","links","username","downloads"].forEach(k => all[appId][k] = !!document.getElementById("perm57_" + k)?.checked);
        setJSON(LS.appPermissions, all);
        addNotice("Permissions saved", "Custom application permissions were updated.", "success", "custom-apps");
    }

    function exportEapp57(appId) {
        const app = appList().find(a => a.id === appId);
        if (!app) return alert("Save the app before exporting.");
        const payload = { format: "EmeraldOS .eapp", version: "5.7", exportedAt: now(), app };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${uid(app.name)}.eapp`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 500);
        addNotice("Application exported", `${app.name} was exported as .eapp.`, "success", "custom-apps");
    }

    function openEappInstaller57() {
        if (!canSee("virtue")) return editionLock(".eapp Installer", "Virtue");
        win(".eapp Installer", `<h2>.eapp Installer</h2><div class="emerald57-warn">Only install application packages from sources you trust.</div><textarea id="eapp57Text" class="emerald57-codearea" placeholder="Paste .eapp JSON here"></textarea><div class="emerald57-toolbar">${button("Install", "installEapp57()")}${button("Open App Library", "openAppLibrary57()")}</div>`, "eapp57");
    }

    function installEapp57() {
        try {
            const payload = JSON.parse(document.getElementById("eapp57Text")?.value || "{}");
            const app = payload.app || payload;
            if (!app.code || !app.name) throw new Error("Invalid .eapp package.");
            app.id = newAppId(app.name);
            app.source = ".eapp";
            app.installedAt = now();
            app.updatedAt = now();
            const list = appList();
            list.push(app);
            saveAppList(list);
            addNotice("Application installed", `${app.name} was installed from .eapp.`, "success", "custom-apps", `runUserApp57('${safe(app.id)}')`);
            openAppLibrary57();
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

    function showAppstoreRisk57() {
        if (!canSee("virtue")) return editionLock("User Appstore", "Virtue");
        const old = document.getElementById("emerald57-risk");
        if (old) old.remove();
        const modal = document.createElement("div");
        modal.id = "emerald57-risk";
        modal.className = "emerald57-modal-screen";
        modal.innerHTML = `<div class="emerald57-modal"><div class="emerald57-modal-title">User Appstore Warning</div><div class="emerald57-modal-body"><div class="emerald57-danger">Warning! By using this feature, you expose yourself to risk of infection. Use at your own risk.</div><p>User Appstore applications are created by other users. EmeraldOS uses sandboxing and permissions, but you should still review code and install only apps you trust.</p><div class="emerald57-toolbar right"><button class="win95-small-button" onclick="document.getElementById('emerald57-risk').remove()">Cancel</button><button class="win95-small-button" onclick="localStorage.setItem('${LS.appstoreConsent}','true');document.getElementById('emerald57-risk').remove();openUserAppstore57(true)">Agree and Continue</button></div></div></div>`;
        document.body.appendChild(modal);
    }

    async function openUserAppstore57(force = false) {
        if (!canSee("virtue")) return editionLock("User Appstore", "Virtue");
        if (!force && localStorage.getItem(LS.appstoreConsent) !== "true") return showAppstoreRisk57();
        win("User Appstore", `<h2>User Appstore</h2><div class="emerald57-warn">Loading community applications...</div>`, "appstore57");
        const apps = await appstoreDocs();
        const cards = apps.map(a => `<div class="emerald57-card"><h3>${safe(a.icon || "APP")} ${safe(a.name || "Untitled")}</h3><p>${safe(a.description || "No description provided.")}</p><div><span class="emerald57-pill">Publisher: ${safe(a.publisher || "Unknown")}</span><span class="emerald57-pill">Version: ${safe(a.version || "1.0")}</span><span class="emerald57-pill">Downloads: ${safe(a.downloads || 0)}</span></div><div class="emerald57-toolbar">${button("Install", `installStoreApp57('${safe(a.storeId || a.id)}')`)}${button("View Code", `viewStoreCode57('${safe(a.storeId || a.id)}')`)}${button("Report", `reportStoreApp57('${safe(a.storeId || a.id)}')`, "danger")}</div></div>`).join("") || `<div class="emerald57-inset">No applications have been published yet.</div>`;
        win("User Appstore", `<h2>User Appstore</h2><div class="emerald57-danger">Warning! By using this feature, you expose yourself to risk of infection. Use at your own risk.</div><div class="emerald57-toolbar">${button("Refresh", "openUserAppstore57(true)")}${button("Publish My App", "openPublishApp57()")}${button("Installed Apps", "openAppLibrary57()")}${button("Permissions", "openAppPermissions57()")}</div><div class="emerald57-gridcards">${cards}</div>`, "appstore57");
    }

    async function findStoreApp(storeId) { return (await appstoreDocs()).find(a => String(a.storeId || a.id) === String(storeId)); }

    async function installStoreApp57(storeId) {
        const app = await findStoreApp(storeId);
        if (!app) return alert("Application not found.");
        if (!confirm("Install this user-created application? Review the code first if you are not sure.")) return;
        const record = { id: newAppId(app.name || "Store App"), name: app.name || "Store App", icon: app.icon || "APP", description: app.description || "Installed from User Appstore.", code: app.code || "api.write('<h1>Empty app</h1>');", source: "User Appstore", publisher: app.publisher || "Unknown", sourceStoreId: storeId, edition: "virtue", installedAt: now(), updatedAt: now() };
        const list = appList(); list.push(record); saveAppList(list);
        try { if (app.storeId) await updateDoc(doc(db, COL.appstore, app.storeId), { downloads: Number(app.downloads || 0) + 1, lastDownloadedAt: now() }); } catch {}
        addNotice("Application installed", `${record.name} was installed into the Emerald App Library.`, "success", "appstore", `runUserApp57('${safe(record.id)}')`);
        openAppLibrary57();
    }

    async function viewStoreCode57(storeId) {
        const app = await findStoreApp(storeId);
        if (!app) return alert("Application not found.");
        win("App Code Review", `<h2>${safe(app.name || "Application")}</h2><div class="emerald57-danger">Review code before installing user applications.</div><pre class="emerald57-code-preview">${safe(app.code || "")}</pre><div class="emerald57-toolbar">${button("Install", `installStoreApp57('${safe(storeId)}')`)}</div>`, "codeReview57");
    }

    function openPublishApp57(appId = "") {
        if (!canSee("virtue")) return editionLock("Publish Application", "Virtue");
        const apps = appList();
        const opts = apps.map(a => `<option value="${safe(a.id)}" ${a.id === appId ? "selected" : ""}>${safe(a.name)}</option>`).join("");
        win("Publish Application", `<h2>Publish to User Appstore</h2><div class="emerald57-danger">Warning! By using this feature, you expose yourself to risk of infection. Use at your own risk.</div><label>Select App</label><select id="publish57App">${opts}</select><label>Description</label><textarea id="publish57Description" style="height:90px"></textarea><label>Category</label><input id="publish57Category" value="Productivity"><label>Version</label><input id="publish57Version" value="1.0"><div class="emerald57-toolbar">${button("Publish", "publishSelectedApp57()")}${button("Create App", "openApplicationEditor57()")}</div>`, "publish57");
    }

    async function publishSelectedApp57() {
        const appId = document.getElementById("publish57App")?.value;
        const app = appList().find(a => a.id === appId);
        if (!app) return alert("Choose an app first.");
        const record = { name: app.name, icon: app.icon || "APP", description: document.getElementById("publish57Description")?.value || app.description || "No description provided.", category: document.getElementById("publish57Category")?.value || "General", version: document.getElementById("publish57Version")?.value || "1.0", code: app.code || "", publisher: currentUser(), downloads: 0, createdAt: now(), updatedAt: now() };
        try {
            await addDoc(collection(db, COL.appstore), record);
            addNotice("Application published", `${app.name} was published to the User Appstore.`, "success", "appstore");
        } catch (err) {
            const local = getJSON(LS.localStore, []);
            local.unshift(Object.assign({ storeId: "local_" + newAppId(app.name) }, record));
            setJSON(LS.localStore, local.slice(0, 120));
            addNotice("Application saved locally", "Firestore was unavailable, so the app was saved to the local Appstore cache.", "warning", "appstore");
        }
        openUserAppstore57(true);
    }

    async function reportStoreApp57(storeId) {
        const reason = prompt("Why are you reporting this application?");
        if (!reason) return;
        try { await addDoc(collection(db, COL.appstoreReports), { storeId, reason, reporter: currentUser(), createdAt: now(), status: "open" }); }
        catch { const reports = getJSON("57_local_appstore_reports", []); reports.push({ storeId, reason, reporter: currentUser(), createdAt: now(), status: "open" }); setJSON("57_local_appstore_reports", reports); }
        addNotice("Application reported", "Your Appstore report was submitted.", "info", "appstore");
    }

    function openAPIDocs57() {
        win("Custom App API Docs", `<h2>Application Editor API</h2><table class="emerald57-table"><tr><th>API</th><th>Use</th></tr>${[
            ["api.setTitle(text)", "Set the app header title."], ["api.write(html)", "Replace app content."], ["api.append(html)", "Add content."], ["api.button(label, fn)", "Create a button."], ["api.input(placeholder)", "Create an input."], ["api.textarea(placeholder)", "Create a textarea."], ["api.table(rows)", "Create a table."], ["api.notify(title, message)", "Send an EmeraldOS notification."], ["api.storeSet(key, value)", "Save local app data."], ["api.storeGet(key, fallback)", "Read local app data."], ["api.download(name, content)", "Export a file."], ["api.copyText(text)", "Copy text if permission is enabled."], ["api.openLink(url)", "Open a link if permission is enabled."], ["api.getUsername()", "Get username if permission is enabled."]
        ].map(r => `<tr><td><code>${safe(r[0])}</code></td><td>${safe(r[1])}</td></tr>`).join("")}</table>`, "apiDocs57");
    }

    function openCodeSnippets57() {
        const snippets = Object.entries(APP_TEMPLATES).map(([k, v]) => `<h3>${safe(k)}</h3><pre class="emerald57-code-preview">${safe(v)}</pre>`).join("");
        win("Code Snippets", `<h2>Application Editor Snippets</h2>${snippets}`, "snippets57");
    }

    function openCodeStudio57() {
        win("Code Studio", `<h2>Code Studio</h2><p>Use this tool to test JavaScript in a safe custom-app style runner.</p><textarea id="codeStudio57" class="emerald57-codearea">api.setTitle('Code Studio Test');\napi.write('<h1>Code Studio Works</h1>');</textarea><div class="emerald57-toolbar">${button("Run as App", "runCodeStudio57()")}${button("Save as Application", "saveCodeStudioAsApp57()")}${button("API Docs", "openAPIDocs57()")}</div>`, "codeStudio57");
    }

    function runCodeStudio57() { launchSandbox({ id: "code_studio_preview", name: "Code Studio Preview", code: document.getElementById("codeStudio57")?.value || "" }); }
    function saveCodeStudioAsApp57() { openApplicationEditor57(); setTimeout(() => { const area = document.getElementById("app57Code"); if (area) area.value = document.getElementById("codeStudio57")?.value || ""; }, 200); }

    function openSystemCustomizer57() {
        const css = localStorage.getItem(LS.customCSS) || "/* Custom EmeraldOS CSS */\n#desktop { }\n.window { }";
        win("System Customizer", `<h2>System Customizer</h2><div class="emerald57-warn">This edits your local EmeraldOS appearance. Use Recovery Center if your layout becomes difficult to use.</div><textarea id="customCSS57" class="emerald57-codearea">${safe(css)}</textarea><div class="emerald57-toolbar">${button("Apply CSS", "saveCustomCSS57()")}${button("Reset CSS", "resetCustomCSS57()")}${button("Recovery Center", "openRecoveryCenter57()")}</div>`, "customizer57");
    }

    function injectCustomCSS57() {
        let style = document.getElementById("emerald57-custom-css");
        if (!style) { style = document.createElement("style"); style.id = "emerald57-custom-css"; document.head.appendChild(style); }
        style.textContent = localStorage.getItem(LS.customCSS) || "";
    }

    function saveCustomCSS57() { localStorage.setItem(LS.customCSS, document.getElementById("customCSS57")?.value || ""); injectCustomCSS57(); addNotice("Custom CSS applied", "System appearance changes were applied.", "success", "customize"); }
    function resetCustomCSS57() { localStorage.removeItem(LS.customCSS); injectCustomCSS57(); addNotice("Custom CSS reset", "System appearance returned to normal.", "info", "customize"); openSystemCustomizer57(); }

    function openRegistryStudio57() {
        const reg = JSON.stringify(getJSON(LS.registry, { "HKEY_CURRENT_USER\\Software\\EmeraldOS\\ExperienceMode": "standard", "HKEY_CURRENT_USER\\Software\\EmeraldOS\\DesktopLocked": false }), null, 2);
        win("Registry Studio", `<h2>Registry Studio</h2><div class="emerald57-warn">Local user registry editor. Invalid JSON will not be saved.</div><textarea id="registry57" class="emerald57-codearea">${safe(reg)}</textarea><div class="emerald57-toolbar">${button("Save Registry", "saveRegistry57()")}${button("Reset Registry", "resetRegistry57()")}</div>`, "registry57");
    }

    function saveRegistry57() { try { setJSON(LS.registry, JSON.parse(document.getElementById("registry57")?.value || "{}")); addNotice("Registry saved", "Local registry values were saved.", "success", "registry"); } catch (err) { alert("Registry JSON error: " + err.message); } }
    function resetRegistry57() { localStorage.removeItem(LS.registry); openRegistryStudio57(); }

    function openStartupEditor57() {
        const scripts = getJSON(LS.startupScripts, []);
        const rows = scripts.map(s => `<tr><td>${safe(s.name)}</td><td>${safe(s.enabled ? "Enabled" : "Disabled")}</td><td>${button("Run", `runStartupScript57('${safe(s.id)}')`)} ${button("Delete", `deleteStartupScript57('${safe(s.id)}')`)}</td></tr>`).join("") || `<tr><td colspan="3">No startup scripts.</td></tr>`;
        win("Startup Script Center", `<h2>Startup Script Center</h2><div class="emerald57-warn">Startup scripts are run as sandboxed custom app code, not as full OS code.</div><label>Name</label><input id="startup57Name" value="Startup Tool"><label>Script</label><textarea id="startup57Code" class="emerald57-codearea">api.notify('Startup Script','Sandbox script ran.');</textarea><div class="emerald57-toolbar">${button("Save Script", "saveStartupScript57()")}</div><h3>Saved Scripts</h3><table class="emerald57-table"><tr><th>Name</th><th>Status</th><th>Actions</th></tr>${rows}</table>`, "startupScripts57");
    }

    function saveStartupScript57() { const list = getJSON(LS.startupScripts, []); list.push({ id: id("startup"), name: document.getElementById("startup57Name")?.value || "Startup Script", code: document.getElementById("startup57Code")?.value || "", enabled: true, createdAt: now() }); setJSON(LS.startupScripts, list); openStartupEditor57(); }
    function runStartupScript57(scriptId) { const s = getJSON(LS.startupScripts, []).find(x => x.id === scriptId); if (s) launchSandbox({ id: s.id, name: s.name, code: s.code }); }
    function deleteStartupScript57(scriptId) { setJSON(LS.startupScripts, getJSON(LS.startupScripts, []).filter(s => s.id !== scriptId)); openStartupEditor57(); }

    /* =====================================================
       EXPERIENCE, SEARCH, SETTINGS, ACCESSIBILITY
    ===================================================== */

    function openWelcome57() {
        win("Welcome to EmeraldOS", `<h2>Welcome to EmeraldOS 5.7</h2><p>This setup helps you choose a comfortable experience.</p><div class="emerald57-gridcards"><div class="emerald57-card"><h3>Simple Mode</h3><p>Shows fewer apps and focuses on Files, Office, Chat, Settings, and Help.</p>${button("Use Simple Mode", "setSimpleMode57(true)")}</div><div class="emerald57-card"><h3>Advanced Mode</h3><p>Shows more tools including coding, appstore, customization, and system management.</p>${button("Use Advanced Mode", "setSimpleMode57(false)")}</div><div class="emerald57-card"><h3>Accessibility</h3><p>Adjust text size, icon size, contrast, and motion.</p>${button("Open Accessibility", "openAccessibility57()")}</div></div><div class="emerald57-toolbar">${button("Finish Setup", "finishSetup57()")}${button("Experience Center", "openExperienceCenter57()")}</div>`, "welcome57");
    }

    function finishSetup57() { localStorage.setItem(LS.setupDone, "true"); addNotice("Setup complete", "EmeraldOS is ready.", "success", "setup"); }
    function setSimpleMode57(value) { localStorage.setItem(LS.simpleMode, value ? "true" : "false"); addNotice("Experience mode changed", value ? "Simple Mode enabled." : "Advanced Mode enabled.", "success", "settings"); rerender(); }

    function openExperienceCenter57() {
        win("Experience Center", `<h2>Experience Center</h2><div class="emerald57-gridcards"><div class="emerald57-card"><h3>Getting Started</h3><p>Learn desktop basics, files, office, chat, and the appstore.</p>${button("Welcome Setup", "openWelcome57()")}${button("Help System", "openHelpSystem57()")}</div><div class="emerald57-card"><h3>Reliability</h3><p>Repair desktop, reset windows, recover drafts, and use Safe Mode.</p>${button("Recovery Center", "openRecoveryCenter57()")}${button("Window Manager", "openWindowManager57()")}</div><div class="emerald57-card"><h3>Personalization</h3><p>Change themes, layout, accessibility, and taskbar options.</p>${button("Settings", "openSettings57()")}${button("System Customizer", "openSystemCustomizer57()")}</div><div class="emerald57-card"><h3>Build Apps</h3><p>Use Application Editor, Code Studio, API Docs, and User Appstore.</p>${button("Application Editor", "openApplicationEditor57()")}${button("User Appstore", "openUserAppstore57()")}</div></div>`, "experience57");
    }

    function allSearchItems() {
        const apps = Object.entries(window.APPS || {}).filter(([id, app]) => appVisible(id)).map(([id, app]) => ({ type: "Application", title: app.name, detail: app.edition || "economy", action: `launchApp('${safe(id)}')` }));
        const notes = notifications().slice(0, 20).map(n => ({ type: "Notification", title: n.title, detail: n.message, action: "openNotificationCenter57()" }));
        const help = ["share a file", "install app", "create custom app", "reset desktop", "block user", "notifications", "storage warning"].map(h => ({ type: "Help", title: h, detail: "Help article", action: "openHelpSystem57()" }));
        return apps.concat(notes, help);
    }

    function openGlobalSearch57() {
        win("Emerald Search", `<h2>Emerald Search</h2><input id="search57Box" placeholder="Search apps, files, settings, users, help" oninput="renderSearch57()"><div id="search57Results" class="emerald57-results"></div>`, "search57");
        setTimeout(renderSearch57, 50);
    }

    function renderSearch57() {
        const q = String(document.getElementById("search57Box")?.value || "").toLowerCase();
        const results = allSearchItems().filter(i => !q || (i.title + " " + i.detail + " " + i.type).toLowerCase().includes(q)).slice(0, 80);
        const html = results.map(i => `<div class="emerald57-result" onclick="${i.action}"><b>${safe(i.title)}</b><span>${safe(i.type)} · ${safe(i.detail)}</span></div>`).join("") || `<div class="emerald57-inset">No results.</div>`;
        const el = document.getElementById("search57Results");
        if (el) el.innerHTML = html;
    }

    function openCommandPalette57() {
        const existing = document.getElementById("command57Overlay");
        if (existing) existing.remove();
        const div = document.createElement("div");
        div.id = "command57Overlay";
        div.className = "emerald57-command-overlay";
        div.innerHTML = `<div class="emerald57-command-box"><input id="command57Input" placeholder="Type a command: files, office, chat, settings, appstore"><div id="command57Results"></div></div>`;
        document.body.appendChild(div);
        document.getElementById("command57Input")?.focus();
        document.getElementById("command57Input")?.addEventListener("input", renderCommand57);
        renderCommand57();
    }

    function renderCommand57() {
        const q = String(document.getElementById("command57Input")?.value || "").toLowerCase();
        const cmds = [
            ["Open Files", "openFiles57()"], ["Open Emerald Office", "openOffice57()"], ["Open Chat", "openChat57()"], ["Open User Appstore", "openUserAppstore57()"], ["Create Application", "openApplicationEditor57()"], ["Open Settings", "openSettings57()"], ["Open Notifications", "openNotificationCenter57()"], ["Reset Windows", "resetWindows57()"], ["Open Recovery Center", "openRecoveryCenter57()"], ["Open Experience Center", "openExperienceCenter57()"]
        ].filter(c => !q || c[0].toLowerCase().includes(q));
        const html = cmds.map(c => `<div class="emerald57-result" onclick="${c[1]};document.getElementById('command57Overlay')?.remove()"><b>${safe(c[0])}</b><span>${safe(c[1])}</span></div>`).join("");
        const out = document.getElementById("command57Results");
        if (out) out.innerHTML = html;
    }

    function openQuickSettings57() {
        const s = getJSON(LS.quickSettings, { notifications: true, focus: false, desktopLocked: false, assistant: false, theme: "classic" });
        win("Quick Settings", `<h2>Quick Settings</h2><div class="emerald57-gridcards"><div class="emerald57-card"><h3>Notifications</h3>${check("qs57Notifications", "Enabled", s.notifications)}</div><div class="emerald57-card"><h3>Focus Mode</h3>${check("qs57Focus", "Reduce interruptions", s.focus)}</div><div class="emerald57-card"><h3>Desktop Lock</h3>${check("qs57Desktop", "Lock desktop layout", s.desktopLocked)}</div><div class="emerald57-card"><h3>Assistant</h3>${check("qs57Assistant", "Enable Emerald Assistant", s.assistant)}</div></div><div class="emerald57-toolbar">${button("Save", "saveQuickSettings57()")}${button("Settings", "openSettings57()")}</div>`, "quickSettings57");
    }

    function saveQuickSettings57() { setJSON(LS.quickSettings, { notifications: !!document.getElementById("qs57Notifications")?.checked, focus: !!document.getElementById("qs57Focus")?.checked, desktopLocked: !!document.getElementById("qs57Desktop")?.checked, assistant: !!document.getElementById("qs57Assistant")?.checked }); addNotice("Quick settings saved", "Settings were updated.", "success", "settings"); applyAccessibility57(); }

    function openSettings57() {
        win("Settings", `<h2>Settings 4.0</h2><div class="emerald57-gridcards">${[
            ["Account", "Username, role, edition, profile.", "openProfile57()"], ["Appearance", "Themes, wallpaper, sounds.", "openThemeManager57()"], ["Desktop", "Lock, align, reset layout.", "openDesktopLayout57()"], ["Taskbar", "Bell, clock, quick settings.", "openTaskbarSettings57()"], ["Files", "Storage and sharing preferences.", "openFiles57()"], ["Chat", "Messages and blocking.", "openChat57()"], ["Notifications", "Notification categories and unread count.", "openNotificationSettings57()"], ["Application Editor", "Templates, API docs, permissions.", "openApplicationEditor57()"], ["User Appstore", "Community apps and safety warning.", "openUserAppstore57()"], ["Accessibility", "Text size, contrast, motion.", "openAccessibility57()"], ["Security", "Privacy and blocked users.", "openSecurityCenter57()"], ["Recovery", "Repair OS experience.", "openRecoveryCenter57()"]
        ].map(i => `<div class="emerald57-card"><h3>${safe(i[0])}</h3><p>${safe(i[1])}</p>${button("Open", i[2])}</div>`).join("")}</div>`, "settings57");
    }

    function openAccessibility57() {
        const a = getJSON(LS.accessibility, { textSize: "normal", iconSize: "normal", contrast: false, reducedMotion: false, focus: true });
        win("Accessibility", `<h2>Accessibility</h2><label>Text size</label><select id="acc57Text"><option ${a.textSize === "normal" ? "selected" : ""}>normal</option><option ${a.textSize === "large" ? "selected" : ""}>large</option><option ${a.textSize === "xlarge" ? "selected" : ""}>xlarge</option></select><label>Icon size</label><select id="acc57Icon"><option ${a.iconSize === "compact" ? "selected" : ""}>compact</option><option ${a.iconSize === "normal" ? "selected" : ""}>normal</option><option ${a.iconSize === "large" ? "selected" : ""}>large</option></select>${check("acc57Contrast", "High contrast", a.contrast)}${check("acc57Motion", "Reduced motion", a.reducedMotion)}${check("acc57Focus", "Show keyboard focus outline", a.focus)}<div class="emerald57-toolbar">${button("Save", "saveAccessibility57()")}</div>`, "accessibility57");
    }

    function saveAccessibility57() { setJSON(LS.accessibility, { textSize: document.getElementById("acc57Text")?.value || "normal", iconSize: document.getElementById("acc57Icon")?.value || "normal", contrast: !!document.getElementById("acc57Contrast")?.checked, reducedMotion: !!document.getElementById("acc57Motion")?.checked, focus: !!document.getElementById("acc57Focus")?.checked }); applyAccessibility57(); addNotice("Accessibility saved", "Accessibility settings were applied.", "success", "settings"); }

    function applyAccessibility57() {
        const a = getJSON(LS.accessibility, {});
        document.body.classList.toggle("emerald57-large-text", a.textSize === "large");
        document.body.classList.toggle("emerald57-xlarge-text", a.textSize === "xlarge");
        document.body.classList.toggle("emerald57-high-contrast", !!a.contrast);
        document.body.classList.toggle("emerald57-reduced-motion", !!a.reducedMotion);
        document.body.classList.toggle("emerald57-hide-focus", a.focus === false);
    }

    /* =====================================================
       FILES, SHARING, STORAGE, OFFICE, CHAT, PEOPLE
    ===================================================== */

    async function loadFiles() { try { const f = await loadDrive() || {}; if (window.fileSystem) window.fileSystem.files = f; return f; } catch { return window.fileSystem?.files || {}; } }
    function fileSize(file = {}) { return Number(file.storageSize || file.size || byteSize(file.content || "") || 0); }
    function fileType(name = "") { const l = String(name).toLowerCase(); if (/\.eapp$/i.test(l)) return "Emerald Application"; if (/\.edoc|\.txt|\.md|\.html$/i.test(l)) return "Document"; if (/\.esheet|\.csv$/i.test(l)) return "Spreadsheet"; if (/\.eslide$/i.test(l)) return "Presentation"; if (/\.enote$/i.test(l)) return "Note"; return "File"; }

    async function openFiles57() {
        const files = await loadFiles();
        const entries = Object.entries(files || {});
        const total = entries.reduce((sum, [, f]) => sum + fileSize(f), 0);
        const rows = entries.map(([fid, f]) => `<tr><td><b>${safe(f.name || fid)}</b><br><span class="emerald57-note">ID: ${safe(fid)} · ${safe(fileType(f.name))}</span></td><td>${formatBytes(fileSize(f))}</td><td>${safe(f.folder || "Drive")}</td><td>${button("Open", `openFile57('${safe(fid)}')`)} ${button("Share", `shareFilePrompt57('${safe(fid)}')`)} ${button("Details", `fileDetails57('${safe(fid)}')`)} ${button("Trash", `trashFile57('${safe(fid)}')`)}</td></tr>`).join("") || `<tr><td colspan="4">No files found.</td></tr>`;
        win("Files", `<h2>Files</h2><div class="emerald57-toolbar">${button("New Document", "newWriterDoc57()")}${button("Storage", "openStorage57()")}${button("Shared With Me", "openSharedWithMe57()")}${button("Shared By Me", "openSharedByMe57()")}${button("Refresh", "openFiles57()")}</div><div class="emerald57-meter"><div style="width:${Math.min(100, total / BUILD.fileLimit * 100)}%"></div></div><p>Estimated local file usage: <b>${formatBytes(total)}</b> / ${formatBytes(BUILD.fileLimit)} standard limit.</p><table class="emerald57-table"><tr><th>File</th><th>Size</th><th>Folder</th><th>Actions</th></tr>${rows}</table>`, "files57");
    }

    async function openFile57(fid) {
        const files = await loadFiles();
        const f = files[fid];
        if (!f) return alert("File not found.");
        let content = f.content;
        try { if (!content && typeof getFileContent === "function") content = await getFileContent(fid, f); } catch {}
        win("File Preview", `<h2>${safe(f.name || fid)}</h2><div class="emerald57-toolbar">${button("Details", `fileDetails57('${safe(fid)}')`)}${button("Share", `shareFilePrompt57('${safe(fid)}')`)}</div><pre class="emerald57-code-preview">${safe(content || "No preview available.")}</pre>`, "filePreview57");
    }

    async function fileDetails57(fid) {
        const files = await loadFiles(); const f = files[fid]; if (!f) return alert("File not found.");
        win("File Details", `<h2>${safe(f.name || fid)}</h2><table class="emerald57-table"><tr><th>Property</th><th>Value</th></tr><tr><td>File ID</td><td>${safe(fid)}</td></tr><tr><td>Type</td><td>${safe(fileType(f.name))}</td></tr><tr><td>Size</td><td>${formatBytes(fileSize(f))}</td></tr><tr><td>Folder</td><td>${safe(f.folder || "Drive")}</td></tr><tr><td>Shared</td><td>${safe(f.shared ? "Yes" : "Unknown")}</td></tr></table>`, "fileDetails57");
    }

    async function trashFile57(fid) { if (!confirm("Move this file to Trash?")) return; try { await cloudSaveFile(fid, { folder: "Trash", trashedAt: now() }); addNotice("File moved to Trash", "The file was moved to Trash.", "info", "files"); openFiles57(); } catch (err) { alert("Trash failed: " + err.message); } }

    async function shareFilePrompt57(fid) {
        const target = prompt("Share with EmeraldOS username:"); if (!target) return;
        const permission = prompt("Permission: view or edit", "view") || "view";
        try { await addDoc(collection(db, COL.shares), { fileId: fid, owner: currentUser(), targetUser: target.trim(), permission, createdAt: now(), status: "active" }); addNotice("File shared", `File was shared with ${target}.`, "success", "sharing", "openSharedByMe57()"); }
        catch (err) { alert("Share failed. Check Firestore rules. " + err.message); }
    }

    async function openSharedByMe57() {
        const rows = [];
        try { const snap = await getDocs(collection(db, COL.shares)); snap.forEach(d => { const s = d.data(); if (s.owner === currentUser()) rows.push(Object.assign({ id: d.id }, s)); }); } catch {}
        win("Shared By Me", `<h2>Shared By Me</h2><table class="emerald57-table"><tr><th>File ID</th><th>User</th><th>Permission</th><th>Action</th></tr>${rows.map(r => `<tr><td>${safe(r.fileId)}</td><td>${safe(r.targetUser)}</td><td>${safe(r.permission)}</td><td>${button("Revoke", `revokeShare57('${safe(r.id)}')`)}</td></tr>`).join("") || `<tr><td colspan="4">No outgoing shares found.</td></tr>`}</table>`, "sharedByMe57");
    }

    async function openSharedWithMe57() {
        const rows = [];
        try { const snap = await getDocs(collection(db, COL.shares)); snap.forEach(d => { const s = d.data(); if (String(s.targetUser).toLowerCase() === currentUser().toLowerCase()) rows.push(Object.assign({ id: d.id }, s)); }); } catch {}
        win("Shared With Me", `<h2>Shared With Me</h2><table class="emerald57-table"><tr><th>File ID</th><th>Owner</th><th>Permission</th></tr>${rows.map(r => `<tr><td>${safe(r.fileId)}</td><td>${safe(r.owner)}</td><td>${safe(r.permission)}</td></tr>`).join("") || `<tr><td colspan="3">No shared files found.</td></tr>`}</table>`, "sharedWithMe57");
    }

    async function revokeShare57(shareId) { try { await deleteDoc(doc(db, COL.shares, shareId)); addNotice("Share revoked", "File access was revoked.", "info", "sharing"); openSharedByMe57(); } catch (err) { alert("Revoke failed: " + err.message); } }

    async function openStorage57() {
        const files = await loadFiles();
        const entries = Object.entries(files || {}).sort((a,b)=>fileSize(b[1])-fileSize(a[1]));
        const total = entries.reduce((s,[,f])=>s+fileSize(f),0);
        const pct = Math.min(100, total / BUILD.fileLimit * 100);
        win("Storage Center", `<h2>Storage Center</h2><div class="emerald57-meter"><div style="width:${pct}%"></div></div><p><b>${formatBytes(total)}</b> used out of the standard ${formatBytes(BUILD.fileLimit)} limit.</p>${pct > 85 ? `<div class="emerald57-danger">Storage warning: you are close to the standard file limit.</div>` : ""}<h3>Largest Files</h3><table class="emerald57-table"><tr><th>File</th><th>Size</th><th>Action</th></tr>${entries.slice(0,20).map(([fid,f])=>`<tr><td>${safe(f.name||fid)}</td><td>${formatBytes(fileSize(f))}</td><td>${button("Details",`fileDetails57('${safe(fid)}')`)}</td></tr>`).join("")||`<tr><td colspan="3">No files.</td></tr>`}</table>`, "storage57");
    }

    function openOffice57() {
        win("Emerald Office", `<h2>Emerald Office 5.7</h2><div class="emerald57-gridcards"><div class="emerald57-card"><h3>Writer</h3><p>Page layout, autosave, word count, templates, print, export, tables, and Files save.</p>${button("Open Writer", "openWriter57()")}</div><div class="emerald57-card"><h3>Sheets</h3><p>Basic formulas, CSV tools, totals, and cell editing.</p>${button("Open Sheets", "openSheets57()")}</div><div class="emerald57-card"><h3>Slides</h3><p>Slide list, themes, presenter view, and HTML presentation export.</p>${button("Open Slides", "openSlides57()")}</div><div class="emerald57-card"><h3>Forms</h3><p>Build simple forms and preview responses.</p>${button("Open Forms", "openForms57()")}</div><div class="emerald57-card"><h3>Templates</h3><p>Start letters, memos, policies, reports, and meeting notes.</p>${button("Open Templates", "openOfficeTemplates57()")}</div><div class="emerald57-card"><h3>Document Vault</h3><p>Open saved documents from Files and manage Office files.</p>${button("Open Vault", "openDocumentVault57()")}</div></div>`, "office57");
    }

    function openWriter57() {
        const draft = localStorage.getItem(LS.officeDraft) || "";
        win("Emerald Writer", `<h2>Emerald Writer</h2><div class="emerald57-toolbar">${button("Bold", "document.execCommand('bold')")}${button("Italic", "document.execCommand('italic')")}${button("Underline", "document.execCommand('underline')")}${button("Bullets", "document.execCommand('insertUnorderedList')")}${button("Numbering", "document.execCommand('insertOrderedList')")}${button("Insert Date", "writerInsertDate57()")}${button("Insert Table", "writerInsertTable57()")}${button("Template", "writerTemplate57()")}${button("Print", "printWriter57()")}${button("Save Draft", "saveWriterDraft57()")}${button("Save to Files", "saveWriterToFiles57()")}${button("Export HTML", "exportWriterHTML57()")}${button("Export TXT", "exportWriterTXT57()")}</div><div id="writer57Editor" class="emerald57-writer" contenteditable="true">${draft}</div><div class="emerald57-status" id="writer57Stats">Ready</div>`, "writer57");
        setTimeout(() => { const ed = document.getElementById("writer57Editor"); if (ed) ed.addEventListener("input", () => { localStorage.setItem(LS.officeDraft, ed.innerHTML); updateWriterStats57(); }); updateWriterStats57(); }, 60);
    }

    function updateWriterStats57() { const t = document.getElementById("writer57Editor")?.innerText || ""; const el = document.getElementById("writer57Stats"); if (el) el.textContent = `${t.trim().split(/\s+/).filter(Boolean).length} words · ${t.length} characters · Autosaved locally`; }
    function writerInsertDate57() { document.execCommand("insertText", false, new Date().toLocaleDateString()); }
    function writerInsertTable57() { document.execCommand("insertHTML", false, "<table border='1' style='width:100%'><tr><td>Cell</td><td>Cell</td></tr><tr><td>Cell</td><td>Cell</td></tr></table>"); }
    function saveWriterDraft57() { localStorage.setItem(LS.officeDraft, document.getElementById("writer57Editor")?.innerHTML || ""); addNotice("Document saved", "Writer draft was saved locally.", "success", "office"); }
    async function saveWriterToFiles57() { const name = prompt("Document name", "Document.edoc") || "Document.edoc"; const content = document.getElementById("writer57Editor")?.innerHTML || ""; if (byteSize(content) > BUILD.fileLimit) addNotice("Storage warning", "This document is larger than the standard file limit.", "warning", "storage"); try { await cloudCreateFile(name, content); addNotice("Document saved to Files", `${name} was saved.`, "success", "office", "openFiles57()"); } catch (err) { alert("Save failed: " + err.message); } }
    function exportWriterHTML57() { const blob = new Blob([document.getElementById("writer57Editor")?.innerHTML || ""], { type: "text/html" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "document.html"; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),500); }
    function newWriterDoc57() { openWriter57(); }
    function openSheets57() { win("Emerald Sheets", `<h2>Emerald Sheets</h2><p>Basic grid, CSV export, and totals.</p><textarea id="sheet57Data" class="emerald57-codearea">Item,Amount\nExample,10\nAnother,15</textarea><div class="emerald57-toolbar">${button("Export CSV", "exportSheetCSV57()")}${button("Auto Total", "sheetAutoTotal57()")}</div><pre id="sheet57Out" class="emerald57-code-preview"></pre>`, "sheets57"); }
    function exportSheetCSV57() { const blob = new Blob([document.getElementById("sheet57Data")?.value || ""], { type: "text/csv" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "sheet.csv"; a.click(); }
    function sheetAutoTotal57() { const rows = (document.getElementById("sheet57Data")?.value || "").split(/\n/).slice(1); const total = rows.reduce((s,r)=>s+Number((r.split(',')[1]||0)),0); document.getElementById("sheet57Out").textContent = "Total: " + total; }
    function openSlides57() { win("Emerald Slides", `<h2>Emerald Slides</h2><textarea id="slides57Data" class="emerald57-codearea">Slide 1: Welcome\nSlide 2: Features\nSlide 3: Finish</textarea><div class="emerald57-toolbar">${button("Present", "presentSlides57()")}</div>`, "slides57"); }
    function presentSlides57() { const slides = (document.getElementById("slides57Data")?.value || "").split(/\n/).filter(Boolean).map(s=>`<div class="emerald57-card"><h1>${safe(s)}</h1></div>`).join(""); win("Slide Presentation", `<div class="emerald57-slides">${slides}</div>`, "present57"); }
    function openForms57() { win("Emerald Forms", `<h2>Emerald Forms</h2><label>Question</label><input id="form57Question" value="What do you think?"><label>Type</label><select id="form57Type"><option>short answer</option><option>paragraph</option><option>multiple choice</option></select><div class="emerald57-toolbar">${button("Preview", "previewForm57()")}</div><div id="form57Preview"></div>`, "forms57"); }
    function previewForm57() { const q = document.getElementById("form57Question")?.value || "Question"; const out = document.getElementById("form57Preview"); if (out) out.innerHTML = `<div class="emerald57-card"><b>${safe(q)}</b><br><input placeholder="Answer"></div>`; }

    async function openChat57() { win("Emerald Chat", `<h2>Emerald Chat 4.0</h2><div class="emerald57-toolbar">${button("Global Room", "openChatRoom57('global')")}${button("Message Requests", "openMessageRequests57()")}${button("Contacts", "openContacts57()")}${button("Blocking", "openBlocking57()")}</div><div id="chat57Area" class="emerald57-chat"><p>Select a room.</p></div>`, "chat57"); }
    async function openChatRoom57(roomId = "global") { const area = document.getElementById("chat57Area"); if (!area) return openChat57(); area.innerHTML = `<h3>${safe(roomId)}</h3><div id="messages57">Loading...</div><input id="chat57Input" placeholder="Message"><button onclick="sendChat57('${safe(roomId)}')">Send</button>`; try { const snap = await getDocs(collection(db, COL.chatRooms, roomId, "messages")); const msgs=[]; snap.forEach(d=>msgs.push(d.data())); document.getElementById("messages57").innerHTML = msgs.sort((a,b)=>a.createdAt-b.createdAt).slice(-60).map(m=>`<div class="emerald57-msg"><b>${safe(m.from)}</b>: ${safe(m.text)} <button onclick="reportChat57('${safe(roomId)}','${safe(m.id||'')}')">Report</button></div>`).join("") || "No messages."; } catch { document.getElementById("messages57").textContent = "Could not load chat. Check Firestore rules."; } }
    async function sendChat57(roomId) { const input = document.getElementById("chat57Input"); const msg = input?.value?.trim(); if (!msg) return; if (isBlockedUser("chat")) return; const record = { id: id("msg"), from: currentUser(), text: msg, createdAt: now() }; try { await addDoc(collection(db, COL.chatRooms, roomId, "messages"), record); input.value=""; addNotice("Message sent", "Your chat message was sent.", "info", "chat"); openChatRoom57(roomId); } catch (err) { alert("Send failed: " + err.message); } }
    function reportChat57(roomId, messageId) { addNotice("Message reported", "The message report was added to moderation review.", "info", "moderation"); }

    function contacts() { return getJSON(LS.contacts, []); }
    function blocked() { return getJSON(LS.blocked, []); }
    function isBlockedUser(u) { return blocked().map(x=>x.toLowerCase()).includes(String(u).toLowerCase()); }
    function openContacts57() { const rows = contacts().map(c=>`<tr><td>${safe(c)}</td><td>${button("Chat", `openChat57()`)} ${button("Remove", `removeContact57('${safe(c)}')`)} ${button("Block", `blockUser57('${safe(c)}')`)}</td></tr>`).join("") || `<tr><td colspan="2">No contacts.</td></tr>`; win("Contacts", `<h2>Contacts</h2><input id="contact57Name" placeholder="Username"><button onclick="addContact57()">Add Contact</button><table class="emerald57-table"><tr><th>User</th><th>Actions</th></tr>${rows}</table>`, "contacts57"); }
    function addContact57() { const u = document.getElementById("contact57Name")?.value?.trim(); if (!u) return; setJSON(LS.contacts, Array.from(new Set([...contacts(), u]))); openContacts57(); }
    function removeContact57(u) { setJSON(LS.contacts, contacts().filter(c=>c!==u)); openContacts57(); }
    function openBlocking57() { const rows = blocked().map(u=>`<tr><td>${safe(u)}</td><td>${button("Unblock", `unblockUser57('${safe(u)}')`)}</td></tr>`).join("") || `<tr><td colspan="2">No blocked users.</td></tr>`; win("Blocking Center", `<h2>Blocking Center</h2><input id="block57Name" placeholder="Username"><button onclick="blockUser57()">Block User</button><table class="emerald57-table"><tr><th>User</th><th>Action</th></tr>${rows}</table>`, "blocking57"); }
    function blockUser57(u = "") { const target = u || document.getElementById("block57Name")?.value?.trim(); if (!target) return; setJSON(LS.blocked, Array.from(new Set([...blocked(), target]))); addNotice("User blocked", `${target} was blocked.`, "info", "security"); openBlocking57(); }
    function unblockUser57(u) { setJSON(LS.blocked, blocked().filter(x=>x!==u)); addNotice("User unblocked", `${u} was unblocked.`, "info", "security"); openBlocking57(); }
    function openMessageRequests57() { win("Message Requests", `<h2>Message Requests</h2><p>No pending message requests. Blocked-user filtering is active.</p>`, "messageRequests57"); }
    function openProfile57() { const p = getJSON(LS.profile, { displayName: currentUser(), bio: "", status: "Available", color: "green" }); win("User Profile", `<h2>User Profile</h2><label>Display Name</label><input id="profile57Display" value="${safe(p.displayName)}"><label>Status</label><input id="profile57Status" value="${safe(p.status)}"><label>Bio</label><textarea id="profile57Bio">${safe(p.bio)}</textarea><div class="emerald57-toolbar">${button("Save", "saveProfile57()")}</div>`, "profile57"); }
    function saveProfile57() { setJSON(LS.profile, { displayName: document.getElementById("profile57Display")?.value || currentUser(), status: document.getElementById("profile57Status")?.value || "Available", bio: document.getElementById("profile57Bio")?.value || "" }); addNotice("Profile saved", "Your EmeraldOS profile was updated.", "success", "profile"); }

    /* =====================================================
       ADMIN, MODERATION, HELP, RECOVERY, SUPPORT UX
    ===================================================== */

    async function openAdminPanel57() {
        if (!isExecutive()) return editionLock("Administrative Panel", "Executive");
        let userCount = "Unknown";
        try { const snap = await getDocs(collection(db, COL.users)); userCount = String(snap.size); } catch {}
        win("Administrative Panel", `<h2>Administrative Panel</h2><div class="emerald57-gridcards"><div class="emerald57-card"><h3>Users</h3><p>Total EmeraldOS users: ${safe(userCount)}</p>${button("User Administration", "openUserAdmin57()")}</div><div class="emerald57-card"><h3>Files</h3><p>Review storage and sharing.</p>${button("Storage Administration", "openStorage57()")}${button("Sharing Admin", "openSharedByMe57()")}</div><div class="emerald57-card"><h3>Reports</h3><p>Review chat and appstore reports.</p>${button("Moderator Center", "openModerationCenter57()")}${button("Appstore Moderation", "openAppstoreModeration57()")}</div><div class="emerald57-card"><h3>Logs</h3><p>Admin action log and audit tools.</p>${button("Activity Center", "openActivityCenter57()")}</div></div>`, "admin57");
    }

    async function openUserAdmin57() {
        if (!isExecutive()) return editionLock("User Administration", "Executive");
        const rows = [];
        try { const snap = await getDocs(collection(db, COL.users)); snap.forEach(d => rows.push(Object.assign({ id: d.id }, d.data() || {}))); } catch {}
        win("User Administration", `<h2>User Administration</h2><input placeholder="Search users" oninput="filterTable57('usersAdmin57',this.value)"><table class="emerald57-table" id="usersAdmin57"><tr><th>User</th><th>Role</th><th>Actions</th></tr>${rows.map(u=>`<tr><td><b>${safe(u.username || u.id)}</b></td><td>${safe(u.role || "user")}</td><td>${button("View Files", `adminViewUserFiles57('${safe(u.username || u.id)}')`)} ${button("Note", `adminNote57('${safe(u.username || u.id)}')`)}</td></tr>`).join("") || `<tr><td colspan="3">No user list available. Check Firestore rules.</td></tr>`}</table>`, "userAdmin57");
    }

    function adminNote57(user) { const note = prompt("Admin note for " + user); if (note) addNotice("Admin note saved", `Note for ${user}: ${note}`, "info", "admin"); }
    function adminViewUserFiles57(user) { win("User Files", `<h2>${safe(user)} Files</h2><p>This view depends on Firestore rules allowing Executive users to read <code>emeraldOSUsers/${safe(user)}/drive</code>.</p>`, "adminFiles57"); }
    function openModerationCenter57() { if (!isModerator()) return editionLock("Moderation Center", "Developer/Moderator"); win("Moderation Center", `<h2>Moderation Center</h2><div class="emerald57-gridcards"><div class="emerald57-card"><h3>Report Queue</h3><p>Review chat, file, and app reports.</p>${button("Appstore Reports", "openAppstoreModeration57()")}</div><div class="emerald57-card"><h3>User Actions</h3><p>Warn, mute, or escalate users.</p>${button("Blocking Center", "openBlocking57()")}</div><div class="emerald57-card"><h3>Logs</h3><p>Review moderation activity.</p>${button("Activity Center", "openActivityCenter57()")}</div></div>`, "moderation57"); }
    function openAppstoreModeration57() { if (!isModerator()) return editionLock("Appstore Moderation", "Developer/Moderator"); const reports = getJSON("57_local_appstore_reports", []); win("Appstore Moderation", `<h2>Appstore Moderation</h2><table class="emerald57-table"><tr><th>App</th><th>Reason</th><th>Reporter</th></tr>${reports.map(r=>`<tr><td>${safe(r.storeId)}</td><td>${safe(r.reason)}</td><td>${safe(r.reporter)}</td></tr>`).join("") || `<tr><td colspan="3">No local reports.</td></tr>`}</table>`, "appstoreMod57"); }
    function openSecurityCenter57() { win("Security & Privacy Center", `<h2>Security & Privacy Center</h2><div class="emerald57-gridcards"><div class="emerald57-card"><h3>Account</h3><p>User: ${safe(currentUser())}<br>Role: ${safe(roleText() || "user")}</p></div><div class="emerald57-card"><h3>Blocked Users</h3><p>${blocked().length} blocked users.</p>${button("Open Blocking", "openBlocking57()")}</div><div class="emerald57-card"><h3>Shares</h3><p>Review shared files and revoke access.</p>${button("Shared By Me", "openSharedByMe57()")}</div><div class="emerald57-card"><h3>Local Cache</h3><p>Clear local UI cache and recovery data.</p>${button("Recovery Center", "openRecoveryCenter57()")}</div></div>`, "security57"); }
    function openHelpSystem57() { win("Help System", `<h2>EmeraldOS Help</h2><input placeholder="Search help" oninput="filterTable57('helpTable57',this.value)"><table class="emerald57-table" id="helpTable57"><tr><th>Article</th><th>Summary</th></tr>${[
        ["How to share a file", "Open Files, click Share next to a file, enter a username, and choose view or edit."], ["How to install a custom app", "Open User Appstore, agree to the warning, review code, then click Install."], ["How to build an app", "Open Application Editor, choose a template, use the API docs, preview, then save."], ["How to reset desktop", "Open Recovery Center or Desktop Layout and choose Reset Desktop."], ["How to block a user", "Open Blocking Center, enter a username, and click Block User."], ["How to recover a document", "Open Writer and check the autosaved draft, or open Recovery Center."], ["How to use Safe Mode", "Open Recovery Center and enable Safe Mode to disable custom and Appstore apps temporarily."]
    ].map(r=>`<tr><td><b>${safe(r[0])}</b></td><td>${safe(r[1])}</td></tr>`).join("")}</table>`, "help57"); }
    function openRecoveryCenter57() { win("Recovery Center", `<h2>Recovery Center</h2><div class="emerald57-gridcards"><div class="emerald57-card"><h3>Desktop</h3>${button("Reset Desktop", "desktopReset57()")}${button("Clean Desktop", "desktopClean57()")}</div><div class="emerald57-card"><h3>Windows</h3>${button("Reset Windows", "resetWindows57()")}${button("Close All", "closeAllWindows57()")}</div><div class="emerald57-card"><h3>Safe Mode</h3>${button("Enable Safe Mode", "enableSafeMode57()")}${button("Disable Safe Mode", "disableSafeMode57()")}</div><div class="emerald57-card"><h3>Cache</h3>${button("Clear Recovery Data", "clearRecovery57()")}${button("Reset Custom CSS", "resetCustomCSS57()")}</div></div>`, "recovery57"); }
    function enableSafeMode57() { localStorage.setItem("57_safe_mode", "true"); addNotice("Safe Mode enabled", "Custom and Appstore apps will be hidden until Safe Mode is disabled.", "warning", "recovery"); rerender(); }
    function disableSafeMode57() { localStorage.removeItem("57_safe_mode"); addNotice("Safe Mode disabled", "Custom and Appstore apps are available again.", "success", "recovery"); rerender(); }
    function clearRecovery57() { [LS.recovery, LS.officeDraft].forEach(k=>localStorage.removeItem(k)); addNotice("Recovery data cleared", "Recovery cache was cleared.", "info", "recovery"); }
    function openActivityCenter57() { const rows = getJSON(LS.activities, []).map(a=>`<tr><td><b>${safe(a.title)}</b><br><span class="emerald57-note">${safe(a.detail)}</span></td><td>${safe(a.category)}</td><td>${dateTime(a.time)}</td></tr>`).join("") || `<tr><td colspan="3">No recent activity.</td></tr>`; win("Activity Center", `<h2>Recent Activity</h2><table class="emerald57-table"><tr><th>Activity</th><th>Category</th><th>Time</th></tr>${rows}</table>`, "activity57"); }
    function openHomeDashboard57() { win("Home Dashboard", `<h2>Today</h2><div class="emerald57-gridcards"><div class="emerald57-card"><h3>Unread</h3><p>${unreadCount()} unread notifications.</p>${button("Notifications", "openNotificationCenter57()")}</div><div class="emerald57-card"><h3>Quick Actions</h3>${button("New Document", "openWriter57()")}${button("Files", "openFiles57()")}${button("Chat", "openChat57()")}</div><div class="emerald57-card"><h3>Custom Apps</h3><p>${appList().length} installed custom apps.</p>${button("App Library", "openAppLibrary57()")}</div></div>`, "dashboard57"); }
    function openFeedback57() { win("Feedback", `<h2>Feedback</h2><label>Type</label><select id="fb57Type"><option>bug</option><option>feature</option><option>experience</option></select><label>Message</label><textarea id="fb57Msg" class="emerald57-codearea"></textarea><div class="emerald57-toolbar">${button("Submit", "submitFeedback57()")}</div>`, "feedback57"); }
    async function submitFeedback57() { const record={type:document.getElementById("fb57Type")?.value||"feedback", message:document.getElementById("fb57Msg")?.value||"", user:currentUser(), createdAt:now()}; try{await addDoc(collection(db, COL.feedback), record);}catch{const list=getJSON(LS.feedback,[]);list.unshift(record);setJSON(LS.feedback,list);} addNotice("Feedback submitted", "Thank you for the feedback.", "success", "feedback"); }
    function openThemeManager57() { win("Theme Manager", `<h2>Theme Manager</h2><p>Choose a theme or open the System Customizer for CSS-level changes.</p><div class="emerald57-toolbar">${button("Classic", "setTheme?.('classic')")}${button("Dark", "setTheme?.('dark')")}${button("System Customizer", "openSystemCustomizer57()")}</div>`, "themes57"); }
    function openDesktopLayout57() { win("Desktop Layout", `<h2>Desktop Layout 3.0</h2>${button("Lock Desktop", "localStorage.setItem('57_desktop_locked','true');desktopClean57()")}${button("Unlock Desktop", "localStorage.removeItem('57_desktop_locked');desktopClean57()")}${button("Clean Desktop", "desktopClean57()")}${button("Reset Desktop", "desktopReset57()")}`, "desktop57"); }
    function openTaskbarSettings57() { win("Taskbar Settings", `<h2>Taskbar 2.0</h2><p>Taskbar includes active app handling, notification bell, quick settings, and window restoration behavior.</p>${button("Notifications", "openNotificationCenter57()")}${button("Quick Settings", "openQuickSettings57()")}${button("Window Manager", "openWindowManager57()")}`, "taskbar57"); }
    function openStartMenuSettings57() { win("Start Menu", `<h2>Start Menu 4.0</h2><p>Use search, pinned folders, recent apps, and sectioned app lists.</p>${button("Open Search", "openGlobalSearch57()")}${button("Command Palette", "openCommandPalette57()")}`, "start57"); }
    function desktopClean57() { rerender(); addNotice("Desktop cleaned", "Desktop folders were refreshed and aligned.", "success", "desktop"); }
    function desktopReset57() { localStorage.removeItem(LS.desktopPrefs); rerender(); addNotice("Desktop reset", "Desktop preferences were reset.", "info", "desktop"); }
    function editionLock(appName, edition) { win("Feature Locked", `<h2>${safe(appName)}</h2><p>This feature requires EmeraldOS ${safe(edition)} edition or higher.</p><p>Current edition: <b>${safe(localStorage.getItem("40_edition") || "virtue")}</b></p>`, "locked57"); }
    function filterTable57(idValue, query) { const q=String(query||"").toLowerCase(); document.querySelectorAll(`#${idValue} tr`).forEach((tr,i)=>{ if(i===0)return; tr.style.display=tr.textContent.toLowerCase().includes(q)?"":"none"; }); }

    /* =====================================================
       APP REGISTRY AND DESKTOP FOLDERS
    ===================================================== */


    function writerTemplate57() {
        const type = (prompt("Template type: letter, memo, policy, report, notes", "letter") || "letter").toLowerCase();
        const templates = {
            letter: `<h1>Business Letter</h1><p>Date: ${safe(new Date().toLocaleDateString())}</p><p>To:</p><p>Subject:</p><p>Dear Recipient,</p><p>Write your message here.</p><p>Sincerely,<br>${safe(currentUser())}</p>`,
            memo: `<h1>Memorandum</h1><p><b>To:</b></p><p><b>From:</b> ${safe(currentUser())}</p><p><b>Date:</b> ${safe(new Date().toLocaleDateString())}</p><p><b>Subject:</b></p><hr><p>Summary:</p><p>Details:</p><p>Next Steps:</p>`,
            policy: `<h1>Policy Document</h1><p><b>Policy Name:</b></p><p><b>Owner:</b> ${safe(currentUser())}</p><p><b>Effective Date:</b></p><h2>Purpose</h2><p></p><h2>Scope</h2><p></p><h2>Policy</h2><p></p><h2>Review</h2><p></p>`,
            report: `<h1>Report</h1><p><b>Prepared by:</b> ${safe(currentUser())}</p><p><b>Date:</b> ${safe(new Date().toLocaleDateString())}</p><h2>Overview</h2><p></p><h2>Findings</h2><p></p><h2>Recommendations</h2><p></p>`,
            notes: `<h1>Meeting Notes</h1><p><b>Date:</b> ${safe(new Date().toLocaleDateString())}</p><p><b>Attendees:</b></p><h2>Agenda</h2><ul><li></li></ul><h2>Notes</h2><p></p><h2>Action Items</h2><ul><li></li></ul>`
        };
        const ed = document.getElementById("writer57Editor");
        if (ed) { ed.innerHTML = templates[type] || templates.letter; updateWriterStats57(); addNotice("Template inserted", `${type} template loaded.`, "success", "office"); }
    }

    function exportWriterTXT57() {
        const textValue = document.getElementById("writer57Editor")?.innerText || "";
        const blob = new Blob([textValue], { type: "text/plain" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "document.txt";
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 500);
    }

    function printWriter57() {
        const content = document.getElementById("writer57Editor")?.innerHTML || "";
        const w = window.open("", "_blank", "width=900,height=700");
        if (!w) return alert("Popup blocked. Allow popups to print.");
        w.document.write(`<!DOCTYPE html><html><head><title>Emerald Writer Print</title><style>body{font-family:Times New Roman,serif;margin:0.75in;line-height:1.35}</style></head><body>${content}</body></html>`);
        w.document.close();
        w.focus();
        w.print();
    }

    function openOfficeTemplates57() {
        win("Office Templates", `<h2>Office Templates</h2><div class="emerald57-gridcards"><div class="emerald57-card"><h3>Letter</h3><p>Professional letter format.</p>${button("Use", "openWriter57(); setTimeout(()=>writerTemplate57(),150)")}</div><div class="emerald57-card"><h3>Memo</h3><p>Internal memo format.</p>${button("Use", "openWriter57(); setTimeout(()=>{const _p=window.prompt; window.prompt=()=>\"memo\"; writerTemplate57(); window.prompt=_p;},150)")}</div><div class="emerald57-card"><h3>Policy</h3><p>Policy and procedure format.</p>${button("Use", "openWriter57(); setTimeout(()=>{const _p=window.prompt; window.prompt=()=>\"policy\"; writerTemplate57(); window.prompt=_p;},150)")}</div><div class="emerald57-card"><h3>Report</h3><p>Report with findings and recommendations.</p>${button("Use", "openWriter57(); setTimeout(()=>{const _p=window.prompt; window.prompt=()=>\"report\"; writerTemplate57(); window.prompt=_p;},150)")}</div></div>`, "officeTemplates57");
    }

    async function openDocumentVault57() {
        try {
            const files = await loadDrive();
            const officeFiles = (files || []).filter(f => /\.(edoc|txt|html|md)$/i.test(f.name || ""));
            const rows = officeFiles.map(f => `<tr><td><b>${safe(f.name)}</b><br><span class="emerald57-note">${safe(f.id || "")}</span></td><td>${formatBytes(byteSize(f.content || ""))}</td><td>${button("Open", `openFile57('${safe(f.id)}')`)}${button("Details", `fileDetails57('${safe(f.id)}')`)}</td></tr>`).join("") || `<tr><td colspan="3">No Office documents found in Files.</td></tr>`;
            win("Document Vault", `<h2>Document Vault</h2><div class="emerald57-toolbar">${button("New Writer Document", "openWriter57()")}${button("Refresh", "openDocumentVault57()")}</div><table class="emerald57-table"><tr><th>Document</th><th>Size</th><th>Actions</th></tr>${rows}</table>`, "documentVault57");
        } catch (err) { alert("Document Vault failed: " + err.message); }
    }

    const MAIL_DRAFT_KEY = "57_mail_draft";
    function mailUser(value) { return uid(String(value || "").replace(/@emeraldos\.mail$/i, "").replace(/@emerald\.mail$/i, "").trim()); }
    function mailAddress57(user = currentUser()) { return `${mailUser(user)}@emeraldos.mail`; }
    function mailHTML(value) { return safe(value).replace(/\n/g, "<br>"); }

    async function loadMail57() {
        const snap = await getDocs(collection(db, COL.mail));
        return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
    }

    async function openEmeraldMail57() {
        win("Emerald Mail", `<h2>Emerald Mail</h2><p>Your internal EmeraldOS address is <b>${safe(mailAddress57())}</b>.</p><div class="emerald57-toolbar">${button("Compose", "openMailCompose57()")}${button("Inbox", "renderMailInbox57()")}${button("Sent", "renderMailSent57()")}${button("Users", "openMailUserDirectory57()")}${button("Refresh", "renderMailInbox57()")}</div><div id="mail57Body" class="emerald57-inset">Loading mail...</div>`, "mail57");
        setTimeout(renderMailInbox57, 80);
    }

    async function renderMailInbox57() {
        const box = document.getElementById("mail57Body"); if (!box) return;
        box.innerHTML = "Loading inbox...";
        try {
            const me = mailUser(currentUser());
            const mail = (await loadMail57()).filter(m => mailUser(m.toUser || m.to) === me && !(m.deletedFor || []).includes(me));
            const rows = mail.map(m => {
                const unread = !(m.readBy || []).includes(me);
                return `<tr class="${unread ? "emerald57-unread" : ""}"><td><b>${safe(m.subject || "(No subject)")}</b><br><span class="emerald57-note">From ${safe(m.from || m.fromUser || "Unknown")} · ${dateTime(m.createdAt)}</span></td><td>${safe((m.body || "").slice(0, 120))}</td><td>${button("Open", `openMailMessage57('${safe(m.id)}')`)}${button("Reply", `replyMail57('${safe(m.id)}')`)}${button("Delete", `deleteMail57('${safe(m.id)}')`)}</td></tr>`;
            }).join("") || `<tr><td colspan="3">No mail yet.</td></tr>`;
            box.innerHTML = `<h3>Inbox</h3><table class="emerald57-table"><tr><th>Message</th><th>Preview</th><th>Actions</th></tr>${rows}</table>`;
            refreshBell();
        } catch (err) { box.innerHTML = `<div class="emerald57-danger">Mail failed to load: ${safe(err.message)}</div>`; }
    }

    async function renderMailSent57() {
        const box = document.getElementById("mail57Body"); if (!box) return;
        box.innerHTML = "Loading sent mail...";
        try {
            const me = mailUser(currentUser());
            const mail = (await loadMail57()).filter(m => mailUser(m.fromUser || m.from) === me && !(m.deletedFor || []).includes(me));
            const rows = mail.map(m => `<tr><td><b>${safe(m.subject || "(No subject)")}</b><br><span class="emerald57-note">To ${safe(m.to || m.toUser || "Unknown")} · ${dateTime(m.createdAt)}</span></td><td>${safe((m.body || "").slice(0, 120))}</td><td>${button("Open", `openMailMessage57('${safe(m.id)}')`)}${button("Delete", `deleteMail57('${safe(m.id)}')`)}</td></tr>`).join("") || `<tr><td colspan="3">No sent mail.</td></tr>`;
            box.innerHTML = `<h3>Sent</h3><table class="emerald57-table"><tr><th>Message</th><th>Preview</th><th>Actions</th></tr>${rows}</table>`;
        } catch (err) { box.innerHTML = `<div class="emerald57-danger">Sent mail failed: ${safe(err.message)}</div>`; }
    }

    function openMailCompose57(to = "", subject = "", body = "") {
        const draft = getJSON(MAIL_DRAFT_KEY, { to, subject, body });
        win("Compose Emerald Mail", `<h2>Compose Emerald Mail</h2><label>To EmeraldOS user or address</label><input id="mail57To" value="${safe(to || draft.to || "")}" placeholder="username or username@emeraldos.mail"><label>Subject</label><input id="mail57Subject" value="${safe(subject || draft.subject || "")}"><label>Message</label><textarea id="mail57Message" style="height:220px">${safe(body || draft.body || "")}</textarea><div class="emerald57-toolbar">${button("Send", "sendMail57()")}${button("Save Draft", "saveMailDraft57()")}${button("User Directory", "openMailUserDirectory57()")}</div>`, "composeMail57");
    }

    function saveMailDraft57() {
        setJSON(MAIL_DRAFT_KEY, { to: document.getElementById("mail57To")?.value || "", subject: document.getElementById("mail57Subject")?.value || "", body: document.getElementById("mail57Message")?.value || "" });
        addNotice("Mail draft saved", "Emerald Mail draft was saved locally.", "success", "mail");
    }

    async function sendMail57() {
        const toRaw = document.getElementById("mail57To")?.value || "";
        const toUser = mailUser(toRaw);
        const subject = document.getElementById("mail57Subject")?.value || "(No subject)";
        const body = document.getElementById("mail57Message")?.value || "";
        if (!toUser) return alert("Enter an EmeraldOS username or Emerald Mail address.");
        const me = mailUser(currentUser());
        const blocked = getJSON(LS.blocked, []).map(mailUser);
        if (blocked.includes(toUser) && !confirm("This user is in your blocked list. Send anyway?")) return;
        try {
            await addDoc(collection(db, COL.mail), { type: "emerald-mail", from: currentUser(), fromUser: me, fromAddress: mailAddress57(), to: toRaw, toUser, toAddress: `${toUser}@emeraldos.mail`, subject, body, readBy: [me], deletedFor: [], createdAt: now(), updatedAt: now() });
            localStorage.removeItem(MAIL_DRAFT_KEY);
            addNotice("Mail sent", `Message sent to ${toUser}@emeraldos.mail.`, "success", "mail", "openEmeraldMail57()");
            openEmeraldMail57();
        } catch (err) { alert("Send failed: " + err.message); }
    }

    async function openMailMessage57(mailId) {
        try {
            const ref = doc(db, COL.mail, mailId);
            const snap = await getDoc(ref);
            if (!snap.exists()) return alert("Mail not found.");
            const m = { id: snap.id, ...snap.data() };
            const me = mailUser(currentUser());
            const readBy = Array.from(new Set([...(m.readBy || []), me]));
            if (mailUser(m.toUser || m.to) === me) await updateDoc(ref, { readBy, updatedAt: now() });
            win("Emerald Mail Message", `<h2>${safe(m.subject || "(No subject)")}</h2><div class="emerald57-inset"><b>From:</b> ${safe(m.fromAddress || m.from || "Unknown")}<br><b>To:</b> ${safe(m.toAddress || m.to || "Unknown")}<br><b>Date:</b> ${dateTime(m.createdAt)}</div><div class="emerald57-card" style="white-space:normal;user-select:text">${mailHTML(m.body || "")}</div><div class="emerald57-toolbar">${button("Reply", `replyMail57('${safe(mailId)}')`)}${button("Delete", `deleteMail57('${safe(mailId)}')`)}${button("Inbox", "openEmeraldMail57()")}</div>`, "mailMessage57");
            refreshBell();
        } catch (err) { alert("Open mail failed: " + err.message); }
    }

    async function replyMail57(mailId) {
        try {
            const snap = await getDoc(doc(db, COL.mail, mailId));
            if (!snap.exists()) return alert("Mail not found.");
            const m = snap.data();
            openMailCompose57(m.fromUser || m.from || "", `Re: ${m.subject || ""}`, `\n\n--- Original Message ---\n${m.body || ""}`);
        } catch (err) { alert("Reply failed: " + err.message); }
    }

    async function deleteMail57(mailId) {
        if (!confirm("Move this mail out of your mailbox?")) return;
        try {
            const ref = doc(db, COL.mail, mailId);
            const snap = await getDoc(ref);
            if (!snap.exists()) return;
            const m = snap.data();
            const me = mailUser(currentUser());
            const deletedFor = Array.from(new Set([...(m.deletedFor || []), me]));
            await updateDoc(ref, { deletedFor, updatedAt: now() });
            addNotice("Mail deleted", "Message was removed from your mailbox.", "success", "mail");
            openEmeraldMail57();
        } catch (err) { alert("Delete failed: " + err.message); }
    }

    async function openMailUserDirectory57() {
        try {
            const snap = await getDocs(collection(db, COL.users));
            const rows = snap.docs.map(d => {
                const data = d.data() || {};
                const name = data.username || d.id;
                const normalized = mailUser(name);
                return `<tr><td><b>${safe(name)}</b><br><span class="emerald57-note">${safe(normalized)}@emeraldos.mail</span></td><td>${button("Compose", `openMailCompose57('${safe(normalized)}@emeraldos.mail')`)}</td></tr>`;
            }).join("") || `<tr><td colspan="2">No EmeraldOS users found.</td></tr>`;
            win("Emerald Mail Users", `<h2>Emerald Mail User Directory</h2><table class="emerald57-table"><tr><th>User</th><th>Action</th></tr>${rows}</table>`, "mailUsers57");
        } catch (err) { alert("User directory failed: " + err.message); }
    }

    async function checkMailNotifications57() {
        try {
            const me = mailUser(currentUser());
            const unread = (await loadMail57()).filter(m => mailUser(m.toUser || m.to) === me && !(m.readBy || []).includes(me) && !(m.deletedFor || []).includes(me)).length;
            const key = "57_mail_last_unread_count";
            if (unread > 0 && localStorage.getItem(key) !== String(unread)) addNotice("Emerald Mail", `${unread} unread mail message(s).`, "info", "mail", "openEmeraldMail57()");
            localStorage.setItem(key, String(unread));
        } catch {}
    }

    const ASSISTANT_CONFIG = "57_assistant_config";
    const ASSISTANT_HISTORY = "57_assistant_history";
    function openAssistantSettings57() {
        const cfg = getJSON(ASSISTANT_CONFIG, { mode: "offline", endpoint: "", model: "gpt-4.1-mini" });
        win("Assistant Settings", `<h2>Emerald Assistant Settings</h2><label>Mode</label><select id="as57Mode"><option ${cfg.mode === "offline" ? "selected" : ""}>offline</option><option ${cfg.mode === "api" ? "selected" : ""}>api</option></select><label>Cloudflare Worker assistant endpoint</label><input id="as57Endpoint" value="${safe(cfg.endpoint || "")}" placeholder="https://your-worker.workers.dev/assistant"><label>Model label</label><input id="as57Model" value="${safe(cfg.model || "gpt-4.1-mini")}"><div class="emerald57-warn">Do not put an OpenAI API key in EmeraldOS. Use your Cloudflare Worker endpoint only.</div><div class="emerald57-toolbar">${button("Save", "saveAssistantSettings57()")}${button("Test Connection", "testAssistantConnection57()")}${button("Open Assistant", "openEmeraldAssistant57()")}</div>`, "assistantSettings57");
    }
    function saveAssistantSettings57() { setJSON(ASSISTANT_CONFIG, { mode: document.getElementById("as57Mode")?.value || "offline", endpoint: document.getElementById("as57Endpoint")?.value || "", model: document.getElementById("as57Model")?.value || "gpt-4.1-mini" }); addNotice("Assistant settings saved", "Emerald Assistant configuration was updated.", "success", "assistant"); }
    async function testAssistantConnection57() { saveAssistantSettings57(); const cfg = getJSON(ASSISTANT_CONFIG, {}); if (cfg.mode !== "api" || !cfg.endpoint) return alert("Set mode to api and enter your Worker endpoint first."); try { const res = await fetch(cfg.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "Reply with: Emerald Assistant connected.", username: currentUser(), edition: localStorage.getItem("40_edition") || "virtue", app: "EmeraldOS 5.7" }) }); const data = await res.json(); alert(data.output || data.message || data.text || JSON.stringify(data)); } catch (err) { alert("Connection failed: " + err.message); } }
    function openEmeraldAssistant57() {
        const history = getJSON(ASSISTANT_HISTORY, []);
        const rows = history.slice(-8).map(h => `<div class="emerald57-msg"><b>${safe(h.role)}:</b> ${mailHTML(h.text)}</div>`).join("");
        win("Emerald Assistant", `<h2>Emerald Assistant</h2><div class="emerald57-inset">Ask about the current app, coding, Office documents, Files, Appstore, or EmeraldOS settings.</div><div id="assistant57History">${rows}</div><textarea id="assistant57Input" placeholder="Ask Emerald Assistant..." style="height:100px"></textarea><div class="emerald57-toolbar">${button("Ask", "askAssistant57()")}${button("Settings", "openAssistantSettings57()")}${button("Clear History", "clearAssistantHistory57()")}</div>`, "assistant57");
    }
    async function askAssistant57() {
        const input = document.getElementById("assistant57Input");
        const message = input?.value || ""; if (!message.trim()) return;
        const cfg = getJSON(ASSISTANT_CONFIG, { mode: "offline" });
        const history = getJSON(ASSISTANT_HISTORY, []);
        history.push({ role: "You", text: message, time: now() });
        let answer = "Offline tip: Use Emerald Search or the Command Palette to find apps, settings, files, and help articles. For coding help, open Custom App API Docs and Code Snippets.";
        if (cfg.mode === "api" && cfg.endpoint) {
            try {
                const res = await fetch(cfg.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, username: currentUser(), edition: localStorage.getItem("40_edition") || "virtue", app: "EmeraldOS 5.7" }) });
                const data = await res.json();
                answer = data.output || data.message || data.text || data.response || JSON.stringify(data);
            } catch (err) { answer = "Assistant connection failed: " + err.message; }
        }
        history.push({ role: "Emerald Assistant", text: answer, time: now() });
        setJSON(ASSISTANT_HISTORY, history.slice(-30));
        openEmeraldAssistant57();
    }
    function clearAssistantHistory57() { setJSON(ASSISTANT_HISTORY, []); openEmeraldAssistant57(); }
    function openAssistantSidebar57() {
        document.getElementById("assistant57Sidebar")?.remove();
        const side = document.createElement("div");
        side.id = "assistant57Sidebar";
        side.style.cssText = "position:fixed;right:0;top:0;width:360px;height:100vh;background:#c0c0c0;border-left:2px solid #404040;z-index:999997;padding:8px;box-sizing:border-box;overflow:auto";
        side.innerHTML = `<div class="emerald57-modal-title">Emerald Assistant <button style="float:right" onclick="document.getElementById('assistant57Sidebar').remove()">X</button></div><div class="emerald57-modal-body"><p>Assistant sidebar is active.</p>${button("Open Assistant Window", "openEmeraldAssistant57()")}${button("Settings", "openAssistantSettings57()")}</div>`;
        document.body.appendChild(side);
    }

    const APPS = {
        homeDashboard57: { name: "Home Dashboard", icon: "HOME", edition: "economy", category: "experience", launch: openHomeDashboard57 },
        welcome57: { name: "Welcome Setup", icon: "WELCOME", edition: "economy", category: "experience", launch: openWelcome57 },
        experienceCenter57: { name: "Experience Center", icon: "HELP", edition: "economy", category: "experience", launch: openExperienceCenter57 },
        globalSearch57: { name: "Emerald Search", icon: "SEARCH", edition: "economy", category: "experience", launch: openGlobalSearch57 },
        commandPalette57: { name: "Command Palette", icon: "CMD", edition: "economy", category: "experience", launch: openCommandPalette57 },
        quickSettings57: { name: "Quick Settings", icon: "QUICK", edition: "economy", category: "system", launch: openQuickSettings57 },
        notifications57: { name: "Notification Center", icon: "BELL", edition: "economy", category: "system", launch: openNotificationCenter57 },
        settings57: { name: "Settings", icon: "SET", edition: "economy", category: "system", launch: openSettings57 },
        accessibility57: { name: "Accessibility", icon: "A11Y", edition: "economy", category: "system", launch: openAccessibility57 },
        emeraldAssistant57: { name: "Emerald Assistant", icon: "ASST", edition: "economy", category: "experience", launch: openEmeraldAssistant57 },
        assistantSettings57: { name: "Assistant Settings", icon: "AISET", edition: "economy", category: "system", launch: openAssistantSettings57 },
        assistantSidebar57: { name: "Assistant Sidebar", icon: "SIDE", edition: "economy", category: "experience", launch: openAssistantSidebar57 },
        files57: { name: "Files", icon: "FILES", edition: "economy", category: "files", launch: openFiles57 },
        storage57: { name: "Storage Center", icon: "STORE", edition: "economy", category: "files", launch: openStorage57 },
        sharedWithMe57: { name: "Shared With Me", icon: "IN", edition: "home", category: "files", launch: openSharedWithMe57 },
        sharedByMe57: { name: "Shared By Me", icon: "OUT", edition: "home", category: "files", launch: openSharedByMe57 },
        office57: { name: "Emerald Office", icon: "OFFICE", edition: "economy", category: "office", launch: openOffice57 },
        writer57: { name: "Emerald Writer", icon: "WRITE", edition: "economy", category: "office", launch: openWriter57 },
        sheets57: { name: "Emerald Sheets", icon: "SHEET", edition: "business", category: "office", launch: openSheets57 },
        slides57: { name: "Emerald Slides", icon: "SLIDE", edition: "business", category: "office", launch: openSlides57 },
        forms57: { name: "Emerald Forms", icon: "FORM", edition: "business", category: "office", launch: openForms57 },
        officeTemplates57: { name: "Office Templates", icon: "TPL", edition: "economy", category: "office", launch: openOfficeTemplates57 },
        documentVault57: { name: "Document Vault", icon: "VAULT", edition: "economy", category: "office", launch: openDocumentVault57 },
        chat57: { name: "Emerald Chat", icon: "CHAT", edition: "home", category: "communication", launch: openChat57 },
        mail57: { name: "Emerald Mail", icon: "MAIL", edition: "home", category: "communication", launch: openEmeraldMail57 },
        contacts57: { name: "Contacts", icon: "CONT", edition: "home", category: "people", launch: openContacts57 },
        profile57: { name: "User Profile", icon: "PROF", edition: "home", category: "people", launch: openProfile57 },
        blocking57: { name: "Blocking Center", icon: "BLOCK", edition: "home", category: "security", launch: openBlocking57 },
        security57: { name: "Security & Privacy", icon: "SEC", edition: "economy", category: "security", launch: openSecurityCenter57 },
        applicationEditor57: { name: "Application Editor", icon: "APPEDIT", edition: "virtue", category: "custom", launch: openApplicationEditor57 },
        appLibrary57: { name: "Emerald App Library", icon: "LIB", edition: "virtue", category: "custom", launch: openAppLibrary57 },
        userAppstore57: { name: "User Appstore", icon: "STORE", edition: "virtue", category: "custom", launch: openUserAppstore57 },
        appPermissions57: { name: "App Permissions", icon: "PERM", edition: "virtue", category: "custom", launch: openAppPermissions57 },
        eappInstaller57: { name: ".eapp Installer", icon: "EAPP", edition: "virtue", category: "custom", launch: openEappInstaller57 },
        codeStudio57: { name: "Code Studio", icon: "CODE", edition: "virtue", category: "coding", launch: openCodeStudio57 },
        apiDocs57: { name: "Custom App API Docs", icon: "API", edition: "virtue", category: "coding", launch: openAPIDocs57 },
        snippets57: { name: "Code Snippets", icon: "SNIP", edition: "virtue", category: "coding", launch: openCodeSnippets57 },
        systemCustomizer57: { name: "System Customizer", icon: "CSS", edition: "virtue", category: "coding", launch: openSystemCustomizer57 },
        registryStudio57: { name: "Registry Studio", icon: "REG", edition: "virtue", category: "coding", launch: openRegistryStudio57 },
        startupEditor57: { name: "Startup Script Center", icon: "START", edition: "virtue", category: "coding", launch: openStartupEditor57 },
        themeManager57: { name: "Theme Manager", icon: "THEME", edition: "economy", category: "system", launch: openThemeManager57 },
        desktopLayout57: { name: "Desktop Layout", icon: "DESK", edition: "economy", category: "system", launch: openDesktopLayout57 },
        taskbarSettings57: { name: "Taskbar Settings", icon: "TASK", edition: "economy", category: "system", launch: openTaskbarSettings57 },
        startMenuSettings57: { name: "Start Menu", icon: "START", edition: "economy", category: "system", launch: openStartMenuSettings57 },
        windowManager57: { name: "Window Manager", icon: "WIN", edition: "economy", category: "system", launch: openWindowManager57 },
        activityCenter57: { name: "Activity Center", icon: "ACT", edition: "economy", category: "experience", launch: openActivityCenter57 },
        helpSystem57: { name: "Help System", icon: "HELP", edition: "economy", category: "experience", launch: openHelpSystem57 },
        feedback57: { name: "Feedback", icon: "FDBK", edition: "economy", category: "experience", launch: openFeedback57 },
        recovery57: { name: "Recovery Center", icon: "REPAIR", edition: "economy", category: "system", launch: openRecoveryCenter57 },
        moderationCenter57: { name: "Moderation Center", icon: "MOD", edition: "developer", category: "moderation", launch: openModerationCenter57 },
        appstoreModeration57: { name: "Appstore Moderation", icon: "MODAPP", edition: "developer", category: "moderation", launch: openAppstoreModeration57 },
        adminPanel57: { name: "Administrative Panel", icon: "ADMIN", edition: "executive", category: "admin", launch: openAdminPanel57 },
        userAdmin57: { name: "User Administration", icon: "USERS", edition: "executive", category: "admin", launch: openUserAdmin57 }
    };

    const FOLDERS = {
        essential: { name: "Essential Apps", edition: "economy", apps: ["homeDashboard57", "files57", "office57", "settings57", "helpSystem57"] },
        experience: { name: "Experience Center", edition: "economy", apps: ["welcome57", "experienceCenter57", "globalSearch57", "commandPalette57", "emeraldAssistant57", "assistantSidebar57", "activityCenter57", "feedback57"] },
        files: { name: "Files & Storage", edition: "economy", apps: ["files57", "storage57", "sharedWithMe57", "sharedByMe57"] },
        office: { name: "Office Apps", edition: "economy", apps: ["office57", "writer57", "sheets57", "slides57", "forms57", "officeTemplates57", "documentVault57"] },
        communication: { name: "Communication", edition: "home", apps: ["chat57", "mail57", "contacts57", "profile57"] },
        security: { name: "Security & Privacy", edition: "economy", apps: ["security57", "blocking57"] },
        system: { name: "System Tools", edition: "economy", apps: ["settings57", "quickSettings57", "notifications57", "assistantSettings57", "accessibility57", "themeManager57", "desktopLayout57", "taskbarSettings57", "startMenuSettings57", "windowManager57", "recovery57"] },
        custom: { name: "User Applications", edition: "virtue", apps: ["applicationEditor57", "appLibrary57", "userAppstore57", "appPermissions57", "eappInstaller57"] },
        coding: { name: "Coding & Customization", edition: "virtue", apps: ["codeStudio57", "apiDocs57", "snippets57", "systemCustomizer57", "registryStudio57", "startupEditor57"] },
        moderation: { name: "Moderation Tools", edition: "developer", apps: ["moderationCenter57", "appstoreModeration57"] },
        admin: { name: "Administrative Tools", edition: "executive", apps: ["adminPanel57", "userAdmin57"] }
    };

    function registerApp(idValue, app) { if (!window.APPS) window.APPS = {}; window.APPS[idValue] = Object.assign({ icon: "APP", edition: "economy", category: "general" }, app); }
    function installApps() { Object.entries(APPS).forEach(([key, app]) => registerApp(key, app)); registerUserApps57(); }
    function registerUserApps57() {
        if (!window.APPS) window.APPS = {};
        Object.keys(window.APPS).filter(key => key.startsWith("userapp57_")).forEach(key => delete window.APPS[key]);
        if (localStorage.getItem("57_safe_mode") === "true") return;
        appList().forEach(app => registerApp("userapp57_" + app.id, { name: app.name, icon: app.icon || "APP", edition: "virtue", category: "custom", launch: () => runUserApp57(app.id) }));
    }

    function appVisible(idValue) { const app = window.APPS?.[idValue]; if (!app) return false; if (localStorage.getItem("57_safe_mode") === "true" && (idValue.startsWith("userapp57_") || app.category === "custom")) return false; return canSee(app.edition || "economy"); }
    function folderVisible(folder) { return canSee(folder.edition || "economy") && (folder.apps || []).some(appVisible); }
    function folderData() {
        const folders = JSON.parse(JSON.stringify(FOLDERS));
        const userIds = appList().map(a => "userapp57_" + a.id);
        folders.custom.apps = Array.from(new Set([...(folders.custom.apps || []), ...userIds]));
        if (localStorage.getItem(LS.simpleMode) === "true") {
            return { essential: folders.essential, files: folders.files, office: folders.office, communication: folders.communication, system: folders.system };
        }
        return folders;
    }

    function openFolder57(folderId) {
        const f = folderData()[folderId]; if (!f) return;
        const cards = (f.apps || []).filter(appVisible).map(appId => { const app = window.APPS[appId]; return `<div class="emerald57-card emerald57-app-card" onclick="launchApp('${safe(appId)}')"><h3>${safe(app.icon || "APP")} ${safe(app.name)}</h3><p>Edition: ${safe(app.edition || "economy")}<br>Category: ${safe(app.category || "general")}</p></div>`; }).join("") || `<div class="emerald57-inset">No applications available.</div>`;
        win(f.name, `<h2>${safe(f.name)}</h2><input placeholder="Search folder" oninput="filterCards57(this.value)"><div class="emerald57-gridcards folder57Cards">${cards}</div>`, "folder57");
    }

    function filterCards57(query) { const q = String(query || "").toLowerCase(); document.querySelectorAll(".folder57Cards .emerald57-card").forEach(c => c.style.display = c.textContent.toLowerCase().includes(q) ? "" : "none"); }

    function renderDesktop57() {
        registerUserApps57();
        const desktop = document.getElementById("desktop"); if (!desktop) return;
        desktop.innerHTML = "";
        Object.entries(folderData()).forEach(([fid, folder]) => {
            if (!folderVisible(folder)) return;
            const icon = document.createElement("div");
            icon.className = "emerald57-folder-icon desktop-folder-icon";
            icon.tabIndex = -1;
            icon.innerHTML = `<div class="emerald57-folder-symbol">${safe(folder.name.split(" ")[0].slice(0, 6).toUpperCase())}</div><div class="emerald57-folder-label">${safe(folder.name)}</div>`;
            icon.ondblclick = () => openFolder57(fid);
            icon.onclick = () => setTimeout(() => icon.blur(), 0);
            desktop.appendChild(icon);
        });
    }

    function renderStartMenu57() {
        const results = document.getElementById("start-results"); if (!results) return;
        const search = document.getElementById("start-search"); const q = String(search?.value || "").toLowerCase();
        const folderItems = Object.entries(folderData()).filter(([, f]) => folderVisible(f) && (!q || f.name.toLowerCase().includes(q))).map(([fid, f]) => `<div class="start-item" onclick="openFolder57('${safe(fid)}')">${safe(f.name)}</div>`).join("");
        const appItems = Object.entries(window.APPS || {}).filter(([id, app]) => appVisible(id) && (!q || String(app.name).toLowerCase().includes(q))).slice(0, 200).map(([id, app]) => `<div class="start-item" onclick="launchApp('${safe(id)}')">${safe(app.name)}</div>`).join("");
        results.innerHTML = folderItems + (q ? appItems : "");
        if (search && !search.dataset.emerald57) { search.dataset.emerald57 = "true"; search.addEventListener("input", renderStartMenu57); }
    }

    function rerender() { setTimeout(() => { registerUserApps57(); window.EMERALDOS_APP_CATEGORIES = folderData(); renderDesktop57(); renderStartMenu57(); }, 60); }

    function installCommands() {
        const original = window.runTerminalCommand;
        window.runTerminalCommand = function(raw) {
            const cmd = String(raw || "").trim().toLowerCase();
            const map = {
                "version": () => "EmeraldOS 5.7 - User Experience & Reliability Update",
                "build": () => "EmeraldOS 5.7 - User Experience & Reliability Update",
                "search": () => { openGlobalSearch57(); return "Opening Emerald Search."; },
                "palette": () => { openCommandPalette57(); return "Opening Command Palette."; },
                "settings": () => { openSettings57(); return "Opening Settings."; },
                "files": () => { openFiles57(); return "Opening Files."; },
                "office": () => { openOffice57(); return "Opening Emerald Office."; },
                "chat": () => { openChat57(); return "Opening Emerald Chat."; },
                "mail": () => { openEmeraldMail57(); return "Opening Emerald Mail."; },
                "emeraldmail": () => { openEmeraldMail57(); return "Opening Emerald Mail."; },
                "inbox": () => { openEmeraldMail57(); return "Opening Emerald Mail inbox."; },
                "assistant": () => { openEmeraldAssistant57(); return "Opening Emerald Assistant."; },
                "assistant.settings": () => { openAssistantSettings57(); return "Opening Assistant Settings."; },
                "app.editor": () => { openApplicationEditor57(); return "Opening Application Editor."; },
                "appstore": () => { openUserAppstore57(); return "Opening User Appstore."; },
                "code": () => { openCodeStudio57(); return "Opening Code Studio."; },
                "customizer": () => { openSystemCustomizer57(); return "Opening System Customizer."; },
                "recovery": () => { openRecoveryCenter57(); return "Opening Recovery Center."; },
                "windows.reset": () => { resetWindows57(); return "Windows reset."; },
                "windows.closeall": () => { closeAllWindows57(); return "Closing windows."; },
                "desktop.clean": () => { desktopClean57(); return "Desktop cleaned."; },
                "desktop.reset": () => { desktopReset57(); return "Desktop reset."; }
            };
            if (map[cmd]) return map[cmd]();
            return typeof original === "function" ? original(raw) : `Unknown command: ${raw}`;
        };
    }

    function installKeyboard() {
        document.addEventListener("keydown", e => {
            if (e.ctrlKey && e.code === "Space") { e.preventDefault(); openGlobalSearch57(); }
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "p") { e.preventDefault(); openCommandPalette57(); }
            if (e.altKey && e.key === "Tab") { e.preventDefault(); cycleWindow57(); }
            if (e.key === "Escape") { document.getElementById("command57Overlay")?.remove(); }
        });
    }

    function cycleWindow57() {
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
        if (badge) badge.innerHTML = `<span class="emerald57-build-badge">${BUILD.displayName}</span>`;
        try { window.EmeraldOSRegistry?.set?.("HKEY_LOCAL_MACHINE\\System\\Build\\Version", BUILD.version); } catch {}
    }

    function installStyles() {
        if (document.getElementById("emerald57-styles")) return;
        const style = document.createElement("style");
        style.id = "emerald57-styles";
        style.textContent = `
        .emerald57-panel{font-family:"MS Sans Serif",Tahoma,Arial,sans-serif;font-size:12px;color:#000;line-height:1.35}.emerald57-panel input,.emerald57-panel textarea,.emerald57-panel select{box-sizing:border-box;width:100%;margin:3px 0 8px 0;background:#fff;color:#000;border:2px inset #fff;padding:4px;font:inherit;user-select:text}.emerald57-panel textarea{min-height:110px;resize:vertical}.emerald57-toolbar{display:flex;flex-wrap:wrap;gap:4px;margin:8px 0}.emerald57-toolbar.right{justify-content:flex-end}.emerald57-btn{margin:2px}.emerald57-table{width:100%;border-collapse:collapse;background:#fff}.emerald57-table th,.emerald57-table td{border:1px solid #808080;padding:5px;text-align:left;vertical-align:top}.emerald57-note{color:#404040;font-size:11px}.emerald57-warn{background:#fff7d6;border:1px solid #8a6d00;padding:8px;margin:8px 0}.emerald57-danger{background:#ffd9d9;border:2px solid #800000;padding:10px;margin:8px 0;font-weight:bold;text-align:center}.emerald57-gridcards{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:8px}.emerald57-grid2{display:grid;grid-template-columns:320px 1fr;gap:8px}.emerald57-card{background:#c0c0c0;border:2px solid;border-color:#fff #808080 #808080 #fff;padding:8px;min-height:90px}.emerald57-card h3{margin:0 0 6px 0}.emerald57-app-card{cursor:pointer}.emerald57-app-card:hover{outline:1px dotted #000}.emerald57-codearea{height:300px;font-family:Consolas,"Courier New",monospace}.emerald57-code-preview{white-space:pre-wrap;background:#fff;border:2px inset #fff;padding:8px;max-height:320px;overflow:auto}.emerald57-app-frame{width:100%;height:100%;min-height:360px;border:0;background:#fff}.emerald57-folder-icon{width:84px;min-height:84px;text-align:center;color:#fff;padding:6px;margin:6px;cursor:pointer;outline:none}.emerald57-folder-icon:focus{outline:none}.emerald57-folder-symbol{width:45px;height:32px;margin:0 auto 5px auto;background:#d8d8d8;border:2px solid;border-color:#fff #404040 #404040 #fff;color:#000;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold}.emerald57-folder-label{text-shadow:1px 1px 0 #000;word-break:break-word}.emerald57-bell{height:28px;margin-left:4px;background:#c0c0c0;border:2px solid;border-color:#fff #808080 #808080 #fff;font-family:inherit}.emerald57-bell-hot{background:#fff0a0;animation:emerald57Pulse 1.5s infinite}@keyframes emerald57Pulse{0%,100%{filter:none}50%{filter:brightness(1.2)}}.emerald57-unread td{background:#fffbe0;font-weight:bold}.emerald57-modal-screen{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:999999}.emerald57-modal{width:min(570px,92vw);background:#c0c0c0;border:2px solid;border-color:#fff #404040 #404040 #fff;box-shadow:4px 4px 0 #000}.emerald57-modal-title{background:#000080;color:#fff;font-weight:bold;padding:5px 8px}.emerald57-modal-body{padding:15px}.emerald57-pill{display:inline-block;background:#fff;border:1px solid #808080;padding:2px 5px;margin:2px}.emerald57-meter{height:14px;background:#fff;border:2px inset #fff;margin:6px 0}.emerald57-meter div{height:100%;background:#008000}.emerald57-writer{background:#fff;border:2px inset #fff;min-height:360px;padding:30px;margin:8px auto;max-width:760px;user-select:text}.emerald57-status{background:#c0c0c0;border-top:1px solid #808080;padding:4px}.emerald57-result{background:#fff;border:1px solid #808080;margin:4px 0;padding:6px;cursor:pointer}.emerald57-result span{display:block;color:#404040;font-size:11px}.emerald57-command-overlay{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:999998;display:flex;align-items:flex-start;justify-content:center;padding-top:80px}.emerald57-command-box{width:min(700px,90vw);background:#c0c0c0;border:2px solid;border-color:#fff #404040 #404040 #fff;box-shadow:4px 4px 0 #000;padding:8px}.emerald57-check{display:block;margin:6px 0}.emerald57-large-text{font-size:15px}.emerald57-xlarge-text{font-size:18px}.emerald57-high-contrast #desktop{background:#000!important}.emerald57-reduced-motion *{animation:none!important;transition:none!important}.emerald57-hide-focus *:focus{outline:none!important}.emerald57-build-badge{padding:2px 6px;background:#c0c0c0;border:1px solid #808080}.emerald57-inset{background:#fff;border:2px inset #fff;padding:8px}.emerald57-msg{background:#fff;border:1px solid #808080;margin:4px 0;padding:5px}@media(max-width:800px){.emerald57-grid2{grid-template-columns:1fr}.emerald57-folder-icon{width:76px}}
        `;
        document.head.appendChild(style);
    }

    function expose() {
        Object.assign(window, {
            markAllRead57, clearNotifications57, openNotificationCenter57, openNotificationSettings57, saveNotificationSettings57,
            resetWindows57, closeAllWindows57, openWindowManager57, focusWindow57, cascadeWindows57, tileWindows57,
            openApplicationEditor57, saveUserApp57, insertTemplate57, previewUserApp57, runUserApp57, deleteUserApp57, openAppVersionHistory57, restoreAppVersion57,
            openAppLibrary57, openAppPermissions57, saveAppPermissions57, exportEapp57, openEappInstaller57, installEapp57,
            openUserAppstore57, showAppstoreRisk57, installStoreApp57, viewStoreCode57, openPublishApp57, publishSelectedApp57, reportStoreApp57,
            openAPIDocs57, openCodeSnippets57, openCodeStudio57, runCodeStudio57, saveCodeStudioAsApp57, openSystemCustomizer57, saveCustomCSS57, resetCustomCSS57, openRegistryStudio57, saveRegistry57, resetRegistry57, openStartupEditor57, saveStartupScript57, runStartupScript57, deleteStartupScript57,
            openWelcome57, finishSetup57, setSimpleMode57, openExperienceCenter57, openGlobalSearch57, renderSearch57, openCommandPalette57, openQuickSettings57, saveQuickSettings57, openSettings57, openAccessibility57, saveAccessibility57,
            openFiles57, openFile57, fileDetails57, trashFile57, shareFilePrompt57, openSharedByMe57, openSharedWithMe57, revokeShare57, openStorage57,
            openOffice57, openWriter57, updateWriterStats57, writerInsertDate57, writerInsertTable57, writerTemplate57, printWriter57, saveWriterDraft57, saveWriterToFiles57, exportWriterHTML57, exportWriterTXT57, newWriterDoc57, openOfficeTemplates57, openDocumentVault57, openSheets57, exportSheetCSV57, sheetAutoTotal57, openSlides57, presentSlides57, openForms57, previewForm57,
            openEmeraldMail57, renderMailInbox57, renderMailSent57, openMailCompose57, saveMailDraft57, sendMail57, openMailMessage57, replyMail57, deleteMail57, openMailUserDirectory57, checkMailNotifications57,
            openEmeraldAssistant57, openAssistantSettings57, saveAssistantSettings57, testAssistantConnection57, askAssistant57, clearAssistantHistory57, openAssistantSidebar57,
            openChat57, openChatRoom57, sendChat57, reportChat57, openContacts57, addContact57, removeContact57, openBlocking57, blockUser57, unblockUser57, openMessageRequests57, openProfile57, saveProfile57,
            openAdminPanel57, openUserAdmin57, adminNote57, adminViewUserFiles57, openModerationCenter57, openAppstoreModeration57, openSecurityCenter57, openHelpSystem57, openRecoveryCenter57, enableSafeMode57, disableSafeMode57, clearRecovery57, openActivityCenter57, openHomeDashboard57, openFeedback57, submitFeedback57, openThemeManager57, openDesktopLayout57, openTaskbarSettings57, openStartMenuSettings57, desktopClean57, desktopReset57, filterTable57, openFolder57, filterCards57, renderDesktop57, renderStartMenu57
        });
    }

    function init() {
        installStyles();
        injectCustomCSS57();
        applyAccessibility57();
        expose();
        installWindowFixes();
        installBell();
        installApps();
        installCommands();
        installKeyboard();
        setBuild();
        window.EMERALDOS_APP_CATEGORIES = folderData();
        window.renderDesktop = renderDesktop57;
        window.renderStartMenu = renderStartMenu57;
        renderDesktop57();
        renderStartMenu57();
        addNotice("EmeraldOS 5.7 loaded", "Assistant, creator platform, Office, Emerald Mail, Virtue user applications, and the User Appstore are active.", "success", "system");
        checkMailNotifications57();
        if (localStorage.getItem(LS.setupDone) !== "true") setTimeout(openWelcome57, 600);
    }

    if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", () => setTimeout(init, 800));
    else setTimeout(init, 800);
})();
