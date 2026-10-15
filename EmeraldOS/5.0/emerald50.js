
"use strict";

/* =========================================================
   EMERALDOS 5.0
   MAJOR RELEASE + ADMINISTRATIVE PANEL UPDATE
========================================================= */

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./firebase.js";

(function () {
    if (window.EmeraldOS50Loaded) {
        console.warn("EmeraldOS 5.0 already loaded.");
        return;
    }
    window.EmeraldOS50Loaded = true;

    const BUILD_50 = {
        product: "EmeraldOS",
        displayName: "EmeraldOS 5.0",
        version: "5.0",
        channel: "Stable",
        codename: "Major Release & Administrative Panel Update"
    };

    const DOCS_KEY = "40_emerald50_office_docs";
    const ADMIN_STATE_KEY = "40_admin_panel_last_user";

    function esc(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function getJSON(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
        catch { return fallback; }
    }

    function setJSON(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function editionCan(required = "economy") {
        if (typeof window.canSeeEdition === "function") return window.canSeeEdition(required);
        return true;
    }

    function isAdminVerified50() {
        const executive = localStorage.getItem("40_executive_verified") === "true";
        const role = String(localStorage.getItem("role") || localStorage.getItem("40_developer_role") || "").toLowerCase();
        return executive || role === "admin";
    }

    function simpleWin50(title, html, appId = "emerald50") {
        if (typeof window.openWindow === "function") {
            window.openWindow(title, `<div class="emerald50-panel">${html}</div>`, appId);
        } else {
            alert(title);
        }
    }

    function btn50(label, action, cls = "") {
        return `<button class="emerald50-button ${esc(cls)}" onclick="${action}">${esc(label)}</button>`;
    }

    function input50(id, placeholder = "") {
        return `<input class="emerald50-input" id="${esc(id)}" placeholder="${esc(placeholder)}">`;
    }

    function text50(id, placeholder = "") {
        return `<textarea class="emerald50-textarea" id="${esc(id)}" placeholder="${esc(placeholder)}"></textarea>`;
    }

    function registerApp50(id, app) {
        if (!window.APPS) return false;
        window.APPS[id] = Object.assign(
            { edition: "economy", category: "essential", hiddenStandalone: false },
            window.APPS[id] || {},
            app
        );
        return true;
    }

    function installCategories50() {
        window.EMERALDOS_APP_CATEGORIES = Object.assign({}, window.EMERALDOS_APP_CATEGORIES || {}, {
            essential: Object.assign({ id:"essential", name:"Essential Apps", icon:"📁", edition:"economy", order:1 }, window.EMERALDOS_APP_CATEGORIES?.essential || {}),
            office: Object.assign({ id:"office", name:"Office Apps", icon:"📁", edition:"economy", order:2 }, window.EMERALDOS_APP_CATEGORIES?.office || {}),
            personal: Object.assign({ id:"personal", name:"Home Apps", icon:"📁", edition:"home", order:3 }, window.EMERALDOS_APP_CATEGORIES?.personal || {}),
            business: Object.assign({ id:"business", name:"Business Apps", icon:"📁", edition:"business", order:4 }, window.EMERALDOS_APP_CATEGORIES?.business || {}),
            creative: Object.assign({ id:"creative", name:"Creative Apps", icon:"📁", edition:"virtue", order:5 }, window.EMERALDOS_APP_CATEGORIES?.creative || {}),
            system: Object.assign({ id:"system", name:"System Apps", icon:"📁", edition:"virtue", order:6 }, window.EMERALDOS_APP_CATEGORIES?.system || {}),
            developer: Object.assign({ id:"developer", name:"Developer Apps", icon:"📁", edition:"developer", order:7 }, window.EMERALDOS_APP_CATEGORIES?.developer || {}),
            executive: Object.assign({ id:"executive", name:"Administrative Apps", icon:"📁", edition:"executive", order:8 }, window.EMERALDOS_APP_CATEGORIES?.executive || {})
        });
        window.EMERALDOS_APP_CATEGORIES.office.name = "Office Apps";
        window.EMERALDOS_APP_CATEGORIES.executive.name = "Administrative Apps";
    }

    function setBuild50() {
        try { window.EMERALDOS_BUILD = Object.assign(window.EMERALDOS_BUILD || {}, BUILD_50); } catch {}
        try { localStorage.setItem("40_build_name", BUILD_50.displayName); } catch {}
        try { localStorage.setItem("40_version", BUILD_50.version); } catch {}
        try { localStorage.setItem("40_build_codename", BUILD_50.codename); } catch {}
        try { window.EmeraldOSRegistry?.set?.("HKEY_LOCAL_MACHINE\\System\\Build\\Version", "5.0"); } catch {}
        try { window.EmeraldOSRegistry?.set?.("HKEY_LOCAL_MACHINE\\Software\\EmeraldOS\\AdminPanel", "Enabled"); } catch {}
        document.title = BUILD_50.displayName;
        const buildBadge = document.getElementById("emerald40-build-badge");
        if (buildBadge) buildBadge.innerHTML = `<span class="emerald50-build-badge">EmeraldOS 5.0</span>`;
    }

    /* =====================================================
       Desktop selection cleanup: removes old blue selection box.
    ===================================================== */

    function clearDesktopSelection50() {
        document
            .querySelectorAll(".desktop-item.selected, .emerald46-desktop-item.selected, .icon.selected")
            .forEach(el => el.classList.remove("selected"));
        if (document.activeElement && document.activeElement.blur) {
            try { document.activeElement.blur(); } catch {}
        }
    }

    function patchDesktopSelection50() {
        document.addEventListener("mouseup", () => setTimeout(clearDesktopSelection50, 120), true);
        document.addEventListener("dblclick", e => {
            if (e.target.closest(".desktop-item, .emerald46-desktop-item, .icon")) {
                setTimeout(clearDesktopSelection50, 220);
            }
        }, true);
    }

    /* =====================================================
       Emerald Office 5.0
    ===================================================== */

    function getDocs50() { return getJSON(DOCS_KEY, []); }
    function saveDocs50(list) { setJSON(DOCS_KEY, list); }

    window.saveOfficeDoc50 = function (type = "Document") {
        const title = document.getElementById("office50Title")?.value?.trim() || type + " " + new Date().toLocaleString();
        const body = document.getElementById("office50Body")?.value || "";
        const docs = getDocs50();
        docs.unshift({ id: "doc_" + Date.now(), type, title, body, savedAt: Date.now() });
        saveDocs50(docs.slice(0, 150));
        window.notify?.("Emerald Office", type + " saved.", 2600, "success");
    };

    window.openEmeraldOffice50 = function () {
        simpleWin50("Emerald Office", `
            <h2>Emerald Office</h2>
            <div class="emerald50-inset">EmeraldOS 5.0 productivity hub. This replaces scattered document apps with one suite.</div>
            <div class="emerald50-grid">
                ${btn50("Writer", "openOfficeWriter50()")}
                ${btn50("Sheets", "openOfficeSheets50()")}
                ${btn50("Slides", "openOfficeSlides50()")}
                ${btn50("Document Vault", "openOfficeVault50()")}
                ${btn50("Open old Emerald 360", "openEmerald36046 && openEmerald36046()")}
                ${btn50("Files", "openFileExplorer && openFileExplorer()")}
            </div>
        `, "emeraldOffice50");
    };

    window.openOfficeWriter50 = function () {
        simpleWin50("Emerald Writer", `
            <h2>Emerald Writer</h2>
            ${input50("office50Title", "Document title")}
            ${text50("office50Body", "Write your document here...")}
            ${btn50("Save Document", "saveOfficeDoc50('Document')")}
            ${btn50("Document Vault", "openOfficeVault50()")}
        `, "officeWriter50");
    };

    window.openOfficeSheets50 = function () {
        simpleWin50("Emerald Sheets", `
            <h2>Emerald Sheets</h2>
            <div class="emerald50-inset">CSV-style spreadsheet editor. Separate cells with commas.</div>
            ${input50("office50Title", "Sheet title")}
            <textarea class="emerald50-textarea" id="office50Body" placeholder="Item,Amount\nExample,100"></textarea>
            ${btn50("Save Sheet", "saveOfficeDoc50('Sheet')")}
            ${btn50("Document Vault", "openOfficeVault50()")}
        `, "officeSheets50");
    };

    window.openOfficeSlides50 = function () {
        simpleWin50("Emerald Slides", `
            <h2>Emerald Slides</h2>
            <div class="emerald50-inset">Simple presentation builder. Separate slides with ---.</div>
            ${input50("office50Title", "Presentation title")}
            <textarea class="emerald50-textarea" id="office50Body" placeholder="Title Slide\n---\nSecond Slide"></textarea>
            ${btn50("Save Presentation", "saveOfficeDoc50('Presentation')")}
            ${btn50("Document Vault", "openOfficeVault50()")}
        `, "officeSlides50");
    };

    window.openOfficeVault50 = function () {
        const docs = getDocs50();
        simpleWin50("Document Vault", `
            <h2>Document Vault</h2>
            ${docs.length ? docs.map(d => `
                <div class="emerald50-doc">
                    <b>${esc(d.title)}</b><br>
                    <small>${esc(d.type)} - ${new Date(d.savedAt).toLocaleString()}</small>
                    <pre>${esc(d.body)}</pre>
                </div>
            `).join("") : `<div class="emerald50-inset">No Emerald Office documents saved yet.</div>`}
        `, "officeVault50");
    };

    /* =====================================================
       More consolidated apps
    ===================================================== */

    window.openProductivityHub50 = function () {
        simpleWin50("Productivity Hub", `
            <h2>Productivity Hub</h2>
            <div class="emerald50-grid">
                ${btn50("Emerald Office", "openEmeraldOffice50()")}
                ${btn50("Calendar", "openCalendar && openCalendar()")}
                ${btn50("Reminders", "openReminderBoard && openReminderBoard()")}
                ${btn50("Quick Notes", "openOfficeWriter50()")}
                ${btn50("Files", "openFileExplorer && openFileExplorer()")}
            </div>
        `, "productivityHub50");
    };

    window.openSecurityCenter50 = function () {
        simpleWin50("Security Center", `
            <h2>Security Center</h2>
            <div class="emerald50-inset">
                <b>Login user:</b> ${esc(localStorage.getItem("40_username") || "Guest")}<br>
                <b>Edition:</b> ${esc(window.getActiveEdition?.() || "Unknown")}<br>
                <b>Developer verified:</b> ${localStorage.getItem("40_developer_verified") === "true" ? "Yes" : "No"}<br>
                <b>Executive verified:</b> ${localStorage.getItem("40_executive_verified") === "true" ? "Yes" : "No"}
            </div>
            ${btn50("Admin Verifier", "openAdminVerifier42 ? openAdminVerifier42() : alert('Use BIOS verification for Executive.')")}
            ${btn50("App Permissions", "openAppPermissions43 && openAppPermissions43()")}
            ${btn50("Account Status", "openAccountStatus44 && openAccountStatus44()")}
        `, "securityCenter50");
    };

    window.openSystemHub50 = function () {
        simpleWin50("System Hub", `
            <h2>System Hub</h2>
            <div class="emerald50-grid">
                ${btn50("System Control", "openSystemSuite46 ? openSystemSuite46() : openSystemApp()")}
                ${btn50("Display Settings", "openDisplaySettings43 && openDisplaySettings43()")}
                ${btn50("Keyboard & Mouse", "openKeyboardMouse43 && openKeyboardMouse43()")}
                ${btn50("Desktop Repair", "repairDesktop50()")}
                ${btn50("Security Center", "openSecurityCenter50()")}
            </div>
        `, "systemHub50");
    };

    window.openCreativeHub50 = function () {
        simpleWin50("Creative Hub", `
            <h2>Creative Hub</h2>
            <div class="emerald50-grid">
                ${btn50("Media Suite", "openMediaSuite46 && openMediaSuite46()")}
                ${btn50("Paint", "openPaint && openPaint()")}
                ${btn50("Audio Notes", "openAudioNotes426 ? openAudioNotes426() : (openAudioNotes && openAudioNotes())")}
                ${btn50("Image Gallery", "openImageGallery41 && openImageGallery41()")}
                ${btn50("HTML Viewer", "openHTMLViewer && openHTMLViewer()")}
            </div>
        `, "creativeHub50");
    };

    window.openDeveloperHub50 = function () {
        simpleWin50("Developer Hub", `
            <h2>Developer Hub</h2>
            <div class="emerald50-grid">
                ${btn50("Terminal", "openTerminal && openTerminal()")}
                ${btn50("Registry Editor", "openRegistryEditor && openRegistryEditor()")}
                ${btn50("Code Studio", "openCodeStudio && openCodeStudio()")}
                ${btn50("API Tester", "openAPITester && openAPITester()")}
                ${btn50("Log Viewer", "openLogViewer && openLogViewer()")}
                ${btn50("Build Tools", "openBuildInspector && openBuildInspector()")}
            </div>
        `, "developerHub50");
    };

    /* =====================================================
       Administrative Panel
    ===================================================== */

    window.openAdministrativePanel50 = function () {
        if (!isAdminVerified50()) {
            simpleWin50("Administrative Panel", `
                <h2>Administrative Panel</h2>
                <div class="emerald50-warning">Administrator verification is required. Boot Executive edition through BIOS with an Emerald Games admin account.</div>
            `, "adminPanel50");
            return;
        }

        simpleWin50("Administrative Panel", `
            <h2>Administrative Panel</h2>
            <div class="emerald50-inset">View Emerald Games users and their EmeraldOS cloud file metadata. Password hashes are never displayed.</div>
            <div class="emerald50-toolbar">
                ${input50("admin50Search", "Search users...")}
                ${btn50("Load Users", "admin50LoadUsers()")}
                ${btn50("Clear", "document.getElementById('admin50Users').innerHTML='';document.getElementById('admin50Files').innerHTML='';")}
            </div>
            <div id="admin50Status" class="emerald50-inset">Ready.</div>
            <div class="emerald50-admin-layout">
                <div>
                    <h3>Users</h3>
                    <div id="admin50Users" class="emerald50-admin-list"></div>
                </div>
                <div>
                    <h3>Saved Files</h3>
                    <div id="admin50Files" class="emerald50-admin-list"></div>
                </div>
            </div>
        `, "adminPanel50");

        setTimeout(() => window.admin50LoadUsers(), 100);
    };

    window.admin50LoadUsers = async function () {
        const status = document.getElementById("admin50Status");
        const out = document.getElementById("admin50Users");
        const filter = String(document.getElementById("admin50Search")?.value || "").toLowerCase();
        if (!out) return;
        if (!isAdminVerified50()) {
            out.innerHTML = `<div class="emerald50-warning">Admin verification required.</div>`;
            return;
        }
        try {
            if (status) status.textContent = "Loading users...";
            const snap = await getDocs(collection(db, "users"));
            const users = [];
            snap.forEach(d => {
                const data = d.data() || {};
                const username = data.username || d.id;
                if (filter && !String(username).toLowerCase().includes(filter) && !String(data.role || "").toLowerCase().includes(filter)) return;
                users.push({ id: d.id, username, role: data.role || "user", locked: data.locked === true, created: data.created || data.createdAt || null, lastLogin: data.lastLogin || null });
            });
            users.sort((a,b)=>String(a.username).localeCompare(String(b.username)));
            out.innerHTML = users.length ? users.map(u => `
                <div class="emerald50-user-row">
                    <b>${esc(u.username)}</b><br>
                    Role: ${esc(u.role)} ${u.locked ? "<b class='emerald50-danger'>LOCKED</b>" : ""}<br>
                    <small>Created: ${u.created ? new Date(u.created).toLocaleString() : "Unknown"}</small><br>
                    <small>Last login: ${u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Unknown"}</small><br>
                    ${btn50("View Saved Files", `admin50LoadFiles('${esc(u.username)}')`)}
                </div>
            `).join("") : `<div class="emerald50-inset">No users found.</div>`;
            if (status) status.textContent = `Loaded ${users.length} user(s).`;
        } catch (err) {
            console.error(err);
            out.innerHTML = `<div class="emerald50-warning">Unable to load users. Check Firestore rules and admin permissions.</div>`;
            if (status) status.textContent = "User load failed: " + err.message;
        }
    };

    window.admin50LoadFiles = async function (username) {
        localStorage.setItem(ADMIN_STATE_KEY, username);
        const status = document.getElementById("admin50Status");
        const out = document.getElementById("admin50Files");
        if (!out) return;
        if (!isAdminVerified50()) {
            out.innerHTML = `<div class="emerald50-warning">Admin verification required.</div>`;
            return;
        }
        try {
            if (status) status.textContent = "Loading files for " + username + "...";
            const snap = await getDocs(collection(db, "emeraldOSUsers", username, "drive"));
            const files = [];
            snap.forEach(d => {
                const f = d.data() || {};
                files.push({ id: d.id, name: f.name || d.id, type: f.type || "unknown", parent: f.parent || f.folder || "Desktop", size: f.storageSize || (f.content ? String(f.content).length : 0), storageMode: f.storageMode || (f.hasStorageBlob ? "firebase-storage" : "firestore"), updatedAt: f.updatedAt || null, hasStorageBlob: f.hasStorageBlob === true });
            });
            files.sort((a,b)=>String(a.name).localeCompare(String(b.name)));
            out.innerHTML = `
                <div class="emerald50-inset"><b>${esc(username)}</b> has ${files.length} saved file(s).</div>
                ${files.length ? files.map(f => `
                    <div class="emerald50-file-row">
                        <b>${esc(f.name)}</b><br>
                        <small>ID: ${esc(f.id)}</small><br>
                        Type: ${esc(f.type)}<br>
                        Location: ${esc(f.parent)}<br>
                        Storage: ${esc(f.storageMode)} ${f.hasStorageBlob ? "(large file)" : ""}<br>
                        Size: ${Number(f.size || 0).toLocaleString()} bytes<br>
                        Updated: ${f.updatedAt ? new Date(f.updatedAt).toLocaleString() : "Unknown"}
                    </div>
                `).join("") : `<div class="emerald50-inset">No saved files found for this user.</div>`}
            `;
            if (status) status.textContent = `Loaded ${files.length} file(s) for ${username}.`;
        } catch (err) {
            console.error(err);
            out.innerHTML = `<div class="emerald50-warning">Unable to load files for ${esc(username)}. Firestore security rules may block this account.</div>`;
            if (status) status.textContent = "File load failed: " + err.message;
        }
    };

    window.openCloudGovernance50 = function () {
        if (!isAdminVerified50()) return window.openAdministrativePanel50();
        simpleWin50("Cloud Governance", `
            <h2>Cloud Governance</h2>
            <div class="emerald50-inset">Use Administrative Panel to inspect user file metadata and storage modes.</div>
            ${btn50("Open Administrative Panel", "openAdministrativePanel50()")}
            ${btn50("Storage Manager", "openStorageManager41 && openStorageManager41()")}
            ${btn50("Files Policy", "openFilesPolicy44 && openFilesPolicy44()")}
        `, "cloudGovernance50");
    };

    /* =====================================================
       App registration + consolidation
    ===================================================== */

    function installApps50() {
        if (!window.APPS) return false;
        installCategories50();

        // Keep desktop clean: most document-like tools become suite-only.
        ["notes", "docs", "wordLite46", "sheetLite46", "slidesLite46", "documentVault46", "quickNotes46", "printPreview46"].forEach(id => {
            if (window.APPS[id]) window.APPS[id].hiddenStandalone = true;
        });

        registerApp50("emeraldOffice50", { name:"Emerald Office", icon:"OFF", edition:"economy", category:"office", hiddenStandalone:false, launch:()=>window.openEmeraldOffice50() });
        registerApp50("productivityHub50", { name:"Productivity Hub", icon:"PROD", edition:"home", category:"personal", hiddenStandalone:false, launch:()=>window.openProductivityHub50() });
        registerApp50("securityCenter50", { name:"Security Center", icon:"SEC", edition:"virtue", category:"system", hiddenStandalone:false, launch:()=>window.openSecurityCenter50() });
        registerApp50("systemHub50", { name:"System Hub", icon:"SYS", edition:"virtue", category:"system", hiddenStandalone:false, launch:()=>window.openSystemHub50() });
        registerApp50("creativeHub50", { name:"Creative Hub", icon:"ART", edition:"virtue", category:"creative", hiddenStandalone:false, launch:()=>window.openCreativeHub50() });
        registerApp50("developerHub50", { name:"Developer Hub", icon:"DEV", edition:"developer", category:"developer", hiddenStandalone:false, launch:()=>window.openDeveloperHub50() });
        registerApp50("administrativePanel50", { name:"Administrative Panel", icon:"ADM", edition:"executive", category:"executive", hiddenStandalone:false, launch:()=>window.openAdministrativePanel50() });
        registerApp50("cloudGovernance50", { name:"Cloud Governance", icon:"CLD", edition:"executive", category:"executive", hiddenStandalone:false, launch:()=>window.openCloudGovernance50() });
        registerApp50("userDirectory50", { name:"User Directory", icon:"USR", edition:"executive", category:"executive", hiddenStandalone:true, launch:()=>window.openAdministrativePanel50() });
        registerApp50("fileAudit50", { name:"File Audit", icon:"FIL", edition:"executive", category:"executive", hiddenStandalone:true, launch:()=>window.openCloudGovernance50() });

        setBuild50();
        return true;
    }

    window.repairDesktop50 = function () {
        installApps50();
        try { window.repairDesktop46?.(); } catch {}
        try { window.renderDesktopOverride?.(); } catch {}
        try { window.renderStartMenuOverride?.(); } catch {}
        clearDesktopSelection50();
        window.notify?.("EmeraldOS 5.0", "Desktop consistency repaired.", 2800, "success");
    };

    /* =====================================================
       Terminal patches
    ===================================================== */

    function patchTerminal50() {
        const original = window.runCommand;
        if (typeof original !== "function" || original.__emerald50Wrapped) return;
        const wrapped = async function(cmdLine = "") {
            const raw = String(cmdLine).trim();
            const cmd = raw.toLowerCase();
            let result = null;

            if (["build", "version"].includes(cmd)) result = "EmeraldOS 5.0 - Major Release & Administrative Panel Update";
            if (["office", "emerald.office", "office5"].includes(cmd)) { window.openEmeraldOffice50(); result = "Opened Emerald Office."; }
            if (["writer", "word", "emerald.writer"].includes(cmd)) { window.openOfficeWriter50(); result = "Opened Emerald Writer."; }
            if (["sheets", "sheet"].includes(cmd)) { window.openOfficeSheets50(); result = "Opened Emerald Sheets."; }
            if (["slides"].includes(cmd)) { window.openOfficeSlides50(); result = "Opened Emerald Slides."; }
            if (["admin", "admin.panel", "administrative"].includes(cmd)) { window.openAdministrativePanel50(); result = "Opened Administrative Panel."; }
            if (["security", "security.center"].includes(cmd)) { window.openSecurityCenter50(); result = "Opened Security Center."; }
            if (["desktop.repair50", "repair50"].includes(cmd)) { window.repairDesktop50(); result = "Desktop repaired."; }
            if (["hub", "system.hub"].includes(cmd)) { window.openSystemHub50(); result = "Opened System Hub."; }

            if (result !== null) {
                const output = document.getElementById("terminal_output");
                if (output) {
                    output.innerHTML += `&gt; ${esc(raw)}<br>${esc(result)}<br><br>`;
                    output.scrollTop = output.scrollHeight;
                    const input = document.getElementById("terminal_input");
                    if (input) input.value = "";
                }
                return;
            }
            return original.call(this, cmdLine);
        };
        wrapped.__emerald50Wrapped = true;
        window.runCommand = wrapped;
    }

    function injectStyles50() {
        if (document.getElementById("emerald50-styles")) return;
        const style = document.createElement("style");
        style.id = "emerald50-styles";
        style.textContent = `
            .emerald50-panel{height:100%;box-sizing:border-box;overflow:auto;background:#c0c0c0;color:#000;padding:10px;font-family:"MS Sans Serif",Tahoma,Arial,sans-serif;font-size:12px}
            .emerald50-inset,.emerald50-doc{background:#fff;color:#000;border-top:2px solid #808080;border-left:2px solid #808080;border-right:2px solid #fff;border-bottom:2px solid #fff;padding:8px;margin:6px 0}
            .emerald50-warning{background:#ffffcc;color:#000;border-top:2px solid #808080;border-left:2px solid #808080;border-right:2px solid #fff;border-bottom:2px solid #fff;padding:8px;margin:6px 0}
            .emerald50-danger{color:#a00000}.emerald50-doc pre{white-space:pre-wrap;max-height:140px;overflow:auto;background:#f7f7f7;border:1px solid #999;padding:5px}
            .emerald50-button{background:#c0c0c0;color:#000;border-top:2px solid #fff;border-left:2px solid #fff;border-right:2px solid #808080;border-bottom:2px solid #808080;padding:5px 9px;margin:3px;font-family:inherit;font-size:12px;cursor:default}
            .emerald50-button:active{border-top:2px solid #808080;border-left:2px solid #808080;border-right:2px solid #fff;border-bottom:2px solid #fff}
            .emerald50-input,.emerald50-textarea{width:100%;box-sizing:border-box;background:#fff;color:#000;border:2px inset #fff;padding:5px;margin:4px 0;font-family:inherit;font-size:12px}.emerald50-textarea{height:190px;font-family:"Courier New",monospace;resize:vertical}
            .emerald50-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:6px;margin:8px 0}.emerald50-grid .emerald50-button{text-align:left;min-height:35px;width:100%}
            .emerald50-toolbar{display:flex;gap:4px;align-items:center;flex-wrap:wrap}.emerald50-toolbar .emerald50-input{flex:1;min-width:180px}.emerald50-admin-layout{display:grid;grid-template-columns:1fr 1fr;gap:10px}.emerald50-admin-list{max-height:430px;overflow:auto;background:#d4d0c8;padding:6px;border:2px inset #fff}.emerald50-user-row,.emerald50-file-row{background:#fff;border:1px solid #808080;margin:5px 0;padding:6px}.emerald50-file-row{font-family:"MS Sans Serif",Tahoma,Arial,sans-serif}
            .emerald50-build-badge{background:#008000;color:#fff;padding:2px 6px;border-top:1px solid #fff;border-left:1px solid #fff;border-right:1px solid #404040;border-bottom:1px solid #404040;font-weight:bold;font-size:11px;white-space:nowrap}
            .desktop-item:focus,.emerald46-desktop-item:focus,.icon:focus{outline:none!important}.desktop-item.selected,.emerald46-desktop-item.selected,.icon.selected{background:transparent!important;border:1px solid transparent!important}.desktop-item:hover,.emerald46-desktop-item:hover{background:rgba(0,0,128,.55)!important;border:1px dotted #fff!important}
            @media(max-width:750px){.emerald50-admin-layout{grid-template-columns:1fr}}
        `;
        document.head.appendChild(style);
    }

    function init50() {
        injectStyles50();
        patchDesktopSelection50();
        patchTerminal50();
        if (!installApps50()) { setTimeout(init50, 400); return; }
        setTimeout(() => {
            try { window.renderDesktopOverride?.(); } catch {}
            try { window.renderStartMenuOverride?.(); } catch {}
            clearDesktopSelection50();
        }, 800);
        setTimeout(() => window.repairDesktop50?.(), 1800);
        window.notify?.("EmeraldOS 5.0", "Major release loaded. Administrative Panel and Emerald Office are ready.", 4200, "success");
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", () => setTimeout(init50, 3400));
    } else {
        setTimeout(init50, 3400);
    }
})();
