"use strict";

/* =========================
   STATE
========================= */

let zIndexCounter = 100;

let dragState = null;
let resizeState = null;

let fileSystem = {
    files: {},
    notes: {}
};

let currentFile = null;

/* =========================
   BOOT
========================= */

window.addEventListener("DOMContentLoaded", () => {
    initStartMenu();
    initClock();
    exposeLegacyAPI();

    loadSystem();
});

/* =========================
   START MENU
========================= */

function initStartMenu() {
    const menu = document.getElementById("start-menu");
    const btn = document.getElementById("start-btn");

    if (!menu || !btn) return;

    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.style.display = menu.style.display === "flex" ? "none" : "flex";
    });

    document.addEventListener("click", () => {
        menu.style.display = "none";
    });
}

/* =========================
   CLOCK
========================= */

function initClock() {
    const clock = document.getElementById("clock");
    if (!clock) return;

    const update = () => {
        const d = new Date();
        clock.textContent = d.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    update();
    setInterval(update, 1000);
}

/* =========================
   LOAD / SAVE (LOCAL ONLY HERE)
========================= */

function loadSystem() {
    try {
        const saved = JSON.parse(localStorage.getItem("fileSystem"));
        if (saved) fileSystem = saved;
    } catch {
        fileSystem = { files: {}, notes: {} };
    }
}

function saveSystem() {
    localStorage.setItem("fileSystem", JSON.stringify(fileSystem));
}

/* =========================
   WINDOW SYSTEM (DRAG + RESIZE)
========================= */

/* GLOBAL DRAG */
document.addEventListener("mousemove", (e) => {
    if (dragState) {
        const win = dragState.win;

        win.style.left = (e.clientX - dragState.offsetX) + "px";
        win.style.top = (e.clientY - dragState.offsetY) + "px";
    }

    /* GLOBAL RESIZE */
    if (resizeState) {
        const win = resizeState.win;

        const newWidth = e.clientX - resizeState.startX;
        const newHeight = e.clientY - resizeState.startY;

        win.style.width = Math.max(220, newWidth) + "px";
        win.style.height = Math.max(160, newHeight) + "px";
    }
});

document.addEventListener("mouseup", () => {
    dragState = null;
    resizeState = null;
});

/* =========================
   CORE WINDOW FUNCTION
========================= */

window.openWindow = function (title, contentHTML) {
    const container = document.getElementById("windows-container");

    const win = document.createElement("div");
    win.className = "window";

    win.style.position = "absolute";
    win.style.top = "80px";
    win.style.left = "80px";
    win.style.zIndex = ++zIndexCounter;

    win.innerHTML = `
        <div class="title-bar">
            <span>${title}</span>
            <button class="close-btn">X</button>
        </div>

        <div class="window-content">
            ${contentHTML}
        </div>

        <div class="resize-handle"></div>
    `;

    container.appendChild(win);

    const titlebar = win.querySelector(".title-bar");
    const closeBtn = win.querySelector(".close-btn");
    const resizeHandle = win.querySelector(".resize-handle");

    /* focus */
    win.addEventListener("mousedown", () => {
        win.style.zIndex = ++zIndexCounter;
    });

    /* close */
    closeBtn.onclick = () => win.remove();

    /* =========================
       DRAG
    ========================= */
    titlebar.addEventListener("mousedown", (e) => {
        dragState = {
            win,
            offsetX: e.clientX - win.offsetLeft,
            offsetY: e.clientY - win.offsetTop
        };

        win.style.zIndex = ++zIndexCounter;
    });

    /* =========================
       RESIZE (NEW)
    ========================= */
    resizeHandle.addEventListener("mousedown", (e) => {
        e.stopPropagation();

        resizeState = {
            win,
            startX: win.offsetLeft + win.offsetWidth,
            startY: win.offsetTop + win.offsetHeight
        };

        win.style.zIndex = ++zIndexCounter;
    });

    return win;
};

/* =========================
   FILE EXPLORER
========================= */

window.openFileExplorer = function () {
    openWindow("Files", renderFilesApp());
};

function renderFilesApp() {
    const files = fileSystem.files;

    return `
        <div style="padding:6px;">
            <button onclick="createFile()">New File</button>
            <button onclick="uploadFile()">Upload File</button>

            <hr>

            ${Object.keys(files).map(id => `
                <div style="display:flex;justify-content:space-between;padding:4px;border-bottom:1px solid #ddd;">
                    <span>${files[id].name}</span>

                    <div>
                        <button onclick="openFile('${id}')">Open</button>
                        <button onclick="deleteFile('${id}')">Delete</button>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}

/* =========================
   FILE ACTIONS
========================= */

window.createFile = function () {
    const id = "file_" + Date.now();

    fileSystem.files[id] = {
        name: "New File",
        content: ""
    };

    saveSystem();
    refresh();
};

window.openFile = function (id) {
    const file = fileSystem.files[id];
    if (!file) return;

    openWindow(
        file.name,
        `
        <div style="display:flex;flex-direction:column;height:100%;">
            <textarea id="file_${id}" style="flex:1;width:100%;">${file.content || ""}</textarea>
            <button onclick="saveFile('${id}')">Save</button>
        </div>
        `
    );
};

window.saveFile = function (id) {
    const el = document.getElementById(`file_${id}`);
    if (!el) return;

    fileSystem.files[id].content = el.value;
    saveSystem();
};

window.deleteFile = function (id) {
    delete fileSystem.files[id];
    refresh();
};

/* =========================
   FILE UPLOAD
========================= */

window.uploadFile = function () {
    const input = document.createElement("input");
    input.type = "file";

    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = () => {
            const id = "file_" + Date.now();

            fileSystem.files[id] = {
                name: file.name,
                content: reader.result
            };

            saveSystem();
            refresh();
        };

        reader.readAsText(file);
    };

    input.click();
};

/* =========================
   NOTES / OTHER APPS
========================= */

window.openNotes = function () {
    openWindow("Notes", "<p>Notes app placeholder</p>");
};

window.openAppStore = function () {
    openWindow("App Store", "<p>App Store placeholder</p>");
};

/* =========================
   REFRESH WINDOWS
========================= */

function refresh() {
    document.querySelectorAll(".window").forEach(w => w.remove());
}

/* =========================
   LEGACY
========================= */

function exposeLegacyAPI() {
    window.launchApp = openWindow;
}
