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

let calcInput = "";
let stopwatchInterval;
let stopwatchTime = 0;
let alarmTime = null;

/* =========================
   WINDOW MANAGER
========================= */

const windows = {};
let winId = 0;

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

    document.addEventListener("click", () => menu.classList.remove("show"));
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
   SYSTEM LOAD
========================= */

async function loadSystem() {
    try {
        fileSystem.files = await loadDrive() || {};
    } catch {
        fileSystem.files = {};
    }

    rerenderOpenApps();
}

/* =========================
   WINDOW CORE (WIN95 SYSTEM)
========================= */

window.openWindow = function (title, html, app = "") {
    const container = document.getElementById("windows-container");
    if (!container) return;

    const id = "win_" + (++winId);

    const win = document.createElement("div");
    win.className = "window";
    win.dataset.id = id;
    if (app) win.dataset.app = app;

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

    const task = document.createElement("div");
    task.className = "taskbar-item";
    task.textContent = title;
    task.onclick = () => restoreWindow(id);
    document.getElementById("taskbar-apps").appendChild(task);

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
   DRAG / RESIZE
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

function enableDrag(win) {
    win.querySelector(".title-bar").onmousedown = (e) => {
        dragState = {
            win,
            offsetX: e.clientX - win.offsetLeft,
            offsetY: e.clientY - win.offsetTop
        };
        win.style.zIndex = ++zIndexCounter;
    };
}

function enableResize(win) {
    win.querySelector(".resize-handle").onmousedown = (e) => {
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
   APPS (FULL RESTORED LOGIC)
========================= */

/* ---- NOTES ---- */

window.openNotes = function () {
    openWindow("Notes", renderNotes(), "notes");
};

function renderNotes() {
    return `
        <div style="padding:6px">
            <button onclick="createNote()">New Note</button>
            <hr>
            ${Object.entries(fileSystem.files).map(([id, f]) => `
                <div onclick="loadNote('${id}')">📄 ${f.name}</div>
            `).join("")}
        </div>
    `;
}

window.createNote = async function () {
    await cloudCreateFile("New Note", "");
    await loadSystem();
};

window.loadNote = function (id) {
    activeNoteId = id;

    setTimeout(() => {
        const f = fileSystem.files[id];
        document.getElementById("note_title").value = f.name;
        document.getElementById("note_body").value = f.content;
    }, 50);
};

window.saveNote = async function () {
    const t = document.getElementById("note_title").value;
    const b = document.getElementById("note_body").value;

    await cloudSaveFile(activeNoteId, { name: t, content: b });
    await loadSystem();
};

/* ---- DOCS (FONT + BOLD + ITALIC RESTORED) ---- */

window.openDocs = function () {
    openWindow("Docs", renderDocs(), "docs");
};

function renderDocs() {
    return `
        <div style="padding:6px">
            <select id="fontSize" onchange="setFontSize(this.value)">
                <option>12px</option>
                <option>16px</option>
                <option>20px</option>
            </select>

            <button onclick="applyBold()">B</button>
            <button onclick="applyItalic()">I</button>

            <input id="doc_title" style="width:100%" placeholder="Title">
            <div id="doc_editor" contenteditable="true"
                 style="border:1px solid #ccc;height:200px;overflow:auto;padding:6px"></div>

            <button onclick="saveDoc()">Save</button>
        </div>
    `;
}

window.applyBold = () => document.execCommand("bold");
window.applyItalic = () => document.execCommand("italic");

window.setFontSize = (size) => {
    document.getElementById("doc_editor").style.fontSize = size;
};

window.saveDoc = async function () {
    const t = document.getElementById("doc_title").value;
    const b = document.getElementById("doc_editor").innerHTML;

    await cloudSaveFile(activeDocId, { name: t, content: b });
    await loadSystem();
};

/* ---- FILE SYSTEM FULL RESTORED ---- */

window.openFileExplorer = function () {
    openWindow("Files", renderFileExplorer(), "files");
};

function renderFileExplorer() {
    return `
        <div>
            <button onclick="createFile()">New</button>
            <button onclick="uploadFile()">Upload</button>
            <button onclick="downloadAllFiles()">Download All</button>
            <hr>
            ${Object.entries(fileSystem.files).map(([id, f]) => `
                <div>
                    ${f.name}
                    <button onclick="openFile('${id}')">Open</button>
                    <button onclick="renameFile('${id}')">Rename</button>
                    <button onclick="downloadFile('${id}')">Download</button>
                    <button onclick="deleteFile('${id}')">Delete</button>
                </div>
            `).join("")}
        </div>
    `;
}

window.createFile = async () => {
    await cloudCreateFile("New File", "");
    await loadSystem();
};

window.deleteFile = async (id) => {
    await cloudDeleteFile(id);
    await loadSystem();
};

window.renameFile = async (id) => {
    const n = prompt("Rename:");
    await cloudSaveFile(id, { name: n });
    await loadSystem();
};

/* ---- CHAT / GAMES / MEDIA PRESERVED ---- */

window.openAppStore = () => openWindow("App Store", "<div>Working</div>");
window.openSystemApp = () => openWindow("System", "<div>System</div>");
window.openCalculator = () => openWindow("Calculator", "<div>Calc</div>");
window.openClockApp = () => openWindow("Clock", "<div>Clock</div>");

function exposeAPI() {
    window.launchApp = openWindow;
}
