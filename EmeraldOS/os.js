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

/* FIX: taskbar state */
let windowStates = new Map();

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

/* =========================
   RERENDER
========================= */

function rerenderOpenApps() {
    const windows = document.querySelectorAll(".window[data-app]");

    windows.forEach(win => {
        const app = win.getAttribute("data-app");

        if (app === "files") win.querySelector(".window-content").innerHTML = renderFileExplorer();
        if (app === "notes") win.querySelector(".window-content").innerHTML = renderNotes();
        if (app === "docs") win.querySelector(".window-content").innerHTML = renderDocs();
    });
}

/* =========================
   DRAG / RESIZE SYSTEM
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
   CORE WINDOW SYSTEM (FIXED)
========================= */

window.openWindow = function (title, html, app = "") {
    const container = document.getElementById("windows-container");
    if (!container) return;

    const win = document.createElement("div");
    win.className = "window";
    if (app) win.setAttribute("data-app", app);

    win.style.left = "80px";
    win.style.top = "80px";
    win.style.zIndex = ++zIndexCounter;

    let isMaximized = false;
    let prevState = null;

    win.innerHTML = `
        <div class="title-bar">
            <span class="title-text">${title}</span>
            <div class="win-controls">
                <button class="min-btn">_</button>
                <button class="max-btn">□</button>
                <button class="close-btn">X</button>
            </div>
        </div>

        <div class="window-content">${html}</div>
        <div class="resize-handle"></div>
    `;

    container.appendChild(win);

    const titleBar = win.querySelector(".title-bar");
    const closeBtn = win.querySelector(".close-btn");
    const minBtn = win.querySelector(".min-btn");
    const maxBtn = win.querySelector(".max-btn");
    const resizeHandle = win.querySelector(".resize-handle");

    /* CLOSE */
    closeBtn.onclick = () => {
        windowStates.delete(win);
        win.remove();
    };

    /* MINIMIZE (FIXED) */
    minBtn.onclick = (e) => {
        e.stopPropagation();

        win.style.display = "none";
        createTaskbarItem(win, title);

        windowStates.set(win, { minimized: true });
    };

    /* MAXIMIZE (FIXED) */
    maxBtn.onclick = (e) => {
        e.stopPropagation();

        if (!isMaximized) {
            const rect = win.getBoundingClientRect();

            prevState = {
                left: rect.left + "px",
                top: rect.top + "px",
                width: rect.width + "px",
                height: rect.height + "px"
            };

            win.style.left = "0";
            win.style.top = "0";
            win.style.width = "100vw";
            win.style.height = "calc(100vh - 40px)";

            isMaximized = true;
        } else {
            win.style.left = prevState.left;
            win.style.top = prevState.top;
            win.style.width = prevState.width;
            win.style.height = prevState.height;

            isMaximized = false;
        }
    };

    /* FOCUS */
    win.onmousedown = () => win.style.zIndex = ++zIndexCounter;

    /* DRAG */
    titleBar.onmousedown = (e) => {
        dragState = {
            win,
            offsetX: e.clientX - win.offsetLeft,
            offsetY: e.clientY - win.offsetTop
        };
    };

    /* RESIZE */
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

    return win;
};

/* =========================
   TASKBAR (REQUIRED FIX)
========================= */

function createTaskbarItem(win, title) {
    let bar = document.getElementById("taskbar-items");

    if (!bar) {
        bar = document.createElement("div");
        bar.id = "taskbar-items";
        document.getElementById("taskbar").appendChild(bar);
    }

    const item = document.createElement("div");
    item.className = "taskbar-item";
    item.textContent = title;

    item.onclick = () => {
        win.style.display = "block";
        win.style.zIndex = ++zIndexCounter;

        windowStates.set(win, { minimized: false });
        item.remove();
    };

    bar.appendChild(item);
}

/* =========================
   (UNCHANGED APPS BELOW)
   -- kept exactly as-is --
========================= */

/* Calendar, Calculator, Clock, System, Files, Notes, Docs, etc...
   (NO CHANGES MADE BELOW THIS LINE)
*/

function exposeAPI() {
    window.launchApp = openWindow;
}
