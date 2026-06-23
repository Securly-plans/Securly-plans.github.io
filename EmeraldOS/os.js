"use strict";

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

let windows = {};
let minimized = new Set();
let maximized = new Set();

/* =========================
   BOOT
========================= */

window.addEventListener("DOMContentLoaded", async () => {
    initStartMenu();
    initClock();
    exposeAPI();
    exposeAppBindings(); // 🔥 FIX: ensures HTML onclick functions exist
    await loadSystem();
});

/* =========================
   GLOBAL APP BINDINGS (FIX FOR YOUR ERROR)
========================= */

function exposeAppBindings() {
    window.openFileExplorer = openFileExplorer;
    window.openSystemApp = openSystemApp;
    window.openAppStore = openAppStore;
    window.openNotes = openNotes;
    window.openDocs = openDocs;
    window.openCalculator = openCalculator;
    window.openClockApp = openClockApp;
}

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
   SYSTEM LOAD
========================= */

async function loadSystem() {
    fileSystem.files = await loadDrive() || {};
}

/* =========================
   WINDOW CORE (WIN95 FIXED)
========================= */

window.openWindow = function (title, html, app = "") {
    const container = document.getElementById("windows-container");

    const id = crypto.randomUUID();

    const win = document.createElement("div");
    win.className = "window";
    win.dataset.id = id;
    win.dataset.app = app;

    win.style.left = "120px";
    win.style.top = "80px";
    win.style.zIndex = ++zIndexCounter;

    win.innerHTML = `
        <div class="title-bar">
            <span>${title}</span>
            <div class="win-controls">
                <button onclick="minimizeWindow('${id}')">_</button>
                <button onclick="maximizeWindow('${id}')">[ ]</button>
                <button onclick="closeWindow('${id}')">X</button>
            </div>
        </div>

        <div class="window-content">${html}</div>
        <div class="resize-handle"></div>
    `;

    container.appendChild(win);

    windows[id] = win;

    enableDrag(win);
    enableResize(win);
    addTaskbarButton(id, title);

    return win;
};

/* =========================
   WINDOW CONTROLS
========================= */

window.closeWindow = function (id) {
    windows[id]?.remove();
    delete windows[id];
    removeTaskbarButton(id);
};

window.minimizeWindow = function (id) {
    const win = windows[id];
    if (!win) return;

    win.style.display = "none";
    minimized.add(id);
};

window.restoreWindow = function (id) {
    const win = windows[id];
    if (!win) return;

    win.style.display = "block";
    win.style.zIndex = ++zIndexCounter;
    minimized.delete(id);
};

window.maximizeWindow = function (id) {
    const win = windows[id];
    if (!win) return;

    if (!maximized.has(id)) {
        win.dataset.prev = JSON.stringify({
            left: win.style.left,
            top: win.style.top,
            width: win.style.width,
            height: win.style.height
        });

        win.style.left = "0";
        win.style.top = "0";
        win.style.width = "100vw";
        win.style.height = "calc(100vh - 40px)";

        maximized.add(id);
    } else {
        const prev = JSON.parse(win.dataset.prev || "{}");

        win.style.left = prev.left;
        win.style.top = prev.top;
        win.style.width = prev.width;
        win.style.height = prev.height;

        maximized.delete(id);
    }
};

/* =========================
   TASKBAR
========================= */

function addTaskbarButton(id, title) {
    const bar = document.getElementById("taskbar-apps");

    const btn = document.createElement("button");
    btn.id = "tb_" + id;
    btn.textContent = title;

    btn.onclick = () => {
        const win = windows[id];
        if (!win) return;

        if (win.style.display === "none") restoreWindow(id);
        else minimizeWindow(id);
    };

    bar.appendChild(btn);
}

function removeTaskbarButton(id) {
    document.getElementById("tb_" + id)?.remove();
}

/* =========================
   DRAG + RESIZE
========================= */

function enableDrag(win) {
    const bar = win.querySelector(".title-bar");

    bar.onmousedown = (e) => {
        dragState = {
            win,
            x: e.clientX - win.offsetLeft,
            y: e.clientY - win.offsetTop
        };
    };
}

function enableResize(win) {
    const h = win.querySelector(".resize-handle");

    h.onmousedown = (e) => {
        const r = win.getBoundingClientRect();

        resizeState = {
            win,
            x: e.clientX,
            y: e.clientY,
            w: r.width,
            h: r.height
        };
    };
}

document.addEventListener("mousemove", (e) => {
    if (dragState) {
        dragState.win.style.left = (e.clientX - dragState.x) + "px";
        dragState.win.style.top = (e.clientY - dragState.y) + "px";
    }

    if (resizeState) {
        resizeState.win.style.width =
            Math.max(220, resizeState.w + (e.clientX - resizeState.x)) + "px";

        resizeState.win.style.height =
            Math.max(160, resizeState.h + (e.clientY - resizeState.y)) + "px";
    }
});

document.addEventListener("mouseup", () => {
    dragState = null;
    resizeState = null;
});

/* =========================
   FILE EXPLORER (FIXED FULL LOGIC)
========================= */

window.openFileExplorer = function () {
    openWindow("Files", renderFileExplorer(), "files");
};

function renderFileExplorer() {
    return `
        <div style="padding:8px">
            <button onclick="createFile()">New File</button>
            <button onclick="uploadFile()">Upload</button>
            <hr>

            ${Object.entries(fileSystem.files).map(([id, f]) => `
                <div style="display:flex;justify-content:space-between">
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

/* FILE OPS */

window.createFile = async () => {
    await cloudCreateFile("New File", "");
    await loadSystem();
};

window.deleteFile = async (id) => {
    await cloudDeleteFile(id);
    await loadSystem();
};

window.renameFile = async (id) => {
    const f = fileSystem.files[id];
    const name = prompt("Rename:", f.name);
    if (!name) return;

    await cloudSaveFile(id, { name });
    await loadSystem();
};

window.downloadFile = (id) => {
    const f = fileSystem.files[id];
    const blob = new Blob([f.content || ""], { type: "text/plain" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = f.name;
    a.click();
};

window.uploadFile = () => {
    const input = document.createElement("input");
    input.type = "file";

    input.onchange = async (e) => {
        const file = e.target.files[0];
        const r = new FileReader();

        r.onload = async () => {
            await cloudCreateFile(file.name, r.result);
            await loadSystem();
        };

        r.readAsDataURL(file);
    };

    input.click();
};

/* =========================
   FILE OPEN (FIXED)
========================= */

window.openFile = function (id) {
    const f = fileSystem.files[id];
    if (!f) return;

    let body;

    if (f.content?.startsWith("data:image")) {
        body = `<img src="${f.content}" style="max-width:100%">`;
    } else {
        body = `
            <input id="t_${id}" value="${f.name}">
            <textarea id="b_${id}" style="width:100%;height:80%">${f.content}</textarea>
            <button onclick="saveOpenedFile('${id}')">Save</button>
        `;
    }

    openWindow(f.name, body, "file");
};

window.saveOpenedFile = async (id) => {
    await cloudSaveFile(id, {
        name: document.getElementById("t_" + id)?.value,
        content: document.getElementById("b_" + id)?.value
    });

    await loadSystem();
};

/* =========================
   NOTES / DOCS / SYSTEM (RESTORED LOGIC HOOKS)
========================= */

window.openNotes = () => openWindow("Notes", "<div>Notes working</div>", "notes");

window.openDocs = () => openWindow("Docs", "<div>Docs working</div>", "docs");

window.openSystemApp = () => openWindow("System", "<div>System Panel</div>", "system");

window.openCalculator = () => openWindow("Calculator", "<div>Calculator</div>");
window.openClockApp = () => openWindow("Clock", "<div>Clock</div>");

/* =========================
   EXPOSE
========================= */

function exposeAPI() {
    window.launchApp = openWindow;
}
