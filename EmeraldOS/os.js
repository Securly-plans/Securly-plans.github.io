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
   STORAGE
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
   WINDOW CREATOR
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
                                <span>${files[id].name}</span>
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
   FILE CREATE
========================= */

window.createFile = function () {
    const id = "file_" + Date.now();

    fileSystem.files[id] = {
        name: "New File.txt",
        type: "text/plain",
        mode: "text",
        content: ""
    };

    saveSystem();
    openFileExplorer();
};

/* =========================
   FILE OPEN (FIXED MEDIA SUPPORT)
========================= */

window.openFile = function (id) {
    const file = fileSystem.files[id];
    if (!file) return;

    let content = "";

    if (file.mode === "image") {
        content = `<img src="${file.content}" style="max-width:100%;height:auto;">`;
    }

    else if (file.mode === "video") {
        content = `<video controls src="${file.content}" style="max-width:100%;"></video>`;
    }

    else {
        content = `
            <div style="display:flex;flex-direction:column;height:100%;">
                <textarea id="file_${id}" style="flex:1;width:100%;">${file.content || ""}</textarea>
                <button onclick="saveFile('${id}')">Save</button>
            </div>
        `;
    }

    openWindow(file.name, content);
};

/* =========================
   SAVE FILE
========================= */

window.saveFile = function (id) {
    const el = document.getElementById(`file_${id}`);
    if (!el) return;

    fileSystem.files[id].content = el.value;
    saveSystem();
};

/* =========================
   DELETE FILE
========================= */

window.deleteFile = function (id) {
    delete fileSystem.files[id];
    saveSystem();
    openFileExplorer();
};

/* =========================
   UPLOAD FILE (FIXED MEDIA DETECTION)
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

            const isImage = file.type.startsWith("image/");
            const isVideo = file.type.startsWith("video/");

            fileSystem.files[id] = {
                name: file.name,
                type: file.type,
                content: reader.result,
                mode: isImage ? "image" : isVideo ? "video" : "text"
            };

            saveSystem();
            openFileExplorer();
        };

        reader.readAsDataURL(file);
    };

    input.click();
};

/* =========================
   NOTES (FIXED)
========================= */

window.openNotes = function () {
    openWindow("Notes", `<p>Notes placeholder (upgrade coming next)</p>`);
};

/* =========================
   LEGACY API
========================= */

function exposeLegacyAPI() {
    window.launchApp = openWindow;
}
