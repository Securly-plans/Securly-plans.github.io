"use strict";

/* =========================================================
   EMERALDOS 4.2
   True edition system
   Built on EmeraldOS 3.2
========================================================= */

(function () {

    if (window.EmeraldOS40Loaded) {
        console.warn("EmeraldOS 4.5 already loaded.");
        return;
    }

    window.EmeraldOS40Loaded = true;

    const EMERALDOS_BUILD = {
        product: "EmeraldOS",
        base: "EmeraldOS 3.2",
        displayName: "EmeraldOS 4.5",
        version: "4.5",
        channel: "Stable",
        codename: "Office 360 & Desktop Consistency Update",
        experimental: false
    };

    const EMERALDOS_EDITIONS = {
        economy: {
            id: "economy",
            name: "EmeraldOS Economy",
            shortName: "Economy",
            level: 1,
            color: "#606060",
            description: "Smallest EmeraldOS edition with only essential desktop tools.",
            includes: [
                "Core desktop",
                "Files",
                "Notes",
                "Calculator",
                "Clock",
                "System panel",
                "Plans page",
                "Desktop app folders"
            ]
        },

        home: {
            id: "home",
            name: "EmeraldOS Home",
            shortName: "Home",
            level: 2,
            color: "#008000",
            description: "Base desktop edition with core personal tools.",
            includes: [
                "Core desktop",
                "Files",
                "Notes",
                "Docs",
                "Calendar",
                "Calculator",
                "Clock",
                "System panel",
                "Plans page"
            ]
        },

        business: {
            id: "business",
            name: "EmeraldOS Business",
            shortName: "Business",
            level: 3,
            color: "#000080",
            description: "Work edition with browser, communication, and productivity tools.",
            includes: [
                "Everything in Home",
                "Workspace",
                "Browser",
                "App Store",
                "Chat",
                "Media Player"
            ]
        },

        virtue: {
            id: "virtue",
            name: "EmeraldOS Virtue",
            shortName: "Virtue",
            level: 4,
            color: "#800080",
            description: "Pro edition with developer and power-user tools.",
            includes: [
                "Everything in Business",
                "Terminal",
                "Developer Tools",
                "System Monitor",
                "Wallpaper Manager",
                "Desktop Manager",
                "Paint"
            ]
        },

        developer: {
            id: "developer",
            name: "EmeraldOS Developer",
            shortName: "Developer",
            level: 5,
            color: "#404040",
            description: "Developer edition with coding, debugging, terminal, and build inspection tools.",
            includes: [
                "Everything in Virtue",
                "Terminal",
                "Developer Tools",
                "Code Studio",
                "Debug Console",
                "Build Inspector"
            ]
        },

        executive: {
            id: "executive",
            name: "EmeraldOS Executive",
            shortName: "Executive",
            level: 6,
            color: "#800000",
            description: "Complete edition with every EmeraldOS app and experimental feature visible.",
            includes: [
                "Everything in Developer",
                "Games",
                "Executive Dashboard",
                "All experimental apps",
                "All edition features"
            ]
        }
    };

    const LEVELS = Object.fromEntries(
        Object.values(EMERALDOS_EDITIONS).map(edition => [edition.id, edition.level])
    );

    function hasExecutiveAdminAccess() {
        return localStorage.getItem("40_executive_verified") === "true";
    }

    function hasDeveloperStaffAccess() {
        if (hasExecutiveAdminAccess()) return true;

        const verified =
            localStorage.getItem("40_developer_verified") === "true";

        const role = String(
            localStorage.getItem("40_developer_role") ||
            localStorage.getItem("role") ||
            ""
        ).toLowerCase();

        return verified && (role === "admin" || role === "mod");
    }

    function normalizeEdition(id) {
        if (id === "executive" && !hasExecutiveAdminAccess()) {
            return "virtue";
        }

        if (id === "developer" && !hasDeveloperStaffAccess()) {
            return "virtue";
        }

        return LEVELS[id] ? id : "virtue";
    }

    function ensureEmeraldOSBootConfig() {
        if (!localStorage.getItem("40_build_name")) {
            localStorage.setItem("40_build_id", "emerald40");
            localStorage.setItem("40_build_name", EMERALDOS_BUILD.displayName);
            localStorage.setItem("40_version", EMERALDOS_BUILD.version);
            localStorage.setItem("40_channel", EMERALDOS_BUILD.channel);
            localStorage.setItem("40_test_build", "false");
        }

        if (!localStorage.getItem("40_edition")) {
            localStorage.setItem("40_edition", "virtue");
            localStorage.setItem("40_edition_name", EMERALDOS_EDITIONS.virtue.name);
        }
    }

    function getEmeraldOSEdition() {
        return normalizeEdition(localStorage.getItem("40_edition") || "virtue");
    }

    function getEmeraldOSEditionData() {
        return EMERALDOS_EDITIONS[getEmeraldOSEdition()] || EMERALDOS_EDITIONS.virtue;
    }

    function getEmeraldOSEditionLevel() {
        return getEmeraldOSEditionData().level || 1;
    }

    function canUseEmeraldOSEdition(requiredEdition = "home") {
        if (requiredEdition === "developer" && !hasDeveloperStaffAccess()) {
            return false;
        }

        if (requiredEdition === "executive" && !hasExecutiveAdminAccess()) {
            return false;
        }

        return getEmeraldOSEditionLevel() >= (LEVELS[requiredEdition] || 1);
    }

    function setEmeraldOSEdition(id) {
        if (id === "executive" && !hasExecutiveAdminAccess()) {
            if (typeof window.notify === "function") {
                window.notify("Executive Locked", "Executive requires Emerald Games administrator verification from BIOS.", 4500, "warning");
            }
            id = "virtue";
        }

        if (id === "developer" && !hasDeveloperStaffAccess()) {
            if (typeof window.notify === "function") {
                window.notify("Developer Locked", "Developer mode requires Emerald Games mod or admin verification from BIOS.", 4500, "warning");
            }
            id = "virtue";
        }

        id = normalizeEdition(id);

        localStorage.setItem("40_edition", id);
        localStorage.setItem("40_edition_name", EMERALDOS_EDITIONS[id].name);

        renderEmeraldOSEditionBadge();

        if (typeof window.refreshEditionVisibility === "function") {
            window.refreshEditionVisibility();
        }

        if (typeof window.notify === "function") {
            window.notify(
                "Edition Updated",
                "Now running " + EMERALDOS_EDITIONS[id].name,
                3500,
                "success"
            );
        }

        return true;
    }

    function injectEmeraldOSStyles() {
        if (document.getElementById("emerald40-styles")) return;

        const style = document.createElement("style");
        style.id = "emerald40-styles";

        style.textContent = `
#emerald40-build-badge,
#emerald40-edition-badge {
    display: inline-flex;
    align-items: center;
    height: 22px;
    margin-left: 6px;
    font-family: "MS Sans Serif", Tahoma, Arial, sans-serif;
    font-size: 11px;
}

.emerald40-badge-inner {
    background: #c0c0c0;
    color: #000000;
    padding: 2px 6px;
    white-space: nowrap;
    border-top: 1px solid #ffffff;
    border-left: 1px solid #ffffff;
    border-right: 1px solid #404040;
    border-bottom: 1px solid #404040;
}

.emerald40-build {
    background: #800080;
    color: #ffffff;
    font-weight: bold;
}

.emerald40-edition {
    font-weight: bold;
}

.emerald40-panel {
    background: #c0c0c0;
    color: #000000;
    font-family: "MS Sans Serif", Tahoma, Arial, sans-serif;
    font-size: 12px;
    padding: 10px;
    height: 100%;
    box-sizing: border-box;
    overflow: auto;
}

.emerald40-box {
    background: #d4d0c8;
    padding: 10px;
    margin-bottom: 10px;
    border-top: 2px solid #ffffff;
    border-left: 2px solid #ffffff;
    border-right: 2px solid #808080;
    border-bottom: 2px solid #808080;
}

.emerald40-inset {
    background: #ffffff;
    padding: 8px;
    border-top: 2px solid #808080;
    border-left: 2px solid #808080;
    border-right: 2px solid #ffffff;
    border-bottom: 2px solid #ffffff;
}

.emerald40-button {
    background: #c0c0c0;
    color: #000000;
    padding: 5px 12px;
    cursor: pointer;
    font-family: "MS Sans Serif", Tahoma, Arial, sans-serif;
    font-size: 12px;
    border-top: 2px solid #ffffff;
    border-left: 2px solid #ffffff;
    border-right: 2px solid #808080;
    border-bottom: 2px solid #808080;
}

.emerald40-button:active {
    border-top: 2px solid #808080;
    border-left: 2px solid #808080;
    border-right: 2px solid #ffffff;
    border-bottom: 2px solid #ffffff;
}

.emerald40-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
}

.emerald40-hidden-note {
    background: #ffffcc;
    padding: 8px;
    margin-bottom: 10px;
    border-top: 2px solid #808080;
    border-left: 2px solid #808080;
    border-right: 2px solid #ffffff;
    border-bottom: 2px solid #ffffff;
}

@media (max-width: 700px) {
    .emerald40-grid {
        grid-template-columns: 1fr;
    }
}
`;

        document.head.appendChild(style);
    }

    function ensureEmeraldOSBadges() {
        const taskbar =
            document.getElementById("taskbar") ||
            document.querySelector(".taskbar");

        if (!taskbar) return;

        if (!document.getElementById("emerald40-edition-badge")) {
            const editionBadge = document.createElement("div");
            editionBadge.id = "emerald40-edition-badge";
            taskbar.appendChild(editionBadge);
        }

        if (!document.getElementById("emerald40-build-badge")) {
            const buildBadge = document.createElement("div");
            buildBadge.id = "emerald40-build-badge";
            taskbar.appendChild(buildBadge);
        }
    }

    function renderEmeraldOSBuildBadge() {
        const badge = document.getElementById("emerald40-build-badge");
        if (!badge) return;

        badge.innerHTML = `
            <span class="emerald40-badge-inner emerald40-build">
                ${EMERALDOS_BUILD.displayName}
            </span>
        `;
    }

    function renderEmeraldOSEditionBadge() {
        const badge = document.getElementById("emerald40-edition-badge");
        if (!badge) return;

        const edition = getEmeraldOSEditionData();

        badge.innerHTML = `
            <span class="emerald40-badge-inner emerald40-edition" style="color:${edition.color}">
                ${edition.shortName}
            </span>
        `;
    }

    function editionCards() {
        const current = getEmeraldOSEdition();

        return Object.values(EMERALDOS_EDITIONS).map(edition => {
            const items = edition.includes.map(item => `<li>${escapeHTML(item)}</li>`).join("");

            return `
                <div class="emerald40-box">
                    <h3 style="margin-top:0;color:${edition.color};">${edition.name}</h3>
                    <p>${edition.description}</p>
                    <div class="emerald40-inset">
                        <b>Visible features:</b>
                        <ul>${items}</ul>
                    </div>
                    <br>
                    ${current === edition.id
                        ? "<b>Currently active</b>"
                        : "<span>Available only when selected from BIOS.</span>"}
                </div>
            `;
        }).join("");
    }

    function openAboutEmeraldOS() {
        const edition = getEmeraldOSEditionData();

        const html = `
            <div class="emerald40-panel">
                <div class="emerald40-box">
                    <h2 style="margin-top:0;">${EMERALDOS_BUILD.displayName}</h2>
                    <div class="emerald40-inset">
                        <b>Product:</b> ${EMERALDOS_BUILD.product}<br>
                        <b>Built On:</b> ${EMERALDOS_BUILD.base}<br>
                        <b>Version:</b> ${EMERALDOS_BUILD.version}<br>
                        <b>Channel:</b> ${EMERALDOS_BUILD.channel}<br>
                        <b>Codename:</b> ${EMERALDOS_BUILD.codename}<br>
                        <b>Edition:</b> ${edition.name}<br>
                        <b>Experimental:</b> ${EMERALDOS_BUILD.experimental ? "Yes" : "No"}
                    </div>
                </div>

                <div class="emerald40-hidden-note">
                    Locked features are hidden. The desktop and Start menu only show features available in the active edition.
                </div>
            </div>
        `;

        openContentWindow("About EmeraldOS", html);
    }

    function openEmeraldOSEditionManager() {
        const html = `
            <div class="emerald40-panel">
                <div class="emerald40-box">
                    <h2 style="margin-top:0;">EmeraldOS Editions</h2>
                    <p>Select the edition EmeraldOS should run in. Apps above the active edition will not appear.</p>
                </div>
                <div class="emerald40-grid">${editionCards()}</div>
            </div>
        `;

        openContentWindow("EmeraldOS Editions", html);
    }

    function openEmeraldOSPlans() {
        if (typeof window.openWindow === "function") {
            window.openWindow(
                "EmeraldOS Plans",
                `<iframe src="plans.html" style="width:100%;height:100%;border:0;background:#c0c0c0;"></iframe>`,
                "plans"
            );
        } else {
            window.location.href = "plans.html";
        }
    }

    function openBusinessWorkspace() {
        openContentWindow(
            "Business Workspace",
            `
            <div class="emerald40-panel">
                <div class="emerald40-box">
                    <h2 style="margin-top:0;">Business Workspace</h2>
                    <p>Business tools are available in Business, Virtue, and Executive editions.</p>
                </div>
                <div class="emerald40-inset">
                    Workspace mode is active for ${getEmeraldOSEditionData().name}.
                </div>
            </div>
            `,
            "workspace"
        );
    }

    function openDeveloperTools() {
        openContentWindow(
            "Developer Tools",
            `
            <div class="emerald40-panel">
                <div class="emerald40-box">
                    <h2 style="margin-top:0;">Developer Tools</h2>
                    <p>Developer tools are available in the Developer and Executive editions.</p>
                </div>
                <div class="emerald40-inset">
                    Build: ${EMERALDOS_BUILD.displayName}<br>
                    Edition: ${getEmeraldOSEditionData().name}<br>
                    Channel: ${EMERALDOS_BUILD.channel}
                </div>
            </div>
            `,
            "devtools"
        );
    }

    function openExecutiveDashboard() {
        openContentWindow(
            "Executive Dashboard",
            `
            <div class="emerald40-panel">
                <div class="emerald40-box">
                    <h2 style="margin-top:0;">Executive Dashboard</h2>
                    <p>All EmeraldOS edition features are unlocked.</p>
                </div>
                <div class="emerald40-inset">
                    Active edition: ${getEmeraldOSEditionData().name}<br>
                    Feature visibility: all applications visible
                </div>
            </div>
            `,
            "executive"
        );
    }

    function openContentWindow(title, html, app = "emerald40") {
        if (typeof window.openWindow === "function") {
            window.openWindow(title, html, app);
        } else {
            alert(title);
        }
    }



    /* =====================================================
       CORE EMERALDOS APPS PROVIDED BY EDITION LAYER
    ===================================================== */

    let emerald40CalcInput = "";
    let emerald40StopwatchInterval = null;
    let emerald40StopwatchSeconds = 0;

    function openSystemApp() {
        const edition = getEmeraldOSEditionData();

        openContentWindow(
            "System Control Panel",
            `
            <div class="emerald40-panel">
                <div class="emerald40-box">
                    <h2 style="margin-top:0;">System</h2>
                    <div class="emerald40-inset">
                        <b>User:</b> ${localStorage.getItem("40_username") || "Guest"}<br>
                        <b>Build:</b> ${EMERALDOS_BUILD.displayName}<br>
                        <b>Built On:</b> ${EMERALDOS_BUILD.base}<br>
                        <b>Edition:</b> ${edition.name}<br>
                        <b>Feature rule:</b> Locked apps are hidden
                    </div>
                </div>

                <div class="emerald40-box">
                    <b>Theme</b><br><br>
                    <button class="emerald40-button" onclick="setTheme('classic')">Classic</button>
                    <button class="emerald40-button" onclick="setTheme('dark')">Dark</button>
                    <button class="emerald40-button" onclick="setTheme('light')">Light</button>
                    <button class="emerald40-button" onclick="setTheme('midnight')">Midnight</button>
                </div>

                <div class="emerald40-box">
                    <button class="emerald40-button" onclick="window.location.href='bios.html'">Reboot to BIOS</button>
                    <button class="emerald40-button" onclick="restartOS()">Restart Shell</button>
                    <button class="emerald40-button" onclick="logoutUser()">Logout</button>
                </div>
            </div>
            `,
            "system"
        );
    }

    function openCalendar() {
        const today = new Date().toISOString().split("T")[0];

        openContentWindow(
            "Calendar",
            `
            <div class="emerald40-panel">
                <div class="emerald40-box">
                    <h2 style="margin-top:0;">Calendar</h2>
                    <input id="emerald40-calendar-date" type="date" value="${today}">
                    <br><br>
                    <textarea id="emerald40-calendar-text" style="width:100%;height:150px;box-sizing:border-box;" placeholder="Enter notes for this date"></textarea>
                    <br><br>
                    <button class="emerald40-button" onclick="saveEmeraldOSCalendarEntry()">Save Entry</button>
                    <button class="emerald40-button" onclick="loadEmeraldOSCalendarEntry()">Load Entry</button>
                </div>
            </div>
            `,
            "calendar"
        );

        setTimeout(() => window.loadEmeraldOSCalendarEntry(), 50);
    }

    function openCalculator() {
        const buttons = ["7","8","9","/","4","5","6","*","1","2","3","-","0",".","=","+"];

        openContentWindow(
            "Calculator",
            `
            <div class="emerald40-panel">
                <div class="emerald40-box">
                    <input id="emerald40-calc-display" readonly style="width:100%;box-sizing:border-box;margin-bottom:8px;padding:6px;">
                    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;">
                        ${buttons.map(btn => `<button class="emerald40-button" onclick="emerald40CalcPress('${btn}')">${btn}</button>`).join("")}
                    </div>
                    <br>
                    <button class="emerald40-button" onclick="emerald40ClearCalc()">Clear</button>
                </div>
            </div>
            `,
            "calculator"
        );
    }

    function openClockApp() {
        openContentWindow(
            "Clock",
            `
            <div class="emerald40-panel">
                <div class="emerald40-box">
                    <h2 id="emerald40-live-clock" style="margin-top:0;"></h2>
                </div>
                <div class="emerald40-box">
                    <h3 style="margin-top:0;">Stopwatch</h3>
                    <div id="emerald40-stopwatch-display" class="emerald40-inset">0:00</div>
                    <br>
                    <button class="emerald40-button" onclick="emerald40StartStopwatch()">Start</button>
                    <button class="emerald40-button" onclick="emerald40PauseStopwatch()">Pause</button>
                    <button class="emerald40-button" onclick="emerald40ResetStopwatch()">Reset</button>
                </div>
            </div>
            `,
            "clock"
        );

        window.updateEmeraldOSClockApp();
    }

    function openBrowser() {
        openContentWindow(
            "Browser",
            `
            <div style="display:flex;height:100%;flex-direction:column;background:#c0c0c0;">
                <div style="padding:6px;display:flex;gap:5px;">
                    <input id="emerald40-browser-url" style="flex:1;" placeholder="https://">
                    <button class="emerald40-button" onclick="emerald40BrowserGo()">Go</button>
                </div>
                <iframe id="emerald40-browser-frame" style="flex:1;border:0;background:white;"></iframe>
            </div>
            `,
            "browser"
        );
    }

    function saveEmeraldOSCalendarEntry() {
        const date = document.getElementById("emerald40-calendar-date")?.value;
        const text = document.getElementById("emerald40-calendar-text")?.value || "";
        if (!date) return;

        const entries = JSON.parse(localStorage.getItem("40_calendar") || "{}");
        entries[date] = text;
        localStorage.setItem("40_calendar", JSON.stringify(entries));

        if (typeof window.notify === "function") {
            window.notify("Calendar", "Entry saved.", 3000, "success");
        }
    }

    function loadEmeraldOSCalendarEntry() {
        const date = document.getElementById("emerald40-calendar-date")?.value;
        const textArea = document.getElementById("emerald40-calendar-text");
        if (!date || !textArea) return;

        const entries = JSON.parse(localStorage.getItem("40_calendar") || "{}");
        textArea.value = entries[date] || "";
    }

    function emerald40CalcPress(value) {
        if (value === "=") {
            try {
                emerald40CalcInput = Function("return " + emerald40CalcInput)().toString();
            } catch {
                emerald40CalcInput = "Error";
            }
        } else {
            if (emerald40CalcInput === "Error") emerald40CalcInput = "";
            emerald40CalcInput += value;
        }

        const display = document.getElementById("emerald40-calc-display");
        if (display) display.value = emerald40CalcInput;
    }

    function emerald40ClearCalc() {
        emerald40CalcInput = "";
        const display = document.getElementById("emerald40-calc-display");
        if (display) display.value = "";
    }

    function updateEmeraldOSClockApp() {
        const clock = document.getElementById("emerald40-live-clock");
        if (clock) {
            clock.textContent = new Date().toLocaleTimeString();
            requestAnimationFrame(updateEmeraldOSClockApp);
        }
    }

    function emerald40StartStopwatch() {
        if (emerald40StopwatchInterval) return;

        emerald40StopwatchInterval = setInterval(() => {
            emerald40StopwatchSeconds++;
            const m = Math.floor(emerald40StopwatchSeconds / 60);
            const sec = emerald40StopwatchSeconds % 60;
            const display = document.getElementById("emerald40-stopwatch-display");
            if (display) display.textContent = `${m}:${sec.toString().padStart(2,"0")}`;
        }, 1000);
    }

    function emerald40PauseStopwatch() {
        clearInterval(emerald40StopwatchInterval);
        emerald40StopwatchInterval = null;
    }

    function emerald40ResetStopwatch() {
        emerald40PauseStopwatch();
        emerald40StopwatchSeconds = 0;
        const display = document.getElementById("emerald40-stopwatch-display");
        if (display) display.textContent = "0:00";
    }

    function emerald40BrowserGo() {
        const input = document.getElementById("emerald40-browser-url");
        const frame = document.getElementById("emerald40-browser-frame");
        if (!input || !frame) return;

        let url = input.value.trim();
        if (!url) return;
        if (!/^https?:\/\//i.test(url)) url = "https://" + url;
        frame.src = url;
    }

    function installEmeraldOSStartItems() {
        /*
           Edition switching is intentionally not added to the Start menu.
           The selected edition comes from EmeraldBIOS so locked features stay hidden.
           About/Plans are already provided through the OS app registry.
        */
    }

    function escapeHTML(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function initEmeraldOS32T1() {
        ensureEmeraldOSBootConfig();
        injectEmeraldOSStyles();
        ensureEmeraldOSBadges();
        renderEmeraldOSBuildBadge();
        renderEmeraldOSEditionBadge();
        installEmeraldOSStartItems();

        document.title = EMERALDOS_BUILD.displayName;

        if (typeof window.refreshEditionVisibility === "function") {
            window.refreshEditionVisibility();
        }

        console.log(EMERALDOS_BUILD.displayName + " initialized as " + getEmeraldOSEditionData().name + ".");
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", initEmeraldOS32T1);
    } else {
        initEmeraldOS32T1();
    }

    window.EMERALDOS_BUILD = EMERALDOS_BUILD;
    window.EMERALDOS_EDITIONS = EMERALDOS_EDITIONS;

    window.getEmeraldOSEdition = getEmeraldOSEdition;
    window.getEmeraldOSEditionData = getEmeraldOSEditionData;
    window.getEmeraldOSEditionLevel = getEmeraldOSEditionLevel;
    window.canUseEmeraldOSEdition = canUseEmeraldOSEdition;
    window.setEmeraldOSEdition = setEmeraldOSEdition;

    window.setEdition = setEmeraldOSEdition;
    window.hasExecutiveAdminAccess = hasExecutiveAdminAccess;
    window.hasDeveloperStaffAccess = hasDeveloperStaffAccess;

    window.renderEmeraldOSBuildBadge = renderEmeraldOSBuildBadge;
    window.renderEmeraldOSEditionBadge = renderEmeraldOSEditionBadge;

    window.openSystemApp = openSystemApp;
    window.openCalendar = openCalendar;
    window.openCalculator = openCalculator;
    window.openClockApp = openClockApp;
    window.openBrowser = openBrowser;

    window.saveEmeraldOSCalendarEntry = saveEmeraldOSCalendarEntry;
    window.loadEmeraldOSCalendarEntry = loadEmeraldOSCalendarEntry;
    window.emerald40CalcPress = emerald40CalcPress;
    window.emerald40ClearCalc = emerald40ClearCalc;
    window.updateEmeraldOSClockApp = updateEmeraldOSClockApp;
    window.emerald40StartStopwatch = emerald40StartStopwatch;
    window.emerald40PauseStopwatch = emerald40PauseStopwatch;
    window.emerald40ResetStopwatch = emerald40ResetStopwatch;
    window.emerald40BrowserGo = emerald40BrowserGo;

    window.openAboutEmeraldOS = openAboutEmeraldOS;
    window.openEmeraldOSEditionManager = openEmeraldOSEditionManager;
    window.openEmeraldOSPlans = openEmeraldOSPlans;
    window.openBusinessWorkspace = openBusinessWorkspace;
    window.openDeveloperTools = openDeveloperTools;
    window.openExecutiveDashboard = openExecutiveDashboard;

})();


/* =========================================================
   EMERALDOS 4.4 STAFF DEVELOPER & MESSAGE UPDATE
   Settings, desktop fixes, inclusive context menu, shortcuts
========================================================= */
(function () {
    "use strict";

    if (window.EmeraldOS44Loaded) return;
    window.EmeraldOS44Loaded = true;

    const BUILD_43 = {
        product: "EmeraldOS",
        displayName: "EmeraldOS 4.5",
        version: "4.5",
        channel: "Stable",
        codename: "Office 360 & Desktop Consistency Update"
    };

    const SETTINGS_KEY = "40_system_settings";
    const INPUT_KEY = "40_input_settings";
    const SHORTCUT_KEY = "40_keyboard_shortcuts";
    const DESKTOP_GRID_KEY = "40_desktop_grid_enabled";
    const DESKTOP_ICON_SIZE_KEY = "40_desktop_icon_size";

    function esc43(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function getJSON43(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key) || ""); }
        catch { return fallback; }
    }

    function setJSON43(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function app43(title, body, appId = "emerald43") {
        if (typeof window.openWindow === "function") {
            window.openWindow(title, `<div class="emerald43-panel">${body}</div>`, appId);
        }
    }

    function btn43(label, action, extra = "") {
        return `<button class="emerald43-button ${extra}" onclick="${action}">${esc43(label)}</button>`;
    }

    function getSettings43() {
        return Object.assign({
            theme: localStorage.getItem("40_theme") || "classic",
            wallpaper: localStorage.getItem("40_wallpaper") || "classic-teal",
            iconSize: Number(localStorage.getItem(DESKTOP_ICON_SIZE_KEY) || 72),
            gridEnabled: localStorage.getItem(DESKTOP_GRID_KEY) !== "false",
            showSeconds: localStorage.getItem("40_clock_seconds") === "true",
            reduceAnimations: localStorage.getItem("40_reduce_animations") === "true",
            confirmClose: localStorage.getItem("40_confirm_close") === "true",
            taskbarCompact: localStorage.getItem("40_taskbar_compact") === "true"
        }, getJSON43(SETTINGS_KEY, {}));
    }

    function saveSettings43(settings) {
        setJSON43(SETTINGS_KEY, settings);
        localStorage.setItem(DESKTOP_ICON_SIZE_KEY, String(settings.iconSize || 72));
        localStorage.setItem(DESKTOP_GRID_KEY, settings.gridEnabled ? "true" : "false");
        localStorage.setItem("40_clock_seconds", settings.showSeconds ? "true" : "false");
        localStorage.setItem("40_reduce_animations", settings.reduceAnimations ? "true" : "false");
        localStorage.setItem("40_confirm_close", settings.confirmClose ? "true" : "false");
        localStorage.setItem("40_taskbar_compact", settings.taskbarCompact ? "true" : "false");
        applySettings43();
    }

    function getInput43() {
        return Object.assign({
            pointerSpeed: 5,
            doubleClickSpeed: 500,
            keyboardRepeat: 5,
            keyboardDelay: 400,
            swapMouseButtons: false,
            keyboardShortcuts: true,
            controllerPolling: true
        }, getJSON43(INPUT_KEY, {}));
    }

    function saveInput43(input) {
        setJSON43(INPUT_KEY, input);
        applyInput43();
    }

    function applySettings43() {
        const settings = getSettings43();
        document.body.classList.toggle("emerald43-no-animations", !!settings.reduceAnimations);
        document.body.classList.toggle("emerald43-taskbar-compact", !!settings.taskbarCompact);
        document.documentElement.style.setProperty("--emerald43-icon-size", `${settings.iconSize || 72}px`);
        document.body.dataset.gridSnap = settings.gridEnabled ? "true" : "false";
        try { if (typeof window.setTheme === "function") window.setTheme(settings.theme || "classic"); } catch {}
    }

    function applyInput43() {
        const input = getInput43();
        document.documentElement.style.setProperty("--emerald43-pointer-speed", input.pointerSpeed || 5);
        document.body.dataset.swapMouseButtons = input.swapMouseButtons ? "true" : "false";
    }

    function canUse43(requiredEdition = "home") {
        return typeof window.canSeeEdition === "function" ? window.canSeeEdition(requiredEdition) : true;
    }

    function registerApp43(id, app) {
        if (!window.APPS) return;
        window.APPS[id] = Object.assign({ edition: "virtue", category: "essential", hiddenStandalone: false }, window.APPS[id] || {}, app);
    }

    function installApps43() {
        if (!window.APPS || window.__emerald43AppsInstalled) return;
        window.__emerald43AppsInstalled = true;

        registerApp43("systemControl43", { name: "System Control Center", icon: "CTRL", edition: "virtue", category: "essential", launch: () => window.openSystemControlCenter43() });
        registerApp43("displaySettings43", { name: "Display Settings", icon: "DISP", edition: "virtue", category: "essential", launch: () => window.openDisplaySettings43() });
        registerApp43("keyboardMouse43", { name: "Keyboard & Mouse", icon: "KEY", edition: "virtue", category: "essential", launch: () => window.openKeyboardMouseSettings43() });
        registerApp43("controllerCenter43", { name: "Controller Center", icon: "PAD", edition: "virtue", category: "essential", launch: () => window.openControllerCenter43() });
        registerApp43("shortcutManager43", { name: "Shortcut Manager", icon: "KEYS", edition: "virtue", category: "essential", launch: () => window.openShortcutManager43() });
        registerApp43("desktopRepair43", { name: "Desktop Repair", icon: "FIX", edition: "virtue", category: "essential", launch: () => window.openDesktopRepair43() });
        registerApp43("accessibility43", { name: "Accessibility", icon: "A11Y", edition: "home", category: "essential", launch: () => window.openAccessibility43() });
        registerApp43("soundSettings43", { name: "Sound Settings", icon: "SND", edition: "home", category: "essential", launch: () => window.openSoundSettings43() });
        registerApp43("powerOptions43", { name: "Power Options", icon: "PWR", edition: "home", category: "essential", launch: () => window.openPowerOptions43() });

        registerApp43("appPermissions43", { name: "App Permissions", icon: "PERM", edition: "business", category: "business", launch: () => window.openAppPermissions43() });
        registerApp43("updateCenter43", { name: "Update Center", icon: "UPD", edition: "business", category: "business", launch: () => window.openUpdateCenter43() });
        registerApp43("deviceHub43", { name: "Device Hub", icon: "DEV", edition: "virtue", category: "creative", launch: () => window.openDeviceHub43() });
        registerApp43("inputDiagnostics43", { name: "Input Diagnostics", icon: "DIAG", edition: "developer", category: "developer", launch: () => window.openInputDiagnostics43() });
        registerApp43("shortcutConsole43", { name: "Shortcut Console", icon: "SC", edition: "developer", category: "developer", launch: () => window.openShortcutConsole43() });
        registerApp43("registryTweaks43", { name: "Registry Tweaks", icon: "REG+", edition: "developer", category: "developer", launch: () => window.openRegistryTweaks43() });
        registerApp43("adminPolicy43", { name: "Admin Policy Center", icon: "ADM", edition: "executive", category: "executive", launch: () => window.openAdminPolicyCenter43() });
        registerApp43("fleetSettings43", { name: "Fleet Settings", icon: "FLT", edition: "executive", category: "executive", launch: () => window.openFleetSettings43() });

        window.refreshEditionVisibility?.();
    }

    /* =====================================================
       SETTINGS APPLICATIONS
    ===================================================== */

    window.openSystemControlCenter43 = function () {
        const s = getSettings43();
        app43("System Control Center", `
            <h3>System Control Center</h3>
            <div class="emerald43-grid">
                ${btn43("Display Settings", "openDisplaySettings43()")}
                ${btn43("Keyboard & Mouse", "openKeyboardMouseSettings43()")}
                ${btn43("Controller Center", "openControllerCenter43()")}
                ${btn43("Shortcut Manager", "openShortcutManager43()")}
                ${btn43("Desktop Repair", "openDesktopRepair43()")}
                ${btn43("Sound Settings", "openSoundSettings43()")}
                ${btn43("Power Options", "openPowerOptions43()")}
                ${btn43("Accessibility", "openAccessibility43()")}
                ${btn43("Update Center", "openUpdateCenter43()")}
                ${btn43("App Permissions", "openAppPermissions43()")}
            </div>
            <hr>
            <div class="emerald43-inset">
                <b>Build:</b> EmeraldOS 4.5<br>
                <b>Edition:</b> ${esc43(localStorage.getItem("40_edition_name") || localStorage.getItem("40_edition") || "Virtue")}<br>
                <b>Theme:</b> ${esc43(s.theme)}<br>
                <b>Desktop grid:</b> ${s.gridEnabled ? "Enabled" : "Disabled"}
            </div>
        `, "systemControl43");
    };

    window.openDisplaySettings43 = function () {
        const s = getSettings43();
        app43("Display Settings", `
            <h3>Display Settings</h3>
            <label>Theme</label>
            <select id="displayTheme43" class="emerald43-input">
                ${["classic","dark","light","midnight"].map(t => `<option value="${t}" ${s.theme===t?"selected":""}>${t}</option>`).join("")}
            </select>
            <label>Icon size</label>
            <input id="iconSize43" type="range" min="56" max="110" value="${Number(s.iconSize)||72}">
            <label><input id="grid43" type="checkbox" ${s.gridEnabled?"checked":""}> Snap desktop icons to grid</label>
            <label><input id="seconds43" type="checkbox" ${s.showSeconds?"checked":""}> Show seconds on taskbar clock</label>
            <label><input id="animations43" type="checkbox" ${s.reduceAnimations?"checked":""}> Reduce animations</label>
            <label><input id="taskbarCompact43" type="checkbox" ${s.taskbarCompact?"checked":""}> Compact taskbar</label>
            <br>
            ${btn43("Apply Display Settings", "saveDisplaySettings43()")}
            ${btn43("Reset Desktop Layout", "resetDesktopLayout43()")}
        `, "displaySettings43");
    };

    window.saveDisplaySettings43 = function () {
        const s = getSettings43();
        s.theme = document.getElementById("displayTheme43")?.value || s.theme;
        s.iconSize = Number(document.getElementById("iconSize43")?.value || s.iconSize || 72);
        s.gridEnabled = !!document.getElementById("grid43")?.checked;
        s.showSeconds = !!document.getElementById("seconds43")?.checked;
        s.reduceAnimations = !!document.getElementById("animations43")?.checked;
        s.taskbarCompact = !!document.getElementById("taskbarCompact43")?.checked;
        saveSettings43(s);
        window.renderDesktop?.();
        window.notify?.("Display", "Display settings saved.", 2500, "success");
    };

    window.openKeyboardMouseSettings43 = function () {
        const input = getInput43();
        app43("Keyboard & Mouse Settings", `
            <h3>Keyboard & Mouse Settings</h3>
            <label>Pointer speed</label>
            <input id="pointerSpeed43" type="range" min="1" max="10" value="${Number(input.pointerSpeed)||5}">
            <label>Double-click speed</label>
            <input id="doubleClick43" type="range" min="200" max="900" value="${Number(input.doubleClickSpeed)||500}">
            <label>Keyboard repeat speed</label>
            <input id="repeat43" type="range" min="1" max="10" value="${Number(input.keyboardRepeat)||5}">
            <label>Keyboard delay</label>
            <input id="delay43" type="range" min="150" max="1000" value="${Number(input.keyboardDelay)||400}">
            <label><input id="shortcuts43" type="checkbox" ${input.keyboardShortcuts?"checked":""}> Enable EmeraldOS keyboard shortcuts</label>
            <label><input id="swapMouse43" type="checkbox" ${input.swapMouseButtons?"checked":""}> Swap mouse buttons visually</label>
            <br>
            ${btn43("Save Input Settings", "saveKeyboardMouseSettings43()")}
            ${btn43("Test Double-Click", "notify('Mouse Test','Double-click test opened.',2500,'info')")}
        `, "keyboardMouse43");
    };

    window.saveKeyboardMouseSettings43 = function () {
        const input = getInput43();
        input.pointerSpeed = Number(document.getElementById("pointerSpeed43")?.value || input.pointerSpeed);
        input.doubleClickSpeed = Number(document.getElementById("doubleClick43")?.value || input.doubleClickSpeed);
        input.keyboardRepeat = Number(document.getElementById("repeat43")?.value || input.keyboardRepeat);
        input.keyboardDelay = Number(document.getElementById("delay43")?.value || input.keyboardDelay);
        input.keyboardShortcuts = !!document.getElementById("shortcuts43")?.checked;
        input.swapMouseButtons = !!document.getElementById("swapMouse43")?.checked;
        saveInput43(input);
        window.notify?.("Input", "Keyboard and mouse settings saved.", 2500, "success");
    };

    window.openControllerCenter43 = function () {
        app43("Controller Center", `
            <h3>Controller Center</h3>
            <p>EmeraldOS 4.5 uses the browser Gamepad API where supported.</p>
            <div class="emerald43-grid">
                ${btn43("Scan Controllers", "scanControllers43()")}
                ${btn43("Start Monitor", "startControllerMonitor43()")}
                ${btn43("Stop Monitor", "stopControllerMonitor43()")}
            </div>
            <div id="controllerOut43" class="emerald43-inset">No controller scan yet.</div>
        `, "controllerCenter43");
    };

    let controllerTimer43 = null;
    window.scanControllers43 = function () {
        const out = document.getElementById("controllerOut43");
        const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
        if (!out) return;
        if (!navigator.getGamepads) {
            out.innerHTML = "Gamepad API is not supported in this browser.";
            return;
        }
        if (!pads.length) {
            out.innerHTML = "No controllers detected. Connect a controller and press a button.";
            return;
        }
        out.innerHTML = pads.map(pad => `
            <b>${esc43(pad.id)}</b><br>
            Index: ${pad.index}<br>
            Buttons: ${pad.buttons.length}<br>
            Axes: ${pad.axes.length}<br>
            Connected: ${pad.connected ? "Yes" : "No"}<br><br>
        `).join("");
    };
    window.startControllerMonitor43 = function () {
        clearInterval(controllerTimer43);
        controllerTimer43 = setInterval(window.scanControllers43, 250);
        window.scanControllers43();
    };
    window.stopControllerMonitor43 = function () {
        clearInterval(controllerTimer43);
        controllerTimer43 = null;
        window.notify?.("Controller", "Controller monitor stopped.", 2200, "info");
    };

    window.openShortcutManager43 = function () {
        app43("Keyboard Shortcuts", `
            <h3>Keyboard Shortcuts</h3>
            <table class="emerald43-table">
                <tr><th>Shortcut</th><th>Action</th></tr>
                <tr><td>Ctrl + Alt + S</td><td>System Control Center</td></tr>
                <tr><td>Ctrl + Alt + D</td><td>Display Settings</td></tr>
                <tr><td>Ctrl + Alt + K</td><td>Keyboard & Mouse</td></tr>
                <tr><td>Ctrl + Alt + C</td><td>Controller Center</td></tr>
                <tr><td>Ctrl + Alt + F</td><td>Files</td></tr>
                <tr><td>Ctrl + Alt + T</td><td>Terminal</td></tr>
                <tr><td>Ctrl + Alt + P</td><td>Pin Manager</td></tr>
                <tr><td>Ctrl + Alt + R</td><td>Refresh desktop</td></tr>
                <tr><td>Ctrl + Space</td><td>Quick Launcher</td></tr>
                <tr><td>Ctrl + Shift + Esc</td><td>Process Manager</td></tr>
                <tr><td>Alt + F4</td><td>Close focused window</td></tr>
                <tr><td>Esc</td><td>Close menus</td></tr>
            </table>
        `, "shortcutManager43");
    };

    window.openDesktopRepair43 = function () {
        app43("Desktop Repair", `
            <h3>Desktop Repair</h3>
            <p>Use these tools if icons overlap, right-click menus stick, or pinned items do not appear correctly.</p>
            <div class="emerald43-grid">
                ${btn43("Refresh Desktop", "renderDesktop();notify('Desktop','Refreshed.',2000,'success')")}
                ${btn43("Snap Icons To Grid", "snapDesktopIcons43()")}
                ${btn43("Reset Icon Layout", "resetDesktopLayout43()")}
                ${btn43("Reload App Folders", "repairDesktopFolders43()")}
                ${btn43("Clear Open Session", "localStorage.removeItem('40_session');notify('Session','Saved session cleared.',2500,'info')")}
                ${btn43("Sync Desktop Now", "saveDesktopLayout43?.();notify('Desktop','Layout sync requested.',2500,'info')")}
            </div>
        `, "desktopRepair43");
    };

    window.openAccessibility43 = () => app43("Accessibility", `<h3>Accessibility</h3><label><input type="checkbox" onchange="document.body.classList.toggle('emerald43-high-contrast',this.checked)"> High contrast mode</label><label><input type="checkbox" onchange="document.body.classList.toggle('emerald43-large-text',this.checked)"> Larger UI text</label><label><input type="checkbox" onchange="document.body.classList.toggle('emerald43-no-animations',this.checked)"> Reduce motion</label>`, "accessibility43");
    window.openSoundSettings43 = () => app43("Sound Settings", `<h3>Sound Settings</h3><label>System volume</label><input type="range" min="0" max="100" value="75"><label><input type="checkbox" checked> Notification sounds</label><label><input type="checkbox"> Startup chime</label>`, "soundSettings43");
    window.openPowerOptions43 = () => app43("Power Options", `<h3>Power Options</h3><p>Browser-based power controls are simulated.</p>${btn43("Restart", "restartOS()")}${btn43("Logout", "logoutUser()")}${btn43("Performance Mode", "document.body.classList.toggle('emerald43-performance');notify('Power','Performance mode toggled.',2500,'info')")}`, "powerOptions43");
    window.openAppPermissions43 = () => app43("App Permissions", `<h3>App Permissions</h3><div class="emerald43-inset">Camera, microphone, storage, notifications, and controller permissions are controlled by your browser. EmeraldOS can only request access after a user action.</div><br>${btn43("Open Controller Center", "openControllerCenter43()")}${btn43("Open Audio Notes", "openAudioNotes?.()")}`, "appPermissions43");
    window.openUpdateCenter43 = () => app43("Update Center", `<h3>Update Center</h3><div class="emerald43-inset"><b>Current:</b> EmeraldOS 4.5<br><b>Channel:</b> Stable<br><b>Status:</b> Application and input update installed.</div>`, "updateCenter43");
    window.openDeviceHub43 = () => app43("Device Hub", `<h3>Device Hub</h3>${btn43("Controller Center", "openControllerCenter43()")}${btn43("Keyboard & Mouse", "openKeyboardMouseSettings43()")}${btn43("Input Diagnostics", "openInputDiagnostics43()")}`, "deviceHub43");
    window.openInputDiagnostics43 = () => app43("Input Diagnostics", `<h3>Input Diagnostics</h3><p>Press keys or move the mouse over this window.</p><div id="inputDiag43" class="emerald43-inset" tabindex="0">Waiting for input...</div>`, "inputDiagnostics43");
    window.openShortcutConsole43 = () => app43("Shortcut Console", `<h3>Shortcut Console</h3><p>Shortcut logging utility for Developer edition.</p><textarea class="emerald43-textarea" id="shortcutLog43" readonly></textarea>`, "shortcutConsole43");
    window.openRegistryTweaks43 = () => app43("Registry Tweaks", `<h3>Registry Tweaks</h3><p>Common HKEY adjustments for EmeraldOS 4.5.</p>${btn43("Set Desktop Grid On", "EmeraldOSRegistry?.set?.('HKEY_CURRENT_USER\\Software\\EmeraldOS\\Desktop\\GridSnap','true');notify('Registry','GridSnap set.',2000,'success')")}${btn43("Set Compact Taskbar", "EmeraldOSRegistry?.set?.('HKEY_CURRENT_USER\\Software\\EmeraldOS\\Taskbar\\Compact','true');notify('Registry','Compact taskbar set.',2000,'success')")}`, "registryTweaks43");
    window.openAdminPolicyCenter43 = () => app43("Admin Policy Center", `<h3>Admin Policy Center</h3><p>Executive-only policy controls.</p><div class="emerald43-inset">Executive verification required from BIOS.</div>`, "adminPolicy43");
    window.openFleetSettings43 = () => app43("Fleet Settings", `<h3>Fleet Settings</h3><p>Enterprise settings placeholder for multi-device EmeraldOS deployments.</p>`, "fleetSettings43");

    /* =====================================================
       DESKTOP HELPERS
    ===================================================== */

    function menuElement43() {
        let menu = document.getElementById("context-menu");
        if (!menu) {
            menu = document.createElement("div");
            menu.id = "context-menu";
            document.body.appendChild(menu);
        }
        menu.className = "context-menu emerald43-context-menu";
        return menu;
    }

    function hideMenu43() {
        const menu = document.getElementById("context-menu");
        if (menu) {
            menu.classList.remove("show");
            menu.style.display = "none";
        }
    }

    function menuItem43(label, fnName, disabled = false) {
        return `<div class="context-item ${disabled ? "disabled" : ""}" data-action="${esc43(fnName)}">${esc43(label)}</div>`;
    }

    function showMenu43(x, y, items) {
        const menu = menuElement43();
        menu.innerHTML = items.join("");
        menu.style.display = "block";
        menu.classList.add("show");

        requestAnimationFrame(() => {
            const pad = 8;
            const rect = menu.getBoundingClientRect();
            const left = Math.min(Math.max(pad, x), window.innerWidth - rect.width - pad);
            const top = Math.min(Math.max(pad, y), window.innerHeight - rect.height - 44);
            menu.style.left = left + "px";
            menu.style.top = top + "px";
        });
    }

    function installMenuActions43() {
        if (window.__emerald43MenuActions) return;
        window.__emerald43MenuActions = true;
        document.addEventListener("click", e => {
            const item = e.target.closest("#context-menu .context-item");
            if (item && !item.classList.contains("disabled")) {
                const fn = item.dataset.action;
                hideMenu43();
                if (fn && typeof window[fn] === "function") window[fn]();
            } else if (!e.target.closest("#context-menu")) {
                hideMenu43();
            }
        }, true);
    }

    let contextApp43 = null;
    window.ctxOpenApp43 = () => contextApp43 && window.launchApp?.(contextApp43);
    window.ctxPinDesktop43 = () => contextApp43 && window.pinAppToDesktop?.(contextApp43);
    window.ctxPinStart43 = () => contextApp43 && window.pinAppToStart?.(contextApp43);
    window.ctxPinTaskbar43 = () => contextApp43 && window.pinAppToTaskbar?.(contextApp43);
    window.ctxUnpinDesktop43 = () => contextApp43 && window.unpinAppFromDesktop?.(contextApp43);
    window.ctxAppInfo43 = () => {
        const app = window.APPS?.[contextApp43];
        if (!app) return;
        app43("Application Properties", `<h3>${esc43(app.name)}</h3><div class="emerald43-inset"><b>ID:</b> ${esc43(contextApp43)}<br><b>Edition:</b> ${esc43(app.edition || "home")}<br><b>Category:</b> ${esc43(app.category || "essential")}</div>`, "appInfo43");
    };

    window.newFileFromContext43 = () => (window.createFileOnDesktop ? window.createFileOnDesktop() : window.createNewFile?.());
    window.newFolderFromContext43 = () => (window.createFolderOnDesktop ? window.createFolderOnDesktop() : window.createFolder?.());
    window.uploadFromContext43 = () => (window.uploadFileToDesktop ? window.uploadFileToDesktop() : window.uploadFile?.());
    window.refreshFromContext43 = () => { window.renderDesktop?.(); window.notify?.("Desktop", "Desktop refreshed.", 2000, "success"); };
    window.resetDesktopLayout43 = async function () {
        ["40_desktop_positions", "40_desktop_pin_positions", "40_desktop_folder_positions"].forEach(k => localStorage.removeItem(k));
        try { await window.saveUserSettings?.({ desktopPositions: {}, desktopPinPositions: {}, desktopFolderPositions: {} }); } catch {}
        window.renderDesktop?.();
        window.notify?.("Desktop", "Desktop layout reset.", 2500, "info");
    };
    window.repairDesktopFolders43 = () => { window.renderDesktop?.(); window.renderStartMenu?.(); window.notify?.("Desktop", "Desktop folders repaired.", 2400, "success"); };

    window.snapDesktopIcons43 = function () {
        const icons = [...document.querySelectorAll("#desktop .desktop-item, #desktop .icon")];
        icons.forEach((el, index) => {
            const col = Math.floor(index / 8);
            const row = index % 8;
            el.style.position = "absolute";
            el.style.left = (20 + col * 104) + "px";
            el.style.top = (20 + row * 86) + "px";
        });
        window.saveDesktopLayout43?.();
        window.notify?.("Desktop", "Icons snapped to grid.", 2300, "success");
    };

    function contextItemsForDesktop43() {
        return [
            menuItem43("Open Essential Apps", "ctxOpenEssential43"),
            menuItem43("Open Office Apps", "ctxOpenOffice43"),
            menuItem43("Open Developer Apps", "ctxOpenDeveloper43", !canUse43("developer")),
            "<div class='context-separator'></div>",
            menuItem43("New File", "newFileFromContext43"),
            menuItem43("New Folder", "newFolderFromContext43"),
            menuItem43("Upload To Desktop", "uploadFromContext43"),
            "<div class='context-separator'></div>",
            menuItem43("Refresh", "refreshFromContext43"),
            menuItem43("Snap Icons To Grid", "snapDesktopIcons43"),
            menuItem43("Reset Icon Layout", "resetDesktopLayout43"),
            menuItem43("Repair Desktop Folders", "repairDesktopFolders43"),
            "<div class='context-separator'></div>",
            menuItem43("Display Settings", "openDisplaySettings43"),
            menuItem43("Keyboard & Mouse", "openKeyboardMouseSettings43"),
            menuItem43("Controller Center", "openControllerCenter43"),
            menuItem43("System Control Center", "openSystemControlCenter43"),
            menuItem43("Pin Manager", "openPinManager42"),
            menuItem43("Shortcut Manager", "openShortcutManager43")
        ];
    }

    window.ctxOpenEssential43 = () => (typeof window.openAppFolderT5 === "function" ? window.openAppFolderT5("essential") : window.openFileExplorer?.());
    window.ctxOpenOffice43 = () => (typeof window.openAppFolderT5 === "function" ? window.openAppFolderT5("office") : window.openDocs?.());
    window.ctxOpenDeveloper43 = () => (typeof window.openAppFolderT5 === "function" ? window.openAppFolderT5("developer") : window.launchApp?.("developerSuite"));

    function contextItemsForApp43(appId) {
        const app = window.APPS?.[appId];
        contextApp43 = appId;
        return [
            menuItem43("Open " + (app?.name || appId), "ctxOpenApp43"),
            "<div class='context-separator'></div>",
            menuItem43("Pin to Start", "ctxPinStart43"),
            menuItem43("Pin to Desktop", "ctxPinDesktop43"),
            menuItem43("Pin to Taskbar", "ctxPinTaskbar43"),
            menuItem43("Remove from Desktop", "ctxUnpinDesktop43"),
            "<div class='context-separator'></div>",
            menuItem43("Application Properties", "ctxAppInfo43"),
            menuItem43("Open Pin Manager", "openPinManager42")
        ];
    }

    function installContextMenu43() {
        const desktop = document.getElementById("desktop");
        if (!desktop || desktop.__emerald43ContextInstalled) return;
        desktop.__emerald43ContextInstalled = true;
        installMenuActions43();

        desktop.addEventListener("contextmenu", e => {
            if (e.target.closest("input, textarea, select, button")) return;
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            const appEl = e.target.closest("[data-app-id], [data-app]");
            const appId = appEl?.dataset?.appId || appEl?.dataset?.app;
            const items = appId && window.APPS?.[appId]
                ? contextItemsForApp43(appId)
                : contextItemsForDesktop43();
            showMenu43(e.clientX, e.clientY, items);
        }, true);

        document.addEventListener("keydown", e => {
            if (e.key === "Escape") hideMenu43();
        }, true);
    }

    /* =====================================================
       KEYBOARD SHORTCUTS
    ===================================================== */

    function closeFocusedWindow43() {
        const wins = [...document.querySelectorAll(".window")];
        if (!wins.length) return;
        const top = wins.sort((a,b)=>(parseInt(b.style.zIndex)||0)-(parseInt(a.style.zIndex)||0))[0];
        top?.querySelector(".close-btn")?.click();
    }

    function installShortcuts43() {
        if (window.__emerald43Shortcuts) return;
        window.__emerald43Shortcuts = true;
        document.addEventListener("keydown", e => {
            const input = getInput43();
            if (!input.keyboardShortcuts) return;
            const typing = e.target.closest?.("input, textarea, select, [contenteditable='true']");
            if (typing && !(e.ctrlKey && e.altKey)) return;

            const key = e.key.toLowerCase();
            if (e.ctrlKey && e.altKey) {
                const map = {
                    s: window.openSystemControlCenter43,
                    d: window.openDisplaySettings43,
                    k: window.openKeyboardMouseSettings43,
                    c: window.openControllerCenter43,
                    f: window.openFileExplorer,
                    t: () => window.launchApp?.("terminal") || window.openTerminal?.(),
                    p: () => window.openPinManager42?.(),
                    r: window.refreshFromContext43,
                    m: () => document.getElementById("start-menu")?.classList.toggle("show"),
                    h: window.openShortcutManager43
                };
                if (map[key]) { e.preventDefault(); map[key](); }
            }
            if (e.ctrlKey && e.shiftKey && key === "escape") { e.preventDefault(); window.launchApp?.("processManager42") || window.openSystemControlCenter43(); }
            if (e.ctrlKey && key === " ") { e.preventDefault(); window.openQuickLauncher42?.() || window.openSystemControlCenter43(); }
            if (e.altKey && key === "f4") { e.preventDefault(); closeFocusedWindow43(); }
        }, true);
    }

    function patchClock43() {
        if (window.__emerald43ClockPatch) return;
        window.__emerald43ClockPatch = true;
        setInterval(() => {
            const clock = document.getElementById("clock");
            if (!clock) return;
            const showSeconds = localStorage.getItem("40_clock_seconds") === "true";
            clock.textContent = new Date().toLocaleTimeString([], showSeconds ? {hour:"2-digit",minute:"2-digit",second:"2-digit"} : {hour:"2-digit",minute:"2-digit"});
        }, 500);
    }

    function installTerminalCommands43() {
        const original = window.runCommand;
        if (typeof original !== "function" || original.__emerald43Wrapped) return;
        const wrapped = async function (cmdLine = "") {
            const raw = String(cmdLine).trim();
            const parts = raw.match(/"([^"]*)"|'([^']*)'|(\S+)/g)?.map(x => x.replace(/^["']|["']$/g, "")) || [];
            const cmd = (parts.shift() || "").toLowerCase();
            let result = null;
            if (cmd === "settings") { window.openSystemControlCenter43(); result = "Opened System Control Center."; }
            else if (cmd === "display") { window.openDisplaySettings43(); result = "Opened Display Settings."; }
            else if (cmd === "input") { window.openKeyboardMouseSettings43(); result = "Opened Keyboard & Mouse Settings."; }
            else if (cmd === "controller" || cmd === "gamepad") { window.openControllerCenter43(); result = "Opened Controller Center."; }
            else if (cmd === "shortcuts") { window.openShortcutManager43(); result = "Opened Shortcut Manager."; }
            else if (cmd === "desktop.repair") { window.openDesktopRepair43(); result = "Opened Desktop Repair."; }
            else if (cmd === "desktop.snap") { window.snapDesktopIcons43(); result = "Snapped desktop icons."; }
            else if (cmd === "desktop.grid") { localStorage.setItem(DESKTOP_GRID_KEY, parts[0] === "off" ? "false" : "true"); result = "Desktop grid " + (parts[0] === "off" ? "disabled" : "enabled") + "."; }
            else if (cmd === "build") { result = "EmeraldOS 4.5 Office 360 & Desktop Consistency Update"; }
            if (result !== null) {
                const output = document.getElementById("terminal_output");
                if (output) {
                    output.innerHTML += `> ${esc43(raw)}<br>${result}<br><br>`;
                    output.scrollTop = output.scrollHeight;
                    const input = document.getElementById("terminal_input");
                    if (input) input.value = "";
                }
                return;
            }
            return original.call(this, cmdLine);
        };
        wrapped.__emerald43Wrapped = true;
        window.runCommand = wrapped;
    }

    function setRegistryDefaults43() {
        try {
            window.EmeraldOSRegistry?.set?.("HKEY_LOCAL_MACHINE\\System\\Build\\Version", "4.5");
            window.EmeraldOSRegistry?.set?.("HKEY_CURRENT_USER\\Software\\EmeraldOS\\Input\\Shortcuts", "Enabled");
            window.EmeraldOSRegistry?.set?.("HKEY_CURRENT_USER\\Software\\EmeraldOS\\Desktop\\ContextMenu", "InclusiveWin95");
            window.EmeraldOSRegistry?.set?.("HKEY_CURRENT_USER\\Software\\EmeraldOS\\Display\\IconSize", String(getSettings43().iconSize || 72));
            window.EmeraldOSRegistry?.set?.("HKEY_LOCAL_MACHINE\\Hardware\\Input\\GamepadAPI", navigator.getGamepads ? "Available" : "Unavailable");
        } catch {}
    }

    function init43() {
        localStorage.setItem("40_build_name", BUILD_43.displayName);
        localStorage.setItem("40_version", BUILD_43.version);
        localStorage.setItem("40_channel", BUILD_43.channel);
        localStorage.setItem("40_build_codename", BUILD_43.codename);
        document.title = BUILD_43.displayName;
        applySettings43();
        applyInput43();
        installApps43();
        installContextMenu43();
        installShortcuts43();
        patchClock43();
        installTerminalCommands43();
        setRegistryDefaults43();
        setTimeout(() => { window.renderDesktop?.(); window.renderStartMenu?.(); }, 300);
        window.notify?.("EmeraldOS 4.5", "System and input update loaded.", 3200, "success");
    }

    window.applySettings43 = applySettings43;
    window.applyInput43 = applyInput43;
    window.installContextMenu43 = installContextMenu43;
    window.installShortcuts43 = installShortcuts43;

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", () => setTimeout(init43, 650));
    } else {
        setTimeout(init43, 650);
    }
})();

/* =========================================================
   EMERALDOS 4.4 STAFF DEVELOPER & DESKTOP MESSAGE UPDATE
   Developer mode requires Emerald Games mod/admin verification
========================================================= */
(function () {
    "use strict";

    if (window.EmeraldOS44AdditionsLoaded) return;
    window.EmeraldOS44AdditionsLoaded = true;

    const WYATT_MESSAGE_44 = `Hello, I'm Wyatt Monroe, Director of Operations here at Emerald Systems and I want to say a few things about EmeraldOS 4.5.
1. Files is a user-specific free cloudstorage program, there is however a 1 Mb. file limit, files is a free, un-monitered service.
2. All EmeraldOS versions and editions are copyright of Emerald Systems, 2026
3. Use of EmeraldOS is a privilage, files, accounts, edition access and EmeraldOS access can be denied at any time.`;

    const PIN_DESKTOP_KEY_44 = "40_pinned_desktop_apps";

    function esc44(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function getJSON44(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key) || ""); }
        catch { return fallback; }
    }

    function setJSON44(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function hasDev44() {
        if (typeof window.hasDeveloperStaffAccess === "function") return window.hasDeveloperStaffAccess();
        if (localStorage.getItem("40_executive_verified") === "true") return true;
        const role = String(localStorage.getItem("40_developer_role") || localStorage.getItem("role") || "").toLowerCase();
        return localStorage.getItem("40_developer_verified") === "true" && (role === "admin" || role === "mod");
    }

    function app44(title, body, appId = "emerald44") {
        if (typeof window.openWindow === "function") {
            window.openWindow(title, `<div class="emerald44-panel">${body}</div>`, appId);
        }
    }

    function button44(label, action) {
        return `<button class="emerald44-button" onclick="${action}">${esc44(label)}</button>`;
    }

    function injectStyles44() {
        if (document.getElementById("emerald44-styles")) return;
        const style = document.createElement("style");
        style.id = "emerald44-styles";
        style.textContent = `
            .emerald44-panel{background:#c0c0c0;color:#000;font-family:"MS Sans Serif",Tahoma,Arial,sans-serif;font-size:12px;padding:10px;height:100%;box-sizing:border-box;overflow:auto}
            .emerald44-box{background:#d4d0c8;border:2px solid;border-color:#fff #808080 #808080 #fff;padding:10px;margin-bottom:10px}
            .emerald44-inset{background:#fff;border:2px solid;border-color:#808080 #fff #fff #808080;padding:8px;white-space:pre-wrap;line-height:1.45}
            .emerald44-button{background:#c0c0c0;border:2px solid;border-color:#fff #808080 #808080 #fff;font-family:inherit;font-size:12px;padding:5px 10px;margin:3px;cursor:pointer}
            .emerald44-button:active{border-color:#808080 #fff #fff #808080}
            .emerald44-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:6px}
            #emerald44-desktop-message{position:absolute;right:18px;top:18px;width:330px;max-height:260px;background:#c0c0c0;color:#000;border:2px solid;border-color:#fff #808080 #808080 #fff;z-index:1200;font-family:"MS Sans Serif",Tahoma,Arial,sans-serif;font-size:12px;box-shadow:2px 2px 0 #000}
            #emerald44-desktop-message .title{background:#000080;color:#fff;padding:3px 6px;font-weight:bold;display:flex;justify-content:space-between;align-items:center}
            #emerald44-desktop-message .body{padding:8px;white-space:pre-wrap;line-height:1.35;max-height:208px;overflow:auto;background:#ffffe1;border-top:1px solid #808080}
            #emerald44-desktop-message button{background:#c0c0c0;border:1px solid;border-color:#fff #404040 #404040 #fff;font-family:inherit;font-size:11px;cursor:pointer}
        `;
        document.head.appendChild(style);
    }

    window.openWyattMessage44 = function () {
        app44("Message from Wyatt Monroe", `
            <div class="emerald44-box">
                <h3 style="margin-top:0;">Message from Wyatt Monroe</h3>
                <div class="emerald44-inset">${esc44(WYATT_MESSAGE_44)}</div>
            </div>
        `, "wyattMessage44");
    };

    window.openFilesPolicy44 = function () {
        app44("Files Policy", `
            <h3>Files Policy</h3>
            <div class="emerald44-inset">${esc44(WYATT_MESSAGE_44)}</div>
        `, "filesPolicy44");
    };

    window.openAccountStatus44 = function () {
        app44("Account Status", `
            <h3>Account Status</h3>
            <div class="emerald44-inset"><b>User:</b> ${esc44(localStorage.getItem("40_username") || localStorage.getItem("username") || "Guest")}<br><b>Edition:</b> ${esc44(localStorage.getItem("40_edition_name") || "EmeraldOS Virtue")}<br><b>Developer verified:</b> ${hasDev44() ? "Yes" : "No"}<br><b>Executive verified:</b> ${localStorage.getItem("40_executive_verified") === "true" ? "Yes" : "No"}</div>
        `, "accountStatus44");
    };

    window.openCloudQuota44 = function () {
        app44("Cloud Storage Limits", `
            <h3>Cloud Storage Limits</h3>
            <div class="emerald44-inset">EmeraldOS Files is designed as a free user-specific cloud storage tool. EmeraldOS 4.5 displays the official Files notice from Emerald Systems on the desktop and in the Files Policy app.</div>
        `, "cloudQuota44");
    };

    window.openSystemBulletin44 = function () {
        app44("System Bulletin", `
            <h3>EmeraldOS 4.5 Bulletin</h3>
            <div class="emerald44-inset">EmeraldOS 4.5 adds staff-gated Developer mode, more account/service applications, and a desktop message from Emerald Systems leadership.</div>
        `, "systemBulletin44");
    };

    window.openStaffAccess44 = function () {
        app44("Staff Access Center", `
            <h3>Staff Access Center</h3>
            <div class="emerald44-inset"><b>Developer mode:</b> ${hasDev44() ? "Verified" : "Not verified"}<br><b>Required role:</b> Emerald Games mod or admin<br><br>Developer apps are hidden unless BIOS staff verification succeeds.</div>
        `, "staffAccess44");
    };

    window.openModeratorTools44 = function () {
        app44("Moderator Tools", `
            <h3>Moderator Tools</h3>
            <div class="emerald44-inset">Staff-only moderation utilities placeholder. This app is visible only when Developer mode is available.</div>
        `, "moderatorTools44");
    };

    window.openServiceAccess44 = function () {
        app44("Service Access", `
            <h3>Service Access</h3>
            <div class="emerald44-grid">
                ${button44("Files Policy", "openFilesPolicy44()")}
                ${button44("Account Status", "openAccountStatus44()")}
                ${button44("Cloud Limits", "openCloudQuota44()")}
                ${button44("System Bulletin", "openSystemBulletin44()")}
            </div>
        `, "serviceAccess44");
    };

    window.openLegalNotice44 = function () {
        app44("Legal Notice", `
            <h3>EmeraldOS Legal Notice</h3>
            <div class="emerald44-inset">All EmeraldOS versions and editions are copyright of Emerald Systems, 2026. Use of EmeraldOS is a privilege. Files, accounts, edition access, and EmeraldOS access can be denied at any time.</div>
        `, "legalNotice44");
    };

    function registerApp44(id, app) {
        if (!window.APPS || window.APPS[id]) return;
        window.APPS[id] = Object.assign({ edition: "virtue", category: "essential" }, app);
    }

    function installApps44() {
        if (!window.APPS || window.__emerald44AppsInstalled) return false;
        window.__emerald44AppsInstalled = true;

        registerApp44("wyattMessage44", { name: "Message from Wyatt", icon: "MSG", edition: "economy", category: "essential", launch: () => window.openWyattMessage44() });
        registerApp44("filesPolicy44", { name: "Files Policy", icon: "POL", edition: "economy", category: "essential", launch: () => window.openFilesPolicy44() });
        registerApp44("legalNotice44", { name: "Legal Notice", icon: "LAW", edition: "economy", category: "essential", launch: () => window.openLegalNotice44() });
        registerApp44("accountStatus44", { name: "Account Status", icon: "USER", edition: "home", category: "essential", launch: () => window.openAccountStatus44() });
        registerApp44("cloudQuota44", { name: "Cloud Limits", icon: "CLOUD", edition: "home", category: "essential", launch: () => window.openCloudQuota44() });
        registerApp44("systemBulletin44", { name: "System Bulletin", icon: "NEWS", edition: "business", category: "business", launch: () => window.openSystemBulletin44() });
        registerApp44("serviceAccess44", { name: "Service Access", icon: "SVC", edition: "business", category: "business", launch: () => window.openServiceAccess44() });
        registerApp44("staffAccess44", { name: "Staff Access", icon: "STAFF", edition: "developer", category: "developer", launch: () => window.openStaffAccess44() });
        registerApp44("moderatorTools44", { name: "Moderator Tools", icon: "MOD", edition: "developer", category: "developer", launch: () => window.openModeratorTools44() });

        const pinned = getJSON44(PIN_DESKTOP_KEY_44, []);
        if (!pinned.includes("wyattMessage44")) {
            pinned.push("wyattMessage44");
            setJSON44(PIN_DESKTOP_KEY_44, pinned);
        }

        window.refreshEditionVisibility?.();
        window.renderDesktop?.();
        return true;
    }

    function showDesktopMessage44() {
        if (localStorage.getItem("40_wyatt_message_hidden") === "true") return;
        if (document.getElementById("emerald44-desktop-message")) return;
        const desktop = document.getElementById("desktop");
        if (!desktop) return;

        const box = document.createElement("div");
        box.id = "emerald44-desktop-message";
        box.innerHTML = `<div class="title"><span>Message from Wyatt Monroe</span><button onclick="localStorage.setItem('40_wyatt_message_hidden','true');document.getElementById('emerald44-desktop-message')?.remove();">X</button></div><div class="body">${esc44(WYATT_MESSAGE_44)}</div>`;
        desktop.appendChild(box);
    }

    function init44() {
        injectStyles44();
        if (!installApps44()) setTimeout(init44, 500);
        setTimeout(showDesktopMessage44, 900);
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", init44);
    } else {
        init44();
    }
})();

/* =========================================================
   EMERALDOS 4.5
   Office 360, Economy Writing Tools, Home Apps, Desktop Consistency
========================================================= */
(function () {
    "use strict";

    if (window.EmeraldOS45Loaded) return;
    window.EmeraldOS45Loaded = true;

    const BUILD_45 = {
        product: "EmeraldOS",
        base: "EmeraldOS 4.4",
        displayName: "EmeraldOS 4.5",
        version: "4.5",
        channel: "Stable",
        codename: "Office 360 & Desktop Consistency Update",
        experimental: false
    };

    const OFFICE_DOC_KEY = "40_emerald360_documents";
    const OFFICE_SETTINGS_KEY = "40_emerald45_suite_settings";
    const PIN_START_KEY = "40_pinned_start_apps";
    const PIN_DESKTOP_KEY = "40_pinned_desktop_apps";
    const PIN_TASKBAR_KEY = "40_pinned_taskbar_apps";

    function esc45(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function getJSON45(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    }

    function setJSON45(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function unique45(list) {
        return Array.from(new Set((list || []).filter(Boolean)));
    }

    function canUse45(requiredEdition) {
        if (typeof window.canSeeEdition === "function") return window.canSeeEdition(requiredEdition || "economy");
        return true;
    }

    function open45(title, html, appId) {
        if (typeof window.openWindow === "function") {
            window.openWindow(title, `<div class="emerald45-panel">${html}</div>`, appId || "emerald45");
        } else {
            alert(title);
        }
    }

    function btn45(label, action) {
        return `<button class="emerald45-button" onclick="${action}">${esc45(label)}</button>`;
    }

    function getDocs45() {
        return getJSON45(OFFICE_DOC_KEY, []);
    }

    function saveDocs45(list) {
        setJSON45(OFFICE_DOC_KEY, list);
        try { window.notify?.("Emerald 360", "Document saved locally.", 2600, "success"); } catch {}
    }

    function upsertDoc45(type, title, content) {
        const list = getDocs45();
        list.unshift({
            id: "doc45_" + Date.now(),
            type,
            title: title || "Untitled",
            content: content || "",
            updatedAt: Date.now()
        });
        saveDocs45(list.slice(0, 80));
    }

    window.saveWriterBasic45 = function () {
        const title = document.getElementById("writerBasicTitle45")?.value || "Writer Basic Document";
        const content = document.getElementById("writerBasicBody45")?.value || "";
        upsertDoc45("writer", title, content);
    };

    window.saveLetterPad45 = function () {
        const to = document.getElementById("letterTo45")?.value || "";
        const subject = document.getElementById("letterSubject45")?.value || "";
        const body = document.getElementById("letterBody45")?.value || "";
        upsertDoc45("letter", subject || "Letter", `To: ${to}\nSubject: ${subject}\n\n${body}`);
    };

    window.saveSpreadsheet45 = function () {
        const rows = [...document.querySelectorAll(".sheet45-row")].map(row => [...row.querySelectorAll("input")].map(i => i.value));
        upsertDoc45("sheet", "Spreadsheet Basic", JSON.stringify(rows));
    };

    window.savePresentation45 = function () {
        const title = document.getElementById("presentationTitle45")?.value || "Presentation";
        const slides = document.getElementById("presentationSlides45")?.value || "";
        upsertDoc45("slides", title, slides);
    };

    window.openWriterBasic45 = function () {
        open45("Writer Basic", `
            <h3>Writer Basic</h3>
            <div class="emerald45-inset">Economy edition word processor for simple drafts, notes, letters, and saved text documents.</div>
            <input id="writerBasicTitle45" class="emerald45-input" value="Untitled Document">
            <textarea id="writerBasicBody45" class="emerald45-textarea" placeholder="Start writing..."></textarea>
            <div class="emerald45-row">${btn45("Save to Emerald 360", "saveWriterBasic45()")} ${btn45("Open Emerald 360", "openEmerald36045()")}</div>
        `, "writerBasic45");
    };

    window.openLetterPad45 = function () {
        open45("Letter Pad", `
            <h3>Letter Pad</h3>
            <input id="letterTo45" class="emerald45-input" placeholder="To">
            <input id="letterSubject45" class="emerald45-input" placeholder="Subject">
            <textarea id="letterBody45" class="emerald45-textarea" placeholder="Write your letter..."></textarea>
            <div class="emerald45-row">${btn45("Save Letter", "saveLetterPad45()")} ${btn45("Open Emerald 360", "openEmerald36045()")}</div>
        `, "letterPad45");
    };

    window.openDocumentReader45 = function () {
        open45("Document Reader", `
            <h3>Document Reader</h3>
            <div class="emerald45-inset">Paste text, HTML, Markdown, or a simple document body below to read it in a clean view.</div>
            <textarea id="readerInput45" class="emerald45-textarea" placeholder="Paste document text here..."></textarea>
            <div class="emerald45-row">${btn45("Render", "renderDocumentReader45()")} ${btn45("Clear", "document.getElementById('readerOutput45').innerHTML='' ")}</div>
            <div id="readerOutput45" class="emerald45-reader"></div>
        `, "documentReader45");
    };

    window.renderDocumentReader45 = function () {
        const text = document.getElementById("readerInput45")?.value || "";
        const out = document.getElementById("readerOutput45");
        if (!out) return;
        const safe = esc45(text)
            .replace(/^# (.*)$/gm, "<h2>$1</h2>")
            .replace(/^## (.*)$/gm, "<h3>$1</h3>")
            .replace(/\n/g, "<br>");
        out.innerHTML = safe;
    };

    window.openTextComposer45 = function () {
        open45("Text Composer", `
            <h3>Text Composer</h3>
            <div class="emerald45-toolbar">
                ${btn45("Bold", "document.execCommand('bold')")}
                ${btn45("Italic", "document.execCommand('italic')")}
                ${btn45("Underline", "document.execCommand('underline')")}
                ${btn45("Save", "saveTextComposer45()")}
            </div>
            <div id="composer45" class="emerald45-editor" contenteditable="true">Start composing...</div>
        `, "textComposer45");
    };

    window.saveTextComposer45 = function () {
        const html = document.getElementById("composer45")?.innerHTML || "";
        upsertDoc45("richtext", "Text Composer Document", html);
    };

    window.openSpreadsheetBasic45 = function () {
        const rows = Array.from({ length: 8 }, (_, r) => `<div class="sheet45-row">${Array.from({ length: 5 }, (_, c) => `<input placeholder="${String.fromCharCode(65+c)}${r+1}">`).join("")}</div>`).join("");
        open45("Spreadsheet Basic", `
            <h3>Spreadsheet Basic</h3>
            <div class="emerald45-inset">A small spreadsheet-style grid for simple lists, budgets, and tables.</div>
            <div class="sheet45">${rows}</div>
            ${btn45("Save Sheet", "saveSpreadsheet45()")}
        `, "spreadsheetBasic45");
    };

    window.openPresentationBasic45 = function () {
        open45("Presentation Basic", `
            <h3>Presentation Basic</h3>
            <input id="presentationTitle45" class="emerald45-input" value="Untitled Presentation">
            <textarea id="presentationSlides45" class="emerald45-textarea" placeholder="Slide 1: Title\n- Point one\n---\nSlide 2: Another title"></textarea>
            <div class="emerald45-row">${btn45("Preview", "previewPresentation45()")} ${btn45("Save", "savePresentation45()")}</div>
            <div id="presentationPreview45" class="emerald45-reader"></div>
        `, "presentationBasic45");
    };

    window.previewPresentation45 = function () {
        const raw = document.getElementById("presentationSlides45")?.value || "";
        const slides = raw.split(/\n---\n/g).map((s, i) => `<div class="emerald45-slide"><b>Slide ${i+1}</b><br>${esc45(s).replace(/\n/g, "<br>")}</div>`).join("");
        const out = document.getElementById("presentationPreview45");
        if (out) out.innerHTML = slides;
    };

    window.openEmerald36045 = function () {
        const docs = getDocs45();
        const docsHtml = docs.length
            ? docs.map(d => `<div class="emerald45-doc-row"><b>${esc45(d.title)}</b><br><span>${esc45(d.type)} • ${new Date(d.updatedAt).toLocaleString()}</span><pre>${esc45(String(d.content)).slice(0, 500)}</pre></div>`).join("")
            : `<div class="emerald45-inset">No Emerald 360 documents yet. Create one with Writer Basic, Letter Pad, Spreadsheet Basic, or Presentation Basic.</div>`;

        open45("Emerald 360", `
            <h2>Emerald 360</h2>
            <div class="emerald45-inset">EmeraldOS 4.5's consolidated productivity suite. Economy gets basic writing tools; Home and higher get expanded personal productivity tools.</div>
            <div class="emerald45-grid">
                ${btn45("Writer Basic", "openWriterBasic45()")}
                ${btn45("Letter Pad", "openLetterPad45()")}
                ${btn45("Document Reader", "openDocumentReader45()")}
                ${btn45("Text Composer", "openTextComposer45()")}
                ${btn45("Spreadsheet Basic", "openSpreadsheetBasic45()")}
                ${btn45("Presentation Basic", "openPresentationBasic45()")}
                ${canUse45("home") ? btn45("Home Planner", "openPersonalPlanner45()") : ""}
                ${canUse45("home") ? btn45("Budget Lite", "openBudgetLite45()") : ""}
                ${canUse45("business") ? btn45("Business Center", "openBusinessCenter45()") : ""}
            </div>
            <h3>Saved Emerald 360 Documents</h3>
            <div class="emerald45-doc-list">${docsHtml}</div>
        `, "emerald36045");
    };

    window.openHomeCenter45 = function () {
        open45("Home Center", `
            <h3>Home Center</h3>
            <div class="emerald45-grid">
                ${btn45("Personal Planner", "openPersonalPlanner45()")}
                ${btn45("Budget Lite", "openBudgetLite45()")}
                ${btn45("Checklist", "openHouseholdChecklist45()")}
                ${btn45("Recipe Box", "openRecipeBox45()")}
                ${btn45("Reading List", "openReadingList45()")}
                ${btn45("Photo Album", "openPhotoAlbum45()")}
            </div>
        `, "homeCenter45");
    };

    function simpleLocalApp45(title, key, placeholder) {
        const value = localStorage.getItem(key) || "";
        open45(title, `
            <h3>${esc45(title)}</h3>
            <textarea id="${key}" class="emerald45-textarea">${esc45(value)}</textarea>
            <button class="emerald45-button" onclick="localStorage.setItem('${key}', document.getElementById('${key}').value); notify('${esc45(title)}','Saved.',2500,'success')">Save</button>
            <div class="emerald45-inset">${esc45(placeholder || "Saved locally in this browser profile.")}</div>
        `, key);
    }

    window.openPersonalPlanner45 = () => simpleLocalApp45("Personal Planner", "40_home_personal_planner", "Plan personal tasks, appointments, and reminders.");
    window.openBudgetLite45 = () => simpleLocalApp45("Budget Lite", "40_home_budget_lite", "Simple personal budget notes and spending plans.");
    window.openHouseholdChecklist45 = () => simpleLocalApp45("Household Checklist", "40_home_checklist", "Track household tasks and repeating chores.");
    window.openRecipeBox45 = () => simpleLocalApp45("Recipe Box", "40_home_recipe_box", "Save recipes, ingredients, and cooking notes.");
    window.openReadingList45 = () => simpleLocalApp45("Reading List", "40_home_reading_list", "Keep books, articles, and research links in one place.");
    window.openPhotoAlbum45 = () => simpleLocalApp45("Photo Album", "40_home_photo_album", "Store captions, image lists, and album planning notes.");
    window.openFamilyCalendar45 = () => simpleLocalApp45("Family Calendar", "40_home_family_calendar", "Simple shared-family schedule planning notes.");
    window.openBookmarkShelf45 = () => simpleLocalApp45("Bookmark Shelf", "40_home_bookmark_shelf", "Personal links and references.");

    window.openBusinessCenter45 = function () {
        open45("Business Center", `
            <h3>Business Center</h3>
            <div class="emerald45-inset">Consolidated work tools. This replaces several separate workspace-style apps with one cleaner hub.</div>
            <div class="emerald45-grid">
                ${btn45("Reports", "if(window.openReportsCenter)openReportsCenter();else notify('Business Center','Reports module placeholder.')")}
                ${btn45("Contacts", "if(window.openContactsBook)openContactsBook();else notify('Business Center','Contacts module placeholder.')")}
                ${btn45("Workspace", "if(window.openBusinessWorkspace)openBusinessWorkspace();else notify('Business Center','Workspace unavailable.')")}
                ${btn45("Emerald 360", "openEmerald36045()")}
            </div>
        `, "businessCenter45");
    };

    window.openDesktopConsistency45 = function () {
        open45("Desktop Consistency", `
            <h3>Desktop Consistency</h3>
            <div class="emerald45-inset">Tools for keeping the desktop folder layout stable across version updates.</div>
            <div class="emerald45-grid">
                ${btn45("Repair App Folders", "repairDesktop45()")}
                ${btn45("Remove Redundant Pins", "cleanupPins45()")}
                ${btn45("Render Desktop", "renderDesktop()")}
                ${btn45("Render Start Menu", "renderStartMenu()")}
            </div>
        `, "desktopConsistency45");
    };

    window.repairDesktop45 = function () {
        try {
            if (window.EMERALDOS_APP_CATEGORIES?.office) window.EMERALDOS_APP_CATEGORIES.office.edition = "economy";
            window.renderDesktop?.();
            window.renderStartMenu?.();
            window.notify?.("Desktop", "Desktop folder consistency repaired.", 2600, "success");
        } catch (err) {
            console.warn(err);
        }
    };

    function cleanupPins45() {
        const hidden = ["notes", "docs", "calendar", "workspace", "reports", "contactsBook", "mailDrafts", "pdfViewer", "markdownViewer", "csvViewer"];
        [PIN_START_KEY, PIN_DESKTOP_KEY, PIN_TASKBAR_KEY].forEach(key => {
            const current = getJSON45(key, []);
            const cleaned = current.filter(id => !hidden.includes(id));
            setJSON45(key, cleaned);
        });
        window.refreshPins425?.();
        window.renderDesktop?.();
        window.renderStartMenu?.();
        window.notify?.("Desktop", "Redundant pins cleaned up.", 2600, "success");
    }
    window.cleanupPins45 = cleanupPins45;

    function registerApp45(id, app) {
        if (!window.APPS) return false;
        window.APPS[id] = Object.assign({ edition: "economy", category: "office" }, window.APPS[id] || {}, app);
        return true;
    }

    function consolidateApps45() {
        if (!window.APPS) return;
        const hideInto360 = ["notes", "docs", "calendar"];
        hideInto360.forEach(id => {
            if (window.APPS[id]) {
                window.APPS[id].hiddenStandalone = true;
                window.APPS[id].suiteParent = "emerald36045";
            }
        });
        ["workspace", "reportsCenter41", "contactsBook", "mailDrafts", "taskBoard"].forEach(id => {
            if (window.APPS[id]) {
                window.APPS[id].hiddenStandalone = true;
                window.APPS[id].suiteParent = "businessCenter45";
            }
        });
        ["pdfViewer41", "markdownViewer", "csvViewer", "svgViewer41", "imageGallery41"].forEach(id => {
            if (window.APPS[id]) {
                window.APPS[id].hiddenStandalone = true;
                window.APPS[id].suiteParent = "viewerStudio";
            }
        });
    }

    function installApps45() {
        if (!window.APPS) return false;
        if (window.__emerald45AppsInstalled) return true;
        window.__emerald45AppsInstalled = true;

        if (window.EMERALDOS_APP_CATEGORIES) {
            window.EMERALDOS_APP_CATEGORIES.office = Object.assign({}, window.EMERALDOS_APP_CATEGORIES.office || {}, {
                id: "office",
                name: "Office Apps",
                icon: "📁",
                edition: "economy",
                description: "Emerald 360 and basic writing tools. Available beginning in Economy."
            });
            window.EMERALDOS_APP_CATEGORIES.personal = {
                id: "personal",
                name: "Home Apps",
                icon: "📁",
                edition: "home",
                description: "Personal productivity, planning, household, reading, and home organization tools."
            };
        }

        registerApp45("emerald36045", { name: "Emerald 360", icon: "360", edition: "economy", category: "office", launch: () => window.openEmerald36045() });
        registerApp45("writerBasic45", { name: "Writer Basic", icon: "WR", edition: "economy", category: "office", launch: () => window.openWriterBasic45() });
        registerApp45("letterPad45", { name: "Letter Pad", icon: "LTR", edition: "economy", category: "office", launch: () => window.openLetterPad45() });
        registerApp45("documentReader45", { name: "Document Reader", icon: "READ", edition: "economy", category: "office", launch: () => window.openDocumentReader45() });
        registerApp45("textComposer45", { name: "Text Composer", icon: "TXT+", edition: "economy", category: "office", launch: () => window.openTextComposer45() });
        registerApp45("spreadsheetBasic45", { name: "Spreadsheet Basic", icon: "SHT", edition: "home", category: "office", launch: () => window.openSpreadsheetBasic45() });
        registerApp45("presentationBasic45", { name: "Presentation Basic", icon: "PRS", edition: "home", category: "office", launch: () => window.openPresentationBasic45() });

        registerApp45("homeCenter45", { name: "Home Center", icon: "HOME", edition: "home", category: "personal", launch: () => window.openHomeCenter45() });
        registerApp45("personalPlanner45", { name: "Personal Planner", icon: "PLAN", edition: "home", category: "personal", hiddenStandalone: true, launch: () => window.openPersonalPlanner45() });
        registerApp45("budgetLite45", { name: "Budget Lite", icon: "BUD", edition: "home", category: "personal", hiddenStandalone: true, launch: () => window.openBudgetLite45() });
        registerApp45("householdChecklist45", { name: "Household Checklist", icon: "CHK", edition: "home", category: "personal", hiddenStandalone: true, launch: () => window.openHouseholdChecklist45() });
        registerApp45("recipeBox45", { name: "Recipe Box", icon: "RCP", edition: "home", category: "personal", hiddenStandalone: true, launch: () => window.openRecipeBox45() });
        registerApp45("readingList45", { name: "Reading List", icon: "BOOK", edition: "home", category: "personal", hiddenStandalone: true, launch: () => window.openReadingList45() });
        registerApp45("photoAlbum45", { name: "Photo Album", icon: "IMG", edition: "home", category: "personal", hiddenStandalone: true, launch: () => window.openPhotoAlbum45() });
        registerApp45("familyCalendar45", { name: "Family Calendar", icon: "FAM", edition: "home", category: "personal", hiddenStandalone: true, launch: () => window.openFamilyCalendar45() });
        registerApp45("bookmarkShelf45", { name: "Bookmark Shelf", icon: "BM", edition: "home", category: "personal", hiddenStandalone: true, launch: () => window.openBookmarkShelf45() });

        registerApp45("businessCenter45", { name: "Business Center", icon: "BIZ", edition: "business", category: "business", launch: () => window.openBusinessCenter45() });
        registerApp45("desktopConsistency45", { name: "Desktop Consistency", icon: "FIX", edition: "virtue", category: "essential", launch: () => window.openDesktopConsistency45() });

        consolidateApps45();
        cleanupPins45();

        try { window.EMERALDOS_BUILD.displayName = BUILD_45.displayName; } catch {}
        try { window.EMERALDOS_BUILD.version = BUILD_45.version; } catch {}
        try { window.EMERALDOS_BUILD.codename = BUILD_45.codename; } catch {}
        try { localStorage.setItem("40_build_name", BUILD_45.displayName); } catch {}
        try { localStorage.setItem("40_version", BUILD_45.version); } catch {}
        try { localStorage.setItem("40_build_codename", BUILD_45.codename); } catch {}
        try { window.EmeraldOSRegistry?.set?.("HKEY_LOCAL_MACHINE\\System\\Build\\Version", "4.5"); } catch {}
        try { window.EmeraldOSRegistry?.set?.("HKEY_LOCAL_MACHINE\\Software\\EmeraldOS\\Office\\Emerald360", "Enabled"); } catch {}
        try { window.EmeraldOSRegistry?.set?.("HKEY_CURRENT_USER\\Software\\EmeraldOS\\Explorer\\DesktopConsistency", "4.5 Stable"); } catch {}

        document.title = BUILD_45.displayName;
        window.renderDesktop?.();
        window.renderStartMenu?.();
        window.refreshPins425?.();
        window.notify?.("EmeraldOS 4.5", "Emerald 360, Economy writing tools, and desktop consistency loaded.", 3600, "success");
        return true;
    }

    function injectStyles45() {
        if (document.getElementById("emerald45-styles")) return;
        const style = document.createElement("style");
        style.id = "emerald45-styles";
        style.textContent = `
            .emerald45-panel{padding:10px;font-family:"MS Sans Serif",Tahoma,Arial,sans-serif;font-size:12px;background:#c0c0c0;color:#000;height:100%;box-sizing:border-box;overflow:auto}
            .emerald45-inset,.emerald45-reader,.emerald45-doc-row{background:#fff;border-top:2px solid #808080;border-left:2px solid #808080;border-right:2px solid #fff;border-bottom:2px solid #fff;padding:8px;margin:6px 0;color:#000}
            .emerald45-button{background:#c0c0c0;border-top:2px solid #fff;border-left:2px solid #fff;border-right:2px solid #808080;border-bottom:2px solid #808080;padding:5px 10px;margin:3px;font-family:inherit;font-size:12px;cursor:pointer;color:#000}
            .emerald45-button:active{border-top:2px solid #808080;border-left:2px solid #808080;border-right:2px solid #fff;border-bottom:2px solid #fff}
            .emerald45-input{width:100%;box-sizing:border-box;margin:4px 0;padding:5px;border:2px inset #fff;font-family:inherit;font-size:12px;background:#fff;color:#000}
            .emerald45-textarea{width:100%;height:180px;box-sizing:border-box;margin:5px 0;padding:6px;border:2px inset #fff;font-family:"Courier New",monospace;font-size:12px;background:#fff;color:#000;resize:vertical}
            .emerald45-editor{min-height:210px;background:#fff;border:2px inset #fff;padding:8px;margin-top:6px;outline:none;overflow:auto}
            .emerald45-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:6px;margin:8px 0}.emerald45-grid .emerald45-button{width:100%;min-height:34px;text-align:left}.emerald45-row{margin:6px 0}.emerald45-toolbar{background:#d4d0c8;border:1px solid #808080;padding:4px;margin-bottom:5px}.emerald45-doc-row pre{white-space:pre-wrap;max-height:90px;overflow:auto;background:#f7f7f7;border:1px solid #aaa;padding:4px}.sheet45-row{display:grid;grid-template-columns:repeat(5,1fr)}.sheet45 input{min-width:0;border:1px solid #808080;padding:4px}.emerald45-slide{background:#fff;border:1px solid #808080;margin:6px 0;padding:8px}
            .desktop-item .desktop-icon-label{line-height:1.15}.emerald426-folder-icon .desktop-icon-symbol{font-size:26px}
        `;
        document.head.appendChild(style);
    }

    function patchTerminal45() {
        const original = window.runCommand;
        if (typeof original !== "function" || original.__emerald45Wrapped) return;
        const wrapped = async function (cmdLine = "") {
            const raw = String(cmdLine).trim();
            const cmd = raw.toLowerCase();
            let result = null;
            if (cmd === "office" || cmd === "360" || cmd === "emerald360") { window.openEmerald36045(); result = "Opened Emerald 360."; }
            if (cmd === "writer") { window.openWriterBasic45(); result = "Opened Writer Basic."; }
            if (cmd === "home.center") { window.openHomeCenter45(); result = "Opened Home Center."; }
            if (cmd === "desktop.consistency") { window.openDesktopConsistency45(); result = "Opened Desktop Consistency."; }
            if (cmd === "desktop.repair45") { window.repairDesktop45(); result = "Desktop consistency repair requested."; }
            if (cmd === "build") result = "EmeraldOS 4.5 - Office 360 & Desktop Consistency Update";
            if (result !== null) {
                const output = document.getElementById("terminal_output");
                if (output) {
                    output.innerHTML += `&gt; ${esc45(raw)}<br>${esc45(result)}<br><br>`;
                    output.scrollTop = output.scrollHeight;
                    const input = document.getElementById("terminal_input");
                    if (input) input.value = "";
                }
                return;
            }
            return original.call(this, cmdLine);
        };
        wrapped.__emerald45Wrapped = true;
        window.runCommand = wrapped;
    }

    function init45() {
        injectStyles45();
        patchTerminal45();
        if (!installApps45()) {
            setTimeout(init45, 400);
            return;
        }
        setTimeout(() => {
            try { window.repairDesktop45(); } catch {}
        }, 500);
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", () => setTimeout(init45, 1900));
    } else {
        setTimeout(init45, 1900);
    }
})();
