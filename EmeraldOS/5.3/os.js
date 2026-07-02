"use strict";

/* =========================================================
   EMERALDOS 5.3
   PART 1
   BOOT + REGISTRY + DESKTOP
======================================================== */

import {
    loadDrive,
    createFile as cloudCreateFile,
    saveFile as cloudSaveFile,
    deleteFile as cloudDeleteFile,
    getFileContent,
    ensureUser,
    loadUserSettings,
    saveUserSettings
} from "./cloudstorage.js";

/* =========================================================
   CORE STATE
========================================================= */

let zIndexCounter = 100;

let fileSystem = {
    files: {},
    folders: {
        Desktop: [],
        Documents: [],
        Pictures: [],
        Downloads: []
    }
};

let openWindows = [];

let notifications = [];

let activeTheme =
    localStorage.getItem("40_theme")
    || "classic";


/* =========================================================
   EMERALDOS 5.3 EDITION CORE
   Hidden-feature edition system
========================================================= */

const EMERALDOS_EDITION_LEVELS = {
    economy: 1,
    home: 2,
    business: 3,
    virtue: 4,
    developer: 5,
    executive: 6
};

const EMERALDOS_EDITION_NAMES = {
    economy: "EmeraldOS Economy",
    home: "EmeraldOS Home",
    business: "EmeraldOS Business",
    virtue: "EmeraldOS Virtue",
    developer: "EmeraldOS Developer",
    executive: "EmeraldOS Executive"
};

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

    return EMERALDOS_EDITION_LEVELS[id] ? id : "virtue";
}

function getActiveEdition() {
    return normalizeEdition(
        localStorage.getItem("40_edition") || "virtue"
    );
}

function getActiveEditionLevel() {
    return EMERALDOS_EDITION_LEVELS[getActiveEdition()] || 1;
}

function canSeeEdition(requiredEdition = "home") {
    if (requiredEdition === "developer" && !hasDeveloperStaffAccess()) {
        return false;
    }

    if (requiredEdition === "executive" && !hasExecutiveAdminAccess()) {
        return false;
    }

    const currentLevel = getActiveEditionLevel();
    const requiredLevel = EMERALDOS_EDITION_LEVELS[requiredEdition] || 1;

    return currentLevel >= requiredLevel;
}

function canSeeApp(app) {
    return canSeeEdition(app.edition || "home");
}

function visibleAppEntries() {
    return Object.entries(APPS).filter(([id, app]) => canSeeApp(app));
}

function visibleApps() {
    return visibleAppEntries().map(([id, app]) => app);
}

function launchApp(id) {
    const app = APPS[id];

    if (!app) {
        console.warn("Unknown app:", id);
        return false;
    }

    if (!canSeeApp(app)) {
        return false;
    }

    app.launch();
    return true;
}

window.EMERALDOS_EDITION_LEVELS = EMERALDOS_EDITION_LEVELS;
window.getActiveEdition = getActiveEdition;
window.getActiveEditionLevel = getActiveEditionLevel;
window.canSeeEdition = canSeeEdition;
window.canSeeApp = canSeeApp;
window.launchApp = launchApp;
window.hasExecutiveAdminAccess = hasExecutiveAdminAccess;
window.hasDeveloperStaffAccess = hasDeveloperStaffAccess;

/* =========================================================
   EMERALDOS NOTIFICATIONS
   Bottom-left toast notifications
========================================================= */

let toastContainer = null;

function initNotifications() {
    toastContainer = document.getElementById("toast-container");

    if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.id = "toast-container";
        document.body.appendChild(toastContainer);
    }
}

function notify(title, message = "", duration = 3000, type = "info") {
    if (arguments.length === 1) {
        message = title;
        title = "EmeraldOS";
    }

    if (!toastContainer) {
        initNotifications();
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    toast.innerHTML = `
        <div class="toast-title">${title}</div>
        <div class="toast-msg">${message}</div>
    `;

    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 250);
    }, duration);
}

window.notify = notify;

/* =========================================================
   APPLICATION REGISTRY
========================================================= */

const APPS = {

    files: {
        name: "Files",
        icon: "📁",
        edition: "home",
        launch: () => window.openFileExplorer()
    },

    notes: {
        name: "Notes",
        icon: "📄",
        edition: "home",
        launch: () => window.openNotes()
    },

    docs: {
        name: "Docs",
        icon: "📘",
        edition: "home",
        launch: () => window.openDocs()
    },

    calendar: {
        name: "Calendar",
        icon: "📅",
        edition: "home",
        launch: () => window.openCalendar()
    },

    calculator: {
        name: "Calculator",
        icon: "🧮",
        edition: "home",
        launch: () => window.openCalculator()
    },

    clock: {
        name: "Clock",
        icon: "⏰",
        edition: "home",
        launch: () => window.openClockApp()
    },

    system: {
        name: "System",
        icon: "💻",
        edition: "home",
        launch: () => window.openSystemApp()
    },

    plans: {
        name: "Plans",
        icon: "▣",
        edition: "home",
        launch: () => window.openEmeraldOSPlans()
    },

    about: {
        name: "About EmeraldOS",
        icon: "i",
        edition: "home",
        launch: () => window.openAboutEmeraldOS()
    },

    workspace: {
        name: "Workspace",
        icon: "▦",
        edition: "business",
        launch: () => window.openBusinessWorkspace()
    },

    browser: {
        name: "Browser",
        icon: "🌐",
        edition: "business",
        launch: () => window.openBrowser()
    },

    appstore: {
        name: "App Store",
        icon: "▤",
        edition: "business",
        launch: () => window.openAppStore()
    },

    chat: {
        name: "Chat",
        icon: "💬",
        edition: "business",
        launch: () => {
            openWindow(
                "Chat",
                `<iframe
                    src="https://securly-plans.github.io/EmeraldOS/G/chat.html"
                    style="width:100%;height:100%;border:none">
                 </iframe>`,
                "chat"
            );
        }
    },

    media: {
        name: "Media Player",
        icon: "📀",
        edition: "business",
        launch: () => {
            openWindow(
                "Media Player",
                `<iframe
                    src="https://securly-plans.github.io/EmeraldOS/mediaplayer.html"
                    style="width:100%;height:100%;border:none">
                 </iframe>`,
                "media"
            );
        }
    },

    terminal: {
        name: "Terminal",
        icon: "⌨️",
        edition: "developer",
        launch: () => window.openTerminal()
    },

    devtools: {
        name: "Developer Tools",
        icon: "▧",
        edition: "developer",
        launch: () => window.openDeveloperTools()
    },

    codeStudio: {
        name: "Code Studio",
        icon: "</>",
        edition: "developer",
        launch: () => window.openCodeStudio()
    },

    debugConsole: {
        name: "Debug Console",
        icon: "DBG",
        edition: "developer",
        launch: () => window.openDebugConsole()
    },

    buildInspector: {
        name: "Build Inspector",
        icon: "BI",
        edition: "developer",
        launch: () => window.openBuildInspector()
    },

    monitor: {
        name: "System Monitor",
        icon: "▥",
        edition: "virtue",
        launch: () => window.openSystemMonitor()
    },

    wallpaper: {
        name: "Wallpaper Manager",
        icon: "▨",
        edition: "virtue",
        launch: () => window.openWallpaperManager()
    },

    desktops: {
        name: "Desktop Manager",
        icon: "▩",
        edition: "virtue",
        launch: () => window.openDesktopManager()
    },

    paint: {
        name: "Paint",
        icon: "▤",
        edition: "virtue",
        launch: () => window.openPaint()
    },

    games: {
        name: "Games",
        icon: "🌐",
        edition: "executive",
        launch: () => {
            openWindow(
                "Games",
                `<iframe
                    src="https://securly-plans.github.io/EmeraldOS/G/home.html"
                    style="width:100%;height:100%;border:none">
                 </iframe>`,
                "games"
            );
        }
    },

    executiveDashboard: {
        name: "Executive Dashboard",
        icon: "■",
        edition: "executive",
        launch: () => window.openExecutiveDashboard()
    }

};

/* =========================================================
   BOOT
========================================================= */

window.addEventListener("DOMContentLoaded", async () => {

    await ensureUser();

    await loadSystem();

    applyTheme();

    initClock();

    initStartMenu();

    renderDesktop();

    renderStartMenu();

});

/* =========================================================
   LOAD SYSTEM
========================================================= */

async function loadSystem() {

    try {

        fileSystem.files =
            await loadDrive() || {};

    }
    catch (err) {

        console.warn(
            "Drive failed:",
            err
        );

        fileSystem.files = {};
    }
}

/* =========================================================
   DESKTOP RENDERER
========================================================= */

function renderDesktop() {

    if (typeof window.renderDesktopOverride === "function") {
        return window.renderDesktopOverride();
    }

    const desktop =
        document.getElementById("desktop");

    desktop.innerHTML = "";

    visibleAppEntries().forEach(([id, app]) => {

        const icon =
            document.createElement("div");

        icon.className = "icon";

        icon.innerHTML = `
            ${app.icon}<br>
            ${app.name}
        `;

        icon.onclick = () => launchApp(id);

        desktop.appendChild(icon);

    });

}

/* =========================================================
   START MENU
========================================================= */

function renderStartMenu() {

    if (typeof window.renderStartMenuOverride === "function") {
        return window.renderStartMenuOverride();
    }

    const results =
        document.getElementById(
            "start-results"
        );

    if (!results) return;

    results.innerHTML = "";

    visibleAppEntries().forEach(([id, app]) => {

        const item =
            document.createElement("div");

        item.className = "start-item";
        item.dataset.app = id;

        item.innerHTML =
            `${app.icon} ${app.name}`;

        item.onclick = () => {

            launchApp(id);

            document
                .getElementById(
                    "start-menu"
                )
                .classList
                .remove("show");
        };

        results.appendChild(item);

    });

}

/* =========================================================
   START MENU SEARCH
========================================================= */

function initStartMenu() {

    const btn =
        document.getElementById(
            "start-btn"
        );

    const menu =
        document.getElementById(
            "start-menu"
        );

    const search =
        document.getElementById(
            "start-search"
        );

    btn.onclick = e => {

        e.stopPropagation();

        menu.classList.toggle("show");

        search.focus();

    };

    document.addEventListener(
        "click",
        () => menu.classList.remove("show")
    );

    search.addEventListener(
        "input",
        () => {

            const q =
                search.value
                .toLowerCase();

            document
                .querySelectorAll(
                    ".start-item"
                )
                .forEach(item => {

                    item.style.display =
                        item.textContent
                            .toLowerCase()
                            .includes(q)
                        ? ""
                        : "none";

                });

        }
    );

}

/* =========================================================
   CLOCK
========================================================= */

function initClock() {

    const clock =
        document.getElementById(
            "clock"
        );

    const update = () => {

        clock.textContent =
            new Date()
            .toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            });

    };

    update();

    setInterval(update, 1000);

}



/* =========================================================
   THEMES
========================================================= */

function applyTheme() {

    document.body.dataset.theme =
        activeTheme;

}

window.setTheme = function(name) {

    activeTheme = name;

    localStorage.setItem(
        "40_theme",
        name
    );

    applyTheme();

};

/* =========================================================
   SYSTEM COMMANDS
========================================================= */

window.restartOS = function () {

    location.reload();

};

window.logoutUser = function () {

    localStorage.removeItem(
        "40_username"
    );

    localStorage.removeItem(
        "40_session"
    );

    localStorage.removeItem("40_executive_verified");
    localStorage.removeItem("40_executive_admin");
    localStorage.removeItem("40_executive_verified_at");

    location.href =
        "index.html";

};

/* =========================================================
   GLOBALS
========================================================= */


window.APPS = APPS;
window.fileSystem = fileSystem;
window.openWindows = openWindows;
window.renderDesktop = renderDesktop;
window.renderStartMenu = renderStartMenu;
window.refreshEditionVisibility = function () {
    renderDesktop();
    renderStartMenu();

    document.querySelectorAll(".window").forEach(win => {
        const appId = win.dataset.app;

        if (appId && APPS[appId] && !canSeeApp(APPS[appId])) {
            removeTaskbarButton(win);
            win.remove();
        }
    });

    saveSession();
};

/* =========================================================
   PART 2
   WINDOW MANAGER
========================================================= */

let dragState = null;
let resizeState = null;

/* =========================================================
   OPEN WINDOW
========================================================= */

window.openWindow = function (
    title,
    html,
    app = ""
) {

    const container =
        document.getElementById(
            "windows-container"
        );

    const win =
        document.createElement("div");

    win.className = "window";

    win.dataset.app = app;

    win.style.left = "100px";
    win.style.top = "80px";

    win.style.width = "500px";
    win.style.height = "350px";

    win.style.zIndex =
        ++zIndexCounter;

    win.innerHTML = `

        <div class="title-bar">

            <span>${title}</span>

            <div>

                <button class="min-btn">
                    _
                </button>

                <button class="max-btn">
                    □
                </button>

                <button class="close-btn">
                    X
                </button>

            </div>

        </div>

        <div class="window-content">
            ${html}
        </div>

        <div class="resize-handle">
        </div>

    `;

    container.appendChild(win);

    createTaskbarButton(
        win,
        title
    );

    attachWindowEvents(
        win
    );

    openWindows.push(win);

    saveSession();

    return win;
};

/* =========================================================
   WINDOW EVENTS
========================================================= */

function attachWindowEvents(win) {

    const titleBar =
        win.querySelector(
            ".title-bar"
        );

    const closeBtn =
        win.querySelector(
            ".close-btn"
        );

    const minBtn =
        win.querySelector(
            ".min-btn"
        );

    const maxBtn =
        win.querySelector(
            ".max-btn"
        );

    const resizeHandle =
        win.querySelector(
            ".resize-handle"
        );

    titleBar.onmousedown =
        e => {

            dragState = {

                win,

                offsetX:
                    e.clientX -
                    win.offsetLeft,

                offsetY:
                    e.clientY -
                    win.offsetTop

            };

        };

    resizeHandle.onmousedown =
        e => {

            e.preventDefault();

            resizeState = {

                win,

                startX:
                    e.clientX,

                startY:
                    e.clientY,

                width:
                    win.offsetWidth,

                height:
                    win.offsetHeight

            };

        };

    closeBtn.onclick =
        () => {

            removeTaskbarButton(
                win
            );

            win.remove();

            saveSession();

        };

    minBtn.onclick =
        () => {

            win.style.display =
                "none";

            win.dataset.minimized =
                "true";

            saveSession();

        };

    maxBtn.onclick =
        () => {

            toggleMaximize(
                win
            );

        };

    win.onmousedown =
        () => {

            win.style.zIndex =
                ++zIndexCounter;

        };

}

/* =========================================================
   DRAGGING
========================================================= */

document.addEventListener(
    "mousemove",
    e => {

        if (dragState) {

            const win =
                dragState.win;

            win.style.left =
                (
                    e.clientX -
                    dragState.offsetX
                ) + "px";

            win.style.top =
                (
                    e.clientY -
                    dragState.offsetY
                ) + "px";

        }

        if (resizeState) {

            const win =
                resizeState.win;

            const dx =
                e.clientX -
                resizeState.startX;

            const dy =
                e.clientY -
                resizeState.startY;

            win.style.width =
                Math.max(
                    250,
                    resizeState.width + dx
                ) + "px";

            win.style.height =
                Math.max(
                    180,
                    resizeState.height + dy
                ) + "px";

        }

    }
);

document.addEventListener(
    "mouseup",
    () => {

        dragState = null;
        resizeState = null;

        saveSession();

    }
);

/* =========================================================
   MAXIMIZE
========================================================= */

function toggleMaximize(win) {

    if (
        win.dataset.maximized ===
        "true"
    ) {

        win.style.left =
            win.dataset.left;

        win.style.top =
            win.dataset.top;

        win.style.width =
            win.dataset.width;

        win.style.height =
            win.dataset.height;

        win.dataset.maximized =
            "false";
    }
    else {

        win.dataset.left =
            win.style.left;

        win.dataset.top =
            win.style.top;

        win.dataset.width =
            win.style.width;

        win.dataset.height =
            win.style.height;

        win.style.left = "0";

        win.style.top = "0";

        win.style.width =
            "100vw";

        win.style.height =
            "calc(100vh - 40px)";

        win.dataset.maximized =
            "true";
    }

    saveSession();
}

/* =========================================================
   TASKBAR
========================================================= */

function createTaskbarButton(
    win,
    title
) {

    const bar =
        document.getElementById(
            "taskbar-apps"
        );

    const btn =
        document.createElement(
            "button"
        );

    btn.className =
        "taskbar-item";

    btn.textContent =
        title;

    btn.onclick =
        () => {

            if (
                win.dataset.minimized ===
                "true"
            ) {

                win.style.display =
                    "";

                win.dataset.minimized =
                    "false";
            }
            else {

                win.style.display =
                    "none";

                win.dataset.minimized =
                    "true";
            }

            saveSession();

        };

    win.taskbarButton =
        btn;

    bar.appendChild(btn);

}

function removeTaskbarButton(
    win
) {

    if (
        win.taskbarButton
    ) {

        win.taskbarButton.remove();

    }

}

/* =========================================================
   SESSION SAVE
========================================================= */

function saveSession() {

    const data = [];

    document
        .querySelectorAll(
            ".window"
        )
        .forEach(win => {

            data.push({

                app:
                    win.dataset.app,

                title:
                    win.querySelector(
                        ".title-bar span"
                    ).textContent,

                left:
                    win.style.left,

                top:
                    win.style.top,

                width:
                    win.style.width,

                height:
                    win.style.height,

                minimized:
                    win.dataset.minimized,

                maximized:
                    win.dataset.maximized

            });

        });

    localStorage.setItem(
        "40_window_session",
        JSON.stringify(data)
    );

}

window.saveSession =
    saveSession;

/* =========================================================
   PART 3
   SESSIONS + DESKTOP FEATURES
========================================================= */

/* =========================================================
   SESSION RESTORE
========================================================= */

async function restoreSession() {

    const raw =
        localStorage.getItem(
            "40_window_session"
        );

    if (!raw) return;

    let session = [];

    try {

        session =
            JSON.parse(raw);

    }
    catch {

        return;

    }

    session.forEach(data => {

        if (data.app && APPS[data.app] && !canSeeApp(APPS[data.app])) {
            return;
        }

        let html =
            `<div style="padding:20px">
                Restored window
            </div>`;

        const win =
            openWindow(
                data.title,
                html,
                data.app
            );

        win.style.left =
            data.left;

        win.style.top =
            data.top;

        win.style.width =
            data.width;

        win.style.height =
            data.height;

        if (
            data.minimized ===
            "true"
        ) {

            win.style.display =
                "none";

            win.dataset.minimized =
                "true";
        }

        if (
            data.maximized ===
            "true"
        ) {

            toggleMaximize(
                win
            );
        }

    });

    notify(
        "System",
        "Session restored."
    );

}

/* =========================================================
   RESTORE ON BOOT
========================================================= */

window.addEventListener(
    "DOMContentLoaded",
    () => {

        setTimeout(() => {

            restoreSession();

        }, 500);

    }
);

/* =========================================================
   DESKTOP CONTEXT MENU
========================================================= */

const contextMenu =
    document.getElementById(
        "context-menu"
    );

document
    .getElementById(
        "desktop"
    )
    .addEventListener(
        "contextmenu",
        e => {

            e.preventDefault();

            contextMenu.style.left =
                e.clientX + "px";

            contextMenu.style.top =
                e.clientY + "px";

            contextMenu.innerHTML = `

                <div class="context-item"
                     onclick="refreshDesktop()">
                    Refresh
                </div>

                <div class="context-item"
                     onclick="openFileExplorer()">
                    Open Files
                </div>

                <div class="context-item"
                     onclick="openSystemApp()">
                    System Settings
                </div>

                <div class="context-item"
                     onclick="cycleWallpaper()">
                    Change Wallpaper
                </div>

            `;

            contextMenu.classList.add(
                "show"
            );

        }
    );

document.addEventListener(
    "click",
    () => {

        contextMenu.classList.remove(
            "show"
        );

    }
);

/* =========================================================
   DESKTOP REFRESH
========================================================= */

window.refreshDesktop =
    function () {

        renderDesktop();

        notify(
            "Desktop",
            "Desktop refreshed."
        );

    };

/* =========================================================
   POPUP NOTIFICATIONS
   Disabled in EmeraldOS. Toast notifications are handled by
   the unified notify() function near the top of this file.
========================================================= */

/* =========================================================
   WALLPAPER SYSTEM
========================================================= */

const wallpapers = [

    "#008080",

    "linear-gradient(#005c3c,#008060)",

    "linear-gradient(#000040,#101060)",

    "linear-gradient(#202020,#505050)",

    "linear-gradient(#004400,#002200)"

];

let wallpaperIndex =
    parseInt(
        localStorage.getItem(
            "40_wallpaper"
        ) || 0
    );

function applyWallpaper() {

    document.body.style.background =
        wallpapers[
            wallpaperIndex
        ];

}

window.cycleWallpaper =
    function () {

        wallpaperIndex++;

        if (
            wallpaperIndex >=
            wallpapers.length
        ) {

            wallpaperIndex = 0;

        }

        localStorage.setItem(
            "40_wallpaper",
            wallpaperIndex
        );

        applyWallpaper();

        notify(
            "Wallpaper",
            "Wallpaper changed."
        );

    };

applyWallpaper();

/* =========================================================
   DESKTOP ICON SIZE
========================================================= */

window.setIconSize =
    function (size) {

        document
            .querySelectorAll(
                ".icon"
            )
            .forEach(icon => {

                icon.style.width =
                    size + "px";

                icon.style.fontSize =
                    (size / 5) + "px";

            });

    };

/* =========================================================
   QUICK STARTUP APPS
========================================================= */

function launchStartupApps() {

    const startup = JSON.parse(
        localStorage.getItem(
            "40_startup"
        ) || "[]"
    );

    startup.forEach(app => {

        if (
            APPS[app] &&
            canSeeApp(APPS[app])
        ) {

            launchApp(app);

        }

    });

}

/* =========================================================
   REGISTER STARTUP APP
========================================================= */

window.addStartupApp =
    function (app) {

        const list =
            JSON.parse(
                localStorage.getItem(
                    "40_startup"
                ) || "[]"
            );

        if (
            !APPS[app] ||
            !canSeeApp(APPS[app])
        ) {
            return;
        }

        if (
            !list.includes(app)
        ) {

            list.push(app);

        }

        localStorage.setItem(
            "40_startup",
            JSON.stringify(
                list
            )
        );

    };

/* =========================================================
   FINAL BOOT PATCH
========================================================= */

window.addEventListener(
    "DOMContentLoaded",
    () => {

        applyWallpaper();

        launchStartupApps();

        notify(
            "EmeraldOS",
            "Desktop initialized."
        );

    }
);

/* =========================================================
   PART 4
   FILE SYSTEM + FOLDERS
========================================================= */

if (!fileSystem.folders) {

    fileSystem.folders = {
        Desktop: [],
        Documents: [],
        Pictures: [],
        Downloads: [],
        Trash: []
    };

}

let currentFolder = "Desktop";

/* =========================================================
   OPEN FILE EXPLORER
========================================================= */

window.openFileExplorer = function () {

    openWindow(
        "File Explorer",
        renderFileExplorer(),
        "files"
    );

};

/* =========================================================
   RENDER FILE EXPLORER
========================================================= */

function renderFileExplorer() {

    const folderFiles =
        Object.entries(fileSystem.files)
            .filter(([id, file]) => {

                return (
                    file.folder ||
                    "Desktop"
                ) === currentFolder;

            });

    return `

    <div class="split">

        <div class="sidebar">

            <h3>Folders</h3>

            ${Object.keys(
                fileSystem.folders
            ).map(folder => `

                <div
                    class="folder-item"
                    onclick="openFolder('${folder}')">

                    📁 ${folder}

                </div>

            `).join("")}

        </div>

        <div class="main">

            <div style="padding:4px">

                <button onclick="createFolder()">
                    New Folder
                </button>

                <button onclick="createFile()">
                    New File
                </button>

                <button onclick="uploadFile()">
                    Upload
                </button>

                <input
                    id="file_search"
                    placeholder="Search files"
                    oninput="searchFiles()">

            </div>

            <hr>

            <div id="file_list">

                ${folderFiles.map(([id, file]) => `

                    <div
                        class="file-row">

                        <span>

                            ${
                                file.type === "image"
                                ? "🖼️"
                                : file.type === "video"
                                ? "🎬"
                                : "📄"
                            }

                            ${file.name}

                        </span>

                        <div>

                            <button
                                onclick="openFile('${id}')">
                                Open
                            </button>

                            <button
                                onclick="moveFile('${id}')">
                                Move
                            </button>

                            <button
                                onclick="showProperties('${id}')">
                                Info
                            </button>

                            <button
                                onclick="deleteFile('${id}')">
                                Delete
                            </button>

                        </div>

                    </div>

                `).join("")}

            </div>

        </div>

    </div>

    `;

}

/* =========================================================
   OPEN FOLDER
========================================================= */

window.openFolder = function (
    folder
) {

    currentFolder =
        folder;

    rerenderExplorer();

};

/* =========================================================
   RERENDER
========================================================= */

function rerenderExplorer() {

    const win =
        document.querySelector(
            '.window[data-app="files"] .window-content'
        );

    if (!win) return;

    win.innerHTML =
        renderFileExplorer();

}

/* =========================================================
   CREATE FOLDER
========================================================= */

window.createFolder =
    function () {

        const name =
            prompt(
                "Folder name:"
            );

        if (!name) return;

        if (
            fileSystem.folders[name]
        ) {

            alert(
                "Folder exists."
            );

            return;

        }

        fileSystem.folders[name] =
            [];

        notify(
            "Folder",
            "Created " + name
        );

        rerenderExplorer();

    };

/* =========================================================
   MOVE FILE
========================================================= */

window.moveFile =
    async function (id) {

        const folder =
            prompt(
                "Move to folder:"
            );

        if (
            !folder ||
            !fileSystem.folders[
                folder
            ]
        ) {

            alert(
                "Folder not found."
            );

            return;

        }

        await cloudSaveFile(
            id,
            {
                folder
            }
        );

        await loadSystem();

        rerenderExplorer();

    };

/* =========================================================
   TRASH SYSTEM
========================================================= */

window.deleteFile =
    async function (id) {

        const file =
            fileSystem.files[id];

        if (!file) return;

        await cloudSaveFile(
            id,
            {
                folder: "Trash"
            }
        );

        notify(
            "Trash",
            file.name +
            " moved to trash."
        );

        await loadSystem();

        rerenderExplorer();

    };

/* =========================================================
   PERMANENT DELETE
========================================================= */

window.emptyTrash =
    async function () {

        const files =
            Object.entries(
                fileSystem.files
            );

        for (
            const [id, file]
            of files
        ) {

            if (
                file.folder ===
                "Trash"
            ) {

                await cloudDeleteFile(
                    id
                );

            }

        }

        await loadSystem();

        rerenderExplorer();

    };

/* =========================================================
   FILE SEARCH
========================================================= */

window.searchFiles =
    function () {

        const q =
            document
                .getElementById(
                    "file_search"
                )
                .value
                .toLowerCase();

        document
            .querySelectorAll(
                ".file-row"
            )
            .forEach(row => {

                row.style.display =
                    row.textContent
                        .toLowerCase()
                        .includes(q)
                    ? ""
                    : "none";

            });

    };

/* =========================================================
   FILE PROPERTIES
========================================================= */

window.showProperties =
    function (id) {

        const file =
            fileSystem.files[id];

        if (!file) return;

        openWindow(
            "Properties",

            `

            <h3>${file.name}</h3>

            <hr>

            <b>Type:</b>
            ${file.type || "Text"}

            <br><br>

            <b>Folder:</b>
            ${file.folder || "Desktop"}

            <br><br>

            <b>Created:</b>

            <br>

            ${
                new Date(
                    file.createdAt
                ).toLocaleString()
            }

            <br><br>

            <b>Updated:</b>

            <br>

            ${
                new Date(
                    file.updatedAt
                ).toLocaleString()
            }

            `

        );

    };

/* =========================================================
   DOWNLOADS SHORTCUT
========================================================= */

window.openDownloads =
    function () {

        currentFolder =
            "Downloads";

        openFileExplorer();

    };

/* =========================================================
   DOCUMENTS SHORTCUT
========================================================= */

window.openDocuments =
    function () {

        currentFolder =
            "Documents";

        openFileExplorer();

    };

/* =========================================================
   PICTURES SHORTCUT
========================================================= */

window.openPictures =
    function () {

        currentFolder =
            "Pictures";

        openFileExplorer();

    };

/* =========================================================
   PART 5
   PRODUCTIVITY SUITE
========================================================= */

let activeNote = null;
let activeDoc = null;

const recentFiles = JSON.parse(
    localStorage.getItem(
        "40_recent"
    ) || "[]"
);

/* =========================================================
   RECENT FILES
========================================================= */

function addRecent(id) {

    const index =
        recentFiles.indexOf(id);

    if (index !== -1) {
        recentFiles.splice(index, 1);
    }

    recentFiles.unshift(id);

    if (recentFiles.length > 10) {
        recentFiles.pop();
    }

    localStorage.setItem(
        "40_recent",
        JSON.stringify(recentFiles)
    );
}

/* =========================================================
   NOTES APP 2.0
========================================================= */

window.openNotes = function () {

    openWindow(
        "Notes",
        renderNotes(),
        "notes"
    );

};

function renderNotes() {

    const notes =
        Object.entries(fileSystem.files)
        .filter(([id, file]) =>
            file.app === "notes"
        );

    return `

    <div class="split">

        <div class="sidebar">

            <button onclick="createNote()">
                New Note
            </button>

            <hr>

            ${notes.map(([id, file]) => `

                <div
                    class="folder-item"
                    onclick="loadNote('${id}')">

                    📝 ${file.name}

                </div>

            `).join("")}

        </div>

        <div class="main">

            <input
                id="note_title"
                placeholder="Title">

            <textarea
                id="note_body"
                style="flex:1;height:100%;resize:none"></textarea>

            <div style="padding:5px">

                <button onclick="saveNote()">
                    Save
                </button>

            </div>

        </div>

    </div>

    `;
}

window.createNote =
async function () {

    activeNote =
        await cloudCreateFile(
            "New Note",
            ""
        );

    await cloudSaveFile(
        activeNote,
        {
            app: "notes"
        }
    );

    await loadSystem();

};

window.loadNote =
function (id) {

    activeNote = id;

    const file =
        fileSystem.files[id];

    document.getElementById(
        "note_title"
    ).value =
        file.name;

    document.getElementById(
        "note_body"
    ).value =
        file.content;

    addRecent(id);

};

window.saveNote =
async function () {

    if (!activeNote) return;

    await cloudSaveFile(
        activeNote,
        {
            name:
                document.getElementById(
                    "note_title"
                ).value,

            content:
                document.getElementById(
                    "note_body"
                ).value
        }
    );

    notify(
        "Notes",
        "Saved."
    );

    await loadSystem();

};

/* =========================================================
   AUTOSAVE
========================================================= */

setInterval(async () => {

    if (activeNote) {

        const body =
            document.getElementById(
                "note_body"
            );

        if (body) {

            await cloudSaveFile(
                activeNote,
                {
                    content:
                        body.value
                }
            );

        }

    }

}, 30000);

/* =========================================================
   DOCS 2.0
========================================================= */

window.openDocs =
function () {

    openWindow(
        "Documents",
        renderDocs(),
        "docs"
    );

};

function renderDocs() {

    const docs =
        Object.entries(fileSystem.files)
        .filter(([id, file]) =>
            file.app === "docs"
        );

    return `

    <div class="split">

        <div class="sidebar">

            <button onclick="createDoc()">
                New Doc
            </button>

            <hr>

            ${docs.map(([id,file]) => `

                <div
                    class="folder-item"
                    onclick="loadDoc('${id}')">

                    📄 ${file.name}

                </div>

            `).join("")}

        </div>

        <div class="main">

            <div class="toolbar">

                <button onclick="docBold()">
                    B
                </button>

                <button onclick="docItalic()">
                    I
                </button>

                <button onclick="docUnderline()">
                    U
                </button>

            </div>

            <input
                id="doc_title"
                placeholder="Title">

            <div
                id="doc_editor"
                contenteditable="true"
                style="
                    flex:1;
                    border:1px solid #888;
                    padding:8px;
                    overflow:auto;
                    background:white;
                ">
            </div>

            <button onclick="saveDoc()">
                Save
            </button>

        </div>

    </div>

    `;

}

window.createDoc =
async function () {

    activeDoc =
        await cloudCreateFile(
            "New Document",
            ""
        );

    await cloudSaveFile(
        activeDoc,
        {
            app: "docs"
        }
    );

    await loadSystem();

};

window.loadDoc =
function (id) {

    activeDoc = id;

    const file =
        fileSystem.files[id];

    document.getElementById(
        "doc_title"
    ).value =
        file.name;

    document.getElementById(
        "doc_editor"
    ).innerHTML =
        file.content;

    addRecent(id);

};

window.saveDoc =
async function () {

    if (!activeDoc) return;

    await cloudSaveFile(
        activeDoc,
        {
            name:
                document.getElementById(
                    "doc_title"
                ).value,

            content:
                document.getElementById(
                    "doc_editor"
                ).innerHTML
        }
    );

    notify(
        "Documents",
        "Saved."
    );

    await loadSystem();

};

/* =========================================================
   TEXT TOOLS
========================================================= */

window.docBold =
function () {

    document.execCommand(
        "bold"
    );

};

window.docItalic =
function () {

    document.execCommand(
        "italic"
    );

};

window.docUnderline =
function () {

    document.execCommand(
        "underline"
    );

};

/* =========================================================
   DOCUMENT AUTOSAVE
========================================================= */

setInterval(async () => {

    if (!activeDoc) return;

    const editor =
        document.getElementById(
            "doc_editor"
        );

    if (!editor) return;

    await cloudSaveFile(
        activeDoc,
        {
            content:
                editor.innerHTML
        }
    );

}, 30000);

/* =========================================================
   CALENDAR REMINDERS
========================================================= */

window.saveCalendarReminder =
async function () {

    const date =
        document.getElementById(
            "cal_date"
        ).value;

    const text =
        document.getElementById(
            "cal_note"
        ).value;

    const id =
        await cloudCreateFile(
            "Reminder",
            text
        );

    await cloudSaveFile(
        id,
        {
            app: "calendar",
            date
        }
    );

    notify(
        "Calendar",
        "Reminder saved."
    );

};

function checkReminders() {

    const today =
        new Date()
        .toISOString()
        .split("T")[0];

    Object.values(
        fileSystem.files
    ).forEach(file => {

        if (
            file.app === "calendar" &&
            file.date === today
        ) {

            notify(
                "Reminder",
                file.content
            );

        }

    });

}

setTimeout(
    checkReminders,
    3000
);

/* =========================================================
   RECENT FILES WINDOW
========================================================= */

window.openRecentFiles =
function () {

    let html = "";

    recentFiles.forEach(id => {

        const file =
            fileSystem.files[id];

        if (!file) return;

        html += `

        <div
            class="file-row">

            <span>
                ${file.name}
            </span>

            <button
                onclick="openFile('${id}')">

                Open

            </button>

        </div>

        `;

    });

    openWindow(
        "Recent Files",
        html
    );

};

/* =========================================================
   RECOVERY
========================================================= */

window.recoverDocument =
function (id) {

    const file =
        fileSystem.files[id];

    if (!file) return;

    if (file.app === "notes") {
        loadNote(id);
    }

    if (file.app === "docs") {
        loadDoc(id);
    }

};

/* =========================================================
   PART 6
   THEMES + WIDGETS + APP STORE
========================================================= */

let currentTheme =
    localStorage.getItem(
        "40_theme"
    ) || "classic";

/* =========================================================
   APPLY THEME
========================================================= */

window.applyTheme =
function(theme) {

    document.body.setAttribute(
        "data-theme",
        theme
    );

    currentTheme = theme;

    localStorage.setItem(
        "40_theme",
        theme
    );

    notify(
        "Theme",
        theme + " enabled"
    );

};

/* =========================================================
   THEMES PANEL
========================================================= */

window.openThemes =
function() {

    openWindow(
        "Themes",

        `
        <h3>Select Theme</h3>

        <button onclick="applyTheme('classic')">
            Classic
        </button>

        <button onclick="applyTheme('emerald')">
            Emerald
        </button>

        <button onclick="applyTheme('dark')">
            Dark
        </button>

        <button onclick="applyTheme('midnight')">
            Midnight
        </button>
        `
    );

};

/* =========================================================
   APP STORE
========================================================= */

const appStoreApps = [

    {
        name: "Paint",
        icon: "🎨"
    },

    {
        name: "Weather",
        icon: "☀️"
    },

    {
        name: "Music",
        icon: "🎵"
    },

    {
        name: "Terminal",
        icon: "💻"
    }

];

window.openAppStore =
function() {

    openWindow(
        "App Store",

        `
        <h3>EmeraldOS Store</h3>

        ${appStoreApps.map(app => `

            <div class="file-row">

                <span>
                    ${app.icon}
                    ${app.name}
                </span>

                <button
                    onclick="installApp('${app.name}')">

                    Install

                </button>

            </div>

        `).join("")}
        `
    );

};

window.installApp =
function(name) {

    notify(
        "App Store",
        name + " installed."
    );

};

/* =========================================================
   SYSTEM MONITOR
========================================================= */

window.openSystemMonitor =
function() {

    openWindow(
        "System Monitor",

        `
        <div id="system_stats">

            Loading...

        </div>
        `,

        "monitor"
    );

    updateMonitor();

};

function updateMonitor() {

    const el =
        document.getElementById(
            "system_stats"
        );

    if (!el) return;

    el.innerHTML = `

        <b>Windows:</b>
        ${
            document.querySelectorAll(
                ".window"
            ).length
        }

        <br><br>

        <b>Files:</b>
        ${
            Object.keys(
                fileSystem.files
            ).length
        }

        <br><br>

        <b>Theme:</b>
        ${currentTheme}

        <br><br>

        <b>Resolution:</b>

        ${window.innerWidth}
        x
        ${window.innerHeight}

    `;

    setTimeout(
        updateMonitor,
        1000
    );

}

/* =========================================================
   DESKTOP WIDGETS
========================================================= */

window.addClockWidget =
function() {

    const widget =
        document.createElement(
            "div"
        );

    widget.className =
        "desktop-widget";

    widget.id =
        "clock_widget";

    widget.innerHTML =
        new Date()
            .toLocaleTimeString();

    document
        .getElementById(
            "desktop"
        )
        .appendChild(
            widget
        );

};

setInterval(() => {

    const w =
        document.getElementById(
            "clock_widget"
        );

    if (w) {

        w.innerHTML =
            new Date()
                .toLocaleTimeString();

    }

}, 1000);

/* =========================================================
   WINDOW SNAPPING
========================================================= */

document.addEventListener(
    "mouseup",

    () => {

        document
            .querySelectorAll(
                ".window"
            )
            .forEach(win => {

                const left =
                    win.offsetLeft;

                if (left < 10) {

                    win.style.left =
                        "0px";

                    win.style.top =
                        "0px";

                    win.style.width =
                        "50%";

                    win.style.height =
                        "calc(100% - 40px)";
                }

                if (
                    left >
                    window.innerWidth - 50
                ) {

                    win.style.left =
                        "50%";

                    win.style.top =
                        "0px";

                    win.style.width =
                        "50%";

                    win.style.height =
                        "calc(100% - 40px)";
                }

            });

    }
);

/* =========================================================
   TERMINAL APP
========================================================= */

window.openTerminal =
function() {

    openWindow(
        "Terminal",

        `
        <div id="terminal_output">

            EmeraldOS Terminal

            <hr>

        </div>

        <input
            id="terminal_input"
            placeholder="Enter command"
            onkeydown="
                if(event.key==='Enter')
                runCommand(this.value)
            ">
        `
    );

};

window.runCommand =
function(cmd) {

    const output =
        document.getElementById(
            "terminal_output"
        );

    if (!output) return;

    let result =
        "Unknown command";

    if (cmd === "help") {

        result =
            "help, clear, version, files";

    }

    if (cmd === "version") {

        result =
            "EmeraldOS 3.2";

    }

    if (cmd === "files") {

        result =
            Object.keys(
                fileSystem.files
            ).length +
            " files";

    }

    if (cmd === "clear") {

        output.innerHTML =
            "";

        return;
    }

    output.innerHTML += `

        > ${cmd}

        <br>

        ${result}

        <br><br>

    `;

};

/* =========================================================
   UPDATE MANAGER
========================================================= */

window.openUpdates =
function() {

    openWindow(
        "Updates",

        `
        <h3>EmeraldOS Update Manager</h3>

        <p>
            Current Version:
            3.2
        </p>

        <button onclick="
            notify(
                'Updates',
                'No updates available.'
            )
        ">
            Check Updates
        </button>
        `
    );

};

/* =========================================================
   PART 7
   ADVANCED DESKTOP FEATURES
========================================================= */

let currentDesktop = 1;
let desktopCount = 3;

let lockEnabled = false;

/* =========================================================
   VIRTUAL DESKTOPS
========================================================= */

window.switchDesktop = function(num) {

    currentDesktop = num;

    document
        .querySelectorAll(".window")
        .forEach(win => {

            const desktop =
                parseInt(
                    win.dataset.desktop || 1
                );

            win.style.display =
                desktop === currentDesktop
                ? "flex"
                : "none";

        });

    notify(
        "Desktop",
        "Desktop " + num
    );

};

function assignDesktop(win) {

    win.dataset.desktop =
        currentDesktop;

}

/* =========================================================
   TASK MANAGER
========================================================= */

window.openTaskManager =
function() {

    openWindow(
        "Task Manager",

        `
        <div id="task_manager">

        </div>
        `,

        "taskmgr"
    );

    updateTaskManager();

};

function updateTaskManager() {

    const el =
        document.getElementById(
            "task_manager"
        );

    if (!el) return;

    let html = "";

    document
        .querySelectorAll(".window")
        .forEach((win,index) => {

            const title =
                win.querySelector(
                    ".title-bar span"
                )?.textContent || "App";

            html += `

            <div class="file-row">

                <span>

                    ${title}

                </span>

                <button
                    onclick="killWindow(${index})">

                    End Task

                </button>

            </div>

            `;

        });

    el.innerHTML = html;

    setTimeout(
        updateTaskManager,
        1000
    );

}

window.killWindow =
function(index) {

    const windows =
        document.querySelectorAll(
            ".window"
        );

    if (windows[index]) {

        windows[index].remove();

        notify(
            "Task Manager",
            "Application closed."
        );

    }

};

/* =========================================================
   LOCK SCREEN
========================================================= */

window.lockOS =
function() {

    if (lockEnabled)
        return;

    lockEnabled = true;

    const screen =
        document.createElement(
            "div"
        );

    screen.id =
        "lock_screen";

    screen.innerHTML = `

        <div class="lock-panel">

            <h2>
                EmeraldOS Locked
            </h2>

            <input
                id="unlock_input"
                type="password"
                placeholder="Password">

            <br><br>

            <button
                onclick="unlockOS()">

                Unlock

            </button>

        </div>

    `;

    document.body.appendChild(
        screen
    );

};

window.unlockOS =
function() {

    const pass =
        document.getElementById(
            "unlock_input"
        ).value;

    if (pass.length < 1) {

        alert(
            "Enter password."
        );

        return;
    }

    const lock =
        document.getElementById(
            "lock_screen"
        );

    if (lock)
        lock.remove();

    lockEnabled = false;

};

/* =========================================================
   DESKTOP SHORTCUTS
========================================================= */

window.createShortcut =
function(name, action) {

    const icon =
        document.createElement(
            "div"
        );

    icon.className =
        "icon";

    icon.innerHTML =
        "⚡<br>" + name;

    icon.onclick =
        action;

    document
        .getElementById(
            "desktop"
        )
        .appendChild(
            icon
        );

};

window.addTerminalShortcut =
function() {

    createShortcut(
        "Terminal",
        openTerminal
    );

};

window.addMonitorShortcut =
function() {

    createShortcut(
        "Monitor",
        openSystemMonitor
    );

};

/* =========================================================
   SIMPLE PAINT APP
========================================================= */

window.openPaint =
function() {

    openWindow(
        "Paint",

        `
        <canvas
            id="paint_canvas"
            width="700"
            height="400"
            style="
                border:1px solid black;
                background:white;
            ">
        </canvas>

        <br><br>

        <button
            onclick="clearPaint()">

            Clear

        </button>
        `,

        "paint"
    );

    setTimeout(
        initPaint,
        100
    );

};

function initPaint() {

    const canvas =
        document.getElementById(
            "paint_canvas"
        );

    if (!canvas)
        return;

    const ctx =
        canvas.getContext("2d");

    let drawing =
        false;

    canvas.onmousedown =
        () => drawing = true;

    canvas.onmouseup =
        () => drawing = false;

    canvas.onmousemove =
        e => {

            if (!drawing)
                return;

            const rect =
                canvas.getBoundingClientRect();

            ctx.fillRect(
                e.clientX - rect.left,
                e.clientY - rect.top,
                3,
                3
            );

        };

}

window.clearPaint =
function() {

    const canvas =
        document.getElementById(
            "paint_canvas"
        );

    if (!canvas)
        return;

    canvas
        .getContext("2d")
        .clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

};

/* =========================================================
   ENHANCED OPEN WINDOW
========================================================= */

const oldOpenWindow =
    window.openWindow;

window.openWindow =
function(
    title,
    html,
    app = ""
) {

    const win =
        oldOpenWindow(
            title,
            html,
            app
        );

    if (win) {

        assignDesktop(
            win
        );

    }

    return win;

};

/* =========================================================
   START MENU ADDITIONS
========================================================= */

window.openDesktopManager =
function() {

    openWindow(
        "Virtual Desktops",

        `
        <h3>
            Desktops
        </h3>

        <button
            onclick="switchDesktop(1)">
            Desktop 1
        </button>

        <button
            onclick="switchDesktop(2)">
            Desktop 2
        </button>

        <button
            onclick="switchDesktop(3)">
            Desktop 3
        </button>
        `
    );

};

/* =========================================================
   PART 8
   ADVANCED DESKTOP SERVICES
========================================================= */

let installedApps =
    JSON.parse(
        localStorage.getItem(
            "40_apps"
        ) || "[]"
    );

let wallpaper =
    localStorage.getItem(
        "40_wallpaper"
    );

/* =========================================================
   WALLPAPER MANAGER
========================================================= */

window.openWallpaperManager =
function() {

    openWindow(
        "Wallpaper Manager",

        `
        <h3>Wallpapers</h3>

        <button onclick="setWallpaper('#008080')">
            Classic
        </button>

        <button onclick="setWallpaper('#004b2d')">
            Emerald
        </button>

        <button onclick="setWallpaper('#202020')">
            Dark
        </button>

        <hr>

        <input
            id="wallpaper_url"
            placeholder="Image URL">

        <button
            onclick="applyWallpaperURL()">

            Apply Image

        </button>
        `
    );

};

window.setWallpaper =
function(color) {

    document.body.style.background =
        color;

    localStorage.setItem(
        "40_wallpaper",
        color
    );

};

window.applyWallpaperURL =
function() {

    const url =
        document.getElementById(
            "wallpaper_url"
        ).value;

    document.body.style.background =
        `url('${url}') center center / cover`;

    localStorage.setItem(
        "40_wallpaper",
        url
    );

};

/* =========================================================
   LOAD WALLPAPER
========================================================= */

function loadWallpaper() {

    if (!wallpaper)
        return;

    if (
        wallpaper.startsWith(
            "http"
        )
    ) {

        document.body.style.background =
            `url('${wallpaper}') center center / cover`;

    } else {

        document.body.style.background =
            wallpaper;

    }

}

loadWallpaper();

/* =========================================================
   PACKAGE MANAGER
========================================================= */

window.openPackageManager =
function() {

    openWindow(
        "Package Manager",

        renderPackages()
    );

};

function renderPackages() {

    return `

    <h3>
        Installed Apps
    </h3>

    ${installedApps.map(app => `

        <div class="file-row">

            <span>
                ${app}
            </span>

            <button
                onclick="removeApp('${app}')">

                Remove

            </button>

        </div>

    `).join("")}

    `;

}

window.installApp =
function(name) {

    if (
        installedApps.includes(
            name
        )
    ) {

        notify(
            "App Store",
            "Already installed."
        );

        return;

    }

    installedApps.push(
        name
    );

    localStorage.setItem(
        "40_apps",
        JSON.stringify(
            installedApps
        )
    );

    notify(
        "App Store",
        name + " installed."
    );

};

window.removeApp =
function(name) {

    installedApps =
        installedApps.filter(
            a => a !== name
        );

    localStorage.setItem(
        "40_apps",
        JSON.stringify(
            installedApps
        )
    );

    notify(
        "Package Manager",
        name + " removed."
    );

};

/* =========================================================
   EMERALDNET
========================================================= */

window.openEmeraldNet =
function() {

    openWindow(

        "EmeraldNet",

        `
        <div style="height:100%;display:flex;flex-direction:column">

            <input
                id="browser_url"
                value="https://example.com"
                placeholder="Address">

            <button
                onclick="loadEmeraldNet()">

                Go

            </button>

            <iframe
                id="browser_frame"
                style="
                    flex:1;
                    border:none;
                ">
            </iframe>

        </div>
        `,

        "browser"
    );

};

window.loadEmeraldNet =
function() {

    const url =
        document.getElementById(
            "browser_url"
        ).value;

    const frame =
        document.getElementById(
            "browser_frame"
        );

    frame.src = url;

};

/* =========================================================
   MEDIA LIBRARY
========================================================= */

window.openMediaLibrary =
function() {

    const media =
        Object.entries(
            fileSystem.files
        ).filter(([id,file]) => {

            return (
                file.type === "image" ||
                file.type === "video"
            );

        });

    openWindow(

        "Media Library",

        media.map(([id,file]) => `

            <div
                class="file-row">

                <span>
                    ${file.name}
                </span>

                <button
                    onclick="openFile('${id}')">

                    Open

                </button>

            </div>

        `).join("")

    );

};

/* =========================================================
   DESKTOP ICON DRAGGING
========================================================= */

let iconDrag = null;

document
    .querySelectorAll(".icon")
    .forEach(icon => {

        icon.onmousedown =
        function(e) {

            iconDrag = {

                icon,

                x:
                    e.offsetX,

                y:
                    e.offsetY

            };

        };

    });

document.addEventListener(
    "mousemove",

    e => {

        if (!iconDrag)
            return;

        iconDrag.icon.style.position =
            "absolute";

        iconDrag.icon.style.left =
            (e.clientX -
             iconDrag.x) +
            "px";

        iconDrag.icon.style.top =
            (e.clientY -
             iconDrag.y) +
            "px";

    }
);

document.addEventListener(
    "mouseup",

    () => {

        iconDrag = null;

    }
);

/* =========================================================
   APP SHORTCUTS
========================================================= */

window.installShortcut =
function(name, fn) {

    createShortcut(
        name,
        fn
    );

};

/* =========================================================
   SAFE MODE
========================================================= */

window.safeMode =
function() {

    clearWindows();

    document.body.setAttribute(
        "data-theme",
        "classic"
    );

    notify(
        "Safe Mode",
        "System recovered."
    );

};

/* =========================================================
   RECOVERY MODE
========================================================= */

window.recoveryMode =
function() {

    openWindow(

        "Recovery",

        `

        <h3>
            EmeraldOS Recovery
        </h3>

        <button onclick="safeMode()">
            Safe Mode
        </button>

        <button onclick="restartOS()">
            Restart
        </button>

        <button onclick="
            localStorage.clear();
            location.reload();
        ">
            Factory Reset
        </button>

        `
    );

};


/* =========================================================
   EMERALDOS 5.3 DEVELOPER EDITION PATCH
   - Dedicated Developer edition
   - Rebuilt Files app
   - Desktop file icons
   - Movable desktop items with saved positions
========================================================= */

(function () {
    "use strict";

    const DESKTOP_POS_KEY = "40_desktop_positions_v2";
    const DESKTOP_GRID = { x: 12, y: 12, gapY: 86, gapX: 86, columns: 7 };

    function safeHTML(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function getPositions() {
        try {
            return JSON.parse(localStorage.getItem(DESKTOP_POS_KEY) || "{}");
        } catch {
            return {};
        }
    }

    function savePositions(data) {
        localStorage.setItem(DESKTOP_POS_KEY, JSON.stringify(data));
    }

    function defaultPosition(index) {
        const row = index % 6;
        const col = Math.floor(index / 6);
        return {
            left: DESKTOP_GRID.x + (col * DESKTOP_GRID.gapX),
            top: DESKTOP_GRID.y + (row * DESKTOP_GRID.gapY)
        };
    }

    function getFileFolder(file) {
        return file.folder || file.parent || "Desktop";
    }

    function isDesktopFile(file) {
        return getFileFolder(file).toLowerCase() === "desktop" || file.showOnDesktop === true;
    }

    function getFileIcon(file) {
        const type = String(file.type || "").toLowerCase();
        const name = String(file.name || "").toLowerCase();

        if (type === "folder") return "📁";
        if (type.includes("image") || /\.(png|jpg|jpeg|gif|webp|svg)$/.test(name)) return "🖼️";
        if (type.includes("video") || /\.(mp4|webm|mov)$/.test(name)) return "🎬";
        if (type.includes("audio") || /\.(mp3|wav|ogg)$/.test(name)) return "🎵";
        if (/\.(note)$/.test(name) || file.app === "notes") return "📝";
        if (/\.(doc|docs|html)$/.test(name) || file.app === "docs") return "📘";
        if (/\.(js|css|json|html)$/.test(name)) return "</>";
        return "📄";
    }

    function makeDesktopIcon({ key, icon, label, onOpen, itemType, id }, index) {
        const desktop = document.getElementById("desktop");
        if (!desktop) return null;

        const positions = getPositions();
        const pos = positions[key] || defaultPosition(index);

        const el = document.createElement("div");
        el.className = "icon desktop-item";
        el.dataset.desktopKey = key;
        el.dataset.itemType = itemType || "app";
        if (id) el.dataset.itemId = id;
        el.style.position = "absolute";
        el.style.left = (parseInt(pos.left, 10) || 0) + "px";
        el.style.top = (parseInt(pos.top, 10) || 0) + "px";
        el.innerHTML = `<div class="desktop-icon-symbol">${safeHTML(icon)}</div><div class="desktop-icon-label">${safeHTML(label)}</div>`;

        let drag = null;
        let moved = false;

        el.addEventListener("mousedown", e => {
            if (e.button !== 0) return;
            e.preventDefault();
            moved = false;
            drag = {
                startX: e.clientX,
                startY: e.clientY,
                left: parseInt(el.style.left, 10) || 0,
                top: parseInt(el.style.top, 10) || 0
            };
            el.classList.add("dragging");
        });

        document.addEventListener("mousemove", e => {
            if (!drag) return;
            const dx = e.clientX - drag.startX;
            const dy = e.clientY - drag.startY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
            const maxLeft = Math.max(0, window.innerWidth - 86);
            const maxTop = Math.max(0, window.innerHeight - 126);
            el.style.left = Math.min(maxLeft, Math.max(0, drag.left + dx)) + "px";
            el.style.top = Math.min(maxTop, Math.max(0, drag.top + dy)) + "px";
        });

        document.addEventListener("mouseup", () => {
            if (!drag) return;
            drag = null;
            el.classList.remove("dragging");
            const data = getPositions();
            data[key] = {
                left: parseInt(el.style.left, 10) || 0,
                top: parseInt(el.style.top, 10) || 0
            };
            savePositions(data);
        });

        el.addEventListener("dblclick", e => {
            e.preventDefault();
            if (typeof onOpen === "function") onOpen();
        });

        el.addEventListener("click", e => {
            if (moved) {
                e.preventDefault();
                return;
            }
            document.querySelectorAll(".desktop-item.selected").forEach(item => item.classList.remove("selected"));
            el.classList.add("selected");
        });

        desktop.appendChild(el);
        return el;
    }

    function getVisibleAppEntriesSafe() {
        const apps = window.APPS || {};
        return Object.entries(apps).filter(([id, app]) => {
            if (typeof window.canSeeApp === "function") return window.canSeeApp(app);
            if (typeof window.canSeeEdition === "function") return window.canSeeEdition(app.edition || "home");
            return true;
        });
    }

    function enhancedRenderDesktop() {
        const desktop = document.getElementById("desktop");
        if (!desktop) return;
        desktop.innerHTML = "";

        let index = 0;
        getVisibleAppEntriesSafe().forEach(([id, app]) => {
            makeDesktopIcon({
                key: "app:" + id,
                icon: app.icon || "□",
                label: app.name || id,
                itemType: "app",
                id,
                onOpen: () => {
                    if (typeof window.launchApp === "function") window.launchApp(id);
                    else if (app.launch) app.launch();
                }
            }, index++);
        });

        Object.entries(window.fileSystem?.files || {}).forEach(([id, file]) => {
            if (!isDesktopFile(file)) return;
            makeDesktopIcon({
                key: "file:" + id,
                icon: getFileIcon(file),
                label: file.name || "Untitled",
                itemType: "file",
                id,
                onOpen: () => window.openFile(id)
            }, index++);
        });
    }

    function enhancedRenderStartMenu() {
        const results = document.getElementById("start-results");
        if (!results) return;
        results.innerHTML = "";

        getVisibleAppEntriesSafe().forEach(([id, app]) => {
            const item = document.createElement("div");
            item.className = "start-item";
            item.dataset.app = id;
            item.innerHTML = `${safeHTML(app.icon || "□")} ${safeHTML(app.name || id)}`;
            item.onclick = () => {
                if (typeof window.launchApp === "function") window.launchApp(id);
                else if (app.launch) app.launch();
                const menu = document.getElementById("start-menu");
                if (menu) menu.classList.remove("show");
            };
            results.appendChild(item);
        });
    }

    function refreshDesktopAndExplorer() {
        enhancedRenderDesktop();
        enhancedRenderStartMenu();
        rerenderEnhancedExplorer();
    }

    window.renderDesktop = enhancedRenderDesktop;
    window.renderStartMenu = enhancedRenderStartMenu;
    window.refreshEditionVisibility = function () {
        enhancedRenderDesktop();
        enhancedRenderStartMenu();

        document.querySelectorAll(".window").forEach(win => {
            const appId = win.dataset.app;
            const app = window.APPS?.[appId];
            if (app && typeof window.canSeeApp === "function" && !window.canSeeApp(app)) {
                if (win.taskbarButton) win.taskbarButton.remove();
                win.remove();
            }
        });

        if (typeof window.saveSession === "function") window.saveSession();
    };

    /* -----------------------------------------------------
       Developer edition applications
    ----------------------------------------------------- */

    window.openCodeStudio = function () {
        window.openWindow("Code Studio", `
            <div class="code-studio">
                <div class="toolbar">
                    <button onclick="codeStudioNewFile()">New Code File</button>
                    <button onclick="codeStudioSaveActive()">Save Active</button>
                </div>
                <div class="code-layout">
                    <div class="code-sidebar" id="codeStudioFiles"></div>
                    <textarea id="codeStudioEditor" spellcheck="false" placeholder="Select or create a code file..."></textarea>
                </div>
            </div>
        `, "codeStudio");
        renderCodeStudioFiles();
    };

    window.renderCodeStudioFiles = renderCodeStudioFiles;
    function renderCodeStudioFiles() {
        const list = document.getElementById("codeStudioFiles");
        if (!list) return;
        const codeFiles = Object.entries(window.fileSystem?.files || {}).filter(([id, f]) => /\.(js|css|html|json|md|txt)$/i.test(f.name || ""));
        list.innerHTML = codeFiles.map(([id, f]) => `<div class="folder-item" onclick="codeStudioLoad('${id}')">${safeHTML(f.name)}</div>`).join("") || "<div style='padding:8px;'>No code files yet.</div>";
    }

    window.codeStudioLoad = function (id) {
        const file = window.fileSystem.files[id];
        const editor = document.getElementById("codeStudioEditor");
        if (!file || !editor) return;
        editor.dataset.fileId = id;
        editor.value = file.content || "";
    };

    window.codeStudioNewFile = async function () {
        const name = prompt("Code file name:", "script.js");
        if (!name) return;
        const id = await cloudCreateFile(name, "");
        if (!id) return;
        await cloudSaveFile(id, { folder: "Desktop", showOnDesktop: true, app: "code", type: "text/plain" });
        await loadSystem();
        renderCodeStudioFiles();
        refreshDesktopAndExplorer();
        window.codeStudioLoad(id);
        notify("Code Studio", "Code file created.", 3000, "success");
    };

    window.codeStudioSaveActive = async function () {
        const editor = document.getElementById("codeStudioEditor");
        if (!editor || !editor.dataset.fileId) return;
        await cloudSaveFile(editor.dataset.fileId, { content: editor.value, updatedAt: Date.now() });
        if (window.fileSystem.files[editor.dataset.fileId]) window.fileSystem.files[editor.dataset.fileId].content = editor.value;
        notify("Code Studio", "Saved.", 2500, "success");
    };

    window.openDebugConsole = function () {
        window.openWindow("Debug Console", `
            <div style="padding:10px;">
                <h3>Debug Console</h3>
                <button onclick="debugDumpState()">Dump State</button>
                <button onclick="debugClearLayout()">Reset Desktop Layout</button>
                <pre id="debugOutput" class="debug-output"></pre>
            </div>
        `, "debugConsole");
    };

    window.debugDumpState = function () {
        const out = document.getElementById("debugOutput");
        if (!out) return;
        out.textContent = JSON.stringify({
            edition: localStorage.getItem("40_edition"),
            build: localStorage.getItem("40_build_name"),
            files: Object.keys(window.fileSystem?.files || {}).length,
            apps: Object.keys(window.APPS || {}),
            desktopPositions: getPositions()
        }, null, 2);
    };

    window.debugClearLayout = function () {
        localStorage.removeItem(DESKTOP_POS_KEY);
        enhancedRenderDesktop();
        notify("Desktop", "Desktop layout reset.", 3000, "info");
    };

    window.openBuildInspector = function () {
        const build = window.EMERALDOS_BUILD || {};
        const edition = localStorage.getItem("40_edition_name") || localStorage.getItem("40_edition") || "Home";
        window.openWindow("Build Inspector", `
            <div style="padding:10px;">
                <h3>Build Inspector</h3>
                <div class="inset-panel">
                    <b>Build:</b> ${safeHTML(build.displayName || "EmeraldOS 5.3")}<br>
                    <b>Version:</b> ${safeHTML(build.version || "5.3")}<br>
                    <b>Channel:</b> ${safeHTML(build.channel || "Test")}<br>
                    <b>Edition:</b> ${safeHTML(edition)}<br>
                    <b>Visible Apps:</b> ${getVisibleAppEntriesSafe().length}
                </div>
            </div>
        `, "buildInspector");
    };

    if (window.APPS) {
        window.APPS.terminal = { name: "Terminal", icon: "⌨️", edition: "developer", launch: () => window.openTerminal() };
        window.APPS.devtools = { name: "Developer Tools", icon: "▧", edition: "developer", launch: () => window.openDeveloperTools() };
        window.APPS.codeStudio = { name: "Code Studio", icon: "</>", edition: "developer", launch: () => window.openCodeStudio() };
        window.APPS.debugConsole = { name: "Debug Console", icon: "DBG", edition: "developer", launch: () => window.openDebugConsole() };
        window.APPS.buildInspector = { name: "Build Inspector", icon: "BI", edition: "developer", launch: () => window.openBuildInspector() };
    }

    /* -----------------------------------------------------
       Rebuilt Files app
    ----------------------------------------------------- */

    let enhancedCurrentFolder = localStorage.getItem("40_current_folder") || "Desktop";
    const SYSTEM_FOLDERS = ["Desktop", "Documents", "Pictures", "Downloads", "Trash"];

    function getFolders() {
        const folders = new Set(SYSTEM_FOLDERS);
        Object.values(window.fileSystem?.files || {}).forEach(file => {
            if (file.type === "folder") folders.add(file.name);
            if (file.folder) folders.add(file.folder);
            if (file.parent) folders.add(file.parent);
        });
        return Array.from(folders);
    }

    function setFolder(folder) {
        enhancedCurrentFolder = folder || "Desktop";
        localStorage.setItem("40_current_folder", enhancedCurrentFolder);
    }

    function renderEnhancedFileExplorer() {
        const files = Object.entries(window.fileSystem?.files || {})
            .filter(([id, file]) => getFileFolder(file) === enhancedCurrentFolder)
            .sort((a, b) => String(a[1].name || "").localeCompare(String(b[1].name || "")));

        const folders = getFolders();
        return `
            <div class="file-explorer-v2">
                <div class="file-sidebar">
                    <div class="sidebar-title">Folders</div>
                    ${folders.map(folder => `
                        <div class="folder-item ${folder === enhancedCurrentFolder ? "active" : ""}" onclick="openFolder('${safeHTML(folder)}')">
                            📁 ${safeHTML(folder)}
                        </div>
                    `).join("")}
                </div>
                <div class="file-main">
                    <div class="toolbar file-toolbar">
                        <button onclick="createFile()">New File</button>
                        <button onclick="createFolder()">New Folder</button>
                        <button onclick="uploadFile()">Upload</button>
                        <button onclick="putSelectedFileOnDesktop()">Put On Desktop</button>
                        ${enhancedCurrentFolder === "Trash" ? '<button onclick="emptyTrash()">Empty Trash</button>' : ""}
                        <input id="file_search" placeholder="Search files" oninput="searchFiles()">
                    </div>
                    <div class="path-bar">Location: ${safeHTML(enhancedCurrentFolder)}</div>
                    <div id="file_list">
                        ${files.length ? files.map(([id, file]) => renderFileRow(id, file)).join("") : `<div class="empty-folder">This folder is empty.</div>`}
                    </div>
                </div>
            </div>
        `;
    }

    function renderFileRow(id, file) {
        const isTrash = enhancedCurrentFolder === "Trash";
        return `
            <div class="file-row" data-file-id="${safeHTML(id)}" onclick="selectFileRow('${safeHTML(id)}', this)">
                <span class="file-name" ondblclick="openFile('${safeHTML(id)}')">${safeHTML(getFileIcon(file))} ${safeHTML(file.name || "Untitled")}</span>
                <div class="file-actions">
                    ${file.type === "folder" ? `<button onclick="event.stopPropagation();openFolderByFile('${safeHTML(id)}')">Open</button>` : `<button onclick="event.stopPropagation();openFile('${safeHTML(id)}')">Open</button>`}
                    <button onclick="event.stopPropagation();renameFile('${safeHTML(id)}')">Rename</button>
                    <button onclick="event.stopPropagation();moveFile('${safeHTML(id)}')">Move</button>
                    ${!isDesktopFile(file) ? `<button onclick="event.stopPropagation();putFileOnDesktop('${safeHTML(id)}')">Desktop</button>` : `<button onclick="event.stopPropagation();removeFileFromDesktop('${safeHTML(id)}')">Unpin</button>`}
                    <button onclick="event.stopPropagation();downloadFile('${safeHTML(id)}')">Download</button>
                    <button onclick="event.stopPropagation();showProperties('${safeHTML(id)}')">Info</button>
                    ${isTrash ? `<button onclick="event.stopPropagation();restoreFile('${safeHTML(id)}')">Restore</button>` : `<button onclick="event.stopPropagation();deleteFile('${safeHTML(id)}')">Delete</button>`}
                </div>
            </div>
        `;
    }

    function rerenderEnhancedExplorer() {
        const win = document.querySelector('.window[data-app="files"] .window-content');
        if (!win) return;
        win.innerHTML = renderEnhancedFileExplorer();
    }

    window.openFileExplorer = function (folder = enhancedCurrentFolder || "Desktop") {
        setFolder(folder);
        window.openWindow("Files", renderEnhancedFileExplorer(), "files");
    };

    window.openFolder = function (folder) {
        setFolder(folder);
        rerenderEnhancedExplorer();
    };

    window.openFolderByFile = function (id) {
        const file = window.fileSystem?.files?.[id];
        if (!file) return;
        setFolder(file.name);
        rerenderEnhancedExplorer();
    };

    window.selectFileRow = function (id, row) {
        document.querySelectorAll(".file-row.selected").forEach(el => el.classList.remove("selected"));
        if (row) row.classList.add("selected");
        window.__emerald40SelectedFile = id;
    };

    window.createFile = async function (targetFolder = enhancedCurrentFolder || "Desktop") {
        const name = prompt("File name:", "New File.txt");
        if (!name) return;
        const id = await cloudCreateFile(name, "");
        if (!id) return;
        await cloudSaveFile(id, {
            folder: targetFolder,
            parent: targetFolder,
            showOnDesktop: targetFolder === "Desktop",
            type: "text/plain",
            updatedAt: Date.now()
        });
        await loadSystem();
        refreshDesktopAndExplorer();
        notify("Files", "File created.", 3000, "success");
    };

    window.createFileOnDesktop = function () {
        return window.createFile("Desktop");
    };

    window.createFolder = async function (targetFolder = enhancedCurrentFolder || "Desktop") {
        const name = prompt("Folder name:", "New Folder");
        if (!name) return;
        const id = "folder_" + Date.now();
        await cloudSaveFile(id, {
            name,
            content: "",
            type: "folder",
            folder: targetFolder,
            parent: targetFolder,
            showOnDesktop: targetFolder === "Desktop",
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
        await loadSystem();
        refreshDesktopAndExplorer();
        notify("Files", "Folder created.", 3000, "success");
    };

    window.createFolderOnDesktop = function () {
        return window.createFolder("Desktop");
    };

    window.uploadFile = function (targetFolder = enhancedCurrentFolder || "Desktop") {
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = true;
        input.onchange = async e => {
            const files = Array.from(e.target.files || []);
            for (const source of files) {
                const content = await new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.readAsDataURL(source);
                });
                const id = await cloudCreateFile(source.name, content);
                if (id) {
                    await cloudSaveFile(id, {
                        folder: targetFolder,
                        parent: targetFolder,
                        showOnDesktop: targetFolder === "Desktop",
                        size: source.size,
                        mimeType: source.type || "application/octet-stream",
                        updatedAt: Date.now()
                    });
                }
            }
            await loadSystem();
            refreshDesktopAndExplorer();
            notify("Files", files.length + " upload(s) complete.", 3000, "success");
        };
        input.click();
    };

    window.uploadFileToDesktop = function () {
        return window.uploadFile("Desktop");
    };

    window.openFile = async function (id) {
        const file = window.fileSystem?.files?.[id];
        if (!file) return;

        if (file.type === "folder") {
            setFolder(file.name);
            window.openFileExplorer(file.name);
            return;
        }

        let html = "";
        const content = await getFileContent(id, file);
        file.content = content;
        if (String(content).startsWith("data:image")) {
            html = `<div style="padding:10px;text-align:center;"><img src="${content}" style="max-width:100%;max-height:100%;"></div>`;
        } else if (String(content).startsWith("data:video")) {
            html = `<video controls style="width:100%;height:100%;"><source src="${content}"></video>`;
        } else if (String(content).startsWith("data:audio")) {
            html = `<div style="padding:10px;"><audio controls style="width:100%;"><source src="${content}"></audio></div>`;
        } else {
            html = `
                <div class="file-editor">
                    <textarea id="edit_${safeHTML(id)}" spellcheck="false">${safeHTML(content)}</textarea>
                    <div class="toolbar"><button onclick="saveOpenFile('${safeHTML(id)}')">Save</button></div>
                </div>`;
        }
        addRecent?.(id);
        window.openWindow(file.name || "File", html, "file");
    };

    window.saveOpenFile = async function (id) {
        const editor = document.getElementById("edit_" + id);
        if (!editor) return;
        await cloudSaveFile(id, { content: editor.value, updatedAt: Date.now() });
        if (window.fileSystem.files[id]) window.fileSystem.files[id].content = editor.value;
        notify("Files", "Saved.", 2500, "success");
    };

    window.renameFile = async function (id) {
        const file = window.fileSystem?.files?.[id];
        if (!file) return;
        const name = prompt("Rename:", file.name || "Untitled");
        if (!name) return;
        await cloudSaveFile(id, { name, updatedAt: Date.now() });
        await loadSystem();
        refreshDesktopAndExplorer();
    };

    window.moveFile = async function (id) {
        const file = window.fileSystem?.files?.[id];
        if (!file) return;
        const folders = getFolders().join(", ");
        const folder = prompt("Move to folder:\n" + folders, getFileFolder(file));
        if (!folder) return;
        await cloudSaveFile(id, {
            folder,
            parent: folder,
            showOnDesktop: folder === "Desktop",
            updatedAt: Date.now()
        });
        await loadSystem();
        refreshDesktopAndExplorer();
        notify("Files", "Moved to " + folder + ".", 2500, "info");
    };

    window.putFileOnDesktop = async function (id) {
        await cloudSaveFile(id, { folder: "Desktop", parent: "Desktop", showOnDesktop: true, updatedAt: Date.now() });
        await loadSystem();
        refreshDesktopAndExplorer();
        notify("Desktop", "Item placed on desktop.", 2500, "success");
    };

    window.putSelectedFileOnDesktop = function () {
        if (window.__emerald40SelectedFile) return window.putFileOnDesktop(window.__emerald40SelectedFile);
        alert("Select a file first.");
    };

    window.removeFileFromDesktop = async function (id) {
        const file = window.fileSystem?.files?.[id];
        if (!file) return;
        const fallback = file.type === "folder" ? "Documents" : "Documents";
        await cloudSaveFile(id, { folder: fallback, parent: fallback, showOnDesktop: false, updatedAt: Date.now() });
        await loadSystem();
        refreshDesktopAndExplorer();
    };

    window.deleteFile = async function (id) {
        const file = window.fileSystem?.files?.[id];
        if (!file) return;
        if (!confirm("Move " + (file.name || "this item") + " to Trash?")) return;
        await cloudSaveFile(id, { folder: "Trash", parent: "Trash", showOnDesktop: false, deletedAt: Date.now(), updatedAt: Date.now() });
        await loadSystem();
        refreshDesktopAndExplorer();
        notify("Trash", "Moved to Trash.", 2500, "info");
    };

    window.restoreFile = async function (id) {
        await cloudSaveFile(id, { folder: "Desktop", parent: "Desktop", showOnDesktop: true, deletedAt: null, updatedAt: Date.now() });
        await loadSystem();
        refreshDesktopAndExplorer();
    };

    window.emptyTrash = async function () {
        if (!confirm("Permanently delete all items in Trash?")) return;
        for (const [id, file] of Object.entries(window.fileSystem?.files || {})) {
            if (getFileFolder(file) === "Trash") await cloudDeleteFile(id);
        }
        await loadSystem();
        refreshDesktopAndExplorer();
    };

    window.downloadFile = async function (id) {
        const file = window.fileSystem?.files?.[id];
        if (!file) return;
        const content = await getFileContent(id, file);
        file.content = content;
        const a = document.createElement("a");
        if (String(content || "").startsWith("data:")) {
            a.href = content;
        } else {
            a.href = URL.createObjectURL(new Blob([content || ""], { type: file.mimeType || file.storageContentType || "text/plain" }));
        }
        a.download = file.name || "download";
        a.click();
        setTimeout(() => {
            if (a.href.startsWith("blob:")) URL.revokeObjectURL(a.href);
        }, 1000);
    };

    window.showProperties = function (id) {
        const file = window.fileSystem?.files?.[id];
        if (!file) return;
        window.openWindow("Properties", `
            <div style="padding:10px;">
                <h3>${safeHTML(file.name || "Untitled")}</h3>
                <div class="inset-panel">
                    <b>Type:</b> ${safeHTML(file.type || file.mimeType || "File")}<br>
                    <b>Folder:</b> ${safeHTML(getFileFolder(file))}<br>
                    <b>On Desktop:</b> ${isDesktopFile(file) ? "Yes" : "No"}<br>
                    <b>Created:</b> ${file.createdAt ? new Date(file.createdAt).toLocaleString() : "Unknown"}<br>
                    <b>Updated:</b> ${file.updatedAt ? new Date(file.updatedAt).toLocaleString() : "Unknown"}<br>
                    <b>Storage:</b> ${file.hasStorageBlob ? "Firebase Storage" : "Firestore"}<br>
                    <b>Size:</b> ${file.storageSize || file.size || 0} bytes
                </div>
            </div>
        `, "properties");
    };

    window.searchFiles = function () {
        const q = (document.getElementById("file_search")?.value || "").toLowerCase();
        document.querySelectorAll(".file-row").forEach(row => {
            row.style.display = row.textContent.toLowerCase().includes(q) ? "" : "none";
        });
    };

    /* -----------------------------------------------------
       Desktop context menu upgrade
    ----------------------------------------------------- */

    function installDesktopContextMenuV2() {
        const desktop = document.getElementById("desktop");
        const contextMenu = document.getElementById("context-menu");
        if (!desktop || !contextMenu) return;

        desktop.addEventListener("contextmenu", e => {
            e.preventDefault();
            e.stopImmediatePropagation();
            contextMenu.style.left = e.clientX + "px";
            contextMenu.style.top = e.clientY + "px";
            contextMenu.innerHTML = `
                <div class="context-item" onclick="refreshDesktop()">Refresh</div>
                <div class="context-item" onclick="createFileOnDesktop()">New File</div>
                <div class="context-item" onclick="createFolderOnDesktop()">New Folder</div>
                <div class="context-item" onclick="uploadFileToDesktop()">Upload To Desktop</div>
                <div class="context-item" onclick="openFileExplorer('Desktop')">Open Files</div>
                <div class="context-item" onclick="debugClearLayout?.()">Reset Icon Layout</div>
                <div class="context-item" onclick="openSystemApp()">System Settings</div>
            `;
            contextMenu.classList.add("show");
        }, true);
    }

    window.refreshDesktop = function () {
        refreshDesktopAndExplorer();
        notify("Desktop", "Desktop refreshed.", 2500, "info");
    };


    /* -----------------------------------------------------
       EMERALDOS 5.3 ADVANCED DEVELOPER PATCH
       - More apps
       - Expanded terminal
       - HKEY-style registry
       - Firebase desktop layout + registry sync
    ----------------------------------------------------- */

    const DESKTOP_POS_KEY_T3 = "40_desktop_positions_v3";
    const REGISTRY_KEY_T3 = "40_registry_v3";
    let cloudSaveTimerT3 = null;
    let cloudSettingsLoadedT3 = false;
    let terminalCwdT3 = localStorage.getItem("40_terminal_cwd") || "Desktop";

    const DEFAULT_EMERALDOS_REGISTRY = {
        "HKEY_EMERALDOS\\SOFTWARE\\EmeraldOS\\ProductName": "EmeraldOS",
        "HKEY_EMERALDOS\\SOFTWARE\\EmeraldOS\\CurrentVersion": "5.3",
        "HKEY_EMERALDOS\\SOFTWARE\\EmeraldOS\\BuildChannel": "Test",
        "HKEY_EMERALDOS\\SOFTWARE\\EmeraldOS\\BaseSystem": "EmeraldOS 3.2",
        "HKEY_CURRENT_USER\\Control Panel\\Desktop\\Theme": localStorage.getItem("40_theme") || "classic",
        "HKEY_CURRENT_USER\\Control Panel\\Desktop\\IconLayoutSource": "Firebase + Local Cache",
        "HKEY_CURRENT_USER\\Software\\EmeraldOS\\Explorer\\ShowDesktopFiles": "1",
        "HKEY_CURRENT_USER\\Software\\EmeraldOS\\Explorer\\SnapToGrid": "0",
        "HKEY_CURRENT_USER\\Software\\EmeraldOS\\Terminal\\WorkingDirectory": terminalCwdT3,
        "HKEY_CURRENT_USER\\Software\\EmeraldOS\\Terminal\\CommandMode": "Advanced",
        "HKEY_LOCAL_MACHINE\\System\\Policies\\EditionLocksHidden": "1",
        "HKEY_LOCAL_MACHINE\\System\\Policies\\AllowExperimentalApps": "1",
        "HKEY_LOCAL_MACHINE\\System\\CloudSync\\DesktopLayout": "Enabled",
        "HKEY_LOCAL_MACHINE\\System\\CloudSync\\Registry": "Enabled"
    };

    async function loadT3CloudSettings() {
        if (cloudSettingsLoadedT3) return;
        cloudSettingsLoadedT3 = true;

        try {
            const settings = await loadUserSettings();

            if (settings.desktopPositions && typeof settings.desktopPositions === "object") {
                localStorage.setItem(DESKTOP_POS_KEY, JSON.stringify(settings.desktopPositions));
                localStorage.setItem(DESKTOP_POS_KEY_T3, JSON.stringify(settings.desktopPositions));
            }

            if (settings.registry && typeof settings.registry === "object") {
                localStorage.setItem(REGISTRY_KEY_T3, JSON.stringify({
                    ...DEFAULT_EMERALDOS_REGISTRY,
                    ...settings.registry
                }));
            }

            if (settings.terminalCwd) {
                terminalCwdT3 = settings.terminalCwd;
                localStorage.setItem("40_terminal_cwd", terminalCwdT3);
            }

            if (typeof notify === "function") {
                notify("Cloud Sync", "Desktop layout and registry restored.", 2800, "success");
            }
        } catch (err) {
            console.warn("EmeraldOS cloud settings failed:", err);
        }
    }

    function queueT3CloudSave(data) {
        clearTimeout(cloudSaveTimerT3);
        cloudSaveTimerT3 = setTimeout(async () => {
            try {
                await saveUserSettings(data);
            } catch (err) {
                console.warn("EmeraldOS cloud save failed:", err);
            }
        }, 700);
    }

    const originalSavePositionsT3 = savePositions;
    savePositions = function(data) {
        originalSavePositionsT3(data);
        localStorage.setItem(DESKTOP_POS_KEY_T3, JSON.stringify(data));
        queueT3CloudSave({ desktopPositions: data });
    };

    function getRegistry() {
        try {
            const stored = JSON.parse(localStorage.getItem(REGISTRY_KEY_T3) || "{}");
            return { ...DEFAULT_EMERALDOS_REGISTRY, ...stored };
        } catch {
            return { ...DEFAULT_EMERALDOS_REGISTRY };
        }
    }

    function saveRegistry(registry) {
        localStorage.setItem(REGISTRY_KEY_T3, JSON.stringify(registry));
        queueT3CloudSave({ registry });
    }

    function registryGet(key) {
        return getRegistry()[key];
    }

    function registrySet(key, value) {
        const registry = getRegistry();
        registry[key] = String(value);
        saveRegistry(registry);
        return true;
    }

    function registryDelete(key) {
        const registry = getRegistry();
        const existed = Object.prototype.hasOwnProperty.call(registry, key);
        delete registry[key];
        saveRegistry(registry);
        return existed;
    }

    function registryList(prefix = "") {
        const registry = getRegistry();
        return Object.keys(registry)
            .filter(key => key.toLowerCase().startsWith(String(prefix || "").toLowerCase()))
            .sort();
    }

    function resetRegistry() {
        saveRegistry({ ...DEFAULT_EMERALDOS_REGISTRY });
    }

    function htmlLines(lines) {
        return lines.map(line => safeHTML(line)).join("<br>");
    }

    function findFileByNameOrId(target) {
        if (!target) return null;
        const files = window.fileSystem?.files || {};
        if (files[target]) return [target, files[target]];
        const lower = target.toLowerCase();
        return Object.entries(files).find(([id, file]) => {
            return String(file.name || "").toLowerCase() === lower && getFileFolder(file) === terminalCwdT3;
        }) || null;
    }

    function terminalWrite(output, command, result) {
        output.innerHTML += `> ${safeHTML(command)}<br>${result}<br><br>`;
        output.scrollTop = output.scrollHeight;
    }

    function parseCommandLine(cmdLine) {
        const tokens = [];
        const regex = /"([^"]*)"|'([^']*)'|(\S+)/g;
        let match;
        while ((match = regex.exec(cmdLine)) !== null) {
            tokens.push(match[1] ?? match[2] ?? match[3]);
        }
        return tokens;
    }

    window.runCommand = async function(cmdLine = "") {
        const output = document.getElementById("terminal_output");
        const input = document.getElementById("terminal_input");
        if (!output) return;
        if (input) input.value = "";

        const raw = String(cmdLine).trim();
        if (!raw) return;

        const args = parseCommandLine(raw);
        const command = (args.shift() || "").toLowerCase();
        let result = "Unknown command. Type help.";

        try {
            if (command === "clear" || command === "cls") {
                output.innerHTML = "";
                return;
            }

            if (command === "help") {
                result = htmlLines([
                    "Core: help, clear, version, about, whoami, edition, date, time, echo <text>",
                    "Apps: apps, open <appId>, tasklist",
                    "Files: pwd, cd <folder>, ls, dir, files, touch <name>, mkdir <name>, rm <name|id>",
                    "Desktop: desktop.save, desktop.load, desktop.reset",
                    "Registry: registry.list [prefix], registry.get <key>, registry.set <key> <value>, registry.delete <key>, registry.export, registry.reset",
                    "System: theme <classic|dark|light|midnight>, storage, reboot, logout"
                ]);
            }

            else if (command === "version") {
                result = "EmeraldOS 5.3 Desktop Folders Suite Build";
            }

            else if (command === "about") {
                result = htmlLines([
                    "EmeraldOS 5.3",
                    "Built on EmeraldOS 3.2",
                    "Adds HKEY registry, advanced terminal, more apps, and Firebase desktop sync."
                ]);
            }

            else if (command === "whoami") {
                result = safeHTML(localStorage.getItem("40_username") || localStorage.getItem("40_session") || "Guest");
            }

            else if (command === "edition") {
                result = safeHTML(localStorage.getItem("40_edition_name") || localStorage.getItem("40_edition") || "EmeraldOS Virtue");
            }

            else if (command === "date") {
                result = new Date().toLocaleDateString();
            }

            else if (command === "time") {
                result = new Date().toLocaleTimeString();
            }

            else if (command === "echo") {
                result = safeHTML(args.join(" "));
            }

            else if (command === "apps") {
                result = htmlLines(getVisibleAppEntriesSafe().map(([id, app]) => `${id} - ${app.name} [${app.edition || "home"}]`));
            }

            else if (command === "open") {
                const appId = args[0];
                if (!appId) result = "Usage: open <appId>";
                else result = window.launchApp?.(appId) ? `Opened ${safeHTML(appId)}.` : `App not found or hidden by edition: ${safeHTML(appId)}`;
            }

            else if (command === "tasklist") {
                result = htmlLines(Array.from(document.querySelectorAll(".window")).map((win, index) => {
                    const title = win.querySelector(".title-bar span")?.textContent || "Window";
                    return `${index}: ${title} [${win.dataset.app || "app"}]`;
                }));
            }

            else if (command === "pwd") {
                result = safeHTML(terminalCwdT3);
            }

            else if (command === "cd") {
                const folder = args.join(" ") || "Desktop";
                const valid = getFolders().map(f => f.toLowerCase()).includes(folder.toLowerCase());
                if (!valid) result = `Folder not found: ${safeHTML(folder)}`;
                else {
                    terminalCwdT3 = getFolders().find(f => f.toLowerCase() === folder.toLowerCase()) || folder;
                    localStorage.setItem("40_terminal_cwd", terminalCwdT3);
                    registrySet("HKEY_CURRENT_USER\\Software\\EmeraldOS\\Terminal\\WorkingDirectory", terminalCwdT3);
                    queueT3CloudSave({ terminalCwd: terminalCwdT3 });
                    result = `Current folder: ${safeHTML(terminalCwdT3)}`;
                }
            }

            else if (command === "ls" || command === "dir" || command === "files") {
                const rows = Object.entries(window.fileSystem?.files || {})
                    .filter(([id, file]) => getFileFolder(file) === terminalCwdT3)
                    .map(([id, file]) => `${id}  ${file.type === "folder" ? "<DIR>" : "     "}  ${file.name || "Untitled"}`);
                result = rows.length ? htmlLines(rows) : "Folder is empty.";
            }

            else if (command === "touch") {
                const name = args.join(" ") || "terminal-file.txt";
                const id = await cloudCreateFile(name, "");
                await cloudSaveFile(id, { folder: terminalCwdT3, parent: terminalCwdT3, showOnDesktop: terminalCwdT3 === "Desktop", type: "text/plain" });
                await loadSystem();
                refreshDesktopAndExplorer();
                result = `Created ${safeHTML(name)}.`;
            }

            else if (command === "mkdir") {
                const name = args.join(" ") || "New Folder";
                const id = "folder_" + Date.now();
                await cloudSaveFile(id, { name, content: "", type: "folder", folder: terminalCwdT3, parent: terminalCwdT3, showOnDesktop: terminalCwdT3 === "Desktop", createdAt: Date.now() });
                await loadSystem();
                refreshDesktopAndExplorer();
                result = `Created folder ${safeHTML(name)}.`;
            }

            else if (command === "rm" || command === "del") {
                const target = args.join(" ");
                const found = findFileByNameOrId(target);
                if (!found) result = `File not found: ${safeHTML(target)}`;
                else {
                    await cloudSaveFile(found[0], { folder: "Trash", parent: "Trash", showOnDesktop: false, deletedAt: Date.now() });
                    await loadSystem();
                    refreshDesktopAndExplorer();
                    result = `Moved ${safeHTML(found[1].name || found[0])} to Trash.`;
                }
            }

            else if (command === "desktop.save") {
                queueT3CloudSave({ desktopPositions: getPositions() });
                result = "Desktop layout save queued to Firebase.";
            }

            else if (command === "desktop.load") {
                cloudSettingsLoadedT3 = false;
                await loadT3CloudSettings();
                refreshDesktopAndExplorer();
                result = "Desktop layout loaded from Firebase.";
            }

            else if (command === "desktop.reset") {
                localStorage.removeItem(DESKTOP_POS_KEY);
                localStorage.removeItem(DESKTOP_POS_KEY_T3);
                queueT3CloudSave({ desktopPositions: {} });
                refreshDesktopAndExplorer();
                result = "Desktop layout reset.";
            }

            else if (command === "registry.list" || command === "reg.list") {
                result = htmlLines(registryList(args.join(" ")).map(key => `${key} = ${getRegistry()[key]}`));
            }

            else if (command === "registry.get" || command === "reg.get") {
                const key = args.join(" ");
                const value = registryGet(key);
                result = value === undefined ? "Registry value not found." : `${safeHTML(key)} = ${safeHTML(value)}`;
            }

            else if (command === "registry.set" || command === "reg.set") {
                const key = args.shift();
                const value = args.join(" ");
                if (!key || !value) result = "Usage: registry.set <key> <value>";
                else {
                    registrySet(key, value);
                    result = `Set ${safeHTML(key)}.`;
                }
            }

            else if (command === "registry.delete" || command === "reg.delete") {
                const key = args.join(" ");
                result = registryDelete(key) ? `Deleted ${safeHTML(key)}.` : "Registry value not found.";
            }

            else if (command === "registry.export" || command === "reg.export") {
                result = `<pre>${safeHTML(JSON.stringify(getRegistry(), null, 2))}</pre>`;
            }

            else if (command === "registry.reset" || command === "reg.reset") {
                resetRegistry();
                result = "Registry reset to defaults.";
            }

            else if (command === "theme") {
                const theme = args[0];
                if (!theme) result = "Usage: theme <classic|dark|light|midnight>";
                else {
                    window.setTheme?.(theme);
                    registrySet("HKEY_CURRENT_USER\\Control Panel\\Desktop\\Theme", theme);
                    result = `Theme set to ${safeHTML(theme)}.`;
                }
            }

            else if (command === "storage") {
                const regSize = localStorage.getItem(REGISTRY_KEY_T3)?.length || 0;
                const posSize = localStorage.getItem(DESKTOP_POS_KEY)?.length || 0;
                result = htmlLines([
                    `Files: ${Object.keys(window.fileSystem?.files || {}).length}`,
                    `Registry bytes: ${regSize}`,
                    `Desktop layout bytes: ${posSize}`,
                    `LocalStorage keys: ${Object.keys(localStorage).length}`
                ]);
            }

            else if (command === "reboot" || command === "restart") {
                window.restartOS?.();
                result = "Restarting...";
            }

            else if (command === "logout") {
                window.logoutUser?.();
                result = "Logging out...";
            }
        } catch (err) {
            result = "Command error: " + safeHTML(err.message || err);
        }

        terminalWrite(output, raw, result);
    };

    /* -----------------------------------------------------
       More EmeraldOS 5.3 apps
    ----------------------------------------------------- */

    window.openTaskBoard = function () {
        const tasks = JSON.parse(localStorage.getItem("40_tasks") || "[]");
        window.openWindow("Task Board", `
            <div class="app-panel"><h3>Task Board</h3>
            <div class="toolbar"><input id="task_input" placeholder="New task"><button onclick="addTaskBoardItem()">Add</button></div>
            <div id="task_board_list">${tasks.map((t,i)=>`<div class="file-row"><span>${safeHTML(t)}</span><button onclick="removeTaskBoardItem(${i})">Done</button></div>`).join("") || "No tasks."}</div></div>`, "taskBoard");
    };
    window.addTaskBoardItem = function () { const input=document.getElementById("task_input"); if(!input?.value) return; const tasks=JSON.parse(localStorage.getItem("40_tasks")||"[]"); tasks.push(input.value); localStorage.setItem("40_tasks",JSON.stringify(tasks)); window.openTaskBoard(); };
    window.removeTaskBoardItem = function (i) { const tasks=JSON.parse(localStorage.getItem("40_tasks")||"[]"); tasks.splice(i,1); localStorage.setItem("40_tasks",JSON.stringify(tasks)); window.openTaskBoard(); };

    window.openSpreadsheetLite = function () {
        let rows = "";
        for (let r=0;r<12;r++) rows += `<tr>${Array.from({length:6},(_,c)=>`<td contenteditable="true" data-cell="${r}:${c}"></td>`).join("")}</tr>`;
        window.openWindow("Spreadsheet Lite", `<div class="app-panel"><h3>Spreadsheet Lite</h3><table class="sheet"><tbody>${rows}</tbody></table></div>`, "spreadsheet");
    };

    window.openMailDrafts = function () {
        window.openWindow("Mail Drafts", `<div class="app-panel"><h3>Mail Drafts</h3><input placeholder="To"><input placeholder="Subject"><textarea style="height:170px" placeholder="Draft message"></textarea><button onclick="notify('Mail Drafts','Draft saved locally.',2500,'success')">Save Draft</button></div>`, "mailDrafts");
    };

    window.openContacts = function () {
        const contacts = JSON.parse(localStorage.getItem("40_contacts") || "[]");
        window.openWindow("Contacts", `<div class="app-panel"><h3>Contacts</h3><div class="toolbar"><input id="contact_name" placeholder="Name"><input id="contact_email" placeholder="Email"><button onclick="addContact()">Add</button></div>${contacts.map((c,i)=>`<div class="file-row"><span>${safeHTML(c.name)} - ${safeHTML(c.email)}</span><button onclick="removeContact(${i})">Remove</button></div>`).join("") || "No contacts."}</div>`, "contacts");
    };
    window.addContact = function(){const name=document.getElementById('contact_name')?.value||'';const email=document.getElementById('contact_email')?.value||'';if(!name&&!email)return;const contacts=JSON.parse(localStorage.getItem('40_contacts')||'[]');contacts.push({name,email});localStorage.setItem('40_contacts',JSON.stringify(contacts));window.openContacts();};
    window.removeContact = function(i){const contacts=JSON.parse(localStorage.getItem('40_contacts')||'[]');contacts.splice(i,1);localStorage.setItem('40_contacts',JSON.stringify(contacts));window.openContacts();};

    window.openReports = function () {
        window.openWindow("Reports", `<div class="app-panel"><h3>Reports</h3><div class="inset-panel"><b>Files:</b> ${Object.keys(window.fileSystem?.files||{}).length}<br><b>Visible apps:</b> ${getVisibleAppEntriesSafe().length}<br><b>Edition:</b> ${safeHTML(localStorage.getItem('40_edition_name')||'Home')}</div></div>`, "reports");
    };

    window.openThemeLab = function () {
        window.openWindow("Theme Lab", `<div class="app-panel"><h3>Theme Lab</h3><button onclick="setTheme('classic')">Classic</button><button onclick="setTheme('dark')">Dark</button><button onclick="setTheme('light')">Light</button><button onclick="setTheme('midnight')">Midnight</button><hr><input id="theme_lab_color" placeholder="#008080"><button onclick="setWallpaper(document.getElementById('theme_lab_color').value)">Set desktop color</button></div>`, "themeLab");
    };

    window.openArchiveManager = function () {
        window.openWindow("Archive Manager", `<div class="app-panel"><h3>Archive Manager</h3><p>Select files in Files, then download them individually. Archive packing is simulated in this test build.</p><button onclick="notify('Archive Manager','Archive scan complete.',2500,'info')">Scan Files</button></div>`, "archiveManager");
    };

    window.openAudioNotes = function () {
        window.openWindow("Audio Notes", `<div class="app-panel"><h3>Audio Notes</h3><p>Audio note recorder placeholder for EmeraldOS 5.3.</p><button onclick="notify('Audio Notes','Recorder initialized.',2500,'info')">Initialize Recorder</button></div>`, "audioNotes");
    };

    window.openRegistryEditor = function () {
        const keys = registryList();
        window.openWindow("Registry Editor", `<div class="registry-editor"><div class="registry-toolbar"><input id="registry_filter" placeholder="Filter HKEY path" oninput="renderRegistryList()"><button onclick="registryEditorNew()">New / Set</button><button onclick="registryEditorReset()">Reset</button></div><div id="registry_list" class="registry-list">${keys.map(k=>`<div class="registry-row" onclick="registrySelect('${safeHTML(k).replaceAll('\\\\','\\\\\\\\')}')"><b>${safeHTML(k)}</b><br><span>${safeHTML(getRegistry()[k])}</span></div>`).join("")}</div></div>`, "registryEditor");
    };

    window.renderRegistryList = function () {
        const filter = document.getElementById("registry_filter")?.value || "";
        const list = document.getElementById("registry_list");
        if (!list) return;
        list.innerHTML = registryList(filter).map(k => `<div class="registry-row" onclick="registrySelect('${safeHTML(k).replaceAll('\\\\','\\\\\\\\')}')"><b>${safeHTML(k)}</b><br><span>${safeHTML(getRegistry()[k])}</span></div>`).join("") || "No matching registry values.";
    };

    window.registrySelect = function (key) {
        const value = registryGet(key) ?? "";
        const next = prompt(key, value);
        if (next === null) return;
        registrySet(key, next);
        window.renderRegistryList();
    };

    window.registryEditorNew = function () {
        const key = prompt("Registry key:", "HKEY_CURRENT_USER\\Software\\EmeraldOS\\Custom\\Value");
        if (!key) return;
        const value = prompt("Value:", "1");
        if (value === null) return;
        registrySet(key, value);
        window.renderRegistryList();
    };

    window.registryEditorReset = function () {
        if (!confirm("Reset registry to defaults?")) return;
        resetRegistry();
        window.renderRegistryList();
    };

    window.openScriptLab = function () {
        window.openWindow("Script Lab", `<div class="app-panel script-lab"><h3>Script Lab</h3><textarea id="script_lab_code" spellcheck="false">return 'Hello from EmeraldOS 5.3';</textarea><button onclick="runScriptLab()">Run</button><pre id="script_lab_output"></pre></div>`, "scriptLab");
    };
    window.runScriptLab = function () { const out=document.getElementById('script_lab_output'); try { const code=document.getElementById('script_lab_code')?.value||''; out.textContent=String(Function(code)()); } catch(err){ out.textContent=err.message; } };

    window.openAPITester = function () {
        window.openWindow("API Tester", `<div class="app-panel"><h3>API Tester</h3><input id="api_url" placeholder="https://api.example.com"><button onclick="apiTesterFetch()">Fetch</button><pre id="api_output"></pre></div>`, "apiTester");
    };
    window.apiTesterFetch = async function () { const out=document.getElementById('api_output'); const url=document.getElementById('api_url')?.value; if(!url||!out)return; out.textContent='Loading...'; try{ const res=await fetch(url); out.textContent=await res.text(); }catch(err){ out.textContent='Request failed: '+err.message; } };

    window.openLogViewer = function () {
        const logs = JSON.parse(localStorage.getItem("40_logs") || "[]");
        window.openWindow("Log Viewer", `<div class="app-panel"><h3>Log Viewer</h3><button onclick="localStorage.setItem('40_logs','[]');openLogViewer()">Clear Logs</button><pre>${safeHTML(JSON.stringify(logs.slice(-50), null, 2))}</pre></div>`, "logViewer");
    };

    window.openServices = function () {
        window.openWindow("Services", `<div class="app-panel"><h3>Services</h3>${['Cloud Sync','Desktop Shell','Registry Service','Notification Engine','Window Manager'].map(s=>`<div class="file-row"><span>${s}</span><b>Running</b></div>`).join('')}</div>`, "services");
    };

    window.openExecutiveControlCenter = function () {
        window.openWindow("Executive Control Center", `<div class="app-panel"><h3>Executive Control Center</h3><div class="inset-panel">All EmeraldOS modules are available in Executive edition.</div><button onclick="openAuditCenter()">Open Audit Center</button><button onclick="openPolicyManager()">Open Policy Manager</button></div>`, "executiveControl");
    };

    window.openPolicyManager = function () {
        window.openWindow("Policy Manager", `<div class="app-panel"><h3>Policy Manager</h3><button onclick="registrySet('HKEY_LOCAL_MACHINE\\System\\Policies\\AllowExperimentalApps','1');notify('Policy','Experimental apps enabled.',2500,'success')">Enable Experimental Apps</button><button onclick="registrySet('HKEY_LOCAL_MACHINE\\System\\Policies\\AllowExperimentalApps','0');notify('Policy','Experimental apps disabled.',2500,'warning')">Disable Experimental Apps</button></div>`, "policyManager");
    };

    window.openAuditCenter = function () {
        window.openWindow("Audit Center", `<div class="app-panel"><h3>Audit Center</h3><div class="inset-panel"><b>Edition:</b> ${safeHTML(localStorage.getItem('40_edition_name')||'Unknown')}<br><b>Registry values:</b> ${registryList().length}<br><b>Desktop items:</b> ${Object.keys(getPositions()).length}</div></div>`, "auditCenter");
    };

    if (window.APPS) {
        window.APPS.taskBoard = { name: "Task Board", icon: "TASK", edition: "business", launch: () => window.openTaskBoard() };
        window.APPS.spreadsheet = { name: "Spreadsheet Lite", icon: "▦", edition: "business", launch: () => window.openSpreadsheetLite() };
        window.APPS.mailDrafts = { name: "Mail Drafts", icon: "MAIL", edition: "business", launch: () => window.openMailDrafts() };
        window.APPS.contacts = { name: "Contacts", icon: "☎", edition: "business", launch: () => window.openContacts() };
        window.APPS.reports = { name: "Reports", icon: "REP", edition: "business", launch: () => window.openReports() };

        window.APPS.themeLab = { name: "Theme Lab", icon: "▣", edition: "virtue", launch: () => window.openThemeLab() };
        window.APPS.archiveManager = { name: "Archive Manager", icon: "ARC", edition: "virtue", launch: () => window.openArchiveManager() };
        window.APPS.audioNotes = { name: "Audio Notes", icon: "AUD", edition: "virtue", launch: () => window.openAudioNotes() };

        window.APPS.registryEditor = { name: "Registry Editor", icon: "REG", edition: "developer", launch: () => window.openRegistryEditor() };
        window.APPS.scriptLab = { name: "Script Lab", icon: "JS", edition: "developer", launch: () => window.openScriptLab() };
        window.APPS.apiTester = { name: "API Tester", icon: "API", edition: "developer", launch: () => window.openAPITester() };
        window.APPS.logViewer = { name: "Log Viewer", icon: "LOG", edition: "developer", launch: () => window.openLogViewer() };
        window.APPS.services = { name: "Services", icon: "SVC", edition: "developer", launch: () => window.openServices() };

        window.APPS.executiveControl = { name: "Executive Control", icon: "EXE", edition: "executive", launch: () => window.openExecutiveControlCenter() };
        window.APPS.policyManager = { name: "Policy Manager", icon: "POL", edition: "executive", launch: () => window.openPolicyManager() };
        window.APPS.auditCenter = { name: "Audit Center", icon: "AUDIT", edition: "executive", launch: () => window.openAuditCenter() };
    }

    window.EmeraldOSRegistry = {
        get: registryGet,
        set: registrySet,
        delete: registryDelete,
        list: registryList,
        export: getRegistry,
        reset: resetRegistry
    };


    window.addEventListener("DOMContentLoaded", () => {
        setTimeout(async () => {
            await loadT3CloudSettings();
            installDesktopContextMenuV2();
            refreshDesktopAndExplorer();
        }, 800);
    });
})();


/* =========================================================
   EMERALDOS 5.3
   Economy Edition + Application Folders + More Apps
========================================================= */
(function () {
    "use strict";

    const DESKTOP_POS_KEY_T4 = "40_desktop_positions_v2";
    const APP_FOLDER_PREFIX = "folder:";

    const APP_CATEGORIES_T4 = {
        essential: {
            id: "essential",
            name: "Essential Apps",
            icon: "📁",
            edition: "economy",
            description: "Core EmeraldOS tools available in Economy and higher."
        },
        personal: {
            id: "personal",
            name: "Personal Apps",
            icon: "📁",
            edition: "home",
            description: "Home and personal productivity apps."
        },
        business: {
            id: "business",
            name: "Business Apps",
            icon: "📁",
            edition: "business",
            description: "Work, reports, planning, and communication tools."
        },
        creative: {
            id: "creative",
            name: "Creative Apps",
            icon: "📁",
            edition: "virtue",
            description: "Design, media, and customization tools."
        },
        developer: {
            id: "developer",
            name: "Developer Apps",
            icon: "📁",
            edition: "developer",
            description: "Coding, debugging, registry, network, and build tools."
        },
        executive: {
            id: "executive",
            name: "Executive Apps",
            icon: "📁",
            edition: "executive",
            description: "Executive control, policy, audit, and management tools."
        }
    };

    function safeT4(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function getPositionsT4() {
        try {
            return JSON.parse(localStorage.getItem(DESKTOP_POS_KEY_T4) || "{}");
        } catch {
            return {};
        }
    }

    function savePositionsT4(data) {
        localStorage.setItem(DESKTOP_POS_KEY_T4, JSON.stringify(data));
        clearTimeout(savePositionsT4.timer);
        savePositionsT4.timer = setTimeout(async () => {
            try {
                if (typeof saveUserSettings === "function") {
                    await saveUserSettings({ desktopPositions: data });
                }
            } catch (err) {
                console.warn("EmeraldOS T4 desktop layout sync failed:", err);
            }
        }, 650);
    }

    function getVisibleEntriesT4() {
        return Object.entries(window.APPS || {}).filter(([id, app]) => {
            if (typeof window.canSeeApp === "function") return window.canSeeApp(app);
            if (typeof window.canSeeEdition === "function") return window.canSeeEdition(app.edition || "economy");
            return true;
        });
    }

    function getVisibleCategoriesT4() {
        const entries = getVisibleEntriesT4();
        return Object.values(APP_CATEGORIES_T4).filter(category => {
            if (typeof window.canSeeEdition === "function" && !window.canSeeEdition(category.edition || "economy")) {
                return false;
            }
            return entries.some(([id, app]) => (app.category || inferCategoryT4(id, app)) === category.id);
        });
    }

    function inferCategoryT4(id, app) {
        if (app.category) return app.category;
        const edition = app.edition || "economy";
        if (edition === "economy") return "essential";
        if (edition === "home") return "personal";
        if (edition === "business") return "business";
        if (edition === "virtue") return "creative";
        if (edition === "developer") return "developer";
        if (edition === "executive") return "executive";
        return "essential";
    }

    function getAppsForCategoryT4(categoryId) {
        return getVisibleEntriesT4()
            .filter(([id, app]) => (app.category || inferCategoryT4(id, app)) === categoryId)
            .sort((a, b) => String(a[1].name).localeCompare(String(b[1].name)));
    }

    function getFileFolderT4(file) {
        return file.folder || file.parent || "Desktop";
    }

    function isDesktopFileT4(file) {
        return getFileFolderT4(file).toLowerCase() === "desktop" || file.showOnDesktop === true;
    }

    function getFileIconT4(file) {
        const type = String(file.type || "").toLowerCase();
        const name = String(file.name || "").toLowerCase();
        if (type === "folder") return "📁";
        if (type.includes("image") || /\.(png|jpg|jpeg|gif|webp|svg)$/.test(name)) return "🖼️";
        if (type.includes("video") || /\.(mp4|webm|mov)$/.test(name)) return "🎬";
        if (type.includes("audio") || /\.(mp3|wav|ogg)$/.test(name)) return "🎵";
        if (/\.(js|css|json|html)$/.test(name)) return "</>";
        if (/\.(doc|docs)$/.test(name)) return "📘";
        if (/\.(note|txt)$/.test(name)) return "📄";
        return "📄";
    }

    function defaultPosT4(index) {
        const row = index % 6;
        const col = Math.floor(index / 6);
        return { left: 12 + col * 90, top: 12 + row * 88 };
    }

    function makeIconT4({ key, icon, label, onOpen, itemType, itemId }, index) {
        const desktop = document.getElementById("desktop");
        if (!desktop) return;
        const positions = getPositionsT4();
        const pos = positions[key] || defaultPosT4(index);
        const el = document.createElement("div");
        el.className = "icon desktop-item t4-desktop-icon";
        el.dataset.desktopKey = key;
        el.dataset.itemType = itemType || "folder";
        if (itemId) el.dataset.itemId = itemId;
        el.style.position = "absolute";
        el.style.left = (parseInt(pos.left, 10) || 0) + "px";
        el.style.top = (parseInt(pos.top, 10) || 0) + "px";
        el.innerHTML = `<div class="desktop-icon-symbol">${safeT4(icon)}</div><div class="desktop-icon-label">${safeT4(label)}</div>`;

        let drag = null;
        let moved = false;
        el.addEventListener("mousedown", e => {
            if (e.button !== 0) return;
            e.preventDefault();
            moved = false;
            drag = {
                startX: e.clientX,
                startY: e.clientY,
                left: parseInt(el.style.left, 10) || 0,
                top: parseInt(el.style.top, 10) || 0
            };
            el.classList.add("dragging");
        });
        document.addEventListener("mousemove", e => {
            if (!drag) return;
            const dx = e.clientX - drag.startX;
            const dy = e.clientY - drag.startY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
            const maxLeft = Math.max(0, window.innerWidth - 90);
            const maxTop = Math.max(0, window.innerHeight - 130);
            el.style.left = Math.min(maxLeft, Math.max(0, drag.left + dx)) + "px";
            el.style.top = Math.min(maxTop, Math.max(0, drag.top + dy)) + "px";
        });
        document.addEventListener("mouseup", () => {
            if (!drag) return;
            drag = null;
            el.classList.remove("dragging");
            const data = getPositionsT4();
            data[key] = {
                left: parseInt(el.style.left, 10) || 0,
                top: parseInt(el.style.top, 10) || 0
            };
            savePositionsT4(data);
        });
        el.addEventListener("dblclick", e => {
            e.preventDefault();
            if (!moved && typeof onOpen === "function") onOpen();
        });
        el.addEventListener("click", e => {
            e.stopPropagation();
            document.querySelectorAll(".desktop-item.selected").forEach(item => item.classList.remove("selected"));
            el.classList.add("selected");
        });
        desktop.appendChild(el);
    }

    function renderDesktopT4() {
        const desktop = document.getElementById("desktop");
        if (!desktop) return;
        desktop.innerHTML = "";
        let index = 0;
        getVisibleCategoriesT4().forEach(category => {
            makeIconT4({
                key: APP_FOLDER_PREFIX + category.id,
                icon: category.icon,
                label: category.name,
                itemType: "app-folder",
                itemId: category.id,
                onOpen: () => window.openAppFolderT4(category.id)
            }, index++);
        });
        Object.entries(window.fileSystem?.files || {}).forEach(([id, file]) => {
            if (!isDesktopFileT4(file)) return;
            makeIconT4({
                key: "file:" + id,
                icon: getFileIconT4(file),
                label: file.name || "Untitled",
                itemType: "file",
                itemId: id,
                onOpen: () => window.openFile?.(id)
            }, index++);
        });
    }

    function renderStartMenuT4() {
        const results = document.getElementById("start-results");
        if (!results) return;
        results.innerHTML = "";
        getVisibleCategoriesT4().forEach(category => {
            const group = document.createElement("div");
            group.className = "start-folder-group";
            group.innerHTML = `<div class="start-folder-title">${safeT4(category.icon)} ${safeT4(category.name)}</div>`;
            getAppsForCategoryT4(category.id).forEach(([id, app]) => {
                const item = document.createElement("div");
                item.className = "start-item start-folder-app";
                item.dataset.app = id;
                item.innerHTML = `${safeT4(app.icon || "□")} ${safeT4(app.name || id)}`;
                item.onclick = () => {
                    if (typeof window.launchApp === "function") window.launchApp(id);
                    else app.launch?.();
                    document.getElementById("start-menu")?.classList.remove("show");
                };
                group.appendChild(item);
            });
            results.appendChild(group);
        });
    }

    window.openAppFolderT4 = function (categoryId) {
        const category = APP_CATEGORIES_T4[categoryId];
        if (!category) return;
        const rows = getAppsForCategoryT4(categoryId).map(([id, app]) => `
            <button class="app-folder-tile" onclick="launchApp('${safeT4(id)}')">
                <span class="app-folder-icon">${safeT4(app.icon || "□")}</span>
                <span class="app-folder-name">${safeT4(app.name || id)}</span>
                <span class="app-folder-edition">${safeT4(app.edition || "economy")}</span>
            </button>
        `).join("") || `<div class="inset-panel">No visible applications in this folder.</div>`;
        window.openWindow?.(category.name, `
            <div class="app-panel app-folder-window">
                <h3>${safeT4(category.icon)} ${safeT4(category.name)}</h3>
                <p>${safeT4(category.description)}</p>
                <div class="app-folder-grid">${rows}</div>
            </div>
        `, "folder-" + category.id);
    };

    window.openAllApplications = function () {
        const sections = getVisibleCategoriesT4().map(category => `
            <div class="app-folder-section">
                <h3>${safeT4(category.icon)} ${safeT4(category.name)}</h3>
                <div class="app-folder-grid">
                ${getAppsForCategoryT4(category.id).map(([id, app]) => `
                    <button class="app-folder-tile" onclick="launchApp('${safeT4(id)}')">
                        <span class="app-folder-icon">${safeT4(app.icon || "□")}</span>
                        <span class="app-folder-name">${safeT4(app.name || id)}</span>
                        <span class="app-folder-edition">${safeT4(app.edition || "economy")}</span>
                    </button>
                `).join("")}
                </div>
            </div>
        `).join("");
        window.openWindow?.("Applications", `<div class="app-panel app-folder-window"><h2>Applications</h2>${sections}</div>`, "allApps");
    };

    function registerSimpleApp(id, app) {
        if (!window.APPS || window.APPS[id]) return;
        window.APPS[id] = app;
    }

    function simpleWindow(title, html, appId) {
        window.openWindow?.(title, `<div class="app-panel">${html}</div>`, appId);
    }

    function installT4Apps() {
        const A = window.APPS;
        if (!A) return;
        // Economy essentials
        ["files","notes","calculator","clock","system","plans","about"].forEach(id => { if (A[id]) { A[id].edition = "economy"; A[id].category = "essential"; } });
        if (A.docs) { A.docs.edition = "home"; A.docs.category = "personal"; }
        if (A.calendar) { A.calendar.edition = "home"; A.calendar.category = "personal"; }
        ["workspace","browser","appstore","chat","media","taskBoard","spreadsheet","mailDrafts","contacts","reports"].forEach(id => { if (A[id]) A[id].category = "business"; });
        ["monitor","wallpaper","desktops","paint","themeLab","archiveManager","audioNotes"].forEach(id => { if (A[id]) A[id].category = "creative"; });
        ["terminal","devtools","codeStudio","debugConsole","buildInspector","registryEditor","scriptLab","apiTester","logViewer","services"].forEach(id => { if (A[id]) A[id].category = "developer"; });
        ["games","executiveDashboard","executiveControl","policyManager","auditCenter"].forEach(id => { if (A[id]) A[id].category = "executive"; });

        window.openHelpCenter = () => simpleWindow("Help Center", `<h3>Help Center</h3><div class="inset-panel">Welcome to EmeraldOS 5.3. Applications are now organized into desktop folders. Double-click a folder to open its apps.</div>`, "helpCenter");
        window.openScratchPad = () => simpleWindow("Scratch Pad", `<h3>Scratch Pad</h3><textarea id="scratchpad_text" style="width:100%;height:190px;">${safeT4(localStorage.getItem('40_scratchpad') || '')}</textarea><br><button onclick="localStorage.setItem('40_scratchpad',document.getElementById('scratchpad_text').value);notify('Scratch Pad','Saved.',2500,'success')">Save</button>`, "scratchPad");
        window.openUnitConverter = () => simpleWindow("Unit Converter", `<h3>Unit Converter</h3><input id="conv_value" type="number" placeholder="Value"><select id="conv_type"><option value="mi-km">Miles to km</option><option value="km-mi">Km to miles</option><option value="lb-kg">Pounds to kg</option><option value="kg-lb">Kg to pounds</option></select><button onclick="runUnitConverter()">Convert</button><div id="conv_out" class="inset-panel"></div>`, "unitConverter");
        window.runUnitConverter = function(){const v=parseFloat(document.getElementById('conv_value')?.value||'0');const t=document.getElementById('conv_type')?.value;const out=document.getElementById('conv_out');const m={"mi-km":v*1.60934,"km-mi":v/1.60934,"lb-kg":v*0.453592,"kg-lb":v/0.453592}; if(out) out.textContent=Number.isFinite(m[t])?m[t].toFixed(3):'Invalid';};
        window.openJournal = () => simpleWindow("Journal", `<h3>Journal</h3><textarea id="journal_text" style="width:100%;height:200px;">${safeT4(localStorage.getItem('40_journal') || '')}</textarea><br><button onclick="localStorage.setItem('40_journal',document.getElementById('journal_text').value);notify('Journal','Saved.',2500,'success')">Save</button>`, "journal");
        window.openReminderBoard = () => simpleWindow("Reminder Board", `<h3>Reminder Board</h3><input id="reminder_new" placeholder="New reminder"><button onclick="addReminderT4()">Add</button><div id="reminder_list">${renderRemindersT4()}</div>`, "reminders");
        window.addReminderT4 = function(){const val=document.getElementById('reminder_new')?.value.trim();if(!val)return;const arr=JSON.parse(localStorage.getItem('40_reminders')||'[]');arr.push(val);localStorage.setItem('40_reminders',JSON.stringify(arr));window.openReminderBoard();};
        window.removeReminderT4 = function(i){const arr=JSON.parse(localStorage.getItem('40_reminders')||'[]');arr.splice(i,1);localStorage.setItem('40_reminders',JSON.stringify(arr));window.openReminderBoard();};
        window.openProjectPlanner = () => simpleWindow("Project Planner", `<h3>Project Planner</h3><div class="inset-panel">Plan milestones, files, and reports for your workspace.</div><button onclick="notify('Project Planner','Timeline generated.',2500,'success')">Generate Timeline</button>`, "projectPlanner");
        window.openInvoiceBuilder = () => simpleWindow("Invoice Builder", `<h3>Invoice Builder</h3><input id="invoice_client" placeholder="Client"><input id="invoice_amount" placeholder="Amount"><button onclick="document.getElementById('invoice_out').textContent='Invoice for '+document.getElementById('invoice_client').value+': $'+document.getElementById('invoice_amount').value">Build</button><pre id="invoice_out"></pre>`, "invoiceBuilder");
        window.openPresentationLite = () => simpleWindow("Presentation Lite", `<h3>Presentation Lite</h3><textarea style="width:100%;height:180px;" placeholder="Slide notes"></textarea><br><button onclick="notify('Presentation Lite','Slides saved locally.',2500,'success')">Save Deck</button>`, "presentationLite");
        window.openIconStudio = () => simpleWindow("Icon Studio", `<h3>Icon Studio</h3><div class="inset-panel">Create simple icon labels for desktop apps.</div><input id="icon_text" placeholder="Icon text"><button onclick="document.getElementById('icon_preview').textContent=document.getElementById('icon_text').value||'□'">Preview</button><div id="icon_preview" class="desktop-icon-symbol">□</div>`, "iconStudio");
        window.openColorMixer = () => simpleWindow("Color Mixer", `<h3>Color Mixer</h3><input id="color_mix" type="color" value="#008080"><button onclick="setWallpaper(document.getElementById('color_mix').value)">Apply to Desktop</button>`, "colorMixer");
        window.openFontBook = () => simpleWindow("Font Book", `<h3>Font Book</h3>${['MS Sans Serif','Tahoma','Arial','Courier New','Georgia'].map(f=>`<div class="inset-panel" style="font-family:${f}">${f}: The quick brown fox jumps over the lazy dog.</div>`).join('')}`, "fontBook");
        window.openPackageManager = () => simpleWindow("Package Manager", `<h3>Package Manager</h3><div class="inset-panel">Installed packages:<br>emerald40-core<br>desktop-shell<br>registry-service<br>app-folders<br>firebase-layout-sync</div>`, "packageManager");
        window.openNetworkTools = () => simpleWindow("Network Tools", `<h3>Network Tools</h3><input id="net_host" placeholder="Host"><button onclick="document.getElementById('net_out').textContent='Ping simulated: '+document.getElementById('net_host').value+' OK'">Ping</button><pre id="net_out"></pre>`, "networkTools");
        window.openJSONStudio = () => simpleWindow("JSON Studio", `<h3>JSON Studio</h3><textarea id="json_in" style="width:100%;height:160px;">{}</textarea><button onclick="try{document.getElementById('json_out').textContent=JSON.stringify(JSON.parse(document.getElementById('json_in').value),null,2)}catch(e){document.getElementById('json_out').textContent=e.message}">Format</button><pre id="json_out"></pre>`, "jsonStudio");
        window.openDeploymentCenter = () => simpleWindow("Deployment Center", `<h3>Deployment Center</h3><div class="inset-panel">Prepare EmeraldOS builds for staging.</div><button onclick="notify('Deployment Center','Deployment checklist complete.',2500,'success')">Run Checklist</button>`, "deploymentCenter");
        window.openLicenseManager = () => simpleWindow("License Manager", `<h3>License Manager</h3><div class="inset-panel"><b>Active edition:</b> ${safeT4(localStorage.getItem('40_edition_name') || 'EmeraldOS Virtue')}<br><b>Build:</b> EmeraldOS 5.3</div>`, "licenseManager");

        registerSimpleApp("allApps", { name: "Applications", icon: "▦", edition: "economy", category: "essential", launch: () => window.openAllApplications() });
        registerSimpleApp("helpCenter", { name: "Help Center", icon: "?", edition: "economy", category: "essential", launch: () => window.openHelpCenter() });
        registerSimpleApp("scratchPad", { name: "Scratch Pad", icon: "TXT", edition: "economy", category: "essential", launch: () => window.openScratchPad() });
        registerSimpleApp("unitConverter", { name: "Unit Converter", icon: "123", edition: "economy", category: "essential", launch: () => window.openUnitConverter() });
        registerSimpleApp("journal", { name: "Journal", icon: "JRN", edition: "home", category: "personal", launch: () => window.openJournal() });
        registerSimpleApp("reminders", { name: "Reminder Board", icon: "REM", edition: "home", category: "personal", launch: () => window.openReminderBoard() });
        registerSimpleApp("projectPlanner", { name: "Project Planner", icon: "PLAN", edition: "business", category: "business", launch: () => window.openProjectPlanner() });
        registerSimpleApp("invoiceBuilder", { name: "Invoice Builder", icon: "INV", edition: "business", category: "business", launch: () => window.openInvoiceBuilder() });
        registerSimpleApp("presentationLite", { name: "Presentation Lite", icon: "PPT", edition: "business", category: "business", launch: () => window.openPresentationLite() });
        registerSimpleApp("iconStudio", { name: "Icon Studio", icon: "ICO", edition: "virtue", category: "creative", launch: () => window.openIconStudio() });
        registerSimpleApp("colorMixer", { name: "Color Mixer", icon: "RGB", edition: "virtue", category: "creative", launch: () => window.openColorMixer() });
        registerSimpleApp("fontBook", { name: "Font Book", icon: "Aa", edition: "virtue", category: "creative", launch: () => window.openFontBook() });
        registerSimpleApp("packageManager", { name: "Package Manager", icon: "PKG", edition: "developer", category: "developer", launch: () => window.openPackageManager() });
        registerSimpleApp("networkTools", { name: "Network Tools", icon: "NET", edition: "developer", category: "developer", launch: () => window.openNetworkTools() });
        registerSimpleApp("jsonStudio", { name: "JSON Studio", icon: "{}", edition: "developer", category: "developer", launch: () => window.openJSONStudio() });
        registerSimpleApp("deploymentCenter", { name: "Deployment Center", icon: "DEP", edition: "executive", category: "executive", launch: () => window.openDeploymentCenter() });
        registerSimpleApp("licenseManager", { name: "License Manager", icon: "LIC", edition: "executive", category: "executive", launch: () => window.openLicenseManager() });
    }

    function renderRemindersT4(){const arr=JSON.parse(localStorage.getItem('40_reminders')||'[]');return arr.map((r,i)=>`<div class="file-row"><span>${safeT4(r)}</span><button onclick="removeReminderT4(${i})">Remove</button></div>`).join('')||'<div class="inset-panel">No reminders yet.</div>';}

    function installRegistryT4() {
        try {
            if (window.EmeraldOSRegistry?.set) {
                window.EmeraldOSRegistry.set("HKEY_CURRENT_USER\\Software\\EmeraldOS\\Explorer\\ApplicationFolders", "Enabled");
                window.EmeraldOSRegistry.set("HKEY_CURRENT_USER\\Software\\EmeraldOS\\Explorer\\DefaultEdition", "Economy");
                window.EmeraldOSRegistry.set("HKEY_LOCAL_MACHINE\\System\\Build\\Version", "5.3");
                window.EmeraldOSRegistry.set("HKEY_LOCAL_MACHINE\\System\\Policies\\EconomyEdition", "Enabled");
                window.EmeraldOSRegistry.set("HKEY_LOCAL_MACHINE\\Software\\EmeraldOS\\Applications\\StorageMode", "Folderized");
            }
        } catch (err) {
            console.warn("T4 registry defaults failed:", err);
        }
    }

    function terminalWriteT4(raw, result) {
        const output = document.getElementById("terminal_output");
        if (!output) return;
        output.innerHTML += `> ${safeT4(raw)}<br>${result}<br><br>`;
        output.scrollTop = output.scrollHeight;
        const input = document.getElementById("terminal_input");
        if (input) input.value = "";
    }

    function installTerminalCommandsT4() {
        const original = window.runCommand;
        if (typeof original !== "function" || original.__t4Wrapped) return;
        const wrapped = async function(cmdLine = "") {
            const raw = String(cmdLine).trim();
            const parts = raw.match(/"([^"]*)"|'([^']*)'|(\S+)/g)?.map(x => x.replace(/^['"]|['"]$/g, "")) || [];
            const command = (parts.shift() || "").toLowerCase();
            let result = null;
            if (!command) return;
            if (command === "help") {
                result = [
                    "T4: appfolders, folder.open <id>, edition.level, build, registry.find <text>, registry.roots, desktop.sync, package.list, package.info <name>",
                    "Core: help, clear, version, about, whoami, edition, apps, open <appId>, tasklist, pwd, cd, ls, touch, mkdir, rm",
                    "Registry: registry.list, registry.get, registry.set, registry.delete, registry.export, registry.reset"
                ].map(s => safeT4(s)).join("<br>");
            } else if (command === "version" || command === "build") {
                result = "EmeraldOS 5.3 Desktop Folders Suite Build";
            } else if (command === "about") {
                result = "EmeraldOS 5.3 adds true desktop app folders, consolidated app suites, HTML/Markdown/CSV viewers, registry defaults, and Firebase desktop layout sync.";
            } else if (command === "appfolders") {
                result = getVisibleCategoriesT4().map(c => `${safeT4(c.id)} - ${safeT4(c.name)} (${getAppsForCategoryT4(c.id).length} apps)`).join("<br>") || "No visible folders.";
            } else if (command === "folder.open") {
                const id = parts[0];
                if (!APP_CATEGORIES_T4[id]) result = "Usage: folder.open <essential|personal|business|creative|developer|executive>";
                else { window.openAppFolderT4(id); result = "Opened folder: " + safeT4(id); }
            } else if (command === "edition.level") {
                result = String(window.getActiveEditionLevel?.() || "unknown");
            } else if (command === "registry.find" || command === "reg.find") {
                const q = parts.join(" ").toLowerCase();
                const reg = window.EmeraldOSRegistry?.export?.() || {};
                result = Object.keys(reg).filter(k => k.toLowerCase().includes(q) || String(reg[k]).toLowerCase().includes(q)).map(k => `${safeT4(k)} = ${safeT4(reg[k])}`).join("<br>") || "No matching registry values.";
            } else if (command === "registry.roots" || command === "reg.roots") {
                result = "HKEY_CURRENT_USER<br>HKEY_LOCAL_MACHINE<br>HKEY_CLASSES_ROOT<br>HKEY_USERS<br>HKEY_CURRENT_CONFIG";
            } else if (command === "desktop.sync") {
                try { await saveUserSettings?.({ desktopPositions: getPositionsT4() }); result = "Desktop layout synced to Firebase."; } catch(err) { result = "Sync failed: " + safeT4(err.message || err); }
            } else if (command === "package.list") {
                result = ["emerald40-core", "app-folders", "virtue-default", "registry-service", "firebase-layout-sync", "developer-tools"].join("<br>");
            } else if (command === "package.info") {
                result = "Package: " + safeT4(parts[0] || "unknown") + "<br>Status: installed<br>Build: 5.3";
            }
            if (result !== null) {
                terminalWriteT4(raw, result);
                return;
            }
            return original.call(this, cmdLine);
        };
        wrapped.__t4Wrapped = true;
        window.runCommand = wrapped;
    }

    function installContextMenuT4() {
        const desktop = document.getElementById("desktop");
        const menu = document.getElementById("context-menu");
        if (!desktop || !menu || desktop.__t4ContextInstalled) return;
        desktop.__t4ContextInstalled = true;
        desktop.addEventListener("contextmenu", e => {
            if (e.target.closest(".desktop-item")) return;
            e.preventDefault();
            menu.style.left = e.clientX + "px";
            menu.style.top = e.clientY + "px";
            menu.innerHTML = `
                <div class="context-item" onclick="openAllApplications()">Open Applications</div>
                <div class="context-item" onclick="openAppFolderT4('essential')">Essential Apps</div>
                <div class="context-item" onclick="createFileOnDesktop()">New File</div>
                <div class="context-item" onclick="createFolderOnDesktop()">New Folder</div>
                <div class="context-item" onclick="uploadFileToDesktop()">Upload To Desktop</div>
                <div class="context-item" onclick="resetDesktopLayoutT4()">Reset Icon Layout</div>
                <div class="context-item" onclick="refreshDesktop()">Refresh</div>`;
            menu.classList.add("show");
        }, true);
    }

    window.resetDesktopLayoutT4 = async function() {
        localStorage.removeItem(DESKTOP_POS_KEY_T4);
        try { await saveUserSettings?.({ desktopPositions: {} }); } catch {}
        renderDesktopT4();
        window.notify?.("Desktop", "Application folder layout reset.", 2500, "info");
    };

    window.EMERALDOS_APP_CATEGORIES = APP_CATEGORIES_T4;

    function initT4() {
        if (window.__emerald40T4Loaded) return;
        window.__emerald40T4Loaded = true;
        installT4Apps();
        installRegistryT4();
        window.renderDesktop = renderDesktopT4;
        window.renderStartMenu = renderStartMenuT4;
        window.refreshEditionVisibility = function () {
            renderDesktopT4();
            renderStartMenuT4();
            document.querySelectorAll(".window").forEach(win => {
                const appId = win.dataset.app;
                const app = window.APPS?.[appId];
                if (app && typeof window.canSeeApp === "function" && !window.canSeeApp(app)) {
                    if (win.taskbarButton) win.taskbarButton.remove();
                    win.remove();
                }
            });
            window.saveSession?.();
        };
        installTerminalCommandsT4();
        /* 5.3 hotfix: context menu disabled; final Win95 menu owns desktop right-click. */
        renderDesktopT4();
        renderStartMenuT4();
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", () => setTimeout(initT4, 900));
    } else {
        setTimeout(initT4, 900);
    }
})();


/* =========================================================
   EMERALDOS 5.3
   True Desktop App Folders + Consolidated Application Suites
========================================================= */
(function () {
    "use strict";

    const BUILD_LABEL_T5 = "EmeraldOS 5.3";
    const DESKTOP_POS_KEY_T5 = "40_desktop_positions_v5";
    const APP_FOLDER_PREFIX_T5 = "appfolder:";

    const APP_CATEGORIES_T5 = {
        essential: {
            id: "essential",
            name: "Essential Apps",
            icon: "📁",
            edition: "economy",
            description: "Core operating system tools, files, settings, help, and basic utilities."
        },
        office: {
            id: "office",
            name: "Office Apps",
            icon: "📁",
            edition: "home",
            description: "Writing, notes, documents, planning, reminders, and viewing tools."
        },
        internet: {
            id: "internet",
            name: "Internet Apps",
            icon: "📁",
            edition: "business",
            description: "Browser, chat, preview, and network-facing tools."
        },
        business: {
            id: "business",
            name: "Business Apps",
            icon: "📁",
            edition: "business",
            description: "Workspace, reports, invoices, planning, contacts, and productivity tools."
        },
        creative: {
            id: "creative",
            name: "Creative Apps",
            icon: "📁",
            edition: "virtue",
            description: "Paint, media, themes, color, fonts, icon work, and creative utilities."
        },
        developer: {
            id: "developer",
            name: "Developer Apps",
            icon: "📁",
            edition: "developer",
            description: "Terminal, registry, code, JSON, API, debugging, packages, and deployment tools."
        },
        executive: {
            id: "executive",
            name: "Executive Apps",
            icon: "📁",
            edition: "executive",
            description: "Executive control, policy, audit, licensing, and enterprise tools."
        }
    };

    const CONSOLIDATED_HIDDEN_APPS_T5 = new Set([
        "notes", "docs", "scratchPad", "journal", "reminders",
        "calculator", "clock", "calendar", "unitConverter",
        "workspace", "projectPlanner", "invoiceBuilder", "presentationLite", "taskBoard", "spreadsheetLite", "mailDrafts", "contacts", "reports",
        "browser", "chat",
        "media", "paint", "themeLab", "archiveManager", "audioNotes", "iconStudio", "colorMixer", "fontBook", "wallpaper", "desktops",
        "terminal", "devtools", "codeStudio", "debugConsole", "buildInspector", "registryEditor", "scriptLab", "apiTester", "logViewer", "services", "networkTools", "jsonStudio", "packageManager",
        "executiveDashboard", "executiveControl", "policyManager", "auditCenter", "deploymentCenter", "licenseManager"
    ]);

    function safeT5(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function canSeeEditionT5(requiredEdition = "economy") {
        if (typeof window.canSeeEdition === "function") {
            return window.canSeeEdition(requiredEdition);
        }
        return true;
    }

    function canSeeAppT5(app) {
        if (!app || app.hiddenStandalone === true) return false;
        if (!canSeeEditionT5(app.edition || "economy")) return false;
        return true;
    }

    function getVisibleAppEntriesT5() {
        return Object.entries(window.APPS || {})
            .filter(([id, app]) => canSeeAppT5(app))
            .sort((a, b) => String(a[1].name).localeCompare(String(b[1].name)));
    }

    function getVisibleCategoriesT5() {
        const entries = getVisibleAppEntriesT5();
        return Object.values(APP_CATEGORIES_T5).filter(category => {
            if (!canSeeEditionT5(category.edition || "economy")) return false;
            return entries.some(([id, app]) => (app.category || "essential") === category.id);
        });
    }

    function getAppsForCategoryT5(categoryId) {
        return getVisibleAppEntriesT5().filter(([id, app]) => (app.category || "essential") === categoryId);
    }

    function simpleWindowT5(title, html, appId) {
        if (typeof window.openWindow === "function") {
            window.openWindow(title, `<div class="app-panel">${html}</div>`, appId || "app");
        }
    }

    function buttonT5(label, action) {
        return `<button class="win95-small-button" onclick="${action}">${safeT5(label)}</button>`;
    }

    function registerAppT5(id, app) {
        window.APPS[id] = Object.assign({ edition: "economy", category: "essential" }, app);
    }

    function hideOldAppsT5() {
        Object.keys(window.APPS || {}).forEach(id => {
            if (CONSOLIDATED_HIDDEN_APPS_T5.has(id)) {
                window.APPS[id].hiddenStandalone = true;
            }
        });
    }

    function callIfAvailableT5(fnName, fallbackTitle) {
        if (typeof window[fnName] === "function") {
            window[fnName]();
        } else {
            simpleWindowT5(fallbackTitle || fnName, `<h3>${safeT5(fallbackTitle || fnName)}</h3><p>This module is not installed in this build.</p>`, fnName);
        }
    }

    function installT5Apps() {
        hideOldAppsT5();

        registerAppT5("files", Object.assign(window.APPS.files || {}, { name: "Files", icon: "📁", edition: "economy", category: "essential", hiddenStandalone: false }));
        registerAppT5("system", Object.assign(window.APPS.system || {}, { name: "System", icon: "SYS", edition: "economy", category: "essential", hiddenStandalone: false }));
        registerAppT5("plans", Object.assign(window.APPS.plans || {}, { name: "Plans", icon: "PLAN", edition: "economy", category: "essential", hiddenStandalone: false }));
        registerAppT5("about", Object.assign(window.APPS.about || {}, { name: "About EmeraldOS", icon: "i", edition: "economy", category: "essential", hiddenStandalone: false }));

        registerAppT5("utilitiesSuite", {
            name: "Utilities Center",
            icon: "UTIL",
            edition: "economy",
            category: "essential",
            launch: () => simpleWindowT5("Utilities Center", `
                <h3>Utilities Center</h3>
                <div class="suite-grid">
                    ${buttonT5("Calculator", "openCalculator()")}
                    ${buttonT5("Clock", "openClockApp()")}
                    ${buttonT5("Calendar", "openCalendar()")}
                    ${buttonT5("Unit Converter", "openUnitConverter()")}
                    ${buttonT5("System Profiler", "openSystemProfilerT5()")}
                    ${buttonT5("Clipboard Board", "openClipboardBoardT5()")}
                </div>
            `, "utilitiesSuite")
        });

        registerAppT5("writingStudio", {
            name: "Writing Studio",
            icon: "WRITE",
            edition: "home",
            category: "office",
            launch: () => simpleWindowT5("Writing Studio", `
                <h3>Writing Studio</h3>
                <p>Notes, documents, scratch writing, journal entries, reminders, and quick planning are consolidated here.</p>
                <div class="suite-grid">
                    ${buttonT5("Notes", "openNotes()")}
                    ${buttonT5("Docs", "openDocs()")}
                    ${buttonT5("Scratch Pad", "openScratchPad()")}
                    ${buttonT5("Journal", "openJournal()")}
                    ${buttonT5("Reminder Board", "openReminderBoard()")}
                    ${buttonT5("Markdown Viewer", "openMarkdownViewerT5()")}
                </div>
            `, "writingStudio")
        });

        registerAppT5("viewerStudio", {
            name: "Viewer Studio",
            icon: "VIEW",
            edition: "home",
            category: "office",
            launch: () => simpleWindowT5("Viewer Studio", `
                <h3>Viewer Studio</h3>
                <p>Preview HTML, Markdown, CSV, plain text, and simple snippets.</p>
                <div class="suite-grid">
                    ${buttonT5("HTML Viewer", "openHTMLViewerT5()")}
                    ${buttonT5("Markdown Viewer", "openMarkdownViewerT5()")}
                    ${buttonT5("CSV Viewer", "openCSVViewerT5()")}
                    ${buttonT5("Text Viewer", "openTextViewerT5()")}
                </div>
            `, "viewerStudio")
        });

        registerAppT5("internetSuite", {
            name: "Internet Suite",
            icon: "WEB",
            edition: "business",
            category: "internet",
            launch: () => simpleWindowT5("Internet Suite", `
                <h3>Internet Suite</h3>
                <div class="suite-grid">
                    ${buttonT5("Browser", "openBrowser()")}
                    ${buttonT5("Chat", "launchAppRawT5('chat')")}
                    ${buttonT5("HTML Viewer", "openHTMLViewerT5()")}
                    ${buttonT5("Network Tools", "openNetworkTools()")}
                </div>
            `, "internetSuite")
        });

        registerAppT5("businessSuite", {
            name: "Business Suite",
            icon: "BIZ",
            edition: "business",
            category: "business",
            launch: () => simpleWindowT5("Business Suite", `
                <h3>Business Suite</h3>
                <div class="suite-grid">
                    ${buttonT5("Workspace", "openBusinessWorkspace()")}
                    ${buttonT5("Project Planner", "openProjectPlanner()")}
                    ${buttonT5("Invoice Builder", "openInvoiceBuilder()")}
                    ${buttonT5("Presentation Lite", "openPresentationLite()")}
                    ${buttonT5("Spreadsheet Lite", "openSpreadsheetLiteT5()")}
                    ${buttonT5("Reports", "openReportsCenterT5()")}
                    ${buttonT5("Contacts", "openContactsBookT5()")}
                </div>
            `, "businessSuite")
        });

        registerAppT5("creativeSuite", {
            name: "Creative Suite",
            icon: "ART",
            edition: "virtue",
            category: "creative",
            launch: () => simpleWindowT5("Creative Suite", `
                <h3>Creative Suite</h3>
                <div class="suite-grid">
                    ${buttonT5("Paint", "openPaint()")}
                    ${buttonT5("Media Player", "launchAppRawT5('media')")}
                    ${buttonT5("Theme Lab", "openThemeLabT5()")}
                    ${buttonT5("Icon Studio", "openIconStudio()")}
                    ${buttonT5("Color Mixer", "openColorMixer()")}
                    ${buttonT5("Font Book", "openFontBook()")}
                    ${buttonT5("Image Inspector", "openImageInspectorT5()")}
                </div>
            `, "creativeSuite")
        });

        registerAppT5("developerSuite", {
            name: "Developer Suite",
            icon: "DEV",
            edition: "developer",
            category: "developer",
            launch: () => simpleWindowT5("Developer Suite", `
                <h3>Developer Suite</h3>
                <div class="suite-grid">
                    ${buttonT5("Terminal", "openTerminal()")}
                    ${buttonT5("Registry Editor", "openRegistryEditor()")}
                    ${buttonT5("Code Studio", "openCodeStudio()")}
                    ${buttonT5("Debug Console", "openDebugConsole()")}
                    ${buttonT5("Build Inspector", "openBuildInspector()")}
                    ${buttonT5("JSON Studio", "openJSONStudio()")}
                    ${buttonT5("API Tester", "openApiTesterT5()")}
                    ${buttonT5("Diff Viewer", "openDiffViewerT5()")}
                    ${buttonT5("HTML Viewer", "openHTMLViewerT5()")}
                </div>
            `, "developerSuite")
        });

        registerAppT5("executiveSuite", {
            name: "Executive Suite",
            icon: "EXEC",
            edition: "executive",
            category: "executive",
            launch: () => simpleWindowT5("Executive Suite", `
                <h3>Executive Suite</h3>
                <div class="suite-grid">
                    ${buttonT5("Executive Dashboard", "openExecutiveDashboard()")}
                    ${buttonT5("Policy Manager", "openPolicyManager()")}
                    ${buttonT5("Audit Center", "openAuditCenter()")}
                    ${buttonT5("Deployment Center", "openDeploymentCenter()")}
                    ${buttonT5("License Manager", "openLicenseManager()")}
                    ${buttonT5("Games", "launchAppRawT5('games')")}
                </div>
            `, "executiveSuite")
        });

        registerAppT5("htmlViewer", {
            name: "HTML Viewer",
            icon: "HTML",
            edition: "home",
            category: "office",
            launch: () => window.openHTMLViewerT5()
        });

        registerAppT5("markdownViewer", { name: "Markdown Viewer", icon: "MD", edition: "home", category: "office", launch: () => window.openMarkdownViewerT5() });
        registerAppT5("csvViewer", { name: "CSV Viewer", icon: "CSV", edition: "business", category: "business", launch: () => window.openCSVViewerT5() });
        registerAppT5("diffViewer", { name: "Diff Viewer", icon: "DIFF", edition: "developer", category: "developer", launch: () => window.openDiffViewerT5() });
        registerAppT5("systemProfiler", { name: "System Profiler", icon: "INFO", edition: "economy", category: "essential", launch: () => window.openSystemProfilerT5() });
        registerAppT5("clipboardBoard", { name: "Clipboard Board", icon: "CLIP", edition: "economy", category: "essential", launch: () => window.openClipboardBoardT5() });
    }

    window.launchAppRawT5 = function (id) {
        const app = window.APPS?.[id];
        if (app && typeof app.launch === "function") app.launch();
    };

    function getPositionsT5() {
        try { return JSON.parse(localStorage.getItem(DESKTOP_POS_KEY_T5) || "{}"); }
        catch { return {}; }
    }

    function savePositionsT5(data) {
        localStorage.setItem(DESKTOP_POS_KEY_T5, JSON.stringify(data));
        clearTimeout(savePositionsT5.timer);
        savePositionsT5.timer = setTimeout(async () => {
            try {
                if (typeof saveUserSettings === "function") {
                    await saveUserSettings({ desktopPositions: data });
                }
            } catch (err) {
                console.warn("T5 desktop sync failed:", err);
            }
        }, 700);
    }

    function defaultPosT5(index) {
        const row = index % 6;
        const col = Math.floor(index / 6);
        return { left: 12 + col * 92, top: 12 + row * 88 };
    }

    function makeDesktopIconT5({ key, icon, label, onOpen, type, itemId }, index) {
        const desktop = document.getElementById("desktop");
        if (!desktop) return;
        const positions = getPositionsT5();
        const pos = positions[key] || defaultPosT5(index);
        const el = document.createElement("div");
        el.className = "icon desktop-item t5-desktop-icon";
        el.dataset.desktopKey = key;
        el.dataset.itemType = type || "folder";
        if (itemId) el.dataset.itemId = itemId;
        el.style.position = "absolute";
        el.style.left = (parseInt(pos.left, 10) || 0) + "px";
        el.style.top = (parseInt(pos.top, 10) || 0) + "px";
        el.innerHTML = `<div class="desktop-icon-symbol">${safeT5(icon)}</div><div class="desktop-icon-label">${safeT5(label)}</div>`;

        let drag = null;
        let moved = false;
        el.addEventListener("mousedown", e => {
            if (e.button !== 0) return;
            e.preventDefault();
            moved = false;
            drag = { startX: e.clientX, startY: e.clientY, left: parseInt(el.style.left, 10) || 0, top: parseInt(el.style.top, 10) || 0 };
            el.classList.add("dragging");
        });
        document.addEventListener("mousemove", e => {
            if (!drag) return;
            const dx = e.clientX - drag.startX;
            const dy = e.clientY - drag.startY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
            const maxLeft = Math.max(0, window.innerWidth - 90);
            const maxTop = Math.max(0, window.innerHeight - 130);
            el.style.left = Math.min(maxLeft, Math.max(0, drag.left + dx)) + "px";
            el.style.top = Math.min(maxTop, Math.max(0, drag.top + dy)) + "px";
        });
        document.addEventListener("mouseup", () => {
            if (!drag) return;
            drag = null;
            el.classList.remove("dragging");
            const data = getPositionsT5();
            data[key] = { left: parseInt(el.style.left, 10) || 0, top: parseInt(el.style.top, 10) || 0 };
            savePositionsT5(data);
        });
        el.addEventListener("dblclick", e => {
            e.preventDefault();
            if (!moved && typeof onOpen === "function") onOpen();
        });
        el.addEventListener("click", e => {
            e.stopPropagation();
            document.querySelectorAll(".desktop-item.selected").forEach(item => item.classList.remove("selected"));
            el.classList.add("selected");
        });
        desktop.appendChild(el);
    }

    function getFileFolderT5(file) {
        return file.folder || file.parent || "Desktop";
    }

    function isDesktopFileT5(file) {
        return getFileFolderT5(file).toLowerCase() === "desktop" || file.showOnDesktop === true;
    }

    function fileIconT5(file) {
        const type = String(file.type || "").toLowerCase();
        const name = String(file.name || "").toLowerCase();
        if (type === "folder") return "📁";
        if (/\.(html|htm)$/.test(name)) return "HTML";
        if (/\.(md|markdown)$/.test(name)) return "MD";
        if (/\.(csv)$/.test(name)) return "CSV";
        if (/\.(js|css|json)$/.test(name)) return "</>";
        if (type.includes("image") || /\.(png|jpg|jpeg|gif|webp|svg)$/.test(name)) return "IMG";
        if (type.includes("audio") || /\.(mp3|wav|ogg|m4a|webm)$/.test(name)) return "AUD";
        return "📄";
    }

    function renderDesktopFoldersT5() {
        const desktop = document.getElementById("desktop");
        if (!desktop) return;
        desktop.innerHTML = "";
        let index = 0;

        getVisibleCategoriesT5().forEach(category => {
            makeDesktopIconT5({
                key: APP_FOLDER_PREFIX_T5 + category.id,
                icon: category.icon,
                label: category.name,
                type: "app-folder",
                itemId: category.id,
                onOpen: () => window.openAppFolderT5(category.id)
            }, index++);
        });

        Object.entries(window.fileSystem?.files || {}).forEach(([id, file]) => {
            if (!isDesktopFileT5(file)) return;
            makeDesktopIconT5({
                key: "file:" + id,
                icon: fileIconT5(file),
                label: file.name || "Untitled",
                type: "file",
                itemId: id,
                onOpen: () => window.openFile?.(id)
            }, index++);
        });
    }

    function renderStartFoldersT5() {
        const results = document.getElementById("start-results");
        if (!results) return;
        results.innerHTML = "";
        getVisibleCategoriesT5().forEach(category => {
            const item = document.createElement("div");
            item.className = "start-item start-folder-only";
            item.dataset.folder = category.id;
            item.innerHTML = `${safeT5(category.icon)} ${safeT5(category.name)}`;
            item.onclick = () => {
                window.openAppFolderT5(category.id);
                document.getElementById("start-menu")?.classList.remove("show");
            };
            results.appendChild(item);
        });
    }

    window.openAppFolderT5 = function (categoryId) {
        const category = APP_CATEGORIES_T5[categoryId];
        if (!category || !canSeeEditionT5(category.edition || "economy")) return;
        const apps = getAppsForCategoryT5(categoryId);
        const html = `
            <div class="app-folder-window">
                <h3>${safeT5(category.name)}</h3>
                <div class="inset-panel">${safeT5(category.description)}</div>
                <div class="app-folder-grid">
                    ${apps.map(([id, app]) => `
                        <button class="app-folder-tile" onclick="launchAppT5('${safeT5(id)}')">
                            <span class="app-folder-icon">${safeT5(app.icon || "□")}</span>
                            <span>${safeT5(app.name || id)}</span>
                        </button>
                    `).join("") || `<div class="inset-panel">No apps available in this folder for this edition.</div>`}
                </div>
            </div>`;
        window.openWindow?.(category.name, html, "appFolder_" + categoryId);
    };

    window.launchAppT5 = function (id) {
        const app = window.APPS?.[id];
        if (!canSeeAppT5(app)) return false;
        app.launch?.();
        return true;
    };

    function htmlPreviewDoc(src) {
        return `<!doctype html><html><head><meta charset="UTF-8"><style>body{font-family:Arial;padding:14px}</style></head><body>${src}</body></html>`;
    }

    window.openHTMLViewerT5 = function () {
        const sample = "<h1>EmeraldOS HTML Viewer</h1><p>Edit HTML on the left and press Preview.</p>";
        window.openWindow?.("HTML Viewer", `
            <div class="viewer-split">
                <div class="viewer-pane">
                    <div class="toolbar"><button onclick="previewHTMLT5()">Preview</button><button onclick="clearHTMLViewerT5()">Clear</button></div>
                    <textarea id="htmlViewerInput" class="viewer-textarea">${safeT5(sample)}</textarea>
                </div>
                <iframe id="htmlViewerFrame" class="viewer-frame"></iframe>
            </div>
        `, "htmlViewer");
        setTimeout(() => window.previewHTMLT5?.(), 50);
    };

    window.previewHTMLT5 = function () {
        const input = document.getElementById("htmlViewerInput");
        const frame = document.getElementById("htmlViewerFrame");
        if (!input || !frame) return;
        frame.srcdoc = htmlPreviewDoc(input.value);
    };

    window.clearHTMLViewerT5 = function () {
        const input = document.getElementById("htmlViewerInput");
        if (input) input.value = "";
        window.previewHTMLT5();
    };

    window.openMarkdownViewerT5 = function () {
        window.openWindow?.("Markdown Viewer", `
            <div class="viewer-split">
                <div class="viewer-pane">
                    <div class="toolbar"><button onclick="previewMarkdownT5()">Preview</button></div>
                    <textarea id="mdInput" class="viewer-textarea"># Markdown Viewer\n\n- Write markdown\n- Preview basic formatting</textarea>
                </div>
                <div id="mdOutput" class="viewer-output"></div>
            </div>
        `, "markdownViewer");
        setTimeout(() => window.previewMarkdownT5?.(), 50);
    };

    window.previewMarkdownT5 = function () {
        const input = document.getElementById("mdInput");
        const out = document.getElementById("mdOutput");
        if (!input || !out) return;
        let html = safeT5(input.value)
            .replace(/^### (.*)$/gm, "<h3>$1</h3>")
            .replace(/^## (.*)$/gm, "<h2>$1</h2>")
            .replace(/^# (.*)$/gm, "<h1>$1</h1>")
            .replace(/^\- (.*)$/gm, "<li>$1</li>")
            .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
            .replace(/\n/g, "<br>");
        out.innerHTML = html;
    };

    window.openCSVViewerT5 = function () {
        window.openWindow?.("CSV Viewer", `
            <div class="viewer-split">
                <div class="viewer-pane">
                    <div class="toolbar"><button onclick="previewCSVT5()">Preview Table</button></div>
                    <textarea id="csvInput" class="viewer-textarea">Name,Edition,Status\nEmeraldOS,Developer,Active\nHTML Viewer,Home,Installed</textarea>
                </div>
                <div id="csvOutput" class="viewer-output"></div>
            </div>
        `, "csvViewer");
        setTimeout(() => window.previewCSVT5?.(), 50);
    };

    window.previewCSVT5 = function () {
        const input = document.getElementById("csvInput");
        const out = document.getElementById("csvOutput");
        if (!input || !out) return;
        const rows = input.value.split(/\r?\n/).filter(Boolean).map(row => row.split(","));
        out.innerHTML = `<table class="win95-table">${rows.map((r,i)=>`<tr>${r.map(c=> i===0 ? `<th>${safeT5(c)}</th>` : `<td>${safeT5(c)}</td>`).join("")}</tr>`).join("")}</table>`;
    };

    window.openTextViewerT5 = function () {
        simpleWindowT5("Text Viewer", `<h3>Text Viewer</h3><textarea class="viewer-textarea" style="height:240px">Paste text here.</textarea>`, "textViewer");
    };

    window.openDiffViewerT5 = function () {
        window.openWindow?.("Diff Viewer", `
            <div class="viewer-split">
                <div class="viewer-pane"><textarea id="diffA" class="viewer-textarea">line one\nline two</textarea></div>
                <div class="viewer-pane"><div class="toolbar"><button onclick="runDiffT5()">Compare</button></div><textarea id="diffB" class="viewer-textarea">line one\nline changed</textarea><div id="diffOut" class="viewer-output"></div></div>
            </div>
        `, "diffViewer");
    };

    window.runDiffT5 = function () {
        const a = (document.getElementById("diffA")?.value || "").split(/\r?\n/);
        const b = (document.getElementById("diffB")?.value || "").split(/\r?\n/);
        const max = Math.max(a.length, b.length);
        const lines = [];
        for (let i = 0; i < max; i++) {
            if ((a[i] || "") === (b[i] || "")) lines.push(` ${safeT5(a[i] || "")}`);
            else {
                if (a[i] !== undefined) lines.push(`- ${safeT5(a[i])}`);
                if (b[i] !== undefined) lines.push(`+ ${safeT5(b[i])}`);
            }
        }
        const out = document.getElementById("diffOut");
        if (out) out.innerHTML = `<pre>${lines.join("\n")}</pre>`;
    };

    window.openSystemProfilerT5 = function () {
        simpleWindowT5("System Profiler", `
            <h3>System Profiler</h3>
            <div class="inset-panel">
                <b>Build:</b> ${BUILD_LABEL_T5}<br>
                <b>Edition:</b> ${safeT5(localStorage.getItem("40_edition_name") || "EmeraldOS Virtue")}<br>
                <b>Visible app folders:</b> ${getVisibleCategoriesT5().length}<br>
                <b>Visible apps:</b> ${getVisibleAppEntriesT5().length}<br>
                <b>Desktop items:</b> ${Object.keys(getPositionsT5()).length}
            </div>
        `, "systemProfiler");
    };

    window.openClipboardBoardT5 = function () {
        simpleWindowT5("Clipboard Board", `
            <h3>Clipboard Board</h3>
            <textarea id="clipBoardT5" class="viewer-textarea" style="height:220px" placeholder="Store temporary text here.">${safeT5(localStorage.getItem("40_clipboard_board") || "")}</textarea>
            <br><button onclick="localStorage.setItem('40_clipboard_board',document.getElementById('clipBoardT5').value);notify('Clipboard','Saved.',2500,'success')">Save</button>
        `, "clipboardBoard");
    };

    window.openSpreadsheetLiteT5 = () => simpleWindowT5("Spreadsheet Lite", `<h3>Spreadsheet Lite</h3><table class="win95-table"><tr><th>A</th><th>B</th><th>C</th></tr><tr><td contenteditable>Item</td><td contenteditable>Qty</td><td contenteditable>Total</td></tr><tr><td contenteditable></td><td contenteditable></td><td contenteditable></td></tr></table>`, "spreadsheetLite");
    window.openReportsCenterT5 = () => simpleWindowT5("Reports Center", `<h3>Reports Center</h3><div class="inset-panel">Create summaries, status reports, and internal notes.</div><textarea class="viewer-textarea" style="height:180px"></textarea>`, "reportsCenter");
    window.openContactsBookT5 = () => simpleWindowT5("Contacts Book", `<h3>Contacts Book</h3><div class="inset-panel">Name | Department | Notes</div><textarea class="viewer-textarea" style="height:180px"></textarea>`, "contactsBook");
    window.openThemeLabT5 = () => simpleWindowT5("Theme Lab", `<h3>Theme Lab</h3><button onclick="setTheme('classic')">Classic</button> <button onclick="setTheme('dark')">Dark</button> <button onclick="setTheme('light')">Light</button> <button onclick="setTheme('midnight')">Midnight</button>`, "themeLab");
    window.openImageInspectorT5 = () => simpleWindowT5("Image Inspector", `<h3>Image Inspector</h3><input type="file" accept="image/*" onchange="inspectImageT5(this.files[0])"><div id="imageInspectOut" class="inset-panel">Choose an image.</div>`, "imageInspector");
    window.inspectImageT5 = function(file){ const out=document.getElementById('imageInspectOut'); if(out&&file) out.innerHTML=`<b>Name:</b> ${safeT5(file.name)}<br><b>Size:</b> ${file.size} bytes<br><b>Type:</b> ${safeT5(file.type)}`; };
    window.openApiTesterT5 = () => simpleWindowT5("API Tester", `<h3>API Tester</h3><p>Local test shell for request planning.</p><input style="width:100%" value="https://example.com/api"><textarea class="viewer-textarea" style="height:140px">GET /api</textarea>`, "apiTester");

    window.resetDesktopLayoutT5 = async function () {
        localStorage.removeItem(DESKTOP_POS_KEY_T5);
        try { await saveUserSettings?.({ desktopPositions: {} }); } catch {}
        renderDesktopFoldersT5();
        window.notify?.("Desktop", "Desktop folder layout reset.", 2500, "info");
    };

    function installContextMenuT5() {
        const desktop = document.getElementById("desktop");
        const menu = document.getElementById("context-menu");
        if (!desktop || !menu || desktop.__t5ContextInstalled) return;
        desktop.__t5ContextInstalled = true;
        desktop.addEventListener("contextmenu", e => {
            if (e.target.closest(".desktop-item")) return;
            e.preventDefault();
            menu.style.left = e.clientX + "px";
            menu.style.top = e.clientY + "px";
            menu.innerHTML = `
                <div class="context-item" onclick="openAppFolderT5('essential')">Essential Apps</div>
                <div class="context-item" onclick="openAppFolderT5('office')">Office Apps</div>
                <div class="context-item" onclick="createFileOnDesktop()">New File On Desktop</div>
                <div class="context-item" onclick="createFolderOnDesktop()">New Folder On Desktop</div>
                <div class="context-item" onclick="uploadFileToDesktop()">Upload To Desktop</div>
                <div class="context-item" onclick="resetDesktopLayoutT5()">Reset Desktop Layout</div>
                <div class="context-item" onclick="refreshDesktop()">Refresh</div>`;
            menu.classList.add("show");
        }, true);
    }

    function installTerminalCommandsT5() {
        const original = window.runCommand;
        if (typeof original !== "function" || original.__t5Wrapped) return;
        const wrapped = async function (cmdLine = "") {
            const raw = String(cmdLine).trim();
            const parts = raw.match(/"([^"]*)"|'([^']*)'|(\S+)/g)?.map(x => x.replace(/^["']|["']$/g, "")) || [];
            const command = (parts.shift() || "").toLowerCase();
            let result = null;
            if (command === "appfolders" || command === "folders") {
                result = getVisibleCategoriesT5().map(c => `${safeT5(c.id)} - ${safeT5(c.name)} (${getAppsForCategoryT5(c.id).length} apps)`).join("<br>") || "No folders visible.";
            } else if (command === "folder.open") {
                const id = parts[0];
                if (!APP_CATEGORIES_T5[id]) result = "Usage: folder.open <essential|office|internet|business|creative|developer|executive>";
                else { window.openAppFolderT5(id); result = "Opened folder: " + safeT5(id); }
            } else if (command === "version" || command === "build") {
                result = "EmeraldOS 5.3 Desktop Folders Suite Build";
            } else if (command === "htmlviewer") {
                window.openHTMLViewerT5();
                result = "Opened HTML Viewer.";
            }
            if (result !== null) {
                const output = document.getElementById("terminal_output");
                if (output) {
                    output.innerHTML += `> ${safeT5(raw)}<br>${result}<br><br>`;
                    output.scrollTop = output.scrollHeight;
                    const input = document.getElementById("terminal_input");
                    if (input) input.value = "";
                }
                return;
            }
            return original.call(this, cmdLine);
        };
        wrapped.__t5Wrapped = true;
        window.runCommand = wrapped;
    }

    function injectStylesT5() {
        if (document.getElementById("emerald40-styles")) return;
        const style = document.createElement("style");
        style.id = "emerald40-styles";
        style.textContent = `
            .suite-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-top:10px}
            .win95-small-button{background:#c0c0c0;border:2px solid;border-color:#fff #808080 #808080 #fff;padding:6px;font-family:inherit;text-align:left;cursor:pointer}
            .win95-small-button:active{border-color:#808080 #fff #fff #808080}
            .app-folder-window{padding:10px;height:100%;box-sizing:border-box;overflow:auto;background:#c0c0c0}
            .app-folder-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;margin-top:10px}
            .app-folder-tile{min-height:72px;background:#d4d0c8;border:2px solid;border-color:#fff #808080 #808080 #fff;font-family:inherit;cursor:pointer;text-align:center;padding:8px}
            .app-folder-tile:active{border-color:#808080 #fff #fff #808080}
            .app-folder-icon{display:block;font-weight:bold;margin-bottom:6px;font-size:16px}
            .viewer-split{display:grid;grid-template-columns:1fr 1fr;height:100%;gap:8px;padding:8px;box-sizing:border-box;background:#c0c0c0}
            .viewer-pane{display:flex;flex-direction:column;min-height:0}
            .viewer-textarea{width:100%;flex:1;min-height:160px;box-sizing:border-box;font-family:"Courier New",monospace;font-size:12px;background:#fff;border:2px inset #fff;padding:6px}
            .viewer-frame,.viewer-output{width:100%;height:100%;background:#fff;border:2px inset #fff;padding:8px;box-sizing:border-box;overflow:auto}
            .win95-table{width:100%;border-collapse:collapse;background:#fff}.win95-table th,.win95-table td{border:1px solid #808080;padding:4px;text-align:left}.win95-table th{background:#000080;color:#fff}
            .start-folder-only{font-weight:bold}
        `;
        document.head.appendChild(style);
    }

    function setRegistryDefaultsT5() {
        try {
            window.EmeraldOSRegistry?.set?.("HKEY_LOCAL_MACHINE\\System\\Build\\Version", "5.3");
            window.EmeraldOSRegistry?.set?.("HKEY_CURRENT_USER\\Software\\EmeraldOS\\Explorer\\DesktopMode", "FoldersOnly");
            window.EmeraldOSRegistry?.set?.("HKEY_LOCAL_MACHINE\\Software\\EmeraldOS\\Applications\\Consolidation", "SuiteAppsEnabled");
            window.EmeraldOSRegistry?.set?.("HKEY_CLASSES_ROOT\\.html\\DefaultApp", "HTML Viewer");
            window.EmeraldOSRegistry?.set?.("HKEY_CLASSES_ROOT\\.md\\DefaultApp", "Markdown Viewer");
            window.EmeraldOSRegistry?.set?.("HKEY_CLASSES_ROOT\\.csv\\DefaultApp", "CSV Viewer");
        } catch (err) {
            console.warn("T5 registry defaults failed:", err);
        }
    }

    function initT5() {
        if (window.__emerald40T5Loaded) return;
        window.__emerald40T5Loaded = true;
        injectStylesT5();
        installT5Apps();
        setRegistryDefaultsT5();
        window.renderDesktopOverride = renderDesktopFoldersT5;
        window.renderStartMenuOverride = renderStartFoldersT5;
        window.renderDesktop = renderDesktopFoldersT5;
        window.renderStartMenu = renderStartFoldersT5;
        window.refreshEditionVisibility = function () {
            renderDesktopFoldersT5();
            renderStartFoldersT5();
            document.querySelectorAll(".window").forEach(win => {
                const appId = win.dataset.app;
                const app = window.APPS?.[appId];
                if (app && !canSeeAppT5(app)) {
                    win.taskbarButton?.remove?.();
                    win.remove();
                }
            });
            window.saveSession?.();
        };
        /* 5.3 hotfix: context menu disabled; final Win95 menu owns desktop right-click. */
        installTerminalCommandsT5();
        renderDesktopFoldersT5();
        renderStartFoldersT5();
        window.notify?.("EmeraldOS", "5.3 loaded with desktop folders and app suites.", 3200, "success");
    }

    window.EMERALDOS_APP_CATEGORIES = APP_CATEGORIES_T5;

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", () => setTimeout(initT5, 120));
    } else {
        setTimeout(initT5, 120);
    }
})();


/* =========================================================
   EMERALDOS 5.3 APPLICATION UPDATE
   More apps + Firebase Storage visibility helpers
========================================================= */
(function () {
    if (window.EmeraldOS41ApplicationUpdateLoaded) return;
    window.EmeraldOS41ApplicationUpdateLoaded = true;

    function safe41(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function can41(edition) {
        return typeof window.canSeeEdition === "function" ? window.canSeeEdition(edition) : true;
    }

    function register41(id, app) {
        if (!window.APPS) return;
        window.APPS[id] = Object.assign({ edition: "home", category: "office" }, app);
    }

    function simple41(title, body, appId) {
        window.openWindow?.(title, `<div class="app-panel emerald41-panel">${body}</div>`, appId || "app");
    }

    function button41(label, action) {
        return `<button class="win95-small-button" onclick="${action}">${safe41(label)}</button>`;
    }

    function filesArray41() {
        return Object.entries(window.fileSystem?.files || {});
    }

    function isLarge41(file) {
        return !!file.hasStorageBlob || Number(file.storageSize || file.size || 0) > 1024 * 1024;
    }

    window.openStorageManager41 = function () {
        const files = filesArray41();
        const large = files.filter(([id, f]) => isLarge41(f));
        const rows = files.map(([id, f]) => `
            <tr>
                <td>${safe41(f.name || id)}</td>
                <td>${safe41(f.type || f.mimeType || "file")}</td>
                <td>${Number(f.storageSize || f.size || 0).toLocaleString()}</td>
                <td>${f.hasStorageBlob ? "Firebase Storage" : "Firestore"}</td>
            </tr>`).join("");

        simple41("Storage Manager", `
            <h3>Storage Manager</h3>
            <div class="inset-panel">
                <b>Total files:</b> ${files.length}<br>
                <b>Large files:</b> ${large.length}<br>
                <b>Large file rule:</b> Files over 1 MB are saved to Firebase Storage with Firestore metadata.
            </div>
            <table class="win95-table"><thead><tr><th>Name</th><th>Type</th><th>Size</th><th>Storage</th></tr></thead><tbody>${rows || "<tr><td colspan='4'>No files.</td></tr>"}</tbody></table>
        `, "storageManager41");
    };

    window.openPDFViewer41 = function () {
        simple41("PDF Viewer", `
            <h3>PDF Viewer</h3>
            <p>Paste a PDF URL or data URL.</p>
            <input id="pdf41_url" style="width:80%" placeholder="https://example.com/file.pdf">
            <button onclick="document.getElementById('pdf41_frame').src=document.getElementById('pdf41_url').value">Open</button>
            <iframe id="pdf41_frame" style="width:100%;height:75%;border:2px inset #fff;background:white;margin-top:8px"></iframe>
        `, "pdfViewer41");
    };

    window.openImageGallery41 = function () {
        const images = filesArray41().filter(([id, f]) => String(f.type || "").includes("image") || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f.name || ""));
        simple41("Image Gallery", `
            <h3>Image Gallery</h3>
            <div class="app-folder-grid">
                ${images.map(([id, f]) => `<button class="app-folder-tile" onclick="openFile('${safe41(id)}')"><span class="app-folder-icon">IMG</span><span>${safe41(f.name)}</span></button>`).join("") || "<div class='inset-panel'>No images found in Files.</div>"}
            </div>
        `, "imageGallery41");
    };

    window.openMediaStudio41 = function () {
        const media = filesArray41().filter(([id, f]) => /\.(mp3|wav|ogg|m4a|mp4|webm|mov)$/i.test(f.name || "") || ["audio", "video"].includes(f.type));
        simple41("Media Studio", `
            <h3>Media Studio</h3>
            <p>Open audio and video files saved in Files.</p>
            <div class="app-folder-grid">
                ${media.map(([id, f]) => `<button class="app-folder-tile" onclick="openFile('${safe41(id)}')"><span class="app-folder-icon">MEDIA</span><span>${safe41(f.name)}</span></button>`).join("") || "<div class='inset-panel'>No media files found.</div>"}
            </div>
        `, "mediaStudio41");
    };

    window.openSnippetLibrary41 = function () {
        const saved = localStorage.getItem("40_snippet_library") || "";
        simple41("Snippet Library", `
            <h3>Snippet Library</h3>
            <textarea id="snippet41" class="viewer-textarea" style="height:70%">${safe41(saved)}</textarea>
            <button onclick="localStorage.setItem('40_snippet_library',document.getElementById('snippet41').value);notify('Snippet Library','Saved.',2500,'success')">Save</button>
        `, "snippetLibrary41");
    };

    window.openBookmarks41 = function () {
        const saved = localStorage.getItem("40_bookmarks") || "https://securly-plans.github.io/EmeraldOS/";
        simple41("Bookmarks", `
            <h3>Bookmarks</h3>
            <p>One URL per line.</p>
            <textarea id="bookmarks41" class="viewer-textarea" style="height:55%">${safe41(saved)}</textarea>
            <button onclick="localStorage.setItem('40_bookmarks',document.getElementById('bookmarks41').value);notify('Bookmarks','Saved.',2500,'success')">Save</button>
            <button onclick="openBrowser();setTimeout(()=>{const u=document.getElementById('browserURL');if(u)u.value=(document.getElementById('bookmarks41').value.split('\\n')[0]||'')},300)">Open First In Browser</button>
        `, "bookmarks41");
    };

    window.openDataTable41 = function () {
        simple41("Data Table", `
            <h3>Data Table</h3>
            <p>Paste CSV and render a table.</p>
            <textarea id="datatable41_src" class="viewer-textarea" style="height:35%">Name,Value\nExample,100</textarea>
            <button onclick="renderDataTable41()">Render</button>
            <div id="datatable41_out" class="viewer-output" style="height:40%;margin-top:8px"></div>
        `, "dataTable41");
    };

    window.renderDataTable41 = function () {
        const src = document.getElementById("datatable41_src")?.value || "";
        const rows = src.split(/\r?\n/).filter(Boolean).map(r => r.split(","));
        const html = `<table class="win95-table">${rows.map((r,i)=>`<tr>${r.map(c=>i===0?`<th>${safe41(c)}</th>`:`<td>${safe41(c)}</td>`).join("")}</tr>`).join("")}</table>`;
        const out = document.getElementById("datatable41_out");
        if (out) out.innerHTML = html;
    };

    window.openSVGViewer41 = function () {
        simple41("SVG Viewer", `
            <h3>SVG Viewer</h3>
            <div class="viewer-split">
                <div class="viewer-pane"><textarea id="svg41_src" class="viewer-textarea"><svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="green"/><text x="20" y="55" fill="white">EmeraldOS</text></svg></textarea><button onclick="document.getElementById('svg41_out').innerHTML=document.getElementById('svg41_src').value">Preview</button></div>
                <div id="svg41_out" class="viewer-output"></div>
            </div>
        `, "svgViewer41");
    };

    window.openBackupRestore41 = function () {
        simple41("Backup & Restore", `
            <h3>Backup & Restore</h3>
            <p>Export local EmeraldOS 5.x settings.</p>
            <button onclick="exportBackup41()">Export Backup</button>
            <textarea id="backup41_out" class="viewer-textarea" style="height:65%"></textarea>
        `, "backupRestore41");
    };

    window.exportBackup41 = function () {
        const data = {};
        Object.keys(localStorage).filter(k => k.startsWith("40_")).sort().forEach(k => data[k] = localStorage.getItem(k));
        const out = document.getElementById("backup41_out");
        if (out) out.value = JSON.stringify(data, null, 2);
    };

    window.openReleaseNotes41 = function () {
        simple41("Release Notes", `
            <h3>EmeraldOS 5.3 Context Menu & Pinning Fix</h3>
            <ul>
                <li>Files over 1 MB now move to Firebase Storage automatically.</li>
                <li>Firestore remains the metadata database.</li>
                <li>Added Storage Manager, PDF Viewer, Image Gallery, Media Studio, Data Table, SVG Viewer, Bookmarks, Snippet Library, and Backup & Restore.</li>
                <li>Kept 40_ localStorage keys for EmeraldOS 5.x upgrade compatibility.</li>
            </ul>
        `, "releaseNotes41");
    };

    function installApps41() {
        register41("releaseNotes41", { name: "Release Notes", icon: "5.3", edition: "economy", category: "essential", launch: () => window.openReleaseNotes41() });
        register41("storageManager41", { name: "Storage Manager", icon: "STORE", edition: "business", category: "business", launch: () => window.openStorageManager41() });
        register41("pdfViewer41", { name: "PDF Viewer", icon: "PDF", edition: "home", category: "office", launch: () => window.openPDFViewer41() });
        register41("imageGallery41", { name: "Image Gallery", icon: "IMG", edition: "virtue", category: "creative", launch: () => window.openImageGallery41() });
        register41("mediaStudio41", { name: "Media Studio", icon: "MEDIA", edition: "virtue", category: "creative", launch: () => window.openMediaStudio41() });
        register41("snippetLibrary41", { name: "Snippet Library", icon: "SNIP", edition: "developer", category: "developer", launch: () => window.openSnippetLibrary41() });
        register41("bookmarks41", { name: "Bookmarks", icon: "BM", edition: "business", category: "internet", launch: () => window.openBookmarks41() });
        register41("dataTable41", { name: "Data Table", icon: "DATA", edition: "business", category: "business", launch: () => window.openDataTable41() });
        register41("svgViewer41", { name: "SVG Viewer", icon: "SVG", edition: "developer", category: "developer", launch: () => window.openSVGViewer41() });
        register41("backupRestore41", { name: "Backup & Restore", icon: "BACK", edition: "developer", category: "developer", launch: () => window.openBackupRestore41() });
    }

    function wrapTerminal41() {
        if (typeof window.runCommand !== "function" || window.runCommand.__emerald41Wrapped) return;
        const original = window.runCommand;
        const wrapped = async function (cmdLine) {
            const raw = String(cmdLine || "").trim();
            const [command, ...parts] = raw.split(/\s+/);
            let result = null;
            if (command === "storage.stats") {
                const files = filesArray41();
                const large = files.filter(([id, f]) => isLarge41(f));
                result = `Files: ${files.length}<br>Large/Firebase Storage files: ${large.length}`;
            } else if (command === "storage.large" || command === "files.large") {
                const large = filesArray41().filter(([id, f]) => isLarge41(f));
                result = large.map(([id, f]) => `${safe41(id)} - ${safe41(f.name)} - ${f.hasStorageBlob ? "Firebase Storage" : "Firestore"}`).join("<br>") || "No large files.";
            } else if (command === "open.storage") {
                window.openStorageManager41(); result = "Opened Storage Manager.";
            } else if (command === "app.update" || command === "release") {
                result = "EmeraldOS 5.3 Context Menu & Pinning Fix";
            } else if (command === "apps.count") {
                result = "Registered apps: " + Object.keys(window.APPS || {}).length;
            }
            if (result !== null) {
                const output = document.getElementById("terminal_output");
                if (output) {
                    output.innerHTML += `> ${safe41(raw)}<br>${result}<br><br>`;
                    output.scrollTop = output.scrollHeight;
                    const input = document.getElementById("terminal_input");
                    if (input) input.value = "";
                }
                return;
            }
            return original.call(this, cmdLine);
        };
        wrapped.__emerald41Wrapped = true;
        window.runCommand = wrapped;
    }

    function init41() {
        installApps41();
        wrapTerminal41();
        if (typeof window.renderDesktop === "function") window.renderDesktop();
        if (typeof window.renderStartMenu === "function") window.renderStartMenu();
    }

    if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", init41);
    else init41();
})();

/* =========================================================
   EMERALDOS 5.3
   Win95 Context Menu + App Pinning + More Apps + System Control
========================================================= */
(function () {
    "use strict";

    if (window.EmeraldOS42PinningLoaded) return;
    window.EmeraldOS42PinningLoaded = true;

    const BUILD_LABEL_42 = "EmeraldOS 5.3";
    const PIN_START_KEY = "40_pinned_start_apps";
    const PIN_DESKTOP_KEY = "40_pinned_desktop_apps";
    const PIN_TASKBAR_KEY = "40_pinned_taskbar_apps";
    const PIN_POS_KEY = "40_desktop_pin_positions";
    const STARTUP_KEY = "40_startup_apps";

    function safe42(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function getJSON42(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    }

    function setJSON42(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
        scheduleCloudSettings42();
    }

    function unique42(list) {
        return Array.from(new Set((list || []).filter(Boolean)));
    }

    function appExists42(id) {
        return !!(window.APPS && window.APPS[id]);
    }

    function canSeeApp42(id) {
        const app = window.APPS?.[id];
        if (!app) return false;
        if (typeof window.canSeeApp === "function") return window.canSeeApp(app);
        if (typeof window.canSeeEdition === "function") return window.canSeeEdition(app.edition || "economy");
        return true;
    }

    function visibleApps42() {
        return Object.entries(window.APPS || {})
            .filter(([id]) => canSeeApp42(id))
            .sort((a, b) => String(a[1].name || a[0]).localeCompare(String(b[1].name || b[0])));
    }

    function getPins42(key) {
        return getJSON42(key, []).filter(id => appExists42(id) && canSeeApp42(id));
    }

    function setPins42(key, list) {
        setJSON42(key, unique42(list).filter(id => appExists42(id)));
        refreshPins42();
    }

    function addPin42(key, appId) {
        if (!appExists42(appId) || !canSeeApp42(appId)) {
            window.notify?.("Pin Failed", "This application is not available in this edition.", 3000, "warning");
            return false;
        }
        const pins = unique42([...getJSON42(key, []), appId]);
        setPins42(key, pins);
        window.notify?.("Pinned", `${window.APPS[appId].name} pinned.`, 2500, "success");
        return true;
    }

    function removePin42(key, appId) {
        setPins42(key, getJSON42(key, []).filter(id => id !== appId));
        window.notify?.("Unpinned", `${window.APPS?.[appId]?.name || appId} removed.`, 2500, "info");
    }

    window.pinAppToStart = appId => addPin42(PIN_START_KEY, appId);
    window.unpinAppFromStart = appId => removePin42(PIN_START_KEY, appId);
    window.pinAppToDesktop = appId => addPin42(PIN_DESKTOP_KEY, appId);
    window.unpinAppFromDesktop = appId => removePin42(PIN_DESKTOP_KEY, appId);
    window.pinAppToTaskbar = appId => addPin42(PIN_TASKBAR_KEY, appId);
    window.unpinAppFromTaskbar = appId => removePin42(PIN_TASKBAR_KEY, appId);

    async function scheduleCloudSettings42() {
        clearTimeout(window.__emerald42CloudSettingsTimer);
        window.__emerald42CloudSettingsTimer = setTimeout(async () => {
            try {
                if (typeof window.saveUserSettings === "function") {
                    await window.saveUserSettings({
                        pinnedStartApps: getJSON42(PIN_START_KEY, []),
                        pinnedDesktopApps: getJSON42(PIN_DESKTOP_KEY, []),
                        pinnedTaskbarApps: getJSON42(PIN_TASKBAR_KEY, []),
                        desktopPinPositions: getJSON42(PIN_POS_KEY, {}),
                        startupApps42: getJSON42(STARTUP_KEY, [])
                    });
                }
            } catch (err) {
                console.warn("EmeraldOS 5.3 cloud settings sync skipped:", err);
            }
        }, 600);
    }

    function launch42(appId) {
        if (!canSeeApp42(appId)) return false;
        window.APPS[appId].launch?.();
        return true;
    }

    window.launchPinnedApp42 = launch42;

    function getPinPositions42() {
        return getJSON42(PIN_POS_KEY, {});
    }

    function savePinPosition42(key, left, top) {
        const data = getPinPositions42();
        data[key] = { left, top };
        setJSON42(PIN_POS_KEY, data);
    }

    function defaultPinPosition42(index) {
        const col = Math.floor(index / 8);
        const row = index % 8;
        return { left: 22 + col * 96, top: 22 + row * 86 };
    }

    function makePinnedDesktopIcon42(appId, index) {
        const desktop = document.getElementById("desktop");
        const app = window.APPS?.[appId];
        if (!desktop || !app || !canSeeApp42(appId)) return;

        const key = "pinned-app:" + appId;
        const pos = getPinPositions42()[key] || defaultPinPosition42(index + 8);

        const icon = document.createElement("div");
        icon.className = "desktop-item desktop-pinned-app emerald42-pinned-desktop";
        icon.dataset.desktopKey = key;
        icon.dataset.appId = appId;
        icon.style.position = "absolute";
        icon.style.left = (parseInt(pos.left, 10) || 0) + "px";
        icon.style.top = (parseInt(pos.top, 10) || 0) + "px";
        icon.innerHTML = `<div class="desktop-icon-symbol">${safe42(app.icon || "□")}</div><div class="desktop-icon-label">${safe42(app.name || appId)}</div>`;

        let drag = null;
        let moved = false;
        icon.addEventListener("mousedown", e => {
            if (e.button !== 0) return;
            e.preventDefault();
            moved = false;
            drag = {
                startX: e.clientX,
                startY: e.clientY,
                left: parseInt(icon.style.left, 10) || 0,
                top: parseInt(icon.style.top, 10) || 0
            };
            icon.classList.add("dragging");
        });
        document.addEventListener("mousemove", e => {
            if (!drag) return;
            const dx = e.clientX - drag.startX;
            const dy = e.clientY - drag.startY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
            const maxLeft = Math.max(0, window.innerWidth - 90);
            const maxTop = Math.max(0, window.innerHeight - 130);
            icon.style.left = Math.min(maxLeft, Math.max(0, drag.left + dx)) + "px";
            icon.style.top = Math.min(maxTop, Math.max(0, drag.top + dy)) + "px";
        });
        document.addEventListener("mouseup", () => {
            if (!drag) return;
            drag = null;
            icon.classList.remove("dragging");
            savePinPosition42(key, parseInt(icon.style.left, 10) || 0, parseInt(icon.style.top, 10) || 0);
        });
        icon.addEventListener("dblclick", e => {
            e.preventDefault();
            if (!moved) launch42(appId);
        });
        icon.addEventListener("contextmenu", e => {
            e.preventDefault();
            e.stopPropagation();
            showWin95Menu42(e.clientX, e.clientY, [
                { label: "Open", action: () => launch42(appId) },
                { label: "Pin to Start", action: () => window.pinAppToStart(appId) },
                { label: "Pin to Taskbar", action: () => window.pinAppToTaskbar(appId) },
                { sep: true },
                { label: "Remove from Desktop", action: () => window.unpinAppFromDesktop(appId) }
            ]);
        });
        desktop.appendChild(icon);
    }

    function renderDesktopPins42() {
        document.querySelectorAll(".emerald42-pinned-desktop").forEach(el => el.remove());
        getPins42(PIN_DESKTOP_KEY).forEach((id, index) => makePinnedDesktopIcon42(id, index));
    }

    function ensurePinnedTaskbar42() {
        const taskbar = document.getElementById("taskbar");
        const taskbarApps = document.getElementById("taskbar-apps");
        if (!taskbar || !taskbarApps) return null;
        let pinned = document.getElementById("pinned-taskbar-apps");
        if (!pinned) {
            pinned = document.createElement("div");
            pinned.id = "pinned-taskbar-apps";
            taskbar.insertBefore(pinned, taskbarApps);
        }
        return pinned;
    }

    function renderTaskbarPins42() {
        const pinned = ensurePinnedTaskbar42();
        if (!pinned) return;
        pinned.innerHTML = "";
        getPins42(PIN_TASKBAR_KEY).forEach(appId => {
            const app = window.APPS?.[appId];
            if (!app) return;
            const btn = document.createElement("button");
            btn.className = "taskbar-pinned-btn";
            btn.title = app.name;
            btn.innerHTML = `<span>${safe42(app.icon || "□")}</span>`;
            btn.onclick = () => launch42(appId);
            btn.oncontextmenu = e => {
                e.preventDefault();
                showWin95Menu42(e.clientX, e.clientY, [
                    { label: "Open", action: () => launch42(appId) },
                    { label: "Pin to Start", action: () => window.pinAppToStart(appId) },
                    { label: "Pin to Desktop", action: () => window.pinAppToDesktop(appId) },
                    { sep: true },
                    { label: "Unpin from Taskbar", action: () => window.unpinAppFromTaskbar(appId) }
                ]);
            };
            pinned.appendChild(btn);
        });
    }

    function renderStartPins42() {
        const results = document.getElementById("start-results");
        if (!results) return;
        document.getElementById("start-pinned-section")?.remove();
        const pins = getPins42(PIN_START_KEY);
        if (!pins.length) return;
        const section = document.createElement("div");
        section.id = "start-pinned-section";
        section.innerHTML = `<div class="start-section-label">Pinned</div>`;
        pins.forEach(appId => {
            const app = window.APPS?.[appId];
            if (!app) return;
            const item = document.createElement("div");
            item.className = "start-item start-pinned-item";
            item.dataset.appId = appId;
            item.innerHTML = `${safe42(app.icon || "□")} ${safe42(app.name || appId)}`;
            item.onclick = () => {
                launch42(appId);
                document.getElementById("start-menu")?.classList.remove("show");
            };
            item.oncontextmenu = e => {
                e.preventDefault();
                showWin95Menu42(e.clientX, e.clientY, [
                    { label: "Open", action: () => launch42(appId) },
                    { label: "Pin to Desktop", action: () => window.pinAppToDesktop(appId) },
                    { label: "Pin to Taskbar", action: () => window.pinAppToTaskbar(appId) },
                    { sep: true },
                    { label: "Unpin from Start", action: () => window.unpinAppFromStart(appId) }
                ]);
            };
            section.appendChild(item);
        });
        const sep = document.createElement("hr");
        section.appendChild(sep);
        results.prepend(section);
    }

    function refreshPins42() {
        renderDesktopPins42();
        renderTaskbarPins42();
        renderStartPins42();
    }
    window.refreshPins42 = refreshPins42;

    function showWin95Menu42(x, y, items) {
        let menu = document.getElementById("context-menu");
        if (!menu) {
            menu = document.createElement("div");
            menu.id = "context-menu";
            document.body.appendChild(menu);
        }
        menu.className = "show win95-context-menu emerald42-context-menu";
        menu.innerHTML = items.map(item => {
            if (item.sep) return `<div class="context-separator"></div>`;
            const arrow = item.children ? `<span class="context-arrow">▶</span>` : "";
            return `<div class="context-item" data-action="${safe42(item.label)}">${safe42(item.label)}${arrow}</div>`;
        }).join("");
        menu.style.left = Math.min(x, window.innerWidth - 230) + "px";
        menu.style.top = Math.min(y, window.innerHeight - 30 - (items.length * 24)) + "px";
        Array.from(menu.querySelectorAll(".context-item")).forEach((el, idx) => {
            const realItem = items.filter(i => !i.sep)[idx];
            if (!realItem) return;
            el.onclick = e => {
                e.stopPropagation();
                menu.classList.remove("show");
                realItem.action?.();
            };
        });
    }
    window.showWin95Menu42 = showWin95Menu42;

    function installWin95DesktopMenu42() {
        const desktop = document.getElementById("desktop");
        if (!desktop || desktop.__emerald42MenuInstalled) return;
        desktop.__emerald42MenuInstalled = true;
        desktop.addEventListener("contextmenu", e => {
            if (e.target.closest(".desktop-item")) return;
            e.preventDefault();
            e.stopPropagation();
            showWin95Menu42(e.clientX, e.clientY, [
                { label: "Open App Folder...", action: () => window.openAppFolderChooser42() },
                { label: "Pin Application...", action: () => window.openAppPinManager42() },
                { sep: true },
                { label: "New File", action: () => window.createFileOnDesktop?.() },
                { label: "New Folder", action: () => window.createFolderOnDesktop?.() },
                { label: "Upload To Desktop", action: () => window.uploadFileToDesktop?.() },
                { sep: true },
                { label: "Display Settings", action: () => window.openDisplaySettings42() },
                { label: "System Control Center", action: () => window.openSystemControlCenter42() },
                { label: "Desktop Sync", action: () => window.openDesktopSyncCenter42() },
                { sep: true },
                { label: "Reset Desktop Layout", action: () => window.resetAllDesktopLayout42() },
                { label: "Refresh", action: () => window.refreshDesktop?.() }
            ]);
        }, true);
        document.addEventListener("click", () => document.getElementById("context-menu")?.classList.remove("show"));
    }

    function win42(title, html, appId) {
        if (typeof window.openWindow === "function") {
            window.openWindow(title, `<div class="app-panel emerald42-panel">${html}</div>`, appId || "emerald42");
        }
    }

    function button42(label, js) {
        return `<button class="win95-small-button" onclick="${js}">${safe42(label)}</button>`;
    }

    function appPinRows42() {
        return visibleApps42().map(([id, app]) => {
            const start = getJSON42(PIN_START_KEY, []).includes(id);
            const desk = getJSON42(PIN_DESKTOP_KEY, []).includes(id);
            const task = getJSON42(PIN_TASKBAR_KEY, []).includes(id);
            return `<tr>
                <td><b>${safe42(app.icon || "□")}</b></td>
                <td>${safe42(app.name || id)}<br><small>${safe42(id)} | ${safe42(app.edition || "economy")}</small></td>
                <td>${start ? button42("Unpin", `unpinAppFromStart('${id}')`) : button42("Pin", `pinAppToStart('${id}')`)}</td>
                <td>${desk ? button42("Unpin", `unpinAppFromDesktop('${id}')`) : button42("Pin", `pinAppToDesktop('${id}')`)}</td>
                <td>${task ? button42("Unpin", `unpinAppFromTaskbar('${id}')`) : button42("Pin", `pinAppToTaskbar('${id}')`)}</td>
            </tr>`;
        }).join("");
    }

    window.openAppPinManager42 = function () {
        win42("Pin Manager", `
            <h3>Application Pin Manager</h3>
            <div class="inset-panel">Pin visible applications to Start, Desktop, or the Taskbar. Apps above the active edition remain hidden.</div>
            <table class="win95-table emerald42-pin-table">
                <tr><th></th><th>Application</th><th>Start</th><th>Desktop</th><th>Taskbar</th></tr>
                ${appPinRows42()}
            </table>
        `, "pinManager");
    };

    window.openQuickLauncher42 = function () {
        win42("Quick Launcher", `
            <h3>Quick Launcher</h3>
            <input id="quickLaunchSearch42" style="width:100%" placeholder="Search apps" oninput="filterQuickLauncher42()">
            <div id="quickLaunchResults42" class="quick-launch-results">
                ${visibleApps42().map(([id, app]) => `<button class="app-folder-tile" data-name="${safe42(String(app.name).toLowerCase())}" onclick="launchPinnedApp42('${id}')"><span class="app-folder-icon">${safe42(app.icon || "□")}</span>${safe42(app.name || id)}</button>`).join("")}
            </div>
        `, "quickLauncher");
    };

    window.filterQuickLauncher42 = function () {
        const q = (document.getElementById("quickLaunchSearch42")?.value || "").toLowerCase();
        document.querySelectorAll("#quickLaunchResults42 .app-folder-tile").forEach(btn => {
            btn.style.display = (btn.dataset.name || "").includes(q) ? "" : "none";
        });
    };

    window.openAppFolderChooser42 = function () {
        const cats = Object.values(window.EMERALDOS_APP_CATEGORIES || {});
        win42("Open App Folder", `
            <h3>Application Folders</h3>
            <div class="suite-grid">
                ${cats.map(c => button42((c.icon || "📁") + " " + c.name, `openAppFolderT5('${c.id}')`)).join("")}
            </div>
        `, "folderChooser");
    };

    window.openDisplaySettings42 = function () {
        win42("Display Settings", `
            <h3>Display Settings</h3>
            <div class="inset-panel">Choose a theme and desktop icon size.</div>
            <label>Theme</label><br>
            <select id="displayTheme42"><option value="classic">Classic</option><option value="dark">Dark</option><option value="light">Light</option><option value="midnight">Midnight</option></select>
            <button onclick="setTheme(document.getElementById('displayTheme42').value)">Apply Theme</button>
            <hr>
            <label>Icon Size</label><br>
            <input type="range" min="60" max="110" value="72" oninput="setIconSize(this.value)">
            <hr>
            ${button42("Reset Desktop Layout", "resetAllDesktopLayout42()")}
            ${button42("Sync Desktop Now", "saveDesktopLayoutToCloud?.()")}
        `, "displaySettings");
    };

    window.openSystemControlCenter42 = function () {
        win42("System Control Center", `
            <h3>System Control Center</h3>
            <div class="inset-panel">
                <b>Build:</b> ${BUILD_LABEL_42}<br>
                <b>Edition:</b> ${safe42(localStorage.getItem("40_edition_name") || "EmeraldOS Virtue")}<br>
                <b>User:</b> ${safe42(localStorage.getItem("40_username") || localStorage.getItem("username") || "Guest")}
            </div>
            <div class="suite-grid">
                ${button42("Display Settings", "openDisplaySettings42()")}
                ${button42("Pin Manager", "openAppPinManager42()")}
                ${button42("Startup Manager", "openStartupManager42()")}
                ${button42("Desktop Sync", "openDesktopSyncCenter42()")}
                ${button42("Session Manager", "openSessionManager42()")}
                ${button42("Keyboard Shortcuts", "openKeyboardShortcuts42()")}
                ${button42("Storage Manager", "openStorageManager41?.()")}
                ${button42("Registry Editor", "openRegistryEditor?.()")}
            </div>
        `, "systemControl42");
    };

    window.openStartupManager42 = function () {
        const current = getJSON42(STARTUP_KEY, []);
        win42("Startup Manager", `
            <h3>Startup Manager</h3>
            <div class="inset-panel">Choose visible apps to open automatically after login.</div>
            <table class="win95-table">
                <tr><th>Application</th><th>Startup</th></tr>
                ${visibleApps42().map(([id, app]) => `<tr><td>${safe42(app.name || id)}</td><td>${current.includes(id) ? button42("Remove", `removeStartupApp42('${id}')`) : button42("Add", `addStartupApp42('${id}')`)}</td></tr>`).join("")}
            </table>
        `, "startupManager42");
    };

    window.addStartupApp42 = function (id) {
        if (!canSeeApp42(id)) return;
        setJSON42(STARTUP_KEY, unique42([...getJSON42(STARTUP_KEY, []), id]));
        window.openStartupManager42();
    };
    window.removeStartupApp42 = function (id) {
        setJSON42(STARTUP_KEY, getJSON42(STARTUP_KEY, []).filter(x => x !== id));
        window.openStartupManager42();
    };

    window.launchStartupApps42 = function () {
        getJSON42(STARTUP_KEY, []).filter(id => canSeeApp42(id)).forEach(id => launch42(id));
    };

    window.openDesktopSyncCenter42 = function () {
        win42("Desktop Sync", `
            <h3>Desktop Sync</h3>
            <div class="inset-panel">Desktop layout, app pins, and pin positions use local storage and attempt Firebase user-setting sync when supported by this build.</div>
            <div class="suite-grid">
                ${button42("Save Layout To Cloud", "saveDesktopLayoutToCloud?.()")}
                ${button42("Load Layout From Cloud", "loadDesktopLayoutFromCloud?.().then(()=>refreshEditionVisibility?.())")}
                ${button42("Save Pins", "refreshPins42()")}
                ${button42("Reset Layout", "resetAllDesktopLayout42()")}
            </div>
        `, "desktopSync42");
    };

    window.openSessionManager42 = function () {
        win42("Session Manager", `
            <h3>Session Manager</h3>
            <div class="suite-grid">
                ${button42("Save Session", "saveSession?.()")}
                ${button42("Clear Saved Windows", "localStorage.removeItem('40_session'); localStorage.removeItem('emerald_session'); notify('Session','Saved windows cleared.',2500,'info')")}
                ${button42("Restart", "restartOS()")}
                ${button42("Logout", "logoutUser()")}
            </div>
        `, "sessionManager42");
    };

    window.openKeyboardShortcuts42 = function () {
        win42("Keyboard Shortcuts", `
            <h3>Keyboard Shortcuts</h3>
            <table class="win95-table">
                <tr><th>Shortcut</th><th>Action</th></tr>
                <tr><td>Ctrl + Space</td><td>Open Quick Launcher</td></tr>
                <tr><td>Ctrl + Alt + P</td><td>Open Pin Manager</td></tr>
                <tr><td>Ctrl + Alt + S</td><td>Open System Control Center</td></tr>
                <tr><td>Right-click desktop</td><td>Open Win95 desktop menu</td></tr>
            </table>
        `, "keyboardShortcuts42");
    };

    window.resetAllDesktopLayout42 = async function () {
        localStorage.removeItem(PIN_POS_KEY);
        localStorage.removeItem("40_desktop_positions_v5");
        localStorage.removeItem("40_desktop_positions_v4");
        try { await window.saveUserSettings?.({ desktopPositions: {}, desktopPinPositions: {} }); } catch {}
        window.refreshEditionVisibility?.();
        refreshPins42();
        window.notify?.("Desktop", "Desktop layout reset.", 2500, "info");
    };

    function registerApp42(id, app) {
        if (!window.APPS) window.APPS = {};
        window.APPS[id] = Object.assign({ edition: "economy", category: "essential" }, app);
    }

    function installMoreApps42() {
        registerApp42("pinManager42", { name: "Pin Manager", icon: "PIN", edition: "economy", category: "essential", launch: () => window.openAppPinManager42() });
        registerApp42("quickLauncher42", { name: "Quick Launcher", icon: "RUN", edition: "economy", category: "essential", launch: () => window.openQuickLauncher42() });
        registerApp42("displaySettings42", { name: "Display Settings", icon: "DSP", edition: "economy", category: "essential", launch: () => window.openDisplaySettings42() });
        registerApp42("systemControl42", { name: "System Control", icon: "CTRL", edition: "virtue", category: "essential", launch: () => window.openSystemControlCenter42() });
        registerApp42("startupManager42", { name: "Startup Manager", icon: "BOOT", edition: "virtue", category: "essential", launch: () => window.openStartupManager42() });
        registerApp42("sessionManager42", { name: "Session Manager", icon: "SESS", edition: "virtue", category: "essential", launch: () => window.openSessionManager42() });
        registerApp42("keyboardShortcuts42", { name: "Keyboard Shortcuts", icon: "KEY", edition: "home", category: "essential", launch: () => window.openKeyboardShortcuts42() });

        registerApp42("notepadPro42", { name: "Notepad Pro", icon: "NOTE+", edition: "home", category: "office", launch: () => win42("Notepad Pro", `<h3>Notepad Pro</h3><textarea class="viewer-textarea" style="height:260px">Write here...</textarea>`, "notepadPro42") });
        registerApp42("fileSearch42", { name: "File Search", icon: "FIND", edition: "home", category: "office", launch: () => window.openFileSearch42() });
        registerApp42("characterMap42", { name: "Character Map", icon: "CHAR", edition: "home", category: "office", launch: () => win42("Character Map", `<h3>Character Map</h3><div class="character-map-grid">© ™ § ¶ • — ± × ÷ µ Ω π √ ∞ ≠ ≤ ≥</div>`, "characterMap42") });
        registerApp42("timerAlarms42", { name: "Timers & Alarms", icon: "TIME", edition: "home", category: "essential", launch: () => window.openTimers42() });

        registerApp42("passwordVault42", { name: "Password Vault", icon: "VAULT", edition: "business", category: "business", launch: () => win42("Password Vault", `<h3>Password Vault</h3><div class="inset-panel">Local planning vault. Do not store real passwords in this demo.</div><textarea class="viewer-textarea" style="height:180px"></textarea>`, "passwordVault42") });
        registerApp42("processManager42", { name: "Process Manager", icon: "PROC", edition: "virtue", category: "developer", launch: () => window.openProcessManager42() });
        registerApp42("deviceManager42", { name: "Device Manager", icon: "DEV", edition: "virtue", category: "developer", launch: () => window.openDeviceManager42() });
        registerApp42("networkMonitor42", { name: "Network Monitor", icon: "NET", edition: "developer", category: "developer", launch: () => win42("Network Monitor", `<h3>Network Monitor</h3><div class="inset-panel">Status: Online<br>Mode: Browser sandbox<br>Host: ${safe42(location.hostname)}</div>`, "networkMonitor42") });
        registerApp42("releaseBuilder42", { name: "Release Builder", icon: "REL", edition: "developer", category: "developer", launch: () => win42("Release Builder", `<h3>Release Builder</h3><div class="inset-panel">Prepare release notes, version labels, and package checks.</div><textarea class="viewer-textarea" style="height:180px">EmeraldOS 5.3 Release Notes</textarea>`, "releaseBuilder42") });
        registerApp42("adminVerifier42", { name: "Admin Verifier", icon: "ADM", edition: "executive", category: "executive", launch: () => win42("Admin Verifier", `<h3>Admin Verifier</h3><div class="inset-panel">Executive access is verified through BIOS using an Emerald Games administrator account.</div>`, "adminVerifier42") });
    }

    window.openFileSearch42 = function () {
        win42("File Search", `
            <h3>File Search</h3>
            <input id="fileSearchInput42" style="width:100%" placeholder="Search files" oninput="runFileSearch42()">
            <div id="fileSearchResults42" class="viewer-output" style="height:220px"></div>
        `, "fileSearch42");
        setTimeout(() => window.runFileSearch42(), 50);
    };
    window.runFileSearch42 = function () {
        const q = (document.getElementById("fileSearchInput42")?.value || "").toLowerCase();
        const out = document.getElementById("fileSearchResults42");
        if (!out) return;
        const rows = Object.entries(window.fileSystem?.files || {}).filter(([id, f]) => String(f.name || "").toLowerCase().includes(q));
        out.innerHTML = rows.map(([id, f]) => `<div class="file-row"><span>${safe42(f.name || id)}</span><button onclick="openFile('${id}')">Open</button></div>`).join("") || "No files found.";
    };

    window.openTimers42 = function () {
        win42("Timers & Alarms", `
            <h3>Timers & Alarms</h3>
            <input id="timerSeconds42" type="number" value="60" min="1"> seconds
            <button onclick="startTimer42()">Start Timer</button>
            <div id="timerOutput42" class="inset-panel">Ready.</div>
        `, "timerAlarms42");
    };
    window.startTimer42 = function () {
        const sec = Math.max(1, parseInt(document.getElementById("timerSeconds42")?.value || "60", 10));
        const out = document.getElementById("timerOutput42");
        if (out) out.textContent = `Timer running for ${sec} seconds...`;
        setTimeout(() => {
            if (out) out.textContent = "Timer complete.";
            window.notify?.("Timer", "Timer complete.", 4000, "info");
        }, sec * 1000);
    };

    window.openProcessManager42 = function () {
        const wins = Array.from(document.querySelectorAll(".window"));
        win42("Process Manager", `
            <h3>Process Manager</h3>
            <table class="win95-table"><tr><th>Window</th><th>App</th><th>Action</th></tr>
            ${wins.map((w, i) => `<tr><td>${safe42(w.querySelector('.title-bar span')?.textContent || 'Window')}</td><td>${safe42(w.dataset.app || '')}</td><td><button onclick="document.querySelectorAll('.window')[${i}]?.remove()">Close</button></td></tr>`).join("")}</table>
        `, "processManager42");
    };

    window.openDeviceManager42 = function () {
        win42("Device Manager", `
            <h3>Device Manager</h3>
            <div class="tree-view">
                <div>▸ Display adapters<br><span>Emerald VGA Compatible</span></div>
                <div>▸ Storage controllers<br><span>Firebase Firestore + Storage</span></div>
                <div>▸ Human Interface Devices<br><span>Keyboard, mouse, touch input</span></div>
                <div>▸ Network adapters<br><span>Browser network stack</span></div>
            </div>
        `, "deviceManager42");
    };

    function installKeyboardShortcuts42() {
        if (window.__emerald42ShortcutsInstalled) return;
        window.__emerald42ShortcutsInstalled = true;
        document.addEventListener("keydown", e => {
            if (e.ctrlKey && !e.altKey && e.code === "Space") {
                e.preventDefault();
                window.openQuickLauncher42();
            }
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "p") {
                e.preventDefault();
                window.openAppPinManager42();
            }
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "s") {
                e.preventDefault();
                window.openSystemControlCenter42();
            }
        });
    }

    function installTerminalCommands42() {
        const original = window.runCommand;
        if (typeof original !== "function" || original.__t42Wrapped) return;
        const wrapped = async function (cmdLine = "") {
            const raw = String(cmdLine).trim();
            const parts = raw.match(/"([^"]*)"|'([^']*)'|(\S+)/g)?.map(x => x.replace(/^["']|["']$/g, "")) || [];
            const cmd = (parts.shift() || "").toLowerCase();
            const appId = parts[0];
            let result = null;
            if (cmd === "pins") {
                result = `<b>Start:</b> ${getPins42(PIN_START_KEY).join(", ") || "none"}<br><b>Desktop:</b> ${getPins42(PIN_DESKTOP_KEY).join(", ") || "none"}<br><b>Taskbar:</b> ${getPins42(PIN_TASKBAR_KEY).join(", ") || "none"}`;
            } else if (cmd === "pin.start") { result = window.pinAppToStart(appId) ? "Pinned to Start." : "Pin failed."; }
            else if (cmd === "pin.desktop") { result = window.pinAppToDesktop(appId) ? "Pinned to Desktop." : "Pin failed."; }
            else if (cmd === "pin.taskbar") { result = window.pinAppToTaskbar(appId) ? "Pinned to Taskbar." : "Pin failed."; }
            else if (cmd === "unpin.start") { window.unpinAppFromStart(appId); result = "Removed from Start."; }
            else if (cmd === "unpin.desktop") { window.unpinAppFromDesktop(appId); result = "Removed from Desktop."; }
            else if (cmd === "unpin.taskbar") { window.unpinAppFromTaskbar(appId); result = "Removed from Taskbar."; }
            else if (cmd === "app.search") {
                const q = parts.join(" ").toLowerCase();
                result = visibleApps42().filter(([id, app]) => id.includes(q) || String(app.name).toLowerCase().includes(q)).map(([id, app]) => `${id} - ${safe42(app.name)}`).join("<br>") || "No apps found.";
            } else if (cmd === "sys.control") { window.openSystemControlCenter42(); result = "Opened System Control Center."; }
            else if (cmd === "quick") { window.openQuickLauncher42(); result = "Opened Quick Launcher."; }
            else if (cmd === "version" || cmd === "build") { result = "EmeraldOS 5.3 Context Menu & Pinning Fix"; }
            if (result !== null) {
                const output = document.getElementById("terminal_output");
                if (output) {
                    output.innerHTML += `> ${safe42(raw)}<br>${result}<br><br>`;
                    output.scrollTop = output.scrollHeight;
                    const input = document.getElementById("terminal_input");
                    if (input) input.value = "";
                }
                return;
            }
            return original.call(this, cmdLine);
        };
        wrapped.__t42Wrapped = true;
        window.runCommand = wrapped;
    }

    function injectStyles42() {
        if (document.getElementById("emerald42-styles")) return;
        const style = document.createElement("style");
        style.id = "emerald42-styles";
        style.textContent = `
            .win95-context-menu{position:fixed;min-width:210px;background:#c0c0c0;color:#000;border:2px solid;border-color:#fff #404040 #404040 #fff;padding:2px;z-index:999999;font-family:"MS Sans Serif",Tahoma,Arial,sans-serif;font-size:12px;box-shadow:2px 2px 0 rgba(0,0,0,.45)}
            .win95-context-menu .context-item{display:flex;align-items:center;justify-content:space-between;min-height:22px;padding:3px 22px 3px 22px;cursor:pointer;white-space:nowrap}
            .win95-context-menu .context-item:hover{background:#000080;color:#fff}
            .context-separator{height:1px;background:#808080;border-bottom:1px solid #fff;margin:3px 2px}.context-arrow{margin-left:18px}
            #pinned-taskbar-apps{display:flex;gap:3px;margin-left:4px;margin-right:6px;padding-right:6px;border-right:1px solid #808080}
            .taskbar-pinned-btn{height:28px;min-width:30px;background:#c0c0c0;border:2px solid;border-color:#fff #808080 #808080 #fff;font-family:inherit;cursor:pointer;padding:2px 6px}
            .taskbar-pinned-btn:active{border-color:#808080 #fff #fff #808080}
            .start-section-label{font-weight:bold;color:#000080;padding:3px 6px;background:#d4d0c8;border:1px solid #808080;margin-bottom:2px}
            .start-pinned-item{font-weight:bold}.desktop-pinned-app .desktop-icon-symbol{font-weight:bold}.emerald42-panel h3{margin-top:0}.emerald42-pin-table td{vertical-align:middle}
            .quick-launch-results{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;margin-top:10px;max-height:260px;overflow:auto}.character-map-grid{font-size:24px;line-height:1.8;background:#fff;border:2px inset #fff;padding:10px;letter-spacing:8px}.tree-view{background:#fff;border:2px inset #fff;padding:8px;line-height:1.8}.tree-view span{margin-left:20px;color:#333}
        `;
        document.head.appendChild(style);
    }

    function patchRenderers42() {
        const originalRefresh = window.refreshEditionVisibility;
        if (originalRefresh && !originalRefresh.__t42Wrapped) {
            const wrappedRefresh = function () {
                originalRefresh.call(this);
                setTimeout(refreshPins42, 20);
            };
            wrappedRefresh.__t42Wrapped = true;
            window.refreshEditionVisibility = wrappedRefresh;
        }
        const originalRenderStart = window.renderStartMenu;
        if (originalRenderStart && !originalRenderStart.__t42Wrapped) {
            const wrappedStart = function () {
                originalRenderStart.call(this);
                renderStartPins42();
            };
            wrappedStart.__t42Wrapped = true;
            window.renderStartMenu = wrappedStart;
        }
        const originalRenderDesktop = window.renderDesktop;
        if (originalRenderDesktop && !originalRenderDesktop.__t42Wrapped) {
            const wrappedDesktop = function () {
                originalRenderDesktop.call(this);
                renderDesktopPins42();
            };
            wrappedDesktop.__t42Wrapped = true;
            window.renderDesktop = wrappedDesktop;
        }
    }

    function init42() {
        if (window.__emerald42InitDone) return;
        window.__emerald42InitDone = true;
        injectStyles42();
        installMoreApps42();
        patchRenderers42();
        installWin95DesktopMenu42();
        installKeyboardShortcuts42();
        installTerminalCommands42();
        try { window.EmeraldOSRegistry?.set?.("HKEY_LOCAL_MACHINE\\System\\Build\\Version", "5.3"); } catch {}
        try { window.EmeraldOSRegistry?.set?.("HKEY_CURRENT_USER\\Software\\EmeraldOS\\Explorer\\Pinning", "Enabled"); } catch {}
        window.refreshEditionVisibility?.();
        refreshPins42();
        setTimeout(window.launchStartupApps42, 700);
        window.notify?.("EmeraldOS 5.3", "Pinning, Win95 menu, and control apps loaded.", 3500, "success");
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", () => setTimeout(init42, 1600));
    } else {
        setTimeout(init42, 1600);
    }
})();


/* =========================================================
   EMERALDOS 5.3
   Context Menu, Folder-Preserving Desktop Pins, Win95 Toasts
========================================================= */
(function () {
    "use strict";

    if (window.EmeraldOS425FixLoaded) return;
    window.EmeraldOS425FixLoaded = true;

    const BUILD_425 = "EmeraldOS 5.3";
    const PIN_START_KEY = "40_pinned_start_apps";
    const PIN_DESKTOP_KEY = "40_pinned_desktop_apps";
    const PIN_TASKBAR_KEY = "40_pinned_taskbar_apps";
    const PIN_POS_KEY = "40_desktop_pin_positions";
    const FOLDER_POS_KEY = "40_desktop_folder_positions_425";
    const FILE_POS_KEY = "40_desktop_file_positions_425";

    function safe425(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function getJSON425(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    }

    function setJSON425(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
        scheduleCloudSettings425();
    }

    function unique425(list) {
        return Array.from(new Set((list || []).filter(Boolean)));
    }

    function appExists425(id) {
        return !!(window.APPS && window.APPS[id]);
    }

    function canSeeApp425(idOrApp) {
        const app = typeof idOrApp === "string" ? window.APPS?.[idOrApp] : idOrApp;
        if (!app) return false;
        if (typeof window.canSeeApp === "function") return window.canSeeApp(app);
        if (typeof window.canSeeEdition === "function") return window.canSeeEdition(app.edition || "economy");
        return true;
    }

    function visibleApps425() {
        return Object.entries(window.APPS || {})
            .filter(([id, app]) => canSeeApp425(app) && app.hiddenStandalone !== true)
            .sort((a, b) => String(a[1].name || a[0]).localeCompare(String(b[1].name || b[0])));
    }

    function getCategories425() {
        return window.EMERALDOS_APP_CATEGORIES || {
            essential: { id: "essential", name: "Essential Apps", icon: "📁", edition: "economy" },
            office: { id: "office", name: "Office Apps", icon: "📁", edition: "home" },
            internet: { id: "internet", name: "Internet Apps", icon: "📁", edition: "business" },
            business: { id: "business", name: "Business Apps", icon: "📁", edition: "business" },
            creative: { id: "creative", name: "Creative Apps", icon: "📁", edition: "virtue" },
            developer: { id: "developer", name: "Developer Apps", icon: "📁", edition: "developer" },
            executive: { id: "executive", name: "Executive Apps", icon: "📁", edition: "executive" }
        };
    }

    function canSeeEdition425(requiredEdition = "economy") {
        if (typeof window.canSeeEdition === "function") return window.canSeeEdition(requiredEdition);
        return true;
    }

    function getAppsForCategory425(categoryId) {
        return visibleApps425().filter(([id, app]) => (app.category || "essential") === categoryId);
    }

    function getVisibleCategories425() {
        const cats = getCategories425();
        return Object.values(cats).filter(cat => {
            if (!canSeeEdition425(cat.edition || "economy")) return false;
            return getAppsForCategory425(cat.id).length > 0;
        });
    }

    function getFileFolder425(file) {
        return file?.folder || file?.parent || "Desktop";
    }

    function isDesktopFile425(file) {
        return String(getFileFolder425(file)).toLowerCase() === "desktop" || file?.showOnDesktop === true;
    }

    function getFileIcon425(file) {
        const type = String(file?.type || "").toLowerCase();
        const name = String(file?.name || "").toLowerCase();
        if (type === "folder") return "📁";
        if (type.includes("image") || /\.(png|jpg|jpeg|gif|webp|svg)$/.test(name)) return "🖼️";
        if (type.includes("video") || /\.(mp4|webm|mov)$/.test(name)) return "🎬";
        if (type.includes("audio") || /\.(mp3|wav|ogg)$/.test(name)) return "🎵";
        if (/\.(js|css|json|html)$/.test(name)) return "</>";
        return "📄";
    }

    function defaultPos425(index) {
        const col = Math.floor(index / 7);
        const row = index % 7;
        return { left: 14 + col * 96, top: 14 + row * 88 };
    }

    function makeMovableIcon425(options) {
        const desktop = document.getElementById("desktop");
        if (!desktop) return null;

        const posKey = options.posKey;
        const allPositions = getJSON425(options.storageKey, {});
        const pos = allPositions[posKey] || defaultPos425(options.index || 0);

        const el = document.createElement("div");
        el.className = "desktop-item emerald426-desktop-item " + (options.extraClass || "");
        el.dataset.desktopKey = posKey;
        if (options.appId) el.dataset.appId = options.appId;
        if (options.fileId) el.dataset.fileId = options.fileId;
        el.style.position = "absolute";
        el.style.left = (parseInt(pos.left, 10) || 0) + "px";
        el.style.top = (parseInt(pos.top, 10) || 0) + "px";
        el.innerHTML = `<div class="desktop-icon-symbol">${safe425(options.icon || "□")}</div><div class="desktop-icon-label">${safe425(options.label || "Item")}</div>`;

        let drag = null;
        let moved = false;

        el.addEventListener("mousedown", e => {
            if (e.button !== 0) return;
            e.preventDefault();
            moved = false;
            drag = {
                startX: e.clientX,
                startY: e.clientY,
                left: parseInt(el.style.left, 10) || 0,
                top: parseInt(el.style.top, 10) || 0
            };
            el.classList.add("dragging");
            document.querySelectorAll(".desktop-item.selected").forEach(item => item.classList.remove("selected"));
            el.classList.add("selected");
        });

        document.addEventListener("mousemove", e => {
            if (!drag) return;
            const dx = e.clientX - drag.startX;
            const dy = e.clientY - drag.startY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
            const maxLeft = Math.max(0, window.innerWidth - 92);
            const maxTop = Math.max(0, window.innerHeight - 132);
            el.style.left = Math.min(maxLeft, Math.max(0, drag.left + dx)) + "px";
            el.style.top = Math.min(maxTop, Math.max(0, drag.top + dy)) + "px";
        });

        document.addEventListener("mouseup", () => {
            if (!drag) return;
            drag = null;
            el.classList.remove("dragging");
            const data = getJSON425(options.storageKey, {});
            data[posKey] = {
                left: parseInt(el.style.left, 10) || 0,
                top: parseInt(el.style.top, 10) || 0
            };
            setJSON425(options.storageKey, data);
        });

        el.addEventListener("dblclick", e => {
            e.preventDefault();
            if (!moved) options.open?.();
        });

        el.addEventListener("contextmenu", e => {
            e.preventDefault();
            e.stopImmediatePropagation();
            options.menu?.(e.clientX, e.clientY);
        }, true);

        desktop.appendChild(el);
        return el;
    }

    function renderDesktop425() {
        const desktop = document.getElementById("desktop");
        if (!desktop) return;
        desktop.innerHTML = "";

        let index = 0;
        getVisibleCategories425().forEach(category => {
            makeMovableIcon425({
                posKey: "folder:" + category.id,
                storageKey: FOLDER_POS_KEY,
                icon: category.icon || "📁",
                label: category.name || category.id,
                index: index++,
                extraClass: "emerald426-folder-icon",
                open: () => {
                    if (typeof window.openAppFolderT5 === "function") window.openAppFolderT5(category.id);
                    else window.openAppFolderChooser42?.();
                },
                menu: (x, y) => showWin95Menu425(x, y, [
                    { label: "Open", action: () => window.openAppFolderT5?.(category.id) },
                    { label: "Refresh", action: () => window.refreshDesktop?.() },
                    { sep: true },
                    { label: "Pin Application...", action: () => window.openAppPinManager42?.() }
                ])
            });
        });

        Object.entries(window.fileSystem?.files || {}).forEach(([id, file]) => {
            if (!isDesktopFile425(file)) return;
            makeMovableIcon425({
                posKey: "file:" + id,
                storageKey: FILE_POS_KEY,
                icon: getFileIcon425(file),
                label: file.name || "Untitled",
                index: index++,
                fileId: id,
                extraClass: "emerald426-file-icon",
                open: () => window.openFile?.(id),
                menu: (x, y) => showWin95Menu425(x, y, [
                    { label: "Open", action: () => window.openFile?.(id) },
                    { label: "Properties", action: () => window.showProperties?.(id) },
                    { sep: true },
                    { label: "Remove from Desktop", action: async () => {
                        if (typeof window.cloudSaveFile === "function") await window.cloudSaveFile(id, { showOnDesktop: false });
                        if (window.fileSystem?.files?.[id]) window.fileSystem.files[id].showOnDesktop = false;
                        renderDesktop425();
                    }}
                ])
            });
        });

        renderDesktopPins425(index);
    }

    function getPins425(key) {
        return getJSON425(key, []).filter(id => appExists425(id) && canSeeApp425(id));
    }

    function setPins425(key, list) {
        setJSON425(key, unique425(list).filter(id => appExists425(id)));
        refreshPins425();
    }

    function addPin425(key, appId) {
        if (!appExists425(appId) || !canSeeApp425(appId)) {
            window.notify?.("Pin Failed", "This application is not available in this edition.", 3000, "warning");
            return false;
        }
        const pins = unique425([...getJSON425(key, []), appId]);
        setPins425(key, pins);
        window.notify?.("Pinned", `${window.APPS[appId].name} pinned.`, 2500, "success");
        return true;
    }

    function removePin425(key, appId) {
        setPins425(key, getJSON425(key, []).filter(id => id !== appId));
        window.notify?.("Unpinned", `${window.APPS?.[appId]?.name || appId} removed.`, 2500, "info");
    }

    function renderDesktopPins425(startIndex = 0) {
        document.querySelectorAll(".emerald426-pinned-desktop").forEach(el => el.remove());
        getPins425(PIN_DESKTOP_KEY).forEach((appId, i) => {
            const app = window.APPS?.[appId];
            if (!app) return;
            makeMovableIcon425({
                posKey: "pinned-app:" + appId,
                storageKey: PIN_POS_KEY,
                icon: app.icon || "□",
                label: app.name || appId,
                appId,
                index: startIndex + i,
                extraClass: "emerald426-pinned-desktop desktop-pinned-app",
                open: () => window.launchApp?.(appId) || app.launch?.(),
                menu: (x, y) => showWin95Menu425(x, y, [
                    { label: "Open", action: () => window.launchApp?.(appId) || app.launch?.() },
                    { label: "Pin to Start", action: () => window.pinAppToStart?.(appId) },
                    { label: "Pin to Taskbar", action: () => window.pinAppToTaskbar?.(appId) },
                    { sep: true },
                    { label: "Remove from Desktop", action: () => window.unpinAppFromDesktop?.(appId) }
                ])
            });
        });
    }

    function ensurePinnedTaskbar425() {
        const taskbar = document.getElementById("taskbar");
        const taskbarApps = document.getElementById("taskbar-apps");
        if (!taskbar || !taskbarApps) return null;
        let pinned = document.getElementById("pinned-taskbar-apps");
        if (!pinned) {
            pinned = document.createElement("div");
            pinned.id = "pinned-taskbar-apps";
            taskbar.insertBefore(pinned, taskbarApps);
        }
        return pinned;
    }

    function renderTaskbarPins425() {
        const pinned = ensurePinnedTaskbar425();
        if (!pinned) return;
        pinned.innerHTML = "";
        getPins425(PIN_TASKBAR_KEY).forEach(appId => {
            const app = window.APPS?.[appId];
            if (!app) return;
            const btn = document.createElement("button");
            btn.className = "taskbar-pinned-btn emerald426-taskbar-pin";
            btn.title = app.name || appId;
            btn.innerHTML = `<span>${safe425(app.icon || "□")}</span>`;
            btn.onclick = () => window.launchApp?.(appId) || app.launch?.();
            btn.oncontextmenu = e => {
                e.preventDefault();
                e.stopPropagation();
                showWin95Menu425(e.clientX, e.clientY, [
                    { label: "Open", action: () => window.launchApp?.(appId) || app.launch?.() },
                    { label: "Pin to Start", action: () => window.pinAppToStart?.(appId) },
                    { label: "Pin to Desktop", action: () => window.pinAppToDesktop?.(appId) },
                    { sep: true },
                    { label: "Unpin from Taskbar", action: () => window.unpinAppFromTaskbar?.(appId) }
                ]);
            };
            pinned.appendChild(btn);
        });
    }

    function renderStartPins425() {
        const results = document.getElementById("start-results");
        if (!results) return;
        document.getElementById("start-pinned-section")?.remove();
        const pins = getPins425(PIN_START_KEY);
        if (!pins.length) return;
        const section = document.createElement("div");
        section.id = "start-pinned-section";
        section.innerHTML = `<div class="start-section-label">Pinned</div>`;
        pins.forEach(appId => {
            const app = window.APPS?.[appId];
            if (!app) return;
            const item = document.createElement("div");
            item.className = "start-item start-pinned-item emerald426-start-pin";
            item.dataset.appId = appId;
            item.innerHTML = `${safe425(app.icon || "□")} ${safe425(app.name || appId)}`;
            item.onclick = () => {
                window.launchApp?.(appId) || app.launch?.();
                document.getElementById("start-menu")?.classList.remove("show");
            };
            item.oncontextmenu = e => {
                e.preventDefault();
                showWin95Menu425(e.clientX, e.clientY, [
                    { label: "Open", action: () => window.launchApp?.(appId) || app.launch?.() },
                    { label: "Pin to Desktop", action: () => window.pinAppToDesktop?.(appId) },
                    { label: "Pin to Taskbar", action: () => window.pinAppToTaskbar?.(appId) },
                    { sep: true },
                    { label: "Unpin from Start", action: () => window.unpinAppFromStart?.(appId) }
                ]);
            };
            section.appendChild(item);
        });
        const sep = document.createElement("hr");
        section.appendChild(sep);
        results.prepend(section);
    }

    function refreshPins425() {
        renderDesktop425();
        renderTaskbarPins425();
        renderStartPins425();
    }

    function showWin95Menu425(x, y, items) {
        let menu = document.getElementById("context-menu");
        if (!menu) {
            menu = document.createElement("div");
            menu.id = "context-menu";
            document.body.appendChild(menu);
        }

        window.__emerald426MenuActions = [];
        menu.className = "show win95-context-menu emerald426-context-menu";
        menu.style.display = "block";
        menu.innerHTML = items.map((item, index) => {
            if (item.sep) return `<div class="context-separator"></div>`;
            const actionIndex = window.__emerald426MenuActions.push(item.action || function(){}) - 1;
            const arrow = item.children ? `<span class="context-arrow">▶</span>` : "";
            return `<div class="context-item" data-action-index="${actionIndex}">${safe425(item.label)}${arrow}</div>`;
        }).join("");

        const rectWidth = 230;
        const estimatedHeight = Math.max(26, items.length * 26 + 8);
        const left = Math.max(2, Math.min(x, window.innerWidth - rectWidth - 2));
        const top = Math.max(2, Math.min(y, window.innerHeight - estimatedHeight - 42));
        menu.style.left = left + "px";
        menu.style.top = top + "px";

        menu.querySelectorAll(".context-item[data-action-index]").forEach(el => {
            el.onclick = e => {
                e.preventDefault();
                e.stopPropagation();
                const idx = parseInt(el.dataset.actionIndex, 10);
                hideContextMenu425();
                window.__emerald426MenuActions?.[idx]?.();
            };
        });
    }

    function hideContextMenu425() {
        const menu = document.getElementById("context-menu");
        if (!menu) return;
        menu.classList.remove("show");
        menu.style.display = "none";
    }

    window.showWin95Menu425 = showWin95Menu425;
    window.hideContextMenu425 = hideContextMenu425;

    function installDesktopContextMenu425() {
        const desktop = document.getElementById("desktop");
        if (!desktop || desktop.__emerald426ContextInstalled) return;
        desktop.__emerald426ContextInstalled = true;

        desktop.addEventListener("contextmenu", e => {
            if (e.target.closest(".desktop-item")) return;
            e.preventDefault();
            e.stopImmediatePropagation();
            showWin95Menu425(e.clientX, e.clientY, [
                { label: "Open App Folder...", action: () => window.openAppFolderChooser42?.() || window.openAppFolderT5?.("essential") },
                { label: "Pin Application...", action: () => window.openAppPinManager42?.() },
                { sep: true },
                { label: "New File", action: () => window.createFileOnDesktop?.() },
                { label: "New Folder", action: () => window.createFolderOnDesktop?.() },
                { label: "Upload To Desktop", action: () => window.uploadFileToDesktop?.() },
                { sep: true },
                { label: "Display Settings", action: () => window.openDisplaySettings42?.() },
                { label: "System Control Center", action: () => window.openSystemControlCenter42?.() },
                { label: "Desktop Sync", action: () => window.openDesktopSyncCenter42?.() },
                { sep: true },
                { label: "Reset Desktop Layout", action: () => window.resetAllDesktopLayout425?.() },
                { label: "Refresh", action: () => renderDesktop425() }
            ]);
        }, true);

        document.addEventListener("click", hideContextMenu425, true);
        document.addEventListener("keydown", e => {
            if (e.key === "Escape") hideContextMenu425();
        });
    }

    window.resetAllDesktopLayout425 = async function () {
        localStorage.removeItem(FOLDER_POS_KEY);
        localStorage.removeItem(FILE_POS_KEY);
        localStorage.removeItem(PIN_POS_KEY);
        try { await window.saveUserSettings?.({ desktopPositions: {}, desktopPinPositions: {} }); } catch {}
        renderDesktop425();
        window.notify?.("Desktop", "Desktop layout reset.", 2500, "info");
    };

    async function scheduleCloudSettings425() {
        clearTimeout(window.__emerald426CloudSettingsTimer);
        window.__emerald426CloudSettingsTimer = setTimeout(async () => {
            try {
                await window.saveUserSettings?.({
                    desktopFolderPositions425: getJSON425(FOLDER_POS_KEY, {}),
                    desktopFilePositions425: getJSON425(FILE_POS_KEY, {}),
                    desktopPinPositions: getJSON425(PIN_POS_KEY, {}),
                    pinnedStartApps: getJSON425(PIN_START_KEY, []),
                    pinnedDesktopApps: getJSON425(PIN_DESKTOP_KEY, []),
                    pinnedTaskbarApps: getJSON425(PIN_TASKBAR_KEY, [])
                });
            } catch (err) {
                console.warn("EmeraldOS 5.3 layout sync skipped:", err);
            }
        }, 650);
    }

    function installPinOverrides425() {
        window.pinAppToStart = appId => addPin425(PIN_START_KEY, appId);
        window.unpinAppFromStart = appId => removePin425(PIN_START_KEY, appId);
        window.pinAppToDesktop = appId => addPin425(PIN_DESKTOP_KEY, appId);
        window.unpinAppFromDesktop = appId => removePin425(PIN_DESKTOP_KEY, appId);
        window.pinAppToTaskbar = appId => addPin425(PIN_TASKBAR_KEY, appId);
        window.unpinAppFromTaskbar = appId => removePin425(PIN_TASKBAR_KEY, appId);
    }

    function patchTerminal425() {
        const original = window.runCommand;
        if (typeof original !== "function" || original.__e425Wrapped) return;
        const wrapped = async function (cmdLine = "") {
            const raw = String(cmdLine).trim();
            const parts = raw.match(/"([^"]*)"|'([^']*)'|(\S+)/g)?.map(x => x.replace(/^["']|["']$/g, "")) || [];
            const cmd = (parts.shift() || "").toLowerCase();
            let result = null;
            if (cmd === "version" || cmd === "build") result = "EmeraldOS 5.3 Context Menu & Pinning Fix";
            if (cmd === "desktop.render") { renderDesktop425(); result = "Desktop folder layout rendered."; }
            if (cmd === "menu.test") { showWin95Menu425(80, 80, [{label:"Test Item", action:()=>window.notify?.("Menu", "Context menu works.")}]); result = "Opened test context menu."; }
            if (result !== null) {
                const output = document.getElementById("terminal_output");
                if (output) {
                    output.innerHTML += `> ${safe425(raw)}<br>${result}<br><br>`;
                    output.scrollTop = output.scrollHeight;
                    const input = document.getElementById("terminal_input");
                    if (input) input.value = "";
                }
                return;
            }
            return original.call(this, cmdLine);
        };
        wrapped.__e425Wrapped = true;
        window.runCommand = wrapped;
    }

    function injectStyles425() {
        if (document.getElementById("emerald426-styles")) return;
        const style = document.createElement("style");
        style.id = "emerald426-styles";
        style.textContent = `
            #context-menu.win95-context-menu,
            .win95-context-menu,
            .emerald426-context-menu {
                position: fixed !important;
                display: none;
                min-width: 220px;
                max-width: 280px;
                background: #c0c0c0 !important;
                color: #000 !important;
                border-top: 2px solid #ffffff !important;
                border-left: 2px solid #ffffff !important;
                border-right: 2px solid #404040 !important;
                border-bottom: 2px solid #404040 !important;
                padding: 2px !important;
                z-index: 2147483647 !important;
                font-family: "MS Sans Serif", Tahoma, Arial, sans-serif !important;
                font-size: 12px !important;
                box-shadow: 2px 2px 0 rgba(0,0,0,.5) !important;
                user-select: none !important;
            }
            #context-menu.show.win95-context-menu,
            .win95-context-menu.show,
            .emerald426-context-menu.show { display: block !important; }
            .win95-context-menu .context-item,
            .emerald426-context-menu .context-item {
                min-height: 22px !important;
                padding: 4px 24px 4px 22px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                cursor: default !important;
                white-space: nowrap !important;
                color: #000 !important;
                background: transparent !important;
            }
            .win95-context-menu .context-item:hover,
            .emerald426-context-menu .context-item:hover {
                background: #000080 !important;
                color: #fff !important;
            }
            .win95-context-menu .context-separator,
            .emerald426-context-menu .context-separator {
                height: 1px !important;
                background: #808080 !important;
                border-bottom: 1px solid #fff !important;
                margin: 3px 2px !important;
            }
            #toast-container {
                left: auto !important;
                right: 10px !important;
                bottom: 50px !important;
                align-items: flex-end !important;
                gap: 6px !important;
                z-index: 2147483646 !important;
            }
            .toast {
                min-width: 245px !important;
                max-width: 330px !important;
                background: #c0c0c0 !important;
                color: #000 !important;
                border-top: 2px solid #ffffff !important;
                border-left: 2px solid #ffffff !important;
                border-right: 2px solid #404040 !important;
                border-bottom: 2px solid #404040 !important;
                border-radius: 0 !important;
                box-shadow: 2px 2px 0 rgba(0,0,0,.5) !important;
                padding: 0 !important;
                font-family: "MS Sans Serif", Tahoma, Arial, sans-serif !important;
                opacity: 0;
                transform: translateX(18px);
                transition: opacity .18s ease, transform .18s ease !important;
                overflow: hidden !important;
            }
            .toast.show { opacity: 1 !important; transform: translateX(0) !important; }
            .toast-title {
                display: block !important;
                margin: 0 !important;
                padding: 3px 6px !important;
                background: #000080 !important;
                color: #fff !important;
                font-weight: bold !important;
                font-size: 12px !important;
                line-height: 16px !important;
            }
            .toast-msg {
                display: block !important;
                padding: 8px !important;
                color: #000 !important;
                opacity: 1 !important;
                font-size: 12px !important;
                line-height: 1.35 !important;
                background: #c0c0c0 !important;
            }
            .toast-success, .toast-error, .toast-warning, .toast-info { border-left: 2px solid #fff !important; }
            .toast-success .toast-title { background:#008000 !important; }
            .toast-error .toast-title { background:#800000 !important; }
            .toast-warning .toast-title { background:#808000 !important; }
            .toast-info .toast-title { background:#000080 !important; }
            .emerald426-desktop-item {
                width: 76px;
                min-height: 70px;
                color: #fff;
                text-align: center;
                padding: 4px;
                cursor: default;
                border: 1px solid transparent;
            }
            .emerald426-desktop-item:hover,
            .emerald426-desktop-item.selected { background:#000080; border:1px dotted #fff; }
            .emerald426-desktop-item.dragging { opacity:.82; z-index:99999; }
        `;
        document.head.appendChild(style);
    }

    function patchBuildLabels425() {
        try { document.title = document.title.replace("5.3", "5.3"); } catch {}
        try { window.EmeraldOSRegistry?.set?.("HKEY_LOCAL_MACHINE\\System\\Build\\Version", "5.3"); } catch {}
        try { window.EmeraldOSRegistry?.set?.("HKEY_CURRENT_USER\\Software\\EmeraldOS\\Explorer\\ContextMenu", "Win95Fixed"); } catch {}
        try { window.EmeraldOSRegistry?.set?.("HKEY_CURRENT_USER\\Software\\EmeraldOS\\Explorer\\DesktopMode", "FoldersOnlyPinnedSafe"); } catch {}
    }

    function init425() {
        if (window.__emerald426InitDone) return;
        window.__emerald426InitDone = true;
        injectStyles425();
        installPinOverrides425();
        installDesktopContextMenu425();
        patchTerminal425();
        patchBuildLabels425();
        window.renderDesktop = renderDesktop425;
        window.renderDesktopOverride = renderDesktop425;
        const oldStartMenu425 = window.renderStartMenu;
        window.renderStartMenu = function () {
            if (typeof oldStartMenu425 === "function") {
                try { oldStartMenu425.call(this); } catch {}
            }
            renderStartPins425();
        };
        const oldRefresh = window.refreshEditionVisibility;
        window.refreshEditionVisibility = function () {
            if (typeof oldRefresh === "function") {
                try { oldRefresh.call(this); } catch {}
            }
            renderDesktop425();
            try { window.renderStartMenu?.(); } catch {}
            renderTaskbarPins425();
        };
        window.refreshPins425 = refreshPins425;
        window.refreshPins42 = refreshPins425;
        renderDesktop425();
        renderTaskbarPins425();
        renderStartPins425();
        window.notify?.("EmeraldOS 5.3", "Context menu, desktop pins, and Win95 notifications fixed.", 3500, "success");
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", () => setTimeout(init425, 0));
    } else {
        setTimeout(init425, 0);
    }
})();


/* =========================================================
   EMERALDOS 5.3 RIGHT-CLICK HOTFIX
   Final override: single Win95 context menu, mouse-positioned.
========================================================= */
(function () {
    "use strict";

    function safeNotify(title, message, type) {
        try {
            if (typeof window.notify === "function") window.notify(title, message, 3000, type || "info");
        } catch {}
    }

    function getMenu() {
        let menu = document.getElementById("context-menu");
        if (!menu) {
            menu = document.createElement("div");
            menu.id = "context-menu";
            document.body.appendChild(menu);
        }
        menu.className = "show win95-context-menu emerald426-context-menu";
        return menu;
    }

    function htmlEscape(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function positionMenu(menu, x, y) {
        menu.style.display = "block";
        menu.style.visibility = "hidden";
        menu.style.left = "0px";
        menu.style.top = "0px";

        const width = Math.max(220, menu.offsetWidth || 220);
        const height = Math.max(24, menu.offsetHeight || 24);
        const margin = 4;
        const taskbarGap = 44;

        const left = Math.max(margin, Math.min(x, window.innerWidth - width - margin));
        const top = Math.max(margin, Math.min(y, window.innerHeight - height - taskbarGap));

        menu.style.left = left + "px";
        menu.style.top = top + "px";
        menu.style.visibility = "visible";
    }

    function hideMenu() {
        const menu = document.getElementById("context-menu");
        if (!menu) return;
        menu.classList.remove("show");
        menu.style.display = "none";
    }

    function showMenu(x, y, items) {
        const menu = getMenu();
        const actions = [];

        menu.innerHTML = items.map(item => {
            if (item.sep) return '<div class="context-separator"></div>';
            const index = actions.push(item.action || function(){}) - 1;
            return '<div class="context-item" data-action-index="' + index + '">' + htmlEscape(item.label) + '</div>';
        }).join("");

        menu.querySelectorAll(".context-item[data-action-index]").forEach(el => {
            el.addEventListener("click", e => {
                e.preventDefault();
                e.stopPropagation();
                const index = Number(el.dataset.actionIndex);
                hideMenu();
                try { actions[index]?.(); } catch (err) { console.error(err); }
            });
        });

        positionMenu(menu, x, y);
    }

    function installFinalContextMenu() {
        const desktop = document.getElementById("desktop");
        if (!desktop || desktop.__emerald426FinalContextInstalled) return;
        desktop.__emerald426FinalContextInstalled = true;

        desktop.addEventListener("contextmenu", e => {
            if (e.target.closest(".window") || e.target.closest("#taskbar") || e.target.closest("#start-menu")) return;

            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            showMenu(e.clientX, e.clientY, [
                { label: "Refresh", action: () => window.refreshDesktop?.() },
                { sep: true },
                { label: "Open Application Folder", action: () => window.openAppFolderChooser42?.() || window.openAppFolderT5?.("essential") },
                { label: "Pin Application", action: () => window.openAppPinManager42?.() || window.openPinManager42?.() },
                { sep: true },
                { label: "New File", action: () => window.createFileOnDesktop?.() },
                { label: "New Folder", action: () => window.createFolderOnDesktop?.() },
                { label: "Upload To Desktop", action: () => window.uploadFileToDesktop?.() },
                { sep: true },
                { label: "Reset Icon Layout", action: () => window.resetDesktopLayoutT5?.() || window.resetDesktopLayoutT4?.() || window.debugClearLayout?.() },
                { label: "System Settings", action: () => window.openSystemApp?.() }
            ]);
        }, true);
    }

    document.addEventListener("click", hideMenu, true);
    window.addEventListener("blur", hideMenu);
    window.addEventListener("resize", hideMenu);

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", installFinalContextMenu);
    } else {
        installFinalContextMenu();
    }

    window.showEmeraldWin95ContextMenu = showMenu;
    window.hideEmeraldWin95ContextMenu = hideMenu;
})();


/* =========================================================
   EMERALDOS 5.3 AUDIO NOTES HOTFIX
   Real recording, playback, saving, and file integration
========================================================= */

(function () {
    "use strict";

    let audioRecorder426 = null;
    let audioStream426 = null;
    let audioChunks426 = [];
    let audioLastBlob426 = null;
    let audioLastUrl426 = "";
    let audioTimer426 = null;
    let audioStartedAt426 = 0;

    function audioSafe(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function audioSupported426() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
    }

    function audioMime426() {
        const options = [
            "audio/webm;codecs=opus",
            "audio/webm",
            "audio/ogg;codecs=opus",
            "audio/mp4"
        ];
        return options.find(type => window.MediaRecorder && MediaRecorder.isTypeSupported(type)) || "";
    }

    function audioExt426(mime) {
        if (String(mime).includes("ogg")) return "ogg";
        if (String(mime).includes("mp4")) return "m4a";
        return "webm";
    }

    function blobToDataURL426(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    function refreshAudioTimer426() {
        const timer = document.getElementById("audioNoteTimer426");
        if (!timer || !audioStartedAt426) return;
        const seconds = Math.floor((Date.now() - audioStartedAt426) / 1000);
        const m = Math.floor(seconds / 60);
        const s = String(seconds % 60).padStart(2, "0");
        timer.textContent = `${m}:${s}`;
    }

    function renderAudioNoteList426() {
        const list = document.getElementById("audioNotesList426");
        if (!list) return;

        const notes = Object.entries(window.fileSystem?.files || {})
            .filter(([id, file]) => {
                const name = String(file.name || "").toLowerCase();
                const type = String(file.type || file.mimeType || file.storageContentType || "").toLowerCase();
                return type.includes("audio") || /\.(webm|mp3|wav|ogg|m4a)$/i.test(name);
            })
            .sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0));

        list.innerHTML = notes.map(([id, file]) => `
            <div class="audio-note-row">
                <div>
                    <b>${audioSafe(file.name || "Audio Note")}</b><br>
                    <span>${new Date(file.createdAt || file.updatedAt || Date.now()).toLocaleString()}</span><br>
                    <span>${file.hasStorageBlob ? "Firebase Storage" : "Firestore"} · ${Number(file.storageSize || file.size || 0).toLocaleString()} bytes</span>
                </div>
                <div>
                    <button onclick="openFile('${audioSafe(id)}')">Open</button>
                    <button onclick="putFileOnDesktop('${audioSafe(id)}')">Desktop</button>
                    <button onclick="downloadFile('${audioSafe(id)}')">Download</button>
                </div>
            </div>
        `).join("") || `<div class="inset-panel">No audio notes yet.</div>`;
    }

    window.openAudioNotes = function () {
        const supportMessage = audioSupported426()
            ? "Record voice notes using your microphone. Saved recordings appear in Files and can be placed on the desktop."
            : "This browser does not support MediaRecorder audio recording.";

        window.openWindow("Audio Notes", `
            <div class="app-panel audio-notes-app">
                <h3>Audio Notes</h3>
                <div class="inset-panel">${audioSafe(supportMessage)}</div>

                <div class="audio-recorder-box">
                    <div class="audio-status-row">
                        <b>Status:</b> <span id="audioNoteStatus426">Idle</span>
                        <span class="audio-timer" id="audioNoteTimer426">0:00</span>
                    </div>

                    <div class="toolbar">
                        <button onclick="startAudioNote426()">Start Recording</button>
                        <button onclick="stopAudioNote426()">Stop</button>
                        <button onclick="saveAudioNote426()">Save Note</button>
                        <button onclick="discardAudioNote426()">Discard</button>
                    </div>

                    <audio id="audioNotePreview426" controls style="width:100%;margin-top:8px;display:none;"></audio>
                </div>

                <h4>Saved Audio Notes</h4>
                <div id="audioNotesList426"></div>
            </div>
        `, "audioNotes");

        renderAudioNoteList426();
    };

    window.startAudioNote426 = async function () {
        if (!audioSupported426()) {
            notify("Audio Notes", "Audio recording is not supported in this browser.", 4000, "error");
            return;
        }

        if (audioRecorder426 && audioRecorder426.state === "recording") return;

        try {
            audioStream426 = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioChunks426 = [];
            audioLastBlob426 = null;

            const mime = audioMime426();
            audioRecorder426 = mime
                ? new MediaRecorder(audioStream426, { mimeType: mime })
                : new MediaRecorder(audioStream426);

            audioRecorder426.ondataavailable = event => {
                if (event.data && event.data.size > 0) audioChunks426.push(event.data);
            };

            audioRecorder426.onstop = () => {
                const finalMime = audioRecorder426.mimeType || mime || "audio/webm";
                audioLastBlob426 = new Blob(audioChunks426, { type: finalMime });

                if (audioLastUrl426) URL.revokeObjectURL(audioLastUrl426);
                audioLastUrl426 = URL.createObjectURL(audioLastBlob426);

                const preview = document.getElementById("audioNotePreview426");
                if (preview) {
                    preview.src = audioLastUrl426;
                    preview.style.display = "block";
                }

                const status = document.getElementById("audioNoteStatus426");
                if (status) status.textContent = "Recording ready to save";

                if (audioStream426) {
                    audioStream426.getTracks().forEach(track => track.stop());
                    audioStream426 = null;
                }

                clearInterval(audioTimer426);
                audioTimer426 = null;
            };

            audioRecorder426.start();
            audioStartedAt426 = Date.now();
            clearInterval(audioTimer426);
            audioTimer426 = setInterval(refreshAudioTimer426, 250);
            refreshAudioTimer426();

            const status = document.getElementById("audioNoteStatus426");
            if (status) status.textContent = "Recording";

            notify("Audio Notes", "Recording started.", 2500, "info");
        } catch (err) {
            console.warn("Audio recording failed:", err);
            notify("Audio Notes", "Microphone permission was denied or unavailable.", 4500, "error");
        }
    };

    window.stopAudioNote426 = function () {
        if (audioRecorder426 && audioRecorder426.state === "recording") {
            audioRecorder426.stop();
            notify("Audio Notes", "Recording stopped.", 2500, "success");
        }
    };

    window.saveAudioNote426 = async function () {
        if (!audioLastBlob426) {
            notify("Audio Notes", "Record something first.", 3000, "warning");
            return;
        }

        try {
            const mime = audioLastBlob426.type || "audio/webm";
            const ext = audioExt426(mime);
            const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
            const name = prompt("Audio note filename:", `Audio Note ${stamp}.${ext}`);
            if (!name) return;

            const dataUrl = await blobToDataURL426(audioLastBlob426);
            const id = await cloudCreateFile(name, dataUrl);
            if (!id) throw new Error("File create failed");

            await cloudSaveFile(id, {
                folder: "Desktop",
                parent: "Desktop",
                showOnDesktop: true,
                type: "audio",
                mimeType: mime,
                size: audioLastBlob426.size,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });

            await loadSystem();
            if (typeof window.renderDesktop === "function") window.renderDesktop();
            renderAudioNoteList426();

            notify("Audio Notes", "Audio note saved to the desktop.", 3500, "success");
        } catch (err) {
            console.warn("Audio note save failed:", err);
            notify("Audio Notes", "Could not save the audio note.", 4500, "error");
        }
    };

    window.discardAudioNote426 = function () {
        if (audioRecorder426 && audioRecorder426.state === "recording") {
            audioRecorder426.stop();
        }

        audioChunks426 = [];
        audioLastBlob426 = null;

        if (audioLastUrl426) {
            URL.revokeObjectURL(audioLastUrl426);
            audioLastUrl426 = "";
        }

        const preview = document.getElementById("audioNotePreview426");
        if (preview) {
            preview.removeAttribute("src");
            preview.style.display = "none";
        }

        const status = document.getElementById("audioNoteStatus426");
        if (status) status.textContent = "Idle";

        const timer = document.getElementById("audioNoteTimer426");
        if (timer) timer.textContent = "0:00";

        clearInterval(audioTimer426);
        audioTimer426 = null;

        notify("Audio Notes", "Recording discarded.", 2500, "info");
    };

})();
