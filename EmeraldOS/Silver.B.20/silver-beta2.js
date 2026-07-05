"use strict";

/* =========================================================
   EMERALDOS SILVER BETA 2.0
   Separate Silver product-line shell, universal notifications,
   Silver app logos, improved Silver Office, and cloud VM resume.
   Original Silver-inspired assets only. No Microsoft assets.
========================================================= */
(function () {
    if (window.EmeraldOSSilverBeta11Loaded) return;
    window.EmeraldOSSilverBeta11Loaded = true;

    const BUILD = {
        productLine: "EmeraldOS Silver",
        displayName: "EmeraldOS Silver Beta 2.0",
        channel: "Beta",
        version: "2.0",
        codename: "Silver Cloud Workspace",
        platform: "EmeraldOS Platform 5.7",
        storagePrefix: "silver20_",
        cloudCollection: "emeraldOSUsers",
        sessionCollection: "silverBeta20"
    };

    const LS = {
        preferences: BUILD.storagePrefix + "preferences",
        notifications: BUILD.storagePrefix + "notifications",
        officeDocs: BUILD.storagePrefix + "office_documents",
        sheets: BUILD.storagePrefix + "office_sheets",
        slides: BUILD.storagePrefix + "office_slides",
        notes: BUILD.storagePrefix + "notes",
        tasks: BUILD.storagePrefix + "tasks",
        journal: BUILD.storagePrefix + "journal",
        vmState: BUILD.storagePrefix + "vm_state",
        restoreDismissed: BUILD.storagePrefix + "restore_dismissed"
    };

    const ICONS = {
        home: { letters: "S", cls: "home" }, files: { letters: "FL", cls: "files" }, office: { letters: "OF", cls: "office" }, mail: { letters: "ML", cls: "mail" }, chat: { letters: "CH", cls: "chat" }, people: { letters: "PE", cls: "people" }, calendar: { letters: "CA", cls: "calendar" }, notes: { letters: "NT", cls: "notes" }, tasks: { letters: "TS", cls: "tasks" }, journal: { letters: "JR", cls: "journal" }, gallery: { letters: "GA", cls: "gallery" }, media: { letters: "MD", cls: "media" }, assistant: { letters: "AI", cls: "assistant" }, store: { letters: "ST", cls: "store" }, library: { letters: "LB", cls: "store" }, creator: { letters: "CR", cls: "creator" }, code: { letters: "JS", cls: "creator" }, security: { letters: "SC", cls: "security" }, settings: { letters: "SE", cls: "settings" }, sync: { letters: "SY", cls: "sync" }, recovery: { letters: "RC", cls: "recovery" }, help: { letters: "?", cls: "help" }, feedback: { letters: "FB", cls: "feedback" }, network: { letters: "NW", cls: "network" }, personal: { letters: "PS", cls: "personal" }, notifications: { letters: "NO", cls: "assistant" }, control: { letters: "CP", cls: "settings" }, vault: { letters: "VA", cls: "vault" }
    };

    const SILVER_APPS = [
        { id: "home", name: "Silver Home", icon: "home", category: "Core", desktop: true, desc: "Daily dashboard, restore status, and quick actions.", run: "openSilverBetaHome" },
        { id: "apps", name: "Silver Apps", icon: "home", category: "Core", desktop: true, desc: "All Silver Beta applications with unique logos.", run: "openSilverBetaApps" },
        { id: "files", name: "Silver Files", icon: "files", category: "Files", desktop: true, desc: "Silver file hub for storage, sharing, and recent files.", run: "openSilverBetaFiles" },
        { id: "office", name: "Silver Office", icon: "office", category: "Office", desktop: true, desc: "Writer, Sheets, Slides, Forms, Templates, and Vault.", run: "openSilverBetaOffice" },
        { id: "mail", name: "Silver Mail", icon: "mail", category: "Communication", desktop: true, desc: "EmeraldOS mail with Silver interface and unread alerts.", run: "openSilverBetaMail" },
        { id: "chat", name: "Silver Chat", icon: "chat", category: "Communication", desktop: true, desc: "Integrated chat, DMs, rooms, and message tools.", run: "openSilverBetaChat" },
        { id: "people", name: "Silver People", icon: "people", category: "Communication", desc: "Users, profiles, contacts, and blocking.", run: "openSilverBetaPeople" },
        { id: "calendar", name: "Silver Calendar", icon: "calendar", category: "Productivity", desc: "Calendar and schedule view.", run: "openSilverBetaCalendar" },
        { id: "notes", name: "Silver Notes", icon: "notes", category: "Productivity", desc: "Silver-specific notes saved to the Silver VM profile.", run: "openSilverBetaNotes" },
        { id: "tasks", name: "Silver Tasks", icon: "tasks", category: "Productivity", desc: "Silver-specific task list with local and cloud resume.", run: "openSilverBetaTasks" },
        { id: "journal", name: "Silver Journal", icon: "journal", category: "Productivity", desc: "Private Silver journal entries.", run: "openSilverBetaJournal" },
        { id: "gallery", name: "Silver Gallery", icon: "gallery", category: "Media", desc: "Image and media front end.", run: "openSilverBetaGallery" },
        { id: "media", name: "Silver Media", icon: "media", category: "Media", desc: "Media center and playback launch panel.", run: "openSilverBetaMedia" },
        { id: "assistant", name: "Silver Assistant", icon: "assistant", category: "Assistant", desktop: true, desc: "Assistant settings, API endpoint, sidebar, and help.", run: "openSilverBetaAssistant" },
        { id: "appmarket", name: "Silver App Market", icon: "store", category: "Creator", desktop: true, desc: "User Appstore with risk warning, reviews, and app details.", run: "openSilverBetaAppMarket" },
        { id: "library", name: "Silver App Library", icon: "library", category: "Creator", desc: "Installed user apps and .eapp tools.", run: "openSilverBetaAppLibrary" },
        { id: "creator", name: "Silver Creator Studio", icon: "creator", category: "Creator", desktop: true, desc: "Application Editor, Code Studio, API docs, Theme Studio, and Icon Studio.", run: "openSilverBetaCreatorStudio" },
        { id: "code", name: "Silver Code Studio", icon: "code", category: "Creator", desc: "Code tools, snippets, publishing checks, and app scanner.", run: "openSilverBetaCodeStudio" },
        { id: "control", name: "Silver Control Center", icon: "control", category: "System", desc: "Unified settings, accessibility, personalization, and system control.", run: "openSilverBetaControlCenter" },
        { id: "personal", name: "Silver Personalization", icon: "personal", category: "System", desc: "Themes, wallpapers, icon sizing, and layout presets.", run: "openSilverBetaPersonalization" },
        { id: "notifications", name: "Universal Notifications", icon: "notifications", category: "System", desktop: true, desc: "Unread mail, shares, chat, appstore, sync, and system alerts.", run: "openSilverBetaNotifications" },
        { id: "network", name: "Silver Network", icon: "network", category: "System", desc: "Cloud status, sync queue, sharing, and connection tools.", run: "openSilverBetaNetwork" },
        { id: "security", name: "Silver Security", icon: "security", category: "Security", desc: "Privacy, blocking, app risk scanning, and safety controls.", run: "openSilverBetaSecurity" },
        { id: "recovery", name: "Silver Recovery", icon: "recovery", category: "System", desc: "Safe Mode, reset tools, and session recovery.", run: "openSilverBetaRecovery" },
        { id: "session", name: "Resume Center", icon: "sync", category: "System", desktop: true, desc: "Cloud VM session save, restore, and device continuity.", run: "openSilverBetaSessionCenter" },
        { id: "help", name: "Silver Help", icon: "help", category: "Support", desc: "Getting started, app help, troubleshooting, and shortcuts.", run: "openSilverBetaHelp" },
        { id: "feedback", name: "Silver Feedback", icon: "feedback", category: "Support", desc: "Bug reports, feedback, and experience rating.", run: "openSilverBetaFeedback" },
        { id: "vault", name: "Silver Vault", icon: "vault", category: "Files", desc: "Document vault, saved Office files, and protected file actions.", run: "openSilverBetaVault" }
    ];

    let firebaseCache = null;
    let restorePromptShown = false;
    let notifyPatched = false;

    function esc(value) {
        return String(value ?? "").replace(/[&<>'"]/g, ch => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
        }[ch]));
    }

    function readJSON(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
        catch { return fallback; }
    }

    function writeJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

    function getUsername() { return localStorage.getItem("40_username") || localStorage.getItem("username") || localStorage.getItem("40_session") || "SilverUser"; }
    function getEdition() { return localStorage.getItem("40_edition") || localStorage.getItem("emerald_edition") || "Virtue"; }

    function logo(iconId, small) {
        const def = ICONS[iconId] || ICONS.home;
        return `<span class="silver-beta-logo ${esc(def.cls)} ${small ? "small" : ""}">${esc(def.letters)}</span>`;
    }

    function appLogo(app, small) { return logo(app.icon || app.id, small); }

    function header(iconId, title, subtitle) {
        return `<div class="silver-beta-shell"><div class="silver-beta-header">${logo(iconId)}<div><h2>${esc(title)}</h2><p>${esc(subtitle || BUILD.codename)}</p></div></div>`;
    }
    function end() { return `</div>`; }

    function open(title, html, appId, opts = {}) {
        if (typeof window.openWindow === "function") {
            window.openWindow(title, html, appId || title.replace(/\W+/g, "").toLowerCase());
        } else {
            const div = document.createElement("div");
            div.className = "silver-toast-center";
            div.innerHTML = `<h3>${esc(title)}</h3>${html}`;
            document.body.appendChild(div);
        }
        if (!opts.skipSession) rememberOpenedApp(appId || title.replace(/\W+/g, "").toLowerCase());
    }

    function safeCall(fnName, fallbackTitle, fallbackText) {
        const fn = window[fnName];
        if (typeof fn === "function") {
            try { return fn(); }
            catch (err) { silverNotify("Silver Compatibility", `${fallbackTitle} failed: ${err.message}`, "Compatibility", "warning"); }
        }
        open(fallbackTitle || "Silver Compatibility", `${header("settings", fallbackTitle || "Silver Compatibility", "Platform service bridge")}<p>${esc(fallbackText || "This platform service is not available in this build.")}</p>${end()}`, "silverCompatibility");
    }

    function appCard(app) {
        return `<div class="silver-app-card" onclick="window['${esc(app.run)}']?.()">${appLogo(app)}<div><b>${esc(app.name)}</b><small>${esc(app.desc)}</small><div class="meta"><span class="silver-pill">${esc(app.category)}</span><span class="silver-pill">Silver Beta</span></div></div></div>`;
    }

    function appGrid(apps = SILVER_APPS) { return `<div class="silver-beta-grid">${apps.map(appCard).join("")}</div>`; }

    function statusCards() {
        return `<div class="silver-status">
            <div class="silver-status-card"><b>Product line</b><span>${esc(BUILD.productLine)}</span></div>
            <div class="silver-status-card"><b>Release</b><span>${esc(BUILD.channel)} ${esc(BUILD.version)}</span></div>
            <div class="silver-status-card"><b>User</b><span>${esc(getUsername())}</span></div>
            <div class="silver-status-card"><b>Edition</b><span>${esc(getEdition())}</span></div>
        </div>`;
    }

    function getPrefs() {
        return readJSON(LS.preferences, { restoreMode: "prompt", hideBaseDesktop: true, notifications: true, officeAutosave: true });
    }
    function setPrefs(prefs) { writeJSON(LS.preferences, { ...getPrefs(), ...prefs }); }

    function getVMState() {
        return readJSON(LS.vmState, { openApps: [], lastSavedAt: null, device: navigator.userAgent.slice(0, 80), product: BUILD.displayName });
    }
    function setVMState(state) { writeJSON(LS.vmState, { ...getVMState(), ...state, product: BUILD.displayName }); }

    function rememberOpenedApp(appId) {
        if (!appId || appId === "silverCompatibility") return;
        const state = getVMState();
        const openApps = [appId, ...(state.openApps || []).filter(id => id !== appId)].slice(0, 10);
        setVMState({ openApps, lastLocalActivityAt: new Date().toISOString() });
        scheduleCloudSave();
    }

    function appBySessionId(id) {
        const direct = SILVER_APPS.find(a => a.id === id || `silver-${a.id}` === id || `silverBeta${a.id}` === id);
        if (direct) return direct;
        const normalized = String(id || "").replace(/^silverBeta/i, "").replace(/^silver/i, "").toLowerCase();
        return SILVER_APPS.find(a => a.id.toLowerCase() === normalized);
    }

    function silverNotify(title, body, source = "Silver", level = "info", extra = {}) {
        const prefs = getPrefs();
        const list = readJSON(LS.notifications, []);
        const item = {
            id: Date.now() + "_" + Math.random().toString(36).slice(2),
            title: String(title || "Silver Notification"), body: String(body || ""), source, level,
            read: false, time: new Date().toISOString(), ...extra
        };
        list.unshift(item);
        writeJSON(LS.notifications, list.slice(0, 150));
        updateNotificationBell();
        if (prefs.notifications !== false && typeof window.__silverOriginalNotify === "function" && !extra.fromBaseNotify) {
            try { window.__silverOriginalNotify(item.title, item.body, 3200, level); } catch {}
        }
        scheduleCloudSave();
        return item.id;
    }
    window.silverNotify = silverNotify;

    function patchBaseNotify() {
        if (notifyPatched || typeof window.notify !== "function") return;
        notifyPatched = true;
        window.__silverOriginalNotify = window.notify;
        window.notify = function (title, message, timeout, type) {
            try { silverNotify(title, message, "Platform", type || "info", { fromBaseNotify: true }); } catch {}
            return window.__silverOriginalNotify(title, message, timeout, type);
        };
    }

    function updateNotificationBell() {
        const count = readJSON(LS.notifications, []).filter(n => !n.read).length;
        const bell = document.getElementById("silver-bell");
        if (bell) {
            bell.textContent = String(count);
            bell.classList.toggle("has-unread", count > 0);
            bell.title = count ? `${count} unread Silver notification${count === 1 ? "" : "s"}` : "Universal Silver Notifications";
        }
        const side = document.getElementById("silver-side-unread");
        if (side) side.textContent = String(count);
    }

    function setSyncStatus(text, cls) {
        const sync = document.getElementById("silver-sync");
        if (!sync) return;
        sync.textContent = text;
        sync.classList.remove("sync-good", "sync-bad", "sync-busy");
        if (cls) sync.classList.add(cls);
    }

    async function getFirebase() {
        if (firebaseCache) return firebaseCache;
        try {
            firebaseCache = await import("./firebase.js");
            return firebaseCache;
        } catch (err) {
            console.warn("Silver Firebase unavailable", err);
            return null;
        }
    }

    async function buildCloudPayload() {
        return {
            product: BUILD.displayName,
            username: getUsername(),
            updatedAt: Date.now(),
            updatedAtISO: new Date().toISOString(),
            vmState: getVMState(),
            preferences: getPrefs(),
            notifications: readJSON(LS.notifications, []).slice(0, 80),
            officeDocs: readJSON(LS.officeDocs, []),
            notes: readJSON(LS.notes, []),
            tasks: readJSON(LS.tasks, []),
            journal: readJSON(LS.journal, []),
            userAgent: navigator.userAgent.slice(0, 160)
        };
    }

    async function cloudSaveSession(silent = false) {
        const fb = await getFirebase();
        if (!fb || !fb.db || !fb.doc || !fb.setDoc) {
            setSyncStatus("Local", "sync-bad");
            if (!silent) silverNotify("Silver Sync", "Firebase is unavailable. Session saved locally only.", "Sync", "warning");
            return false;
        }
        const username = getUsername();
        if (!username || username === "SilverUser") {
            setSyncStatus("Local", "sync-bad");
            if (!silent) silverNotify("Silver Sync", "No signed-in username found. Session saved locally only.", "Sync", "warning");
            return false;
        }
        try {
            setSyncStatus("Saving", "sync-busy");
            await fb.setDoc(fb.doc(fb.db, BUILD.cloudCollection, username, BUILD.sessionCollection, "current"), await buildCloudPayload(), { merge: true });
            setVMState({ lastSavedAt: new Date().toISOString(), lastCloudSaveAt: Date.now() });
            setSyncStatus("Synced", "sync-good");
            if (!silent) silverNotify("Silver Sync", "Silver VM session saved to cloud.", "Sync", "success");
            return true;
        } catch (err) {
            console.warn("Silver cloud save failed", err);
            setSyncStatus("Failed", "sync-bad");
            if (!silent) silverNotify("Silver Sync Failed", err.message || "Could not save Silver VM session.", "Sync", "error");
            return false;
        }
    }
    window.silverCloudSaveSession = cloudSaveSession;

    async function cloudLoadSession() {
        const fb = await getFirebase();
        if (!fb || !fb.db || !fb.doc || !fb.getDoc) return null;
        const username = getUsername();
        if (!username || username === "SilverUser") return null;
        try {
            setSyncStatus("Loading", "sync-busy");
            const snap = await fb.getDoc(fb.doc(fb.db, BUILD.cloudCollection, username, BUILD.sessionCollection, "current"));
            if (!snap.exists()) { setSyncStatus("New", "sync-good"); return null; }
            setSyncStatus("Synced", "sync-good");
            return snap.data();
        } catch (err) {
            console.warn("Silver cloud load failed", err);
            setSyncStatus("Failed", "sync-bad");
            return null;
        }
    }
    window.silverCloudLoadSession = cloudLoadSession;

    function applyCloudPayload(payload = {}) {
        if (payload.preferences) writeJSON(LS.preferences, payload.preferences);
        if (payload.notifications) writeJSON(LS.notifications, payload.notifications);
        if (payload.officeDocs) writeJSON(LS.officeDocs, payload.officeDocs);
        if (payload.notes) writeJSON(LS.notes, payload.notes);
        if (payload.tasks) writeJSON(LS.tasks, payload.tasks);
        if (payload.journal) writeJSON(LS.journal, payload.journal);
        if (payload.vmState) writeJSON(LS.vmState, payload.vmState);
        updateNotificationBell();
    }

    function restoreAppsFromState(state = getVMState()) {
        const apps = (state.openApps || []).slice(0, 6).map(appBySessionId).filter(Boolean);
        if (!apps.length) { window.openSilverBetaHome(); return; }
        apps.reverse().forEach((app, index) => setTimeout(() => window[app.run]?.(), 250 * index));
        silverNotify("Silver Resume", `Restored ${apps.length} Silver app${apps.length === 1 ? "" : "s"}.`, "Resume", "success");
    }
    window.silverRestoreSession = () => restoreAppsFromState(getVMState());

    let cloudSaveTimer = null;
    function scheduleCloudSave() {
        clearTimeout(cloudSaveTimer);
        cloudSaveTimer = setTimeout(() => cloudSaveSession(true), 1800);
    }

    async function maybeOfferCloudRestore() {
        if (restorePromptShown || localStorage.getItem(LS.restoreDismissed) === "true") return;
        restorePromptShown = true;
        const prefs = getPrefs();
        const payload = await cloudLoadSession();
        if (!payload || !payload.vmState) return;
        const cloudTime = payload.updatedAt || 0;
        const localTime = getVMState().lastCloudSaveAt || 0;
        const hasApps = Array.isArray(payload.vmState.openApps) && payload.vmState.openApps.length;
        if (!hasApps && cloudTime <= localTime) return;
        if (prefs.restoreMode === "auto") {
            applyCloudPayload(payload);
            restoreAppsFromState(payload.vmState);
            return;
        }
        showCenterToast("Continue Silver where you left off?", `A Silver VM session was found for ${esc(payload.username || getUsername())}. Last saved ${esc(payload.updatedAtISO || "recently")}.`, [
            { label: "Restore Session", action: () => { closeCenterToast(); applyCloudPayload(payload); restoreAppsFromState(payload.vmState); } },
            { label: "Not Now", action: () => { closeCenterToast(); } }
        ]);
    }

    function showCenterToast(title, body, buttons = []) {
        closeCenterToast();
        const box = document.createElement("div");
        box.id = "silver-center-toast";
        box.className = "silver-toast-center";
        box.innerHTML = `<h3>${esc(title)}</h3><p>${body}</p><div class="silver-beta-toolbar">${buttons.map((b, i) => `<button id="silver-toast-btn-${i}">${esc(b.label)}</button>`).join("")}</div>`;
        document.body.appendChild(box);
        buttons.forEach((b, i) => document.getElementById(`silver-toast-btn-${i}`)?.addEventListener("click", b.action));
    }
    function closeCenterToast() { document.getElementById("silver-center-toast")?.remove(); }

    function installDesktopIcon(app) {
        const desktop = document.getElementById("desktop");
        if (!desktop || document.getElementById(`silver-beta-icon-${app.id}`)) return;
        const icon = document.createElement("div");
        icon.id = `silver-beta-icon-${app.id}`;
        icon.className = "icon silver-beta-icon";
        icon.tabIndex = 0;
        icon.innerHTML = `${appLogo(app)}<br>${esc(app.name.replace(/^Silver\s*/, ""))}`;
        const launch = () => { setTimeout(() => icon.blur(), 40); window[app.run]?.(); };
        icon.addEventListener("click", launch);
        icon.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); launch(); } });
        desktop.appendChild(icon);
    }

    function installDesktop() {
        const prefs = getPrefs();
        document.body.classList.toggle("silver-beta-only", prefs.hideBaseDesktop !== false);
        SILVER_APPS.filter(a => a.desktop).forEach(installDesktopIcon);
    }

    function installStartMenuLinks() {
        const results = document.getElementById("start-results");
        if (!results || document.getElementById("silver-beta-start-links")) return;
        const group = document.createElement("div");
        group.id = "silver-beta-start-links";
        group.innerHTML = SILVER_APPS.filter(a => ["Core", "Office", "Communication", "Creator", "System"].includes(a.category)).slice(0, 18).map(a => `<div class="start-item" onclick="window['${esc(a.run)}']?.()">${esc(a.name)}</div>`).join("");
        results.prepend(group);
    }

    function installSidebar() {
        if (document.getElementById("silver-sidebar")) return;
        const sidebar = document.createElement("div");
        sidebar.id = "silver-sidebar";
        sidebar.innerHTML = `
            <div class="silver-gadget"><h4>Silver Clock</h4><div class="big" id="silver-clock-time">--:--</div><small id="silver-clock-date"></small></div>
            <div class="silver-gadget"><h4>VM Resume</h4><div class="big" id="silver-vm-state">Ready</div><small>Cloud session continuity</small><button onclick="silverCloudSaveSession(false)">Save Now</button></div>
            <div class="silver-gadget"><h4>Notifications</h4><div class="big" id="silver-side-unread">0</div><small>Universal unread alerts</small><button onclick="openSilverBetaNotifications()">Open</button></div>
            <div class="silver-gadget"><h4>Quick Access</h4><button onclick="openSilverBetaHome()">Home</button><button onclick="openSilverBetaOffice()">Office</button><button onclick="openSilverBetaApps()">Apps</button></div>
        `;
        document.body.appendChild(sidebar);
        const update = () => {
            const now = new Date();
            const time = document.getElementById("silver-clock-time");
            const date = document.getElementById("silver-clock-date");
            const vm = document.getElementById("silver-vm-state");
            if (time) time.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            if (date) date.textContent = now.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
            if (vm) vm.textContent = getVMState().lastSavedAt ? "Saved" : "Ready";
            updateNotificationBell();
        };
        update();
        setInterval(update, 1000);
    }

    function installVMBadge() {
        if (document.getElementById("silver-vm-badge")) return;
        const badge = document.createElement("div");
        badge.id = "silver-vm-badge";
        badge.className = "silver-vm-badge";
        badge.textContent = "Silver VM: local + cloud resume";
        document.body.appendChild(badge);
    }

    function applyShellLabels() {
        document.title = BUILD.displayName;
        document.body.dataset.theme = "silver-beta11";
        localStorage.setItem("silver_product_line", BUILD.displayName);
        localStorage.setItem("40_theme", "silver-beta11");
        const start = document.getElementById("start-btn");
        if (start) start.textContent = "Silver";
        const side = document.querySelector(".start-side");
        if (side) side.textContent = "Silver";
        const editionBadge = document.getElementById("emerald40-edition-badge");
        if (editionBadge) editionBadge.textContent = BUILD.displayName;
        const buildBadge = document.getElementById("emerald40-build-badge");
        if (buildBadge) buildBadge.textContent = "Beta 2.0";
    }

    function installKeyboardShortcuts() {
        window.addEventListener("keydown", event => {
            const key = event.key.toLowerCase();
            if (event.ctrlKey && event.altKey && key === "s") { event.preventDefault(); window.openSilverBetaHome(); }
            if (event.ctrlKey && event.altKey && key === "a") { event.preventDefault(); window.openSilverBetaApps(); }
            if (event.ctrlKey && event.altKey && key === "o") { event.preventDefault(); window.openSilverBetaOffice(); }
            if (event.ctrlKey && event.altKey && key === "m") { event.preventDefault(); window.openSilverBetaMail(); }
            if (event.ctrlKey && event.altKey && key === "r") { event.preventDefault(); window.openSilverBetaSessionCenter(); }
        });
    }

    function groupedAppsHTML() {
        const cats = [...new Set(SILVER_APPS.map(a => a.category))];
        return cats.map(cat => `<h3>${esc(cat)}</h3>${appGrid(SILVER_APPS.filter(a => a.category === cat))}`).join("");
    }

    window.openSilverBetaHome = function () {
        const recent = (getVMState().openApps || []).slice(0, 5).map(appBySessionId).filter(Boolean);
        const html = header("home", "Silver Home", "Resume your Silver VM and open your daily tools") + statusCards() + `
            <div class="silver-beta-grid">
                ${appCard(SILVER_APPS.find(a => a.id === "session"))}
                ${appCard(SILVER_APPS.find(a => a.id === "office"))}
                ${appCard(SILVER_APPS.find(a => a.id === "mail"))}
                ${appCard(SILVER_APPS.find(a => a.id === "files"))}
                ${appCard(SILVER_APPS.find(a => a.id === "notifications"))}
                ${appCard(SILVER_APPS.find(a => a.id === "creator"))}
            </div>
            <h3>Resume</h3>
            <div class="silver-beta-list">
                <div class="silver-beta-row"><span>Last cloud save</span><b>${esc(getVMState().lastSavedAt || "Not saved yet")}</b></div>
                <div class="silver-beta-row"><span>Recent Silver apps</span><span>${recent.map(a => esc(a.name)).join(", ") || "No recent Silver apps"}</span></div>
            </div>
        ` + end();
        open("Silver Home", html, "home");
    };

    window.openSilverBetaApps = function () {
        const html = header("home", "Silver Apps", "Silver Beta uses separate Silver-branded apps with individual logos") + `<div class="silver-beta-toolbar"><input id="silver_app_filter" placeholder="Search Silver apps" oninput="silverFilterApps()"><select id="silver_app_category" onchange="silverFilterApps()"><option>All</option>${[...new Set(SILVER_APPS.map(a => a.category))].map(c => `<option>${esc(c)}</option>`).join("")}</select></div><div id="silver-app-list">${groupedAppsHTML()}</div>` + end();
        open("Silver Apps", html, "apps");
    };

    window.silverFilterApps = function () {
        const q = String(document.getElementById("silver_app_filter")?.value || "").toLowerCase();
        const cat = String(document.getElementById("silver_app_category")?.value || "All");
        const apps = SILVER_APPS.filter(a => (cat === "All" || a.category === cat) && (a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q)));
        const list = document.getElementById("silver-app-list");
        if (list) list.innerHTML = appGrid(apps);
    };

    window.openSilverBetaFiles = function () {
        const html = header("files", "Silver Files", "Cloud storage, sharing, recent files, and file safety") + `<div class="silver-beta-grid">
            ${tileApp("Open Files", "Open the platform Files app with Silver styling.", "openBaseFiles", "files")}
            ${tileApp("Shared With Me", "Open files shared with you.", "openBaseSharedWithMe", "files")}
            ${tileApp("Shared By Me", "View your outgoing shares.", "openBaseSharedByMe", "files")}
            ${tileApp("Storage Center", "View storage warnings and file sizes.", "openBaseStorage", "files")}
            ${tileApp("Silver Vault", "Open Silver document vault.", "openSilverBetaVault", "vault")}
        </div>` + end();
        open("Silver Files", html, "files");
    };

    function tileApp(title, desc, handler, icon) {
        return `<div class="silver-app-card" onclick="window['${esc(handler)}']?.()">${logo(icon || "home")}<div><b>${esc(title)}</b><small>${esc(desc)}</small></div></div>`;
    }

    window.openBaseFiles = () => safeCall("openFileExplorer", "Files", "The platform Files app is unavailable.");
    window.openBaseSharedWithMe = () => safeCall("openSharedWithMe51", "Shared With Me", "Shared With Me is unavailable.");
    window.openBaseSharedByMe = () => safeCall("openSharedByMe53", "Shared By Me", "Shared By Me is unavailable.");
    window.openBaseStorage = () => safeCall("openStorageCenter51", "Storage Center", "Storage Center is unavailable.");

    // --------------------------- Silver Office Beta ---------------------------
    function getDocsList() { return readJSON(LS.officeDocs, []); }
    function setDocsList(docs) { writeJSON(LS.officeDocs, docs); scheduleCloudSave(); }

    function wordCount(html) {
        const text = String(html || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();
        return text ? text.split(/\s+/).length : 0;
    }

    window.openSilverBetaOffice = function () {
        const docs = getDocsList();
        const html = header("office", "Silver Office Beta", "Improved Writer, Sheets, Slides, Forms, Templates, and Vault") + `
            <div class="silver-beta-grid">
                ${tileApp("Silver Writer", "Page-style writing, templates, export, print, save to Files.", "openSilverBetaWriter", "office")}
                ${tileApp("Silver Sheets", "Editable grid, totals, CSV import/export.", "openSilverBetaSheets", "office")}
                ${tileApp("Silver Slides", "Build and present simple slide decks.", "openSilverBetaSlides", "office")}
                ${tileApp("Silver Forms", "Create simple forms and response templates.", "openSilverBetaForms", "office")}
                ${tileApp("Templates", "Letters, memos, policies, reports.", "openSilverBetaTemplates", "office")}
                ${tileApp("Document Vault", `${docs.length} saved Silver document${docs.length === 1 ? "" : "s"}.`, "openSilverBetaVault", "vault")}
            </div>
        ` + end();
        open("Silver Office", html, "office");
    };

    window.openSilverBetaWriter = function (docId) {
        const docs = getDocsList();
        const doc = docs.find(d => d.id === docId) || { id: "draft_" + Date.now(), title: "Untitled Silver Document", html: "<h1>Untitled Silver Document</h1><p>Start writing here.</p>" };
        const html = header("office", "Silver Writer", "Page layout writing with templates, autosave, export, and cloud file save") + `
            <div class="silver-beta-toolbar">
                <input id="silver_writer_title" value="${esc(doc.title)}" placeholder="Document title">
                <button onclick="silverWriterCmd('bold')"><b>B</b></button>
                <button onclick="silverWriterCmd('italic')"><i>I</i></button>
                <button onclick="silverWriterCmd('underline')"><u>U</u></button>
                <button onclick="silverWriterCmd('insertUnorderedList')">Bullets</button>
                <button onclick="silverWriterCmd('insertOrderedList')">Numbers</button>
                <button onclick="silverWriterBlock('h1')">H1</button>
                <button onclick="silverWriterBlock('h2')">H2</button>
                <button onclick="silverWriterInsertTable()">Table</button>
                <button onclick="silverWriterInsertDate()">Date</button>
                <button onclick="silverWriterTemplate('letter')">Letter</button>
                <button onclick="silverWriterTemplate('memo')">Memo</button>
                <button onclick="silverWriterTemplate('policy')">Policy</button>
                <button onclick="silverSaveWriter('${esc(doc.id)}')">Save</button>
                <button onclick="silverWriterSaveToFiles('${esc(doc.id)}')">Save to Files</button>
                <button onclick="silverWriterExport('${esc(doc.id)}','html')">Export HTML</button>
                <button onclick="silverWriterExport('${esc(doc.id)}','txt')">Export TXT</button>
                <button onclick="window.print()">Print</button>
            </div>
            <div id="silver_writer_page" class="silver-page-editor" contenteditable="true" oninput="silverWriterStats()">${doc.html}</div>
            <div class="silver-beta-row"><span id="silver_writer_status">Ready</span><span id="silver_writer_stats">${wordCount(doc.html)} words</span></div>
        ` + end();
        open("Silver Writer", html, "office-writer");
        setTimeout(() => silverWriterStats(), 100);
    };

    window.silverWriterCmd = cmd => { document.execCommand(cmd, false, null); silverWriterStats(); };
    window.silverWriterBlock = tag => { document.execCommand("formatBlock", false, tag); silverWriterStats(); };
    window.silverWriterInsertTable = () => { document.execCommand("insertHTML", false, `<table border="1" style="border-collapse:collapse;width:100%"><tr><th>Item</th><th>Details</th></tr><tr><td>Example</td><td>Type here</td></tr></table><p></p>`); silverWriterStats(); };
    window.silverWriterInsertDate = () => { document.execCommand("insertText", false, new Date().toLocaleDateString()); silverWriterStats(); };
    window.silverWriterTemplate = type => {
        const templates = {
            letter: `<h1>Formal Letter</h1><p>Date: ${new Date().toLocaleDateString()}</p><p>Dear Recipient,</p><p>Write your letter here.</p><p>Sincerely,<br>${esc(getUsername())}</p>`,
            memo: `<h1>Memo</h1><p><b>To:</b> </p><p><b>From:</b> ${esc(getUsername())}</p><p><b>Date:</b> ${new Date().toLocaleDateString()}</p><p><b>Subject:</b> </p><hr><p>Memo body...</p>`,
            policy: `<h1>Policy Document</h1><h2>Purpose</h2><p>Describe the purpose.</p><h2>Scope</h2><p>Describe who this applies to.</p><h2>Policy</h2><p>Write the policy details.</p>`
        };
        const page = document.getElementById("silver_writer_page");
        if (page && confirm("Replace current document with this template?")) page.innerHTML = templates[type] || templates.letter;
        silverWriterStats();
    };
    window.silverWriterStats = () => {
        const page = document.getElementById("silver_writer_page");
        const stats = document.getElementById("silver_writer_stats");
        if (!page || !stats) return;
        const text = page.innerText || "";
        stats.textContent = `${wordCount(page.innerHTML)} words • ${text.length} characters`;
        const status = document.getElementById("silver_writer_status");
        if (status) status.textContent = getPrefs().officeAutosave ? "Autosave draft active" : "Ready";
    };
    window.silverSaveWriter = function (docId) {
        const title = document.getElementById("silver_writer_title")?.value || "Untitled Silver Document";
        const html = document.getElementById("silver_writer_page")?.innerHTML || "";
        const docs = getDocsList().filter(d => d.id !== docId);
        docs.unshift({ id: docId || "doc_" + Date.now(), title, html, updatedAt: new Date().toISOString(), type: "edoc" });
        setDocsList(docs.slice(0, 80));
        silverNotify("Silver Writer", `Saved “${title}”.`, "Office", "success");
        const status = document.getElementById("silver_writer_status");
        if (status) status.textContent = "Saved " + new Date().toLocaleTimeString();
    };
    window.silverWriterSaveToFiles = async function (docId) {
        window.silverSaveWriter(docId);
        const title = document.getElementById("silver_writer_title")?.value || "Untitled Silver Document";
        const html = document.getElementById("silver_writer_page")?.innerHTML || "";
        try {
            const cloud = await import("./cloudstorage.js");
            if (cloud?.createFile) {
                await cloud.createFile(`${title.replace(/[^a-z0-9_ -]/gi, "").slice(0, 60) || "Silver Document"}.edoc`, JSON.stringify({ title, html, app: "Silver Writer", version: BUILD.version }));
                silverNotify("Silver Writer", "Document saved to Files as .edoc.", "Office", "success");
            } else throw new Error("createFile unavailable");
        } catch (err) {
            silverNotify("Silver Writer", "Could not save to Files: " + err.message, "Office", "warning");
        }
    };
    window.silverWriterExport = function (docId, type) {
        const title = document.getElementById("silver_writer_title")?.value || "Silver Document";
        const html = document.getElementById("silver_writer_page")?.innerHTML || "";
        const content = type === "html" ? `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title></head><body>${html}</body></html>` : (document.getElementById("silver_writer_page")?.innerText || "");
        downloadText(`${title.replace(/[^a-z0-9_ -]/gi, "").slice(0, 60) || "Silver Document"}.${type}`, content);
    };

    function downloadText(filename, content) {
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = filename; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 500);
    }

    window.openSilverBetaSheets = function () {
        const rows = readJSON(LS.sheets, Array.from({ length: 8 }, () => Array.from({ length: 5 }, () => "")));
        const table = rows.map((r, i) => `<tr>${r.map((c, j) => `<td contenteditable="true" data-r="${i}" data-c="${j}" oninput="silverSheetsSave()">${esc(c)}</td>`).join("")}</tr>`).join("");
        const html = header("office", "Silver Sheets", "Editable spreadsheet with CSV export and auto totals") + `<div class="silver-beta-toolbar"><button onclick="silverSheetsAddRow()">Add Row</button><button onclick="silverSheetsAddColumn()">Add Column</button><button onclick="silverSheetsSave()">Save</button><button onclick="silverSheetsExportCSV()">Export CSV</button><button onclick="silverSheetsAutoTotal()">Auto Total Column A</button></div><table id="silver_sheet" class="silver-office-sheet"><tbody>${table}</tbody></table>` + end();
        open("Silver Sheets", html, "office-sheets");
    };
    window.silverSheetsRead = () => [...document.querySelectorAll("#silver_sheet tr")].map(tr => [...tr.children].map(td => td.innerText));
    window.silverSheetsSave = () => { writeJSON(LS.sheets, window.silverSheetsRead()); scheduleCloudSave(); };
    window.silverSheetsAddRow = () => { const rows = window.silverSheetsRead(); rows.push(Array.from({ length: rows[0]?.length || 5 }, () => "")); writeJSON(LS.sheets, rows); window.openSilverBetaSheets(); };
    window.silverSheetsAddColumn = () => { const rows = window.silverSheetsRead().map(r => [...r, ""]); writeJSON(LS.sheets, rows); window.openSilverBetaSheets(); };
    window.silverSheetsExportCSV = () => { const csv = window.silverSheetsRead().map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n"); downloadText("silver-sheet.csv", csv); };
    window.silverSheetsAutoTotal = () => { const rows = window.silverSheetsRead(); const total = rows.reduce((sum, r) => sum + (parseFloat(r[0]) || 0), 0); silverNotify("Silver Sheets", `Column A total: ${total}`, "Office", "info"); };

    window.openSilverBetaSlides = function () {
        const slides = readJSON(LS.slides, [{ title: "Silver Presentation", body: "Welcome to Silver Slides" }]);
        const list = slides.map((s, i) => `<div class="silver-beta-row"><span>${esc(i + 1)}. ${esc(s.title)}</span><button onclick="silverSlidesEdit(${i})">Edit</button></div>`).join("");
        const html = header("office", "Silver Slides", "Simple presentation builder") + `<div class="silver-beta-two-col"><div class="silver-beta-sidebar"><button onclick="silverSlidesAdd()">Add Slide</button><button onclick="silverSlidesPresent()">Present</button>${list}</div><div id="silver_slide_editor" class="silver-beta-mainpanel"><p>Select a slide.</p></div></div>` + end();
        open("Silver Slides", html, "office-slides");
    };
    window.silverSlidesEdit = i => {
        const slides = readJSON(LS.slides, []); const s = slides[i];
        const panel = document.getElementById("silver_slide_editor");
        if (panel) panel.innerHTML = `<input id="slide_title" value="${esc(s.title)}"><textarea id="slide_body" style="height:180px">${esc(s.body)}</textarea><button onclick="silverSlidesSave(${i})">Save Slide</button><div class="silver-slide-canvas"><h1>${esc(s.title)}</h1><p>${esc(s.body)}</p></div>`;
    };
    window.silverSlidesSave = i => { const slides = readJSON(LS.slides, []); slides[i] = { title: document.getElementById("slide_title")?.value || "Slide", body: document.getElementById("slide_body")?.value || "" }; writeJSON(LS.slides, slides); scheduleCloudSave(); window.openSilverBetaSlides(); };
    window.silverSlidesAdd = () => { const slides = readJSON(LS.slides, []); slides.push({ title: "New Slide", body: "Slide text" }); writeJSON(LS.slides, slides); window.openSilverBetaSlides(); };
    window.silverSlidesPresent = () => { const slides = readJSON(LS.slides, []); const html = header("office", "Silver Presentation", "Presenter mode") + slides.map(s => `<div class="silver-slide-canvas"><h1>${esc(s.title)}</h1><p>${esc(s.body)}</p></div><br>`).join("") + end(); open("Silver Presenter", html, "office-presenter"); };

    window.openSilverBetaForms = function () {
        const html = header("office", "Silver Forms", "Basic form builder") + `<div class="silver-beta-toolbar"><input id="form_title" placeholder="Form title"><select id="form_type"><option>Short answer</option><option>Paragraph</option><option>Multiple choice</option><option>Checkbox</option></select><button onclick="silverFormsAddQuestion()">Add Question</button></div><div id="silver_form_questions" class="silver-beta-list"></div>` + end();
        open("Silver Forms", html, "office-forms");
    };
    window.silverFormsAddQuestion = () => { const list = document.getElementById("silver_form_questions"); if (list) list.insertAdjacentHTML("beforeend", `<div class="silver-beta-row"><span>${esc(document.getElementById("form_type")?.value || "Question")}</span><input placeholder="Question text"></div>`); };
    window.openSilverBetaTemplates = () => open("Silver Templates", header("office", "Silver Templates", "Document starters") + appGrid([{ name: "Letter Template", icon: "office", category: "Template", desc: "Open Writer with a formal letter.", run: "silverWriterTemplateLetter" }, { name: "Memo Template", icon: "office", category: "Template", desc: "Open Writer with a memo.", run: "silverWriterTemplateMemo" }, { name: "Policy Template", icon: "office", category: "Template", desc: "Open Writer with a policy outline.", run: "silverWriterTemplatePolicy" }]) + end(), "office-templates");
    window.silverWriterTemplateLetter = () => { window.openSilverBetaWriter(); setTimeout(() => silverWriterTemplate("letter"), 150); };
    window.silverWriterTemplateMemo = () => { window.openSilverBetaWriter(); setTimeout(() => silverWriterTemplate("memo"), 150); };
    window.silverWriterTemplatePolicy = () => { window.openSilverBetaWriter(); setTimeout(() => silverWriterTemplate("policy"), 150); };
    window.openSilverBetaVault = function () {
        const docs = getDocsList();
        const rows = docs.map(d => `<div class="silver-beta-row"><span><b>${esc(d.title)}</b><br><small>${esc(d.updatedAt)}</small></span><span><button onclick="openSilverBetaWriter('${esc(d.id)}')">Open</button><button onclick="silverDeleteDoc('${esc(d.id)}')">Delete</button></span></div>`).join("") || "<p>No Silver Office documents saved yet.</p>";
        open("Silver Vault", header("vault", "Silver Vault", "Saved Silver documents") + `<div class="silver-beta-toolbar"><button onclick="openSilverBetaWriter()">New Document</button></div>${rows}` + end(), "vault");
    };
    window.silverDeleteDoc = id => { if (!confirm("Delete this Silver document?")) return; setDocsList(getDocsList().filter(d => d.id !== id)); window.openSilverBetaVault(); };

    // --------------------------- wrappers and local apps ---------------------------
    window.openSilverBetaMail = () => safeCall("openEmeraldMail57", "Silver Mail", "Emerald Mail is unavailable.");
    window.openSilverBetaChat = () => safeCall("openEmeraldChat52", "Silver Chat", "Integrated chat is unavailable.");
    window.openSilverBetaPeople = () => safeCall("openEmeraldOSUsers51", "Silver People", "EmeraldOS Users is unavailable.");
    window.openSilverBetaCalendar = () => safeCall("openCalendar", "Silver Calendar", "Calendar is unavailable.");
    window.openSilverBetaGallery = () => open("Silver Gallery", header("gallery", "Silver Gallery", "Media, photos, and visual files") + appGrid([SILVER_APPS.find(a => a.id === "files"), SILVER_APPS.find(a => a.id === "media")]) + end(), "gallery");
    window.openSilverBetaMedia = () => safeCall("openMediaPlayer", "Silver Media", "Media Player is unavailable.");
    window.openSilverBetaAssistant = () => open("Silver Assistant", header("assistant", "Silver Assistant", "Assistant settings, API mode, offline mode, and sidebar") + `<div class="silver-beta-grid">${tileApp("Assistant Settings", "Configure Worker endpoint and API mode.", "openAssistantSettings57", "assistant")}${tileApp("Assistant Sidebar", "Open the assistant side panel.", "openAssistantSidebar57", "assistant")}${tileApp("Ask About Silver", "Open help for this Silver build.", "openSilverBetaHelp", "help")}</div>` + end(), "assistant");
    window.openSilverBetaAppMarket = () => safeCall("openUserAppstore57", "Silver App Market", "User Appstore is unavailable.");
    window.openSilverBetaAppLibrary = () => safeCall("openAppLibrary56", "Silver App Library", "App Library is unavailable.");
    window.openSilverBetaCodeStudio = () => safeCall("openCodeStudio56", "Silver Code Studio", "Code Studio is unavailable.");
    window.openSilverBetaCreatorStudio = () => open("Silver Creator Studio", header("creator", "Silver Creator Studio", "Code, customize, package, and publish Silver-compatible apps") + `<div class="silver-beta-grid">${tileApp("Application Editor", "Build user applications.", "openApplicationEditor56", "creator")}${tileApp("Code Studio", "Write and test code.", "openCodeStudio56", "code")}${tileApp("API Docs", "Learn the custom app API.", "openCustomAppAPIDocs56", "code")}${tileApp(".eapp Installer", "Install app packages.", "openEappInstaller56", "store")}${tileApp("App Scanner", "Scan risky user app patterns.", "openAppScanner57", "security")}${tileApp("Icon Studio", "Create app logos.", "openIconStudio57", "personal")}${tileApp("Theme Studio", "Create Silver themes.", "openThemeStudio57", "personal")}${tileApp("System Customizer", "Edit safe shell settings.", "openSystemCustomizer57", "settings")}</div>` + end(), "creator");
    window.openSilverBetaControlCenter = () => open("Silver Control Center", header("control", "Silver Control Center", "Unified settings for the Silver experience") + `<div class="silver-beta-grid">${tileApp("Settings", "Open platform settings.", "openSettings56", "settings")}${tileApp("Personalization", "Silver themes and layout.", "openSilverBetaPersonalization", "personal")}${tileApp("Notifications", "Universal notifications.", "openSilverBetaNotifications", "notifications")}${tileApp("Accessibility", "Text size, contrast, and motion.", "openAccessibility56", "settings")}${tileApp("Session Center", "Cloud VM resume settings.", "openSilverBetaSessionCenter", "sync")}${tileApp("Recovery", "Repair Silver.", "openSilverBetaRecovery", "recovery")}</div>` + end(), "control");
    window.openSilverBetaPersonalization = () => open("Silver Personalization", header("personal", "Silver Personalization", "Theme, desktop, icons, and layout") + `<div class="silver-beta-grid"><div class="silver-app-card" onclick="document.body.dataset.theme='silver-beta1';localStorage.setItem('40_theme','silver-beta1');silverNotify('Personalization','Silver Beta theme applied.','Personalization','success')">${logo("personal")}<div><b>Apply Silver Beta</b><small>Restore the default Silver Beta glass theme.</small></div></div>${tileApp("Theme Studio", "Create custom themes.", "openThemeStudio57", "personal")}${tileApp("Icon Studio", "Create custom app logos.", "openIconStudio57", "personal")}${tileApp("Desktop Tools", "Align, lock, restore, and reset desktop.", "openDesktopTools56", "settings")}</div>` + end(), "personalization");
    window.openSilverBetaNetwork = () => open("Silver Network", header("network", "Silver Network", "Cloud, sync, sharing, mail, and communication") + statusCards() + `<div class="silver-beta-grid">${tileApp("Save VM Session", "Save current Silver state to cloud.", "silverCloudSaveSession", "sync")}${tileApp("Session Center", "Restore and manage continuity.", "openSilverBetaSessionCenter", "sync")}${tileApp("Sharing", "File sharing tools.", "openBaseSharedByMe", "files")}${tileApp("Mail", "Silver Mail.", "openSilverBetaMail", "mail")}</div>` + end(), "network");
    window.openSilverBetaSecurity = () => open("Silver Security", header("security", "Silver Security", "Privacy, app safety, blocking, and repair") + `<div class="silver-beta-grid">${tileApp("Security & Privacy", "Open platform security center.", "openSecurityPrivacy56", "security")}${tileApp("Blocking Center", "Block and unblock users.", "openBlockingCenter54", "people")}${tileApp("App Scanner", "Scan custom app risk.", "openAppScanner57", "security")}${tileApp("Recovery", "Safe repair tools.", "openSilverBetaRecovery", "recovery")}</div>` + end(), "security");
    window.openSilverBetaRecovery = () => open("Silver Recovery", header("recovery", "Silver Recovery", "Repair Silver without deleting user files") + `<div class="silver-beta-grid">${tileApp("Recovery Center", "Reset shell, Start menu, app pins, and cache.", "openRecoveryCenter56", "recovery")}${tileApp("Safe Mode", "Disable risky customization.", "openSafeMode56", "security")}<div class="silver-app-card" onclick="silverResetDesktop()">${logo("recovery")}<div><b>Reset Silver Desktop</b><small>Reinstall Silver Beta desktop icons.</small></div></div><div class="silver-app-card" onclick="localStorage.removeItem('${LS.restoreDismissed}');silverNotify('Resume','Restore prompts enabled.','Recovery','success')">${logo("sync")}<div><b>Enable Restore Prompts</b><small>Ask before restoring cloud session.</small></div></div></div>` + end(), "recovery");
    window.silverResetDesktop = () => { document.querySelectorAll(".silver-beta-icon").forEach(x => x.remove()); installDesktop(); silverNotify("Silver Recovery", "Silver desktop icons refreshed.", "Recovery", "success"); };

    window.openSilverBetaNotes = function () {
        const notes = readJSON(LS.notes, []);
        const rows = notes.map((n, i) => `<div class="silver-beta-row"><span><b>${esc(n.title)}</b><br><small>${esc(n.text.slice(0, 80))}</small></span><button onclick="silverDeleteNote(${i})">Delete</button></div>`).join("") || "<p>No notes yet.</p>";
        open("Silver Notes", header("notes", "Silver Notes", "Silver-specific notes that travel with your VM session") + `<div class="silver-beta-toolbar"><input id="silver_note_title" placeholder="Title"><input id="silver_note_text" placeholder="Note"><button onclick="silverAddNote()">Add</button></div>${rows}` + end(), "notes");
    };
    window.silverAddNote = () => { const notes = readJSON(LS.notes, []); notes.unshift({ title: document.getElementById("silver_note_title")?.value || "Note", text: document.getElementById("silver_note_text")?.value || "", time: new Date().toISOString() }); writeJSON(LS.notes, notes); silverNotify("Silver Notes", "Note saved.", "Notes", "success"); window.openSilverBetaNotes(); };
    window.silverDeleteNote = i => { const notes = readJSON(LS.notes, []); notes.splice(i, 1); writeJSON(LS.notes, notes); window.openSilverBetaNotes(); };

    window.openSilverBetaTasks = function () {
        const tasks = readJSON(LS.tasks, []);
        const rows = tasks.map((t, i) => `<div class="silver-beta-row"><span><input type="checkbox" ${t.done ? "checked" : ""} onchange="silverToggleTask(${i})"> <b>${esc(t.title)}</b><br><small>${esc(t.due || "No due date")}</small></span><button onclick="silverDeleteTask(${i})">Delete</button></div>`).join("") || "<p>No tasks yet.</p>";
        open("Silver Tasks", header("tasks", "Silver Tasks", "Task list saved with your Silver VM") + `<div class="silver-beta-toolbar"><input id="silver_task_title" placeholder="Task"><input id="silver_task_due" type="date"><button onclick="silverAddTask()">Add</button></div>${rows}` + end(), "tasks");
    };
    window.silverAddTask = () => { const tasks = readJSON(LS.tasks, []); tasks.unshift({ title: document.getElementById("silver_task_title")?.value || "Task", due: document.getElementById("silver_task_due")?.value || "", done: false }); writeJSON(LS.tasks, tasks); scheduleCloudSave(); window.openSilverBetaTasks(); };
    window.silverToggleTask = i => { const tasks = readJSON(LS.tasks, []); if (tasks[i]) tasks[i].done = !tasks[i].done; writeJSON(LS.tasks, tasks); scheduleCloudSave(); };
    window.silverDeleteTask = i => { const tasks = readJSON(LS.tasks, []); tasks.splice(i, 1); writeJSON(LS.tasks, tasks); window.openSilverBetaTasks(); };

    window.openSilverBetaJournal = function () {
        const entries = readJSON(LS.journal, []);
        const rows = entries.map((e, i) => `<div class="silver-beta-row"><span><b>${esc(e.date)}</b><br><small>${esc(e.text.slice(0, 120))}</small></span><button onclick="silverDeleteJournal(${i})">Delete</button></div>`).join("") || "<p>No journal entries.</p>";
        open("Silver Journal", header("journal", "Silver Journal", "Private Silver journal entries") + `<textarea id="silver_journal_text" style="height:120px" placeholder="Write today’s entry"></textarea><div class="silver-beta-toolbar"><button onclick="silverAddJournal()">Save Entry</button></div>${rows}` + end(), "journal");
    };
    window.silverAddJournal = () => { const entries = readJSON(LS.journal, []); entries.unshift({ date: new Date().toLocaleString(), text: document.getElementById("silver_journal_text")?.value || "" }); writeJSON(LS.journal, entries); scheduleCloudSave(); window.openSilverBetaJournal(); };
    window.silverDeleteJournal = i => { const entries = readJSON(LS.journal, []); entries.splice(i, 1); writeJSON(LS.journal, entries); window.openSilverBetaJournal(); };

    window.openSilverBetaNotifications = function () {
        const notes = readJSON(LS.notifications, []);
        const rows = notes.map(n => `<div class="silver-note-item"><b>${esc(n.title)}</b> <span class="silver-pill">${n.read ? "Read" : "Unread"}</span><div><small>${esc(new Date(n.time).toLocaleString())} • ${esc(n.source || "Silver")}</small></div><p>${esc(n.body)}</p><button onclick="silverMarkNotificationRead('${esc(n.id)}')">Mark Read</button></div>`).join("") || "<p>No notifications.</p>";
        open("Universal Notifications", header("notifications", "Universal Notifications", "Mail, chat, shares, sync, appstore, Office, and system alerts") + `<div class="silver-beta-toolbar"><button onclick="silverMarkAllNotificationsRead()">Mark All Read</button><button onclick="silverClearNotifications()">Clear All</button><button onclick="silverDemoNotification()">Test Notification</button></div>${rows}` + end(), "notifications");
    };
    window.silverMarkNotificationRead = id => { writeJSON(LS.notifications, readJSON(LS.notifications, []).map(n => n.id === id ? { ...n, read: true } : n)); updateNotificationBell(); window.openSilverBetaNotifications(); };
    window.silverMarkAllNotificationsRead = () => { writeJSON(LS.notifications, readJSON(LS.notifications, []).map(n => ({ ...n, read: true }))); updateNotificationBell(); window.openSilverBetaNotifications(); };
    window.silverClearNotifications = () => { writeJSON(LS.notifications, []); updateNotificationBell(); window.openSilverBetaNotifications(); };
    window.silverDemoNotification = () => { silverNotify("Silver Beta", "Universal notifications are working.", "System", "success"); window.openSilverBetaNotifications(); };

    window.openSilverBetaSessionCenter = function () {
        const state = getVMState();
        const prefs = getPrefs();
        const html = header("sync", "Resume Center", "Save and restore your Silver VM session across devices") + `
            <div class="silver-beta-list">
                <div class="silver-beta-row"><span>Signed-in user</span><b>${esc(getUsername())}</b></div>
                <div class="silver-beta-row"><span>Cloud path</span><code>emeraldOSUsers/${esc(getUsername())}/silverBeta/current</code></div>
                <div class="silver-beta-row"><span>Last saved</span><b>${esc(state.lastSavedAt || "Not saved yet")}</b></div>
                <div class="silver-beta-row"><span>Recent apps</span><span>${esc((state.openApps || []).join(", ") || "None")}</span></div>
                <div class="silver-beta-row"><span>Restore mode</span><select id="silver_restore_mode"><option ${prefs.restoreMode === "prompt" ? "selected" : ""}>prompt</option><option ${prefs.restoreMode === "auto" ? "selected" : ""}>auto</option><option ${prefs.restoreMode === "manual" ? "selected" : ""}>manual</option></select></div>
            </div>
            <div class="silver-beta-toolbar">
                <button onclick="silverSaveSessionSettings()">Save Settings</button>
                <button onclick="silverCloudSaveSession(false)">Save Session Now</button>
                <button onclick="silverLoadAndRestoreNow()">Load Cloud Session</button>
                <button onclick="silverRestoreSession()">Restore Local Apps</button>
            </div>
            <p><b>How it works:</b> Silver Beta saves your open Silver apps, Silver Office documents, notifications, notes, tasks, journal entries, and preferences to Firestore after login. When you use another device with the same EmeraldOS account, Silver can restore that VM session.</p>
        ` + end();
        open("Resume Center", html, "session");
    };
    window.silverSaveSessionSettings = () => { setPrefs({ restoreMode: document.getElementById("silver_restore_mode")?.value || "prompt" }); silverNotify("Resume Center", "Session settings saved.", "Resume", "success"); cloudSaveSession(true); };
    window.silverLoadAndRestoreNow = async () => { const payload = await cloudLoadSession(); if (payload) { applyCloudPayload(payload); restoreAppsFromState(payload.vmState); } else silverNotify("Resume Center", "No cloud session found.", "Resume", "warning"); };

    window.openSilverBetaHelp = () => open("Silver Help", header("help", "Silver Help and Support", "Guides for Silver Beta 2.0") + `<div class="silver-beta-grid"><div class="silver-app-card">${logo("home")}<div><b>Starting Silver</b><small>Login normally, open Silver Home, and restore your previous cloud session.</small></div></div><div class="silver-app-card">${logo("office")}<div><b>Using Silver Office</b><small>Create documents in Writer, save them to the Silver Vault, or export/save to Files.</small></div></div><div class="silver-app-card">${logo("sync")}<div><b>Device Continuity</b><small>Use Resume Center to save and restore your VM state across devices.</small></div></div><div class="silver-app-card">${logo("notifications")}<div><b>Notifications</b><small>The taskbar bell holds unread mail, chat, share, appstore, and system notices.</small></div></div></div>` + end(), "help");
    window.openSilverBetaFeedback = () => safeCall("openFeedback56", "Silver Feedback", "Feedback app is unavailable.");

    function boot() {
        applyShellLabels();
        installDesktop();
        installStartMenuLinks();
        installSidebar();
        installVMBadge();
        installKeyboardShortcuts();
        patchBaseNotify();
        updateNotificationBell();
        setTimeout(() => { applyShellLabels(); installDesktop(); installStartMenuLinks(); patchBaseNotify(); updateNotificationBell(); }, 700);
        setTimeout(() => { installDesktop(); installStartMenuLinks(); maybeOfferCloudRestore(); }, 1600);
        setInterval(() => cloudSaveSession(true), 60000);
        window.addEventListener("beforeunload", () => { setVMState({ lastLocalActivityAt: new Date().toISOString() }); });
        silverNotify("Silver Beta", "Welcome to EmeraldOS Silver Beta 2.0.", "System", "info");
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
})();


/* =========================================================
   EMERALDOS SILVER BETA 2.0 PATCH
   Customizable desktop folders, responsive shell,
   more Silver apps, and Drive-like Silver Office.
========================================================= */
(function () {
    "use strict";
    if (window.EmeraldOSSilverBeta11PatchLoaded) return;
    window.EmeraldOSSilverBeta11PatchLoaded = true;

    const BUILD = {
        name: "EmeraldOS Silver Beta 2.0",
        storagePrefix: "silver20_",
        cloudCollection: "emeraldOSUsers",
        sessionCollection: "silverBeta11"
    };

    const K = {
        desktopPrefs: BUILD.storagePrefix + "desktop_prefs",
        driveItems: BUILD.storagePrefix + "office_drive_items",
        driveView: BUILD.storagePrefix + "office_drive_view",
        driveFolder: BUILD.storagePrefix + "office_drive_folder",
        officePrefs: BUILD.storagePrefix + "office_prefs"
    };

    const ICONS = {
        home:["S","home"], folder:["▣","files"], files:["FL","files"], office:["OF","office"], drive:["DR","office"], docs:["DC","office"], sheets:["SH","office"], slides:["SL","office"], forms:["FM","office"], mail:["ML","mail"], chat:["CH","chat"], people:["PE","people"], creator:["CR","creator"], code:["JS","creator"], store:["ST","store"], settings:["SE","settings"], security:["SC","security"], media:["MD","media"], support:["?","help"], tasks:["TS","tasks"], calendar:["CA","calendar"], notes:["NT","notes"], journal:["JR","journal"], sync:["SY","sync"], admin:["AD","security"], tools:["TL","settings"], calculator:["+","settings"], feedback:["FB","feedback"], vault:["VA","vault"], apps:["AP","store"]
    };

    const FOLDERS = [
        { id:"essential", name:"Silver Essentials", icon:"home", desc:"Home, Apps, Search, notifications, and help.", apps:["home","apps","search","notifications","help","feedback"] },
        { id:"office", name:"Office & Drive", icon:"office", desc:"Drive-like Office workspace, Writer, Sheets, Slides, Forms, and Vault.", apps:["drive","office","docs","sheets","slides","forms","templates","vault"] },
        { id:"files", name:"Files & Storage", icon:"files", desc:"Files, storage, sharing, shared items, and sync tools.", apps:["files","drive","shared","sharedby","storage","vault","network"] },
        { id:"communication", name:"Communication", icon:"mail", desc:"Mail, chat, people, contacts, calendar, and blocking.", apps:["mail","chat","people","contacts","calendar","blocking"] },
        { id:"creator", name:"Creator Tools", icon:"creator", desc:"Application Editor, app market, code tools, themes, and publishing.", apps:["creator","appmarket","library","code","theme","icon","systemcustomizer"] },
        { id:"media", name:"Media & Personal", icon:"media", desc:"Gallery, media, notes, journal, tasks, and personal tools.", apps:["gallery","media","notes","tasks","journal","planner","calculator"] },
        { id:"system", name:"System & Settings", icon:"settings", desc:"Control Center, personalization, recovery, session, network, and updates.", apps:["control","personal","session","recovery","network","updates","desktop"] },
        { id:"security", name:"Security & Admin", icon:"security", desc:"Security, moderation, admin, privacy, and audits.", apps:["security","moderation","admin","audit","blocking"] },
        { id:"support", name:"Help & Support", icon:"support", desc:"Help, feedback, diagnostics, shortcuts, and learning tools.", apps:["help","feedback","diagnostics","shortcuts"] }
    ];

    const APPS = {
        home:{name:"Silver Home", icon:"home", run:"openSilverBetaHome", desc:"Dashboard and quick actions."},
        apps:{name:"Silver Apps", icon:"apps", run:"openSilverApps11", desc:"Every Silver application and folder."},
        search:{name:"Silver Search", icon:"tools", run:"openSilverSearch11", desc:"Search apps, folders, and Office files."},
        notifications:{name:"Notifications", icon:"settings", run:"openSilverBetaNotifications", desc:"Universal notification center."},
        help:{name:"Silver Help", icon:"support", run:"openSilverBetaHelp", desc:"Guides and support."},
        feedback:{name:"Silver Feedback", icon:"feedback", run:"openSilverBetaFeedback", desc:"Feedback and bug reports."},
        files:{name:"Silver Files", icon:"files", run:"openSilverBetaFiles", desc:"Files and cloud storage."},
        drive:{name:"Silver Drive", icon:"drive", run:"openSilverDrive11", desc:"Google Drive-style Office workspace."},
        office:{name:"Silver Office", icon:"office", run:"openSilverOfficeHub11", desc:"Office home, recent docs, and apps."},
        docs:{name:"Silver Docs", icon:"docs", run:"() => window.silverDriveNewItem11('edoc')", desc:"Create and edit rich documents."},
        sheets:{name:"Silver Sheets", icon:"sheets", run:"() => window.silverDriveNewItem11('esheet')", desc:"Create lightweight spreadsheets."},
        slides:{name:"Silver Slides", icon:"slides", run:"() => window.silverDriveNewItem11('eslide')", desc:"Create simple presentations."},
        forms:{name:"Silver Forms", icon:"forms", run:"() => window.silverDriveNewItem11('eform')", desc:"Create forms and questionnaires."},
        templates:{name:"Template Gallery", icon:"office", run:"openSilverTemplates11", desc:"Document, sheet, slide, and form starters."},
        vault:{name:"Silver Vault", icon:"vault", run:"openSilverBetaVault", desc:"Saved Office files and protected documents."},
        shared:{name:"Shared With Me", icon:"files", run:"openBaseSharedWithMe", desc:"Files shared by other users."},
        sharedby:{name:"Shared By Me", icon:"files", run:"openBaseSharedByMe", desc:"Files you shared."},
        storage:{name:"Storage Center", icon:"sync", run:"openStorageCenter51", desc:"Storage usage and warnings."},
        network:{name:"Silver Network", icon:"sync", run:"openSilverBetaNetwork", desc:"Sync, cloud, and connectivity."},
        mail:{name:"Silver Mail", icon:"mail", run:"openSilverBetaMail", desc:"EmeraldOS mail."},
        chat:{name:"Silver Chat", icon:"chat", run:"openSilverBetaChat", desc:"Integrated chat."},
        people:{name:"Silver People", icon:"people", run:"openSilverBetaPeople", desc:"Users and profiles."},
        contacts:{name:"Silver Contacts", icon:"people", run:"openContacts56", desc:"Contacts and favorites."},
        calendar:{name:"Silver Calendar", icon:"calendar", run:"openSilverBetaCalendar", desc:"Calendar and schedule."},
        blocking:{name:"Blocking Center", icon:"security", run:"openBlockingCenter54", desc:"Block and unblock users."},
        creator:{name:"Silver Creator Studio", icon:"creator", run:"openSilverBetaCreatorStudio", desc:"Build apps and customize Silver."},
        appmarket:{name:"Silver App Market", icon:"store", run:"openSilverBetaAppMarket", desc:"Install user-created apps."},
        library:{name:"Silver App Library", icon:"apps", run:"openSilverBetaAppLibrary", desc:"Manage installed apps."},
        code:{name:"Silver Code Studio", icon:"code", run:"openSilverBetaCodeStudio", desc:"Code and snippets."},
        theme:{name:"Theme Studio", icon:"settings", run:"openThemeStudio57", desc:"Create themes."},
        icon:{name:"Icon Studio", icon:"settings", run:"openIconStudio57", desc:"Create app icons."},
        systemcustomizer:{name:"System Customizer", icon:"settings", run:"openSystemCustomizer57", desc:"Safe system customization."},
        gallery:{name:"Silver Gallery", icon:"media", run:"openSilverBetaGallery", desc:"Images and visuals."},
        media:{name:"Silver Media", icon:"media", run:"openSilverBetaMedia", desc:"Media tools."},
        notes:{name:"Silver Notes", icon:"notes", run:"openSilverBetaNotes", desc:"Notes."},
        tasks:{name:"Silver Tasks", icon:"tasks", run:"openSilverBetaTasks", desc:"Tasks."},
        journal:{name:"Silver Journal", icon:"journal", run:"openSilverBetaJournal", desc:"Journal."},
        planner:{name:"Silver Planner", icon:"calendar", run:"openSilverPlanner11", desc:"Day planner and quick schedule."},
        calculator:{name:"Silver Calculator", icon:"calculator", run:"openSilverCalculator11", desc:"Simple calculator."},
        control:{name:"Control Center", icon:"settings", run:"openSilverBetaControlCenter", desc:"Unified settings."},
        personal:{name:"Personalization", icon:"settings", run:"openSilverBetaPersonalization", desc:"Themes, wallpaper, and layout."},
        session:{name:"Resume Center", icon:"sync", run:"openSilverBetaSessionCenter", desc:"Cloud VM continuity."},
        recovery:{name:"Silver Recovery", icon:"sync", run:"openSilverBetaRecovery", desc:"Repair tools."},
        updates:{name:"Silver Updates", icon:"sync", run:"openSilverUpdates11", desc:"Update notes and build status."},
        desktop:{name:"Desktop Customizer", icon:"settings", run:"openSilverDesktopCustomizer11", desc:"Choose desktop folders, apps, size, density, and sidebar."},
        security:{name:"Silver Security", icon:"security", run:"openSilverBetaSecurity", desc:"Security and privacy."},
        moderation:{name:"Moderation Center", icon:"security", run:"openModerationCenter54", desc:"Moderation tools."},
        admin:{name:"Administrative Panel", icon:"admin", run:"openAdministrativePanel50", desc:"Executive tools."},
        audit:{name:"Silver Audit", icon:"security", run:"openCommunicationAudit52", desc:"Audit and review tools."},
        diagnostics:{name:"Silver Diagnostics", icon:"tools", run:"openSilverDiagnostics11", desc:"System tests and status."},
        shortcuts:{name:"Keyboard Shortcuts", icon:"tools", run:"openSilverShortcuts11", desc:"Shortcuts and power-user controls."}
    };

    function esc(v) { return String(v ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c])); }
    function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } }
    function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
    function username() { return localStorage.getItem("40_username") || localStorage.getItem("username") || "SilverUser"; }
    function iconHTML(icon, small) { const def = ICONS[icon] || ICONS.apps; return `<span class="silver-beta-logo ${esc(def[1])} ${small ? "small" : ""}">${esc(def[0])}</span>`; }
    function notify(t, m, src = "Silver", lvl = "info") { if (typeof window.silverNotify === "function") window.silverNotify(t, m, src, lvl); else console.log(t, m); }
    function openWindowSilver(title, html, id) { if (typeof window.openWindow === "function") window.openWindow(title, html, id || title.replace(/\W+/g, "").toLowerCase()); else alert(title); }
    function call(run) {
        try {
            if (typeof run === "function") return run();
            if (typeof run === "string" && run.trim().startsWith("()")) return Function(`return (${run})`)()();
            if (typeof run === "string" && typeof window[run] === "function") return window[run]();
            notify("Application unavailable", `Could not open ${run}.`, "Apps", "warning");
        } catch (err) { notify("Application error", err.message || String(err), "Apps", "error"); }
    }

    function defaultDesktopPrefs() {
        return {
            mode: "folders",
            folders: ["essential", "office", "files", "communication", "creator", "system"],
            apps: ["home", "drive", "mail", "session"],
            iconSize: "normal",
            density: "comfortable",
            showSidebar: true,
            showBaseIcons: false,
            wallpaper: "aurora"
        };
    }
    function getDesktopPrefs() { return { ...defaultDesktopPrefs(), ...read(K.desktopPrefs, {}) }; }
    function setDesktopPrefs(patch) { write(K.desktopPrefs, { ...getDesktopPrefs(), ...patch }); applyDesktopPrefs(); installManagedDesktop(); }

    function folderCard(folder) {
        return `<div class="silver-app-card silver-folder-card" onclick="openSilverFolder11('${esc(folder.id)}')">${iconHTML(folder.icon)}<div><b>${esc(folder.name)}</b><small>${esc(folder.desc)}</small></div></div>`;
    }
    function appCard(appId) {
        const app = APPS[appId]; if (!app) return "";
        return `<div class="silver-app-card" onclick="silverRunApp11('${esc(appId)}')">${iconHTML(app.icon)}<div><b>${esc(app.name)}</b><small>${esc(app.desc)}</small></div></div>`;
    }
    window.silverRunApp11 = function (id) { const app = APPS[id]; if (app) call(app.run); };

    function desktopIcon(kind, id, label, icon, onclick) {
        const el = document.createElement("div");
        el.className = `icon silver11-desktop-icon silver11-${kind}`;
        el.tabIndex = 0;
        el.dataset.silverItem = id;
        el.innerHTML = `${iconHTML(icon)}<br><span>${esc(label)}</span>`;
        const launch = () => { setTimeout(() => el.blur(), 30); onclick(); };
        el.addEventListener("click", launch);
        el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); launch(); } });
        return el;
    }

    function installManagedDesktop() {
        const desktop = document.getElementById("desktop");
        if (!desktop) return;
        document.body.classList.add("silver11-managed-desktop");
        desktop.querySelectorAll(".silver11-desktop-icon").forEach(n => n.remove());
        const prefs = getDesktopPrefs();
        document.body.classList.toggle("silver11-show-base-icons", !!prefs.showBaseIcons);
        if (prefs.mode === "folders") {
            prefs.folders.forEach(id => {
                const folder = FOLDERS.find(f => f.id === id);
                if (folder) desktop.appendChild(desktopIcon("folder", id, folder.name, folder.icon, () => window.openSilverFolder11(id)));
            });
        }
        prefs.apps.forEach(id => {
            const app = APPS[id];
            if (app) desktop.appendChild(desktopIcon("app", id, app.name, app.icon, () => window.silverRunApp11(id)));
        });
        desktop.appendChild(desktopIcon("settings", "customize", "Customize", "settings", () => window.openSilverDesktopCustomizer11()));
    }

    function applyDesktopPrefs() {
        const prefs = getDesktopPrefs();
        document.body.dataset.silverIconSize = prefs.iconSize || "normal";
        document.body.dataset.silverDensity = prefs.density || "comfortable";
        document.body.dataset.silverWallpaper = prefs.wallpaper || "aurora";
        document.body.classList.toggle("silver11-hide-sidebar", !prefs.showSidebar);
        document.body.classList.add("silver11-responsive");
        document.title = BUILD.name;
        const badge = document.getElementById("emerald40-build-badge");
        if (badge) badge.textContent = "Silver Beta 2.0";
        const edition = document.getElementById("emerald40-edition-badge");
        if (edition) edition.textContent = BUILD.name;
    }

    window.openSilverFolder11 = function (folderId) {
        const folder = FOLDERS.find(f => f.id === folderId) || FOLDERS[0];
        const html = `<div class="silver-beta-shell silver11-folder-window"><div class="silver-beta-header">${iconHTML(folder.icon)}<div><h2>${esc(folder.name)}</h2><p>${esc(folder.desc)}</p></div></div><div class="silver11-folder-tools"><button onclick="openSilverDesktopCustomizer11()">Customize Desktop</button><button onclick="openSilverApps11()">All Apps</button><button onclick="silverHideFolder11('${esc(folder.id)}')">Remove Folder From Desktop</button></div><div class="silver-beta-grid">${folder.apps.map(appCard).join("")}</div></div>`;
        openWindowSilver(folder.name, html, `silver-folder-${folder.id}`);
    };
    window.silverHideFolder11 = function (folderId) {
        const prefs = getDesktopPrefs();
        setDesktopPrefs({ folders: prefs.folders.filter(id => id !== folderId) });
        notify("Desktop updated", "Folder removed from the desktop. It is still available in Silver Apps.", "Desktop", "success");
    };

    window.openSilverApps11 = function () {
        const rows = FOLDERS.map(folderCard).join("") + Object.keys(APPS).map(appCard).join("");
        const html = `<div class="silver-beta-shell"><div class="silver-beta-header">${iconHTML("apps")}<div><h2>Silver Apps</h2><p>All Silver folders and applications remain available even when removed from the desktop.</p></div></div><div class="silver-beta-toolbar"><input id="silver11_app_search" placeholder="Search apps, folders, Office files, settings" oninput="silverFilterApps11()"><button onclick="openSilverDesktopCustomizer11()">Customize Desktop</button><button onclick="openSilverDrive11()">Open Silver Drive</button></div><div id="silver11_apps_all" class="silver-beta-grid">${rows}</div></div>`;
        openWindowSilver("Silver Apps", html, "silver-apps-11");
    };
    window.silverFilterApps11 = function () {
        const q = (document.getElementById("silver11_app_search")?.value || "").toLowerCase();
        const el = document.getElementById("silver11_apps_all"); if (!el) return;
        const f = FOLDERS.filter(x => (x.name + x.desc).toLowerCase().includes(q)).map(folderCard).join("");
        const a = Object.keys(APPS).filter(id => (APPS[id].name + APPS[id].desc).toLowerCase().includes(q)).map(appCard).join("");
        el.innerHTML = f + a || `<p>No apps found.</p>`;
    };

    window.openSilverDesktopCustomizer11 = function () {
        const prefs = getDesktopPrefs();
        const folderChecks = FOLDERS.map(f => `<label class="silver11-check"><input type="checkbox" data-folder="${esc(f.id)}" ${prefs.folders.includes(f.id) ? "checked" : ""}> ${iconHTML(f.icon,true)} ${esc(f.name)}</label>`).join("");
        const appChecks = Object.keys(APPS).map(id => `<label class="silver11-check"><input type="checkbox" data-app="${esc(id)}" ${prefs.apps.includes(id) ? "checked" : ""}> ${iconHTML(APPS[id].icon,true)} ${esc(APPS[id].name)}</label>`).join("");
        const html = `<div class="silver-beta-shell"><div class="silver-beta-header">${iconHTML("settings")}<div><h2>Silver Desktop Customizer</h2><p>Choose exactly what appears on the desktop. Removed folders stay in Silver Apps.</p></div></div><div class="silver11-settings-grid"><section><h3>Desktop folders</h3>${folderChecks}</section><section><h3>Pinned apps</h3>${appChecks}</section><section><h3>Layout</h3><label>Icon size<select id="silver11_icon_size"><option ${prefs.iconSize==='compact'?'selected':''}>compact</option><option ${prefs.iconSize==='normal'?'selected':''}>normal</option><option ${prefs.iconSize==='large'?'selected':''}>large</option></select></label><label>Density<select id="silver11_density"><option ${prefs.density==='compact'?'selected':''}>compact</option><option ${prefs.density==='comfortable'?'selected':''}>comfortable</option><option ${prefs.density==='spacious'?'selected':''}>spacious</option></select></label><label>Wallpaper<select id="silver11_wallpaper"><option ${prefs.wallpaper==='aurora'?'selected':''}>aurora</option><option ${prefs.wallpaper==='midnight'?'selected':''}>midnight</option><option ${prefs.wallpaper==='glass'?'selected':''}>glass</option><option ${prefs.wallpaper==='emerald'?'selected':''}>emerald</option></select></label><label class="silver11-check"><input id="silver11_sidebar" type="checkbox" ${prefs.showSidebar ? "checked" : ""}> Show sidebar gadgets</label><label class="silver11-check"><input id="silver11_baseicons" type="checkbox" ${prefs.showBaseIcons ? "checked" : ""}> Show base EmeraldOS icons behind Silver desktop</label><button onclick="silverSaveDesktopCustomizer11()">Save Desktop</button><button onclick="silverResetDesktop11()">Reset Defaults</button></section></div></div>`;
        openWindowSilver("Desktop Customizer", html, "desktop-customizer-11");
    };
    window.silverSaveDesktopCustomizer11 = function () {
        const folders = [...document.querySelectorAll('[data-folder]:checked')].map(i => i.dataset.folder);
        const apps = [...document.querySelectorAll('[data-app]:checked')].map(i => i.dataset.app);
        setDesktopPrefs({
            folders, apps,
            iconSize: document.getElementById("silver11_icon_size")?.value || "normal",
            density: document.getElementById("silver11_density")?.value || "comfortable",
            wallpaper: document.getElementById("silver11_wallpaper")?.value || "aurora",
            showSidebar: !!document.getElementById("silver11_sidebar")?.checked,
            showBaseIcons: !!document.getElementById("silver11_baseicons")?.checked
        });
        notify("Desktop saved", "Your Silver desktop customization has been applied.", "Desktop", "success");
    };
    window.silverResetDesktop11 = function () { write(K.desktopPrefs, defaultDesktopPrefs()); applyDesktopPrefs(); installManagedDesktop(); notify("Desktop reset", "Silver desktop defaults restored.", "Desktop", "success"); };

    function defaultDrive() {
        return [
            { id:"fold_start", type:"folder", title:"Getting Started", updatedAt:new Date().toISOString(), starred:true },
            { id:"doc_welcome", type:"edoc", title:"Welcome to Silver Drive", folder:"fold_start", updatedAt:new Date().toISOString(), starred:true, content:"<h1>Welcome to Silver Drive</h1><p>Silver Office now works more like a drive workspace. Create folders, search files, star important work, and open documents from one place.</p>" },
            { id:"sheet_budget", type:"esheet", title:"Sample Budget", updatedAt:new Date().toISOString(), rows:[["Item","Cost","Status"],["Hosting","0","Active"],["Apps","0","Planning"]] },
            { id:"slide_plan", type:"eslide", title:"Project Presentation", updatedAt:new Date().toISOString(), slides:[{title:"Silver Beta 2.0",body:"Custom desktop, responsive UI, and Drive-like Office."}] }
        ];
    }
    function driveItems() { const items = read(K.driveItems, null); if (Array.isArray(items)) return items; write(K.driveItems, defaultDrive()); return read(K.driveItems, []); }
    function saveDriveItems(items) { write(K.driveItems, items); silver11SaveDriveCloud(true); }
    function typeLabel(t) { return ({folder:"Folder", edoc:"Document", esheet:"Sheet", eslide:"Slides", eform:"Form", enote:"Note"}[t] || t); }
    function typeIcon(t) { return ({folder:"folder", edoc:"docs", esheet:"sheets", eslide:"slides", eform:"forms", enote:"notes"}[t] || "office"); }
    function currentFolder() { return localStorage.getItem(K.driveFolder) || ""; }
    function setCurrentFolder(id) { localStorage.setItem(K.driveFolder, id || ""); }
    function breadcrumbs(items) { const f = items.find(i => i.id === currentFolder()); return `<button onclick="silverDriveFolder11('')">My Drive</button>${f ? ` <span>›</span> <button onclick="silverDriveFolder11('${esc(f.id)}')">${esc(f.title)}</button>` : ""}`; }
    function driveStats(items) { const active = items.filter(i => !i.trashed); const docs = active.filter(i => i.type !== "folder").length; const folders = active.filter(i => i.type === "folder").length; return `<div class="silver11-drive-stats"><span>${active.length} items</span><span>${folders} folders</span><span>${docs} files</span><span>${active.filter(i=>i.starred).length} starred</span></div>`; }

    window.openSilverDrive11 = function (filter = "drive") {
        const items = driveItems();
        const folder = currentFolder();
        const q = (document.getElementById("silver11_drive_search")?.value || "").toLowerCase();
        const view = localStorage.getItem(K.driveView) || "grid";
        let visible = items.filter(i => filter === "trash" ? i.trashed : !i.trashed);
        if (filter === "starred") visible = visible.filter(i => i.starred && !i.trashed);
        if (filter === "recent") visible = visible.filter(i => !i.trashed).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0,20);
        if (filter === "drive" && folder) visible = visible.filter(i => i.folder === folder);
        if (filter === "drive" && !folder) visible = visible.filter(i => !i.folder);
        if (q) visible = visible.filter(i => (i.title + " " + i.type).toLowerCase().includes(q));
        const cards = visible.map(i => `<div class="silver11-drive-card ${view}" ondblclick="silverDriveOpen11('${esc(i.id)}')"><div class="silver11-drive-card-main">${iconHTML(typeIcon(i.type))}<div><b>${esc(i.title)}</b><small>${typeLabel(i.type)} • ${i.updatedAt ? new Date(i.updatedAt).toLocaleString() : "recent"}</small></div></div><div class="silver11-drive-actions"><button onclick="silverDriveOpen11('${esc(i.id)}')">Open</button><button onclick="silverDriveRename11('${esc(i.id)}')">Rename</button><button onclick="silverDriveStar11('${esc(i.id)}')">${i.starred ? "Unstar" : "Star"}</button>${i.trashed ? `<button onclick="silverDriveRestore11('${esc(i.id)}')">Restore</button><button onclick="silverDriveDeleteForever11('${esc(i.id)}')">Delete Forever</button>` : `<button onclick="silverDriveTrash11('${esc(i.id)}')">Trash</button>`}</div></div>`).join("") || `<div class="silver11-empty-state"><h3>No items here</h3><p>Create a document, sheet, slide, form, or folder.</p></div>`;
        const html = `<div class="silver-beta-shell silver11-drive"><div class="silver-beta-header">${iconHTML("drive")}<div><h2>Silver Drive</h2><p>Drive-style workspace for Emerald Office documents.</p></div></div><div class="silver11-drive-layout"><aside class="silver11-drive-side"><button onclick="silverDriveFolder11('')">My Drive</button><button onclick="openSilverDrive11('recent')">Recent</button><button onclick="openSilverDrive11('starred')">Starred</button><button onclick="openSilverDrive11('trash')">Trash</button><button onclick="silver11LoadDriveCloud(false)">Load Cloud</button><button onclick="silver11SaveDriveCloud(false)">Save Cloud</button></aside><main><div class="silver11-drive-top"><div class="silver11-breadcrumbs">${breadcrumbs(items)}</div><input id="silver11_drive_search" value="${esc(q)}" placeholder="Search Silver Drive" oninput="openSilverDrive11('${esc(filter)}')"><button onclick="silverDriveNewFolder11()">New Folder</button><button onclick="silverDriveNewItem11('edoc')">New Doc</button><button onclick="silverDriveNewItem11('esheet')">New Sheet</button><button onclick="silverDriveNewItem11('eslide')">New Slides</button><button onclick="silverDriveNewItem11('eform')">New Form</button><button onclick="silverDriveToggleView11('${view === "grid" ? "list" : "grid"}')">${view === "grid" ? "List" : "Grid"}</button></div>${driveStats(items)}<div class="silver11-drive-items ${view}">${cards}</div></main></div></div>`;
        openWindowSilver("Silver Drive", html, "silver-drive-11");
    };
    window.silverDriveFolder11 = function (id) { setCurrentFolder(id || ""); window.openSilverDrive11("drive"); };
    window.silverDriveToggleView11 = function (view) { localStorage.setItem(K.driveView, view); window.openSilverDrive11("drive"); };
    window.silverDriveNewFolder11 = function () { const title = prompt("Folder name:", "New Folder"); if (!title) return; const items = driveItems(); items.unshift({ id:"folder_"+Date.now(), type:"folder", title, folder: currentFolder(), updatedAt:new Date().toISOString() }); saveDriveItems(items); window.openSilverDrive11(); };
    window.silverDriveNewItem11 = function (type) { const title = prompt(`New ${typeLabel(type)} name:`, `Untitled ${typeLabel(type)}`); if (!title) return; const item = { id:type+"_"+Date.now(), type, title, folder:currentFolder(), updatedAt:new Date().toISOString() }; if (type === "edoc") item.content = `<h1>${esc(title)}</h1><p>Start writing...</p>`; if (type === "esheet") item.rows = [["Column A","Column B","Column C"],["","",""]]; if (type === "eslide") item.slides = [{ title, body:"Slide text" }]; if (type === "eform") item.questions = [{ q:"Question 1", type:"Short answer" }]; const items = driveItems(); items.unshift(item); saveDriveItems(items); notify("Silver Drive", `${title} created.`, "Office", "success"); window.silverDriveOpen11(item.id); };
    window.silverDriveOpen11 = function (id) { const item = driveItems().find(i => i.id === id); if (!item) return; if (item.type === "folder") return window.silverDriveFolder11(item.id); if (item.type === "edoc") return window.openSilverDocEditor11(id); if (item.type === "esheet") return window.openSilverSheetEditor11(id); if (item.type === "eslide") return window.openSilverSlideEditor11(id); if (item.type === "eform") return window.openSilverFormEditor11(id); };
    window.silverDriveRename11 = function (id) { const items = driveItems(); const item = items.find(i => i.id === id); if (!item) return; const title = prompt("Rename:", item.title); if (!title) return; item.title = title; item.updatedAt = new Date().toISOString(); saveDriveItems(items); window.openSilverDrive11(); };
    window.silverDriveStar11 = function (id) { const items = driveItems(); const item = items.find(i => i.id === id); if (!item) return; item.starred = !item.starred; item.updatedAt = new Date().toISOString(); saveDriveItems(items); window.openSilverDrive11(); };
    window.silverDriveTrash11 = function (id) { const items = driveItems(); const item = items.find(i => i.id === id); if (!item) return; item.trashed = true; item.updatedAt = new Date().toISOString(); saveDriveItems(items); window.openSilverDrive11(); };
    window.silverDriveRestore11 = function (id) { const items = driveItems(); const item = items.find(i => i.id === id); if (!item) return; item.trashed = false; item.updatedAt = new Date().toISOString(); saveDriveItems(items); window.openSilverDrive11("trash"); };
    window.silverDriveDeleteForever11 = function (id) { if (!confirm("Delete forever?")) return; saveDriveItems(driveItems().filter(i => i.id !== id)); window.openSilverDrive11("trash"); };

    function findItem(id) { return driveItems().find(i => i.id === id); }
    function saveItem(id, patch) { const items = driveItems(); const item = items.find(i => i.id === id); if (!item) return; Object.assign(item, patch, { updatedAt: new Date().toISOString() }); saveDriveItems(items); notify("Silver Office", `${item.title} saved.`, "Office", "success"); }
    window.openSilverDocEditor11 = function (id) { const item = findItem(id); if (!item) return; const html = `<div class="silver-beta-shell silver11-editor"><div class="silver-beta-header">${iconHTML("docs")}<div><h2>${esc(item.title)}</h2><p>Silver Docs editor</p></div></div><div class="silver11-office-toolbar"><input id="silver_doc_title11" value="${esc(item.title)}"><button onclick="document.execCommand('bold')">Bold</button><button onclick="document.execCommand('italic')">Italic</button><button onclick="document.execCommand('underline')">Underline</button><button onclick="document.execCommand('insertUnorderedList')">Bullets</button><button onclick="document.execCommand('formatBlock',false,'h1')">Heading</button><button onclick="silverDocSave11('${esc(id)}')">Save</button><button onclick="silverDocExport11('${esc(id)}','html')">Export HTML</button><button onclick="silverDocExport11('${esc(id)}','txt')">Export TXT</button><button onclick="print()">Print</button><button onclick="openSilverDrive11()">Back to Drive</button></div><div id="silver_doc_page11" class="silver11-doc-page" contenteditable="true" oninput="silverDocStats11()">${item.content || ""}</div><div id="silver_doc_stats11" class="silver11-status">Ready</div></div>`; openWindowSilver(item.title, html, `silver-doc-${id}`); setTimeout(window.silverDocStats11, 100); };
    window.silverDocSave11 = function (id) { saveItem(id, { title: document.getElementById("silver_doc_title11")?.value || "Untitled Document", content: document.getElementById("silver_doc_page11")?.innerHTML || "" }); window.silverDocStats11(); };
    window.silverDocStats11 = function () { const p = document.getElementById("silver_doc_page11"), s = document.getElementById("silver_doc_stats11"); if (!p || !s) return; const text = p.innerText.trim(); const words = text ? text.split(/\s+/).length : 0; s.textContent = `${words} words • ${text.length} characters • Autosave local`; };
    window.silverDocExport11 = function (id, type) { const item = findItem(id); const title = document.getElementById("silver_doc_title11")?.value || item?.title || "Silver Document"; const page = document.getElementById("silver_doc_page11"); const content = type === "html" ? `<!doctype html><meta charset="utf-8"><title>${esc(title)}</title>${page?.innerHTML || ""}` : (page?.innerText || ""); const blob = new Blob([content], { type: type === "html" ? "text/html" : "text/plain" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = title.replace(/[^a-z0-9_-]/gi,"_") + "." + type; a.click(); URL.revokeObjectURL(a.href); };
    window.openSilverSheetEditor11 = function (id) { const item = findItem(id); const csv = (item.rows || [[]]).map(r => r.join(",")).join("\n"); const html = `<div class="silver-beta-shell silver11-editor"><div class="silver-beta-header">${iconHTML("sheets")}<div><h2>${esc(item.title)}</h2><p>Silver Sheets editor</p></div></div><div class="silver11-office-toolbar"><input id="silver_sheet_title11" value="${esc(item.title)}"><button onclick="silverSheetSave11('${esc(id)}')">Save</button><button onclick="silverSheetAddRow11('${esc(id)}')">Add Row</button><button onclick="openSilverDrive11()">Back to Drive</button></div><textarea id="silver_sheet_csv11" class="silver11-csv">${esc(csv)}</textarea><small>CSV-style lightweight spreadsheet. One row per line, commas between cells.</small></div>`; openWindowSilver(item.title, html, `silver-sheet-${id}`); };
    window.silverSheetSave11 = function (id) { const csv = document.getElementById("silver_sheet_csv11")?.value || ""; const rows = csv.split(/\n/).map(r => r.split(",")); saveItem(id, { title: document.getElementById("silver_sheet_title11")?.value || "Untitled Sheet", rows }); };
    window.silverSheetAddRow11 = function (id) { const ta = document.getElementById("silver_sheet_csv11"); if (ta) ta.value += "\n,,"; };
    window.openSilverSlideEditor11 = function (id) { const item = findItem(id); const slides = item.slides || [{title:item.title,body:""}]; const text = slides.map(s => `${s.title}\n${s.body}`).join("\n---\n"); const html = `<div class="silver-beta-shell silver11-editor"><div class="silver-beta-header">${iconHTML("slides")}<div><h2>${esc(item.title)}</h2><p>Silver Slides editor</p></div></div><div class="silver11-office-toolbar"><input id="silver_slide_title11" value="${esc(item.title)}"><button onclick="silverSlideSave11('${esc(id)}')">Save</button><button onclick="silverSlidePresent11('${esc(id)}')">Present</button><button onclick="openSilverDrive11()">Back to Drive</button></div><textarea id="silver_slide_text11" class="silver11-csv">${esc(text)}</textarea><small>Separate slides with --- on its own line.</small></div>`; openWindowSilver(item.title, html, `silver-slide-${id}`); };
    window.silverSlideSave11 = function (id) { const raw = document.getElementById("silver_slide_text11")?.value || ""; const slides = raw.split(/\n---\n/).map(part => { const [title,...body] = part.split(/\n/); return { title:title||"Slide", body:body.join("\n") }; }); saveItem(id, { title: document.getElementById("silver_slide_title11")?.value || "Untitled Slides", slides }); };
    window.silverSlidePresent11 = function (id) { window.silverSlideSave11(id); const item = findItem(id); const html = `<div class="silver11-presentation">${(item.slides||[]).map(s=>`<section><h1>${esc(s.title)}</h1><p>${esc(s.body).replace(/\n/g,"<br>")}</p></section>`).join("")}</div>`; openWindowSilver("Present: " + item.title, html, `present-${id}`); };
    window.openSilverFormEditor11 = function (id) { const item = findItem(id); const text = (item.questions || []).map(q => q.q).join("\n"); const html = `<div class="silver-beta-shell silver11-editor"><div class="silver-beta-header">${iconHTML("forms")}<div><h2>${esc(item.title)}</h2><p>Silver Forms builder</p></div></div><div class="silver11-office-toolbar"><input id="silver_form_title11" value="${esc(item.title)}"><button onclick="silverFormSave11('${esc(id)}')">Save</button><button onclick="silverFormPreview11('${esc(id)}')">Preview</button><button onclick="openSilverDrive11()">Back to Drive</button></div><textarea id="silver_form_text11" class="silver11-csv">${esc(text)}</textarea><small>One question per line.</small></div>`; openWindowSilver(item.title, html, `silver-form-${id}`); };
    window.silverFormSave11 = function (id) { const lines = (document.getElementById("silver_form_text11")?.value || "").split(/\n/).filter(Boolean); saveItem(id, { title: document.getElementById("silver_form_title11")?.value || "Untitled Form", questions: lines.map(q => ({ q, type:"Short answer" })) }); };
    window.silverFormPreview11 = function (id) { window.silverFormSave11(id); const item = findItem(id); const html = `<div class="silver-beta-shell"><div class="silver-beta-header">${iconHTML("forms")}<div><h2>${esc(item.title)}</h2><p>Form preview</p></div></div>${(item.questions||[]).map(q=>`<label>${esc(q.q)}<input placeholder="Answer"></label>`).join("")}</div>`; openWindowSilver("Preview: " + item.title, html, `form-preview-${id}`); };

    window.openSilverOfficeHub11 = function () {
        const items = driveItems().filter(i => !i.trashed).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0,8);
        const html = `<div class="silver-beta-shell"><div class="silver-beta-header">${iconHTML("office")}<div><h2>Silver Office</h2><p>A Drive-style office workspace for documents, sheets, slides, forms, and folders.</p></div></div><div class="silver11-office-hero"><button onclick="openSilverDrive11()">Open Silver Drive</button><button onclick="silverDriveNewItem11('edoc')">New Document</button><button onclick="silverDriveNewItem11('esheet')">New Sheet</button><button onclick="silverDriveNewItem11('eslide')">New Slides</button><button onclick="silverDriveNewItem11('eform')">New Form</button></div><h3>Recent Office Files</h3><div class="silver11-drive-items grid">${items.map(i=>`<div class="silver11-drive-card" onclick="silverDriveOpen11('${esc(i.id)}')">${iconHTML(typeIcon(i.type))}<b>${esc(i.title)}</b><small>${typeLabel(i.type)}</small></div>`).join("")}</div></div>`;
        openWindowSilver("Silver Office", html, "silver-office-11");
    };
    window.openSilverTemplates11 = function () { const html = `<div class="silver-beta-shell"><div class="silver-beta-header">${iconHTML("office")}<div><h2>Template Gallery</h2><p>Start faster with Silver Office templates.</p></div></div><div class="silver-beta-grid">${["Business Letter","Meeting Notes","Project Plan","Budget Sheet","Class Notes","Presentation Outline","Policy Draft","Form Survey"].map(t=>`<div class="silver-app-card" onclick="silverTemplateCreate11('${esc(t)}')">${iconHTML("office")}<div><b>${esc(t)}</b><small>Create a new Office file from this template.</small></div></div>`).join("")}</div></div>`; openWindowSilver("Template Gallery", html, "templates-11"); };
    window.silverTemplateCreate11 = function (name) { const type = name.includes("Sheet") || name.includes("Budget") ? "esheet" : name.includes("Presentation") ? "eslide" : name.includes("Form") || name.includes("Survey") ? "eform" : "edoc"; const items = driveItems(); const item = { id:type+"_"+Date.now(), type, title:name, folder:currentFolder(), updatedAt:new Date().toISOString() }; if (type === "edoc") item.content = `<h1>${esc(name)}</h1><p>Template content...</p>`; if (type === "esheet") item.rows = [["Item","Value","Notes"],["","",""]]; if (type === "eslide") item.slides = [{title:name,body:"Presentation notes"}]; if (type === "eform") item.questions = [{q:"Name",type:"Short answer"},{q:"Response",type:"Paragraph"}]; items.unshift(item); saveDriveItems(items); window.silverDriveOpen11(item.id); };

    async function getFirebase() { try { return await import("./firebase.js"); } catch { return null; } }
    window.silver11SaveDriveCloud = async function (silent = false) { const fb = await getFirebase(); if (!fb?.db || !fb?.doc || !fb?.setDoc) { if (!silent) notify("Silver Drive", "Firebase unavailable. Drive saved locally only.", "Sync", "warning"); return false; } try { await fb.setDoc(fb.doc(fb.db, BUILD.cloudCollection, username(), BUILD.sessionCollection, "drive"), { username: username(), updatedAt: Date.now(), items: driveItems() }, { merge:true }); if (!silent) notify("Silver Drive", "Drive workspace saved to cloud.", "Sync", "success"); return true; } catch (err) { if (!silent) notify("Silver Drive", err.message || "Cloud save failed.", "Sync", "error"); return false; } };
    window.silver11LoadDriveCloud = async function (silent = false) { const fb = await getFirebase(); if (!fb?.db || !fb?.doc || !fb?.getDoc) { if (!silent) notify("Silver Drive", "Firebase unavailable.", "Sync", "warning"); return false; } try { const snap = await fb.getDoc(fb.doc(fb.db, BUILD.cloudCollection, username(), BUILD.sessionCollection, "drive")); if (snap.exists() && Array.isArray(snap.data().items)) { write(K.driveItems, snap.data().items); if (!silent) notify("Silver Drive", "Cloud Drive workspace loaded.", "Sync", "success"); window.openSilverDrive11(); return true; } if (!silent) notify("Silver Drive", "No cloud Drive workspace found.", "Sync", "info"); return false; } catch (err) { if (!silent) notify("Silver Drive", err.message || "Cloud load failed.", "Sync", "error"); return false; } };

    window.openSilverSearch11 = function () { const html = `<div class="silver-beta-shell"><div class="silver-beta-header">${iconHTML("tools")}<div><h2>Silver Search</h2><p>Search apps, folders, and Office Drive files.</p></div></div><input id="silver11_global_search" placeholder="Type to search Silver" oninput="silverSearchRun11()" autofocus><div id="silver11_search_results" class="silver-beta-grid"></div></div>`; openWindowSilver("Silver Search", html, "silver-search-11"); setTimeout(window.silverSearchRun11, 100); };
    window.silverSearchRun11 = function () { const q = (document.getElementById("silver11_global_search")?.value || "").toLowerCase(); const appResults = Object.keys(APPS).filter(id => !q || (APPS[id].name + APPS[id].desc).toLowerCase().includes(q)).slice(0,20).map(appCard).join(""); const fileResults = driveItems().filter(i => !i.trashed && (!q || i.title.toLowerCase().includes(q))).slice(0,20).map(i => `<div class="silver-app-card" onclick="silverDriveOpen11('${esc(i.id)}')">${iconHTML(typeIcon(i.type))}<div><b>${esc(i.title)}</b><small>${typeLabel(i.type)} in Silver Drive</small></div></div>`).join(""); const el = document.getElementById("silver11_search_results"); if (el) el.innerHTML = appResults + fileResults || `<p>No results.</p>`; };
    window.openSilverPlanner11 = function () { const html = `<div class="silver-beta-shell"><div class="silver-beta-header">${iconHTML("calendar")}<div><h2>Silver Planner</h2><p>Quick daily plan.</p></div></div><textarea class="silver11-csv" id="silver_planner_text" placeholder="Plan your day...">${esc(localStorage.getItem("silver11_planner")||"")}</textarea><button onclick="localStorage.setItem('silver11_planner',document.getElementById('silver_planner_text').value);silverNotify('Silver Planner','Plan saved.','Planner','success')">Save Plan</button></div>`; openWindowSilver("Silver Planner", html, "planner-11"); };
    window.openSilverCalculator11 = function () { const html = `<div class="silver-beta-shell"><div class="silver-beta-header">${iconHTML("calculator")}<div><h2>Silver Calculator</h2><p>Basic calculations.</p></div></div><input id="silver_calc_expr" placeholder="Example: 25*4+10"><button onclick="silverCalcRun11()">Calculate</button><h3 id="silver_calc_result">Result</h3></div>`; openWindowSilver("Silver Calculator", html, "calculator-11"); };
    window.silverCalcRun11 = function () { const expr = document.getElementById("silver_calc_expr")?.value || ""; try { if (!/^[0-9+\-*/(). %]+$/.test(expr)) throw new Error("Only basic math is allowed."); document.getElementById("silver_calc_result").textContent = String(Function(`return (${expr})`)()); } catch (e) { document.getElementById("silver_calc_result").textContent = "Invalid expression"; } };
    window.openSilverUpdates11 = function () { openWindowSilver("Silver Updates", `<div class="silver-beta-shell"><div class="silver-beta-header">${iconHTML("sync")}<div><h2>Silver Updates</h2><p>Current build: EmeraldOS Silver Beta 2.0</p></div></div><ul><li>Customizable desktop folders.</li><li>Responsive Silver shell.</li><li>Drive-like Silver Office workspace.</li><li>More Silver applications.</li><li>Improved UI polish.</li></ul></div>`, "updates-11"); };
    window.openSilverDiagnostics11 = function () { openWindowSilver("Silver Diagnostics", `<div class="silver-beta-shell"><div class="silver-beta-header">${iconHTML("tools")}<div><h2>Silver Diagnostics</h2><p>System checks.</p></div></div><div class="silver11-drive-stats"><span>Username: ${esc(username())}</span><span>Drive items: ${driveItems().length}</span><span>Desktop folders: ${getDesktopPrefs().folders.length}</span><span>Screen: ${screen.width}×${screen.height}</span></div><button onclick="silver11SaveDriveCloud(false)">Test Cloud Save</button><button onclick="silver11LoadDriveCloud(false)">Test Cloud Load</button></div>`, "diagnostics-11"); };
    window.openSilverShortcuts11 = function () { openWindowSilver("Keyboard Shortcuts", `<div class="silver-beta-shell"><div class="silver-beta-header">${iconHTML("tools")}<div><h2>Keyboard Shortcuts</h2><p>Silver quick commands.</p></div></div><table class="silver11-table"><tr><th>Shortcut</th><th>Action</th></tr><tr><td>Ctrl + Alt + S</td><td>Silver Home</td></tr><tr><td>Ctrl + Alt + A</td><td>Silver Apps</td></tr><tr><td>Ctrl + Alt + O</td><td>Silver Office</td></tr><tr><td>Ctrl + Alt + M</td><td>Silver Mail</td></tr></table></div>`, "shortcuts-11"); };

    const oldOffice = window.openSilverBetaOffice;
    window.openSilverBetaOffice = window.openSilverOfficeHub11;
    window.openSilverBetaApps = window.openSilverApps11;

    function improveStartMenu() {
        const results = document.getElementById("start-results");
        if (results && !document.getElementById("silver11-start-links")) {
            const links = document.createElement("div");
            links.id = "silver11-start-links";
            links.innerHTML = `<div class="start-item" onclick="openSilverDrive11()">Silver Drive</div><div class="start-item" onclick="openSilverDesktopCustomizer11()">Desktop Customizer</div><div class="start-item" onclick="openSilverSearch11()">Silver Search</div>`;
            results.prepend(links);
        }
    }
    function boot() {
        applyDesktopPrefs();
        installManagedDesktop();
        improveStartMenu();
        setTimeout(() => { applyDesktopPrefs(); installManagedDesktop(); improveStartMenu(); }, 900);
        setTimeout(() => { window.silver11LoadDriveCloud(true); }, 2200);
        const oldSave = window.silverCloudSaveSession;
        if (typeof oldSave === "function" && !oldSave.__silver11Wrapped) {
            const wrapped = async function (silent) { await window.silver11SaveDriveCloud(true); return oldSave(silent); };
            wrapped.__silver11Wrapped = true;
            window.silverCloudSaveSession = wrapped;
        }
        notify("Silver Beta 2.0", "Custom desktop folders and Silver Drive are ready.", "System", "success");
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();


/* =========================================================
   EMERALDOS SILVER BETA 2.0 CONSOLIDATION LAYER
   - Temporary no-editions Silver experience
   - Consolidated hub desktop
   - Vista-like app logos
   - Improved Drive/Office workspace front end
========================================================= */
(function(){
    if (window.EmeraldOSSilverBeta20ConsolidationLoaded) return;
    window.EmeraldOSSilverBeta20ConsolidationLoaded = true;

    const KEY = {
        prefs: "silver20_consolidated_desktop_prefs",
        files: "silver20_drive_items",
        view: "silver20_drive_view",
        notices: "silver20_universal_notices"
    };

    const LOGOS = {
        workspace:["◆","workspace"], drive:["DR","drive"], office:["OF","office"], docs:["DC","office"], sheets:["Σ","office"], slides:["SL","office"], forms:["FM","office"], mail:["✉","comms"], chat:["CH","comms"], people:["PE","comms"], calendar:["31","office"], tasks:["✓","office"], notes:["NT","office"], creator:["{ }","creator"], code:["JS","creator"], store:["ST","creator"], apps:["AP","creator"], system:["⚙","system"], settings:["SE","system"], sync:["SY","system"], recovery:["RC","system"], security:["SC","security"], network:["NW","system"], media:["▶","media"], gallery:["IMG","media"], help:["?","help"], feedback:["FB","feedback"], bell:["NO","system"], folder:["▣","drive"], tools:["TL","system"]
    };

    const APPS20 = [
        {id:"workspace", name:"Silver Workspace", logo:"workspace", category:"Workspace", desktop:true, desc:"Dashboard, resume, recent work, universal notifications, and quick actions.", run:"openSilverWorkspace20"},
        {id:"drivehub", name:"Silver Drive + Office", logo:"drive", category:"Drive & Office", desktop:true, desc:"Consolidated Drive, documents, sheets, slides, forms, templates, and vault.", run:"openSilverDriveHub20"},
        {id:"comms", name:"Silver Communications", logo:"mail", category:"Communication", desktop:true, desc:"Mail, chat, people, contacts, blocking, and message notifications.", run:"openSilverCommunications20"},
        {id:"creatorhub", name:"Silver Creator Studio", logo:"creator", category:"Creator", desktop:true, desc:"Application Editor, Code Studio, App Market, app library, themes, and icons.", run:"openSilverCreatorHub20"},
        {id:"systemhub", name:"Silver System Center", logo:"system", category:"System", desktop:true, desc:"Settings, personalization, sync, recovery, security, updates, and diagnostics.", run:"openSilverSystemHub20"},
        {id:"apps", name:"Silver Apps", logo:"apps", category:"Core", desc:"All Silver apps and app folders. Removed desktop folders stay here.", run:"openSilverApps20"},
        {id:"notifications", name:"Universal Notifications", logo:"bell", category:"Workspace", desc:"Unread mail, shares, chat, appstore, sync, and system alerts.", run:"openSilverNotifications20"},
        {id:"resume", name:"Resume Center", logo:"sync", category:"Workspace", desc:"Save and restore the Silver VM-like workspace across devices.", run:"openSilverResumeCenter20"},
        {id:"drive", name:"Silver Drive", logo:"drive", category:"Drive & Office", desc:"Drive-style files, folders, recent, starred, trash, and cloud save.", run:"openSilverDrive20"},
        {id:"docs", name:"Silver Docs", logo:"docs", category:"Drive & Office", desc:"Document editor with templates, autosave, print, and export.", run:"silver20NewDoc"},
        {id:"sheets", name:"Silver Sheets", logo:"sheets", category:"Drive & Office", desc:"Spreadsheet editor with CSV-style editing.", run:"silver20NewSheet"},
        {id:"slides", name:"Silver Slides", logo:"slides", category:"Drive & Office", desc:"Presentation editor and present mode.", run:"silver20NewSlides"},
        {id:"forms", name:"Silver Forms", logo:"forms", category:"Drive & Office", desc:"Basic form builder and preview.", run:"silver20NewForm"},
        {id:"mail", name:"Silver Mail", logo:"mail", category:"Communication", desc:"Internal EmeraldOS mail interface.", run:"openSilverBetaMail"},
        {id:"chat", name:"Silver Chat", logo:"chat", category:"Communication", desc:"Integrated chat and room access.", run:"openSilverBetaChat"},
        {id:"people", name:"Silver People", logo:"people", category:"Communication", desc:"User directory, contacts, and blocking tools.", run:"openSilverBetaPeople"},
        {id:"notes", name:"Silver Notes", logo:"notes", category:"Productivity", desc:"Local Silver notes.", run:"openSilverBetaNotes"},
        {id:"tasks", name:"Silver Tasks", logo:"tasks", category:"Productivity", desc:"Task lists and quick planning.", run:"openSilverBetaTasks"},
        {id:"journal", name:"Silver Journal", logo:"notes", category:"Productivity", desc:"Private journal entries.", run:"openSilverBetaJournal"},
        {id:"planner", name:"Silver Planner", logo:"calendar", category:"Productivity", desc:"Daily planning board.", run:"openSilverPlanner11"},
        {id:"gallery", name:"Silver Gallery", logo:"gallery", category:"Media", desc:"Images and media hub.", run:"openSilverBetaGallery"},
        {id:"media", name:"Silver Media", logo:"media", category:"Media", desc:"Media center launcher.", run:"openSilverBetaMedia"},
        {id:"appmarket", name:"Silver App Market", logo:"store", category:"Creator", desc:"User Appstore with risk warning and install flow.", run:"openSilverBetaAppMarket"},
        {id:"applibrary", name:"Silver App Library", logo:"apps", category:"Creator", desc:"Installed user applications and app management.", run:"openSilverBetaAppLibrary"},
        {id:"codestudio", name:"Silver Code Studio", logo:"code", category:"Creator", desc:"Coding tools, app scanner, snippets, and publishing checks.", run:"openSilverBetaCodeStudio"},
        {id:"assistant", name:"Silver Assistant", logo:"help", category:"Creator", desc:"Assistant settings, API endpoint, and offline help.", run:"openSilverBetaAssistant"},
        {id:"settings", name:"Silver Settings", logo:"settings", category:"System", desc:"Unified settings for desktop, taskbar, Drive, Mail, Chat, and sync.", run:"openSilverSettings20"},
        {id:"personalization", name:"Silver Personalization", logo:"settings", category:"System", desc:"Themes, wallpapers, icons, density, and glass effects.", run:"openSilverBetaPersonalization"},
        {id:"sync", name:"Silver Sync Center", logo:"sync", category:"System", desc:"Cloud status, manual sync, resume status, and diagnostics.", run:"openSilverSyncCenter20"},
        {id:"security", name:"Silver Security", logo:"security", category:"System", desc:"Privacy, blocking, app risk, and safety controls.", run:"openSilverBetaSecurity"},
        {id:"recovery", name:"Silver Recovery", logo:"recovery", category:"System", desc:"Safe mode, reset, desktop repair, and cache tools.", run:"openSilverBetaRecovery"},
        {id:"updates", name:"Silver Updates", logo:"sync", category:"System", desc:"Version notes and product-line changes.", run:"openSilverUpdates20"},
        {id:"help", name:"Silver Help", logo:"help", category:"Support", desc:"Guides, troubleshooting, and shortcuts.", run:"openSilverBetaHelp"},
        {id:"feedback", name:"Silver Feedback", logo:"feedback", category:"Support", desc:"Bug reports and suggestions.", run:"openSilverBetaFeedback"}
    ];

    const FOLDERS20 = [
        {id:"workspace", name:"Workspace", logo:"workspace", desc:"Home, resume, notifications, search, and activity.", apps:["workspace","notifications","resume","apps"]},
        {id:"driveoffice", name:"Drive & Office", logo:"drive", desc:"Silver Drive plus Docs, Sheets, Slides, Forms, templates, and vault.", apps:["drivehub","drive","docs","sheets","slides","forms"]},
        {id:"communication", name:"Communication", logo:"mail", desc:"Mail, Chat, People, contacts, and blocking.", apps:["comms","mail","chat","people"]},
        {id:"creator", name:"Creator Tools", logo:"creator", desc:"Code, apps, appstore, assistant, and user applications.", apps:["creatorhub","appmarket","applibrary","codestudio","assistant"]},
        {id:"productivity", name:"Productivity", logo:"office", desc:"Notes, Tasks, Journal, Planner, and Calendar tools.", apps:["notes","tasks","journal","planner"]},
        {id:"media", name:"Media", logo:"media", desc:"Gallery and media tools.", apps:["gallery","media"]},
        {id:"system", name:"System", logo:"system", desc:"Settings, personalization, security, sync, recovery, and updates.", apps:["systemhub","settings","personalization","sync","security","recovery","updates"]},
        {id:"support", name:"Support", logo:"help", desc:"Help, diagnostics, and feedback.", apps:["help","feedback"]}
    ];

    function esc(s){ return String(s ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c])); }
    function username(){ return localStorage.getItem("username") || localStorage.getItem("40_username") || "Guest"; }
    function read(k,d){ try{return JSON.parse(localStorage.getItem(k)) ?? d;}catch{return d;} }
    function write(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
    function logoHTML(id, large=false){ const i=LOGOS[id]||LOGOS.apps; return `<span class="${large?'silver20-desktop-logo':'silver20-vista-logo'} silver20-logo-${esc(i[1])}"><span>${esc(i[0])}</span></span>`; }
    function open(title, html, id){ if (typeof window.openWindow === "function") window.openWindow(title, html, id||title.replace(/\W+/g,"-").toLowerCase()); else alert(title); }
    function notify(title,msg,cat="System",type="info"){
        if (typeof window.silverNotify === "function") return window.silverNotify(title,msg,cat,type);
        const arr=read(KEY.notices,[]); arr.unshift({id:Date.now(),title,msg,cat,type,read:false,time:new Date().toISOString()}); write(KEY.notices,arr);
        const bell=document.getElementById("silver-bell"); if(bell){ bell.textContent=String(arr.filter(n=>!n.read).length); bell.classList.toggle("has-unread",arr.some(n=>!n.read)); }
    }
    function call(fn){ if(typeof window[fn]==="function") return window[fn](); notify("Silver", `${fn} is not available in this build.`, "System", "warning"); }
    function appById(id){ return APPS20.find(a=>a.id===id); }
    function card(app){ if(!app) return ""; return `<div class="silver20-hub-card" onclick="${esc(app.run)}?.()">${logoHTML(app.logo)}<div><b>${esc(app.name)}</b><small>${esc(app.desc)}</small></div></div>`; }
    function folderCard(f){ return `<div class="silver20-hub-card" onclick="openSilverFolder20('${esc(f.id)}')">${logoHTML(f.logo)}<div><b>${esc(f.name)}</b><small>${esc(f.desc)}</small></div></div>`; }
    function defaultPrefs(){ return { desktop:["workspace","driveoffice","communication","creator","system"], iconSize:"normal", density:"comfortable", wallpaper:"aurora", sidebar:true, mode:"consolidated" }; }
    function prefs(){ const p=read(KEY.prefs,null); return p && Array.isArray(p.desktop) ? p : defaultPrefs(); }
    function savePrefs(p){ write(KEY.prefs,p); renderDesktop(); }

    function installIcon(item, isFolder){
        const desktop=document.getElementById("desktop"); if(!desktop) return;
        const icon=document.createElement("div"); icon.className="silver20-desktop-icon"; icon.tabIndex=0;
        icon.innerHTML=`${logoHTML(isFolder?item.logo:item.logo,true)}<span class="label">${esc(item.name)}</span>`;
        icon.onclick=()=> isFolder ? window.openSilverFolder20(item.id) : call(item.run);
        desktop.appendChild(icon);
    }
    function renderDesktop(){
        const desktop=document.getElementById("desktop"); if(!desktop) return;
        document.body.dataset.theme="silver-beta20";
        desktop.innerHTML="";
        const p=prefs();
        p.desktop.forEach(id=>{
            const f=FOLDERS20.find(x=>x.id===id); if(f) return installIcon(f,true);
            const a=appById(id); if(a) return installIcon(a,false);
        });
        if(p.sidebar) addSidebar();
    }
    function addSidebar(){
        if(document.getElementById("silver20-sidebar")) return;
        const side=document.createElement("aside"); side.id="silver20-sidebar"; side.className="silver-sidebar";
        side.innerHTML=`<div class="gadget"><b>Silver Beta 2.0</b><small>No editions in this beta</small></div><div class="gadget"><b>${esc(username())}</b><small>Workspace user</small></div><div class="gadget"><b>Cloud</b><small>Ready when Firebase is available</small></div><div class="gadget"><button onclick="openSilverWorkspace20()">Home</button><button onclick="openSilverDriveHub20()">Drive</button></div>`;
        document.body.appendChild(side);
    }
    function noEditionsNotice(){ return `<div class="silver20-no-editions"><b>Editions are temporarily removed in Silver Beta 2.0.</b><br>All Silver Beta 2.0 apps are available while this product line is being tested. Edition controls can be restored in a later release.</div>`; }

    window.openSilverWorkspace20=function(){
        const recent=(typeof window.openSilverDrive11==="function") ? "Silver Drive available" : "Drive loading";
        const html=`<div class="silver20-shell"><div class="silver20-hero"><section class="silver20-glass-panel"><div class="silver-beta-header">${logoHTML("workspace")}<div><h2>Silver Workspace</h2><p>Consolidated Silver Beta 2.0 desktop for Drive, Office, Communications, Creator tools, and System control.</p></div></div>${noEditionsNotice()}<div class="silver20-status-row"><span><b>User</b><br>${esc(username())}</span><span><b>Session</b><br>Resume-ready</span><span><b>Drive</b><br>${esc(recent)}</span><span><b>Screen</b><br>${screen.width}×${screen.height}</span></div></section><section class="silver20-glass-panel"><h3>Quick Actions</h3><div class="silver20-mini-grid">${["drivehub","docs","mail","chat","creatorhub","settings","notifications","resume"].map(id=>card(appById(id))).join("")}</div></section></div><h3>Consolidated Hubs</h3><div class="silver20-hub-grid">${["drivehub","comms","creatorhub","systemhub"].map(id=>card(appById(id))).join("")}</div></div>`;
        open("Silver Workspace", html, "silver-workspace-20");
    };

    window.openSilverApps20=function(){
        const cats=[...new Set(APPS20.map(a=>a.category))];
        const html=`<div class="silver20-shell"><div class="silver-beta-header">${logoHTML("apps")}<div><h2>Silver Apps</h2><p>Application folders remain available here even if removed from the desktop.</p></div></div>${noEditionsNotice()}<div class="silver20-toolbar"><input id="silver20_app_search" placeholder="Search Silver apps and folders" oninput="silver20FilterApps()"><button onclick="openSilverDesktopCustomizer20()">Customize Desktop</button><button onclick="openSilverWorkspace20()">Workspace</button></div><h3>Application Folders</h3><div id="silver20_folders" class="silver20-hub-grid">${FOLDERS20.map(folderCard).join("")}</div><div id="silver20_apps_all">${cats.map(c=>`<div class="silver20-section-title"><h3>${esc(c)}</h3></div><div class="silver20-hub-grid">${APPS20.filter(a=>a.category===c).map(card).join("")}</div>`).join("")}</div></div>`;
        open("Silver Apps", html, "silver-apps-20");
    };
    window.silver20FilterApps=function(){
        const q=(document.getElementById("silver20_app_search")?.value||"").toLowerCase();
        const f=document.getElementById("silver20_folders");
        const a=document.getElementById("silver20_apps_all");
        if(f) f.innerHTML=FOLDERS20.filter(x=>(x.name+x.desc).toLowerCase().includes(q)).map(folderCard).join("")||"<p>No folders.</p>";
        if(a) a.innerHTML=`<div class="silver20-hub-grid">${APPS20.filter(x=>(x.name+x.desc+x.category).toLowerCase().includes(q)).map(card).join("")||"<p>No apps.</p>"}</div>`;
    };
    window.openSilverFolder20=function(id){
        const f=FOLDERS20.find(x=>x.id===id)||FOLDERS20[0];
        const html=`<div class="silver20-shell"><div class="silver-beta-header">${logoHTML(f.logo)}<div><h2>${esc(f.name)}</h2><p>${esc(f.desc)}</p></div></div><div class="silver20-toolbar"><button onclick="openSilverApps20()">All Apps</button><button onclick="openSilverDesktopCustomizer20()">Desktop Customizer</button><button onclick="silver20RemoveDesktopItem('${esc(f.id)}')">Remove Folder From Desktop</button></div><div class="silver20-hub-grid">${f.apps.map(id=>card(appById(id))).join("")}</div></div>`;
        open(f.name,html,"silver-folder-20-"+f.id);
    };
    window.silver20RemoveDesktopItem=function(id){ const p=prefs(); p.desktop=p.desktop.filter(x=>x!==id); savePrefs(p); notify("Desktop", "Item removed from desktop but kept in Silver Apps.", "Desktop", "success"); };

    window.openSilverDesktopCustomizer20=function(){
        const p=prefs();
        const all=[...FOLDERS20.map(f=>({...f,type:"folder"})), ...APPS20.map(a=>({...a,type:"app"}))];
        const checks=all.map(i=>`<label class="silver11-check"><input data-silver20-desk="${esc(i.id)}" type="checkbox" ${p.desktop.includes(i.id)?"checked":""}> ${logoHTML(i.logo)} ${esc(i.name)} <small>${i.type}</small></label>`).join("");
        const html=`<div class="silver20-shell"><div class="silver-beta-header">${logoHTML("settings")}<div><h2>Silver Desktop Customizer</h2><p>Everything on the Silver desktop is customizable. Removing a folder from desktop does not delete it.</p></div></div>${noEditionsNotice()}<div class="silver11-settings-grid"><section><h3>Desktop Items</h3>${checks}</section><section><h3>Layout</h3><label>Icon Size<select id="silver20_icon"><option ${p.iconSize==='compact'?'selected':''}>compact</option><option ${p.iconSize==='normal'?'selected':''}>normal</option><option ${p.iconSize==='large'?'selected':''}>large</option></select></label><label>Density<select id="silver20_density"><option ${p.density==='compact'?'selected':''}>compact</option><option ${p.density==='comfortable'?'selected':''}>comfortable</option><option ${p.density==='spacious'?'selected':''}>spacious</option></select></label><label class="silver11-check"><input id="silver20_sidebar_toggle" type="checkbox" ${p.sidebar?"checked":""}> Show sidebar gadgets</label><button onclick="silver20SaveDesktopCustomizer()">Save Desktop</button><button onclick="silver20ResetDesktop()">Reset Defaults</button></section></div></div>`;
        open("Silver Desktop Customizer",html,"silver-desktop-customizer-20");
    };
    window.silver20SaveDesktopCustomizer=function(){ const p=prefs(); p.desktop=[...document.querySelectorAll('[data-silver20-desk]:checked')].map(i=>i.dataset.silver20Desk); p.iconSize=document.getElementById("silver20_icon")?.value||"normal"; p.density=document.getElementById("silver20_density")?.value||"comfortable"; p.sidebar=!!document.getElementById("silver20_sidebar_toggle")?.checked; savePrefs(p); notify("Desktop", "Silver desktop saved.", "Desktop", "success"); };
    window.silver20ResetDesktop=function(){ write(KEY.prefs, defaultPrefs()); renderDesktop(); notify("Desktop", "Silver Beta 2.0 defaults restored.", "Desktop", "success"); };

    window.openSilverDriveHub20=function(){
        const html=`<div class="silver20-shell"><div class="silver-beta-header">${logoHTML("drive")}<div><h2>Silver Drive + Office</h2><p>One consolidated workspace for files, folders, Docs, Sheets, Slides, Forms, templates, and vault.</p></div></div><div class="silver20-toolbar"><button onclick="openSilverDrive20()">Open Drive</button><button onclick="silver20NewDoc()">New Doc</button><button onclick="silver20NewSheet()">New Sheet</button><button onclick="silver20NewSlides()">New Slides</button><button onclick="silver20NewForm()">New Form</button><button onclick="openSilverTemplates11()">Templates</button></div><div class="silver20-hub-grid">${["drive","docs","sheets","slides","forms"].map(id=>card(appById(id))).join("")}${card({name:"Template Gallery",logo:"office",desc:"Open reusable Silver Office templates.",run:"openSilverTemplates11"})}${card({name:"Document Vault",logo:"drive",desc:"Open the Silver document vault.",run:"openSilverBetaVault"})}</div></div>`;
        open("Silver Drive + Office",html,"silver-drive-office-20");
    };
    window.openSilverDrive20=function(){ if(typeof window.openSilverDrive11==="function") return window.openSilverDrive11(); call("openSilverBetaFiles"); };
    window.silver20NewDoc=function(){ if(typeof window.silverDriveNewItem11==="function") return window.silverDriveNewItem11("edoc"); call("openSilverBetaWriter"); };
    window.silver20NewSheet=function(){ if(typeof window.silverDriveNewItem11==="function") return window.silverDriveNewItem11("esheet"); call("openSilverBetaSheets"); };
    window.silver20NewSlides=function(){ if(typeof window.silverDriveNewItem11==="function") return window.silverDriveNewItem11("eslide"); call("openSilverBetaSlides"); };
    window.silver20NewForm=function(){ if(typeof window.silverDriveNewItem11==="function") return window.silverDriveNewItem11("eform"); call("openSilverBetaForms"); };

    window.openSilverCommunications20=function(){
        const html=`<div class="silver20-shell"><div class="silver-beta-header">${logoHTML("mail")}<div><h2>Silver Communications</h2><p>Mail, Chat, People, contacts, blocking, and universal message notifications.</p></div></div><div class="silver20-hub-grid">${["mail","chat","people","notifications"].map(id=>card(appById(id))).join("")}</div></div>`;
        open("Silver Communications", html, "silver-comms-20");
    };
    window.openSilverCreatorHub20=function(){
        const html=`<div class="silver20-shell"><div class="silver-beta-header">${logoHTML("creator")}<div><h2>Silver Creator Studio</h2><p>Consolidated creator platform for apps, code, appstore publishing, assistant help, and app management.</p></div></div><div class="silver20-hub-grid">${["creatorhub","appmarket","applibrary","codestudio","assistant"].map(id=>card(appById(id))).join("")}</div></div>`;
        open("Silver Creator Studio", html, "silver-creator-20");
    };
    window.openSilverSystemHub20=function(){
        const html=`<div class="silver20-shell"><div class="silver-beta-header">${logoHTML("system")}<div><h2>Silver System Center</h2><p>Settings, personalization, sync, recovery, security, updates, and diagnostics.</p></div></div>${noEditionsNotice()}<div class="silver20-hub-grid">${["settings","personalization","sync","security","recovery","updates","help","feedback"].map(id=>card(appById(id))).join("")}</div></div>`;
        open("Silver System Center", html, "silver-system-20");
    };
    window.openSilverSettings20=function(){ if(typeof window.openSilverBetaControlCenter==="function") return window.openSilverBetaControlCenter(); window.openSilverSystemHub20(); };
    window.openSilverNotifications20=function(){ if(typeof window.openSilverBetaNotifications==="function") return window.openSilverBetaNotifications(); open("Universal Notifications", `<div class="silver20-shell"><div class="silver-beta-header">${logoHTML("bell")}<div><h2>Universal Notifications</h2><p>Notification system is ready.</p></div></div></div>`, "silver-notifications-20"); };
    window.openSilverResumeCenter20=function(){ if(typeof window.openSilverBetaSessionCenter==="function") return window.openSilverBetaSessionCenter(); open("Resume Center", `<div class="silver20-shell"><div class="silver-beta-header">${logoHTML("sync")}<div><h2>Resume Center</h2><p>Save and restore your Silver workspace.</p></div></div></div>`, "resume-20"); };
    window.openSilverSyncCenter20=function(){
        const html=`<div class="silver20-shell"><div class="silver-beta-header">${logoHTML("sync")}<div><h2>Silver Sync Center</h2><p>Cloud workspace, Drive sync, resume status, and diagnostics.</p></div></div><div class="silver20-status-row"><span><b>Cloud</b><br>Firebase when available</span><span><b>Workspace</b><br>Can be saved from Resume Center</span><span><b>Drive</b><br>Cloud save/load supported</span></div><div class="silver20-toolbar"><button onclick="silver11SaveDriveCloud?.(false)">Save Drive</button><button onclick="silver11LoadDriveCloud?.(false)">Load Drive</button><button onclick="openSilverResumeCenter20()">Resume Center</button></div></div>`;
        open("Silver Sync Center", html, "silver-sync-20");
    };
    window.openSilverUpdates20=function(){
        const html=`<div class="silver20-shell"><div class="silver-beta-header">${logoHTML("sync")}<div><h2>Silver Updates</h2><p>Current build: EmeraldOS Silver Beta 2.0</p></div></div><ul><li>More consolidated Silver workspace hubs.</li><li>Temporary no-editions Silver beta experience.</li><li>Vista-like app logos built with original CSS.</li><li>Application folders remain available and removable from desktop.</li><li>Responsive UI adjustments for smaller and larger screens.</li><li>Improved Drive + Office workspace front end.</li></ul></div>`;
        open("Silver Updates", html, "silver-updates-20");
    };

    function patchStart(){
        const btn=document.getElementById("start-btn"); if(btn) btn.textContent="Silver";
        const badge=document.getElementById("emerald40-edition-badge"); if(badge){ badge.textContent=""; badge.style.display="none"; }
        const build=document.getElementById("emerald40-build-badge"); if(build) build.textContent="Silver Beta 2.0";
        const results=document.getElementById("start-results");
        if(results){ results.innerHTML=`<div class="start-item" onclick="openSilverWorkspace20()">Silver Workspace</div><div class="start-item" onclick="openSilverDriveHub20()">Silver Drive + Office</div><div class="start-item" onclick="openSilverCommunications20()">Silver Communications</div><div class="start-item" onclick="openSilverCreatorHub20()">Silver Creator Studio</div><div class="start-item" onclick="openSilverSystemHub20()">Silver System Center</div><div class="start-item" onclick="openSilverApps20()">All Silver Apps</div>`; }
    }
    function boot(){
        document.body.dataset.theme="silver-beta20";
        localStorage.setItem("silver20_editions_temporarily_disabled", "true");
        patchStart(); renderDesktop();
        setTimeout(()=>{ patchStart(); renderDesktop(); }, 600);
        setTimeout(()=>{ patchStart(); }, 1400);
        notify("Silver Beta 2.0", "Consolidated workspace, no-editions beta mode, and Vista-like app logos are active.", "System", "success");
    }
    if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
