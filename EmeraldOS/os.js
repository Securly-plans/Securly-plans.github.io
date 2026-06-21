"use strict";

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
let currentFile = null;

/* =========================
   BOOT
========================= */

window.addEventListener("DOMContentLoaded", () => {
    initStartMenu();
    initClock();
    exposeLegacyAPI();
    loadSystem();
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
        menu.classList.toggle("show");
    });

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
   STORAGE (LOCAL ONLY)
========================= */

function loadSystem() {
    try {
        const saved = JSON.parse(localStorage.getItem("fileSystem"));
        if (saved) fileSystem = saved;
    } catch {
        fileSystem = { files: {}, notes: {} };
    }
}

function saveSystem() {
    localStorage.setItem("fileSystem", JSON.stringify(fileSystem));
}

/* =========================
   WINDOW SYSTEM (FIXED DRAG + RESIZE)
========================= */

document.addEventListener("mousemove", (e) => {

    /* DRAG */
    if (dragState) {
        const win = dragState.win;
        win.style.left = (e.clientX - dragState.offsetX) + "px";
        win.style.top = (e.clientY - dragState.offsetY) + "px";
    }

    /* RESIZE */
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
   CORE WINDOW SYSTEM
========================= */

window.openWindow = function (title, contentHTML) {
    const container = document.getElementById("windows-container");

    const win = document.createElement("div");
    win.className = "window";

    win.style.position = "absolute";
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

    const titlebar = win.querySelector(".title-bar");
    const closeBtn = win.querySelector(".close-btn");
    const resizeHandle = win.querySelector(".resize-handle");

    win.addEventListener("mousedown", () => {
        win.style.zIndex = ++zIndexCounter;
    });

    closeBtn.onclick = () => win.remove();

    /* DRAG */
    titlebar.addEventListener("mousedown", (e) => {
        dragState = {
            win,
            offsetX: e.clientX - win.offsetLeft,
            offsetY: e.clientY - win.offsetTop
        };
        win.style.zIndex = ++zIndexCounter;
    });

    /* RESIZE */
    resizeHandle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const rect = win.getBoundingClientRect();

        resizeState = {
            win,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: rect.width,
            startHeight: rect.height
        };

        win.style.zIndex = ++zIndexCounter;
    });

    return win;
};

/* =========================
   REFRESH SAFE
========================= */

function refresh() {
    document.querySelectorAll(".window").forEach(w => w.remove());
}

/* =========================
   NOTES APP (FIXED FULL)
========================= */

window.openNotes = function () {
    openWindow("Notes", renderNotesApp());
};

function renderNotesApp() {
    const notes = fileSystem.notes;

    return `
        <div style="display:flex;height:100%;">
            
            <div style="width:35%;border-right:1px solid #999;padding:5px;">
                <button onclick="createNote()">+ New Note</button>

                <div>
                    ${Object.keys(notes).map(id => `
                        <div style="display:flex;justify-content:space-between;padding:4px;">
                            <span onclick="openNote('${id}')">${notes[id].name}</span>
                            <button onclick="deleteNote('${id}')">x</button>
                        </div>
                    `).join("")}
                </div>
            </div>

            <div style="flex:1;padding:5px;display:flex;flex-direction:column;">
                <input id="noteTitle" placeholder="Title" style="margin-bottom:6px;">
                <textarea id="noteContent" style="flex:1;"></textarea>
                <button onclick="saveNote()">Save</button>
            </div>

        </div>
    `;
}

window.createNote = function () {
    const id = "note_" + Date.now();
    fileSystem.notes[id] = { name: "Untitled", content: "" };
    saveSystem();
    refresh();
    openNotes();
};

window.openNote = function (id) {
    currentNote = id;

    setTimeout(() => {
        const n = fileSystem.notes[id];
        const t = document.getElementById("noteTitle");
        const c = document.getElementById("noteContent");

        if (t && c) {
            t.value = n.name;
            c.value = n.content;
        }
    }, 50);
};

window.saveNote = function () {
    if (!currentNote) return;

    const t = document.getElementById("noteTitle");
    const c = document.getElementById("noteContent");

    if (!t || !c) return;

    fileSystem.notes[currentNote] = {
        name: t.value,
        content: c.value
    };

    saveSystem();
    refresh();
    openNotes();
};

window.deleteNote = function (id) {
    delete fileSystem.notes[id];
    saveSystem();
    refresh();
    openNotes();
};

/* =========================
   FILE EXPLORER (FIXED UI)
========================= */

window.openFileExplorer = function () {
    openWindow("Files", renderFilesApp());
};

function renderFilesApp() {
    const files = fileSystem.files;

    return `
        <div style="padding:6px;display:flex;flex-direction:column;height:100%;">

            <div style="display:flex;gap:6px;margin-bottom:8px;">
                <button onclick="createFile()">New File</button>
                <button onclick="uploadFile()">Upload File</button>
                <button onclick="openFileExplorer()">Refresh</button>
            </div>

            <div style="flex:1;overflow:auto;background:white;border:1px solid #aaa;">
                ${
                    Object.keys(files).length === 0
                        ? `<div style="padding:8px;">No files</div>`
                        : Object.keys(files).map(id => `
                            <div style="display:flex;justify-content:space-between;padding:6px;border-bottom:1px solid #ddd;">
                                <span>📄 ${files[id].name}</span>
                                <div>
                                    <button onclick="openFile('${id}')">Open</button>
                                    <button onclick="deleteFile('${id}')">Delete</button>
                                </div>
                            </div>
                        `).join("")
                }
            </div>
        </div>
    `;
}

/* =========================
   FILE ACTIONS (FIXED)
========================= */

window.createFile = function () {
    const id = "file_" + Date.now();
    fileSystem.files[id] = {
        name: "New File.txt",
        content: ""
    };

    saveSystem();
    openFileExplorer();
};

window.openFile = function (id) {
    const file = fileSystem.files[id];
    if (!file) return;

    openWindow(file.name, `
        <div style="display:flex;flex-direction:column;height:100%;">
            <textarea id="file_${id}" style="flex:1;">${file.content}</textarea>
            <button onclick="saveFile('${id}')">Save</button>
        </div>
    `);
};

window.saveFile = function (id) {
    const el = document.getElementById(`file_${id}`);
    if (!el) return;

    fileSystem.files[id].content = el.value;
    saveSystem();
};

window.deleteFile = function (id) {
    delete fileSystem.files[id];
    saveSystem();
    openFileExplorer();
};

/* =========================
   UPLOAD (FIXED WORKING)
========================= */

window.uploadFile = function () {
    const input = document.createElement("input");
    input.type = "file";

    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = () => {
            const id = "file_" + Date.now();

            fileSystem.files[id] = {
                name: file.name,
                content: reader.result
            };

            saveSystem();
            openFileExplorer();
        };

        reader.readAsText(file);
    };

    input.click();
};

/* =========================
   LEGACY API
========================= */

function exposeLegacyAPI() {
    window.launchApp = openWindow;
}
