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
}

/* =========================
   WINDOW DRAG / RESIZE ENGINE
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
   CORE WINDOW SYSTEM
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

        <div class="window-content">
            ${html}
        </div>

        <div class="resize-handle"></div>
    `;

    container.appendChild(win);

    const titleBar = win.querySelector(".title-bar");
    const closeBtn = win.querySelector(".close-btn");
    const resizeHandle = win.querySelector(".resize-handle");

    closeBtn.onclick = () => win.remove();

    win.onmousedown = () => {
        win.style.zIndex = ++zIndexCounter;
    };

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
   LEGACY API
========================= */

function exposeAPI() {
    window.launchApp = openWindow;
}

/* =========================
   APP SYSTEM (FILES + NOTES)
========================= */

window.fileSystem = window.fileSystem || { files: {} };

/* =========================
   FILE EXPLORER
========================= */

window.openFileExplorer = function () {
    openWindow("Files", renderFileExplorer());
};

function renderFileExplorer() {

    const files = fileSystem.files;

    return `
        <div style="padding:6px;">

            <button onclick="createFile()">New File</button>
            <button onclick="uploadFile()">Upload</button>

            <hr>

            ${Object.entries(files).map(([id, f]) => `
                <div style="display:flex;justify-content:space-between;padding:4px;">
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

/* =========================
   FILE OPS
========================= */

window.createFile = async function () {
    await cloudCreateFile("New File", "");
    await loadSystem();
};

window.deleteFile = async function (id) {
    await cloudDeleteFile(id);
    await loadSystem();
};

window.renameFile = async function (id) {

    const file = fileSystem.files[id];
    if (!file) return;

    const name = prompt("Rename file:", file.name);
    if (!name) return;

    await cloudSaveFile(id, { name });
    await loadSystem();
};

/* =========================
   OPEN FILE (MEDIA FIXED)
========================= */

window.openFile = function (id) {

    const file = fileSystem.files[id];
    if (!file) return;

    let body = "";

    if (file.content?.startsWith("data:image")) {
        body = `<img src="${file.content}" style="max-width:100%">`;
    }
    else if (file.content?.startsWith("data:video")) {
        body = `<video controls style="max-width:100%">
                    <source src="${file.content}">
                </video>`;
    }
    else {
        body = `
            <textarea id="file_${id}" style="width:100%;height:85%">
${file.content || ""}
            </textarea>

            <button onclick="saveFile('${id}')">Save</button>
        `;
    }

    openWindow(file.name, body);
};

/* =========================
   SAVE FILE
========================= */

window.saveFile = async function (id) {

    const el = document.getElementById(`file_${id}`);
    if (!el) return;

    await cloudSaveFile(id, {
        name: fileSystem.files[id].name,
        content: el.value
    });

    await loadSystem();
};

/* =========================
   DOWNLOAD FILE (NEW)
========================= */

window.downloadFile = function (id) {

    const file = fileSystem.files[id];
    if (!file) return;

    const blob = new Blob(
        [file.content || ""],
        { type: "text/plain" }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = file.name || "file.txt";
    a.click();

    URL.revokeObjectURL(url);
};

/* =========================
   UPLOAD
========================= */

window.uploadFile = function () {

    const input = document.createElement("input");
    input.type = "file";

    input.onchange = (e) => {

        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = async () => {

            await cloudCreateFile(
                file.name,
                reader.result
            );

            await loadSystem();
        };

        reader.readAsDataURL(file);
    };

    input.click();
};

/* =========================
   NOTES APP (FIXED)
========================= */

window.openNotes = function () {

    openWindow("Notes", `
        <input id="note_title"
               placeholder="Title"
               style="width:100%">

        <textarea id="note_body"
                  style="width:100%;height:75%"></textarea>

        <button onclick="saveNote()">Save</button>
    `);
};

window.saveNote = async function () {

    const title =
        document.getElementById("note_title").value;

    const body =
        document.getElementById("note_body").value;

    await cloudCreateFile(
        title || "New Note",
        body
    );

    await loadSystem();
};
