"use strict";

/* =========================================================
   EMERALDOS 5.2
   INTEGRATED CHAT + FILES CONSOLIDATION + MODERATION TOOLS
========================================================= */

import { db, storage } from "./firebase.js";
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
    query,
    orderBy,
    limit,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    ref as storageRef,
    getBytes,
    getBlob,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

import {
    createFile as cloudCreateFile,
    saveFile as cloudSaveFile,
    deleteFile as cloudDeleteFile,
    loadDrive,
    getFileContent
} from "./cloudstorage.js";

(function () {
    if (window.EmeraldOS52Loaded) return;
    window.EmeraldOS52Loaded = true;

    const BUILD = {
        product: "EmeraldOS",
        version: "5.2",
        displayName: "EmeraldOS 5.2",
        codename: "Integrated Chat, Files & Moderation Update",
        fileLimit: 1024 * 1024
    };

    const SHARES_COLLECTION = "emeraldOSShares";
    const CHAT_ROOMS = "emeraldOSChatRooms";
    const CHAT_REPORTS = "emeraldOSChatReports";
    const CHAT_MUTES = "emeraldOSChatMutes";
    const MOD_LOGS = "emeraldOSModerationLogs";

    const originalOpenFileExplorer52 = window.openFileExplorer;
    const originalOpenFile52 = window.openFile;
    const originalDownloadFile52 = window.downloadFile;

    let currentChatRoom52 = "global";
    let currentChatLabel52 = "Global Lobby";
    let chatUnsubscribe52 = null;

    function currentUser() {
        return localStorage.getItem("40_username") ||
            localStorage.getItem("40_session") ||
            localStorage.getItem("username") ||
            localStorage.getItem("TestOSusername") ||
            "";
    }

    function safe(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function notify(title, message, type = "info") {
        window.notify?.(title, message, 3500, type);
    }

    function formatBytes(bytes = 0) {
        const n = Number(bytes || 0);
        if (n < 1024) return n + " B";
        if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
        return (n / (1024 * 1024)).toFixed(2) + " MB";
    }

    function byteSize(value = "") {
        try { return new Blob([String(value || "")]).size; }
        catch { return String(value || "").length; }
    }

    function fileSize(file = {}) {
        if (typeof file.size === "number") return file.size;
        if (typeof file.storageSize === "number") return file.storageSize;
        if (file.content) return byteSize(file.content);
        return 0;
    }

    function getFileFolder(file = {}) {
        return file.folder || file.parent || "Desktop";
    }

    function fileIcon(file = {}) {
        const name = String(file.name || "").toLowerCase();
        const type = String(file.type || file.mimeType || file.storageContentType || "").toLowerCase();
        if (type === "folder") return "FOLDER";
        if (/\.(edoc|doc|docx|txt|md|html)$/i.test(name)) return "DOC";
        if (/\.(csv|xls|xlsx|esheet)$/i.test(name)) return "SHEET";
        if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(name) || type.startsWith("image")) return "IMG";
        if (/\.(mp3|wav|ogg|m4a)$/i.test(name) || type.startsWith("audio")) return "AUD";
        if (/\.(mp4|webm|mov)$/i.test(name) || type.startsWith("video")) return "VID";
        return "FILE";
    }

    function simpleWindow(title, html, app = "emerald52") {
        if (typeof window.openWindow === "function") {
            return window.openWindow(title, `<div class="emerald52-panel">${html}</div>`, app);
        }
        alert(title);
        return null;
    }

    function button(label, action, extraClass = "") {
        return `<button class="win95-small-button ${extraClass}" onclick="${action}">${safe(label)}</button>`;
    }

    function renderInto(id, html) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
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

    function normalizeName(name = "") {
        return String(name || "").trim();
    }

    function roomSafePart(value = "") {
        return normalizeName(value).toLowerCase().replace(/[^a-z0-9_-]+/g, "_").slice(0, 80) || "user";
    }

    function dmRoomFor(userA, userB) {
        const parts = [roomSafePart(userA), roomSafePart(userB)].sort();
        return "dm_" + parts.join("__");
    }

    function roomDoc(roomId) {
        return doc(db, CHAT_ROOMS, roomId);
    }

    function roomMessages(roomId) {
        return collection(db, CHAT_ROOMS, roomId, "messages");
    }

    async function ensureRoom(roomId, label, type = "public", members = []) {
        await setDoc(roomDoc(roomId), {
            roomId,
            label,
            type,
            members,
            updatedAt: Date.now()
        }, { merge: true });
    }

    async function listUsers() {
        try {
            const snap = await getDocs(collection(db, "emeraldOSUsers"));
            const rows = [];
            snap.forEach(d => {
                const data = d.data() || {};
                rows.push({
                    id: d.id,
                    username: data.username || d.id,
                    createdAt: data.createdAt || data.created || 0,
                    lastLogin: data.lastLogin || 0
                });
            });
            return rows.sort((a, b) => String(a.username).localeCompare(String(b.username)));
        } catch (err) {
            console.warn("Could not list EmeraldOS users:", err);
            return [];
        }
    }

    async function refreshDrive() {
        try {
            const files = await loadDrive() || {};
            if (window.fileSystem) window.fileSystem.files = files;
            return files;
        } catch (err) {
            console.warn("Could not refresh drive:", err);
            return window.fileSystem?.files || {};
        }
    }

    /* =====================================================
       APP REGISTRATION
    ===================================================== */

    function registerApp(id, app) {
        if (!window.APPS) return;
        window.APPS[id] = Object.assign({
            name: id,
            icon: "APP",
            edition: "economy",
            category: "essential",
            hiddenStandalone: false
        }, app);
    }

    function registerApps() {
        if (!window.APPS) return;

        registerApp("files", Object.assign(window.APPS.files || {}, {
            name: "Files",
            icon: "FILES",
            edition: "economy",
            category: "essential",
            hiddenStandalone: false,
            launch: () => window.openFilesHub52()
        }));

        registerApp("chat", Object.assign(window.APPS.chat || {}, {
            name: "Emerald Chat",
            icon: "CHAT",
            edition: "economy",
            category: "essential",
            hiddenStandalone: false,
            launch: () => window.openEmeraldChat52()
        }));

        registerApp("communicationCenter52", {
            name: "Communication Center",
            icon: "COMMS",
            edition: "economy",
            category: "essential",
            hiddenStandalone: false,
            launch: () => window.openCommunicationCenter52()
        });

        registerApp("emeraldOSUsers52", {
            name: "EmeraldOS Users",
            icon: "USERS",
            edition: "economy",
            category: "essential",
            hiddenStandalone: false,
            launch: () => window.openEmeraldUsers52()
        });

        registerApp("chatModeration52", {
            name: "Chat Moderation",
            icon: "MOD",
            edition: "developer",
            category: "developer",
            hiddenStandalone: false,
            launch: () => window.openChatModeration52()
        });

        registerApp("moderationLog52", {
            name: "Moderation Log",
            icon: "LOG",
            edition: "developer",
            category: "developer",
            hiddenStandalone: false,
            launch: () => window.openModerationLog52()
        });

        registerApp("communicationAudit52", {
            name: "Communication Audit",
            icon: "AUDIT",
            edition: "executive",
            category: "executive",
            hiddenStandalone: false,
            launch: () => window.openCommunicationAudit52()
        });

        [
            "storageCenter51",
            "fileLimits51",
            "fileSharing51",
            "sharedWithMe51",
            "userDirectory51"
        ].forEach(id => {
            if (window.APPS[id]) window.APPS[id].hiddenStandalone = true;
        });
    }

    /* =====================================================
       CONSOLIDATED FILES
    ===================================================== */

    window.openFilesHub52 = async function () {
        simpleWindow("Files", `
            <h2>Files</h2>
            <div class="inset-panel">
                Cloud storage, uploads, file sharing, shared files, storage warnings, and the EmeraldOS user directory are consolidated here.
            </div>
            <div class="toolbar-row">
                ${button("Drive", "filesHubTab52('drive')")}
                ${button("Storage", "filesHubTab52('storage')")}
                ${button("Share Files", "filesHubTab52('sharing')")}
                ${button("Shared With Me", "filesHubTab52('shared')")}
                ${button("Users", "filesHubTab52('users')")}
                ${button("Refresh", "filesHubTab52(window.__filesHub52Tab || 'drive')")}
            </div>
            <div id="filesHub52Body" class="inset-panel">Loading Files...</div>
        `, "files");
        await window.filesHubTab52("drive");
    };

    window.filesHubTab52 = async function (tab = "drive") {
        window.__filesHub52Tab = tab;
        const bodyId = "filesHub52Body";
        renderInto(bodyId, "Loading...");
        if (tab === "drive") return renderFilesDrive52(bodyId);
        if (tab === "storage") return renderFilesStorage52(bodyId);
        if (tab === "sharing") return renderFilesSharing52(bodyId);
        if (tab === "shared") return renderFilesShared52(bodyId);
        if (tab === "users") return renderFilesUsers52(bodyId);
    };

    async function renderFilesDrive52(bodyId) {
        const files = await refreshDrive();
        const rows = Object.entries(files)
            .sort((a, b) => String(a[1].name || "").localeCompare(String(b[1].name || "")));

        renderInto(bodyId, `
            <div class="toolbar-row">
                ${button("New File", "createFile52()")}
                ${button("Upload", "uploadFile52()")}
                ${button("Open Classic Explorer", "openClassicFileExplorer52()")}
            </div>
            <table class="win95-table files52-table">
                <thead><tr><th>Type</th><th>Name</th><th>Folder</th><th>Size</th><th>File ID</th><th>Actions</th></tr></thead>
                <tbody>
                    ${rows.map(([id, file]) => `
                        <tr>
                            <td>${safe(fileIcon(file))}</td>
                            <td>${safe(file.name || "Untitled")}</td>
                            <td>${safe(getFileFolder(file))}</td>
                            <td>${safe(formatBytes(fileSize(file)))}</td>
                            <td><code>${safe(id)}</code></td>
                            <td class="files52-actions">
                                ${button("Open", `openFile52('${safe(id)}')`)}
                                ${button("Share", `shareFile52('${safe(id)}')`)}
                                ${button("Download", `downloadFile52('${safe(id)}')`)}
                                ${button("Info", `fileInfo52('${safe(id)}')`)}
                                ${button("Delete", `deleteFile52('${safe(id)}')`)}
                            </td>
                        </tr>
                    `).join("") || `<tr><td colspan="6">No files saved yet.</td></tr>`}
                </tbody>
            </table>
        `);
    }

    async function renderFilesStorage52(bodyId) {
        const files = await refreshDrive();
        const rows = Object.entries(files);
        const total = rows.reduce((sum, [, file]) => sum + fileSize(file), 0);
        const large = rows.filter(([, file]) => fileSize(file) > BUILD.fileLimit);
        const storageBacked = rows.filter(([, file]) => file.hasStorageBlob);
        const percent = Math.min(100, Math.round(total / (10 * BUILD.fileLimit) * 100));

        renderInto(bodyId, `
            <h3>Storage</h3>
            <div class="storage-meter"><div style="width:${percent}%"></div></div>
            <div><b>Total files:</b> ${rows.length}</div>
            <div><b>Estimated storage used:</b> ${safe(formatBytes(total))}</div>
            <div><b>Files above 1 MB:</b> ${large.length}</div>
            <div><b>Firebase Storage-backed files:</b> ${storageBacked.length}</div>
            <hr>
            <h4>Warnings</h4>
            ${large.length ? `<div class="warning-box">${large.length} file(s) are above the 1 MB inline Firestore limit and are handled through Firebase Storage metadata.</div>` : `<div class="ok-box">No files are above the 1 MB warning level.</div>`}
            <h4>Largest files</h4>
            <table class="win95-table">
                <tr><th>Name</th><th>Size</th><th>Mode</th></tr>
                ${rows.sort((a, b) => fileSize(b[1]) - fileSize(a[1])).slice(0, 12).map(([id, file]) => `
                    <tr><td>${safe(file.name || id)}</td><td>${safe(formatBytes(fileSize(file)))}</td><td>${safe(file.hasStorageBlob ? "Firebase Storage" : "Firestore")}</td></tr>
                `).join("") || `<tr><td colspan="3">No files.</td></tr>`}
            </table>
        `);
    }

    async function renderFilesSharing52(bodyId) {
        const files = await refreshDrive();
        const shares = await loadSharesCreatedByMe52();
        const fileRows = Object.entries(files).filter(([, file]) => file.type !== "folder");

        renderInto(bodyId, `
            <h3>Share Files</h3>
            <div class="inset-panel">Share directly from Files. Users do not need to manually search for hidden file IDs.</div>
            <table class="win95-table">
                <tr><th>Name</th><th>File ID</th><th>Size</th><th>Actions</th></tr>
                ${fileRows.map(([id, file]) => `
                    <tr>
                        <td>${safe(file.name || id)}</td>
                        <td><code>${safe(id)}</code></td>
                        <td>${safe(formatBytes(fileSize(file)))}</td>
                        <td>${button("Share", `shareFile52('${safe(id)}')`)} ${button("Copy ID", `copyText52('${safe(id)}')`)}</td>
                    </tr>
                `).join("") || `<tr><td colspan="4">No shareable files.</td></tr>`}
            </table>
            <h3>Shared By Me</h3>
            <table class="win95-table">
                <tr><th>File</th><th>To</th><th>Permission</th><th>Status</th><th>Actions</th></tr>
                ${shares.map(share => `
                    <tr>
                        <td>${safe(share.fileName || share.fileId)}</td>
                        <td>${safe(share.targetUser)}</td>
                        <td>${safe(share.permission || "view")}</td>
                        <td>${safe(share.status || "active")}</td>
                        <td>${button("Revoke", `revokeShare52('${safe(share.id)}')`)}</td>
                    </tr>
                `).join("") || `<tr><td colspan="5">No shares created yet.</td></tr>`}
            </table>
        `);
    }

    async function renderFilesShared52(bodyId) {
        const shares = await loadSharesForMe52();
        renderInto(bodyId, `
            <h3>Shared With Me</h3>
            <table class="win95-table">
                <tr><th>File</th><th>Owner</th><th>Permission</th><th>Actions</th></tr>
                ${shares.map(share => `
                    <tr>
                        <td>${safe(share.fileName || share.fileId)}</td>
                        <td>${safe(share.owner)}</td>
                        <td>${safe(share.permission || "view")}</td>
                        <td>${button("Open", `openSharedFile52('${safe(share.id)}')`)}</td>
                    </tr>
                `).join("") || `<tr><td colspan="4">No files have been shared with you yet.</td></tr>`}
            </table>
        `);
    }

    async function renderFilesUsers52(bodyId) {
        const users = await listUsers();
        renderInto(bodyId, `
            <h3>EmeraldOS Users</h3>
            <input id="filesUserSearch52" placeholder="Search users" oninput="filterUsers52('filesUserSearch52','filesUsersTable52')" style="width:100%;box-sizing:border-box;margin-bottom:8px;">
            <table class="win95-table" id="filesUsersTable52">
                <tr><th>Username</th><th>Created</th><th>Last Login</th><th>Actions</th></tr>
                ${users.map(user => `
                    <tr data-user-row="${safe(user.username).toLowerCase()}">
                        <td>${safe(user.username)}</td>
                        <td>${user.createdAt ? new Date(user.createdAt).toLocaleString() : "Unknown"}</td>
                        <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}</td>
                        <td>
                            ${button("Chat", `openChatWithUser52('${safe(user.username)}')`)}
                            ${button("Share File", `chooseFileToShareWith52('${safe(user.username)}')`)}
                        </td>
                    </tr>
                `).join("") || `<tr><td colspan="4">No EmeraldOS users found.</td></tr>`}
            </table>
        `);
    }

    window.openClassicFileExplorer52 = function () {
        if (typeof originalOpenFileExplorer52 === "function") return originalOpenFileExplorer52();
        notify("Files", "Classic explorer is unavailable in this build.", "warning");
    };

    window.createFile52 = async function () {
        const name = prompt("File name:", "New Document.txt");
        if (!name) return;
        const id = await cloudCreateFile(name, "");
        if (id) {
            await cloudSaveFile(id, { folder: "Desktop", parent: "Desktop", showOnDesktop: true, type: "text/plain", updatedAt: Date.now() });
            notify("Files", "File created.", "success");
            await window.filesHubTab52("drive");
            window.renderDesktop?.();
        }
    };

    window.uploadFile52 = function () {
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = true;
        input.onchange = async event => {
            const picked = Array.from(event.target.files || []);
            const large = picked.filter(file => file.size > BUILD.fileLimit);
            if (large.length) {
                const ok = confirm(
                    "Storage warning:\n\n" +
                    "The following file(s) are larger than 1 MB and will use Firebase Storage-backed metadata:\n\n" +
                    large.map(file => `${file.name} (${formatBytes(file.size)})`).join("\n") +
                    "\n\nContinue upload?"
                );
                if (!ok) return;
            }
            for (const file of picked) {
                const content = await new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.readAsDataURL(file);
                });
                const id = await cloudCreateFile(file.name, content);
                if (id) {
                    await cloudSaveFile(id, {
                        folder: "Desktop",
                        parent: "Desktop",
                        showOnDesktop: true,
                        size: file.size,
                        mimeType: file.type || "application/octet-stream",
                        fileLimitBytes: BUILD.fileLimit,
                        overFreeLimit: file.size > BUILD.fileLimit,
                        updatedAt: Date.now()
                    });
                }
            }
            notify("Files", `${picked.length} upload(s) complete.`, large.length ? "warning" : "success");
            await window.filesHubTab52("drive");
            window.renderDesktop?.();
        };
        input.click();
    };

    window.openFile52 = function (id) {
        if (typeof originalOpenFile52 === "function") return originalOpenFile52(id);
    };

    window.downloadFile52 = function (id) {
        if (typeof originalDownloadFile52 === "function") return originalDownloadFile52(id);
    };

    window.deleteFile52 = async function (id) {
        const files = window.fileSystem?.files || {};
        const file = files[id];
        if (!file) return;
        if (!confirm(`Move ${file.name || id} to Trash?`)) return;
        await cloudSaveFile(id, { folder: "Trash", parent: "Trash", showOnDesktop: false, deletedAt: Date.now(), updatedAt: Date.now() });
        notify("Files", "Moved to Trash.", "info");
        await window.filesHubTab52("drive");
        window.renderDesktop?.();
    };

    window.fileInfo52 = function (id) {
        const file = window.fileSystem?.files?.[id];
        if (!file) return;
        simpleWindow("File Info", `
            <h3>${safe(file.name || id)}</h3>
            <div class="inset-panel">
                <b>File ID:</b> <code>${safe(id)}</code><br>
                <b>Folder:</b> ${safe(getFileFolder(file))}<br>
                <b>Size:</b> ${safe(formatBytes(fileSize(file)))}<br>
                <b>Type:</b> ${safe(file.type || file.mimeType || "unknown")}<br>
                <b>Storage mode:</b> ${safe(file.hasStorageBlob ? "Firebase Storage" : "Firestore inline")}<br>
                <b>Updated:</b> ${file.updatedAt ? new Date(file.updatedAt).toLocaleString() : "Unknown"}
            </div>
            ${button("Copy File ID", `copyText52('${safe(id)}')`)}
        `, "fileInfo52");
    };

    async function loadAllShares52() {
        const snap = await getDocs(collection(db, SHARES_COLLECTION));
        const shares = [];
        snap.forEach(d => shares.push({ id: d.id, ...(d.data() || {}) }));
        return shares;
    }

    async function loadSharesCreatedByMe52() {
        const user = currentUser();
        return (await loadAllShares52())
            .filter(s => s.owner === user && s.status !== "revoked")
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    async function loadSharesForMe52() {
        const user = currentUser();
        return (await loadAllShares52())
            .filter(s => String(s.targetUser || "").toLowerCase() === user.toLowerCase() && s.status !== "revoked")
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    window.shareFile52 = async function (fileId, targetUser = "") {
        const files = window.fileSystem?.files || await refreshDrive();
        const file = files[fileId];
        if (!file) {
            alert("File not found.");
            return;
        }
        let user = targetUser || prompt("Share with EmeraldOS username:");
        user = normalizeName(user);
        if (!user) return;
        const permission = (prompt("Permission: view or edit", "view") || "view").toLowerCase() === "edit" ? "edit" : "view";
        await addDoc(collection(db, SHARES_COLLECTION), {
            owner: currentUser(),
            targetUser: user,
            fileId,
            fileName: file.name || fileId,
            permission,
            status: "active",
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
        notify("Files", `Shared ${file.name || fileId} with ${user}.`, "success");
        if (window.__filesHub52Tab === "sharing") await window.filesHubTab52("sharing");
    };

    window.revokeShare52 = async function (shareId) {
        if (!confirm("Revoke this share?")) return;
        await updateDoc(doc(db, SHARES_COLLECTION, shareId), {
            status: "revoked",
            revokedAt: Date.now(),
            revokedBy: currentUser()
        });
        notify("Files", "Share revoked.", "info");
        await window.filesHubTab52("sharing");
    };

    window.openSharedFile52 = async function (shareId) {
        const snap = await getDoc(doc(db, SHARES_COLLECTION, shareId));
        if (!snap.exists()) return alert("Shared file record not found.");
        const share = { id: snap.id, ...snap.data() };
        if (String(share.targetUser || "").toLowerCase() !== currentUser().toLowerCase() && !isModerator()) {
            return alert("This file is not shared with this account.");
        }
        const fileSnap = await getDoc(doc(db, "emeraldOSUsers", share.owner, "drive", share.fileId));
        if (!fileSnap.exists()) return alert("The original file no longer exists.");
        const file = fileSnap.data() || {};
        let content = file.content || "";
        if (file.hasStorageBlob && file.storagePath && storage) {
            try {
                const ref = storageRef(storage, file.storagePath);
                const bytes = await getBytes(ref);
                content = new TextDecoder().decode(bytes);
            } catch (err) {
                try {
                    const url = await getDownloadURL(storageRef(storage, file.storagePath));
                    const response = await fetch(url, { mode: "cors" });
                    content = await response.text();
                } catch (inner) {
                    console.warn("Could not load shared storage-backed file:", inner);
                    content = file.content || "";
                }
            }
        }
        simpleWindow("Shared File", `
            <h3>${safe(file.name || share.fileName || share.fileId)}</h3>
            <div class="inset-panel">
                <b>Owner:</b> ${safe(share.owner)}<br>
                <b>Permission:</b> ${safe(share.permission || "view")}<br>
                <b>File ID:</b> <code>${safe(share.fileId)}</code>
            </div>
            <textarea class="shared-file-text" ${share.permission === "edit" ? "" : "readonly"}>${safe(content)}</textarea>
            ${share.permission === "edit" ? button("Save Copy To My Files", `saveSharedCopy52('${safe(shareId)}')`) : button("Save Copy To My Files", `saveSharedCopy52('${safe(shareId)}')`)}
        `, "sharedFile52");
    };

    window.saveSharedCopy52 = async function (shareId) {
        const snap = await getDoc(doc(db, SHARES_COLLECTION, shareId));
        if (!snap.exists()) return;
        const share = snap.data() || {};
        const text = document.querySelector('.window[data-app="sharedFile52"] .shared-file-text')?.value || "";
        const name = "Shared Copy - " + (share.fileName || share.fileId || "File.txt");
        const id = await cloudCreateFile(name, text);
        if (id) {
            await cloudSaveFile(id, { folder: "Desktop", parent: "Desktop", showOnDesktop: true, sourceShareId: shareId, updatedAt: Date.now() });
            notify("Files", "Copy saved to your Files.", "success");
            window.renderDesktop?.();
        }
    };

    window.chooseFileToShareWith52 = async function (username) {
        const files = await refreshDrive();
        const rows = Object.entries(files).filter(([, file]) => file.type !== "folder");
        if (!rows.length) return alert("You have no files to share.");
        const menu = rows.map(([id, file], index) => `${index + 1}. ${file.name || id}  [${id}]`).join("\n");
        const choice = prompt("Choose a file by number, name, or file ID:\n\n" + menu);
        if (!choice) return;
        const trimmed = choice.trim();
        let match = rows[Number(trimmed) - 1];
        if (!match) match = rows.find(([id, file]) => id === trimmed || String(file.name || "").toLowerCase() === trimmed.toLowerCase());
        if (!match) return alert("File not found.");
        await window.shareFile52(match[0], username);
    };

    window.copyText52 = async function (text) {
        try {
            await navigator.clipboard.writeText(text);
            notify("Copied", "Copied to clipboard.", "success");
        } catch {
            prompt("Copy this text:", text);
        }
    };

    window.filterUsers52 = function (inputId, tableId) {
        const q = String(document.getElementById(inputId)?.value || "").toLowerCase();
        document.querySelectorAll(`#${tableId} [data-user-row]`).forEach(row => {
            row.style.display = row.dataset.userRow.includes(q) ? "" : "none";
        });
    };

    /* =====================================================
       EMERALD CHAT
    ===================================================== */

    window.openCommunicationCenter52 = function () {
        simpleWindow("Communication Center", `
            <h2>Communication Center</h2>
            <div class="suite-grid">
                ${button("Open Emerald Chat", "openEmeraldChat52()")}
                ${button("EmeraldOS Users", "openEmeraldUsers52()")}
                ${button("Files: Shared With Me", "openFilesHub52();setTimeout(()=>filesHubTab52('shared'),150)")}
                ${isModerator() ? button("Chat Moderation", "openChatModeration52()") : ""}
            </div>
            <div class="inset-panel" style="margin-top:10px;">
                Emerald Chat is integrated into EmeraldOS 5.2 and no longer uses the Emerald Games chat iframe.
            </div>
        `, "communicationCenter52");
    };

    window.openEmeraldChat52 = async function () {
        simpleWindow("Emerald Chat", `
            <div class="chat52-shell">
                <div class="chat52-sidebar">
                    <h3>Emerald Chat</h3>
                    ${button("Global Lobby", "switchChatRoom52('global','Global Lobby')")}
                    ${isModerator() ? button("Moderation", "openChatModeration52()") : ""}
                    <hr>
                    <input id="chatUserSearch52" placeholder="Search users" oninput="filterChatUsers52()">
                    <div id="chatUsers52">Loading users...</div>
                </div>
                <div class="chat52-main">
                    <h3 id="chatTitle52">${safe(currentChatLabel52)}</h3>
                    <div id="chatMessages52" class="chat52-messages">Loading messages...</div>
                    <div class="chat52-compose">
                        <textarea id="chatInput52" placeholder="Type a message"></textarea>
                        <button onclick="sendChatMessage52()">Send</button>
                    </div>
                </div>
            </div>
        `, "chat");
        await renderChatUsers52();
        await window.switchChatRoom52(currentChatRoom52, currentChatLabel52);
    };

    async function renderChatUsers52() {
        const users = await listUsers();
        const me = currentUser().toLowerCase();
        renderInto("chatUsers52", users.map(user => `
            <div class="chat52-user" data-chat-user="${safe(user.username).toLowerCase()}">
                <button onclick="openChatWithUser52('${safe(user.username)}')">${safe(user.username)}</button>
            </div>
        `).join("") || "<div>No users found.</div>");
    }

    window.filterChatUsers52 = function () {
        const q = String(document.getElementById("chatUserSearch52")?.value || "").toLowerCase();
        document.querySelectorAll("[data-chat-user]").forEach(row => {
            row.style.display = row.dataset.chatUser.includes(q) ? "" : "none";
        });
    };

    window.openChatWithUser52 = async function (username) {
        const me = currentUser();
        const other = normalizeName(username);
        if (!other) return;
        const roomId = dmRoomFor(me, other);
        const label = "Direct: " + other;
        await ensureRoom(roomId, label, "direct", [me, other]);
        if (!document.getElementById("chatMessages52")) {
            await window.openEmeraldChat52();
        }
        await window.switchChatRoom52(roomId, label);
    };

    window.switchChatRoom52 = async function (roomId = "global", label = "Global Lobby") {
        currentChatRoom52 = roomId;
        currentChatLabel52 = label;
        await ensureRoom(roomId, label, roomId === "global" ? "public" : "direct", roomId === "global" ? [] : undefined);
        const title = document.getElementById("chatTitle52");
        if (title) title.textContent = label;
        if (chatUnsubscribe52) chatUnsubscribe52();
        const q = query(roomMessages(roomId), orderBy("createdAt", "asc"), limit(100));
        chatUnsubscribe52 = onSnapshot(q, snap => {
            const rows = [];
            snap.forEach(d => rows.push({ id: d.id, ...(d.data() || {}) }));
            renderChatMessages52(rows);
        }, err => {
            console.warn("Chat listener failed:", err);
            renderInto("chatMessages52", `<div class="warning-box">Could not load chat messages. Check Firestore rules for ${safe(CHAT_ROOMS)}.</div>`);
        });
    };

    function renderChatMessages52(rows) {
        const me = currentUser();
        renderInto("chatMessages52", rows.map(msg => {
            const deleted = msg.deleted === true;
            const mine = String(msg.sender || "") === me;
            return `
                <div class="chat52-message ${mine ? "mine" : ""} ${deleted ? "deleted" : ""}">
                    <div class="chat52-meta">
                        <b>${safe(msg.sender || "Unknown")}</b>
                        <span>${msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ""}</span>
                    </div>
                    <div class="chat52-text">${deleted ? "Message removed by moderation." : safe(msg.text || "")}</div>
                    <div class="chat52-actions">
                        ${!deleted ? button("Report", `reportChatMessage52('${safe(currentChatRoom52)}','${safe(msg.id)}')`) : ""}
                        ${isModerator() && !deleted ? button("Delete", `deleteChatMessage52('${safe(currentChatRoom52)}','${safe(msg.id)}')`) : ""}
                        ${isModerator() && deleted ? button("Restore", `restoreChatMessage52('${safe(currentChatRoom52)}','${safe(msg.id)}')`) : ""}
                        ${isModerator() ? button("Mute User", `muteChatUser52('${safe(msg.sender || "")}')`) : ""}
                    </div>
                </div>
            `;
        }).join("") || `<div class="inset-panel">No messages yet.</div>`);
        const box = document.getElementById("chatMessages52");
        if (box) box.scrollTop = box.scrollHeight;
    }

    async function isMuted(username) {
        if (!username) return false;
        const snap = await getDoc(doc(db, CHAT_MUTES, username));
        if (!snap.exists()) return false;
        const data = snap.data() || {};
        if (!data.muted) return false;
        if (data.until && Date.now() > data.until) {
            await setDoc(doc(db, CHAT_MUTES, username), { muted: false, expiredAt: Date.now() }, { merge: true });
            return false;
        }
        return data;
    }

    window.sendChatMessage52 = async function () {
        const input = document.getElementById("chatInput52");
        const text = String(input?.value || "").trim();
        if (!text) return;
        const sender = currentUser();
        if (!sender) return alert("You are not logged in.");
        const muted = await isMuted(sender);
        if (muted) {
            alert("Your Emerald Chat access is muted. Reason: " + (muted.reason || "Not specified"));
            return;
        }
        await addDoc(roomMessages(currentChatRoom52), {
            roomId: currentChatRoom52,
            roomLabel: currentChatLabel52,
            sender,
            text,
            deleted: false,
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
        await setDoc(roomDoc(currentChatRoom52), { updatedAt: Date.now(), lastMessageBy: sender }, { merge: true });
        input.value = "";
    };

    window.reportChatMessage52 = async function (roomId, messageId) {
        const reason = prompt("Reason for report:", "Inappropriate message");
        if (!reason) return;
        await addDoc(collection(db, CHAT_REPORTS), {
            roomId,
            messageId,
            reportedBy: currentUser(),
            reason,
            status: "open",
            createdAt: Date.now()
        });
        notify("Chat", "Report submitted.", "success");
    };

    async function logModeration(action, details = {}) {
        try {
            await addDoc(collection(db, MOD_LOGS), {
                action,
                details,
                moderator: currentUser(),
                createdAt: Date.now()
            });
        } catch (err) {
            console.warn("Moderation log failed:", err);
        }
    }

    window.deleteChatMessage52 = async function (roomId, messageId) {
        if (!isModerator()) return alert("Moderator access required.");
        await updateDoc(doc(db, CHAT_ROOMS, roomId, "messages", messageId), {
            deleted: true,
            deletedBy: currentUser(),
            deletedAt: Date.now(),
            updatedAt: Date.now()
        });
        await logModeration("delete_message", { roomId, messageId });
        notify("Moderation", "Message deleted.", "info");
    };

    window.restoreChatMessage52 = async function (roomId, messageId) {
        if (!isModerator()) return alert("Moderator access required.");
        await updateDoc(doc(db, CHAT_ROOMS, roomId, "messages", messageId), {
            deleted: false,
            restoredBy: currentUser(),
            restoredAt: Date.now(),
            updatedAt: Date.now()
        });
        await logModeration("restore_message", { roomId, messageId });
        notify("Moderation", "Message restored.", "success");
    };

    window.muteChatUser52 = async function (username = "") {
        if (!isModerator()) return alert("Moderator access required.");
        const target = normalizeName(username || prompt("Username to mute:"));
        if (!target) return;
        const minutes = Number(prompt("Mute length in minutes. Leave blank for no expiration:", "60") || "0");
        const reason = prompt("Reason:", "Chat moderation action") || "Chat moderation action";
        await setDoc(doc(db, CHAT_MUTES, target), {
            username: target,
            muted: true,
            reason,
            mutedBy: currentUser(),
            mutedAt: Date.now(),
            until: minutes > 0 ? Date.now() + minutes * 60000 : null
        }, { merge: true });
        await logModeration("mute_user", { target, minutes, reason });
        notify("Moderation", `${target} muted.`, "warning");
    };

    window.unmuteChatUser52 = async function (username = "") {
        if (!isModerator()) return alert("Moderator access required.");
        const target = normalizeName(username || prompt("Username to unmute:"));
        if (!target) return;
        await setDoc(doc(db, CHAT_MUTES, target), {
            muted: false,
            unmutedBy: currentUser(),
            unmutedAt: Date.now()
        }, { merge: true });
        await logModeration("unmute_user", { target });
        notify("Moderation", `${target} unmuted.`, "success");
    };

    window.warnChatUser52 = async function (username = "") {
        if (!isModerator()) return alert("Moderator access required.");
        const target = normalizeName(username || prompt("Username to warn:"));
        if (!target) return;
        const reason = prompt("Warning text:", "Please follow EmeraldOS chat rules.");
        if (!reason) return;
        await addDoc(collection(db, MOD_LOGS), {
            action: "warn_user",
            target,
            warning: reason,
            moderator: currentUser(),
            createdAt: Date.now()
        });
        notify("Moderation", `Warning logged for ${target}.`, "info");
    };

    window.openChatModeration52 = function () {
        if (!isModerator()) return alert("Developer mod/admin verification required.");
        simpleWindow("Chat Moderation", `
            <h2>Chat Moderation</h2>
            <div class="toolbar-row">
                ${button("Reports", "refreshChatModeration52('reports')")}
                ${button("Recent Messages", "refreshChatModeration52('recent')")}
                ${button("Muted Users", "refreshChatModeration52('mutes')")}
                ${button("Warn User", "warnChatUser52()")}
                ${button("Mute User", "muteChatUser52()")}
                ${button("Unmute User", "unmuteChatUser52()")}
            </div>
            <div id="chatModeration52Body" class="inset-panel">Loading moderation tools...</div>
        `, "chatModeration52");
        window.refreshChatModeration52("reports");
    };

    window.refreshChatModeration52 = async function (tab = "reports") {
        renderInto("chatModeration52Body", "Loading...");
        if (tab === "reports") return renderChatReports52();
        if (tab === "recent") return renderRecentChatMessages52();
        if (tab === "mutes") return renderMutedUsers52();
    };

    async function renderChatReports52() {
        const snap = await getDocs(query(collection(db, CHAT_REPORTS), orderBy("createdAt", "desc"), limit(60)));
        const rows = [];
        snap.forEach(d => rows.push({ id: d.id, ...(d.data() || {}) }));
        renderInto("chatModeration52Body", `
            <h3>Reports</h3>
            <table class="win95-table">
                <tr><th>Time</th><th>Reporter</th><th>Reason</th><th>Room</th><th>Status</th><th>Actions</th></tr>
                ${rows.map(r => `
                    <tr>
                        <td>${r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}</td>
                        <td>${safe(r.reportedBy)}</td>
                        <td>${safe(r.reason)}</td>
                        <td>${safe(r.roomId)}</td>
                        <td>${safe(r.status || "open")}</td>
                        <td>
                            ${button("Delete Msg", `deleteChatMessage52('${safe(r.roomId)}','${safe(r.messageId)}')`)}
                            ${button("Reviewed", `markReportReviewed52('${safe(r.id)}')`)}
                        </td>
                    </tr>
                `).join("") || `<tr><td colspan="6">No reports.</td></tr>`}
            </table>
        `);
    }

    window.markReportReviewed52 = async function (reportId) {
        await updateDoc(doc(db, CHAT_REPORTS, reportId), {
            status: "reviewed",
            reviewedBy: currentUser(),
            reviewedAt: Date.now()
        });
        await logModeration("review_report", { reportId });
        await window.refreshChatModeration52("reports");
    };

    async function renderRecentChatMessages52() {
        let rows = [];
        try {
            const snap = await getDocs(query(collectionGroup(db, "messages"), orderBy("createdAt", "desc"), limit(80)));
            snap.forEach(d => rows.push({ id: d.id, ...(d.data() || {}) }));
        } catch (err) {
            renderInto("chatModeration52Body", `<div class="warning-box">Recent message audit could not load. Firestore rules may need collection group read access for messages.</div>`);
            return;
        }
        renderInto("chatModeration52Body", `
            <h3>Recent Messages</h3>
            <table class="win95-table">
                <tr><th>Time</th><th>User</th><th>Room</th><th>Message</th><th>Status</th><th>Actions</th></tr>
                ${rows.map(m => `
                    <tr>
                        <td>${m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}</td>
                        <td>${safe(m.sender)}</td>
                        <td>${safe(m.roomId)}</td>
                        <td>${safe(String(m.text || "").slice(0, 160))}</td>
                        <td>${m.deleted ? "Deleted" : "Visible"}</td>
                        <td>
                            ${m.deleted ? button("Restore", `restoreChatMessage52('${safe(m.roomId)}','${safe(m.id)}')`) : button("Delete", `deleteChatMessage52('${safe(m.roomId)}','${safe(m.id)}')`)}
                            ${button("Mute", `muteChatUser52('${safe(m.sender)}')`)}
                            ${button("Warn", `warnChatUser52('${safe(m.sender)}')`)}
                        </td>
                    </tr>
                `).join("") || `<tr><td colspan="6">No messages found.</td></tr>`}
            </table>
        `);
    }

    async function renderMutedUsers52() {
        const snap = await getDocs(collection(db, CHAT_MUTES));
        const rows = [];
        snap.forEach(d => {
            const data = d.data() || {};
            if (data.muted) rows.push({ id: d.id, ...data });
        });
        renderInto("chatModeration52Body", `
            <h3>Muted Users</h3>
            <table class="win95-table">
                <tr><th>User</th><th>Reason</th><th>Muted By</th><th>Until</th><th>Actions</th></tr>
                ${rows.map(m => `
                    <tr>
                        <td>${safe(m.username || m.id)}</td>
                        <td>${safe(m.reason)}</td>
                        <td>${safe(m.mutedBy)}</td>
                        <td>${m.until ? new Date(m.until).toLocaleString() : "No expiration"}</td>
                        <td>${button("Unmute", `unmuteChatUser52('${safe(m.username || m.id)}')`)}</td>
                    </tr>
                `).join("") || `<tr><td colspan="5">No muted users.</td></tr>`}
            </table>
        `);
    }

    window.openModerationLog52 = async function () {
        if (!isModerator()) return alert("Developer mod/admin verification required.");
        simpleWindow("Moderation Log", `<h2>Moderation Log</h2><div id="modLog52Body" class="inset-panel">Loading...</div>`, "moderationLog52");
        const snap = await getDocs(query(collection(db, MOD_LOGS), orderBy("createdAt", "desc"), limit(100)));
        const rows = [];
        snap.forEach(d => rows.push({ id: d.id, ...(d.data() || {}) }));
        renderInto("modLog52Body", `
            <table class="win95-table"><tr><th>Time</th><th>Action</th><th>Moderator</th><th>Details</th></tr>
            ${rows.map(r => `<tr><td>${r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}</td><td>${safe(r.action)}</td><td>${safe(r.moderator)}</td><td><pre>${safe(JSON.stringify(r.details || { target: r.target, warning: r.warning }, null, 2))}</pre></td></tr>`).join("") || `<tr><td colspan="4">No moderation logs.</td></tr>`}</table>
        `);
    };

    window.openCommunicationAudit52 = async function () {
        if (!isExecutive()) return alert("Executive admin verification required.");
        simpleWindow("Communication Audit", `
            <h2>Communication Audit</h2>
            <div class="inset-panel">Executive view for Emerald Chat rooms, reports, mutes, and file sharing records.</div>
            <div class="toolbar-row">
                ${button("Open Moderation", "openChatModeration52()")}
                ${button("Moderation Log", "openModerationLog52()")}
                ${button("Files Users", "openEmeraldUsers52()")}
                ${button("Files", "openFilesHub52()")}
            </div>
        `, "communicationAudit52");
    };

    window.openEmeraldUsers52 = async function () {
        simpleWindow("EmeraldOS Users", `
            <h2>EmeraldOS Users</h2>
            <input id="users52Search" placeholder="Search users" oninput="filterUsers52('users52Search','users52Table')" style="width:100%;box-sizing:border-box;margin-bottom:8px;">
            <div id="users52Body" class="inset-panel">Loading users...</div>
        `, "emeraldOSUsers52");
        const users = await listUsers();
        renderInto("users52Body", `
            <table class="win95-table" id="users52Table">
                <tr><th>Username</th><th>Created</th><th>Last Login</th><th>Actions</th></tr>
                ${users.map(user => `
                    <tr data-user-row="${safe(user.username).toLowerCase()}">
                        <td>${safe(user.username)}</td>
                        <td>${user.createdAt ? new Date(user.createdAt).toLocaleString() : "Unknown"}</td>
                        <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}</td>
                        <td>
                            ${button("Chat", `openChatWithUser52('${safe(user.username)}')`)}
                            ${button("Share File", `chooseFileToShareWith52('${safe(user.username)}')`)}
                        </td>
                    </tr>
                `).join("") || `<tr><td colspan="4">No EmeraldOS users found.</td></tr>`}
            </table>
        `);
    };

    /* =====================================================
       TERMINAL COMMANDS
    ===================================================== */

    function terminalWrite(raw, result) {
        const output = document.getElementById("terminal_output");
        if (!output) return;
        output.innerHTML += `&gt; ${safe(raw)}<br>${result}<br><br>`;
        output.scrollTop = output.scrollHeight;
        const input = document.getElementById("terminal_input");
        if (input) input.value = "";
    }

    function installTerminalCommands() {
        if (typeof window.runCommand !== "function" || window.runCommand.__emerald52Wrapped) return;
        const original = window.runCommand;
        const wrapped = async function (cmdLine = "") {
            const raw = String(cmdLine || "").trim();
            const [command] = raw.split(/\s+/);
            let result = null;
            switch ((command || "").toLowerCase()) {
                case "chat":
                case "emeraldchat":
                    window.openEmeraldChat52(); result = "Opening Emerald Chat."; break;
                case "comms":
                case "communication":
                    window.openCommunicationCenter52(); result = "Opening Communication Center."; break;
                case "users":
                case "user.list":
                    window.openEmeraldUsers52(); result = "Opening EmeraldOS Users."; break;
                case "files":
                case "storage":
                case "sharing":
                    window.openFilesHub52(); result = "Opening consolidated Files."; break;
                case "shared":
                    window.openFilesHub52(); setTimeout(() => window.filesHubTab52("shared"), 150); result = "Opening Shared With Me in Files."; break;
                case "moderation":
                case "mod":
                    window.openChatModeration52(); result = "Opening Chat Moderation."; break;
                case "modlog":
                    window.openModerationLog52(); result = "Opening Moderation Log."; break;
                case "build":
                case "version":
                    result = `${BUILD.displayName} - ${BUILD.codename}`; break;
                default:
                    return original(cmdLine);
            }
            terminalWrite(raw, safe(result));
        };
        wrapped.__emerald52Wrapped = true;
        window.runCommand = wrapped;
    }

    /* =====================================================
       STYLES + INIT
    ===================================================== */

    function injectStyles() {
        if (document.getElementById("emerald52-styles")) return;
        const style = document.createElement("style");
        style.id = "emerald52-styles";
        style.textContent = `
            .emerald52-panel { padding:10px; height:100%; box-sizing:border-box; overflow:auto; background:#c0c0c0; color:#000; font-family:"MS Sans Serif",Tahoma,Arial,sans-serif; font-size:12px; }
            .emerald52-panel h2, .emerald52-panel h3 { margin:0 0 8px 0; }
            .toolbar-row { display:flex; flex-wrap:wrap; gap:6px; margin:8px 0; align-items:center; }
            .suite-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:8px; }
            .win95-small-button { background:#c0c0c0; border:2px solid; border-color:#fff #808080 #808080 #fff; padding:5px 7px; font-family:inherit; font-size:12px; cursor:pointer; color:#000; }
            .win95-small-button:active { border-color:#808080 #fff #fff #808080; }
            .inset-panel { background:#fff; border:2px inset #c0c0c0; padding:8px; box-sizing:border-box; }
            .win95-table { width:100%; border-collapse:collapse; background:#fff; }
            .win95-table th, .win95-table td { border:1px solid #808080; padding:4px; text-align:left; vertical-align:top; }
            .win95-table th { background:#000080; color:#fff; }
            .files52-table code { user-select:text; }
            .files52-actions { white-space:nowrap; }
            .storage-meter { height:16px; background:#fff; border:2px inset #c0c0c0; margin:6px 0; }
            .storage-meter > div { height:100%; background:#008000; }
            .warning-box { background:#fff8d0; border:1px solid #808000; padding:8px; margin:6px 0; }
            .ok-box { background:#e8ffe8; border:1px solid #008000; padding:8px; margin:6px 0; }
            .shared-file-text { width:100%; height:260px; resize:vertical; box-sizing:border-box; font-family:"Courier New",monospace; font-size:12px; background:#fff; color:#000; border:2px inset #c0c0c0; padding:6px; user-select:text; }
            .chat52-shell { display:grid; grid-template-columns:210px 1fr; gap:8px; height:100%; min-height:360px; }
            .chat52-sidebar { background:#d4d0c8; border:2px inset #c0c0c0; padding:8px; overflow:auto; }
            .chat52-sidebar input { width:100%; box-sizing:border-box; margin:6px 0; }
            .chat52-user button { width:100%; margin-bottom:4px; text-align:left; }
            .chat52-main { display:flex; flex-direction:column; min-height:0; }
            .chat52-messages { flex:1; background:#fff; border:2px inset #c0c0c0; padding:8px; overflow:auto; min-height:260px; }
            .chat52-compose { display:grid; grid-template-columns:1fr 80px; gap:6px; margin-top:6px; }
            .chat52-compose textarea { height:52px; resize:none; box-sizing:border-box; font-family:inherit; border:2px inset #c0c0c0; background:#fff; color:#000; }
            .chat52-message { border-bottom:1px solid #d0d0d0; padding:6px 0; }
            .chat52-message.mine { background:#f7f7ff; }
            .chat52-message.deleted { opacity:0.7; }
            .chat52-meta { display:flex; gap:8px; justify-content:space-between; font-size:11px; color:#404040; }
            .chat52-text { white-space:pre-wrap; margin:4px 0; user-select:text; }
            .chat52-actions { display:flex; flex-wrap:wrap; gap:4px; }
            @media (max-width:760px) { .chat52-shell { grid-template-columns:1fr; } .files52-actions { white-space:normal; } }
        `;
        document.head.appendChild(style);
    }

    function patchFiles() {
        window.openFileExplorer = window.openFilesHub52;
        window.uploadFileToDesktop52 = window.uploadFile52;
    }

    function refreshMenus() {
        try {
            window.renderDesktop?.();
            window.renderStartMenu?.();
            window.refreshEditionVisibility?.();
        } catch (err) {
            console.warn("5.2 menu refresh skipped:", err);
        }
    }

    function init() {
        injectStyles();
        registerApps();
        patchFiles();
        installTerminalCommands();
        document.title = BUILD.displayName;
        localStorage.setItem("40_build_name", BUILD.displayName);
        localStorage.setItem("40_version", BUILD.version);
        setTimeout(refreshMenus, 400);
        notify("EmeraldOS 5.2", "Integrated Chat, Files and Moderation Update loaded.", "info");
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    window.EMERALDOS_52 = BUILD;
})();
