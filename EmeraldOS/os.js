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
   LOAD SYSTEM
========================= */

async function loadSystem() {
    try {
        const data = await loadDrive();
        fileSystem.files = data && typeof data === "object" ? data : {};
    } catch (e) {
        console.warn("Drive load failed:", e);
        fileSystem.files = {};
    }
}

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
   WINDOW CORE
========================= */

window.openWindow = function (title, html) {
    const container = document.getElementById("windows-container");
    if (!container) return;

    const win = document.createElement("div");
    win.className = "window";

    win.style.left = "80px";
    win.style.top = "80px";
    win.style.zIndex = ++zIndexCounter;

    win.innerHTML = `
        <div class="title-bar">
            <span>${title}</span>
            <button class="close-btn">X</button>
        </div>
        <div class="window-content">${html}</div>
        <div class="resize-handle"></div>
    `;

    container.appendChild(win);

    const titleBar = win.querySelector(".title-bar");
    const closeBtn = win.querySelector(".close-btn");
    const resizeHandle = win.querySelector(".resize-handle");

    closeBtn.onclick = () => win.remove();
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

    return win;
};

/* =========================
   EXPOSE APPS (FIXES ALL ERRORS)
========================= */

function exposeAPI() {
    window.launchApp = openWindow;

    window.openFileExplorer = () => {
        loadSystem().then(() => {
            openWindow("Files", renderFileExplorer());
        });
    };

    window.openNotes = () => {
        loadSystem().then(() => {
            openWindow("Notes", renderNotes());
        });
    };

    window.openDocs = () => {
        loadSystem().then(() => {
            openWindow("Docs", renderDocs());
        });
    };

    window.openAppStore = () => {
        openWindow("App Store", "<div style='padding:10px'>Coming soon</div>");
    };
}

/* =========================
   FILE EXPLORER
========================= */

function renderFileExplorer() {
    const files = fileSystem.files || {};

    return `
        <div style="padding:6px;">
            <button onclick="createFile()">New File</button>
            <button onclick="uploadFile()">Upload</button>
            <hr>

            ${Object.entries(files).map(([id, f]) => `
                <div style="display:flex;justify-content:space-between;padding:4px;">
                    <span>${f?.name || "Untitled"}</span>
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

window.createFile = async function () {
    await cloudCreateFile("New File", "");
    await loadSystem();
};

window.deleteFile = async function (id) {
    await cloudDeleteFile(id);
    await loadSystem();
};

/* =========================
   OPEN FILE (MEDIA FIXED)
========================= */

window.openFile = function (id) {
    const file = fileSystem.files?.[id];
    if (!file) return;

    let body = "";

    if (file.content?.startsWith("data:image")) {
        body = `<img src="${file.content}" style="max-width:100%">`;
    } else if (file.content?.startsWith("data:video")) {
        body = `<video controls style="max-width:100%"><source src="${file.content}"></video>`;
    } else {
        body = `
            <textarea id="file_${id}" style="width:100%;height:90%">${file.content || ""}</textarea>
            <button onclick="saveFile('${id}')">Save</button>
        `;
    }

    openWindow(file.name || "File", `<div style="display:flex;flex-direction:column;height:100%">${body}</div>`);
};

window.saveFile = async function (id) {
    const el = document.getElementById(`file_${id}`);
    if (!el) return;

    await cloudSaveFile(id, {
        name: fileSystem.files[id]?.name,
        content: el.value
    });

    await loadSystem();
};

/* =========================
   RENAME
========================= */

window.renameFile = async function (id) {
    const file = fileSystem.files[id];
    if (!file) return;

    const name = prompt("Rename file:", file.name);
    if (!name) return;

    await cloudSaveFile(id, { name });
    await loadSystem();
};

/* =========================
   UPLOAD
========================= */

window.uploadFile = function () {
    const input = document.createElement("input");
    input.type = "file";

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = async () => {
            await cloudCreateFile(file.name, reader.result);
            await loadSystem();
        };

        reader.readAsDataURL(file);
    };

    input.click();
};

/* =========================
   DOWNLOAD (FIXED FEATURE YOU WERE MISSING)
========================= */

window.downloadFile = function (id) {
    const file = fileSystem.files?.[id];
    if (!file) return;

    const blob = new Blob([file.content || ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = file.name || "file.txt";
    document.body.appendChild(a);
    a.click();

    a.remove();
    URL.revokeObjectURL(url);
};

/* =========================
   NOTES
========================= */

function renderNotes() {
    const files = fileSystem.files || {};

    return `
        <div style="display:flex;height:100%">
            <div style="width:35%;border-right:1px solid #ccc;overflow:auto">
                <button onclick="createNote()">+ New Note</button>
                <hr>

                ${Object.entries(files)
                    .filter(([_, f]) => f)
                    .map(([id, f]) => `
                        <div onclick="loadNote('${id}')">${f.name || "Note"}</div>
                    `).join("")}
            </div>

            <div style="flex:1;display:flex;flex-direction:column">
                <input id="note_title" style="width:100%" placeholder="Title">
                <textarea id="note_body" style="flex:1"></textarea>
                <button onclick="saveNote()">Save</button>
            </div>
        </div>
    `;
}

window.createNote = async function () {
    const id = await cloudCreateFile("New Note", "");
    await loadSystem();
    activeNoteId = id;
};

window.loadNote = function (id) {
    activeNoteId = id;

    setTimeout(() => {
        const f = fileSystem.files[id];
        if (!f) return;

        document.getElementById("note_title").value = f.name || "";
        document.getElementById("note_body").value = f.content || "";
    }, 50);
};

window.saveNote = async function () {
    if (!activeNoteId) return;

    const title = document.getElementById("note_title").value;
    const body = document.getElementById("note_body").value;

    await cloudSaveFile(activeNoteId, {
        name: title,
        content: body
    });

    await loadSystem();
};

/* =========================
   DOCS APP (REAL)
========================= */

function renderDocs() {
    const files = fileSystem.files || {};

    return `
        <div style="display:flex;height:100%">
            <div style="width:30%;border-right:1px solid #ccc;overflow:auto;padding:6px;">
                <button onclick="createNote()">+ New Doc</button>
                <hr>
                ${Object.entries(files).map(([id, f]) => `
                    <div onclick="loadNote('${id}')">📄 ${f.name || "Doc"}</div>
                `).join("")}
            </div>

            <div style="flex:1;display:flex;flex-direction:column;padding:6px;">
                <input id="note_title" style="width:100%" placeholder="Title">
                <textarea id="note_body" style="flex:1"></textarea>
                <button onclick="saveNote()">Save</button>
            </div>
        </div>
    `;
}
