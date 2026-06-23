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

/* window state tracking */
const windowState = new Map(); 
// id -> { minimized, maximized, rect }

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
        fileSystem.files = {};
    }

    rerenderOpenApps();
}

/* =========================
   RERENDER APPS
========================= */

function rerenderOpenApps() {
    const windows = document.querySelectorAll(".window[data-app]");

    windows.forEach(win => {
        const app = win.dataset.app;
        const content = win.querySelector(".window-content");

        if (!content) return;

        if (app === "files") content.innerHTML = renderFileExplorer();
        if (app === "notes") content.innerHTML = renderNotes();
        if (app === "docs") content.innerHTML = renderDocs();
    });
}

/* =========================
   WINDOW SYSTEM
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
   CREATE WINDOW (FIXED)
========================= */

window.openWindow = function (title, html, app = "") {
    const container = document.getElementById("windows-container");
    if (!container) return;

    const id = crypto.randomUUID();

    const win = document.createElement("div");
    win.className = "window";
    win.dataset.app = app;
    win.dataset.id = id;

    win.style.left = "80px";
    win.style.top = "80px";
    win.style.zIndex = ++zIndexCounter;

    windowState.set(id, {
        minimized: false,
        maximized: false,
        rect: null
    });

    win.innerHTML = `
        <div class="title-bar">
            <span>${title}</span>
            <div style="display:flex;gap:4px;">
                <button onclick="minimizeWindow('${id}')">_</button>
                <button onclick="maximizeWindow('${id}')">□</button>
                <button class="close-btn" onclick="closeWindow('${id}')">X</button>
            </div>
        </div>

        <div class="window-content">${html}</div>

        <div class="resize-handle"></div>
    `;

    container.appendChild(win);

    const titleBar = win.querySelector(".title-bar");
    const resizeHandle = win.querySelector(".resize-handle");

    win.onmousedown = () => win.style.zIndex = ++zIndexCounter;

    titleBar.onmousedown = (e) => {
        dragState = {
            win,
            offsetX: e.clientX - win.offsetLeft,
            offsetY: e.clientY - win.offsetTop
        };
    };

    resizeHandle.onmousedown = (e) => {
        e.preventDefault();
        const rect = win.getBoundingClientRect();

        resizeState = {
            win,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: rect.width,
            startHeight: rect.height
        };
    };

    addTaskbarItem(id, title);

    return win;
};

/* =========================
   WINDOW CONTROLS
========================= */

window.closeWindow = function (id) {
    document.querySelector(`.window[data-id="${id}"]`)?.remove();
    removeTaskbarItem(id);
};

window.minimizeWindow = function (id) {
    const win = document.querySelector(`.window[data-id="${id}"]`);
    if (!win) return;

    win.style.display = "none";
    windowState.get(id).minimized = true;
};

window.maximizeWindow = function (id) {
    const win = document.querySelector(`.window[data-id="${id}"]`);
    if (!win) return;

    const state = windowState.get(id);

    if (!state.maximized) {
        state.rect = win.getBoundingClientRect();

        win.style.left = "0";
        win.style.top = "0";
        win.style.width = "100%";
        win.style.height = "calc(100% - 40px)";

        state.maximized = true;
    } else {
        win.style.left = state.rect.left + "px";
        win.style.top = state.rect.top + "px";
        win.style.width = state.rect.width + "px";
        win.style.height = state.rect.height + "px";

        state.maximized = false;
    }
};

window.restoreWindow = function (id) {
    const win = document.querySelector(`.window[data-id="${id}"]`);
    if (!win) return;

    win.style.display = "flex";
    win.style.zIndex = ++zIndexCounter;
    windowState.get(id).minimized = false;
};

/* =========================
   TASKBAR
========================= */

function addTaskbarItem(id, title) {
    const bar = document.getElementById("taskbar-apps");
    if (!bar) return;

    const btn = document.createElement("button");
    btn.textContent = title;
    btn.dataset.id = id;

    btn.onclick = () => restoreWindow(id);

    bar.appendChild(btn);
}

function removeTaskbarItem(id) {
    document.querySelector(`#taskbar-apps button[data-id="${id}"]`)?.remove();
}

/* =========================
   SYSTEM CONTROLS
========================= */

window.clearWindows = function () {
    document.querySelectorAll(".window").forEach(w => w.remove());
};

window.restartOS = function () {
    location.reload();
};

window.logoutUser = function () {
    localStorage.clear();
    location.href = "index.html";
};

/* =========================
   BRIGHTNESS / VOLUME
========================= */

window.setBrightness = function (v) {
    let o = document.getElementById("brightness");
    if (!o) {
        o = document.createElement("div");
        o.id = "brightness";
        o.style = "position:fixed;inset:0;background:black;pointer-events:none;z-index:99999";
        document.body.appendChild(o);
    }
    o.style.opacity = (100 - v) / 100;
};

window.setVolume = function (v) {
    document.querySelectorAll("audio,video").forEach(el => el.volume = v);
};

/* =========================
   FILE EXPLORER
========================= */

window.openFileExplorer = function () {
    openWindow("Files", renderFileExplorer(), "files");
};

function renderFileExplorer() {
    return `
        <div>
            <button onclick="createFile()">New File</button>
            <button onclick="uploadFile()">Upload</button>
            <hr>
            ${Object.entries(fileSystem.files).map(([id, f]) => `
                <div>
                    ${f.name}
                    <button onclick="openFile('${id}')">Open</button>
                    <button onclick="renameFile('${id}')">Rename</button>
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

/* =========================
   OPEN FILE
========================= */

window.openFile = function (id) {
    const file = fileSystem.files[id];
    if (!file) return;

    openWindow(file.name, `<pre>${file.content || ""}</pre>`, "files");
};

/* =========================
   NOTES (.note SYSTEM)
========================= */

window.openNotes = function () {
    openWindow("Notes", renderNotes(), "notes");
};

function renderNotes() {
    return `
        <button onclick="createNote()">New Note</button>
        <hr>
        ${Object.entries(fileSystem.files)
            .filter(([_, f]) => f.name.endsWith(".note"))
            .map(([id, f]) => `
                <div onclick="loadNote('${id}')">${f.name}</div>
            `).join("")}

        <hr>
        <input id="note_title">
        <textarea id="note_body"></textarea>
        <button onclick="saveNote()">Save</button>
    `;
}

window.createNote = async () => {
    await cloudCreateFile("New.note", "");
    await loadSystem();
};

window.saveNote = async () => {
    if (!activeNoteId) return;

    const name = document.getElementById("note_title").value;
    const body = document.getElementById("note_body").value;

    await cloudSaveFile(activeNoteId, {
        name: name.endsWith(".note") ? name : name + ".note",
        content: body
    });

    await loadSystem();
};

/* =========================
   DOCS (.doc SYSTEM)
========================= */

window.openDocs = function () {
    openWindow("Docs", renderDocs(), "docs");
};

function renderDocs() {
    return `
        <button onclick="createDoc()">New Doc</button>
        <hr>

        ${Object.entries(fileSystem.files)
            .filter(([_, f]) => f.name.endsWith(".doc"))
            .map(([id, f]) => `
                <div onclick="loadDoc('${id}')">${f.name}</div>
            `).join("")}

        <hr>

        <input id="doc_title">
        <div contenteditable id="doc_editor"></div>

        <button onclick="saveDoc()">Save</button>
    `;
}

window.createDoc = async () => {
    await cloudCreateFile("New.doc", "");
    await loadSystem();
};

window.saveDoc = async () => {
    if (!activeDocId) return;

    const name = document.getElementById("doc_title").value;
    const body = document.getElementById("doc_editor").innerHTML;

    await cloudSaveFile(activeDocId, {
        name: name.endsWith(".doc") ? name : name + ".doc",
        content: body
    });

    await loadSystem();
};

/* =========================
   LEGACY
========================= */

function exposeAPI() {
    window.launchApp = openWindow;
}
