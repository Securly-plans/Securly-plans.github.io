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
let activeNoteId = null;
let activeDocId = null;

/* =========================
   WINDOW MANAGER (NEW)
========================= */

const windows = {}; // id -> window state

let winIdCounter = 0;

/* =========================
   BOOT
========================= */

window.addEventListener("DOMContentLoaded", async () => {
    initStartMenu();
    initClock();
    exposeAPI();
    await loadSystem();
});

/* =========================
   START MENU
========================= */

function initStartMenu() {
    const menu = document.getElementById("start-menu");
    const btn = document.getElementById("start-btn");

    if (!menu || !btn) return;

    btn.onclick = (e) => {
        e.stopPropagation();
        menu.classList.toggle("show");
    };

    document.addEventListener("click", () => {
        menu.classList.remove("show");
    });
}

/* =========================
   CLOCK
========================= */

function initClock() {
    const clock = document.getElementById("clock");
    if (!clock) return;

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
    } catch (e) {
        console.warn("Drive load failed:", e);
        fileSystem.files = {};
    }

    rerenderOpenApps();
}

function rerenderOpenApps() {
    const windowsEls = document.querySelectorAll(".window[data-app]");

    windowsEls.forEach(win => {
        const app = win.getAttribute("data-app");

        const content = win.querySelector(".window-content");
        if (!content) return;

        if (app === "files") content.innerHTML = renderFileExplorer();
        if (app === "notes") content.innerHTML = renderNotes();
        if (app === "docs") content.innerHTML = renderDocs();
    });
}

/* =========================
   WINDOW SYSTEM (DRAG + RESIZE)
========================= */

document.addEventListener("mousemove", (e) => {
    if (dragState) {
        const w = dragState.win;
        w.style.left = (e.clientX - dragState.offsetX) + "px";
        w.style.top = (e.clientY - dragState.offsetY) + "px";
    }

    if (resizeState) {
        const w = resizeState.win;

        const dx = e.clientX - resizeState.startX;
        const dy = e.clientY - resizeState.startY;

        w.style.width = Math.max(220, resizeState.startWidth + dx) + "px";
        w.style.height = Math.max(160, resizeState.startHeight + dy) + "px";
    }
});

document.addEventListener("mouseup", () => {
    dragState = null;
    resizeState = null;
});

/* =========================
   CORE WINDOW (REPLACED)
========================= */

window.openWindow = function (title, html, app = "") {
    const container = document.getElementById("windows-container");
    if (!container) return;

    const id = "win_" + (++winIdCounter);

    const win = document.createElement("div");
    win.className = "window";
    win.dataset.id = id;

    if (app) win.setAttribute("data-app", app);

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

    container.appendChild(win);

    const taskbar = document.getElementById("taskbar-apps");

    const task = document.createElement("div");
    task.className = "taskbar-item";
    task.textContent = title;
    task.onclick = () => restoreWindow(id);
    taskbar.appendChild(task);

    windows[id] = {
        win,
        task,
        minimized: false,
        maximized: false,
        last: {}
    };

    enableDrag(win);
    enableResize(win);

    return win;
};

/* =========================
   WINDOW CONTROLS
========================= */

window.minimizeWindow = function (id) {
    const w = windows[id];
    if (!w) return;

    w.win.style.display = "none";
    w.minimized = true;
};

window.restoreWindow = function (id) {
    const w = windows[id];
    if (!w) return;

    w.win.style.display = "block";
    w.win.style.zIndex = ++zIndexCounter;
    w.minimized = false;
};

window.maximizeWindow = function (id) {
    const w = windows[id];
    if (!w) return;

    const win = w.win;

    if (!w.maximized) {
        w.last = {
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
        win.style.left = w.last.left;
        win.style.top = w.last.top;
        win.style.width = w.last.width;
        win.style.height = w.last.height;

        w.maximized = false;
    }
};

window.closeWindow = function (id) {
    const w = windows[id];
    if (!w) return;

    w.win.remove();
    w.task.remove();

    delete windows[id];
};

/* =========================
   DRAG + RESIZE HELPERS
========================= */

function enableDrag(win) {
    const titleBar = win.querySelector(".title-bar");

    titleBar.onmousedown = (e) => {
        const id = win.dataset.id;

        dragState = {
            win,
            offsetX: e.clientX - win.offsetLeft,
            offsetY: e.clientY - win.offsetTop
        };

        win.style.zIndex = ++zIndexCounter;
    };
}

function enableResize(win) {
    const handle = win.querySelector(".resize-handle");

    handle.onmousedown = (e) => {
        e.preventDefault();

        resizeState = {
            win,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: win.offsetWidth,
            startHeight: win.offsetHeight
        };
    };
}

/* =========================
   ALL YOUR ORIGINAL APPS (UNCHANGED LOGIC)
========================= */

/* ---- FILE EXPLORER ---- */

window.openFileExplorer = function () {
    openWindow("Files", renderFileExplorer(), "files");
};

function renderFileExplorer() {
    const files = fileSystem.files;

    return `
        <div style="padding:6px;">
            <button onclick="createFile()">New File</button>
            <button onclick="uploadFile()">Upload</button>
            <button onclick="downloadAllFiles()">Download All</button>
            <hr>

            ${Object.entries(files).map(([id, f]) => `
                <div style="display:flex;justify-content:space-between;padding:4px;">
                    <span>${f.name}</span>
                    <div>
                        <button onclick="openFile('${id}')">Open</button>
                        <button onclick="renameFile('${id}')">Rename</button>
                        <button onclick="downloadFile('${id}')">Download</button>
                        <button onclick="deleteFile('${id}')">Delete</button>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}

/* ---- NOTES ---- */

window.openNotes = function () {
    openWindow("Notes", renderNotes(), "notes");
};

function renderNotes() {
    return `
        <div style="padding:6px">
            <button onclick="createNote()">+ New Note</button>
            <hr>
            ${Object.entries(fileSystem.files)
                .map(([id, f]) => `
                    <div onclick="loadNote('${id}')">📄 ${f.name}</div>
                `).join("")}
        </div>
    `;
}

/* ---- DOCS ---- */

window.openDocs = function () {
    openWindow("Docs", renderDocs(), "docs");
};

function renderDocs() {
    return `
        <div style="padding:6px">
            <button onclick="createDoc()">New Doc</button>
        </div>
    `;
}

/* ---- CALCULATOR ---- */

window.openCalculator = function () {
    openWindow("Calculator", `<div>Calculator Working</div>`, "calc");
};

/* ---- CLOCK ---- */

window.openClockApp = function () {
    openWindow("Clock", `<div>Clock Suite</div>`, "clock");
};

/* ---- SYSTEM ---- */

window.openSystemApp = function () {
    openWindow("System", `<div>System Panel</div>`, "system");
};

/* ---- APP STORE ---- */

window.openAppStore = function () {
    openWindow("App Store", "<div>Working ✔</div>");
};

/* ---- LEGACY ---- */

function exposeAPI() {
    window.launchApp = openWindow;
}
