"use strict";

/* =========================
   IMPORT CLOUD STORAGE
========================= */
import {
    loadDrive,
    createFile,
    saveFile as cloudSaveFile,
    deleteFile as cloudDeleteFile
} from "./cloudstorage.js";

/* =========================
   SYSTEM STATE
========================= */

let zIndexCounter = 100;

let dragState = null;
let resizeState = null;

let fileSystem = { files: {} };

const systemState = {
    brightness: Number(localStorage.getItem("brightness")) || 100,
    volume: Number(localStorage.getItem("volume")) || 80,
    username: localStorage.getItem("username") || "Guest"
};

/* =========================
   AUDIO SYSTEM
========================= */

let audioContext = null;
let masterGain = null;

function initAudioSystem() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioContext.createGain();
        masterGain.gain.value = systemState.volume / 100;
        masterGain.connect(audioContext.destination);
    } catch (e) {
        console.warn("Audio system not available:", e);
    }
}

function setVolume(val) {
    systemState.volume = Number(val);
    localStorage.setItem("volume", systemState.volume);

    if (masterGain) {
        masterGain.gain.value = systemState.volume / 100;
    }
}

/* =========================
   BRIGHTNESS SYSTEM
========================= */

function applyBrightness() {
    document.body.style.filter = `brightness(${systemState.brightness}%)`;
}

/* =========================
   BOOT
========================= */

window.addEventListener("DOMContentLoaded", async () => {
    initStartMenu();
    initClock();

    applyBrightness();
    initAudioSystem();

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
   CLOUD LOAD
========================= */

async function loadSystem() {
    fileSystem.files = await loadDrive();
}

/* =========================
   WINDOW SYSTEM (FIXED DRAG + RESIZE)
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
    openWindow("Cloud Files", renderFiles());
};

function renderFiles() {
    const files = fileSystem.files;

    return `
        <div style="padding:6px;">
            <button onclick="createFile()">New File</button>
            <button onclick="uploadFile()">Upload</button>

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
   FILE ACTIONS
========================= */

window.createFile = async function () {
    await createFile("New File", "");
    fileSystem.files = await loadDrive();
    openFileExplorer();
};

window.openFile = function (id) {
    const file = fileSystem.files[id];
    if (!file) return;

    openWindow(file.name, `
        <textarea id="file_${id}" style="width:100%;height:80%;">${file.content || ""}</textarea>
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

    fileSystem.files = await loadDrive();
};

window.deleteFile = async function (id) {
    await cloudDeleteFile(id);
    fileSystem.files = await loadDrive();
    openFileExplorer();
};

/* =========================
   SETTINGS / USER SYSTEM
========================= */

window.openSystemSettings = function () {
    openWindow("System Settings", `
        <div style="padding:10px;">
            <h3>Brightness</h3>
            <input type="range" min="10" max="150"
                value="${systemState.brightness}"
                oninput="setBrightness(this.value)">

            <h3>Volume</h3>
            <input type="range" min="0" max="100"
                value="${systemState.volume}"
                oninput="setVolume(this.value)">

            <h3>User</h3>
            <button onclick="openUserInfo()">User Info</button>
        </div>
    `);
};

window.setBrightness = function (val) {
    systemState.brightness = Number(val);
    localStorage.setItem("brightness", val);
    applyBrightness();
};

window.setVolume = setVolume;

window.openUserInfo = function () {
    openWindow("User Info", `
        <div style="padding:10px;">
            <p><b>User:</b> ${systemState.username}</p>
            <p><b>Brightness:</b> ${systemState.brightness}%</p>
            <p><b>Volume:</b> ${systemState.volume}%</p>

            <button onclick="logout()">Logout</button>
        </div>
    `);
};

window.logout = function () {
    localStorage.clear();
    window.location.href = "index.html";
};

/* =========================
   LEGACY API
========================= */

function exposeLegacyAPI() {
    window.launchApp = openWindow;
    window.openNotes = () => openWindow("Notes", "<p>Notes</p>");
    window.openAppStore = () => openWindow("Store", "<p>Store</p>");
}
