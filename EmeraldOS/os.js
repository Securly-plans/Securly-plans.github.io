// ==========================================
// EMERALD OS - HYBRID CLOUD EDITION
// ==========================================

let zIndexCounter = 100;
let activeDrag = null;

// ==========================================
// FIREBASE IMPORT (safe optional use)
// ==========================================

let db = null;

try {
    const firebaseModule = await import("./js/firebase.js");
    db = firebaseModule.db;
} catch (e) {
    console.warn("Firebase not loaded, using localStorage only");
}

// ==========================================
// USER
// ==========================================

function getUser() {
    return localStorage.getItem("username");
}

// ==========================================
// CLOCK
// ==========================================

window.addEventListener("DOMContentLoaded", () => {
    initClock();
    initStartMenu();
    renderDesktopApps();
});

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

// ==========================================
// START MENU
// ==========================================

function initStartMenu() {
    const btn = document.getElementById("start-btn");
    const menu = document.getElementById("start-menu");

    if (!btn || !menu) return;

    btn.onclick = (e) => {
        e.stopPropagation();
        menu.classList.toggle("show");
    };

    document.onclick = (e) => {
        if (!menu.contains(e.target)) {
            menu.classList.remove("show");
        }
    };
}

// ==========================================
// WINDOW SYSTEM
// ==========================================

function openWindow(title, html) {
    const container = document.getElementById("windows-container");
    const taskbar = document.getElementById("taskbar-apps");

    if (!container || !taskbar) return;

    const win = document.createElement("div");
    win.className = "window";

    win.style.left = (50 + Math.random() * 100) + "px";
    win.style.top = (50 + Math.random() * 80) + "px";
    win.style.zIndex = ++zIndexCounter;

    win.innerHTML = `
        <div class="title-bar">
            <span>${escapeHTML(title)}</span>
            <button class="close-btn">X</button>
        </div>
        <div class="window-content">${html}</div>
    `;

    container.appendChild(win);

    const tab = document.createElement("div");
    tab.className = "taskbar-tab active";
    tab.textContent = title;
    taskbar.appendChild(tab);

    function focus() {
        win.style.zIndex = ++zIndexCounter;
    }

    win.onclick = focus;
    tab.onclick = () => win.remove();

    win.querySelector(".close-btn").onclick = () => {
        win.remove();
        tab.remove();
    };

    // drag
    win.querySelector(".title-bar").onmousedown = (e) => {
        activeDrag = {
            win,
            startX: e.clientX,
            startY: e.clientY,
            left: win.offsetLeft,
            top: win.offsetTop
        };
    };

    return win;
}

// ==========================================
// DRAG SYSTEM
// ==========================================

document.addEventListener("mousemove", (e) => {
    if (!activeDrag) return;

    activeDrag.win.style.left =
        activeDrag.left + (e.clientX - activeDrag.startX) + "px";

    activeDrag.win.style.top =
        activeDrag.top + (e.clientY - activeDrag.startY) + "px";
});

document.addEventListener("mouseup", () => {
    activeDrag = null;
});

// ==========================================
// SAFE HTML
// ==========================================

function escapeHTML(t) {
    return String(t)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// ==========================================
// CLOUD FILE SYSTEM (FIREBASE + FALLBACK)
// ==========================================

const FileSystem = {

    async saveFile(name, content) {
        const user = getUser();

        if (db && user) {
            const mod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
            const ref = mod.doc(db, "emeraldOSUsers", user);
            const snap = await mod.getDoc(ref);

            let data = snap.exists() ? snap.data() : {};
            let files = data.files || {};

            files[name] = content;

            await mod.setDoc(ref, { ...data, files }, { merge: true });
        } else {
            localStorage.setItem("os_file_" + name, content);
        }
    },

    async readFile(name) {
        const user = getUser();

        if (db && user) {
            const mod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
            const ref = mod.doc(db, "emeraldOSUsers", user);
            const snap = await mod.getDoc(ref);

            return snap.exists() ? (snap.data().files?.[name] || "") : "";
        }

        return localStorage.getItem("os_file_" + name) || "";
    },

    async deleteFile(name) {
        const user = getUser();

        if (db && user) {
            const mod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
            const ref = mod.doc(db, "emeraldOSUsers", user);
            const snap = await mod.getDoc(ref);

            let data = snap.data();
            if (!data?.files) return;

            delete data.files[name];

            await mod.setDoc(ref, data, { merge: true });
        } else {
            localStorage.removeItem("os_file_" + name);
        }
    }
};

// ==========================================
// FILE EXPLORER (FIXED CLICK EVENTS)
// ==========================================

async function getFiles() {
    const user = getUser();

    if (db && user) {
        const mod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
        const ref = mod.doc(db, "emeraldOSUsers", user);
        const snap = await mod.getDoc(ref);

        if (!snap.exists()) return [];
        return Object.keys(snap.data().files || {});
    }

    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith("os_file_")) {
            out.push(k.replace("os_file_", ""));
        }
    }
    return out;
}

async function renderFileExplorer() {
    const el = document.getElementById("explorer-content");
    if (!el) return;

    const files = await getFiles();

    if (!files.length) {
        el.innerHTML = "<div style='padding:10px;'>Empty</div>";
        return;
    }

    el.innerHTML = files.map(f => `
        <div style="padding:5px;border-bottom:1px solid #ccc;">
            📄 ${escapeHTML(f)}
            <button onclick="openNotes('${f}')">Open</button>
            <button onclick="deleteFile('${f}')" style="color:red;">Delete</button>
        </div>
    `).join("");
}

async function deleteFile(name) {
    await FileSystem.deleteFile(name);
    renderFileExplorer();
}

function openFileExplorer() {
    openWindow("File Explorer", `<div id="explorer-content">Loading...</div>`);
    setTimeout(renderFileExplorer, 100);
}

// ==========================================
// NOTES FIXED
// ==========================================

function openNotes(filename = "New.txt") {
    const id = Math.random().toString(36).slice(2);

    openWindow("Notes", `
        <input id="fn-${id}" value="${escapeHTML(filename)}">
        <br>
        <textarea id="txt-${id}" style="width:100%;height:200px;"></textarea>
        <br>
        <button onclick="saveNote('${id}')">Save</button>
    `);

    setTimeout(async () => {
        const txt = document.getElementById("txt-" + id);
        txt.value = await FileSystem.readFile(filename);
    }, 100);
}

async function saveNote(id) {
    const name = document.getElementById("fn-" + id).value;
    const content = document.getElementById("txt-" + id).value;

    await FileSystem.saveFile(name, content);
    renderFileExplorer();
}

// ==========================================
// PLACEHOLDER APPS
// ==========================================

function openAppStore() {
    openWindow("App Store", "<p>Coming soon</p>");
}
