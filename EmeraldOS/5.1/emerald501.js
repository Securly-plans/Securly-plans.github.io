
"use strict";

/* =========================================================
   EMERALDOS 5.0 PATCH 1
   TEXT FIELD FIXES + ENHANCED WORD PROCESSORS
========================================================= */

(function () {
    if (window.EmeraldOS501Loaded) return;
    window.EmeraldOS501Loaded = true;

    const DOCS_KEY = "40_office_docs";
    const AUTOSAVE_KEY = "40_writer501_autosave";

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

    function getJSON(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key) || ""); }
        catch { return fallback; }
    }

    function setJSON(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function getDocs() {
        return getJSON(DOCS_KEY, []);
    }

    function saveDocs(docs) {
        setJSON(DOCS_KEY, docs.slice(0, 250));
    }

    function win(title, html, app = "") {
        if (typeof window.openWindow === "function") {
            return window.openWindow(title, `<div class="emerald501-panel">${html}</div>`, app);
        }
        alert(title);
        return null;
    }

    function editorHTML(title = "Untitled Document", body = "") {
        return `
            <div class="emerald501-shell">
                <div class="emerald501-toolbar">
                    <button onclick="writer501Command('bold')"><b>B</b></button>
                    <button onclick="writer501Command('italic')"><i>I</i></button>
                    <button onclick="writer501Command('underline')"><u>U</u></button>
                    <button onclick="writer501Command('insertUnorderedList')">Bullets</button>
                    <button onclick="writer501Command('insertOrderedList')">Numbering</button>
                    <button onclick="writer501Command('justifyLeft')">Left</button>
                    <button onclick="writer501Command('justifyCenter')">Center</button>
                    <button onclick="writer501Command('justifyRight')">Right</button>
                    <select onchange="writer501Block(this.value);this.value=''">
                        <option value="">Format</option>
                        <option value="P">Paragraph</option>
                        <option value="H1">Heading 1</option>
                        <option value="H2">Heading 2</option>
                        <option value="H3">Heading 3</option>
                    </select>
                    <select onchange="writer501FontSize(this.value);this.value=''">
                        <option value="">Size</option>
                        <option value="2">Small</option>
                        <option value="3">Normal</option>
                        <option value="4">Large</option>
                        <option value="5">Title</option>
                    </select>
                    <input type="color" title="Text color" onchange="writer501Command('foreColor', this.value)">
                    <button onclick="writer501InsertDate()">Date</button>
                    <button onclick="writer501InsertSignature()">Signature</button>
                </div>

                <div class="emerald501-findbar">
                    <input id="writer501Title" class="emerald501-title" value="${esc(title)}" placeholder="Document title">
                    <input id="writer501Find" placeholder="Find text">
                    <input id="writer501Replace" placeholder="Replace with">
                    <button onclick="writer501FindText()">Find</button>
                    <button onclick="writer501ReplaceText()">Replace</button>
                    <button onclick="writer501Template('letter')">Letter</button>
                    <button onclick="writer501Template('memo')">Memo</button>
                    <button onclick="writer501Template('policy')">Policy</button>
                    <button onclick="writer501Save()">Save</button>
                    <button onclick="writer501ExportText()">Export TXT</button>
                    <button onclick="writer501ExportHTML()">Export HTML</button>
                    <button onclick="window.print()">Print</button>
                    <button onclick="openOfficeVault501()">Vault</button>
                </div>

                <div class="emerald501-paper-wrap">
                    <div id="writer501Editor" class="emerald501-editor" contenteditable="true" spellcheck="true">${body || ""}</div>
                </div>

                <div class="emerald501-statusbar">
                    <span id="writer501Status">Ready.</span>
                    <span id="writer501Count">0 words</span>
                </div>
            </div>
        `;
    }

    function getEditor() {
        return document.getElementById("writer501Editor");
    }

    function getTitle() {
        return document.getElementById("writer501Title")?.value?.trim() || "Untitled Document";
    }

    function updateCount() {
        const text = stripHTML(getEditor()?.innerHTML || "").trim();
        const words = text ? text.split(/\s+/).length : 0;
        const chars = text.length;
        const count = document.getElementById("writer501Count");
        if (count) count.textContent = `${words} words / ${chars} characters`;
    }

    function setStatus(message) {
        const status = document.getElementById("writer501Status");
        if (status) status.textContent = message;
    }

    window.writer501Command = function (command, value = null) {
        getEditor()?.focus();
        document.execCommand(command, false, value);
        updateCount();
    };

    window.writer501Block = function (tag) {
        if (!tag) return;
        getEditor()?.focus();
        document.execCommand("formatBlock", false, tag);
        updateCount();
    };

    window.writer501FontSize = function (size) {
        if (!size) return;
        getEditor()?.focus();
        document.execCommand("fontSize", false, size);
        updateCount();
    };

    window.writer501InsertDate = function () {
        getEditor()?.focus();
        document.execCommand("insertText", false, new Date().toLocaleDateString());
        updateCount();
    };

    window.writer501InsertSignature = function () {
        getEditor()?.focus();
        const username = localStorage.getItem("40_username") || localStorage.getItem("username") || "EmeraldOS User";
        document.execCommand("insertHTML", false, `<br><br>Sincerely,<br>${esc(username)}`);
        updateCount();
    };

    window.writer501Template = function (type) {
        const editor = getEditor();
        if (!editor) return;
        const today = new Date().toLocaleDateString();
        const templates = {
            letter: `<p>${today}</p><p>Dear Recipient,</p><p>Write your letter here.</p><p>Sincerely,<br>${esc(localStorage.getItem("40_username") || "EmeraldOS User")}</p>`,
            memo: `<h2>Memo</h2><p><b>Date:</b> ${today}<br><b>To:</b> Team<br><b>From:</b> ${esc(localStorage.getItem("40_username") || "EmeraldOS User")}<br><b>Subject:</b> Update</p><p>Write memo details here.</p>`,
            policy: `<h1>Policy Document</h1><p><b>Effective Date:</b> ${today}</p><h2>Purpose</h2><p>Describe the purpose.</p><h2>Policy</h2><p>Write the policy here.</p>`
        };
        editor.innerHTML = templates[type] || "";
        updateCount();
        autosave();
    };

    window.writer501Save = function () {
        const editor = getEditor();
        if (!editor) return;
        const docs = getDocs();
        const doc = {
            id: "doc501_" + Date.now(),
            type: "Document",
            title: getTitle(),
            body: stripHTML(editor.innerHTML),
            html: editor.innerHTML,
            savedAt: Date.now(),
            patch: "5.0.1"
        };
        docs.unshift(doc);
        saveDocs(docs);
        setStatus("Saved " + new Date().toLocaleTimeString());
        window.notify?.("Emerald Writer", "Document saved to Vault.", 2600, "success");
    };

    window.writer501ExportText = function () {
        const text = stripHTML(getEditor()?.innerHTML || "");
        downloadFile(getTitle().replace(/[^a-z0-9_ -]/gi, "_") + ".txt", text, "text/plain");
    };

    window.writer501ExportHTML = function () {
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${esc(getTitle())}</title></head><body>${getEditor()?.innerHTML || ""}</body></html>`;
        downloadFile(getTitle().replace(/[^a-z0-9_ -]/gi, "_") + ".html", html, "text/html");
    };

    window.writer501FindText = function () {
        const needle = document.getElementById("writer501Find")?.value;
        if (!needle) return;
        getEditor()?.focus();
        const found = window.find ? window.find(needle) : false;
        setStatus(found ? "Found text." : "Text not found.");
    };

    window.writer501ReplaceText = function () {
        const find = document.getElementById("writer501Find")?.value;
        const replace = document.getElementById("writer501Replace")?.value || "";
        const editor = getEditor();
        if (!find || !editor) return;
        editor.innerHTML = editor.innerHTML.split(esc(find)).join(esc(replace));
        editor.innerHTML = editor.innerHTML.split(find).join(replace);
        updateCount();
        setStatus("Replace complete.");
    };

    function autosave() {
        const editor = getEditor();
        if (!editor) return;
        setJSON(AUTOSAVE_KEY, {
            title: getTitle(),
            html: editor.innerHTML,
            savedAt: Date.now()
        });
        setStatus("Autosaved " + new Date().toLocaleTimeString());
    }

    function downloadFile(name, content, type) {
        const blob = new Blob([content], { type });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }

    window.openOfficeWriter501 = function (docId = null) {
        let title = "Untitled Document";
        let body = "<p>Start writing here...</p>";
        if (docId) {
            const doc = getDocs().find(d => d.id === docId);
            if (doc) {
                title = doc.title;
                body = doc.html || esc(doc.body || "").replace(/\n/g, "<br>");
            }
        } else {
            const autosaved = getJSON(AUTOSAVE_KEY, null);
            if (autosaved?.html) {
                title = autosaved.title || title;
                body = autosaved.html;
            }
        }
        const w = win("Emerald Writer Pro", editorHTML(title, body), "officeWriter501");
        setTimeout(() => {
            const editor = getEditor();
            if (editor) {
                editor.addEventListener("input", () => { updateCount(); clearTimeout(editor.__saveTimer); editor.__saveTimer = setTimeout(autosave, 900); });
                editor.addEventListener("keyup", updateCount);
                editor.addEventListener("mouseup", updateCount);
                updateCount();
            }
        }, 50);
        return w;
    };

    window.openOfficeVault501 = function () {
        const docs = getDocs();
        win("Document Vault", `
            <h2>Document Vault</h2>
            <div class="emerald501-inset">Patch 1 vault supports rich Writer Pro documents, old 5.0 documents, sheets, and slides.</div>
            ${docs.length ? docs.map(d => `
                <div class="emerald501-doc-card">
                    <b>${esc(d.title)}</b><br>
                    <small>${esc(d.type || "Document")} - ${new Date(d.savedAt || Date.now()).toLocaleString()}</small>
                    <div class="emerald501-doc-preview">${d.html || esc(d.body || "").replace(/\n/g,"<br>")}</div>
                    <button onclick="openOfficeWriter501('${esc(d.id)}')">Open</button>
                    <button onclick="deleteOfficeDoc501('${esc(d.id)}')">Delete</button>
                </div>
            `).join("") : `<div class="emerald501-inset">No documents saved yet.</div>`}
        `, "officeVault501");
    };

    window.deleteOfficeDoc501 = function (id) {
        if (!confirm("Delete this document from the local vault?")) return;
        saveDocs(getDocs().filter(d => d.id !== id));
        window.openOfficeVault501();
    };

    window.openEmeraldOffice501 = function () {
        win("Emerald Office Patch 1", `
            <h2>Emerald Office</h2>
            <div class="emerald501-inset">EmeraldOS 5.0 Patch 1 fixes text fields and upgrades Writer into a richer word processor.</div>
            <div class="emerald501-grid">
                <button onclick="openOfficeWriter501()">Emerald Writer Pro</button>
                <button onclick="openOfficeSheets50?.()">Emerald Sheets</button>
                <button onclick="openOfficeSlides50?.()">Emerald Slides</button>
                <button onclick="openOfficeVault501()">Document Vault</button>
                <button onclick="openFileExplorer?.()">Files</button>
                <button onclick="openProductivityHub50?.()">Productivity Hub</button>
            </div>
        `, "emeraldOffice501");
    };

    function installAppOverrides() {
        if (!window.APPS) return false;
        const app = {
            name: "Emerald Office",
            icon: "OFFICE",
            edition: "economy",
            category: "office",
            launch: () => window.openEmeraldOffice501()
        };
        window.APPS.emeraldOffice50 = app;
        window.APPS.emeraldOffice501 = app;
        window.APPS.officeWriter50 = {
            name: "Emerald Writer Pro",
            icon: "WORD+",
            edition: "economy",
            category: "office",
            launch: () => window.openOfficeWriter501()
        };
        window.APPS.officeVault501 = {
            name: "Document Vault",
            icon: "VAULT",
            edition: "economy",
            category: "office",
            launch: () => window.openOfficeVault501()
        };
        return true;
    }

    function patchOldFunctions() {
        window.openEmeraldOffice50 = window.openEmeraldOffice501;
        window.openOfficeWriter50 = window.openOfficeWriter501;
        window.openOfficeVault50 = window.openOfficeVault501;
    }

    function patchTerminal() {
        const original = window.runCommand;
        if (typeof original !== "function" || original.__emerald501Wrapped) return;
        const wrapped = function (cmdLine) {
            const cmd = String(cmdLine || "").trim().toLowerCase();
            if (["writer", "word", "office.writer", "writerpro", "writer.pro"].includes(cmd)) {
                window.openOfficeWriter501();
                return;
            }
            if (["office", "emeraldoffice", "office.patch"].includes(cmd)) {
                window.openEmeraldOffice501();
                return;
            }
            if (["vault", "documents", "doc.vault"].includes(cmd)) {
                window.openOfficeVault501();
                return;
            }
            if (cmd === "patch" || cmd === "version") {
                window.terminalPrint?.("EmeraldOS 5.0 Patch 1");
                return;
            }
            return original.call(this, cmdLine);
        };
        wrapped.__emerald501Wrapped = true;
        window.runCommand = wrapped;
    }

    function fixEditableEvents() {
        // Prevent desktop/window drag behaviors from stealing focus from editors.
        document.addEventListener("mousedown", e => {
            const editable = e.target.closest?.("input, textarea, select, [contenteditable='true'], .emerald501-editor");
            if (!editable) return;
            editable.__emeraldEditing = true;
        }, true);

        document.addEventListener("focusin", e => {
            if (e.target.matches?.("input, textarea, select, [contenteditable='true']")) {
                document.body.classList.add("emerald501-editing");
            }
        });

        document.addEventListener("focusout", e => {
            if (e.target.matches?.("input, textarea, select, [contenteditable='true']")) {
                setTimeout(() => {
                    if (!document.activeElement?.matches?.("input, textarea, select, [contenteditable='true']")) {
                        document.body.classList.remove("emerald501-editing");
                    }
                }, 50);
            }
        });
    }

    function applyBuildLabel() {
        try { localStorage.setItem("40_build_name", "EmeraldOS 5.0 Patch 1"); } catch {}
        try { localStorage.setItem("40_version", "5.0.1"); } catch {}
        try { window.EmeraldOSRegistry?.set?.("HKEY_LOCAL_MACHINE\\System\\Build\\Version", "5.0.1"); } catch {}
        const badge = document.getElementById("emerald40-build-badge");
        if (badge) badge.innerHTML = `<span class="emerald50-build-badge">EmeraldOS 5.0 P1</span>`;
        document.title = "EmeraldOS 5.0 Patch 1";
    }

    function init() {
        applyBuildLabel();
        fixEditableEvents();
        patchOldFunctions();
        patchTerminal();
        if (!installAppOverrides()) { setTimeout(init, 400); return; }
        setTimeout(() => {
            patchOldFunctions();
            patchTerminal();
            try { window.renderDesktopOverride?.(); } catch {}
            try { window.renderStartMenuOverride?.(); } catch {}
            window.notify?.("EmeraldOS Patch", "5.0 Patch 1 loaded. Text fields and Writer Pro fixed.", 3500, "success");
        }, 700);
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
