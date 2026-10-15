"use strict";

/* =========================================================
   EMERALDOS EDITIONS SYSTEM
   editions.js
========================================================= */

/* =========================================================
   EDITION DEFINITIONS
========================================================= */

const EDITIONS = {

    home: {

        id: "home",

        name: "EmeraldOS Home",

        shortName: "Home",

        level: 1,

        color: "#4caf50",

        description:
            "Core EmeraldOS experience for everyday users.",

        perks: [

            "Core applications",
            "Files & Notes",
            "Desktop customization",
            "Basic multitasking"

        ]

    },

    business: {

        id: "business",

        name: "EmeraldOS Business",

        shortName: "Business",

        level: 2,

        color: "#2196f3",

        description:
            "Professional productivity tools and workspace features.",

        perks: [

            "Everything in Home",
            "Business workspace",
            "Cloud sync",
            "Productivity tools",
            "Advanced multitasking"

        ]

    },

    virtue: {

        id: "virtue",

        name: "EmeraldOS Virtue",

        shortName: "Virtue",

        level: 3,

        color: "#9c27b0",

        description:
            "Advanced tools for developers and power users.",

        perks: [

            "Everything in Business",
            "Developer tools",
            "Advanced settings",
            "Performance controls",
            "Experimental features"

        ]

    },

    executive: {

        id: "executive",

        name: "EmeraldOS Executive",

        shortName: "Executive",

        level: 4,

        color: "#c62828",

        description:
            "Complete premium EmeraldOS experience.",

        perks: [

            "Everything unlocked",
            "Executive dashboard",
            "Premium themes",
            "Enterprise features",
            "Priority updates",
            "Experimental apps"

        ]

    }

};

/* =========================================================
   CORE HELPERS
========================================================= */

function getEdition() {

    return (
        localStorage.getItem(
            "emerald_edition"
        ) || "home"
    );

}

function getEditionData() {

    const id = getEdition();

    return EDITIONS[id]
        || EDITIONS.home;

}

function setEdition(id) {

    if (!EDITIONS[id]) {

        console.warn(
            "Invalid edition:",
            id
        );

        return false;
    }

    localStorage.setItem(
        "emerald_edition",
        id
    );

    const edition =
        EDITIONS[id];

    console.log(
        `Edition changed to ${edition.name}`
    );

    /* Optional notification support */
    if (typeof notify === "function") {

        notify(
            "Edition Updated",
            `Now running ${edition.name}`,
            3500,
            "success"
        );

    }

    renderEditionBadge();

    return true;
}

/* =========================================================
   PERMISSION CHECKING
========================================================= */

function hasEdition(requiredEdition) {

    const current =
        EDITIONS[getEdition()]?.level || 1;

    const required =
        EDITIONS[requiredEdition]?.level || 1;

    return current >= required;
}

/* =========================================================
   FEATURE LOCK HELPERS
========================================================= */

function requireEdition(requiredEdition, featureName = "feature") {

    if (hasEdition(requiredEdition)) {
        return true;
    }

    const edition =
        EDITIONS[requiredEdition];

    if (typeof notify === "function") {

        notify(
            "Feature Locked",
            `${featureName} requires ${edition.name}.`,
            4500,
            "warning"
        );

    } else {

        alert(
            `${featureName} requires ${edition.name}.`
        );

    }

    return false;
}

/* =========================================================
   EDITION BADGE
========================================================= */

function renderEditionBadge() {

    const badge =
        document.getElementById(
            "edition-badge"
        );

    if (!badge) return;

    const edition =
        getEditionData();

    badge.innerHTML = `
        <span style="
            color:${edition.color};
            font-weight:bold;
        ">
            ${edition.name}
        </span>
    `;
}

/* =========================================================
   EDITION SELECTOR WINDOW
========================================================= */

function openEditionManager() {

    const editionHTML = Object.values(EDITIONS)
        .map(edition => {

            return `
                <div style="
                    margin-bottom:14px;
                    padding:10px;
                    border:1px solid #777;
                    background:#d4d0c8;
                ">

                    <h3 style="
                        margin:0;
                        color:${edition.color};
                    ">
                        ${edition.name}
                    </h3>

                    <div style="
                        margin-top:4px;
                        font-size:12px;
                    ">
                        ${edition.description}
                    </div>

                    <ul style="
                        margin-top:8px;
                        padding-left:18px;
                        font-size:12px;
                    ">
                        ${edition.perks
                            .map(p => `<li>${p}</li>`)
                            .join("")}
                    </ul>

                    <button
                        onclick="setEdition('${edition.id}')"
                        style="
                            margin-top:6px;
                        "
                    >
                        Activate
                    </button>

                </div>
            `;

        })
        .join("");

    if (typeof openWindow === "function") {

        openWindow(
            "EmeraldOS Editions",
            `
            <div style="
                padding:10px;
                font-family:Tahoma,sans-serif;
                background:#c0c0c0;
                height:100%;
                overflow:auto;
            ">
                ${editionHTML}
            </div>
            `
        );

    } else {

        console.log(
            "Edition Manager:",
            editionHTML
        );

    }

}

/* =========================================================
   BOOT INIT
========================================================= */

window.addEventListener(
    "DOMContentLoaded",
    () => {

        renderEditionBadge();

        console.log(
            "EmeraldOS Edition:",
            getEditionData().name
        );

    }
);

/* =========================================================
   GLOBAL EXPORTS
========================================================= */

window.EDITIONS = EDITIONS;

window.getEdition = getEdition;
window.getEditionData = getEditionData;
window.setEdition = setEdition;

window.hasEdition = hasEdition;
window.requireEdition = requireEdition;

window.renderEditionBadge =
    renderEditionBadge;

window.openEditionManager =
    openEditionManager;
