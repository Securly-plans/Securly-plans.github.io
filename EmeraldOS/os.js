let zIndexCounter = 100;
let activeDrag = null;

// ==========================================
// BOOT
// ==========================================

window.addEventListener("DOMContentLoaded", () => {
    initClock();
    initStartMenu();
    renderDesktopApps();
    exposeGlobals();
});

// ==========================================
// GLOBAL FIX (IMPORTANT)
// ==========================================

function exposeGlobals() {
    Object.assign(window, {
        openWindow,
        openNotes,
        openFileExplorer,
        openAppStore,
        saveNote,
        deleteFile,
        renderFileExplorer,
        installApp,
        uninstallApp,
        FileSystem
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
    win.style.top = (50 + Math.random() * 100) + "px";
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
    tab.className = "taskbar-tab";
    tab.textContent = title;
    taskbar.appendChild(tab);

    tab.onclick = () => {
        win.remove();
        tab.remove();
    };

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
// DRAGGING
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
// FILE SYSTEM
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
// NOTES + FIX saveNote ERROR
// ==========================================

function openNotes(filename = "New.txt") {
    const id = Math.random().toString(36).slice(2);

    openWindow("Notes", `
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
// FILE EXPLORER (FIXED CLICKING)
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
    setTimeout(renderFileExplorer, 80);
}

// ==========================================
// ===============================
// APP STORE (RESTORED)
// ===============================
// ==========================================

function openAppStore() {
    const apps = [
        { name: "Notes", icon: "📄", desc: "Text editor" },
        { name: "File Explorer", icon: "📁", desc: "Browse files" },
        { name: "Paint", icon: "🎨", desc: "Draw canvas" }
    ];

    const installed = JSON.parse(
        localStorage.getItem("os_installed_apps") || "[]"
    );

    const html = apps.map(app => {
        const isInstalled = installed.includes(app.name);

        return `
            <div style="
                border:2px solid #000;
                padding:10px;
                margin:5px;
                background:#e0e0e0;
                width:150px;
            ">
                <div style="font-size:30px;">${app.icon}</div>
                <b>${escapeHTML(app.name)}</b><br>
                <small>${app.desc}</small><br><br>

                ${
                    isInstalled
                        ? `<button onclick="uninstallApp('${app.name}')">Uninstall</button>`
                        : `<button onclick="installApp('${app.name}')">Install</button>`
                }
            </div>
        `;
    }).join("");

    openWindow("App Store", `
        <div style="display:flex;flex-wrap:wrap;">
            ${html}
        </div>
    `);
}

// ==========================================
// INSTALL / UNINSTALL
// ==========================================

function installApp(name) {
    let installed = JSON.parse(
        localStorage.getItem("os_installed_apps") || "[]"
    );

    if (!installed.includes(name)) {
        installed.push(name);
    }

    localStorage.setItem(
        "os_installed_apps",
        JSON.stringify(installed)
    );

    renderDesktopApps();
    openAppStore();
}

function uninstallApp(name) {
    let installed = JSON.parse(
        localStorage.getItem("os_installed_apps") || "[]"
    );

    installed = installed.filter(a => a !== name);

    localStorage.setItem(
        "os_installed_apps",
        JSON.stringify(installed)
    );

    renderDesktopApps();
    openAppStore();
}

// ==========================================
// DESKTOP ICONS
// ==========================================

function renderDesktopApps() {
    const zone = document.getElementById("installed-apps-zone");
    if (!zone) return;

    zone.innerHTML = "";

    const installed = JSON.parse(
        localStorage.getItem("os_installed_apps") || "[]"
    );

    installed.forEach(app => {
        const icon = document.createElement("div");
        icon.className = "icon";
        icon.innerHTML = "📦<br>" + escapeHTML(app);

        icon.onclick = () => {
            openWindow(app, `<div>Launching ${app}...</div>`);
        };

        zone.appendChild(icon);
    });
}
