"use strict";

/* =========================================================
   EMERALDOS 5.4
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
    if (window.EmeraldOS54Loaded) return;
    window.EmeraldOS54Loaded = true;

    const BUILD = {
        product: "EmeraldOS",
        version: "5.4",
        displayName: "EmeraldOS 5.4",
        codename: "Intelligence, Security & Management Update",
        fileLimit: 1024 * 1024
    };

    const LS = {
        recentDocs: "54_recent_documents",
        officeAutosave: "54_writer_autosave",
        contacts: "54_contacts_cache",
        notifications: "54_notifications",
        assistantEnabled: "54_assistant_enabled",
        assistantEndpoint: "54_assistant_endpoint",
        assistantKey: "54_assistant_api_key",
        desktopLocked: "54_desktop_locked"
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

    let activeRoom54 = "global";
    let activeRoomLabel54 = "Global Lobby";
    let chatUnsub54 = null;

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

    function win(title, html, app = "emerald54") {
        const body = `<div class="emerald54-panel">${html}</div>`;
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
        if (document.getElementById("emerald54-style")) return;
        const style = document.createElement("style");
        style.id = "emerald54-style";
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
            .emerald54-panel{height:100%;box-sizing:border-box;overflow:auto;font-family:"MS Sans Serif",Tahoma,Arial,sans-serif;font-size:12px;color:#000;}
            .emerald54-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(185px,1fr));gap:8px;margin:8px 0;}
            .emerald54-card{background:#c0c0c0;border:2px solid;border-color:#fff #808080 #808080 #fff;padding:8px;min-height:70px;box-sizing:border-box;}
            .emerald54-card h3,.emerald54-card h4{margin:0 0 6px 0;font-size:13px;}
            .emerald54-inset{background:#fff;border:2px inset #fff;padding:8px;box-sizing:border-box;margin:6px 0;overflow:auto;}
            .emerald54-toolbar{display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin:6px 0;}
            .emerald54-toolbar input,.emerald54-toolbar select{height:24px;}
            .emerald54-table{width:100%;border-collapse:collapse;background:#fff;}
            .emerald54-table th,.emerald54-table td{border:1px solid #808080;padding:4px;text-align:left;vertical-align:top;}
            .emerald54-table th{background:#000080;color:#fff;}
            .emerald54-editor{background:#fff;border:2px inset #fff;min-height:240px;padding:18px;outline:none;line-height:1.35;user-select:text;}
            .emerald54-editor:focus{outline:1px dotted #000;}
            .emerald54-split{display:grid;grid-template-columns:220px 1fr;gap:8px;height:100%;min-height:360px;}
            .emerald54-list{background:#fff;border:2px inset #fff;overflow:auto;padding:4px;}
            .emerald54-list-row{padding:5px;border-bottom:1px solid #c0c0c0;cursor:pointer;}
            .emerald54-list-row:hover{background:#000080;color:#fff;}
            .emerald54-chat-log{height:260px;background:#fff;border:2px inset #fff;overflow:auto;padding:6px;}
            .emerald54-message{border-bottom:1px solid #ddd;padding:5px 2px;}
            .emerald54-message.deleted{opacity:.55;font-style:italic;}
            .emerald54-badge{display:inline-block;background:#000080;color:#fff;padding:2px 5px;margin:1px;border:1px solid #fff;}
            .emerald54-warning{background:#fff4c4;border:2px inset #fff;padding:8px;margin:6px 0;}
            .emerald54-danger{background:#ffd8d8;border:2px inset #fff;padding:8px;margin:6px 0;}
            .emerald54-success{background:#dfffe0;border:2px inset #fff;padding:8px;margin:6px 0;}
            .emerald54-note{font-size:11px;color:#333;}
            .emerald54-folder-icon{width:82px;min-height:76px;text-align:center;color:white;cursor:pointer;padding:4px;box-sizing:border-box;}
            .emerald54-folder-icon:focus{outline:none;}
            .emerald54-folder-symbol{height:36px;display:flex;align-items:center;justify-content:center;color:#000;background:#c0c000;border:2px solid;border-color:#ffff80 #808000 #808000 #ffff80;font-weight:bold;font-size:11px;margin:0 auto 4px;}
            .emerald54-folder-label{text-shadow:1px 1px #000;font-size:12px;line-height:1.1;}
            .emerald54-status-dot{display:inline-block;width:8px;height:8px;background:#008000;border:1px solid #000;margin-right:4px;}
            .emerald54-slide{background:#fff;border:2px inset #fff;min-height:220px;padding:18px;}
            .emerald54-form-row{margin:5px 0;}
            .emerald54-app-tile{cursor:pointer;}
            .emerald54-app-tile:hover{background:#dcdcdc;}
        `;
        document.head.appendChild(style);
    }

    function patchWindowManager() {
        const patchWindow = win => {
            if (!win || win.dataset.emerald54Patched === "true") return win;
            win.dataset.emerald54Patched = "true";

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

        if (window.openWindow && !window.openWindow.__emerald54Patched) {
            const original = window.openWindow;
            const wrapped = function (title, html, app = "") {
                const win = original.call(window, title, html, app);
                setTimeout(() => patchWindow(win), 0);
                return win;
            };
            wrapped.__emerald54Patched = true;
            window.openWindow = wrapped;
        }

        document.addEventListener("click", ev => {
            const icon = ev.target.closest("#desktop .icon,#desktop .desktop-folder-icon,.desktop-icon,.t4-desktop-icon,.emerald54-folder-icon");
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
        essentials: { name: "Essentials", edition: "economy", apps: ["files", "system", "settings54", "notifications54", "helpCenter"] },
        office: { name: "Office & Documents", edition: "economy", apps: ["emeraldOffice54", "writer54", "sheets54", "slides54", "forms54", "templates54", "documentVault54"] },
        files: { name: "Files & Sharing", edition: "home", apps: ["files54", "storage54", "sharing54", "sharedWithMe54", "sharedByMe54", "trash54"] },
        communication: { name: "Communication", edition: "home", apps: ["chat54", "rooms54", "directMessages54", "communicationCenter54", "notifications54"] },
        people: { name: "People", edition: "home", apps: ["users54", "profile54", "contacts54", "friends54"] },
        productivity: { name: "Productivity", edition: "business", apps: ["tasks54", "calendar", "planner54", "notes", "reports54"] },
        system: { name: "System & Settings", edition: "economy", apps: ["settings54", "security54", "privacy54", "assistant54", "desktopTools54", "appManager54"] },
        moderation: { name: "Moderation", edition: "developer", apps: ["moderatorConsole54", "reportsReview54", "modLog54", "communicationAudit54"] },
        admin: { name: "Administration", edition: "executive", apps: ["adminPanel54", "adminUsers54", "adminStorage54", "adminSharing54", "securityAudit54"] }
    };

    function visibleApp(id) {
        const app = window.APPS?.[id];
        if (!app) return false;
        if (app.hiddenStandalone && !app.forceVisible54) return false;
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
        registerApp("emeraldOffice54", { name: "Emerald Office", icon: "OFFICE", edition: "economy", category: "office", launch: () => openEmeraldOffice54() });
        registerApp("writer54", { name: "Emerald Writer", icon: "WRITE", edition: "economy", category: "office", launch: () => openWriter54() });
        registerApp("sheets54", { name: "Emerald Sheets", icon: "SHEET", edition: "home", category: "office", launch: () => openSheets54() });
        registerApp("slides54", { name: "Emerald Slides", icon: "SLIDE", edition: "home", category: "office", launch: () => openSlides54() });
        registerApp("forms54", { name: "Emerald Forms", icon: "FORM", edition: "business", category: "office", launch: () => openForms54() });
        registerApp("templates54", { name: "Templates", icon: "TPL", edition: "economy", category: "office", launch: () => openTemplates54() });
        registerApp("documentVault54", { name: "Document Vault", icon: "VAULT", edition: "economy", category: "office", launch: () => openDocumentVault54() });

        registerApp("files54", { name: "Files", icon: "FILES", edition: "economy", category: "files", launch: () => openFiles54() });
        registerApp("storage54", { name: "Storage Center", icon: "STORE", edition: "economy", category: "files", launch: () => openStorage54() });
        registerApp("sharing54", { name: "File Sharing", icon: "SHARE", edition: "home", category: "files", launch: () => openFileSharing54() });
        registerApp("sharedWithMe54", { name: "Shared With Me", icon: "IN", edition: "home", category: "files", launch: () => openSharedWithMe54() });
        registerApp("sharedByMe54", { name: "Shared by Me", icon: "OUT", edition: "home", category: "files", launch: () => openSharedByMe54() });
        registerApp("trash54", { name: "Trash", icon: "TRASH", edition: "home", category: "files", launch: () => openTrash54() });

        registerApp("chat54", { name: "Emerald Chat", icon: "CHAT", edition: "home", category: "communication", launch: () => openEmeraldChat54() });
        registerApp("rooms54", { name: "Chat Rooms", icon: "ROOM", edition: "home", category: "communication", launch: () => openChatRooms54() });
        registerApp("directMessages54", { name: "Direct Messages", icon: "DM", edition: "home", category: "communication", launch: () => openDirectMessages54() });
        registerApp("communicationCenter54", { name: "Communication Center", icon: "COMMS", edition: "home", category: "communication", launch: () => openCommunicationCenter54() });

        registerApp("users54", { name: "EmeraldOS Users", icon: "USERS", edition: "home", category: "people", launch: () => openUsers54() });
        registerApp("profile54", { name: "My Profile", icon: "ME", edition: "home", category: "people", launch: () => openMyProfile54() });
        registerApp("contacts54", { name: "Contacts", icon: "CNT", edition: "home", category: "people", launch: () => openContacts54() });
        registerApp("friends54", { name: "Friends", icon: "FRND", edition: "home", category: "people", launch: () => openFriends54() });

        registerApp("settings54", { name: "Settings", icon: "SET", edition: "economy", category: "system", launch: () => openSettings54() });
        registerApp("notifications54", { name: "Notification Center", icon: "NOTIF", edition: "economy", category: "system", launch: () => openNotificationCenter54() });
        registerApp("security54", { name: "Security & Privacy", icon: "SEC", edition: "economy", category: "system", launch: () => openSecurityPrivacy54() });
        registerApp("privacy54", { name: "Privacy Center", icon: "PRIV", edition: "home", category: "system", launch: () => openPrivacy54() });
        registerApp("assistant54", { name: "Emerald Assistant", icon: "HELP", edition: "home", category: "system", launch: () => openAssistant54() });
        registerApp("desktopTools54", { name: "Desktop Tools", icon: "DESK", edition: "economy", category: "system", launch: () => openDesktopTools54() });
        registerApp("appManager54", { name: "App Manager", icon: "APPS", edition: "economy", category: "system", launch: () => openAppManager54() });

        registerApp("tasks54", { name: "Task Board", icon: "TASK", edition: "business", category: "productivity", launch: () => openTasks54() });
        registerApp("planner54", { name: "Planner", icon: "PLAN", edition: "business", category: "productivity", launch: () => openPlanner54() });
        registerApp("reports54", { name: "Reports", icon: "RPT", edition: "business", category: "productivity", launch: () => openReports54() });

        registerApp("moderatorConsole54", { name: "Moderator Console", icon: "MOD", edition: "developer", category: "moderation", launch: () => openModeratorConsole54() });
        registerApp("reportsReview54", { name: "Reports Review", icon: "RPT", edition: "developer", category: "moderation", launch: () => openReportsReview54() });
        registerApp("modLog54", { name: "Moderation Log", icon: "LOG", edition: "developer", category: "moderation", launch: () => openModerationLog54() });
        registerApp("communicationAudit54", { name: "Communication Audit", icon: "AUDIT", edition: "developer", category: "moderation", launch: () => openCommunicationAudit54() });

        registerApp("adminPanel54", { name: "Administrative Panel", icon: "ADMIN", edition: "executive", category: "admin", launch: () => openAdminPanel54() });
        registerApp("adminUsers54", { name: "User Administration", icon: "USER", edition: "executive", category: "admin", launch: () => openAdminUsers54() });
        registerApp("adminStorage54", { name: "Storage Administration", icon: "STOR", edition: "executive", category: "admin", launch: () => openAdminStorage54() });
        registerApp("adminSharing54", { name: "Sharing Administration", icon: "SHR", edition: "executive", category: "admin", launch: () => openAdminSharing54() });
        registerApp("securityAudit54", { name: "Security Audit", icon: "SEC", edition: "executive", category: "admin", launch: () => openSecurityAudit54() });
    }

    function openFolder54(id) {
        const folder = FOLDERS[id];
        if (!folder) return;
        const rows = folder.apps
            .filter(visibleApp)
            .map(appId => {
                const app = window.APPS[appId];
                return `<div class="emerald54-card emerald54-app-tile" onclick="launchApp('${safe(appId)}')">
                    <h3>${safe(app.icon || "APP")} ${safe(app.name)}</h3>
                    <div class="emerald54-note">Edition: ${safe(app.edition || "economy")}</div>
                </div>`;
            }).join("") || `<div class="emerald54-inset">No available applications in this folder.</div>`;
        win(folder.name, `<h2>${safe(folder.name)}</h2><div class="emerald54-grid">${rows}</div>`, "folder_" + id);
    }

    function renderDesktop54() {
        const desktop = document.getElementById("desktop");
        if (!desktop) return;
        desktop.innerHTML = "";
        Object.entries(FOLDERS).forEach(([id, folder]) => {
            if (!visibleFolder(folder)) return;
            const icon = document.createElement("div");
            icon.className = "emerald54-folder-icon desktop-folder-icon";
            icon.tabIndex = -1;
            icon.innerHTML = `<div class="emerald54-folder-symbol">${safe(folder.name.split(" ")[0].slice(0, 6).toUpperCase())}</div><div class="emerald54-folder-label">${safe(folder.name)}</div>`;
            icon.ondblclick = () => openFolder54(id);
            icon.onclick = () => setTimeout(() => icon.blur(), 0);
            desktop.appendChild(icon);
        });
    }

    function renderStart54() {
        const results = document.getElementById("start-results");
        if (!results) return;
        const search = document.getElementById("start-search");
        const query = String(search?.value || "").toLowerCase();
        const folderItems = Object.entries(FOLDERS)
            .filter(([, folder]) => visibleFolder(folder))
            .filter(([, folder]) => !query || folder.name.toLowerCase().includes(query))
            .map(([id, folder]) => `<div class="start-item" onclick="openFolder54('${safe(id)}')">${safe(folder.name)}</div>`)
            .join("");
        const appItems = Object.entries(window.APPS || {})
            .filter(([id, app]) => visibleApp(id) && (!query || String(app.name).toLowerCase().includes(query)))
            .slice(0, 80)
            .map(([id, app]) => `<div class="start-item" onclick="launchApp('${safe(id)}')">${safe(app.name)}</div>`)
            .join("");
        results.innerHTML = folderItems + (query ? appItems : "");
        if (search && !search.dataset.emerald54Search) {
            search.dataset.emerald54Search = "true";
            search.addEventListener("input", renderStart54);
        }
    }

    /* =====================================================
       FILES, STORAGE AND SHARING
    ===================================================== */

    async function openFiles54() {
        const files = await loadFiles();
        const rows = Object.entries(files).map(([id, f]) => `
            <tr>
                <td><b>${safe(fileIconText(f))}</b></td>
                <td>${safe(f.name || id)}<br><span class="emerald54-note">ID: ${safe(id)}</span></td>
                <td>${safe(fileKind(f.name, f.type || f.mimeType))}</td>
                <td>${formatBytes(fileSize(f))}</td>
                <td>${dateTime(f.updatedAt || f.createdAt)}</td>
                <td>
                    ${smallButton("Open", `openFileFromFiles54('${safe(id)}')`)}
                    ${smallButton("Share", `shareFilePrompt54('${safe(id)}')`)}
                    ${smallButton("Details", `fileDetails54('${safe(id)}')`)}
                    ${smallButton("Rename", `renameFile54('${safe(id)}')`)}
                    ${smallButton("Delete", `deleteFileFromFiles54('${safe(id)}')`)}
                </td>
            </tr>`).join("");
        win("Files", `
            <h2>Files</h2>
            <div class="emerald54-toolbar">
                ${smallButton("New Document", "newOfficeDocument54()")}
                ${smallButton("New Text File", "newTextFile54()")}
                ${smallButton("Storage Center", "openStorage54()")}
                ${smallButton("File Sharing", "openFileSharing54()")}
                ${smallButton("Refresh", "openFiles54()")}
            </div>
            <div class="emerald54-warning">Files now includes storage, sharing, file details, and shared-file controls in one place.</div>
            <table class="emerald54-table"><thead><tr><th>Type</th><th>Name</th><th>Kind</th><th>Size</th><th>Updated</th><th>Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="6">No files yet.</td></tr>`}</tbody></table>
        `, "files54");
    }

    async function openFileFromFiles54(id) {
        const files = await loadFiles();
        const file = files[id];
        if (!file) return notify("Files", "File not found.", "warning");
        const content = await getFileContent(id, file);
        const kind = fileKind(file.name, file.type || file.mimeType);
        if (kind === "Document") {
            openWriter54(id, file, content);
            return;
        }
        if (kind === "Spreadsheet") {
            openSheets54(id, file, content);
            return;
        }
        if (kind === "Presentation") {
            openSlides54(id, file, content);
            return;
        }
        win(file.name || "File", `<h2>${safe(file.name || id)}</h2><textarea class="emerald54-inset" style="width:100%;height:260px;">${safe(content)}</textarea>`, "fileViewer54");
    }

    async function fileDetails54(id) {
        const files = await loadFiles();
        const f = files[id];
        if (!f) return;
        const shares = await listSharesByMe();
        const fileShares = shares.filter(s => s.fileId === id && s.status !== "revoked");
        win("File Details", `
            <h2>${safe(f.name || id)}</h2>
            <div class="emerald54-inset">
                <b>File ID:</b> ${safe(id)}<br>
                <b>Type:</b> ${safe(fileKind(f.name, f.type || f.mimeType))}<br>
                <b>Size:</b> ${formatBytes(fileSize(f))}<br>
                <b>Created:</b> ${dateTime(f.createdAt)}<br>
                <b>Updated:</b> ${dateTime(f.updatedAt)}<br>
                <b>Storage Mode:</b> ${safe(f.storageMode || "firestore")}
            </div>
            <h3>Access</h3>
            <div class="emerald54-inset">${fileShares.map(s => `${safe(s.targetUsername)} - ${safe(s.permission)} ${smallButton("Revoke", `revokeShare54('${safe(s.id)}')`)}`).join("<br>") || "Not shared."}</div>
        `, "fileDetails54");
    }

    async function renameFile54(id) {
        const name = prompt("New file name:");
        if (!name) return;
        await cloudSaveFile(id, { name: name.trim() });
        notify("Files", "File renamed.", "success");
        openFiles54();
    }

    async function deleteFileFromFiles54(id) {
        if (!confirm("Move this file to Trash?")) return;
        await cloudSaveFile(id, { trashed: true, trashedAt: now() });
        notify("Files", "File moved to Trash.", "warning");
        openFiles54();
    }

    async function newTextFile54() {
        const name = prompt("File name:", "New Text File.txt") || "New Text File.txt";
        const id = await cloudCreateFile(name, "");
        if (id) await cloudSaveFile(id, { folder: "Documents", app: "Files" });
        notify("Files", "Text file created.", "success");
        openFiles54();
    }

    async function newOfficeDocument54() {
        openWriter54(null, { name: "Untitled.edoc" }, "<h1>Untitled Document</h1><p>Start writing here.</p>");
    }

    async function openStorage54() {
        const files = await loadFiles();
        const list = Object.entries(files).filter(([, f]) => !f.trashed);
        const total = list.reduce((sum, [, f]) => sum + fileSize(f), 0);
        const large = list.filter(([, f]) => fileSize(f) > BUILD.fileLimit);
        const near = total > BUILD.fileLimit * 0.75;
        const rows = list.sort((a, b) => fileSize(b[1]) - fileSize(a[1])).slice(0, 20).map(([id, f]) => `
            <tr><td>${safe(f.name || id)}</td><td>${formatBytes(fileSize(f))}</td><td>${safe(f.storageMode || "firestore")}</td><td>${smallButton("Details", `fileDetails54('${safe(id)}')`)}</td></tr>`).join("");
        win("Storage Center", `
            <h2>Storage Center</h2>
            <div class="emerald54-${near ? "warning" : "success"}">
                <b>Total estimated storage:</b> ${formatBytes(total)}<br>
                <b>File count:</b> ${list.length}<br>
                <b>Large file threshold:</b> ${formatBytes(BUILD.fileLimit)}
            </div>
            ${large.length ? `<div class="emerald54-warning"><b>Large files:</b> ${large.length}. These may require Firebase Storage and CORS configuration.</div>` : ""}
            <div class="emerald54-toolbar">${smallButton("Open Files", "openFiles54()")} ${smallButton("Empty Trash", "emptyTrash54()")} ${smallButton("Download Report", "downloadStorageReport54()")}</div>
            <h3>Largest Files</h3>
            <table class="emerald54-table"><thead><tr><th>Name</th><th>Size</th><th>Storage</th><th>Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="4">No files.</td></tr>`}</tbody></table>
        `, "storage54");
    }

    async function emptyTrash54() {
        const files = await loadFiles();
        const trashed = Object.entries(files).filter(([, f]) => f.trashed);
        if (!trashed.length) return notify("Trash", "Trash is already empty.", "info");
        if (!confirm(`Permanently delete ${trashed.length} trashed files?`)) return;
        for (const [id] of trashed) await cloudDeleteFile(id);
        notify("Trash", "Trash emptied.", "success");
        openStorage54();
    }

    async function downloadStorageReport54() {
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

    async function shareFilePrompt54(fileId) {
        const target = prompt("Share with EmeraldOS username:");
        if (!target) return;
        const permission = prompt("Permission: view or edit", "view") || "view";
        await shareFile54(fileId, target.trim(), permission.trim().toLowerCase() === "edit" ? "edit" : "view");
    }

    async function shareFile54(fileId, targetUsername, permission = "view") {
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

    async function revokeShare54(shareId) {
        await updateDoc(doc(db, COL.shares, shareId), { status: "revoked", revokedAt: now(), updatedAt: now() });
        notify("File Sharing", "Share revoked.", "warning");
        openSharedByMe54();
    }

    async function openFileSharing54() {
        const files = await loadFiles();
        const users = await listUsers();
        const rows = Object.entries(files).filter(([, f]) => !f.trashed).map(([id, f]) => `
            <tr>
                <td>${safe(f.name || id)}<br><span class="emerald54-note">ID: ${safe(id)}</span></td>
                <td>${formatBytes(fileSize(f))}</td>
                <td>${smallButton("Share", `shareFilePrompt54('${safe(id)}')`)} ${smallButton("Copy ID", `copyText54('${safe(id)}')`)}</td>
            </tr>`).join("");
        const userRows = users.map(u => `<option value="${safe(u.username)}">${safe(u.username)}</option>`).join("");
        win("File Sharing", `
            <h2>File Sharing</h2>
            <div class="emerald54-warning">Share directly from this app or from Files. File IDs are shown for reference, but normal sharing only needs the Share button.</div>
            <div class="emerald54-toolbar">
                <select id="share_quick_user">${userRows}</select>
                ${smallButton("Open Shared With Me", "openSharedWithMe54()")}
                ${smallButton("Open Shared by Me", "openSharedByMe54()")}
                ${smallButton("Users", "openUsers54()")}
            </div>
            <table class="emerald54-table"><thead><tr><th>Your Files</th><th>Size</th><th>Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="3">No files to share.</td></tr>`}</tbody></table>
        `, "sharing54");
    }

    async function openSharedWithMe54() {
        const rows = await listSharesForMe();
        const html = rows.map(s => `
            <tr>
                <td>${safe(s.fileName || s.fileId)}<br><span class="emerald54-note">Owner: ${safe(s.owner)} | Permission: ${safe(s.permission)}</span></td>
                <td>${formatBytes(s.fileSize || 0)}</td>
                <td>${dateTime(s.createdAt)}</td>
                <td>${smallButton("Open", `openSharedFile54('${safe(s.id)}')`)} ${smallButton("Details", `sharedDetails54('${safe(s.id)}')`)}</td>
            </tr>`).join("");
        win("Shared With Me", `<h2>Shared With Me</h2><table class="emerald54-table"><thead><tr><th>File</th><th>Size</th><th>Shared</th><th>Actions</th></tr></thead><tbody>${html || `<tr><td colspan="4">No files have been shared with you.</td></tr>`}</tbody></table>`, "sharedWithMe54");
    }

    async function openSharedByMe54() {
        const rows = await listSharesByMe();
        const html = rows.map(s => `
            <tr>
                <td>${safe(s.fileName || s.fileId)}<br><span class="emerald54-note">To: ${safe(s.targetUsername)} | Permission: ${safe(s.permission)}</span></td>
                <td>${safe(s.status || "active")}</td>
                <td>${dateTime(s.createdAt)}</td>
                <td>${s.status === "revoked" ? "Revoked" : smallButton("Revoke", `revokeShare54('${safe(s.id)}')`)}</td>
            </tr>`).join("");
        win("Shared by Me", `<h2>Shared by Me</h2><table class="emerald54-table"><thead><tr><th>File</th><th>Status</th><th>Shared</th><th>Actions</th></tr></thead><tbody>${html || `<tr><td colspan="4">You have not shared files.</td></tr>`}</tbody></table>`, "sharedByMe54");
    }

    async function openSharedFile54(shareId) {
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
            <div class="emerald54-inset"><b>Owner:</b> ${safe(share.owner)}<br><b>Permission:</b> ${safe(share.permission)}<br><b>File ID:</b> ${safe(share.fileId)}</div>
            <textarea class="emerald54-inset" style="width:100%;height:260px;">${safe(content)}</textarea>
            ${share.permission === "edit" ? smallButton("Save Edited Copy", `saveSharedEditCopy54('${safe(share.id)}')`) : ""}
        `, "sharedFile54");
    }

    async function sharedDetails54(shareId) {
        const snap = await getDoc(doc(db, COL.shares, shareId));
        if (!snap.exists()) return;
        const s = snap.data() || {};
        win("Share Details", `<h2>${safe(s.fileName || s.fileId)}</h2><div class="emerald54-inset"><b>Owner:</b> ${safe(s.owner)}<br><b>Permission:</b> ${safe(s.permission)}<br><b>Status:</b> ${safe(s.status)}<br><b>Created:</b> ${dateTime(s.createdAt)}<br><b>File ID:</b> ${safe(s.fileId)}</div>`, "shareDetails54");
    }

    async function saveSharedEditCopy54(shareId) {
        const area = document.querySelector(".window:last-child textarea");
        const content = area?.value || "";
        const snap = await getDoc(doc(db, COL.shares, shareId));
        const s = snap.exists() ? snap.data() : {};
        const id = await cloudCreateFile(`Edited Copy - ${s.fileName || "Shared File.txt"}`, content);
        if (id) notify("Shared File", "Edited copy saved to your Files.", "success");
    }

    async function openTrash54() {
        const files = await loadFiles();
        const rows = Object.entries(files).filter(([, f]) => f.trashed).map(([id, f]) => `
            <tr><td>${safe(f.name || id)}</td><td>${dateTime(f.trashedAt)}</td><td>${smallButton("Restore", `restoreFile54('${safe(id)}')`)} ${smallButton("Delete Forever", `deleteForever54('${safe(id)}')`)}</td></tr>`).join("");
        win("Trash", `<h2>Trash</h2><table class="emerald54-table"><thead><tr><th>File</th><th>Moved</th><th>Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="3">Trash is empty.</td></tr>`}</tbody></table>`, "trash54");
    }

    async function restoreFile54(id) {
        await cloudSaveFile(id, { trashed: false, restoredAt: now() });
        notify("Trash", "File restored.", "success");
        openTrash54();
    }

    async function deleteForever54(id) {
        if (!confirm("Permanently delete this file?")) return;
        await cloudDeleteFile(id);
        notify("Trash", "File permanently deleted.", "warning");
        openTrash54();
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
        return `<div class="emerald54-toolbar">
            ${smallButton("Bold", "writerCmd54('bold')")}
            ${smallButton("Italic", "writerCmd54('italic')")}
            ${smallButton("Underline", "writerCmd54('underline')")}
            ${smallButton("Bullets", "writerCmd54('insertUnorderedList')")}
            ${smallButton("Numbers", "writerCmd54('insertOrderedList')")}
            ${smallButton("Left", "writerCmd54('justifyLeft')")}
            ${smallButton("Center", "writerCmd54('justifyCenter')")}
            ${smallButton("Right", "writerCmd54('justifyRight')")}
            <select onchange="writerBlock54(this.value);this.value=''">
                <option value="">Style</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="p">Paragraph</option>
            </select>
            <select onchange="writerFontSize54(this.value);this.value=''">
                <option value="">Size</option><option value="2">Small</option><option value="3">Normal</option><option value="5">Large</option><option value="7">Title</option>
            </select>
            <input type="color" onchange="writerColor54(this.value)">
            ${smallButton("Table", "writerInsertTable54()")}
            ${smallButton("Image URL", "writerInsertImage54()")}
            ${smallButton("Date", "writerInsertDate54()")}
            ${smallButton("Find", "writerFind54()")}
            ${smallButton("Replace", "writerReplace54()")}
            ${smallButton("Save", `saveWriter54('${fid}')`)}
            ${smallButton("Export TXT", "exportWriterText54()")}
            ${smallButton("Export HTML", "exportWriterHtml54()")}
            ${smallButton("Print", "printWriter54()")}
        </div>`;
    }

    function writerWindowHtml(title, html, fileId = "") {
        return `
            <h2>Emerald Writer</h2>
            <div class="emerald54-toolbar">
                <input id="writer54_title" value="${safe(title || "Untitled.edoc")}" placeholder="Document name" style="min-width:220px;">
                ${smallButton("Templates", "openTemplates54()")}
                ${smallButton("Vault", "openDocumentVault54()")}
                ${smallButton("Properties", "writerProperties54()")}
                <span id="writer54_count" class="emerald54-badge">0 words</span>
            </div>
            ${writerToolbar(fileId)}
            <div id="writer54_editor" class="emerald54-editor" contenteditable="true" oninput="writerAutosave54();writerCount54();">${html || docTemplate()}</div>
        `;
    }

    async function openWriter54(fileId = "", file = null, content = "") {
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
        win("Emerald Writer", writerWindowHtml(title, content || docTemplate(), fileId), "writer54");
        setTimeout(() => writerCount54(), 80);
    }

    function writerCmd54(cmd) { document.execCommand(cmd, false, null); writerCount54(); }
    function writerBlock54(block) { if (block) document.execCommand("formatBlock", false, block); writerCount54(); }
    function writerFontSize54(size) { if (size) document.execCommand("fontSize", false, size); writerCount54(); }
    function writerColor54(color) { if (color) document.execCommand("foreColor", false, color); writerCount54(); }
    function writerEditor() { return document.getElementById("writer54_editor"); }

    function writerInsertDate54() { document.execCommand("insertText", false, new Date().toLocaleDateString()); writerCount54(); }
    function writerInsertTable54() {
        document.execCommand("insertHTML", false, `<table border="1" style="width:100%;border-collapse:collapse"><tr><th>Header</th><th>Header</th></tr><tr><td>Cell</td><td>Cell</td></tr></table><p></p>`);
        writerCount54();
    }
    function writerInsertImage54() {
        const url = prompt("Image URL:");
        if (!url) return;
        document.execCommand("insertHTML", false, `<img src="${safe(url)}" style="max-width:100%;"><p></p>`);
    }
    function writerFind54() {
        const q = prompt("Find text:");
        if (!q) return;
        const text = writerEditor()?.innerText || "";
        alert(text.toLowerCase().includes(q.toLowerCase()) ? "Found." : "Not found.");
    }
    function writerReplace54() {
        const q = prompt("Find:");
        if (!q) return;
        const r = prompt("Replace with:", "") ?? "";
        const ed = writerEditor();
        if (!ed) return;
        ed.innerHTML = ed.innerHTML.split(q).join(safe(r));
        writerCount54();
    }
    function writerCount54() {
        const ed = writerEditor();
        const out = document.getElementById("writer54_count");
        if (!ed || !out) return;
        const text = ed.innerText.trim();
        const words = text ? text.split(/\s+/).length : 0;
        out.textContent = `${words} words, ${text.length} characters`;
    }
    function writerAutosave54() {
        const ed = writerEditor();
        const title = document.getElementById("writer54_title")?.value || "Untitled.edoc";
        if (!ed) return;
        localStorage.setItem(LS.officeAutosave, JSON.stringify({ title, html: ed.innerHTML, savedAt: now() }));
    }
    async function saveWriter54(fileId = "") {
        const ed = writerEditor();
        if (!ed) return;
        const title = document.getElementById("writer54_title")?.value || "Untitled.edoc";
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
    function exportWriterText54() { downloadText((document.getElementById("writer54_title")?.value || "document") + ".txt", writerEditor()?.innerText || ""); }
    function exportWriterHtml54() { downloadText((document.getElementById("writer54_title")?.value || "document") + ".html", writerEditor()?.innerHTML || ""); }
    function printWriter54() {
        const w = window.open("", "_blank");
        w.document.write(`<!doctype html><title>Print</title>${writerEditor()?.innerHTML || ""}`);
        w.document.close();
        w.print();
    }
    function writerProperties54() {
        const title = document.getElementById("writer54_title")?.value || "Untitled";
        const ed = writerEditor();
        win("Document Properties", `<h2>${safe(title)}</h2><div class="emerald54-inset"><b>Words:</b> ${(ed?.innerText.trim().split(/\s+/).filter(Boolean).length || 0)}<br><b>Characters:</b> ${ed?.innerText.length || 0}<br><b>Estimated size:</b> ${formatBytes(byteSize(ed?.innerHTML || ""))}</div>`, "docProperties54");
    }

    async function openEmeraldOffice54() {
        const recent = JSON.parse(localStorage.getItem(LS.recentDocs) || "[]");
        win("Emerald Office", `
            <h2>Emerald Office</h2>
            <div class="emerald54-grid">
                <div class="emerald54-card emerald54-app-tile" onclick="openWriter54()"><h3>Emerald Writer</h3><p>Documents, templates, page layout, exports, autosave.</p></div>
                <div class="emerald54-card emerald54-app-tile" onclick="openSheets54()"><h3>Emerald Sheets</h3><p>Tables, CSV export, basic formulas.</p></div>
                <div class="emerald54-card emerald54-app-tile" onclick="openSlides54()"><h3>Emerald Slides</h3><p>Multiple slides and HTML presentation export.</p></div>
                <div class="emerald54-card emerald54-app-tile" onclick="openForms54()"><h3>Emerald Forms</h3><p>Build simple forms and save drafts.</p></div>
                <div class="emerald54-card emerald54-app-tile" onclick="openTemplates54()"><h3>Templates</h3><p>Letter, memo, policy, report, meeting notes.</p></div>
                <div class="emerald54-card emerald54-app-tile" onclick="openDocumentVault54()"><h3>Document Vault</h3><p>Open recent and saved Office files.</p></div>
            </div>
            <h3>Recent Documents</h3>
            <div class="emerald54-inset">${recent.map(d => `<div>${safe(d.title)} ${smallButton("Open", `openFileFromFiles54('${safe(d.id)}')`)}</div>`).join("") || "No recent documents yet."}</div>
        `, "emeraldOffice54");
    }

    function openTemplates54() {
        win("Templates", `<h2>Templates</h2><div class="emerald54-grid">
            <div class="emerald54-card" onclick="openWriter54('',{name:'Letter.edoc'},docTemplate('letter'))"><h3>Letter</h3></div>
            <div class="emerald54-card" onclick="openWriter54('',{name:'Memo.edoc'},docTemplate('memo'))"><h3>Memo</h3></div>
            <div class="emerald54-card" onclick="openWriter54('',{name:'Policy.edoc'},docTemplate('policy'))"><h3>Policy</h3></div>
            <div class="emerald54-card" onclick="openWriter54('',{name:'Blank.edoc'},docTemplate())"><h3>Blank</h3></div>
        </div>`, "templates54");
    }

    async function openDocumentVault54() {
        const files = await loadFiles();
        const rows = Object.entries(files).filter(([, f]) => /\.(edoc|html|txt|md|csv|esheet|eslide)$/i.test(f.name || "")).map(([id, f]) => `<tr><td>${safe(f.name)}</td><td>${safe(fileKind(f.name, f.type))}</td><td>${formatBytes(fileSize(f))}</td><td>${smallButton("Open", `openFileFromFiles54('${safe(id)}')`)}</td></tr>`).join("");
        win("Document Vault", `<h2>Document Vault</h2><table class="emerald54-table"><thead><tr><th>Name</th><th>Kind</th><th>Size</th><th>Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="4">No Office files found.</td></tr>`}</tbody></table>`, "documentVault54");
    }

    function openSheets54(fileId = "", file = null, content = "") {
        const rows = Array.from({ length: 8 }, (_, r) => `<tr>${Array.from({ length: 6 }, (_, c) => `<td contenteditable="true" data-cell="${r}-${c}">${r === 0 ? String.fromCharCode(65 + c) : ""}</td>`).join("")}</tr>`).join("");
        win("Emerald Sheets", `<h2>Emerald Sheets</h2><div class="emerald54-toolbar">${smallButton("Sum Column A", "sheetSum54()")} ${smallButton("Export CSV", "sheetExportCSV54()")} ${smallButton("Save", "sheetSave54()")}</div><div class="emerald54-inset"><table id="sheet54" class="emerald54-table">${rows}</table></div><div id="sheet54_result" class="emerald54-inset">Ready.</div>`, "sheets54");
    }
    function sheetCells() { return Array.from(document.querySelectorAll("#sheet54 td")); }
    function sheetSum54() { const sum = sheetCells().filter(td => td.dataset.cell?.endsWith("-0")).reduce((s, td) => s + Number(td.innerText || 0), 0); setHTML("sheet54_result", `Column A total: <b>${sum}</b>`); }
    function sheetExportCSV54() { const rows = Array.from(document.querySelectorAll("#sheet54 tr")).map(tr => Array.from(tr.children).map(td => `"${String(td.innerText).replaceAll('"','""')}"`).join(",")).join("\n"); downloadText("EmeraldSheet.csv", rows); }
    async function sheetSave54() { const html = document.getElementById("sheet54")?.outerHTML || ""; const id = await cloudCreateFile("Emerald Sheet.esheet", html); if (id) notify("Emerald Sheets", "Sheet saved to Files.", "success"); }

    function openSlides54() {
        localStorage.setItem("54_slides", localStorage.getItem("54_slides") || JSON.stringify([{ title: "Title Slide", body: "Subtitle" }]));
        win("Emerald Slides", `<h2>Emerald Slides</h2><div class="emerald54-toolbar">${smallButton("Add Slide", "slideAdd54()")} ${smallButton("Export HTML", "slideExport54()")} ${smallButton("Save", "slideSave54()")}</div><div id="slides54_area"></div>`, "slides54");
        renderSlides54();
    }
    function getSlides54() { try { return JSON.parse(localStorage.getItem("54_slides") || "[]"); } catch { return []; } }
    function setSlides54(slides) { localStorage.setItem("54_slides", JSON.stringify(slides)); }
    function renderSlides54() {
        const slides = getSlides54();
        setHTML("slides54_area", slides.map((s, i) => `<div class="emerald54-slide"><input value="${safe(s.title)}" onchange="slideSet54(${i},'title',this.value)" style="font-size:18px;width:100%;font-weight:bold"><textarea onchange="slideSet54(${i},'body',this.value)" style="width:100%;height:110px;margin-top:8px;">${safe(s.body)}</textarea>${smallButton("Delete", `slideDelete54(${i})`)}</div>`).join(""));
    }
    function slideAdd54() { const slides = getSlides54(); slides.push({ title: "New Slide", body: "Content" }); setSlides54(slides); renderSlides54(); }
    function slideSet54(i, field, value) { const slides = getSlides54(); slides[i][field] = value; setSlides54(slides); }
    function slideDelete54(i) { const slides = getSlides54(); slides.splice(i, 1); setSlides54(slides); renderSlides54(); }
    function slideExport54() { const slides = getSlides54(); downloadText("EmeraldSlides.html", `<!doctype html>${slides.map(s => `<section style="min-height:90vh;padding:40px"><h1>${safe(s.title)}</h1><p>${safe(s.body)}</p></section>`).join("<hr>")}`); }
    async function slideSave54() { const id = await cloudCreateFile("Emerald Slides.eslide", JSON.stringify(getSlides54(), null, 2)); if (id) notify("Emerald Slides", "Slides saved to Files.", "success"); }

    function openForms54() {
        win("Emerald Forms", `<h2>Emerald Forms</h2><div class="emerald54-toolbar">${smallButton("Add Question", "formAddQuestion54()")}${smallButton("Export", "formExport54()")}</div><div id="form54_questions" class="emerald54-inset"></div>`, "forms54");
        renderForm54();
    }
    function getForm54() { try { return JSON.parse(localStorage.getItem("54_form") || "[]"); } catch { return []; } }
    function setForm54(q) { localStorage.setItem("54_form", JSON.stringify(q)); }
    function renderForm54() { const q = getForm54(); setHTML("form54_questions", q.map((x, i) => `<div class="emerald54-form-row"><input value="${safe(x)}" onchange="formSet54(${i},this.value)">${smallButton("Remove", `formRemove54(${i})`)}</div>`).join("") || "No questions yet."); }
    function formAddQuestion54() { const q = getForm54(); q.push("New question"); setForm54(q); renderForm54(); }
    function formSet54(i, v) { const q = getForm54(); q[i] = v; setForm54(q); }
    function formRemove54(i) { const q = getForm54(); q.splice(i, 1); setForm54(q); renderForm54(); }
    function formExport54() { downloadText("EmeraldForm.json", JSON.stringify(getForm54(), null, 2)); }

    /* =====================================================
       CHAT, USERS, PROFILES, CONTACTS
    ===================================================== */

    async function openEmeraldChat54(roomId = activeRoom54, label = activeRoomLabel54) {
        activeRoom54 = roomId;
        activeRoomLabel54 = label;
        await ensureChatRoom(roomId, label, roomId.startsWith("dm_") ? "direct" : "public", []);
        win("Emerald Chat", `
            <h2>Emerald Chat</h2>
            <div class="emerald54-toolbar">
                ${smallButton("Rooms", "openChatRooms54()")}
                ${smallButton("Direct Messages", "openDirectMessages54()")}
                ${smallButton("Users", "openUsers54()")}
                <span class="emerald54-badge">${safe(label)}</span>
            </div>
            <div id="chat54_log" class="emerald54-chat-log">Loading messages...</div>
            <div class="emerald54-toolbar">
                <input id="chat54_message" placeholder="Type a message" style="flex:1;min-width:260px;" onkeydown="if(event.key==='Enter')sendChat54()">
                ${smallButton("Send", "sendChat54()")}
            </div>
        `, "chat54");
        subscribeChat54(roomId);
    }

    function subscribeChat54(roomId) {
        if (chatUnsub54) chatUnsub54();
        chatUnsub54 = onSnapshot(roomMessages(roomId), snap => {
            const rows = [];
            snap.forEach(d => rows.push({ id: d.id, ...d.data() }));
            rows.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
            setHTML("chat54_log", rows.slice(-100).map(m => renderMessage54(m)).join("") || "No messages yet.");
            const log = document.getElementById("chat54_log");
            if (log) log.scrollTop = log.scrollHeight;
        }, err => setHTML("chat54_log", `<div class="emerald54-danger">Could not load chat: ${safe(err.message)}</div>`));
    }

    function renderMessage54(m) {
        const mine = m.sender === currentUser();
        const deleted = m.deleted;
        return `<div class="emerald54-message ${deleted ? "deleted" : ""}">
            <b>${safe(m.sender || "Unknown")}</b> <span class="emerald54-note">${dateTime(m.createdAt)}</span><br>
            ${deleted ? "Message deleted." : safe(m.text || "")}
            <div class="emerald54-toolbar">
                ${!deleted && mine ? smallButton("Edit", `editMessage54('${safe(activeRoom54)}','${safe(m.id)}')`) : ""}
                ${!deleted && (mine || isModerator()) ? smallButton("Delete", `deleteMessage54('${safe(activeRoom54)}','${safe(m.id)}')`) : ""}
                ${!deleted ? smallButton("Reply", `replyMessage54('${safe(m.sender)}')`) : ""}
                ${!deleted ? smallButton("Report", `reportMessage54('${safe(activeRoom54)}','${safe(m.id)}')`) : ""}
            </div>
        </div>`;
    }

    async function sendChat54() {
        const input = document.getElementById("chat54_message");
        const text = input?.value.trim();
        if (!text) return;
        await addDoc(roomMessages(activeRoom54), { sender: currentUser(), text, createdAt: now(), deleted: false });
        await setDoc(doc(db, COL.rooms, activeRoom54), { updatedAt: now(), lastMessage: text.slice(0, 120) }, { merge: true });
        input.value = "";
    }

    async function editMessage54(roomId, messageId) {
        const text = prompt("Edit message:");
        if (!text) return;
        await updateDoc(doc(db, COL.rooms, roomId, "messages", messageId), { text, editedAt: now() });
    }

    async function deleteMessage54(roomId, messageId) {
        await updateDoc(doc(db, COL.rooms, roomId, "messages", messageId), { deleted: true, deletedBy: currentUser(), deletedAt: now() });
        await logMod("message.delete", `${currentUser()} deleted message ${messageId} in ${roomId}`);
    }

    function replyMessage54(sender) {
        const input = document.getElementById("chat54_message");
        if (input) input.value = `@${sender} ` + input.value;
        input?.focus();
    }

    async function reportMessage54(roomId, messageId) {
        const reason = prompt("Report reason:", "Inappropriate message") || "Reported message";
        await addDoc(collection(db, COL.reports), { roomId, messageId, reason, reporter: currentUser(), status: "open", createdAt: now() });
        notify("Emerald Chat", "Message reported.", "warning");
    }

    async function openChatRooms54() {
        try {
            const snap = await getDocs(collection(db, COL.rooms));
            const rooms = [];
            snap.forEach(d => rooms.push({ id: d.id, ...d.data() }));
            rooms.sort((a, b) => String(a.label).localeCompare(String(b.label)));
            const rows = rooms.map(r => `<tr><td>${safe(r.label || r.id)}</td><td>${safe(r.type || "public")}</td><td>${dateTime(r.updatedAt)}</td><td>${smallButton("Open", `openEmeraldChat54('${safe(r.id)}','${safe(r.label || r.id)}')`)}</td></tr>`).join("");
            win("Chat Rooms", `<h2>Chat Rooms</h2><div class="emerald54-toolbar">${smallButton("Create Room", "createRoom54()")} ${smallButton("Global Lobby", "openEmeraldChat54('global','Global Lobby')")}</div><table class="emerald54-table"><thead><tr><th>Room</th><th>Type</th><th>Updated</th><th>Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="4">No rooms.</td></tr>`}</tbody></table>`, "rooms54");
        } catch (err) {
            win("Chat Rooms", `<div class="emerald54-danger">Could not list rooms: ${safe(err.message)}</div>`, "rooms54");
        }
    }

    async function createRoom54() {
        const label = prompt("Room name:");
        if (!label) return;
        const id = "room_" + uid(label);
        await ensureChatRoom(id, label, "public", []);
        openEmeraldChat54(id, label);
    }

    async function openDirectMessages54() {
        const users = (await listUsers()).filter(u => u.username !== currentUser());
        const rows = users.map(u => `<tr><td>${safe(u.displayName || u.username)}<br><span class="emerald54-note">${safe(u.username)}</span></td><td>${smallButton("Message", `startDM54('${safe(u.username)}')`)} ${smallButton("Profile", `openUserProfile54('${safe(u.username)}')`)}</td></tr>`).join("");
        win("Direct Messages", `<h2>Direct Messages</h2><table class="emerald54-table"><thead><tr><th>User</th><th>Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="2">No users found.</td></tr>`}</tbody></table>`, "directMessages54");
    }

    async function startDM54(username) {
        const roomId = dmRoom(currentUser(), username);
        const label = `DM: ${currentUser()} / ${username}`;
        await ensureChatRoom(roomId, label, "direct", [currentUser(), username]);
        openEmeraldChat54(roomId, label);
    }

    async function openCommunicationCenter54() {
        win("Communication Center", `<h2>Communication Center</h2><div class="emerald54-grid">
            <div class="emerald54-card emerald54-app-tile" onclick="openEmeraldChat54()"><h3>Emerald Chat</h3><p>Public rooms and direct messages.</p></div>
            <div class="emerald54-card emerald54-app-tile" onclick="openDirectMessages54()"><h3>Direct Messages</h3><p>Start one-on-one conversations.</p></div>
            <div class="emerald54-card emerald54-app-tile" onclick="openUsers54()"><h3>User Directory</h3><p>Find EmeraldOS users.</p></div>
            <div class="emerald54-card emerald54-app-tile" onclick="openNotificationCenter54()"><h3>Notifications</h3><p>View alerts and shared file notices.</p></div>
        </div>`, "communicationCenter54");
    }

    async function openUsers54() {
        const users = await listUsers();
        const rows = users.map(u => `<tr><td><span class="emerald54-status-dot"></span>${safe(u.displayName || u.username)}<br><span class="emerald54-note">${safe(u.username)}</span></td><td>${safe(u.role || "user")}</td><td>${dateTime(u.lastLogin || u.createdAt)}</td><td>${smallButton("Profile", `openUserProfile54('${safe(u.username)}')`)} ${smallButton("Message", `startDM54('${safe(u.username)}')`)} ${smallButton("Share File", `shareToUserPrompt54('${safe(u.username)}')`)}</td></tr>`).join("");
        win("EmeraldOS Users", `<h2>EmeraldOS Users</h2><div class="emerald54-toolbar"><input id="users54_filter" placeholder="Search users" oninput="filterTable54(this,'users54_table')"></div><table id="users54_table" class="emerald54-table"><thead><tr><th>User</th><th>Role</th><th>Activity</th><th>Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="4">No users found.</td></tr>`}</tbody></table>`, "users54");
    }

    async function shareToUserPrompt54(username) {
        const files = await loadFiles();
        const names = Object.entries(files).filter(([, f]) => !f.trashed).map(([id, f], i) => `${i + 1}. ${f.name || id} [${id}]`).join("\n");
        const pick = prompt(`Share which file with ${username}? Enter number, name, or file ID:\n\n${names}`);
        if (!pick) return;
        const entries = Object.entries(files).filter(([, f]) => !f.trashed);
        let found = entries[Number(pick) - 1];
        if (!found) found = entries.find(([id, f]) => id === pick || String(f.name).toLowerCase() === pick.toLowerCase());
        if (!found) return notify("File Sharing", "File not found.", "warning");
        const permission = prompt("Permission: view or edit", "view") || "view";
        await shareFile54(found[0], username, permission === "edit" ? "edit" : "view");
    }

    async function openMyProfile54() {
        const p = await getProfile(currentUser());
        win("My Profile", `<h2>My Profile</h2><div class="emerald54-grid"><div class="emerald54-card"><h3>${safe(p.initials || currentUser().slice(0,2).toUpperCase())}</h3><p>${safe(currentUser())}</p></div><div class="emerald54-card"><h3>Profile Details</h3><div class="emerald54-form-row">Display name<br><input id="profile54_display" value="${safe(p.displayName || currentUser())}"></div><div class="emerald54-form-row">Status<br><input id="profile54_status" value="${safe(p.status || "Available")}"></div><div class="emerald54-form-row">Bio<br><textarea id="profile54_bio" style="width:100%;height:100px;">${safe(p.bio || "")}</textarea></div>${smallButton("Save Profile", "saveMyProfile54()")}</div></div>`, "profile54");
    }

    async function saveMyProfile54() {
        await saveProfile({
            displayName: document.getElementById("profile54_display")?.value,
            status: document.getElementById("profile54_status")?.value,
            bio: document.getElementById("profile54_bio")?.value
        });
        notify("Profile", "Profile saved.", "success");
    }

    async function openUserProfile54(username) {
        const p = await getProfile(username);
        win("User Profile", `<h2>${safe(p.displayName || username)}</h2><div class="emerald54-inset"><b>Username:</b> ${safe(username)}<br><b>Status:</b> ${safe(p.status || "Available")}<br><b>Bio:</b><br>${safe(p.bio || "No bio set.")}</div><div class="emerald54-toolbar">${smallButton("Message", `startDM54('${safe(username)}')`)} ${smallButton("Share File", `shareToUserPrompt54('${safe(username)}')`)} ${smallButton("Add Contact", `addContact54('${safe(username)}')`)}</div>`, "userProfile54");
    }

    async function openContacts54() {
        const contacts = await loadContacts54();
        const rows = contacts.map(c => `<tr><td>${safe(c.username)}</td><td>${safe(c.favorite ? "Favorite" : "Contact")}</td><td>${smallButton("Message", `startDM54('${safe(c.username)}')`)} ${smallButton("Remove", `removeContact54('${safe(c.id)}')`)}</td></tr>`).join("");
        win("Contacts", `<h2>Contacts</h2><div class="emerald54-toolbar"><input id="contact54_name" placeholder="Username">${smallButton("Add", "addContactFromInput54()")}</div><table class="emerald54-table"><thead><tr><th>User</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="3">No contacts yet.</td></tr>`}</tbody></table>`, "contacts54");
    }

    async function loadContacts54() {
        try {
            const snap = await getDocs(collection(db, COL.users, currentUser(), COL.contacts));
            const rows = [];
            snap.forEach(d => rows.push({ id: d.id, ...(d.data() || {}) }));
            return rows.sort((a, b) => String(a.username).localeCompare(String(b.username)));
        } catch { return []; }
    }

    async function addContact54(username) {
        if (!username) return;
        await setDoc(doc(db, COL.users, currentUser(), COL.contacts, uid(username)), { username, addedAt: now(), favorite: false }, { merge: true });
        notify("Contacts", "Contact added.", "success");
    }
    async function addContactFromInput54() { const u = document.getElementById("contact54_name")?.value.trim(); if (u) { await addContact54(u); openContacts54(); } }
    async function removeContact54(id) { await deleteDoc(doc(db, COL.users, currentUser(), COL.contacts, id)); openContacts54(); }
    function openFriends54() { openContacts54(); }

    /* =====================================================
       MODERATION AND ADMINISTRATION
    ===================================================== */

    async function logMod(action, details) {
        try { await addDoc(collection(db, COL.logs), { action, details, actor: currentUser(), createdAt: now() }); }
        catch (err) { console.warn("Log skipped:", err); }
    }

    async function openModeratorConsole54() {
        if (!isModerator()) return win("Access Denied", `<div class="emerald54-danger">Moderator access is required.</div>`, "accessDenied54");
        win("Moderator Console", `<h2>Moderator Console</h2><div class="emerald54-grid">
            <div class="emerald54-card" onclick="openReportsReview54()"><h3>Reports Review</h3><p>Review reported messages.</p></div>
            <div class="emerald54-card" onclick="openCommunicationAudit54()"><h3>Communication Audit</h3><p>Recent message review.</p></div>
            <div class="emerald54-card" onclick="openModerationLog54()"><h3>Moderation Log</h3><p>View moderation actions.</p></div>
            <div class="emerald54-card" onclick="openMuteTools54()"><h3>Mute Tools</h3><p>Mute or unmute users.</p></div>
        </div>`, "moderatorConsole54");
    }

    async function openReportsReview54() {
        if (!isModerator()) return;
        const snap = await getDocs(collection(db, COL.reports));
        const rows = [];
        snap.forEach(d => rows.push({ id: d.id, ...(d.data() || {}) }));
        rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        const html = rows.map(r => `<tr><td>${safe(r.reason)}</td><td>${safe(r.reporter)}</td><td>${safe(r.roomId)}<br>${safe(r.messageId)}</td><td>${safe(r.status || "open")}</td><td>${smallButton("Close", `closeReport54('${safe(r.id)}')`)} ${smallButton("Delete Message", `deleteMessage54('${safe(r.roomId)}','${safe(r.messageId)}')`)}</td></tr>`).join("");
        win("Reports Review", `<h2>Reports Review</h2><table class="emerald54-table"><thead><tr><th>Reason</th><th>Reporter</th><th>Message</th><th>Status</th><th>Actions</th></tr></thead><tbody>${html || `<tr><td colspan="5">No reports.</td></tr>`}</tbody></table>`, "reportsReview54");
    }
    async function closeReport54(id) { await updateDoc(doc(db, COL.reports, id), { status: "closed", closedBy: currentUser(), closedAt: now() }); await logMod("report.close", `Closed report ${id}`); openReportsReview54(); }

    async function openCommunicationAudit54() {
        if (!isModerator()) return;
        try {
            const snap = await getDocs(collectionGroup(db, "messages"));
            const rows = [];
            snap.forEach(d => rows.push({ id: d.id, path: d.ref.path, ...(d.data() || {}) }));
            rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            const html = rows.slice(0, 120).map(m => `<tr><td>${safe(m.sender)}</td><td>${safe(m.text || "")}</td><td>${dateTime(m.createdAt)}</td><td>${safe(m.path)}</td></tr>`).join("");
            win("Communication Audit", `<h2>Communication Audit</h2><table class="emerald54-table"><thead><tr><th>Sender</th><th>Message</th><th>Time</th><th>Path</th></tr></thead><tbody>${html || `<tr><td colspan="4">No messages found.</td></tr>`}</tbody></table>`, "communicationAudit54");
        } catch (err) {
            win("Communication Audit", `<div class="emerald54-danger">Could not run audit: ${safe(err.message)}</div>`, "communicationAudit54");
        }
    }

    async function openModerationLog54() {
        if (!isModerator()) return;
        const snap = await getDocs(collection(db, COL.logs));
        const rows = [];
        snap.forEach(d => rows.push({ id: d.id, ...(d.data() || {}) }));
        rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        win("Moderation Log", `<h2>Moderation Log</h2><table class="emerald54-table"><thead><tr><th>Action</th><th>Actor</th><th>Details</th><th>Time</th></tr></thead><tbody>${rows.map(r => `<tr><td>${safe(r.action)}</td><td>${safe(r.actor)}</td><td>${safe(r.details)}</td><td>${dateTime(r.createdAt)}</td></tr>`).join("") || `<tr><td colspan="4">No log entries.</td></tr>`}</tbody></table>`, "modLog54");
    }

    function openMuteTools54() {
        if (!isModerator()) return;
        win("Mute Tools", `<h2>Mute Tools</h2><div class="emerald54-toolbar"><input id="mute54_user" placeholder="Username"><input id="mute54_reason" placeholder="Reason">${smallButton("Mute", "muteUser54()")} ${smallButton("Unmute", "unmuteUser54()")}</div>`, "muteTools54");
    }
    async function muteUser54() { const u = document.getElementById("mute54_user")?.value.trim(); const r = document.getElementById("mute54_reason")?.value || "Moderation mute"; if (!u) return; await setDoc(doc(db, COL.mutes, uid(u)), { username: u, reason: r, mutedBy: currentUser(), mutedAt: now(), active: true }, { merge: true }); await logMod("user.mute", `${u}: ${r}`); notify("Moderation", "User muted.", "warning"); }
    async function unmuteUser54() { const u = document.getElementById("mute54_user")?.value.trim(); if (!u) return; await setDoc(doc(db, COL.mutes, uid(u)), { username: u, active: false, unmutedBy: currentUser(), unmutedAt: now() }, { merge: true }); await logMod("user.unmute", u); notify("Moderation", "User unmuted.", "success"); }

    async function openAdminPanel54() {
        if (!isExecutive()) return win("Access Denied", `<div class="emerald54-danger">Executive access is required.</div>`, "accessDenied54");
        win("Administrative Panel", `<h2>Administrative Panel</h2><div class="emerald54-grid">
            <div class="emerald54-card" onclick="openAdminUsers54()"><h3>Users</h3><p>View users, roles, profiles, and account state.</p></div>
            <div class="emerald54-card" onclick="openAdminStorage54()"><h3>Storage</h3><p>View saved file metadata and storage usage.</p></div>
            <div class="emerald54-card" onclick="openAdminSharing54()"><h3>Sharing</h3><p>Audit file shares and permissions.</p></div>
            <div class="emerald54-card" onclick="openSecurityAudit54()"><h3>Security Audit</h3><p>Review reports, mutes, logs, and system warnings.</p></div>
        </div>`, "adminPanel54");
    }

    async function openAdminUsers54() {
        if (!isExecutive()) return;
        const users = await listUsers();
        const rows = users.map(u => `<tr><td>${safe(u.username)}</td><td>${safe(u.displayName || "")}</td><td>${safe(u.role || "user")}</td><td>${dateTime(u.createdAt)}</td><td>${smallButton("Files", `adminViewUserFiles54('${safe(u.username)}')`)} ${smallButton("Profile", `openUserProfile54('${safe(u.username)}')`)}</td></tr>`).join("");
        win("User Administration", `<h2>User Administration</h2><div class="emerald54-toolbar"><input placeholder="Search" oninput="filterTable54(this,'adminUsers54_table')"></div><table id="adminUsers54_table" class="emerald54-table"><thead><tr><th>Username</th><th>Display</th><th>Role</th><th>Created</th><th>Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="5">No users.</td></tr>`}</tbody></table>`, "adminUsers54");
    }

    async function adminViewUserFiles54(username) {
        if (!isExecutive()) return;
        try {
            const snap = await getDocs(collection(db, COL.users, username, "drive"));
            const rows = [];
            snap.forEach(d => rows.push({ id: d.id, ...(d.data() || {}) }));
            rows.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
            const total = rows.reduce((s, f) => s + fileSize(f), 0);
            win("User Files", `<h2>${safe(username)} Files</h2><div class="emerald54-inset"><b>Files:</b> ${rows.length}<br><b>Estimated storage:</b> ${formatBytes(total)}</div><table class="emerald54-table"><thead><tr><th>Name</th><th>ID</th><th>Size</th><th>Updated</th></tr></thead><tbody>${rows.map(f => `<tr><td>${safe(f.name)}</td><td>${safe(f.id)}</td><td>${formatBytes(fileSize(f))}</td><td>${dateTime(f.updatedAt || f.createdAt)}</td></tr>`).join("") || `<tr><td colspan="4">No files.</td></tr>`}</tbody></table>`, "adminUserFiles54");
        } catch (err) {
            win("User Files", `<div class="emerald54-danger">Could not read user files: ${safe(err.message)}</div>`, "adminUserFiles54");
        }
    }

    async function openAdminStorage54() {
        if (!isExecutive()) return;
        const users = await listUsers();
        const rows = [];
        for (const u of users.slice(0, 80)) {
            try {
                const snap = await getDocs(collection(db, COL.users, u.username, "drive"));
                let total = 0, count = 0;
                snap.forEach(d => { count++; total += fileSize(d.data() || {}); });
                rows.push(`<tr><td>${safe(u.username)}</td><td>${count}</td><td>${formatBytes(total)}</td><td>${smallButton("View", `adminViewUserFiles54('${safe(u.username)}')`)}</td></tr>`);
            } catch {}
        }
        win("Storage Administration", `<h2>Storage Administration</h2><table class="emerald54-table"><thead><tr><th>User</th><th>Files</th><th>Estimated Storage</th><th>Actions</th></tr></thead><tbody>${rows.join("") || `<tr><td colspan="4">No data.</td></tr>`}</tbody></table>`, "adminStorage54");
    }

    async function openAdminSharing54() {
        if (!isExecutive()) return;
        const snap = await getDocs(collection(db, COL.shares));
        const rows = [];
        snap.forEach(d => rows.push({ id: d.id, ...(d.data() || {}) }));
        rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        win("Sharing Administration", `<h2>Sharing Administration</h2><table class="emerald54-table"><thead><tr><th>File</th><th>Owner</th><th>Target</th><th>Permission</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows.map(s => `<tr><td>${safe(s.fileName)}</td><td>${safe(s.owner)}</td><td>${safe(s.targetUsername)}</td><td>${safe(s.permission)}</td><td>${safe(s.status)}</td><td>${s.status !== "revoked" ? smallButton("Revoke", `revokeShare54('${safe(s.id)}')`) : ""}</td></tr>`).join("") || `<tr><td colspan="6">No shares.</td></tr>`}</tbody></table>`, "adminSharing54");
    }

    async function openSecurityAudit54() {
        if (!isExecutive()) return;
        win("Security Audit", `<h2>Security Audit</h2><div class="emerald54-grid"><div class="emerald54-card" onclick="openReportsReview54()"><h3>Reports</h3></div><div class="emerald54-card" onclick="openModerationLog54()"><h3>Moderation Log</h3></div><div class="emerald54-card" onclick="openCommunicationAudit54()"><h3>Communication Audit</h3></div><div class="emerald54-card" onclick="openMuteTools54()"><h3>Mute Tools</h3></div></div>`, "securityAudit54");
    }

    /* =====================================================
       SETTINGS, NOTIFICATIONS, ASSISTANT, DESKTOP
    ===================================================== */

    function openNotificationCenter54() {
        const list = readNotifications();
        win("Notification Center", `<h2>Notification Center</h2><div class="emerald54-toolbar">${smallButton("Clear All", "clearNotifications54()")} ${smallButton("Test", "notify('EmeraldOS','Notification test complete.',2500,'info')")}</div><div class="emerald54-inset">${list.map(n => `<div class="emerald54-message"><b>${safe(n.title)}</b> <span class="emerald54-note">${dateTime(n.time)}</span><br>${safe(n.message)}</div>`).join("") || "No notifications."}</div>`, "notifications54");
    }
    function clearNotifications54() { localStorage.setItem(LS.notifications, "[]"); openNotificationCenter54(); }

    function openSettings54() {
        win("Settings", `<h2>Settings</h2><div class="emerald54-grid">
            <div class="emerald54-card"><h3>Desktop</h3><label><input type="checkbox" ${localStorage.getItem(LS.desktopLocked)==='true'?'checked':''} onchange="localStorage.setItem('${LS.desktopLocked}',this.checked?'true':'false')"> Lock desktop layout</label><br>${smallButton("Clean Desktop", "desktopClean54()")} ${smallButton("Render Desktop", "renderDesktop54()")}</div>
            <div class="emerald54-card"><h3>Assistant</h3><label><input type="checkbox" ${localStorage.getItem(LS.assistantEnabled)==='true'?'checked':''} onchange="localStorage.setItem('${LS.assistantEnabled}',this.checked?'true':'false')"> Enable Emerald Assistant</label><br><input id="assistant54_endpoint" placeholder="OpenAI-compatible endpoint" value="${safe(localStorage.getItem(LS.assistantEndpoint)||'')}"><br><input id="assistant54_key" placeholder="API key" type="password" value="${safe(localStorage.getItem(LS.assistantKey)||'')}"><br>${smallButton("Save Assistant Settings", "saveAssistantSettings54()")}</div>
            <div class="emerald54-card"><h3>Files</h3>${smallButton("Open Storage", "openStorage54()")} ${smallButton("Open Sharing", "openFileSharing54()")}</div>
            <div class="emerald54-card"><h3>Privacy</h3>${smallButton("Security & Privacy", "openSecurityPrivacy54()")}</div>
        </div>`, "settings54");
    }

    function saveAssistantSettings54() {
        localStorage.setItem(LS.assistantEndpoint, document.getElementById("assistant54_endpoint")?.value || "");
        localStorage.setItem(LS.assistantKey, document.getElementById("assistant54_key")?.value || "");
        notify("Settings", "Assistant settings saved.", "success");
    }

    function openAssistant54() {
        const enabled = localStorage.getItem(LS.assistantEnabled) === "true";
        win("Emerald Assistant", `<h2>Emerald Assistant</h2><div class="emerald54-${enabled ? "success" : "warning"}">${enabled ? "Assistant is enabled." : "Assistant is disabled. Enable it in Settings to use API mode. Offline tips are always available."}</div><div class="emerald54-toolbar"><input id="assistant54_prompt" placeholder="Ask for help with files, chat, or documents" style="flex:1;min-width:300px;" onkeydown="if(event.key==='Enter')askAssistant54()">${smallButton("Ask", "askAssistant54()")} ${smallButton("Offline Tips", "assistantTips54()")}</div><div id="assistant54_answer" class="emerald54-inset">Ready.</div>`, "assistant54");
    }

    function assistantTips54() {
        setHTML("assistant54_answer", `<b>Useful tips:</b><br>Use Files for storage and sharing.<br>Use Emerald Office for Writer, Sheets, Slides, and Forms.<br>Use Communication Center for chat and users.<br>Use Storage Center to review file size warnings.<br>Use Moderator Console for reports and message review.`);
    }

    async function askAssistant54() {
        const promptText = document.getElementById("assistant54_prompt")?.value || "";
        if (!promptText) return;
        const endpoint = localStorage.getItem(LS.assistantEndpoint) || "";
        const key = localStorage.getItem(LS.assistantKey) || "";
        const enabled = localStorage.getItem(LS.assistantEnabled) === "true";
        if (!enabled || !endpoint || !key) {
            setHTML("assistant54_answer", `Offline answer: Try opening Settings, Files, Communication Center, or Emerald Office. For writing help, open Emerald Writer and use Templates, Find, Replace, Table, and Export.`);
            return;
        }
        setHTML("assistant54_answer", "Contacting assistant endpoint...");
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
            setHTML("assistant54_answer", safe(answer).replaceAll("\n", "<br>"));
        } catch (err) {
            setHTML("assistant54_answer", `<div class="emerald54-danger">Assistant request failed: ${safe(err.message)}</div>`);
        }
    }

    function openSecurityPrivacy54() {
        win("Security & Privacy", `<h2>Security & Privacy</h2><div class="emerald54-inset"><b>Current user:</b> ${safe(currentUser())}<br><b>Role:</b> ${safe(roleText() || "user")}<br><b>Moderator access:</b> ${isModerator() ? "Yes" : "No"}<br><b>Executive access:</b> ${isExecutive() ? "Yes" : "No"}</div><div class="emerald54-toolbar">${smallButton("Clear Local Notifications", "clearNotifications54()")} ${smallButton("Reset Desktop Layout", "desktopReset54()")} ${smallButton("Open Shared by Me", "openSharedByMe54()")}</div>`, "security54");
    }
    function openPrivacy54() { openSecurityPrivacy54(); }

    function openDesktopTools54() {
        win("Desktop Tools", `<h2>Desktop Tools</h2><div class="emerald54-toolbar">${smallButton("Clean Desktop", "desktopClean54()")} ${smallButton("Render Desktop", "renderDesktop54()")} ${smallButton("Lock Layout", "desktopLock54()")} ${smallButton("Unlock Layout", "desktopUnlock54()")} ${smallButton("Reset Layout", "desktopReset54()")}</div><div class="emerald54-inset">Desktop folder mode is active. App clutter is consolidated into folders.</div>`, "desktopTools54");
    }
    function desktopClean54() { renderDesktop54(); renderStart54(); notify("Desktop", "Desktop cleaned.", "success"); }
    function desktopLock54() { localStorage.setItem(LS.desktopLocked, "true"); notify("Desktop", "Desktop layout locked.", "info"); }
    function desktopUnlock54() { localStorage.setItem(LS.desktopLocked, "false"); notify("Desktop", "Desktop layout unlocked.", "info"); }
    function desktopReset54() { localStorage.removeItem("40_desktop_positions"); renderDesktop54(); notify("Desktop", "Desktop layout reset.", "success"); }

    function openAppManager54() {
        const rows = Object.entries(window.APPS || {}).filter(([id]) => visibleApp(id)).map(([id, app]) => `<tr><td>${safe(app.name)}</td><td>${safe(id)}</td><td>${safe(app.edition || "economy")}</td><td>${smallButton("Open", `launchApp('${safe(id)}')`)}</td></tr>`).join("");
        win("App Manager", `<h2>App Manager</h2><table class="emerald54-table"><thead><tr><th>Application</th><th>ID</th><th>Edition</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table>`, "appManager54");
    }

    function openTasks54() { win("Task Board", `<h2>Task Board</h2><textarea style="width:100%;height:260px;" placeholder="Task list"></textarea>`, "tasks54"); }
    function openPlanner54() { win("Planner", `<h2>Planner</h2><textarea style="width:100%;height:260px;" placeholder="Plan details"></textarea>`, "planner54"); }
    async function openReports54() { const files = await loadFiles(); win("Reports", `<h2>Reports</h2><div class="emerald54-inset"><b>User:</b> ${safe(currentUser())}<br><b>Files:</b> ${Object.keys(files).length}<br><b>Notifications:</b> ${readNotifications().length}</div>`, "reports54"); }

    /* =====================================================
       TERMINAL AND UTILITIES
    ===================================================== */

    function filterTable54(input, tableId) {
        const q = String(input.value || "").toLowerCase();
        document.querySelectorAll(`#${CSS.escape(tableId)} tbody tr`).forEach(tr => {
            tr.style.display = tr.innerText.toLowerCase().includes(q) ? "" : "none";
        });
    }

    function copyText54(text) {
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
                "version": () => "EmeraldOS 5.4 - Intelligence, Security & Management Update",
                "build": () => "EmeraldOS 5.4 - Intelligence, Security & Management Update",
                "office": () => { openEmeraldOffice54(); return "Opening Emerald Office."; },
                "writer": () => { openWriter54(); return "Opening Emerald Writer."; },
                "sheets": () => { openSheets54(); return "Opening Emerald Sheets."; },
                "slides": () => { openSlides54(); return "Opening Emerald Slides."; },
                "files": () => { openFiles54(); return "Opening Files."; },
                "storage": () => { openStorage54(); return "Opening Storage Center."; },
                "sharing": () => { openFileSharing54(); return "Opening File Sharing."; },
                "shared": () => { openSharedWithMe54(); return "Opening Shared With Me."; },
                "chat": () => { openEmeraldChat54(); return "Opening Emerald Chat."; },
                "rooms": () => { openChatRooms54(); return "Opening Chat Rooms."; },
                "dm": () => { openDirectMessages54(); return "Opening Direct Messages."; },
                "users": () => { openUsers54(); return "Opening EmeraldOS Users."; },
                "profile": () => { openMyProfile54(); return "Opening My Profile."; },
                "contacts": () => { openContacts54(); return "Opening Contacts."; },
                "settings": () => { openSettings54(); return "Opening Settings."; },
                "notifications": () => { openNotificationCenter54(); return "Opening Notification Center."; },
                "assistant": () => { openAssistant54(); return "Opening Emerald Assistant."; },
                "desktop.clean": () => { desktopClean54(); return "Desktop cleaned."; },
                "desktop.lock": () => { desktopLock54(); return "Desktop locked."; },
                "desktop.unlock": () => { desktopUnlock54(); return "Desktop unlocked."; },
                "moderation": () => { openModeratorConsole54(); return "Opening Moderator Console."; },
                "mod": () => { openModeratorConsole54(); return "Opening Moderator Console."; },
                "admin": () => { openAdminPanel54(); return "Opening Administrative Panel."; }
            };
            if (map[cmd]) return map[cmd]();
            if (typeof original === "function") return original(raw);
            return `Unknown command: ${raw}`;
        };
    }

    function exposeGlobals() {
        Object.assign(window, {
            openFolder54,
            renderDesktop54,
            renderStart54,
            openEmeraldOffice54,
            openWriter54,
            writerCmd54,
            writerBlock54,
            writerFontSize54,
            writerColor54,
            writerInsertDate54,
            writerInsertTable54,
            writerInsertImage54,
            writerFind54,
            writerReplace54,
            writerCount54,
            writerAutosave54,
            saveWriter54,
            exportWriterText54,
            exportWriterHtml54,
            printWriter54,
            writerProperties54,
            openTemplates54,
            docTemplate,
            openDocumentVault54,
            openSheets54,
            sheetSum54,
            sheetExportCSV54,
            sheetSave54,
            openSlides54,
            renderSlides54,
            slideAdd54,
            slideSet54,
            slideDelete54,
            slideExport54,
            slideSave54,
            openForms54,
            formAddQuestion54,
            formSet54,
            formRemove54,
            formExport54,
            openFiles54,
            openFileFromFiles54,
            fileDetails54,
            renameFile54,
            deleteFileFromFiles54,
            restoreFile54,
            deleteForever54,
            newTextFile54,
            newOfficeDocument54,
            openStorage54,
            emptyTrash54,
            downloadStorageReport54,
            openFileSharing54,
            shareFilePrompt54,
            shareFile54,
            revokeShare54,
            openSharedWithMe54,
            openSharedByMe54,
            openSharedFile54,
            sharedDetails54,
            saveSharedEditCopy54,
            openTrash54,
            openEmeraldChat54,
            sendChat54,
            editMessage54,
            deleteMessage54,
            replyMessage54,
            reportMessage54,
            openChatRooms54,
            createRoom54,
            openDirectMessages54,
            startDM54,
            openCommunicationCenter54,
            openUsers54,
            shareToUserPrompt54,
            openMyProfile54,
            saveMyProfile54,
            openUserProfile54,
            openContacts54,
            addContact54,
            addContactFromInput54,
            removeContact54,
            openFriends54,
            openModeratorConsole54,
            openReportsReview54,
            closeReport54,
            openCommunicationAudit54,
            openModerationLog54,
            openMuteTools54,
            muteUser54,
            unmuteUser54,
            openAdminPanel54,
            openAdminUsers54,
            adminViewUserFiles54,
            openAdminStorage54,
            openAdminSharing54,
            openSecurityAudit54,
            openNotificationCenter54,
            clearNotifications54,
            openSettings54,
            saveAssistantSettings54,
            openAssistant54,
            askAssistant54,
            assistantTips54,
            openSecurityPrivacy54,
            openPrivacy54,
            openDesktopTools54,
            desktopClean54,
            desktopLock54,
            desktopUnlock54,
            desktopReset54,
            openAppManager54,
            openTasks54,
            openPlanner54,
            openReports54,
            filterTable54,
            copyText54
        });
    }

    function setBuildIdentity() {
        document.title = BUILD.displayName;
        localStorage.setItem("40_build_name", BUILD.displayName);
        localStorage.setItem("40_version", BUILD.version);
        try { window.EmeraldOSRegistry?.set?.("HKEY_LOCAL_MACHINE\\System\\Build\\Version", BUILD.version); } catch {}
        const badge = document.getElementById("emerald40-build-badge");
        if (badge) badge.innerHTML = `<span class="emerald54-badge">${safe(BUILD.displayName)}</span>`;
    }

    function init() {
        installStyles();
        patchWindowManager();
        exposeGlobals();
        installApps();
        setBuildIdentity();
        window.EMERALDOS_APP_CATEGORIES = FOLDERS;
        window.renderDesktopOverride = renderDesktop54;
        window.renderStartMenuOverride = renderStart54;
        window.renderDesktop = renderDesktop54;
        window.renderStartMenu = renderStart54;
        installTerminalCommands();
        renderDesktop54();
        renderStart54();
        setTimeout(patchWindowManager, 500);
        notify("EmeraldOS 5.4", "Intelligence, security, management, application editor, notifications, and desktop fixes loaded.", "success");
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", () => setTimeout(init, 160));
    } else {
        setTimeout(init, 160);
    }
})();


/* =========================================================
   EMERALDOS 5.4 FEATURE PACK
   APPLICATION EDITOR, NOTIFICATION BELL, BLOCKING, FILES 4.0
========================================================= */

(function () {
    if (window.EmeraldOS54FeaturePackLoaded) return;
    window.EmeraldOS54FeaturePackLoaded = true;

    const BUILD = {
        version: "5.4",
        displayName: "EmeraldOS 5.4",
        codename: "Intelligence, Security & Management Update",
        fileLimit: 1024 * 1024
    };

    const LS = {
        notifications: "54_notifications",
        userApps: "54_user_applications",
        fileMeta: "54_file_metadata",
        blockedUsers: "54_blocked_users",
        settings: "54_settings",
        recentFiles: "54_recent_files",
        desktopLayout: "54_desktop_layout",
        shareSeen: "54_seen_share_ids",
        messageSeen: "54_seen_message_ids"
    };

    const COL = {
        users: "emeraldOSUsers",
        shares: "emeraldOSShares",
        rooms: "emeraldOSChatRooms",
        reports: "emeraldOSChatReports",
        blocks: "emeraldOSBlocks",
        logs: "emeraldOSModerationLogs"
    };

    const originalNotify54 = window.notify;
    let bellTimer54 = null;
    let roomWatchUnsubs54 = [];

    function safe54x(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function currentUser54x() {
        return String(localStorage.getItem("40_username") || localStorage.getItem("username") || localStorage.getItem("40_session") || "Guest").trim() || "Guest";
    }

    function userKey54x(value = "") {
        return String(value || "").trim().toLowerCase();
    }

    function now54x() { return Date.now(); }

    function date54x(value) {
        if (!value) return "";
        try { return new Date(value).toLocaleString(); } catch { return String(value); }
    }

    function bytes54x(n = 0) {
        n = Number(n || 0);
        if (n < 1024) return n + " B";
        if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
        return (n / (1024 * 1024)).toFixed(2) + " MB";
    }

    function getJSON54(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
        catch { return fallback; }
    }

    function setJSON54(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function canSee54x(required = "economy") {
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

    function win54x(title, html, app = "emerald54") {
        const body = `<div class="emerald54-panel emerald54-feature-panel">${html}</div>`;
        const w = window.openWindow?.(title, body, app) || null;
        setTimeout(patchAllWindows54, 40);
        return w;
    }

    function button54(label, action, className = "") {
        return `<button class="win95-small-button emerald54-button ${className}" onclick="${action}">${safe54x(label)}</button>`;
    }

    function installFeatureStyles54() {
        if (document.getElementById("emerald54-feature-style")) return;
        const style = document.createElement("style");
        style.id = "emerald54-feature-style";
        style.textContent = `
            input, textarea, select, [contenteditable="true"], .emerald54-editor, .emerald54-codearea {
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
            .emerald54-feature-panel input,.emerald54-feature-panel textarea,.emerald54-feature-panel select{font-family:"MS Sans Serif",Tahoma,Arial,sans-serif;font-size:12px;}
            .emerald54-feature-panel textarea{width:100%;box-sizing:border-box;min-height:100px;resize:vertical;background:#fff;border:2px inset #fff;padding:6px;}
            .emerald54-feature-panel input,.emerald54-feature-panel select{background:#fff;border:2px inset #fff;padding:3px;box-sizing:border-box;}
            .emerald54-grid-tight{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:8px;}
            .emerald54-card2{background:#c0c0c0;border:2px solid;border-color:#fff #808080 #808080 #fff;padding:8px;margin:6px 0;}
            .emerald54-inset2{background:#fff;border:2px inset #fff;padding:8px;margin:6px 0;overflow:auto;}
            .emerald54-table2{width:100%;border-collapse:collapse;background:#fff;font-size:12px;}
            .emerald54-table2 th,.emerald54-table2 td{border:1px solid #808080;padding:4px;text-align:left;vertical-align:top;}
            .emerald54-table2 th{background:#000080;color:#fff;}
            .emerald54-codearea{font-family:Consolas,"Courier New",monospace;min-height:240px;white-space:pre;tab-size:4;}
            .emerald54-bell{height:28px;min-width:34px;background:#c0c0c0;border:2px solid;border-color:#fff #808080 #808080 #fff;margin-left:4px;position:relative;font-family:inherit;cursor:pointer;}
            .emerald54-bell:active{border-color:#808080 #fff #fff #808080;}
            .emerald54-bell-count{position:absolute;right:-6px;top:-7px;min-width:16px;height:16px;border:1px solid #000;background:#c00000;color:#fff;font-size:10px;line-height:15px;text-align:center;font-weight:bold;display:none;}
            .emerald54-bell.has-unread .emerald54-bell-count{display:block;}
            .emerald54-bell.has-unread{box-shadow:0 0 0 2px #ffff00 inset;}
            .emerald54-folder-icon{width:86px;min-height:78px;text-align:center;color:white;cursor:pointer;padding:4px;box-sizing:border-box;outline:none;}
            .emerald54-folder-icon:focus{outline:none !important;}
            .emerald54-folder-symbol{height:38px;display:flex;align-items:center;justify-content:center;color:#000;background:#c0c000;border:2px solid;border-color:#ffff80 #808000 #808000 #ffff80;font-weight:bold;font-size:11px;margin:0 auto 4px;}
            .emerald54-folder-label{text-shadow:1px 1px #000;font-size:12px;line-height:1.1;}
            .emerald54-app-frame{width:100%;height:420px;border:2px inset #fff;background:#fff;box-sizing:border-box;}
            .emerald54-editor-page{background:#fff;border:2px inset #fff;min-height:380px;padding:28px;margin:6px 0;line-height:1.45;outline:none;user-select:text;}
            .emerald54-toolbar2{display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin:6px 0;}
            .emerald54-pill{display:inline-block;padding:2px 5px;border:1px solid #808080;background:#fff;margin:1px;}
            .emerald54-danger{background:#ffd6d6;border:2px inset #fff;padding:8px;margin:6px 0;}
            .emerald54-good{background:#ddffdd;border:2px inset #fff;padding:8px;margin:6px 0;}
            .emerald54-warn{background:#fff4c4;border:2px inset #fff;padding:8px;margin:6px 0;}
        `;
        document.head.appendChild(style);
    }

    /* =====================================================
       WINDOW / TASKBAR PATCH
    ===================================================== */

    function patchAllWindows54() {
        document.querySelectorAll(".window").forEach(win => {
            if (win.dataset.emerald54WindowPatched === "true") return;
            win.dataset.emerald54WindowPatched = "true";

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

    function installWindowObserver54() {
        patchAllWindows54();
        if (window.__emerald54WindowObserver) return;
        window.__emerald54WindowObserver = new MutationObserver(() => setTimeout(patchAllWindows54, 30));
        window.__emerald54WindowObserver.observe(document.body, { childList: true, subtree: true });
        setInterval(patchAllWindows54, 1500);
    }

    /* =====================================================
       NOTIFICATION BELL
    ===================================================== */

    function readNotifications54() {
        return getJSON54(LS.notifications, []);
    }

    function saveNotifications54(list) {
        setJSON54(LS.notifications, list.slice(0, 150));
        updateBell54();
    }

    function addNotification54(title, message = "", type = "info", source = "system") {
        const list = readNotifications54();
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
        saveNotifications54(list);
        return item;
    }

    function markNotificationsRead54() {
        const list = readNotifications54().map(n => Object.assign({}, n, { read: true }));
        saveNotifications54(list);
        openNotificationCenter54();
    }

    function clearNotifications54() {
        saveNotifications54([]);
        openNotificationCenter54();
    }

    function updateBell54() {
        const bell = document.getElementById("emerald54-bell");
        if (!bell) return;
        const count = readNotifications54().filter(n => !n.read).length;
        bell.classList.toggle("has-unread", count > 0);
        const badge = bell.querySelector(".emerald54-bell-count");
        if (badge) badge.textContent = String(Math.min(count, 99));
        bell.title = count ? `${count} unread EmeraldOS notification${count === 1 ? "" : "s"}` : "No unread EmeraldOS notifications";
    }

    function installBell54() {
        if (document.getElementById("emerald54-bell")) { updateBell54(); return; }
        const taskbar = document.getElementById("taskbar");
        const clock = document.getElementById("clock");
        if (!taskbar) return;
        const bell = document.createElement("button");
        bell.id = "emerald54-bell";
        bell.className = "emerald54-bell";
        bell.innerHTML = `BELL<span class="emerald54-bell-count">0</span>`;
        bell.onclick = () => openNotificationCenter54();
        if (clock) taskbar.insertBefore(bell, clock);
        else taskbar.appendChild(bell);
        updateBell54();
    }

    function patchNotify54() {
        if (window.notify?.__emerald54BellPatched) return;
        const wrapped = function(title, message, timeout, type) {
            try { originalNotify54?.(title, message, timeout, type); } catch {}
            try { addNotification54(title, message, type || "info", "system"); } catch {}
        };
        wrapped.__emerald54BellPatched = true;
        window.notify = wrapped;
    }

    function openNotificationCenter54() {
        const list = readNotifications54();
        const unread = list.filter(n => !n.read).length;
        const rows = list.map(n => `
            <tr>
                <td>${n.read ? "" : "<b>Unread</b>"}</td>
                <td><b>${safe54x(n.title)}</b><br><span class="emerald54-note">${safe54x(n.source || "system")} · ${date54x(n.time)}</span></td>
                <td>${safe54x(n.message)}</td>
            </tr>`).join("") || `<tr><td colspan="3">No notifications.</td></tr>`;
        win54x("Notification Center", `
            <h2>Notification Center</h2>
            <div class="emerald54-toolbar2">
                ${button54("Mark All Read", "markNotificationsRead54()")}
                ${button54("Clear All", "clearNotifications54()")}
                ${button54("Settings", "openSettings54()")}
            </div>
            <div class="emerald54-inset2"><b>${unread}</b> unread notification${unread === 1 ? "" : "s"}. The taskbar bell remains visible while unread items exist.</div>
            <table class="emerald54-table2"><tr><th>Status</th><th>Notification</th><th>Message</th></tr>${rows}</table>
        `, "notifications54");
    }

    /* =====================================================
       USER BLOCKING
    ===================================================== */

    function readBlocked54() { return getJSON54(LS.blockedUsers, []); }
    function isBlocked54(username) { return readBlocked54().map(userKey54x).includes(userKey54x(username)); }

    async function blockUser54(username) {
        username = String(username || prompt("Block which EmeraldOS username?") || "").trim();
        if (!username) return;
        const list = readBlocked54();
        if (!list.map(userKey54x).includes(userKey54x(username))) list.push(username);
        setJSON54(LS.blockedUsers, list);
        try {
            const id = userKey54x(currentUser54x()) + "__" + userKey54x(username);
            await setDoc(doc(db, COL.blocks, id), { blocker: currentUser54x(), blocked: username, createdAt: Date.now() });
        } catch {}
        addNotification54("User blocked", `${username} was added to your blocked users list.`, "warning", "privacy");
        openBlockingCenter54();
    }

    async function unblockUser54(username) {
        username = String(username || "").trim();
        const list = readBlocked54().filter(u => userKey54x(u) !== userKey54x(username));
        setJSON54(LS.blockedUsers, list);
        try {
            const id = userKey54x(currentUser54x()) + "__" + userKey54x(username);
            await deleteDoc(doc(db, COL.blocks, id));
        } catch {}
        addNotification54("User unblocked", `${username} was removed from your blocked users list.`, "info", "privacy");
        openBlockingCenter54();
    }

    function openBlockingCenter54() {
        const rows = readBlocked54().map(u => `<tr><td>${safe54x(u)}</td><td>${button54("Unblock", `unblockUser54('${safe54x(u)}')`)}</td></tr>`).join("") || `<tr><td colspan="2">No blocked users.</td></tr>`;
        win54x("Blocking Center", `
            <h2>Blocking Center</h2>
            <div class="emerald54-inset2">Blocked users cannot be quickly contacted from your directory tools, and their messages can be filtered by EmeraldOS apps.</div>
            <div class="emerald54-toolbar2">
                <input id="blockUser54Name" placeholder="Username">
                ${button54("Block User", "blockUser54(document.getElementById('blockUser54Name').value)")}
            </div>
            <table class="emerald54-table2"><tr><th>User</th><th>Action</th></tr>${rows}</table>
        `, "blocking54");
    }

    async function listUsers54x() {
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

    async function openUsers54() {
        const users = await listUsers54x();
        const rows = users.map(u => {
            const name = u.username || u.id;
            const blocked = isBlocked54(name);
            return `<tr>
                <td><b>${safe54x(name)}</b><br><span class="emerald54-note">${safe54x(u.displayName || u.name || "EmeraldOS user")}</span></td>
                <td>${safe54x(u.status || u.role || "User")}</td>
                <td>
                    ${button54("Profile", `openUserProfile54('${safe54x(name)}')`)}
                    ${button54("Chat", `startDM54('${safe54x(name)}')`)}
                    ${button54("Share File", `shareToUserPrompt54('${safe54x(name)}')`)}
                    ${blocked ? button54("Unblock", `unblockUser54('${safe54x(name)}')`) : button54("Block", `blockUser54('${safe54x(name)}')`, "danger")}
                </td>
            </tr>`;
        }).join("") || `<tr><td colspan="3">No EmeraldOS users found.</td></tr>`;
        win54x("EmeraldOS Users", `
            <h2>EmeraldOS Users</h2>
            <div class="emerald54-toolbar2">
                <input id="emerald54UserSearch" placeholder="Search users" oninput="filterTable54('emerald54UsersTable',this.value)">
                ${button54("Blocking Center", "openBlockingCenter54()")}
                ${button54("Contacts", "openContacts54()")}
            </div>
            <table class="emerald54-table2" id="emerald54UsersTable"><tr><th>User</th><th>Status</th><th>Actions</th></tr>${rows}</table>
        `, "users54");
    }

    function filterTable54(id, q) {
        q = String(q || "").toLowerCase();
        document.querySelectorAll(`#${id} tr`).forEach((tr, i) => {
            if (i === 0) return;
            tr.style.display = tr.textContent.toLowerCase().includes(q) ? "" : "none";
        });
    }

    /* =====================================================
       APPLICATION EDITOR
    ===================================================== */

    function userApps54() { return getJSON54(LS.userApps, []); }
    function saveUserApps54(list) { setJSON54(LS.userApps, list); registerUserApplications54(); renderDesktop54Final(); renderStart54Final(); }

    function appId54(name) {
        return "u" + String(name || "app").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) + "_" + Date.now().toString(36);
    }

    function openApplicationEditor54(appId = "") {
        const apps = userApps54();
        const app = apps.find(a => a.id === appId) || { id: "", name: "My Application", icon: "APP", code: "api.setTitle('My Application');\napi.write('<h1>Hello from my EmeraldOS app</h1><p>This app was made in Application Editor.</p>');\napi.button('Send notification', () => api.notify('Hello', 'Notification from your custom app.'));" };
        const list = apps.map(a => `<tr><td><b>${safe54x(a.name)}</b><br><span class="emerald54-note">${safe54x(a.id)}</span></td><td>${safe54x(a.icon || "APP")}</td><td>${button54("Edit", `openApplicationEditor54('${safe54x(a.id)}')`)} ${button54("Run", `runUserApplication54('${safe54x(a.id)}')`)} ${button54("Delete", `deleteUserApplication54('${safe54x(a.id)}')`)}</td></tr>`).join("") || `<tr><td colspan="3">No custom applications yet.</td></tr>`;
        win54x("Application Editor", `
            <h2>Application Editor</h2>
            <div class="emerald54-warn"><b>Sandboxed custom apps:</b> User applications run inside a restricted iframe. They can draw an interface and send notifications, but they do not get direct access to EmeraldOS internals by default.</div>
            <div class="emerald54-grid-tight">
                <div>
                    <label>Application Name</label><br>
                    <input id="appEditor54Id" type="hidden" value="${safe54x(app.id)}">
                    <input id="appEditor54Name" style="width:100%" value="${safe54x(app.name)}">
                </div>
                <div>
                    <label>Icon Label</label><br>
                    <input id="appEditor54Icon" style="width:100%" value="${safe54x(app.icon || "APP")}">
                </div>
            </div>
            <label>Application JavaScript</label>
            <textarea id="appEditor54Code" class="emerald54-codearea" spellcheck="false">${safe54x(app.code)}</textarea>
            <div class="emerald54-toolbar2">
                ${button54("Save Application", "saveUserApplication54()")}
                ${button54("Run Preview", "previewUserApplication54()")}
                ${button54("New Blank App", "openApplicationEditor54()")}
                ${button54("User Applications", "openUserApplications54()")}
            </div>
            <h3>Saved User Applications</h3>
            <table class="emerald54-table2"><tr><th>Name</th><th>Icon</th><th>Actions</th></tr>${list}</table>
        `, "appEditor54");
    }

    function saveUserApplication54() {
        const idField = document.getElementById("appEditor54Id");
        const name = document.getElementById("appEditor54Name")?.value?.trim() || "Untitled Application";
        const icon = document.getElementById("appEditor54Icon")?.value?.trim() || "APP";
        const code = document.getElementById("appEditor54Code")?.value || "";
        const apps = userApps54();
        let id = idField?.value || "";
        if (!id) id = appId54(name);
        const existing = apps.findIndex(a => a.id === id);
        const record = { id, name, icon, code, updatedAt: Date.now() };
        if (existing >= 0) apps[existing] = Object.assign({}, apps[existing], record);
        else apps.push(record);
        saveUserApps54(apps);
        addNotification54("Application saved", `${name} was added to your desktop applications.`, "success", "application-editor");
        openApplicationEditor54(id);
    }

    function previewUserApplication54() {
        const temp = {
            id: "preview",
            name: document.getElementById("appEditor54Name")?.value || "Preview",
            icon: document.getElementById("appEditor54Icon")?.value || "APP",
            code: document.getElementById("appEditor54Code")?.value || ""
        };
        launchSandboxApp54(temp);
    }

    function deleteUserApplication54(id) {
        if (!confirm("Delete this custom application?")) return;
        saveUserApps54(userApps54().filter(a => a.id !== id));
        addNotification54("Application deleted", "The custom application was removed.", "info", "application-editor");
        openApplicationEditor54();
    }

    function runUserApplication54(id) {
        const app = userApps54().find(a => a.id === id);
        if (!app) return alert("Application not found.");
        launchSandboxApp54(app);
    }

    function launchSandboxApp54(app) {
        const code = String(app.code || "");
        const title = String(app.name || "User Application");
        const frameId = "frame54_" + Math.random().toString(36).slice(2);
        win54x(title, `<iframe id="${frameId}" class="emerald54-app-frame" sandbox="allow-scripts allow-forms allow-modals"></iframe>`, "userapp54");
        setTimeout(() => {
            const frame = document.getElementById(frameId);
            if (!frame) return;
            const src = `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Tahoma,Arial,sans-serif;margin:0;padding:10px;background:#fff;color:#000}button{margin:3px;padding:4px 8px}.bar{background:#c0c0c0;border:2px solid;border-color:#fff #808080 #808080 #fff;padding:6px;margin-bottom:8px}.out{padding:8px}</style></head><body><div class="bar"><b id="title"></b></div><div id="app" class="out"></div><script>const app=document.getElementById('app');const api={setTitle:t=>{document.getElementById('title').textContent=String(t||'');},write:h=>{app.innerHTML=String(h||'');},append:h=>{app.insertAdjacentHTML('beforeend',String(h||''));},text:t=>{app.textContent=String(t||'');},button:(label,fn)=>{const b=document.createElement('button');b.textContent=label;b.onclick=fn;app.appendChild(b);return b;},notify:(title,message)=>{parent.postMessage({type:'emerald54_notify',title:String(title||'App'),message:String(message||'')},'*');}};try{api.setTitle(${JSON.stringify(title)});const userCode=${JSON.stringify(code)};new Function('api',userCode)(api);}catch(err){app.innerHTML='<pre style="color:#800000;white-space:pre-wrap"></pre>';app.querySelector('pre').textContent='Application error: '+err.message;}<\/script></body></html>`;
            frame.srcdoc = src;
        }, 80);
    }

    function openUserApplications54() {
        const rows = userApps54().map(a => `<tr><td><b>${safe54x(a.name)}</b><br><span class="emerald54-note">${safe54x(a.id)}</span></td><td>${safe54x(a.icon)}</td><td>${date54x(a.updatedAt)}</td><td>${button54("Open", `runUserApplication54('${safe54x(a.id)}')`)} ${button54("Edit", `openApplicationEditor54('${safe54x(a.id)}')`)}</td></tr>`).join("") || `<tr><td colspan="4">No custom applications have been created.</td></tr>`;
        win54x("User Applications", `<h2>User Applications</h2><div class="emerald54-toolbar2">${button54("Create Application", "openApplicationEditor54()")}</div><table class="emerald54-table2"><tr><th>Name</th><th>Icon</th><th>Updated</th><th>Actions</th></tr>${rows}</table>`, "userApps54");
    }

    function registerUserApplications54() {
        if (!window.APPS) window.APPS = {};
        Object.keys(window.APPS).filter(id => id.startsWith("userapp54_")).forEach(id => delete window.APPS[id]);
        userApps54().forEach(a => {
            window.APPS["userapp54_" + a.id] = { name: a.name, icon: a.icon || "APP", edition: "economy", category: "custom", launch: () => runUserApplication54(a.id) };
        });
    }

    window.addEventListener("message", ev => {
        if (ev.data?.type === "emerald54_notify") {
            window.notify?.(ev.data.title || "Application", ev.data.message || "", 3500, "info");
        }
    });

    /* =====================================================
       FILES / STORAGE / SHARING
    ===================================================== */

    async function loadFiles54x() {
        try {
            const files = await loadDrive() || {};
            if (window.fileSystem) window.fileSystem.files = files;
            return files;
        } catch (err) {
            console.warn("Files load failed:", err);
            return window.fileSystem?.files || {};
        }
    }

    function fileMeta54() { return getJSON54(LS.fileMeta, { folders: ["Drive", "Documents", "Shared", "Archive", "Trash"], files: {}, versions: {} }); }
    function saveFileMeta54(meta) { setJSON54(LS.fileMeta, meta); }
    function fileSize54(f) { try { return f.storageSize || f.size || new Blob([String(f.content || "")]).size || 0; } catch { return 0; } }

    function fileType54(name = "") {
        const lower = String(name).toLowerCase();
        if (/\.(edoc|doc|docx|txt|md|html)$/i.test(lower)) return "Document";
        if (/\.(esheet|csv|xls|xlsx)$/i.test(lower)) return "Spreadsheet";
        if (/\.(eslide|ppt|pptx)$/i.test(lower)) return "Presentation";
        if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(lower)) return "Image";
        return "File";
    }

    async function openAdvancedFiles54(folder = "") {
        const files = await loadFiles54x();
        const meta = fileMeta54();
        const folders = meta.folders || [];
        const selected = folder || localStorage.getItem("54_last_folder") || "Drive";
        localStorage.setItem("54_last_folder", selected);
        const folderButtons = folders.map(f => button54(f, `openAdvancedFiles54('${safe54x(f)}')`)).join(" ");
        const rows = Object.entries(files).filter(([id]) => {
            const m = meta.files[id] || {};
            if (m.deleted && selected !== "Trash") return false;
            if (selected === "Trash") return !!m.deleted;
            if (selected === "Starred") return !!m.starred;
            if (selected === "Recent") return getJSON54(LS.recentFiles, []).includes(id);
            return (m.folder || "Drive") === selected || (selected === "Drive" && !m.folder);
        }).map(([id, f]) => {
            const m = meta.files[id] || {};
            const size = fileSize54(f);
            const tooLarge = size > BUILD.fileLimit;
            return `<tr>
                <td>${m.starred ? "STAR" : ""}</td>
                <td><b>${safe54x(f.name || id)}</b><br><span class="emerald54-note">ID: ${safe54x(id)} · ${safe54x(fileType54(f.name))}</span><br><span class="emerald54-pill">${safe54x(m.folder || "Drive")}</span> ${(m.tags || []).map(t => `<span class="emerald54-pill">${safe54x(t)}</span>`).join("")}</td>
                <td>${bytes54x(size)}${tooLarge ? `<br><b style="color:#800000">Over free file limit</b>` : ""}</td>
                <td>${date54x(f.updatedAt || f.createdAt)}</td>
                <td>
                    ${button54("Open", `openFileFromFiles54('${safe54x(id)}')`)}
                    ${button54("Share", `shareFilePrompt54('${safe54x(id)}')`)}
                    ${button54(m.starred ? "Unstar" : "Star", `toggleStarFile54('${safe54x(id)}')`)}
                    ${button54("Move", `moveFile54('${safe54x(id)}')`)}
                    ${button54("Tags", `tagFile54('${safe54x(id)}')`)}
                    ${button54("Details", `fileDetails54('${safe54x(id)}')`)}
                    ${button54("Versions", `fileVersions54('${safe54x(id)}')`)}
                    ${m.deleted ? button54("Restore", `restoreFile54('${safe54x(id)}')`) + button54("Delete Forever", `deleteForever54('${safe54x(id)}')`) : button54("Trash", `deleteFileFromFiles54('${safe54x(id)}')`)}
                </td>
            </tr>`;
        }).join("") || `<tr><td colspan="5">No files in this view.</td></tr>`;
        const total = Object.values(files).reduce((sum, f) => sum + fileSize54(f), 0);
        const warn = total > BUILD.fileLimit ? `<div class="emerald54-warn"><b>Storage warning:</b> your saved files are estimated at ${bytes54x(total)}. Free file uploads over 1 MB should be reviewed before saving.</div>` : `<div class="emerald54-good">Estimated storage use: ${bytes54x(total)}</div>`;
        win54x("Files", `
            <h2>Files</h2>
            ${warn}
            <div class="emerald54-toolbar2">
                ${button54("New Text File", "newTextFile54()")}
                ${button54("New Folder", "createFolder54()")}
                ${button54("Starred", "openAdvancedFiles54('Starred')")}
                ${button54("Recent", "openAdvancedFiles54('Recent')")}
                ${button54("Trash", "openAdvancedFiles54('Trash')")}
                ${button54("Sharing", "openSharingManager54()")}
                <input placeholder="Search files" oninput="filterTable54('filesTable54',this.value)">
            </div>
            <div class="emerald54-toolbar2">${folderButtons}</div>
            <table class="emerald54-table2" id="filesTable54"><tr><th></th><th>File</th><th>Size</th><th>Updated</th><th>Actions</th></tr>${rows}</table>
        `, "files54");
    }

    function createFolder54() {
        const name = prompt("Folder name:");
        if (!name) return;
        const meta = fileMeta54();
        meta.folders = Array.from(new Set([...(meta.folders || []), name.trim()]));
        saveFileMeta54(meta);
        openAdvancedFiles54(name.trim());
    }

    function toggleStarFile54(id) {
        const meta = fileMeta54();
        meta.files[id] = Object.assign({}, meta.files[id], { starred: !meta.files[id]?.starred });
        saveFileMeta54(meta);
        openAdvancedFiles54();
    }

    function moveFile54(id) {
        const meta = fileMeta54();
        const folder = prompt("Move to folder:", meta.files[id]?.folder || "Drive");
        if (!folder) return;
        meta.folders = Array.from(new Set([...(meta.folders || []), folder.trim()]));
        meta.files[id] = Object.assign({}, meta.files[id], { folder: folder.trim() });
        saveFileMeta54(meta);
        openAdvancedFiles54(folder.trim());
    }

    function tagFile54(id) {
        const meta = fileMeta54();
        const tags = prompt("Tags, comma-separated:", (meta.files[id]?.tags || []).join(", "));
        if (tags === null) return;
        meta.files[id] = Object.assign({}, meta.files[id], { tags: tags.split(",").map(t => t.trim()).filter(Boolean) });
        saveFileMeta54(meta);
        openAdvancedFiles54();
    }

    async function fileDetails54(id) {
        const files = await loadFiles54x();
        const f = files[id] || {};
        const meta = fileMeta54().files[id] || {};
        win54x("File Details", `<h2>${safe54x(f.name || id)}</h2><div class="emerald54-inset2"><b>ID:</b> ${safe54x(id)}<br><b>Type:</b> ${safe54x(fileType54(f.name))}<br><b>Size:</b> ${bytes54x(fileSize54(f))}<br><b>Folder:</b> ${safe54x(meta.folder || "Drive")}<br><b>Tags:</b> ${safe54x((meta.tags || []).join(", "))}<br><b>Shared:</b> ${meta.shared ? "Yes" : "Unknown"}</div><div class="emerald54-toolbar2">${button54("Share", `shareFilePrompt54('${safe54x(id)}')`)} ${button54("Move", `moveFile54('${safe54x(id)}')`)} ${button54("Versions", `fileVersions54('${safe54x(id)}')`)}</div>`, "fileDetails54");
    }

    function fileVersions54(id) {
        const meta = fileMeta54();
        const versions = meta.versions[id] || [];
        const rows = versions.map((v, i) => `<tr><td>${i + 1}</td><td>${date54x(v.time)}</td><td>${safe54x(v.note || "Saved snapshot")}</td></tr>`).join("") || `<tr><td colspan="3">No version snapshots recorded yet.</td></tr>`;
        win54x("File Version History", `<h2>Version History</h2><div class="emerald54-inset2">EmeraldOS records local metadata snapshots when files are changed through 5.4 tools.</div><table class="emerald54-table2"><tr><th>#</th><th>Time</th><th>Note</th></tr>${rows}</table>`, "versions54");
    }

    async function renameFile54(id) {
        const files = await loadFiles54x();
        const f = files[id];
        if (!f) return;
        const name = prompt("New file name:", f.name || id);
        if (!name) return;
        const meta = fileMeta54();
        meta.versions[id] = [{ time: Date.now(), note: "Renamed from " + (f.name || id) }, ...(meta.versions[id] || [])].slice(0, 20);
        saveFileMeta54(meta);
        await cloudSaveFile(id, Object.assign({}, f, { name: name.trim(), updatedAt: Date.now() }));
        addNotification54("File renamed", `${f.name || id} was renamed to ${name}.`, "info", "files");
        openAdvancedFiles54();
    }

    async function deleteFileFromFiles54(id) {
        const meta = fileMeta54();
        meta.files[id] = Object.assign({}, meta.files[id], { deleted: true, folder: "Trash" });
        saveFileMeta54(meta);
        addNotification54("File moved to Trash", `File ${id} was moved to Trash.`, "warning", "files");
        openAdvancedFiles54("Trash");
    }

    function restoreFile54(id) {
        const meta = fileMeta54();
        meta.files[id] = Object.assign({}, meta.files[id], { deleted: false, folder: "Drive" });
        saveFileMeta54(meta);
        openAdvancedFiles54("Drive");
    }

    async function deleteForever54(id) {
        if (!confirm("Delete this file forever?")) return;
        await cloudDeleteFile(id);
        const meta = fileMeta54();
        delete meta.files[id];
        saveFileMeta54(meta);
        addNotification54("File deleted", `File ${id} was deleted forever.`, "warning", "files");
        openAdvancedFiles54("Trash");
    }

    async function newTextFile54() {
        const name = prompt("File name:", "Untitled.txt");
        if (!name) return;
        const content = prompt("Starting text:", "") || "";
        if (new Blob([content]).size > BUILD.fileLimit) alert("Warning: this content is over the 1 MB free file limit.");
        await cloudCreateFile(name, content);
        addNotification54("File created", `${name} was saved in Files.`, "success", "files");
        openAdvancedFiles54("Drive");
    }

    async function openStorage54() {
        const files = await loadFiles54x();
        const list = Object.values(files);
        const total = list.reduce((s, f) => s + fileSize54(f), 0);
        const largest = Object.entries(files).sort((a,b) => fileSize54(b[1]) - fileSize54(a[1])).slice(0, 10).map(([id,f]) => `<tr><td>${safe54x(f.name || id)}</td><td>${bytes54x(fileSize54(f))}</td><td>${button54("Details", `fileDetails54('${safe54x(id)}')`)}</td></tr>`).join("") || `<tr><td colspan="3">No files.</td></tr>`;
        win54x("Storage Center", `<h2>Storage Center</h2><div class="${total > BUILD.fileLimit ? "emerald54-warn" : "emerald54-good"}"><b>Total estimated storage:</b> ${bytes54x(total)}<br><b>Free file warning threshold:</b> 1 MB per file.</div><div class="emerald54-toolbar2">${button54("Open Files", "openAdvancedFiles54()")} ${button54("Clean Up", "openAdvancedFiles54('Trash')")}</div><h3>Largest Files</h3><table class="emerald54-table2"><tr><th>File</th><th>Size</th><th>Action</th></tr>${largest}</table>`, "storage54");
    }

    async function openSharingManager54() {
        const files = await loadFiles54x();
        let shares = [];
        try { const snap = await getDocs(collection(db, COL.shares)); snap.forEach(d => shares.push(Object.assign({ id: d.id }, d.data() || {}))); } catch {}
        const mine = currentUser54x();
        const fileRows = Object.entries(files).map(([id, f]) => `<tr><td><b>${safe54x(f.name || id)}</b><br><span class="emerald54-note">ID: ${safe54x(id)}</span></td><td>${bytes54x(fileSize54(f))}</td><td>${button54("Share", `shareFilePrompt54('${safe54x(id)}')`)} ${button54("Copy Share Info", `copyShareInfo54('${safe54x(id)}')`)}</td></tr>`).join("") || `<tr><td colspan="3">No files to share.</td></tr>`;
        const byMe = shares.filter(s => userKey54x(s.owner || s.from || s.createdBy) === userKey54x(mine)).map(s => `<tr><td>${safe54x(s.fileName || s.fileId)}</td><td>${safe54x(s.to || s.targetUser || "")}</td><td>${safe54x(s.permission || "view")}</td><td>${button54("Change", `changeSharePermission54('${safe54x(s.id)}')`)} ${button54("Revoke", `revokeShare54('${safe54x(s.id)}')`)}</td></tr>`).join("") || `<tr><td colspan="4">No shares created by you.</td></tr>`;
        const withMe = shares.filter(s => userKey54x(s.to || s.targetUser) === userKey54x(mine)).map(s => `<tr><td>${safe54x(s.fileName || s.fileId)}</td><td>${safe54x(s.owner || s.from || s.createdBy || "")}</td><td>${safe54x(s.permission || "view")}</td><td>${button54("Open Shared With Me", "openSharedWithMe54()")}</td></tr>`).join("") || `<tr><td colspan="4">No files shared with you.</td></tr>`;
        win54x("File Sharing", `<h2>File Sharing</h2><div class="emerald54-inset2">Share directly from Files or from this manager. Users can share by button, file name, or file ID.</div><h3>Your Files</h3><table class="emerald54-table2"><tr><th>File</th><th>Size</th><th>Actions</th></tr>${fileRows}</table><h3>Shared by Me</h3><table class="emerald54-table2"><tr><th>File</th><th>Recipient</th><th>Permission</th><th>Action</th></tr>${byMe}</table><h3>Shared With Me</h3><table class="emerald54-table2"><tr><th>File</th><th>Owner</th><th>Permission</th><th>Action</th></tr>${withMe}</table>`, "sharing54");
    }

    async function shareFilePrompt54(fileId) {
        const to = prompt("Share with EmeraldOS username:");
        if (!to) return;
        if (isBlocked54(to)) return alert("You have blocked this user. Unblock them before sharing files.");
        const permission = prompt("Permission: view or edit", "view") || "view";
        await shareFileWithUser54(fileId, to.trim(), permission.trim().toLowerCase() === "edit" ? "edit" : "view");
    }

    async function shareFileWithUser54(fileId, to, permission) {
        const files = await loadFiles54x();
        const f = files[fileId] || {};
        await addDoc(collection(db, COL.shares), { fileId, fileName: f.name || fileId, owner: currentUser54x(), from: currentUser54x(), to, permission, createdAt: Date.now(), status: "active" });
        addNotification54("File shared", `${f.name || fileId} was shared with ${to}.`, "success", "sharing");
        openSharingManager54();
    }

    async function revokeShare54(shareId) {
        if (!confirm("Revoke this share?")) return;
        await deleteDoc(doc(db, COL.shares, shareId));
        addNotification54("Share revoked", "Shared access was removed.", "warning", "sharing");
        openSharingManager54();
    }

    async function changeSharePermission54(shareId) {
        const p = prompt("New permission: view or edit", "view") || "view";
        await updateDoc(doc(db, COL.shares, shareId), { permission: p.trim().toLowerCase() === "edit" ? "edit" : "view", updatedAt: Date.now() });
        openSharingManager54();
    }

    function copyShareInfo54(fileId) {
        const text = `EmeraldOS file ID: ${fileId}\nShare from: Files > Share`;
        navigator.clipboard?.writeText(text);
        addNotification54("Share info copied", "File ID and share instructions were copied.", "info", "sharing");
    }

    /* =====================================================
       OFFICE / ASSISTANT / SETTINGS / MANAGEMENT WINDOWS
    ===================================================== */

    function openEmeraldOffice54() {
        win54x("Emerald Office", `<h2>Emerald Office 5.4</h2><div class="emerald54-grid-tight"><div class="emerald54-card2"><h3>Writer</h3><p>Documents, templates, page layout, tables, print view, and export tools.</p>${button54("Open Writer", "openWriter54()")}</div><div class="emerald54-card2"><h3>Sheets</h3><p>Tables, CSV-style workbooks, totals, and basic formulas.</p>${button54("Open Sheets", "openSheets54()")}</div><div class="emerald54-card2"><h3>Slides</h3><p>Multiple-slide presentations with themes and presenter view.</p>${button54("Open Slides", "openSlides54()")}</div><div class="emerald54-card2"><h3>Forms</h3><p>Build forms and save response structures.</p>${button54("Open Forms", "openForms54()")}</div><div class="emerald54-card2"><h3>Recent Documents</h3><p>Open saved and recent files from Files.</p>${button54("Open Files", "openAdvancedFiles54()")}</div></div>`, "office54");
    }

    function openWriter54() {
        win54x("Emerald Writer", `<h2>Emerald Writer 5.4</h2><div class="emerald54-toolbar2"><button onclick="document.execCommand('bold')">Bold</button><button onclick="document.execCommand('italic')">Italic</button><button onclick="document.execCommand('underline')">Underline</button><button onclick="document.execCommand('insertUnorderedList')">Bullets</button><button onclick="document.execCommand('insertOrderedList')">Numbering</button><button onclick="document.execCommand('justifyLeft')">Left</button><button onclick="document.execCommand('justifyCenter')">Center</button><button onclick="document.execCommand('justifyRight')">Right</button><button onclick="writerInsertTable54()">Insert Table</button><button onclick="writerPrintView54()">Print View</button><button onclick="writerSave54()">Save to Files</button><button onclick="writerExportHTML54()">Export HTML</button></div><input id="writer54Title" style="width:100%" value="Untitled.edoc"><div id="writer54Page" class="emerald54-editor-page" contenteditable="true"><h1>Untitled Document</h1><p>Start writing in Emerald Writer 5.4.</p></div><div class="emerald54-inset2" id="writer54Stats">Words: 0 · Characters: 0</div>`, "writer54");
        setTimeout(() => {
            const page = document.getElementById("writer54Page");
            const stats = document.getElementById("writer54Stats");
            const update = () => { if (stats) { const txt = page?.innerText || ""; stats.textContent = `Words: ${txt.trim() ? txt.trim().split(/\s+/).length : 0} · Characters: ${txt.length}`; } };
            page?.addEventListener("input", update); update();
        }, 80);
    }

    function writerInsertTable54() {
        document.execCommand("insertHTML", false, `<table border="1" style="border-collapse:collapse;width:100%"><tr><td>Column 1</td><td>Column 2</td></tr><tr><td></td><td></td></tr></table><p></p>`);
    }

    async function writerSave54() {
        const name = document.getElementById("writer54Title")?.value || "Untitled.edoc";
        const html = document.getElementById("writer54Page")?.innerHTML || "";
        await cloudCreateFile(name.endsWith(".edoc") ? name : name + ".edoc", html);
        addNotification54("Document saved", `${name} was saved to Files.`, "success", "office");
    }

    function writerPrintView54() {
        const html = document.getElementById("writer54Page")?.innerHTML || "";
        win54x("Print View", `<div class="emerald54-editor-page">${html}</div><div class="emerald54-toolbar2">${button54("Print", "window.print()")}</div>`, "print54");
    }

    function writerExportHTML54() {
        const name = (document.getElementById("writer54Title")?.value || "document").replace(/\.edoc$/i, ".html");
        const html = `<!doctype html><html><body>${document.getElementById("writer54Page")?.innerHTML || ""}</body></html>`;
        const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([html], { type: "text/html" })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }

    function openAssistant54() {
        const settings = getJSON54(LS.settings, {});
        win54x("Emerald Assistant", `<h2>Emerald Assistant</h2><div class="emerald54-inset2">The assistant can run in offline tips mode or use an OpenAI-compatible endpoint when you configure one in Settings.</div><textarea id="assistant54Prompt" placeholder="Ask for help with a file, app, document, setting, or moderation tool."></textarea><div class="emerald54-toolbar2">${button54("Ask", "askAssistant54()")} ${button54("Offline Tips", "assistantTips54()")}</div><div id="assistant54Out" class="emerald54-inset2"></div><div class="emerald54-note">Endpoint configured: ${settings.assistantEndpoint ? "Yes" : "No"}</div>`, "assistant54");
    }

    async function askAssistant54() {
        const out = document.getElementById("assistant54Out");
        const promptText = document.getElementById("assistant54Prompt")?.value || "";
        const settings = getJSON54(LS.settings, {});
        if (!settings.assistantEndpoint || !settings.assistantKey) {
            out.innerHTML = `<b>Offline answer:</b><br>${safe54x(offlineAssistant54(promptText))}`;
            return;
        }
        out.textContent = "Contacting assistant endpoint...";
        try {
            const res = await fetch(settings.assistantEndpoint, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + settings.assistantKey }, body: JSON.stringify({ model: settings.assistantModel || "gpt-4o-mini", messages: [{ role: "user", content: promptText }] }) });
            const data = await res.json();
            out.textContent = data.choices?.[0]?.message?.content || JSON.stringify(data, null, 2);
        } catch (err) { out.textContent = "Assistant request failed: " + err.message; }
    }

    function offlineAssistant54(text = "") {
        text = text.toLowerCase();
        if (text.includes("share")) return "Open Files, select Share beside the file, choose a user, then select view or edit permission.";
        if (text.includes("block")) return "Open Blocking Center from People or Security & Privacy, enter the username, and choose Block User.";
        if (text.includes("application")) return "Open Application Editor, enter a name, icon label, and sandboxed JavaScript, then Save Application.";
        if (text.includes("storage")) return "Open Storage Center to review total use, largest files, and warnings over the 1 MB free file limit.";
        return "Try Files for storage and sharing, Office for documents, Communication for chat, People for contacts, and Security & Privacy for blocking or privacy controls.";
    }

    function assistantTips54() {
        document.getElementById("assistant54Out").innerHTML = `<ul><li>Ask: How do I share a file?</li><li>Ask: How do I block a user?</li><li>Ask: How do I make an Application Editor app?</li><li>Ask: How do I clean storage?</li></ul>`;
    }

    function openSettings54() {
        const s = getJSON54(LS.settings, { notifications: true, assistant: false, desktopLock: false });
        win54x("Settings", `<h2>Settings</h2><div class="emerald54-grid-tight"><div class="emerald54-card2"><h3>Account</h3><p>${safe54x(currentUser54x())}</p></div><div class="emerald54-card2"><h3>Appearance</h3><button onclick="setTheme?.('classic')">Classic</button> <button onclick="setTheme?.('emerald')">Emerald</button></div><div class="emerald54-card2"><h3>Notifications</h3><label><input type="checkbox" id="set54Notifications" ${s.notifications !== false ? "checked" : ""}> Enable notification bell</label></div><div class="emerald54-card2"><h3>Assistant</h3><label><input type="checkbox" id="set54Assistant" ${s.assistant ? "checked" : ""}> Enable assistant</label><br><input id="set54Endpoint" style="width:100%" placeholder="OpenAI-compatible endpoint" value="${safe54x(s.assistantEndpoint || "")}"><input id="set54Key" style="width:100%" placeholder="API key" value="${safe54x(s.assistantKey || "")}"></div><div class="emerald54-card2"><h3>Desktop</h3><label><input type="checkbox" id="set54DesktopLock" ${s.desktopLock ? "checked" : ""}> Lock desktop layout</label></div></div><div class="emerald54-toolbar2">${button54("Save Settings", "saveSettings54()")}</div>`, "settings54");
    }

    function saveSettings54() {
        const s = getJSON54(LS.settings, {});
        s.notifications = document.getElementById("set54Notifications")?.checked !== false;
        s.assistant = !!document.getElementById("set54Assistant")?.checked;
        s.assistantEndpoint = document.getElementById("set54Endpoint")?.value || "";
        s.assistantKey = document.getElementById("set54Key")?.value || "";
        s.desktopLock = !!document.getElementById("set54DesktopLock")?.checked;
        setJSON54(LS.settings, s);
        addNotification54("Settings saved", "EmeraldOS settings were updated.", "success", "settings");
        updateBell54();
    }

    function openSecurityPrivacy54() {
        win54x("Security & Privacy", `<h2>Security & Privacy Center</h2><div class="emerald54-grid-tight"><div class="emerald54-card2"><h3>Account</h3><p>Signed in as <b>${safe54x(currentUser54x())}</b></p></div><div class="emerald54-card2"><h3>Blocking</h3><p>Manage blocked users.</p>${button54("Blocking Center", "openBlockingCenter54()")}</div><div class="emerald54-card2"><h3>Sharing Privacy</h3><p>Review files shared by you and with you.</p>${button54("Sharing Manager", "openSharingManager54()")}</div><div class="emerald54-card2"><h3>Local Cache</h3><p>Clear local UI caches without deleting cloud files.</p>${button54("Clear Cache", "clearLocalCache54()")}</div></div>`, "security54");
    }

    function clearLocalCache54() {
        [LS.recentFiles, LS.desktopLayout].forEach(k => localStorage.removeItem(k));
        addNotification54("Cache cleared", "Local layout and recent-file cache were cleared.", "info", "security");
    }

    function openRecovery54() {
        win54x("System Recovery", `<h2>System Recovery Tools</h2><div class="emerald54-warn">These tools repair the local EmeraldOS interface. They do not delete cloud files.</div><div class="emerald54-grid-tight"><div class="emerald54-card2"><h3>Rebuild App Folders</h3>${button54("Rebuild", "renderDesktop54Final();renderStart54Final();")}</div><div class="emerald54-card2"><h3>Reset Desktop Layout</h3>${button54("Reset", "desktopReset54()")}</div><div class="emerald54-card2"><h3>Safe Mode</h3>${button54("Boot Safe Mode", "safeMode54()")}</div><div class="emerald54-card2"><h3>Export Backup</h3>${button54("Export Local Backup", "exportLocalBackup54()")}</div></div>`, "recovery54");
    }

    function safeMode54() { localStorage.setItem("54_safe_mode", "true"); alert("Safe Mode flag set. Refresh EmeraldOS to boot with minimal local features."); }
    function desktopReset54() { localStorage.removeItem(LS.desktopLayout); renderDesktop54Final(); addNotification54("Desktop reset", "Desktop folder layout was rebuilt.", "info", "desktop"); }
    function exportLocalBackup54() { const data = {}; Object.keys(localStorage).filter(k => k.startsWith("54_") || k.startsWith("40_")).forEach(k => data[k] = localStorage.getItem(k)); const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"})); a.download="EmeraldOS-5.4-local-backup.json"; a.click(); }

    function openDesktopTools54() {
        win54x("Desktop Tools", `<h2>Desktop Layout System</h2><div class="emerald54-toolbar2">${button54("Clean Desktop", "desktopClean54()")}${button54("Lock Layout", "desktopLock54()")}${button54("Unlock Layout", "desktopUnlock54()")}${button54("Rebuild Folders", "renderDesktop54Final()")}${button54("Recovery Tools", "openRecovery54()")}</div><div class="emerald54-inset2">Desktop folders are rebuilt from the 5.4 application registry and remain consistent across refreshes.</div>`, "desktopTools54");
    }
    function desktopClean54(){ renderDesktop54Final(); addNotification54("Desktop cleaned", "Desktop folders were re-aligned.", "info", "desktop"); }
    function desktopLock54(){ const s=getJSON54(LS.settings,{}); s.desktopLock=true; setJSON54(LS.settings,s); addNotification54("Desktop locked", "Desktop layout lock enabled.", "info", "desktop"); }
    function desktopUnlock54(){ const s=getJSON54(LS.settings,{}); s.desktopLock=false; setJSON54(LS.settings,s); addNotification54("Desktop unlocked", "Desktop layout lock disabled.", "info", "desktop"); }

    function openAppManager54() {
        const rows = Object.entries(window.APPS || {}).filter(([,app]) => canSee54x(app.edition || "economy")).map(([id, app]) => `<tr><td><b>${safe54x(app.name)}</b><br><span class="emerald54-note">${safe54x(id)}</span></td><td>${safe54x(app.edition || "economy")}</td><td>${safe54x(app.category || "general")}</td><td>${button54("Open", `launchApp('${safe54x(id)}')`)}</td></tr>`).join("");
        win54x("App Manager", `<h2>App Manager</h2><div class="emerald54-toolbar2"><input placeholder="Search apps" oninput="filterTable54('appTable54',this.value)">${button54("Application Editor", "openApplicationEditor54()")}</div><table class="emerald54-table2" id="appTable54"><tr><th>App</th><th>Edition</th><th>Category</th><th>Action</th></tr>${rows}</table>`, "appManager54");
    }

    function openAdminPanel54() { win54x("Administrative Panel", `<h2>Administrative Panel</h2><div class="emerald54-grid-tight"><div class="emerald54-card2"><h3>Users</h3>${button54("User Administration", "openUsers54()")}</div><div class="emerald54-card2"><h3>Files</h3>${button54("Storage Administration", "openStorage54()")}</div><div class="emerald54-card2"><h3>Sharing</h3>${button54("Sharing Administration", "openSharingManager54()")}</div><div class="emerald54-card2"><h3>Chat & Moderation</h3>${button54("Moderation Center", "openModerationCenter54()")}</div><div class="emerald54-card2"><h3>Security</h3>${button54("Security Audit", "openSecurityPrivacy54()")}</div></div>`, "adminPanel54"); }
    function openModerationCenter54() { win54x("Moderation Center", `<h2>Moderation Center</h2><div class="emerald54-grid-tight"><div class="emerald54-card2"><h3>Reports</h3><p>Review message and user reports.</p>${button54("Reports Review", "openReportsReview54?.()")}</div><div class="emerald54-card2"><h3>User Controls</h3><p>Warn, mute, block, and escalate users.</p>${button54("Blocking Center", "openBlockingCenter54()")}</div><div class="emerald54-card2"><h3>Moderation Log</h3><p>Review staff activity.</p>${button54("Moderation Log", "openModerationLog54?.()")}</div><div class="emerald54-card2"><h3>Communication Audit</h3><p>Executive communication overview.</p>${button54("Communication Audit", "openCommunicationAudit54?.()")}</div></div>`, "moderation54"); }
    function openChatHub54(){ win54x("Emerald Chat", `<h2>Emerald Chat</h2><div class="emerald54-grid-tight"><div class="emerald54-card2"><h3>Global Chat</h3>${button54("Open Chat", "openEmeraldChat54?.()")}</div><div class="emerald54-card2"><h3>Chat Rooms</h3>${button54("Open Rooms", "openChatRooms54?.()")}</div><div class="emerald54-card2"><h3>Direct Messages</h3>${button54("Open Direct Messages", "openDirectMessages54?.()")}</div><div class="emerald54-card2"><h3>Blocked Users</h3>${button54("Blocking Center", "openBlockingCenter54()")}</div></div>`, "chatHub54"); }

    /* =====================================================
       DESKTOP FOLDER OVERRIDE / REGISTRY
    ===================================================== */

    function registerApp54x(id, app) {
        if (!window.APPS) window.APPS = {};
        window.APPS[id] = Object.assign({ icon: "APP", edition: "economy", category: "general" }, app);
    }

    const FOLDERS54 = {
        essentials: { name: "Essentials", edition: "economy", apps: ["files54", "advancedFiles54", "settings54", "notifications54", "desktopTools54", "appManager54"] },
        office: { name: "Office & Documents", edition: "economy", apps: ["emeraldOffice54", "writer54", "sheets54", "slides54", "forms54", "templates54", "documentVault54"] },
        files: { name: "Files & Sharing", edition: "home", apps: ["advancedFiles54", "storage54", "sharing54", "sharedWithMe54", "sharedByMe54", "trash54"] },
        communication: { name: "Communication", edition: "home", apps: ["chatHub54", "chat54", "rooms54", "directMessages54", "communicationCenter54", "notifications54"] },
        people: { name: "People", edition: "home", apps: ["users54", "profile54", "contacts54", "friends54", "blockingCenter54"] },
        intelligence: { name: "Intelligence", edition: "home", apps: ["assistant54", "assistantPro54"] },
        custom: { name: "User Applications", edition: "economy", apps: ["applicationEditor54", "userApplications54"] },
        productivity: { name: "Productivity", edition: "business", apps: ["tasks54", "planner54", "reports54", "emeraldOffice54"] },
        system: { name: "System & Settings", edition: "economy", apps: ["settings54", "security54", "privacy54", "desktopTools54", "appManager54", "recovery54"] },
        moderation: { name: "Moderation", edition: "developer", apps: ["moderationCenter54", "moderatorConsole54", "reportsReview54", "modLog54", "communicationAudit54"] },
        admin: { name: "Administration", edition: "executive", apps: ["adminPanel54", "adminUsers54", "adminStorage54", "adminSharing54", "securityAudit54"] }
    };

    function allFolders54() {
        const f = JSON.parse(JSON.stringify(FOLDERS54));
        const userApps = userApps54().map(a => "userapp54_" + a.id);
        f.custom.apps = [...f.custom.apps, ...userApps];
        return f;
    }

    function appVisible54(id) {
        const app = window.APPS?.[id];
        if (!app) return false;
        return canSee54x(app.edition || "economy");
    }

    function folderVisible54(folder) {
        if (!canSee54x(folder.edition || "economy")) return false;
        return folder.apps.some(appVisible54);
    }

    function openFolder54Final(id) {
        const folder = allFolders54()[id];
        if (!folder) return;
        const tiles = folder.apps.filter(appVisible54).map(appId => {
            const app = window.APPS[appId];
            return `<div class="emerald54-card2 emerald54-app-tile" onclick="launchApp('${safe54x(appId)}')"><h3>${safe54x(app.icon || "APP")} ${safe54x(app.name)}</h3><div class="emerald54-note">Edition: ${safe54x(app.edition || "economy")}</div></div>`;
        }).join("") || `<div class="emerald54-inset2">No applications available.</div>`;
        win54x(folder.name, `<h2>${safe54x(folder.name)}</h2><div class="emerald54-grid-tight">${tiles}</div>`, "folder54");
    }

    function renderDesktop54Final() {
        registerUserApplications54();
        const desktop = document.getElementById("desktop");
        if (!desktop) return;
        desktop.innerHTML = "";
        Object.entries(allFolders54()).forEach(([id, folder]) => {
            if (!folderVisible54(folder)) return;
            const icon = document.createElement("div");
            icon.className = "emerald54-folder-icon desktop-folder-icon";
            icon.tabIndex = -1;
            icon.innerHTML = `<div class="emerald54-folder-symbol">${safe54x(folder.name.split(" ")[0].slice(0,6).toUpperCase())}</div><div class="emerald54-folder-label">${safe54x(folder.name)}</div>`;
            icon.ondblclick = () => openFolder54Final(id);
            icon.onclick = () => setTimeout(() => icon.blur(), 0);
            desktop.appendChild(icon);
        });
    }

    function renderStart54Final() {
        const results = document.getElementById("start-results");
        if (!results) return;
        const search = document.getElementById("start-search");
        const query = String(search?.value || "").toLowerCase();
        const folderItems = Object.entries(allFolders54()).filter(([,f]) => folderVisible54(f)).filter(([,f]) => !query || f.name.toLowerCase().includes(query)).map(([id,f]) => `<div class="start-item" onclick="openFolder54Final('${safe54x(id)}')">${safe54x(f.name)}</div>`).join("");
        const appItems = Object.entries(window.APPS || {}).filter(([id,app]) => appVisible54(id) && (!query || String(app.name).toLowerCase().includes(query))).slice(0,120).map(([id,app]) => `<div class="start-item" onclick="launchApp('${safe54x(id)}')">${safe54x(app.name)}</div>`).join("");
        results.innerHTML = folderItems + (query ? appItems : "");
        if (search && !search.dataset.emerald54SearchFinal) {
            search.dataset.emerald54SearchFinal = "true";
            search.addEventListener("input", renderStart54Final);
        }
    }

    function installApps54() {
        registerApp54x("advancedFiles54", { name: "Files", icon: "FILES", edition: "economy", category: "files", launch: () => openAdvancedFiles54() });
        registerApp54x("files54", { name: "Files", icon: "FILES", edition: "economy", category: "files", launch: () => openAdvancedFiles54() });
        registerApp54x("storage54", { name: "Storage Center", icon: "STORE", edition: "economy", category: "files", launch: () => openStorage54() });
        registerApp54x("sharing54", { name: "File Sharing", icon: "SHARE", edition: "home", category: "files", launch: () => openSharingManager54() });
        registerApp54x("applicationEditor54", { name: "Application Editor", icon: "APPEDIT", edition: "economy", category: "custom", launch: () => openApplicationEditor54() });
        registerApp54x("userApplications54", { name: "User Applications", icon: "USERAPP", edition: "economy", category: "custom", launch: () => openUserApplications54() });
        registerApp54x("notifications54", { name: "Notification Center", icon: "BELL", edition: "economy", category: "system", launch: () => openNotificationCenter54() });
        registerApp54x("settings54", { name: "Settings", icon: "SET", edition: "economy", category: "system", launch: () => openSettings54() });
        registerApp54x("security54", { name: "Security & Privacy", icon: "SEC", edition: "economy", category: "system", launch: () => openSecurityPrivacy54() });
        registerApp54x("blockingCenter54", { name: "Blocking Center", icon: "BLOCK", edition: "home", category: "people", launch: () => openBlockingCenter54() });
        registerApp54x("assistant54", { name: "Emerald Assistant", icon: "HELP", edition: "home", category: "intelligence", launch: () => openAssistant54() });
        registerApp54x("assistantPro54", { name: "Assistant Settings", icon: "AISET", edition: "home", category: "intelligence", launch: () => openSettings54() });
        registerApp54x("desktopTools54", { name: "Desktop Tools", icon: "DESK", edition: "economy", category: "system", launch: () => openDesktopTools54() });
        registerApp54x("recovery54", { name: "System Recovery", icon: "REPAIR", edition: "economy", category: "system", launch: () => openRecovery54() });
        registerApp54x("appManager54", { name: "App Manager", icon: "APPS", edition: "economy", category: "system", launch: () => openAppManager54() });
        registerApp54x("chatHub54", { name: "Emerald Chat", icon: "CHAT", edition: "home", category: "communication", launch: () => openChatHub54() });
        registerApp54x("users54", { name: "EmeraldOS Users", icon: "USERS", edition: "home", category: "people", launch: () => openUsers54() });
        registerApp54x("moderationCenter54", { name: "Moderation Center", icon: "MOD", edition: "developer", category: "moderation", launch: () => openModerationCenter54() });
        registerApp54x("adminPanel54", { name: "Administrative Panel", icon: "ADMIN", edition: "executive", category: "admin", launch: () => openAdminPanel54() });
        registerApp54x("emeraldOffice54", { name: "Emerald Office", icon: "OFFICE", edition: "economy", category: "office", launch: () => openEmeraldOffice54() });
        registerApp54x("writer54", { name: "Emerald Writer", icon: "WRITE", edition: "economy", category: "office", launch: () => openWriter54() });
        registerUserApplications54();
    }

    function installTerminalCommands54() {
        const original = window.runTerminalCommand;
        window.runTerminalCommand = function(raw) {
            const cmd = String(raw || "").trim().toLowerCase();
            const map = {
                "version": () => "EmeraldOS 5.4 - Intelligence, Security & Management Update",
                "build": () => "EmeraldOS 5.4 - Intelligence, Security & Management Update",
                "files": () => { openAdvancedFiles54(); return "Opening Files."; },
                "storage": () => { openStorage54(); return "Opening Storage Center."; },
                "sharing": () => { openSharingManager54(); return "Opening File Sharing."; },
                "office": () => { openEmeraldOffice54(); return "Opening Emerald Office."; },
                "writer": () => { openWriter54(); return "Opening Emerald Writer."; },
                "chat": () => { openChatHub54(); return "Opening Emerald Chat."; },
                "users": () => { openUsers54(); return "Opening EmeraldOS Users."; },
                "block": () => { openBlockingCenter54(); return "Opening Blocking Center."; },
                "notifications": () => { openNotificationCenter54(); return "Opening Notification Center."; },
                "bell": () => { openNotificationCenter54(); return "Opening Notification Center."; },
                "assistant": () => { openAssistant54(); return "Opening Emerald Assistant."; },
                "apps": () => { openAppManager54(); return "Opening App Manager."; },
                "app.editor": () => { openApplicationEditor54(); return "Opening Application Editor."; },
                "desktop.clean": () => { desktopClean54(); return "Desktop cleaned."; },
                "desktop.lock": () => { desktopLock54(); return "Desktop locked."; },
                "desktop.unlock": () => { desktopUnlock54(); return "Desktop unlocked."; },
                "recovery": () => { openRecovery54(); return "Opening System Recovery."; },
                "mod": () => { openModerationCenter54(); return "Opening Moderation Center."; },
                "admin": () => { openAdminPanel54(); return "Opening Administrative Panel."; }
            };
            if (map[cmd]) return map[cmd]();
            return typeof original === "function" ? original(raw) : `Unknown command: ${raw}`;
        };
    }

    function startNotificationWatch54() {
        if (bellTimer54) return;
        bellTimer54 = setInterval(async () => {
            try {
                const seen = getJSON54(LS.shareSeen, []);
                const snap = await getDocs(collection(db, COL.shares));
                const mine = userKey54x(currentUser54x());
                const nextSeen = new Set(seen);
                snap.forEach(d => {
                    const data = d.data() || {};
                    if (userKey54x(data.to || data.targetUser) === mine && !nextSeen.has(d.id)) {
                        nextSeen.add(d.id);
                        addNotification54("Document shared", `${data.owner || data.from || "A user"} shared ${data.fileName || data.fileId || "a file"} with you.`, "info", "sharing");
                    }
                });
                setJSON54(LS.shareSeen, Array.from(nextSeen).slice(-300));
            } catch {}
        }, 25000);
    }

    function exposeFeatureGlobals54() {
        Object.assign(window, {
            openFolder54Final, renderDesktop54Final, renderStart54Final,
            openNotificationCenter54, markNotificationsRead54, clearNotifications54, addNotification54,
            openBlockingCenter54, blockUser54, unblockUser54, isBlocked54, openUsers54, filterTable54,
            openApplicationEditor54, saveUserApplication54, previewUserApplication54, deleteUserApplication54, runUserApplication54, openUserApplications54,
            openAdvancedFiles54, openFiles54: openAdvancedFiles54, openStorage54, createFolder54, toggleStarFile54, moveFile54, tagFile54, fileDetails54, fileVersions54, renameFile54, deleteFileFromFiles54, restoreFile54, deleteForever54, newTextFile54,
            openSharingManager54, openFileSharing54: openSharingManager54, shareFilePrompt54, shareFileWithUser54, revokeShare54, changeSharePermission54, copyShareInfo54,
            openEmeraldOffice54, openWriter54, writerInsertTable54, writerSave54, writerPrintView54, writerExportHTML54,
            openAssistant54, askAssistant54, assistantTips54,
            openSettings54, saveSettings54, openSecurityPrivacy54, clearLocalCache54, openRecovery54, safeMode54, desktopReset54, exportLocalBackup54,
            openDesktopTools54, desktopClean54, desktopLock54, desktopUnlock54, openAppManager54,
            openAdminPanel54, openModerationCenter54, openChatHub54
        });
    }

    function setIdentity54() {
        document.title = BUILD.displayName;
        localStorage.setItem("40_build_name", BUILD.displayName);
        localStorage.setItem("40_version", BUILD.version);
        try { window.EmeraldOSRegistry?.set?.("HKEY_LOCAL_MACHINE\\System\\Build\\Version", BUILD.version); } catch {}
        const badge = document.getElementById("emerald40-build-badge");
        if (badge) badge.innerHTML = `<span class="emerald54-badge">${BUILD.displayName}</span>`;
    }

    function init54FeaturePack() {
        installFeatureStyles54();
        exposeFeatureGlobals54();
        installApps54();
        patchNotify54();
        installBell54();
        installWindowObserver54();
        installTerminalCommands54();
        setIdentity54();
        window.EMERALDOS_APP_CATEGORIES = allFolders54();
        window.renderDesktopOverride = renderDesktop54Final;
        window.renderStartMenuOverride = renderStart54Final;
        window.renderDesktop = renderDesktop54Final;
        window.renderStartMenu = renderStart54Final;
        window.openFolder54 = openFolder54Final;
        renderDesktop54Final();
        renderStart54Final();
        startNotificationWatch54();
        addNotification54("EmeraldOS 5.4 loaded", "Application Editor, Files, blocking, management tools, and the taskbar bell are active.", "success", "system");
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", () => setTimeout(init54FeaturePack, 300));
    } else {
        setTimeout(init54FeaturePack, 300);
    }
})();
