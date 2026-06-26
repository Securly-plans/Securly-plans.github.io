"use strict";

/* =========================================================
   TESTOS 3.2.T.1
   Separate EmeraldOS test build based on EmeraldOS 3.2
========================================================= */

(function () {

    if (window.TestOS32T1Loaded) {
        console.warn("TestOS 3.2.T.1 already loaded.");
        return;
    }

    window.TestOS32T1Loaded = true;

    const TESTOS_BUILD = {
        product: "TestOS",
        base: "EmeraldOS 3.2",
        displayName: "TestOS 3.2.T.1",
        version: "3.2.T.1",
        channel: "Test",
        codename: "Separate Test Build",
        experimental: true
    };

    const TESTOS_EDITIONS = {
        home: {
            id: "home",
            name: "TestOS Home",
            shortName: "Home",
            level: 1,
            color: "#008000"
        },

        business: {
            id: "business",
            name: "TestOS Business",
            shortName: "Business",
            level: 2,
            color: "#000080"
        },

        virtue: {
            id: "virtue",
            name: "TestOS Virtue",
            shortName: "Virtue",
            level: 3,
            color: "#800080"
        },

        executive: {
            id: "executive",
            name: "TestOS Executive",
            shortName: "Executive",
            level: 4,
            color: "#800000"
        }
    };

    function ensureTestOSBootConfig() {
        if (!localStorage.getItem("testos_build_name")) {
            localStorage.setItem("testos_build_id", "testos32t1");
            localStorage.setItem("testos_build_name", TESTOS_BUILD.displayName);
            localStorage.setItem("testos_version", TESTOS_BUILD.version);
            localStorage.setItem("testos_channel", TESTOS_BUILD.channel);
            localStorage.setItem("testos_test_build", "true");
        }

        if (!localStorage.getItem("testos_edition")) {
            localStorage.setItem("testos_edition", "home");
            localStorage.setItem("testos_edition_name", TESTOS_EDITIONS.home.name);
        }
    }

    function getTestOSEdition() {
        return localStorage.getItem("testos_edition") || "home";
    }

    function getTestOSEditionData() {
        return TESTOS_EDITIONS[getTestOSEdition()] || TESTOS_EDITIONS.home;
    }

    function setTestOSEdition(id) {
        if (!TESTOS_EDITIONS[id]) {
            console.warn("Invalid TestOS edition:", id);
            return false;
        }

        localStorage.setItem("testos_edition", id);
        localStorage.setItem("testos_edition_name", TESTOS_EDITIONS[id].name);

        renderTestOSEditionBadge();

        if (typeof notify === "function") {
            notify(
                "Edition Updated",
                "Now running " + TESTOS_EDITIONS[id].name,
                3500,
                "success"
            );
        }

        return true;
    }

    function hasTestOSEdition(requiredEdition) {
        const current = getTestOSEditionData().level || 1;
        const required = TESTOS_EDITIONS[requiredEdition]?.level || 1;

        return current >= required;
    }

    function requireTestOSEdition(requiredEdition, featureName) {
        if (hasTestOSEdition(requiredEdition)) {
            return true;
        }

        const required = TESTOS_EDITIONS[requiredEdition];

        const message =
            (featureName || "This feature") +
            " requires " +
            required.name +
            " or higher.";

        if (typeof notify === "function") {
            notify("Feature Locked", message, 4500, "warning");
        } else {
            alert(message);
        }

        return false;
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

                <div class="testos-box">
                    TestOS is a separate EmeraldOS test environment based on EmeraldOS 3.2.
                    Changes here should not be made directly to the stable EmeraldOS build.
                </div>

            </div>
        `;

        if (typeof openWindow === "function") {
            openWindow("About TestOS", html);
        } else {
            alert(TESTOS_BUILD.displayName);
        }
    }

    function openTestOSEditionManager() {
        const current = getTestOSEdition();

        const html = `
            <div class="testos-panel">
                <div class="testos-box">
                    <h2 style="margin-top:0;">TestOS Editions</h2>
                    <p>Select which TestOS edition should be active.</p>
                </div>

                ${Object.values(TESTOS_EDITIONS).map(edition => `
                    <div class="testos-box">
                        <h3 style="margin-top:0;color:${edition.color};">
                            ${edition.name}
                        </h3>

                        <p>
                            Level ${edition.level} edition.
                        </p>

                        ${
                            current === edition.id
                            ? "<b>Currently active</b>"
                            : `<button class="testos-button" onclick="setTestOSEdition('${edition.id}')">Activate</button>`
                        }
                    </div>
                `).join("")}
            </div>
        `;

        if (typeof openWindow === "function") {
            openWindow("TestOS Editions", html);
        }
    }

    function openTestOSPlans() {
        if (typeof openWindow === "function") {
            openWindow(
                "TestOS Plans",
                `
                <iframe
                    src="plans.html"
                    style="width:100%;height:100%;border:0;background:#c0c0c0;">
                </iframe>
                `
            );
        } else {
            window.location.href = "plans.html";
        }
    }

    function installTestOSStartItems() {
        const menu = document.getElementById("start-menu");

        if (!menu || document.getElementById("testos-start-items")) {
            return;
        }

        const group = document.createElement("div");
        group.id = "testos-start-items";

        group.innerHTML = `
            <div class="start-item" onclick="openAboutTestOS()">About TestOS</div>
            <div class="start-item" onclick="openTestOSEditionManager()">TestOS Editions</div>
            <div class="start-item" onclick="openTestOSPlans()">Plans Comparison</div>
        `;

        menu.appendChild(group);
    }

    function initTestOS32T1() {
        ensureTestOSBootConfig();
        injectTestOSStyles();
        ensureTestOSBadges();

        renderTestOSBuildBadge();
        renderTestOSEditionBadge();

        installTestOSStartItems();

        document.title = TESTOS_BUILD.displayName;

        console.log(TESTOS_BUILD.displayName + " initialized.");

        if (typeof notify === "function") {
            notify(
                "TestOS Loaded",
                TESTOS_BUILD.displayName + " running as " + getTestOSEditionData().name,
                3500,
                "info"
            );
        }
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
    window.setTestOSEdition = setTestOSEdition;

    window.hasTestOSEdition = hasTestOSEdition;
    window.requireTestOSEdition = requireTestOSEdition;

    window.openAboutTestOS = openAboutTestOS;
    window.openTestOSEditionManager = openTestOSEditionManager;
    window.openTestOSPlans = openTestOSPlans;

})();
