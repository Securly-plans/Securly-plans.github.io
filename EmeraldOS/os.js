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
    files: {}
};

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
        menu.style.display = (menu.style.display === "flex") ? "none" : "flex";
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
    fileSystem.files = await loadDrive();
    renderExplorerIfOpen();
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
   FILE EXPLORER (NO RECURSION EVER)
========================= */

function renderFilesApp() {
    const files = fileSystem.files;

    return `
        <div style="padding:6px;">
            <button onclick="createNewFile()">New File</button>
            <button onclick="uploadFile()">Upload File</button>

            <hr>

            ${Object.keys(files).map(id => `
                <div style="display:flex;justify-content:space-between;padding:4px;border-bottom:1px solid #ddd;">
                    <span>${files[id].name}</span>
                    <div>
                        <button onclick="openFile('${id}')">Open</button>
                        <button onclick="removeFile('${id}')">Delete</button>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}

/* SAFE SINGLE ENTRY POINT */
window.openFileExplorer = function () {
    openWindow("Cloud Files", renderFilesApp());
};

/* =========================
   FILE ACTIONS (CLEAN)
========================= */

window.createNewFile = async function () {
    await cloudCreateFile("New File", "");
    await loadSystem();
    refreshWindows();
};

window.openFile = function (id) {
    const file = fileSystem.files?.[id];
    if (!file) return;

    openWindow(
        file.name,
        `
        <div style="display:flex;flex-direction:column;height:100%;">
            <textarea id="file_${id}" style="flex:1;width:100%;">${file.content || ""}</textarea>
            <button onclick="saveOpenedFile('${id}')">Save</button>
        </div>
        `
    );
};

window.saveOpenedFile = async function (id) {
    const el = document.getElementById(`file_${id}`);
    if (!el) return;

    await cloudSaveFile(id, {
        name: fileSystem.files[id].name,
        content: el.value
    });

    await loadSystem();
};

window.removeFile = async function (id) {
    await cloudDeleteFile(id);
    await loadSystem();
    refreshWindows();
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
            refreshWindows();
        };

        reader.readAsText(file);
    };

    input.click();
};

/* =========================
   UI REFRESH
========================= */

function refreshWindows() {
    document.querySelectorAll(".window").forEach(w => w.remove());
}

/* =========================
   LEGACY API (SAFE)
========================= */

function exposeLegacyAPI() {
    window.launchApp = openWindow;

    window.openNotes = () =>
        openWindow("Notes", "<p>Notes placeholder</p>");

    window.openAppStore = () =>
        openWindow("App Store", "<p>Store placeholder</p>");
}

/* optional re-render hook */
function renderExplorerIfOpen() {
    // safe no-op for now
}
