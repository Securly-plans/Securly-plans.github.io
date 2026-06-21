// ==========================================
// EMERALDOS - STABLE DROP-IN BUILD
// ==========================================

let zIndexCounter = 100;
let activeDrag = null;

// ==========================================
// BOOT SEQUENCE
// ==========================================

window.addEventListener("DOMContentLoaded", () => {
    initClock();
    initStartMenu();
    renderDesktopApps();
    initPaint();

    console.log("Emerald OS initialized");
});

// ==========================================
// CLOCK
// ==========================================

function initClock() {
    const clock = document.getElementById("clock");
    if (!clock) return;

    function tick() {
        clock.textContent = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    tick();
    setInterval(tick, 1000);
}

// ==========================================
// START MENU
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
        if (!startMenu.contains(e.target) && startMenu.classList.contains("show")) {
            startMenu.classList.remove("show");
            startBtn.style.borderColor = "#fff #000 #000 #fff";
            startBtn.style.background = "#c0c0c0";
        }
    });
}

// ==========================================
// ESCAPE HTML
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
            ${contentHTML}
        </div>
    `;

    container.appendChild(win);

    const tab = document.createElement("div");
    tab.className = "taskbar-tab active";
    tab.textContent = title;
    taskbar.appendChild(tab);

    function focusWindow() {
        win.style.display = "flex";
        win.style.zIndex = ++zIndexCounter;

        document.querySelectorAll(".taskbar-tab")
            .forEach(t => t.classList.remove("active"));

        tab.classList.add("active");
    }

    tab.addEventListener("click", () => {
        if (win.style.display === "none") {
            focusWindow();
        } else {
            win.style.display = "none";
            tab.classList.remove("active");
        }
    });

    win.addEventListener("mousedown", focusWindow);

    win.querySelector(".close-btn").addEventListener("click", () => {
        win.remove();
        tab.remove();
    });

    const titleBar = win.querySelector(".title-bar");

    titleBar.addEventListener("mousedown", e => {
        activeDrag = {
            win,
            startX: e.clientX,
            startY: e.clientY,
            left: win.offsetLeft,
            top: win.offsetTop
        };
    });

    focusWindow();

    return win;
}

// ==========================================
// DRAG SYSTEM
// ==========================================

document.addEventListener("mousemove", e => {
    if (!activeDrag) return;

    const dx = e.clientX - activeDrag.startX;
    const dy = e.clientY - activeDrag.startY;

    activeDrag.win.style.left = activeDrag.left + dx + "px";
    activeDrag.win.style.top = activeDrag.top + dy + "px";
});

document.addEventListener("mouseup", () => {
    activeDrag = null;
});

// ==========================================
// FILE SYSTEM
// ==========================================

const FileSystem = {
    saveFile(name, content) {
        if (!name) return alert("No filename");
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
    const text = FileSystem.readFile(filename);

    const html = `
        <div style="display:flex;gap:5px;background:#c0c0c0;padding:5px;">
            <input id="fn-${id}" value="${escapeHTML(filename)}" style="flex:1;">
            <button id="save-${id}">Save</button>
        </div>

        <textarea id="txt-${id}" style="width:100%;height:90%;">${escapeHTML(text)}</textarea>
    `;

    const win = openWindow("Notes", html);

    setTimeout(() => {
        const btn = document.getElementById("save-" + id);

        btn.onclick = () => {
            const name = document.getElementById("fn-" + id).value;
            const content = document.getElementById("txt-" + id).value;

            FileSystem.saveFile(name, content);
            renderFileExplorer();
        };
    }, 50);
}

// ==========================================
// FILE EXPLORER (FIXED CLICKABLE UI)
// ==========================================

function getFiles() {
    const out = [];

    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("os_file_")) {
            out.push(k.replace("os_file_", ""));
        }
    }

    return out.sort();
}

function deleteFile(name) {
    if (confirm("Delete " + name + "?")) {
        FileSystem.deleteFile(name);
        renderFileExplorer();
    }
}

function renderFileExplorer() {
    const el = document.getElementById("explorer-content");
    if (!el) return;

    const files = getFiles();

    if (!files.length) {
        el.innerHTML = "<div style='padding:10px;color:gray;'>Empty</div>";
        return;
    }

    let html = `
        <table style="width:100%;border-collapse:collapse;">
            <tr style="background:#ddd;">
                <th style="text-align:left;">File</th>
                <th>Actions</th>
            </tr>
    `;

    files.forEach(f => {
        html += `
            <tr>
                <td style="padding:5px;">📄 ${escapeHTML(f)}</td>
                <td style="text-align:center;">
                    <button onclick="openNotes('${f}')">Open</button>
                    <button onclick="deleteFile('${f}')" style="color:red;">Delete</button>
                </td>
            </tr>
        `;
    });

    html += "</table>";

    el.innerHTML = html;
}

function openFileExplorer() {
    openWindow("File Explorer", `<div id="explorer-content"></div>`);
    setTimeout(renderFileExplorer, 50);
}

// ==========================================
// DESKTOP APPS (SAFE)
// ==========================================

function renderDesktopApps() {}

// ==========================================
// PAINT (SAFE)
// ==========================================

function initPaint() {
    document.querySelectorAll("canvas[id^='paint-']").forEach(c => {
        if (c.dataset.init) return;
        c.dataset.init = "1";

        const ctx = c.getContext("2d");
        let draw = false;

        c.addEventListener("mousedown", e => {
            draw = true;
            const r = c.getBoundingClientRect();
            ctx.beginPath();
            ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
        });

        c.addEventListener("mousemove", e => {
            if (!draw) return;
            const r = c.getBoundingClientRect();
            ctx.lineTo(e.clientX - r.left, e.clientY - r.top);
            ctx.stroke();
        });

        c.addEventListener("mouseup", () => draw = false);
        c.addEventListener("mouseleave", () => draw = false);
    });
}
