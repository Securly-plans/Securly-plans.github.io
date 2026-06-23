"use strict";

import {
    initDesktop,
    registerWindow,
    unregisterWindow,
    updateWindowState
} from "./desktop.js";

/* =========================
   CLOUD IMPORTS
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

/* =========================
   BOOT
========================= */

window.addEventListener("DOMContentLoaded", async () => {
    initStartMenu();
    initClock();
    exposeAPI();

    await loadSystem();

    initDesktop();
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

    const tick = () => {
        clock.textContent = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    tick();
    setInterval(tick, 1000);
}

/* =========================
   LOAD SYSTEM (LIVE STATE)
========================= */

async function loadSystem() {
    try {
        fileSystem.files = await loadDrive() || {};
    } catch (e) {
        console.warn("Drive load failed:", e);
        fileSystem.files = {};
    }

    // live update any open window content
    rerenderOpenApps();
}

/* =========================
   LIVE RERENDER (NO REFRESH)
========================= */

function rerenderOpenApps() {
    const windows = document.querySelectorAll(".window[data-app]");

    windows.forEach(win => {
        const app = win.getAttribute("data-app");

        if (app === "files") win.querySelector(".window-content").innerHTML = renderFileExplorer();
        if (app === "notes") win.querySelector(".window-content").innerHTML = renderNotes();
        if (app === "docs") win.querySelector(".window-content").innerHTML = renderDocs();
    });
}

/* =========================
   WINDOW SYSTEM
========================= */

document.addEventListener("mousemove", (e) => {

    if (dragState) {
        const w = dragState.win;

        w.style.left =
            (e.clientX - dragState.offsetX) + "px";

        w.style.top =
            (e.clientY - dragState.offsetY) + "px";

        if (w.dataset.windowId) {
            updateWindowState(
                w.dataset.windowId,
                {
                    x: w.offsetLeft,
                    y: w.offsetTop
                }
            );
        }
    }

    if (resizeState) {

        const w = resizeState.win;

        const dx =
            e.clientX - resizeState.startX;

        const dy =
            e.clientY - resizeState.startY;

        w.style.width =
            Math.max(
                220,
                resizeState.startWidth + dx
            ) + "px";

        w.style.height =
            Math.max(
                160,
                resizeState.startHeight + dy
            ) + "px";

        if (w.dataset.windowId) {
            updateWindowState(
                w.dataset.windowId,
                {
                    width: w.offsetWidth,
                    height: w.offsetHeight
                }
            );
        }
    }
});

document.addEventListener("mouseup", () => {
    dragState = null;
    resizeState = null;
});

/* =========================
   CORE WINDOW
========================= */

window.openWindow = function (
    title,
    html,
    app = ""
) {
    const container =
        document.getElementById(
            "windows-container"
        );

    if (!container) return;

    const win =
        document.createElement("div");

    const windowId =
        crypto.randomUUID();

    win.className = "window";

    win.dataset.windowId =
        windowId;

    if (app) {
        win.setAttribute(
            "data-app",
            app
        );
    }

    win.style.left = "80px";
    win.style.top = "80px";
    win.style.width = "500px";
    win.style.height = "350px";
    win.style.zIndex =
        ++zIndexCounter;

    win.innerHTML = `
        <div class="title-bar">
            <span>${title}</span>

            <button class="close-btn">
                X
            </button>
        </div>

        <div class="window-content">
            ${html}
        </div>

        <div class="resize-handle"></div>
    `;

    container.appendChild(win);

    registerWindow({
        id: windowId,
        title,
        app,
        html,
        x: 80,
        y: 80,
        width: 500,
        height: 350
    });

    const titleBar =
        win.querySelector(
            ".title-bar"
        );

    const closeBtn =
        win.querySelector(
            ".close-btn"
        );

    const resizeHandle =
        win.querySelector(
            ".resize-handle"
        );

    closeBtn.onclick = () => {
        unregisterWindow(win.dataset.windowId);
        win.remove();
    };

        unregisterWindow(
            windowId
        );

        win.remove();
    };

    win.onmousedown = () => {
        win.style.zIndex =
            ++zIndexCounter;
    };

    titleBar.onmousedown = (e) => {

        dragState = {
            win,
            offsetX:
                e.clientX -
                win.offsetLeft,

            offsetY:
                e.clientY -
                win.offsetTop
        };
    };

    resizeHandle.onmousedown = (e) => {

        e.preventDefault();

        const rect =
            win.getBoundingClientRect();

        resizeState = {
            win,

            startX:
                e.clientX,

            startY:
                e.clientY,

            startWidth:
                rect.width,

            startHeight:
                rect.height
        };
    };

    return win;
};
let calendarData = {};
let selectedDate = null;

window.openCalendar = function () {
    openWindow("Calendar", renderCalendar(), "calendar");
};

function renderCalendar() {
    const today = new Date().toISOString().split("T")[0];

    return `
        <div style="padding:10px">

            <input type="date" id="cal_date" value="${today}" onchange="selectDate(this.value)">

            <button onclick="saveCalendarNote()">Save Note</button>

            <hr>

            <textarea id="cal_note" style="width:100%;height:150px"
                placeholder="Write notes for this day..."></textarea>

            <hr>

            <div>
                <b>Saved Entries:</b>
                <div style="max-height:120px;overflow:auto">
                    ${Object.entries(fileSystem.files || {})
                        .filter(([_, f]) => f.type === "calendar")
                        .map(([id, f]) => `
                            <div style="padding:4px;border-bottom:1px solid #ddd">
                                📅 ${f.name}
                                <button onclick="openCalendarEntry('${id}')">Open</button>
                            </div>
                        `).join("")}
                </div>
            </div>

        </div>
    `;
}

window.selectDate = function (date) {
    selectedDate = date;

    const entry = Object.values(fileSystem.files || {})
        .find(f => f.calendarDate === date);

    document.getElementById("cal_note").value = entry?.content || "";
};

window.saveCalendarNote = async function () {
    const date = document.getElementById("cal_date").value;
    const note = document.getElementById("cal_note").value;

    await cloudCreateFile(`Calendar ${date}`, note);

    await loadSystem();
};

window.openCalendarEntry = function (id) {
    const f = fileSystem.files[id];
    openWindow(f.name, `<pre>${f.content}</pre>`);
};

window.openCalculator = function () {
    openWindow("Calculator", renderCalculator(), "calculator");
};

function renderCalculator() {
    return `
        <div style="padding:10px">

            <input id="calc_display" style="width:100%;font-size:20px;text-align:right" disabled>

            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-top:10px">

                ${[
                    "7","8","9","/",
                    "4","5","6","*",
                    "1","2","3","-",
                    "0",".","=","+"
                ].map(v => `
                    <button onclick="calcPress('${v}')">${v}</button>
                `).join("")}

                <button onclick="clearCalc()" style="grid-column:span 4">Clear</button>
            </div>

        </div>
    `;
}

let calcInput = "";

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

    document.getElementById("calc_display").value = calcInput;
};

window.clearCalc = function () {
    calcInput = "";
    document.getElementById("calc_display").value = "";
};

let stopwatchInterval;
let stopwatchTime = 0;
let alarmTime = null;

window.openClockApp = function () {
    openWindow("Clock Suite", renderClock(), "clockapp");
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

function updateClockLive() {
    const el = document.getElementById("live_time");
    if (el) el.textContent = new Date().toLocaleTimeString();

    checkAlarm();
}

setInterval(updateClockLive, 1000);

/* STOPWATCH */

window.startStopwatch = function () {
    if (stopwatchInterval) return;

    stopwatchInterval = setInterval(() => {
        stopwatchTime++;
        const el = document.getElementById("stopwatch");
        if (el) el.textContent = formatTime(stopwatchTime);
    }, 1000);
};

window.pauseStopwatch = function () {
    clearInterval(stopwatchInterval);
    stopwatchInterval = null;
};

window.resetStopwatch = function () {
    stopwatchTime = 0;
    pauseStopwatch();
    const el = document.getElementById("stopwatch");
    if (el) el.textContent = "0:00";
};

/* ALARM */

window.setAlarm = function () {
    alarmTime = document.getElementById("alarm_input").value;
    alert("Alarm set for " + alarmTime);
};

function checkAlarm() {
    if (!alarmTime) return;

    const now = new Date().toTimeString().slice(0,5);

    if (now === alarmTime) {
        alert("⏰ Alarm!");
        alarmTime = null;
    }
}

function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2,"0")}`;
}

/* =========================
   SYSTEM APP (CONTROL PANEL)
========================= */

window.openSystemApp = function () {
    openWindow("System Control Panel", renderSystemApp(), "system");
    updateSystemStats();
};

function renderSystemApp() {
    return `
        <div style="padding:10px">

            <h3>👤 User</h3>
            <div>Logged in as: <b>${localStorage.getItem("username") || "Guest"}</b></div>

            <button onclick="logoutUser()">Logout</button>

            <hr>

            <h3>🖥️ Device Controls</h3>

            <label>Brightness</label>
            <input type="range" min="10" max="100" value="100"
                oninput="setBrightness(this.value)">

            <br><br>

            <label>Volume</label>
            <input type="range" min="0" max="1" step="0.01" value="1"
                oninput="setVolume(this.value)">

            <br><br>

            <button onclick="toggleFocus()">Focus Mode</button>
            <button onclick="togglePerf()">Performance Mode</button>

            <hr>

            <h3>📊 System Info</h3>

            <div id="sys_info">Loading...</div>

            <hr>

            <h3>⚡ Quick Actions</h3>

            <button onclick="clearWindows()">Close All Windows</button>
            <button onclick="restartOS()">Restart OS</button>

        </div>
    `;
}

/* =========================
   SYSTEM CONTROLS
========================= */

let focusMode = false;
let perfMode = false;

window.logoutUser = function () {
    localStorage.removeItem("username");
    localStorage.removeItem("os_session");
    location.href = "index.html";
};

window.setBrightness = function (value) {
    let overlay = document.getElementById("brightness-overlay");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "brightness-overlay";
        overlay.style.position = "fixed";
        overlay.style.inset = "0";
        overlay.style.pointerEvents = "none";
        overlay.style.background = "black";
        overlay.style.zIndex = "999999";
        document.body.appendChild(overlay);
    }

    overlay.style.opacity = (100 - value) / 100;
};

window.setVolume = function (value) {
    document.querySelectorAll("video, audio").forEach(el => {
        el.volume = value;
    });
};

window.toggleFocus = function () {
    focusMode = !focusMode;

    document.body.style.filter = focusMode ? "brightness(0.7)" : "";
};

window.togglePerf = function () {
    perfMode = !perfMode;

    document.body.style.transition = perfMode ? "none" : "";
};

window.clearWindows = function () {
    document.querySelectorAll(".window").forEach(w => w.remove());
};

window.restartOS = function () {
    location.reload();
};

function updateSystemStats() {
    const el = document.getElementById("sys_info");
    if (!el) return;

    const fileCount = Object.keys(fileSystem.files || {}).length;

    el.innerHTML = `
        <div>Files: ${fileCount}</div>
        <div>Open Windows: ${document.querySelectorAll(".window").length}</div>
        <div>Session: ${localStorage.getItem("os_session") || "none"}</div>
        <div>Mode: ${focusMode ? "Focus" : "Normal"}</div>
    `;

    setTimeout(updateSystemStats, 1000);
}
/* =========================
   FILE EXPLORER
========================= */

window.openFileExplorer = function () {
    openWindow("Files", renderFileExplorer(), "files");
};

function renderFileExplorer() {
    const files = fileSystem.files;

    return `
        <div style="padding:6px;">
            <button onclick="createFile()">New File</button>
            <button onclick="uploadFile()">Upload</button>
            <button onclick="downloadAllFiles()">Download All</button>
            <hr>

            ${Object.entries(files).map(([id, f]) => `
                <div style="display:flex;justify-content:space-between;padding:4px;border-bottom:1px solid #ddd;">
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
   FILE OPS
========================= */

window.createFile = async function () {
    await cloudCreateFile("New File", "");
    await loadSystem();
};

window.deleteFile = async function (id) {
    await cloudDeleteFile(id);
    await loadSystem();
};

/* =========================
   OPEN FILE (MEDIA FIXED)
========================= */

window.openFile = function (id) {
    const file = fileSystem.files[id];
    if (!file) return;

    let body = "";

    if (file.content?.startsWith("data:image")) {
        body = `<img src="${file.content}" style="max-width:100%">`;
    }
    else if (file.content?.startsWith("data:video")) {
        body = `<video controls style="max-width:100%"><source src="${file.content}"></video>`;
    }
    else {
        body = `
            <textarea id="file_${id}" style="width:100%;height:90%">${file.content || ""}</textarea>
            <button onclick="saveFile('${id}')">Save</button>
        `;
    }

    openWindow(file.name, `<div style="display:flex;flex-direction:column;height:100%">${body}</div>`);
};

/* =========================
   SAVE FILE (LIVE)
========================= */

window.saveFile = async function (id) {
    const el = document.getElementById(`file_${id}`);
    if (!el) return;

    await cloudSaveFile(id, {
        name: fileSystem.files[id].name,
        content: el.value
    });

    await loadSystem();
};

/* =========================
   RENAME
========================= */

window.renameFile = async function (id) {
    const file = fileSystem.files[id];
    if (!file) return;

    const name = prompt("Rename file:", file.name);
    if (!name) return;

    await cloudSaveFile(id, { name });
    await loadSystem();
};

/* =========================
   DOWNLOAD SINGLE FILE
========================= */

window.downloadFile = function (id) {
    const file = fileSystem.files[id];
    if (!file) return;

    const blob = new Blob([file.content || ""], { type: "text/plain" });
    const a = document.createElement("a");

    a.href = URL.createObjectURL(blob);
    a.download = file.name || "file.txt";
    a.click();
};

/* =========================
   DOWNLOAD ALL FILES
========================= */

window.downloadAllFiles = function () {
    const zipText = Object.values(fileSystem.files)
        .map(f => `${f.name}\n\n${f.content}\n\n-------------------\n`)
        .join("");

    const blob = new Blob([zipText], { type: "text/plain" });
    const a = document.createElement("a");

    a.href = URL.createObjectURL(blob);
    a.download = "emerald_drive_backup.txt";
    a.click();
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
        };

        reader.readAsDataURL(file);
    };

    input.click();
};

/* =========================
   NOTES APP (FIXED)
========================= */

window.openNotes = function () {
    openWindow("Notes", renderNotes(), "notes");
};

function renderNotes() {
    return `
        <div style="padding:6px">
            <button onclick="createNote()">+ New Note</button>
            <hr>
            ${Object.entries(fileSystem.files)
                .filter(([_, f]) => f.name)
                .map(([id, f]) => `
                    <div onclick="loadNote('${id}')" style="cursor:pointer;padding:4px;">
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
        document.getElementById("note_title").value = f.name;
        document.getElementById("note_body").value = f.content;
    }, 50);
};

window.saveNote = async function () {
    if (!activeNoteId) return;

    const title = document.getElementById("note_title").value;
    const body = document.getElementById("note_body").value;

    await cloudSaveFile(activeNoteId, {
        name: title,
        content: body
    });

    await loadSystem();
};

/* =========================
   DOCS APP (REAL)
========================= */

window.openDocs = function () {
    openWindow("Docs", renderDocs(), "docs");
};

function renderDocs() {
    return `
        <div style="padding:6px;height:100%">
            <button onclick="createDoc()">New Doc</button>
            <hr>

            ${Object.entries(fileSystem.files)
                .filter(([_, f]) => f.type !== "image" && f.type !== "video")
                .map(([id, f]) => `
                    <div onclick="loadDoc('${id}')" style="padding:4px;cursor:pointer;">
                        📄 ${f.name}
                    </div>
                `).join("")}

            <hr>

            <div>
                <select id="fontSize">
                    <option>12px</option>
                    <option>16px</option>
                    <option>20px</option>
                </select>

                <button onclick="applyBold()">B</button>
                <button onclick="applyItalic()">I</button>
            </div>

            <input id="doc_title" placeholder="Title" style="width:100%">
            <div id="doc_editor" contenteditable="true"
                 style="border:1px solid #ccc;height:200px;overflow:auto;padding:6px"></div>

            <button onclick="saveDoc()">Save</button>
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
        document.getElementById("doc_title").value = f.name;
        document.getElementById("doc_editor").innerHTML = f.content;
    }, 50);
};

window.saveDoc = async function () {
    if (!activeDocId) return;

    const title = document.getElementById("doc_title").value;
    const body = document.getElementById("doc_editor").innerHTML;

    await cloudSaveFile(activeDocId, {
        name: title,
        content: body
    });

    await loadSystem();
};

/* TEXT FORMATTING */

window.applyBold = function () {
    document.execCommand("bold");
};

window.applyItalic = function () {
    document.execCommand("italic");
};

/* =========================
   APP STORE (FIX)
========================= */

window.openAppStore = function () {
    openWindow("App Store", "<h2>The EmeraldOS Application Store is currently unavaliable at the momment. Please check again later...</h2>");
};

/* =========================
   LEGACY
========================= */

function exposeAPI() {
    window.launchApp = openWindow;
}
