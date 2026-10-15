"use strict";

/* =========================================================
   EMERALDOS 5.5
   COMMUNICATION, PROFILES, FILES, OFFICE AND EXPERIENCE
========================================================= */

import { db } from "./firebase.js";
import {
    collection,
    collectionGroup,
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
    createFile as cloudCreateFile,
    saveFile as cloudSaveFile,
    deleteFile as cloudDeleteFile,
    loadDrive,
    getFileContent
} from "./cloudstorage.js";

(function () {
    if (window.EmeraldOS55Loaded) return;
    window.EmeraldOS55Loaded = true;

    const BUILD = {
        product: "EmeraldOS",
        version: "5.5",
        displayName: "EmeraldOS 5.5",
        codename: "Intelligence, Security & Management Update",
        fileLimit: 1024 * 1024
    };

    const LS = {
        recentDocs: "55_recent_documents",
        officeAutosave: "55_writer_autosave",
        contacts: "55_contacts_cache",
        notifications: "55_notifications",
        assistantEnabled: "55_assistant_enabled",
        assistantEndpoint: "55_assistant_endpoint",
        assistantKey: "55_assistant_api_key",
        desktopLocked: "55_desktop_locked"
    };

    const COL = {
        users: "emeraldOSUsers",
        profiles: "emeraldOSProfiles",
        contacts: "contacts",
        shares: "emeraldOSShares",
        rooms: "emeraldOSChatRooms",
        reports: "emeraldOSChatReports",
        mutes: "emeraldOSChatMutes",
        warnings: "emeraldOSWarnings",
        logs: "emeraldOSModerationLogs"
    };

    let activeRoom55 = "global";
    let activeRoomLabel55 = "Global Lobby";
    let chatUnsub55 = null;

    function currentUser() {
        return String(
            localStorage.getItem("40_username") ||
            localStorage.getItem("40_session") ||
            localStorage.getItem("username") ||
            localStorage.getItem("TestOSusername") ||
            "Guest"
        ).trim() || "Guest";
    }

    function roleText() {
        return String(
            localStorage.getItem("40_developer_role") ||
            localStorage.getItem("role") ||
            ""
        ).toLowerCase();
    }

    function isModerator() {
        if (localStorage.getItem("40_executive_verified") === "true") return true;
        const dev = localStorage.getItem("40_developer_verified") === "true";
        const role = roleText();
        return dev && (role === "admin" || role === "mod");
    }

    function isExecutive() {
        return localStorage.getItem("40_executive_verified") === "true" || roleText() === "admin";
    }

    function canSee(required = "economy") {
        if (required === "developer") return isModerator();
        if (required === "executive") return isExecutive();
        return typeof window.canSeeEdition === "function" ? window.canSeeEdition(required) : true;
    }

    function safe(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function uid(value = "") {
        return String(value || "")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9_-]+/g, "_")
            .slice(0, 90) || "user";
    }

    function now() {
        return Date.now();
    }

    function dateTime(ts) {
        if (!ts) return "";
        try { return new Date(ts).toLocaleString(); }
        catch { return String(ts); }
    }

    function formatBytes(bytes = 0) {
        const n = Number(bytes || 0);
        if (n < 1024) return `${n} B`;
        if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
        return `${(n / (1024 * 1024)).toFixed(2)} MB`;
    }

    function byteSize(value = "") {
        try { return new Blob([String(value || "")]).size; }
        catch { return String(value || "").length; }
    }

    function notify(title, message = "", type = "info") {
        window.notify?.(title, message, 3600, type);
        pushNotification(title, message, type);
    }

    function pushNotification(title, message = "", type = "info") {
        try {
            const list = JSON.parse(localStorage.getItem(LS.notifications) || "[]");
            list.unshift({ title, message, type, time: now(), read: false });
            localStorage.setItem(LS.notifications, JSON.stringify(list.slice(0, 80)));
        } catch {}
    }

    function readNotifications() {
        try { return JSON.parse(localStorage.getItem(LS.notifications) || "[]"); }
        catch { return []; }
    }

    function setHTML(id, html) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    }

    function win(title, html, app = "emerald55") {
        const body = `<div class="emerald55-panel">${html}</div>`;
        return window.openWindow?.(title, body, app) || null;
    }

    function smallButton(label, action, className = "") {
        return `<button class="win95-small-button ${className}" onclick="${action}">${safe(label)}</button>`;
    }

    async function loadFiles() {
        try {
            const files = await loadDrive() || {};
            if (window.fileSystem) window.fileSystem.files = files;
            return files;
        } catch (err) {
            console.warn("Drive load failed:", err);
            return window.fileSystem?.files || {};
        }
    }

    function fileSize(file = {}) {
        if (typeof file.storageSize === "number") return file.storageSize;
        if (typeof file.size === "number") return file.size;
        if (file.content) return byteSize(file.content);
        return 0;
    }

    function fileKind(name = "", type = "") {
        const lower = String(name).toLowerCase();
        const t = String(type).toLowerCase();
        if (/\.(edoc|doc|docx|txt|md|html)$/i.test(lower) || t.includes("text")) return "Document";
        if (/\.(esheet|csv|xls|xlsx)$/i.test(lower)) return "Spreadsheet";
        if (/\.(eslide|ppt|pptx)$/i.test(lower)) return "Presentation";
        if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(lower) || t.startsWith("image")) return "Image";
        if (/\.(mp3|wav|ogg|m4a)$/i.test(lower) || t.startsWith("audio")) return "Audio";
        if (/\.(mp4|webm|mov)$/i.test(lower) || t.startsWith("video")) return "Video";
        return "File";
    }

    function fileIconText(file = {}) {
        const k = fileKind(file.name, file.type || file.mimeType);
        if (k === "Document") return "DOC";
        if (k === "Spreadsheet") return "SHEET";
        if (k === "Presentation") return "SLIDE";
        if (k === "Image") return "IMG";
        if (k === "Audio") return "AUD";
        if (k === "Video") return "VID";
        return "FILE";
    }

    async function listUsers() {
        try {
            const snap = await getDocs(collection(db, COL.users));
            const rows = [];
            snap.forEach(d => {
                const data = d.data() || {};
                rows.push({
                    id: d.id,
                    username: data.username || d.id,
                    displayName: data.displayName || data.name || data.username || d.id,
                    createdAt: data.createdAt || data.created || 0,
                    lastLogin: data.lastLogin || 0,
                    role: data.role || "user"
                });
            });
            return rows.sort((a, b) => String(a.username).localeCompare(String(b.username)));
        } catch (err) {
            console.warn("User directory failed:", err);
            return [];
        }
    }

    async function getProfile(username = currentUser()) {
        const name = String(username || currentUser()).trim();
        try {
            const p = await getDoc(doc(db, COL.profiles, name));
            if (p.exists()) return { id: p.id, ...p.data() };
            const u = await getDoc(doc(db, COL.users, name));
            return u.exists() ? { id: u.id, ...(u.data() || {}) } : { id: name, username: name };
        } catch {
            return { id: name, username: name };
        }
    }

    async function saveProfile(data) {
        const username = currentUser();
        await setDoc(doc(db, COL.profiles, username), {
            username,
            displayName: data.displayName || username,
            status: data.status || "Available",
            bio: data.bio || "",
            initials: data.initials || username.slice(0, 2).toUpperCase(),
            updatedAt: now()
        }, { merge: true });
        await setDoc(doc(db, COL.users, username), {
            username,
            displayName: data.displayName || username,
            lastProfileUpdate: now()
        }, { merge: true });
    }

    async function ensureChatRoom(roomId, label, type = "public", members = []) {
        await setDoc(doc(db, COL.rooms, roomId), {
            roomId,
            label,
            type,
            members,
            updatedAt: now(),
            createdAt: now()
        }, { merge: true });
    }

    function roomMessages(roomId) {
        return collection(db, COL.rooms, roomId, "messages");
    }

    function dmRoom(a, b) {
        return "dm_" + [uid(a), uid(b)].sort().join("__");
    }

    function installStyles() {
        if (document.getElementById("emerald55-style")) return;
        const style = document.createElement("style");
        style.id = "emerald55-style";
        style.textContent = `
            #desktop .icon:focus,
            #desktop .icon:focus-visible,
            #desktop .desktop-folder-icon:focus,
            #desktop .desktop-folder-icon:focus-visible,
            .desktop-icon:focus,
            .desktop-icon:focus-visible,
            .t4-desktop-icon:focus,
            .t4-desktop-icon:focus-visible{
                outline:none !important;
                box-shadow:none !important;
            }
            #desktop .icon,
            #desktop .desktop-folder-icon,
            .desktop-icon,
            .t4-desktop-icon{
                -webkit-tap-highlight-color:transparent;
            }
            #desktop .icon.opened,
            #desktop .desktop-folder-icon.opened,
            #desktop .icon:active,
            #desktop .desktop-folder-icon:active{
                background:transparent !important;
                color:#fff !important;
                outline:none !important;
            }
            .window[data-maximized="true"]{
                left:0 !important;
                top:0 !important;
                width:100vw !important;
                height:calc(100vh - 40px) !important;
                resize:none !important;
            }
            .window[data-maximized="true"] .resize-handle{
                display:none !important;
            }
            .emerald55-panel{height:100%;box-sizing:border-box;overflow:auto;font-family:"MS Sans Serif",Tahoma,Arial,sans-serif;font-size:12px;color:#000;}
            .emerald55-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(185px,1fr));gap:8px;margin:8px 0;}
            .emerald55-card{background:#c0c0c0;border:2px solid;border-color:#fff #808080 #808080 #fff;padding:8px;min-height:70px;box-sizing:border-box;}
            .emerald55-card h3,.emerald55-card h4{margin:0 0 6px 0;font-size:13px;}
            .emerald55-inset{background:#fff;border:2px inset #fff;padding:8px;box-sizing:border-box;margin:6px 0;overflow:auto;}
            .emerald55-toolbar{display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin:6px 0;}
            .emerald55-toolbar input,.emerald55-toolbar select{height:24px;}
            .emerald55-table{width:100%;border-collapse:collapse;background:#fff;}
            .emerald55-table th,.emerald55-table td{border:1px solid #808080;padding:4px;text-align:left;vertical-align:top;}
            .emerald55-table th{background:#000080;color:#fff;}
            .emerald55-editor{background:#fff;border:2px inset #fff;min-height:240px;padding:18px;outline:none;line-height:1.35;user-select:text;}
            .emerald55-editor:focus{outline:1px dotted #000;}
            .emerald55-split{display:grid;grid-template-columns:220px 1fr;gap:8px;height:100%;min-height:360px;}
            .emerald55-list{background:#fff;border:2px inset #fff;overflow:auto;padding:4px;}
            .emerald55-list-row{padding:5px;border-bottom:1px solid #c0c0c0;cursor:pointer;}
            .emerald55-list-row:hover{background:#000080;color:#fff;}
            .emerald55-chat-log{height:260px;background:#fff;border:2px inset #fff;overflow:auto;padding:6px;}
            .emerald55-message{border-bottom:1px solid #ddd;padding:5px 2px;}
            .emerald55-message.deleted{opacity:.55;font-style:italic;}
            .emerald55-badge{display:inline-block;background:#000080;color:#fff;padding:2px 5px;margin:1px;border:1px solid #fff;}
            .emerald55-warning{background:#fff4c4;border:2px inset #fff;padding:8px;margin:6px 0;}
            .emerald55-danger{background:#ffd8d8;border:2px inset #fff;padding:8px;margin:6px 0;}
            .emerald55-success{background:#dfffe0;border:2px inset #fff;padding:8px;margin:6px 0;}
            .emerald55-note{font-size:11px;color:#333;}
            .emerald55-folder-icon{width:82px;min-height:76px;text-align:center;color:white;cursor:pointer;padding:4px;box-sizing:border-box;}
            .emerald55-folder-icon:focus{outline:none;}
            .emerald55-folder-symbol{height:36px;display:flex;align-items:center;justify-content:center;color:#000;background:#c0c000;border:2px solid;border-color:#ffff80 #808000 #808000 #ffff80;font-weight:bold;font-size:11px;margin:0 auto 4px;}
            .emerald55-folder-label{text-shadow:1px 1px #000;font-size:12px;line-height:1.1;}
            .emerald55-status-dot{display:inline-block;width:8px;height:8px;background:#008000;border:1px solid #000;margin-right:4px;}
            .emerald55-slide{background:#fff;border:2px inset #fff;min-height:220px;padding:18px;}
            .emerald55-form-row{margin:5px 0;}
            .emerald55-app-tile{cursor:pointer;}
            .emerald55-app-tile:hover{background:#dcdcdc;}
        `;
        document.head.appendChild(style);
    }

    function patchWindowManager() {
        const patchWindow = win => {
            if (!win || win.dataset.emerald55Patched === "true") return win;
            win.dataset.emerald55Patched = "true";

            const titleBar = win.querySelector(".title-bar");
            const maxBtn = win.querySelector(".max-btn");
            const minBtn = win.querySelector(".min-btn");
            const resize = win.querySelector(".resize-handle");

            if (win.taskbarButton) {
                win.taskbarButton.onclick = ev => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    win.style.display = "";
                    win.dataset.minimized = "false";
                    win.style.zIndex = String(10000 + Date.now() % 100000);
                    win.focus?.();
                };
            }

            if (titleBar) {
                titleBar.addEventListener("mousedown", ev => {
                    if (win.dataset.maximized === "true" && !ev.target.closest("button")) {
                        ev.stopImmediatePropagation();
                        ev.preventDefault();
                    }
                }, true);
            }

            if (resize) {
                resize.addEventListener("mousedown", ev => {
                    if (win.dataset.maximized === "true") {
                        ev.stopImmediatePropagation();
                        ev.preventDefault();
                    }
                }, true);
            }

            if (maxBtn) {
                maxBtn.addEventListener("click", () => {
                    setTimeout(() => {
                        if (win.dataset.maximized === "true") win.classList.add("maximized");
                        else win.classList.remove("maximized");
                        win.style.display = "";
                        win.dataset.minimized = "false";
                    }, 0);
                }, true);
            }

            if (minBtn) {
                minBtn.addEventListener("click", () => {
                    win.dataset.minimized = "true";
                }, true);
            }

            win.addEventListener("mousedown", () => {
                if (win.dataset.minimized === "true") {
                    win.dataset.minimized = "false";
                    win.style.display = "";
                }
            }, true);

            return win;
        };

        document.querySelectorAll(".window").forEach(patchWindow);

        if (window.openWindow && !window.openWindow.__emerald55Patched) {
            const original = window.openWindow;
            const wrapped = function (title, html, app = "") {
                const win = original.call(window, title, html, app);
                setTimeout(() => patchWindow(win), 0);
                return win;
            };
            wrapped.__emerald55Patched = true;
            window.openWindow = wrapped;
        }

        document.addEventListener("click", ev => {
            const icon = ev.target.closest("#desktop .icon,#desktop .desktop-folder-icon,.desktop-icon,.t4-desktop-icon,.emerald55-folder-icon");
            if (icon) {
                icon.classList.remove("selected", "active", "opened");
                setTimeout(() => icon.blur?.(), 0);
            }
        }, true);
    }

    /* =====================================================
       DESKTOP FOLDERS AND APP REGISTRATION
    ===================================================== */

    const FOLDERS = {
        essentials: { name: "Essentials", edition: "economy", apps: ["files", "system", "settings55", "notifications55", "helpCenter"] },
        office: { name: "Office & Documents", edition: "economy", apps: ["emeraldOffice55", "writer55", "sheets55", "slides55", "forms55", "templates55", "documentVault55"] },
        files: { name: "Files & Sharing", edition: "home", apps: ["files55", "storage55", "sharing55", "sharedWithMe55", "sharedByMe55", "trash55"] },
        communication: { name: "Communication", edition: "home", apps: ["chat55", "rooms55", "directMessages55", "communicationCenter55", "notifications55"] },
        people: { name: "People", edition: "home", apps: ["users55", "profile55", "contacts55", "friends55"] },
        productivity: { name: "Productivity", edition: "business", apps: ["tasks55", "calendar", "planner55", "notes", "reports55"] },
        system: { name: "System & Settings", edition: "economy", apps: ["settings55", "security55", "privacy55", "assistant55", "desktopTools55", "appManager55"] },
        moderation: { name: "Moderation", edition: "developer", apps: ["moderatorConsole55", "reportsReview55", "modLog55", "communicationAudit55"] },
        admin: { name: "Administration", edition: "executive", apps: ["adminPanel55", "adminUsers55", "adminStorage55", "adminSharing55", "securityAudit55"] }
    };

    function visibleApp(id) {
        const app = window.APPS?.[id];
        if (!app) return false;
        if (app.hiddenStandalone && !app.forceVisible55) return false;
        return canSee(app.edition || "economy");
    }

    function visibleFolder(folder) {
        if (!canSee(folder.edition || "economy")) return false;
        return folder.apps.some(visibleApp);
    }

    function registerApp(id, app) {
        if (!window.APPS) window.APPS = {};
        window.APPS[id] = Object.assign({ icon: "APP", edition: "economy", category: "general" }, app);
    }

    function installApps() {
        registerApp("emeraldOffice55", { name: "Emerald Office", icon: "OFFICE", edition: "economy", category: "office", launch: () => openEmeraldOffice55() });
        registerApp("writer55", { name: "Emerald Writer", icon: "WRITE", edition: "economy", category: "office", launch: () => openWriter55() });
        registerApp("sheets55", { name: "Emerald Sheets", icon: "SHEET", edition: "home", category: "office", launch: () => openSheets55() });
        registerApp("slides55", { name: "Emerald Slides", icon: "SLIDE", edition: "home", category: "office", launch: () => openSlides55() });
        registerApp("forms55", { name: "Emerald Forms", icon: "FORM", edition: "business", category: "office", launch: () => openForms55() });
        registerApp("templates55", { name: "Templates", icon: "TPL", edition: "economy", category: "office", launch: () => openTemplates55() });
        registerApp("documentVault55", { name: "Document Vault", icon: "VAULT", edition: "economy", category: "office", launch: () => openDocumentVault55() });

        registerApp("files55", { name: "Files", icon: "FILES", edition: "economy", category: "files", launch: () => openFiles55() });
        registerApp("storage55", { name: "Storage Center", icon: "STORE", edition: "economy", category: "files", launch: () => openStorage55() });
        registerApp("sharing55", { name: "File Sharing", icon: "SHARE", edition: "home", category: "files", launch: () => openFileSharing55() });
        registerApp("sharedWithMe55", { name: "Shared With Me", icon: "IN", edition: "home", category: "files", launch: () => openSharedWithMe55() });
        registerApp("sharedByMe55", { name: "Shared by Me", icon: "OUT", edition: "home", category: "files", launch: () => openSharedByMe55() });
        registerApp("trash55", { name: "Trash", icon: "TRASH", edition: "home", category: "files", launch: () => openTrash55() });

        registerApp("chat55", { name: "Emerald Chat", icon: "CHAT", edition: "home", category: "communication", launch: () => openEmeraldChat55() });
        registerApp("rooms55", { name: "Chat Rooms", icon: "ROOM", edition: "home", category: "communication", launch: () => openChatRooms55() });
        registerApp("directMessages55", { name: "Direct Messages", icon: "DM", edition: "home", category: "communication", launch: () => openDirectMessages55() });
        registerApp("communicationCenter55", { name: "Communication Center", icon: "COMMS", edition: "home", category: "communication", launch: () => openCommunicationCenter55() });

        registerApp("users55", { name: "EmeraldOS Users", icon: "USERS", edition: "home", category: "people", launch: () => openUsers55() });
        registerApp("profile55", { name: "My Profile", icon: "ME", edition: "home", category: "people", launch: () => openMyProfile55() });
        registerApp("contacts55", { name: "Contacts", icon: "CNT", edition: "home", category: "people", launch: () => openContacts55() });
        registerApp("friends55", { name: "Friends", icon: "FRND", edition: "home", category: "people", launch: () => openFriends55() });

        registerApp("settings55", { name: "Settings", icon: "SET", edition: "economy", category: "system", launch: () => openSettings55() });
        registerApp("notifications55", { name: "Notification Center", icon: "NOTIF", edition: "economy", category: "system", launch: () => openNotificationCenter55() });
        registerApp("security55", { name: "Security & Privacy", icon: "SEC", edition: "economy", category: "system", launch: () => openSecurityPrivacy55() });
        registerApp("privacy55", { name: "Privacy Center", icon: "PRIV", edition: "home", category: "system", launch: () => openPrivacy55() });
        registerApp("assistant55", { name: "Emerald Assistant", icon: "HELP", edition: "home", category: "system", launch: () => openAssistant55() });
        registerApp("desktopTools55", { name: "Desktop Tools", icon: "DESK", edition: "economy", category: "system", launch: () => openDesktopTools55() });
        registerApp("appManager55", { name: "App Manager", icon: "APPS", edition: "economy", category: "system", launch: () => openAppManager55() });

        registerApp("tasks55", { name: "Task Board", icon: "TASK", edition: "business", category: "productivity", launch: () => openTasks55() });
        registerApp("planner55", { name: "Planner", icon: "PLAN", edition: "business", category: "productivity", launch: () => openPlanner55() });
        registerApp("reports55", { name: "Reports", icon: "RPT", edition: "business", category: "productivity", launch: () => openReports55() });

        registerApp("moderatorConsole55", { name: "Moderator Console", icon: "MOD", edition: "developer", category: "moderation", launch: () => openModeratorConsole55() });
        registerApp("reportsReview55", { name: "Reports Review", icon: "RPT", edition: "developer", category: "moderation", launch: () => openReportsReview55() });
        registerApp("modLog55", { name: "Moderation Log", icon: "LOG", edition: "developer", category: "moderation", launch: () => openModerationLog55() });
        registerApp("communicationAudit55", { name: "Communication Audit", icon: "AUDIT", edition: "developer", category: "moderation", launch: () => openCommunicationAudit55() });

        registerApp("adminPanel55", { name: "Administrative Panel", icon: "ADMIN", edition: "executive", category: "admin", launch: () => openAdminPanel55() });
        registerApp("adminUsers55", { name: "User Administration", icon: "USER", edition: "executive", category: "admin", launch: () => openAdminUsers55() });
        registerApp("adminStorage55", { name: "Storage Administration", icon: "STOR", edition: "executive", category: "admin", launch: () => openAdminStorage55() });
        registerApp("adminSharing55", { name: "Sharing Administration", icon: "SHR", edition: "executive", category: "admin", launch: () => openAdminSharing55() });
        registerApp("securityAudit55", { name: "Security Audit", icon: "SEC", edition: "executive", category: "admin", launch: () => openSecurityAudit55() });
    }

    function openFolder55(id) {
        const folder = FOLDERS[id];
        if (!folder) return;
        const rows = folder.apps
            .filter(visibleApp)
            .map(appId => {
                const app = window.APPS[appId];
                return `<div class="emerald55-card emerald55-app-tile" onclick="launchApp('${safe(appId)}')">
                    <h3>${safe(app.icon || "APP")} ${safe(app.name)}</h3>
                    <div class="emerald55-note">Edition: ${safe(app.edition || "economy")}</div>
                </div>`;
            }).join("") || `<div class="emerald55-inset">No available applications in this folder.</div>`;
        win(folder.name, `<h2>${safe(folder.name)}</h2><div class="emerald55-grid">${rows}</div>`, "folder_" + id);
    }

    function renderDesktop55() {
        const desktop = document.getElementById("desktop");
        if (!desktop) return;
        desktop.innerHTML = "";
        Object.entries(FOLDERS).forEach(([id, folder]) => {
            if (!visibleFolder(folder)) return;
            const icon = document.createElement("div");
            icon.className = "emerald55-folder-icon desktop-folder-icon";
            icon.tabIndex = -1;
            icon.innerHTML = `<div class="emerald55-folder-symbol">${safe(folder.name.split(" ")[0].slice(0, 6).toUpperCase())}</div><div class="emerald55-folder-label">${safe(folder.name)}</div>`;
            icon.ondblclick = () => openFolder55(id);
            icon.onclick = () => setTimeout(() => icon.blur(), 0);
            desktop.appendChild(icon);
        });
    }

    function renderStart55() {
        const results = document.getElementById("start-results");
        if (!results) return;
        const search = document.getElementById("start-search");
        const query = String(search?.value || "").toLowerCase();
        const folderItems = Object.entries(FOLDERS)
            .filter(([, folder]) => visibleFolder(folder))
            .filter(([, folder]) => !query || folder.name.toLowerCase().includes(query))
            .map(([id, folder]) => `<div class="start-item" onclick="openFolder55('${safe(id)}')">${safe(folder.name)}</div>`)
            .join("");
        const appItems = Object.entries(window.APPS || {})
            .filter(([id, app]) => visibleApp(id) && (!query || String(app.name).toLowerCase().includes(query)))
            .slice(0, 80)
            .map(([id, app]) => `<div class="start-item" onclick="launchApp('${safe(id)}')">${safe(app.name)}</div>`)
            .join("");
        results.innerHTML = folderItems + (query ? appItems : "");
        if (search && !search.dataset.emerald55Search) {
            search.dataset.emerald55Search = "true";
            search.addEventListener("input", renderStart55);
        }
    }

    /* =====================================================
       FILES, STORAGE AND SHARING
    ===================================================== */

    async function openFiles55() {
        const files = await loadFiles();
        const rows = Object.entries(files).map(([id, f]) => `
            <tr>
                <td><b>${safe(fileIconText(f))}</b></td>
                <td>${safe(f.name || id)}<br><span class="emerald55-note">ID: ${safe(id)}</span></td>
                <td>${safe(fileKind(f.name, f.type || f.mimeType))}</td>
                <td>${formatBytes(fileSize(f))}</td>
                <td>${dateTime(f.updatedAt || f.createdAt)}</td>
                <td>
                    ${smallButton("Open", `openFileFromFiles55('${safe(id)}')`)}
                    ${smallButton("Share", `shareFilePrompt55('${safe(id)}')`)}
                    ${smallButton("Details", `fileDetails55('${safe(id)}')`)}
                    ${smallButton("Rename", `renameFile55('${safe(id)}')`)}
                    ${smallButton("Delete", `deleteFileFromFiles55('${safe(id)}')`)}
                </td>
            </tr>`).join("");
        win("Files", `
            <h2>Files</h2>
            <div class="emerald55-toolbar">
                ${smallButton("New Document", "newOfficeDocument55()")}
                ${smallButton("New Text File", "newTextFile55()")}
                ${smallButton("Storage Center", "openStorage55()")}
                ${smallButton("File Sharing", "openFileSharing55()")}
                ${smallButton("Refresh", "openFiles55()")}
            </div>
            <div class="emerald55-warning">Files now includes storage, sharing, file details, and shared-file controls in one place.</div>
            <table class="emerald55-table"><thead><tr><th>Type</th><th>Name</th><th>Kind</th><th>Size</th><th>Updated</th><th>Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="6">No files yet.</td></tr>`}</tbody></table>
        `, "files55");
    }

    async function openFileFromFiles55(id) {
        const files = await loadFiles();
        const file = files[id];
        if (!file) return notify("Files", "File not found.", "warning");
        const content = await getFileContent(id, file);
        const kind = fileKind(file.name, file.type || file.mimeType);
        if (kind === "Document") {
            openWriter55(id, file, content);
            return;
        }
        if (kind === "Spreadsheet") {
            openSheets55(id, file, content);
            return;
        }
        if (kind === "Presentation") {
            openSlides55(id, file, content);
            return;
        }
        win(file.name || "File", `<h2>${safe(file.name || id)}</h2><textarea class="emerald55-inset" style="width:100%;height:260px;">${safe(content)}</textarea>`, "fileViewer55");
    }

    async function fileDetails55(id) {
        const files = await loadFiles();
        const f = files[id];
        if (!f) return;
        const shares = await listSharesByMe();
        const fileShares = shares.filter(s => s.fileId === id && s.status !== "revoked");
        win("File Details", `
            <h2>${safe(f.name || id)}</h2>
            <div class="emerald55-inset">
                <b>File ID:</b> ${safe(id)}<br>
                <b>Type:</b> ${safe(fileKind(f.name, f.type || f.mimeType))}<br>
                <b>Size:</b> ${formatBytes(fileSize(f))}<br>
                <b>Created:</b> ${dateTime(f.createdAt)}<br>
                <b>Updated:</b> ${dateTime(f.updatedAt)}<br>
                <b>Storage Mode:</b> ${safe(f.storageMode || "firestore")}
            </div>
            <h3>Access</h3>
            <div class="emerald55-inset">${fileShares.map(s => `${safe(s.targetUsername)} - ${safe(s.permission)} ${smallButton("Revoke", `revokeShare55('${safe(s.id)}')`)}`).join("<br>") || "Not shared."}</div>
        `, "fileDetails55");
    }

    async function renameFile55(id) {
        const name = prompt("New file name:");
        if (!name) return;
        await cloudSaveFile(id, { name: name.trim() });
        notify("Files", "File renamed.", "success");
        openFiles55();
    }

    async function deleteFileFromFiles55(id) {
        if (!confirm("Move this file to Trash?")) return;
        await cloudSaveFile(id, { trashed: true, trashedAt: now() });
        notify("Files", "File moved to Trash.", "warning");
        openFiles55();
    }

    async function newTextFile55() {
        const name = prompt("File name:", "New Text File.txt") || "New Text File.txt";
        const id = await cloudCreateFile(name, "");
        if (id) await cloudSaveFile(id, { folder: "Documents", app: "Files" });
        notify("Files", "Text file created.", "success");
        openFiles55();
    }

    async function newOfficeDocument55() {
        openWriter55(null, { name: "Untitled.edoc" }, "<h1>Untitled Document</h1><p>Start writing here.</p>");
    }

    async function openStorage55() {
        const files = await loadFiles();
        const list = Object.entries(files).filter(([, f]) => !f.trashed);
        const total = list.reduce((sum, [, f]) => sum + fileSize(f), 0);
        const large = list.filter(([, f]) => fileSize(f) > BUILD.fileLimit);
        const near = total > BUILD.fileLimit * 0.75;
        const rows = list.sort((a, b) => fileSize(b[1]) - fileSize(a[1])).slice(0, 20).map(([id, f]) => `
            <tr><td>${safe(f.name || id)}</td><td>${formatBytes(fileSize(f))}</td><td>${safe(f.storageMode || "firestore")}</td><td>${smallButton("Details", `fileDetails55('${safe(id)}')`)}</td></tr>`).join("");
        win("Storage Center", `
            <h2>Storage Center</h2>
            <div class="emerald55-${near ? "warning" : "success"}">
                <b>Total estimated storage:</b> ${formatBytes(total)}<br>
                <b>File count:</b> ${list.length}<br>
                <b>Large file threshold:</b> ${formatBytes(BUILD.fileLimit)}
            </div>
            ${large.length ? `<div class="emerald55-warning"><b>Large files:</b> ${large.length}. These may require Firebase Storage and CORS configuration.</div>` : ""}
            <div class="emerald55-toolbar">${smallButton("Open Files", "openFiles55()")} ${smallButton("Empty Trash", "emptyTrash55()")} ${smallButton("Download Report", "downloadStorageReport55()")}</div>
            <h3>Largest Files</h3>
            <table class="emerald55-table"><thead><tr><th>Name</th><th>Size</th><th>Storage</th><th>Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="4">No files.</td></tr>`}</tbody></table>
        `, "storage55");
    }

    async function emptyTrash55() {
        const files = await loadFiles();
        const trashed = Object.entries(files).filter(([, f]) => f.trashed);
        if (!trashed.length) return notify("Trash", "Trash is already empty.", "info");
        if (!confirm(`Permanently delete ${trashed.length} trashed files?`)) return;
        for (const [id] of trashed) await cloudDeleteFile(id);
        notify("Trash", "Trash emptied.", "success");
        openStorage55();
    }

    async function downloadStorageReport55() {
        const files = await loadFiles();
        const report = Object.entries(files).map(([id, f]) => ({ id, name: f.name, size: fileSize(f), storageMode: f.storageMode || "firestore", updatedAt: f.updatedAt || 0 }));
        downloadText("emeraldos-storage-report.json", JSON.stringify(report, null, 2));
    }

    async function listSharesByMe() {
        const owner = currentUser();
        try {
            const snap = await getDocs(collection(db, COL.shares));
            const rows = [];
            snap.forEach(d => {
                const data = d.data() || {};
                if (data.owner === owner) rows.push({ id: d.id, ...data });
            });
            return rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        } catch (err) {
            console.warn("Shares by me failed:", err);
            return [];
        }
    }

    async function listSharesForMe() {
        const me = currentUser().toLowerCase();
        try {
            const snap = await getDocs(collection(db, COL.shares));
            const rows = [];
            snap.forEach(d => {
                const data = d.data() || {};
                if (String(data.targetUsername || "").toLowerCase() === me && data.status !== "revoked") rows.push({ id: d.id, ...data });
            });
            return rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        } catch (err) {
            console.warn("Shares for me failed:", err);
            return [];
        }
    }

    async function shareFilePrompt55(fileId) {
        const target = prompt("Share with EmeraldOS username:");
        if (!target) return;
        const permission = prompt("Permission: view or edit", "view") || "view";
        await shareFile55(fileId, target.trim(), permission.trim().toLowerCase() === "edit" ? "edit" : "view");
    }

    async function shareFile55(fileId, targetUsername, permission = "view") {
        const files = await loadFiles();
        const file = files[fileId];
        if (!file) return notify("File Sharing", "File not found.", "warning");
        const share = {
            owner: currentUser(),
            targetUsername,
            fileId,
            fileName: file.name || fileId,
            fileSize: fileSize(file),
            permission,
            status: "active",
            createdAt: now(),
            updatedAt: now()
        };
        await addDoc(collection(db, COL.shares), share);
        await logMod("file.share", `Shared ${share.fileName} with ${targetUsername} (${permission})`);
        notify("File Sharing", `Shared with ${targetUsername}.`, "success");
        pushNotification("File shared", `${share.fileName} shared with ${targetUsername}.`, "success");
    }

    async function revokeShare55(shareId) {
        await updateDoc(doc(db, COL.shares, shareId), { status: "revoked", revokedAt: now(), updatedAt: now() });
        notify("File Sharing", "Share revoked.", "warning");
        openSharedByMe55();
    }

    async function openFileSharing55() {
        const files = await loadFiles();
        const users = await listUsers();
        const rows = Object.entries(files).filter(([, f]) => !f.trashed).map(([id, f]) => `
            <tr>
                <td>${safe(f.name || id)}<br><span class="emerald55-note">ID: ${safe(id)}</span></td>
                <td>${formatBytes(fileSize(f))}</td>
                <td>${smallButton("Share", `shareFilePrompt55('${safe(id)}')`)} ${smallButton("Copy ID", `copyText55('${safe(id)}')`)}</td>
            </tr>`).join("");
        const userRows = users.map(u => `<option value="${safe(u.username)}">${safe(u.username)}</option>`).join("");
        win("File Sharing", `
            <h2>File Sharing</h2>
            <div class="emerald55-warning">Share directly from this app or from Files. File IDs are shown for reference, but normal sharing only needs the Share button.</div>
            <div class="emerald55-toolbar">
                <select id="share_quick_user">${userRows}</select>
                ${smallButton("Open Shared With Me", "openSharedWithMe55()")}
                ${smallButton("Open Shared by Me", "openSharedByMe55()")}
                ${smallButton("Users", "openUsers55()")}
            </div>
            <table class="emerald55-table"><thead><tr><th>Your Files</th><th>Size</th><th>Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="3">No files to share.</td></tr>`}</tbody></table>
        `, "sharing55");
    }

    async function openSharedWithMe55() {
        const rows = await listSharesForMe();
        const html = rows.map(s => `
            <tr>
                <td>${safe(s.fileName || s.fileId)}<br><span class="emerald55-note">Owner: ${safe(s.owner)} | Permission: ${safe(s.permission)}</span></td>
                <td>${formatBytes(s.fileSize || 0)}</td>
                <td>${dateTime(s.createdAt)}</td>
                <td>${smallButton("Open", `openSharedFile55('${safe(s.id)}')`)} ${smallButton("Details", `sharedDetails55('${safe(s.id)}')`)}</td>
            </tr>`).join("");
        win("Shared With Me", `<h2>Shared With Me</h2><table class="emerald55-table"><thead><tr><th>File</th><th>Size</th><th>Shared</th><th>Actions</th></tr></thead><tbody>${html || `<tr><td colspan="4">No files have been shared with you.</td></tr>`}</tbody></table>`, "sharedWithMe55");
    }

    async function openSharedByMe55() {
        const rows = await listSharesByMe();
        const html = rows.map(s => `
            <tr>
                <td>${safe(s.fileName || s.fileId)}<br><span class="emerald55-note">To: ${safe(s.targetUsername)} | Permission: ${safe(s.permission)}</span></td>
                <td>${safe(s.status || "active")}</td>
                <td>${dateTime(s.createdAt)}</td>
                <td>${s.status === "revoked" ? "Revoked" : smallButton("Revoke", `revokeShare55('${safe(s.id)}')`)}</td>
            </tr>`).join("");
        win("Shared by Me", `<h2>Shared by Me</h2><table class="emerald55-table"><thead><tr><th>File</th><th>Status</th><th>Shared</th><th>Actions</th></tr></thead><tbody>${html || `<tr><td colspan="4">You have not shared files.</td></tr>`}</tbody></table>`, "sharedByMe55");
    }

    async function openSharedFile55(shareId) {
        const snap = await getDoc(doc(db, COL.shares, shareId));
        if (!snap.exists()) return notify("Shared File", "Share not found.", "warning");
        const share = { id: snap.id, ...(snap.data() || {}) };
        const fileSnap = await getDoc(doc(db, COL.users, share.owner, "drive", share.fileId));
        if (!fileSnap.exists()) return notify("Shared File", "Original file not found.", "warning");
        const file = { id: fileSnap.id, ...(fileSnap.data() || {}) };
        let content = file.content || "";
        if (file.hasStorageBlob) content = "This shared file uses Firebase Storage. Open it from the owner account if Storage rules do not allow cross-user reads.";
        win(file.name || share.fileName || "Shared File", `
            <h2>${safe(file.name || share.fileName)}</h2>
            <div class="emerald55-inset"><b>Owner:</b> ${safe(share.owner)}<br><b>Permission:</b> ${safe(share.permission)}<br><b>File ID:</b> ${safe(share.fileId)}</div>
            <textarea class="emerald55-inset" style="width:100%;height:260px;">${safe(content)}</textarea>
            ${share.permission === "edit" ? smallButton("Save Edited Copy", `saveSharedEditCopy55('${safe(share.id)}')`) : ""}
        `, "sharedFile55");
    }

    async function sharedDetails55(shareId) {
        const snap = await getDoc(doc(db, COL.shares, shareId));
        if (!snap.exists()) return;
        const s = snap.data() || {};
        win("Share Details", `<h2>${safe(s.fileName || s.fileId)}</h2><div class="emerald55-inset"><b>Owner:</b> ${safe(s.owner)}<br><b>Permission:</b> ${safe(s.permission)}<br><b>Status:</b> ${safe(s.status)}<br><b>Created:</b> ${dateTime(s.createdAt)}<br><b>File ID:</b> ${safe(s.fileId)}</div>`, "shareDetails55");
    }

    async function saveSharedEditCopy55(shareId) {
        const area = document.querySelector(".window:last-child textarea");
        const content = area?.value || "";
        const snap = await getDoc(doc(db, COL.shares, shareId));
        const s = snap.exists() ? snap.data() : {};
        const id = await cloudCreateFile(`Edited Copy - ${s.fileName || "Shared File.txt"}`, content);
        if (id) notify("Shared File", "Edited copy saved to your Files.", "success");
    }

    async function openTrash55() {
        const files = await loadFiles();
        const rows = Object.entries(files).filter(([, f]) => f.trashed).map(([id, f]) => `
            <tr><td>${safe(f.name || id)}</td><td>${dateTime(f.trashedAt)}</td><td>${smallButton("Restore", `restoreFile55('${safe(id)}')`)} ${smallButton("Delete Forever", `deleteForever55('${safe(id)}')`)}</td></tr>`).join("");
        win("Trash", `<h2>Trash</h2><table class="emerald55-table"><thead><tr><th>File</th><th>Moved</th><th>Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="3">Trash is empty.</td></tr>`}</tbody></table>`, "trash55");
    }

    async function restoreFile55(id) {
        await cloudSaveFile(id, { trashed: false, restoredAt: now() });
        notify("Trash", "File restored.", "success");
        openTrash55();
    }

    async function deleteForever55(id) {
        if (!confirm("Permanently delete this file?")) return;
        await cloudDeleteFile(id);
        notify("Trash", "File permanently deleted.", "warning");
        openTrash55();
    }

    /* =====================================================
       OFFICE
    ===================================================== */

    function docTemplate(kind) {
        const signature = localStorage.getItem("40_username") || currentUser();
        if (kind === "letter") return `<h1>Letter</h1><p>Date: ${safe(new Date().toLocaleDateString())}</p><p>Dear Recipient,</p><p>Write your letter here.</p><p>Sincerely,<br>${safe(signature)}</p>`;
        if (kind === "memo") return `<h1>Memorandum</h1><p><b>To:</b> </p><p><b>From:</b> ${safe(signature)}</p><p><b>Date:</b> ${safe(new Date().toLocaleDateString())}</p><p><b>Subject:</b> </p><hr><p>Memo body.</p>`;
        if (kind === "policy") return `<h1>Policy Document</h1><h2>Purpose</h2><p>Describe the purpose.</p><h2>Scope</h2><p>Define who this applies to.</p><h2>Policy</h2><p>Write policy details.</p><h2>Revision History</h2><p>${safe(new Date().toLocaleDateString())} - Initial draft.</p>`;
        return `<h1>Untitled Document</h1><p>Start writing here.</p>`;
    }

    function writerToolbar(fileId = "") {
        const fid = safe(fileId || "");
        return `<div class="emerald55-toolbar">
            ${smallButton("Bold", "writerCmd55('bold')")}
            ${smallButton("Italic", "writerCmd55('italic')")}
            ${smallButton("Underline", "writerCmd55('underline')")}
            ${smallButton("Bullets", "writerCmd55('insertUnorderedList')")}
            ${smallButton("Numbers", "writerCmd55('insertOrderedList')")}
            ${smallButton("Left", "writerCmd55('justifyLeft')")}
            ${smallButton("Center", "writerCmd55('justifyCenter')")}
            ${smallButton("Right", "writerCmd55('justifyRight')")}
            <select onchange="writerBlock55(this.value);this.value=''">
                <option value="">Style</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="p">Paragraph</option>
            </select>
            <select onchange="writerFontSize55(this.value);this.value=''">
                <option value="">Size</option><option value="2">Small</option><option value="3">Normal</option><option value="5">Large</option><option value="7">Title</option>
            </select>
            <input type="color" onchange="writerColor55(this.value)">
            ${smallButton("Table", "writerInsertTable55()")}
            ${smallButton("Image URL", "writerInsertImage55()")}
            ${smallButton("Date", "writerInsertDate55()")}
            ${smallButton("Find", "writerFind55()")}
            ${smallButton("Replace", "writerReplace55()")}
            ${smallButton("Save", `saveWriter55('${fid}')`)}
            ${smallButton("Export TXT", "exportWriterText55()")}
            ${smallButton("Export HTML", "exportWriterHtml55()")}
            ${smallButton("Print", "printWriter55()")}
        </div>`;
    }

    function writerWindowHtml(title, html, fileId = "") {
        return `
            <h2>Emerald Writer</h2>
            <div class="emerald55-toolbar">
                <input id="writer55_title" value="${safe(title || "Untitled.edoc")}" placeholder="Document name" style="min-width:220px;">
                ${smallButton("Templates", "openTemplates55()")}
                ${smallButton("Vault", "openDocumentVault55()")}
                ${smallButton("Properties", "writerProperties55()")}
                <span id="writer55_count" class="emerald55-badge">0 words</span>
            </div>
            ${writerToolbar(fileId)}
            <div id="writer55_editor" class="emerald55-editor" contenteditable="true" oninput="writerAutosave55();writerCount55();">${html || docTemplate()}</div>
        `;
    }

    async function openWriter55(fileId = "", file = null, content = "") {
        if (!file && fileId) {
            const files = await loadFiles();
            file = files[fileId];
            content = await getFileContent(fileId, file);
        }
        if (!content) {
            try {
                const autosave = JSON.parse(localStorage.getItem(LS.officeAutosave) || "null");
                if (autosave?.html) content = autosave.html;
            } catch {}
        }
        const title = file?.name || "Untitled.edoc";
        win("Emerald Writer", writerWindowHtml(title, content || docTemplate(), fileId), "writer55");
        setTimeout(() => writerCount55(), 80);
    }

    function writerCmd55(cmd) { document.execCommand(cmd, false, null); writerCount55(); }
    function writerBlock55(block) { if (block) document.execCommand("formatBlock", false, block); writerCount55(); }
    function writerFontSize55(size) { if (size) document.execCommand("fontSize", false, size); writerCount55(); }
    function writerColor55(color) { if (color) document.execCommand("foreColor", false, color); writerCount55(); }
    function writerEditor() { return document.getElementById("writer55_editor"); }

    function writerInsertDate55() { document.execCommand("insertText", false, new Date().toLocaleDateString()); writerCount55(); }
    function writerInsertTable55() {
        document.execCommand("insertHTML", false, `<table border="1" style="width:100%;border-collapse:collapse"><tr><th>Header</th><th>Header</th></tr><tr><td>Cell</td><td>Cell</td></tr></table><p></p>`);
        writerCount55();
    }
    function writerInsertImage55() {
        const url = prompt("Image URL:");
        if (!url) return;
        document.execCommand("insertHTML", false, `<img src="${safe(url)}" style="max-width:100%;"><p></p>`);
    }
    function writerFind55() {
        const q = prompt("Find text:");
        if (!q) return;
        const text = writerEditor()?.innerText || "";
        alert(text.toLowerCase().includes(q.toLowerCase()) ? "Found." : "Not found.");
    }
    function writerReplace55() {
        const q = prompt("Find:");
        if (!q) return;
        const r = prompt("Replace with:", "") ?? "";
        const ed = writerEditor();
        if (!ed) return;
        ed.innerHTML = ed.innerHTML.split(q).join(safe(r));
        writerCount55();
    }
    function writerCount55() {
        const ed = writerEditor();
        const out = document.getElementById("writer55_count");
        if (!ed || !out) return;
        const text = ed.innerText.trim();
        const words = text ? text.split(/\s+/).length : 0;
        out.textContent = `${words} words, ${text.length} characters`;
    }
    function writerAutosave55() {
        const ed = writerEditor();
        const title = document.getElementById("writer55_title")?.value || "Untitled.edoc";
        if (!ed) return;
        localStorage.setItem(LS.officeAutosave, JSON.stringify({ title, html: ed.innerHTML, savedAt: now() }));
    }
    async function saveWriter55(fileId = "") {
        const ed = writerEditor();
        if (!ed) return;
        const title = document.getElementById("writer55_title")?.value || "Untitled.edoc";
        const content = `<!doctype html><meta charset="utf-8"><title>${safe(title)}</title>${ed.innerHTML}`;
        let id = fileId;
        if (!id) id = await cloudCreateFile(title.endsWith(".edoc") ? title : `${title}.edoc`, content);
        else await cloudSaveFile(id, { name: title, content, type: "text/html", app: "Emerald Writer" });
        await cloudSaveFile(id, { folder: "Documents", parent: "Documents", app: "Emerald Writer", type: "text/html" });
        addRecentDoc(id, title);
        notify("Emerald Writer", "Document saved to Files.", "success");
    }
    function addRecentDoc(id, title) {
        try {
            const list = JSON.parse(localStorage.getItem(LS.recentDocs) || "[]").filter(d => d.id !== id);
            list.unshift({ id, title, time: now() });
            localStorage.setItem(LS.recentDocs, JSON.stringify(list.slice(0, 20)));
        } catch {}
    }
    function exportWriterText55() { downloadText((document.getElementById("writer55_title")?.value || "document") + ".txt", writerEditor()?.innerText || ""); }
    function exportWriterHtml55() { downloadText((document.getElementById("writer55_title")?.value || "document") + ".html", writerEditor()?.innerHTML || ""); }
    function printWriter55() {
        const w = window.open("", "_blank");
        w.document.write(`<!doctype html><title>Print</title>${writerEditor()?.innerHTML || ""}`);
        w.document.close();
        w.print();
    }
    function writerProperties55() {
        const title = document.getElementById("writer55_title")?.value || "Untitled";
        const ed = writerEditor();
        win("Document Properties", `<h2>${safe(title)}</h2><div class="emerald55-inset"><b>Words:</b> ${(ed?.innerText.trim().split(/\s+/).filter(Boolean).length || 0)}<br><b>Characters:</b> ${ed?.innerText.length || 0}<br><b>Estimated size:</b> ${formatBytes(byteSize(ed?.innerHTML || ""))}</div>`, "docProperties55");
    }

    async function openEmeraldOffice55() {
        const recent = JSON.parse(localStorage.getItem(LS.recentDocs) || "[]");
        win("Emerald Office", `
            <h2>Emerald Office</h2>
            <div class="emerald55-grid">
                <div class="emerald55-card emerald55-app-tile" onclick="openWriter55()"><h3>Emerald Writer</h3><p>Documents, templates, page layout, exports, autosave.</p></div>
                <div class="emerald55-card emerald55-app-tile" onclick="openSheets55()"><h3>Emerald Sheets</h3><p>Tables, CSV export, basic formulas.</p></div>
                <div class="emerald55-card emerald55-app-tile" onclick="openSlides55()"><h3>Emerald Slides</h3><p>Multiple slides and HTML presentation export.</p></div>
                <div class="emerald55-card emerald55-app-tile" onclick="openForms55()"><h3>Emerald Forms</h3><p>Build simple forms and save drafts.</p></div>
                <div class="emerald55-card emerald55-app-tile" onclick="openTemplates55()"><h3>Templates</h3><p>Letter, memo, policy, report, meeting notes.</p></div>
                <div class="emerald55-card emerald55-app-tile" onclick="openDocumentVault55()"><h3>Document Vault</h3><p>Open recent and saved Office files.</p></div>
            </div>
            <h3>Recent Documents</h3>
            <div class="emerald55-inset">${recent.map(d => `<div>${safe(d.title)} ${smallButton("Open", `openFileFromFiles55('${safe(d.id)}')`)}</div>`).join("") || "No recent documents yet."}</div>
        `, "emeraldOffice55");
    }

    function openTemplates55() {
        win("Templates", `<h2>Templates</h2><div class="emerald55-grid">
            <div class="emerald55-card" onclick="openWriter55('',{name:'Letter.edoc'},docTemplate('letter'))"><h3>Letter</h3></div>
            <div class="emerald55-card" onclick="openWriter55('',{name:'Memo.edoc'},docTemplate('memo'))"><h3>Memo</h3></div>
            <div class="emerald55-card" onclick="openWriter55('',{name:'Policy.edoc'},docTemplate('policy'))"><h3>Policy</h3></div>
            <div class="emerald55-card" onclick="openWriter55('',{name:'Blank.edoc'},docTemplate())"><h3>Blank</h3></div>
        </div>`, "templates55");
    }

    async function openDocumentVault55() {
        const files = await loadFiles();
        const rows = Object.entries(files).filter(([, f]) => /\.(edoc|html|txt|md|csv|esheet|eslide)$/i.test(f.name || "")).map(([id, f]) => `<tr><td>${safe(f.name)}</td><td>${safe(fileKind(f.name, f.type))}</td><td>${formatBytes(fileSize(f))}</td><td>${smallButton("Open", `openFileFromFiles55('${safe(id)}')`)}</td></tr>`).join("");
        win("Document Vault", `<h2>Document Vault</h2><table class="emerald55-table"><thead><tr><th>Name</th><th>Kind</th><th>Size</th><th>Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="4">No Office files found.</td></tr>`}</tbody></table>`, "documentVault55");
    }

    function openSheets55(fileId = "", file = null, content = "") {
        const rows = Array.from({ length: 8 }, (_, r) => `<tr>${Array.from({ length: 6 }, (_, c) => `<td contenteditable="true" data-cell="${r}-${c}">${r === 0 ? String.fromCharCode(65 + c) : ""}</td>`).join("")}</tr>`).join("");
        win("Emerald Sheets", `<h2>Emerald Sheets</h2><div class="emerald55-toolbar">${smallButton("Sum Column A", "sheetSum55()")} ${smallButton("Export CSV", "sheetExportCSV55()")} ${smallButton("Save", "sheetSave55()")}</div><div class="emerald55-inset"><table id="sheet55" class="emerald55-table">${rows}</table></div><div id="sheet55_result" class="emerald55-inset">Ready.</div>`, "sheets55");
    }
    function sheetCells() { return Array.from(document.querySelectorAll("#sheet55 td")); }
    function sheetSum55() { const sum = sheetCells().filter(td => td.dataset.cell?.endsWith("-0")).reduce((s, td) => s + Number(td.innerText || 0), 0); setHTML("sheet55_result", `Column A total: <b>${sum}</b>`); }
    function sheetExportCSV55() { const rows = Array.from(document.querySelectorAll("#sheet55 tr")).map(tr => Array.from(tr.children).map(td => `"${String(td.innerText).replaceAll('"','""')}"`).join(",")).join("\n"); downloadText("EmeraldSheet.csv", rows); }
    async function sheetSave55() { const html = document.getElementById("sheet55")?.outerHTML || ""; const id = await cloudCreateFile("Emerald Sheet.esheet", html); if (id) notify("Emerald Sheets", "Sheet saved to Files.", "success"); }

    function openSlides55() {
        localStorage.setItem("55_slides", localStorage.getItem("55_slides") || JSON.stringify([{ title: "Title Slide", body: "Subtitle" }]));
        win("Emerald Slides", `<h2>Emerald Slides</h2><div class="emerald55-toolbar">${smallButton("Add Slide", "slideAdd55()")} ${smallButton("Export HTML", "slideExport55()")} ${smallButton("Save", "slideSave55()")}</div><div id="slides55_area"></div>`, "slides55");
        renderSlides55();
    }
    function getSlides55() { try { return JSON.parse(localStorage.getItem("55_slides") || "[]"); } catch { return []; } }
    function setSlides55(slides) { localStorage.setItem("55_slides", JSON.stringify(slides)); }
    function renderSlides55() {
        const slides = getSlides55();
        setHTML("slides55_area", slides.map((s, i) => `<div class="emerald55-slide"><input value="${safe(s.title)}" onchange="slideSet55(${i},'title',this.value)" style="font-size:18px;width:100%;font-weight:bold"><textarea onchange="slideSet55(${i},'body',this.value)" style="width:100%;height:110px;margin-top:8px;">${safe(s.body)}</textarea>${smallButton("Delete", `slideDelete55(${i})`)}</div>`).join(""));
    }
    function slideAdd55() { const slides = getSlides55(); slides.push({ title: "New Slide", body: "Content" }); setSlides55(slides); renderSlides55(); }
    function slideSet55(i, field, value) { const slides = getSlides55(); slides[i][field] = value; setSlides55(slides); }
    function slideDelete55(i) { const slides = getSlides55(); slides.splice(i, 1); setSlides55(slides); renderSlides55(); }
    function slideExport55() { const slides = getSlides55(); downloadText("EmeraldSlides.html", `<!doctype html>${slides.map(s => `<section style="min-height:90vh;padding:40px"><h1>${safe(s.title)}</h1><p>${safe(s.body)}</p></section>`).join("<hr>")}`); }
    async function slideSave55() { const id = await cloudCreateFile("Emerald Slides.eslide", JSON.stringify(getSlides55(), null, 2)); if (id) notify("Emerald Slides", "Slides saved to Files.", "success"); }

    function openForms55() {
        win("Emerald Forms", `<h2>Emerald Forms</h2><div class="emerald55-toolbar">${smallButton("Add Question", "formAddQuestion55()")}${smallButton("Export", "formExport55()")}</div><div id="form55_questions" class="emerald55-inset"></div>`, "forms55");
        renderForm55();
    }
    function getForm55() { try { return JSON.parse(localStorage.getItem("55_form") || "[]"); } catch { return []; } }
    function setForm55(q) { localStorage.setItem("55_form", JSON.stringify(q)); }
    function renderForm55() { const q = getForm55(); setHTML("form55_questions", q.map((x, i) => `<div class="emerald55-form-row"><input value="${safe(x)}" onchange="formSet55(${i},this.value)">${smallButton("Remove", `formRemove55(${i})`)}</div>`).join("") || "No questions yet."); }
    function formAddQuestion55() { const q = getForm55(); q.push("New question"); setForm55(q); renderForm55(); }
    function formSet55(i, v) { const q = getForm55(); q[i] = v; setForm55(q); }
    function formRemove55(i) { const q = getForm55(); q.splice(i, 1); setForm55(q); renderForm55(); }
    function formExport55() { downloadText("EmeraldForm.json", JSON.stringify(getForm55(), null, 2)); }

    /* =====================================================
       CHAT, USERS, PROFILES, CONTACTS
    ===================================================== */

    async function openEmeraldChat55(roomId = activeRoom55, label = activeRoomLabel55) {
        activeRoom55 = roomId;
        activeRoomLabel55 = label;
        await ensureChatRoom(roomId, label, roomId.startsWith("dm_") ? "direct" : "public", []);
        win("Emerald Chat", `
            <h2>Emerald Chat</h2>
            <div class="emerald55-toolbar">
                ${smallButton("Rooms", "openChatRooms55()")}
                ${smallButton("Direct Messages", "openDirectMessages55()")}
                ${smallButton("Users", "openUsers55()")}
                <span class="emerald55-badge">${safe(label)}</span>
            </div>
            <div id="chat55_log" class="emerald55-chat-log">Loading messages...</div>
            <div class="emerald55-toolbar">
                <input id="chat55_message" placeholder="Type a message" style="flex:1;min-width:260px;" onkeydown="if(event.key==='Enter')sendChat55()">
                ${smallButton("Send", "sendChat55()")}
            </div>
        `, "chat55");
        subscribeChat55(roomId);
    }

    function subscribeChat55(roomId) {
        if (chatUnsub55) chatUnsub55();
        chatUnsub55 = onSnapshot(roomMessages(roomId), snap => {
            const rows = [];
            snap.forEach(d => rows.push({ id: d.id, ...d.data() }));
            rows.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
            setHTML("chat55_log", rows.slice(-100).map(m => renderMessage55(m)).join("") || "No messages yet.");
            const log = document.getElementById("chat55_log");
            if (log) log.scrollTop = log.scrollHeight;
        }, err => setHTML("chat55_log", `<div class="emerald55-danger">Could not load chat: ${safe(err.message)}</div>`));
    }

    function renderMessage55(m) {
        const mine = m.sender === currentUser();
        const deleted = m.deleted;
        return `<div class="emerald55-message ${deleted ? "deleted" : ""}">
            <b>${safe(m.sender || "Unknown")}</b> <span class="emerald55-note">${dateTime(m.createdAt)}</span><br>
            ${deleted ? "Message deleted." : safe(m.text || "")}
            <div class="emerald55-toolbar">
                ${!deleted && mine ? smallButton("Edit", `editMessage55('${safe(activeRoom55)}','${safe(m.id)}')`) : ""}
                ${!deleted && (mine || isModerator()) ? smallButton("Delete", `deleteMessage55('${safe(activeRoom55)}','${safe(m.id)}')`) : ""}
                ${!deleted ? smallButton("Reply", `replyMessage55('${safe(m.sender)}')`) : ""}
                ${!deleted ? smallButton("Report", `reportMessage55('${safe(activeRoom55)}','${safe(m.id)}')`) : ""}
            </div>
        </div>`;
    }

    async function sendChat55() {
        const input = document.getElementById("chat55_message");
        const text = input?.value.trim();
        if (!text) return;
        await addDoc(roomMessages(activeRoom55), { sender: currentUser(), text, createdAt: now(), deleted: false });
        await setDoc(doc(db, COL.rooms, activeRoom55), { updatedAt: now(), lastMessage: text.slice(0, 120) }, { merge: true });
        input.value = "";
    }

    async function editMessage55(roomId, messageId) {
        const text = prompt("Edit message:");
        if (!text) return;
        await updateDoc(doc(db, COL.rooms, roomId, "messages", messageId), { text, editedAt: now() });
    }

    async function deleteMessage55(roomId, messageId) {
        await updateDoc(doc(db, COL.rooms, roomId, "messages", messageId), { deleted: true, deletedBy: currentUser(), deletedAt: now() });
        await logMod("message.delete", `${currentUser()} deleted message ${messageId} in ${roomId}`);
    }

    function replyMessage55(sender) {
        const input = document.getElementById("chat55_message");
        if (input) input.value = `@${sender} ` + input.value;
        input?.focus();
    }

    async function reportMessage55(roomId, messageId) {
        const reason = prompt("Report reason:", "Inappropriate message") || "Reported message";
        await addDoc(collection(db, COL.reports), { roomId, messageId, reason, reporter: currentUser(), status: "open", createdAt: now() });
        notify("Emerald Chat", "Message reported.", "warning");
    }

    async function openChatRooms55() {
        try {
            const snap = await getDocs(collection(db, COL.rooms));
            const rooms = [];
            snap.forEach(d => rooms.push({ id: d.id, ...d.data() }));
            rooms.sort((a, b) => String(a.label).localeCompare(String(b.label)));
            const rows = rooms.map(r => `<tr><td>${safe(r.label || r.id)}</td><td>${safe(r.type || "public")}</td><td>${dateTime(r.updatedAt)}</td><td>${smallButton("Open", `openEmeraldChat55('${safe(r.id)}','${safe(r.label || r.id)}')`)}</td></tr>`).join("");
            win("Chat Rooms", `<h2>Chat Rooms</h2><div class="emerald55-toolbar">${smallButton("Create Room", "createRoom55()")} ${smallButton("Global Lobby", "openEmeraldChat55('global','Global Lobby')")}</div><table class="emerald55-table"><thead><tr><th>Room</th><th>Type</th><th>Updated</th><th>Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="4">No rooms.</td></tr>`}</tbody></table>`, "rooms55");
        } catch (err) {
            win("Chat Rooms", `<div class="emerald55-danger">Could not list rooms: ${safe(err.message)}</div>`, "rooms55");
        }
    }

    async function createRoom55() {
        const label = prompt("Room name:");
        if (!label) return;
        const id = "room_" + uid(label);
        await ensureChatRoom(id, label, "public", []);
        openEmeraldChat55(id, label);
    }

    async function openDirectMessages55() {
        const users = (await listUsers()).filter(u => u.username !== currentUser());
        const rows = users.map(u => `<tr><td>${safe(u.displayName || u.username)}<br><span class="emerald55-note">${safe(u.username)}</span></td><td>${smallButton("Message", `startDM55('${safe(u.username)}')`)} ${smallButton("Profile", `openUserProfile55('${safe(u.username)}')`)}</td></tr>`).join("");
        win("Direct Messages", `<h2>Direct Messages</h2><table class="emerald55-table"><thead><tr><th>User</th><th>Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="2">No users found.</td></tr>`}</tbody></table>`, "directMessages55");
    }

    async function startDM55(username) {
        const roomId = dmRoom(currentUser(), username);
        const label = `DM: ${currentUser()} / ${username}`;
        await ensureChatRoom(roomId, label, "direct", [currentUser(), username]);
        openEmeraldChat55(roomId, label);
    }

    async function openCommunicationCenter55() {
        win("Communication Center", `<h2>Communication Center</h2><div class="emerald55-grid">
            <div class="emerald55-card emerald55-app-tile" onclick="openEmeraldChat55()"><h3>Emerald Chat</h3><p>Public rooms and direct messages.</p></div>
            <div class="emerald55-card emerald55-app-tile" onclick="openDirectMessages55()"><h3>Direct Messages</h3><p>Start one-on-one conversations.</p></div>
            <div class="emerald55-card emerald55-app-tile" onclick="openUsers55()"><h3>User Directory</h3><p>Find EmeraldOS users.</p></div>
            <div class="emerald55-card emerald55-app-tile" onclick="openNotificationCenter55()"><h3>Notifications</h3><p>View alerts and shared file notices.</p></div>
        </div>`, "communicationCenter55");
    }

    async function openUsers55() {
        const users = await listUsers();
        const rows = users.map(u => `<tr><td><span class="emerald55-status-dot"></span>${safe(u.displayName || u.username)}<br><span class="emerald55-note">${safe(u.username)}</span></td><td>${safe(u.role || "user")}</td><td>${dateTime(u.lastLogin || u.createdAt)}</td><td>${smallButton("Profile", `openUserProfile55('${safe(u.username)}')`)} ${smallButton("Message", `startDM55('${safe(u.username)}')`)} ${smallButton("Share File", `shareToUserPrompt55('${safe(u.username)}')`)}</td></tr>`).join("");
        win("EmeraldOS Users", `<h2>EmeraldOS Users</h2><div class="emerald55-toolbar"><input id="users55_filter" placeholder="Search users" oninput="filterTable55(this,'users55_table')"></div><table id="users55_table" class="emerald55-table"><thead><tr><th>User</th><th>Role</th><th>Activity</th><th>Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="4">No users found.</td></tr>`}</tbody></table>`, "users55");
    }

    async function shareToUserPrompt55(username) {
        const files = await loadFiles();
        const names = Object.entries(files).filter(([, f]) => !f.trashed).map(([id, f], i) => `${i + 1}. ${f.name || id} [${id}]`).join("\n");
        const pick = prompt(`Share which file with ${username}? Enter number, name, or file ID:\n\n${names}`);
        if (!pick) return;
        const entries = Object.entries(files).filter(([, f]) => !f.trashed);
        let found = entries[Number(pick) - 1];
        if (!found) found = entries.find(([id, f]) => id === pick || String(f.name).toLowerCase() === pick.toLowerCase());
        if (!found) return notify("File Sharing", "File not found.", "warning");
        const permission = prompt("Permission: view or edit", "view") || "view";
        await shareFile55(found[0], username, permission === "edit" ? "edit" : "view");
    }

    async function openMyProfile55() {
        const p = await getProfile(currentUser());
        win("My Profile", `<h2>My Profile</h2><div class="emerald55-grid"><div class="emerald55-card"><h3>${safe(p.initials || currentUser().slice(0,2).toUpperCase())}</h3><p>${safe(currentUser())}</p></div><div class="emerald55-card"><h3>Profile Details</h3><div class="emerald55-form-row">Display name<br><input id="profile55_display" value="${safe(p.displayName || currentUser())}"></div><div class="emerald55-form-row">Status<br><input id="profile55_status" value="${safe(p.status || "Available")}"></div><div class="emerald55-form-row">Bio<br><textarea id="profile55_bio" style="width:100%;height:100px;">${safe(p.bio || "")}</textarea></div>${smallButton("Save Profile", "saveMyProfile55()")}</div></div>`, "profile55");
    }

    async function saveMyProfile55() {
        await saveProfile({
            displayName: document.getElementById("profile55_display")?.value,
            status: document.getElementById("profile55_status")?.value,
            bio: document.getElementById("profile55_bio")?.value
        });
        notify("Profile", "Profile saved.", "success");
    }

    async function openUserProfile55(username) {
        const p = await getProfile(username);
        win("User Profile", `<h2>${safe(p.displayName || username)}</h2><div class="emerald55-inset"><b>Username:</b> ${safe(username)}<br><b>Status:</b> ${safe(p.status || "Available")}<br><b>Bio:</b><br>${safe(p.bio || "No bio set.")}</div><div class="emerald55-toolbar">${smallButton("Message", `startDM55('${safe(username)}')`)} ${smallButton("Share File", `shareToUserPrompt55('${safe(username)}')`)} ${smallButton("Add Contact", `addContact55('${safe(username)}')`)}</div>`, "userProfile55");
    }

    async function openContacts55() {
        const contacts = await loadContacts55();
        const rows = contacts.map(c => `<tr><td>${safe(c.username)}</td><td>${safe(c.favorite ? "Favorite" : "Contact")}</td><td>${smallButton("Message", `startDM55('${safe(c.username)}')`)} ${smallButton("Remove", `removeContact55('${safe(c.id)}')`)}</td></tr>`).join("");
        win("Contacts", `<h2>Contacts</h2><div class="emerald55-toolbar"><input id="contact55_name" placeholder="Username">${smallButton("Add", "addContactFromInput55()")}</div><table class="emerald55-table"><thead><tr><th>User</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="3">No contacts yet.</td></tr>`}</tbody></table>`, "contacts55");
    }

    async function loadContacts55() {
        try {
            const snap = await getDocs(collection(db, COL.users, currentUser(), COL.contacts));
            const rows = [];
            snap.forEach(d => rows.push({ id: d.id, ...(d.data() || {}) }));
            return rows.sort((a, b) => String(a.username).localeCompare(String(b.username)));
        } catch { return []; }
    }

    async function addContact55(username) {
        if (!username) return;
        await setDoc(doc(db, COL.users, currentUser(), COL.contacts, uid(username)), { username, addedAt: now(), favorite: false }, { merge: true });
        notify("Contacts", "Contact added.", "success");
    }
    async function addContactFromInput55() { const u = document.getElementById("contact55_name")?.value.trim(); if (u) { await addContact55(u); openContacts55(); } }
    async function removeContact55(id) { await deleteDoc(doc(db, COL.users, currentUser(), COL.contacts, id)); openContacts55(); }
    function openFriends55() { openContacts55(); }

    /* =====================================================
       MODERATION AND ADMINISTRATION
    ===================================================== */

    async function logMod(action, details) {
        try { await addDoc(collection(db, COL.logs), { action, details, actor: currentUser(), createdAt: now() }); }
        catch (err) { console.warn("Log skipped:", err); }
    }

    async function openModeratorConsole55() {
        if (!isModerator()) return win("Access Denied", `<div class="emerald55-danger">Moderator access is required.</div>`, "accessDenied55");
        win("Moderator Console", `<h2>Moderator Console</h2><div class="emerald55-grid">
            <div class="emerald55-card" onclick="openReportsReview55()"><h3>Reports Review</h3><p>Review reported messages.</p></div>
            <div class="emerald55-card" onclick="openCommunicationAudit55()"><h3>Communication Audit</h3><p>Recent message review.</p></div>
            <div class="emerald55-card" onclick="openModerationLog55()"><h3>Moderation Log</h3><p>View moderation actions.</p></div>
            <div class="emerald55-card" onclick="openMuteTools55()"><h3>Mute Tools</h3><p>Mute or unmute users.</p></div>
        </div>`, "moderatorConsole55");
    }

    async function openReportsReview55() {
        if (!isModerator()) return;
        const snap = await getDocs(collection(db, COL.reports));
        const rows = [];
        snap.forEach(d => rows.push({ id: d.id, ...(d.data() || {}) }));
        rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        const html = rows.map(r => `<tr><td>${safe(r.reason)}</td><td>${safe(r.reporter)}</td><td>${safe(r.roomId)}<br>${safe(r.messageId)}</td><td>${safe(r.status || "open")}</td><td>${smallButton("Close", `closeReport55('${safe(r.id)}')`)} ${smallButton("Delete Message", `deleteMessage55('${safe(r.roomId)}','${safe(r.messageId)}')`)}</td></tr>`).join("");
        win("Reports Review", `<h2>Reports Review</h2><table class="emerald55-table"><thead><tr><th>Reason</th><th>Reporter</th><th>Message</th><th>Status</th><th>Actions</th></tr></thead><tbody>${html || `<tr><td colspan="5">No reports.</td></tr>`}</tbody></table>`, "reportsReview55");
    }
    async function closeReport55(id) { await updateDoc(doc(db, COL.reports, id), { status: "closed", closedBy: currentUser(), closedAt: now() }); await logMod("report.close", `Closed report ${id}`); openReportsReview55(); }

    async function openCommunicationAudit55() {
        if (!isModerator()) return;
        try {
            const snap = await getDocs(collectionGroup(db, "messages"));
            const rows = [];
            snap.forEach(d => rows.push({ id: d.id, path: d.ref.path, ...(d.data() || {}) }));
            rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            const html = rows.slice(0, 120).map(m => `<tr><td>${safe(m.sender)}</td><td>${safe(m.text || "")}</td><td>${dateTime(m.createdAt)}</td><td>${safe(m.path)}</td></tr>`).join("");
            win("Communication Audit", `<h2>Communication Audit</h2><table class="emerald55-table"><thead><tr><th>Sender</th><th>Message</th><th>Time</th><th>Path</th></tr></thead><tbody>${html || `<tr><td colspan="4">No messages found.</td></tr>`}</tbody></table>`, "communicationAudit55");
        } catch (err) {
            win("Communication Audit", `<div class="emerald55-danger">Could not run audit: ${safe(err.message)}</div>`, "communicationAudit55");
        }
    }

    async function openModerationLog55() {
        if (!isModerator()) return;
        const snap = await getDocs(collection(db, COL.logs));
        const rows = [];
        snap.forEach(d => rows.push({ id: d.id, ...(d.data() || {}) }));
        rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        win("Moderation Log", `<h2>Moderation Log</h2><table class="emerald55-table"><thead><tr><th>Action</th><th>Actor</th><th>Details</th><th>Time</th></tr></thead><tbody>${rows.map(r => `<tr><td>${safe(r.action)}</td><td>${safe(r.actor)}</td><td>${safe(r.details)}</td><td>${dateTime(r.createdAt)}</td></tr>`).join("") || `<tr><td colspan="4">No log entries.</td></tr>`}</tbody></table>`, "modLog55");
    }

    function openMuteTools55() {
        if (!isModerator()) return;
        win("Mute Tools", `<h2>Mute Tools</h2><div class="emerald55-toolbar"><input id="mute55_user" placeholder="Username"><input id="mute55_reason" placeholder="Reason">${smallButton("Mute", "muteUser55()")} ${smallButton("Unmute", "unmuteUser55()")}</div>`, "muteTools55");
    }
    async function muteUser55() { const u = document.getElementById("mute55_user")?.value.trim(); const r = document.getElementById("mute55_reason")?.value || "Moderation mute"; if (!u) return; await setDoc(doc(db, COL.mutes, uid(u)), { username: u, reason: r, mutedBy: currentUser(), mutedAt: now(), active: true }, { merge: true }); await logMod("user.mute", `${u}: ${r}`); notify("Moderation", "User muted.", "warning"); }
    async function unmuteUser55() { const u = document.getElementById("mute55_user")?.value.trim(); if (!u) return; await setDoc(doc(db, COL.mutes, uid(u)), { username: u, active: false, unmutedBy: currentUser(), unmutedAt: now() }, { merge: true }); await logMod("user.unmute", u); notify("Moderation", "User unmuted.", "success"); }

    async function openAdminPanel55() {
        if (!isExecutive()) return win("Access Denied", `<div class="emerald55-danger">Executive access is required.</div>`, "accessDenied55");
        win("Administrative Panel", `<h2>Administrative Panel</h2><div class="emerald55-grid">
            <div class="emerald55-card" onclick="openAdminUsers55()"><h3>Users</h3><p>View users, roles, profiles, and account state.</p></div>
            <div class="emerald55-card" onclick="openAdminStorage55()"><h3>Storage</h3><p>View saved file metadata and storage usage.</p></div>
            <div class="emerald55-card" onclick="openAdminSharing55()"><h3>Sharing</h3><p>Audit file shares and permissions.</p></div>
            <div class="emerald55-card" onclick="openSecurityAudit55()"><h3>Security Audit</h3><p>Review reports, mutes, logs, and system warnings.</p></div>
        </div>`, "adminPanel55");
    }

    async function openAdminUsers55() {
        if (!isExecutive()) return;
        const users = await listUsers();
        const rows = users.map(u => `<tr><td>${safe(u.username)}</td><td>${safe(u.displayName || "")}</td><td>${safe(u.role || "user")}</td><td>${dateTime(u.createdAt)}</td><td>${smallButton("Files", `adminViewUserFiles55('${safe(u.username)}')`)} ${smallButton("Profile", `openUserProfile55('${safe(u.username)}')`)}</td></tr>`).join("");
        win("User Administration", `<h2>User Administration</h2><div class="emerald55-toolbar"><input placeholder="Search" oninput="filterTable55(this,'adminUsers55_table')"></div><table id="adminUsers55_table" class="emerald55-table"><thead><tr><th>Username</th><th>Display</th><th>Role</th><th>Created</th><th>Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="5">No users.</td></tr>`}</tbody></table>`, "adminUsers55");
    }

    async function adminViewUserFiles55(username) {
        if (!isExecutive()) return;
        try {
            const snap = await getDocs(collection(db, COL.users, username, "drive"));
            const rows = [];
            snap.forEach(d => rows.push({ id: d.id, ...(d.data() || {}) }));
            rows.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
            const total = rows.reduce((s, f) => s + fileSize(f), 0);
            win("User Files", `<h2>${safe(username)} Files</h2><div class="emerald55-inset"><b>Files:</b> ${rows.length}<br><b>Estimated storage:</b> ${formatBytes(total)}</div><table class="emerald55-table"><thead><tr><th>Name</th><th>ID</th><th>Size</th><th>Updated</th></tr></thead><tbody>${rows.map(f => `<tr><td>${safe(f.name)}</td><td>${safe(f.id)}</td><td>${formatBytes(fileSize(f))}</td><td>${dateTime(f.updatedAt || f.createdAt)}</td></tr>`).join("") || `<tr><td colspan="4">No files.</td></tr>`}</tbody></table>`, "adminUserFiles55");
        } catch (err) {
            win("User Files", `<div class="emerald55-danger">Could not read user files: ${safe(err.message)}</div>`, "adminUserFiles55");
        }
    }

    async function openAdminStorage55() {
        if (!isExecutive()) return;
        const users = await listUsers();
        const rows = [];
        for (const u of users.slice(0, 80)) {
            try {
                const snap = await getDocs(collection(db, COL.users, u.username, "drive"));
                let total = 0, count = 0;
                snap.forEach(d => { count++; total += fileSize(d.data() || {}); });
                rows.push(`<tr><td>${safe(u.username)}</td><td>${count}</td><td>${formatBytes(total)}</td><td>${smallButton("View", `adminViewUserFiles55('${safe(u.username)}')`)}</td></tr>`);
            } catch {}
        }
        win("Storage Administration", `<h2>Storage Administration</h2><table class="emerald55-table"><thead><tr><th>User</th><th>Files</th><th>Estimated Storage</th><th>Actions</th></tr></thead><tbody>${rows.join("") || `<tr><td colspan="4">No data.</td></tr>`}</tbody></table>`, "adminStorage55");
    }

    async function openAdminSharing55() {
        if (!isExecutive()) return;
        const snap = await getDocs(collection(db, COL.shares));
        const rows = [];
        snap.forEach(d => rows.push({ id: d.id, ...(d.data() || {}) }));
        rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        win("Sharing Administration", `<h2>Sharing Administration</h2><table class="emerald55-table"><thead><tr><th>File</th><th>Owner</th><th>Target</th><th>Permission</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows.map(s => `<tr><td>${safe(s.fileName)}</td><td>${safe(s.owner)}</td><td>${safe(s.targetUsername)}</td><td>${safe(s.permission)}</td><td>${safe(s.status)}</td><td>${s.status !== "revoked" ? smallButton("Revoke", `revokeShare55('${safe(s.id)}')`) : ""}</td></tr>`).join("") || `<tr><td colspan="6">No shares.</td></tr>`}</tbody></table>`, "adminSharing55");
    }

    async function openSecurityAudit55() {
        if (!isExecutive()) return;
        win("Security Audit", `<h2>Security Audit</h2><div class="emerald55-grid"><div class="emerald55-card" onclick="openReportsReview55()"><h3>Reports</h3></div><div class="emerald55-card" onclick="openModerationLog55()"><h3>Moderation Log</h3></div><div class="emerald55-card" onclick="openCommunicationAudit55()"><h3>Communication Audit</h3></div><div class="emerald55-card" onclick="openMuteTools55()"><h3>Mute Tools</h3></div></div>`, "securityAudit55");
    }

    /* =====================================================
       SETTINGS, NOTIFICATIONS, ASSISTANT, DESKTOP
    ===================================================== */

    function openNotificationCenter55() {
        const list = readNotifications();
        win("Notification Center", `<h2>Notification Center</h2><div class="emerald55-toolbar">${smallButton("Clear All", "clearNotifications55()")} ${smallButton("Test", "notify('EmeraldOS','Notification test complete.',2500,'info')")}</div><div class="emerald55-inset">${list.map(n => `<div class="emerald55-message"><b>${safe(n.title)}</b> <span class="emerald55-note">${dateTime(n.time)}</span><br>${safe(n.message)}</div>`).join("") || "No notifications."}</div>`, "notifications55");
    }
    function clearNotifications55() { localStorage.setItem(LS.notifications, "[]"); openNotificationCenter55(); }

    function openSettings55() {
        win("Settings", `<h2>Settings</h2><div class="emerald55-grid">
            <div class="emerald55-card"><h3>Desktop</h3><label><input type="checkbox" ${localStorage.getItem(LS.desktopLocked)==='true'?'checked':''} onchange="localStorage.setItem('${LS.desktopLocked}',this.checked?'true':'false')"> Lock desktop layout</label><br>${smallButton("Clean Desktop", "desktopClean55()")} ${smallButton("Render Desktop", "renderDesktop55()")}</div>
            <div class="emerald55-card"><h3>Assistant</h3><label><input type="checkbox" ${localStorage.getItem(LS.assistantEnabled)==='true'?'checked':''} onchange="localStorage.setItem('${LS.assistantEnabled}',this.checked?'true':'false')"> Enable Emerald Assistant</label><br><input id="assistant55_endpoint" placeholder="OpenAI-compatible endpoint" value="${safe(localStorage.getItem(LS.assistantEndpoint)||'')}"><br><input id="assistant55_key" placeholder="API key" type="password" value="${safe(localStorage.getItem(LS.assistantKey)||'')}"><br>${smallButton("Save Assistant Settings", "saveAssistantSettings55()")}</div>
            <div class="emerald55-card"><h3>Files</h3>${smallButton("Open Storage", "openStorage55()")} ${smallButton("Open Sharing", "openFileSharing55()")}</div>
            <div class="emerald55-card"><h3>Privacy</h3>${smallButton("Security & Privacy", "openSecurityPrivacy55()")}</div>
        </div>`, "settings55");
    }

    function saveAssistantSettings55() {
        localStorage.setItem(LS.assistantEndpoint, document.getElementById("assistant55_endpoint")?.value || "");
        localStorage.setItem(LS.assistantKey, document.getElementById("assistant55_key")?.value || "");
        notify("Settings", "Assistant settings saved.", "success");
    }

    function openAssistant55() {
        const enabled = localStorage.getItem(LS.assistantEnabled) === "true";
        win("Emerald Assistant", `<h2>Emerald Assistant</h2><div class="emerald55-${enabled ? "success" : "warning"}">${enabled ? "Assistant is enabled." : "Assistant is disabled. Enable it in Settings to use API mode. Offline tips are always available."}</div><div class="emerald55-toolbar"><input id="assistant55_prompt" placeholder="Ask for help with files, chat, or documents" style="flex:1;min-width:300px;" onkeydown="if(event.key==='Enter')askAssistant55()">${smallButton("Ask", "askAssistant55()")} ${smallButton("Offline Tips", "assistantTips55()")}</div><div id="assistant55_answer" class="emerald55-inset">Ready.</div>`, "assistant55");
    }

    function assistantTips55() {
        setHTML("assistant55_answer", `<b>Useful tips:</b><br>Use Files for storage and sharing.<br>Use Emerald Office for Writer, Sheets, Slides, and Forms.<br>Use Communication Center for chat and users.<br>Use Storage Center to review file size warnings.<br>Use Moderator Console for reports and message review.`);
    }

    async function askAssistant55() {
        const promptText = document.getElementById("assistant55_prompt")?.value || "";
        if (!promptText) return;
        const endpoint = localStorage.getItem(LS.assistantEndpoint) || "";
        const key = localStorage.getItem(LS.assistantKey) || "";
        const enabled = localStorage.getItem(LS.assistantEnabled) === "true";
        if (!enabled || !endpoint || !key) {
            setHTML("assistant55_answer", `Offline answer: Try opening Settings, Files, Communication Center, or Emerald Office. For writing help, open Emerald Writer and use Templates, Find, Replace, Table, and Export.`);
            return;
        }
        setHTML("assistant55_answer", "Contacting assistant endpoint...");
        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: "You are Emerald Assistant inside EmeraldOS. Give concise help for files, office apps, chat, settings, and moderation." },
                        { role: "user", content: promptText }
                    ]
                })
            });
            const data = await res.json();
            const answer = data?.choices?.[0]?.message?.content || JSON.stringify(data, null, 2);
            setHTML("assistant55_answer", safe(answer).replaceAll("\n", "<br>"));
        } catch (err) {
            setHTML("assistant55_answer", `<div class="emerald55-danger">Assistant request failed: ${safe(err.message)}</div>`);
        }
    }

    function openSecurityPrivacy55() {
        win("Security & Privacy", `<h2>Security & Privacy</h2><div class="emerald55-inset"><b>Current user:</b> ${safe(currentUser())}<br><b>Role:</b> ${safe(roleText() || "user")}<br><b>Moderator access:</b> ${isModerator() ? "Yes" : "No"}<br><b>Executive access:</b> ${isExecutive() ? "Yes" : "No"}</div><div class="emerald55-toolbar">${smallButton("Clear Local Notifications", "clearNotifications55()")} ${smallButton("Reset Desktop Layout", "desktopReset55()")} ${smallButton("Open Shared by Me", "openSharedByMe55()")}</div>`, "security55");
    }
    function openPrivacy55() { openSecurityPrivacy55(); }

    function openDesktopTools55() {
        win("Desktop Tools", `<h2>Desktop Tools</h2><div class="emerald55-toolbar">${smallButton("Clean Desktop", "desktopClean55()")} ${smallButton("Render Desktop", "renderDesktop55()")} ${smallButton("Lock Layout", "desktopLock55()")} ${smallButton("Unlock Layout", "desktopUnlock55()")} ${smallButton("Reset Layout", "desktopReset55()")}</div><div class="emerald55-inset">Desktop folder mode is active. App clutter is consolidated into folders.</div>`, "desktopTools55");
    }
    function desktopClean55() { renderDesktop55(); renderStart55(); notify("Desktop", "Desktop cleaned.", "success"); }
    function desktopLock55() { localStorage.setItem(LS.desktopLocked, "true"); notify("Desktop", "Desktop layout locked.", "info"); }
    function desktopUnlock55() { localStorage.setItem(LS.desktopLocked, "false"); notify("Desktop", "Desktop layout unlocked.", "info"); }
    function desktopReset55() { localStorage.removeItem("40_desktop_positions"); renderDesktop55(); notify("Desktop", "Desktop layout reset.", "success"); }

    function openAppManager55() {
        const rows = Object.entries(window.APPS || {}).filter(([id]) => visibleApp(id)).map(([id, app]) => `<tr><td>${safe(app.name)}</td><td>${safe(id)}</td><td>${safe(app.edition || "economy")}</td><td>${smallButton("Open", `launchApp('${safe(id)}')`)}</td></tr>`).join("");
        win("App Manager", `<h2>App Manager</h2><table class="emerald55-table"><thead><tr><th>Application</th><th>ID</th><th>Edition</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table>`, "appManager55");
    }

    function openTasks55() { win("Task Board", `<h2>Task Board</h2><textarea style="width:100%;height:260px;" placeholder="Task list"></textarea>`, "tasks55"); }
    function openPlanner55() { win("Planner", `<h2>Planner</h2><textarea style="width:100%;height:260px;" placeholder="Plan details"></textarea>`, "planner55"); }
    async function openReports55() { const files = await loadFiles(); win("Reports", `<h2>Reports</h2><div class="emerald55-inset"><b>User:</b> ${safe(currentUser())}<br><b>Files:</b> ${Object.keys(files).length}<br><b>Notifications:</b> ${readNotifications().length}</div>`, "reports55"); }

    /* =====================================================
       TERMINAL AND UTILITIES
    ===================================================== */

    function filterTable55(input, tableId) {
        const q = String(input.value || "").toLowerCase();
        document.querySelectorAll(`#${CSS.escape(tableId)} tbody tr`).forEach(tr => {
            tr.style.display = tr.innerText.toLowerCase().includes(q) ? "" : "none";
        });
    }

    function copyText55(text) {
        navigator.clipboard?.writeText(text);
        notify("Clipboard", "Copied.", "success");
    }

    function downloadText(name, content) {
        const blob = new Blob([content], { type: "text/plain" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = name;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 100);
    }

    function installTerminalCommands() {
        const original = window.runTerminalCommand;
        window.runTerminalCommand = function (raw) {
            const cmd = String(raw || "").trim().toLowerCase();
            const map = {
                "version": () => "EmeraldOS 5.5 - Intelligence, Security & Management Update",
                "build": () => "EmeraldOS 5.5 - Intelligence, Security & Management Update",
                "office": () => { openEmeraldOffice55(); return "Opening Emerald Office."; },
                "writer": () => { openWriter55(); return "Opening Emerald Writer."; },
                "sheets": () => { openSheets55(); return "Opening Emerald Sheets."; },
                "slides": () => { openSlides55(); return "Opening Emerald Slides."; },
                "files": () => { openFiles55(); return "Opening Files."; },
                "storage": () => { openStorage55(); return "Opening Storage Center."; },
                "sharing": () => { openFileSharing55(); return "Opening File Sharing."; },
                "shared": () => { openSharedWithMe55(); return "Opening Shared With Me."; },
                "chat": () => { openEmeraldChat55(); return "Opening Emerald Chat."; },
                "rooms": () => { openChatRooms55(); return "Opening Chat Rooms."; },
                "dm": () => { openDirectMessages55(); return "Opening Direct Messages."; },
                "users": () => { openUsers55(); return "Opening EmeraldOS Users."; },
                "profile": () => { openMyProfile55(); return "Opening My Profile."; },
                "contacts": () => { openContacts55(); return "Opening Contacts."; },
                "settings": () => { openSettings55(); return "Opening Settings."; },
                "notifications": () => { openNotificationCenter55(); return "Opening Notification Center."; },
                "assistant": () => { openAssistant55(); return "Opening Emerald Assistant."; },
                "desktop.clean": () => { desktopClean55(); return "Desktop cleaned."; },
                "desktop.lock": () => { desktopLock55(); return "Desktop locked."; },
                "desktop.unlock": () => { desktopUnlock55(); return "Desktop unlocked."; },
                "moderation": () => { openModeratorConsole55(); return "Opening Moderator Console."; },
                "mod": () => { openModeratorConsole55(); return "Opening Moderator Console."; },
                "admin": () => { openAdminPanel55(); return "Opening Administrative Panel."; }
            };
            if (map[cmd]) return map[cmd]();
            if (typeof original === "function") return original(raw);
            return `Unknown command: ${raw}`;
        };
    }

    function exposeGlobals() {
        Object.assign(window, {
            openFolder55,
            renderDesktop55,
            renderStart55,
            openEmeraldOffice55,
            openWriter55,
            writerCmd55,
            writerBlock55,
            writerFontSize55,
            writerColor55,
            writerInsertDate55,
            writerInsertTable55,
            writerInsertImage55,
            writerFind55,
            writerReplace55,
            writerCount55,
            writerAutosave55,
            saveWriter55,
            exportWriterText55,
            exportWriterHtml55,
            printWriter55,
            writerProperties55,
            openTemplates55,
            docTemplate,
            openDocumentVault55,
            openSheets55,
            sheetSum55,
            sheetExportCSV55,
            sheetSave55,
            openSlides55,
            renderSlides55,
            slideAdd55,
            slideSet55,
            slideDelete55,
            slideExport55,
            slideSave55,
            openForms55,
            formAddQuestion55,
            formSet55,
            formRemove55,
            formExport55,
            openFiles55,
            openFileFromFiles55,
            fileDetails55,
            renameFile55,
            deleteFileFromFiles55,
            restoreFile55,
            deleteForever55,
            newTextFile55,
            newOfficeDocument55,
            openStorage55,
            emptyTrash55,
            downloadStorageReport55,
            openFileSharing55,
            shareFilePrompt55,
            shareFile55,
            revokeShare55,
            openSharedWithMe55,
            openSharedByMe55,
            openSharedFile55,
            sharedDetails55,
            saveSharedEditCopy55,
            openTrash55,
            openEmeraldChat55,
            sendChat55,
            editMessage55,
            deleteMessage55,
            replyMessage55,
            reportMessage55,
            openChatRooms55,
            createRoom55,
            openDirectMessages55,
            startDM55,
            openCommunicationCenter55,
            openUsers55,
            shareToUserPrompt55,
            openMyProfile55,
            saveMyProfile55,
            openUserProfile55,
            openContacts55,
            addContact55,
            addContactFromInput55,
            removeContact55,
            openFriends55,
            openModeratorConsole55,
            openReportsReview55,
            closeReport55,
            openCommunicationAudit55,
            openModerationLog55,
            openMuteTools55,
            muteUser55,
            unmuteUser55,
            openAdminPanel55,
            openAdminUsers55,
            adminViewUserFiles55,
            openAdminStorage55,
            openAdminSharing55,
            openSecurityAudit55,
            openNotificationCenter55,
            clearNotifications55,
            openSettings55,
            saveAssistantSettings55,
            openAssistant55,
            askAssistant55,
            assistantTips55,
            openSecurityPrivacy55,
            openPrivacy55,
            openDesktopTools55,
            desktopClean55,
            desktopLock55,
            desktopUnlock55,
            desktopReset55,
            openAppManager55,
            openTasks55,
            openPlanner55,
            openReports55,
            filterTable55,
            copyText55
        });
    }

    function setBuildIdentity() {
        document.title = BUILD.displayName;
        localStorage.setItem("40_build_name", BUILD.displayName);
        localStorage.setItem("40_version", BUILD.version);
        try { window.EmeraldOSRegistry?.set?.("HKEY_LOCAL_MACHINE\\System\\Build\\Version", BUILD.version); } catch {}
        const badge = document.getElementById("emerald40-build-badge");
        if (badge) badge.innerHTML = `<span class="emerald55-badge">${safe(BUILD.displayName)}</span>`;
    }

    function init() {
        installStyles();
        patchWindowManager();
        exposeGlobals();
        installApps();
        setBuildIdentity();
        window.EMERALDOS_APP_CATEGORIES = FOLDERS;
        window.renderDesktopOverride = renderDesktop55;
        window.renderStartMenuOverride = renderStart55;
        window.renderDesktop = renderDesktop55;
        window.renderStartMenu = renderStart55;
        installTerminalCommands();
        renderDesktop55();
        renderStart55();
        setTimeout(patchWindowManager, 500);
        notify("EmeraldOS 5.5", "Intelligence, security, management, application editor, notifications, and desktop fixes loaded.", "success");
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", () => setTimeout(init, 160));
    } else {
        setTimeout(init, 160);
    }
})();


/* =========================================================
   EMERALDOS 5.5 FEATURE PACK
   APPLICATION EDITOR, NOTIFICATION BELL, BLOCKING, FILES 4.0
========================================================= */

(function () {
    if (window.EmeraldOS55FeaturePackLoaded) return;
    window.EmeraldOS55FeaturePackLoaded = true;

    const BUILD = {
        version: "5.5",
        displayName: "EmeraldOS 5.5",
        codename: "Intelligence, Security & Management Update",
        fileLimit: 1024 * 1024
    };

    const LS = {
        notifications: "55_notifications",
        userApps: "55_user_applications",
        fileMeta: "55_file_metadata",
        blockedUsers: "55_blocked_users",
        settings: "55_settings",
        recentFiles: "55_recent_files",
        desktopLayout: "55_desktop_layout",
        shareSeen: "55_seen_share_ids",
        messageSeen: "55_seen_message_ids"
    };

    const COL = {
        users: "emeraldOSUsers",
        shares: "emeraldOSShares",
        rooms: "emeraldOSChatRooms",
        reports: "emeraldOSChatReports",
        blocks: "emeraldOSBlocks",
        logs: "emeraldOSModerationLogs"
    };

    const originalNotify55 = window.notify;
    let bellTimer55 = null;
    let roomWatchUnsubs55 = [];

    function safe55x(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function currentUser55x() {
        return String(localStorage.getItem("40_username") || localStorage.getItem("username") || localStorage.getItem("40_session") || "Guest").trim() || "Guest";
    }

    function userKey55x(value = "") {
        return String(value || "").trim().toLowerCase();
    }

    function now55x() { return Date.now(); }

    function date55x(value) {
        if (!value) return "";
        try { return new Date(value).toLocaleString(); } catch { return String(value); }
    }

    function bytes55x(n = 0) {
        n = Number(n || 0);
        if (n < 1024) return n + " B";
        if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
        return (n / (1024 * 1024)).toFixed(2) + " MB";
    }

    function getJSON55(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
        catch { return fallback; }
    }

    function setJSON55(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function canSee55x(required = "economy") {
        if (required === "developer") {
            const role = String(localStorage.getItem("40_developer_role") || localStorage.getItem("role") || "").toLowerCase();
            return localStorage.getItem("40_executive_verified") === "true" || (localStorage.getItem("40_developer_verified") === "true" && (role === "admin" || role === "mod"));
        }
        if (required === "executive") {
            const role = String(localStorage.getItem("40_developer_role") || localStorage.getItem("role") || "").toLowerCase();
            return localStorage.getItem("40_executive_verified") === "true" || role === "admin";
        }
        return typeof window.canSeeEdition === "function" ? window.canSeeEdition(required) : true;
    }

    function win55x(title, html, app = "emerald55") {
        const body = `<div class="emerald55-panel emerald55-feature-panel">${html}</div>`;
        const w = window.openWindow?.(title, body, app) || null;
        setTimeout(patchAllWindows55, 40);
        return w;
    }

    function button55(label, action, className = "") {
        return `<button class="win95-small-button emerald55-button ${className}" onclick="${action}">${safe55x(label)}</button>`;
    }

    function installFeatureStyles55() {
        if (document.getElementById("emerald55-feature-style")) return;
        const style = document.createElement("style");
        style.id = "emerald55-feature-style";
        style.textContent = `
            input, textarea, select, [contenteditable="true"], .emerald55-editor, .emerald55-codearea {
                user-select:text !important;
                -webkit-user-select:text !important;
                cursor:text;
            }
            .window.maximized, .window[data-maximized="true"] {
                left:0 !important;
                top:0 !important;
                width:100vw !important;
                height:calc(100vh - 40px) !important;
            }
            .window[data-maximized="true"] .resize-handle { display:none !important; pointer-events:none !important; }
            .emerald55-feature-panel input,.emerald55-feature-panel textarea,.emerald55-feature-panel select{font-family:"MS Sans Serif",Tahoma,Arial,sans-serif;font-size:12px;}
            .emerald55-feature-panel textarea{width:100%;box-sizing:border-box;min-height:100px;resize:vertical;background:#fff;border:2px inset #fff;padding:6px;}
            .emerald55-feature-panel input,.emerald55-feature-panel select{background:#fff;border:2px inset #fff;padding:3px;box-sizing:border-box;}
            .emerald55-grid-tight{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:8px;}
            .emerald55-card2{background:#c0c0c0;border:2px solid;border-color:#fff #808080 #808080 #fff;padding:8px;margin:6px 0;}
            .emerald55-inset2{background:#fff;border:2px inset #fff;padding:8px;margin:6px 0;overflow:auto;}
            .emerald55-table2{width:100%;border-collapse:collapse;background:#fff;font-size:12px;}
            .emerald55-table2 th,.emerald55-table2 td{border:1px solid #808080;padding:4px;text-align:left;vertical-align:top;}
            .emerald55-table2 th{background:#000080;color:#fff;}
            .emerald55-codearea{font-family:Consolas,"Courier New",monospace;min-height:240px;white-space:pre;tab-size:4;}
            .emerald55-bell{height:28px;min-width:34px;background:#c0c0c0;border:2px solid;border-color:#fff #808080 #808080 #fff;margin-left:4px;position:relative;font-family:inherit;cursor:pointer;}
            .emerald55-bell:active{border-color:#808080 #fff #fff #808080;}
            .emerald55-bell-count{position:absolute;right:-6px;top:-7px;min-width:16px;height:16px;border:1px solid #000;background:#c00000;color:#fff;font-size:10px;line-height:15px;text-align:center;font-weight:bold;display:none;}
            .emerald55-bell.has-unread .emerald55-bell-count{display:block;}
            .emerald55-bell.has-unread{box-shadow:0 0 0 2px #ffff00 inset;}
            .emerald55-folder-icon{width:86px;min-height:78px;text-align:center;color:white;cursor:pointer;padding:4px;box-sizing:border-box;outline:none;}
            .emerald55-folder-icon:focus{outline:none !important;}
            .emerald55-folder-symbol{height:38px;display:flex;align-items:center;justify-content:center;color:#000;background:#c0c000;border:2px solid;border-color:#ffff80 #808000 #808000 #ffff80;font-weight:bold;font-size:11px;margin:0 auto 4px;}
            .emerald55-folder-label{text-shadow:1px 1px #000;font-size:12px;line-height:1.1;}
            .emerald55-app-frame{width:100%;height:420px;border:2px inset #fff;background:#fff;box-sizing:border-box;}
            .emerald55-editor-page{background:#fff;border:2px inset #fff;min-height:380px;padding:28px;margin:6px 0;line-height:1.45;outline:none;user-select:text;}
            .emerald55-toolbar2{display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin:6px 0;}
            .emerald55-pill{display:inline-block;padding:2px 5px;border:1px solid #808080;background:#fff;margin:1px;}
            .emerald55-danger{background:#ffd6d6;border:2px inset #fff;padding:8px;margin:6px 0;}
            .emerald55-good{background:#ddffdd;border:2px inset #fff;padding:8px;margin:6px 0;}
            .emerald55-warn{background:#fff4c4;border:2px inset #fff;padding:8px;margin:6px 0;}
        `;
        document.head.appendChild(style);
    }

    /* =====================================================
       WINDOW / TASKBAR PATCH
    ===================================================== */

    function patchAllWindows55() {
        document.querySelectorAll(".window").forEach(win => {
            if (win.dataset.emerald55WindowPatched === "true") return;
            win.dataset.emerald55WindowPatched = "true";

            const focusWindow = ev => {
                if (ev) {
                    ev.preventDefault?.();
                    ev.stopPropagation?.();
                }
                win.style.display = "";
                win.dataset.minimized = "false";
                win.style.zIndex = String(100000 + (Date.now() % 100000));
                win.focus?.();
            };

            if (win.taskbarButton) {
                win.taskbarButton.onclick = focusWindow;
                win.taskbarButton.onmousedown = ev => ev.stopPropagation();
            }

            const titleBar = win.querySelector(".title-bar");
            if (titleBar) {
                titleBar.addEventListener("mousedown", ev => {
                    if (win.dataset.maximized === "true" && !ev.target.closest("button")) {
                        ev.stopImmediatePropagation();
                        ev.preventDefault();
                        focusWindow();
                    }
                }, true);
            }

            const resize = win.querySelector(".resize-handle");
            if (resize) {
                resize.addEventListener("mousedown", ev => {
                    if (win.dataset.maximized === "true") {
                        ev.stopImmediatePropagation();
                        ev.preventDefault();
                    }
                }, true);
            }

            const maxBtn = win.querySelector(".max-btn");
            if (maxBtn) {
                maxBtn.addEventListener("click", () => setTimeout(() => {
                    if (win.dataset.maximized === "true") win.classList.add("maximized");
                    else win.classList.remove("maximized");
                    win.style.display = "";
                    win.dataset.minimized = "false";
                }, 0), true);
            }

            win.addEventListener("mousedown", ev => {
                if (!ev.target.closest("#taskbar")) {
                    win.style.display = "";
                    win.dataset.minimized = "false";
                }
            }, true);
        });
    }

    function installWindowObserver55() {
        patchAllWindows55();
        if (window.__emerald55WindowObserver) return;
        window.__emerald55WindowObserver = new MutationObserver(() => setTimeout(patchAllWindows55, 30));
        window.__emerald55WindowObserver.observe(document.body, { childList: true, subtree: true });
        setInterval(patchAllWindows55, 1500);
    }

    /* =====================================================
       NOTIFICATION BELL
    ===================================================== */

    function readNotifications55() {
        return getJSON55(LS.notifications, []);
    }

    function saveNotifications55(list) {
        setJSON55(LS.notifications, list.slice(0, 150));
        updateBell55();
    }

    function addNotification55(title, message = "", type = "info", source = "system") {
        const list = readNotifications55();
        const item = {
            id: "n" + Date.now() + Math.random().toString(36).slice(2),
            title: String(title || "EmeraldOS"),
            message: String(message || ""),
            type,
            source,
            read: false,
            time: Date.now()
        };
        list.unshift(item);
        saveNotifications55(list);
        return item;
    }

    function markNotificationsRead55() {
        const list = readNotifications55().map(n => Object.assign({}, n, { read: true }));
        saveNotifications55(list);
        openNotificationCenter55();
    }

    function clearNotifications55() {
        saveNotifications55([]);
        openNotificationCenter55();
    }

    function updateBell55() {
        const bell = document.getElementById("emerald55-bell");
        if (!bell) return;
        const count = readNotifications55().filter(n => !n.read).length;
        bell.classList.toggle("has-unread", count > 0);
        const badge = bell.querySelector(".emerald55-bell-count");
        if (badge) badge.textContent = String(Math.min(count, 99));
        bell.title = count ? `${count} unread EmeraldOS notification${count === 1 ? "" : "s"}` : "No unread EmeraldOS notifications";
    }

    function installBell55() {
        if (document.getElementById("emerald55-bell")) { updateBell55(); return; }
        const taskbar = document.getElementById("taskbar");
        const clock = document.getElementById("clock");
        if (!taskbar) return;
        const bell = document.createElement("button");
        bell.id = "emerald55-bell";
        bell.className = "emerald55-bell";
        bell.innerHTML = `BELL<span class="emerald55-bell-count">0</span>`;
        bell.onclick = () => openNotificationCenter55();
        if (clock) taskbar.insertBefore(bell, clock);
        else taskbar.appendChild(bell);
        updateBell55();
    }

    function patchNotify55() {
        if (window.notify?.__emerald55BellPatched) return;
        const wrapped = function(title, message, timeout, type) {
            try { originalNotify55?.(title, message, timeout, type); } catch {}
            try { addNotification55(title, message, type || "info", "system"); } catch {}
        };
        wrapped.__emerald55BellPatched = true;
        window.notify = wrapped;
    }

    function openNotificationCenter55() {
        const list = readNotifications55();
        const unread = list.filter(n => !n.read).length;
        const rows = list.map(n => `
            <tr>
                <td>${n.read ? "" : "<b>Unread</b>"}</td>
                <td><b>${safe55x(n.title)}</b><br><span class="emerald55-note">${safe55x(n.source || "system")} · ${date55x(n.time)}</span></td>
                <td>${safe55x(n.message)}</td>
            </tr>`).join("") || `<tr><td colspan="3">No notifications.</td></tr>`;
        win55x("Notification Center", `
            <h2>Notification Center</h2>
            <div class="emerald55-toolbar2">
                ${button55("Mark All Read", "markNotificationsRead55()")}
                ${button55("Clear All", "clearNotifications55()")}
                ${button55("Settings", "openSettings55()")}
            </div>
            <div class="emerald55-inset2"><b>${unread}</b> unread notification${unread === 1 ? "" : "s"}. The taskbar bell remains visible while unread items exist.</div>
            <table class="emerald55-table2"><tr><th>Status</th><th>Notification</th><th>Message</th></tr>${rows}</table>
        `, "notifications55");
    }

    /* =====================================================
       USER BLOCKING
    ===================================================== */

    function readBlocked55() { return getJSON55(LS.blockedUsers, []); }
    function isBlocked55(username) { return readBlocked55().map(userKey55x).includes(userKey55x(username)); }

    async function blockUser55(username) {
        username = String(username || prompt("Block which EmeraldOS username?") || "").trim();
        if (!username) return;
        const list = readBlocked55();
        if (!list.map(userKey55x).includes(userKey55x(username))) list.push(username);
        setJSON55(LS.blockedUsers, list);
        try {
            const id = userKey55x(currentUser55x()) + "__" + userKey55x(username);
            await setDoc(doc(db, COL.blocks, id), { blocker: currentUser55x(), blocked: username, createdAt: Date.now() });
        } catch {}
        addNotification55("User blocked", `${username} was added to your blocked users list.`, "warning", "privacy");
        openBlockingCenter55();
    }

    async function unblockUser55(username) {
        username = String(username || "").trim();
        const list = readBlocked55().filter(u => userKey55x(u) !== userKey55x(username));
        setJSON55(LS.blockedUsers, list);
        try {
            const id = userKey55x(currentUser55x()) + "__" + userKey55x(username);
            await deleteDoc(doc(db, COL.blocks, id));
        } catch {}
        addNotification55("User unblocked", `${username} was removed from your blocked users list.`, "info", "privacy");
        openBlockingCenter55();
    }

    function openBlockingCenter55() {
        const rows = readBlocked55().map(u => `<tr><td>${safe55x(u)}</td><td>${button55("Unblock", `unblockUser55('${safe55x(u)}')`)}</td></tr>`).join("") || `<tr><td colspan="2">No blocked users.</td></tr>`;
        win55x("Blocking Center", `
            <h2>Blocking Center</h2>
            <div class="emerald55-inset2">Blocked users cannot be quickly contacted from your directory tools, and their messages can be filtered by EmeraldOS apps.</div>
            <div class="emerald55-toolbar2">
                <input id="blockUser55Name" placeholder="Username">
                ${button55("Block User", "blockUser55(document.getElementById('blockUser55Name').value)")}
            </div>
            <table class="emerald55-table2"><tr><th>User</th><th>Action</th></tr>${rows}</table>
        `, "blocking55");
    }

    async function listUsers55x() {
        try {
            const snap = await getDocs(collection(db, COL.users));
            const rows = [];
            snap.forEach(d => rows.push(Object.assign({ id: d.id }, d.data() || {})));
            return rows.sort((a,b) => String(a.username || a.id).localeCompare(String(b.username || b.id)));
        } catch (err) {
            console.warn("User list failed:", err);
            return [];
        }
    }

    async function openUsers55() {
        const users = await listUsers55x();
        const rows = users.map(u => {
            const name = u.username || u.id;
            const blocked = isBlocked55(name);
            return `<tr>
                <td><b>${safe55x(name)}</b><br><span class="emerald55-note">${safe55x(u.displayName || u.name || "EmeraldOS user")}</span></td>
                <td>${safe55x(u.status || u.role || "User")}</td>
                <td>
                    ${button55("Profile", `openUserProfile55('${safe55x(name)}')`)}
                    ${button55("Chat", `startDM55('${safe55x(name)}')`)}
                    ${button55("Share File", `shareToUserPrompt55('${safe55x(name)}')`)}
                    ${blocked ? button55("Unblock", `unblockUser55('${safe55x(name)}')`) : button55("Block", `blockUser55('${safe55x(name)}')`, "danger")}
                </td>
            </tr>`;
        }).join("") || `<tr><td colspan="3">No EmeraldOS users found.</td></tr>`;
        win55x("EmeraldOS Users", `
            <h2>EmeraldOS Users</h2>
            <div class="emerald55-toolbar2">
                <input id="emerald55UserSearch" placeholder="Search users" oninput="filterTable55('emerald55UsersTable',this.value)">
                ${button55("Blocking Center", "openBlockingCenter55()")}
                ${button55("Contacts", "openContacts55()")}
            </div>
            <table class="emerald55-table2" id="emerald55UsersTable"><tr><th>User</th><th>Status</th><th>Actions</th></tr>${rows}</table>
        `, "users55");
    }

    function filterTable55(id, q) {
        q = String(q || "").toLowerCase();
        document.querySelectorAll(`#${id} tr`).forEach((tr, i) => {
            if (i === 0) return;
            tr.style.display = tr.textContent.toLowerCase().includes(q) ? "" : "none";
        });
    }

    /* =====================================================
       APPLICATION EDITOR
    ===================================================== */

    function userApps55() { return getJSON55(LS.userApps, []); }
    function saveUserApps55(list) { setJSON55(LS.userApps, list); registerUserApplications55(); renderDesktop55Final(); renderStart55Final(); }

    function appId55(name) {
        return "u" + String(name || "app").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) + "_" + Date.now().toString(36);
    }

    function openApplicationEditor55(appId = "") {
        const apps = userApps55();
        const app = apps.find(a => a.id === appId) || { id: "", name: "My Application", icon: "APP", code: "api.setTitle('My Application');\napi.write('<h1>Hello from my EmeraldOS app</h1><p>This app was made in Application Editor.</p>');\napi.button('Send notification', () => api.notify('Hello', 'Notification from your custom app.'));" };
        const list = apps.map(a => `<tr><td><b>${safe55x(a.name)}</b><br><span class="emerald55-note">${safe55x(a.id)}</span></td><td>${safe55x(a.icon || "APP")}</td><td>${button55("Edit", `openApplicationEditor55('${safe55x(a.id)}')`)} ${button55("Run", `runUserApplication55('${safe55x(a.id)}')`)} ${button55("Delete", `deleteUserApplication55('${safe55x(a.id)}')`)}</td></tr>`).join("") || `<tr><td colspan="3">No custom applications yet.</td></tr>`;
        win55x("Application Editor", `
            <h2>Application Editor</h2>
            <div class="emerald55-warn"><b>Sandboxed custom apps:</b> User applications run inside a restricted iframe. They can draw an interface and send notifications, but they do not get direct access to EmeraldOS internals by default.</div>
            <div class="emerald55-grid-tight">
                <div>
                    <label>Application Name</label><br>
                    <input id="appEditor55Id" type="hidden" value="${safe55x(app.id)}">
                    <input id="appEditor55Name" style="width:100%" value="${safe55x(app.name)}">
                </div>
                <div>
                    <label>Icon Label</label><br>
                    <input id="appEditor55Icon" style="width:100%" value="${safe55x(app.icon || "APP")}">
                </div>
            </div>
            <label>Application JavaScript</label>
            <textarea id="appEditor55Code" class="emerald55-codearea" spellcheck="false">${safe55x(app.code)}</textarea>
            <div class="emerald55-toolbar2">
                ${button55("Save Application", "saveUserApplication55()")}
                ${button55("Run Preview", "previewUserApplication55()")}
                ${button55("New Blank App", "openApplicationEditor55()")}
                ${button55("User Applications", "openUserApplications55()")}
            </div>
            <h3>Saved User Applications</h3>
            <table class="emerald55-table2"><tr><th>Name</th><th>Icon</th><th>Actions</th></tr>${list}</table>
        `, "appEditor55");
    }

    function saveUserApplication55() {
        const idField = document.getElementById("appEditor55Id");
        const name = document.getElementById("appEditor55Name")?.value?.trim() || "Untitled Application";
        const icon = document.getElementById("appEditor55Icon")?.value?.trim() || "APP";
        const code = document.getElementById("appEditor55Code")?.value || "";
        const apps = userApps55();
        let id = idField?.value || "";
        if (!id) id = appId55(name);
        const existing = apps.findIndex(a => a.id === id);
        const record = { id, name, icon, code, updatedAt: Date.now() };
        if (existing >= 0) apps[existing] = Object.assign({}, apps[existing], record);
        else apps.push(record);
        saveUserApps55(apps);
        addNotification55("Application saved", `${name} was added to your desktop applications.`, "success", "application-editor");
        openApplicationEditor55(id);
    }

    function previewUserApplication55() {
        const temp = {
            id: "preview",
            name: document.getElementById("appEditor55Name")?.value || "Preview",
            icon: document.getElementById("appEditor55Icon")?.value || "APP",
            code: document.getElementById("appEditor55Code")?.value || ""
        };
        launchSandboxApp55(temp);
    }

    function deleteUserApplication55(id) {
        if (!confirm("Delete this custom application?")) return;
        saveUserApps55(userApps55().filter(a => a.id !== id));
        addNotification55("Application deleted", "The custom application was removed.", "info", "application-editor");
        openApplicationEditor55();
    }

    function runUserApplication55(id) {
        const app = userApps55().find(a => a.id === id);
        if (!app) return alert("Application not found.");
        launchSandboxApp55(app);
    }

    function launchSandboxApp55(app) {
        const code = String(app.code || "");
        const title = String(app.name || "User Application");
        const frameId = "frame55_" + Math.random().toString(36).slice(2);
        win55x(title, `<iframe id="${frameId}" class="emerald55-app-frame" sandbox="allow-scripts allow-forms allow-modals"></iframe>`, "userapp55");
        setTimeout(() => {
            const frame = document.getElementById(frameId);
            if (!frame) return;
            const src = `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Tahoma,Arial,sans-serif;margin:0;padding:10px;background:#fff;color:#000}button{margin:3px;padding:4px 8px}.bar{background:#c0c0c0;border:2px solid;border-color:#fff #808080 #808080 #fff;padding:6px;margin-bottom:8px}.out{padding:8px}</style></head><body><div class="bar"><b id="title"></b></div><div id="app" class="out"></div><script>const app=document.getElementById('app');const api={setTitle:t=>{document.getElementById('title').textContent=String(t||'');},write:h=>{app.innerHTML=String(h||'');},append:h=>{app.insertAdjacentHTML('beforeend',String(h||''));},text:t=>{app.textContent=String(t||'');},button:(label,fn)=>{const b=document.createElement('button');b.textContent=label;b.onclick=fn;app.appendChild(b);return b;},notify:(title,message)=>{parent.postMessage({type:'emerald55_notify',title:String(title||'App'),message:String(message||'')},'*');}};try{api.setTitle(${JSON.stringify(title)});const userCode=${JSON.stringify(code)};new Function('api',userCode)(api);}catch(err){app.innerHTML='<pre style="color:#800000;white-space:pre-wrap"></pre>';app.querySelector('pre').textContent='Application error: '+err.message;}<\/script></body></html>`;
            frame.srcdoc = src;
        }, 80);
    }

    function openUserApplications55() {
        const rows = userApps55().map(a => `<tr><td><b>${safe55x(a.name)}</b><br><span class="emerald55-note">${safe55x(a.id)}</span></td><td>${safe55x(a.icon)}</td><td>${date55x(a.updatedAt)}</td><td>${button55("Open", `runUserApplication55('${safe55x(a.id)}')`)} ${button55("Edit", `openApplicationEditor55('${safe55x(a.id)}')`)}</td></tr>`).join("") || `<tr><td colspan="4">No custom applications have been created.</td></tr>`;
        win55x("User Applications", `<h2>User Applications</h2><div class="emerald55-toolbar2">${button55("Create Application", "openApplicationEditor55()")}</div><table class="emerald55-table2"><tr><th>Name</th><th>Icon</th><th>Updated</th><th>Actions</th></tr>${rows}</table>`, "userApps55");
    }

    function registerUserApplications55() {
        if (!window.APPS) window.APPS = {};
        Object.keys(window.APPS).filter(id => id.startsWith("userapp55_")).forEach(id => delete window.APPS[id]);
        userApps55().forEach(a => {
            window.APPS["userapp55_" + a.id] = { name: a.name, icon: a.icon || "APP", edition: "economy", category: "custom", launch: () => runUserApplication55(a.id) };
        });
    }

    window.addEventListener("message", ev => {
        if (ev.data?.type === "emerald55_notify") {
            window.notify?.(ev.data.title || "Application", ev.data.message || "", 3500, "info");
        }
    });

    /* =====================================================
       FILES / STORAGE / SHARING
    ===================================================== */

    async function loadFiles55x() {
        try {
            const files = await loadDrive() || {};
            if (window.fileSystem) window.fileSystem.files = files;
            return files;
        } catch (err) {
            console.warn("Files load failed:", err);
            return window.fileSystem?.files || {};
        }
    }

    function fileMeta55() { return getJSON55(LS.fileMeta, { folders: ["Drive", "Documents", "Shared", "Archive", "Trash"], files: {}, versions: {} }); }
    function saveFileMeta55(meta) { setJSON55(LS.fileMeta, meta); }
    function fileSize55(f) { try { return f.storageSize || f.size || new Blob([String(f.content || "")]).size || 0; } catch { return 0; } }

    function fileType55(name = "") {
        const lower = String(name).toLowerCase();
        if (/\.(edoc|doc|docx|txt|md|html)$/i.test(lower)) return "Document";
        if (/\.(esheet|csv|xls|xlsx)$/i.test(lower)) return "Spreadsheet";
        if (/\.(eslide|ppt|pptx)$/i.test(lower)) return "Presentation";
        if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(lower)) return "Image";
        return "File";
    }

    async function openAdvancedFiles55(folder = "") {
        const files = await loadFiles55x();
        const meta = fileMeta55();
        const folders = meta.folders || [];
        const selected = folder || localStorage.getItem("55_last_folder") || "Drive";
        localStorage.setItem("55_last_folder", selected);
        const folderButtons = folders.map(f => button55(f, `openAdvancedFiles55('${safe55x(f)}')`)).join(" ");
        const rows = Object.entries(files).filter(([id]) => {
            const m = meta.files[id] || {};
            if (m.deleted && selected !== "Trash") return false;
            if (selected === "Trash") return !!m.deleted;
            if (selected === "Starred") return !!m.starred;
            if (selected === "Recent") return getJSON55(LS.recentFiles, []).includes(id);
            return (m.folder || "Drive") === selected || (selected === "Drive" && !m.folder);
        }).map(([id, f]) => {
            const m = meta.files[id] || {};
            const size = fileSize55(f);
            const tooLarge = size > BUILD.fileLimit;
            return `<tr>
                <td>${m.starred ? "STAR" : ""}</td>
                <td><b>${safe55x(f.name || id)}</b><br><span class="emerald55-note">ID: ${safe55x(id)} · ${safe55x(fileType55(f.name))}</span><br><span class="emerald55-pill">${safe55x(m.folder || "Drive")}</span> ${(m.tags || []).map(t => `<span class="emerald55-pill">${safe55x(t)}</span>`).join("")}</td>
                <td>${bytes55x(size)}${tooLarge ? `<br><b style="color:#800000">Over free file limit</b>` : ""}</td>
                <td>${date55x(f.updatedAt || f.createdAt)}</td>
                <td>
                    ${button55("Open", `openFileFromFiles55('${safe55x(id)}')`)}
                    ${button55("Share", `shareFilePrompt55('${safe55x(id)}')`)}
                    ${button55(m.starred ? "Unstar" : "Star", `toggleStarFile55('${safe55x(id)}')`)}
                    ${button55("Move", `moveFile55('${safe55x(id)}')`)}
                    ${button55("Tags", `tagFile55('${safe55x(id)}')`)}
                    ${button55("Details", `fileDetails55('${safe55x(id)}')`)}
                    ${button55("Versions", `fileVersions55('${safe55x(id)}')`)}
                    ${m.deleted ? button55("Restore", `restoreFile55('${safe55x(id)}')`) + button55("Delete Forever", `deleteForever55('${safe55x(id)}')`) : button55("Trash", `deleteFileFromFiles55('${safe55x(id)}')`)}
                </td>
            </tr>`;
        }).join("") || `<tr><td colspan="5">No files in this view.</td></tr>`;
        const total = Object.values(files).reduce((sum, f) => sum + fileSize55(f), 0);
        const warn = total > BUILD.fileLimit ? `<div class="emerald55-warn"><b>Storage warning:</b> your saved files are estimated at ${bytes55x(total)}. Free file uploads over 1 MB should be reviewed before saving.</div>` : `<div class="emerald55-good">Estimated storage use: ${bytes55x(total)}</div>`;
        win55x("Files", `
            <h2>Files</h2>
            ${warn}
            <div class="emerald55-toolbar2">
                ${button55("New Text File", "newTextFile55()")}
                ${button55("New Folder", "createFolder55()")}
                ${button55("Starred", "openAdvancedFiles55('Starred')")}
                ${button55("Recent", "openAdvancedFiles55('Recent')")}
                ${button55("Trash", "openAdvancedFiles55('Trash')")}
                ${button55("Sharing", "openSharingManager55()")}
                <input placeholder="Search files" oninput="filterTable55('filesTable55',this.value)">
            </div>
            <div class="emerald55-toolbar2">${folderButtons}</div>
            <table class="emerald55-table2" id="filesTable55"><tr><th></th><th>File</th><th>Size</th><th>Updated</th><th>Actions</th></tr>${rows}</table>
        `, "files55");
    }

    function createFolder55() {
        const name = prompt("Folder name:");
        if (!name) return;
        const meta = fileMeta55();
        meta.folders = Array.from(new Set([...(meta.folders || []), name.trim()]));
        saveFileMeta55(meta);
        openAdvancedFiles55(name.trim());
    }

    function toggleStarFile55(id) {
        const meta = fileMeta55();
        meta.files[id] = Object.assign({}, meta.files[id], { starred: !meta.files[id]?.starred });
        saveFileMeta55(meta);
        openAdvancedFiles55();
    }

    function moveFile55(id) {
        const meta = fileMeta55();
        const folder = prompt("Move to folder:", meta.files[id]?.folder || "Drive");
        if (!folder) return;
        meta.folders = Array.from(new Set([...(meta.folders || []), folder.trim()]));
        meta.files[id] = Object.assign({}, meta.files[id], { folder: folder.trim() });
        saveFileMeta55(meta);
        openAdvancedFiles55(folder.trim());
    }

    function tagFile55(id) {
        const meta = fileMeta55();
        const tags = prompt("Tags, comma-separated:", (meta.files[id]?.tags || []).join(", "));
        if (tags === null) return;
        meta.files[id] = Object.assign({}, meta.files[id], { tags: tags.split(",").map(t => t.trim()).filter(Boolean) });
        saveFileMeta55(meta);
        openAdvancedFiles55();
    }

    async function fileDetails55(id) {
        const files = await loadFiles55x();
        const f = files[id] || {};
        const meta = fileMeta55().files[id] || {};
        win55x("File Details", `<h2>${safe55x(f.name || id)}</h2><div class="emerald55-inset2"><b>ID:</b> ${safe55x(id)}<br><b>Type:</b> ${safe55x(fileType55(f.name))}<br><b>Size:</b> ${bytes55x(fileSize55(f))}<br><b>Folder:</b> ${safe55x(meta.folder || "Drive")}<br><b>Tags:</b> ${safe55x((meta.tags || []).join(", "))}<br><b>Shared:</b> ${meta.shared ? "Yes" : "Unknown"}</div><div class="emerald55-toolbar2">${button55("Share", `shareFilePrompt55('${safe55x(id)}')`)} ${button55("Move", `moveFile55('${safe55x(id)}')`)} ${button55("Versions", `fileVersions55('${safe55x(id)}')`)}</div>`, "fileDetails55");
    }

    function fileVersions55(id) {
        const meta = fileMeta55();
        const versions = meta.versions[id] || [];
        const rows = versions.map((v, i) => `<tr><td>${i + 1}</td><td>${date55x(v.time)}</td><td>${safe55x(v.note || "Saved snapshot")}</td></tr>`).join("") || `<tr><td colspan="3">No version snapshots recorded yet.</td></tr>`;
        win55x("File Version History", `<h2>Version History</h2><div class="emerald55-inset2">EmeraldOS records local metadata snapshots when files are changed through 5.5 tools.</div><table class="emerald55-table2"><tr><th>#</th><th>Time</th><th>Note</th></tr>${rows}</table>`, "versions55");
    }

    async function renameFile55(id) {
        const files = await loadFiles55x();
        const f = files[id];
        if (!f) return;
        const name = prompt("New file name:", f.name || id);
        if (!name) return;
        const meta = fileMeta55();
        meta.versions[id] = [{ time: Date.now(), note: "Renamed from " + (f.name || id) }, ...(meta.versions[id] || [])].slice(0, 20);
        saveFileMeta55(meta);
        await cloudSaveFile(id, Object.assign({}, f, { name: name.trim(), updatedAt: Date.now() }));
        addNotification55("File renamed", `${f.name || id} was renamed to ${name}.`, "info", "files");
        openAdvancedFiles55();
    }

    async function deleteFileFromFiles55(id) {
        const meta = fileMeta55();
        meta.files[id] = Object.assign({}, meta.files[id], { deleted: true, folder: "Trash" });
        saveFileMeta55(meta);
        addNotification55("File moved to Trash", `File ${id} was moved to Trash.`, "warning", "files");
        openAdvancedFiles55("Trash");
    }

    function restoreFile55(id) {
        const meta = fileMeta55();
        meta.files[id] = Object.assign({}, meta.files[id], { deleted: false, folder: "Drive" });
        saveFileMeta55(meta);
        openAdvancedFiles55("Drive");
    }

    async function deleteForever55(id) {
        if (!confirm("Delete this file forever?")) return;
        await cloudDeleteFile(id);
        const meta = fileMeta55();
        delete meta.files[id];
        saveFileMeta55(meta);
        addNotification55("File deleted", `File ${id} was deleted forever.`, "warning", "files");
        openAdvancedFiles55("Trash");
    }

    async function newTextFile55() {
        const name = prompt("File name:", "Untitled.txt");
        if (!name) return;
        const content = prompt("Starting text:", "") || "";
        if (new Blob([content]).size > BUILD.fileLimit) alert("Warning: this content is over the 1 MB free file limit.");
        await cloudCreateFile(name, content);
        addNotification55("File created", `${name} was saved in Files.`, "success", "files");
        openAdvancedFiles55("Drive");
    }

    async function openStorage55() {
        const files = await loadFiles55x();
        const list = Object.values(files);
        const total = list.reduce((s, f) => s + fileSize55(f), 0);
        const largest = Object.entries(files).sort((a,b) => fileSize55(b[1]) - fileSize55(a[1])).slice(0, 10).map(([id,f]) => `<tr><td>${safe55x(f.name || id)}</td><td>${bytes55x(fileSize55(f))}</td><td>${button55("Details", `fileDetails55('${safe55x(id)}')`)}</td></tr>`).join("") || `<tr><td colspan="3">No files.</td></tr>`;
        win55x("Storage Center", `<h2>Storage Center</h2><div class="${total > BUILD.fileLimit ? "emerald55-warn" : "emerald55-good"}"><b>Total estimated storage:</b> ${bytes55x(total)}<br><b>Free file warning threshold:</b> 1 MB per file.</div><div class="emerald55-toolbar2">${button55("Open Files", "openAdvancedFiles55()")} ${button55("Clean Up", "openAdvancedFiles55('Trash')")}</div><h3>Largest Files</h3><table class="emerald55-table2"><tr><th>File</th><th>Size</th><th>Action</th></tr>${largest}</table>`, "storage55");
    }

    async function openSharingManager55() {
        const files = await loadFiles55x();
        let shares = [];
        try { const snap = await getDocs(collection(db, COL.shares)); snap.forEach(d => shares.push(Object.assign({ id: d.id }, d.data() || {}))); } catch {}
        const mine = currentUser55x();
        const fileRows = Object.entries(files).map(([id, f]) => `<tr><td><b>${safe55x(f.name || id)}</b><br><span class="emerald55-note">ID: ${safe55x(id)}</span></td><td>${bytes55x(fileSize55(f))}</td><td>${button55("Share", `shareFilePrompt55('${safe55x(id)}')`)} ${button55("Copy Share Info", `copyShareInfo55('${safe55x(id)}')`)}</td></tr>`).join("") || `<tr><td colspan="3">No files to share.</td></tr>`;
        const byMe = shares.filter(s => userKey55x(s.owner || s.from || s.createdBy) === userKey55x(mine)).map(s => `<tr><td>${safe55x(s.fileName || s.fileId)}</td><td>${safe55x(s.to || s.targetUser || "")}</td><td>${safe55x(s.permission || "view")}</td><td>${button55("Change", `changeSharePermission55('${safe55x(s.id)}')`)} ${button55("Revoke", `revokeShare55('${safe55x(s.id)}')`)}</td></tr>`).join("") || `<tr><td colspan="4">No shares created by you.</td></tr>`;
        const withMe = shares.filter(s => userKey55x(s.to || s.targetUser) === userKey55x(mine)).map(s => `<tr><td>${safe55x(s.fileName || s.fileId)}</td><td>${safe55x(s.owner || s.from || s.createdBy || "")}</td><td>${safe55x(s.permission || "view")}</td><td>${button55("Open Shared With Me", "openSharedWithMe55()")}</td></tr>`).join("") || `<tr><td colspan="4">No files shared with you.</td></tr>`;
        win55x("File Sharing", `<h2>File Sharing</h2><div class="emerald55-inset2">Share directly from Files or from this manager. Users can share by button, file name, or file ID.</div><h3>Your Files</h3><table class="emerald55-table2"><tr><th>File</th><th>Size</th><th>Actions</th></tr>${fileRows}</table><h3>Shared by Me</h3><table class="emerald55-table2"><tr><th>File</th><th>Recipient</th><th>Permission</th><th>Action</th></tr>${byMe}</table><h3>Shared With Me</h3><table class="emerald55-table2"><tr><th>File</th><th>Owner</th><th>Permission</th><th>Action</th></tr>${withMe}</table>`, "sharing55");
    }

    async function shareFilePrompt55(fileId) {
        const to = prompt("Share with EmeraldOS username:");
        if (!to) return;
        if (isBlocked55(to)) return alert("You have blocked this user. Unblock them before sharing files.");
        const permission = prompt("Permission: view or edit", "view") || "view";
        await shareFileWithUser55(fileId, to.trim(), permission.trim().toLowerCase() === "edit" ? "edit" : "view");
    }

    async function shareFileWithUser55(fileId, to, permission) {
        const files = await loadFiles55x();
        const f = files[fileId] || {};
        await addDoc(collection(db, COL.shares), { fileId, fileName: f.name || fileId, owner: currentUser55x(), from: currentUser55x(), to, permission, createdAt: Date.now(), status: "active" });
        addNotification55("File shared", `${f.name || fileId} was shared with ${to}.`, "success", "sharing");
        openSharingManager55();
    }

    async function revokeShare55(shareId) {
        if (!confirm("Revoke this share?")) return;
        await deleteDoc(doc(db, COL.shares, shareId));
        addNotification55("Share revoked", "Shared access was removed.", "warning", "sharing");
        openSharingManager55();
    }

    async function changeSharePermission55(shareId) {
        const p = prompt("New permission: view or edit", "view") || "view";
        await updateDoc(doc(db, COL.shares, shareId), { permission: p.trim().toLowerCase() === "edit" ? "edit" : "view", updatedAt: Date.now() });
        openSharingManager55();
    }

    function copyShareInfo55(fileId) {
        const text = `EmeraldOS file ID: ${fileId}\nShare from: Files > Share`;
        navigator.clipboard?.writeText(text);
        addNotification55("Share info copied", "File ID and share instructions were copied.", "info", "sharing");
    }

    /* =====================================================
       OFFICE / ASSISTANT / SETTINGS / MANAGEMENT WINDOWS
    ===================================================== */

    function openEmeraldOffice55() {
        win55x("Emerald Office", `<h2>Emerald Office 5.5</h2><div class="emerald55-grid-tight"><div class="emerald55-card2"><h3>Writer</h3><p>Documents, templates, page layout, tables, print view, and export tools.</p>${button55("Open Writer", "openWriter55()")}</div><div class="emerald55-card2"><h3>Sheets</h3><p>Tables, CSV-style workbooks, totals, and basic formulas.</p>${button55("Open Sheets", "openSheets55()")}</div><div class="emerald55-card2"><h3>Slides</h3><p>Multiple-slide presentations with themes and presenter view.</p>${button55("Open Slides", "openSlides55()")}</div><div class="emerald55-card2"><h3>Forms</h3><p>Build forms and save response structures.</p>${button55("Open Forms", "openForms55()")}</div><div class="emerald55-card2"><h3>Recent Documents</h3><p>Open saved and recent files from Files.</p>${button55("Open Files", "openAdvancedFiles55()")}</div></div>`, "office55");
    }

    function openWriter55() {
        win55x("Emerald Writer", `<h2>Emerald Writer 5.5</h2><div class="emerald55-toolbar2"><button onclick="document.execCommand('bold')">Bold</button><button onclick="document.execCommand('italic')">Italic</button><button onclick="document.execCommand('underline')">Underline</button><button onclick="document.execCommand('insertUnorderedList')">Bullets</button><button onclick="document.execCommand('insertOrderedList')">Numbering</button><button onclick="document.execCommand('justifyLeft')">Left</button><button onclick="document.execCommand('justifyCenter')">Center</button><button onclick="document.execCommand('justifyRight')">Right</button><button onclick="writerInsertTable55()">Insert Table</button><button onclick="writerPrintView55()">Print View</button><button onclick="writerSave55()">Save to Files</button><button onclick="writerExportHTML55()">Export HTML</button></div><input id="writer55Title" style="width:100%" value="Untitled.edoc"><div id="writer55Page" class="emerald55-editor-page" contenteditable="true"><h1>Untitled Document</h1><p>Start writing in Emerald Writer 5.5.</p></div><div class="emerald55-inset2" id="writer55Stats">Words: 0 · Characters: 0</div>`, "writer55");
        setTimeout(() => {
            const page = document.getElementById("writer55Page");
            const stats = document.getElementById("writer55Stats");
            const update = () => { if (stats) { const txt = page?.innerText || ""; stats.textContent = `Words: ${txt.trim() ? txt.trim().split(/\s+/).length : 0} · Characters: ${txt.length}`; } };
            page?.addEventListener("input", update); update();
        }, 80);
    }

    function writerInsertTable55() {
        document.execCommand("insertHTML", false, `<table border="1" style="border-collapse:collapse;width:100%"><tr><td>Column 1</td><td>Column 2</td></tr><tr><td></td><td></td></tr></table><p></p>`);
    }

    async function writerSave55() {
        const name = document.getElementById("writer55Title")?.value || "Untitled.edoc";
        const html = document.getElementById("writer55Page")?.innerHTML || "";
        await cloudCreateFile(name.endsWith(".edoc") ? name : name + ".edoc", html);
        addNotification55("Document saved", `${name} was saved to Files.`, "success", "office");
    }

    function writerPrintView55() {
        const html = document.getElementById("writer55Page")?.innerHTML || "";
        win55x("Print View", `<div class="emerald55-editor-page">${html}</div><div class="emerald55-toolbar2">${button55("Print", "window.print()")}</div>`, "print55");
    }

    function writerExportHTML55() {
        const name = (document.getElementById("writer55Title")?.value || "document").replace(/\.edoc$/i, ".html");
        const html = `<!doctype html><html><body>${document.getElementById("writer55Page")?.innerHTML || ""}</body></html>`;
        const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([html], { type: "text/html" })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }

    function openAssistant55() {
        const settings = getJSON55(LS.settings, {});
        win55x("Emerald Assistant", `<h2>Emerald Assistant</h2><div class="emerald55-inset2">The assistant can run in offline tips mode or use an OpenAI-compatible endpoint when you configure one in Settings.</div><textarea id="assistant55Prompt" placeholder="Ask for help with a file, app, document, setting, or moderation tool."></textarea><div class="emerald55-toolbar2">${button55("Ask", "askAssistant55()")} ${button55("Offline Tips", "assistantTips55()")}</div><div id="assistant55Out" class="emerald55-inset2"></div><div class="emerald55-note">Endpoint configured: ${settings.assistantEndpoint ? "Yes" : "No"}</div>`, "assistant55");
    }

    async function askAssistant55() {
        const out = document.getElementById("assistant55Out");
        const promptText = document.getElementById("assistant55Prompt")?.value || "";
        const settings = getJSON55(LS.settings, {});
        if (!settings.assistantEndpoint || !settings.assistantKey) {
            out.innerHTML = `<b>Offline answer:</b><br>${safe55x(offlineAssistant55(promptText))}`;
            return;
        }
        out.textContent = "Contacting assistant endpoint...";
        try {
            const res = await fetch(settings.assistantEndpoint, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + settings.assistantKey }, body: JSON.stringify({ model: settings.assistantModel || "gpt-4o-mini", messages: [{ role: "user", content: promptText }] }) });
            const data = await res.json();
            out.textContent = data.choices?.[0]?.message?.content || JSON.stringify(data, null, 2);
        } catch (err) { out.textContent = "Assistant request failed: " + err.message; }
    }

    function offlineAssistant55(text = "") {
        text = text.toLowerCase();
        if (text.includes("share")) return "Open Files, select Share beside the file, choose a user, then select view or edit permission.";
        if (text.includes("block")) return "Open Blocking Center from People or Security & Privacy, enter the username, and choose Block User.";
        if (text.includes("application")) return "Open Application Editor, enter a name, icon label, and sandboxed JavaScript, then Save Application.";
        if (text.includes("storage")) return "Open Storage Center to review total use, largest files, and warnings over the 1 MB free file limit.";
        return "Try Files for storage and sharing, Office for documents, Communication for chat, People for contacts, and Security & Privacy for blocking or privacy controls.";
    }

    function assistantTips55() {
        document.getElementById("assistant55Out").innerHTML = `<ul><li>Ask: How do I share a file?</li><li>Ask: How do I block a user?</li><li>Ask: How do I make an Application Editor app?</li><li>Ask: How do I clean storage?</li></ul>`;
    }

    function openSettings55() {
        const s = getJSON55(LS.settings, { notifications: true, assistant: false, desktopLock: false });
        win55x("Settings", `<h2>Settings</h2><div class="emerald55-grid-tight"><div class="emerald55-card2"><h3>Account</h3><p>${safe55x(currentUser55x())}</p></div><div class="emerald55-card2"><h3>Appearance</h3><button onclick="setTheme?.('classic')">Classic</button> <button onclick="setTheme?.('emerald')">Emerald</button></div><div class="emerald55-card2"><h3>Notifications</h3><label><input type="checkbox" id="set55Notifications" ${s.notifications !== false ? "checked" : ""}> Enable notification bell</label></div><div class="emerald55-card2"><h3>Assistant</h3><label><input type="checkbox" id="set55Assistant" ${s.assistant ? "checked" : ""}> Enable assistant</label><br><input id="set55Endpoint" style="width:100%" placeholder="OpenAI-compatible endpoint" value="${safe55x(s.assistantEndpoint || "")}"><input id="set55Key" style="width:100%" placeholder="API key" value="${safe55x(s.assistantKey || "")}"></div><div class="emerald55-card2"><h3>Desktop</h3><label><input type="checkbox" id="set55DesktopLock" ${s.desktopLock ? "checked" : ""}> Lock desktop layout</label></div></div><div class="emerald55-toolbar2">${button55("Save Settings", "saveSettings55()")}</div>`, "settings55");
    }

    function saveSettings55() {
        const s = getJSON55(LS.settings, {});
        s.notifications = document.getElementById("set55Notifications")?.checked !== false;
        s.assistant = !!document.getElementById("set55Assistant")?.checked;
        s.assistantEndpoint = document.getElementById("set55Endpoint")?.value || "";
        s.assistantKey = document.getElementById("set55Key")?.value || "";
        s.desktopLock = !!document.getElementById("set55DesktopLock")?.checked;
        setJSON55(LS.settings, s);
        addNotification55("Settings saved", "EmeraldOS settings were updated.", "success", "settings");
        updateBell55();
    }

    function openSecurityPrivacy55() {
        win55x("Security & Privacy", `<h2>Security & Privacy Center</h2><div class="emerald55-grid-tight"><div class="emerald55-card2"><h3>Account</h3><p>Signed in as <b>${safe55x(currentUser55x())}</b></p></div><div class="emerald55-card2"><h3>Blocking</h3><p>Manage blocked users.</p>${button55("Blocking Center", "openBlockingCenter55()")}</div><div class="emerald55-card2"><h3>Sharing Privacy</h3><p>Review files shared by you and with you.</p>${button55("Sharing Manager", "openSharingManager55()")}</div><div class="emerald55-card2"><h3>Local Cache</h3><p>Clear local UI caches without deleting cloud files.</p>${button55("Clear Cache", "clearLocalCache55()")}</div></div>`, "security55");
    }

    function clearLocalCache55() {
        [LS.recentFiles, LS.desktopLayout].forEach(k => localStorage.removeItem(k));
        addNotification55("Cache cleared", "Local layout and recent-file cache were cleared.", "info", "security");
    }

    function openRecovery55() {
        win55x("System Recovery", `<h2>System Recovery Tools</h2><div class="emerald55-warn">These tools repair the local EmeraldOS interface. They do not delete cloud files.</div><div class="emerald55-grid-tight"><div class="emerald55-card2"><h3>Rebuild App Folders</h3>${button55("Rebuild", "renderDesktop55Final();renderStart55Final();")}</div><div class="emerald55-card2"><h3>Reset Desktop Layout</h3>${button55("Reset", "desktopReset55()")}</div><div class="emerald55-card2"><h3>Safe Mode</h3>${button55("Boot Safe Mode", "safeMode55()")}</div><div class="emerald55-card2"><h3>Export Backup</h3>${button55("Export Local Backup", "exportLocalBackup55()")}</div></div>`, "recovery55");
    }

    function safeMode55() { localStorage.setItem("55_safe_mode", "true"); alert("Safe Mode flag set. Refresh EmeraldOS to boot with minimal local features."); }
    function desktopReset55() { localStorage.removeItem(LS.desktopLayout); renderDesktop55Final(); addNotification55("Desktop reset", "Desktop folder layout was rebuilt.", "info", "desktop"); }
    function exportLocalBackup55() { const data = {}; Object.keys(localStorage).filter(k => k.startsWith("55_") || k.startsWith("40_")).forEach(k => data[k] = localStorage.getItem(k)); const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"})); a.download="EmeraldOS-5.5-local-backup.json"; a.click(); }

    function openDesktopTools55() {
        win55x("Desktop Tools", `<h2>Desktop Layout System</h2><div class="emerald55-toolbar2">${button55("Clean Desktop", "desktopClean55()")}${button55("Lock Layout", "desktopLock55()")}${button55("Unlock Layout", "desktopUnlock55()")}${button55("Rebuild Folders", "renderDesktop55Final()")}${button55("Recovery Tools", "openRecovery55()")}</div><div class="emerald55-inset2">Desktop folders are rebuilt from the 5.5 application registry and remain consistent across refreshes.</div>`, "desktopTools55");
    }
    function desktopClean55(){ renderDesktop55Final(); addNotification55("Desktop cleaned", "Desktop folders were re-aligned.", "info", "desktop"); }
    function desktopLock55(){ const s=getJSON55(LS.settings,{}); s.desktopLock=true; setJSON55(LS.settings,s); addNotification55("Desktop locked", "Desktop layout lock enabled.", "info", "desktop"); }
    function desktopUnlock55(){ const s=getJSON55(LS.settings,{}); s.desktopLock=false; setJSON55(LS.settings,s); addNotification55("Desktop unlocked", "Desktop layout lock disabled.", "info", "desktop"); }

    function openAppManager55() {
        const rows = Object.entries(window.APPS || {}).filter(([,app]) => canSee55x(app.edition || "economy")).map(([id, app]) => `<tr><td><b>${safe55x(app.name)}</b><br><span class="emerald55-note">${safe55x(id)}</span></td><td>${safe55x(app.edition || "economy")}</td><td>${safe55x(app.category || "general")}</td><td>${button55("Open", `launchApp('${safe55x(id)}')`)}</td></tr>`).join("");
        win55x("App Manager", `<h2>App Manager</h2><div class="emerald55-toolbar2"><input placeholder="Search apps" oninput="filterTable55('appTable55',this.value)">${button55("Application Editor", "openApplicationEditor55()")}</div><table class="emerald55-table2" id="appTable55"><tr><th>App</th><th>Edition</th><th>Category</th><th>Action</th></tr>${rows}</table>`, "appManager55");
    }

    function openAdminPanel55() { win55x("Administrative Panel", `<h2>Administrative Panel</h2><div class="emerald55-grid-tight"><div class="emerald55-card2"><h3>Users</h3>${button55("User Administration", "openUsers55()")}</div><div class="emerald55-card2"><h3>Files</h3>${button55("Storage Administration", "openStorage55()")}</div><div class="emerald55-card2"><h3>Sharing</h3>${button55("Sharing Administration", "openSharingManager55()")}</div><div class="emerald55-card2"><h3>Chat & Moderation</h3>${button55("Moderation Center", "openModerationCenter55()")}</div><div class="emerald55-card2"><h3>Security</h3>${button55("Security Audit", "openSecurityPrivacy55()")}</div></div>`, "adminPanel55"); }
    function openModerationCenter55() { win55x("Moderation Center", `<h2>Moderation Center</h2><div class="emerald55-grid-tight"><div class="emerald55-card2"><h3>Reports</h3><p>Review message and user reports.</p>${button55("Reports Review", "openReportsReview55?.()")}</div><div class="emerald55-card2"><h3>User Controls</h3><p>Warn, mute, block, and escalate users.</p>${button55("Blocking Center", "openBlockingCenter55()")}</div><div class="emerald55-card2"><h3>Moderation Log</h3><p>Review staff activity.</p>${button55("Moderation Log", "openModerationLog55?.()")}</div><div class="emerald55-card2"><h3>Communication Audit</h3><p>Executive communication overview.</p>${button55("Communication Audit", "openCommunicationAudit55?.()")}</div></div>`, "moderation55"); }
    function openChatHub55(){ win55x("Emerald Chat", `<h2>Emerald Chat</h2><div class="emerald55-grid-tight"><div class="emerald55-card2"><h3>Global Chat</h3>${button55("Open Chat", "openEmeraldChat55?.()")}</div><div class="emerald55-card2"><h3>Chat Rooms</h3>${button55("Open Rooms", "openChatRooms55?.()")}</div><div class="emerald55-card2"><h3>Direct Messages</h3>${button55("Open Direct Messages", "openDirectMessages55?.()")}</div><div class="emerald55-card2"><h3>Blocked Users</h3>${button55("Blocking Center", "openBlockingCenter55()")}</div></div>`, "chatHub55"); }

    /* =====================================================
       DESKTOP FOLDER OVERRIDE / REGISTRY
    ===================================================== */

    function registerApp55x(id, app) {
        if (!window.APPS) window.APPS = {};
        window.APPS[id] = Object.assign({ icon: "APP", edition: "economy", category: "general" }, app);
    }

    const FOLDERS55 = {
        essentials: { name: "Essentials", edition: "economy", apps: ["files55", "advancedFiles55", "settings55", "notifications55", "desktopTools55", "appManager55"] },
        office: { name: "Office & Documents", edition: "economy", apps: ["emeraldOffice55", "writer55", "sheets55", "slides55", "forms55", "templates55", "documentVault55"] },
        files: { name: "Files & Sharing", edition: "home", apps: ["advancedFiles55", "storage55", "sharing55", "sharedWithMe55", "sharedByMe55", "trash55"] },
        communication: { name: "Communication", edition: "home", apps: ["chatHub55", "chat55", "rooms55", "directMessages55", "communicationCenter55", "notifications55"] },
        people: { name: "People", edition: "home", apps: ["users55", "profile55", "contacts55", "friends55", "blockingCenter55"] },
        intelligence: { name: "Intelligence", edition: "home", apps: ["assistant55", "assistantPro55"] },
        custom: { name: "User Applications", edition: "economy", apps: ["applicationEditor55", "userApplications55"] },
        productivity: { name: "Productivity", edition: "business", apps: ["tasks55", "planner55", "reports55", "emeraldOffice55"] },
        system: { name: "System & Settings", edition: "economy", apps: ["settings55", "security55", "privacy55", "desktopTools55", "appManager55", "recovery55"] },
        moderation: { name: "Moderation", edition: "developer", apps: ["moderationCenter55", "moderatorConsole55", "reportsReview55", "modLog55", "communicationAudit55"] },
        admin: { name: "Administration", edition: "executive", apps: ["adminPanel55", "adminUsers55", "adminStorage55", "adminSharing55", "securityAudit55"] }
    };

    function allFolders55() {
        const f = JSON.parse(JSON.stringify(FOLDERS55));
        const userApps = userApps55().map(a => "userapp55_" + a.id);
        f.custom.apps = [...f.custom.apps, ...userApps];
        return f;
    }

    function appVisible55(id) {
        const app = window.APPS?.[id];
        if (!app) return false;
        return canSee55x(app.edition || "economy");
    }

    function folderVisible55(folder) {
        if (!canSee55x(folder.edition || "economy")) return false;
        return folder.apps.some(appVisible55);
    }

    function openFolder55Final(id) {
        const folder = allFolders55()[id];
        if (!folder) return;
        const tiles = folder.apps.filter(appVisible55).map(appId => {
            const app = window.APPS[appId];
            return `<div class="emerald55-card2 emerald55-app-tile" onclick="launchApp('${safe55x(appId)}')"><h3>${safe55x(app.icon || "APP")} ${safe55x(app.name)}</h3><div class="emerald55-note">Edition: ${safe55x(app.edition || "economy")}</div></div>`;
        }).join("") || `<div class="emerald55-inset2">No applications available.</div>`;
        win55x(folder.name, `<h2>${safe55x(folder.name)}</h2><div class="emerald55-grid-tight">${tiles}</div>`, "folder55");
    }

    function renderDesktop55Final() {
        registerUserApplications55();
        const desktop = document.getElementById("desktop");
        if (!desktop) return;
        desktop.innerHTML = "";
        Object.entries(allFolders55()).forEach(([id, folder]) => {
            if (!folderVisible55(folder)) return;
            const icon = document.createElement("div");
            icon.className = "emerald55-folder-icon desktop-folder-icon";
            icon.tabIndex = -1;
            icon.innerHTML = `<div class="emerald55-folder-symbol">${safe55x(folder.name.split(" ")[0].slice(0,6).toUpperCase())}</div><div class="emerald55-folder-label">${safe55x(folder.name)}</div>`;
            icon.ondblclick = () => openFolder55Final(id);
            icon.onclick = () => setTimeout(() => icon.blur(), 0);
            desktop.appendChild(icon);
        });
    }

    function renderStart55Final() {
        const results = document.getElementById("start-results");
        if (!results) return;
        const search = document.getElementById("start-search");
        const query = String(search?.value || "").toLowerCase();
        const folderItems = Object.entries(allFolders55()).filter(([,f]) => folderVisible55(f)).filter(([,f]) => !query || f.name.toLowerCase().includes(query)).map(([id,f]) => `<div class="start-item" onclick="openFolder55Final('${safe55x(id)}')">${safe55x(f.name)}</div>`).join("");
        const appItems = Object.entries(window.APPS || {}).filter(([id,app]) => appVisible55(id) && (!query || String(app.name).toLowerCase().includes(query))).slice(0,120).map(([id,app]) => `<div class="start-item" onclick="launchApp('${safe55x(id)}')">${safe55x(app.name)}</div>`).join("");
        results.innerHTML = folderItems + (query ? appItems : "");
        if (search && !search.dataset.emerald55SearchFinal) {
            search.dataset.emerald55SearchFinal = "true";
            search.addEventListener("input", renderStart55Final);
        }
    }

    function installApps55() {
        registerApp55x("advancedFiles55", { name: "Files", icon: "FILES", edition: "economy", category: "files", launch: () => openAdvancedFiles55() });
        registerApp55x("files55", { name: "Files", icon: "FILES", edition: "economy", category: "files", launch: () => openAdvancedFiles55() });
        registerApp55x("storage55", { name: "Storage Center", icon: "STORE", edition: "economy", category: "files", launch: () => openStorage55() });
        registerApp55x("sharing55", { name: "File Sharing", icon: "SHARE", edition: "home", category: "files", launch: () => openSharingManager55() });
        registerApp55x("applicationEditor55", { name: "Application Editor", icon: "APPEDIT", edition: "economy", category: "custom", launch: () => openApplicationEditor55() });
        registerApp55x("userApplications55", { name: "User Applications", icon: "USERAPP", edition: "economy", category: "custom", launch: () => openUserApplications55() });
        registerApp55x("notifications55", { name: "Notification Center", icon: "BELL", edition: "economy", category: "system", launch: () => openNotificationCenter55() });
        registerApp55x("settings55", { name: "Settings", icon: "SET", edition: "economy", category: "system", launch: () => openSettings55() });
        registerApp55x("security55", { name: "Security & Privacy", icon: "SEC", edition: "economy", category: "system", launch: () => openSecurityPrivacy55() });
        registerApp55x("blockingCenter55", { name: "Blocking Center", icon: "BLOCK", edition: "home", category: "people", launch: () => openBlockingCenter55() });
        registerApp55x("assistant55", { name: "Emerald Assistant", icon: "HELP", edition: "home", category: "intelligence", launch: () => openAssistant55() });
        registerApp55x("assistantPro55", { name: "Assistant Settings", icon: "AISET", edition: "home", category: "intelligence", launch: () => openSettings55() });
        registerApp55x("desktopTools55", { name: "Desktop Tools", icon: "DESK", edition: "economy", category: "system", launch: () => openDesktopTools55() });
        registerApp55x("recovery55", { name: "System Recovery", icon: "REPAIR", edition: "economy", category: "system", launch: () => openRecovery55() });
        registerApp55x("appManager55", { name: "App Manager", icon: "APPS", edition: "economy", category: "system", launch: () => openAppManager55() });
        registerApp55x("chatHub55", { name: "Emerald Chat", icon: "CHAT", edition: "home", category: "communication", launch: () => openChatHub55() });
        registerApp55x("users55", { name: "EmeraldOS Users", icon: "USERS", edition: "home", category: "people", launch: () => openUsers55() });
        registerApp55x("moderationCenter55", { name: "Moderation Center", icon: "MOD", edition: "developer", category: "moderation", launch: () => openModerationCenter55() });
        registerApp55x("adminPanel55", { name: "Administrative Panel", icon: "ADMIN", edition: "executive", category: "admin", launch: () => openAdminPanel55() });
        registerApp55x("emeraldOffice55", { name: "Emerald Office", icon: "OFFICE", edition: "economy", category: "office", launch: () => openEmeraldOffice55() });
        registerApp55x("writer55", { name: "Emerald Writer", icon: "WRITE", edition: "economy", category: "office", launch: () => openWriter55() });
        registerUserApplications55();
    }

    function installTerminalCommands55() {
        const original = window.runTerminalCommand;
        window.runTerminalCommand = function(raw) {
            const cmd = String(raw || "").trim().toLowerCase();
            const map = {
                "version": () => "EmeraldOS 5.5 - Intelligence, Security & Management Update",
                "build": () => "EmeraldOS 5.5 - Intelligence, Security & Management Update",
                "files": () => { openAdvancedFiles55(); return "Opening Files."; },
                "storage": () => { openStorage55(); return "Opening Storage Center."; },
                "sharing": () => { openSharingManager55(); return "Opening File Sharing."; },
                "office": () => { openEmeraldOffice55(); return "Opening Emerald Office."; },
                "writer": () => { openWriter55(); return "Opening Emerald Writer."; },
                "chat": () => { openChatHub55(); return "Opening Emerald Chat."; },
                "users": () => { openUsers55(); return "Opening EmeraldOS Users."; },
                "block": () => { openBlockingCenter55(); return "Opening Blocking Center."; },
                "notifications": () => { openNotificationCenter55(); return "Opening Notification Center."; },
                "bell": () => { openNotificationCenter55(); return "Opening Notification Center."; },
                "assistant": () => { openAssistant55(); return "Opening Emerald Assistant."; },
                "apps": () => { openAppManager55(); return "Opening App Manager."; },
                "app.editor": () => { openApplicationEditor55(); return "Opening Application Editor."; },
                "desktop.clean": () => { desktopClean55(); return "Desktop cleaned."; },
                "desktop.lock": () => { desktopLock55(); return "Desktop locked."; },
                "desktop.unlock": () => { desktopUnlock55(); return "Desktop unlocked."; },
                "recovery": () => { openRecovery55(); return "Opening System Recovery."; },
                "mod": () => { openModerationCenter55(); return "Opening Moderation Center."; },
                "admin": () => { openAdminPanel55(); return "Opening Administrative Panel."; }
            };
            if (map[cmd]) return map[cmd]();
            return typeof original === "function" ? original(raw) : `Unknown command: ${raw}`;
        };
    }

    function startNotificationWatch55() {
        if (bellTimer55) return;
        bellTimer55 = setInterval(async () => {
            try {
                const seen = getJSON55(LS.shareSeen, []);
                const snap = await getDocs(collection(db, COL.shares));
                const mine = userKey55x(currentUser55x());
                const nextSeen = new Set(seen);
                snap.forEach(d => {
                    const data = d.data() || {};
                    if (userKey55x(data.to || data.targetUser) === mine && !nextSeen.has(d.id)) {
                        nextSeen.add(d.id);
                        addNotification55("Document shared", `${data.owner || data.from || "A user"} shared ${data.fileName || data.fileId || "a file"} with you.`, "info", "sharing");
                    }
                });
                setJSON55(LS.shareSeen, Array.from(nextSeen).slice(-300));
            } catch {}
        }, 25000);
    }

    function exposeFeatureGlobals55() {
        Object.assign(window, {
            openFolder55Final, renderDesktop55Final, renderStart55Final,
            openNotificationCenter55, markNotificationsRead55, clearNotifications55, addNotification55,
            openBlockingCenter55, blockUser55, unblockUser55, isBlocked55, openUsers55, filterTable55,
            openApplicationEditor55, saveUserApplication55, previewUserApplication55, deleteUserApplication55, runUserApplication55, openUserApplications55,
            openAdvancedFiles55, openFiles55: openAdvancedFiles55, openStorage55, createFolder55, toggleStarFile55, moveFile55, tagFile55, fileDetails55, fileVersions55, renameFile55, deleteFileFromFiles55, restoreFile55, deleteForever55, newTextFile55,
            openSharingManager55, openFileSharing55: openSharingManager55, shareFilePrompt55, shareFileWithUser55, revokeShare55, changeSharePermission55, copyShareInfo55,
            openEmeraldOffice55, openWriter55, writerInsertTable55, writerSave55, writerPrintView55, writerExportHTML55,
            openAssistant55, askAssistant55, assistantTips55,
            openSettings55, saveSettings55, openSecurityPrivacy55, clearLocalCache55, openRecovery55, safeMode55, desktopReset55, exportLocalBackup55,
            openDesktopTools55, desktopClean55, desktopLock55, desktopUnlock55, openAppManager55,
            openAdminPanel55, openModerationCenter55, openChatHub55
        });
    }

    function setIdentity55() {
        document.title = BUILD.displayName;
        localStorage.setItem("40_build_name", BUILD.displayName);
        localStorage.setItem("40_version", BUILD.version);
        try { window.EmeraldOSRegistry?.set?.("HKEY_LOCAL_MACHINE\\System\\Build\\Version", BUILD.version); } catch {}
        const badge = document.getElementById("emerald40-build-badge");
        if (badge) badge.innerHTML = `<span class="emerald55-badge">${BUILD.displayName}</span>`;
    }

    function init55FeaturePack() {
        installFeatureStyles55();
        exposeFeatureGlobals55();
        installApps55();
        patchNotify55();
        installBell55();
        installWindowObserver55();
        installTerminalCommands55();
        setIdentity55();
        window.EMERALDOS_APP_CATEGORIES = allFolders55();
        window.renderDesktopOverride = renderDesktop55Final;
        window.renderStartMenuOverride = renderStart55Final;
        window.renderDesktop = renderDesktop55Final;
        window.renderStartMenu = renderStart55Final;
        window.openFolder55 = openFolder55Final;
        renderDesktop55Final();
        renderStart55Final();
        startNotificationWatch55();
        addNotification55("EmeraldOS 5.5 loaded", "Application Editor, Files, blocking, management tools, and the taskbar bell are active.", "success", "system");
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", () => setTimeout(init55FeaturePack, 300));
    } else {
        setTimeout(init55FeaturePack, 300);
    }
})();

/* =========================================================
   EMERALDOS 5.5 FEATURE EXTENSION
   APPLICATION EDITOR 2.0, USER APPSTORE, EAPP, FILE TYPES,
   OFFICE/CHAT/ADMIN/MODERATION POLISH
========================================================= */

(function () {
    if (window.EmeraldOS55AppstorePackLoaded) return;
    window.EmeraldOS55AppstorePackLoaded = true;

    const BUILD55 = {
        version: "5.5",
        displayName: "EmeraldOS 5.5",
        codename: "Applications, Files & Communication Update"
    };

    const LS55 = {
        userApps: "55_user_applications",
        appPermissions: "55_app_permissions",
        appstoreConsent: "55_user_appstore_risk_agreed",
        localStore: "55_local_user_appstore_cache",
        appVersions: "55_user_app_versions",
        appLibrarySettings: "55_app_library_settings",
        notifications: "55_notifications",
        fileTypes: "55_file_type_preferences",
        contacts: "55_contacts_cache",
        desktopLayout: "55_desktop_layout_settings"
    };

    const COL55 = {
        appstore: "emeraldOSAppStore",
        appstoreReports: "emeraldOSAppStoreReports",
        appstoreReviews: "emeraldOSAppStoreReviews",
        users: "emeraldOSUsers",
        shares: "emeraldOSShares",
        rooms: "emeraldOSChatRooms",
        reports: "emeraldOSChatReports",
        logs: "emeraldOSModerationLogs"
    };

    const FOLDER_PATCH55 = {
        custom: { name: "Applications", edition: "economy", apps: ["applicationEditor55", "appTemplates55", "appLibrary55", "userAppstore55", "appPermissions55", "eappInstaller55", "userApplications55"] },
        files55: { name: "Files & Types", edition: "economy", apps: ["advancedFiles55", "files55", "storage55", "fileTypes55", "openWith55", "sharing55", "sharedWithMe55", "sharedByMe55"] },
        office55: { name: "Office Suite", edition: "economy", apps: ["emeraldOffice55", "writer55", "office55Hub", "sheets55", "slides55", "forms55", "templates55"] },
        communication55: { name: "Communication", edition: "home", apps: ["chatHub55", "chatRooms55", "messageRequests55", "users55", "contacts55", "profiles55", "blockingCenter55"] },
        management55: { name: "Management", edition: "business", apps: ["notifications55", "settings55", "security55", "desktopLayout55", "recovery55", "appManager55", "assistant55"] },
        moderation55: { name: "Moderation", edition: "developer", apps: ["moderationCenter55", "modReports55", "modQueue55", "modLog55", "appstoreModeration55"] },
        admin55: { name: "Administration", edition: "executive", apps: ["adminPanel55", "adminUsers55", "adminStorage55", "adminSharing55", "adminApps55", "securityAudit55"] }
    };

    function safe55(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function now55() { return Date.now(); }

    function currentUser55() {
        return String(localStorage.getItem("40_username") || localStorage.getItem("username") || localStorage.getItem("40_session") || "Guest").trim() || "Guest";
    }

    function isExecutive55() {
        const role = String(localStorage.getItem("40_developer_role") || localStorage.getItem("role") || "").toLowerCase();
        return localStorage.getItem("40_executive_verified") === "true" || role === "admin";
    }

    function isModerator55() {
        const role = String(localStorage.getItem("40_developer_role") || localStorage.getItem("role") || "").toLowerCase();
        return isExecutive55() || (localStorage.getItem("40_developer_verified") === "true" && (role === "admin" || role === "mod"));
    }

    function canSee55(required = "economy") {
        if (required === "executive") return isExecutive55();
        if (required === "developer") return isModerator55();
        return typeof window.canSeeEdition === "function" ? window.canSeeEdition(required) : true;
    }

    function getJSON55(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
        catch { return fallback; }
    }

    function setJSON55(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function win55(title, html, app = "emerald55") {
        return window.openWindow?.(title, `<div class="emerald55-panel emerald55-feature-panel">${html}</div>`, app) || null;
    }

    function btn55(label, action, className = "") {
        return `<button class="win95-small-button emerald55-button ${className}" onclick="${action}">${safe55(label)}</button>`;
    }

    function addNotice55(title, message, type = "info", category = "system") {
        if (typeof window.addNotification55 === "function") {
            window.addNotification55(title, message, type, category);
        } else if (typeof window.notify === "function") {
            window.notify(title, message, 3600, type);
        }
    }

    function userApps55Plus() { return getJSON55(LS55.userApps, []); }
    function saveUserApps55Plus(list) { setJSON55(LS55.userApps, list); registerUserApps55Plus(); rerender55(); }

    function makeAppId55(name) {
        return "u" + String(name || "app").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) + "_" + Date.now().toString(36);
    }

    function appPerms55(id) {
        const all = getJSON55(LS55.appPermissions, {});
        return Object.assign({ notifications: true, localStorage: true, clipboard: false, links: false, username: false }, all[id] || {});
    }

    function setAppPerm55(id, key, value) {
        const all = getJSON55(LS55.appPermissions, {});
        all[id] = Object.assign({ notifications: true, localStorage: true, clipboard: false, links: false, username: false }, all[id] || {}, { [key]: !!value });
        setJSON55(LS55.appPermissions, all);
    }

    function registerApp55(id, app) {
        if (!window.APPS) window.APPS = {};
        window.APPS[id] = Object.assign({ icon: "APP", edition: "economy", category: "custom" }, app);
    }

    function registerUserApps55Plus() {
        if (!window.APPS) window.APPS = {};
        Object.keys(window.APPS).filter(id => id.startsWith("userapp55_")).forEach(id => delete window.APPS[id]);
        userApps55Plus().forEach(a => {
            window.APPS["userapp55_" + a.id] = {
                name: a.name,
                icon: a.icon || "APP",
                edition: "economy",
                category: "custom",
                launch: () => runUserApplication55Secure(a.id)
            };
        });
    }

    function installStyles55() {
        if (document.getElementById("emerald55-appstore-styles")) return;
        const style = document.createElement("style");
        style.id = "emerald55-appstore-styles";
        style.textContent = `
            .emerald55-center-risk{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:999999;}
            .emerald55-risk-window{width:min(560px,92vw);background:#c0c0c0;border:2px solid;border-color:#fff #404040 #404040 #fff;box-shadow:4px 4px 0 #000;font-family:"MS Sans Serif",Tahoma,Arial,sans-serif;}
            .emerald55-risk-title{background:#000080;color:#fff;font-weight:bold;padding:5px 8px;}
            .emerald55-risk-body{padding:16px;font-size:13px;line-height:1.35;}
            .emerald55-danger-box{background:#ffd6d6;border:2px inset #fff;padding:10px;margin:8px 0;font-weight:bold;text-align:center;}
            .emerald55-market-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:8px;}
            .emerald55-market-card{background:#c0c0c0;border:2px solid;border-color:#fff #808080 #808080 #fff;padding:8px;min-height:135px;}
            .emerald55-editor-tabs button{margin-right:3px;}
            .emerald55-split{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
            @media(max-width:760px){.emerald55-split{grid-template-columns:1fr;}}
            .emerald55-code-preview{font-family:Consolas,"Courier New",monospace;white-space:pre-wrap;background:#fff;border:2px inset #fff;padding:8px;max-height:280px;overflow:auto;}
            .emerald55-library-badge{display:inline-block;padding:2px 5px;border:1px solid #808080;background:#fff;margin:2px;}
        `;
        document.head.appendChild(style);
    }

    function rerender55() {
        setTimeout(() => {
            registerUserApps55Plus();
            if (typeof window.renderDesktop === "function") window.renderDesktop();
            if (typeof window.renderStartMenu === "function") window.renderStartMenu();
        }, 50);
    }

    function mergedFolders55() {
        const base = Object.assign({}, window.EMERALDOS_APP_CATEGORIES || {});
        Object.entries(FOLDER_PATCH55).forEach(([id, folder]) => {
            const existing = base[id] || { name: folder.name, edition: folder.edition, apps: [] };
            const apps = Array.from(new Set([...(existing.apps || []), ...(folder.apps || [])]));
            base[id] = Object.assign({}, existing, folder, { apps });
        });
        const custom = base.custom || { name: "Applications", edition: "economy", apps: [] };
        const userAppIds = userApps55Plus().map(a => "userapp55_" + a.id);
        custom.apps = Array.from(new Set([...(custom.apps || []), ...userAppIds]));
        custom.name = "Applications";
        base.custom = custom;
        return base;
    }

    function appVisible55(id) {
        const app = window.APPS?.[id];
        return !!app && canSee55(app.edition || "economy");
    }

    function folderVisible55(folder) {
        if (!canSee55(folder.edition || "economy")) return false;
        return (folder.apps || []).some(appVisible55);
    }

    function openFolder55Plus(id) {
        const folder = mergedFolders55()[id];
        if (!folder) return;
        const tiles = (folder.apps || []).filter(appVisible55).map(appId => {
            const app = window.APPS[appId];
            return `<div class="emerald55-market-card" onclick="launchApp('${safe55(appId)}')"><h3>${safe55(app.icon || "APP")} ${safe55(app.name)}</h3><div class="emerald55-note">Edition: ${safe55(app.edition || "economy")}</div><div class="emerald55-note">Category: ${safe55(app.category || "general")}</div></div>`;
        }).join("") || `<div class="emerald55-inset2">No applications available.</div>`;
        win55(folder.name, `<h2>${safe55(folder.name)}</h2><div class="emerald55-market-grid">${tiles}</div>`, "folder55");
    }

    function renderDesktop55Plus() {
        registerUserApps55Plus();
        const desktop = document.getElementById("desktop");
        if (!desktop) return;
        desktop.innerHTML = "";
        Object.entries(mergedFolders55()).forEach(([id, folder]) => {
            if (!folderVisible55(folder)) return;
            const icon = document.createElement("div");
            icon.className = "emerald55-folder-icon desktop-folder-icon";
            icon.tabIndex = -1;
            icon.innerHTML = `<div class="emerald55-folder-symbol">${safe55(folder.name.split(" ")[0].slice(0,6).toUpperCase())}</div><div class="emerald55-folder-label">${safe55(folder.name)}</div>`;
            icon.ondblclick = () => openFolder55Plus(id);
            icon.onclick = () => setTimeout(() => icon.blur(), 0);
            desktop.appendChild(icon);
        });
    }

    function renderStart55Plus() {
        const results = document.getElementById("start-results");
        if (!results) return;
        const search = document.getElementById("start-search");
        const query = String(search?.value || "").toLowerCase();
        const folderItems = Object.entries(mergedFolders55())
            .filter(([,f]) => folderVisible55(f))
            .filter(([,f]) => !query || f.name.toLowerCase().includes(query))
            .map(([id,f]) => `<div class="start-item" onclick="openFolder55Plus('${safe55(id)}')">${safe55(f.name)}</div>`).join("");
        const appItems = Object.entries(window.APPS || {})
            .filter(([id,app]) => appVisible55(id) && (!query || String(app.name).toLowerCase().includes(query)))
            .slice(0,180)
            .map(([id,app]) => `<div class="start-item" onclick="launchApp('${safe55(id)}')">${safe55(app.name)}</div>`).join("");
        results.innerHTML = folderItems + (query ? appItems : "");
        if (search && !search.dataset.emerald55PlusSearch) {
            search.dataset.emerald55PlusSearch = "true";
            search.addEventListener("input", renderStart55Plus);
        }
    }

    /* =====================================================
       USER APPSTORE WITH REQUIRED RISK AGREEMENT
    ===================================================== */

    function showAppstoreRisk55() {
        const existing = document.getElementById("emerald55RiskModal");
        if (existing) existing.remove();
        const modal = document.createElement("div");
        modal.id = "emerald55RiskModal";
        modal.className = "emerald55-center-risk";
        modal.innerHTML = `
            <div class="emerald55-risk-window">
                <div class="emerald55-risk-title">User Appstore Warning</div>
                <div class="emerald55-risk-body">
                    <div class="emerald55-danger-box">Warning! By using this feature, you expose yourself to risk of infection. Use at your own risk.</div>
                    <p>User Appstore applications are created by users. EmeraldOS runs them in a restricted application frame, but you should only install applications you trust.</p>
                    <div style="text-align:right;margin-top:12px;">
                        <button class="win95-small-button" onclick="document.getElementById('emerald55RiskModal').remove()">Cancel</button>
                        <button class="win95-small-button" onclick="localStorage.setItem('${LS55.appstoreConsent}','true');document.getElementById('emerald55RiskModal').remove();openUserAppstore55(true)">Agree</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(modal);
    }

    async function appstoreDocs55() {
        const docs = [];
        try {
            const snap = await getDocs(collection(db, COL55.appstore));
            snap.forEach(d => docs.push(Object.assign({ storeId: d.id }, d.data() || {})));
        } catch (err) {
            console.warn("User Appstore Firestore unavailable, using local cache.", err);
        }
        const local = getJSON55(LS55.localStore, []);
        const byId = new Map();
        [...docs, ...local].forEach(a => byId.set(a.storeId || a.id, a));
        return Array.from(byId.values()).sort((a,b) => Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0));
    }

    async function openUserAppstore55(force = false) {
        if (!force && localStorage.getItem(LS55.appstoreConsent) !== "true") {
            showAppstoreRisk55();
            return;
        }
        win55("User Appstore", `<h2>User Appstore</h2><div class="emerald55-warn">Loading community applications...</div>`, "userAppstore55");
        const apps = await appstoreDocs55();
        const rows = apps.map(a => `
            <div class="emerald55-market-card">
                <h3>${safe55(a.icon || "APP")} ${safe55(a.name || "Untitled App")}</h3>
                <p>${safe55(a.description || "No description provided.")}</p>
                <div><span class="emerald55-library-badge">Publisher: ${safe55(a.publisher || "Unknown")}</span><span class="emerald55-library-badge">Category: ${safe55(a.category || "General")}</span><span class="emerald55-library-badge">Downloads: ${safe55(a.downloads || 0)}</span></div>
                <div class="emerald55-toolbar2">
                    ${btn55("Install", `installStoreApp55('${safe55(a.storeId || a.id)}')`)}
                    ${btn55("View Code", `viewStoreAppCode55('${safe55(a.storeId || a.id)}')`)}
                    ${btn55("Report", `reportStoreApp55('${safe55(a.storeId || a.id)}')`, "danger")}
                </div>
            </div>`).join("") || `<div class="emerald55-inset2">No shared applications found yet.</div>`;
        const html = `
            <h2>User Appstore</h2>
            <div class="emerald55-danger-box">Warning! By using this feature, you expose yourself to risk of infection. Use at your own risk.</div>
            <div class="emerald55-toolbar2">
                ${btn55("Refresh", "openUserAppstore55(true)")}
                ${btn55("Publish My App", "openPublishApp55()")}
                ${btn55("Installed Apps", "openAppLibrary55()")}
                ${btn55("Application Editor", "openApplicationEditor55()")}
            </div>
            <div class="emerald55-market-grid">${rows}</div>`;
        win55("User Appstore", html, "userAppstore55");
    }

    async function getStoreApp55(storeId) {
        const apps = await appstoreDocs55();
        return apps.find(a => String(a.storeId || a.id) === String(storeId));
    }

    async function installStoreApp55(storeId) {
        const app = await getStoreApp55(storeId);
        if (!app) return alert("Application not found.");
        if (!confirm("Install this user-created application? Only install applications you trust.")) return;
        const id = makeAppId55(app.name || "Store Application");
        const record = {
            id,
            name: app.name || "Store Application",
            icon: app.icon || "APP",
            code: app.code || "api.write('<h1>Empty application</h1>');",
            description: app.description || "Installed from User Appstore.",
            source: "User Appstore",
            sourceStoreId: storeId,
            publisher: app.publisher || "Unknown",
            installedAt: now55(),
            updatedAt: now55()
        };
        const list = userApps55Plus();
        list.push(record);
        saveUserApps55Plus(list);
        try {
            if (app.storeId) await updateDoc(doc(db, COL55.appstore, app.storeId), { downloads: Number(app.downloads || 0) + 1, lastDownloadedAt: now55() });
        } catch {}
        addNotice55("Application installed", `${record.name} was installed into User Applications.`, "success", "appstore");
        openAppLibrary55();
    }

    async function viewStoreAppCode55(storeId) {
        const app = await getStoreApp55(storeId);
        if (!app) return alert("Application not found.");
        win55("App Code Review", `<h2>${safe55(app.name || "Application")}</h2><div class="emerald55-danger-box">Review user application code before installing.</div><pre class="emerald55-code-preview">${safe55(app.code || "")}</pre><div class="emerald55-toolbar2">${btn55("Install", `installStoreApp55('${safe55(storeId)}')`)}</div>`, "appCode55");
    }

    async function reportStoreApp55(storeId) {
        const reason = prompt("Why are you reporting this application?");
        if (!reason) return;
        try {
            await addDoc(collection(db, COL55.appstoreReports), { storeId, reason, reporter: currentUser55(), createdAt: now55(), status: "open" });
        } catch {
            const reports = getJSON55("55_local_appstore_reports", []);
            reports.push({ storeId, reason, reporter: currentUser55(), createdAt: now55(), status: "open" });
            setJSON55("55_local_appstore_reports", reports);
        }
        addNotice55("Application reported", "The report was submitted for review.", "info", "appstore");
    }

    function openPublishApp55() {
        const apps = userApps55Plus();
        const options = apps.map(a => `<option value="${safe55(a.id)}">${safe55(a.name)}</option>`).join("");
        win55("Publish Application", `
            <h2>Publish to User Appstore</h2>
            <div class="emerald55-danger-box">Warning! By using this feature, you expose yourself to risk of infection. Use at your own risk.</div>
            <label>Select App</label><br><select id="publish55App" style="width:100%">${options}</select><br><br>
            <label>Description</label><textarea id="publish55Description" placeholder="Explain what your app does."></textarea>
            <label>Category</label><br><input id="publish55Category" style="width:100%" value="Productivity"><br><br>
            <div class="emerald55-toolbar2">${btn55("Publish", "publishSelectedApp55()")}${btn55("Create App", "openApplicationEditor55()")}</div>
        `, "publish55");
    }

    async function publishSelectedApp55() {
        const id = document.getElementById("publish55App")?.value;
        const app = userApps55Plus().find(a => a.id === id);
        if (!app) return alert("Choose an application first.");
        const record = {
            name: app.name,
            icon: app.icon || "APP",
            code: app.code || "",
            description: document.getElementById("publish55Description")?.value || "No description provided.",
            category: document.getElementById("publish55Category")?.value || "General",
            publisher: currentUser55(),
            createdAt: now55(),
            updatedAt: now55(),
            downloads: 0,
            version: "1.0"
        };
        try {
            await addDoc(collection(db, COL55.appstore), record);
            addNotice55("Application published", `${app.name} was published to the User Appstore.`, "success", "appstore");
        } catch (err) {
            const local = getJSON55(LS55.localStore, []);
            local.unshift(Object.assign({ storeId: "local_" + makeAppId55(app.name) }, record));
            setJSON55(LS55.localStore, local.slice(0, 100));
            addNotice55("Application saved locally", "Firestore publishing was unavailable, so the app was saved to the local Appstore cache.", "warning", "appstore");
        }
        openUserAppstore55(true);
    }

    /* =====================================================
       APPLICATION EDITOR 2.0, EAPP, LIBRARY, PERMISSIONS
    ===================================================== */

    const TEMPLATES55 = {
        blank: `api.setTitle('Blank App');\napi.write('<h1>Blank Application</h1><p>Start building here.</p>');`,
        dashboard: `api.setTitle('Dashboard');\napi.write('<h1>Dashboard</h1><div id="stats"></div>');\napi.append('<p>Status: Ready</p>');\napi.button('Notify',()=>api.notify('Dashboard','Dashboard action completed.'));`,
        notes: `api.setTitle('Notes App');\napi.write('<h1>Notes</h1><textarea id="note" style="width:100%;height:180px"></textarea><br>');\napi.button('Save Local Note',()=>api.storeSet('note',document.getElementById('note').value));\napi.button('Load Local Note',async()=>{document.getElementById('note').value=await api.storeGet('note')||''});`,
        form: `api.setTitle('Form App');\napi.write('<h1>Form</h1><p>Name</p><input id="name"><p>Request</p><textarea id="request"></textarea><br>');\napi.button('Submit',()=>api.notify('Form submitted',document.getElementById('name').value+' submitted a request.'));`,
        calculator: `api.setTitle('Calculator');\napi.write('<h1>Mini Calculator</h1><input id="a" value="0"> + <input id="b" value="0"><p id="out"></p>');\napi.button('Add',()=>{out.textContent=Number(a.value)+Number(b.value)});`,
        project: `api.setTitle('Project Tracker');\napi.write('<h1>Project Tracker</h1><input id="task" placeholder="Task"><button id="add">Add</button><ul id="list"></ul>');\ndocument.getElementById('add').onclick=()=>{const li=document.createElement('li');li.textContent=document.getElementById('task').value||'Untitled task';document.getElementById('list').appendChild(li);};`
    };

    function openAppTemplates55() {
        const rows = Object.entries(TEMPLATES55).map(([id, code]) => `<div class="emerald55-market-card"><h3>${safe55(id.toUpperCase())} Template</h3><p>Start a new custom application from this template.</p>${btn55("Use Template", `newAppFromTemplate55('${safe55(id)}')`)}</div>`).join("");
        win55("Application Templates", `<h2>Application Templates</h2><div class="emerald55-market-grid">${rows}</div>`, "templates55");
    }

    function newAppFromTemplate55(id) {
        const code = TEMPLATES55[id] || TEMPLATES55.blank;
        if (typeof window.openApplicationEditor55 === "function") {
            window.openApplicationEditor55();
            setTimeout(() => {
                const name = document.getElementById("appEditor55Name");
                const icon = document.getElementById("appEditor55Icon");
                const area = document.getElementById("appEditor55Code");
                if (name) name.value = id.charAt(0).toUpperCase() + id.slice(1) + " App";
                if (icon) icon.value = "APP";
                if (area) area.value = code;
            }, 150);
        } else {
            alert("Application Editor is not loaded yet.");
        }
    }

    function openAppLibrary55() {
        registerUserApps55Plus();
        const rows = userApps55Plus().map(a => `<tr><td><b>${safe55(a.name)}</b><br><span class="emerald55-note">${safe55(a.id)}</span></td><td>${safe55(a.icon || "APP")}</td><td>${safe55(a.source || "Local")}</td><td>${safe55(new Date(a.updatedAt || a.installedAt || now55()).toLocaleString())}</td><td>${btn55("Run", `runUserApplication55('${safe55(a.id)}')`)} ${btn55("Edit", `openApplicationEditor55('${safe55(a.id)}')`)} ${btn55("Permissions", `openAppPermissions55('${safe55(a.id)}')`)} ${btn55("Export .eapp", `exportEapp55('${safe55(a.id)}')`)} ${btn55("Publish", `openPublishApp55('${safe55(a.id)}')`)}</td></tr>`).join("") || `<tr><td colspan="5">No installed custom applications.</td></tr>`;
        win55("Emerald App Library", `<h2>Emerald App Library</h2><div class="emerald55-toolbar2">${btn55("Create App", "openApplicationEditor55()")}${btn55("Templates", "openAppTemplates55()")}${btn55("User Appstore", "openUserAppstore55()")}${btn55("Install .eapp", "openEappInstaller55()")}</div><table class="emerald55-table2"><tr><th>Application</th><th>Icon</th><th>Source</th><th>Updated</th><th>Actions</th></tr>${rows}</table>`, "appLibrary55");
    }

    function openAppPermissions55(appId = "") {
        const apps = userApps55Plus();
        const app = apps.find(a => a.id === appId) || apps[0];
        if (!app) return win55("App Permissions", `<h2>App Permissions</h2><p>No custom applications installed.</p>`, "appPerms55");
        const p = appPerms55(app.id);
        const row = key => `<label><input type="checkbox" id="perm55_${key}" ${p[key] ? "checked" : ""}> ${safe55(key)}</label><br>`;
        const opts = apps.map(a => `<option value="${safe55(a.id)}" ${a.id === app.id ? "selected" : ""}>${safe55(a.name)}</option>`).join("");
        win55("App Permissions", `<h2>App Permissions</h2><select id="perm55App" onchange="openAppPermissions55(this.value)" style="width:100%">${opts}</select><div class="emerald55-card2"><h3>${safe55(app.name)}</h3>${row("notifications")}${row("localStorage")}${row("clipboard")}${row("links")}${row("username")}</div><div class="emerald55-toolbar2">${btn55("Save Permissions", `saveAppPermissions55('${safe55(app.id)}')`)}${btn55("Run App", `runUserApplication55('${safe55(app.id)}')`)}</div>`, "appPerms55");
    }

    function saveAppPermissions55(appId) {
        ["notifications", "localStorage", "clipboard", "links", "username"].forEach(key => setAppPerm55(appId, key, !!document.getElementById("perm55_" + key)?.checked));
        addNotice55("Permissions saved", "Application permissions were updated.", "success", "applications");
        openAppPermissions55(appId);
    }

    function exportEapp55(appId) {
        const app = userApps55Plus().find(a => a.id === appId);
        if (!app) return alert("Application not found.");
        const eapp = {
            type: "EmeraldOS Application",
            format: ".eapp",
            version: "1.0",
            exportedAt: new Date().toISOString(),
            app: { name: app.name, icon: app.icon || "APP", code: app.code || "", description: app.description || "" }
        };
        const blob = new Blob([JSON.stringify(eapp, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = String(app.name || "application").replace(/[^a-z0-9_-]+/gi, "_") + ".eapp";
        a.click();
        URL.revokeObjectURL(a.href);
    }

    function openEappInstaller55() {
        win55("Install .eapp", `<h2>Install .eapp</h2><div class="emerald55-danger-box">Install only .eapp packages from sources you trust.</div><textarea id="eapp55Text" class="emerald55-codearea" placeholder="Paste .eapp JSON here"></textarea><div class="emerald55-toolbar2">${btn55("Install", "installEappFromText55()")}${btn55("App Library", "openAppLibrary55()")}</div>`, "eapp55");
    }

    function installEappFromText55() {
        let parsed;
        try { parsed = JSON.parse(document.getElementById("eapp55Text")?.value || "{}"); }
        catch { return alert("Invalid .eapp JSON."); }
        const app = parsed.app || parsed;
        if (!app.code || !app.name) return alert("This .eapp does not contain a valid app name and code.");
        const record = { id: makeAppId55(app.name), name: app.name, icon: app.icon || "APP", code: app.code, description: app.description || "Installed from .eapp.", source: ".eapp", installedAt: now55(), updatedAt: now55() };
        const list = userApps55Plus();
        list.push(record);
        saveUserApps55Plus(list);
        addNotice55("Application installed", `${record.name} was installed from .eapp.`, "success", "applications");
        openAppLibrary55();
    }

    function runUserApplication55Secure(appId) {
        const app = userApps55Plus().find(a => a.id === appId);
        if (!app) return alert("Application not found.");
        const perms = appPerms55(app.id);
        const frameId = "frame55x_" + Math.random().toString(36).slice(2);
        win55(app.name || "User Application", `<iframe id="${frameId}" class="emerald55-app-frame" sandbox="allow-scripts allow-forms allow-modals"></iframe>`, "userapp55");
        setTimeout(() => {
            const frame = document.getElementById(frameId);
            if (!frame) return;
            const code = String(app.code || "");
            const appIdSafe = String(app.id);
            const title = String(app.name || "User Application");
            const src = `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Tahoma,Arial,sans-serif;margin:0;padding:10px;background:#fff;color:#000}button{margin:3px;padding:4px 8px}.bar{background:#c0c0c0;border:2px solid;border-color:#fff #808080 #808080 #fff;padding:6px;margin-bottom:8px}.out{padding:8px}input,textarea,select{font:12px Tahoma,Arial,sans-serif;border:2px inset #fff;padding:3px}</style></head><body><div class="bar"><b id="title"></b></div><div id="app" class="out"></div><script>const app=document.getElementById('app');const appId=${JSON.stringify(appIdSafe)};function req(action,payload){parent.postMessage(Object.assign({type:'emerald55_app_event',appId,action},payload||{}),'*');}const api={setTitle:t=>{document.getElementById('title').textContent=String(t||'');},write:h=>{app.innerHTML=String(h||'');},append:h=>{app.insertAdjacentHTML('beforeend',String(h||''));},text:t=>{app.textContent=String(t||'');},button:(label,fn)=>{const b=document.createElement('button');b.textContent=label;b.onclick=fn;app.appendChild(b);return b;},notify:(title,message)=>req('notify',{title:String(title||'App'),message:String(message||'')}),storeSet:(k,v)=>req('storeSet',{key:String(k||''),value:String(v||'')}),storeGet:(k)=>new Promise(resolve=>{const token=Math.random().toString(36).slice(2);function on(e){if(e.data&&e.data.type==='emerald55_app_response'&&e.data.token===token){removeEventListener('message',on);resolve(e.data.value||'');}}addEventListener('message',on);req('storeGet',{key:String(k||''),token});}),copy:t=>req('copy',{text:String(t||'')}),openLink:url=>req('openLink',{url:String(url||'')}),getUsername:()=>${perms.username ? JSON.stringify(currentUser55()) : "''"}};try{api.setTitle(${JSON.stringify(title)});new Function('api',${JSON.stringify(code)})(api);}catch(err){app.innerHTML='<pre style="color:#800000;white-space:pre-wrap"></pre>';app.querySelector('pre').textContent='Application error: '+err.message;}<\/script></body></html>`;
            frame.srcdoc = src;
        }, 80);
    }

    window.addEventListener("message", ev => {
        const data = ev.data || {};
        if (data.type !== "emerald55_app_event") return;
        const perms = appPerms55(data.appId);
        const storeKey = "55_app_store_" + data.appId;
        if (data.action === "notify") {
            if (!perms.notifications) return addNotice55("Notification blocked", "This application does not have notification permission.", "warning", "applications");
            addNotice55(data.title || "Application", data.message || "", "info", "application");
        }
        if (data.action === "storeSet") {
            if (!perms.localStorage) return;
            const obj = getJSON55(storeKey, {}); obj[data.key] = data.value; setJSON55(storeKey, obj);
        }
        if (data.action === "storeGet") {
            const obj = perms.localStorage ? getJSON55(storeKey, {}) : {};
            ev.source?.postMessage({ type: "emerald55_app_response", token: data.token, value: obj[data.key] || "" }, "*");
        }
        if (data.action === "copy") {
            if (!perms.clipboard) return addNotice55("Clipboard blocked", "This application does not have clipboard permission.", "warning", "applications");
            navigator.clipboard?.writeText(String(data.text || ""));
        }
        if (data.action === "openLink") {
            if (!perms.links) return addNotice55("Link blocked", "This application does not have link permission.", "warning", "applications");
            window.open(String(data.url || ""), "_blank", "noopener");
        }
    });

    /* =====================================================
       FILE TYPES, OFFICE, COMMUNICATION, MANAGEMENT HUBS
    ===================================================== */

    function openFileTypes55() {
        const types = [
            [".edoc", "Emerald document", "Emerald Writer"], [".esheet", "Emerald spreadsheet", "Emerald Sheets"],
            [".eslide", "Emerald presentation", "Emerald Slides"], [".enote", "Emerald note", "Notes"],
            [".eapp", "Emerald application package", "Application Installer"], [".etask", "Emerald task board", "Task Board"],
            [".eform", "Emerald form", "Emerald Forms"]
        ];
        const rows = types.map(t => `<tr><td><b>${safe55(t[0])}</b></td><td>${safe55(t[1])}</td><td>${safe55(t[2])}</td></tr>`).join("");
        win55("File Types", `<h2>Real File Types</h2><p>EmeraldOS 5.5 uses clear file-type labels so Files can open content in the correct app.</p><table class="emerald55-table2"><tr><th>Extension</th><th>Type</th><th>Default App</th></tr>${rows}</table><div class="emerald55-toolbar2">${btn55("Install .eapp", "openEappInstaller55()")}${btn55("Open Files", "openAdvancedFiles55 ? openAdvancedFiles55() : openFiles55()")}</div>`, "fileTypes55");
    }

    function openOpenWith55() {
        win55("Open With", `<h2>Open With</h2><p>This panel explains the default file handlers used by Files.</p><div class="emerald55-grid-tight"><div class="emerald55-card2"><h3>Documents</h3><p>.edoc, .txt, .html, .md open with Emerald Writer.</p></div><div class="emerald55-card2"><h3>Applications</h3><p>.eapp opens with the Application Installer.</p></div><div class="emerald55-card2"><h3>Spreadsheets</h3><p>.esheet and .csv open with Emerald Sheets.</p></div><div class="emerald55-card2"><h3>Presentations</h3><p>.eslide opens with Emerald Slides.</p></div></div>`, "openWith55");
    }

    function openOffice55Hub() {
        win55("Emerald Office 5.5", `<h2>Emerald Office 5.5</h2><div class="emerald55-grid-tight"><div class="emerald55-card2"><h3>Writer</h3><p>Page layout, tables, export, print view and .edoc planning.</p>${btn55("Open Writer", "openWriter55()")}</div><div class="emerald55-card2"><h3>Sheets</h3><p>Basic formulas, CSV planning and row/column tools.</p>${btn55("Open Sheets", "openSheets55 ? openSheets55() : openEmeraldOffice55()")}</div><div class="emerald55-card2"><h3>Slides</h3><p>Multiple slide planning, themes and presentation tools.</p>${btn55("Open Slides", "openSlides55 ? openSlides55() : openEmeraldOffice55()")}</div><div class="emerald55-card2"><h3>Forms</h3><p>Basic form builder and response tracking.</p>${btn55("Open Forms", "openForms55 ? openForms55() : openEmeraldOffice55()")}</div></div>`, "office55");
    }

    function openMessageRequests55() {
        win55("Message Requests", `<h2>Message Requests</h2><p>Message requests help separate new conversations from known contacts.</p><div class="emerald55-inset2">No pending message requests are stored locally. Connected chat rooms will appear here when Firestore rules allow access.</div><div class="emerald55-toolbar2">${btn55("Open Chat", "openChatHub55()")}${btn55("Contacts", "openContacts55 ? openContacts55() : openUsers55()")}</div>`, "messageRequests55");
    }

    async function openProfiles55() {
        let users = [];
        try {
            const snap = await getDocs(collection(db, COL55.users));
            snap.forEach(d => users.push(Object.assign({ id: d.id }, d.data() || {})));
        } catch {}
        const rows = users.map(u => `<tr><td><b>${safe55(u.displayName || u.username || u.id)}</b><br><span class="emerald55-note">${safe55(u.username || u.id)}</span></td><td>${safe55(u.status || "Available")}</td><td>${safe55(u.role || "user")}</td><td>${btn55("Chat", `startDM55 ? startDM55('${safe55(u.username || u.id)}') : openChatHub55()`)} ${btn55("Share", `shareToUserPrompt55 ? shareToUserPrompt55('${safe55(u.username || u.id)}') : openSharingManager55()`)} </td></tr>`).join("") || `<tr><td colspan="4">No profiles found.</td></tr>`;
        win55("User Profiles", `<h2>User Profiles</h2><table class="emerald55-table2"><tr><th>User</th><th>Status</th><th>Role</th><th>Actions</th></tr>${rows}</table>`, "profiles55");
    }

    function openDesktopLayout55() {
        const settings = getJSON55(LS55.desktopLayout, { locked: false, autoAlign: true, sort: "category", cloudSync: false });
        win55("Desktop Layout", `<h2>Desktop Layout 2.0</h2><label><input id="desk55Locked" type="checkbox" ${settings.locked ? "checked" : ""}> Lock desktop layout</label><br><label><input id="desk55Auto" type="checkbox" ${settings.autoAlign ? "checked" : ""}> Auto-align icons</label><br><label>Sort mode</label><br><select id="desk55Sort"><option ${settings.sort === "category" ? "selected" : ""}>category</option><option ${settings.sort === "name" ? "selected" : ""}>name</option></select><br><br><label><input id="desk55Cloud" type="checkbox" ${settings.cloudSync ? "checked" : ""}> Save layout preference to cloud when available</label><div class="emerald55-toolbar2">${btn55("Save", "saveDesktopLayout55()")}${btn55("Clean Desktop", "desktopClean55 ? desktopClean55() : renderDesktop55Plus()")}${btn55("Reset", "desktopReset55 ? desktopReset55() : renderDesktop55Plus()")}</div>`, "desktop55");
    }

    function saveDesktopLayout55() {
        setJSON55(LS55.desktopLayout, { locked: !!document.getElementById("desk55Locked")?.checked, autoAlign: !!document.getElementById("desk55Auto")?.checked, sort: document.getElementById("desk55Sort")?.value || "category", cloudSync: !!document.getElementById("desk55Cloud")?.checked });
        addNotice55("Desktop layout saved", "Desktop layout preferences were saved.", "success", "desktop");
    }

    function openAppstoreModeration55() {
        if (!isModerator55()) return alert("Moderator access required.");
        const localReports = getJSON55("55_local_appstore_reports", []);
        const rows = localReports.map(r => `<tr><td>${safe55(r.storeId)}</td><td>${safe55(r.reason)}</td><td>${safe55(r.reporter)}</td><td>${safe55(new Date(r.createdAt).toLocaleString())}</td></tr>`).join("") || `<tr><td colspan="4">No local Appstore reports.</td></tr>`;
        win55("Appstore Moderation", `<h2>Appstore Moderation</h2><p>Review user-created application reports. Firestore report review appears when database rules allow moderator access.</p><table class="emerald55-table2"><tr><th>App</th><th>Reason</th><th>Reporter</th><th>Time</th></tr>${rows}</table>`, "appstoreMod55");
    }

    function openAdminApps55() {
        if (!isExecutive55()) return alert("Executive access required.");
        win55("Application Administration", `<h2>Application Administration</h2><p>Executive application governance tools.</p><div class="emerald55-grid-tight"><div class="emerald55-card2"><h3>User Appstore</h3><p>Review published user applications and reports.</p>${btn55("Open Appstore", "openUserAppstore55(true)")}${btn55("Moderation", "openAppstoreModeration55()")}</div><div class="emerald55-card2"><h3>Installed Local Apps</h3><p>Review local custom applications installed on this device.</p>${btn55("Open App Library", "openAppLibrary55()")}</div><div class="emerald55-card2"><h3>Permissions</h3><p>Control custom application permissions.</p>${btn55("Open Permissions", "openAppPermissions55()")}</div></div>`, "adminApps55");
    }

    /* =====================================================
       INSTALL APPS, COMMANDS, GLOBALS
    ===================================================== */

    function installApps55() {
        registerApp55("userAppstore55", { name: "User Appstore", icon: "STORE", edition: "economy", category: "custom", launch: () => openUserAppstore55() });
        registerApp55("appLibrary55", { name: "Emerald App Library", icon: "LIB", edition: "economy", category: "custom", launch: () => openAppLibrary55() });
        registerApp55("appTemplates55", { name: "Application Templates", icon: "TPL", edition: "economy", category: "custom", launch: () => openAppTemplates55() });
        registerApp55("appPermissions55", { name: "App Permissions", icon: "PERM", edition: "economy", category: "custom", launch: () => openAppPermissions55() });
        registerApp55("eappInstaller55", { name: ".eapp Installer", icon: "EAPP", edition: "economy", category: "custom", launch: () => openEappInstaller55() });
        registerApp55("fileTypes55", { name: "File Types", icon: "TYPE", edition: "economy", category: "files", launch: () => openFileTypes55() });
        registerApp55("openWith55", { name: "Open With", icon: "OPEN", edition: "economy", category: "files", launch: () => openOpenWith55() });
        registerApp55("office55Hub", { name: "Office 5.5 Hub", icon: "OFFICE", edition: "economy", category: "office", launch: () => openOffice55Hub() });
        registerApp55("messageRequests55", { name: "Message Requests", icon: "REQ", edition: "home", category: "communication", launch: () => openMessageRequests55() });
        registerApp55("profiles55", { name: "User Profiles", icon: "PROFILE", edition: "home", category: "people", launch: () => openProfiles55() });
        registerApp55("desktopLayout55", { name: "Desktop Layout", icon: "DESK", edition: "economy", category: "system", launch: () => openDesktopLayout55() });
        registerApp55("appstoreModeration55", { name: "Appstore Moderation", icon: "MODAPP", edition: "developer", category: "moderation", launch: () => openAppstoreModeration55() });
        registerApp55("adminApps55", { name: "Application Administration", icon: "ADMIN", edition: "executive", category: "admin", launch: () => openAdminApps55() });
        registerUserApps55Plus();
    }

    function installCommands55() {
        const original = window.runTerminalCommand;
        window.runTerminalCommand = function(raw) {
            const cmd = String(raw || "").trim().toLowerCase();
            const map = {
                "version": () => "EmeraldOS 5.5 - Applications, Files & Communication Update",
                "build": () => "EmeraldOS 5.5 - Applications, Files & Communication Update",
                "appstore": () => { openUserAppstore55(); return "Opening User Appstore."; },
                "store": () => { openUserAppstore55(); return "Opening User Appstore."; },
                "app.library": () => { openAppLibrary55(); return "Opening Emerald App Library."; },
                "app.templates": () => { openAppTemplates55(); return "Opening Application Templates."; },
                "app.permissions": () => { openAppPermissions55(); return "Opening App Permissions."; },
                "eapp": () => { openEappInstaller55(); return "Opening .eapp Installer."; },
                "file.types": () => { openFileTypes55(); return "Opening File Types."; },
                "open.with": () => { openOpenWith55(); return "Opening Open With."; },
                "office55": () => { openOffice55Hub(); return "Opening Office 5.5 Hub."; },
                "profiles": () => { openProfiles55(); return "Opening User Profiles."; },
                "requests": () => { openMessageRequests55(); return "Opening Message Requests."; },
                "desktop.layout": () => { openDesktopLayout55(); return "Opening Desktop Layout."; },
                "admin.apps": () => { openAdminApps55(); return "Opening Application Administration."; }
            };
            if (map[cmd]) return map[cmd]();
            return typeof original === "function" ? original(raw) : `Unknown command: ${raw}`;
        };
    }

    function expose55() {
        Object.assign(window, {
            openUserAppstore55, showAppstoreRisk55, openPublishApp55, publishSelectedApp55, installStoreApp55, viewStoreAppCode55, reportStoreApp55,
            openAppLibrary55, openAppTemplates55, newAppFromTemplate55, openAppPermissions55, saveAppPermissions55, exportEapp55, openEappInstaller55, installEappFromText55,
            runUserApplication55: runUserApplication55Secure, runUserApplication55Secure,
            openFileTypes55, openOpenWith55, openOffice55Hub, openMessageRequests55, openProfiles55, openDesktopLayout55, saveDesktopLayout55,
            openAppstoreModeration55, openAdminApps55, openFolder55Plus, renderDesktop55Plus, renderStart55Plus
        });
    }

    function setBuild55() {
        document.title = BUILD55.displayName;
        localStorage.setItem("40_build_name", BUILD55.displayName);
        localStorage.setItem("40_version", BUILD55.version);
        const badge = document.getElementById("emerald40-build-badge");
        if (badge) badge.innerHTML = `<span class="emerald55-badge">${BUILD55.displayName}</span>`;
        try { window.EmeraldOSRegistry?.set?.("HKEY_LOCAL_MACHINE\\System\\Build\\Version", BUILD55.version); } catch {}
    }

    function init55() {
        installStyles55();
        expose55();
        installApps55();
        installCommands55();
        setBuild55();
        window.EMERALDOS_APP_CATEGORIES = mergedFolders55();
        window.renderDesktop = renderDesktop55Plus;
        window.renderStartMenu = renderStart55Plus;
        window.openFolder55Plus = openFolder55Plus;
        renderDesktop55Plus();
        renderStart55Plus();
        addNotice55("EmeraldOS 5.5 loaded", "User Appstore, Application Editor 2.0, .eapp support, file types, and management features are active.", "success", "system");
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", () => setTimeout(init55, 700));
    } else {
        setTimeout(init55, 700);
    }
})();
