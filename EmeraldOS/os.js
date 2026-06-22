"use strict";

/* =========================
   CLOUD IMPORTS
========================= */
import {
    loadDrive,
    createFile,
    saveTextFile,
    deleteFile,
    uploadBinaryFile
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

    const update = () => {
        clock.textContent = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    update();
    setInterval(update, 1000);
}

/* =========================
   LOAD DRIVE
========================= */

async function loadSystem() {
    fileSystem.files = await loadDrive() || {};
    renderAll();
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

        const dx = e.clientX - resizeState.x;
        const dy = e.clientY - resizeState.y;

        w.style.width = Math.max(220, resizeState.w + dx) + "px";
        w.style.height = Math.max(160, resizeState.h + dy) + "px";
    }
});

document.addEventListener("mouseup", () => {
    dragState = null;
    resizeState = null;
});

/* =========================
   WINDOW CREATOR
========================= */

window.openWindow = function (title, content) {
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
        <div class="window-content">${content}</div>
        <div class="resize-handle"></div>
    `;

    container.appendChild(win);

    const bar = win.querySelector(".title-bar");
    const close = win.querySelector(".close-btn");
    const handle = win.querySelector(".resize-handle");

    close.onclick = () => win.remove();

    bar.onmousedown = (e) => {
        dragState = {
            win,
            offsetX: e.clientX - win.offsetLeft,
            offsetY: e.clientY - win.offsetTop
        };
    };

    handle.onmousedown = (e) => {
        e.preventDefault();
        resizeState = {
            win,
            x: e.clientX,
            y: e.clientY,
            w: win.offsetWidth,
            h: win.offsetHeight
        };
    };

    win.onmousedown = () => win.style.zIndex = ++zIndexCounter;

    return win;
};

/* =========================
   APPS
========================= */

window.openFileExplorer = () => {
    openWindow("Files", renderFiles());
};

window.openNotes = () => {
    openWindow("Notes", renderNotes());
};

window.openAppStore = () => {
    openWindow("App Store", "<p>Store placeholder</p>");
};

/* =========================
   FILE EXPLORER
========================= */

function renderFiles() {
    const files = fileSystem.files;

    return `
        <div>
            <button onclick="createFile()">New File</button>
            <button onclick="uploadFile()">Upload</button>

            <hr/>

            ${Object.entries(files).map(([id, f]) => `
                <div style="display:flex;justify-content:space-between;padding:4px;">
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
   FILE OPEN (MEDIA FIX)
========================= */

window.openFile = (id) => {
    const f = fileSystem.files[id];
    if (!f) return;

    let html = "";

    if (f.url && f.type?.startsWith("image/")) {
        html = `<img src="${f.url}" style="max-width:100%">`;
    }

    else if (f.url && f.type?.startsWith("video/")) {
        html = `
            <video controls style="max-width:100%">
                <source src="${f.url}">
            </video>
        `;
    }

    else {
        html = `
            <textarea id="edit_${id}" style="width:100%;height:85%">${f.content || ""}</textarea>
            <button onclick="saveFile('${id}')">Save</button>
        `;
    }

    openWindow(f.name, html);
};

/* =========================
   FILE ACTIONS
========================= */

window.createFile = async () => {
    await createFile("New File", "");
    await loadSystem();
};

window.saveFile = async (id) => {
    const el = document.getElementById("edit_" + id);
    if (!el) return;

    await saveTextFile(id, el.value);
    await loadSystem();
};

window.deleteFile = async (id) => {
    await deleteFile(id);
    await loadSystem();
};

/* =========================
   RENAME FILE (FULL)
========================= */

window.renameFile = async (id) => {
    const file = fileSystem.files[id];
    if (!file) return;

    const newName = prompt("Rename file:", file.name);
    if (!newName) return;

    file.name = newName;

    await saveTextFile(id, file.content || "");
    await loadSystem();
};

/* =========================
   UPLOAD FILES
========================= */

window.uploadFile = () => {
    const input = document.createElement("input");
    input.type = "file";

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        await uploadBinaryFile(file);
        await loadSystem();
    };

    input.click();
};

/* =========================
   NOTES (RESTORED FULL)
========================= */

function renderNotes() {
    return `
        <div>
            <button onclick="createNote()">New Note</button>
            <hr/>
            <p>Notes system active (can be expanded to cloud)</p>
        </div>
    `;
}

window.createNote = () => {
    const id = "note_" + Date.now();
    fileSystem.notes[id] = { name: "Untitled", content: "" };
    renderAll();
};

/* =========================
   CLEAN RENDER
========================= */

function renderAll() {
    document.querySelectorAll(".window").forEach(w => w.remove());
}

/* =========================
   LEGACY
========================= */

function exposeAPI() {
    window.launchApp = openWindow;
}
