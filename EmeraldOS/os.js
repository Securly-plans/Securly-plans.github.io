"use strict";

/* =========================
   STATE
========================= */

let zIndex = 100;
let currentNoteId = null;

let notes = JSON.parse(localStorage.getItem("emerald_notes") || "{}");
let files = JSON.parse(localStorage.getItem("emerald_files") || "{}");

/* =========================
   BOOT
========================= */

window.addEventListener("DOMContentLoaded", () => {
    initStartMenu();
    initStartButton();
});

/* =========================
   START MENU
========================= */

function initStartMenu() {
    const menu = document.getElementById("start-menu");

    document.addEventListener("click", (e) => {
        const startBtn = document.getElementById("start-btn");

        if (startBtn && startBtn.contains(e.target)) return;

        if (menu) menu.classList.remove("show");
    });
}

/* =========================
   START BUTTON
========================= */

function initStartButton() {
    const btn = document.getElementById("start-btn");
    const menu = document.getElementById("start-menu");

    if (!btn || !menu) return;

    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.classList.toggle("show");
    });
}

/* =========================
   CORE WINDOW SYSTEM
========================= */

window.openWindow = function (title, content) {
    const container = document.getElementById("windows-container");
    if (!container) return;

    const win = document.createElement("div");
    win.className = "window";
    win.style.zIndex = ++zIndex;

    win.innerHTML = `
        <div class="title-bar">
            <div>${title}</div>
            <button class="close-btn">X</button>
        </div>
        <div class="window-content">
            ${content}
        </div>
    `;

    win.querySelector(".close-btn").onclick = () => win.remove();

    container.appendChild(win);
};

/* =========================
   LEGACY APP WRAPPERS (FIXES YOUR ERRORS)
========================= */

window.openNotes = function () {
    openNotesApp();
};

window.openFileExplorer = function () {
    openFileExplorerApp();
};

window.openAppStore = function () {
    openAppStoreApp();
};

/* =========================
   NOTES (FULL FIXED APP)
========================= */

function openNotesApp() {
    const id = Date.now().toString();
    currentNoteId = id;

    const html = `
        <div style="display:flex; height:100%;">
            
            <div style="width:35%; border-right:1px solid #aaa; padding:5px; overflow:auto;">
                <button onclick="createNote()">+ New Note</button>
                <div id="noteList"></div>
            </div>

            <div style="flex:1; padding:5px;">
                <input id="noteTitle" placeholder="Title" style="width:100%; margin-bottom:5px;">
                <textarea id="noteContent" style="width:100%; height:80%;"></textarea>
                <button onclick="saveNote()">Save</button>
            </div>

        </div>
    `;

    openWindow("Notes", html);

    setTimeout(renderNotesList, 50);
}

function renderNotesList() {
    const list = document.getElementById("noteList");
    if (!list) return;

    list.innerHTML = "";

    Object.keys(notes).forEach(id => {
        const n = notes[id];

        const div = document.createElement("div");
        div.style.padding = "4px";
        div.style.cursor = "pointer";
        div.style.borderBottom = "1px solid #ccc";

        div.innerHTML = `
            ${n.title || "Untitled"}
            <button style="float:right;" onclick="deleteNote('${id}')">x</button>
        `;

        div.onclick = () => loadNote(id);

        list.appendChild(div);
    });
}

window.createNote = function () {
    const id = Date.now().toString();

    notes[id] = {
        title: "New Note",
        content: ""
    };

    saveNotes();
    renderNotesList();
};

function loadNote(id) {
    const note = notes[id];
    if (!note) return;

    currentNoteId = id;

    const title = document.getElementById("noteTitle");
    const content = document.getElementById("noteContent");

    if (title) title.value = note.title;
    if (content) content.value = note.content;
}

window.saveNote = function () {
    if (!currentNoteId) return;

    const title = document.getElementById("noteTitle")?.value || "Untitled";
    const content = document.getElementById("noteContent")?.value || "";

    notes[currentNoteId] = { title, content };

    saveNotes();
    renderNotesList();
};

window.deleteNote = function (id) {
    delete notes[id];
    saveNotes();
    renderNotesList();
};

function saveNotes() {
    localStorage.setItem("emerald_notes", JSON.stringify(notes));
}

/* =========================
   FILE EXPLORER (FIXED)
========================= */

function openFileExplorerApp() {
    const html = `
        <div>
            <button onclick="createFile()">New File</button>
            <div id="fileList"></div>
        </div>
    `;

    openWindow("Files", html);

    setTimeout(renderFiles, 50);
}

function renderFiles() {
    const list = document.getElementById("fileList");
    if (!list) return;

    list.innerHTML = "";

    Object.keys(files).forEach(id => {
        const f = files[id];

        const div = document.createElement("div");
        div.style.padding = "4px";
        div.style.borderBottom = "1px solid #ccc";

        div.innerHTML = `
            ${f.name}
            <button onclick="deleteFile('${id}')">Delete</button>
            <button onclick="editFile('${id}')">Open</button>
        `;

        list.appendChild(div);
    });
}

window.createFile = function () {
    const id = Date.now().toString();

    files[id] = {
        name: "New File",
        content: ""
    };

    saveFiles();
    renderFiles();
};

window.editFile = function (id) {
    const f = files[id];
    const text = prompt("Edit file content:", f.content);

    if (text !== null) {
        f.content = text;
        saveFiles();
    }
};

window.deleteFile = function (id) {
    delete files[id];
    saveFiles();
    renderFiles();
};

function saveFiles() {
    localStorage.setItem("emerald_files", JSON.stringify(files));
}

/* =========================
   APP STORE (FIXED + CLEAN)
========================= */

function openAppStoreApp() {
    const html = `
        <div>
            <h3>App Store</h3>

            <button onclick="installApp('calculator')">Install Calculator</button>
            <button onclick="installApp('media')">Install Media Player</button>
            <button onclick="installApp('games')">Install Games Hub</button>
        </div>
    `;

    openWindow("App Store", html);
}

window.installApp = function (id) {
    alert(id + " installed (demo only)");
};

/* =========================
   FIX GAMES / MEDIA PLAYER
   (your HTML already handles these)
========================= */

window.openGames = function () {
    openWindow(
        "Games",
        `<iframe src="https://securly-plans.github.io/EmeraldOS/home.html"
        style="width:100%; height:100%; border:none;"></iframe>`
    );
};

window.openMediaPlayer = function () {
    openWindow(
        "Media Player",
        `<iframe src="https://securly-plans.github.io/EmeraldOS/mediaplayer.html"
        style="width:100%; height:100%; border:none;"></iframe>`
    );
};
