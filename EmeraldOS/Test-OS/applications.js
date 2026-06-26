"use strict";

import {
    createFile as cloudCreateFile,
    saveFile as cloudSaveFile,
    deleteFile as cloudDeleteFile
} from "./cloudstorage.js";

/* ========================================
   FILE STATE
======================================== */

window.recycleBin = window.recycleBin || {};
window.currentFolder = "desktop";

/* ========================================
   FILE EXPLORER
======================================== */

window.openFileExplorer = function(folder = "desktop") {
    currentFolder = folder;

    openWindow(
        "File Explorer",
        renderFileExplorer(folder),
        "files"
    );
};

function renderFileExplorer(folder) {

    const files = Object.entries(fileSystem.files)
        .filter(([id, file]) => {
            return (file.parent || "desktop") === folder;
        });

    return `
        <div class="toolbar">
            <button onclick="createNewFile()">New File</button>
            <button onclick="createFolder()">New Folder</button>
            <button onclick="uploadFile()">Upload</button>
        </div>

        <hr>

        ${files.map(([id,file]) => `
            <div class="file-row">

                <span onclick="
                    ${file.type === "folder"
                        ? `openFolder('${id}')`
                        : `openFile('${id}')`}
                ">

                    ${getFileIcon(file)}
                    ${file.name}

                </span>

                <div>

                    <button onclick="showProperties('${id}')">
                        Properties
                    </button>

                    <button onclick="renameFile('${id}')">
                        Rename
                    </button>

                    <button onclick="deleteFile('${id}')">
                        Delete
                    </button>

                </div>

            </div>
        `).join("")}
    `;
}

/* ========================================
   ICONS
======================================== */

function getFileIcon(file) {

    if (file.type === "folder")
        return "📁";

    if (file.type === "image")
        return "🖼️";

    if (file.type === "video")
        return "🎥";

    if (file.type === "audio")
        return "🎵";

    return "📄";
}

/* ========================================
   NEW FILE
======================================== */

window.createNewFile = async function() {

    await cloudCreateFile(
        "New File.txt",
        ""
    );

    await loadSystem();

    notify("File created.");
};

/* ========================================
   NEW FOLDER
======================================== */

window.createFolder = async function() {

    const name = prompt("Folder name:");

    if (!name)
        return;

    const id = "folder_" + Date.now();

    await cloudSaveFile(id, {
        name,
        type: "folder",
        parent: currentFolder,
        createdAt: Date.now()
    });

    await loadSystem();

    notify("Folder created.");
};

/* ========================================
   OPEN FOLDER
======================================== */

window.openFolder = function(id) {

    const folder = fileSystem.files[id];

    if (!folder)
        return;

    openFileExplorer(id);
};

/* ========================================
   OPEN FILE
======================================== */

window.openFile = function(id) {

    const file = fileSystem.files[id];

    if (!file)
        return;

    if (file.type === "folder") {
        openFolder(id);
        return;
    }

    let html = "";

    if (file.content?.startsWith("data:image")) {

        html = `
            <img
                src="${file.content}"
                style="max-width:100%">
        `;

    } else if (file.content?.startsWith("data:video")) {

        html = `
            <video controls style="width:100%">
                <source src="${file.content}">
            </video>
        `;

    } else {

        html = `
            <textarea
                id="edit_${id}"
                style="
                    width:100%;
                    height:90%;
                "
            >${file.content || ""}</textarea>

            <button onclick="saveOpenFile('${id}')">
                Save
            </button>
        `;
    }

    openWindow(
        file.name,
        html,
        "file"
    );
};

/* ========================================
   SAVE FILE
======================================== */

window.saveOpenFile = async function(id) {

    const editor = document.getElementById(
        `edit_${id}`
    );

    if (!editor)
        return;

    await cloudSaveFile(id, {
        content: editor.value,
        updatedAt: Date.now()
    });

    fileSystem.files[id].content =
        editor.value;

    notify("Saved.");
};

/* ========================================
   RENAME
======================================== */

window.renameFile = async function(id) {

    const file = fileSystem.files[id];

    if (!file)
        return;

    const name = prompt(
        "Rename file:",
        file.name
    );

    if (!name)
        return;

    await cloudSaveFile(id, {
        name
    });

    file.name = name;

    await loadSystem();

    notify("Renamed.");
};

/* ========================================
   DELETE
======================================== */

window.deleteFile = async function(id) {

    const file = fileSystem.files[id];

    if (!file)
        return;

    recycleBin[id] = file;

    await cloudDeleteFile(id);

    delete fileSystem.files[id];

    await loadSystem();

    notify("Moved to recycle bin.");
};

/* ========================================
   RESTORE
======================================== */

window.restoreFile = async function(id) {

    const file = recycleBin[id];

    if (!file)
        return;

    await cloudSaveFile(id, file);

    delete recycleBin[id];

    await loadSystem();

    notify("File restored.");
};

/* ========================================
   PROPERTIES
======================================== */

window.showProperties = function(id) {

    const file = fileSystem.files[id];

    if (!file)
        return;

    openWindow(
        "Properties",
        `
        <b>Name:</b> ${file.name}<br><br>

        <b>Type:</b>
        ${file.type || "text"}<br><br>

        <b>Created:</b><br>
        ${
            file.createdAt
            ? new Date(file.createdAt)
                .toLocaleString()
            : "Unknown"
        }

        <br><br>

        <b>Updated:</b><br>

        ${
            file.updatedAt
            ? new Date(file.updatedAt)
                .toLocaleString()
            : "Never"
        }

        <br><br>

        <b>Parent:</b>
        ${file.parent || "desktop"}
        `
    );
};

/* ========================================
   DOWNLOAD
======================================== */

window.downloadFile = function(id) {

    const file = fileSystem.files[id];

    if (!file)
        return;

    const blob = new Blob(
        [file.content || ""]
    );

    const a = document.createElement("a");

    a.href = URL.createObjectURL(blob);

    a.download = file.name;

    a.click();
};

/* ========================================
   UPLOAD
======================================== */

window.uploadFile = function() {

    const input =
        document.createElement("input");

    input.type = "file";

    input.onchange = async e => {

        const file =
            e.target.files[0];

        if (!file)
            return;

        const reader =
            new FileReader();

        reader.onload = async () => {

            const id =
                await cloudCreateFile(
                    file.name,
                    reader.result
                );

            await cloudSaveFile(id, {
                parent: currentFolder
            });

            await loadSystem();

            notify("Upload complete.");
        };

        reader.readAsDataURL(file);
    };

    input.click();
};

/* ========================================
   DESKTOP FILES
======================================== */

window.renderDesktopFiles = function() {

    const desktop =
        document.getElementById("desktop");

    if (!desktop)
        return;

    Object.entries(fileSystem.files)
        .forEach(([id,file]) => {

            if (
                (file.parent || "desktop")
                !== "desktop"
            )
                return;

            const icon =
                document.createElement("div");

            icon.className = "icon";

            icon.innerHTML = `
                ${getFileIcon(file)}
                <br>
                ${file.name}
            `;

            icon.ondblclick = () => {

                if (
                    file.type === "folder"
                ) {
                    openFolder(id);
                } else {
                    openFile(id);
                }
            };

            desktop.appendChild(icon);
        });
};

/* ========================================
   RECYCLE BIN WINDOW
======================================== */

window.openRecycleBin = function() {

    openWindow(
        "Recycle Bin",
        `
        ${Object.entries(recycleBin)
            .map(([id,file]) => `
                <div class="file-row">

                    ${file.name}

                    <button onclick="
                        restoreFile('${id}')
                    ">
                        Restore
                    </button>

                </div>
            `).join("")}
        `,
        "recycle"
    );
};

/* ==========================================
   CALENDAR
========================================== */

let selectedDate = null;

window.openCalendar = function () {
    openWindow(
        "Calendar",
        renderCalendar(),
        "calendar"
    );
};

function renderCalendar() {
    const today = new Date().toISOString().split("T")[0];

    return `
        <div style="padding:10px">

            <h3>Calendar</h3>

            <input id="calendarDate"
                   type="date"
                   value="${today}">

            <br><br>

            <textarea
                id="calendarText"
                style="width:100%;height:150px"
                placeholder="Enter notes for this date"></textarea>

            <br><br>

            <button onclick="saveCalendarEntry()">
                Save Entry
            </button>

        </div>
    `;
}

window.saveCalendarEntry = async function () {

    const date =
        document.getElementById("calendarDate").value;

    const text =
        document.getElementById("calendarText").value;

    await cloudCreateFile(
        "Calendar " + date,
        text
    );

    notify(
        "Calendar",
        "Entry saved."
    );

    loadSystem();
};

/* ==========================================
   CALCULATOR
========================================== */

let calcInput = "";

window.openCalculator = function () {
    openWindow(
        "Calculator",
        renderCalculator(),
        "calculator"
    );
};

function renderCalculator() {

    const buttons = [
        "7","8","9","/",
        "4","5","6","*",
        "1","2","3","-",
        "0",".","=","+"
    ];

    return `
        <div style="padding:10px">

            <input
                id="calcDisplay"
                class="calc-display"
                readonly>

            <div class="calc-grid">

                ${buttons.map(btn => `
                    <button onclick="calcPress('${btn}')">
                        ${btn}
                    </button>
                `).join("")}

            </div>

            <br>

            <button onclick="clearCalc()">
                Clear
            </button>

        </div>
    `;
}

window.calcPress = function (value) {

    if (value === "=") {

        try {
            calcInput =
                Function(
                    "return " + calcInput
                )().toString();

        } catch {

            calcInput = "Error";
        }

    } else {

        calcInput += value;
    }

    const display =
        document.getElementById("calcDisplay");

    if (display) {
        display.value = calcInput;
    }
};

window.clearCalc = function () {

    calcInput = "";

    const display =
        document.getElementById("calcDisplay");

    if (display) {
        display.value = "";
    }
};

/* ==========================================
   CLOCK APP
========================================== */

let stopwatchInterval = null;
let stopwatchSeconds = 0;

window.openClockApp = function () {

    openWindow(
        "Clock",
        renderClock(),
        "clock"
    );

    updateClockApp();
};

function renderClock() {

    return `
        <div style="padding:10px">

            <h3 id="liveClock"></h3>

            <hr>

            <h3>Stopwatch</h3>

            <div id="stopwatchDisplay">
                0:00
            </div>

            <br>

            <button onclick="startStopwatch()">
                Start
            </button>

            <button onclick="pauseStopwatch()">
                Pause
            </button>

            <button onclick="resetStopwatch()">
                Reset
            </button>

        </div>
    `;
}

function updateClockApp() {

    const clock =
        document.getElementById("liveClock");

    if (clock) {

        clock.textContent =
            new Date().toLocaleTimeString();
    }

    requestAnimationFrame(updateClockApp);
}

window.startStopwatch = function () {

    if (stopwatchInterval) return;

    stopwatchInterval = setInterval(() => {

        stopwatchSeconds++;

        const m =
            Math.floor(stopwatchSeconds / 60);

        const s =
            stopwatchSeconds % 60;

        const display =
            document.getElementById(
                "stopwatchDisplay"
            );

        if (display) {

            display.textContent =
                `${m}:${s.toString().padStart(2,"0")}`;
        }

    }, 1000);
};

window.pauseStopwatch = function () {

    clearInterval(stopwatchInterval);

    stopwatchInterval = null;
};

window.resetStopwatch = function () {

    pauseStopwatch();

    stopwatchSeconds = 0;

    const display =
        document.getElementById(
            "stopwatchDisplay"
        );

    if (display) {
        display.textContent = "0:00";
    }
};


/* ==========================================
   BROWSER
========================================== */

window.openBrowser = function () {

    openWindow(
        "Browser",
        `
        <div style="display:flex;height:100%;flex-direction:column">

            <div style="padding:5px">

                <input
                    id="browserURL"
                    style="width:80%"
                    placeholder="https://">

                <button onclick="browserGo()">
                    Go
                </button>

            </div>

            <iframe
                id="browserFrame"
                style="flex:1;border:none">
            </iframe>

        </div>
        `,
        "browser"
    );
};

window.browserGo = function () {

    const url =
        document.getElementById(
            "browserURL"
        ).value;

    const frame =
        document.getElementById(
            "browserFrame"
        );

    if (!frame) return;

    frame.src = url;
};

/* ==========================================
   APP STORE
========================================== */

window.openAppStore = function () {

    openWindow(
        "App Store",
        `
        <div style="padding:10px">

            <h2>Emerald Store</h2>

            <p>
                Additional applications for
                EmeraldOS 3.2.
            </p>

            <hr>

            <button onclick="installPaint()">
                Install Paint
            </button>

            <br><br>

            <button onclick="installTerminal()">
                Install Terminal
            </button>

        </div>
        `,
        "store"
    );
};

window.installPaint = function () {

    notify(
        "App Store",
        "Paint installed."
    );
};

window.installTerminal = function () {

    notify(
        "App Store",
        "Terminal installed."
    );
};

/* ==========================================
   SYSTEM PANEL
========================================== */

window.openSystemApp = function () {

    openWindow(
        "System Control Panel",
        renderSystemPanel(),
        "system"
    );
};

function renderSystemPanel() {

    return `
    <div style="padding:10px">

        <h3>User</h3>

        <div>
            ${localStorage.getItem("OSusername") || "Guest"}
        </div>

        <hr>

        <h3>Theme</h3>

        <select id="themeSelect">
            <option value="classic">Classic</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="midnight">Midnight</option>
        </select>

        <button onclick="applyTheme()">
            Apply
        </button>

        <hr>

        <h3>Desktop</h3>

        <button onclick="toggleDesktopIcons()">
            Toggle Icons
        </button>

        <br><br>

        <button onclick="clearDesktopShortcuts()">
            Remove Shortcuts
        </button>

        <hr>

        <h3>Session</h3>

        <button onclick="restartOS()">
            Restart
        </button>

        <button onclick="logoutUser()">
            Logout
        </button>

    </div>
    `;
}

/* ==========================================
   THEMES
========================================== */

window.applyTheme = function () {

    const theme =
        document.getElementById(
            "themeSelect"
        ).value;

    document.body.dataset.theme = theme;

    localStorage.setItem(
        "os_theme",
        theme
    );

    notify(
        "Theme",
        theme + " enabled."
    );
};

function loadTheme() {

    const theme =
        localStorage.getItem(
            "os_theme"
        ) || "classic";

    document.body.dataset.theme = theme;
}

/* ==========================================
   LOGOUT
========================================== */

window.logoutUser = function () {

    localStorage.removeItem(
        "OSusername"
    );

    localStorage.removeItem(
        "os_session"
    );

    location.href = "index.html";
};

/* ==========================================
   RESTART
========================================== */

window.restartOS = function () {

    location.reload();
};

/* ==========================================
   DESKTOP SHORTCUTS
========================================== */

let desktopShortcuts =
    JSON.parse(
        localStorage.getItem(
            "desktopShortcuts"
        ) || "[]"
    );

window.addDesktopShortcut = function (
    title,
    callback
) {

    desktopShortcuts.push({
        title,
        callback
    });

    localStorage.setItem(
        "desktopShortcuts",
        JSON.stringify(
            desktopShortcuts
        )
    );

    renderDesktopShortcuts();
};

function renderDesktopShortcuts() {

    desktopShortcuts.forEach(item => {

        const icon =
            document.createElement("div");

        icon.className = "icon";

        icon.innerHTML =
            "📄<br>" + item.title;

        icon.onclick = () => {

            if (
                window[item.callback]
            ) {
                window[item.callback]();
            }
        };

        document
            .getElementById(
                "desktop"
            )
            .appendChild(icon);
    });
}

window.clearDesktopShortcuts =
function () {

    desktopShortcuts = [];

    localStorage.removeItem(
        "desktopShortcuts"
    );

    location.reload();
};

/* ==========================================
   ICON VISIBILITY
========================================== */

let iconsVisible = true;

window.toggleDesktopIcons =
function () {

    iconsVisible =
        !iconsVisible;

    document
        .querySelectorAll(
            ".icon"
        )
        .forEach(icon => {

            icon.style.display =
                iconsVisible
                ? ""
                : "none";
        });
};

/* ==========================================
   MINIMIZE WINDOWS
========================================== */

window.minimizeWindow =
function (win) {

    win.style.display = "none";

    notify(
        "Window Minimized",
        win.dataset.title ||
        "Application"
    );
};

window.restoreWindow =
function (win) {

    win.style.display = "flex";

    bringToFront(win);
};

/* ==========================================
   MAXIMIZE
========================================== */

window.maximizeWindow =
function (win) {

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

        return;
    }

    win.dataset.left =
        win.style.left;

    win.dataset.top =
        win.style.top;

    win.dataset.width =
        win.style.width;

    win.dataset.height =
        win.style.height;

    win.style.left = "0px";
    win.style.top = "0px";
    win.style.width = "100%";
    win.style.height =
        "calc(100% - 40px)";

    win.dataset.maximized =
        "true";
};

/* ==========================================
   TASKBAR FLASH
========================================== */

window.flashTaskbar =
function (title) {

    const buttons =
        document.querySelectorAll(
            ".task-btn"
        );

    buttons.forEach(btn => {

        if (
            btn.textContent === title
        ) {

            btn.classList.add(
                "active"
            );

            setTimeout(() => {

                btn.classList.remove(
                    "active"
                );

            }, 1000);
        }
    });
};

/* ==========================================
   DESKTOP FILES
========================================== */

window.pinFileToDesktop =
function (id) {

    const file =
        fileSystem.files[id];

    if (!file) return;

    const icon =
        document.createElement("div");

    icon.className = "icon";

    icon.innerHTML =
        "📄<br>" +
        file.name;

    icon.onclick =
        () => openFile(id);

    document
        .getElementById(
            "desktop"
        )
        .appendChild(icon);

    notify(
        "Desktop",
        file.name +
        " pinned."
    );
};

/* ==========================================
   DRAG FILES TO DESKTOP
========================================== */

window.enableDesktopDrop =
function () {

    const desktop =
        document.getElementById(
            "desktop"
        );

    desktop.addEventListener(
        "dragover",
        e => {
            e.preventDefault();
        }
    );

    desktop.addEventListener(
        "drop",
        e => {

            e.preventDefault();

            const id =
                e.dataTransfer.getData(
                    "file"
                );

            if (id) {

                pinFileToDesktop(
                    id
                );
            }
        }
    );
};

/* ==========================================
   INITIALIZE
========================================== */

window.addEventListener(
    "DOMContentLoaded",
    () => {

        loadTheme();

        renderDesktopShortcuts();

        enableDesktopDrop();
    }
);

/* ==========================================
   FILE MANAGER STATE
========================================== */

let currentFolder = "root";
let clipboardFile = null;
let recycleBin = [];

/* ==========================================
   CREATE FOLDER
========================================== */

window.createFolder = async function () {

    const name =
        prompt("Folder name:");

    if (!name) return;

    await cloudCreateFile(
        name,
        ""
    );

    const files =
        await loadDrive();

    const newest =
        Object.keys(files).sort().pop();

    await cloudSaveFile(newest, {
        type: "folder",
        parent: currentFolder
    });

    loadSystem();

    notify(
        "Folder Created",
        name
    );
};

/* ==========================================
   OPEN FOLDER
========================================== */

window.openFolder = function (id) {

    currentFolder = id;

    rerenderOpenApps();
};

/* ==========================================
   GO BACK
========================================== */

window.folderBack = function () {

    currentFolder = "root";

    rerenderOpenApps();
};

/* ==========================================
   FILE SEARCH
========================================== */

window.searchFiles = function () {

    const query =
        document
            .getElementById(
                "fileSearch"
            )
            .value
            .toLowerCase();

    document
        .querySelectorAll(
            ".file-row"
        )
        .forEach(row => {

            row.style.display =
                row.dataset.name
                .includes(query)
                ? ""
                : "none";
        });
};

/* ==========================================
   FILE PROPERTIES
========================================== */

window.fileProperties =
function (id) {

    const file =
        fileSystem.files[id];

    if (!file) return;

    openWindow(
        "Properties",
        `
        <div style="padding:10px">

            <b>Name:</b>
            ${file.name}

            <br><br>

            <b>Type:</b>
            ${file.type || "file"}

            <br><br>

            <b>Created:</b>
            ${
                file.createdAt
                ? new Date(
                    file.createdAt
                  ).toLocaleString()
                : "Unknown"
            }

            <br><br>

            <b>Modified:</b>
            ${
                file.updatedAt
                ? new Date(
                    file.updatedAt
                  ).toLocaleString()
                : "Unknown"
            }

        </div>
        `
    );
};

/* ==========================================
   COPY FILE
========================================== */

window.copyFile =
function (id) {

    clipboardFile = id;

    notify(
        "Clipboard",
        "Copied."
    );
};

/* ==========================================
   PASTE FILE
========================================== */

window.pasteFile =
async function () {

    if (!clipboardFile)
        return;

    const source =
        fileSystem.files[
            clipboardFile
        ];

    if (!source)
        return;

    await cloudCreateFile(
        source.name +
        " Copy",
        source.content
    );

    loadSystem();

    notify(
        "Clipboard",
        "Pasted."
    );
};

/* ==========================================
   RECYCLE BIN
========================================== */

window.deleteFile =
async function (id) {

    const file =
        fileSystem.files[id];

    if (!file)
        return;

    recycleBin.push({
        id,
        file
    });

    await cloudDeleteFile(id);

    loadSystem();

    notify(
        "Recycle Bin",
        file.name
    );
};

window.openRecycleBin =
function () {

    openWindow(
        "Recycle Bin",

        `
        <div style="padding:10px">

            ${
                recycleBin.map(item => `
                <div>

                    ${item.file.name}

                    <button onclick="
                        restoreFile(
                            '${item.id}'
                        )
                    ">
                        Restore
                    </button>

                </div>
                `).join("")
            }

        </div>
        `
    );
};

window.restoreFile =
async function (id) {

    const item =
        recycleBin.find(
            r => r.id === id
        );

    if (!item)
        return;

    await cloudCreateFile(
        item.file.name,
        item.file.content
    );

    recycleBin =
        recycleBin.filter(
            r => r.id !== id
        );

    loadSystem();

    notify(
        "Recycle Bin",
        "Restored."
    );
};

/* ==========================================
   FILE EXPLORER UPGRADE
========================================== */

const oldRenderFiles =
    renderFileExplorer;

renderFileExplorer =
function () {

    const files =
        Object.entries(
            fileSystem.files
        ).filter(([id,file]) => {

            return (
                (file.parent || "root")
                === currentFolder
            );
        });

    return `
    <div style="padding:6px">

        <div style="
            display:flex;
            gap:4px;
            margin-bottom:6px;
        ">

            <button onclick="
                createFile()
            ">
                New File
            </button>

            <button onclick="
                createFolder()
            ">
                Folder
            </button>

            <button onclick="
                pasteFile()
            ">
                Paste
            </button>

            <button onclick="
                openRecycleBin()
            ">
                Bin
            </button>

            <button onclick="
                folderBack()
            ">
                Back
            </button>

        </div>

        <input
            id="fileSearch"
            placeholder="Search"
            oninput="searchFiles()"
            style="width:100%">

        <hr>

        ${
            files.map(
                ([id,file]) => `

            <div
                class="file-row"
                data-name="
                    ${file.name.toLowerCase()}
                "
                style="
                    display:flex;
                    justify-content:space-between;
                    padding:4px;
                    border-bottom:
                        1px solid #ccc;
                ">

                <span>

                ${
                    file.type ===
                    "folder"

                    ? "📁"

                    : "📄"
                }

                ${file.name}

                </span>

                <div>

                ${
                    file.type ===
                    "folder"

                    ?

                    `
                    <button onclick="
                        openFolder(
                        '${id}'
                        )
                    ">
                    Open
                    </button>
                    `

                    :

                    `
                    <button onclick="
                        openFile(
                        '${id}'
                        )
                    ">
                    Open
                    </button>
                    `
                }

                <button onclick="
                    copyFile(
                    '${id}'
                    )
                ">
                    Copy
                </button>

                <button onclick="
                    renameFile(
                    '${id}'
                    )
                ">
                    Rename
                </button>

                <button onclick="
                    fileProperties(
                    '${id}'
                    )
                ">
                    Info
                </button>

                <button onclick="
                    pinFileToDesktop(
                    '${id}'
                    )
                ">
                    Desktop
                </button>

                <button onclick="
                    deleteFile(
                    '${id}'
                    )
                ">
                    Delete
                </button>

                </div>

            </div>

            `
            ).join("")
        }

    </div>
    `;
};

/* ==========================================
   DESKTOP CONTEXT MENU
========================================== */

window.showDesktopMenu =
function (x, y) {

    const menu =
        document.getElementById(
            "context-menu"
        );

    if (!menu)
        return;

    menu.style.display =
        "block";

    menu.style.left =
        x + "px";

    menu.style.top =
        y + "px";

    menu.innerHTML = `
        <div onclick="
            createFile()
        ">
            New File
        </div>

        <div onclick="
            createFolder()
        ">
            New Folder
        </div>

        <div onclick="
            openFileExplorer()
        ">
            File Explorer
        </div>

        <div onclick="
            restartOS()
        ">
            Refresh
        </div>
    `;
};

document.addEventListener(
    "contextmenu",
    e => {

        if (
            e.target.id ===
            "desktop"
        ) {

            e.preventDefault();

            showDesktopMenu(
                e.pageX,
                e.pageY
            );
        }
    }
);

document.addEventListener(
    "click",
    () => {

        const menu =
            document.getElementById(
                "context-menu"
            );

        if (menu) {

            menu.style.display =
                "none";
        }
    }
);

/* ==========================================
   RECENT FILES
========================================== */

let recentFiles = JSON.parse(
    localStorage.getItem("recentFiles") || "[]"
);

function addRecentFile(id) {

    recentFiles = recentFiles.filter(
        f => f !== id
    );

    recentFiles.unshift(id);

    if (recentFiles.length > 10) {
        recentFiles.pop();
    }

    localStorage.setItem(
        "recentFiles",
        JSON.stringify(recentFiles)
    );
}

window.openRecentFiles = function () {

    let html = "<div style='padding:10px'>";

    recentFiles.forEach(id => {

        const file = fileSystem.files[id];

        if (!file) return;

        html += `
            <div style="padding:4px">
                📄 ${file.name}
                <button onclick="openFile('${id}')">
                    Open
                </button>
            </div>
        `;
    });

    html += "</div>";

    openWindow(
        "Recent Files",
        html
    );
};

/* ==========================================
   WALLPAPER MANAGER
========================================== */

window.setWallpaper = function (url) {

    document.body.style.backgroundImage =
        `url('${url}')`;

    document.body.style.backgroundSize =
        "cover";

    localStorage.setItem(
        "os_wallpaper",
        url
    );
};

function loadWallpaper() {

    const wall =
        localStorage.getItem(
            "os_wallpaper"
        );

    if (!wall) return;

    document.body.style.backgroundImage =
        `url('${wall}')`;

    document.body.style.backgroundSize =
        "cover";
}

window.openWallpaperManager =
function () {

    openWindow(
        "Wallpaper",

        `
        <div style="padding:10px">

            <input id="wallpaperURL"
                   placeholder="Image URL"
                   style="width:100%">

            <br><br>

            <button onclick="
                setWallpaper(
                    document.getElementById(
                        'wallpaperURL'
                    ).value
                )
            ">
                Apply
            </button>

        </div>
        `
    );
};

/* ==========================================
   TERMINAL
========================================== */

window.openTerminal = function () {

    openWindow(
        "Terminal",

        `
        <div style="
            background:black;
            color:lime;
            height:100%;
            padding:10px;
            font-family:monospace;
        ">

            <div id="terminalOutput">
                EmeraldOS Terminal<br><br>
            </div>

            <input
                id="terminalInput"
                style="
                    width:100%;
                    background:black;
                    color:lime;
                    border:none;
                "
                placeholder="Enter command"
                onkeydown="
                    if(event.key==='Enter')
                    runCommand()
                ">

        </div>
        `
    );
};

window.runCommand = function () {

    const input =
        document.getElementById(
            "terminalInput"
        );

    const output =
        document.getElementById(
            "terminalOutput"
        );

    const cmd =
        input.value.trim();

    let result = "";

    switch (cmd) {

        case "help":
            result =
                "help dir clear about";
            break;

        case "dir":
            result =
                Object.values(
                    fileSystem.files
                )
                .map(f => f.name)
                .join("<br>");
            break;

        case "clear":
            output.innerHTML = "";
            input.value = "";
            return;

        case "about":
            result =
                "EmeraldOS 3.2";
            break;

        default:
            result =
                "Unknown command";
    }

    output.innerHTML += `
        > ${cmd}<br>
        ${result}<br><br>
    `;

    input.value = "";
};

/* ==========================================
   PAINT APP
========================================== */

window.openPaint = function () {

    openWindow(
        "Paint",

        `
        <div style="padding:5px">

            <canvas
                id="paintCanvas"
                width="500"
                height="300"
                style="
                    border:1px solid black;
                    background:white;
                ">
            </canvas>

            <br><br>

            <button onclick="saveDrawing()">
                Save
            </button>

        </div>
        `
    );

    setTimeout(initPaint, 50);
};

function initPaint() {

    const canvas =
        document.getElementById(
            "paintCanvas"
        );

    if (!canvas) return;

    const ctx =
        canvas.getContext("2d");

    let drawing = false;

    canvas.onmousedown =
        () => drawing = true;

    canvas.onmouseup =
        () => drawing = false;

    canvas.onmousemove = e => {

        if (!drawing)
            return;

        const rect =
            canvas.getBoundingClientRect();

        ctx.fillRect(
            e.clientX - rect.left,
            e.clientY - rect.top,
            2,
            2
        );
    };
}

window.saveDrawing =
async function () {

    const canvas =
        document.getElementById(
            "paintCanvas"
        );

    const image =
        canvas.toDataURL();

    await cloudCreateFile(
        "Drawing.png",
        image
    );

    loadSystem();

    notify(
        "Paint",
        "Drawing saved."
    );
};

/* ==========================================
   WINDOW SNAP
========================================== */

window.snapLeft = function (win) {

    win.style.left = "0px";
    win.style.top = "0px";
    win.style.width = "50%";
    win.style.height =
        "calc(100% - 40px)";
};

window.snapRight = function (win) {

    win.style.left = "50%";
    win.style.top = "0px";
    win.style.width = "50%";
    win.style.height =
        "calc(100% - 40px)";
};

/* ==========================================
   SESSION RESTORE
========================================== */

window.saveSession = function () {

    const apps = [];

    document
        .querySelectorAll(".window")
        .forEach(win => {

            apps.push(
                win.dataset.app
            );
        });

    localStorage.setItem(
        "os_session_restore",
        JSON.stringify(apps)
    );
};

window.restoreSession =
function () {

    const saved =
        JSON.parse(
            localStorage.getItem(
                "os_session_restore"
            ) || "[]"
        );

    saved.forEach(app => {

        if (
            typeof window[
                "open" +
                app.charAt(0)
                    .toUpperCase() +
                app.slice(1)
            ] === "function"
        ) {

            window[
                "open" +
                app.charAt(0)
                    .toUpperCase() +
                app.slice(1)
            ]();
        }
    });
};

/* ==========================================
   STARTUP APPS
========================================== */

let startupApps = JSON.parse(
    localStorage.getItem(
        "startupApps"
    ) || "[]"
);

window.addStartupApp =
function (app) {

    startupApps.push(app);

    localStorage.setItem(
        "startupApps",
        JSON.stringify(
            startupApps
        )
    );
};

function launchStartupApps() {

    startupApps.forEach(app => {

        if (
            typeof window[app]
            === "function"
        ) {

            window[app]();
        }
    });
}

/* ==========================================
   KEYBOARD SHORTCUTS
========================================== */

document.addEventListener(
    "keydown",
    e => {

        if (e.ctrlKey &&
            e.key === "e") {

            e.preventDefault();

            openFileExplorer();
        }

        if (e.ctrlKey &&
            e.key === "n") {

            e.preventDefault();

            openNotes();
        }

        if (e.ctrlKey &&
            e.key === "t") {

            e.preventDefault();

            openTerminal();
        }
    }
);

/* ==========================================
   BOOKMARKS
========================================== */

let bookmarks = JSON.parse(
    localStorage.getItem(
        "browserBookmarks"
    ) || "[]"
);

window.addBookmark =
function (url) {

    bookmarks.push(url);

    localStorage.setItem(
        "browserBookmarks",
        JSON.stringify(bookmarks)
    );

    notify(
        "Browser",
        "Bookmark saved."
    );
};

window.openBookmarks =
function () {

    let html =
        "<div style='padding:10px'>";

    bookmarks.forEach(url => {

        html += `
            <div>
                ${url}
            </div>
        `;
    });

    html += "</div>";

    openWindow(
        "Bookmarks",
        html
    );
};

/* ==========================================
   STARTUP
========================================== */

window.addEventListener(
    "DOMContentLoaded",
    () => {

        loadWallpaper();

        restoreSession();

        launchStartupApps();
    }
);

/* =========================================================
   PART 6
   SYSTEM PANEL
   THEMES
   NOTIFICATIONS
   DESKTOP FILES
   SESSION SAVE
========================================================= */

window.openSystemApp = function () {
    openWindow(
        "System Control Panel",
        renderSystemPanel(),
        "system"
    );
};



/* =========================================================
   THEMES
========================================================= */

window.applyTheme = function () {
    const theme =
        document.getElementById("themeSelect").value;

    document.body.dataset.theme = theme;

    localStorage.setItem(
        "os_theme",
        theme
    );

    notify("Theme changed to " + theme);
};

(function loadTheme() {
    const theme =
        localStorage.getItem("os_theme");

    if (theme) {
        document.body.dataset.theme = theme;
    }
})();

/* =========================================================
   DESKTOP FILES
========================================================= */

window.pinToDesktop = function (id) {
    let icons =
        JSON.parse(
            localStorage.getItem("desktopIcons")
            || "[]"
        );

    if (!icons.includes(id)) {
        icons.push(id);

        localStorage.setItem(
            "desktopIcons",
            JSON.stringify(icons)
        );

        refreshDesktop();

        notify("Added to desktop.");
    }
};

window.refreshDesktop = function () {
    if (window.renderDesktop) {
        renderDesktop();
    }
};

window.toggleDesktopIcons = function () {
    const desktop =
        document.getElementById("desktop");

    if (!desktop) return;

    desktop.style.visibility =
        desktop.style.visibility === "hidden"
        ? "visible"
        : "hidden";
};

/* =========================================================
   WINDOW UTILITIES
========================================================= */

window.clearWindows = function () {
    document
        .querySelectorAll(".window")
        .forEach(w => w.remove());

    document.getElementById(
        "taskbar-apps"
    ).innerHTML = "";
};

window.cascadeWindows = function () {

    let x = 40;
    let y = 40;

    document.querySelectorAll(".window")
        .forEach(win => {

            win.style.left = x + "px";
            win.style.top = y + "px";

            x += 30;
            y += 30;
        });
};

window.tileWindows = function () {

    const windows =
        document.querySelectorAll(".window");

    const width =
        window.innerWidth / 2;

    const height =
        (window.innerHeight - 40) / 2;

    windows.forEach((win, i) => {

        const col = i % 2;
        const row = Math.floor(i / 2);

        win.style.left =
            (col * width) + "px";

        win.style.top =
            (row * height) + "px";

        win.style.width =
            width + "px";

        win.style.height =
            height + "px";
    });
};

/* =========================================================
   SESSION SAVE
========================================================= */

window.saveSession = function () {

    const windows = [];

    document.querySelectorAll(".window")
        .forEach(win => {

            windows.push({
                title:
                    win.querySelector(
                        ".title-text"
                    )?.textContent,

                left: win.style.left,
                top: win.style.top,
                width: win.style.width,
                height: win.style.height
            });
        });

    localStorage.setItem(
        "emerald_session",
        JSON.stringify(windows)
    );

    notify("Session saved.");
};

window.restoreSession = function () {

    const data =
        localStorage.getItem(
            "emerald_session"
        );

    if (!data) return;

    const windows =
        JSON.parse(data);

    windows.forEach(w => {

        openWindow(
            w.title,
            `<div style="padding:20px">
                Restored window:
                ${w.title}
            </div>`
        );
    });

};

/* =========================================================
   LOGOUT
========================================================= */

window.logoutUser = function () {

    localStorage.removeItem(
        "OSusername"
    );

    localStorage.removeItem(
        "os_session"
    );

    location.href = "index.html";
};

window.restartOS = function () {
    location.reload();
};

/* =========================================================
   START MENU SEARCH
========================================================= */

window.searchApps = function (text) {

    const results =
        document.getElementById(
            "start-results"
        );

    if (!results) return;

    text = text.toLowerCase();

    const apps = [
        "Notes",
        "Files",
        "Calendar",
        "Calculator",
        "Clock",
        "Docs",
        "Browser",
        "System"
    ];

    results.innerHTML = "";

    apps.forEach(app => {

        if (app.toLowerCase().includes(text)) {

            const div =
                document.createElement("div");

            div.className =
                "start-item";

            div.textContent = app;

            results.appendChild(div);
        }
    });
};

document.addEventListener(
    "input",
    e => {

        if (
            e.target.id ===
            "start-search"
        ) {
            searchApps(
                e.target.value
            );
        }
    }
);

/* =========================================================
   APPLICATIONS COMPLETE
========================================================= */
