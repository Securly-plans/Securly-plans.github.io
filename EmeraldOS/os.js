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

let fileSystem = { files: {} };

let activeNoteId = null;

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
        const d = new Date();
        clock.textContent = d.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    tick();
    setInterval(tick, 1000);
}

/* =========================
   LOAD CLOUD SYSTEM
========================= */

async function loadSystem() {
    try {
        const drive = await loadDrive();
        fileSystem.files = drive || {};
    } catch (e) {
        console.warn("Cloud load failed:", e);
        fileSystem.files = {};
    }
}

/* =========================
   WINDOW SYSTEM
========================= */

document.addEventListener("mousemove", (e) => {
    if (dragState) {
        dragState.win.style.left = (e.clientX - dragState.offsetX) + "px";
        dragState.win.style.top = (e.clientY - dragState.offsetY) + "px";
    }

    if (resizeState) {
        const dx = e.clientX - resizeState.startX;
        const dy = e.clientY - resizeState.startY;

        resizeState.win.style.width =
            Math.max(240, resizeState.startWidth + dx) + "px";

        resizeState.win.style.height =
            Math.max(180, resizeState.startHeight + dy) + "px";
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

    win.style.top = "80px";
    win.style.left = "80px";
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

    const bar = win.querySelector(".title-bar");
    const close = win.querySelector(".close-btn");
    const resize = win.querySelector(".resize-handle");

    win.onmousedown = () => win.style.zIndex = ++zIndexCounter;

    close.onclick = () => win.remove();

    bar.onmousedown = (e) => {
        dragState = {
            win,
            offsetX: e.clientX - win.offsetLeft,
            offsetY: e.clientY - win.offsetTop
        };
    };

    resize.onmousedown = (e) => {
        e.preventDefault();
        resizeState = {
            win,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: win.offsetWidth,
            startHeight: win.offsetHeight
        };
    };

    return win;
};

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
            <button onclick="createNewFile()">New File</button>
            <button onclick="uploadFile()">Upload</button>
            <hr>

            ${Object.entries(files).map(([id, f]) => `
                <div style="display:flex;justify-content:space-between;padding:4px;border-bottom:1px solid #ccc;">
                    <span>${f.name}</span>
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
   FILE OPS
========================= */

window.createNewFile = async function () {
    await cloudCreateFile("New File", "");
    await loadSystem();
    refresh();
};

window.openFile = function (id) {
    const f = fileSystem.files[id];
    if (!f) return;

    const type = detectType(f.name, f.content);

    let body = "";

    if (type === "image") {
        body = `<img src="${f.content}" style="max-width:100%;">`;
    } else if (type === "video") {
        body = `<video controls style="max-width:100%">
                    <source src="${f.content}">
                </video>`;
    } else {
        body = `
            <textarea id="file_${id}" style="width:100%;height:80%;">${f.content || ""}</textarea>
            <button onclick="saveFile('${id}')">Save</button>
        `;
    }

    openWindow(f.name, `<div style="display:flex;flex-direction:column;height:100%;">${body}</div>`);
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

window.renameFile = async function (id) {
    const f = fileSystem.files[id];
    if (!f) return;

    const name = prompt("Rename file:", f.name);
    if (!name) return;

    await cloudSaveFile(id, { name });
    await loadSystem();
    refresh();
};

window.deleteFile = async function (id) {
    await cloudDeleteFile(id);
    await loadSystem();
    refresh();
};

/* =========================
   UPLOAD (FIXED)
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
   NOTES (FULL FIXED UI)
========================= */

window.openNotes = function () {
    openWindow("Notes", renderNotes());
};

function renderNotes() {
    const notes = Object.entries(fileSystem.files)
        .filter(([_, f]) => f.type === "text/plain");

    return `
        <div style="display:flex;height:100%;">
            <div style="width:35%;border-right:1px solid #aaa;padding:6px;overflow:auto;">
                <button onclick="createNote()">+ New Note</button>
                <hr>

                ${notes.map(([id, n]) => `
                    <div style="padding:4px;cursor:pointer;border-bottom:1px solid #ddd;"
                         onclick="loadNote('${id}')">
                        📄 ${n.name}
                    </div>
                `).join("")}
            </div>

            <div style="flex:1;padding:6px;display:flex;flex-direction:column;">
                <input id="note_title" style="width:100%;" placeholder="Title">
                <textarea id="note_body" style="flex:1;width:100%;margin-top:6px;"></textarea>
                <button onclick="saveNote()">Save</button>
            </div>
        </div>
    `;
}

window.createNote = async function () {
    const id = await cloudCreateFile("New Note", "", "text/plain");
    await loadSystem();
    activeNoteId = id;
    refresh();
    openNotes();
};

window.loadNote = function (id) {
    const n = fileSystem.files[id];
    if (!n) return;

    activeNoteId = id;

    setTimeout(() => {
        const t = document.getElementById("note_title");
        const b = document.getElementById("note_body");

        if (t) t.value = n.name;
        if (b) b.value = n.content;
    }, 50);
};

window.saveNote = async function () {
    if (!activeNoteId) return;

    const name = document.getElementById("note_title")?.value || "Untitled";
    const content = document.getElementById("note_body")?.value || "";

    await cloudSaveFile(activeNoteId, {
        name,
        content,
        type: "text/plain"
    });

    await loadSystem();
    alert("Saved");
};

/* =========================
   TYPE DETECTION
========================= */

function detectType(name, content) {
    if (!content) return "text";

    if (content.startsWith("data:image")) return "image";
    if (content.startsWith("data:video")) return "video";

    if (/\.(png|jpg|jpeg|webp|gif)$/i.test(name)) return "image";
    if (/\.(mp4|webm|ogg)$/i.test(name)) return "video";

    return "text";
}

/* =========================
   REFRESH
========================= */

function refresh() {
    document.querySelectorAll(".window").forEach(w => w.remove());
}

/* =========================
   LEGACY EXPORTS (IMPORTANT FIX)
========================= */

function exposeLegacyAPI() {
    window.launchApp = openWindow;
    window.openFileExplorer = () => openFileExplorer();
    window.openAppStore = () => openWindow("App Store", "<p>Store</p>");
    window.openNotes = () => openNotes();
}
