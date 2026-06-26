"use strict";

/* =========================================================
   EMERALDOS 3.2
   PART 1
   BOOT + REGISTRY + DESKTOP
======================================================== */

import {
    loadDrive,
    createFile as cloudCreateFile,
    saveFile as cloudSaveFile,
    deleteFile as cloudDeleteFile,
    ensureUser
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
    localStorage.getItem("emerald_theme")
    || "classic";

/* =========================================================
   APPLICATION REGISTRY
========================================================= */

const APPS = {

    files: {
        name: "Files",
        icon: "📁",
        launch: () => openFileExplorer()
    },

    notes: {
        name: "Notes",
        icon: "📄",
        launch: () => openNotes()
    },

    docs: {
        name: "Docs",
        icon: "📘",
        launch: () => openDocs()
    },

    calendar: {
        name: "Calendar",
        icon: "📅",
        launch: () => openCalendar()
    },

    calculator: {
        name: "Calculator",
        icon: "🧮",
        launch: () => openCalculator()
    },

    clock: {
        name: "Clock",
        icon: "⏰",
        launch: () => openClockApp()
    },

    terminal: {
        name: "Terminal",
        icon: "⌨️",
        launch: () => openTerminal()
    },

    system: {
        name: "System",
        icon: "💻",
        launch: () => openSystemApp()
    },

    chat: {
        name: "Chat",
        icon: "💬",
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

       chat: {
        name: "Mediaplayer",
        icon: "📀",
        launch: () => {
            openWindow(
                "Mediaplayer",
                `<iframe
                    src="https://securly-plans.github.io/EmeraldOS/mediaplayer.html"
                    style="width:100%;height:100%;border:none">
                 </iframe>`,
                "Mediaplayer"
            );
        }
    },

    games: {
        name: "Games",
        icon: "🌐",
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

    Object.entries(APPS).forEach(([id, app]) => {

        const icon =
            document.createElement("div");

        icon.className = "icon";

        icon.innerHTML = `
            ${app.icon}<br>
            ${app.name}
        `;

        icon.onclick = app.launch;

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

    results.innerHTML = "";

    Object.values(APPS).forEach(app => {

        const item =
            document.createElement("div");

        item.className = "start-item";

        item.innerHTML =
            `${app.icon} ${app.name}`;

        item.onclick = () => {

            app.launch();

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
        "emerald_theme",
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
        "OSusername"
    );

    localStorage.removeItem(
        "os_session"
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
        "emerald_session",
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
            "emerald_session"
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
========================================================= */

function popupNotification(
    title,
    message
) {

    const box =
        document.createElement(
            "div"
        );

    box.className =
        "popup-notification";

    box.innerHTML = `

        <b>${title}</b><br>
        ${message}

    `;

    document.body.appendChild(
        box
    );

    setTimeout(() => {

        box.remove();

    }, 4000);

}

const originalNotify =
    window.notify;

window.notify =
    function (
        title,
        message
    ) {

        originalNotify(
            title,
            message
        );

        popupNotification(
            title,
            message
        );

    };

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
            "emerald_wallpaper"
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
            "emerald_wallpaper",
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
            "emerald_startup"
        ) || "[]"
    );

    startup.forEach(app => {

        if (
            APPS[app]
        ) {

            APPS[app]
                .launch();

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
                    "emerald_startup"
                ) || "[]"
            );

        if (
            !list.includes(app)
        ) {

            list.push(app);

        }

        localStorage.setItem(
            "emerald_startup",
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
        "emerald_recent"
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
        "emerald_recent",
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
        "emerald_theme"
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
        "emerald_theme",
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
            "emerald_apps"
        ) || "[]"
    );

let wallpaper =
    localStorage.getItem(
        "emerald_wallpaper"
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
        "emerald_wallpaper",
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
        "emerald_wallpaper",
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
        "emerald_apps",
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
        "emerald_apps",
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
