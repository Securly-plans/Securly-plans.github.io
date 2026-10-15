"use strict";

/* =========================================================
   EMERALDOS SILVER BETA 1.0
   Separate Silver product-line shell, universal notifications,
   Silver app logos, improved Silver Office, and cloud VM resume.
   Original Silver-inspired assets only. No Microsoft assets.
========================================================= */
(function () {
    if (window.EmeraldOSSilverBeta1Loaded) return;
    window.EmeraldOSSilverBeta1Loaded = true;

    const BUILD = {
        productLine: "EmeraldOS Silver",
        displayName: "EmeraldOS Silver Beta 1.0",
        channel: "Beta",
        version: "1.0",
        codename: "Silver Continuity",
        platform: "EmeraldOS Platform 5.7",
        storagePrefix: "silver10_",
        cloudCollection: "emeraldOSUsers",
        sessionCollection: "silverBeta"
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
        document.body.dataset.theme = "silver-beta1";
        localStorage.setItem("silver_product_line", BUILD.displayName);
        localStorage.setItem("40_theme", "silver-beta1");
        const start = document.getElementById("start-btn");
        if (start) start.textContent = "Silver";
        const side = document.querySelector(".start-side");
        if (side) side.textContent = "Silver";
        const editionBadge = document.getElementById("emerald40-edition-badge");
        if (editionBadge) editionBadge.textContent = BUILD.displayName;
        const buildBadge = document.getElementById("emerald40-build-badge");
        if (buildBadge) buildBadge.textContent = "Beta 1.0";
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

    window.openSilverBetaHelp = () => open("Silver Help", header("help", "Silver Help and Support", "Guides for Silver Beta 1.0") + `<div class="silver-beta-grid"><div class="silver-app-card">${logo("home")}<div><b>Starting Silver</b><small>Login normally, open Silver Home, and restore your previous cloud session.</small></div></div><div class="silver-app-card">${logo("office")}<div><b>Using Silver Office</b><small>Create documents in Writer, save them to the Silver Vault, or export/save to Files.</small></div></div><div class="silver-app-card">${logo("sync")}<div><b>Device Continuity</b><small>Use Resume Center to save and restore your VM state across devices.</small></div></div><div class="silver-app-card">${logo("notifications")}<div><b>Notifications</b><small>The taskbar bell holds unread mail, chat, share, appstore, and system notices.</small></div></div></div>` + end(), "help");
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
        silverNotify("Silver Beta", "Welcome to EmeraldOS Silver Beta 1.0.", "System", "info");
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
})();
