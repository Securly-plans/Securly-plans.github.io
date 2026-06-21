// ==========================================
// EMERALDOS - FIXED CORE SYSTEM
// ==========================================

let zIndexCounter = 100;
let activeDrag = null;

// ==========================================
// BOOT SEQUENCE (SAFE INIT WRAPPER)
// ==========================================

window.addEventListener("DOMContentLoaded", () => {

    initClock();
    initStartMenu();
    initDesktop();
    initPaint();
    renderDesktopApps();

    console.log("Emerald OS initialized.");
});

// ==========================================
// CLOCK
// ==========================================

function initClock() {
    const clock = document.getElementById("clock");
    if (!clock) return;

    function updateClock() {
        clock.textContent = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    updateClock();
    setInterval(updateClock, 1000);
}

// ==========================================
// START MENU (FIXED INIT)
// ==========================================

function initStartMenu() {
    const startBtn = document.getElementById("start-btn");
    const startMenu = document.getElementById("start-menu");

    if (!startBtn || !startMenu) return;

    startBtn.addEventListener("click", e => {
        e.stopPropagation();

        startMenu.classList.toggle("show");

        if (startMenu.classList.contains("show")) {
            startBtn.style.borderColor = "#000 #fff #fff #000";
            startBtn.style.background = "#dfdfdf";
        } else {
            startBtn.style.borderColor = "#fff #000 #000 #fff";
            startBtn.style.background = "#c0c0c0";
        }
    });

    document.addEventListener("click", e => {
        if (
            startMenu.classList.contains("show") &&
            !startMenu.contains(e.target)
        ) {
            startMenu.classList.remove("show");

            startBtn.style.borderColor = "#fff #000 #000 #fff";
            startBtn.style.background = "#c0c0c0";
        }
    });
}

// ==========================================
// SAFE HTML ESCAPE
// ==========================================

function escapeHTML(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// ==========================================
// WINDOW SYSTEM
// ==========================================

function openWindow(title, contentHTML) {

    const container = document.getElementById("windows-container");
    const taskbarApps = document.getElementById("taskbar-apps");

    if (!container || !taskbarApps) return;

    const win = document.createElement("div");
    win.className = "window";

    win.style.zIndex = ++zIndexCounter;
    win.style.left = Math.floor(50 + Math.random() * 80) + "px";
    win.style.top = Math.floor(50 + Math.random() * 80) + "px";

    win.innerHTML = `
        <div class="title-bar">
            <span>${escapeHTML(title)}</span>
            <button class="close-btn">X</button>
        </div>
        <div class="window-content">
            ${contentHTML}
        </div>
    `;

    container.appendChild(win);

    const tab = document.createElement("div");
    tab.className = "taskbar-tab active";
    tab.textContent = title;
    taskbarApps.appendChild(tab);

    function activateWindow() {
        win.style.display = "flex";
        win.style.zIndex = ++zIndexCounter;

        document.querySelectorAll(".taskbar-tab")
            .forEach(t => t.classList.remove("active"));

        tab.classList.add("active");
    }

    tab.addEventListener("click", () => {
        if (win.style.display === "none") {
            activateWindow();
            return;
        }

        win.style.display =
            win.style.display === "none" ? "flex" : "none";

        if (win.style.display === "none") {
            tab.classList.remove("active");
        } else {
            activateWindow();
        }
    });

    win.addEventListener("mousedown", activateWindow);

    win.querySelector(".close-btn").addEventListener("click", () => {
        win.remove();
        tab.remove();
    });

    const titleBar = win.querySelector(".title-bar");

    titleBar.addEventListener("mousedown", e => {
        activeDrag = {
            window: win,
            startX: e.clientX,
            startY: e.clientY,
            left: win.offsetLeft,
            top: win.offsetTop
        };
    });

    activateWindow();

    return win;
}

// ==========================================
// GLOBAL DRAG SYSTEM
// ==========================================

document.addEventListener("mousemove", e => {
    if (!activeDrag) return;

    const dx = e.clientX - activeDrag.startX;
    const dy = e.clientY - activeDrag.startY;

    activeDrag.window.style.left = activeDrag.left + dx + "px";
    activeDrag.window.style.top = activeDrag.top + dy + "px";
});

document.addEventListener("mouseup", () => {
    activeDrag = null;
});

// ==========================================
// FILE SYSTEM (LOCALSTORAGE)
// ==========================================

const FileSystem = {
    saveFile(filename, content) {
        filename = filename.trim();
        if (!filename) return alert("Enter filename");

        localStorage.setItem("os_file_" + filename, content);
        alert("Saved " + filename);
    },

    readFile(filename) {
        return localStorage.getItem("os_file_" + filename) || "";
    },

    deleteFile(filename) {
        localStorage.removeItem("os_file_" + filename);
    }
};

// ==========================================
// NOTES APP
// ==========================================

function openNotes(filename = "New_Note.txt") {

    const noteId = Math.random().toString(36).substring(2);
    const savedText = FileSystem.readFile(filename);

    const html = `
        <div style="padding:5px;background:#c0c0c0;display:flex;gap:5px;border-bottom:2px solid #000;">
            <input id="fname-${noteId}" value="${escapeHTML(filename)}" style="flex:1;padding:4px;">
            <button id="save-${noteId}">Save</button>
        </div>

        <textarea id="content-${noteId}"
            style="width:100%;height:calc(100% - 40px);border:none;padding:6px;">
            ${escapeHTML(savedText)}
        </textarea>
    `;

    const win = openWindow("Notes", html);

    setTimeout(() => {
        const btn = document.getElementById("save-" + noteId);

        if (!btn) return;

        btn.onclick = () => {
            const fname = document.getElementById("fname-" + noteId).value;
            const content = document.getElementById("content-" + noteId).value;

            FileSystem.saveFile(fname, content);
            renderFileExplorer();
        };
    }, 10);
}

// ==========================================
// FILE EXPLORER
// ==========================================

function getFilesList() {
    const files = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (key.startsWith("os_file_")) {
            files.push(key.replace("os_file_", ""));
        }
    }

    return files.sort();
}

function renderFileExplorer() {
    const container = document.getElementById("explorer-content");
    if (!container) return;

    const files = getFilesList();

    if (!files.length) {
        container.innerHTML = "<div style='padding:20px;color:gray;'>Empty</div>";
        return;
    }

    container.innerHTML = files.map(file => `
        <div>
            📄 ${escapeHTML(file)}
        </div>
    `).join("");
}

function openFileExplorer() {
    openWindow("File Explorer", `<div id="explorer-content"></div>`);
    setTimeout(renderFileExplorer, 20);
}

// ==========================================
// DESKTOP RENDER
// ==========================================

function renderDesktopApps() {
    const zone = document.getElementById("installed-apps-zone");
    if (!zone) return;
    zone.innerHTML = "";
}

// ==========================================
// PAINT INIT (SAFE PLACEHOLDER)
// ==========================================

function initPaint() {
    document.querySelectorAll("canvas[id^='paint-']").forEach(canvas => {
        if (canvas.dataset.init) return;
        canvas.dataset.init = "true";

        const ctx = canvas.getContext("2d");
        let drawing = false;

        canvas.addEventListener("mousedown", e => {
            drawing = true;
            const r = canvas.getBoundingClientRect();
            ctx.beginPath();
            ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
        });

        canvas.addEventListener("mousemove", e => {
            if (!drawing) return;

            const r = canvas.getBoundingClientRect();
            ctx.lineTo(e.clientX - r.left, e.clientY - r.top);
            ctx.stroke();
        });

        canvas.addEventListener("mouseup", () => drawing = false);
        canvas.addEventListener("mouseleave", () => drawing = false);
    });
}

// ==========================================
// DESKTOP INIT
// ==========================================

function initDesktop() {
    // placeholder for future icons system safety
}
