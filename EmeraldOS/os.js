"use strict";

/* =========================
   STATE
========================= */

let zIndex = 100;
let drag = null;
let resize = null;

let fileSystem = { files: {} };

let activeNote = null;
let activeDoc = null;

const minimized = new Map();
const maximized = new Map();

/* =========================
   BOOT
========================= */

window.addEventListener("DOMContentLoaded", () => {
    initStartMenu();
    initClock();
});

/* =========================
   START MENU FIX
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
    const c = document.getElementById("clock");
    setInterval(() => {
        c.textContent = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    }, 1000);
}

/* =========================
   WINDOW CORE + MIN/MAX FIX
========================= */

window.openWindow = function (title, html, iframe = false, appId = null) {
    const container = document.getElementById("windows-container");

    const win = document.createElement("div");
    win.className = "window";
    win.style.left = "80px";
    win.style.top = "80px";
    win.style.zIndex = ++zIndex;

    win.innerHTML = `
        <div class="title-bar">
            <span>${title}</span>
            <div>
                <button onclick="minimizeWindow(this)">_</button>
                <button onclick="maximizeWindow(this)">□</button>
                <button onclick="closeWindow(this)">X</button>
            </div>
        </div>

        <div class="window-content">${html}</div>
        <div class="resize-handle"></div>
    `;

    container.appendChild(win);

    const bar = win.querySelector(".title-bar");

    bar.onmousedown = (e) => {
        drag = {
            win,
            x: e.clientX - win.offsetLeft,
            y: e.clientY - win.offsetTop
        };
    };

    win.onmousedown = () => win.style.zIndex = ++zIndex;

    win.querySelector(".resize-handle").onmousedown = (e) => {
        resize = {
            win,
            x: e.clientX,
            y: e.clientY,
            w: win.offsetWidth,
            h: win.offsetHeight
        };
    };

    return win;
};

window.closeWindow = (btn) => btn.closest(".window").remove();

window.minimizeWindow = (btn) => {
    const win = btn.closest(".window");
    win.style.display = "none";
    minimized.set(win, true);
};

window.maximizeWindow = (btn) => {
    const win = btn.closest(".window");

    if (maximized.get(win)) {
        win.style.width = "420px";
        win.style.height = "300px";
        win.style.left = "80px";
        win.style.top = "80px";
        maximized.set(win, false);
    } else {
        win.style.left = "0";
        win.style.top = "0";
        win.style.width = "100%";
        win.style.height = "calc(100% - 40px)";
        maximized.set(win, true);
    }
};

document.addEventListener("mousemove", (e) => {
    if (drag) {
        drag.win.style.left = (e.clientX - drag.x) + "px";
        drag.win.style.top = (e.clientY - drag.y) + "px";
    }

    if (resize) {
        resize.win.style.width = Math.max(220, resize.w + (e.clientX - resize.x)) + "px";
        resize.win.style.height = Math.max(160, resize.h + (e.clientY - resize.y)) + "px";
    }
});

document.addEventListener("mouseup", () => {
    drag = null;
    resize = null;
});

/* =========================
   FILE SYSTEM (.note / .doc)
========================= */

function saveFile(name, content, type) {
    const id = crypto.randomUUID();
    fileSystem.files[id] = { name, content, type };
}

/* =========================
   FILE EXPLORER
========================= */

window.openFileExplorer = function () {
    let html = "";

    for (const [id, f] of Object.entries(fileSystem.files)) {
        html += `
        <div>
            ${f.name}
            <button onclick="openFile('${id}')">Open</button>
            <button onclick="deleteFile('${id}')">Delete</button>
        </div>`;
    }

    openWindow("Files", html);
};

window.openFile = function (id) {
    const f = fileSystem.files[id];
    openWindow(f.name, `<pre>${f.content}</pre>`);
};

window.deleteFile = function (id) {
    delete fileSystem.files[id];
    openFileExplorer();
};

/* =========================
   NOTES (.note)
========================= */

window.openNotes = function () {
    let list = "";

    for (const [id, f] of Object.entries(fileSystem.files)) {
        if (f.type !== "note") continue;

        list += `<div onclick="loadNote('${id}')">📄 ${f.name}</div>`;
    }

    openWindow("Notes", `
        <button onclick="createNote()">New Note</button>
        ${list}
        <hr>
        <input id="note_title">
        <textarea id="note_body"></textarea>
        <button onclick="saveNote()">Save</button>
    `);
};

window.createNote = function () {
    saveFile("New Note.note", "", "note");
    openNotes();
};

window.loadNote = function (id) {
    activeNote = id;
    const f = fileSystem.files[id];
    setTimeout(() => {
        document.getElementById("note_title").value = f.name;
        document.getElementById("note_body").value = f.content;
    }, 50);
};

window.saveNote = function () {
    const f = fileSystem.files[activeNote];
    f.name = document.getElementById("note_title").value;
    f.content = document.getElementById("note_body").value;
    openNotes();
};

/* =========================
   DOCS (.doc + formatting)
========================= */

window.openDocs = function () {
    let list = "";

    for (const [id, f] of Object.entries(fileSystem.files)) {
        if (f.type !== "doc") continue;

        list += `<div onclick="loadDoc('${id}')">📘 ${f.name}</div>`;
    }

    openWindow("Docs", `
        <button onclick="createDoc()">New Doc</button>
        ${list}
        <hr>

        <button onclick="bold()">B</button>
        <button onclick="italic()">I</button>

        <input id="doc_title">
        <div contenteditable="true" id="doc_body"
            style="height:200px;border:1px solid #aaa;"></div>

        <button onclick="saveDoc()">Save</button>
    `);
};

window.createDoc = function () {
    saveFile("New Doc.doc", "", "doc");
    openDocs();
};

window.loadDoc = function (id) {
    activeDoc = id;
    const f = fileSystem.files[id];

    setTimeout(() => {
        document.getElementById("doc_title").value = f.name;
        document.getElementById("doc_body").innerHTML = f.content;
    }, 50);
};

window.saveDoc = function () {
    const f = fileSystem.files[activeDoc];
    f.name = document.getElementById("doc_title").value;
    f.content = document.getElementById("doc_body").innerHTML;
    openDocs();
};

window.bold = () => document.execCommand("bold");
window.italic = () => document.execCommand("italic");

/* =========================
   SYSTEM PANEL FIX
========================= */

window.openSystemApp = function () {
    openWindow("System", `
        <div>User: ${localStorage.getItem("username") || "Guest"}</div>

        <button onclick="clearAll()">Close All</button>
        <button onclick="location.reload()">Restart</button>

        <br><br>

        Brightness:
        <input type="range" oninput="document.body.style.filter='brightness('+this.value+'%)'">

        Volume:
        <input type="range" min="0" max="1" step="0.01"
            oninput="document.querySelectorAll('audio,video').forEach(a=>a.volume=this.value)">
    `);
};

window.clearAll = () => document.querySelectorAll(".window").forEach(w => w.remove());

/* =========================
   APP STORE
========================= */

window.openAppStore = function () {
    openWindow("App Store", "<h2>Working ✔</h2>");
};

/* =========================
   LEGACY FIX
========================= */

window.launchApp = window.openWindow;
