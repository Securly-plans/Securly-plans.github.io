"use strict";

/* =========================================================
   EMERALDOS 5.3
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
    if (window.EmeraldOS53Loaded) return;
    window.EmeraldOS53Loaded = true;

    const BUILD = {
        product: "EmeraldOS",
        version: "5.3",
        displayName: "EmeraldOS 5.3",
        codename: "Communication, Profiles & Files Update",
        fileLimit: 1024 * 1024
    };

    const LS = {
        recentDocs: "53_recent_documents",
        officeAutosave: "53_writer_autosave",
        contacts: "53_contacts_cache",
        notifications: "53_notifications",
        assistantEnabled: "53_assistant_enabled",
        assistantEndpoint: "53_assistant_endpoint",
        assistantKey: "53_assistant_api_key",
        desktopLocked: "53_desktop_locked"
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

    let activeRoom53 = "global";
    let activeRoomLabel53 = "Global Lobby";
    let chatUnsub53 = null;

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

    function win(title, html, app = "emerald53") {
        const body = `<div class="emerald53-panel">${html}</div>`;
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
        if (document.getElementById("emerald53-style")) return;
        const style = document.createElement("style");
        style.id = "emerald53-style";
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
            .emerald53-panel{height:100%;box-sizing:border-box;overflow:auto;font-family:"MS Sans Serif",Tahoma,Arial,sans-serif;font-size:12px;color:#000;}
            .emerald53-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(185px,1fr));gap:8px;margin:8px 0;}
            .emerald53-card{background:#c0c0c0;border:2px solid;border-color:#fff #808080 #808080 #fff;padding:8px;min-height:70px;box-sizing:border-box;}
            .emerald53-card h3,.emerald53-card h4{margin:0 0 6px 0;font-size:13px;}
            .emerald53-inset{background:#fff;border:2px inset #fff;padding:8px;box-sizing:border-box;margin:6px 0;overflow:auto;}
            .emerald53-toolbar{display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin:6px 0;}
            .emerald53-toolbar input,.emerald53-toolbar select{height:24px;}
            .emerald53-table{width:100%;border-collapse:collapse;background:#fff;}
            .emerald53-table th,.emerald53-table td{border:1px solid #808080;padding:4px;text-align:left;vertical-align:top;}
            .emerald53-table th{background:#000080;color:#fff;}
            .emerald53-editor{background:#fff;border:2px inset #fff;min-height:240px;padding:18px;outline:none;line-height:1.35;user-select:text;}
            .emerald53-editor:focus{outline:1px dotted #000;}
            .emerald53-split{display:grid;grid-template-columns:220px 1fr;gap:8px;height:100%;min-height:360px;}
            .emerald53-list{background:#fff;border:2px inset #fff;overflow:auto;padding:4px;}
            .emerald53-list-row{padding:5px;border-bottom:1px solid #c0c0c0;cursor:pointer;}
            .emerald53-list-row:hover{background:#000080;color:#fff;}
            .emerald53-chat-log{height:260px;background:#fff;border:2px inset #fff;overflow:auto;padding:6px;}
            .emerald53-message{border-bottom:1px solid #ddd;padding:5px 2px;}
            .emerald53-message.deleted{opacity:.55;font-style:italic;}
            .emerald53-badge{display:inline-block;background:#000080;color:#fff;padding:2px 5px;margin:1px;border:1px solid #fff;}
            .emerald53-warning{background:#fff4c4;border:2px inset #fff;padding:8px;margin:6px 0;}
            .emerald53-danger{background:#ffd8d8;border:2px inset #fff;padding:8px;margin:6px 0;}
            .emerald53-success{background:#dfffe0;border:2px inset #fff;padding:8px;margin:6px 0;}
            .emerald53-note{font-size:11px;color:#333;}
            .emerald53-folder-icon{width:82px;min-height:76px;text-align:center;color:white;cursor:pointer;padding:4px;box-sizing:border-box;}
            .emerald53-folder-icon:focus{outline:none;}
            .emerald53-folder-symbol{height:36px;display:flex;align-items:center;justify-content:center;color:#000;background:#c0c000;border:2px solid;border-color:#ffff80 #808000 #808000 #ffff80;font-weight:bold;font-size:11px;margin:0 auto 4px;}
            .emerald53-folder-label{text-shadow:1px 1px #000;font-size:12px;line-height:1.1;}
            .emerald53-status-dot{display:inline-block;width:8px;height:8px;background:#008000;border:1px solid #000;margin-right:4px;}
            .emerald53-slide{background:#fff;border:2px inset #fff;min-height:220px;padding:18px;}
            .emerald53-form-row{margin:5px 0;}
            .emerald53-app-tile{cursor:pointer;}
            .emerald53-app-tile:hover{background:#dcdcdc;}
        `;
        document.head.appendChild(style);
    }

    function patchWindowManager() {
        const patchWindow = win => {
            if (!win || win.dataset.emerald53Patched === "true") return win;
            win.dataset.emerald53Patched = "true";

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

        if (window.openWindow && !window.openWindow.__emerald53Patched) {
            const original = window.openWindow;
            const wrapped = function (title, html, app = "") {
                const win = original.call(window, title, html, app);
                setTimeout(() => patchWindow(win), 0);
                return win;
            };
            wrapped.__emerald53Patched = true;
            window.openWindow = wrapped;
        }

        document.addEventListener("click", ev => {
            const icon = ev.target.closest("#desktop .icon,#desktop .desktop-folder-icon,.desktop-icon,.t4-desktop-icon,.emerald53-folder-icon");
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
        essentials: { name: "Essentials", edition: "economy", apps: ["files", "system", "settings53", "notifications53", "helpCenter"] },
        office: { name: "Office & Documents", edition: "economy", apps: ["emeraldOffice53", "writer53", "sheets53", "slides53", "forms53", "templates53", "documentVault53"] },
        files: { name: "Files & Sharing", edition: "home", apps: ["files53", "storage53", "sharing53", "sharedWithMe53", "sharedByMe53", "trash53"] },
        communication: { name: "Communication", edition: "home", apps: ["chat53", "rooms53", "directMessages53", "communicationCenter53", "notifications53"] },
        people: { name: "People", edition: "home", apps: ["users53", "profile53", "contacts53", "friends53"] },
        productivity: { name: "Productivity", edition: "business", apps: ["tasks53", "calendar", "planner53", "notes", "reports53"] },
        system: { name: "System & Settings", edition: "economy", apps: ["settings53", "security53", "privacy53", "assistant53", "desktopTools53", "appManager53"] },
        moderation: { name: "Moderation", edition: "developer", apps: ["moderatorConsole53", "reportsReview53", "modLog53", "communicationAudit53"] },
        admin: { name: "Administration", edition: "executive", apps: ["adminPanel53", "adminUsers53", "adminStorage53", "adminSharing53", "securityAudit53"] }
    };

    function visibleApp(id) {
        const app = window.APPS?.[id];
        if (!app) return false;
        if (app.hiddenStandalone && !app.forceVisible53) return false;
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
        registerApp("emeraldOffice53", { name: "Emerald Office", icon: "OFFICE", edition: "economy", category: "office", launch: () => openEmeraldOffice53() });
        registerApp("writer53", { name: "Emerald Writer", icon: "WRITE", edition: "economy", category: "office", launch: () => openWriter53() });
        registerApp("sheets53", { name: "Emerald Sheets", icon: "SHEET", edition: "home", category: "office", launch: () => openSheets53() });
        registerApp("slides53", { name: "Emerald Slides", icon: "SLIDE", edition: "home", category: "office", launch: () => openSlides53() });
        registerApp("forms53", { name: "Emerald Forms", icon: "FORM", edition: "business", category: "office", launch: () => openForms53() });
        registerApp("templates53", { name: "Templates", icon: "TPL", edition: "economy", category: "office", launch: () => openTemplates53() });
        registerApp("documentVault53", { name: "Document Vault", icon: "VAULT", edition: "economy", category: "office", launch: () => openDocumentVault53() });

        registerApp("files53", { name: "Files", icon: "FILES", edition: "economy", category: "files", launch: () => openFiles53() });
        registerApp("storage53", { name: "Storage Center", icon: "STORE", edition: "economy", category: "files", launch: () => openStorage53() });
        registerApp("sharing53", { name: "File Sharing", icon: "SHARE", edition: "home", category: "files", launch: () => openFileSharing53() });
        registerApp("sharedWithMe53", { name: "Shared With Me", icon: "IN", edition: "home", category: "files", launch: () => openSharedWithMe53() });
        registerApp("sharedByMe53", { name: "Shared by Me", icon: "OUT", edition: "home", category: "files", launch: () => openSharedByMe53() });
        registerApp("trash53", { name: "Trash", icon: "TRASH", edition: "home", category: "files", launch: () => openTrash53() });

        registerApp("chat53", { name: "Emerald Chat", icon: "CHAT", edition: "home", category: "communication", launch: () => openEmeraldChat53() });
        registerApp("rooms53", { name: "Chat Rooms", icon: "ROOM", edition: "home", category: "communication", launch: () => openChatRooms53() });
        registerApp("directMessages53", { name: "Direct Messages", icon: "DM", edition: "home", category: "communication", launch: () => openDirectMessages53() });
        registerApp("communicationCenter53", { name: "Communication Center", icon: "COMMS", edition: "home", category: "communication", launch: () => openCommunicationCenter53() });

        registerApp("users53", { name: "EmeraldOS Users", icon: "USERS", edition: "home", category: "people", launch: () => openUsers53() });
        registerApp("profile53", { name: "My Profile", icon: "ME", edition: "home", category: "people", launch: () => openMyProfile53() });
        registerApp("contacts53", { name: "Contacts", icon: "CNT", edition: "home", category: "people", launch: () => openContacts53() });
        registerApp("friends53", { name: "Friends", icon: "FRND", edition: "home", category: "people", launch: () => openFriends53() });

        registerApp("settings53", { name: "Settings", icon: "SET", edition: "economy", category: "system", launch: () => openSettings53() });
        registerApp("notifications53", { name: "Notification Center", icon: "NOTIF", edition: "economy", category: "system", launch: () => openNotificationCenter53() });
        registerApp("security53", { name: "Security & Privacy", icon: "SEC", edition: "economy", category: "system", launch: () => openSecurityPrivacy53() });
        registerApp("privacy53", { name: "Privacy Center", icon: "PRIV", edition: "home", category: "system", launch: () => openPrivacy53() });
        registerApp("assistant53", { name: "Emerald Assistant", icon: "HELP", edition: "home", category: "system", launch: () => openAssistant53() });
        registerApp("desktopTools53", { name: "Desktop Tools", icon: "DESK", edition: "economy", category: "system", launch: () => openDesktopTools53() });
        registerApp("appManager53", { name: "App Manager", icon: "APPS", edition: "economy", category: "system", launch: () => openAppManager53() });

        registerApp("tasks53", { name: "Task Board", icon: "TASK", edition: "business", category: "productivity", launch: () => openTasks53() });
        registerApp("planner53", { name: "Planner", icon: "PLAN", edition: "business", category: "productivity", launch: () => openPlanner53() });
        registerApp("reports53", { name: "Reports", icon: "RPT", edition: "business", category: "productivity", launch: () => openReports53() });

        registerApp("moderatorConsole53", { name: "Moderator Console", icon: "MOD", edition: "developer", category: "moderation", launch: () => openModeratorConsole53() });
        registerApp("reportsReview53", { name: "Reports Review", icon: "RPT", edition: "developer", category: "moderation", launch: () => openReportsReview53() });
        registerApp("modLog53", { name: "Moderation Log", icon: "LOG", edition: "developer", category: "moderation", launch: () => openModerationLog53() });
        registerApp("communicationAudit53", { name: "Communication Audit", icon: "AUDIT", edition: "developer", category: "moderation", launch: () => openCommunicationAudit53() });

        registerApp("adminPanel53", { name: "Administrative Panel", icon: "ADMIN", edition: "executive", category: "admin", launch: () => openAdminPanel53() });
        registerApp("adminUsers53", { name: "User Administration", icon: "USER", edition: "executive", category: "admin", launch: () => openAdminUsers53() });
        registerApp("adminStorage53", { name: "Storage Administration", icon: "STOR", edition: "executive", category: "admin", launch: () => openAdminStorage53() });
        registerApp("adminSharing53", { name: "Sharing Administration", icon: "SHR", edition: "executive", category: "admin", launch: () => openAdminSharing53() });
        registerApp("securityAudit53", { name: "Security Audit", icon: "SEC", edition: "executive", category: "admin", launch: () => openSecurityAudit53() });
    }

    function openFolder53(id) {
        const folder = FOLDERS[id];
        if (!folder) return;
        const rows = folder.apps
            .filter(visibleApp)
            .map(appId => {
                const app = window.APPS[appId];
                return `<div class="emerald53-card emerald53-app-tile" onclick="launchApp('${safe(appId)}')">
                    <h3>${safe(app.icon || "APP")} ${safe(app.name)}</h3>
                    <div class="emerald53-note">Edition: ${safe(app.edition || "economy")}</div>
                </div>`;
            }).join("") || `<div class="emerald53-inset">No available applications in this folder.</div>`;
        win(folder.name, `<h2>${safe(folder.name)}</h2><div class="emerald53-grid">${rows}</div>`, "folder_" + id);
    }

    function renderDesktop53() {
        const desktop = document.getElementById("desktop");
        if (!desktop) return;
        desktop.innerHTML = "";
        Object.entries(FOLDERS).forEach(([id, folder]) => {
            if (!visibleFolder(folder)) return;
            const icon = document.createElement("div");
            icon.className = "emerald53-folder-icon desktop-folder-icon";
            icon.tabIndex = -1;
            icon.innerHTML = `<div class="emerald53-folder-symbol">${safe(folder.name.split(" ")[0].slice(0, 6).toUpperCase())}</div><div class="emerald53-folder-label">${safe(folder.name)}</div>`;
            icon.ondblclick = () => openFolder53(id);
            icon.onclick = () => setTimeout(() => icon.blur(), 0);
            desktop.appendChild(icon);
        });
    }

    function renderStart53() {
        const results = document.getElementById("start-results");
        if (!results) return;
        const search = document.getElementById("start-search");
        const query = String(search?.value || "").toLowerCase();
        const folderItems = Object.entries(FOLDERS)
            .filter(([, folder]) => visibleFolder(folder))
            .filter(([, folder]) => !query || folder.name.toLowerCase().includes(query))
            .map(([id, folder]) => `<div class="start-item" onclick="openFolder53('${safe(id)}')">${safe(folder.name)}</div>`)
            .join("");
        const appItems = Object.entries(window.APPS || {})
            .filter(([id, app]) => visibleApp(id) && (!query || String(app.name).toLowerCase().includes(query)))
            .slice(0, 80)
            .map(([id, app]) => `<div class="start-item" onclick="launchApp('${safe(id)}')">${safe(app.name)}</div>`)
            .join("");
        results.innerHTML = folderItems + (query ? appItems : "");
        if (search && !search.dataset.emerald53Search) {
            search.dataset.emerald53Search = "true";
            search.addEventListener("input", renderStart53);
        }
    }

    /* =====================================================
       FILES, STORAGE AND SHARING
    ===================================================== */

    async function openFiles53() {
        const files = await loadFiles();
        const rows = Object.entries(files).map(([id, f]) => `
            <tr>
                <td><b>${safe(fileIconText(f))}</b></td>
                <td>${safe(f.name || id)}<br><span class="emerald53-note">ID: ${safe(id)}</span></td>
                <td>${safe(fileKind(f.name, f.type || f.mimeType))}</td>
                <td>${formatBytes(fileSize(f))}</td>
                <td>${dateTime(f.updatedAt || f.createdAt)}</td>
                <td>
                    ${smallButton("Open", `openFileFromFiles53('${safe(id)}')`)}
                    ${smallButton("Share", `shareFilePrompt53('${safe(id)}')`)}
                    ${smallButton("Details", `fileDetails53('${safe(id)}')`)}
                    ${smallButton("Rename", `renameFile53('${safe(id)}')`)}
                    ${smallButton("Delete", `deleteFileFromFiles53('${safe(id)}')`)}
                </td>
            </tr>`).join("");
        win("Files", `
            <h2>Files</h2>
            <div class="emerald53-toolbar">
                ${smallButton("New Document", "newOfficeDocument53()")}
                ${smallButton("New Text File", "newTextFile53()")}
                ${smallButton("Storage Center", "openStorage53()")}
                ${smallButton("File Sharing", "openFileSharing53()")}
                ${smallButton("Refresh", "openFiles53()")}
            </div>
            <div class="emerald53-warning">Files now includes storage, sharing, file details, and shared-file controls in one place.</div>
            <table class="emerald53-table"><thead><tr><th>Type</th><th>Name</th><th>Kind</th><th>Size</th><th>Updated</th><th>Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="6">No files yet.</td></tr>`}</tbody></table>
        `, "files53");
    }

    async function openFileFromFiles53(id) {
        const files = await loadFiles();
        const file = files[id];
        if (!file) return notify("Files", "File not found.", "warning");
        const content = await getFileContent(id, file);
        const kind = fileKind(file.name, file.type || file.mimeType);
        if (kind === "Document") {
            openWriter53(id, file, content);
            return;
        }
        if (kind === "Spreadsheet") {
            openSheets53(id, file, content);
            return;
        }
        if (kind === "Presentation") {
            openSlides53(id, file, content);
            return;
        }
        win(file.name || "File", `<h2>${safe(file.name || id)}</h2><textarea class="emerald53-inset" style="width:100%;height:260px;">${safe(content)}</textarea>`, "fileViewer53");
    }

    async function fileDetails53(id) {
        const files = await loadFiles();
        const f = files[id];
        if (!f) return;
        const shares = await listSharesByMe();
        const fileShares = shares.filter(s => s.fileId === id && s.status !== "revoked");
        win("File Details", `
            <h2>${safe(f.name || id)}</h2>
            <div class="emerald53-inset">
                <b>File ID:</b> ${safe(id)}<br>
                <b>Type:</b> ${safe(fileKind(f.name, f.type || f.mimeType))}<br>
                <b>Size:</b> ${formatBytes(fileSize(f))}<br>
                <b>Created:</b> ${dateTime(f.createdAt)}<br>
                <b>Updated:</b> ${dateTime(f.updatedAt)}<br>
                <b>Storage Mode:</b> ${safe(f.storageMode || "firestore")}
            </div>
            <h3>Access</h3>
            <div class="emerald53-inset">${fileShares.map(s => `${safe(s.targetUsername)} - ${safe(s.permission)} ${smallButton("Revoke", `revokeShare53('${safe(s.id)}')`)}`).join("<br>") || "Not shared."}</div>
        `, "fileDetails53");
    }

    async function renameFile53(id) {
        const name = prompt("New file name:");
        if (!name) return;
        await cloudSaveFile(id, { name: name.trim() });
        notify("Files", "File renamed.", "success");
        openFiles53();
    }

    async function deleteFileFromFiles53(id) {
        if (!confirm("Move this file to Trash?")) return;
        await cloudSaveFile(id, { trashed: true, trashedAt: now() });
        notify("Files", "File moved to Trash.", "warning");
        openFiles53();
    }

    async function newTextFile53() {
        const name = prompt("File name:", "New Text File.txt") || "New Text File.txt";
        const id = await cloudCreateFile(name, "");
        if (id) await cloudSaveFile(id, { folder: "Documents", app: "Files" });
        notify("Files", "Text file created.", "success");
        openFiles53();
    }

    async function newOfficeDocument53() {
        openWriter53(null, { name: "Untitled.edoc" }, "<h1>Untitled Document</h1><p>Start writing here.</p>");
    }

    async function openStorage53() {
        const files = await loadFiles();
        const list = Object.entries(files).filter(([, f]) => !f.trashed);
        const total = list.reduce((sum, [, f]) => sum + fileSize(f), 0);
        const large = list.filter(([, f]) => fileSize(f) > BUILD.fileLimit);
        const near = total > BUILD.fileLimit * 0.75;
        const rows = list.sort((a, b) => fileSize(b[1]) - fileSize(a[1])).slice(0, 20).map(([id, f]) => `
            <tr><td>${safe(f.name || id)}</td><td>${formatBytes(fileSize(f))}</td><td>${safe(f.storageMode || "firestore")}</td><td>${smallButton("Details", `fileDetails53('${safe(id)}')`)}</td></tr>`).join("");
        win("Storage Center", `
            <h2>Storage Center</h2>
            <div class="emerald53-${near ? "warning" : "success"}">
                <b>Total estimated storage:</b> ${formatBytes(total)}<br>
                <b>File count:</b> ${list.length}<br>
                <b>Large file threshold:</b> ${formatBytes(BUILD.fileLimit)}
            </div>
            ${large.length ? `<div class="emerald53-warning"><b>Large files:</b> ${large.length}. These may require Firebase Storage and CORS configuration.</div>` : ""}
            <div class="emerald53-toolbar">${smallButton("Open Files", "openFiles53()")} ${smallButton("Empty Trash", "emptyTrash53()")} ${smallButton("Download Report", "downloadStorageReport53()")}</div>
            <h3>Largest Files</h3>
            <table class="emerald53-table"><thead><tr><th>Name</th><th>Size</th><th>Storage</th><th>Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="4">No files.</td></tr>`}</tbody></table>
        `, "storage53");
    }

    async function emptyTrash53() {
        const files = await loadFiles();
        const trashed = Object.entries(files).filter(([, f]) => f.trashed);
        if (!trashed.length) return notify("Trash", "Trash is already empty.", "info");
        if (!confirm(`Permanently delete ${trashed.length} trashed files?`)) return;
        for (const [id] of trashed) await cloudDeleteFile(id);
        notify("Trash", "Trash emptied.", "success");
        openStorage53();
    }

    async function downloadStorageReport53() {
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

    async function shareFilePrompt53(fileId) {
        const target = prompt("Share with EmeraldOS username:");
        if (!target) return;
        const permission = prompt("Permission: view or edit", "view") || "view";
        await shareFile53(fileId, target.trim(), permission.trim().toLowerCase() === "edit" ? "edit" : "view");
    }

    async function shareFile53(fileId, targetUsername, permission = "view") {
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

    async function revokeShare53(shareId) {
        await updateDoc(doc(db, COL.shares, shareId), { status: "revoked", revokedAt: now(), updatedAt: now() });
        notify("File Sharing", "Share revoked.", "warning");
        openSharedByMe53();
    }

    async function openFileSharing53() {
        const files = await loadFiles();
        const users = await listUsers();
        const rows = Object.entries(files).filter(([, f]) => !f.trashed).map(([id, f]) => `
            <tr>
                <td>${safe(f.name || id)}<br><span class="emerald53-note">ID: ${safe(id)}</span></td>
                <td>${formatBytes(fileSize(f))}</td>
                <td>${smallButton("Share", `shareFilePrompt53('${safe(id)}')`)} ${smallButton("Copy ID", `copyText53('${safe(id)}')`)}</td>
            </tr>`).join("");
        const userRows = users.map(u => `<option value="${safe(u.username)}">${safe(u.username)}</option>`).join("");
        win("File Sharing", `
            <h2>File Sharing</h2>
            <div class="emerald53-warning">Share directly from this app or from Files. File IDs are shown for reference, but normal sharing only needs the Share button.</div>
            <div class="emerald53-toolbar">
                <select id="share_quick_user">${userRows}</select>
                ${smallButton("Open Shared With Me", "openSharedWithMe53()")}
                ${smallButton("Open Shared by Me", "openSharedByMe53()")}
                ${smallButton("Users", "openUsers53()")}
            </div>
            <table class="emerald53-table"><thead><tr><th>Your Files</th><th>Size</th><th>Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="3">No files to share.</td></tr>`}</tbody></table>
        `, "sharing53");
    }

    async function openSharedWithMe53() {
        const rows = await listSharesForMe();
        const html = rows.map(s => `
            <tr>
                <td>${safe(s.fileName || s.fileId)}<br><span class="emerald53-note">Owner: ${safe(s.owner)} | Permission: ${safe(s.permission)}</span></td>
                <td>${formatBytes(s.fileSize || 0)}</td>
                <td>${dateTime(s.createdAt)}</td>
                <td>${smallButton("Open", `openSharedFile53('${safe(s.id)}')`)} ${smallButton("Details", `sharedDetails53('${safe(s.id)}')`)}</td>
            </tr>`).join("");
        win("Shared With Me", `<h2>Shared With Me</h2><table class="emerald53-table"><thead><tr><th>File</th><th>Size</th><th>Shared</th><th>Actions</th></tr></thead><tbody>${html || `<tr><td colspan="4">No files have been shared with you.</td></tr>`}</tbody></table>`, "sharedWithMe53");
    }

    async function openSharedByMe53() {
        const rows = await listSharesByMe();
        const html = rows.map(s => `
            <tr>
                <td>${safe(s.fileName || s.fileId)}<br><span class="emerald53-note">To: ${safe(s.targetUsername)} | Permission: ${safe(s.permission)}</span></td>
                <td>${safe(s.status || "active")}</td>
                <td>${dateTime(s.createdAt)}</td>
                <td>${s.status === "revoked" ? "Revoked" : smallButton("Revoke", `revokeShare53('${safe(s.id)}')`)}</td>
            </tr>`).join("");
        win("Shared by Me", `<h2>Shared by Me</h2><table class="emerald53-table"><thead><tr><th>File</th><th>Status</th><th>Shared</th><th>Actions</th></tr></thead><tbody>${html || `<tr><td colspan="4">You have not shared files.</td></tr>`}</tbody></table>`, "sharedByMe53");
    }

    async function openSharedFile53(shareId) {
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
            <div class="emerald53-inset"><b>Owner:</b> ${safe(share.owner)}<br><b>Permission:</b> ${safe(share.permission)}<br><b>File ID:</b> ${safe(share.fileId)}</div>
            <textarea class="emerald53-inset" style="width:100%;height:260px;">${safe(content)}</textarea>
            ${share.permission === "edit" ? smallButton("Save Edited Copy", `saveSharedEditCopy53('${safe(share.id)}')`) : ""}
        `, "sharedFile53");
    }

    async function sharedDetails53(shareId) {
        const snap = await getDoc(doc(db, COL.shares, shareId));
        if (!snap.exists()) return;
        const s = snap.data() || {};
        win("Share Details", `<h2>${safe(s.fileName || s.fileId)}</h2><div class="emerald53-inset"><b>Owner:</b> ${safe(s.owner)}<br><b>Permission:</b> ${safe(s.permission)}<br><b>Status:</b> ${safe(s.status)}<br><b>Created:</b> ${dateTime(s.createdAt)}<br><b>File ID:</b> ${safe(s.fileId)}</div>`, "shareDetails53");
    }

    async function saveSharedEditCopy53(shareId) {
        const area = document.querySelector(".window:last-child textarea");
        const content = area?.value || "";
        const snap = await getDoc(doc(db, COL.shares, shareId));
        const s = snap.exists() ? snap.data() : {};
        const id = await cloudCreateFile(`Edited Copy - ${s.fileName || "Shared File.txt"}`, content);
        if (id) notify("Shared File", "Edited copy saved to your Files.", "success");
    }

    async function openTrash53() {
        const files = await loadFiles();
        const rows = Object.entries(files).filter(([, f]) => f.trashed).map(([id, f]) => `
            <tr><td>${safe(f.name || id)}</td><td>${dateTime(f.trashedAt)}</td><td>${smallButton("Restore", `restoreFile53('${safe(id)}')`)} ${smallButton("Delete Forever", `deleteForever53('${safe(id)}')`)}</td></tr>`).join("");
        win("Trash", `<h2>Trash</h2><table class="emerald53-table"><thead><tr><th>File</th><th>Moved</th><th>Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="3">Trash is empty.</td></tr>`}</tbody></table>`, "trash53");
    }

    async function restoreFile53(id) {
        await cloudSaveFile(id, { trashed: false, restoredAt: now() });
        notify("Trash", "File restored.", "success");
        openTrash53();
    }

    async function deleteForever53(id) {
        if (!confirm("Permanently delete this file?")) return;
        await cloudDeleteFile(id);
        notify("Trash", "File permanently deleted.", "warning");
        openTrash53();
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
        return `<div class="emerald53-toolbar">
            ${smallButton("Bold", "writerCmd53('bold')")}
            ${smallButton("Italic", "writerCmd53('italic')")}
            ${smallButton("Underline", "writerCmd53('underline')")}
            ${smallButton("Bullets", "writerCmd53('insertUnorderedList')")}
            ${smallButton("Numbers", "writerCmd53('insertOrderedList')")}
            ${smallButton("Left", "writerCmd53('justifyLeft')")}
            ${smallButton("Center", "writerCmd53('justifyCenter')")}
            ${smallButton("Right", "writerCmd53('justifyRight')")}
            <select onchange="writerBlock53(this.value);this.value=''">
                <option value="">Style</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="p">Paragraph</option>
            </select>
            <select onchange="writerFontSize53(this.value);this.value=''">
                <option value="">Size</option><option value="2">Small</option><option value="3">Normal</option><option value="5">Large</option><option value="7">Title</option>
            </select>
            <input type="color" onchange="writerColor53(this.value)">
            ${smallButton("Table", "writerInsertTable53()")}
            ${smallButton("Image URL", "writerInsertImage53()")}
            ${smallButton("Date", "writerInsertDate53()")}
            ${smallButton("Find", "writerFind53()")}
            ${smallButton("Replace", "writerReplace53()")}
            ${smallButton("Save", `saveWriter53('${fid}')`)}
            ${smallButton("Export TXT", "exportWriterText53()")}
            ${smallButton("Export HTML", "exportWriterHtml53()")}
            ${smallButton("Print", "printWriter53()")}
        </div>`;
    }

    function writerWindowHtml(title, html, fileId = "") {
        return `
            <h2>Emerald Writer</h2>
            <div class="emerald53-toolbar">
                <input id="writer53_title" value="${safe(title || "Untitled.edoc")}" placeholder="Document name" style="min-width:220px;">
                ${smallButton("Templates", "openTemplates53()")}
                ${smallButton("Vault", "openDocumentVault53()")}
                ${smallButton("Properties", "writerProperties53()")}
                <span id="writer53_count" class="emerald53-badge">0 words</span>
            </div>
            ${writerToolbar(fileId)}
            <div id="writer53_editor" class="emerald53-editor" contenteditable="true" oninput="writerAutosave53();writerCount53();">${html || docTemplate()}</div>
        `;
    }

    async function openWriter53(fileId = "", file = null, content = "") {
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
        win("Emerald Writer", writerWindowHtml(title, content || docTemplate(), fileId), "writer53");
        setTimeout(() => writerCount53(), 80);
    }

    function writerCmd53(cmd) { document.execCommand(cmd, false, null); writerCount53(); }
    function writerBlock53(block) { if (block) document.execCommand("formatBlock", false, block); writerCount53(); }
    function writerFontSize53(size) { if (size) document.execCommand("fontSize", false, size); writerCount53(); }
    function writerColor53(color) { if (color) document.execCommand("foreColor", false, color); writerCount53(); }
    function writerEditor() { return document.getElementById("writer53_editor"); }

    function writerInsertDate53() { document.execCommand("insertText", false, new Date().toLocaleDateString()); writerCount53(); }
    function writerInsertTable53() {
        document.execCommand("insertHTML", false, `<table border="1" style="width:100%;border-collapse:collapse"><tr><th>Header</th><th>Header</th></tr><tr><td>Cell</td><td>Cell</td></tr></table><p></p>`);
        writerCount53();
    }
    function writerInsertImage53() {
        const url = prompt("Image URL:");
        if (!url) return;
        document.execCommand("insertHTML", false, `<img src="${safe(url)}" style="max-width:100%;"><p></p>`);
    }
    function writerFind53() {
        const q = prompt("Find text:");
        if (!q) return;
        const text = writerEditor()?.innerText || "";
        alert(text.toLowerCase().includes(q.toLowerCase()) ? "Found." : "Not found.");
    }
    function writerReplace53() {
        const q = prompt("Find:");
        if (!q) return;
        const r = prompt("Replace with:", "") ?? "";
        const ed = writerEditor();
        if (!ed) return;
        ed.innerHTML = ed.innerHTML.split(q).join(safe(r));
        writerCount53();
    }
    function writerCount53() {
        const ed = writerEditor();
        const out = document.getElementById("writer53_count");
        if (!ed || !out) return;
        const text = ed.innerText.trim();
        const words = text ? text.split(/\s+/).length : 0;
        out.textContent = `${words} words, ${text.length} characters`;
    }
    function writerAutosave53() {
        const ed = writerEditor();
        const title = document.getElementById("writer53_title")?.value || "Untitled.edoc";
        if (!ed) return;
        localStorage.setItem(LS.officeAutosave, JSON.stringify({ title, html: ed.innerHTML, savedAt: now() }));
    }
    async function saveWriter53(fileId = "") {
        const ed = writerEditor();
        if (!ed) return;
        const title = document.getElementById("writer53_title")?.value || "Untitled.edoc";
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
    function exportWriterText53() { downloadText((document.getElementById("writer53_title")?.value || "document") + ".txt", writerEditor()?.innerText || ""); }
    function exportWriterHtml53() { downloadText((document.getElementById("writer53_title")?.value || "document") + ".html", writerEditor()?.innerHTML || ""); }
    function printWriter53() {
        const w = window.open("", "_blank");
        w.document.write(`<!doctype html><title>Print</title>${writerEditor()?.innerHTML || ""}`);
        w.document.close();
        w.print();
    }
    function writerProperties53() {
        const title = document.getElementById("writer53_title")?.value || "Untitled";
        const ed = writerEditor();
        win("Document Properties", `<h2>${safe(title)}</h2><div class="emerald53-inset"><b>Words:</b> ${(ed?.innerText.trim().split(/\s+/).filter(Boolean).length || 0)}<br><b>Characters:</b> ${ed?.innerText.length || 0}<br><b>Estimated size:</b> ${formatBytes(byteSize(ed?.innerHTML || ""))}</div>`, "docProperties53");
    }

    async function openEmeraldOffice53() {
        const recent = JSON.parse(localStorage.getItem(LS.recentDocs) || "[]");
        win("Emerald Office", `
            <h2>Emerald Office</h2>
            <div class="emerald53-grid">
                <div class="emerald53-card emerald53-app-tile" onclick="openWriter53()"><h3>Emerald Writer</h3><p>Documents, templates, page layout, exports, autosave.</p></div>
                <div class="emerald53-card emerald53-app-tile" onclick="openSheets53()"><h3>Emerald Sheets</h3><p>Tables, CSV export, basic formulas.</p></div>
                <div class="emerald53-card emerald53-app-tile" onclick="openSlides53()"><h3>Emerald Slides</h3><p>Multiple slides and HTML presentation export.</p></div>
                <div class="emerald53-card emerald53-app-tile" onclick="openForms53()"><h3>Emerald Forms</h3><p>Build simple forms and save drafts.</p></div>
                <div class="emerald53-card emerald53-app-tile" onclick="openTemplates53()"><h3>Templates</h3><p>Letter, memo, policy, report, meeting notes.</p></div>
                <div class="emerald53-card emerald53-app-tile" onclick="openDocumentVault53()"><h3>Document Vault</h3><p>Open recent and saved Office files.</p></div>
            </div>
            <h3>Recent Documents</h3>
            <div class="emerald53-inset">${recent.map(d => `<div>${safe(d.title)} ${smallButton("Open", `openFileFromFiles53('${safe(d.id)}')`)}</div>`).join("") || "No recent documents yet."}</div>
        `, "emeraldOffice53");
    }

    function openTemplates53() {
        win("Templates", `<h2>Templates</h2><div class="emerald53-grid">
            <div class="emerald53-card" onclick="openWriter53('',{name:'Letter.edoc'},docTemplate('letter'))"><h3>Letter</h3></div>
            <div class="emerald53-card" onclick="openWriter53('',{name:'Memo.edoc'},docTemplate('memo'))"><h3>Memo</h3></div>
            <div class="emerald53-card" onclick="openWriter53('',{name:'Policy.edoc'},docTemplate('policy'))"><h3>Policy</h3></div>
            <div class="emerald53-card" onclick="openWriter53('',{name:'Blank.edoc'},docTemplate())"><h3>Blank</h3></div>
        </div>`, "templates53");
    }

    async function openDocumentVault53() {
        const files = await loadFiles();
        const rows = Object.entries(files).filter(([, f]) => /\.(edoc|html|txt|md|csv|esheet|eslide)$/i.test(f.name || "")).map(([id, f]) => `<tr><td>${safe(f.name)}</td><td>${safe(fileKind(f.name, f.type))}</td><td>${formatBytes(fileSize(f))}</td><td>${smallButton("Open", `openFileFromFiles53('${safe(id)}')`)}</td></tr>`).join("");
        win("Document Vault", `<h2>Document Vault</h2><table class="emerald53-table"><thead><tr><th>Name</th><th>Kind</th><th>Size</th><th>Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="4">No Office files found.</td></tr>`}</tbody></table>`, "documentVault53");
    }

    function openSheets53(fileId = "", file = null, content = "") {
        const rows = Array.from({ length: 8 }, (_, r) => `<tr>${Array.from({ length: 6 }, (_, c) => `<td contenteditable="true" data-cell="${r}-${c}">${r === 0 ? String.fromCharCode(65 + c) : ""}</td>`).join("")}</tr>`).join("");
        win("Emerald Sheets", `<h2>Emerald Sheets</h2><div class="emerald53-toolbar">${smallButton("Sum Column A", "sheetSum53()")} ${smallButton("Export CSV", "sheetExportCSV53()")} ${smallButton("Save", "sheetSave53()")}</div><div class="emerald53-inset"><table id="sheet53" class="emerald53-table">${rows}</table></div><div id="sheet53_result" class="emerald53-inset">Ready.</div>`, "sheets53");
    }
    function sheetCells() { return Array.from(document.querySelectorAll("#sheet53 td")); }
    function sheetSum53() { const sum = sheetCells().filter(td => td.dataset.cell?.endsWith("-0")).reduce((s, td) => s + Number(td.innerText || 0), 0); setHTML("sheet53_result", `Column A total: <b>${sum}</b>`); }
    function sheetExportCSV53() { const rows = Array.from(document.querySelectorAll("#sheet53 tr")).map(tr => Array.from(tr.children).map(td => `"${String(td.innerText).replaceAll('"','""')}"`).join(",")).join("\n"); downloadText("EmeraldSheet.csv", rows); }
    async function sheetSave53() { const html = document.getElementById("sheet53")?.outerHTML || ""; const id = await cloudCreateFile("Emerald Sheet.esheet", html); if (id) notify("Emerald Sheets", "Sheet saved to Files.", "success"); }

    function openSlides53() {
        localStorage.setItem("53_slides", localStorage.getItem("53_slides") || JSON.stringify([{ title: "Title Slide", body: "Subtitle" }]));
        win("Emerald Slides", `<h2>Emerald Slides</h2><div class="emerald53-toolbar">${smallButton("Add Slide", "slideAdd53()")} ${smallButton("Export HTML", "slideExport53()")} ${smallButton("Save", "slideSave53()")}</div><div id="slides53_area"></div>`, "slides53");
        renderSlides53();
    }
    function getSlides53() { try { return JSON.parse(localStorage.getItem("53_slides") || "[]"); } catch { return []; } }
    function setSlides53(slides) { localStorage.setItem("53_slides", JSON.stringify(slides)); }
    function renderSlides53() {
        const slides = getSlides53();
        setHTML("slides53_area", slides.map((s, i) => `<div class="emerald53-slide"><input value="${safe(s.title)}" onchange="slideSet53(${i},'title',this.value)" style="font-size:18px;width:100%;font-weight:bold"><textarea onchange="slideSet53(${i},'body',this.value)" style="width:100%;height:110px;margin-top:8px;">${safe(s.body)}</textarea>${smallButton("Delete", `slideDelete53(${i})`)}</div>`).join(""));
    }
    function slideAdd53() { const slides = getSlides53(); slides.push({ title: "New Slide", body: "Content" }); setSlides53(slides); renderSlides53(); }
    function slideSet53(i, field, value) { const slides = getSlides53(); slides[i][field] = value; setSlides53(slides); }
    function slideDelete53(i) { const slides = getSlides53(); slides.splice(i, 1); setSlides53(slides); renderSlides53(); }
    function slideExport53() { const slides = getSlides53(); downloadText("EmeraldSlides.html", `<!doctype html>${slides.map(s => `<section style="min-height:90vh;padding:40px"><h1>${safe(s.title)}</h1><p>${safe(s.body)}</p></section>`).join("<hr>")}`); }
    async function slideSave53() { const id = await cloudCreateFile("Emerald Slides.eslide", JSON.stringify(getSlides53(), null, 2)); if (id) notify("Emerald Slides", "Slides saved to Files.", "success"); }

    function openForms53() {
        win("Emerald Forms", `<h2>Emerald Forms</h2><div class="emerald53-toolbar">${smallButton("Add Question", "formAddQuestion53()")}${smallButton("Export", "formExport53()")}</div><div id="form53_questions" class="emerald53-inset"></div>`, "forms53");
        renderForm53();
    }
    function getForm53() { try { return JSON.parse(localStorage.getItem("53_form") || "[]"); } catch { return []; } }
    function setForm53(q) { localStorage.setItem("53_form", JSON.stringify(q)); }
    function renderForm53() { const q = getForm53(); setHTML("form53_questions", q.map((x, i) => `<div class="emerald53-form-row"><input value="${safe(x)}" onchange="formSet53(${i},this.value)">${smallButton("Remove", `formRemove53(${i})`)}</div>`).join("") || "No questions yet."); }
    function formAddQuestion53() { const q = getForm53(); q.push("New question"); setForm53(q); renderForm53(); }
    function formSet53(i, v) { const q = getForm53(); q[i] = v; setForm53(q); }
    function formRemove53(i) { const q = getForm53(); q.splice(i, 1); setForm53(q); renderForm53(); }
    function formExport53() { downloadText("EmeraldForm.json", JSON.stringify(getForm53(), null, 2)); }

    /* =====================================================
       CHAT, USERS, PROFILES, CONTACTS
    ===================================================== */

    async function openEmeraldChat53(roomId = activeRoom53, label = activeRoomLabel53) {
        activeRoom53 = roomId;
        activeRoomLabel53 = label;
        await ensureChatRoom(roomId, label, roomId.startsWith("dm_") ? "direct" : "public", []);
        win("Emerald Chat", `
            <h2>Emerald Chat</h2>
            <div class="emerald53-toolbar">
                ${smallButton("Rooms", "openChatRooms53()")}
                ${smallButton("Direct Messages", "openDirectMessages53()")}
                ${smallButton("Users", "openUsers53()")}
                <span class="emerald53-badge">${safe(label)}</span>
            </div>
            <div id="chat53_log" class="emerald53-chat-log">Loading messages...</div>
            <div class="emerald53-toolbar">
                <input id="chat53_message" placeholder="Type a message" style="flex:1;min-width:260px;" onkeydown="if(event.key==='Enter')sendChat53()">
                ${smallButton("Send", "sendChat53()")}
            </div>
        `, "chat53");
        subscribeChat53(roomId);
    }

    function subscribeChat53(roomId) {
        if (chatUnsub53) chatUnsub53();
        chatUnsub53 = onSnapshot(roomMessages(roomId), snap => {
            const rows = [];
            snap.forEach(d => rows.push({ id: d.id, ...d.data() }));
            rows.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
            setHTML("chat53_log", rows.slice(-100).map(m => renderMessage53(m)).join("") || "No messages yet.");
            const log = document.getElementById("chat53_log");
            if (log) log.scrollTop = log.scrollHeight;
        }, err => setHTML("chat53_log", `<div class="emerald53-danger">Could not load chat: ${safe(err.message)}</div>`));
    }

    function renderMessage53(m) {
        const mine = m.sender === currentUser();
        const deleted = m.deleted;
        return `<div class="emerald53-message ${deleted ? "deleted" : ""}">
            <b>${safe(m.sender || "Unknown")}</b> <span class="emerald53-note">${dateTime(m.createdAt)}</span><br>
            ${deleted ? "Message deleted." : safe(m.text || "")}
            <div class="emerald53-toolbar">
                ${!deleted && mine ? smallButton("Edit", `editMessage53('${safe(activeRoom53)}','${safe(m.id)}')`) : ""}
                ${!deleted && (mine || isModerator()) ? smallButton("Delete", `deleteMessage53('${safe(activeRoom53)}','${safe(m.id)}')`) : ""}
                ${!deleted ? smallButton("Reply", `replyMessage53('${safe(m.sender)}')`) : ""}
                ${!deleted ? smallButton("Report", `reportMessage53('${safe(activeRoom53)}','${safe(m.id)}')`) : ""}
            </div>
        </div>`;
    }

    async function sendChat53() {
        const input = document.getElementById("chat53_message");
        const text = input?.value.trim();
        if (!text) return;
        await addDoc(roomMessages(activeRoom53), { sender: currentUser(), text, createdAt: now(), deleted: false });
        await setDoc(doc(db, COL.rooms, activeRoom53), { updatedAt: now(), lastMessage: text.slice(0, 120) }, { merge: true });
        input.value = "";
    }

    async function editMessage53(roomId, messageId) {
        const text = prompt("Edit message:");
        if (!text) return;
        await updateDoc(doc(db, COL.rooms, roomId, "messages", messageId), { text, editedAt: now() });
    }

    async function deleteMessage53(roomId, messageId) {
        await updateDoc(doc(db, COL.rooms, roomId, "messages", messageId), { deleted: true, deletedBy: currentUser(), deletedAt: now() });
        await logMod("message.delete", `${currentUser()} deleted message ${messageId} in ${roomId}`);
    }

    function replyMessage53(sender) {
        const input = document.getElementById("chat53_message");
        if (input) input.value = `@${sender} ` + input.value;
        input?.focus();
    }

    async function reportMessage53(roomId, messageId) {
        const reason = prompt("Report reason:", "Inappropriate message") || "Reported message";
        await addDoc(collection(db, COL.reports), { roomId, messageId, reason, reporter: currentUser(), status: "open", createdAt: now() });
        notify("Emerald Chat", "Message reported.", "warning");
    }

    async function openChatRooms53() {
        try {
            const snap = await getDocs(collection(db, COL.rooms));
            const rooms = [];
            snap.forEach(d => rooms.push({ id: d.id, ...d.data() }));
            rooms.sort((a, b) => String(a.label).localeCompare(String(b.label)));
            const rows = rooms.map(r => `<tr><td>${safe(r.label || r.id)}</td><td>${safe(r.type || "public")}</td><td>${dateTime(r.updatedAt)}</td><td>${smallButton("Open", `openEmeraldChat53('${safe(r.id)}','${safe(r.label || r.id)}')`)}</td></tr>`).join("");
            win("Chat Rooms", `<h2>Chat Rooms</h2><div class="emerald53-toolbar">${smallButton("Create Room", "createRoom53()")} ${smallButton("Global Lobby", "openEmeraldChat53('global','Global Lobby')")}</div><table class="emerald53-table"><thead><tr><th>Room</th><th>Type</th><th>Updated</th><th>Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="4">No rooms.</td></tr>`}</tbody></table>`, "rooms53");
        } catch (err) {
            win("Chat Rooms", `<div class="emerald53-danger">Could not list rooms: ${safe(err.message)}</div>`, "rooms53");
        }
    }

    async function createRoom53() {
        const label = prompt("Room name:");
        if (!label) return;
        const id = "room_" + uid(label);
        await ensureChatRoom(id, label, "public", []);
        openEmeraldChat53(id, label);
    }

    async function openDirectMessages53() {
        const users = (await listUsers()).filter(u => u.username !== currentUser());
        const rows = users.map(u => `<tr><td>${safe(u.displayName || u.username)}<br><span class="emerald53-note">${safe(u.username)}</span></td><td>${smallButton("Message", `startDM53('${safe(u.username)}')`)} ${smallButton("Profile", `openUserProfile53('${safe(u.username)}')`)}</td></tr>`).join("");
        win("Direct Messages", `<h2>Direct Messages</h2><table class="emerald53-table"><thead><tr><th>User</th><th>Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="2">No users found.</td></tr>`}</tbody></table>`, "directMessages53");
    }

    async function startDM53(username) {
        const roomId = dmRoom(currentUser(), username);
        const label = `DM: ${currentUser()} / ${username}`;
        await ensureChatRoom(roomId, label, "direct", [currentUser(), username]);
        openEmeraldChat53(roomId, label);
    }

    async function openCommunicationCenter53() {
        win("Communication Center", `<h2>Communication Center</h2><div class="emerald53-grid">
            <div class="emerald53-card emerald53-app-tile" onclick="openEmeraldChat53()"><h3>Emerald Chat</h3><p>Public rooms and direct messages.</p></div>
            <div class="emerald53-card emerald53-app-tile" onclick="openDirectMessages53()"><h3>Direct Messages</h3><p>Start one-on-one conversations.</p></div>
            <div class="emerald53-card emerald53-app-tile" onclick="openUsers53()"><h3>User Directory</h3><p>Find EmeraldOS users.</p></div>
            <div class="emerald53-card emerald53-app-tile" onclick="openNotificationCenter53()"><h3>Notifications</h3><p>View alerts and shared file notices.</p></div>
        </div>`, "communicationCenter53");
    }

    async function openUsers53() {
        const users = await listUsers();
        const rows = users.map(u => `<tr><td><span class="emerald53-status-dot"></span>${safe(u.displayName || u.username)}<br><span class="emerald53-note">${safe(u.username)}</span></td><td>${safe(u.role || "user")}</td><td>${dateTime(u.lastLogin || u.createdAt)}</td><td>${smallButton("Profile", `openUserProfile53('${safe(u.username)}')`)} ${smallButton("Message", `startDM53('${safe(u.username)}')`)} ${smallButton("Share File", `shareToUserPrompt53('${safe(u.username)}')`)}</td></tr>`).join("");
        win("EmeraldOS Users", `<h2>EmeraldOS Users</h2><div class="emerald53-toolbar"><input id="users53_filter" placeholder="Search users" oninput="filterTable53(this,'users53_table')"></div><table id="users53_table" class="emerald53-table"><thead><tr><th>User</th><th>Role</th><th>Activity</th><th>Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="4">No users found.</td></tr>`}</tbody></table>`, "users53");
    }

    async function shareToUserPrompt53(username) {
        const files = await loadFiles();
        const names = Object.entries(files).filter(([, f]) => !f.trashed).map(([id, f], i) => `${i + 1}. ${f.name || id} [${id}]`).join("\n");
        const pick = prompt(`Share which file with ${username}? Enter number, name, or file ID:\n\n${names}`);
        if (!pick) return;
        const entries = Object.entries(files).filter(([, f]) => !f.trashed);
        let found = entries[Number(pick) - 1];
        if (!found) found = entries.find(([id, f]) => id === pick || String(f.name).toLowerCase() === pick.toLowerCase());
        if (!found) return notify("File Sharing", "File not found.", "warning");
        const permission = prompt("Permission: view or edit", "view") || "view";
        await shareFile53(found[0], username, permission === "edit" ? "edit" : "view");
    }

    async function openMyProfile53() {
        const p = await getProfile(currentUser());
        win("My Profile", `<h2>My Profile</h2><div class="emerald53-grid"><div class="emerald53-card"><h3>${safe(p.initials || currentUser().slice(0,2).toUpperCase())}</h3><p>${safe(currentUser())}</p></div><div class="emerald53-card"><h3>Profile Details</h3><div class="emerald53-form-row">Display name<br><input id="profile53_display" value="${safe(p.displayName || currentUser())}"></div><div class="emerald53-form-row">Status<br><input id="profile53_status" value="${safe(p.status || "Available")}"></div><div class="emerald53-form-row">Bio<br><textarea id="profile53_bio" style="width:100%;height:100px;">${safe(p.bio || "")}</textarea></div>${smallButton("Save Profile", "saveMyProfile53()")}</div></div>`, "profile53");
    }

    async function saveMyProfile53() {
        await saveProfile({
            displayName: document.getElementById("profile53_display")?.value,
            status: document.getElementById("profile53_status")?.value,
            bio: document.getElementById("profile53_bio")?.value
        });
        notify("Profile", "Profile saved.", "success");
    }

    async function openUserProfile53(username) {
        const p = await getProfile(username);
        win("User Profile", `<h2>${safe(p.displayName || username)}</h2><div class="emerald53-inset"><b>Username:</b> ${safe(username)}<br><b>Status:</b> ${safe(p.status || "Available")}<br><b>Bio:</b><br>${safe(p.bio || "No bio set.")}</div><div class="emerald53-toolbar">${smallButton("Message", `startDM53('${safe(username)}')`)} ${smallButton("Share File", `shareToUserPrompt53('${safe(username)}')`)} ${smallButton("Add Contact", `addContact53('${safe(username)}')`)}</div>`, "userProfile53");
    }

    async function openContacts53() {
        const contacts = await loadContacts53();
        const rows = contacts.map(c => `<tr><td>${safe(c.username)}</td><td>${safe(c.favorite ? "Favorite" : "Contact")}</td><td>${smallButton("Message", `startDM53('${safe(c.username)}')`)} ${smallButton("Remove", `removeContact53('${safe(c.id)}')`)}</td></tr>`).join("");
        win("Contacts", `<h2>Contacts</h2><div class="emerald53-toolbar"><input id="contact53_name" placeholder="Username">${smallButton("Add", "addContactFromInput53()")}</div><table class="emerald53-table"><thead><tr><th>User</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="3">No contacts yet.</td></tr>`}</tbody></table>`, "contacts53");
    }

    async function loadContacts53() {
        try {
            const snap = await getDocs(collection(db, COL.users, currentUser(), COL.contacts));
            const rows = [];
            snap.forEach(d => rows.push({ id: d.id, ...(d.data() || {}) }));
            return rows.sort((a, b) => String(a.username).localeCompare(String(b.username)));
        } catch { return []; }
    }

    async function addContact53(username) {
        if (!username) return;
        await setDoc(doc(db, COL.users, currentUser(), COL.contacts, uid(username)), { username, addedAt: now(), favorite: false }, { merge: true });
        notify("Contacts", "Contact added.", "success");
    }
    async function addContactFromInput53() { const u = document.getElementById("contact53_name")?.value.trim(); if (u) { await addContact53(u); openContacts53(); } }
    async function removeContact53(id) { await deleteDoc(doc(db, COL.users, currentUser(), COL.contacts, id)); openContacts53(); }
    function openFriends53() { openContacts53(); }

    /* =====================================================
       MODERATION AND ADMINISTRATION
    ===================================================== */

    async function logMod(action, details) {
        try { await addDoc(collection(db, COL.logs), { action, details, actor: currentUser(), createdAt: now() }); }
        catch (err) { console.warn("Log skipped:", err); }
    }

    async function openModeratorConsole53() {
        if (!isModerator()) return win("Access Denied", `<div class="emerald53-danger">Moderator access is required.</div>`, "accessDenied53");
        win("Moderator Console", `<h2>Moderator Console</h2><div class="emerald53-grid">
            <div class="emerald53-card" onclick="openReportsReview53()"><h3>Reports Review</h3><p>Review reported messages.</p></div>
            <div class="emerald53-card" onclick="openCommunicationAudit53()"><h3>Communication Audit</h3><p>Recent message review.</p></div>
            <div class="emerald53-card" onclick="openModerationLog53()"><h3>Moderation Log</h3><p>View moderation actions.</p></div>
            <div class="emerald53-card" onclick="openMuteTools53()"><h3>Mute Tools</h3><p>Mute or unmute users.</p></div>
        </div>`, "moderatorConsole53");
    }

    async function openReportsReview53() {
        if (!isModerator()) return;
        const snap = await getDocs(collection(db, COL.reports));
        const rows = [];
        snap.forEach(d => rows.push({ id: d.id, ...(d.data() || {}) }));
        rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        const html = rows.map(r => `<tr><td>${safe(r.reason)}</td><td>${safe(r.reporter)}</td><td>${safe(r.roomId)}<br>${safe(r.messageId)}</td><td>${safe(r.status || "open")}</td><td>${smallButton("Close", `closeReport53('${safe(r.id)}')`)} ${smallButton("Delete Message", `deleteMessage53('${safe(r.roomId)}','${safe(r.messageId)}')`)}</td></tr>`).join("");
        win("Reports Review", `<h2>Reports Review</h2><table class="emerald53-table"><thead><tr><th>Reason</th><th>Reporter</th><th>Message</th><th>Status</th><th>Actions</th></tr></thead><tbody>${html || `<tr><td colspan="5">No reports.</td></tr>`}</tbody></table>`, "reportsReview53");
    }
    async function closeReport53(id) { await updateDoc(doc(db, COL.reports, id), { status: "closed", closedBy: currentUser(), closedAt: now() }); await logMod("report.close", `Closed report ${id}`); openReportsReview53(); }

    async function openCommunicationAudit53() {
        if (!isModerator()) return;
        try {
            const snap = await getDocs(collectionGroup(db, "messages"));
            const rows = [];
            snap.forEach(d => rows.push({ id: d.id, path: d.ref.path, ...(d.data() || {}) }));
            rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            const html = rows.slice(0, 120).map(m => `<tr><td>${safe(m.sender)}</td><td>${safe(m.text || "")}</td><td>${dateTime(m.createdAt)}</td><td>${safe(m.path)}</td></tr>`).join("");
            win("Communication Audit", `<h2>Communication Audit</h2><table class="emerald53-table"><thead><tr><th>Sender</th><th>Message</th><th>Time</th><th>Path</th></tr></thead><tbody>${html || `<tr><td colspan="4">No messages found.</td></tr>`}</tbody></table>`, "communicationAudit53");
        } catch (err) {
            win("Communication Audit", `<div class="emerald53-danger">Could not run audit: ${safe(err.message)}</div>`, "communicationAudit53");
        }
    }

    async function openModerationLog53() {
        if (!isModerator()) return;
        const snap = await getDocs(collection(db, COL.logs));
        const rows = [];
        snap.forEach(d => rows.push({ id: d.id, ...(d.data() || {}) }));
        rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        win("Moderation Log", `<h2>Moderation Log</h2><table class="emerald53-table"><thead><tr><th>Action</th><th>Actor</th><th>Details</th><th>Time</th></tr></thead><tbody>${rows.map(r => `<tr><td>${safe(r.action)}</td><td>${safe(r.actor)}</td><td>${safe(r.details)}</td><td>${dateTime(r.createdAt)}</td></tr>`).join("") || `<tr><td colspan="4">No log entries.</td></tr>`}</tbody></table>`, "modLog53");
    }

    function openMuteTools53() {
        if (!isModerator()) return;
        win("Mute Tools", `<h2>Mute Tools</h2><div class="emerald53-toolbar"><input id="mute53_user" placeholder="Username"><input id="mute53_reason" placeholder="Reason">${smallButton("Mute", "muteUser53()")} ${smallButton("Unmute", "unmuteUser53()")}</div>`, "muteTools53");
    }
    async function muteUser53() { const u = document.getElementById("mute53_user")?.value.trim(); const r = document.getElementById("mute53_reason")?.value || "Moderation mute"; if (!u) return; await setDoc(doc(db, COL.mutes, uid(u)), { username: u, reason: r, mutedBy: currentUser(), mutedAt: now(), active: true }, { merge: true }); await logMod("user.mute", `${u}: ${r}`); notify("Moderation", "User muted.", "warning"); }
    async function unmuteUser53() { const u = document.getElementById("mute53_user")?.value.trim(); if (!u) return; await setDoc(doc(db, COL.mutes, uid(u)), { username: u, active: false, unmutedBy: currentUser(), unmutedAt: now() }, { merge: true }); await logMod("user.unmute", u); notify("Moderation", "User unmuted.", "success"); }

    async function openAdminPanel53() {
        if (!isExecutive()) return win("Access Denied", `<div class="emerald53-danger">Executive access is required.</div>`, "accessDenied53");
        win("Administrative Panel", `<h2>Administrative Panel</h2><div class="emerald53-grid">
            <div class="emerald53-card" onclick="openAdminUsers53()"><h3>Users</h3><p>View users, roles, profiles, and account state.</p></div>
            <div class="emerald53-card" onclick="openAdminStorage53()"><h3>Storage</h3><p>View saved file metadata and storage usage.</p></div>
            <div class="emerald53-card" onclick="openAdminSharing53()"><h3>Sharing</h3><p>Audit file shares and permissions.</p></div>
            <div class="emerald53-card" onclick="openSecurityAudit53()"><h3>Security Audit</h3><p>Review reports, mutes, logs, and system warnings.</p></div>
        </div>`, "adminPanel53");
    }

    async function openAdminUsers53() {
        if (!isExecutive()) return;
        const users = await listUsers();
        const rows = users.map(u => `<tr><td>${safe(u.username)}</td><td>${safe(u.displayName || "")}</td><td>${safe(u.role || "user")}</td><td>${dateTime(u.createdAt)}</td><td>${smallButton("Files", `adminViewUserFiles53('${safe(u.username)}')`)} ${smallButton("Profile", `openUserProfile53('${safe(u.username)}')`)}</td></tr>`).join("");
        win("User Administration", `<h2>User Administration</h2><div class="emerald53-toolbar"><input placeholder="Search" oninput="filterTable53(this,'adminUsers53_table')"></div><table id="adminUsers53_table" class="emerald53-table"><thead><tr><th>Username</th><th>Display</th><th>Role</th><th>Created</th><th>Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="5">No users.</td></tr>`}</tbody></table>`, "adminUsers53");
    }

    async function adminViewUserFiles53(username) {
        if (!isExecutive()) return;
        try {
            const snap = await getDocs(collection(db, COL.users, username, "drive"));
            const rows = [];
            snap.forEach(d => rows.push({ id: d.id, ...(d.data() || {}) }));
            rows.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
            const total = rows.reduce((s, f) => s + fileSize(f), 0);
            win("User Files", `<h2>${safe(username)} Files</h2><div class="emerald53-inset"><b>Files:</b> ${rows.length}<br><b>Estimated storage:</b> ${formatBytes(total)}</div><table class="emerald53-table"><thead><tr><th>Name</th><th>ID</th><th>Size</th><th>Updated</th></tr></thead><tbody>${rows.map(f => `<tr><td>${safe(f.name)}</td><td>${safe(f.id)}</td><td>${formatBytes(fileSize(f))}</td><td>${dateTime(f.updatedAt || f.createdAt)}</td></tr>`).join("") || `<tr><td colspan="4">No files.</td></tr>`}</tbody></table>`, "adminUserFiles53");
        } catch (err) {
            win("User Files", `<div class="emerald53-danger">Could not read user files: ${safe(err.message)}</div>`, "adminUserFiles53");
        }
    }

    async function openAdminStorage53() {
        if (!isExecutive()) return;
        const users = await listUsers();
        const rows = [];
        for (const u of users.slice(0, 80)) {
            try {
                const snap = await getDocs(collection(db, COL.users, u.username, "drive"));
                let total = 0, count = 0;
                snap.forEach(d => { count++; total += fileSize(d.data() || {}); });
                rows.push(`<tr><td>${safe(u.username)}</td><td>${count}</td><td>${formatBytes(total)}</td><td>${smallButton("View", `adminViewUserFiles53('${safe(u.username)}')`)}</td></tr>`);
            } catch {}
        }
        win("Storage Administration", `<h2>Storage Administration</h2><table class="emerald53-table"><thead><tr><th>User</th><th>Files</th><th>Estimated Storage</th><th>Actions</th></tr></thead><tbody>${rows.join("") || `<tr><td colspan="4">No data.</td></tr>`}</tbody></table>`, "adminStorage53");
    }

    async function openAdminSharing53() {
        if (!isExecutive()) return;
        const snap = await getDocs(collection(db, COL.shares));
        const rows = [];
        snap.forEach(d => rows.push({ id: d.id, ...(d.data() || {}) }));
        rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        win("Sharing Administration", `<h2>Sharing Administration</h2><table class="emerald53-table"><thead><tr><th>File</th><th>Owner</th><th>Target</th><th>Permission</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows.map(s => `<tr><td>${safe(s.fileName)}</td><td>${safe(s.owner)}</td><td>${safe(s.targetUsername)}</td><td>${safe(s.permission)}</td><td>${safe(s.status)}</td><td>${s.status !== "revoked" ? smallButton("Revoke", `revokeShare53('${safe(s.id)}')`) : ""}</td></tr>`).join("") || `<tr><td colspan="6">No shares.</td></tr>`}</tbody></table>`, "adminSharing53");
    }

    async function openSecurityAudit53() {
        if (!isExecutive()) return;
        win("Security Audit", `<h2>Security Audit</h2><div class="emerald53-grid"><div class="emerald53-card" onclick="openReportsReview53()"><h3>Reports</h3></div><div class="emerald53-card" onclick="openModerationLog53()"><h3>Moderation Log</h3></div><div class="emerald53-card" onclick="openCommunicationAudit53()"><h3>Communication Audit</h3></div><div class="emerald53-card" onclick="openMuteTools53()"><h3>Mute Tools</h3></div></div>`, "securityAudit53");
    }

    /* =====================================================
       SETTINGS, NOTIFICATIONS, ASSISTANT, DESKTOP
    ===================================================== */

    function openNotificationCenter53() {
        const list = readNotifications();
        win("Notification Center", `<h2>Notification Center</h2><div class="emerald53-toolbar">${smallButton("Clear All", "clearNotifications53()")} ${smallButton("Test", "notify('EmeraldOS','Notification test complete.',2500,'info')")}</div><div class="emerald53-inset">${list.map(n => `<div class="emerald53-message"><b>${safe(n.title)}</b> <span class="emerald53-note">${dateTime(n.time)}</span><br>${safe(n.message)}</div>`).join("") || "No notifications."}</div>`, "notifications53");
    }
    function clearNotifications53() { localStorage.setItem(LS.notifications, "[]"); openNotificationCenter53(); }

    function openSettings53() {
        win("Settings", `<h2>Settings</h2><div class="emerald53-grid">
            <div class="emerald53-card"><h3>Desktop</h3><label><input type="checkbox" ${localStorage.getItem(LS.desktopLocked)==='true'?'checked':''} onchange="localStorage.setItem('${LS.desktopLocked}',this.checked?'true':'false')"> Lock desktop layout</label><br>${smallButton("Clean Desktop", "desktopClean53()")} ${smallButton("Render Desktop", "renderDesktop53()")}</div>
            <div class="emerald53-card"><h3>Assistant</h3><label><input type="checkbox" ${localStorage.getItem(LS.assistantEnabled)==='true'?'checked':''} onchange="localStorage.setItem('${LS.assistantEnabled}',this.checked?'true':'false')"> Enable Emerald Assistant</label><br><input id="assistant53_endpoint" placeholder="OpenAI-compatible endpoint" value="${safe(localStorage.getItem(LS.assistantEndpoint)||'')}"><br><input id="assistant53_key" placeholder="API key" type="password" value="${safe(localStorage.getItem(LS.assistantKey)||'')}"><br>${smallButton("Save Assistant Settings", "saveAssistantSettings53()")}</div>
            <div class="emerald53-card"><h3>Files</h3>${smallButton("Open Storage", "openStorage53()")} ${smallButton("Open Sharing", "openFileSharing53()")}</div>
            <div class="emerald53-card"><h3>Privacy</h3>${smallButton("Security & Privacy", "openSecurityPrivacy53()")}</div>
        </div>`, "settings53");
    }

    function saveAssistantSettings53() {
        localStorage.setItem(LS.assistantEndpoint, document.getElementById("assistant53_endpoint")?.value || "");
        localStorage.setItem(LS.assistantKey, document.getElementById("assistant53_key")?.value || "");
        notify("Settings", "Assistant settings saved.", "success");
    }

    function openAssistant53() {
        const enabled = localStorage.getItem(LS.assistantEnabled) === "true";
        win("Emerald Assistant", `<h2>Emerald Assistant</h2><div class="emerald53-${enabled ? "success" : "warning"}">${enabled ? "Assistant is enabled." : "Assistant is disabled. Enable it in Settings to use API mode. Offline tips are always available."}</div><div class="emerald53-toolbar"><input id="assistant53_prompt" placeholder="Ask for help with files, chat, or documents" style="flex:1;min-width:300px;" onkeydown="if(event.key==='Enter')askAssistant53()">${smallButton("Ask", "askAssistant53()")} ${smallButton("Offline Tips", "assistantTips53()")}</div><div id="assistant53_answer" class="emerald53-inset">Ready.</div>`, "assistant53");
    }

    function assistantTips53() {
        setHTML("assistant53_answer", `<b>Useful tips:</b><br>Use Files for storage and sharing.<br>Use Emerald Office for Writer, Sheets, Slides, and Forms.<br>Use Communication Center for chat and users.<br>Use Storage Center to review file size warnings.<br>Use Moderator Console for reports and message review.`);
    }

    async function askAssistant53() {
        const promptText = document.getElementById("assistant53_prompt")?.value || "";
        if (!promptText) return;
        const endpoint = localStorage.getItem(LS.assistantEndpoint) || "";
        const key = localStorage.getItem(LS.assistantKey) || "";
        const enabled = localStorage.getItem(LS.assistantEnabled) === "true";
        if (!enabled || !endpoint || !key) {
            setHTML("assistant53_answer", `Offline answer: Try opening Settings, Files, Communication Center, or Emerald Office. For writing help, open Emerald Writer and use Templates, Find, Replace, Table, and Export.`);
            return;
        }
        setHTML("assistant53_answer", "Contacting assistant endpoint...");
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
            setHTML("assistant53_answer", safe(answer).replaceAll("\n", "<br>"));
        } catch (err) {
            setHTML("assistant53_answer", `<div class="emerald53-danger">Assistant request failed: ${safe(err.message)}</div>`);
        }
    }

    function openSecurityPrivacy53() {
        win("Security & Privacy", `<h2>Security & Privacy</h2><div class="emerald53-inset"><b>Current user:</b> ${safe(currentUser())}<br><b>Role:</b> ${safe(roleText() || "user")}<br><b>Moderator access:</b> ${isModerator() ? "Yes" : "No"}<br><b>Executive access:</b> ${isExecutive() ? "Yes" : "No"}</div><div class="emerald53-toolbar">${smallButton("Clear Local Notifications", "clearNotifications53()")} ${smallButton("Reset Desktop Layout", "desktopReset53()")} ${smallButton("Open Shared by Me", "openSharedByMe53()")}</div>`, "security53");
    }
    function openPrivacy53() { openSecurityPrivacy53(); }

    function openDesktopTools53() {
        win("Desktop Tools", `<h2>Desktop Tools</h2><div class="emerald53-toolbar">${smallButton("Clean Desktop", "desktopClean53()")} ${smallButton("Render Desktop", "renderDesktop53()")} ${smallButton("Lock Layout", "desktopLock53()")} ${smallButton("Unlock Layout", "desktopUnlock53()")} ${smallButton("Reset Layout", "desktopReset53()")}</div><div class="emerald53-inset">Desktop folder mode is active. App clutter is consolidated into folders.</div>`, "desktopTools53");
    }
    function desktopClean53() { renderDesktop53(); renderStart53(); notify("Desktop", "Desktop cleaned.", "success"); }
    function desktopLock53() { localStorage.setItem(LS.desktopLocked, "true"); notify("Desktop", "Desktop layout locked.", "info"); }
    function desktopUnlock53() { localStorage.setItem(LS.desktopLocked, "false"); notify("Desktop", "Desktop layout unlocked.", "info"); }
    function desktopReset53() { localStorage.removeItem("40_desktop_positions"); renderDesktop53(); notify("Desktop", "Desktop layout reset.", "success"); }

    function openAppManager53() {
        const rows = Object.entries(window.APPS || {}).filter(([id]) => visibleApp(id)).map(([id, app]) => `<tr><td>${safe(app.name)}</td><td>${safe(id)}</td><td>${safe(app.edition || "economy")}</td><td>${smallButton("Open", `launchApp('${safe(id)}')`)}</td></tr>`).join("");
        win("App Manager", `<h2>App Manager</h2><table class="emerald53-table"><thead><tr><th>Application</th><th>ID</th><th>Edition</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table>`, "appManager53");
    }

    function openTasks53() { win("Task Board", `<h2>Task Board</h2><textarea style="width:100%;height:260px;" placeholder="Task list"></textarea>`, "tasks53"); }
    function openPlanner53() { win("Planner", `<h2>Planner</h2><textarea style="width:100%;height:260px;" placeholder="Plan details"></textarea>`, "planner53"); }
    async function openReports53() { const files = await loadFiles(); win("Reports", `<h2>Reports</h2><div class="emerald53-inset"><b>User:</b> ${safe(currentUser())}<br><b>Files:</b> ${Object.keys(files).length}<br><b>Notifications:</b> ${readNotifications().length}</div>`, "reports53"); }

    /* =====================================================
       TERMINAL AND UTILITIES
    ===================================================== */

    function filterTable53(input, tableId) {
        const q = String(input.value || "").toLowerCase();
        document.querySelectorAll(`#${CSS.escape(tableId)} tbody tr`).forEach(tr => {
            tr.style.display = tr.innerText.toLowerCase().includes(q) ? "" : "none";
        });
    }

    function copyText53(text) {
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
                "version": () => "EmeraldOS 5.3 - Communication, Profiles & Files Update",
                "build": () => "EmeraldOS 5.3 - Communication, Profiles & Files Update",
                "office": () => { openEmeraldOffice53(); return "Opening Emerald Office."; },
                "writer": () => { openWriter53(); return "Opening Emerald Writer."; },
                "sheets": () => { openSheets53(); return "Opening Emerald Sheets."; },
                "slides": () => { openSlides53(); return "Opening Emerald Slides."; },
                "files": () => { openFiles53(); return "Opening Files."; },
                "storage": () => { openStorage53(); return "Opening Storage Center."; },
                "sharing": () => { openFileSharing53(); return "Opening File Sharing."; },
                "shared": () => { openSharedWithMe53(); return "Opening Shared With Me."; },
                "chat": () => { openEmeraldChat53(); return "Opening Emerald Chat."; },
                "rooms": () => { openChatRooms53(); return "Opening Chat Rooms."; },
                "dm": () => { openDirectMessages53(); return "Opening Direct Messages."; },
                "users": () => { openUsers53(); return "Opening EmeraldOS Users."; },
                "profile": () => { openMyProfile53(); return "Opening My Profile."; },
                "contacts": () => { openContacts53(); return "Opening Contacts."; },
                "settings": () => { openSettings53(); return "Opening Settings."; },
                "notifications": () => { openNotificationCenter53(); return "Opening Notification Center."; },
                "assistant": () => { openAssistant53(); return "Opening Emerald Assistant."; },
                "desktop.clean": () => { desktopClean53(); return "Desktop cleaned."; },
                "desktop.lock": () => { desktopLock53(); return "Desktop locked."; },
                "desktop.unlock": () => { desktopUnlock53(); return "Desktop unlocked."; },
                "moderation": () => { openModeratorConsole53(); return "Opening Moderator Console."; },
                "mod": () => { openModeratorConsole53(); return "Opening Moderator Console."; },
                "admin": () => { openAdminPanel53(); return "Opening Administrative Panel."; }
            };
            if (map[cmd]) return map[cmd]();
            if (typeof original === "function") return original(raw);
            return `Unknown command: ${raw}`;
        };
    }

    function exposeGlobals() {
        Object.assign(window, {
            openFolder53,
            renderDesktop53,
            renderStart53,
            openEmeraldOffice53,
            openWriter53,
            writerCmd53,
            writerBlock53,
            writerFontSize53,
            writerColor53,
            writerInsertDate53,
            writerInsertTable53,
            writerInsertImage53,
            writerFind53,
            writerReplace53,
            writerCount53,
            writerAutosave53,
            saveWriter53,
            exportWriterText53,
            exportWriterHtml53,
            printWriter53,
            writerProperties53,
            openTemplates53,
            docTemplate,
            openDocumentVault53,
            openSheets53,
            sheetSum53,
            sheetExportCSV53,
            sheetSave53,
            openSlides53,
            renderSlides53,
            slideAdd53,
            slideSet53,
            slideDelete53,
            slideExport53,
            slideSave53,
            openForms53,
            formAddQuestion53,
            formSet53,
            formRemove53,
            formExport53,
            openFiles53,
            openFileFromFiles53,
            fileDetails53,
            renameFile53,
            deleteFileFromFiles53,
            restoreFile53,
            deleteForever53,
            newTextFile53,
            newOfficeDocument53,
            openStorage53,
            emptyTrash53,
            downloadStorageReport53,
            openFileSharing53,
            shareFilePrompt53,
            shareFile53,
            revokeShare53,
            openSharedWithMe53,
            openSharedByMe53,
            openSharedFile53,
            sharedDetails53,
            saveSharedEditCopy53,
            openTrash53,
            openEmeraldChat53,
            sendChat53,
            editMessage53,
            deleteMessage53,
            replyMessage53,
            reportMessage53,
            openChatRooms53,
            createRoom53,
            openDirectMessages53,
            startDM53,
            openCommunicationCenter53,
            openUsers53,
            shareToUserPrompt53,
            openMyProfile53,
            saveMyProfile53,
            openUserProfile53,
            openContacts53,
            addContact53,
            addContactFromInput53,
            removeContact53,
            openFriends53,
            openModeratorConsole53,
            openReportsReview53,
            closeReport53,
            openCommunicationAudit53,
            openModerationLog53,
            openMuteTools53,
            muteUser53,
            unmuteUser53,
            openAdminPanel53,
            openAdminUsers53,
            adminViewUserFiles53,
            openAdminStorage53,
            openAdminSharing53,
            openSecurityAudit53,
            openNotificationCenter53,
            clearNotifications53,
            openSettings53,
            saveAssistantSettings53,
            openAssistant53,
            askAssistant53,
            assistantTips53,
            openSecurityPrivacy53,
            openPrivacy53,
            openDesktopTools53,
            desktopClean53,
            desktopLock53,
            desktopUnlock53,
            desktopReset53,
            openAppManager53,
            openTasks53,
            openPlanner53,
            openReports53,
            filterTable53,
            copyText53
        });
    }

    function setBuildIdentity() {
        document.title = BUILD.displayName;
        localStorage.setItem("40_build_name", BUILD.displayName);
        localStorage.setItem("40_version", BUILD.version);
        try { window.EmeraldOSRegistry?.set?.("HKEY_LOCAL_MACHINE\\System\\Build\\Version", BUILD.version); } catch {}
        const badge = document.getElementById("emerald40-build-badge");
        if (badge) badge.innerHTML = `<span class="emerald53-badge">${safe(BUILD.displayName)}</span>`;
    }

    function init() {
        installStyles();
        patchWindowManager();
        exposeGlobals();
        installApps();
        setBuildIdentity();
        window.EMERALDOS_APP_CATEGORIES = FOLDERS;
        window.renderDesktopOverride = renderDesktop53;
        window.renderStartMenuOverride = renderStart53;
        window.renderDesktop = renderDesktop53;
        window.renderStartMenu = renderStart53;
        installTerminalCommands();
        renderDesktop53();
        renderStart53();
        setTimeout(patchWindowManager, 500);
        notify("EmeraldOS 5.3", "Communication, profiles, files, office, moderation, and desktop fixes loaded.", "success");
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", () => setTimeout(init, 160));
    } else {
        setTimeout(init, 160);
    }
})();
