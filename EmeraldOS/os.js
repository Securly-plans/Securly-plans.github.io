"use strict";

/* =========================
   STATE
========================= */

let zIndexCounter = 100;

let installedApps = [];
let appRegistry = {};

// virtual file system
let fileSystem = {
    notes: {},
    files: {}
};

let currentFile = null;

/* =========================
   BOOT
========================= */

window.addEventListener("DOMContentLoaded", () => {
    initStartMenu();
    initClock();
    initDesktop();

    loadSystem();
    renderAll();

    exposeLegacyAPI();
});

/* =========================
   START MENU
========================= */

function initStartMenu() {
    const btn = document.getElementById("startButton");
    const menu = document.getElementById("startMenu");

    if (!btn || !menu) return;

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
   DESKTOP
========================= */

function initDesktop() {
    const desktop = document.getElementById("desktop");
    if (!desktop) return;

    desktop.addEventListener("click", () => {
        document.getElementById("startMenu")?.classList.remove("show");
    });

    // SAVE BUTTON (dashboard requirement)
    const saveBtn = document.getElementById("saveButton");
    if (saveBtn) {
        saveBtn.addEventListener("click", saveSystem);
    }
}

/* =========================
   LOAD / SAVE SYSTEM
========================= */

function loadSystem() {
    try {
        installedApps = JSON.parse(localStorage.getItem("installedApps")) || [];
        fileSystem = JSON.parse(localStorage.getItem("fileSystem")) || fileSystem;
    } catch {
        installedApps = [];
    }

    if (installedApps.length === 0) {
        installedApps = [
            { id: "notes", name: "Notes", icon: "📄" },
            { id: "files", name: "Files", icon: "📁" },
            { id: "store", name: "App Store", icon: "🛒" }
        ];
    }

    appRegistry = {};
    installedApps.forEach(a => appRegistry[a.id] = a);
}

function saveSystem() {
    localStorage.setItem("installedApps", JSON.stringify(installedApps));
    localStorage.setItem("fileSystem", JSON.stringify(fileSystem));

    alert("System saved");
}

/* =========================
   RENDER
========================= */

function renderAll() {
    renderDesktop();
    renderStartMenu();
}

/* =========================
   DESKTOP
========================= */

function renderDesktop() {
    const desktop = document.getElementById("desktop");
    if (!desktop) return;

    desktop.querySelectorAll(".app-icon").forEach(e => e.remove());

    installedApps.forEach(app => {
        const el = document.createElement("div");
        el.className = "app-icon";
        el.innerHTML = `${app.icon}<br>${app.name}`;
        el.onclick = () => launchApp(app.id);
        desktop.appendChild(el);
    });
}

/* =========================
   START MENU
========================= */

function renderStartMenu() {
    const menu = document.getElementById("startMenu");
    if (!menu) return;

    menu.innerHTML = "";

    installedApps.forEach(app => {
        const el = document.createElement("div");
        el.className = "start-item";
        el.textContent = `${app.icon} ${app.name}`;
        el.onclick = () => launchApp(app.id);
        menu.appendChild(el);
    });
}

/* =========================
   APP LAUNCHER
========================= */

function launchApp(id) {
    const app = appRegistry[id];
    if (!app) return;

    createWindow(app);
}

function createWindow(app) {
    const win = document.createElement("div");
    win.className = "window";
    win.style.zIndex = ++zIndexCounter;

    win.innerHTML = `
        <div class="titlebar">
            <span>${app.icon} ${app.name}</span>
            <button class="close">X</button>
        </div>
        <div class="content">Loading...</div>
    `;

    document.body.appendChild(win);

    win.querySelector(".close").onclick = () => win.remove();

    setTimeout(() => {
        const content = win.querySelector(".content");
        content.innerHTML = getApp(app.id, win);
    }, 80);
}

/* =========================
   APPS
========================= */

function getApp(id, win) {
    switch (id) {

        /* ================= NOTES ================= */
        case "notes":
            return notesApp();

        /* ================= FILES ================= */
        case "files":
            return filesApp();

        /* ================= STORE ================= */
        case "store":
            return storeApp();

        default:
            return "App not found";
    }
}

/* =========================
   NOTES APP (FULL)
========================= */

function notesApp() {
    const notes = fileSystem.notes;

    return `
        <div style="display:flex;height:100%;">
            <div style="width:35%;border-right:1px solid #444;padding:5px;">
                <button onclick="createNote()">+ New Note</button>
                <div id="noteList">
                    ${Object.keys(notes).map(id => `
                        <div onclick="openNote('${id}')">
                            ${notes[id].name}
                            <button onclick="deleteNote('${id}');event.stopPropagation()">x</button>
                        </div>
                    `).join("")}
                </div>
            </div>

            <div style="flex:1;padding:5px;">
                <input id="noteTitle" placeholder="Title" style="width:100%;">
                <textarea id="noteContent" style="width:100%;height:80%;"></textarea>
                <button onclick="saveNote()">Save Note</button>
            </div>
        </div>
    `;
}

window.createNote = function () {
    const id = "note_" + Date.now();
    fileSystem.notes[id] = { name: "Untitled", content: "" };
    renderAll();
};

window.openNote = function (id) {
    currentFile = id;
    const n = fileSystem.notes[id];

    setTimeout(() => {
        const t = document.getElementById("noteTitle");
        const c = document.getElementById("noteContent");
        if (t && c) {
            t.value = n.name;
            c.value = n.content;
        }
    }, 50);
};

window.saveNote = function () {
    if (!currentFile) return;

    const t = document.getElementById("noteTitle").value;
    const c = document.getElementById("noteContent").value;

    fileSystem.notes[currentFile] = {
        name: t,
        content: c
    };

    saveSystem();
    renderAll();
};

window.deleteNote = function (id) {
    delete fileSystem.notes[id];
    if (currentFile === id) currentFile = null;
    renderAll();
};

/* =========================
   FILES APP
========================= */

function filesApp() {
    const files = fileSystem.files;

    return `
        <div>
            <button onclick="createFile()">New File</button>
            <div>
                ${Object.keys(files).map(id => `
                    <div>
                        ${files[id].name}
                        <button onclick="openFile('${id}')">Open</button>
                        <button onclick="deleteFile('${id}')">Delete</button>
                    </div>
                `).join("")}
            </div>
        </div>
    `;
}

window.createFile = function () {
    const id = "file_" + Date.now();
    fileSystem.files[id] = { name: "New File", content: "" };
    renderAll();
};

window.openFile = function (id) {
    const f = fileSystem.files[id];
    const text = prompt("Edit file:", f.content);
    if (text !== null) {
        f.content = text;
        saveSystem();
    }
};

window.deleteFile = function (id) {
    delete fileSystem.files[id];
    renderAll();
};

/* =========================
   APP STORE (FIXED BASIC)
========================= */

function storeApp() {
    return `
        <div>
            <h3>App Store</h3>

            <button onclick="installApp('calculator')">Install Calculator</button>
            <button onclick="installApp('paint')">Install Paint</button>
        </div>
    `;
}

window.installApp = function (id) {
    if (appRegistry[id]) return;

    const app = {
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1),
        icon: "📦"
    };

    installedApps.push(app);
    appRegistry[id] = app;

    saveSystem();
    renderAll();
};

/* =========================
   LEGACY FIXES (YOUR ERRORS)
========================= */

function exposeLegacyAPI() {
    window.openWindow = launchApp;
    window.openNotes = () => launchApp("notes");
    window.openFileExplorer = () => launchApp("files");
    window.openAppStore = () => launchApp("store");
    window.launchApp = launchApp;
}
