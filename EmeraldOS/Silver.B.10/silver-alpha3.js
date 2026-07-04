
"use strict";

/* =========================================================
   EMERALDOS SILVER ALPHA VERSION 3
   Separate Silver product-line shell and Silver-branded apps
========================================================= */
(function () {
    if (window.EmeraldOSSilverAlpha3Loaded) return;
    window.EmeraldOSSilverAlpha3Loaded = true;

    const BUILD = {
        productLine: "EmeraldOS Silver",
        displayName: "EmeraldOS Silver Alpha Version 3",
        channel: "Alpha",
        version: "3",
        codename: "Silverglass Experience",
        platform: "EmeraldOS Platform",
        storagePrefix: "silver30_"
    };

    const LS = {
        notes: BUILD.storagePrefix + "notes",
        tasks: BUILD.storagePrefix + "tasks",
        journal: BUILD.storagePrefix + "journal",
        notifications: BUILD.storagePrefix + "notifications",
        layout: BUILD.storagePrefix + "layout",
        preferences: BUILD.storagePrefix + "preferences"
    };

    function esc(value) {
        return String(value ?? "").replace(/[&<>'"]/g, ch => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "'": "&#39;",
            '"': "&quot;"
        }[ch]));
    }

    function readJSON(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
        catch { return fallback; }
    }

    function writeJSON(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function getUsername() {
        return localStorage.getItem("40_username") || localStorage.getItem("username") || "EmeraldOS User";
    }

    function getEdition() {
        return localStorage.getItem("40_edition") || localStorage.getItem("emerald_edition") || "Virtue";
    }

    function open(title, html, appId) {
        if (typeof window.openWindow === "function") {
            window.openWindow(title, html, appId || title.replace(/\W+/g, "").toLowerCase());
        } else {
            const div = document.createElement("div");
            div.innerHTML = `<h2>${esc(title)}</h2>${html}`;
            document.body.appendChild(div);
        }
    }

    function safeCall(fnName, fallbackTitle, fallbackText) {
        const fn = window[fnName];
        if (typeof fn === "function") return fn();
        open(fallbackTitle || "Silver Compatibility", `<div class="silver-shell"><p>${esc(fallbackText || "This platform service is not available in this build.")}</p></div>`, "silverCompatibility");
    }

    function tile(title, desc, handlerName) {
        return `<div class="silver-tile" onclick="window['${esc(handlerName)}']?.()"><b>${esc(title)}</b><small>${esc(desc)}</small></div>`;
    }

    function statusStrip() {
        return `<div class="silver-status">
            <div class="silver-status-card"><b>Product line</b><span>${esc(BUILD.productLine)}</span></div>
            <div class="silver-status-card"><b>Release</b><span>${esc(BUILD.channel)} ${esc(BUILD.version)}</span></div>
            <div class="silver-status-card"><b>Codename</b><span>${esc(BUILD.codename)}</span></div>
            <div class="silver-status-card"><b>User</b><span>${esc(getUsername())}</span></div>
        </div>`;
    }

    function shellHeader(title, subtitle) {
        return `<div class="silver-shell"><div class="silver-hero"><div class="silver-orb"></div><div><div class="silver-title">${esc(title)}</div><div class="silver-subtitle">${esc(subtitle || BUILD.codename)}</div></div></div>`;
    }

    function endShell() { return `</div>`; }

    function addSilverNotification(title, body, source) {
        const list = readJSON(LS.notifications, []);
        list.unshift({ id: Date.now() + "_" + Math.random().toString(36).slice(2), title, body, source: source || "Silver", read: false, time: new Date().toISOString() });
        writeJSON(LS.notifications, list.slice(0, 80));
        updateBell();
        if (typeof window.notify === "function") window.notify(title, body);
    }

    function updateBell() {
        const bell = document.getElementById("silver-bell");
        if (!bell) return;
        const count = readJSON(LS.notifications, []).filter(n => !n.read).length;
        bell.textContent = String(count);
        bell.classList.toggle("has-unread", count > 0);
    }

    function applyShellLabels() {
        document.title = BUILD.displayName;
        document.body.dataset.theme = "silver3";
        localStorage.setItem("silver_product_line", BUILD.displayName);
        localStorage.setItem("40_theme", "silver3");
        const start = document.getElementById("start-btn");
        if (start) start.textContent = "Silver";
        const side = document.querySelector(".start-side");
        if (side) side.textContent = "Silver";
        const editionBadge = document.getElementById("emerald40-edition-badge");
        if (editionBadge) editionBadge.textContent = BUILD.displayName;
        const buildBadge = document.getElementById("emerald40-build-badge");
        if (buildBadge) buildBadge.textContent = "Alpha 3";
    }

    function installRibbon() {
        if (document.getElementById("silver-alpha-ribbon")) return;
        const ribbon = document.createElement("div");
        ribbon.id = "silver-alpha-ribbon";
        ribbon.className = "silver-alpha-ribbon";
        ribbon.textContent = `${BUILD.displayName} • ${BUILD.codename}`;
        document.body.appendChild(ribbon);
    }

    function installSidebar() {
        if (document.getElementById("silver-sidebar")) return;
        const sidebar = document.createElement("div");
        sidebar.id = "silver-sidebar";
        sidebar.innerHTML = `
            <div class="silver-gadget"><h4>Silver Clock</h4><div class="big" id="silver-clock-time">--:--</div><small id="silver-clock-date"></small></div>
            <div class="silver-gadget"><h4>Account</h4><div>${esc(getUsername())}</div><small>${esc(getEdition())} edition</small></div>
            <div class="silver-gadget"><h4>Notifications</h4><div class="big" id="silver-side-unread">0</div><small>Unread Silver alerts</small><button onclick="window.openSilverNotifications?.()">Open</button></div>
            <div class="silver-gadget"><h4>Quick Access</h4><button onclick="window.openSilverHub?.()">Silver Center</button><button onclick="window.openSilverApps?.()">Silver Apps</button><button onclick="window.openSilverControlCenter?.()">Control Center</button></div>
        `;
        document.body.appendChild(sidebar);
        const update = () => {
            const now = new Date();
            const time = document.getElementById("silver-clock-time");
            const date = document.getElementById("silver-clock-date");
            const unread = document.getElementById("silver-side-unread");
            if (time) time.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            if (date) date.textContent = now.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
            if (unread) unread.textContent = String(readJSON(LS.notifications, []).filter(n => !n.read).length);
        };
        update();
        setInterval(update, 1000);
    }

    function makeDesktopIcon(id, label, glyph, handlerName) {
        const desktop = document.getElementById("desktop");
        if (!desktop || document.getElementById(id)) return;
        const icon = document.createElement("div");
        icon.id = id;
        icon.className = "icon silver-product-icon";
        icon.tabIndex = 0;
        icon.innerHTML = `<div style="font-size:30px">${glyph}</div><br>${esc(label)}`;
        const launch = () => {
            setTimeout(() => icon.blur(), 50);
            if (typeof window[handlerName] === "function") window[handlerName]();
        };
        icon.addEventListener("click", launch);
        icon.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") { event.preventDefault(); launch(); }
        });
        desktop.prepend(icon);
    }

    function installDesktop() {
        makeDesktopIcon("silver-center-icon", "Silver Center", "◉", "openSilverHub");
        makeDesktopIcon("silver-apps-icon", "Silver Apps", "◇", "openSilverApps");
        makeDesktopIcon("silver-desk-icon", "Silver Desk", "▣", "openSilverDesk");
        makeDesktopIcon("silver-mail-icon", "Silver Mail", "✉", "openSilverMail");
    }

    function installStartMenuLinks() {
        const startResults = document.getElementById("start-results");
        if (!startResults || document.getElementById("silver-start-links")) return;
        const wrap = document.createElement("div");
        wrap.id = "silver-start-links";
        wrap.innerHTML = `
            <div class="start-item" onclick="openSilverHub()">Silver Center</div>
            <div class="start-item" onclick="openSilverApps()">Silver Apps</div>
            <div class="start-item" onclick="openSilverDesk()">Silver Desk</div>
            <div class="start-item" onclick="openSilverControlCenter()">Silver Control Center</div>
            <div class="start-item" onclick="openSilverMail()">Silver Mail</div>
            <div class="start-item" onclick="openSilverOffice()">Silver Office</div>
            <div class="start-item" onclick="openSilverCreatorStudio()">Silver Creator Studio</div>
        `;
        startResults.prepend(wrap);
        const startMenu = document.getElementById("start-menu");
        if (startMenu && !document.getElementById("silver-start-badge")) {
            const badge = document.createElement("div");
            badge.id = "silver-start-badge";
            badge.textContent = BUILD.displayName;
            startMenu.appendChild(badge);
        }
    }

    window.openSilverHub = function () {
        const html = shellHeader(BUILD.displayName, "A separate Silver product line with Silver-branded apps and a cleaner glass experience") + `
            ${statusStrip()}
            <p>Silver Alpha Version 3 separates the Silver experience from the base EmeraldOS desktop. Silver apps have their own names, layout, panels, gadgets, and workflow, while the core EmeraldOS platform remains available underneath for compatibility.</p>
            <div class="silver-grid">
                ${tile("Silver Apps", "All Silver-branded apps in one place.", "openSilverApps")}
                ${tile("Silver Desk", "Daily dashboard, shortcuts, unread alerts, and activity.", "openSilverDesk")}
                ${tile("Control Center", "Personalization, network, security, recovery, and system settings.", "openSilverControlCenter")}
                ${tile("Silver Files", "Silver-branded storage and sharing center.", "openSilverFiles")}
                ${tile("Silver Office", "Silver documents, templates, forms, sheets, and slides.", "openSilverOffice")}
                ${tile("Silver Mail", "Internal EmeraldOS mail with a Silver mailbox interface.", "openSilverMail")}
                ${tile("Silver Creator Studio", "Application Editor, App Library, Appstore, and code tools.", "openSilverCreatorStudio")}
                ${tile("Help and Support", "Guides, troubleshooting, and product-line notes.", "openSilverHelp")}
            </div>
            <div class="silver-warning"><b>Product line note:</b> Silver Alpha Version 3 uses original EmeraldOS styling and does not include Microsoft assets, logos, wallpapers, sounds, or copied icons.</div>
        ` + endShell();
        open("Silver Center", html, "silverHub");
    };

    window.openSilverApps = function () {
        const html = shellHeader("Silver Apps", "Silver-specific applications designed separately from base EmeraldOS apps") + `
            <div class="silver-grid">
                ${tile("Silver Desk", "Daily hub and quick actions.", "openSilverDesk")}
                ${tile("Silver Files", "Storage, shares, and file status.", "openSilverFiles")}
                ${tile("Silver Office", "Documents, sheets, slides, forms, vault.", "openSilverOffice")}
                ${tile("Silver Mail", "EmeraldOS mail service with Silver interface.", "openSilverMail")}
                ${tile("Silver Chat", "Communication tools and messages.", "openSilverChat")}
                ${tile("Silver People", "Users, profiles, contacts, and blocking.", "openSilverPeople")}
                ${tile("Silver Notes", "Silver local notes with export.", "openSilverNotes")}
                ${tile("Silver Tasks", "Action list and task tracking.", "openSilverTasks")}
                ${tile("Silver Journal", "Private daily journal.", "openSilverJournal")}
                ${tile("Silver Calendar", "Events and schedule tools.", "openSilverCalendar")}
                ${tile("Silver Gallery", "Images, media, and file previews.", "openSilverGallery")}
                ${tile("Silver Media", "Media center and creative tools.", "openSilverMedia")}
                ${tile("Silver Assistant", "Assistant settings, sidebar, and API mode.", "openSilverAssistant")}
                ${tile("Silver App Market", "User Appstore with risk warning.", "openSilverAppMarket")}
                ${tile("Silver Creator Studio", "Coding and custom app tools.", "openSilverCreatorStudio")}
                ${tile("Silver Security", "Privacy, blocking, app scanning, and recovery.", "openSilverSecurity")}
                ${tile("Silver Network", "Cloud, mail, sharing, and sync status.", "openSilverNetwork")}
                ${tile("Silver Personalization", "Themes, wallpaper, icons, gadgets.", "openSilverPersonalization")}
                ${tile("Silver Updates", "Release notes and product-line roadmap.", "openSilverUpdates")}
                ${tile("Silver Feedback", "Bug reports and feature requests.", "openSilverFeedback")}
            </div>
        ` + endShell();
        open("Silver Apps", html, "silverApps");
    };

    window.openSilverDesk = function () {
        const unread = readJSON(LS.notifications, []).filter(n => !n.read).length;
        const tasks = readJSON(LS.tasks, []);
        const notes = readJSON(LS.notes, []);
        const html = shellHeader("Silver Desk", "Your Silver dashboard") + `
            ${statusStrip()}
            <div class="silver-grid">
                <div class="silver-tile"><b>Unread Notifications</b><small>${unread} unread Silver alerts.</small></div>
                <div class="silver-tile"><b>Tasks</b><small>${tasks.length} saved Silver tasks.</small></div>
                <div class="silver-tile"><b>Notes</b><small>${notes.length} saved Silver notes.</small></div>
                <div class="silver-tile"><b>Cloud</b><small>${navigator.onLine ? "Online" : "Offline"}</small></div>
            </div>
            <div class="silver-toolbar">
                <button onclick="openSilverFiles()">Open Files</button>
                <button onclick="openSilverOffice()">Open Office</button>
                <button onclick="openSilverMail()">Open Mail</button>
                <button onclick="openSilverAppMarket()">Open App Market</button>
                <button onclick="openSilverNotifications()">Notifications</button>
            </div>
        ` + endShell();
        open("Silver Desk", html, "silverDesk");
    };

    window.openSilverControlCenter = function () {
        const html = shellHeader("Silver Control Center", "One place for Silver settings and product-line tools") + `
            <div class="silver-grid">
                ${tile("Personalization", "Theme, wallpaper, icons, desktop layout.", "openSilverPersonalization")}
                ${tile("Network", "Cloud, sync, mail, and sharing.", "openSilverNetwork")}
                ${tile("Security", "Privacy, app safety, blocked users, recovery.", "openSilverSecurity")}
                ${tile("People", "Profiles, contacts, user directory.", "openSilverPeople")}
                ${tile("Creator Studio", "Code, apps, registry, and system customization.", "openSilverCreatorStudio")}
                ${tile("Recovery", "Safe Mode and repair tools.", "openSilverRecovery")}
                ${tile("Updates", "Alpha 3 notes and roadmap.", "openSilverUpdates")}
                ${tile("Base Settings", "Open EmeraldOS platform settings.", "openBaseSettings")}
            </div>
        ` + endShell();
        open("Silver Control Center", html, "silverControlCenter");
    };

    window.openBaseSettings = () => safeCall("openSettings56", "Settings", "Base platform Settings could not be opened from this build.");
    window.openSilverFiles = function () {
        const html = shellHeader("Silver Files", "Silver storage center built over EmeraldOS Files") + `
            <p>Silver Files consolidates storage, sharing, recent files, and shared documents into a Silver-branded file center.</p>
            <div class="silver-grid">
                ${tile("Open Files", "Open the main file explorer.", "openBaseFiles")}
                ${tile("Shared With Me", "Documents shared with you.", "openBaseSharedWithMe")}
                ${tile("Shared By Me", "Files you have shared.", "openBaseSharedByMe")}
                ${tile("Storage Center", "Storage limits and cleanup warnings.", "openBaseStorage")}
            </div>
        ` + endShell();
        open("Silver Files", html, "silverFiles");
    };
    window.openBaseFiles = () => safeCall("openFileExplorer", "Files", "The base Files app is unavailable.");
    window.openBaseSharedWithMe = () => safeCall("openSharedWithMe51", "Shared With Me", "Shared With Me is unavailable.");
    window.openBaseSharedByMe = () => safeCall("openSharedByMe55", "Shared By Me", "Shared By Me is unavailable.");
    window.openBaseStorage = () => safeCall("openStorageCenter51", "Storage Center", "Storage Center is unavailable.");

    window.openSilverOffice = function () {
        const html = shellHeader("Silver Office", "A Silver front end for Writer, Sheets, Slides, Forms, and templates") + `
            <div class="silver-grid">
                ${tile("Office Hub", "Open the full productivity suite.", "openBaseOffice")}
                ${tile("Writer", "Documents, templates, print, export.", "openBaseWriter")}
                ${tile("Sheets", "Tables, lists, and basic formulas.", "openBaseSheets")}
                ${tile("Slides", "Presentations and slide tools.", "openBaseSlides")}
                ${tile("Forms", "Form builder and response tools.", "openBaseForms")}
                ${tile("Document Vault", "Saved documents and recovery.", "openBaseVault")}
                ${tile("Silver Notes", "Local Silver notes app.", "openSilverNotes")}
                ${tile("Silver Journal", "Daily writing space.", "openSilverJournal")}
            </div>
        ` + endShell();
        open("Silver Office", html, "silverOffice");
    };
    window.openBaseOffice = () => safeCall("openEmeraldOffice57", "Office", "Emerald Office is unavailable.");
    window.openBaseWriter = () => safeCall("openWriterPro501", "Writer", "Writer is unavailable.");
    window.openBaseSheets = () => safeCall("openEmeraldSheets51", "Sheets", "Sheets is unavailable.");
    window.openBaseSlides = () => safeCall("openEmeraldSlides51", "Slides", "Slides is unavailable.");
    window.openBaseForms = () => safeCall("openEmeraldForms51", "Forms", "Forms is unavailable.");
    window.openBaseVault = () => safeCall("openDocumentVault501", "Document Vault", "Document Vault is unavailable.");

    window.openSilverMail = function () {
        const html = shellHeader("Silver Mail", "Silver mailbox for EmeraldOS internal mail") + `
            <p>Your Silver address uses the EmeraldOS mail service: <b>${esc(getUsername())}@emeraldos.mail</b></p>
            <div class="silver-grid">
                ${tile("Open Mail", "Inbox, sent mail, compose, replies, drafts.", "openBaseMail")}
                ${tile("People", "Open users and contacts.", "openSilverPeople")}
                ${tile("Notifications", "Unread mail and alerts.", "openSilverNotifications")}
                ${tile("Network", "Mail and cloud connection status.", "openSilverNetwork")}
            </div>
        ` + endShell();
        open("Silver Mail", html, "silverMail");
    };
    window.openBaseMail = () => safeCall("openEmeraldMail57", "Emerald Mail", "Emerald Mail is unavailable in this build.");

    window.openSilverChat = () => safeCall("openEmeraldChat52", "Silver Chat", "Silver Chat uses the EmeraldOS integrated chat platform.");
    window.openSilverPeople = function () {
        const html = shellHeader("Silver People", "Profiles, contacts, blocking, and user directory") + `
            <div class="silver-grid">
                ${tile("User Directory", "List EmeraldOS users.", "openBaseUsers")}
                ${tile("Profile", "Open your profile.", "openBaseProfile")}
                ${tile("Contacts", "Favorite and recent contacts.", "openBaseContacts")}
                ${tile("Blocking Center", "Block or unblock users.", "openBaseBlocking")}
            </div>
        ` + endShell();
        open("Silver People", html, "silverPeople");
    };
    window.openBaseUsers = () => safeCall("openEmeraldOSUsers51", "EmeraldOS Users", "User directory is unavailable.");
    window.openBaseProfile = () => safeCall("openUserProfile56", "User Profile", "User Profile is unavailable.");
    window.openBaseContacts = () => safeCall("openContacts56", "Contacts", "Contacts is unavailable.");
    window.openBaseBlocking = () => safeCall("openBlockingCenter54", "Blocking Center", "Blocking Center is unavailable.");

    window.openSilverNotes = function () {
        const notes = readJSON(LS.notes, []);
        const items = notes.map(n => `<div class="silver-note-item"><b>${esc(n.title)}</b><div><small>${esc(new Date(n.time).toLocaleString())}</small></div><p>${esc(n.body).replace(/\n/g,"<br>")}</p><button onclick="silverDeleteNote('${esc(n.id)}')">Delete</button></div>`).join("") || `<p>No Silver notes saved yet.</p>`;
        const html = shellHeader("Silver Notes", "Fast Silver note-taking") + `
            <label>Title</label><input id="silver-note-title" style="width:100%" placeholder="Note title">
            <label>Note</label><textarea id="silver-note-body" class="silver-editor" placeholder="Write a note..."></textarea>
            <div class="silver-toolbar"><button onclick="silverSaveNote()">Save Note</button><button onclick="silverExportNotes()">Export Notes</button></div>
            <h3>Saved Notes</h3>${items}
        ` + endShell();
        open("Silver Notes", html, "silverNotes");
    };
    window.silverSaveNote = function () {
        const title = document.getElementById("silver-note-title")?.value?.trim() || "Untitled Silver Note";
        const body = document.getElementById("silver-note-body")?.value || "";
        const notes = readJSON(LS.notes, []);
        notes.unshift({ id: "note_" + Date.now(), title, body, time: new Date().toISOString() });
        writeJSON(LS.notes, notes);
        addSilverNotification("Silver Notes", "Note saved.", "Silver Notes");
        window.openSilverNotes();
    };
    window.silverDeleteNote = function (id) {
        writeJSON(LS.notes, readJSON(LS.notes, []).filter(n => n.id !== id));
        window.openSilverNotes();
    };
    window.silverExportNotes = function () {
        const blob = new Blob([JSON.stringify(readJSON(LS.notes, []), null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = "silver-notes.json"; a.click(); URL.revokeObjectURL(a.href);
    };

    window.openSilverTasks = function () {
        const tasks = readJSON(LS.tasks, []);
        const rows = tasks.map(t => `<tr><td>${esc(t.title)}</td><td>${esc(t.status)}</td><td>${esc(t.due || "")}</td><td><button onclick="silverToggleTask('${esc(t.id)}')">Next Status</button> <button onclick="silverDeleteTask('${esc(t.id)}')">Delete</button></td></tr>`).join("") || `<tr><td colspan="4">No tasks yet.</td></tr>`;
        const html = shellHeader("Silver Tasks", "Task tracking for the Silver desktop") + `
            <div class="silver-toolbar"><input id="silver-task-title" placeholder="Task title"><input id="silver-task-due" type="date"><button onclick="silverAddTask()">Add Task</button></div>
            <table style="width:100%"><thead><tr><th>Task</th><th>Status</th><th>Due</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table>
        ` + endShell();
        open("Silver Tasks", html, "silverTasks");
    };
    window.silverAddTask = function () {
        const title = document.getElementById("silver-task-title")?.value?.trim();
        if (!title) return alert("Enter a task title.");
        const due = document.getElementById("silver-task-due")?.value || "";
        const tasks = readJSON(LS.tasks, []);
        tasks.unshift({ id: "task_" + Date.now(), title, due, status: "To Do" });
        writeJSON(LS.tasks, tasks); addSilverNotification("Silver Tasks", "Task added.", "Silver Tasks"); window.openSilverTasks();
    };
    window.silverToggleTask = function (id) {
        const order = ["To Do", "In Progress", "Done"];
        const tasks = readJSON(LS.tasks, []).map(t => t.id === id ? { ...t, status: order[(order.indexOf(t.status) + 1) % order.length] } : t);
        writeJSON(LS.tasks, tasks); window.openSilverTasks();
    };
    window.silverDeleteTask = function (id) { writeJSON(LS.tasks, readJSON(LS.tasks, []).filter(t => t.id !== id)); window.openSilverTasks(); };

    window.openSilverJournal = function () {
        const today = new Date().toISOString().slice(0, 10);
        const journal = readJSON(LS.journal, {});
        const html = shellHeader("Silver Journal", "Private local journal entries") + `
            <label>Date</label><input id="silver-journal-date" type="date" value="${esc(today)}">
            <label>Entry</label><textarea id="silver-journal-body" class="silver-editor">${esc(journal[today] || "")}</textarea>
            <div class="silver-toolbar"><button onclick="silverSaveJournal()">Save Entry</button><button onclick="silverExportJournal()">Export Journal</button></div>
            <h3>Saved Dates</h3><div class="silver-list">${Object.keys(journal).sort().reverse().map(d => `<div class="silver-row"><span>${esc(d)}</span><button onclick="silverLoadJournalDate('${esc(d)}')">Open</button></div>`).join("") || "No journal entries saved."}</div>
        ` + endShell();
        open("Silver Journal", html, "silverJournal");
    };
    window.silverSaveJournal = function () {
        const date = document.getElementById("silver-journal-date")?.value || new Date().toISOString().slice(0,10);
        const body = document.getElementById("silver-journal-body")?.value || "";
        const journal = readJSON(LS.journal, {}); journal[date] = body; writeJSON(LS.journal, journal);
        addSilverNotification("Silver Journal", "Journal entry saved.", "Silver Journal"); window.openSilverJournal();
    };
    window.silverLoadJournalDate = function (date) {
        const journal = readJSON(LS.journal, {});
        open("Silver Journal Entry", shellHeader("Silver Journal", date) + `<textarea class="silver-editor">${esc(journal[date] || "")}</textarea>` + endShell(), "silverJournalEntry");
    };
    window.silverExportJournal = function () {
        const blob = new Blob([JSON.stringify(readJSON(LS.journal, {}), null, 2)], { type: "application/json" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "silver-journal.json"; a.click(); URL.revokeObjectURL(a.href);
    };

    window.openSilverCalendar = () => safeCall("openCalendar", "Silver Calendar", "Silver Calendar opens the platform calendar app.");
    window.openSilverGallery = function () {
        const html = shellHeader("Silver Gallery", "Media and preview center") + `<div class="silver-grid">${tile("Open Files", "Browse image and media uploads.", "openBaseFiles")}${tile("Creative Hub", "Open creative tools.", "openBaseCreative")}${tile("Silver Media", "Open media center.", "openSilverMedia")}</div>` + endShell();
        open("Silver Gallery", html, "silverGallery");
    };
    window.openBaseCreative = () => safeCall("openCreativeHub50", "Creative Hub", "Creative Hub is unavailable.");
    window.openSilverMedia = function () {
        const html = shellHeader("Silver Media", "Silver media and creative center") + `<div class="silver-grid">${tile("Gallery", "Image and media preview.", "openSilverGallery")}${tile("Files", "Open media files.", "openBaseFiles")}${tile("Slides", "Create presentations.", "openBaseSlides")}</div>` + endShell();
        open("Silver Media", html, "silverMedia");
    };

    window.openSilverAssistant = function () {
        const html = shellHeader("Silver Assistant", "Assistant settings and help") + `<div class="silver-grid">${tile("Assistant Settings", "Configure endpoint, offline/API mode, and history.", "openBaseAssistantSettings")}${tile("Assistant Sidebar", "Open assistant sidebar.", "openBaseAssistantSidebar")}${tile("Help", "Silver help topics.", "openSilverHelp")}</div>` + endShell();
        open("Silver Assistant", html, "silverAssistant");
    };
    window.openBaseAssistantSettings = () => safeCall("openAssistantSettings57", "Assistant Settings", "Assistant Settings is unavailable.");
    window.openBaseAssistantSidebar = () => safeCall("openAssistantSidebar57", "Assistant Sidebar", "Assistant Sidebar is unavailable.");

    window.openSilverAppMarket = function () {
        const html = shellHeader("Silver App Market", "User applications and appstore access") + `<div class="silver-warning"><b>Warning:</b> User-created apps can be unsafe. Only install apps from users you trust.</div><div class="silver-grid">${tile("Open User Appstore", "Install and publish user-created apps.", "openBaseAppstore")}${tile("App Library", "Run installed applications.", "openBaseAppLibrary")}${tile("App Scanner", "Review risky app patterns.", "openBaseAppScanner")}</div>` + endShell();
        open("Silver App Market", html, "silverAppMarket");
    };
    window.openBaseAppstore = () => safeCall("openUserAppstore57", "User Appstore", "User Appstore is unavailable.");
    window.openBaseAppLibrary = () => safeCall("openAppLibrary56", "App Library", "App Library is unavailable.");
    window.openBaseAppScanner = () => safeCall("openAppScanner57", "App Scanner", "App Scanner is unavailable.");

    window.openSilverCreatorStudio = function () {
        const html = shellHeader("Silver Creator Studio", "Coding, app creation, and safe system customization") + `
            <div class="silver-grid">
                ${tile("Application Editor", "Create Silver-compatible apps.", "openBaseApplicationEditor")}
                ${tile("Code Studio", "Code tools and snippets.", "openBaseCodeStudio")}
                ${tile("API Docs", "Custom app API reference.", "openBaseAPIDocs")}
                ${tile(".eapp Installer", "Install app packages.", "openBaseEappInstaller")}
                ${tile("Theme Studio", "Create Silver themes.", "openBaseThemeStudio")}
                ${tile("Icon Studio", "Design custom app icons.", "openBaseIconStudio")}
                ${tile("Registry Studio", "Edit safe registry settings.", "openBaseRegistryStudio")}
                ${tile("Startup Scripts", "Manage startup automation.", "openBaseStartupScripts")}
            </div>
        ` + endShell();
        open("Silver Creator Studio", html, "silverCreatorStudio");
    };
    window.openBaseApplicationEditor = () => safeCall("openApplicationEditor56", "Application Editor", "Application Editor is unavailable.");
    window.openBaseCodeStudio = () => safeCall("openCodeStudio56", "Code Studio", "Code Studio is unavailable.");
    window.openBaseAPIDocs = () => safeCall("openCustomAppAPIDocs56", "API Docs", "API Docs are unavailable.");
    window.openBaseEappInstaller = () => safeCall("openEappInstaller56", ".eapp Installer", ".eapp Installer is unavailable.");
    window.openBaseThemeStudio = () => safeCall("openThemeStudio57", "Theme Studio", "Theme Studio is unavailable.");
    window.openBaseIconStudio = () => safeCall("openIconStudio57", "Icon Studio", "Icon Studio is unavailable.");
    window.openBaseRegistryStudio = () => safeCall("openRegistryStudio56", "Registry Studio", "Registry Studio is unavailable.");
    window.openBaseStartupScripts = () => safeCall("openStartupScriptCenter56", "Startup Scripts", "Startup Script Center is unavailable.");

    window.openSilverSecurity = function () {
        const html = shellHeader("Silver Security", "Privacy, blocking, safety, and repair") + `<div class="silver-grid">${tile("Security & Privacy", "Open platform security controls.", "openBaseSecurity")}${tile("Blocking Center", "Manage blocked users.", "openBaseBlocking")}${tile("App Scanner", "Check user app risk.", "openBaseAppScanner")}${tile("Recovery", "Repair Silver and platform settings.", "openSilverRecovery")}</div>` + endShell();
        open("Silver Security", html, "silverSecurity");
    };
    window.openBaseSecurity = () => safeCall("openSecurityPrivacy56", "Security & Privacy", "Security & Privacy is unavailable.");

    window.openSilverNetwork = function () {
        const html = shellHeader("Silver Network", "Cloud, sync, sharing, mail, and communication") + `${statusStrip()}<div class="silver-grid">${tile("Silver Mail", "Open internal mail.", "openSilverMail")}${tile("Silver Files", "Open storage and sharing.", "openSilverFiles")}${tile("Silver Chat", "Open integrated chat.", "openSilverChat")}${tile("Sync Queue", "Pending cloud operations.", "openBaseSyncQueue")}</div>` + endShell();
        open("Silver Network", html, "silverNetwork");
    };
    window.openBaseSyncQueue = () => safeCall("openSyncQueue57", "Sync Queue", "Sync Queue is unavailable.");

    window.openSilverPersonalization = function () {
        const html = shellHeader("Silver Personalization", "Change the Silver appearance and layout") + `
            <div class="silver-grid">
                <div class="silver-tile" onclick="document.body.dataset.theme='silver3';localStorage.setItem('40_theme','silver3');"><b>Apply Silverglass</b><small>Restore the Silver Alpha 3 theme.</small></div>
                ${tile("System Customizer", "Shell and layout options.", "openBaseSystemCustomizer")}
                ${tile("Theme Studio", "Create and preview themes.", "openBaseThemeStudio")}
                ${tile("Icon Studio", "Icon labels and custom icons.", "openBaseIconStudio")}
                ${tile("Desktop Tools", "Align, lock, restore, or reset desktop.", "openBaseDesktopTools")}
            </div>
            <div class="silver-list"><div class="silver-row"><span>Theme key</span><code>40_theme = silver3</code></div><div class="silver-row"><span>Product key</span><code>silver_product_line = ${esc(BUILD.displayName)}</code></div></div>
        ` + endShell();
        open("Silver Personalization", html, "silverPersonalization");
    };
    window.openBaseSystemCustomizer = () => safeCall("openSystemCustomizer57", "System Customizer", "System Customizer is unavailable.");
    window.openBaseDesktopTools = () => safeCall("openDesktopTools56", "Desktop Tools", "Desktop Tools is unavailable.");

    window.openSilverRecovery = function () {
        const html = shellHeader("Silver Recovery", "Repair Silver without deleting user data") + `<div class="silver-grid">${tile("Recovery Center", "Reset layout, cache, risky apps, and repairs.", "openBaseRecovery")}${tile("Safe Mode", "Disable risky customizations.", "openBaseSafeMode")}${tile("Reset Silver Layout", "Reinstall Silver desktop icons.", "silverResetLayout")}</div>` + endShell();
        open("Silver Recovery", html, "silverRecovery");
    };
    window.openBaseRecovery = () => safeCall("openRecoveryCenter56", "Recovery Center", "Recovery Center is unavailable.");
    window.openBaseSafeMode = () => safeCall("openSafeMode56", "Safe Mode", "Safe Mode is unavailable.");
    window.silverResetLayout = function () { installDesktop(); installStartMenuLinks(); addSilverNotification("Silver Recovery", "Silver desktop layout refreshed.", "Recovery"); };

    window.openSilverUpdates = function () {
        const html = shellHeader("Silver Updates", "Alpha Version 3 release notes and roadmap") + `
            <div class="silver-list">
                <div class="silver-row"><span>Separate Silver product identity</span><span class="silver-pill">New</span></div>
                <div class="silver-row"><span>Silver-branded app suite</span><span class="silver-pill">New</span></div>
                <div class="silver-row"><span>Silver Desk dashboard</span><span class="silver-pill">New</span></div>
                <div class="silver-row"><span>Silver Notes, Tasks, and Journal</span><span class="silver-pill">New</span></div>
                <div class="silver-row"><span>Improved sidebar gadgets and taskbar bell</span><span class="silver-pill">Improved</span></div>
                <div class="silver-row"><span>Cleaner glass windows and Start menu</span><span class="silver-pill">Improved</span></div>
            </div>
            <h3>Roadmap</h3><p>Alpha 3.x focuses on making Silver feel independent. Future Silver builds can add a complete Silver file manager, Silver mail client, Silver app market, and separate Silver setup experience.</p>
        ` + endShell();
        open("Silver Updates", html, "silverUpdates");
    };

    window.openSilverHelp = function () {
        const html = shellHeader("Silver Help and Support", "Guides for the Silver product line") + `
            <div class="silver-grid">
                <div class="silver-tile"><b>Getting Started</b><small>Use Silver Center, Silver Apps, and Silver Desk first.</small></div>
                <div class="silver-tile"><b>Files</b><small>Use Silver Files for storage and sharing.</small></div>
                <div class="silver-tile"><b>Creator Tools</b><small>Use Silver Creator Studio for app creation and customization.</small></div>
                <div class="silver-tile"><b>Safety</b><small>Use Silver Security before installing user-created apps.</small></div>
            </div>
        ` + endShell();
        open("Silver Help and Support", html, "silverHelp");
    };

    window.openSilverFeedback = () => safeCall("openFeedback56", "Silver Feedback", "Feedback tools are unavailable.");

    window.openSilverNotifications = function () {
        const notes = readJSON(LS.notifications, []);
        const rows = notes.map(n => `<div class="silver-note-item"><b>${esc(n.title)}</b> <span class="silver-pill">${n.read ? "Read" : "Unread"}</span><div><small>${esc(new Date(n.time).toLocaleString())} • ${esc(n.source || "Silver")}</small></div><p>${esc(n.body)}</p><button onclick="silverMarkNotificationRead('${esc(n.id)}')">Mark Read</button></div>`).join("") || "<p>No Silver notifications.</p>";
        const html = shellHeader("Silver Notifications", "Unread alerts stay available through the taskbar bell") + `<div class="silver-toolbar"><button onclick="silverMarkAllNotificationsRead()">Mark All Read</button><button onclick="silverClearNotifications()">Clear All</button><button onclick="silverDemoNotification()">Test Notification</button></div>${rows}` + endShell();
        open("Silver Notifications", html, "silverNotifications");
    };
    window.silverMarkNotificationRead = function (id) { writeJSON(LS.notifications, readJSON(LS.notifications, []).map(n => n.id === id ? { ...n, read: true } : n)); updateBell(); window.openSilverNotifications(); };
    window.silverMarkAllNotificationsRead = function () { writeJSON(LS.notifications, readJSON(LS.notifications, []).map(n => ({ ...n, read: true }))); updateBell(); window.openSilverNotifications(); };
    window.silverClearNotifications = function () { writeJSON(LS.notifications, []); updateBell(); window.openSilverNotifications(); };
    window.silverDemoNotification = function () { addSilverNotification("Silver Test", "This is a Silver Alpha 3 notification.", "Silver"); window.openSilverNotifications(); };

    function installKeyboardShortcuts() {
        window.addEventListener("keydown", event => {
            const key = event.key.toLowerCase();
            if (event.ctrlKey && event.altKey && key === "s") { event.preventDefault(); window.openSilverHub(); }
            if (event.ctrlKey && event.altKey && key === "a") { event.preventDefault(); window.openSilverApps(); }
            if (event.ctrlKey && event.altKey && key === "d") { event.preventDefault(); window.openSilverDesk(); }
        });
    }

    function bootSilver() {
        applyShellLabels();
        installRibbon();
        installSidebar();
        installDesktop();
        installStartMenuLinks();
        installKeyboardShortcuts();
        updateBell();
        setTimeout(() => { applyShellLabels(); installDesktop(); installStartMenuLinks(); updateBell(); }, 800);
        setTimeout(() => { installDesktop(); installStartMenuLinks(); updateBell(); }, 1800);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootSilver);
    else bootSilver();
})();
