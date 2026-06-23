"use strict";

/* =========================
   CLOUD STORAGE IMPORTS
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

let windows = {};
let minimized = new Set();
let maximized = new Set();

/* =========================
   BOOT
========================= */

window.addEventListener("DOMContentLoaded", async () => {
    initStartMenu();
    initClock();
    exposeGlobals();
    await loadSystem();
});

/* =========================
   GLOBAL FUNCTION FIX (IMPORTANT)
========================= */

function exposeGlobals() {
    // desktop icons + start menu safety
    window.openFileExplorer = openFileExplorer;
    window.openSystemApp = openSystemApp;
    window.openAppStore = openAppStore;
    window.openNotes = openNotes;
    window.openDocs = openDocs;
    window.openCalculator = openCalculator;
    window.openClockApp = openClockApp;
}

/* =========================
   START MENU
========================= */

function initStartMenu() {
    const menu = document.getElementById("start-menu");
    const btn = document.getElementById("start-btn");

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

    setInterval(() => {
        clock.textContent = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    }, 1000);
}

/* =========================
   LOAD DRIVE
========================= */

async function loadSystem() {
    fileSystem.files = await loadDrive() || {};
}

/* =========================
   WINDOW SYSTEM (WIN95 CORE)
========================= */

window.openWindow = function (title, html, app = "") {
    const container = document.getElementById("windows-container");

    const id = crypto.randomUUID();

    const win = document.createElement("div");
    win.className = "window";
    win.dataset.id = id;
    win.dataset.app = app;

    win.style.left = "120px";
    win.style.top = "80px";
    win.style.zIndex = ++zIndexCounter;

    win.innerHTML = `
        <div class="title-bar">
            <span>${title}</span>
            <div class="win-controls">
                <button onclick="minimizeWindow('${id}')">_</button>
                <button onclick="maximizeWindow('${id}')">[ ]</button>
                <button onclick="closeWindow('${id}')">X</button>
            </div>
        </div>

        <div class="window-content">${html}</div>
        <div class="resize-handle"></div>
    `;

    container.appendChild(win);

    windows[id] = win;

    enableDrag(win);
    enableResize(win);
    addTaskbarButton(id, title);

    return win;
};

/* =========================
   WINDOW CONTROLS
========================= */

window.closeWindow = function (id) {
    windows[id]?.remove();
    delete windows[id];
    removeTaskbarButton(id);
};

window.minimizeWindow = function (id) {
    const win = windows[id];
    if (!win) return;

    win.style.display = "none";
    minimized.add(id);
};

window.restoreWindow = function (id) {
    const win = windows[id];
    if (!win) return;

    win.style.display = "block";
    win.style.zIndex = ++zIndexCounter;
    minimized.delete(id);
};

window.maximizeWindow = function (id) {
    const win = windows[id];
    if (!win) return;

    if (!maximized.has(id)) {
        win.dataset.prev = JSON.stringify({
            left: win.style.left,
            top: win.style.top,
            width: win.style.width,
            height: win.style.height
        });

        win.style.left = "0";
        win.style.top = "0";
        win.style.width = "100vw";
        win.style.height = "calc(100vh - 40px)";

        maximized.add(id);
    } else {
        const prev = JSON.parse(win.dataset.prev || "{}");

        win.style.left = prev.left;
        win.style.top = prev.top;
        win.style.width = prev.width;
        win.style.height = prev.height;

        maximized.delete(id);
    }
};

/* =========================
   TASKBAR
========================= */

function addTaskbarButton(id, title) {
    const bar = document.getElementById("taskbar-apps");

    const btn = document.createElement("button");
    btn.id = "tb_" + id;
    btn.textContent = title;

    btn.onclick = () => {
        const win = windows[id];
        if (!win) return;

        if (win.style.display === "none") restoreWindow(id);
        else minimizeWindow(id);
    };

    bar.appendChild(btn);
}

function removeTaskbarButton(id) {
    document.getElementById("tb_" + id)?.remove();
}

/* =========================
   DRAG + RESIZE
========================= */

function enableDrag(win) {
    const bar = win.querySelector(".title-bar");

    bar.onmousedown = (e) => {
        dragState = {
            win,
            x: e.clientX - win.offsetLeft,
            y: e.clientY - win.offsetTop
        };
    };
}

function enableResize(win) {
    const h = win.querySelector(".resize-handle");

    h.onmousedown = (e) => {
        const r = win.getBoundingClientRect();

        resizeState = {
            win,
            x: e.clientX,
            y: e.clientY,
            w: r.width,
            h: r.height
        };
    };
}

document.addEventListener("mousemove", (e) => {
    if (dragState) {
        dragState.win.style.left = (e.clientX - dragState.x) + "px";
        dragState.win.style.top = (e.clientY - dragState.y) + "px";
    }

    if (resizeState) {
        resizeState.win.style.width =
            Math.max(220, resizeState.w + (e.clientX - resizeState.x)) + "px";

        resizeState.win.style.height =
            Math.max(160, resizeState.h + (e.clientY - resizeState.y)) + "px";
    }
});

document.addEventListener("mouseup", () => {
    dragState = null;
    resizeState = null;
});

/* =========================
   FILE EXPLORER (FULL WORKING)
========================= */

window.openFileExplorer = function () {
    openWindow("Files", renderFileExplorer(), "files");
};

function renderFileExplorer() {
    return `
        <div style="padding:8px">

            <button onclick="createFile()">New File</button>
            <button onclick="uploadFile()">Upload</button>
            <button onclick="downloadAllFiles()">Download All</button>

            <hr>

            ${Object.entries(fileSystem.files).map(([id, f]) => `
                <div style="display:flex;justify-content:space-between;">
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

/* FILE OPS */

window.createFile = async () => {
    await cloudCreateFile("New File", "");
    await loadSystem();
};

window.deleteFile = async (id) => {
    await cloudDeleteFile(id);
    await loadSystem();
};

window.renameFile = async (id) => {
    const f = fileSystem.files[id];
    const name = prompt("Rename:", f.name);
    if (!name) return;

    await cloudSaveFile(id, { name });
    await loadSystem();
};

window.downloadFile = (id) => {
    const f = fileSystem.files[id];
    const blob = new Blob([f.content || ""], { type: "text/plain" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = f.name;
    a.click();
};

window.uploadFile = () => {
    const input = document.createElement("input");
    input.type = "file";

    input.onchange = async (e) => {
        const file = e.target.files[0];
        const r = new FileReader();

        r.onload = async () => {
            await cloudCreateFile(file.name, r.result);
            await loadSystem();
        };

        r.readAsDataURL(file);
    };

    input.click();
};

/* =========================
   FILE OPEN (WORKING)
========================= */

window.openFile = function (id) {
    const f = fileSystem.files[id];
    if (!f) return;

    let body;

    if (f.content?.startsWith("data:image")) {
        body = `<img src="${f.content}" style="max-width:100%">`;
    } else {
        body = `
            <input id="t_${id}" value="${f.name}">
            <textarea id="b_${id}" style="width:100%;height:80%">${f.content}</textarea>
            <button onclick="saveOpenedFile('${id}')">Save</button>
        `;
    }

    openWindow(f.name, body, "file");
};

window.saveOpenedFile = async (id) => {
    await cloudSaveFile(id, {
        name: document.getElementById("t_" + id)?.value,
        content: document.getElementById("b_" + id)?.value
    });

    await loadSystem();
};

/* =========================
   NOTES (.note)
========================= */

window.openNotes = function () {
    openWindow("Notes", renderNotes(), "notes");
};

function renderNotes() {
    const notes = Object.entries(fileSystem.files)
        .filter(([_, f]) => f.name?.endsWith(".note"));

    return `
        <div style="padding:8px">

            <button onclick="createNote()">New Note</button>

            <hr>

            ${notes.map(([id, f]) => `
                <div onclick="loadNote('${id}')">${f.name}</div>
            `).join("")}

            <hr>

            <input id="note_title">
            <textarea id="note_body"></textarea>

            <button onclick="saveNote()">Save</button>

        </div>
    `;
}

window.createNote = async () => {
    await cloudCreateFile("New note.note", "");
    await loadSystem();
};

window.loadNote = function (id) {
    activeNoteId = id;

    setTimeout(() => {
        const f = fileSystem.files[id];
        document.getElementById("note_title").value = f.name;
        document.getElementById("note_body").value = f.content;
    }, 50);
};

window.saveNote = async () => {
    const title = document.getElementById("note_title").value;

    await cloudSaveFile(activeNoteId, {
        name: title.endsWith(".note") ? title : title + ".note",
        content: document.getElementById("note_body").value
    });

    await loadSystem();
};

/* =========================
   DOCS (.doc + FONT CONTROL)
========================= */

window.openDocs = function () {
    openWindow("Docs", renderDocs(), "docs");
};

function renderDocs() {
    const docs = Object.entries(fileSystem.files)
        .filter(([_, f]) => f.name?.endsWith(".doc"));

    return `
        <div style="padding:8px">

            <button onclick="createDoc()">New Doc</button>

            <hr>

            ${docs.map(([id, f]) => `
                <div onclick="loadDoc('${id}')">${f.name}</div>
            `).join("")}

            <hr>

            <input id="doc_title">

            <select id="fontFamily">
                <option>Arial</option>
                <option>Georgia</option>
                <option>Courier New</option>
                <option>Times New Roman</option>
            </select>

            <select id="fontSize">
                <option>12px</option>
                <option>14px</option>
                <option>18px</option>
                <option>22px</option>
            </select>

            <button onclick="document.execCommand('bold')">B</button>
            <button onclick="document.execCommand('italic')">I</button>

            <div id="doc_editor" contenteditable="true"
                style="height:200px;border:1px solid #aaa;padding:6px"></div>

            <button onclick="saveDoc()">Save</button>

        </div>
    `;
}

window.createDoc = async () => {
    await cloudCreateFile("New doc.doc", "");
    await loadSystem();
};

window.loadDoc = function (id) {
    activeDocId = id;

    setTimeout(() => {
        const f = fileSystem.files[id];
        document.getElementById("doc_title").value = f.name;
        document.getElementById("doc_editor").innerHTML = f.content;
    }, 50);
};

window.saveDoc = async () => {
    const title = document.getElementById("doc_title").value;

    await cloudSaveFile(activeDocId, {
        name: title.endsWith(".doc") ? title : title + ".doc",
        content: document.getElementById("doc_editor").innerHTML
    });

    await loadSystem();
};

/* =========================
   SYSTEM PANEL (FULL)
========================= */

window.openSystemApp = function () {
    openWindow("System", `
        <div style="padding:10px">

            <button onclick="closeAllWindows()">Close All</button>
            <button onclick="location.reload()">Refresh OS</button>
            <button onclick="logout()">Logout</button>

            <br><br>

            <label>Brightness</label>
            <input type="range" min="10" max="100"
                oninput="setBrightness(this.value)">

            <br>

            <label>Volume</label>
            <input type="range" min="0" max="1" step="0.01"
                oninput="setVolume(this.value)">

        </div>
    `, "system");
};

window.closeAllWindows = function () {
    Object.values(windows).forEach(w => w.remove());
    windows = {};
    document.getElementById("taskbar-apps").innerHTML = "";
};

window.logout = function () {
    localStorage.clear();
    location.href = "index.html";
};

window.setBrightness = function (v) {
    let o = document.getElementById("brightness-overlay");
    if (!o) {
        o = document.createElement("div");
        o.id = "brightness-overlay";
        o.style = "position:fixed;inset:0;background:black;pointer-events:none;z-index:9999;";
        document.body.appendChild(o);
    }
    o.style.opacity = (100 - v) / 100;
};

window.setVolume = function (v) {
    document.querySelectorAll("video,audio").forEach(e => e.volume = v);
};

/* =========================
   SIMPLE APPS (KEEP SAFE)
========================= */

window.openCalculator = () => openWindow("Calculator", "<div>Calculator</div>");
window.openClockApp = () => openWindow("Clock", "<div>Clock</div>");
window.openAppStore = () => openWindow("App Store", "<div>Store</div>");

/* =========================
   EXPOSE
========================= */

function exposeAPI() {
    window.launchApp = openWindow;
}
