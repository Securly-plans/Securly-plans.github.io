// ==========================================
// EMERALD OS
// CORE SYSTEM
// ==========================================

let zIndexCounter = 100;
let activeDrag = null;

// ==========================================
// CLOCK
// ==========================================

function updateClock() {
    const clock = document.getElementById("clock");

    if (!clock) return;

    clock.textContent = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}

setInterval(updateClock, 1000);
window.addEventListener("DOMContentLoaded", updateClock);

// ==========================================
// START MENU
// ==========================================

const startBtn = document.getElementById("start-btn");
const startMenu = document.getElementById("start-menu");

if (startBtn && startMenu) {

    startBtn.addEventListener("click", e => {
        e.stopPropagation();

        startMenu.classList.toggle("show");

        if (startMenu.classList.contains("show")) {
            startBtn.style.borderColor = "#000 #fff #fff #000";
            startBtn.style.background = "#dfdfdf";
        } else {
            startBtn.style.borderColor = "#fff #000 #000 #fff";
            startBtn.style.background = "#c0c0c0";
        }
    });

    document.addEventListener("click", e => {
        if (
            startMenu.classList.contains("show") &&
            !startMenu.contains(e.target)
        ) {
            startMenu.classList.remove("show");

            startBtn.style.borderColor =
                "#fff #000 #000 #fff";

            startBtn.style.background = "#c0c0c0";
        }
    });
}

// ==========================================
// SAFE HTML ESCAPE
// ==========================================

function escapeHTML(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// ==========================================
// WINDOW MANAGEMENT
// ==========================================

function openWindow(title, contentHTML) {

    const container =
        document.getElementById("windows-container");

    const taskbarApps =
        document.getElementById("taskbar-apps");

    if (!container || !taskbarApps) return;

    const win = document.createElement("div");
    win.className = "window";

    win.style.zIndex = ++zIndexCounter;

    win.style.left =
        Math.floor(50 + Math.random() * 80) + "px";

    win.style.top =
        Math.floor(50 + Math.random() * 80) + "px";

    win.innerHTML = `
        <div class="title-bar">
            <span>${escapeHTML(title)}</span>
            <button class="close-btn">X</button>
        </div>
        <div class="window-content">
            ${contentHTML}
        </div>
    `;

    container.appendChild(win);

    // Taskbar

    const tab = document.createElement("div");
    tab.className = "taskbar-tab active";
    tab.textContent = title;

    taskbarApps.appendChild(tab);

    function activateWindow() {
        win.style.display = "flex";
        win.style.zIndex = ++zIndexCounter;

        document
            .querySelectorAll(".taskbar-tab")
            .forEach(t => t.classList.remove("active"));

        tab.classList.add("active");
    }

    tab.addEventListener("click", () => {

        if (win.style.display === "none") {
            activateWindow();
            return;
        }

        if (parseInt(win.style.zIndex) < zIndexCounter) {
            activateWindow();
            return;
        }

        win.style.display = "none";
        tab.classList.remove("active");
    });

    win.addEventListener("mousedown", activateWindow);

    win.querySelector(".close-btn")
        .addEventListener("click", () => {
            win.remove();
            tab.remove();
        });

    // Dragging

    const titleBar = win.querySelector(".title-bar");

    titleBar.addEventListener("mousedown", e => {

        activeDrag = {
            window: win,
            startX: e.clientX,
            startY: e.clientY,
            left: win.offsetLeft,
            top: win.offsetTop
        };

        activateWindow();
    });

    activateWindow();

    return win;
}

// ==========================================
// GLOBAL DRAG LISTENERS
// ==========================================

document.addEventListener("mousemove", e => {

    if (!activeDrag) return;

    const dx = e.clientX - activeDrag.startX;
    const dy = e.clientY - activeDrag.startY;

    activeDrag.window.style.left =
        activeDrag.left + dx + "px";

    activeDrag.window.style.top =
        activeDrag.top + dy + "px";
});

document.addEventListener("mouseup", () => {
    activeDrag = null;
});

// ==========================================
// FILE SYSTEM
// ==========================================

const FileSystem = {

    saveFile(filename, content) {

        filename = filename.trim();

        if (!filename) {
            alert("Please enter a filename.");
            return;
        }

        localStorage.setItem(
            "os_file_" + filename,
            content
        );

        alert(filename + " saved.");
    },

    readFile(filename) {
        return (
            localStorage.getItem(
                "os_file_" + filename
            ) || ""
        );
    },

    deleteFile(filename) {
        localStorage.removeItem(
            "os_file_" + filename
        );
    }
};

// ==========================================
// NOTES APP
// ==========================================

function openNotes(filename = "New_Note.txt") {

    const noteId =
        Math.random().toString(36).substring(2);

    const savedText =
        FileSystem.readFile(filename);

    const html = `
        <div style="
            padding:5px;
            background:#c0c0c0;
            display:flex;
            gap:5px;
            border-bottom:2px solid #000;
        ">
            <input
                id="fname-${noteId}"
                value="${escapeHTML(filename)}"
                style="flex:1;padding:4px;"
            >

            <button id="save-${noteId}">
                Save
            </button>
        </div>

        <textarea
            id="content-${noteId}"
            style="
                width:100%;
                height:calc(100% - 40px);
                resize:none;
                border:none;
                padding:6px;
                box-sizing:border-box;
            "
        >${escapeHTML(savedText)}</textarea>
    `;

    const win = openWindow("Notes", html);

    setTimeout(() => {

        const saveButton =
            document.getElementById(
                "save-" + noteId
            );

        if (!saveButton) return;

        saveButton.onclick = () => {

            const fname =
                document.getElementById(
                    "fname-" + noteId
                ).value;

            const content =
                document.getElementById(
                    "content-" + noteId
                ).value;

            FileSystem.saveFile(
                fname,
                content
            );

            renderFileExplorer();
        };

    }, 10);
}

// ==========================================
// APP CATALOG
// ==========================================

const appCatalog = [

    // =====================
    // CALCULATOR
    // =====================

    {
        name: "Calculator.EOSas",
        icon: "🧮",

        content: (() => {

            const id =
                Math.random().toString(36).substring(2);

            return `
                <div style="
                    display:flex;
                    flex-direction:column;
                    height:100%;
                    background:#ddd;
                    padding:5px;
                    gap:5px;
                ">

                    <input
                        id="calc-${id}"
                        readonly
                        style="
                            font-size:20px;
                            text-align:right;
                            padding:5px;
                            border:2px inset white;
                        "
                    >

                    <div style="
                        display:grid;
                        grid-template-columns:
                        repeat(4,1fr);
                        gap:4px;
                        flex:1;
                    ">

                        <button onclick="calcClear('${id}')">C</button>
                        <button onclick="calcPress('${id}','(')">(</button>
                        <button onclick="calcPress('${id}',')')">)</button>
                        <button onclick="calcPress('${id}','/')">÷</button>

                        <button onclick="calcPress('${id}','7')">7</button>
                        <button onclick="calcPress('${id}','8')">8</button>
                        <button onclick="calcPress('${id}','9')">9</button>
                        <button onclick="calcPress('${id}','*')">×</button>

                        <button onclick="calcPress('${id}','4')">4</button>
                        <button onclick="calcPress('${id}','5')">5</button>
                        <button onclick="calcPress('${id}','6')">6</button>
                        <button onclick="calcPress('${id}','-')">−</button>

                        <button onclick="calcPress('${id}','1')">1</button>
                        <button onclick="calcPress('${id}','2')">2</button>
                        <button onclick="calcPress('${id}','3')">3</button>
                        <button onclick="calcPress('${id}','+')">+</button>

                        <button
                            style="grid-column:span 2"
                            onclick="calcPress('${id}','0')"
                        >
                            0
                        </button>

                        <button onclick="calcPress('${id}','.')">.</button>

                        <button onclick="calcEquals('${id}')">
                            =
                        </button>

                    </div>
                </div>
            `;
        })()
    },

    // =====================
    // PAINT
    // =====================

    {
        name: "Paint.EOSas",
        icon: "🎨",

        content: (() => {

            const id =
                Math.random().toString(36).substring(2);

            return `
                <div style="
                    display:flex;
                    flex-direction:column;
                    height:100%;
                ">

                    <div style="
                        background:#c0c0c0;
                        padding:5px;
                        border-bottom:2px solid black;
                    ">
                        <button onclick="clearCanvas('${id}')">
                            Clear Canvas
                        </button>
                    </div>

                    <canvas
                        id="paint-${id}"
                        width="600"
                        height="400"
                        style="
                            flex:1;
                            background:white;
                            cursor:crosshair;
                        "
                    ></canvas>
                </div>
            `;
        })()
    },

    // =====================
    // EMERALD BROWSER
    // =====================

    {
        name: "Emerald.Aweb",
        icon: "🌐",

        content: `
            <iframe
                src="https://securly-plans.github.io"
                style="
                    width:100%;
                    height:100%;
                    border:none;
                ">
            </iframe>
        `
    }
];

// ==========================================
// CALCULATOR
// ==========================================

function calcPress(id, value) {

    const display =
        document.getElementById("calc-" + id);

    if (display) {
        display.value += value;
    }
}

function calcClear(id) {

    const display =
        document.getElementById("calc-" + id);

    if (display) {
        display.value = "";
    }
}

function calcEquals(id) {

    const display =
        document.getElementById("calc-" + id);

    if (!display) return;

    const expression =
        display.value;

    if (!/^[0-9+\-*/(). ]+$/.test(expression)) {
        display.value = "Error";
        return;
    }

    try {
        display.value =
            Function(
                `"use strict";
                 return (${expression})`
            )();
    }
    catch {
        display.value = "Error";
    }
}

// ==========================================
// PAINT SYSTEM
// ==========================================

const paintApps = {};

function initializePaint() {

    document.querySelectorAll("canvas[id^='paint-']")
        .forEach(canvas => {

            if (paintApps[canvas.id]) return;

            const ctx =
                canvas.getContext("2d");

            paintApps[canvas.id] = {
                drawing: false,
                ctx
            };

            canvas.addEventListener(
                "mousedown",
                e => {

                    const rect =
                        canvas.getBoundingClientRect();

                    const x =
                        e.clientX - rect.left;

                    const y =
                        e.clientY - rect.top;

                    paintApps[canvas.id]
                        .drawing = true;

                    ctx.beginPath();
                    ctx.moveTo(x, y);
                }
            );

            canvas.addEventListener(
                "mousemove",
                e => {

                    if (
                        !paintApps[canvas.id]
                        .drawing
                    ) return;

                    const rect =
                        canvas.getBoundingClientRect();

                    const x =
                        e.clientX - rect.left;

                    const y =
                        e.clientY - rect.top;

                    ctx.lineWidth = 3;
                    ctx.lineCap = "round";

                    ctx.lineTo(x, y);
                    ctx.stroke();
                }
            );

            canvas.addEventListener(
                "mouseup",
                () => {
                    paintApps[
                        canvas.id
                    ].drawing = false;
                }
            );

            canvas.addEventListener(
                "mouseleave",
                () => {
                    paintApps[
                        canvas.id
                    ].drawing = false;
                }
            );
        });
}

function clearCanvas(id) {

    const canvas =
        document.getElementById(
            "paint-" + id
        );

    if (!canvas) return;

    const ctx =
        canvas.getContext("2d");

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );
}

// ==========================================
// DESKTOP ICONS
// ==========================================

function renderDesktopApps() {

    const zone =
        document.getElementById(
            "installed-apps-zone"
        );

    if (!zone) return;

    zone.innerHTML = "";

    const installed =
        JSON.parse(
            localStorage.getItem(
                "os_installed_apps"
            ) || "[]"
        );

    installed.forEach(appName => {

        const app =
            appCatalog.find(
                a => a.name === appName
            );

        if (!app) return;

        const icon =
            document.createElement("div");

        icon.className = "icon";

        icon.innerHTML =
            `${app.icon}<br>${escapeHTML(app.name)}`;

        icon.onclick = () => {

            openWindow(
                app.name,
                typeof app.content === "function"
                    ? app.content()
                    : app.content
            );

            setTimeout(
                initializePaint,
                20
            );
        };

        zone.appendChild(icon);
    });
}

// ==========================================
// INSTALL APP
// ==========================================

function installApp(index) {

    const app = appCatalog[index];

    let installed =
        JSON.parse(
            localStorage.getItem(
                "os_installed_apps"
            ) || "[]"
        );

    if (
        !installed.includes(app.name)
    ) {

        installed.push(app.name);

        localStorage.setItem(
            "os_installed_apps",
            JSON.stringify(installed)
        );

        renderDesktopApps();

        const ui =
            document.getElementById(
                "app-store-ui"
            );

        if (ui) {
            ui.innerHTML =
                getAppStoreHTML();
        }
    }
}

function uninstallApp(index) {

    const app = appCatalog[index];

    let installed =
        JSON.parse(
            localStorage.getItem(
                "os_installed_apps"
            ) || "[]"
        );

    installed =
        installed.filter(
            a => a !== app.name
        );

    localStorage.setItem(
        "os_installed_apps",
        JSON.stringify(installed)
    );

    renderDesktopApps();

    const ui =
        document.getElementById(
            "app-store-ui"
        );

    if (ui) {
        ui.innerHTML =
            getAppStoreHTML();
    }
}

// ==========================================
// APP STORE UI
// ==========================================

function getAppStoreHTML() {

    const installed =
        JSON.parse(
            localStorage.getItem(
                "os_installed_apps"
            ) || "[]"
        );

    let html = `
        <div style="
            display:flex;
            flex-wrap:wrap;
            gap:15px;
            padding:15px;
        ">
    `;

    appCatalog.forEach((app, index) => {

        const installedApp =
            installed.includes(app.name);

        html += `
            <div style="
                width:150px;
                border:2px solid black;
                background:#e0e0e0;
                padding:10px;
                text-align:center;
            ">

                <div style="
                    font-size:40px;
                    margin-bottom:10px;
                ">
                    ${app.icon}
                </div>

                <div style="
                    font-weight:bold;
                    margin-bottom:10px;
                    word-break:break-word;
                ">
                    ${escapeHTML(app.name)}
                </div>

                ${
                    installedApp
                    ?
                    `<button
                        onclick="uninstallApp(${index})"
                        style="
                            color:red;
                            cursor:pointer;
                        ">
                        Uninstall
                    </button>`
                    :
                    `<button
                        onclick="installApp(${index})"
                        style="
                            cursor:pointer;
                        ">
                        Install
                    </button>`
                }

            </div>
        `;
    });

    html += "</div>";

    return html;
}

function openAppStore() {

    openWindow(
        "App Store",
        `<div id="app-store-ui">
            ${getAppStoreHTML()}
        </div>`
    );
}

// ==========================================
// FILE EXPLORER
// ==========================================

function getFilesList() {

    const files = [];

    for (
        let i = 0;
        i < localStorage.length;
        i++
    ) {

        const key =
            localStorage.key(i);

        if (
            key &&
            key.startsWith("os_file_")
        ) {
            files.push(
                key.replace(
                    "os_file_",
                    ""
                )
            );
        }
    }

    files.sort();

    return files;
}

function deleteFile(filename) {

    if (
        confirm(
            `Delete "${filename}"?`
        )
    ) {

        FileSystem.deleteFile(
            filename
        );

        renderFileExplorer();
    }
}

function renderFileExplorer() {

    const container =
        document.getElementById(
            "explorer-content"
        );

    if (!container) return;

    const files =
        getFilesList();

    if (files.length === 0) {

        container.innerHTML = `
            <div style="
                padding:20px;
                color:gray;
                font-style:italic;
            ">
                Folder is empty.
            </div>
        `;

        return;
    }

    let html = `
        <table style="
            width:100%;
            border-collapse:collapse;
        ">

        <tr style="
            background:#d0d0d0;
            border-bottom:2px solid gray;
        ">
            <th style="padding:5px;">
                Filename
            </th>

            <th style="
                width:90px;
                padding:5px;
            ">
                Actions
            </th>
        </tr>
    `;

    files.forEach(file => {

        const safe =
            escapeHTML(file);

        html += `
            <tr style="
                border-bottom:1px solid #ddd;
            ">

                <td style="
                    padding:5px;
                ">
                    <button
                        style="
                            border:none;
                            background:none;
                            color:blue;
                            cursor:pointer;
                            text-decoration:underline;
                        "
                        onclick="openNotes(
                            ${JSON.stringify(file)}
                        )"
                    >
                        📄 ${safe}
                    </button>
                </td>

                <td style="
                    text-align:center;
                ">
                    <button
                        style="
                            color:red;
                            cursor:pointer;
                        "
                        onclick="deleteFile(
                            ${JSON.stringify(file)}
                        )"
                    >
                        Delete
                    </button>
                </td>

            </tr>
        `;
    });

    html += "</table>";

    container.innerHTML = html;
}

function openFileExplorer() {

    openWindow(
        "File Explorer",
        `
        <div
            id="explorer-content"
            style="
                height:100%;
                overflow:auto;
                background:white;
            ">
        </div>
        `
    );

    setTimeout(
        renderFileExplorer,
        20
    );
}

// ==========================================
// DESKTOP SHORTCUTS
// ==========================================

function addDesktopIcon(
    icon,
    label,
    action
) {

    const desktop =
        document.getElementById(
            "desktop-icons"
        );

    if (!desktop) return;

    const item =
        document.createElement("div");

    item.className = "icon";

    item.innerHTML =
        `${icon}<br>${escapeHTML(label)}`;

    item.onclick = action;

    desktop.appendChild(item);
}

// ==========================================
// STARTUP
// ==========================================

window.addEventListener(
    "DOMContentLoaded",
    () => {

        renderDesktopApps();

        updateClock();

        // Optional built-in icons

        addDesktopIcon(
            "📁",
            "File Explorer",
            openFileExplorer
        );

        addDesktopIcon(
            "🛒",
            "App Store",
            openAppStore
        );

        addDesktopIcon(
            "📝",
            "Notes",
            () => openNotes()
        );
    }
);

// ==========================================
// EMERALD OS READY
// ==========================================

console.log(
    "Emerald OS initialized."
);
