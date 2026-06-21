// ==========================================
// EMERALD OS - MODULE SAFE DROP-IN
// ==========================================

let zIndexCounter = 100;
let activeDrag = null;

// ==========================================
// BOOT
// ==========================================

window.addEventListener("DOMContentLoaded", () => {
    initClock();
    initStartMenu();
    renderDesktopApps();

    console.log("Emerald OS booted");
});

// ==========================================
// MAKE EVERYTHING GLOBAL (FIX FOR MODULE MODE)
// ==========================================

function exposeGlobals() {
    Object.assign(window, {
        openWindow,
        openNotes,
        openFileExplorer,
        openAppStore,
        FileSystem,
        renderFileExplorer,
        deleteFile
    });
}

// ==========================================
// CLOCK
// ==========================================

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

    document.addEventListener("click", (e) => {
        if (!menu.contains(e.target)) {
            menu.classList.remove("show");
        }
    });
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
        <div class="window-content">
            ${html}
        </div>
    `;

    container.appendChild(win);

    const tab = document.createElement("div");
    tab.className = "taskbar-tab active";
    tab.textContent = title;
    taskbar.appendChild(tab);

    function focus() {
        win.style.zIndex = ++zIndexCounter;
    }

    win.addEventListener("mousedown", focus);
    tab.addEventListener("click", () => win.remove());

    win.querySelector(".close-btn").onclick = () => {
        win.remove();
        tab.remove();
    };

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
// FILE SYSTEM (LOCAL ONLY - SAFE)
// ==========================================

const FileSystem = {
    saveFile(name, content) {
        if (!name) return;
        localStorage.setItem("os_file_" + name, content);
    },

    readFile(name) {
        return localStorage.getItem("os_file_" + name) || "";
    },

    deleteFile(name) {
        localStorage.removeItem("os_file_" + name);
    }
};

// ==========================================
// NOTES
// ==========================================

function openNotes(filename = "New.txt") {
    const id = Math.random().toString(36).slice(2);

    const win = openWindow("Notes", `
        <input id="fn-${id}" value="${escapeHTML(filename)}">
        <br><br>
        <textarea id="txt-${id}" style="width:100%;height:200px;"></textarea>
        <br>
        <button onclick="saveNote('${id}')">Save</button>
    `);

    setTimeout(() => {
        document.getElementById("txt-" + id).value =
            FileSystem.readFile(filename);
    }, 50);
}

function saveNote(id) {
    const name = document.getElementById("fn-" + id).value;
    const content = document.getElementById("txt-" + id).value;

    FileSystem.saveFile(name, content);
    renderFileExplorer();
}

// ==========================================
// FILE EXPLORER (FIXED CLICK + DELETE)
// ==========================================

function getFiles() {
    const files = [];

    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith("os_file_")) {
            files.push(k.replace("os_file_", ""));
        }
    }

    return files.sort();
}

function renderFileExplorer() {
    const el = document.getElementById("explorer-content");
    if (!el) return;

    const files = getFiles();

    if (!files.length) {
        el.innerHTML = "<div style='padding:10px;'>Empty folder</div>";
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

function deleteFile(name) {
    FileSystem.deleteFile(name);
    renderFileExplorer();
}

function openFileExplorer() {
    openWindow("File Explorer", `<div id="explorer-content"></div>`);
    setTimeout(renderFileExplorer, 100);
}

// ==========================================
// APP STORE (PLACEHOLDER SAFE)
// ==========================================

function openAppStore() {
    openWindow("App Store", "<p>App Store coming soon</p>");
}

// ==========================================
// DESKTOP APPS (SAFE)
// ==========================================

function renderDesktopApps() {}

// ==========================================
// FINAL BOOT PATCH
// ==========================================

exposeGlobals();
