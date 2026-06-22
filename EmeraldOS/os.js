"use strict";

/* =========================
   CLOUD STORAGE IMPORT
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
   LOAD CLOUD DRIVE
========================= */

async function loadSystem() {
    fileSystem.files = await loadDrive() || {};
    renderAll();
}

/* =========================
   WINDOW SYSTEM (FIXED)
========================= */

document.addEventListener("mousemove", (e) => {
    if (dragState) {
        const w = dragState.win;
        w.style.left = (e.clientX - dragState.offX) + "px";
        w.style.top = (e.clientY - dragState.offY) + "px";
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
   WINDOW CREATION
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
            offX: e.clientX - win.offsetLeft,
            offY: e.clientY - win.offsetTop
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
   DESKTOP API
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
   FILES APP
========================= */

function renderFiles() {
    const files = fileSystem.files;

    return `
        <div>
            <button onclick="createCloudFile()">New File</button>
            <button onclick="uploadFile()">Upload</button>

            <hr/>

            ${Object.entries(files).map(([id, f]) => `
                <div style="display:flex;justify-content:space-between;padding:4px;">
                    <span>${f.name}</span>
                    <div>
                        <button onclick="openCloudFile('${id}')">Open</button>
                        <button onclick="renameFile('${id}')">Rename</button>
                        <button onclick="deleteCloudFile('${id}')">Delete</button>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}

/* =========================
   CLOUD FILE OPS
========================= */

window.createCloudFile = async () => {
    const id = await cloudCreateFile("New File", "");
    await loadSystem();
};

window.openCloudFile = (id) => {
    const f = fileSystem.files[id];
    if (!f) return;

    let html = "";

    // IMAGE FIX
    if (f.name.match(/\.(png|jpg|jpeg|gif)$/i)) {
        html = `<img src="${f.content}" style="max-width:100%">`;
    }

    // VIDEO FIX
    else if (f.name.match(/\.(mp4|webm)$/i)) {
        html = `<video controls style="max-width:100%"><source src="${f.content}"></video>`;
    }

    // TEXT DEFAULT
    else {
        html = `
            <textarea id="edit_${id}" style="width:100%;height:80%">${f.content || ""}</textarea>
            <button onclick="saveCloudFile('${id}')">Save</button>
        `;
    }

    openWindow(f.name, html);
};

window.saveCloudFile = async (id) => {
    const el = document.getElementById("edit_" + id);
    if (!el) return;

    await cloudSaveFile(id, {
        name: fileSystem.files[id].name,
        content: el.value
    });

    await loadSystem();
};

window.deleteCloudFile = async (id) => {
    await cloudDeleteFile(id);
    await loadSystem();
};

/* =========================
   FILE UPLOAD FIXED
========================= */

window.uploadFile = () => {
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

        if (file.type.startsWith("image") || file.type.startsWith("video")) {
            reader.readAsDataURL(file);
        } else {
            reader.readAsText(file);
        }
    };

    input.click();
};

/* =========================
   FILE RENAME FIX
========================= */

window.renameFile = async (id) => {
    const newName = prompt("Rename file:", fileSystem.files[id].name);
    if (!newName) return;

    await cloudSaveFile(id, {
        name: newName
    });

    await loadSystem();
};

/* =========================
   NOTES RESTORED
========================= */

function renderNotes() {
    const notes = fileSystem.notes;

    return `
        <div style="display:flex;height:100%;">
            <div style="width:40%;border-right:1px solid #999;padding:4px;">
                <button onclick="createNote()">New Note</button>

                ${Object.entries(notes).map(([id,n]) => `
                    <div onclick="openNote('${id}')">
                        ${n.name}
                    </div>
                `).join("")}
            </div>

            <div style="flex:1;padding:4px;">
                <input id="noteTitle" style="width:100%" placeholder="Title">
                <textarea id="noteContent" style="width:100%;height:80%"></textarea>
                <button onclick="saveNote()">Save</button>
            </div>
        </div>
    `;
}

window.createNote = () => {
    const id = "note_" + Date.now();
    fileSystem.notes[id] = { name: "Untitled", content: "" };
    renderAll();
};

window.openNote = (id) => {
    currentNote = id;

    setTimeout(() => {
        const n = fileSystem.notes[id];
        document.getElementById("noteTitle").value = n.name;
        document.getElementById("noteContent").value = n.content;
    }, 50);
};

window.saveNote = () => {
    const id = currentNote;
    if (!id) return;

    fileSystem.notes[id].name =
        document.getElementById("noteTitle").value;

    fileSystem.notes[id].content =
        document.getElementById("noteContent").value;

    renderAll();
};

/* =========================
   HELPERS
========================= */

function renderAll() {
    document.querySelectorAll(".window").forEach(w => w.remove());
}

/* =========================
   LEGACY API
========================= */

function exposeAPI() {
    window.launchApp = openWindow;
}
