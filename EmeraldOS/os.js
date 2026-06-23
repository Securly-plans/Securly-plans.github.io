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

let windows = {}; // window registry (IMPORTANT FIX)
let taskbar = {};

let activeNoteId = null;
let activeDocId = null;

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

    setInterval(() => {
        clock.textContent = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    }, 1000);
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

    rerenderOpenApps();
}

/* =========================
   WINDOW MANAGER FIX
========================= */

window.openWindow = function (title, html, app = "") {
    const container = document.getElementById("windows-container");

    const win = document.createElement("div");
    win.className = "window";
    win.dataset.app = app;
    win.dataset.title = title;

    const id = crypto.randomUUID();
    win.dataset.id = id;

    win.style.left = "80px";
    win.style.top = "80px";
    win.style.zIndex = ++zIndexCounter;

    win.innerHTML = `
        <div class="title-bar">
            <span>${title}</span>

            <div style="display:flex;gap:4px;">
                <button onclick="minimizeWindow('${id}')">_</button>
                <button onclick="maximizeWindow('${id}')">⬜</button>
                <button class="close-btn" onclick="closeWindow('${id}')">X</button>
            </div>
        </div>

        <div class="window-content">${html}</div>
        <div class="resize-handle"></div>
    `;

    container.appendChild(win);

    windows[id] = {
        el: win,
        minimized: false,
        maximized: false,
        prev: {}
    };

    enableDragResize(win);
    createTaskbarButton(id, title);

    return win;
};

/* =========================
   TASKBAR FIX
========================= */

function createTaskbarButton(id, title) {
    const bar = document.getElementById("taskbar-apps");

    const btn = document.createElement("button");
    btn.textContent = title;

    btn.onclick = () => toggleWindow(id);

    bar.appendChild(btn);

    taskbar[id] = btn;
}

/* =========================
   WINDOW CONTROLS
========================= */

window.closeWindow = function (id) {
    windows[id]?.el.remove();
    taskbar[id]?.remove();

    delete windows[id];
    delete taskbar[id];
};

window.minimizeWindow = function (id) {
    const w = windows[id];
    if (!w) return;

    w.el.style.display = "none";
    w.minimized = true;
};

window.maximizeWindow = function (id) {
    const w = windows[id];
    if (!w) return;

    const el = w.el;

    if (!w.maximized) {
        w.prev = {
            left: el.style.left,
            top: el.style.top,
            width: el.style.width,
            height: el.style.height
        };

        el.style.left = "0";
        el.style.top = "0";
        el.style.width = "100%";
        el.style.height = "calc(100% - 40px)";

        w.maximized = true;
    } else {
        Object.assign(el.style, w.prev);
        w.maximized = false;
    }
};

function toggleWindow(id) {
    const w = windows[id];
    if (!w) return;

    if (w.el.style.display === "none") {
        w.el.style.display = "flex";
        w.minimized = false;
    } else {
        minimizeWindow(id);
    }
}

/* =========================
   DRAG + RESIZE
========================= */

function enableDragResize(win) {
    const titleBar = win.querySelector(".title-bar");
    const resize = win.querySelector(".resize-handle");

    titleBar.onmousedown = (e) => {
        dragState = {
            win,
            offsetX: e.clientX - win.offsetLeft,
            offsetY: e.clientY - win.offsetTop
        };
    };

    resize.onmousedown = (e) => {
        resizeState = {
            win,
            startX: e.clientX,
            startY: e.clientY,
            width: win.offsetWidth,
            height: win.offsetHeight
        };
    };
}

document.addEventListener("mousemove", (e) => {
    if (dragState) {
        dragState.win.style.left = (e.clientX - dragState.offsetX) + "px";
        dragState.win.style.top = (e.clientY - dragState.offsetY) + "px";
    }

    if (resizeState) {
        resizeState.win.style.width =
            Math.max(220, resizeState.width + (e.clientX - resizeState.startX)) + "px";

        resizeState.win.style.height =
            Math.max(160, resizeState.height + (e.clientY - resizeState.startY)) + "px";
    }
});

document.addEventListener("mouseup", () => {
    dragState = null;
    resizeState = null;
});

/* =========================
   NOTES (.NOTE FIXED)
========================= */

window.openNotes = function () {
    openWindow("Notes", `
        <div class="split">
            <div class="sidebar">
                ${Object.entries(fileSystem.files)
                    .filter(([_, f]) => f.name?.endsWith(".note"))
                    .map(([id, f]) =>
                        `<div onclick="loadNote('${id}')">${f.name}</div>`
                    ).join("")}
            </div>

            <div class="main">
                <input id="note_title">
                <textarea id="note_body" style="flex:1"></textarea>
                <button onclick="saveNote()">Save</button>
            </div>
        </div>
    `, "notes");
};

window.createNote = async function () {
    await cloudCreateFile("New.note", "");
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
    const title = document.getElementById("note_title").value + ".note";
    const body = document.getElementById("note_body").value;

    await cloudSaveFile(activeNoteId, {
        name: title,
        content: body
    });

    await loadSystem();
};

/* =========================
   DOCS (.DOC + FONT TOOLBAR FIX)
========================= */

window.openDocs = function () {
    openWindow("Docs", `
        <div>
            <select id="font">
                <option>Arial</option>
                <option>Tahoma</option>
                <option>Times New Roman</option>
            </select>

            <button onclick="document.execCommand('bold')">B</button>
            <button onclick="document.execCommand('italic')">I</button>

            <input id="doc_title">
            <div id="doc_editor" contenteditable="true" style="height:200px;border:1px solid #aaa"></div>
            <button onclick="saveDoc()">Save</button>
        </div>
    `, "docs");
};

window.saveDoc = async function () {
    const title = document.getElementById("doc_title").value + ".doc";
    const body = document.getElementById("doc_editor").innerHTML;

    await cloudSaveFile(activeDocId, {
        name: title,
        content: body
    });

    await loadSystem();
};

/* =========================
   FILE EXPLORER FIX
========================= */

window.openFileExplorer = function () {
    openWindow("Files", `
        ${Object.entries(fileSystem.files).map(([id, f]) => `
            <div>
                ${f.name}
                <button onclick="openFile('${id}')">Open</button>
                <button onclick="deleteFile('${id}')">Delete</button>
                <button onclick="downloadFile('${id}')">Download</button>
            </div>
        `).join("")}
    `, "files");
};

/* =========================
   FILE OPEN FIX
========================= */

window.openFile = function (id) {
    const f = fileSystem.files[id];

    openWindow(f.name, `
        <pre>${f.content}</pre>
    `);
};

/* =========================
   SYSTEM (FIXED FULL)
========================= */

window.openSystemApp = function () {
    openWindow("System", `
        <div>
            <div>User: ${localStorage.getItem("username") || "Guest"}</div>

            <button onclick="clearWindows()">Close All</button>
            <button onclick="location.reload()">Restart</button>
        </div>
    `);
};

window.clearWindows = function () {
    Object.values(windows).forEach(w => w.el.remove());
    windows = {};
    document.getElementById("taskbar-apps").innerHTML = "";
};

/* =========================
   LEGACY
========================= */

function exposeAPI() {
    window.launchApp = openWindow;
}
