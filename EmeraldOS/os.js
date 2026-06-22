"use strict";

/* =========================
   CLOUD IMPORTS
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

let dragState = null;
let resizeState = null;

let fileSystem = { files: {} };

let windowStates = {}; // NEW WINDOW SYSTEM

/* =========================
   BOOT
========================= */

window.addEventListener("DOMContentLoaded", async () => {
    initStartMenu();
    initClock();
    await loadSystem();
});

/* =========================
   START MENU
========================= */

function initStartMenu() {
    const menu = document.getElementById("start-menu");
    const btn = document.getElementById("start-btn");

    btn.onclick = () => menu.classList.toggle("show");

    document.addEventListener("click", (e) => {
        if (!e.target.closest("#start-btn")) {
            menu.classList.remove("show");
        }
    });
}

/* =========================
   CLOCK
========================= */

function initClock() {
    const clock = document.getElementById("clock");

    const tick = () => {
        clock.textContent = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    tick();
    setInterval(tick, 1000);
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
   CORE WINDOW SYSTEM (WIN95)
========================= */

window.openWindow = function (title, html) {
    const id = "win_" + Date.now();

    const win = document.createElement("div");
    win.className = "window";
    win.dataset.id = id;

    win.style.left = "100px";
    win.style.top = "100px";
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

    /* TASKBAR BUTTON */
    const taskBtn = document.createElement("div");
    taskBtn.className = "taskbar-app";
    taskBtn.innerText = title;

    taskBtn.onclick = () => restoreWindow(id);

    document.getElementById("taskbar-apps").appendChild(taskBtn);

    windowStates[id] = {
        win,
        taskBtn,
        maximized: false,
        minimized: false,
        normal: {}
    };

    enableDrag(win);
    enableResize(win);

    return win;
};

/* =========================
   MINIMIZE
========================= */

window.minimizeWindow = function (id) {
    const w = windowStates[id];
    if (!w) return;

    w.win.style.display = "none";
    w.minimized = true;
};

/* =========================
   RESTORE (TASKBAR CLICK)
========================= */

window.restoreWindow = function (id) {
    const w = windowStates[id];
    if (!w) return;

    w.win.style.display = "block";
    w.win.style.zIndex = ++zIndexCounter;
    w.minimized = false;
};

/* =========================
   MAXIMIZE / RESTORE
========================= */

window.maximizeWindow = function (id) {
    const w = windowStates[id];
    if (!w) return;

    const win = w.win;

    if (!w.maximized) {
        w.normal = {
            width: win.style.width,
            height: win.style.height,
            left: win.style.left,
            top: win.style.top
        };

        win.style.left = "0";
        win.style.top = "0";
        win.style.width = "100%";
        win.style.height = "calc(100% - 40px)";

        w.maximized = true;
    } else {
        win.style.width = w.normal.width;
        win.style.height = w.normal.height;
        win.style.left = w.normal.left;
        win.style.top = w.normal.top;

        w.maximized = false;
    }
};

/* =========================
   CLOSE
========================= */

window.closeWindow = function (id) {
    const w = windowStates[id];
    if (!w) return;

    w.win.remove();
    w.taskBtn.remove();

    delete windowStates[id];
};

/* =========================
   DRAG
========================= */

function enableDrag(win) {
    const bar = win.querySelector(".title-bar");

    bar.onmousedown = (e) => {
        dragState = {
            win,
            offsetX: e.clientX - win.offsetLeft,
            offsetY: e.clientY - win.offsetTop
        };

        win.style.zIndex = ++zIndexCounter;
    };
}

document.addEventListener("mousemove", (e) => {
    if (dragState) {
        dragState.win.style.left =
            (e.clientX - dragState.offsetX) + "px";

        dragState.win.style.top =
            (e.clientY - dragState.offsetY) + "px";
    }

    if (resizeState) {
        const w = resizeState.win;

        w.style.width =
            Math.max(220, resizeState.startWidth + (e.clientX - resizeState.startX)) + "px";

        w.style.height =
            Math.max(160, resizeState.startHeight + (e.clientY - resizeState.startY)) + "px";
    }
});

document.addEventListener("mouseup", () => {
    dragState = null;
    resizeState = null;
});

/* =========================
   RESIZE
========================= */

function enableResize(win) {
    const handle = win.querySelector(".resize-handle");

    handle.onmousedown = (e) => {
        const rect = win.getBoundingClientRect();

        resizeState = {
            win,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: rect.width,
            startHeight: rect.height
        };

        e.preventDefault();
    };
}

/* =========================
   APPS (EXAMPLE)
========================= */

window.openNotes = () =>
    openWindow("Notes", "<div>Notes App</div>");

window.openFileExplorer = () =>
    openWindow("Files", "<div>File Explorer</div>");

window.openCalculator = () =>
    openWindow("Calculator", "<div>Calculator</div>");

window.openClockApp = () =>
    openWindow("Clock", "<div>Clock App</div>");

window.openSystemApp = () =>
    openWindow("System", "<div>System Panel</div>");

window.openAppStore = () =>
    openWindow("App Store", "<div>Store</div>");

window.openDocs = () =>
    openWindow("Docs", "<div>Docs</div>");

window.openCalendar = () =>
    openWindow("Calendar", "<div>Calendar</div>");
