"use strict";

/* =========================================================
   EMERALDOS 5.1
   OFFICE + STORAGE WARNINGS + REAL FILE SHARING
========================================================= */

import { db, storage } from "./firebase.js";
import {
    collection,
    getDocs,
    getDoc,
    doc,
    addDoc,
    setDoc,
    deleteDoc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    ref as storageRef,
    getBlob,
    getBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

import {
    createFile as cloudCreateFile,
    saveFile as cloudSaveFile,
    loadDrive
} from "./cloudstorage.js";

(function () {
    if (window.EmeraldOS51Loaded) return;
    window.EmeraldOS51Loaded = true;

    const BUILD = {
        product: "EmeraldOS",
        version: "5.1 Patch 1",
        displayName: "EmeraldOS 5.1 Patch 1",
        codename: "Sharing UX Hotfix",
        fileLimit: 1024 * 1024
    };

    const SHARES_COLLECTION = "emeraldOSShares";
    const OFFICE_DOCS_KEY = "40_office51_docs";
    const AUTOSAVE_KEY = "40_writer51_autosave";

    function currentUser() {
        return localStorage.getItem("40_username") ||
            localStorage.getItem("40_session") ||
            localStorage.getItem("username") ||
            "";
    }

    function esc(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function stripHTML(html) {
        const div = document.createElement("div");
        div.innerHTML = html || "";
        return div.textContent || div.innerText || "";
    }

    function formatBytes(bytes = 0) {
        const n = Number(bytes || 0);
        if (n < 1024) return n + " B";
        if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
        return (n / (1024 * 1024)).toFixed(2) + " MB";
    }

    function byteSize(value = "") {
        try { return new Blob([String(value)]).size; }
        catch { return String(value || "").length; }
    }

    function getJSON(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key) || ""); }
        catch { return fallback; }
    }

    function setJSON(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function win(title, html, app = "emerald51") {
        if (typeof window.openWindow === "function") {
            return window.openWindow(title, `<div class="emerald51-panel">${html}</div>`, app);
        }
        alert(title);
        return null;
    }

    function smallButton(label, action) {
        return `<button class="win95-small-button" onclick="${action}">${esc(label)}</button>`;
    }

    function renderInto(id, html) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    }

    function notify(title, message, type = "info") {
        window.notify?.(title, message, 3600, type);
    }

    async function refreshDriveCache() {
        try {
            if (window.fileSystem) {
                window.fileSystem.files = await loadDrive() || {};
            }
            window.renderDesktop?.();
        } catch (err) {
            console.warn("EmeraldOS 5.1 drive refresh failed:", err);
        }
    }

    function fileSizeFromMeta(file = {}) {
        if (typeof file.size === "number") return file.size;
        if (typeof file.storageSize === "number") return file.storageSize;
        if (file.content) return byteSize(file.content);
        return 0;
    }

    function calculateUsage(files = {}) {
        const rows = Object.entries(files);
        let total = 0;
        let storageBacked = 0;
        let overLimit = 0;
        rows.forEach(([id, file]) => {
            const size = fileSizeFromMeta(file);
            total += size;
            if (file.hasStorageBlob) storageBacked++;
            if (size > BUILD.fileLimit) overLimit++;
        });
        return {
            count: rows.length,
            total,
            storageBacked,
            overLimit,
            firestoreBacked: rows.length - storageBacked
        };
    }

    /* =====================================================
       APP REGISTRATION
    ===================================================== */

    function registerApp(id, app) {
        if (!window.APPS) return;
        window.APPS[id] = Object.assign({
            name: id,
            icon: "□",
            edition: "economy",
            category: "essential",
            hiddenStandalone: false
        }, app);
    }

    function registerApps() {
        registerApp("emeraldOffice51", {
            name: "Emerald Office 5.1",
            icon: "360",
            edition: "economy",
            category: "office",
            launch: () => window.openEmeraldOffice51()
        });

        registerApp("writer51", {
            name: "Emerald Writer 5.1",
            icon: "WRIT",
            edition: "economy",
            category: "office",
            launch: () => window.openEmeraldWriter51()
        });

        registerApp("sheets51", {
            name: "Emerald Sheets",
            icon: "CELL",
            edition: "home",
            category: "office",
            launch: () => window.openEmeraldSheets51()
        });

        registerApp("slides51", {
            name: "Emerald Slides",
            icon: "SLID",
            edition: "home",
            category: "office",
            launch: () => window.openEmeraldSlides51()
        });

        registerApp("forms51", {
            name: "Emerald Forms",
            icon: "FORM",
            edition: "business",
            category: "office",
            launch: () => window.openEmeraldForms51()
        });

        registerApp("storageCenter51", {
            name: "Storage Center",
            icon: "DISK",
            edition: "economy",
            category: "essential",
            launch: () => window.openStorageCenter51()
        });

        registerApp("fileSharing51", {
            name: "File Sharing",
            icon: "SHR",
            edition: "home",
            category: "business",
            launch: () => window.openFileSharing51()
        });

        registerApp("sharedWithMe51", {
            name: "Shared With Me",
            icon: "IN",
            edition: "home",
            category: "business",
            launch: () => window.openSharedWithMe51()
        });

        registerApp("userDirectory51", {
            name: "EmeraldOS Users",
            icon: "USER",
            edition: "home",
            category: "business",
            launch: () => window.openEmeraldUserDirectory51()
        });

        registerApp("fileLimits51", {
            name: "File Limits",
            icon: "1MB",
            edition: "economy",
            category: "essential",
            launch: () => window.openFileLimits51()
        });
    }

    /* =====================================================
       STORAGE WARNINGS + UPLOAD PATCH
    ===================================================== */

    function installUploadWarningPatch() {
        if (window.uploadFile?.__emerald51Wrapped) return;

        window.uploadFile = function (targetFolder = "Desktop") {
            const input = document.createElement("input");
            input.type = "file";
            input.multiple = true;
            input.onchange = async e => {
                const files = Array.from(e.target.files || []);
                const largeFiles = files.filter(file => file.size > BUILD.fileLimit);

                if (largeFiles.length) {
                    const message = largeFiles.map(file => `${file.name} (${formatBytes(file.size)})`).join("\n");
                    const ok = confirm(
                        "Storage warning:\n\n" +
                        "Files larger than 1 MB will be saved using Firebase Storage instead of inline Firestore content.\n\n" +
                        message +
                        "\n\nContinue upload?"
                    );
                    if (!ok) return;
                }

                for (const source of files) {
                    const content = await new Promise(resolve => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.readAsDataURL(source);
                    });

                    const id = await cloudCreateFile(source.name, content);
                    if (id) {
                        await cloudSaveFile(id, {
                            folder: targetFolder,
                            parent: targetFolder,
                            showOnDesktop: targetFolder === "Desktop",
                            size: source.size,
                            mimeType: source.type || "application/octet-stream",
                            fileLimitBytes: BUILD.fileLimit,
                            overFreeLimit: source.size > BUILD.fileLimit,
                            updatedAt: Date.now()
                        });
                    }
                }

                await refreshDriveCache();

                const largeText = largeFiles.length ? ` ${largeFiles.length} large file(s) used Firebase Storage.` : "";
                notify("Files", files.length + " upload(s) complete." + largeText, largeFiles.length ? "warning" : "success");
            };
            input.click();
        };

        window.uploadFile.__emerald51Wrapped = true;
        window.uploadFileToDesktop = function () { return window.uploadFile("Desktop"); };
    }

    window.openStorageCenter51 = async function () {
        win("Storage Center", `
            <h2>Storage Center</h2>
            <div class="inset-panel" id="storageCenter51Body">Loading storage information...</div>
            <div class="toolbar-row">
                ${smallButton("Refresh", "refreshStorageCenter51()")}
                ${smallButton("File Limits", "openFileLimits51()")}
                ${smallButton("Open Files", "openFileExplorer()")}
            </div>
        `, "storageCenter51");
        await window.refreshStorageCenter51();
    };

    window.refreshStorageCenter51 = async function () {
        const files = await loadDrive();
        const usage = calculateUsage(files);
        const pct = Math.min(100, Math.round((usage.total / (10 * BUILD.fileLimit)) * 100));
        const rows = Object.entries(files)
            .sort((a, b) => fileSizeFromMeta(b[1]) - fileSizeFromMeta(a[1]))
            .slice(0, 15)
            .map(([id, file]) => {
                const size = fileSizeFromMeta(file);
                return `<tr><td>${esc(file.name || id)}</td><td>${esc(formatBytes(size))}</td><td>${file.hasStorageBlob ? "Firebase Storage" : "Firestore"}</td><td>${size > BUILD.fileLimit ? "Over 1 MB" : "OK"}</td></tr>`;
            }).join("");

        renderInto("storageCenter51Body", `
            <b>User:</b> ${esc(currentUser() || "Not signed in")}<br>
            <b>Total files:</b> ${usage.count}<br>
            <b>Estimated usage:</b> ${formatBytes(usage.total)}<br>
            <b>Firestore-backed files:</b> ${usage.firestoreBacked}<br>
            <b>Firebase Storage-backed files:</b> ${usage.storageBacked}<br>
            <b>Files over free inline limit:</b> ${usage.overLimit}<br><br>
            <div class="storage-meter"><div style="width:${pct}%"></div></div>
            <small>Meter reference: 10 MB planning scale. Individual inline Firestore limit: 1 MB.</small>
            <hr>
            <table class="win95-table"><thead><tr><th>File</th><th>Size</th><th>Storage</th><th>Status</th></tr></thead><tbody>${rows || `<tr><td colspan="4">No files saved.</td></tr>`}</tbody></table>
        `);
    };

    window.openFileLimits51 = function () {
        win("File Limits", `
            <h2>Files Policy & Storage Limits</h2>
            <div class="inset-panel">
                <b>Free inline file limit:</b> ${formatBytes(BUILD.fileLimit)}<br><br>
                Small files are stored directly in Firestore. Files larger than 1 MB are stored as Firebase Storage blobs with Firestore metadata.<br><br>
                If audio, image, video, or large file previews fail, your Firebase Storage bucket likely still needs CORS configured.
            </div>
            <h3>Recommended behavior</h3>
            <ul>
                <li>Use text, notes, documents, and small HTML files freely.</li>
                <li>Use Firebase Storage for large audio, video, images, and exported documents.</li>
                <li>Admins can review metadata from the Administrative Panel, but user file content should remain protected by Firestore rules.</li>
            </ul>
        `, "fileLimits51");
    };

    /* =====================================================
       USER DIRECTORY
    ===================================================== */

    async function listEmeraldUsers() {
        const snap = await getDocs(collection(db, "emeraldOSUsers"));
        const users = [];
        snap.forEach(d => users.push({ id: d.id, ...d.data() }));
        return users.sort((a, b) => String(a.username || a.id).localeCompare(String(b.username || b.id)));
    }

    window.openEmeraldUserDirectory51 = async function () {
        win("EmeraldOS Users", `
            <h2>EmeraldOS Users</h2>
            <div class="toolbar-row">
                ${smallButton("Refresh", "refreshEmeraldUsers51()")}
                ${smallButton("File Sharing", "openFileSharing51()")}
                ${smallButton("Shared With Me", "openSharedWithMe51()")}
            </div>
            <div class="inset-panel" id="emeraldUsers51Body">Loading EmeraldOS users...</div>
        `, "userDirectory51");
        await window.refreshEmeraldUsers51();
    };

    window.refreshEmeraldUsers51 = async function () {
        try {
            const users = await listEmeraldUsers();
            const rows = users.map(user => {
                const name = user.username || user.id;
                return `<tr><td>${esc(name)}</td><td>${user.createdAt ? new Date(user.createdAt).toLocaleString() : "Unknown"}</td><td>${name === currentUser() ? "You" : `<button onclick="shareFilePrompt51('${esc(name)}')">Share File</button>`}</td></tr>`;
            }).join("");
            renderInto("emeraldUsers51Body", `
                <b>Total EmeraldOS users:</b> ${users.length}<br><br>
                <table class="win95-table"><thead><tr><th>Username</th><th>Created</th><th>Action</th></tr></thead><tbody>${rows || `<tr><td colspan="3">No users found.</td></tr>`}</tbody></table>
            `);
        } catch (err) {
            console.warn(err);
            renderInto("emeraldUsers51Body", "Could not load EmeraldOS users. Check Firestore rules.");
        }
    };

    /* =====================================================
       FILE SHARING
    ===================================================== */

    async function loadOwnedShares() {
        const q = query(collection(db, SHARES_COLLECTION), where("owner", "==", currentUser()));
        const snap = await getDocs(q);
        const rows = [];
        snap.forEach(d => rows.push({ id: d.id, ...d.data() }));
        return rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    async function loadReceivedShares() {
        const q = query(collection(db, SHARES_COLLECTION), where("recipient", "==", currentUser()));
        const snap = await getDocs(q);
        const rows = [];
        snap.forEach(d => rows.push({ id: d.id, ...d.data() }));
        return rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    async function userExists(username) {
        const snap = await getDoc(doc(db, "emeraldOSUsers", username));
        return snap.exists();
    }

    function shortFileId51(id = "") {
        const text = String(id || "");
        return text.length > 22 ? text.slice(0, 10) + "..." + text.slice(-8) : text;
    }

    function shareableFileEntries51(files = {}) {
        return Object.entries(files)
            .filter(([id, file]) => file && file.type !== "folder")
            .sort((a, b) => String(a[1].name || a[0]).localeCompare(String(b[1].name || b[0])));
    }

    window.copyFileId51 = async function (fileId) {
        const id = String(fileId || "");
        if (!id) return;
        try {
            await navigator.clipboard.writeText(id);
            notify("File Sharing", "File ID copied.", "success");
        } catch {
            prompt("Copy this file ID:", id);
        }
    };

    window.pickFileToShare51 = async function () {
        const files = await loadDrive();
        const entries = shareableFileEntries51(files);
        if (!entries.length) {
            notify("File Sharing", "No files are available to share.", "warning");
            return "";
        }

        const menu = entries.slice(0, 30).map(([id, file], index) => {
            const name = file.name || id;
            return `${index + 1}. ${name}  [${id}]`;
        }).join("\n");

        const choice = prompt("Choose a file to share by number, file name, or file ID:\n\n" + menu, "1");
        if (!choice) return "";

        const trimmed = choice.trim();
        const index = Number(trimmed);
        if (Number.isInteger(index) && index >= 1 && index <= entries.length) {
            return entries[index - 1][0];
        }

        const direct = entries.find(([id]) => id === trimmed);
        if (direct) return direct[0];

        const byName = entries.find(([id, file]) => String(file.name || id).toLowerCase() === trimmed.toLowerCase());
        if (byName) return byName[0];

        notify("File Sharing", "File not found. Use the Share button next to the file, or copy the exact file ID.", "warning");
        return "";
    };

    window.openFileSharing51 = async function () {
        win("File Sharing", `
            <h2>File Sharing</h2>
            <div class="toolbar-row">
                ${smallButton("Refresh", "refreshFileSharing51()")}
                ${smallButton("Users", "openEmeraldUserDirectory51()")}
                ${smallButton("Shared With Me", "openSharedWithMe51()")}
            </div>
            <div class="inset-panel">
                <b>Sharing update:</b> you no longer need to manually find a file ID. Use the Share button next to a file, or copy the displayed File ID when needed.
            </div>
            <div class="emerald51-split">
                <div class="inset-panel"><h3>Your Files</h3><div id="shareFiles51">Loading...</div></div>
                <div class="inset-panel"><h3>Shares You Created</h3><div id="ownedShares51">Loading...</div></div>
            </div>
        `, "fileSharing51");
        await window.refreshFileSharing51();
    };

    window.refreshFileSharing51 = async function () {
        const files = await loadDrive();
        const fileRows = shareableFileEntries51(files)
            .map(([id, file]) => `
                <div class="share-row share-row-51">
                    <span>
                        <b>${esc(file.name || id)}</b><br>
                        <small>${esc(formatBytes(fileSizeFromMeta(file)))} · ${file.hasStorageBlob ? "Firebase Storage" : "Firestore"}</small><br>
                        <small><b>File ID:</b> <code title="${esc(id)}">${esc(shortFileId51(id))}</code></small>
                    </span>
                    <span class="share-actions-51">
                        <button onclick="copyFileId51('${esc(id)}')">Copy ID</button>
                        <button onclick="shareFilePrompt51('', '${esc(id)}')">Share</button>
                    </span>
                </div>
            `).join("");
        renderInto("shareFiles51", fileRows || "No files available to share.");

        const shares = await loadOwnedShares();
        const shareRows = shares.map(share => `
            <div class="share-row">
                <span><b>${esc(share.fileName || share.ownerFileId)}</b><br><small>Shared with ${esc(share.recipient)} · ${esc(share.permission || "view")}</small></span>
                <button onclick="revokeShare51('${esc(share.id)}')">Revoke</button>
            </div>
        `).join("");
        renderInto("ownedShares51", shareRows || "No outgoing shares.");
    };

    window.shareFilePrompt51 = async function (recipient = "", fileId = "") {
        try {
            const files = await loadDrive();
            const selectedFileId = fileId || await window.pickFileToShare51();
            if (!selectedFileId || !files[selectedFileId]) {
                notify("File Sharing", "File not found.", "warning");
                return;
            }

            const target = recipient || prompt("Share with EmeraldOS username:", "");
            if (!target) return;

            if (target === currentUser()) {
                notify("File Sharing", "You cannot share a file with yourself.", "warning");
                return;
            }

            if (!(await userExists(target))) {
                notify("File Sharing", "That EmeraldOS user was not found.", "error");
                return;
            }

            const permission = (prompt("Permission: view or edit", "view") || "view").toLowerCase() === "edit" ? "edit" : "view";
            const file = files[selectedFileId];

            await addDoc(collection(db, SHARES_COLLECTION), {
                owner: currentUser(),
                recipient: target,
                ownerFileId: selectedFileId,
                fileName: file.name || selectedFileId,
                fileType: file.type || "text/plain",
                fileSize: fileSizeFromMeta(file),
                hasStorageBlob: !!file.hasStorageBlob,
                storagePath: file.storagePath || null,
                permission,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                source: "EmeraldOS 5.1"
            });

            notify("File Sharing", `Shared ${file.name || selectedFileId} with ${target}.`, "success");
            await window.refreshFileSharing51?.();
        } catch (err) {
            console.warn("Share failed:", err);
            notify("File Sharing", "Share failed. Check Firestore rules.", "error");
        }
    };

    window.revokeShare51 = async function (shareId) {
        if (!confirm("Revoke this file share?")) return;
        await deleteDoc(doc(db, SHARES_COLLECTION, shareId));
        notify("File Sharing", "Share revoked.", "success");
        await window.refreshFileSharing51?.();
    };

    async function loadOwnerFile(share) {
        const snap = await getDoc(doc(db, "emeraldOSUsers", share.owner, "drive", share.ownerFileId));
        return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    }

    function storageLooksBinary(file = {}) {
        const type = String(file.storageContentType || file.mimeType || file.type || "").toLowerCase();
        const name = String(file.name || "").toLowerCase();
        return type.startsWith("image") || type.startsWith("audio") || type.startsWith("video") || /\.(png|jpg|jpeg|gif|webp|svg|mp3|wav|ogg|m4a|webm|mp4|mov)$/i.test(name);
    }

    function blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    async function loadOwnerFileContent(file) {
        if (!file) return "";
        if (!file.hasStorageBlob || !file.storagePath) return file.content || "";

        try {
            const ref = storageRef(storage, file.storagePath);
            if (storageLooksBinary(file)) return await blobToDataURL(await getBlob(ref));
            return new TextDecoder().decode(await getBytes(ref));
        } catch (err) {
            console.warn("Shared Firebase Storage read failed:", err);
            try {
                const url = await getDownloadURL(storageRef(storage, file.storagePath));
                const res = await fetch(url, { mode: "cors" });
                if (!res.ok) throw new Error("HTTP " + res.status);
                if (storageLooksBinary(file)) return await blobToDataURL(await res.blob());
                return await res.text();
            } catch (fetchErr) {
                console.warn("Shared file fallback failed:", fetchErr);
                return file.content || "";
            }
        }
    }

    window.openSharedWithMe51 = async function () {
        win("Shared With Me", `
            <h2>Shared With Me</h2>
            <div class="toolbar-row">
                ${smallButton("Refresh", "refreshSharedWithMe51()")}
                ${smallButton("File Sharing", "openFileSharing51()")}
            </div>
            <div class="inset-panel" id="sharedWithMe51Body">Loading shared files...</div>
        `, "sharedWithMe51");
        await window.refreshSharedWithMe51();
    };

    window.refreshSharedWithMe51 = async function () {
        try {
            const shares = await loadReceivedShares();
            const rows = shares.map(share => `
                <div class="share-row">
                    <span><b>${esc(share.fileName || share.ownerFileId)}</b><br><small>From ${esc(share.owner)} · ${esc(share.permission || "view")} · ${esc(formatBytes(share.fileSize || 0))}</small></span>
                    <span>
                        <button onclick="openSharedFile51('${esc(share.id)}')">Open</button>
                        <button onclick="copySharedFileToDrive51('${esc(share.id)}')">Copy</button>
                    </span>
                </div>
            `).join("");
            renderInto("sharedWithMe51Body", rows || "No files have been shared with you yet.");
        } catch (err) {
            console.warn(err);
            renderInto("sharedWithMe51Body", "Could not load shared files. Check Firestore rules.");
        }
    };

    window.openSharedFile51 = async function (shareId) {
        try {
            const shareSnap = await getDoc(doc(db, SHARES_COLLECTION, shareId));
            if (!shareSnap.exists()) return notify("Shared File", "Share not found.", "error");
            const share = { id: shareSnap.id, ...shareSnap.data() };
            if (share.recipient !== currentUser() && share.owner !== currentUser()) {
                return notify("Shared File", "You do not have access to this share.", "error");
            }
            const file = await loadOwnerFile(share);
            if (!file) return notify("Shared File", "Original file no longer exists.", "error");
            const content = await loadOwnerFileContent(file);
            const isEditable = share.permission === "edit" && !file.hasStorageBlob;
            const safeContent = esc(content);
            const lower = String(file.name || "").toLowerCase();
            let viewer = "";
            if (String(content).startsWith("data:image")) {
                viewer = `<img src="${safeContent}" style="max-width:100%;max-height:300px;">`;
            } else if (String(content).startsWith("data:audio")) {
                viewer = `<audio controls src="${safeContent}" style="width:100%"></audio>`;
            } else if (String(content).startsWith("data:video")) {
                viewer = `<video controls src="${safeContent}" style="width:100%;max-height:320px"></video>`;
            } else if (/\.html?$/.test(lower)) {
                viewer = `<iframe class="shared-preview-frame" srcdoc="${safeContent}"></iframe>`;
            } else {
                viewer = `<textarea id="sharedFileEditor51" class="shared-file-text" ${isEditable ? "" : "readonly"}>${safeContent}</textarea>`;
            }

            win("Shared: " + (file.name || share.ownerFileId), `
                <h2>${esc(file.name || share.ownerFileId)}</h2>
                <div class="inset-panel">
                    <b>Owner:</b> ${esc(share.owner)}<br>
                    <b>Permission:</b> ${esc(share.permission || "view")}<br>
                    <b>Storage:</b> ${file.hasStorageBlob ? "Firebase Storage" : "Firestore"}
                </div>
                ${viewer}
                <div class="toolbar-row">
                    ${isEditable ? smallButton("Save Edit", `saveSharedEdit51('${esc(share.id)}')`) : ""}
                    ${smallButton("Copy To My Files", `copySharedFileToDrive51('${esc(share.id)}')`)}
                </div>
            `, "sharedFile51");
        } catch (err) {
            console.warn(err);
            notify("Shared File", "Could not open shared file.", "error");
        }
    };

    window.saveSharedEdit51 = async function (shareId) {
        try {
            const shareSnap = await getDoc(doc(db, SHARES_COLLECTION, shareId));
            if (!shareSnap.exists()) return;
            const share = { id: shareSnap.id, ...shareSnap.data() };
            if (share.recipient !== currentUser() || share.permission !== "edit") return;
            const value = document.getElementById("sharedFileEditor51")?.value || "";
            if (byteSize(value) > BUILD.fileLimit) {
                notify("Shared File", "Shared editing currently supports files up to 1 MB.", "warning");
                return;
            }
            await setDoc(doc(db, "emeraldOSUsers", share.owner, "drive", share.ownerFileId), {
                content: value,
                updatedAt: Date.now(),
                editedBy: currentUser()
            }, { merge: true });
            notify("Shared File", "Changes saved to owner file.", "success");
        } catch (err) {
            console.warn(err);
            notify("Shared File", "Could not save shared edit. Check Firestore rules.", "error");
        }
    };

    window.copySharedFileToDrive51 = async function (shareId) {
        try {
            const shareSnap = await getDoc(doc(db, SHARES_COLLECTION, shareId));
            if (!shareSnap.exists()) return;
            const share = { id: shareSnap.id, ...shareSnap.data() };
            if (share.recipient !== currentUser() && share.owner !== currentUser()) return;
            const file = await loadOwnerFile(share);
            if (!file) return notify("Shared File", "Original file no longer exists.", "error");
            const content = await loadOwnerFileContent(file);
            const id = await cloudCreateFile("Copy of " + (file.name || "Shared File"), content);
            if (id) {
                await cloudSaveFile(id, {
                    folder: "Documents",
                    parent: "Documents",
                    type: file.type || "text/plain",
                    mimeType: file.mimeType || file.type || "text/plain",
                    sourceShare: shareId,
                    sourceOwner: share.owner,
                    updatedAt: Date.now()
                });
                await refreshDriveCache();
                notify("Shared File", "Copied to your Documents folder.", "success");
            }
        } catch (err) {
            console.warn(err);
            notify("Shared File", "Could not copy shared file.", "error");
        }
    };

    /* =====================================================
       EMERALD OFFICE 5.1
    ===================================================== */

    function getOfficeDocs() {
        return getJSON(OFFICE_DOCS_KEY, []);
    }

    function saveOfficeDocs(docs) {
        setJSON(OFFICE_DOCS_KEY, docs.slice(0, 200));
    }

    window.openEmeraldOffice51 = function () {
        win("Emerald Office 5.1", `
            <h2>Emerald Office 5.1</h2>
            <div class="inset-panel">Create documents, spreadsheets, presentations, forms, and shared files from one consolidated suite.</div>
            <div class="suite-grid big-suite">
                <button onclick="openEmeraldWriter51()"><b>Emerald Writer</b><br><small>Documents and letters</small></button>
                <button onclick="openEmeraldSheets51()"><b>Emerald Sheets</b><br><small>Basic tables and CSV</small></button>
                <button onclick="openEmeraldSlides51()"><b>Emerald Slides</b><br><small>Simple presentation builder</small></button>
                <button onclick="openEmeraldForms51()"><b>Emerald Forms</b><br><small>Questionnaire builder</small></button>
                <button onclick="openOfficeVault51()"><b>Office Vault</b><br><small>Local recent documents</small></button>
                <button onclick="openFileSharing51()"><b>Share Files</b><br><small>Send files to EmeraldOS users</small></button>
            </div>
        `, "emeraldOffice51");
    };

    function writerHTML(title = "Untitled Document", html = "") {
        return `
            <div class="writer51-shell">
                <div class="writer51-toolbar">
                    <button onclick="writer51Cmd('bold')"><b>B</b></button>
                    <button onclick="writer51Cmd('italic')"><i>I</i></button>
                    <button onclick="writer51Cmd('underline')"><u>U</u></button>
                    <button onclick="writer51Cmd('insertUnorderedList')">Bullets</button>
                    <button onclick="writer51Cmd('insertOrderedList')">Numbers</button>
                    <button onclick="writer51Cmd('justifyLeft')">Left</button>
                    <button onclick="writer51Cmd('justifyCenter')">Center</button>
                    <button onclick="writer51Cmd('justifyRight')">Right</button>
                    <select onchange="writer51Block(this.value);this.value=''">
                        <option value="">Format</option>
                        <option value="P">Paragraph</option>
                        <option value="H1">Heading 1</option>
                        <option value="H2">Heading 2</option>
                        <option value="H3">Heading 3</option>
                    </select>
                    <select onchange="writer51Cmd('fontSize', this.value);this.value=''">
                        <option value="">Size</option><option value="2">Small</option><option value="3">Normal</option><option value="4">Large</option><option value="5">Title</option>
                    </select>
                    <input type="color" onchange="writer51Cmd('foreColor', this.value)">
                    <button onclick="writer51InsertDate()">Date</button>
                    <button onclick="writer51Template('letter')">Letter</button>
                    <button onclick="writer51Template('report')">Report</button>
                    <button onclick="writer51Template('meeting')">Meeting Notes</button>
                </div>
                <div class="writer51-toolbar">
                    <input id="writer51Title" class="writer51-title" value="${esc(title)}" placeholder="Document title">
                    <input id="writer51Find" placeholder="Find">
                    <input id="writer51Replace" placeholder="Replace">
                    <button onclick="writer51FindText()">Find</button>
                    <button onclick="writer51ReplaceText()">Replace</button>
                    <button onclick="writer51SaveLocal()">Save Vault</button>
                    <button onclick="writer51SaveToFiles()">Save Files</button>
                    <button onclick="writer51Export('txt')">TXT</button>
                    <button onclick="writer51Export('html')">HTML</button>
                    <button onclick="window.print()">Print</button>
                </div>
                <div class="writer51-page-wrap"><div id="writer51Editor" class="writer51-editor" contenteditable="true" spellcheck="true">${html || ""}</div></div>
                <div class="writer51-status"><span id="writer51Status">Ready.</span><span id="writer51Count">0 words</span></div>
            </div>
        `;
    }

    function editor() { return document.getElementById("writer51Editor"); }
    function writerTitle() { return document.getElementById("writer51Title")?.value?.trim() || "Untitled Document"; }

    function updateWriterCount() {
        const text = stripHTML(editor()?.innerHTML || "").trim();
        const words = text ? text.split(/\s+/).length : 0;
        const chars = text.length;
        const el = document.getElementById("writer51Count");
        if (el) el.textContent = `${words} words / ${chars} characters`;
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ title: writerTitle(), html: editor()?.innerHTML || "", savedAt: Date.now() }));
    }

    function setWriterStatus(text) {
        const el = document.getElementById("writer51Status");
        if (el) el.textContent = text;
    }

    window.openEmeraldWriter51 = function () {
        let autosave = null;
        try { autosave = JSON.parse(localStorage.getItem(AUTOSAVE_KEY) || "null"); } catch {}
        win("Emerald Writer 5.1", writerHTML(autosave?.title || "Untitled Document", autosave?.html || "<h1>Untitled Document</h1><p>Start writing here.</p>"), "writer51");
        setTimeout(() => {
            editor()?.addEventListener("input", updateWriterCount);
            updateWriterCount();
        }, 50);
    };

    window.writer51Cmd = function (cmd, value = null) {
        editor()?.focus();
        document.execCommand(cmd, false, value);
        updateWriterCount();
    };

    window.writer51Block = function (tag) {
        if (!tag) return;
        editor()?.focus();
        document.execCommand("formatBlock", false, tag);
        updateWriterCount();
    };

    window.writer51InsertDate = function () {
        editor()?.focus();
        document.execCommand("insertText", false, new Date().toLocaleDateString());
        updateWriterCount();
    };

    window.writer51Template = function (type) {
        const today = new Date().toLocaleDateString();
        const username = esc(currentUser() || "EmeraldOS User");
        const templates = {
            letter: `<p>${today}</p><p>Dear Recipient,</p><p>Write your letter here.</p><p>Sincerely,<br>${username}</p>`,
            report: `<h1>Report</h1><p><b>Date:</b> ${today}</p><h2>Summary</h2><p>Write summary here.</p><h2>Details</h2><p>Write details here.</p>`,
            meeting: `<h1>Meeting Notes</h1><p><b>Date:</b> ${today}</p><h2>Attendees</h2><ul><li>${username}</li></ul><h2>Notes</h2><p>Write notes here.</p><h2>Action Items</h2><ul><li>Item one</li></ul>`
        };
        if (editor()) editor().innerHTML = templates[type] || "";
        updateWriterCount();
    };

    window.writer51FindText = function () {
        const needle = document.getElementById("writer51Find")?.value;
        if (!needle) return;
        editor()?.focus();
        const found = window.find ? window.find(needle) : false;
        setWriterStatus(found ? "Found text." : "Text not found.");
    };

    window.writer51ReplaceText = function () {
        const find = document.getElementById("writer51Find")?.value || "";
        const replace = document.getElementById("writer51Replace")?.value || "";
        if (!find || !editor()) return;
        editor().innerHTML = editor().innerHTML.split(find).join(esc(replace));
        updateWriterCount();
        setWriterStatus("Replace complete.");
    };

    window.writer51SaveLocal = function () {
        const docs = getOfficeDocs();
        docs.unshift({ id: "office51_" + Date.now(), app: "writer", title: writerTitle(), html: editor()?.innerHTML || "", text: stripHTML(editor()?.innerHTML || ""), savedAt: Date.now() });
        saveOfficeDocs(docs);
        setWriterStatus("Saved to Office Vault.");
        notify("Emerald Writer", "Saved to Office Vault.", "success");
    };

    window.writer51SaveToFiles = async function () {
        const title = writerTitle().replace(/[^a-z0-9_ -]/gi, "_");
        const html = `<!doctype html><html><head><meta charset="UTF-8"><title>${esc(writerTitle())}</title></head><body>${editor()?.innerHTML || ""}</body></html>`;
        const id = await cloudCreateFile(title + ".edoc.html", html);
        if (id) {
            await cloudSaveFile(id, { folder: "Documents", parent: "Documents", type: "text/html", app: "Emerald Writer 5.1", updatedAt: Date.now() });
            await refreshDriveCache();
            notify("Emerald Writer", "Document saved to Files > Documents.", "success");
        }
    };

    window.writer51Export = function (type) {
        const title = writerTitle().replace(/[^a-z0-9_ -]/gi, "_");
        const content = type === "html"
            ? `<!doctype html><html><head><meta charset="UTF-8"><title>${esc(writerTitle())}</title></head><body>${editor()?.innerHTML || ""}</body></html>`
            : stripHTML(editor()?.innerHTML || "");
        const blob = new Blob([content], { type: type === "html" ? "text/html" : "text/plain" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = title + (type === "html" ? ".html" : ".txt");
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };

    window.openOfficeVault51 = function () {
        const docs = getOfficeDocs();
        const rows = docs.map(doc => `
            <div class="share-row">
                <span><b>${esc(doc.title)}</b><br><small>${new Date(doc.savedAt).toLocaleString()} · ${esc(doc.app || "office")}</small></span>
                <button onclick="openOfficeVaultDoc51('${esc(doc.id)}')">Open</button>
                <button onclick="deleteOfficeVaultDoc51('${esc(doc.id)}')">Delete</button>
            </div>
        `).join("");
        win("Office Vault", `<h2>Office Vault</h2><div class="inset-panel">${rows || "No local office documents saved."}</div>`, "officeVault51");
    };

    window.openOfficeVaultDoc51 = function (id) {
        const doc = getOfficeDocs().find(d => d.id === id);
        if (!doc) return;
        win("Emerald Writer 5.1", writerHTML(doc.title, doc.html), "writer51");
        setTimeout(() => { editor()?.addEventListener("input", updateWriterCount); updateWriterCount(); }, 50);
    };

    window.deleteOfficeVaultDoc51 = function (id) {
        saveOfficeDocs(getOfficeDocs().filter(d => d.id !== id));
        window.openOfficeVault51();
    };

    window.openEmeraldSheets51 = function () {
        const cells = Array.from({ length: 6 }).map((_, r) => `<tr>${Array.from({ length: 5 }).map((_, c) => `<td contenteditable="true" data-r="${r}" data-c="${c}"></td>`).join("")}</tr>`).join("");
        win("Emerald Sheets", `
            <h2>Emerald Sheets</h2>
            <div class="toolbar-row">${smallButton("Save CSV to Files", "sheets51SaveCSV()")}${smallButton("Export CSV", "sheets51ExportCSV()")}</div>
            <table id="sheets51Table" class="sheet-table"><tbody>${cells}</tbody></table>
        `, "sheets51");
    };

    function sheetCSV() {
        return Array.from(document.querySelectorAll("#sheets51Table tr")).map(row =>
            Array.from(row.children).map(td => '"' + String(td.textContent || "").replaceAll('"', '""') + '"').join(",")
        ).join("\n");
    }

    window.sheets51ExportCSV = function () {
        const blob = new Blob([sheetCSV()], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "Emerald Sheet.csv";
        a.click();
    };

    window.sheets51SaveCSV = async function () {
        const id = await cloudCreateFile("Emerald Sheet.csv", sheetCSV());
        if (id) {
            await cloudSaveFile(id, { folder: "Documents", parent: "Documents", type: "text/csv", app: "Emerald Sheets", updatedAt: Date.now() });
            await refreshDriveCache();
            notify("Emerald Sheets", "Sheet saved to Files.", "success");
        }
    };

    window.openEmeraldSlides51 = function () {
        win("Emerald Slides", `
            <h2>Emerald Slides</h2>
            <div class="toolbar-row">${smallButton("Add Slide", "slides51Add()")}${smallButton("Export HTML", "slides51Export()")}</div>
            <div id="slides51List" class="slides-list">
                <div class="slide-card" contenteditable="true"><h1>Title Slide</h1><p>Click to edit this slide.</p></div>
            </div>
        `, "slides51");
    };

    window.slides51Add = function () {
        const list = document.getElementById("slides51List");
        if (!list) return;
        const div = document.createElement("div");
        div.className = "slide-card";
        div.contentEditable = "true";
        div.innerHTML = `<h2>New Slide</h2><p>Click to edit.</p>`;
        list.appendChild(div);
    };

    window.slides51Export = function () {
        const slides = Array.from(document.querySelectorAll(".slide-card")).map((s, i) => `<section><h3>Slide ${i + 1}</h3>${s.innerHTML}</section>`).join("<hr>");
        const blob = new Blob([`<!doctype html><html><body>${slides}</body></html>`], { type: "text/html" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "Emerald Slides.html";
        a.click();
    };

    window.openEmeraldForms51 = function () {
        win("Emerald Forms", `
            <h2>Emerald Forms</h2>
            <div class="toolbar-row">${smallButton("Add Question", "forms51AddQuestion()")}${smallButton("Export Form", "forms51Export()")}</div>
            <div id="forms51Questions" class="inset-panel">
                <div contenteditable="true" class="form-question">Question 1: Type your question here.</div>
            </div>
        `, "forms51");
    };

    window.forms51AddQuestion = function () {
        const box = document.getElementById("forms51Questions");
        const div = document.createElement("div");
        div.contentEditable = "true";
        div.className = "form-question";
        div.textContent = "New question";
        box?.appendChild(div);
    };

    window.forms51Export = function () {
        const text = Array.from(document.querySelectorAll(".form-question")).map((q, i) => `${i + 1}. ${q.textContent}`).join("\n");
        const blob = new Blob([text], { type: "text/plain" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "Emerald Form.txt";
        a.click();
    };

    /* =====================================================
       TERMINAL COMMANDS
    ===================================================== */

    function terminalWrite(raw, result) {
        const output = document.getElementById("terminal_output");
        if (!output) return;
        output.innerHTML += `&gt; ${esc(raw)}<br>${result}<br><br>`;
        output.scrollTop = output.scrollHeight;
        const input = document.getElementById("terminal_input");
        if (input) input.value = "";
    }

    function installTerminalCommands() {
        if (typeof window.runCommand !== "function" || window.runCommand.__emerald51Wrapped) return;
        const original = window.runCommand;
        const wrapped = async function (cmdLine = "") {
            const raw = String(cmdLine || "").trim();
            const [command, ...args] = raw.split(/\s+/);
            let result = null;

            switch ((command || "").toLowerCase()) {
                case "office51":
                case "office":
                case "emerald.office":
                    window.openEmeraldOffice51(); result = "Opening Emerald Office 5.1."; break;
                case "writer51":
                case "writer":
                    window.openEmeraldWriter51(); result = "Opening Emerald Writer 5.1."; break;
                case "sheets51":
                case "sheets":
                    window.openEmeraldSheets51(); result = "Opening Emerald Sheets."; break;
                case "slides51":
                case "slides":
                    window.openEmeraldSlides51(); result = "Opening Emerald Slides."; break;
                case "storage51":
                case "storage":
                    window.openStorageCenter51(); result = "Opening Storage Center."; break;
                case "share":
                case "sharing":
                    window.openFileSharing51(); result = "Opening File Sharing."; break;
                case "shared":
                    window.openSharedWithMe51(); result = "Opening Shared With Me."; break;
                case "users":
                case "user.list":
                    window.openEmeraldUserDirectory51(); result = "Opening EmeraldOS Users."; break;
                case "build":
                    result = `${BUILD.displayName} - ${BUILD.codename}`; break;
                default:
                    return original(cmdLine);
            }

            terminalWrite(raw, esc(result));
        };
        wrapped.__emerald51Wrapped = true;
        window.runCommand = wrapped;
    }

    /* =====================================================
       STYLES
    ===================================================== */

    function injectStyles() {
        if (document.getElementById("emerald51-styles")) return;
        const style = document.createElement("style");
        style.id = "emerald51-styles";
        style.textContent = `
            .emerald51-panel { padding:10px; height:100%; box-sizing:border-box; overflow:auto; background:#c0c0c0; color:#000; font-family:"MS Sans Serif",Tahoma,Arial,sans-serif; font-size:12px; }
            .emerald51-panel h2 { margin:0 0 8px 0; }
            .toolbar-row { display:flex; flex-wrap:wrap; gap:6px; margin:8px 0; align-items:center; }
            .emerald51-split { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
            .share-row { display:flex; justify-content:space-between; gap:8px; align-items:center; padding:6px; margin-bottom:6px; background:#fff; border:1px solid #808080; }
            .share-row-51 code { background:#efefef; border:1px inset #c0c0c0; padding:1px 3px; user-select:text; }
            .share-actions-51 { display:flex; gap:4px; flex-wrap:wrap; justify-content:flex-end; }
            .storage-meter { height:16px; background:#fff; border:2px inset #c0c0c0; margin:6px 0; }
            .storage-meter > div { height:100%; background:#008000; }
            .win95-table { width:100%; border-collapse:collapse; background:#fff; }
            .win95-table th, .win95-table td { border:1px solid #808080; padding:4px; text-align:left; }
            .win95-table th { background:#000080; color:#fff; }
            .writer51-shell { display:flex; flex-direction:column; gap:6px; height:100%; }
            .writer51-toolbar { display:flex; flex-wrap:wrap; gap:4px; background:#d4d0c8; border:1px solid #808080; padding:4px; }
            .writer51-toolbar input, .writer51-toolbar select { font-family:inherit; font-size:12px; }
            .writer51-title { min-width:180px; }
            .writer51-page-wrap { flex:1; overflow:auto; background:#808080; padding:12px; border:2px inset #c0c0c0; }
            .writer51-editor { width:8.2in; min-height:9.8in; max-width:100%; margin:auto; background:#fff; color:#000; padding:0.65in; box-shadow:2px 2px 0 #404040; outline:none; user-select:text; cursor:text; }
            .writer51-status { display:flex; justify-content:space-between; background:#d4d0c8; border:1px inset #fff; padding:3px 6px; }
            .sheet-table { border-collapse:collapse; background:#fff; width:100%; }
            .sheet-table td { border:1px solid #808080; min-width:90px; height:28px; padding:4px; user-select:text; }
            .slide-card { background:#fff; min-height:180px; border:2px inset #c0c0c0; padding:14px; margin-bottom:10px; user-select:text; }
            .form-question { background:#fff; border:1px solid #808080; margin:6px 0; padding:8px; user-select:text; }
            .shared-file-text { width:100%; height:260px; resize:vertical; font-family:"Courier New",monospace; font-size:12px; user-select:text; }
            .shared-preview-frame { width:100%; height:300px; border:2px inset #c0c0c0; background:#fff; }
            .big-suite button { min-height:64px; text-align:left; }
            @media (max-width:700px) { .emerald51-split { grid-template-columns:1fr; } .writer51-editor { width:auto; padding:18px; } }
        `;
        document.head.appendChild(style);
    }

    function refreshMenus() {
        try {
            window.renderDesktop?.();
            window.renderStartMenu?.();
        } catch (err) {
            console.warn("EmeraldOS 5.1 menu refresh skipped:", err);
        }
    }

    function init() {
        injectStyles();
        registerApps();
        installUploadWarningPatch();
        installTerminalCommands();
        document.title = BUILD.displayName;
        localStorage.setItem("40_build_name", BUILD.displayName);
        localStorage.setItem("40_version", BUILD.version);
        setTimeout(refreshMenus, 250);
        notify("EmeraldOS 5.1", "Office, Sharing & Storage Update loaded.", "info");
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    window.EMERALDOS_51 = BUILD;
    window.formatBytes51 = formatBytes;
})();
