
"use strict";

/* =========================================================
   EMERALDOS 4.6
   OFFICE SUITE + DESKTOP CONSISTENCY UPDATE
========================================================= */
(function () {
    if (window.EmeraldOS46Loaded) {
        console.warn("EmeraldOS 4.6 already loaded.");
        return;
    }
    window.EmeraldOS46Loaded = true;

    const BUILD_46 = {
        product: "EmeraldOS",
        displayName: "EmeraldOS 4.6",
        version: "4.6",
        channel: "Stable",
        codename: "Office Suite & Desktop Consistency Update"
    };

    const POS_FOLDER_KEY = "40_desktop_folder_positions_46";
    const POS_FILE_KEY = "40_desktop_file_positions_46";
    const POS_PIN_KEY = "40_desktop_pin_positions_46";
    const PIN_START_KEY = "40_pinned_start_apps";
    const PIN_DESKTOP_KEY = "40_pinned_desktop_apps";
    const PIN_TASKBAR_KEY = "40_pinned_taskbar_apps";
    const DOCS_KEY = "40_emerald360_docs_46";

    const DEFAULT_CATEGORIES_46 = {
        essential: { id: "essential", name: "Essential Apps", icon: "📁", edition: "economy", order: 1, description: "Core OS tools, Files, Help, Plans, and system basics." },
        office: { id: "office", name: "Office Apps", icon: "📁", edition: "economy", order: 2, description: "Emerald 360 Hub, Word Lite, Sheet Lite, Slides Lite, and document tools." },
        personal: { id: "personal", name: "Home Apps", icon: "📁", edition: "home", order: 3, description: "Home, planning, checklist, budget, recipes, reading, and personal tools." },
        internet: { id: "internet", name: "Internet Apps", icon: "📁", edition: "business", order: 4, description: "Browser, chat, bookmarks, web and network tools." },
        business: { id: "business", name: "Business Apps", icon: "📁", edition: "business", order: 5, description: "Business Center, reports, contacts, mail, projects, invoices, and productivity." },
        creative: { id: "creative", name: "Creative Apps", icon: "📁", edition: "virtue", order: 6, description: "Media, paint, audio, icon, color, gallery, and creative tools." },
        system: { id: "system", name: "System Apps", icon: "📁", edition: "virtue", order: 7, description: "System controls, display, keyboard, desktop repair, input and settings." },
        developer: { id: "developer", name: "Developer Apps", icon: "📁", edition: "developer", order: 8, description: "Terminal, registry, code, debugging, packages, deployment, and diagnostics." },
        executive: { id: "executive", name: "Executive Apps", icon: "📁", edition: "executive", order: 9, description: "Executive, policy, audit, fleet, licensing, and admin-level tools." }
    };

    const CONSOLIDATE_46 = {
        emerald36046: ["emerald36045", "writerBasic45", "letterPad45", "documentReader45", "textComposer45", "spreadsheetBasic45", "presentationBasic45", "writingStudio", "viewerStudio", "notes", "docs"],
        homeSuite46: ["homeCenter45", "personalPlanner45", "budgetLite45", "householdChecklist45", "recipeBox45", "readingList45", "photoAlbum45", "familyCalendar45", "bookmarkShelf45"],
        businessSuite46: ["businessCenter45", "workspace", "projectPlanner", "invoiceBuilder", "taskBoard", "mailDrafts", "contacts", "reports", "reportsCenter41", "contactsBook"],
        mediaSuite46: ["media", "mediaStudio41", "imageGallery41", "photoAlbum45", "audioNotes", "svgViewer41", "imageInspector"],
        systemSuite46: ["system", "systemControl43", "displaySettings43", "keyboardMouse43", "controllerCenter43", "desktopRepair43", "desktopConsistency45", "desktopSync42", "sessionManager42", "startupManager42", "pinManager42"],
        developerSuite46: ["terminal", "devtools", "registryEditor", "codeStudio", "debugConsole", "buildInspector", "scriptLab", "apiTester", "logViewer", "services", "jsonStudio", "packageManager"]
    };

    function esc(v) {
        return String(v ?? "")
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
        scheduleLayoutSync46();
    }

    function editionCan(required = "economy") {
        if (typeof window.canSeeEdition === "function") return window.canSeeEdition(required);
        return true;
    }

    function canSeeApp46(appOrId) {
        const app = typeof appOrId === "string" ? window.APPS?.[appOrId] : appOrId;
        if (!app) return false;
        if (app.hiddenStandalone === true) return false;
        return editionCan(app.edition || "economy");
    }

    function appExists46(appId) {
        return !!window.APPS?.[appId];
    }

    function registerApp46(id, app) {
        if (!window.APPS) return false;
        window.APPS[id] = Object.assign({ edition: "economy", category: "essential" }, window.APPS[id] || {}, app);
        return true;
    }

    function simpleWin46(title, html, appId = "emerald46") {
        if (typeof window.openWindow === "function") {
            window.openWindow(title, `<div class="emerald46-panel">${html}</div>`, appId);
        }
    }

    function btn46(label, action) {
        return `<button class="emerald46-button" onclick="${action}">${esc(label)}</button>`;
    }

    function input46(id, placeholder = "") {
        return `<input class="emerald46-input" id="${esc(id)}" placeholder="${esc(placeholder)}">`;
    }

    function text46(id, placeholder = "") {
        return `<textarea class="emerald46-textarea" id="${esc(id)}" placeholder="${esc(placeholder)}"></textarea>`;
    }

    function getDocs46() { return getJSON(DOCS_KEY, []); }
    function saveDocs46(list) { setJSON(DOCS_KEY, list); }

    window.saveOfficeDoc46 = function(type = "Document") {
        const title = document.getElementById("office46Title")?.value?.trim() || type + " " + new Date().toLocaleString();
        const body = document.getElementById("office46Body")?.value || document.getElementById("office46Sheet")?.value || document.getElementById("office46Slides")?.value || "";
        const docs = getDocs46();
        docs.unshift({ id: "doc_" + Date.now(), type, title, body, savedAt: Date.now() });
        saveDocs46(docs.slice(0, 80));
        window.notify?.("Emerald 360", type + " saved.", 2600, "success");
    };

    window.openWordLite46 = function () {
        simpleWin46("Word Lite", `
            <h2>Word Lite</h2>
            <div class="emerald46-inset">Economy edition word processor. Saves into Emerald 360 Hub.</div>
            ${input46("office46Title", "Document title")}
            ${text46("office46Body", "Start writing...")}
            ${btn46("Save Document", "saveOfficeDoc46('Document')")}
            ${btn46("Open Emerald 360", "openEmerald36046()")}
        `, "wordLite46");
    };

    window.openSheetLite46 = function () {
        simpleWin46("Sheet Lite", `
            <h2>Sheet Lite</h2>
            <div class="emerald46-inset">Simple CSV-style spreadsheet editor.</div>
            ${input46("office46Title", "Sheet title")}
            <textarea class="emerald46-textarea" id="office46Sheet" placeholder="Name,Value\nExample,100"></textarea>
            ${btn46("Save Sheet", "saveOfficeDoc46('Sheet')")}
            ${btn46("Open Emerald 360", "openEmerald36046()")}
        `, "sheetLite46");
    };

    window.openSlidesLite46 = function () {
        simpleWin46("Slides Lite", `
            <h2>Slides Lite</h2>
            <div class="emerald46-inset">Basic presentation notes. Separate slides with ---.</div>
            ${input46("office46Title", "Presentation title")}
            <textarea class="emerald46-textarea" id="office46Slides" placeholder="Title Slide\n---\nSecond Slide"></textarea>
            ${btn46("Save Presentation", "saveOfficeDoc46('Presentation')")}
            ${btn46("Open Emerald 360", "openEmerald36046()")}
        `, "slidesLite46");
    };

    window.openDocumentVault46 = function () {
        const docs = getDocs46();
        simpleWin46("Document Vault", `
            <h2>Document Vault</h2>
            ${docs.length ? docs.map(d => `
                <div class="emerald46-doc">
                    <b>${esc(d.title)}</b> <small>${esc(d.type)} - ${new Date(d.savedAt).toLocaleString()}</small>
                    <pre>${esc(d.body)}</pre>
                </div>
            `).join("") : `<div class="emerald46-inset">No documents saved yet.</div>`}
        `, "documentVault46");
    };

    window.openEmerald36046 = function () {
        simpleWin46("Emerald 360", `
            <h2>Emerald 360</h2>
            <div class="emerald46-inset">Consolidated EmeraldOS productivity suite. Includes word processing, sheets, slides, notes, documents, and saved documents.</div>
            <div class="emerald46-grid">
                ${btn46("Word Lite", "openWordLite46()")}
                ${btn46("Sheet Lite", "openSheetLite46()")}
                ${btn46("Slides Lite", "openSlidesLite46()")}
                ${btn46("Document Vault", "openDocumentVault46()")}
                ${btn46("Notes", "openNotes && openNotes()")}
                ${btn46("Docs", "openDocs && openDocs()")}
                ${btn46("Writer Basic", "openWriterBasic45 ? openWriterBasic45() : openWordLite46()")}
                ${btn46("Document Reader", "openDocumentReader45 ? openDocumentReader45() : openDocumentVault46()")}
            </div>
        `, "emerald36046");
    };

    window.openHomeSuite46 = function () {
        simpleWin46("Home Suite", `
            <h2>Home Suite</h2>
            <div class="emerald46-inset">Personal and home organization tools consolidated into one place.</div>
            <div class="emerald46-grid">
                ${btn46("Personal Planner", "openPersonalPlanner45 ? openPersonalPlanner45() : openCalendar()")}
                ${btn46("Budget Lite", "openBudgetLite45 ? openBudgetLite45() : openSheetLite46()")}
                ${btn46("Household Checklist", "openHouseholdChecklist45 ? openHouseholdChecklist45() : openWordLite46()")}
                ${btn46("Recipe Box", "openRecipeBox45 ? openRecipeBox45() : openWordLite46()")}
                ${btn46("Reading List", "openReadingList45 ? openReadingList45() : openWordLite46()")}
                ${btn46("Family Calendar", "openFamilyCalendar45 ? openFamilyCalendar45() : openCalendar()")}
                ${btn46("Bookmarks", "openBookmarkShelf45 ? openBookmarkShelf45() : openBrowser()")}
            </div>
        `, "homeSuite46");
    };

    window.openBusinessSuite46 = function () {
        simpleWin46("Business Suite", `
            <h2>Business Suite</h2>
            <div class="emerald46-grid">
                ${btn46("Workspace", "openBusinessWorkspace ? openBusinessWorkspace() : openEmerald36046()")}
                ${btn46("Project Planner", "openProjectPlanner ? openProjectPlanner() : openWordLite46()")}
                ${btn46("Invoice Builder", "openInvoiceBuilder ? openInvoiceBuilder() : openSheetLite46()")}
                ${btn46("Reports", "openReportsCenterT5 ? openReportsCenterT5() : openDocumentVault46()")}
                ${btn46("Contacts", "openContactsBookT5 ? openContactsBookT5() : openWordLite46()")}
                ${btn46("Presentation", "openPresentationBasic45 ? openPresentationBasic45() : openSlidesLite46()")}
            </div>
        `, "businessSuite46");
    };

    window.openMediaSuite46 = function () {
        simpleWin46("Media Suite", `
            <h2>Media Suite</h2>
            <div class="emerald46-grid">
                ${btn46("Media Player", "launchApp && launchApp('media')")}
                ${btn46("Image Gallery", "openImageGallery41 ? openImageGallery41() : openFileExplorer('Pictures')")}
                ${btn46("Audio Notes", "openAudioNotes426 ? openAudioNotes426() : (openAudioNotes && openAudioNotes())")}
                ${btn46("Paint", "openPaint && openPaint()")}
                ${btn46("SVG Viewer", "openSVGViewer41 ? openSVGViewer41() : openFileExplorer()")}
            </div>
        `, "mediaSuite46");
    };

    window.openSystemSuite46 = function () {
        simpleWin46("System Suite", `
            <h2>System Suite</h2>
            <div class="emerald46-grid">
                ${btn46("System Control", "openSystemControlCenter42 ? openSystemControlCenter42() : openSystemApp()")}
                ${btn46("Display Settings", "openDisplaySettings43 ? openDisplaySettings43() : (openDisplaySettings42 && openDisplaySettings42())")}
                ${btn46("Keyboard & Mouse", "openKeyboardMouse43 && openKeyboardMouse43()")}
                ${btn46("Controller Center", "openControllerCenter43 && openControllerCenter43()")}
                ${btn46("Desktop Repair", "openDesktopRepair43 ? openDesktopRepair43() : repairDesktop46()")}
                ${btn46("Pin Manager", "openAppPinManager42 && openAppPinManager42()")}
                ${btn46("Startup Manager", "openStartupManager42 && openStartupManager42()")}
            </div>
        `, "systemSuite46");
    };

    window.openDeveloperSuite46 = function () {
        simpleWin46("Developer Suite", `
            <h2>Developer Suite</h2>
            <div class="emerald46-grid">
                ${btn46("Terminal", "openTerminal && openTerminal()")}
                ${btn46("Registry", "openRegistryEditor && openRegistryEditor()")}
                ${btn46("Code Studio", "openCodeStudio && openCodeStudio()")}
                ${btn46("Debug Console", "openDebugConsole && openDebugConsole()")}
                ${btn46("Package Manager", "openPackageManager && openPackageManager()")}
                ${btn46("API Tester", "openAPITester && openAPITester()")}
                ${btn46("Log Viewer", "openLogViewer && openLogViewer()")}
            </div>
        `, "developerSuite46");
    };

    window.openEmeraldAssistant46 = function () {
        const enabled = localStorage.getItem("40_assistant_enabled") === "true";
        simpleWin46("Emerald Assistant", `
            <h2>Emerald Assistant</h2>
            <div class="emerald46-inset">Optional Clippy-style assistant. It only contacts an OpenAI-compatible API if you add your own API key. Leave it disabled for no network calls.</div>
            <label><input type="checkbox" id="assistant46Enabled" ${enabled ? "checked" : ""}> Enable assistant</label>
            ${input46("assistant46Key", "Optional API key - stored locally")}
            <textarea class="emerald46-textarea" id="assistant46Prompt" placeholder="Ask for help with EmeraldOS..."></textarea>
            <div class="emerald46-row">
                ${btn46("Save Settings", "saveAssistantSettings46()")}
                ${btn46("Ask", "askAssistant46()")}
                ${btn46("Desktop Tip", "assistantTip46()")}
            </div>
            <div class="emerald46-inset" id="assistant46Output">Assistant output appears here.</div>
        `, "assistant46");
        setTimeout(() => {
            const key = localStorage.getItem("40_assistant_api_key") || "";
            const input = document.getElementById("assistant46Key");
            if (input) input.value = key;
        }, 60);
    };

    window.saveAssistantSettings46 = function () {
        localStorage.setItem("40_assistant_enabled", document.getElementById("assistant46Enabled")?.checked ? "true" : "false");
        localStorage.setItem("40_assistant_api_key", document.getElementById("assistant46Key")?.value || "");
        window.notify?.("Emerald Assistant", "Settings saved.", 2500, "success");
    };

    window.assistantTip46 = function () {
        const tips = [
            "Double-click Office Apps to open Emerald 360 and writing tools.",
            "Right-click the desktop to create files, upload files, open settings, or repair the layout.",
            "Use Ctrl+Space to open Quick Launcher if available.",
            "Pin only the apps you use often. App folders keep the desktop clean.",
            "Use Desktop Repair if icons ever overlap or disappear."
        ];
        const out = document.getElementById("assistant46Output");
        if (out) out.textContent = tips[Math.floor(Math.random() * tips.length)];
    };

    window.askAssistant46 = async function () {
        const out = document.getElementById("assistant46Output");
        const enabled = document.getElementById("assistant46Enabled")?.checked;
        const key = document.getElementById("assistant46Key")?.value || localStorage.getItem("40_assistant_api_key") || "";
        const prompt = document.getElementById("assistant46Prompt")?.value || "";
        if (!enabled) { if (out) out.textContent = "Assistant is disabled. Enable it first."; return; }
        if (!key) { if (out) out.textContent = "No API key configured. Add a key, or use Desktop Tip for offline help."; return; }
        if (!prompt.trim()) { if (out) out.textContent = "Enter a question first."; return; }
        if (out) out.textContent = "Contacting assistant...";
        try {
            const res = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
                body: JSON.stringify({ model: "gpt-4o-mini", messages: [
                    { role: "system", content: "You are Emerald Assistant, a concise helper for EmeraldOS users." },
                    { role: "user", content: prompt }
                ]})
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || "API request failed");
            if (out) out.textContent = data.choices?.[0]?.message?.content || "No response.";
        } catch (err) {
            if (out) out.textContent = "Assistant error: " + err.message;
        }
    };

    function installCategories46() {
        window.EMERALDOS_APP_CATEGORIES = Object.assign({}, DEFAULT_CATEGORIES_46, window.EMERALDOS_APP_CATEGORIES || {});
        Object.keys(DEFAULT_CATEGORIES_46).forEach(id => {
            window.EMERALDOS_APP_CATEGORIES[id] = Object.assign({}, DEFAULT_CATEGORIES_46[id], window.EMERALDOS_APP_CATEGORIES[id] || {});
        });
        // Force Office Apps into Economy so it always appears when Emerald 360 exists.
        window.EMERALDOS_APP_CATEGORIES.office.edition = "economy";
        window.EMERALDOS_APP_CATEGORIES.office.name = "Office Apps";
    }

    function consolidateApps46() {
        Object.values(CONSOLIDATE_46).flat().forEach(id => {
            if (window.APPS?.[id]) {
                window.APPS[id].hiddenStandalone = true;
                window.APPS[id].suiteParent = "emerald46";
            }
        });
    }

    function installApps46() {
        if (!window.APPS) return false;
        installCategories46();
        consolidateApps46();

        // Keep core visible in Essential, but push office/work equivalents into suites.
        if (window.APPS.files) Object.assign(window.APPS.files, { edition: "economy", category: "essential", hiddenStandalone: false });
        if (window.APPS.plans) Object.assign(window.APPS.plans, { edition: "economy", category: "essential", hiddenStandalone: false });
        if (window.APPS.about) Object.assign(window.APPS.about, { edition: "economy", category: "essential", hiddenStandalone: false });

        registerApp46("emerald36046", { name: "Emerald 360", icon: "360", edition: "economy", category: "office", hiddenStandalone: false, launch: () => window.openEmerald36046() });
        registerApp46("wordLite46", { name: "Word Lite", icon: "WRD", edition: "economy", category: "office", hiddenStandalone: true, launch: () => window.openWordLite46() });
        registerApp46("sheetLite46", { name: "Sheet Lite", icon: "SHT", edition: "economy", category: "office", hiddenStandalone: true, launch: () => window.openSheetLite46() });
        registerApp46("slidesLite46", { name: "Slides Lite", icon: "SLD", edition: "economy", category: "office", hiddenStandalone: true, launch: () => window.openSlidesLite46() });
        registerApp46("documentVault46", { name: "Document Vault", icon: "DOC", edition: "economy", category: "office", hiddenStandalone: true, launch: () => window.openDocumentVault46() });

        registerApp46("homeSuite46", { name: "Home Suite", icon: "HOME", edition: "home", category: "personal", hiddenStandalone: false, launch: () => window.openHomeSuite46() });
        registerApp46("businessSuite46", { name: "Business Suite", icon: "BIZ", edition: "business", category: "business", hiddenStandalone: false, launch: () => window.openBusinessSuite46() });
        registerApp46("mediaSuite46", { name: "Media Suite", icon: "MED", edition: "virtue", category: "creative", hiddenStandalone: false, launch: () => window.openMediaSuite46() });
        registerApp46("systemSuite46", { name: "System Suite", icon: "SYS", edition: "virtue", category: "system", hiddenStandalone: false, launch: () => window.openSystemSuite46() });
        registerApp46("developerSuite46", { name: "Developer Suite", icon: "DEV", edition: "developer", category: "developer", hiddenStandalone: false, launch: () => window.openDeveloperSuite46() });
        registerApp46("assistant46", { name: "Emerald Assistant", icon: "?", edition: "home", category: "essential", hiddenStandalone: false, launch: () => window.openEmeraldAssistant46() });
        registerApp46("quickNotes46", { name: "Quick Notes", icon: "QNT", edition: "economy", category: "office", hiddenStandalone: true, launch: () => window.openWordLite46() });
        registerApp46("printPreview46", { name: "Print Preview", icon: "PRN", edition: "home", category: "office", hiddenStandalone: true, launch: () => simpleWin46("Print Preview", "<h2>Print Preview</h2><div class='emerald46-inset'>Basic print preview placeholder for Emerald 360 documents.</div>", "printPreview46") });

        try { window.EMERALDOS_BUILD = Object.assign(window.EMERALDOS_BUILD || {}, BUILD_46); } catch {}
        try { localStorage.setItem("40_build_name", BUILD_46.displayName); } catch {}
        try { localStorage.setItem("40_version", BUILD_46.version); } catch {}
        try { localStorage.setItem("40_build_codename", BUILD_46.codename); } catch {}
        try { window.EmeraldOSRegistry?.set?.("HKEY_LOCAL_MACHINE\\System\\Build\\Version", "4.6"); } catch {}
        try { window.EmeraldOSRegistry?.set?.("HKEY_LOCAL_MACHINE\\Software\\EmeraldOS\\Office\\Emerald360", "4.6 Hub"); } catch {}
        document.title = BUILD_46.displayName;
        return true;
    }

    function getVisibleAppEntries46() {
        return Object.entries(window.APPS || {})
            .filter(([id, app]) => canSeeApp46(app))
            .sort((a,b) => String(a[1].name || a[0]).localeCompare(String(b[1].name || b[0])));
    }

    function getCategories46() {
        installCategories46();
        return window.EMERALDOS_APP_CATEGORIES || DEFAULT_CATEGORIES_46;
    }

    function getAppsForCategory46(categoryId) {
        return getVisibleAppEntries46().filter(([id, app]) => (app.category || "essential") === categoryId);
    }

    function getVisibleCategories46() {
        return Object.values(getCategories46())
            .filter(cat => editionCan(cat.edition || "economy") && getAppsForCategory46(cat.id).length > 0)
            .sort((a,b) => (a.order || 99) - (b.order || 99));
    }

    function defaultPos(index) {
        const col = Math.floor(index / 7);
        const row = index % 7;
        return { left: 18 + col * 98, top: 16 + row * 88 };
    }

    function movableDesktopItem(opts) {
        const desktop = document.getElementById("desktop");
        if (!desktop) return null;
        const positions = getJSON(opts.storageKey, {});
        const pos = positions[opts.posKey] || defaultPos(opts.index || 0);
        const el = document.createElement("div");
        el.className = "desktop-item emerald46-desktop-item " + (opts.className || "");
        el.dataset.key = opts.posKey;
        if (opts.appId) el.dataset.appId = opts.appId;
        if (opts.fileId) el.dataset.fileId = opts.fileId;
        el.style.position = "absolute";
        el.style.left = (parseInt(pos.left,10)||0) + "px";
        el.style.top = (parseInt(pos.top,10)||0) + "px";
        el.innerHTML = `<div class="desktop-icon-symbol">${esc(opts.icon || "□")}</div><div class="desktop-icon-label">${esc(opts.label || "Item")}</div>`;

        let drag = null, moved = false;
        el.addEventListener("mousedown", e => {
            if (e.button !== 0) return;
            e.preventDefault();
            moved = false;
            drag = { x: e.clientX, y: e.clientY, left: parseInt(el.style.left,10)||0, top: parseInt(el.style.top,10)||0 };
            el.classList.add("dragging", "selected");
        });
        document.addEventListener("mousemove", e => {
            if (!drag) return;
            const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
            el.style.left = Math.max(0, Math.min(window.innerWidth - 92, drag.left + dx)) + "px";
            el.style.top = Math.max(0, Math.min(window.innerHeight - 130, drag.top + dy)) + "px";
        });
        document.addEventListener("mouseup", () => {
            if (!drag) return;
            drag = null;
            el.classList.remove("dragging");
            const data = getJSON(opts.storageKey, {});
            data[opts.posKey] = { left: parseInt(el.style.left,10)||0, top: parseInt(el.style.top,10)||0 };
            setJSON(opts.storageKey, data);
        });
        el.addEventListener("dblclick", e => { e.preventDefault(); if (!moved) opts.open?.(); });
        el.addEventListener("contextmenu", e => { e.preventDefault(); e.stopImmediatePropagation(); opts.menu?.(e.clientX, e.clientY); }, true);
        desktop.appendChild(el);
        return el;
    }

    function isDesktopFile46(file) {
        const folder = String(file?.folder || file?.parent || "").toLowerCase();
        return file?.showOnDesktop === true || folder === "desktop";
    }

    function fileIcon46(file) {
        const type = String(file?.type || "").toLowerCase();
        const name = String(file?.name || "").toLowerCase();
        if (type === "folder") return "📁";
        if (type.includes("image") || /\.(png|jpg|jpeg|gif|webp|svg)$/.test(name)) return "🖼️";
        if (type.includes("audio") || /\.(mp3|wav|ogg|webm)$/.test(name)) return "🎵";
        if (type.includes("video") || /\.(mp4|mov|webm)$/.test(name)) return "🎬";
        if (/\.(html|css|js|json)$/.test(name)) return "</>";
        return "📄";
    }

    function getPins(key) { return getJSON(key, []).filter(id => appExists46(id) && canSeeApp46(window.APPS[id])); }
    function setPins(key, list) { setJSON(key, [...new Set(list)].filter(appExists46)); renderDesktop46(); renderTaskbarPins46(); renderStartMenu46(); }

    window.pinAppToStart = appId => setPins(PIN_START_KEY, [...getPins(PIN_START_KEY), appId]);
    window.pinAppToDesktop = appId => setPins(PIN_DESKTOP_KEY, [...getPins(PIN_DESKTOP_KEY), appId]);
    window.pinAppToTaskbar = appId => setPins(PIN_TASKBAR_KEY, [...getPins(PIN_TASKBAR_KEY), appId]);
    window.unpinAppFromStart = appId => setPins(PIN_START_KEY, getPins(PIN_START_KEY).filter(id => id !== appId));
    window.unpinAppFromDesktop = appId => setPins(PIN_DESKTOP_KEY, getPins(PIN_DESKTOP_KEY).filter(id => id !== appId));
    window.unpinAppFromTaskbar = appId => setPins(PIN_TASKBAR_KEY, getPins(PIN_TASKBAR_KEY).filter(id => id !== appId));

    function renderDesktopPins46(index) {
        getPins(PIN_DESKTOP_KEY).forEach((appId, i) => {
            const app = window.APPS[appId];
            movableDesktopItem({
                posKey: "pin:" + appId,
                storageKey: POS_PIN_KEY,
                icon: app.icon || "□",
                label: app.name || appId,
                appId,
                index: index + i,
                className: "emerald46-pinned-app",
                open: () => window.launchApp?.(appId) || app.launch?.(),
                menu: (x,y) => menu46(x,y,[
                    {label:"Open", action:()=>window.launchApp?.(appId) || app.launch?.()},
                    {label:"Pin to Start", action:()=>window.pinAppToStart(appId)},
                    {label:"Pin to Taskbar", action:()=>window.pinAppToTaskbar(appId)},
                    {sep:true},
                    {label:"Unpin from Desktop", action:()=>window.unpinAppFromDesktop(appId)}
                ])
            });
        });
    }

    function renderDesktop46() {
        if (!installApps46()) return;
        const desktop = document.getElementById("desktop");
        if (!desktop) return;
        desktop.innerHTML = "";
        let index = 0;
        getVisibleCategories46().forEach(cat => {
            movableDesktopItem({
                posKey: "folder:" + cat.id,
                storageKey: POS_FOLDER_KEY,
                icon: cat.icon || "📁",
                label: cat.name || cat.id,
                index: index++,
                className: "emerald46-folder-icon",
                open: () => openAppFolder46(cat.id),
                menu: (x,y) => menu46(x,y,[
                    {label:"Open", action:()=>openAppFolder46(cat.id)},
                    {label:"Pin Application...", action:()=>openPinManager46()},
                    {sep:true},
                    {label:"Refresh Desktop", action:()=>renderDesktop46()},
                    {label:"Repair Desktop", action:()=>repairDesktop46()}
                ])
            });
        });
        Object.entries(window.fileSystem?.files || {}).forEach(([id,file]) => {
            if (!isDesktopFile46(file)) return;
            movableDesktopItem({
                posKey: "file:" + id,
                storageKey: POS_FILE_KEY,
                icon: fileIcon46(file),
                label: file.name || "File",
                fileId: id,
                index: index++,
                className: "emerald46-file-icon",
                open: () => window.openFile?.(id),
                menu: (x,y)=>menu46(x,y,[
                    {label:"Open", action:()=>window.openFile?.(id)},
                    {label:"Properties", action:()=>window.showProperties?.(id)},
                    {sep:true},
                    {label:"Remove from Desktop", action:async()=>{ if (window.cloudSaveFile) await window.cloudSaveFile(id,{showOnDesktop:false}); if(window.fileSystem?.files?.[id]) window.fileSystem.files[id].showOnDesktop=false; renderDesktop46(); }}
                ])
            });
        });
        renderDesktopPins46(index);
    }

    function openAppFolder46(categoryId) {
        const cat = getCategories46()[categoryId];
        if (!cat) return;
        const apps = getAppsForCategory46(categoryId);
        simpleWin46(cat.name, `
            <h2>${esc(cat.name)}</h2>
            <div class="emerald46-inset">${esc(cat.description || "Applications")}</div>
            <div class="emerald46-folder-grid">
                ${apps.map(([id,app]) => `<div class="emerald46-app-tile" data-app="${esc(id)}">
                    <div class="emerald46-app-icon">${esc(app.icon || "□")}</div>
                    <b>${esc(app.name || id)}</b>
                    <div class="emerald46-app-actions">
                        ${btn46("Open", `launchApp('${esc(id)}')`)}
                        ${btn46("Pin", `openAppPinMenu46('${esc(id)}')`)}
                    </div>
                </div>`).join("") || `<div class="emerald46-inset">No available apps in this edition.</div>`}
            </div>
        `, "folder:" + categoryId);
    }

    window.openAppFolder46 = openAppFolder46;
    window.openAppFolderT5 = openAppFolder46;

    window.openAppPinMenu46 = function(appId) {
        const app = window.APPS?.[appId];
        if (!app) return;
        menu46(180, 150, [
            {label:"Open " + app.name, action:()=>window.launchApp?.(appId) || app.launch?.()},
            {sep:true},
            {label:"Pin to Start", action:()=>window.pinAppToStart(appId)},
            {label:"Pin to Desktop", action:()=>window.pinAppToDesktop(appId)},
            {label:"Pin to Taskbar", action:()=>window.pinAppToTaskbar(appId)}
        ]);
    };

    function renderStartMenu46() {
        const results = document.getElementById("start-results");
        if (!results) return;
        const pins = getPins(PIN_START_KEY);
        results.innerHTML = "";
        if (pins.length) {
            const label = document.createElement("div"); label.className = "start-section-label"; label.textContent = "Pinned"; results.appendChild(label);
            pins.forEach(id => appendStartItem46(results, id));
            results.appendChild(document.createElement("hr"));
        }
        const folderLabel = document.createElement("div"); folderLabel.className = "start-section-label"; folderLabel.textContent = "Application Folders"; results.appendChild(folderLabel);
        getVisibleCategories46().forEach(cat => {
            const item = document.createElement("div");
            item.className = "start-item emerald46-start-folder";
            item.textContent = (cat.icon || "📁") + " " + cat.name;
            item.onclick = () => { openAppFolder46(cat.id); document.getElementById("start-menu")?.classList.remove("show"); };
            results.appendChild(item);
        });
    }

    function appendStartItem46(results, id) {
        const app = window.APPS?.[id]; if (!app) return;
        const item = document.createElement("div");
        item.className = "start-item emerald46-start-pin";
        item.textContent = (app.icon || "□") + " " + (app.name || id);
        item.onclick = () => { window.launchApp?.(id) || app.launch?.(); document.getElementById("start-menu")?.classList.remove("show"); };
        results.appendChild(item);
    }

    function ensurePinnedTaskbar46() {
        let container = document.getElementById("taskbar-pinned-apps");
        if (!container) {
            container = document.createElement("div");
            container.id = "taskbar-pinned-apps";
            const taskbarApps = document.getElementById("taskbar-apps");
            taskbarApps?.parentNode?.insertBefore(container, taskbarApps);
        }
        return container;
    }

    function renderTaskbarPins46() {
        const c = ensurePinnedTaskbar46(); if (!c) return;
        c.innerHTML = "";
        getPins(PIN_TASKBAR_KEY).forEach(id => {
            const app = window.APPS?.[id]; if (!app) return;
            const btn = document.createElement("button");
            btn.className = "emerald46-taskbar-pin";
            btn.title = app.name || id;
            btn.textContent = app.icon || "□";
            btn.onclick = () => window.launchApp?.(id) || app.launch?.();
            btn.oncontextmenu = e => { e.preventDefault(); menu46(e.clientX,e.clientY,[
                {label:"Open", action:()=>window.launchApp?.(id) || app.launch?.()},
                {label:"Unpin from Taskbar", action:()=>window.unpinAppFromTaskbar(id)}
            ]); };
            c.appendChild(btn);
        });
    }

    function menu46(x, y, items) {
        if (typeof window.showWin95Menu425 === "function") return window.showWin95Menu425(x, y, items);
        let menu = document.getElementById("context-menu");
        if (!menu) { menu = document.createElement("div"); menu.id = "context-menu"; document.body.appendChild(menu); }
        window.__emerald46MenuActions = [];
        menu.className = "show win95-context-menu emerald46-menu";
        menu.style.display = "block";
        menu.innerHTML = items.map((item, idx) => {
            if (item.sep) return `<div class="context-separator"></div>`;
            const i = window.__emerald46MenuActions.push(item.action || function(){}) - 1;
            return `<div class="context-item" data-action-index="${i}">${esc(item.label)}</div>`;
        }).join("");
        const w = 245, h = Math.max(30, items.length * 26 + 8);
        menu.style.left = Math.max(2, Math.min(x, window.innerWidth - w - 2)) + "px";
        menu.style.top = Math.max(2, Math.min(y, window.innerHeight - h - 42)) + "px";
        menu.querySelectorAll(".context-item[data-action-index]").forEach(el => el.onclick = e => {
            e.preventDefault(); e.stopPropagation(); const i = parseInt(el.dataset.actionIndex,10); hideMenu46(); window.__emerald46MenuActions[i]?.();
        });
    }

    function hideMenu46() { const m = document.getElementById("context-menu"); if (m) { m.classList.remove("show"); m.style.display = "none"; } }

    function installDesktopMenu46() {
        const desktop = document.getElementById("desktop");
        if (!desktop || desktop.__emerald46Context) return;
        desktop.__emerald46Context = true;
        desktop.addEventListener("contextmenu", e => {
            if (e.target.closest(".desktop-item")) return;
            e.preventDefault(); e.stopImmediatePropagation();
            menu46(e.clientX, e.clientY, [
                {label:"Open Office Apps", action:()=>openAppFolder46("office")},
                {label:"Open Emerald 360", action:()=>window.openEmerald36046()},
                {label:"Open App Folder...", action:()=>openFolderChooser46()},
                {label:"Pin Application...", action:()=>openPinManager46()},
                {sep:true},
                {label:"New File", action:()=>window.createFileOnDesktop?.() || window.createFile?.()},
                {label:"New Folder", action:()=>window.createFolderOnDesktop?.() || window.createFolder?.()},
                {label:"Upload To Desktop", action:()=>window.uploadFileToDesktop?.() || window.uploadFile?.()},
                {sep:true},
                {label:"Display Settings", action:()=>window.openDisplaySettings43?.() || window.openDisplaySettings42?.()},
                {label:"System Suite", action:()=>window.openSystemSuite46()},
                {label:"Emerald Assistant", action:()=>window.openEmeraldAssistant46()},
                {sep:true},
                {label:"Refresh", action:()=>renderDesktop46()},
                {label:"Repair Desktop", action:()=>repairDesktop46()},
                {label:"Reset Icon Layout", action:()=>resetDesktop46()}
            ]);
        }, true);
        document.addEventListener("click", hideMenu46, true);
        document.addEventListener("keydown", e => { if (e.key === "Escape") hideMenu46(); });
    }

    window.openFolderChooser46 = function () {
        simpleWin46("Open Application Folder", `<h2>Open Application Folder</h2><div class="emerald46-grid">${getVisibleCategories46().map(c=>btn46(c.name, `openAppFolder46('${esc(c.id)}')`)).join("")}</div>`, "folderChooser46");
    };

    function openPinManager46() {
        simpleWin46("Pin Manager", `<h2>Pin Manager</h2><div class="emerald46-folder-grid">${getVisibleAppEntries46().map(([id,app])=>`
            <div class="emerald46-app-tile"><b>${esc(app.icon || "□")} ${esc(app.name || id)}</b><br>
            ${btn46("Start", `pinAppToStart('${esc(id)}')`)} ${btn46("Desktop", `pinAppToDesktop('${esc(id)}')`)} ${btn46("Taskbar", `pinAppToTaskbar('${esc(id)}')`)}</div>`).join("")}</div>`, "pinManager46");
    }
    window.openPinManager46 = openPinManager46;

    function resetDesktop46() {
        localStorage.removeItem(POS_FOLDER_KEY); localStorage.removeItem(POS_FILE_KEY); localStorage.removeItem(POS_PIN_KEY); renderDesktop46(); window.notify?.("Desktop", "Icon layout reset.", 2500, "info");
    }
    window.resetDesktop46 = resetDesktop46;

    function repairDesktop46() {
        installCategories46(); installApps46(); renderDesktop46(); renderStartMenu46(); renderTaskbarPins46(); window.notify?.("Desktop", "Desktop consistency repaired.", 2800, "success");
    }
    window.repairDesktop46 = repairDesktop46;

    function patchTaskbarMinimizeBug46() {
        const bar = document.getElementById("taskbar-apps");
        if (!bar || bar.__emerald46TaskbarPatch) return;
        bar.__emerald46TaskbarPatch = true;
        bar.addEventListener("click", e => {
            const btn = e.target.closest("button, .taskbar-item, .task-btn");
            if (!btn) return;
            const win = (window.openWindows || []).find(w => w && w.taskbarButton === btn);
            if (!win) return;
            e.preventDefault();
            e.stopImmediatePropagation();
            win.style.display = "";
            win.dataset.minimized = "false";
            win.style.zIndex = 999999;
            window.saveSession?.();
        }, true);
    }

    function injectStyles46() {
        if (document.getElementById("emerald46-styles")) return;
        const style = document.createElement("style");
        style.id = "emerald46-styles";
        style.textContent = `
            .emerald46-panel{height:100%;box-sizing:border-box;overflow:auto;background:#c0c0c0;color:#000;padding:10px;font-family:"MS Sans Serif",Tahoma,Arial,sans-serif;font-size:12px}
            .emerald46-inset,.emerald46-doc{background:#fff;color:#000;border-top:2px solid #808080;border-left:2px solid #808080;border-right:2px solid #fff;border-bottom:2px solid #fff;padding:8px;margin:6px 0}
            .emerald46-doc pre{white-space:pre-wrap;max-height:130px;overflow:auto;background:#f7f7f7;border:1px solid #999;padding:5px}
            .emerald46-button{background:#c0c0c0;color:#000;border-top:2px solid #fff;border-left:2px solid #fff;border-right:2px solid #808080;border-bottom:2px solid #808080;padding:5px 9px;margin:3px;font-family:inherit;font-size:12px;cursor:default}
            .emerald46-button:active{border-top:2px solid #808080;border-left:2px solid #808080;border-right:2px solid #fff;border-bottom:2px solid #fff}
            .emerald46-input,.emerald46-textarea{width:100%;box-sizing:border-box;background:#fff;color:#000;border:2px inset #fff;padding:5px;margin:4px 0;font-family:inherit;font-size:12px}.emerald46-textarea{height:190px;font-family:"Courier New",monospace;resize:vertical}
            .emerald46-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:6px;margin:8px 0}.emerald46-grid .emerald46-button{text-align:left;min-height:35px;width:100%}
            .emerald46-folder-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}.emerald46-app-tile{background:#d4d0c8;border-top:2px solid #fff;border-left:2px solid #fff;border-right:2px solid #808080;border-bottom:2px solid #808080;padding:8px;min-height:80px}
            .emerald46-desktop-item{width:78px;min-height:72px;color:#fff;text-align:center;padding:4px;cursor:default;border:1px solid transparent;text-shadow:1px 1px 1px #000;user-select:none}.emerald46-desktop-item:hover,.emerald46-desktop-item.selected{background:#000080;border:1px dotted #fff}.emerald46-desktop-item.dragging{opacity:.82;z-index:99999}.emerald46-folder-icon .desktop-icon-symbol{font-size:28px}.emerald46-desktop-item .desktop-icon-symbol{min-height:30px;font-size:24px}.emerald46-desktop-item .desktop-icon-label{line-height:1.1;font-size:12px;word-break:break-word}
            #taskbar-pinned-apps{display:flex;gap:3px;margin-left:4px}.emerald46-taskbar-pin{height:28px;min-width:28px;background:#c0c0c0;border-top:2px solid #fff;border-left:2px solid #fff;border-right:2px solid #808080;border-bottom:2px solid #808080;font-size:11px;cursor:default}.emerald46-taskbar-pin:active{border-top:2px solid #808080;border-left:2px solid #808080;border-right:2px solid #fff;border-bottom:2px solid #fff}
            .start-section-label{font-weight:bold;padding:3px 6px;color:#000;background:#d4d0c8;border-bottom:1px solid #808080}
        `;
        document.head.appendChild(style);
    }

    function patchTerminal46() {
        const original = window.runCommand;
        if (typeof original !== "function" || original.__emerald46Wrapped) return;
        const wrapped = async function(cmdLine="") {
            const raw = String(cmdLine).trim();
            const cmd = raw.toLowerCase();
            let result = null;
            if (cmd === "build" || cmd === "version") result = "EmeraldOS 4.6 - Office Suite & Desktop Consistency Update";
            if (["office", "360", "emerald360", "emerald.360"].includes(cmd)) { window.openEmerald36046(); result = "Opened Emerald 360."; }
            if (cmd === "word" || cmd === "word.lite") { window.openWordLite46(); result = "Opened Word Lite."; }
            if (cmd === "sheet" || cmd === "sheet.lite") { window.openSheetLite46(); result = "Opened Sheet Lite."; }
            if (cmd === "slides" || cmd === "slides.lite") { window.openSlidesLite46(); result = "Opened Slides Lite."; }
            if (cmd === "assistant" || cmd === "clippy") { window.openEmeraldAssistant46(); result = "Opened Emerald Assistant."; }
            if (cmd === "desktop.repair46") { repairDesktop46(); result = "Desktop repaired."; }
            if (cmd === "folder.office") { openAppFolder46("office"); result = "Opened Office Apps."; }
            if (result !== null) {
                const output = document.getElementById("terminal_output");
                if (output) { output.innerHTML += `&gt; ${esc(raw)}<br>${esc(result)}<br><br>`; output.scrollTop = output.scrollHeight; const input = document.getElementById("terminal_input"); if (input) input.value = ""; }
                return;
            }
            return original.call(this, cmdLine);
        };
        wrapped.__emerald46Wrapped = true;
        window.runCommand = wrapped;
    }

    function scheduleLayoutSync46() {
        clearTimeout(window.__emerald46SyncTimer);
        window.__emerald46SyncTimer = setTimeout(async () => {
            try {
                await window.saveUserSettings?.({
                    desktopFolderPositions46: getJSON(POS_FOLDER_KEY, {}),
                    desktopFilePositions46: getJSON(POS_FILE_KEY, {}),
                    desktopPinPositions46: getJSON(POS_PIN_KEY, {}),
                    pinnedStartApps: getJSON(PIN_START_KEY, []),
                    pinnedDesktopApps: getJSON(PIN_DESKTOP_KEY, []),
                    pinnedTaskbarApps: getJSON(PIN_TASKBAR_KEY, [])
                });
            } catch (err) { console.warn("EmeraldOS 4.6 layout sync skipped:", err); }
        }, 650);
    }

    function init46() {
        injectStyles46();
        patchTaskbarMinimizeBug46();
        patchTerminal46();
        if (!installApps46()) { setTimeout(init46, 350); return; }
        installDesktopMenu46();
        window.renderDesktop = renderDesktop46;
        window.renderDesktopOverride = renderDesktop46;
        window.renderStartMenu = renderStartMenu46;
        window.renderStartMenuOverride = renderStartMenu46;
        window.refreshEditionVisibility = function () { renderDesktop46(); renderStartMenu46(); renderTaskbarPins46(); };
        renderDesktop46();
        renderStartMenu46();
        renderTaskbarPins46();
        setTimeout(() => { renderDesktop46(); renderStartMenu46(); }, 1200);
        window.notify?.("EmeraldOS 4.6", "Office Apps, Emerald 360, and desktop consistency loaded.", 3600, "success");
    }

    if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", () => setTimeout(init46, 2400));
    else setTimeout(init46, 2400);
})();
