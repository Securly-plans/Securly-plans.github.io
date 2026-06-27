"use strict";

/* =========================================================
   EMERALDOS 4.2
   True edition system
   Built on EmeraldOS 3.2
========================================================= */

(function () {

    if (window.EmeraldOS40Loaded) {
        console.warn("EmeraldOS 4.2.6 already loaded.");
        return;
    }

    window.EmeraldOS40Loaded = true;

    const EMERALDOS_BUILD = {
        product: "EmeraldOS",
        base: "EmeraldOS 3.2",
        displayName: "EmeraldOS 4.2.6",
        version: "4.2.6",
        channel: "Stable",
        codename: "Context Menu & Pinning Fix",
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

    function normalizeEdition(id) {
        if (id === "executive" && !hasExecutiveAdminAccess()) {
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
        return getEmeraldOSEditionLevel() >= (LEVELS[requiredEdition] || 1);
    }

    function setEmeraldOSEdition(id) {
        if (id === "executive" && !hasExecutiveAdminAccess()) {
            if (typeof window.notify === "function") {
                window.notify("Executive Locked", "Executive requires Emerald Games administrator verification from BIOS.", 4500, "warning");
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
