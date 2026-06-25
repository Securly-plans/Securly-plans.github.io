"use strict";

/* =========================================================
   EMERALDOS 3.1 - CORE SYSTEM
   Part 1: Boot + Globals + System Services
========================================================= */

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
   GLOBAL STATE
========================= */

let zIndexCounter = 100;

let dragState = null;
let resizeState = null;

let sessionSaveTimer = null;

let fileSystem = { files: {} };

let activeNoteId = null;
let activeDocId = null;

/* Window + taskbar tracking */
const taskbarButtons = new Map();

/* =========================
   BOOT SEQUENCE
========================= */

window.addEventListener("DOMContentLoaded", async () => {

    initStartMenu();
    initClock();
    initNotifications();
    initTheme();

    exposeAPI();

    await loadSystem();

    notify("System", "EmeraldOS 3.1 loaded successfully");
});

/* =========================
   CLOCK
========================= */

function initClock() {

    const clock = document.getElementById("clock");
    if (!clock) return;

    const tick = () => {

        clock.textContent =
            new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            });

    };

    tick();
    setInterval(tick, 1000);
}

/* =========================
   NOTIFICATIONS SYSTEM
========================= */

function initNotifications() {
    if (!document.getElementById("notifications")) {
        const div = document.createElement("div");
        div.id = "notifications";
        document.body.appendChild(div);
    }
}

window.notify = function (title, message) {

    const container =
        document.getElementById("notifications");

    if (!container) return;

    const el = document.createElement("div");

    el.className = "notification";

    el.innerHTML = `
        <strong>${title}</strong><br>
        ${message}
    `;

    container.appendChild(el);

    setTimeout(() => el.remove(), 4000);
};

/* =========================
   THEME SYSTEM
========================= */

function initTheme() {

    const theme =
        localStorage.getItem("os_theme") ||
        "classic";

    document.body.dataset.theme = theme;
}

window.setTheme = function (theme) {

    document.body.dataset.theme = theme;

    localStorage.setItem("os_theme", theme);

    notify("Theme", `Switched to ${theme}`);
};

/* =========================
   SESSION SAVE SYSTEM
========================= */

function saveSession() {

    clearTimeout(sessionSaveTimer);

    sessionSaveTimer = setTimeout(() => {

        const session = [];

        document.querySelectorAll(".window").forEach(win => {

            session.push({
                title: win.dataset.title,
                app: win.dataset.app,
                left: win.style.left,
                top: win.style.top,
                width: win.style.width,
                height: win.style.height,
                minimized: win.dataset.minimized === "true",
                maximized: win.dataset.maximized === "true"
            });

        });

        localStorage.setItem(
            "emerald_session",
            JSON.stringify(session)
        );

    }, 500);

}

/* expose for later parts */
window.saveSession = saveSession;

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

    document.addEventListener("click", () => {
        menu.classList.remove("show");
    });
}

/* =========================
   API EXPOSURE
========================= */

function exposeAPI() {

    window.launchApp = openWindow;
}

"use strict";

/* =========================================================
   PART 2 — WINDOW MANAGER
========================================================= */

/* =========================
   FOCUS SYSTEM
========================= */

function focusWindow(win) {

    win.style.zIndex = ++zIndexCounter;

    document
        .querySelectorAll(".task-btn")
        .forEach(btn => btn.classList.remove("active"));

    const btn = taskbarButtons.get(win);
    if (btn) btn.classList.add("active");
}

/* =========================
   TASKBAR BUTTONS
========================= */

function createTaskButton(title, win) {

    const bar = document.getElementById("taskbar-apps");
    if (!bar) return;

    const btn = document.createElement("button");

    btn.className = "task-btn";
    btn.textContent = title;

    btn.onclick = () => {

        if (win.dataset.minimized === "true") {
            win.style.display = "flex";
            win.dataset.minimized = "false";
        }

        focusWindow(win);
    };

    bar.appendChild(btn);

    taskbarButtons.set(win, btn);

    return btn;
}

/* =========================
   MAIN WINDOW SYSTEM
========================= */

window.openWindow = function (title, html, app = "") {

    const container = document.getElementById("windows-container");
    if (!container) return;

    const win = document.createElement("div");

    win.className = "window";

    win.dataset.title = title;
    win.dataset.app = app;

    win.dataset.minimized = "false";
    win.dataset.maximized = "false";

    win.style.left = "120px";
    win.style.top = "80px";
    win.style.width = "520px";
    win.style.height = "360px";

    win.style.zIndex = ++zIndexCounter;

    win.innerHTML = `
        <div class="title-bar">
            <span>${title}</span>

            <div class="window-buttons">
                <button class="min-btn">_</button>
                <button class="max-btn">□</button>
                <button class="close-btn">X</button>
            </div>
        </div>

        <div class="window-content">
            ${html}
        </div>

        <div class="resize-handle"></div>
    `;

    container.appendChild(win);

    /* register taskbar button */
    createTaskButton(title, win);

    focusWindow(win);

    /* bring to front */
    win.onmousedown = () => focusWindow(win);

    /* =========================
       CLOSE
    ========================= */

    win.querySelector(".close-btn").onclick = () => {

        const btn = taskbarButtons.get(win);
        if (btn) btn.remove();

        taskbarButtons.delete(win);

        win.remove();

        saveSession();
    };

    /* =========================
       MINIMIZE
    ========================= */

    win.querySelector(".min-btn").onclick = () => {

        win.style.display = "none";
        win.dataset.minimized = "true";

        saveSession();
    };

    /* =========================
       MAXIMIZE / RESTORE
    ========================= */

    win.querySelector(".max-btn").onclick = () => {

        const isMax = win.dataset.maximized === "true";

        if (isMax) {

            win.style.left = win.dataset.oldLeft;
            win.style.top = win.dataset.oldTop;
            win.style.width = win.dataset.oldWidth;
            win.style.height = win.dataset.oldHeight;

            win.dataset.maximized = "false";

        } else {

            win.dataset.oldLeft = win.style.left;
            win.dataset.oldTop = win.style.top;
            win.dataset.oldWidth = win.style.width;
            win.dataset.oldHeight = win.style.height;

            win.style.left = "0";
            win.style.top = "0";
            win.style.width = "100vw";
            win.style.height = "calc(100vh - 40px)";

            win.dataset.maximized = "true";
        }

        saveSession();
    };

    /* =========================
       DRAGGING
    ========================= */

    const titleBar = win.querySelector(".title-bar");

    titleBar.onmousedown = (e) => {

        dragState = {
            win,
            offsetX: e.clientX - win.offsetLeft,
            offsetY: e.clientY - win.offsetTop
        };
    };

    /* =========================
       RESIZE
    ========================= */

    const resize = win.querySelector(".resize-handle");

    resize.onmousedown = (e) => {

        e.preventDefault();

        resizeState = {
            win,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: win.offsetWidth,
            startHeight: win.offsetHeight
        };
    };

    saveSession();

    return win;
};

/* =========================
   GLOBAL DRAG + RESIZE ENGINE
========================= */

document.addEventListener("mousemove", (e) => {

    if (dragState) {

        const w = dragState.win;

        w.style.left =
            (e.clientX - dragState.offsetX) + "px";

        w.style.top =
            (e.clientY - dragState.offsetY) + "px";

        saveSession();
    }

    if (resizeState) {

        const w = resizeState.win;

        const dx = e.clientX - resizeState.startX;
        const dy = e.clientY - resizeState.startY;

        w.style.width =
            Math.max(220, resizeState.startWidth + dx) + "px";

        w.style.height =
            Math.max(160, resizeState.startHeight + dy) + "px";

        saveSession();
    }
});

document.addEventListener("mouseup", () => {
    dragState = null;
    resizeState = null;
});

"use strict";

/* =========================================================
   PART 3 — FILE SYSTEM CORE (CLOUD DRIVE INTEGRATION)
========================================================= */

/* =========================
   LOAD SYSTEM (CLOUD DRIVE)
========================= */

async function loadSystem() {

    try {
        fileSystem.files = await loadDrive() || {};
    } catch (err) {
        console.warn("Drive load failed:", err);
        fileSystem.files = {};
    }

    rerenderApps();
}

/* =========================
   LIVE APP RERENDER
========================= */

function rerenderApps() {

    const windows =
        document.querySelectorAll(".window[data-app]");

    windows.forEach(win => {

        const app = win.dataset.app;
        const content = win.querySelector(".window-content");

        if (!content) return;

        if (app === "files") {
            content.innerHTML = renderFileExplorer();
        }

        if (app === "notes") {
            content.innerHTML = renderNotes();
        }

        if (app === "docs") {
            content.innerHTML = renderDocs();
        }

        if (app === "calendar") {
            content.innerHTML = renderCalendar();
        }
    });
}

/* =========================
   FILE EXPLORER
========================= */

window.openFileExplorer = function () {
    openWindow("Files", renderFileExplorer(), "files");
};

function renderFileExplorer() {

    const files = fileSystem.files || {};

    return `
        <div style="padding:6px">

            <button onclick="createFile()">New File</button>
            <button onclick="uploadFile()">Upload</button>
            <button onclick="downloadAllFiles()">Backup</button>

            <hr>

            ${Object.entries(files).map(([id, f]) => `
                <div style="display:flex;justify-content:space-between;padding:4px;border-bottom:1px solid #ccc">

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

/* =========================
   CREATE FILE
========================= */

window.createFile = async function () {

    await cloudCreateFile(
        "New File",
        ""
    );

    await loadSystem();

    notify("Files", "File created");
};

/* =========================
   DELETE FILE
========================= */

window.deleteFile = async function (id) {

    await cloudDeleteFile(id);

    await loadSystem();

    notify("Files", "File deleted");
};

/* =========================
   OPEN FILE (MEDIA SAFE)
========================= */

window.openFile = function (id) {

    const file = fileSystem.files[id];
    if (!file) return;

    let body = "";

    if (file.content?.startsWith("data:image")) {

        body = `
            <img src="${file.content}"
            style="max-width:100%">
        `;
    }

    else if (file.content?.startsWith("data:video")) {

        body = `
            <video controls style="max-width:100%">
                <source src="${file.content}">
            </video>
        `;
    }

    else {

        body = `
            <textarea id="file_${id}"
                style="width:100%;height:90%">
                ${file.content || ""}
            </textarea>

            <button onclick="saveFile('${id}')">
                Save
            </button>
        `;
    }

    openWindow(file.name, body);
};

/* =========================
   SAVE FILE
========================= */

window.saveFile = async function (id) {

    const el =
        document.getElementById(`file_${id}`);

    if (!el) return;

    await cloudSaveFile(id, {
        name: fileSystem.files[id].name,
        content: el.value
    });

    await loadSystem();

    notify("Files", "File saved");
};

/* =========================
   RENAME FILE
========================= */

window.renameFile = async function (id) {

    const file = fileSystem.files[id];
    if (!file) return;

    const name = prompt("Rename file:", file.name);

    if (!name) return;

    await cloudSaveFile(id, {
        name
    });

    await loadSystem();

    notify("Files", "File renamed");
};

/* =========================
   DOWNLOAD FILE
========================= */

window.downloadFile = function (id) {

    const file = fileSystem.files[id];
    if (!file) return;

    const blob = new Blob(
        [file.content || ""],
        { type: "text/plain" }
    );

    const a = document.createElement("a");

    a.href = URL.createObjectURL(blob);
    a.download = file.name || "file.txt";

    a.click();
};

/* =========================
   BACKUP ALL FILES
========================= */

window.downloadAllFiles = function () {

    const data = Object.values(fileSystem.files || [])
        .map(f =>
            `${f.name}\n\n${f.content}\n\n---\n`
        )
        .join("");

    const blob = new Blob(
        [data],
        { type: "text/plain" }
    );

    const a = document.createElement("a");

    a.href = URL.createObjectURL(blob);
    a.download = "emeraldos_backup.txt";

    a.click();
};

/* =========================
   UPLOAD FILE
========================= */

window.uploadFile = function () {

    const input =
        document.createElement("input");

    input.type = "file";

    input.onchange = (e) => {

        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = async () => {

            await cloudCreateFile(
                file.name,
                reader.result
            );

            await loadSystem();

            notify("Files", "Upload complete");
        };

        reader.readAsDataURL(file);
    };

    input.click();
};

/* =========================
   NOTES APP
========================= */

window.openNotes = function () {
    openWindow("Notes", renderNotes(), "notes");
};

function renderNotes() {

    const files = fileSystem.files || {};

    return `
        <div style="padding:6px">

            <button onclick="createNote()">
                + New Note
            </button>

            <hr>

            ${Object.entries(files).map(([id, f]) => `
                <div onclick="loadNote('${id}')"
                    style="cursor:pointer;padding:4px">

                    📄 ${f.name}

                </div>
            `).join("")}

        </div>
    `;
}

window.createNote = async function () {

    await cloudCreateFile("New Note", "");

    await loadSystem();
};

window.loadNote = function (id) {

    activeNoteId = id;

    setTimeout(() => {

        const f = fileSystem.files[id];

        const title =
            document.getElementById("note_title");

        const body =
            document.getElementById("note_body");

        if (title) title.value = f.name;
        if (body) body.value = f.content;

    }, 50);
};

/* =========================
   DOCS APP
========================= */

window.openDocs = function () {
    openWindow("Docs", renderDocs(), "docs");
};

function renderDocs() {

    const files = fileSystem.files || {};

    return `
        <div style="padding:6px">

            <button onclick="createDoc()">
                New Doc
            </button>

            <hr>

            ${Object.entries(files).map(([id, f]) => `
                <div onclick="loadDoc('${id}')"
                    style="cursor:pointer;padding:4px">

                    📘 ${f.name}

                </div>
            `).join("")}

            <hr>

            <input id="doc_title"
                placeholder="Title"
                style="width:100%">

            <div id="doc_editor"
                contenteditable="true"
                style="height:200px;
                border:1px solid #aaa;
                padding:6px;
                overflow:auto">
            </div>

            <button onclick="saveDoc()">
                Save
            </button>

        </div>
    `;
}

window.createDoc = async function () {

    await cloudCreateFile("New Doc", "");

    await loadSystem();
};

window.loadDoc = function (id) {

    activeDocId = id;

    setTimeout(() => {

        const f = fileSystem.files[id];

        const title =
            document.getElementById("doc_title");

        const editor =
            document.getElementById("doc_editor");

        if (title) title.value = f.name;
        if (editor) editor.innerHTML = f.content;

    }, 50);
};

window.saveDoc = async function () {

    if (!activeDocId) return;

    const title =
        document.getElementById("doc_title").value;

    const body =
        document.getElementById("doc_editor").innerHTML;

    await cloudSaveFile(activeDocId, {
        name: title,
        content: body
    });

    await loadSystem();

    notify("Docs", "Document saved");
};

"use strict";

/* =========================================================
   PART 4 — BUILT-IN APPS + SYSTEM CONTROL PANEL
========================================================= */

/* =========================
   CALENDAR APP
========================= */

let calendarData = {};
let selectedDate = null;

window.openCalendar = function () {
    openWindow("Calendar", renderCalendar(), "calendar");
};

function renderCalendar() {

    const today =
        new Date().toISOString().split("T")[0];

    return `
        <div style="padding:8px">

            <input type="date"
                id="cal_date"
                value="${today}"
                onchange="selectDate(this.value)">

            <button onclick="saveCalendarNote()">
                Save Note
            </button>

            <hr>

            <textarea id="cal_note"
                style="width:100%;height:120px"
                placeholder="Calendar notes..."></textarea>

            <hr>

            <b>Saved Entries</b>

            <div style="max-height:140px;overflow:auto">

                ${Object.entries(fileSystem.files || {})
                    .filter(([_, f]) => f.type === "calendar")
                    .map(([id, f]) => `
                        <div style="padding:4px;border-bottom:1px solid #ccc">

                            📅 ${f.name}

                            <button onclick="openCalendarEntry('${id}')">
                                Open
                            </button>

                        </div>
                    `).join("")}

            </div>

        </div>
    `;
}

window.selectDate = function (date) {

    selectedDate = date;

    const entry =
        Object.values(fileSystem.files || {})
            .find(f => f.calendarDate === date);

    const note =
        document.getElementById("cal_note");

    if (note) note.value = entry?.content || "";
};

window.saveCalendarNote = async function () {

    const date =
        document.getElementById("cal_date").value;

    const note =
        document.getElementById("cal_note").value;

    await cloudCreateFile(
        `Calendar ${date}`,
        note
    );

    await loadSystem();

    notify("Calendar", "Entry saved");
};

window.openCalendarEntry = function (id) {

    const f = fileSystem.files[id];

    if (!f) return;

    openWindow(f.name, `<pre>${f.content}</pre>`);
};

/* =========================
   CALCULATOR APP
========================= */

let calcInput = "";

window.openCalculator = function () {
    openWindow("Calculator", renderCalculator(), "calculator");
};

function renderCalculator() {

    return `
        <div style="padding:10px">

            <input id="calc_display"
                class="calc-display"
                disabled>

            <div class="calc-grid">

                ${[
                    "7","8","9","/",
                    "4","5","6","*",
                    "1","2","3","-",
                    "0",".","=","+"
                ].map(v => `
                    <button onclick="calcPress('${v}')">
                        ${v}
                    </button>
                `).join("")}

            </div>

            <button onclick="clearCalc()"
                style="width:100%;margin-top:6px">

                Clear

            </button>

        </div>
    `;
}

window.calcPress = function (v) {

    if (v === "=") {

        try {
            calcInput = eval(calcInput).toString();
        } catch {
            calcInput = "Error";
        }

    } else {
        calcInput += v;
    }

    const display =
        document.getElementById("calc_display");

    if (display) display.value = calcInput;
};

window.clearCalc = function () {

    calcInput = "";

    const display =
        document.getElementById("calc_display");

    if (display) display.value = "";
};

/* =========================
   CLOCK SUITE
========================= */

let stopwatchInterval;
let stopwatchTime = 0;
let alarmTime = null;

window.openClockApp = function () {
    openWindow("Clock Suite", renderClock(), "clock");
};

function renderClock() {

    return `
        <div style="padding:10px">

            <h3>🕒 Live Time</h3>
            <div id="live_time"></div>

            <hr>

            <h3>⏱ Stopwatch</h3>

            <div id="stopwatch">0:00</div>

            <button onclick="startStopwatch()">Start</button>
            <button onclick="pauseStopwatch()">Pause</button>
            <button onclick="resetStopwatch()">Reset</button>

            <hr>

            <h3>⏰ Alarm</h3>

            <input type="time" id="alarm_input">
            <button onclick="setAlarm()">Set Alarm</button>

        </div>
    `;
}

/* LIVE CLOCK UPDATE */
setInterval(() => {

    const el =
        document.getElementById("live_time");

    if (el) {
        el.textContent =
            new Date().toLocaleTimeString();
    }

    checkAlarm();

}, 1000);

/* =========================
   STOPWATCH
========================= */

window.startStopwatch = function () {

    if (stopwatchInterval) return;

    stopwatchInterval = setInterval(() => {

        stopwatchTime++;

        const el =
            document.getElementById("stopwatch");

        if (el) {
            el.textContent =
                formatTime(stopwatchTime);
        }

    }, 1000);
};

window.pauseStopwatch = function () {

    clearInterval(stopwatchInterval);

    stopwatchInterval = null;
};

window.resetStopwatch = function () {

    stopwatchTime = 0;

    pauseStopwatch();

    const el =
        document.getElementById("stopwatch");

    if (el) el.textContent = "0:00";
};

function formatTime(sec) {

    const m = Math.floor(sec / 60);
    const s = sec % 60;

    return `${m}:${s.toString().padStart(2, "0")}`;
}

/* =========================
   ALARM
========================= */

window.setAlarm = function () {

    alarmTime =
        document.getElementById("alarm_input").value;

    notify("Clock", `Alarm set for ${alarmTime}`);
};

function checkAlarm() {

    if (!alarmTime) return;

    const now =
        new Date().toTimeString().slice(0, 5);

    if (now === alarmTime) {

        notify("Alarm", "Time is up!");

        alarmTime = null;
    }
}

/* =========================
   SYSTEM CONTROL PANEL
========================= */

window.openSystemApp = function () {
    openWindow("System", renderSystem(), "system");
};

function renderSystem() {

    return `
        <div style="padding:10px">

            <h3>User</h3>

            <div>
                Logged in as:
                <b>
                    ${localStorage.getItem("OSusername") || "Guest"}
                </b>
            </div>

            <button onclick="logoutUser()">
                Logout
            </button>

            <hr>

            <h3>System Controls</h3>

            <button onclick="clearWindows()">
                Close All Windows
            </button>

            <button onclick="restartOS()">
                Restart OS
            </button>

            <hr>

            <h3>Performance</h3>

            <button onclick="toggleFocus()">
                Focus Mode
            </button>

            <button onclick="togglePerf()">
                Performance Mode
            </button>

            <hr>

            <h3>Theme</h3>

            <button onclick="setTheme('classic')">Classic</button>
            <button onclick="setTheme('dark')">Dark</button>
            <button onclick="setTheme('midnight')">Midnight</button>

            <hr>

            <h3>System Info</h3>

            <div id="sys_info"></div>

        </div>
    `;
}

/* =========================
   SYSTEM ACTIONS
========================= */

window.logoutUser = function () {

    localStorage.clear();

    location.href = "index.html";
};

window.clearWindows = function () {

    document
        .querySelectorAll(".window")
        .forEach(w => w.remove());

    notify("System", "All windows closed");
};

window.restartOS = function () {

    location.reload();
};

/* =========================
   OPTIONAL TOGGLES (SAFE DEFAULTS)
========================= */

let focusMode = false;
let perfMode = false;

window.toggleFocus = function () {

    focusMode = !focusMode;

    document.body.style.filter =
        focusMode ? "brightness(0.8)" : "";

    notify("System",
        focusMode ? "Focus ON" : "Focus OFF"
    );
};

window.togglePerf = function () {

    perfMode = !perfMode;

    document.body.style.transition =
        perfMode ? "none" : "";

    notify("System",
        perfMode ? "Performance ON" : "Performance OFF"
    );
};

"use strict";

/* =========================================================
   PART 5 — SESSION RESTORE + FINAL BOOT ENGINE
========================================================= */

/* =========================
   SESSION RESTORE
========================= */

async function restoreSession() {

    const raw =
        localStorage.getItem("emerald_session");

    if (!raw) return;

    let session = [];

    try {
        session = JSON.parse(raw);
    } catch {
        return;
    }

    for (const winData of session) {

        const win = openWindow(
            winData.title,
            `<div class="restored">Restored session window</div>`,
            winData.app
        );

        if (!win) continue;

        win.style.left = winData.left || "100px";
        win.style.top = winData.top || "80px";
        win.style.width = winData.width || "500px";
        win.style.height = winData.height || "350px";

        if (winData.maximized) {
            win.dataset.maximized = "true";

            win.style.left = "0";
            win.style.top = "0";
            win.style.width = "100vw";
            win.style.height = "calc(100vh - 40px)";
        }

        if (winData.minimized) {
            win.dataset.minimized = "true";
            win.style.display = "none";
        }
    }

    notify("System", "Session restored");
}

/* expose for boot */
window.restoreSession = restoreSession;

/* =========================
   WINDOW PATCH (IMPORTANT FIX)
========================= */

/*
Ensure saveSession is globally available
from Part 1
*/
if (!window.saveSession) {
    window.saveSession = () => {};
}

/* =========================
   BOOT FINALIZATION PATCH
========================= */

window.addEventListener("DOMContentLoaded", async () => {

    // slight delay ensures DOM + apps are ready
    setTimeout(async () => {

        await restoreSession();

        notify(
            "EmeraldOS",
            "Desktop ready"
        );

    }, 300);

});

/* =========================
   GLOBAL CLEAN API EXPORT
========================= */

window.launchApp = openWindow;

/* =========================
   SAFETY PATCH (AVOID DOUBLE INIT)
========================= */

if (!window.__EMERALD_BOOTED__) {

    window.__EMERALD_BOOTED__ = true;

} else {

    console.warn(
        "EmeraldOS already booted once"
    );
}
