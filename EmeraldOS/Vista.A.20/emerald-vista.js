"use strict";

/* =========================================================
   EMERALDOS VISTA ALPHA 2.0
   Product line shell layer for EmeraldOS
   Vista-inspired only. No Microsoft assets are included.
========================================================= */

(function () {
    if (window.EmeraldOSVistaAlphaLoaded) return;
    window.EmeraldOSVistaAlphaLoaded = true;

    const BUILD = {
        productLine: "EmeraldOS Vista",
        displayName: "EmeraldOS Vista Alpha 2.0",
        channel: "Alpha",
        version: "2.0",
        codename: "Aurora Glass",
        base: "EmeraldOS 5.7",
        storagePrefix: "vista20_"
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
            alert(title + "\n\n" + html.replace(/<[^>]+>/g, " "));
        }
    }

    function button(label, fn) {
        const id = `${BUILD.storagePrefix}btn_${Math.random().toString(36).slice(2)}`;
        setTimeout(() => {
            const el = document.getElementById(id);
            if (el) el.addEventListener("click", fn);
        }, 0);
        return `<button id="${id}">${esc(label)}</button>`;
    }

    function appTile(title, desc, handlerName) {
        return `<div class="vista-launch-tile" onclick="${handlerName}?.()"><b>${esc(title)}</b><small>${esc(desc)}</small></div>`;
    }

    function setThemeVista() {
        try {
            localStorage.setItem("40_theme", "vista");
            localStorage.setItem("vista_product_line", BUILD.displayName);
            document.body.dataset.theme = "vista";
            if (typeof window.setTheme === "function") {
                const previous = window.setTheme;
                if (!previous.__vistaThemeCall) previous("vista");
            }
        } catch {
            document.body.dataset.theme = "vista";
        }
    }

    function tuneShellLabels() {
        document.title = BUILD.displayName;
        const start = document.getElementById("start-btn");
        if (start) start.textContent = "Vista";

        const editionBadge = document.getElementById("emerald40-edition-badge");
        if (editionBadge) editionBadge.textContent = BUILD.displayName;

        const buildBadge = document.getElementById("emerald40-build-badge");
        if (buildBadge) buildBadge.textContent = "Alpha 2.0";

        const side = document.querySelector(".start-side");
        if (side) side.textContent = BUILD.productLine;

        const startMenu = document.getElementById("start-menu");
        if (startMenu && !document.getElementById("vista-start-badge")) {
            const badge = document.createElement("div");
            badge.id = "vista-start-badge";
            badge.textContent = BUILD.displayName;
            startMenu.appendChild(badge);
        }
    }

    function patchThemeCommands() {
        const originalSetTheme = window.setTheme;
        if (typeof originalSetTheme === "function" && !originalSetTheme.__vistaPatched) {
            const patched = function (name) {
                originalSetTheme.__vistaThemeCall = true;
                originalSetTheme(name);
                originalSetTheme.__vistaThemeCall = false;
                if (name === "vista") {
                    document.body.dataset.theme = "vista";
                    tuneShellLabels();
                }
            };
            patched.__vistaPatched = true;
            window.setTheme = patched;
        }
    }

    function installRibbon() {
        if (document.getElementById("vista-alpha-ribbon")) return;
        const ribbon = document.createElement("div");
        ribbon.id = "vista-alpha-ribbon";
        ribbon.className = "vista-alpha-ribbon";
        ribbon.textContent = `${BUILD.displayName} • ${BUILD.codename}`;
        document.body.appendChild(ribbon);
    }

    function installSidebar() {
        if (document.getElementById("vista-sidebar")) return;
        const sidebar = document.createElement("div");
        sidebar.id = "vista-sidebar";
        sidebar.innerHTML = `
            <div class="vista-gadget">
                <h4>Vista Clock</h4>
                <div class="big" id="vista-clock-time">--:--</div>
                <small id="vista-clock-date"></small>
            </div>
            <div class="vista-gadget">
                <h4>Account</h4>
                <div>${esc(getUsername())}</div>
                <small>${esc(getEdition())} edition</small>
            </div>
            <div class="vista-gadget">
                <h4>Cloud Status</h4>
                <div id="vista-cloud-state">Checking...</div>
                <small>Firebase-backed services</small>
            </div>
            <div class="vista-gadget">
                <h4>Quick Access</h4>
                <button onclick="openVistaWelcome()">Welcome Center</button>
                <button onclick="openVistaProductHub()">Vista Hub</button>
                <button onclick="openVistaControlPanel()">Control Panel</button>
            </div>
        `;
        document.body.appendChild(sidebar);

        const update = () => {
            const now = new Date();
            const time = document.getElementById("vista-clock-time");
            const date = document.getElementById("vista-clock-date");
            const cloud = document.getElementById("vista-cloud-state");
            if (time) time.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            if (date) date.textContent = now.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
            if (cloud) cloud.textContent = navigator.onLine ? "Online" : "Offline";
        };
        update();
        setInterval(update, 1000);
    }

    function addProductFolder() {
        const desktop = document.getElementById("desktop");
        if (!desktop || document.getElementById("vista-product-icon")) return;
        const icon = document.createElement("div");
        icon.id = "vista-product-icon";
        icon.className = "icon vista-product-icon";
        icon.tabIndex = 0;
        icon.innerHTML = `<div style="font-size:30px">◉</div><br>Vista Hub`;
        icon.addEventListener("click", () => {
            setTimeout(() => icon.blur(), 50);
            window.openVistaProductHub();
        });
        icon.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                window.openVistaProductHub();
            }
        });
        desktop.prepend(icon);
    }

    function statusStrip() {
        return `<div class="vista-status-strip">
            <div class="vista-status-card"><b>Product line</b><span>${esc(BUILD.productLine)}</span></div>
            <div class="vista-status-card"><b>Release</b><span>${esc(BUILD.channel)} ${esc(BUILD.version)}</span></div>
            <div class="vista-status-card"><b>Base system</b><span>${esc(BUILD.base)}</span></div>
            <div class="vista-status-card"><b>User</b><span>${esc(getUsername())}</span></div>
        </div>`;
    }

    window.openVistaProductHub = function () {
        const html = `<div class="vista-center-window vista-hero">
            <div class="vista-product-header">
                <div class="vista-orb"></div>
                <div>
                    <div class="vista-product-title">${esc(BUILD.displayName)}</div>
                    <div class="vista-product-subtitle">${esc(BUILD.codename)} • Vista-inspired EmeraldOS product line</div>
                </div>
            </div>
            ${statusStrip()}
            <p>EmeraldOS Vista is now separated as its own EmeraldOS product line. It keeps the EmeraldOS 5.7 platform while adding a glass desktop, a Vista-style control experience, gadgets, personalization, and a more polished consumer desktop layout.</p>
            <div class="vista-launch-grid">
                ${appTile("Welcome Center", "Introduction, product direction, and quick links.", "openVistaWelcome")}
                ${appTile("Control Panel", "Central place for settings, personalization, network, security, and accounts.", "openVistaControlPanel")}
                ${appTile("Personalization", "Theme, wallpaper, glass, icon, and sidebar options.", "openVistaPersonalization")}
                ${appTile("Gadget Gallery", "Desktop sidebar tools and status gadgets.", "openVistaGadgetGallery")}
                ${appTile("Media Center", "Vista-style hub for photo, music, video, and creative tools.", "openVistaMediaCenter")}
                ${appTile("Network Center", "Cloud, sync, sharing, mail, and connection status.", "openVistaNetworkCenter")}
                ${appTile("Security Center", "Appstore safety, privacy, recovery, and system protection tools.", "openVistaSecurityCenter")}
                ${appTile("Product Line", "Edition strategy and roadmap for EmeraldOS Vista.", "openVistaProductLine")}
            </div>
            <p><b>Note:</b> This is an original Vista-inspired EmeraldOS design. It does not include Microsoft assets, logos, wallpapers, or icons.</p>
        </div>`;
        open("EmeraldOS Vista Hub", html, "vistaHub");
    };

    window.openVistaWelcome = function () {
        const html = `<div class="vista-center-window vista-hero">
            <div class="vista-product-header"><div class="vista-orb"></div><div><div class="vista-product-title">Welcome to EmeraldOS Vista</div><div class="vista-product-subtitle">Alpha 2.0 product-line preview</div></div></div>
            <p>EmeraldOS Vista Alpha 2.0 expands EmeraldOS Silver into a dedicated product line focused on a glass desktop, sidebar gadgets, smooth windows, a polished Control Panel, and a more consumer-friendly experience.</p>
            ${statusStrip()}
            <div class="vista-launch-grid">
                ${appTile("Emerald Office", "Open the productivity suite from the 5.7 base.", "openEmeraldOffice57")}
                ${appTile("Emerald Mail", "Open the internal EmeraldOS mail service.", "openEmeraldMail57")}
                ${appTile("Emerald Assistant", "Configure or open the assistant.", "openAssistantSettings57")}
                ${appTile("User Appstore", "Install user-created applications with warning controls.", "openUserAppstore57")}
            </div>
        </div>`;
        open("Vista Welcome Center", html, "vistaWelcome");
    };

    window.openVistaControlPanel = function () {
        const html = `<div class="vista-center-window vista-hero">
            <h2>Control Panel</h2>
            <p>Vista Alpha 2.0 organizes EmeraldOS settings into familiar, large categories.</p>
            <div class="vista-launch-grid">
                ${appTile("Appearance and Personalization", "Themes, glass, wallpaper, icons, and desktop layout.", "openVistaPersonalization")}
                ${appTile("Network and Sharing", "Cloud status, shared files, mail, and sync tools.", "openVistaNetworkCenter")}
                ${appTile("Security Center", "Privacy, appstore warnings, blocked users, and recovery tools.", "openVistaSecurityCenter")}
                ${appTile("Programs", "Application Editor, App Library, User Appstore, and installed apps.", "openAppLibrary56")}
                ${appTile("User Accounts", "Profile, contacts, blocking, and EmeraldOS users.", "openUserProfile56")}
                ${appTile("System and Maintenance", "Recovery Center, logs, desktop repair, and safe mode.", "openRecoveryCenter56")}
                ${appTile("Mail", "Emerald Mail inbox, compose, drafts, and address book.", "openEmeraldMail57")}
                ${appTile("Office", "Writer, Sheets, Slides, Forms, templates, and document vault.", "openEmeraldOffice57")}
            </div>
        </div>`;
        open("Vista Control Panel", html, "vistaControlPanel");
    };

    window.openVistaPersonalization = function () {
        const html = `<div class="vista-center-window vista-hero">
            <h2>Personalization</h2>
            <p>Customize the Vista product line without editing core files directly.</p>
            <div class="vista-launch-grid">
                <div class="vista-launch-tile" onclick="setTheme?.('vista')"><b>Apply Vista Glass</b><small>Restore the Alpha 2.0 glass theme.</small></div>
                ${appTile("Theme Studio", "Create and preview EmeraldOS themes.", "openThemeStudio57")}
                ${appTile("Icon Studio", "Create app icons and labels for custom apps.", "openIconStudio57")}
                ${appTile("System Customizer", "Edit safe shell settings and layout options.", "openSystemCustomizer57")}
                ${appTile("Desktop Tools", "Align, lock, sync, or reset desktop layout.", "openDesktopTools56")}
                ${appTile("Settings", "Open the main EmeraldOS Settings app.", "openSettings56")}
            </div>
            <div class="vista-glass-list">
                <div class="vista-glass-row"><span>Theme storage key</span><code>40_theme = vista</code></div>
                <div class="vista-glass-row"><span>Product line key</span><code>vista_product_line = EmeraldOS Vista Alpha 2.0</code></div>
            </div>
        </div>`;
        open("Vista Personalization", html, "vistaPersonalization");
    };

    window.openVistaGadgetGallery = function () {
        const html = `<div class="vista-center-window vista-hero">
            <h2>Gadget Gallery</h2>
            <p>Alpha 2.0 includes a sidebar gadget layer. These gadgets are lightweight shell widgets, not external downloads.</p>
            <div class="vista-launch-grid">
                <div class="vista-launch-tile"><b>Clock</b><small>Current time and date.</small></div>
                <div class="vista-launch-tile"><b>Account</b><small>Signed-in user and edition.</small></div>
                <div class="vista-launch-tile"><b>Cloud Status</b><small>Online/offline connection indicator.</small></div>
                <div class="vista-launch-tile"><b>Quick Access</b><small>Welcome, Hub, and Control Panel shortcuts.</small></div>
            </div>
            <p>Future Vista releases can add weather, calendar, mail, storage, and notification gadgets.</p>
        </div>`;
        open("Vista Gadget Gallery", html, "vistaGadgets");
    };

    window.openVistaMediaCenter = function () {
        const html = `<div class="vista-center-window vista-hero">
            <h2>Media Center</h2>
            <p>A polished hub for media and creative tools in the Vista product line.</p>
            <div class="vista-launch-grid">
                ${appTile("Photo Gallery", "Organize images and visual files.", "openVistaPhotoGallery")}
                ${appTile("Creative Hub", "Open EmeraldOS creative tools.", "openCreativeHub50")}
                ${appTile("Files", "Open saved files and uploaded media.", "openFileExplorer")}
                ${appTile("Emerald Office", "Create documents, slides, and forms.", "openEmeraldOffice57")}
            </div>
        </div>`;
        open("Vista Media Center", html, "vistaMediaCenter");
    };

    window.openVistaPhotoGallery = function () {
        const html = `<div class="vista-center-window vista-hero">
            <h2>Photo Gallery</h2>
            <p>Alpha placeholder for a future Vista-style gallery. For now, use Files to open image uploads and media folders.</p>
            <div class="vista-launch-grid">
                ${appTile("Open Files", "View image uploads and local/cloud files.", "openFileExplorer")}
                ${appTile("Storage Center", "Check storage usage and cleanup recommendations.", "openStorageCenter51")}
            </div>
        </div>`;
        open("Vista Photo Gallery", html, "vistaPhotoGallery");
    };

    window.openVistaNetworkCenter = function () {
        const html = `<div class="vista-center-window vista-hero">
            <h2>Network and Sharing Center</h2>
            ${statusStrip()}
            <div class="vista-launch-grid">
                ${appTile("Files", "Open consolidated cloud storage.", "openFileExplorer")}
                ${appTile("Shared With Me", "View files shared by other EmeraldOS users.", "openSharedWithMe51")}
                ${appTile("Shared By Me", "Review outgoing shares.", "openSharedByMe55")}
                ${appTile("Emerald Mail", "Open internal EmeraldOS mail.", "openEmeraldMail57")}
                ${appTile("Emerald Chat", "Open integrated chat tools.", "openEmeraldChat52")}
                ${appTile("Sync Queue", "View pending sync and cloud operations.", "openSyncQueue57")}
            </div>
        </div>`;
        open("Vista Network and Sharing Center", html, "vistaNetworkCenter");
    };

    window.openVistaSecurityCenter = function () {
        const html = `<div class="vista-center-window vista-hero">
            <h2>Security Center</h2>
            <p>Manage safety, privacy, appstore risk, blocked users, and recovery controls.</p>
            <div class="vista-launch-grid">
                ${appTile("Security & Privacy", "Open EmeraldOS security controls.", "openSecurityPrivacy56")}
                ${appTile("Blocking Center", "Block or unblock EmeraldOS users.", "openBlockingCenter54")}
                ${appTile("User Appstore", "Install user apps with the required risk warning.", "openUserAppstore57")}
                ${appTile("App Scanner", "Review custom app risk indicators.", "openAppScanner57")}
                ${appTile("Recovery Center", "Reset risky customizations and repair the shell.", "openRecoveryCenter56")}
                ${appTile("Safe Mode", "Disable risky customizations on boot.", "openSafeMode56")}
            </div>
        </div>`;
        open("Vista Security Center", html, "vistaSecurityCenter");
    };

    window.openVistaProductLine = function () {
        const html = `<div class="vista-center-window vista-hero">
            <h2>EmeraldOS Vista Product Line</h2>
            <p><b>EmeraldOS Vista</b> is a separate EmeraldOS product line focused on glass design, approachable desktop tools, media-style hubs, and a polished control-panel experience.</p>
            <div class="vista-glass-list">
                <div class="vista-glass-row"><span>Current release</span><b>Alpha 2.0</b></div>
                <div class="vista-glass-row"><span>Base platform</span><b>EmeraldOS 5.7</b></div>
                <div class="vista-glass-row"><span>Design direction</span><b>Original glass desktop inspired by late-2000s UI design</b></div>
                <div class="vista-glass-row"><span>Asset policy</span><b>No Microsoft assets, logos, wallpapers, or icons</b></div>
            </div>
            <h3>Product Roadmap</h3>
            <div class="vista-launch-grid">
                <div class="vista-launch-tile"><b>Alpha 2.x</b><small>Glass shell, Control Panel, gadgets, product line branding.</small></div>
                <div class="vista-launch-tile"><b>Alpha 3.x</b><small>Improved sidebar widgets, media library, and shell animations.</small></div>
                <div class="vista-launch-tile"><b>Beta 1.x</b><small>More complete settings, personalization, and recovery tools.</small></div>
                <div class="vista-launch-tile"><b>Release Candidate</b><small>Stability pass, accessibility polish, and final product-line docs.</small></div>
            </div>
        </div>`;
        open("EmeraldOS Vista Product Line", html, "vistaProductLine");
    };

    window.openVistaAlphaNotes = function () {
        const html = `<div class="vista-center-window vista-hero">
            <h2>Alpha 2.0 Notes</h2>
            <ul>
                <li>New EmeraldOS Vista product-line identity.</li>
                <li>Glass-style desktop and taskbar overlay.</li>
                <li>Vista Hub desktop icon.</li>
                <li>Control Panel-style launcher.</li>
                <li>Sidebar gadgets for clock, account, cloud status, and quick access.</li>
                <li>Network, Security, Personalization, Media, and Product Line panels.</li>
                <li>EmeraldOS 5.7 Assistant, Office, Mail, Creator, Appstore, Files, and moderation tools remain included.</li>
            </ul>
        </div>`;
        open("Vista Alpha 2.0 Notes", html, "vistaAlphaNotes");
    };

    function installShortcuts() {
        window.addEventListener("keydown", event => {
            const key = event.key.toLowerCase();
            if (event.ctrlKey && event.altKey && key === "v") {
                event.preventDefault();
                window.openVistaProductHub();
            }
            if (event.ctrlKey && event.altKey && key === "p") {
                event.preventDefault();
                window.openVistaPersonalization();
            }
        });
    }

    function installStartMenuLinks() {
        const startResults = document.getElementById("start-results");
        if (!startResults || document.getElementById("vista-start-links")) return;
        const wrap = document.createElement("div");
        wrap.id = "vista-start-links";
        wrap.innerHTML = `
            <div class="start-item" onclick="openVistaProductHub()">EmeraldOS Vista Hub</div>
            <div class="start-item" onclick="openVistaControlPanel()">Vista Control Panel</div>
            <div class="start-item" onclick="openVistaPersonalization()">Vista Personalization</div>
            <div class="start-item" onclick="openVistaSecurityCenter()">Vista Security Center</div>
        `;
        startResults.prepend(wrap);
    }

    function bootVista() {
        patchThemeCommands();
        setThemeVista();
        tuneShellLabels();
        installRibbon();
        installSidebar();
        installShortcuts();
        addProductFolder();
        installStartMenuLinks();
        setTimeout(() => {
            setThemeVista();
            tuneShellLabels();
            addProductFolder();
            installStartMenuLinks();
        }, 800);
        setTimeout(() => {
            addProductFolder();
            installStartMenuLinks();
        }, 1800);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bootVista);
    } else {
        bootVista();
    }
})();
