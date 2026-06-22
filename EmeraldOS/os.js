"use strict";

/* =========================
   CLOUD STORAGE
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
    await loadSystem();
    initStartMenu();
    initClock();
});

/* =========================
   SYSTEM LOAD
========================= */

async function loadSystem() {
    try {
        fileSystem.files = await loadDrive() || {};
    } catch {
        fileSystem.files = {};
    }
}

/* =========================
   START MENU (FIXED JS LOGIC)
========================= */

function initStartMenu() {
    const menu = document.getElementById("start-menu");
    const btn = document.getElementById("start-btn");

    if (!menu || !btn) return;

    btn.onclick = (e) => {
        e.stopPropagation();
        menu.classList.toggle("show");
    };

    document.addEventListener("click", (e) => {
        if (!menu.contains(e.target) && !btn.contains(e.target)) {
            menu.classList.remove("show");
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") menu.classList.remove("show");
    });
}

/* =========================
   CLOCK
========================= */

function initClock() {
    const el = document.getElementById("clock");

    setInterval(() => {
        if (el) {
            el.textContent = new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            });
        }
    }, 1000);
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

    const task = document.createElement("div");
    task.className = "taskbar-app";
    task.textContent = title;

    task.onclick = () => restoreWindow(id);

    document.getElementById("taskbar-apps").appendChild(task);

    windows[id] = { win, task, maximized: false };

    enableDrag(win);
    enableResize(win);

    return win;
};

/* =========================
   MINIMIZE
========================= */

window.minimizeWindow = function (id) {
    const w = windows[id];
    if (!w) return;
    w.win.style.display = "none";
};

/* =========================
   RESTORE
========================= */

window.restoreWindow = function (id) {
    const w = windows[id];
    if (!w) return;

    w.win.style.display = "block";
    w.win.style.zIndex = ++zIndexCounter;
};

/* =========================
   MAXIMIZE
========================= */

window.maximizeWindow = function (id) {
    const w = windows[id];
    if (!w) return;

    const win = w.win;

    if (!w.maximized) {
        w.old = {
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
        win.style.left = w.old?.left || "80px";
        win.style.top = w.old?.top || "80px";
        win.style.width = w.old?.width || "420px";
        win.style.height = w.old?.height || "320px";

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
    w.task.remove();

    delete windows[id];
};

/* =========================
   DRAG + RESIZE
========================= */

function enableDrag(win) {
    const bar = win.querySelector(".title-bar");

    bar.onmousedown = (e) => {
        drag = {
            win,
            offsetX: e.clientX - win.offsetLeft,
            offsetY: e.clientY - win.offsetTop
        };
    };
}

function enableResize(win) {
    const handle = win.querySelector(".resize-handle");

    handle.onmousedown = (e) => {
        const r = win.getBoundingClientRect();

        resize = {
            win,
            startX: e.clientX,
            startY: e.clientY,
            startW: r.width,
            startH: r.height
        };

        e.preventDefault();
    };
}

document.addEventListener("mousemove", (e) => {
    if (drag) {
        drag.win.style.left = (e.clientX - drag.offsetX) + "px";
        drag.win.style.top = (e.clientY - drag.offsetY) + "px";
    }

    if (resize) {
        resize.win.style.width =
            Math.max(220, resize.startW + (e.clientX - resize.startX)) + "px";

        resize.win.style.height =
            Math.max(160, resize.startH + (e.clientY - resize.startY)) + "px";
    }
});

document.addEventListener("mouseup", () => {
    drag = null;
    resize = null;
});

/* =========================
   APPS (FULL RESTORED LOGIC)
========================= */

window.openNotes = () => openWindow("Notes", `<div>Notes App</div>`);
window.openFileExplorer = () => openWindow("Files", `<div>Files App</div>`);
window.openAppStore = () => openWindow("App Store", `<div>Store</div>`);
window.openDocs = () => openWindow("Docs", `<div>Docs</div>`);
window.openCalendar = () => openWindow("Calendar", `<div>Calendar</div>`);
window.openCalculator = () => openWindow("Calculator", `<div>Calculator</div>`);

window.openClockApp = () =>
    openWindow("Clock", `<div id="live_time"></div>`);

setInterval(() => {
    const el = document.getElementById("live_time");
    if (el) el.textContent = new Date().toLocaleTimeString();
}, 1000);

/* IFRAME APPS (RESTORED) */

window.openChat = () =>
    openWindow("Chat", `<iframe src="chat.html" style="width:100%;height:100%;border:none;"></iframe>`);

window.openGames = () =>
    openWindow("Games", `<iframe src="home.html" style="width:100%;height:100%;border:none;"></iframe>`);

window.openMedia = () =>
    openWindow("Media Player", `<iframe src="mediaplayer.html" style="width:100%;height:100%;border:none;"></iframe>`);

/* SYSTEM */
window.openSystemApp = () =>
    openWindow("System", `<div>System Panel</div>`);
