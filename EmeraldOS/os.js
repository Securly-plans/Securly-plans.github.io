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

    document.addEventListener("click", () => menu.classList.remove("show"));
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
   LIVE RERENDER
========================= */

function rerenderOpenApps() {
    document.querySelectorAll(".window[data-app]").forEach(win => {
        const app = win.getAttribute("data-app");
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

    const titleBar = win.querySelector(".title-bar");
    const closeBtn = win.querySelector(".close-btn");
    const minBtn = win.querySelector(".min-btn");
    const maxBtn = win.querySelector(".max-btn");
    const hideBtn = win.querySelector(".hide-btn");
    const content = win.querySelector(".window-content");
    const resizeHandle = win.querySelector(".resize-handle");

    let state = { minimized: false, maximized: false, saved: null };

    closeBtn.onclick = () => {
        hiddenWindows.delete(title);
        win.remove();
    };

    minBtn.onclick = () => {
        state.minimized = !state.minimized;

        if (state.minimized) {
            if (!state.saved) state.saved = { height: win.style.height || "400px" };
            content.style.display = "none";
            win.style.height = "32px";
        } else {
            content.style.display = "block";
            win.style.height = state.saved?.height || "400px";
        }
    };

    maxBtn.onclick = () => {
        state.maximized = !state.maximized;

        if (state.maximized) {
            const r = win.getBoundingClientRect();
            state.saved = {
                left: r.left + "px",
                top: r.top + "px",
                width: r.width + "px",
                height: r.height + "px"
            };

            win.style.left = "0px";
            win.style.top = "0px";
            win.style.width = "100%";
            win.style.height = "calc(100% - 30px)";
        } else if (state.saved) {
            Object.assign(win.style, state.saved);
        }
    };

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

    titleBar.onmousedown = (e) => {
        dragState = {
            win,
            offsetX: e.clientX - win.offsetLeft,
            offsetY: e.clientY - win.offsetTop
        };
        win.style.zIndex = ++zIndexCounter;
    };

    resizeHandle.onmousedown = (e) => {
        e.preventDefault();
        const r = win.getBoundingClientRect();

        resizeState = {
            win,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: r.width,
            startHeight: r.height
        };
    };

    win.onmousedown = () => win.style.zIndex = ++zIndexCounter;

    return win;
};

/* =========================
   FILE OPS
========================= */

window.createFile = async () => {
    let name = prompt("File name:", "New Note.note");
    if (!name) return;
    if (!name.includes(".")) name += ".note";

    await cloudCreateFile(name, "");
    await loadSystem();
};

window.deleteFile = async (id) => {
    await cloudDeleteFile(id);
    await loadSystem();
};

/* =========================
   FILE OPEN FIX
========================= */

window.openFile = (id) => {
    const f = fileSystem.files[id];
    if (!f) return;

    let body = "";

    if (f.content?.startsWith("data:image")) {
        body = `<img src="${f.content}" style="max-width:100%">`;
    } else if (f.content?.startsWith("data:video")) {
        body = `<video controls style="max-width:100%"><source src="${f.content}"></video>`;
    } else {
        body = `
            <textarea id="file_${id}" style="width:100%;height:90%">${f.content || ""}</textarea>
            <button onclick="saveFile('${id}')">Save</button>
        `;
    }

    openWindow(f.name, `<div style="height:100%;display:flex;flex-direction:column">${body}</div>`);
};

window.saveFile = async (id) => {
    const el = document.getElementById(`file_${id}`);
    if (!el) return;

    await cloudSaveFile(id, {
        name: fileSystem.files[id].name,
        content: el.value
    });

    await loadSystem();
};

/* =========================
   NOTES (SAFE)
========================= */

window.openNotes = () => openWindow("Notes", renderNotes(), "notes");

function renderNotes() {
    return `
        <div style="padding:6px">
            <button onclick="createNote()">+ New Note</button>
            <hr>
            ${Object.entries(fileSystem.files)
                .filter(([_, f]) => f.name.endsWith(".note"))
                .map(([id, f]) => `
                    <div onclick="loadNote('${id}')">📄 ${f.name}</div>
                `).join("")}
        </div>
    `;
}

window.createNote = async () => {
    await cloudCreateFile("New Note.note", "");
    await loadSystem();
};

window.loadNote = (id) => {
    activeNoteId = id;

    setTimeout(() => {
        const f = fileSystem.files[id];
        const t = document.getElementById("note_title");
        const b = document.getElementById("note_body");

        if (t && b && f) {
            t.value = f.name;
            b.value = f.content;
        }
    }, 50);
};

window.saveNote = async () => {
    if (!activeNoteId) return;

    const t = document.getElementById("note_title");
    const b = document.getElementById("note_body");

    if (!t || !b) return;

    await cloudSaveFile(activeNoteId, {
        name: t.value,
        content: b.value
    });

    await loadSystem();
};

/* =========================
   DOCS (SAFE)
========================= */

window.openDocs = () => openWindow("Docs", renderDocs(), "docs");

function renderDocs() {
    return `
        <div style="padding:6px">
            <button onclick="createDoc()">New Doc</button>
            <hr>
            ${Object.entries(fileSystem.files)
                .filter(([_, f]) => f.name.endsWith(".doc"))
                .map(([id, f]) => `
                    <div onclick="loadDoc('${id}')">📄 ${f.name}</div>
                `).join("")}

            <input id="doc_title">
            <div id="doc_editor" contenteditable="true"></div>
            <button onclick="saveDoc()">Save</button>
        </div>
    `;
}

window.createDoc = async () => {
    await cloudCreateFile("New Doc.doc", "");
    await loadSystem();
};

window.loadDoc = (id) => {
    activeDocId = id;

    setTimeout(() => {
        const f = fileSystem.files[id];
        const t = document.getElementById("doc_title");
        const e = document.getElementById("doc_editor");

        if (t && e && f) {
            t.value = f.name;
            e.innerHTML = f.content;
        }
    }, 50);
};

window.saveDoc = async () => {
    if (!activeDocId) return;

    const t = document.getElementById("doc_title");
    const e = document.getElementById("doc_editor");

    if (!t || !e) return;

    await cloudSaveFile(activeDocId, {
        name: t.value,
        content: e.innerHTML
    });

    await loadSystem();
};

/* =========================
   LEGACY EXPORT
========================= */

function exposeAPI() {
    window.launchApp = openWindow;

    // IMPORTANT FIX: app launcher bindings
    window.openFileExplorer = window.openFileExplorer || (() => openWindow("Files", renderFileExplorer(), "files"));
}
