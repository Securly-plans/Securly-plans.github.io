"use strict";

/* =========================
   IMPORT CLOUD STORAGE
========================= */

import {
    loadDrive,
    createFile as cloudCreateFile,
    saveFile as cloudSaveFile,
    deleteFile as cloudDeleteFile,
    ensureUser
} from "./cloudstorage.js";

/* =========================
   STATE
========================= */

let zIndexCounter = 100;

let dragState = null;
let resizeState = null;

let fileSystem = {
    files: {},
    notes: {}
};

let currentNoteId = null;
let currentFileId = null;

/* =========================
   BOOT
========================= */

window.addEventListener("DOMContentLoaded", async () => {
    initStartMenu();
    initClock();
    exposeLegacyAPI();

    await ensureUser();
    await loadSystem();
});

/* =========================
   START MENU
========================= */

function initStartMenu() {
    const menu = document.getElementById("start-menu");
    const btn = document.getElementById("start-btn");

    if (!menu || !btn) return;

    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.style.display = menu.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", () => {
        menu.style.display = "none";
    });
}

/* =========================
   CLOCK
========================= */

function initClock() {
    const clock = document.getElementById("clock");
    if (!clock) return;

    const update = () => {
        const d = new Date();
        clock.textContent = d.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    update();
    setInterval(update, 1000);
}

/* =========================
   CLOUD LOAD
========================= */

async function loadSystem() {
    const drive = await loadDrive();

    fileSystem.files = drive || {};
    refresh();
}

/* =========================
   WINDOW SYSTEM (DRAG + RESIZE FIXED)
========================= */

document.addEventListener("mousemove", (e) => {

    if (dragState) {
        const win = dragState.win;

        win.style.left = (e.clientX - dragState.offsetX) + "px";
        win.style.top = (e.clientY - dragState.offsetY) + "px";
    }

    if (resizeState) {
        const win = resizeState.win;

        const dx = e.clientX - resizeState.startX;
        const dy = e.clientY - resizeState.startY;

        win.style.width = Math.max(220, resizeState.startWidth + dx) + "px";
        win.style.height = Math.max(160, resizeState.startHeight + dy) + "px";
    }
});

document.addEventListener("mouseup", () => {
    dragState = null;
    resizeState = null;
});

/* =========================
   WINDOW CORE
========================= */

window.openWindow = function (title, contentHTML) {
    const container = document.getElementById("windows-container");

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

        <div class="window-content">
            ${contentHTML}
        </div>

        <div class="resize-handle"></div>
    `;

    container.appendChild(win);

    const titlebar = win.querySelector(".title-bar");
    const closeBtn = win.querySelector(".close-btn");
    const resizeHandle = win.querySelector(".resize-handle");

    win.addEventListener("mousedown", () => {
        win.style.zIndex = ++zIndexCounter;
    });

    closeBtn.onclick = () => win.remove();

    titlebar.addEventListener("mousedown", (e) => {
        dragState = {
            win,
            offsetX: e.clientX - win.offsetLeft,
            offsetY: e.clientY - win.offsetTop
        };
    });

    resizeHandle.addEventListener("mousedown", (e) => {
        e.preventDefault();

        const rect = win.getBoundingClientRect();

        resizeState = {
            win,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: rect.width,
            startHeight: rect.height
        };
    });

    return win;
};

/* =========================
   FILE EXPLORER
========================= */

window.openFileExplorer = function () {
    openWindow("Files", renderFilesApp());
};

function renderFilesApp() {
    const files = fileSystem.files;

    return `
        <div style="padding:6px;">
            <button onclick="createFile()">New File</button>
            <button onclick="createNote()">New Note</button>

            <hr>

            ${Object.keys(files).map(id => `
                <div style="display:flex;justify-content:space-between;padding:4px;">
                    <span>${files[id].name}</span>
                    <div>
                        <button onclick="openFile('${id}')">Open</button>
                        <button onclick="deleteFile('${id}')">Delete</button>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}

/* =========================
   FILE SYSTEM
========================= */

window.createFile = async function () {
    const id = await cloudCreateFile("New File", "");
    await loadSystem();
    refresh();
};

window.openFile = function (id) {
    const file = fileSystem.files[id];
    if (!file) return;

    openWindow(file.name, `
        <textarea id="file_${id}" style="width:100%;height:85%;">${file.content || ""}</textarea>
        <button onclick="saveFile('${id}')">Save</button>
    `);
};

window.saveFile = async function (id) {
    const el = document.getElementById(`file_${id}`);
    if (!el) return;

    await cloudSaveFile(id, {
        name: fileSystem.files[id].name,
        content: el.value
    });

    await loadSystem();
};

window.deleteFile = async function (id) {
    await cloudDeleteFile(id);
    await loadSystem();
    refresh();
};

/* =========================
   NOTES (FIXED FULL SYSTEM)
========================= */

window.createNote = function () {
    const id = "note_" + Date.now();

    fileSystem.notes[id] = {
        name: "Untitled Note",
        content: ""
    };

    openNote(id);
    refresh();
};

window.openNotes = function () {
    let list = Object.keys(fileSystem.notes);

    openWindow("Notes", `
        <button onclick="createNote()">New Note</button>
        <hr>

        ${list.map(id => `
            <div style="padding:4px;cursor:pointer;" onclick="openNote('${id}')">
                ${fileSystem.notes[id].name}
            </div>
        `).join("")}
    `);
};

window.openNote = function (id) {
    currentNoteId = id;

    const note = fileSystem.notes[id];

    openWindow(note.name, `
        <input id="note_title_${id}" style="width:100%;" value="${note.name}">
        <textarea id="note_content_${id}" style="width:100%;height:80%;">${note.content}</textarea>
        <button onclick="saveNote('${id}')">Save</button>
    `);
};

window.saveNote = function (id) {
    const title = document.getElementById(`note_title_${id}`)?.value;
    const content = document.getElementById(`note_content_${id}`)?.value;

    fileSystem.notes[id] = {
        name: title,
        content: content
    };

    // convert note → real file
    const fileId = "file_" + id;

    cloudSaveFile(fileId, {
        name: title + ".txt",
        content: content
    });

    refresh();
};

/* =========================
   APP STUBS
========================= */

window.openAppStore = function () {
    openWindow("App Store", "<p>Store coming soon</p>");
};

/* =========================
   REFRESH
========================= */

function refresh() {
    document.querySelectorAll(".window").forEach(w => w.remove());
}

/* =========================
   LEGACY API
========================= */

function exposeLegacyAPI() {
    window.launchApp = openWindow;
}
