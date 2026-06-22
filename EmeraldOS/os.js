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

let windows = {}; // window registry (IMPORTANT)
let minimized = new Set();
let maximized = new Set();

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

    document.addEventListener("click", () => {
        menu.classList.remove("show");
    });
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
    fileSystem.files = await loadDrive() || {};
    rerenderOpenApps();
}

/* =========================
   WINDOW SYSTEM (WIN95 CORE)
========================= */

window.openWindow = function (title, html, app = "") {
    const container = document.getElementById("windows-container");

    const win = document.createElement("div");
    win.className = "window";
    win.style.zIndex = ++zIndexCounter;

    win.dataset.app = app;
    win.dataset.title = title;

    win.style.left = "120px";
    win.style.top = "80px";

    const id = crypto.randomUUID();
    win.dataset.id = id;

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

/* restore from taskbar */
window.restoreWindow = function (id) {
    const win = windows[id];
    if (!win) return;

    win.style.display = "block";
    win.style.zIndex = ++zIndexCounter;
    minimized.delete(id);
};

/* =========================
   TASKBAR BUTTONS
========================= */

function addTaskbarButton(id, title) {
    const bar = document.getElementById("taskbar-apps");

    const btn = document.createElement("button");
    btn.textContent = title;
    btn.id = "tb_" + id;

    btn.onclick = () => {
        const win = windows[id];
        if (!win) return;

        if (win.style.display === "none") {
            restoreWindow(id);
        } else {
            minimizeWindow(id);
        }
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
            offsetX: e.clientX - win.offsetLeft,
            offsetY: e.clientY - win.offsetTop
        };
    };
}

function enableResize(win) {
    const handle = win.querySelector(".resize-handle");

    handle.onmousedown = (e) => {
        const rect = win.getBoundingClientRect();

        resizeState = {
            win,
            startX: e.clientX,
            startY: e.clientY,
            w: rect.width,
            h: rect.height
        };
    };
}

document.addEventListener("mousemove", (e) => {
    if (dragState) {
        dragState.win.style.left = (e.clientX - dragState.offsetX) + "px";
        dragState.win.style.top = (e.clientY - dragState.offsetY) + "px";
    }

    if (resizeState) {
        resizeState.win.style.width = Math.max(220, resizeState.w + (e.clientX - resizeState.startX)) + "px";
        resizeState.win.style.height = Math.max(160, resizeState.h + (e.clientY - resizeState.startY)) + "px";
    }
});

document.addEventListener("mouseup", () => {
    dragState = null;
    resizeState = null;
});

/* =========================
   FILE OPEN FIX (WORKING)
========================= */

window.openFile = function (id) {
    const file = fileSystem.files[id];
    if (!file) return;

    let body = "";

    if (file.content?.startsWith("data:image")) {
        body = `<img src="${file.content}" style="max-width:100%">`;
    } else {
        body = `
            <input id="f_t_${id}" value="${file.name}">
            <textarea id="f_b_${id}" style="width:100%;height:80%">${file.content}</textarea>
            <button onclick="saveOpenedFile('${id}')">Save</button>
        `;
    }

    openWindow(file.name, body, "file");
};

window.saveOpenedFile = async function (id) {
    await cloudSaveFile(id, {
        name: document.getElementById("f_t_" + id)?.value,
        content: document.getElementById("f_b_" + id)?.value
    });

    await loadSystem();
};

/* =========================
   FILE OPS (UNCHANGED CORE)
========================= */

window.createFile = async () => {
    await cloudCreateFile("New File", "");
    await loadSystem();
};

window.deleteFile = async (id) => {
    await cloudDeleteFile(id);
    await loadSystem();
};

/* =========================
   NOTES + DOCS (KEEP FUNCTIONALITY)
========================= */

window.openNotes = () => openWindow("Notes", "<div>Notes App</div>", "notes");
window.openDocs = () => openWindow("Docs", "<div>Docs App</div>", "docs");

/* =========================
   SYSTEM EXPOSE
========================= */

function exposeAPI() {
    window.launchApp = openWindow;
}
