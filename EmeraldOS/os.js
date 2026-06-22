"use strict";

/* =========================
   CLOUD IMPORTS (UNCHANGED)
========================= */

import {
    loadDrive,
    createFile as cloudCreateFile,
    saveFile as cloudSaveFile,
    deleteFile as cloudDeleteFile
} from "./cloudstorage.js";

/* =========================
   STATE
========================= */

let zIndexCounter = 100;
let fileSystem = { files: {} };

let drag = null;
let resize = null;

let windows = {};

/* =========================
   BOOT
========================= */

window.addEventListener("DOMContentLoaded", async () => {
    initClock();
    await loadSystem();
});

/* =========================
   CLOCK
========================= */

function initClock() {
    const tick = () => {
        const el = document.getElementById("clock");
        if (el) el.textContent = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    setInterval(tick, 1000);
    tick();
}

/* =========================
   LOAD SYSTEM
========================= */

async function loadSystem() {
    try {
        fileSystem.files = await loadDrive() || {};
    } catch {
        fileSystem.files = {};
    }
}

/* =========================
   WINDOW SYSTEM (FIXED)
========================= */

window.openWindow = function (title, html) {
    const id = "win_" + Date.now();

    const win = document.createElement("div");
    win.className = "window";

    win.style.left = "80px";
    win.style.top = "80px";
    win.style.zIndex = ++zIndexCounter;

    win.innerHTML = `
        <div class="title-bar">
            <span>${title}</span>
            <div class="win-controls">
                <button onclick="minimizeWindow('${id}')">_</button>
                <button onclick="maximizeWindow('${id}')">▢</button>
                <button onclick="closeWindow('${id}')">X</button>
            </div>
        </div>

        <div class="window-content">${html}</div>
        <div class="resize-handle"></div>
    `;

    document.getElementById("windows-container").appendChild(win);

    const taskbarBtn = document.createElement("div");
    taskbarBtn.className = "taskbar-app";
    taskbarBtn.textContent = title;

    taskbarBtn.onclick = () => restoreWindow(id);

    document.getElementById("taskbar-apps").appendChild(taskbarBtn);

    windows[id] = {
        win,
        taskbarBtn,
        maximized: false,
        minimized: false,
        normal: {}
    };

    makeDrag(win);
    makeResize(win);

    return win;
};

/* =========================
   MINIMIZE
========================= */

window.minimizeWindow = function (id) {
    const w = windows[id];
    if (!w) return;

    w.win.style.display = "none";
    w.minimized = true;
};

/* =========================
   RESTORE
========================= */

window.restoreWindow = function (id) {
    const w = windows[id];
    if (!w) return;

    w.win.style.display = "block";
    w.win.style.zIndex = ++zIndexCounter;
    w.minimized = false;
};

/* =========================
   MAXIMIZE
========================= */

window.maximizeWindow = function (id) {
    const w = windows[id];
    if (!w) return;

    const win = w.win;

    if (!w.maximized) {
        w.normal = {
            left: win.style.left,
            top: win.style.top,
            width: win.style.width,
            height: win.style.height
        };

        win.style.left = "0";
        win.style.top = "0";
        win.style.width = "100%";
        win.style.height = "calc(100% - 40px)";

        w.maximized = true;
    } else {
        win.style.left = w.normal.left;
        win.style.top = w.normal.top;
        win.style.width = w.normal.width;
        win.style.height = w.normal.height;

        w.maximized = false;
    }
};

/* =========================
   CLOSE
========================= */

window.closeWindow = function (id) {
    const w = windows[id];
    if (!w) return;

    w.win.remove();
    w.taskbarBtn.remove();

    delete windows[id];
};

/* =========================
   DRAG
========================= */

function makeDrag(win) {
    const bar = win.querySelector(".title-bar");

    bar.onmousedown = (e) => {
        drag = {
            win,
            offsetX: e.clientX - win.offsetLeft,
            offsetY: e.clientY - win.offsetTop
        };
    };
}

document.addEventListener("mousemove", (e) => {
    if (drag) {
        drag.win.style.left = (e.clientX - drag.offsetX) + "px";
        drag.win.style.top = (e.clientY - drag.offsetY) + "px";
    }

    if (resize) {
        const w = resize.win;

        w.style.width =
            Math.max(220, resize.startW + (e.clientX - resize.startX)) + "px";

        w.style.height =
            Math.max(160, resize.startH + (e.clientY - resize.startY)) + "px";
    }
});

document.addEventListener("mouseup", () => {
    drag = null;
    resize = null;
});

/* =========================
   RESIZE
========================= */

function makeResize(win) {
    const handle = win.querySelector(".resize-handle");

    handle.onmousedown = (e) => {
        const rect = win.getBoundingClientRect();

        resize = {
            win,
            startX: e.clientX,
            startY: e.clientY,
            startW: rect.width,
            startH: rect.height
        };

        e.preventDefault();
    };
}

/* =========================
   APPS (ALL RESTORED)
========================= */

window.openNotes = () => openWindow("Notes", "<div>Notes App</div>");
window.openFileExplorer = () => openWindow("Files", "<div>Files</div>");
window.openAppStore = () => openWindow("App Store", "<div>Store</div>");
window.openDocs = () => openWindow("Docs", "<div>Docs</div>");
window.openCalendar = () => openWindow("Calendar", "<div>Calendar</div>");
window.openCalculator = () => openWindow("Calculator", "<div>Calc</div>");
window.openClockApp = () => openWindow("Clock", "<div>Clock</div>");
window.openSystemApp = () => openWindow("System", "<div>System</div>");
