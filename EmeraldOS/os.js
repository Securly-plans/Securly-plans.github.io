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
   WINDOW STATE
========================= */

const hiddenWindows = new Map();

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
        const raw = await loadDrive() || {};

        fileSystem.files = Object.fromEntries(
            Object.entries(raw).map(([id, f]) => {
                const name = f?.name || "Untitled";
                const lower = name.toLowerCase();

                let type = "file";
                if (lower.endsWith(".doc")) type = "doc";
                else if (lower.endsWith(".note")) type = "note";
                else if (lower.match(/\.(png|jpg|jpeg|gif)$/)) type = "image";
                else if (lower.match(/\.(mp4|webm)$/)) type = "video";

                return [
                    id,
                    {
                        name,
                        content: f?.content ?? "",
                        type,
                        created: f?.created || Date.now(),
                        updated: Date.now()
                    }
                ];
            })
        );

    } catch (e) {
        console.warn("Drive load failed:", e);
        fileSystem.files = {};
    }

    rerenderOpenApps();
}

/* =========================
   LIVE RERENDER (SAFE)
========================= */

function rerenderOpenApps() {
    const windows = document.querySelectorAll(".window[data-app]");

    windows.forEach(win => {
        const app = win.getAttribute("data-app");
        const content = win.querySelector(".window-content");
        if (!content) return;

        if (app === "files") content.innerHTML = renderFileExplorer();
        if (app === "notes") content.innerHTML = renderNotes();
        if (app === "docs") content.innerHTML = renderDocs();
    });
}

/* =========================
   WINDOW SYSTEM (FIXED)
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
   CORE WINDOW (FIXED ONLY)
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

    win.innerHTML = `
        <div class="title-bar">
            <span>${title}</span>

            <div class="window-controls">
                <button class="min-btn">_</button>
                <button class="max-btn">□</button>
                <button class="hide-btn">—</button>
                <button class="close-btn">X</button>
            </div>
        </div>

        <div class="window-content">${html}</div>
        <div class="resize-handle"></div>
    `;

    container.appendChild(win);

    const content = win.querySelector(".window-content");
    const titleBar = win.querySelector(".title-bar");
    const closeBtn = win.querySelector(".close-btn");
    const minBtn = win.querySelector(".min-btn");
    const maxBtn = win.querySelector(".max-btn");
    const hideBtn = win.querySelector(".hide-btn");
    const resizeHandle = win.querySelector(".resize-handle");

    let state = {
        minimized: false,
        maximized: false,
        backup: null
    };

    /* CLOSE */
    closeBtn.onclick = () => {
        hiddenWindows.delete(title);
        win.remove();
    };

    /* MINIMIZE */
    minBtn.onclick = () => {
        state.minimized = !state.minimized;

        if (state.minimized) {
            if (!state.backup) state.backup = { height: win.style.height || "400px" };

            content.style.display = "none";
            win.style.height = "32px";
        } else {
            content.style.display = "block";
            win.style.height = state.backup?.height || "400px";
        }
    };

    /* MAXIMIZE */
    maxBtn.onclick = () => {
        state.maximized = !state.maximized;

        if (state.maximized) {
            const rect = win.getBoundingClientRect();

            state.backup = {
                left: rect.left + "px",
                top: rect.top + "px",
                width: rect.width + "px",
                height: rect.height + "px"
            };

            win.style.left = "0px";
            win.style.top = "0px";
            win.style.width = "100%";
            win.style.height = "calc(100% - 30px)";
        } else if (state.backup) {
            win.style.left = state.backup.left;
            win.style.top = state.backup.top;
            win.style.width = state.backup.width;
            win.style.height = state.backup.height;
        }
    };

    /* HIDE */
    hideBtn.onclick = () => {
        win.style.display = "none";
        hiddenWindows.set(title, win);
    };

    window.restoreWindow = function (name) {
        const w = hiddenWindows.get(name);
        if (!w) return;

        w.style.display = "block";
        w.style.zIndex = ++zIndexCounter;
        hiddenWindows.delete(name);
    };

    /* DRAG */
    titleBar.onmousedown = (e) => {
        dragState = {
            win,
            offsetX: e.clientX - win.offsetLeft,
            offsetY: e.clientY - win.offsetTop
        };

        win.style.zIndex = ++zIndexCounter;
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

    /* FOCUS */
    win.onmousedown = () => {
        win.style.zIndex = ++zIndexCounter;
    };

    return win;
};

/* =========================
   NOTES (SAFE)
========================= */

function renderNotes() {
    return `
        <div style="padding:6px;height:100%;display:flex;flex-direction:column;gap:6px">
            <button onclick="createNote()">+ New Note</button>

            <div style="flex:1;overflow:auto">
                ${Object.entries(fileSystem.files)
                    .filter(([_, f]) => f.name?.toLowerCase().endsWith(".note"))
                    .map(([id, f]) => `
                        <div onclick="loadNote('${id}')" style="cursor:pointer;padding:4px;">
                            📄 ${f.name}
                        </div>
                    `).join("")}
            </div>

            <input id="note_title" placeholder="Title" style="width:100%">
            <textarea id="note_body" style="width:100%;height:120px"></textarea>

            <button onclick="saveNote()">Save</button>
        </div>
    `;
}

/* =========================
   DOCS (SAFE)
========================= */

function renderDocs() {
    return `
        <div style="padding:6px;height:100%;display:flex;flex-direction:column;gap:6px">
            <button onclick="createDoc()">New Doc</button>

            <div style="flex:1;overflow:auto">
                ${Object.entries(fileSystem.files)
                    .filter(([_, f]) => f.name?.toLowerCase().endsWith(".doc"))
                    .map(([id, f]) => `
                        <div onclick="loadDoc('${id}')" style="cursor:pointer;padding:4px;">
                            📄 ${f.name}
                        </div>
                    `).join("")}
            </div>

            <input id="doc_title" placeholder="Title" style="width:100%">
            <div id="doc_editor" contenteditable="true"
                style="border:1px solid #ccc;height:160px;overflow:auto;padding:6px"></div>

            <button onclick="saveDoc()">Save</button>
        </div>
    `;
}

/* =========================
   LEGACY
========================= */

function exposeAPI() {
    window.launchApp = openWindow;
}
