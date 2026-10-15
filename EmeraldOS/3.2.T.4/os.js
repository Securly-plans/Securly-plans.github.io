"use strict";

/* =========================================================
   TESTOS 3.2.T.4
   PART 1
   BOOT + REGISTRY + DESKTOP
======================================================== */

import {
    loadDrive,
    createFile as cloudCreateFile,
    saveFile as cloudSaveFile,
    deleteFile as cloudDeleteFile,
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
    localStorage.getItem("testos_theme")
    || "classic";


/* =========================================================
   TESTOS 3.2.T.4 EDITION CORE
   Hidden-feature edition system
========================================================= */

const TESTOS_EDITION_LEVELS = {
    economy: 1,
    home: 2,
    business: 3,
    virtue: 4,
    developer: 5,
    executive: 6
};

const TESTOS_EDITION_NAMES = {
    economy: "TestOS Economy",
    home: "TestOS Home",
    business: "TestOS Business",
    virtue: "TestOS Virtue",
    developer: "TestOS Developer",
    executive: "TestOS Executive"
};

function normalizeEdition(id) {
    return TESTOS_EDITION_LEVELS[id] ? id : "economy";
}

function getActiveEdition() {
    return normalizeEdition(
        localStorage.getItem("testos_edition") || "economy"
    );
}

function getActiveEditionLevel() {
    return TESTOS_EDITION_LEVELS[getActiveEdition()] || 1;
}

function canSeeEdition(requiredEdition = "home") {
    const currentLevel = getActiveEditionLevel();
    const requiredLevel = TESTOS_EDITION_LEVELS[requiredEdition] || 1;

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

window.TESTOS_EDITION_LEVELS = TESTOS_EDITION_LEVELS;
window.getActiveEdition = getActiveEdition;
window.getActiveEditionLevel = getActiveEditionLevel;
window.canSeeEdition = canSeeEdition;
window.canSeeApp = canSeeApp;
window.launchApp = launchApp;

/* =========================================================
   TESTOS NOTIFICATIONS
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
        title = "TestOS";
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
        launch: () => window.openTestOSPlans()
    },

    about: {
        name: "About TestOS",
        icon: "i",
        edition: "home",
        launch: () => window.openAboutTestOS()
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
        "testos_theme",
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
        "TestOSusername"
    );

    localStorage.removeItem(
        "Testos_session"
    );

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
        "testos_window_session",
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
            "testos_window_session"
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
   Disabled in TestOS. Toast notifications are handled by
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
            "testos_wallpaper"
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
            "testos_wallpaper",
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
            "testos_startup"
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
                    "testos_startup"
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
            "testos_startup",
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
            "TestOS",
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
        "testos_recent"
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
        "testos_recent",
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
        "testos_theme"
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
        "testos_theme",
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
            "testos_apps"
        ) || "[]"
    );

let wallpaper =
    localStorage.getItem(
        "testos_wallpaper"
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
        "testos_wallpaper",
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
        "testos_wallpaper",
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
        "testos_apps",
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
        "testos_apps",
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
   TESTOS 3.2.T.4 DEVELOPER EDITION PATCH
   - Dedicated Developer edition
   - Rebuilt Files app
   - Desktop file icons
   - Movable desktop items with saved positions
========================================================= */

(function () {
    "use strict";

    const DESKTOP_POS_KEY = "testos_desktop_positions_v2";
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
            edition: localStorage.getItem("testos_edition"),
            build: localStorage.getItem("testos_build_name"),
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
        const build = window.TESTOS_BUILD || {};
        const edition = localStorage.getItem("testos_edition_name") || localStorage.getItem("testos_edition") || "Home";
        window.openWindow("Build Inspector", `
            <div style="padding:10px;">
                <h3>Build Inspector</h3>
                <div class="inset-panel">
                    <b>Build:</b> ${safeHTML(build.displayName || "TestOS 3.2.T.4")}<br>
                    <b>Version:</b> ${safeHTML(build.version || "3.2.T.4")}<br>
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

    let enhancedCurrentFolder = localStorage.getItem("testos_current_folder") || "Desktop";
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
        localStorage.setItem("testos_current_folder", enhancedCurrentFolder);
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
        window.__testosSelectedFile = id;
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

    window.openFile = function (id) {
        const file = window.fileSystem?.files?.[id];
        if (!file) return;

        if (file.type === "folder") {
            setFolder(file.name);
            window.openFileExplorer(file.name);
            return;
        }

        let html = "";
        const content = file.content || "";
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
        if (window.__testosSelectedFile) return window.putFileOnDesktop(window.__testosSelectedFile);
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

    window.downloadFile = function (id) {
        const file = window.fileSystem?.files?.[id];
        if (!file) return;
        const a = document.createElement("a");
        if (String(file.content || "").startsWith("data:")) {
            a.href = file.content;
        } else {
            a.href = URL.createObjectURL(new Blob([file.content || ""], { type: file.mimeType || "text/plain" }));
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
                    <b>Updated:</b> ${file.updatedAt ? new Date(file.updatedAt).toLocaleString() : "Unknown"}
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
       TESTOS 3.2.T.4 ADVANCED DEVELOPER PATCH
       - More apps
       - Expanded terminal
       - HKEY-style registry
       - Firebase desktop layout + registry sync
    ----------------------------------------------------- */

    const DESKTOP_POS_KEY_T3 = "testos_desktop_positions_v3";
    const REGISTRY_KEY_T3 = "testos_registry_v3";
    let cloudSaveTimerT3 = null;
    let cloudSettingsLoadedT3 = false;
    let terminalCwdT3 = localStorage.getItem("testos_terminal_cwd") || "Desktop";

    const DEFAULT_TESTOS_REGISTRY = {
        "HKEY_TESTOS\\SOFTWARE\\TestOS\\ProductName": "TestOS",
        "HKEY_TESTOS\\SOFTWARE\\TestOS\\CurrentVersion": "3.2.T.4",
        "HKEY_TESTOS\\SOFTWARE\\TestOS\\BuildChannel": "Test",
        "HKEY_TESTOS\\SOFTWARE\\TestOS\\BaseSystem": "EmeraldOS 3.2",
        "HKEY_CURRENT_USER\\Control Panel\\Desktop\\Theme": localStorage.getItem("testos_theme") || "classic",
        "HKEY_CURRENT_USER\\Control Panel\\Desktop\\IconLayoutSource": "Firebase + Local Cache",
        "HKEY_CURRENT_USER\\Software\\TestOS\\Explorer\\ShowDesktopFiles": "1",
        "HKEY_CURRENT_USER\\Software\\TestOS\\Explorer\\SnapToGrid": "0",
        "HKEY_CURRENT_USER\\Software\\TestOS\\Terminal\\WorkingDirectory": terminalCwdT3,
        "HKEY_CURRENT_USER\\Software\\TestOS\\Terminal\\CommandMode": "Advanced",
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
                    ...DEFAULT_TESTOS_REGISTRY,
                    ...settings.registry
                }));
            }

            if (settings.terminalCwd) {
                terminalCwdT3 = settings.terminalCwd;
                localStorage.setItem("testos_terminal_cwd", terminalCwdT3);
            }

            if (typeof notify === "function") {
                notify("Cloud Sync", "Desktop layout and registry restored.", 2800, "success");
            }
        } catch (err) {
            console.warn("TestOS cloud settings failed:", err);
        }
    }

    function queueT3CloudSave(data) {
        clearTimeout(cloudSaveTimerT3);
        cloudSaveTimerT3 = setTimeout(async () => {
            try {
                await saveUserSettings(data);
            } catch (err) {
                console.warn("TestOS cloud save failed:", err);
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
            return { ...DEFAULT_TESTOS_REGISTRY, ...stored };
        } catch {
            return { ...DEFAULT_TESTOS_REGISTRY };
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
        saveRegistry({ ...DEFAULT_TESTOS_REGISTRY });
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
                result = "TestOS 3.2.T.4 Economy App Folders Build";
            }

            else if (command === "about") {
                result = htmlLines([
                    "TestOS 3.2.T.4",
                    "Built on EmeraldOS 3.2",
                    "Adds HKEY registry, advanced terminal, more apps, and Firebase desktop sync."
                ]);
            }

            else if (command === "whoami") {
                result = safeHTML(localStorage.getItem("TestOSusername") || localStorage.getItem("Testos_session") || "Guest");
            }

            else if (command === "edition") {
                result = safeHTML(localStorage.getItem("testos_edition_name") || localStorage.getItem("testos_edition") || "TestOS Economy");
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
                    localStorage.setItem("testos_terminal_cwd", terminalCwdT3);
                    registrySet("HKEY_CURRENT_USER\\Software\\TestOS\\Terminal\\WorkingDirectory", terminalCwdT3);
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
       More TestOS 3.2.T.4 apps
    ----------------------------------------------------- */

    window.openTaskBoard = function () {
        const tasks = JSON.parse(localStorage.getItem("testos_tasks") || "[]");
        window.openWindow("Task Board", `
            <div class="app-panel"><h3>Task Board</h3>
            <div class="toolbar"><input id="task_input" placeholder="New task"><button onclick="addTaskBoardItem()">Add</button></div>
            <div id="task_board_list">${tasks.map((t,i)=>`<div class="file-row"><span>${safeHTML(t)}</span><button onclick="removeTaskBoardItem(${i})">Done</button></div>`).join("") || "No tasks."}</div></div>`, "taskBoard");
    };
    window.addTaskBoardItem = function () { const input=document.getElementById("task_input"); if(!input?.value) return; const tasks=JSON.parse(localStorage.getItem("testos_tasks")||"[]"); tasks.push(input.value); localStorage.setItem("testos_tasks",JSON.stringify(tasks)); window.openTaskBoard(); };
    window.removeTaskBoardItem = function (i) { const tasks=JSON.parse(localStorage.getItem("testos_tasks")||"[]"); tasks.splice(i,1); localStorage.setItem("testos_tasks",JSON.stringify(tasks)); window.openTaskBoard(); };

    window.openSpreadsheetLite = function () {
        let rows = "";
        for (let r=0;r<12;r++) rows += `<tr>${Array.from({length:6},(_,c)=>`<td contenteditable="true" data-cell="${r}:${c}"></td>`).join("")}</tr>`;
        window.openWindow("Spreadsheet Lite", `<div class="app-panel"><h3>Spreadsheet Lite</h3><table class="sheet"><tbody>${rows}</tbody></table></div>`, "spreadsheet");
    };

    window.openMailDrafts = function () {
        window.openWindow("Mail Drafts", `<div class="app-panel"><h3>Mail Drafts</h3><input placeholder="To"><input placeholder="Subject"><textarea style="height:170px" placeholder="Draft message"></textarea><button onclick="notify('Mail Drafts','Draft saved locally.',2500,'success')">Save Draft</button></div>`, "mailDrafts");
    };

    window.openContacts = function () {
        const contacts = JSON.parse(localStorage.getItem("testos_contacts") || "[]");
        window.openWindow("Contacts", `<div class="app-panel"><h3>Contacts</h3><div class="toolbar"><input id="contact_name" placeholder="Name"><input id="contact_email" placeholder="Email"><button onclick="addContact()">Add</button></div>${contacts.map((c,i)=>`<div class="file-row"><span>${safeHTML(c.name)} - ${safeHTML(c.email)}</span><button onclick="removeContact(${i})">Remove</button></div>`).join("") || "No contacts."}</div>`, "contacts");
    };
    window.addContact = function(){const name=document.getElementById('contact_name')?.value||'';const email=document.getElementById('contact_email')?.value||'';if(!name&&!email)return;const contacts=JSON.parse(localStorage.getItem('testos_contacts')||'[]');contacts.push({name,email});localStorage.setItem('testos_contacts',JSON.stringify(contacts));window.openContacts();};
    window.removeContact = function(i){const contacts=JSON.parse(localStorage.getItem('testos_contacts')||'[]');contacts.splice(i,1);localStorage.setItem('testos_contacts',JSON.stringify(contacts));window.openContacts();};

    window.openReports = function () {
        window.openWindow("Reports", `<div class="app-panel"><h3>Reports</h3><div class="inset-panel"><b>Files:</b> ${Object.keys(window.fileSystem?.files||{}).length}<br><b>Visible apps:</b> ${getVisibleAppEntriesSafe().length}<br><b>Edition:</b> ${safeHTML(localStorage.getItem('testos_edition_name')||'Home')}</div></div>`, "reports");
    };

    window.openThemeLab = function () {
        window.openWindow("Theme Lab", `<div class="app-panel"><h3>Theme Lab</h3><button onclick="setTheme('classic')">Classic</button><button onclick="setTheme('dark')">Dark</button><button onclick="setTheme('light')">Light</button><button onclick="setTheme('midnight')">Midnight</button><hr><input id="theme_lab_color" placeholder="#008080"><button onclick="setWallpaper(document.getElementById('theme_lab_color').value)">Set desktop color</button></div>`, "themeLab");
    };

    window.openArchiveManager = function () {
        window.openWindow("Archive Manager", `<div class="app-panel"><h3>Archive Manager</h3><p>Select files in Files, then download them individually. Archive packing is simulated in this test build.</p><button onclick="notify('Archive Manager','Archive scan complete.',2500,'info')">Scan Files</button></div>`, "archiveManager");
    };

    window.openAudioNotes = function () {
        window.openWindow("Audio Notes", `<div class="app-panel"><h3>Audio Notes</h3><p>Audio note recorder placeholder for TestOS 3.2.T.4.</p><button onclick="notify('Audio Notes','Recorder initialized.',2500,'info')">Initialize Recorder</button></div>`, "audioNotes");
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
        const key = prompt("Registry key:", "HKEY_CURRENT_USER\\Software\\TestOS\\Custom\\Value");
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
        window.openWindow("Script Lab", `<div class="app-panel script-lab"><h3>Script Lab</h3><textarea id="script_lab_code" spellcheck="false">return 'Hello from TestOS 3.2.T.4';</textarea><button onclick="runScriptLab()">Run</button><pre id="script_lab_output"></pre></div>`, "scriptLab");
    };
    window.runScriptLab = function () { const out=document.getElementById('script_lab_output'); try { const code=document.getElementById('script_lab_code')?.value||''; out.textContent=String(Function(code)()); } catch(err){ out.textContent=err.message; } };

    window.openAPITester = function () {
        window.openWindow("API Tester", `<div class="app-panel"><h3>API Tester</h3><input id="api_url" placeholder="https://api.example.com"><button onclick="apiTesterFetch()">Fetch</button><pre id="api_output"></pre></div>`, "apiTester");
    };
    window.apiTesterFetch = async function () { const out=document.getElementById('api_output'); const url=document.getElementById('api_url')?.value; if(!url||!out)return; out.textContent='Loading...'; try{ const res=await fetch(url); out.textContent=await res.text(); }catch(err){ out.textContent='Request failed: '+err.message; } };

    window.openLogViewer = function () {
        const logs = JSON.parse(localStorage.getItem("testos_logs") || "[]");
        window.openWindow("Log Viewer", `<div class="app-panel"><h3>Log Viewer</h3><button onclick="localStorage.setItem('testos_logs','[]');openLogViewer()">Clear Logs</button><pre>${safeHTML(JSON.stringify(logs.slice(-50), null, 2))}</pre></div>`, "logViewer");
    };

    window.openServices = function () {
        window.openWindow("Services", `<div class="app-panel"><h3>Services</h3>${['Cloud Sync','Desktop Shell','Registry Service','Notification Engine','Window Manager'].map(s=>`<div class="file-row"><span>${s}</span><b>Running</b></div>`).join('')}</div>`, "services");
    };

    window.openExecutiveControlCenter = function () {
        window.openWindow("Executive Control Center", `<div class="app-panel"><h3>Executive Control Center</h3><div class="inset-panel">All TestOS modules are available in Executive edition.</div><button onclick="openAuditCenter()">Open Audit Center</button><button onclick="openPolicyManager()">Open Policy Manager</button></div>`, "executiveControl");
    };

    window.openPolicyManager = function () {
        window.openWindow("Policy Manager", `<div class="app-panel"><h3>Policy Manager</h3><button onclick="registrySet('HKEY_LOCAL_MACHINE\\System\\Policies\\AllowExperimentalApps','1');notify('Policy','Experimental apps enabled.',2500,'success')">Enable Experimental Apps</button><button onclick="registrySet('HKEY_LOCAL_MACHINE\\System\\Policies\\AllowExperimentalApps','0');notify('Policy','Experimental apps disabled.',2500,'warning')">Disable Experimental Apps</button></div>`, "policyManager");
    };

    window.openAuditCenter = function () {
        window.openWindow("Audit Center", `<div class="app-panel"><h3>Audit Center</h3><div class="inset-panel"><b>Edition:</b> ${safeHTML(localStorage.getItem('testos_edition_name')||'Unknown')}<br><b>Registry values:</b> ${registryList().length}<br><b>Desktop items:</b> ${Object.keys(getPositions()).length}</div></div>`, "auditCenter");
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

    window.TestOSRegistry = {
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
   TESTOS 3.2.T.4
   Economy Edition + Application Folders + More Apps
========================================================= */
(function () {
    "use strict";

    const DESKTOP_POS_KEY_T4 = "testos_desktop_positions_v2";
    const APP_FOLDER_PREFIX = "folder:";

    const APP_CATEGORIES_T4 = {
        essential: {
            id: "essential",
            name: "Essential Apps",
            icon: "📁",
            edition: "economy",
            description: "Core TestOS tools available in Economy and higher."
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
                console.warn("TestOS T4 desktop layout sync failed:", err);
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

        window.openHelpCenter = () => simpleWindow("Help Center", `<h3>Help Center</h3><div class="inset-panel">Welcome to TestOS 3.2.T.4. Applications are now organized into desktop folders. Double-click a folder to open its apps.</div>`, "helpCenter");
        window.openScratchPad = () => simpleWindow("Scratch Pad", `<h3>Scratch Pad</h3><textarea id="scratchpad_text" style="width:100%;height:190px;">${safeT4(localStorage.getItem('testos_scratchpad') || '')}</textarea><br><button onclick="localStorage.setItem('testos_scratchpad',document.getElementById('scratchpad_text').value);notify('Scratch Pad','Saved.',2500,'success')">Save</button>`, "scratchPad");
        window.openUnitConverter = () => simpleWindow("Unit Converter", `<h3>Unit Converter</h3><input id="conv_value" type="number" placeholder="Value"><select id="conv_type"><option value="mi-km">Miles to km</option><option value="km-mi">Km to miles</option><option value="lb-kg">Pounds to kg</option><option value="kg-lb">Kg to pounds</option></select><button onclick="runUnitConverter()">Convert</button><div id="conv_out" class="inset-panel"></div>`, "unitConverter");
        window.runUnitConverter = function(){const v=parseFloat(document.getElementById('conv_value')?.value||'0');const t=document.getElementById('conv_type')?.value;const out=document.getElementById('conv_out');const m={"mi-km":v*1.60934,"km-mi":v/1.60934,"lb-kg":v*0.453592,"kg-lb":v/0.453592}; if(out) out.textContent=Number.isFinite(m[t])?m[t].toFixed(3):'Invalid';};
        window.openJournal = () => simpleWindow("Journal", `<h3>Journal</h3><textarea id="journal_text" style="width:100%;height:200px;">${safeT4(localStorage.getItem('testos_journal') || '')}</textarea><br><button onclick="localStorage.setItem('testos_journal',document.getElementById('journal_text').value);notify('Journal','Saved.',2500,'success')">Save</button>`, "journal");
        window.openReminderBoard = () => simpleWindow("Reminder Board", `<h3>Reminder Board</h3><input id="reminder_new" placeholder="New reminder"><button onclick="addReminderT4()">Add</button><div id="reminder_list">${renderRemindersT4()}</div>`, "reminders");
        window.addReminderT4 = function(){const val=document.getElementById('reminder_new')?.value.trim();if(!val)return;const arr=JSON.parse(localStorage.getItem('testos_reminders')||'[]');arr.push(val);localStorage.setItem('testos_reminders',JSON.stringify(arr));window.openReminderBoard();};
        window.removeReminderT4 = function(i){const arr=JSON.parse(localStorage.getItem('testos_reminders')||'[]');arr.splice(i,1);localStorage.setItem('testos_reminders',JSON.stringify(arr));window.openReminderBoard();};
        window.openProjectPlanner = () => simpleWindow("Project Planner", `<h3>Project Planner</h3><div class="inset-panel">Plan milestones, files, and reports for your workspace.</div><button onclick="notify('Project Planner','Timeline generated.',2500,'success')">Generate Timeline</button>`, "projectPlanner");
        window.openInvoiceBuilder = () => simpleWindow("Invoice Builder", `<h3>Invoice Builder</h3><input id="invoice_client" placeholder="Client"><input id="invoice_amount" placeholder="Amount"><button onclick="document.getElementById('invoice_out').textContent='Invoice for '+document.getElementById('invoice_client').value+': $'+document.getElementById('invoice_amount').value">Build</button><pre id="invoice_out"></pre>`, "invoiceBuilder");
        window.openPresentationLite = () => simpleWindow("Presentation Lite", `<h3>Presentation Lite</h3><textarea style="width:100%;height:180px;" placeholder="Slide notes"></textarea><br><button onclick="notify('Presentation Lite','Slides saved locally.',2500,'success')">Save Deck</button>`, "presentationLite");
        window.openIconStudio = () => simpleWindow("Icon Studio", `<h3>Icon Studio</h3><div class="inset-panel">Create simple icon labels for desktop apps.</div><input id="icon_text" placeholder="Icon text"><button onclick="document.getElementById('icon_preview').textContent=document.getElementById('icon_text').value||'□'">Preview</button><div id="icon_preview" class="desktop-icon-symbol">□</div>`, "iconStudio");
        window.openColorMixer = () => simpleWindow("Color Mixer", `<h3>Color Mixer</h3><input id="color_mix" type="color" value="#008080"><button onclick="setWallpaper(document.getElementById('color_mix').value)">Apply to Desktop</button>`, "colorMixer");
        window.openFontBook = () => simpleWindow("Font Book", `<h3>Font Book</h3>${['MS Sans Serif','Tahoma','Arial','Courier New','Georgia'].map(f=>`<div class="inset-panel" style="font-family:${f}">${f}: The quick brown fox jumps over the lazy dog.</div>`).join('')}`, "fontBook");
        window.openPackageManager = () => simpleWindow("Package Manager", `<h3>Package Manager</h3><div class="inset-panel">Installed packages:<br>testos-core<br>desktop-shell<br>registry-service<br>app-folders<br>firebase-layout-sync</div>`, "packageManager");
        window.openNetworkTools = () => simpleWindow("Network Tools", `<h3>Network Tools</h3><input id="net_host" placeholder="Host"><button onclick="document.getElementById('net_out').textContent='Ping simulated: '+document.getElementById('net_host').value+' OK'">Ping</button><pre id="net_out"></pre>`, "networkTools");
        window.openJSONStudio = () => simpleWindow("JSON Studio", `<h3>JSON Studio</h3><textarea id="json_in" style="width:100%;height:160px;">{}</textarea><button onclick="try{document.getElementById('json_out').textContent=JSON.stringify(JSON.parse(document.getElementById('json_in').value),null,2)}catch(e){document.getElementById('json_out').textContent=e.message}">Format</button><pre id="json_out"></pre>`, "jsonStudio");
        window.openDeploymentCenter = () => simpleWindow("Deployment Center", `<h3>Deployment Center</h3><div class="inset-panel">Prepare TestOS builds for staging.</div><button onclick="notify('Deployment Center','Deployment checklist complete.',2500,'success')">Run Checklist</button>`, "deploymentCenter");
        window.openLicenseManager = () => simpleWindow("License Manager", `<h3>License Manager</h3><div class="inset-panel"><b>Active edition:</b> ${safeT4(localStorage.getItem('testos_edition_name') || 'TestOS Economy')}<br><b>Build:</b> TestOS 3.2.T.4</div>`, "licenseManager");

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

    function renderRemindersT4(){const arr=JSON.parse(localStorage.getItem('testos_reminders')||'[]');return arr.map((r,i)=>`<div class="file-row"><span>${safeT4(r)}</span><button onclick="removeReminderT4(${i})">Remove</button></div>`).join('')||'<div class="inset-panel">No reminders yet.</div>';}

    function installRegistryT4() {
        try {
            if (window.TestOSRegistry?.set) {
                window.TestOSRegistry.set("HKEY_CURRENT_USER\\Software\\TestOS\\Explorer\\ApplicationFolders", "Enabled");
                window.TestOSRegistry.set("HKEY_CURRENT_USER\\Software\\TestOS\\Explorer\\DefaultEdition", "Economy");
                window.TestOSRegistry.set("HKEY_LOCAL_MACHINE\\System\\Build\\Version", "3.2.T.4");
                window.TestOSRegistry.set("HKEY_LOCAL_MACHINE\\System\\Policies\\EconomyEdition", "Enabled");
                window.TestOSRegistry.set("HKEY_LOCAL_MACHINE\\Software\\TestOS\\Applications\\StorageMode", "Folderized");
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
                result = "TestOS 3.2.T.4 Economy App Folders Build";
            } else if (command === "about") {
                result = "TestOS 3.2.T.4 adds Economy edition, application folders, extra apps, registry defaults, and Firebase desktop layout sync.";
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
                const reg = window.TestOSRegistry?.export?.() || {};
                result = Object.keys(reg).filter(k => k.toLowerCase().includes(q) || String(reg[k]).toLowerCase().includes(q)).map(k => `${safeT4(k)} = ${safeT4(reg[k])}`).join("<br>") || "No matching registry values.";
            } else if (command === "registry.roots" || command === "reg.roots") {
                result = "HKEY_CURRENT_USER<br>HKEY_LOCAL_MACHINE<br>HKEY_CLASSES_ROOT<br>HKEY_USERS<br>HKEY_CURRENT_CONFIG";
            } else if (command === "desktop.sync") {
                try { await saveUserSettings?.({ desktopPositions: getPositionsT4() }); result = "Desktop layout synced to Firebase."; } catch(err) { result = "Sync failed: " + safeT4(err.message || err); }
            } else if (command === "package.list") {
                result = ["testos-core", "app-folders", "economy-edition", "registry-service", "firebase-layout-sync", "developer-tools"].join("<br>");
            } else if (command === "package.info") {
                result = "Package: " + safeT4(parts[0] || "unknown") + "<br>Status: installed<br>Build: 3.2.T.4";
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

    window.TESTOS_APP_CATEGORIES = APP_CATEGORIES_T4;

    function initT4() {
        if (window.__testosT4Loaded) return;
        window.__testosT4Loaded = true;
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
        installContextMenuT4();
        renderDesktopT4();
        renderStartMenuT4();
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", () => setTimeout(initT4, 900));
    } else {
        setTimeout(initT4, 900);
    }
})();
