"use strict";

/* =========================
   STATE
========================= */

let zIndexCounter = 100;
let dragState = null;

let fileSystem = {
    files: {}
};

/* =========================
   FIREBASE IMPORTS (must exist in firebase.js)
========================= */

import {
    db
} from "./firebase.js";

import {
    collection,
    doc,
    setDoc,
    getDocs,
    deleteDoc
} from "firebase/firestore";

/* =========================
   BOOT
========================= */

window.addEventListener("DOMContentLoaded", async () => {
    initStartMenu();
    initClock();
    exposeAPI();

    await loadCloudFiles();   // IMPORTANT: loads per user
});

/* =========================
   USER ID
========================= */

function getUserId() {
    return localStorage.getItem("userId");
}

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
   CLOUD LOAD FILES
========================= */

async function loadCloudFiles() {
    const userId = getUserId();
    if (!userId) return;

    const snap = await getDocs(collection(db, "users", userId, "files"));

    fileSystem.files = {};

    snap.forEach(docSnap => {
        fileSystem.files[docSnap.id] = docSnap.data();
    });
}

/* =========================
   CLOUD SAVE FILE
========================= */

async function saveCloudFile(id, file) {
    const userId = getUserId();
    if (!userId) return;

    await setDoc(doc(db, "users", userId, "files", id), {
        ...file,
        updatedAt: Date.now()
    });
}

/* =========================
   DELETE CLOUD FILE
========================= */

async function deleteCloudFile(id) {
    const userId = getUserId();
    if (!userId) return;

    await deleteDoc(doc(db, "users", userId, "files", id));
}

/* =========================
   WINDOW SYSTEM (FIXED DRAG)
========================= */

document.addEventListener("mousemove", (e) => {
    if (!dragState) return;

    const win = dragState.win;

    win.style.left = (e.clientX - dragState.offsetX) + "px";
    win.style.top = (e.clientY - dragState.offsetY) + "px";
});

document.addEventListener("mouseup", () => {
    dragState = null;
});

/* =========================
   OPEN WINDOW CORE
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
    `;

    container.appendChild(win);

    const titlebar = win.querySelector(".title-bar");
    const closeBtn = win.querySelector(".close-btn");

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

        win.style.zIndex = ++zIndexCounter;
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
        <div style="padding:6px;">
            <button onclick="createFile()">New File</button>
            <button onclick="uploadFile()">Upload File</button>

            <hr>

            ${Object.keys(files).map(id => `
                <div style="display:flex;justify-content:space-between;padding:4px;border-bottom:1px solid #ddd;">
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
   FILE ACTIONS (CLOUD READY)
========================= */

window.createFile = function () {
    const id = "file_" + Date.now();

    fileSystem.files[id] = {
        name: "New File",
        content: ""
    };

    saveCloudFile(id, fileSystem.files[id]);
    refresh();
};

window.openFile = function (id) {
    const file = fileSystem.files[id];
    if (!file) return;

    openWindow(
        file.name,
        `
        <div style="display:flex;flex-direction:column;height:100%;">
            <textarea id="file_${id}" style="flex:1;width:100%;">${file.content || ""}</textarea>
            <button onclick="saveFile('${id}')">Save</button>
        </div>
        `
    );
};

window.saveFile = async function (id) {
    const el = document.getElementById(`file_${id}`);
    if (!el) return;

    fileSystem.files[id].content = el.value;

    await saveCloudFile(id, fileSystem.files[id]);
};

window.deleteFile = async function (id) {
    delete fileSystem.files[id];

    await deleteCloudFile(id);

    refresh();
};

/* =========================
   FILE UPLOAD
========================= */

window.uploadFile = function () {
    const input = document.createElement("input");
    input.type = "file";

    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = async () => {
            const id = "file_" + Date.now();

            fileSystem.files[id] = {
                name: file.name,
                content: reader.result
            };

            await saveCloudFile(id, fileSystem.files[id]);
            refresh();
        };

        reader.readAsText(file);
    };

    input.click();
};

/* =========================
   HELPERS
========================= */

function refresh() {
    document.querySelectorAll(".window").forEach(w => w.remove());
}

/* =========================
   LEGACY
========================= */

function exposeAPI() {
    window.launchApp = openWindow;
}
