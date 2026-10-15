"use strict";

/* =========================================================
   TESTOS 3.2.T.5
   True edition system
   Built on EmeraldOS 3.2
========================================================= */

(function () {

    if (window.TestOS32T1Loaded) {
        console.warn("TestOS 3.2.T.5 already loaded.");
        return;
    }

    window.TestOS32T1Loaded = true;

    const TESTOS_BUILD = {
        product: "TestOS",
        base: "EmeraldOS 3.2",
        displayName: "TestOS 3.2.T.5",
        version: "3.2.T.5",
        channel: "Test",
        codename: "Desktop Folder Suites Preview",
        experimental: true
    };

    const TESTOS_EDITIONS = {
        economy: {
            id: "economy",
            name: "TestOS Economy",
            shortName: "Economy",
            level: 1,
            color: "#606060",
            description: "Smallest TestOS edition with only essential desktop tools.",
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
            name: "TestOS Home",
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
            name: "TestOS Business",
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
            name: "TestOS Virtue",
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
            name: "TestOS Developer",
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
            name: "TestOS Executive",
            shortName: "Executive",
            level: 6,
            color: "#800000",
            description: "Complete edition with every TestOS app and experimental feature visible.",
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
        Object.values(TESTOS_EDITIONS).map(edition => [edition.id, edition.level])
    );

    function normalizeEdition(id) {
        return LEVELS[id] ? id : "economy";
    }

    function ensureTestOSBootConfig() {
        if (!localStorage.getItem("testos_build_name")) {
            localStorage.setItem("testos_build_id", "testos32t5");
            localStorage.setItem("testos_build_name", TESTOS_BUILD.displayName);
            localStorage.setItem("testos_version", TESTOS_BUILD.version);
            localStorage.setItem("testos_channel", TESTOS_BUILD.channel);
            localStorage.setItem("testos_test_build", "true");
        }

        if (!localStorage.getItem("testos_edition")) {
            localStorage.setItem("testos_edition", "economy");
            localStorage.setItem("testos_edition_name", TESTOS_EDITIONS.economy.name);
        }
    }

    function getTestOSEdition() {
        return normalizeEdition(localStorage.getItem("testos_edition") || "economy");
    }

    function getTestOSEditionData() {
        return TESTOS_EDITIONS[getTestOSEdition()] || TESTOS_EDITIONS.economy;
    }

    function getTestOSEditionLevel() {
        return getTestOSEditionData().level || 1;
    }

    function canUseTestOSEdition(requiredEdition = "home") {
        return getTestOSEditionLevel() >= (LEVELS[requiredEdition] || 1);
    }

    function setTestOSEdition(id) {
        id = normalizeEdition(id);

        localStorage.setItem("testos_edition", id);
        localStorage.setItem("testos_edition_name", TESTOS_EDITIONS[id].name);

        renderTestOSEditionBadge();

        if (typeof window.refreshEditionVisibility === "function") {
            window.refreshEditionVisibility();
        }

        if (typeof window.notify === "function") {
            window.notify(
                "Edition Updated",
                "Now running " + TESTOS_EDITIONS[id].name,
                3500,
                "success"
            );
        }

        return true;
    }

    function injectTestOSStyles() {
        if (document.getElementById("testos32t1-styles")) return;

        const style = document.createElement("style");
        style.id = "testos32t1-styles";

        style.textContent = `
#testos-build-badge,
#testos-edition-badge {
    display: inline-flex;
    align-items: center;
    height: 22px;
    margin-left: 6px;
    font-family: "MS Sans Serif", Tahoma, Arial, sans-serif;
    font-size: 11px;
}

.testos-badge-inner {
    background: #c0c0c0;
    color: #000000;
    padding: 2px 6px;
    white-space: nowrap;
    border-top: 1px solid #ffffff;
    border-left: 1px solid #ffffff;
    border-right: 1px solid #404040;
    border-bottom: 1px solid #404040;
}

.testos-build {
    background: #800080;
    color: #ffffff;
    font-weight: bold;
}

.testos-edition {
    font-weight: bold;
}

.testos-panel {
    background: #c0c0c0;
    color: #000000;
    font-family: "MS Sans Serif", Tahoma, Arial, sans-serif;
    font-size: 12px;
    padding: 10px;
    height: 100%;
    box-sizing: border-box;
    overflow: auto;
}

.testos-box {
    background: #d4d0c8;
    padding: 10px;
    margin-bottom: 10px;
    border-top: 2px solid #ffffff;
    border-left: 2px solid #ffffff;
    border-right: 2px solid #808080;
    border-bottom: 2px solid #808080;
}

.testos-inset {
    background: #ffffff;
    padding: 8px;
    border-top: 2px solid #808080;
    border-left: 2px solid #808080;
    border-right: 2px solid #ffffff;
    border-bottom: 2px solid #ffffff;
}

.testos-button {
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

.testos-button:active {
    border-top: 2px solid #808080;
    border-left: 2px solid #808080;
    border-right: 2px solid #ffffff;
    border-bottom: 2px solid #ffffff;
}

.testos-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
}

.testos-hidden-note {
    background: #ffffcc;
    padding: 8px;
    margin-bottom: 10px;
    border-top: 2px solid #808080;
    border-left: 2px solid #808080;
    border-right: 2px solid #ffffff;
    border-bottom: 2px solid #ffffff;
}

@media (max-width: 700px) {
    .testos-grid {
        grid-template-columns: 1fr;
    }
}
`;

        document.head.appendChild(style);
    }

    function ensureTestOSBadges() {
        const taskbar =
            document.getElementById("taskbar") ||
            document.querySelector(".taskbar");

        if (!taskbar) return;

        if (!document.getElementById("testos-edition-badge")) {
            const editionBadge = document.createElement("div");
            editionBadge.id = "testos-edition-badge";
            taskbar.appendChild(editionBadge);
        }

        if (!document.getElementById("testos-build-badge")) {
            const buildBadge = document.createElement("div");
            buildBadge.id = "testos-build-badge";
            taskbar.appendChild(buildBadge);
        }
    }

    function renderTestOSBuildBadge() {
        const badge = document.getElementById("testos-build-badge");
        if (!badge) return;

        badge.innerHTML = `
            <span class="testos-badge-inner testos-build">
                ${TESTOS_BUILD.displayName}
            </span>
        `;
    }

    function renderTestOSEditionBadge() {
        const badge = document.getElementById("testos-edition-badge");
        if (!badge) return;

        const edition = getTestOSEditionData();

        badge.innerHTML = `
            <span class="testos-badge-inner testos-edition" style="color:${edition.color}">
                ${edition.shortName}
            </span>
        `;
    }

    function editionCards() {
        const current = getTestOSEdition();

        return Object.values(TESTOS_EDITIONS).map(edition => {
            const items = edition.includes.map(item => `<li>${escapeHTML(item)}</li>`).join("");

            return `
                <div class="testos-box">
                    <h3 style="margin-top:0;color:${edition.color};">${edition.name}</h3>
                    <p>${edition.description}</p>
                    <div class="testos-inset">
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

    function openAboutTestOS() {
        const edition = getTestOSEditionData();

        const html = `
            <div class="testos-panel">
                <div class="testos-box">
                    <h2 style="margin-top:0;">${TESTOS_BUILD.displayName}</h2>
                    <div class="testos-inset">
                        <b>Product:</b> ${TESTOS_BUILD.product}<br>
                        <b>Built On:</b> ${TESTOS_BUILD.base}<br>
                        <b>Version:</b> ${TESTOS_BUILD.version}<br>
                        <b>Channel:</b> ${TESTOS_BUILD.channel}<br>
                        <b>Codename:</b> ${TESTOS_BUILD.codename}<br>
                        <b>Edition:</b> ${edition.name}<br>
                        <b>Experimental:</b> ${TESTOS_BUILD.experimental ? "Yes" : "No"}
                    </div>
                </div>

                <div class="testos-hidden-note">
                    Locked features are hidden. The desktop and Start menu only show features available in the active edition.
                </div>
            </div>
        `;

        openContentWindow("About TestOS", html);
    }

    function openTestOSEditionManager() {
        const html = `
            <div class="testos-panel">
                <div class="testos-box">
                    <h2 style="margin-top:0;">TestOS Editions</h2>
                    <p>Select the edition TestOS should run in. Apps above the active edition will not appear.</p>
                </div>
                <div class="testos-grid">${editionCards()}</div>
            </div>
        `;

        openContentWindow("TestOS Editions", html);
    }

    function openTestOSPlans() {
        if (typeof window.openWindow === "function") {
            window.openWindow(
                "TestOS Plans",
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
            <div class="testos-panel">
                <div class="testos-box">
                    <h2 style="margin-top:0;">Business Workspace</h2>
                    <p>Business tools are available in Business, Virtue, and Executive editions.</p>
                </div>
                <div class="testos-inset">
                    Workspace mode is active for ${getTestOSEditionData().name}.
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
            <div class="testos-panel">
                <div class="testos-box">
                    <h2 style="margin-top:0;">Developer Tools</h2>
                    <p>Developer tools are available in the Developer and Executive editions.</p>
                </div>
                <div class="testos-inset">
                    Build: ${TESTOS_BUILD.displayName}<br>
                    Edition: ${getTestOSEditionData().name}<br>
                    Channel: ${TESTOS_BUILD.channel}
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
            <div class="testos-panel">
                <div class="testos-box">
                    <h2 style="margin-top:0;">Executive Dashboard</h2>
                    <p>All TestOS edition features are unlocked.</p>
                </div>
                <div class="testos-inset">
                    Active edition: ${getTestOSEditionData().name}<br>
                    Feature visibility: all applications visible
                </div>
            </div>
            `,
            "executive"
        );
    }

    function openContentWindow(title, html, app = "testos") {
        if (typeof window.openWindow === "function") {
            window.openWindow(title, html, app);
        } else {
            alert(title);
        }
    }



    /* =====================================================
       CORE TESTOS APPS PROVIDED BY EDITION LAYER
    ===================================================== */

    let testosCalcInput = "";
    let testosStopwatchInterval = null;
    let testosStopwatchSeconds = 0;

    function openSystemApp() {
        const edition = getTestOSEditionData();

        openContentWindow(
            "System Control Panel",
            `
            <div class="testos-panel">
                <div class="testos-box">
                    <h2 style="margin-top:0;">System</h2>
                    <div class="testos-inset">
                        <b>User:</b> ${localStorage.getItem("TestOSusername") || "Guest"}<br>
                        <b>Build:</b> ${TESTOS_BUILD.displayName}<br>
                        <b>Built On:</b> ${TESTOS_BUILD.base}<br>
                        <b>Edition:</b> ${edition.name}<br>
                        <b>Feature rule:</b> Locked apps are hidden
                    </div>
                </div>

                <div class="testos-box">
                    <b>Theme</b><br><br>
                    <button class="testos-button" onclick="setTheme('classic')">Classic</button>
                    <button class="testos-button" onclick="setTheme('dark')">Dark</button>
                    <button class="testos-button" onclick="setTheme('light')">Light</button>
                    <button class="testos-button" onclick="setTheme('midnight')">Midnight</button>
                </div>

                <div class="testos-box">
                    <button class="testos-button" onclick="window.location.href='bios.html'">Reboot to BIOS</button>
                    <button class="testos-button" onclick="restartOS()">Restart Shell</button>
                    <button class="testos-button" onclick="logoutUser()">Logout</button>
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
            <div class="testos-panel">
                <div class="testos-box">
                    <h2 style="margin-top:0;">Calendar</h2>
                    <input id="testos-calendar-date" type="date" value="${today}">
                    <br><br>
                    <textarea id="testos-calendar-text" style="width:100%;height:150px;box-sizing:border-box;" placeholder="Enter notes for this date"></textarea>
                    <br><br>
                    <button class="testos-button" onclick="saveTestOSCalendarEntry()">Save Entry</button>
                    <button class="testos-button" onclick="loadTestOSCalendarEntry()">Load Entry</button>
                </div>
            </div>
            `,
            "calendar"
        );

        setTimeout(() => window.loadTestOSCalendarEntry(), 50);
    }

    function openCalculator() {
        const buttons = ["7","8","9","/","4","5","6","*","1","2","3","-","0",".","=","+"];

        openContentWindow(
            "Calculator",
            `
            <div class="testos-panel">
                <div class="testos-box">
                    <input id="testos-calc-display" readonly style="width:100%;box-sizing:border-box;margin-bottom:8px;padding:6px;">
                    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;">
                        ${buttons.map(btn => `<button class="testos-button" onclick="testosCalcPress('${btn}')">${btn}</button>`).join("")}
                    </div>
                    <br>
                    <button class="testos-button" onclick="testosClearCalc()">Clear</button>
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
            <div class="testos-panel">
                <div class="testos-box">
                    <h2 id="testos-live-clock" style="margin-top:0;"></h2>
                </div>
                <div class="testos-box">
                    <h3 style="margin-top:0;">Stopwatch</h3>
                    <div id="testos-stopwatch-display" class="testos-inset">0:00</div>
                    <br>
                    <button class="testos-button" onclick="testosStartStopwatch()">Start</button>
                    <button class="testos-button" onclick="testosPauseStopwatch()">Pause</button>
                    <button class="testos-button" onclick="testosResetStopwatch()">Reset</button>
                </div>
            </div>
            `,
            "clock"
        );

        window.updateTestOSClockApp();
    }

    function openBrowser() {
        openContentWindow(
            "Browser",
            `
            <div style="display:flex;height:100%;flex-direction:column;background:#c0c0c0;">
                <div style="padding:6px;display:flex;gap:5px;">
                    <input id="testos-browser-url" style="flex:1;" placeholder="https://">
                    <button class="testos-button" onclick="testosBrowserGo()">Go</button>
                </div>
                <iframe id="testos-browser-frame" style="flex:1;border:0;background:white;"></iframe>
            </div>
            `,
            "browser"
        );
    }

    function saveTestOSCalendarEntry() {
        const date = document.getElementById("testos-calendar-date")?.value;
        const text = document.getElementById("testos-calendar-text")?.value || "";
        if (!date) return;

        const entries = JSON.parse(localStorage.getItem("testos_calendar") || "{}");
        entries[date] = text;
        localStorage.setItem("testos_calendar", JSON.stringify(entries));

        if (typeof window.notify === "function") {
            window.notify("Calendar", "Entry saved.", 3000, "success");
        }
    }

    function loadTestOSCalendarEntry() {
        const date = document.getElementById("testos-calendar-date")?.value;
        const textArea = document.getElementById("testos-calendar-text");
        if (!date || !textArea) return;

        const entries = JSON.parse(localStorage.getItem("testos_calendar") || "{}");
        textArea.value = entries[date] || "";
    }

    function testosCalcPress(value) {
        if (value === "=") {
            try {
                testosCalcInput = Function("return " + testosCalcInput)().toString();
            } catch {
                testosCalcInput = "Error";
            }
        } else {
            if (testosCalcInput === "Error") testosCalcInput = "";
            testosCalcInput += value;
        }

        const display = document.getElementById("testos-calc-display");
        if (display) display.value = testosCalcInput;
    }

    function testosClearCalc() {
        testosCalcInput = "";
        const display = document.getElementById("testos-calc-display");
        if (display) display.value = "";
    }

    function updateTestOSClockApp() {
        const clock = document.getElementById("testos-live-clock");
        if (clock) {
            clock.textContent = new Date().toLocaleTimeString();
            requestAnimationFrame(updateTestOSClockApp);
        }
    }

    function testosStartStopwatch() {
        if (testosStopwatchInterval) return;

        testosStopwatchInterval = setInterval(() => {
            testosStopwatchSeconds++;
            const m = Math.floor(testosStopwatchSeconds / 60);
            const sec = testosStopwatchSeconds % 60;
            const display = document.getElementById("testos-stopwatch-display");
            if (display) display.textContent = `${m}:${sec.toString().padStart(2,"0")}`;
        }, 1000);
    }

    function testosPauseStopwatch() {
        clearInterval(testosStopwatchInterval);
        testosStopwatchInterval = null;
    }

    function testosResetStopwatch() {
        testosPauseStopwatch();
        testosStopwatchSeconds = 0;
        const display = document.getElementById("testos-stopwatch-display");
        if (display) display.textContent = "0:00";
    }

    function testosBrowserGo() {
        const input = document.getElementById("testos-browser-url");
        const frame = document.getElementById("testos-browser-frame");
        if (!input || !frame) return;

        let url = input.value.trim();
        if (!url) return;
        if (!/^https?:\/\//i.test(url)) url = "https://" + url;
        frame.src = url;
    }

    function installTestOSStartItems() {
        /*
           Edition switching is intentionally not added to the Start menu.
           The selected edition comes from TestBIOS so locked features stay hidden.
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

    function initTestOS32T1() {
        ensureTestOSBootConfig();
        injectTestOSStyles();
        ensureTestOSBadges();
        renderTestOSBuildBadge();
        renderTestOSEditionBadge();
        installTestOSStartItems();

        document.title = TESTOS_BUILD.displayName;

        if (typeof window.refreshEditionVisibility === "function") {
            window.refreshEditionVisibility();
        }

        console.log(TESTOS_BUILD.displayName + " initialized as " + getTestOSEditionData().name + ".");
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", initTestOS32T1);
    } else {
        initTestOS32T1();
    }

    window.TESTOS_BUILD = TESTOS_BUILD;
    window.TESTOS_EDITIONS = TESTOS_EDITIONS;

    window.getTestOSEdition = getTestOSEdition;
    window.getTestOSEditionData = getTestOSEditionData;
    window.getTestOSEditionLevel = getTestOSEditionLevel;
    window.canUseTestOSEdition = canUseTestOSEdition;
    window.setTestOSEdition = setTestOSEdition;

    window.setEdition = setTestOSEdition;

    window.renderTestOSBuildBadge = renderTestOSBuildBadge;
    window.renderTestOSEditionBadge = renderTestOSEditionBadge;

    window.openSystemApp = openSystemApp;
    window.openCalendar = openCalendar;
    window.openCalculator = openCalculator;
    window.openClockApp = openClockApp;
    window.openBrowser = openBrowser;

    window.saveTestOSCalendarEntry = saveTestOSCalendarEntry;
    window.loadTestOSCalendarEntry = loadTestOSCalendarEntry;
    window.testosCalcPress = testosCalcPress;
    window.testosClearCalc = testosClearCalc;
    window.updateTestOSClockApp = updateTestOSClockApp;
    window.testosStartStopwatch = testosStartStopwatch;
    window.testosPauseStopwatch = testosPauseStopwatch;
    window.testosResetStopwatch = testosResetStopwatch;
    window.testosBrowserGo = testosBrowserGo;

    window.openAboutTestOS = openAboutTestOS;
    window.openTestOSEditionManager = openTestOSEditionManager;
    window.openTestOSPlans = openTestOSPlans;
    window.openBusinessWorkspace = openBusinessWorkspace;
    window.openDeveloperTools = openDeveloperTools;
    window.openExecutiveDashboard = openExecutiveDashboard;

})();
