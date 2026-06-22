"use strict";

/* =========================
   IMPORT CLOUD STORAGE
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

let fileSystem = {
    files: {},
    notes: {}
};

let currentNote = null;

/* =========================
   BOOT
========================= */

window.addEventListener("DOMContentLoaded", async () => {
    initStartMenu();
    initClock();
    exposeLegacyAPI();

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
        menu.style.display = menu.style.display === "flex" ? "none" : "flex";
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
   LOAD SYSTEM
========================= */

async function loadSystem() {
    try {
        fileSystem.files = await loadDrive() || {};
    } catch (e) {
        console.warn("Drive load failed:", e);
        fileSystem.files = {};
    }

    refresh();
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
   CORE WINDOW
========================= */

window.openWindow = function (title, contentHTML) {
    const container = document.getElementById("windows-container");
    if (!container) return;

    const win = document.createElement("div");
    win.className = "window";

    win.style.top = "80px";
    win.style.left = "80px";
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

    const titleBar = win.querySelector(".title-bar");
    const closeBtn = win.querySelector(".close-btn");
    const resizeHandle = win.querySelector(".resize-handle");

    win.addEventListener("mousedown", () => {
        win.style.zIndex = ++zIndexCounter;
    });

    closeBtn.onclick = () => win.remove();

    /* DRAG */
    titleBar.addEventListener("mousedown", (e) => {
        dragState = {
            win,
            offsetX: e.clientX - win.offsetLeft,
            offsetY: e.clientY - win.offsetTop
        };
    });

    /* RESIZE */
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
   FILE EXPLORER (FIXED + SAFE)
========================= */

window.openFileExplorer = function () {
    openWindow("Files", renderFileExplorer());
};

function renderFileExplorer() {
    const files = fileSystem.files;

    return `
        <div style="padding:6px;">
            <button onclick="createNewFile()">New File</button>
            <button onclick="uploadFile()">Upload</button>
            <hr/>

            ${Object.entries(files).map(([id, file]) => `
                <div style="display:flex;justify-content:space-between;padding:4px;border-bottom:1px solid #ccc;">
                    <span>${file.name}</span>

                    <div>
                        <button onclick="openFile('${id}')">Open</button>
                        <button onclick="renameFile('${id}')">Rename</button>
                        <button onclick="deleteFile('${id}')">Delete</button>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}

/* =========================
   FILE ACTIONS (CLOUD)
========================= */

window.createNewFile = async function () {
    await cloudCreateFile("New File", "");
    await loadSystem();
    refresh();
};

window.openFile = function (id) {
    const file = fileSystem.files[id];
    if (!file) return;

    const type = detectFileType(file.name, file.content);

    let body = "";

    if (type === "image") {
        body = `<img src="${file.content}" style="max-width:100%;">`;
    }
    else if (type === "video") {
        body = `<video controls style="max-width:100%;">
                    <source src="${file.content}">
                </video>`;
    }
    else {
        body = `
            <textarea id="file_${id}" style="width:100%;height:80%;">${file.content || ""}</textarea>
            <button onclick="saveFile('${id}')">Save</button>
        `;
    }

    openWindow(file.name, `<div style="height:100%;display:flex;flex-direction:column;">${body}</div>`);
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

/* =========================
   RENAME (FIXED)
========================= */

window.renameFile = async function (id) {
    const file = fileSystem.files[id];
    if (!file) return;

    const newName = prompt("Rename file:", file.name);
    if (!newName) return;

    await cloudSaveFile(id, {
        name: newName
    });

    await loadSystem();
    refresh();
};

/* =========================
   DELETE
========================= */

window.deleteFile = async function (id) {
    await cloudDeleteFile(id);
    await loadSystem();
    refresh();
};

/* =========================
   UPLOAD (BASE64 SAFE)
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
            refresh();
        };

        reader.readAsDataURL(file);
    };

    input.click();
};

/* =========================
   NOTES (RESTORED)
========================= */

window.openNotes = function () {
    const id = "note_" + Date.now();

    openWindow("Notes", `
        <input id="note_title" placeholder="Title" style="width:100%;">
        <textarea id="note_body" style="width:100%;height:80%;"></textarea>
        <button onclick="saveNote('${id}')">Save Note</button>
    `);
};

window.saveNote = function (id) {
    const title = document.getElementById("note_title").value;
    const body = document.getElementById("note_body").value;

    fileSystem.files[id] = {
        name: title,
        content: body,
        type: "text/plain"
    };

    cloudCreateFile(title, body);
    refresh();
};

/* =========================
   TYPE DETECTION
========================= */

function detectFileType(name, content) {
    if (!content) return "text";

    if (content.startsWith("data:image")) return "image";
    if (content.startsWith("data:video")) return "video";

    if (name.match(/\.(png|jpg|jpeg|gif|webp)$/i)) return "image";
    if (name.match(/\.(mp4|webm|ogg)$/i)) return "video";

    return "text";
}

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
