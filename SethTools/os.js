// ==========================================
// EMERALD OS - UPGRADED CORE SYSTEM
// ==========================================

// ================================
// FILE SYSTEM
// ================================

const FS_KEY = "emerald_fs";

function getFS() {
    return JSON.parse(localStorage.getItem(FS_KEY) || "[]");
}

function saveFS(fs) {
    localStorage.setItem(FS_KEY, JSON.stringify(fs));
}

// ================================
// SESSION (FIXED)
// ================================

const Session = {

    check() {
        if (localStorage.getItem("loggedIn") !== "true") {
            location.href = "../index.html";
        }
    },

    logout() {
        localStorage.removeItem("loggedIn");
        localStorage.removeItem("osUsername");
        location.href = "../index.html";
    }
};

// ================================
// CLOCK
// ================================

const Clock = {
    start() {
        this.update();
        setInterval(() => this.update(), 1000);
    },

    update() {
        const el = document.getElementById("clock");
        if (!el) return;

        el.textContent = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    }
};

// ================================
// WINDOW MANAGER (UNCHANGED CORE)
// ================================

const WindowManager = {

    highestZ: 100,

    create(title, content, w = 500, h = 350) {

        const win = document.createElement("div");
        win.className = "window";

        win.style.width = w + "px";
        win.style.height = h + "px";
        win.style.top = (50 + Math.random() * 120) + "px";
        win.style.left = (50 + Math.random() * 120) + "px";
        win.style.zIndex = ++this.highestZ;

        win.innerHTML = `
            <div class="title-bar">
                <span>${title}</span>
                <button class="close">X</button>
            </div>
            <div class="window-content">${content}</div>
        `;

        document.getElementById("windows-container").appendChild(win);

        win.querySelector(".close").onclick = () => win.remove();

        this.makeDraggable(win);

        return win;
    },

    makeDraggable(win) {

        const bar = win.querySelector(".title-bar");

        let dragging = false;
        let ox = 0, oy = 0;

        bar.onmousedown = (e) => {
            dragging = true;
            ox = e.clientX - win.offsetLeft;
            oy = e.clientY - win.offsetTop;
            this.focus(win);
        };

        document.onmousemove = (e) => {
            if (!dragging) return;

            win.style.left = (e.clientX - ox) + "px";
            win.style.top = (e.clientY - oy) + "px";
        };

        document.onmouseup = () => dragging = false;
    },

    focus(win) {
        win.style.zIndex = ++this.highestZ;
    }
};

// ================================
// START MENU
// ================================

function setupStartMenu() {

    const startBtn = document.getElementById("start-btn");
    const startMenu = document.getElementById("start-menu");

    if (!startBtn || !startMenu) return;

    startBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        startMenu.classList.toggle("show");
    });

    document.addEventListener("click", (e) => {
        if (!startMenu.contains(e.target)) {
            startMenu.classList.remove("show");
        }
    });
}

// ================================
// FILE SYSTEM
// ================================

let currentFileId = null;

function createFile(type = "note") {

    const fs = getFS();

    const file = {
        id: crypto.randomUUID(),
        name: "Untitled",
        type,
        content: "",
        created: Date.now(),
        updated: Date.now()
    };

    fs.push(file);
    saveFS(fs);

    Applications.notes(file.id);
}

// ================================
// APPLICATIONS (BUILT-IN)
// ================================

const Applications = {

    notes(openId = null) {

        const fs = getFS();
        const notes = fs.filter(f => f.type === "note");

        WindowManager.create(
            "Notes",
            `
            <div style="display:flex; height:100%;">

                <div style="width:35%; border-right:1px solid #333; padding:6px; overflow:auto;">
                    <button onclick="createFile('note')">+ New Note</button>

                    ${notes.map(n => `
                        <div style="padding:5px; cursor:pointer;"
                            onclick="loadFile('${n.id}')">
                            📄 ${n.name}
                        </div>
                    `).join("")}
                </div>

                <div style="flex:1; display:flex; flex-direction:column; padding:10px;">
                    <input id="file-name" style="margin-bottom:10px; padding:5px;">
                    <textarea id="file-content" style="flex:1;"></textarea>
                    <button onclick="saveFile()">Save</button>
                </div>

            </div>
            `,
            750,
            450
        );

        if (openId) {
            setTimeout(() => loadFile(openId), 80);
        }
    },

    files() {

        const fs = getFS();

        WindowManager.create(
            "File Explorer",
            `
            <div style="padding:10px;">
                ${fs.length === 0
                    ? "<p>No files</p>"
                    : fs.map(f => `
                        <div onclick="openFile('${f.id}')">
                            📄 ${f.name}
                        </div>
                    `).join("")
                }
            </div>
            `,
            500,
            400
        );
    },

    store() {
        WindowManager.create(
            "App Store",
            getAppStoreHTML(),
            500,
            400
        );
    },

    system() {
        WindowManager.create(
            "System",
            `
            <h3>EmeraldOS</h3>
            <p>User: ${localStorage.getItem("osUsername") || "Guest"}</p>
            `
        );
    },

    chat() {
        WindowManager.create("Chat", "<p>Coming soon</p>");
    }
};

// ================================
// FILE OPS
// ================================

function loadFile(id) {

    const fs = getFS();
    const file = fs.find(f => f.id === id);
    if (!file) return;

    currentFileId = id;

    document.getElementById("file-name").value = file.name;
    document.getElementById("file-content").value = file.content;
}

function saveFile() {

    const fs = getFS();
    const file = fs.find(f => f.id === currentFileId);
    if (!file) return;

    file.name = document.getElementById("file-name").value;
    file.content = document.getElementById("file-content").value;

    saveFS(fs);
}

// ================================
// APP STORE SYSTEM (NEW)
// ================================

const STORE_APPS = [
    {
        id: "calc",
        name: "Calculator",
        icon: "🧮",
        content: "<h3>Calculator App</h3>"
    },
    {
        id: "paint",
        name: "Paint",
        icon: "🎨",
        content: "<h3>Paint App</h3>"
    },
    {
        id: "browser",
        name: "Browser",
        icon: "🌐",
        content: "<iframe src='https://example.com' style='width:100%;height:100%;border:none'></iframe>"
    }
];

function getInstalledApps() {
    return JSON.parse(localStorage.getItem("os_installed_apps") || "[]");
}

function saveInstalledApps(list) {
    localStorage.setItem("os_installed_apps", JSON.stringify(list));
}

function installApp(id) {

    const app = STORE_APPS.find(a => a.id === id);
    if (!app) return;

    let installed = getInstalledApps();

    if (!installed.includes(id)) {
        installed.push(id);
        saveInstalledApps(installed);
    }

    renderDesktopApps();
}

function uninstallApp(id) {

    let installed = getInstalledApps();
    installed = installed.filter(a => a !== id);

    saveInstalledApps(installed);
    renderDesktopApps();
}

function getAppStoreHTML() {

    const installed = getInstalledApps();

    return `
        <div style="padding:10px;">
            ${STORE_APPS.map(app => `
                <div style="border:1px solid #000; padding:8px; margin:5px;">
                    <b>${app.icon} ${app.name}</b><br>
                    ${
                        installed.includes(app.id)
                        ? `<button onclick="uninstallApp('${app.id}')">Uninstall</button>`
                        : `<button onclick="installApp('${app.id}')">Install</button>`
                    }
                </div>
            `).join("")}
        </div>
    `;
}

// ================================
// DESKTOP APPS
// ================================

function renderDesktopApps() {

    const zone = document.getElementById("installed-apps-zone");
    if (!zone) return;

    zone.innerHTML = "";

    const installed = getInstalledApps();

    installed.forEach(id => {

        const app = STORE_APPS.find(a => a.id === id);
        if (!app) return;

        const el = document.createElement("div");
        el.className = "icon";

        el.innerHTML = `${app.icon}<br>${app.name}`;

        el.onclick = () => {
            WindowManager.create(app.name, app.content);
        };

        el.oncontextmenu = (e) => {
            e.preventDefault();
            uninstallApp(id);
        };

        zone.appendChild(el);
    });
}

// ================================
// DESKTOP ICONS
// ================================

function addDesktopIcon(icon, label, action) {

    const desktop = document.getElementById("desktop-icons");
    if (!desktop) return;

    const el = document.createElement("div");
    el.className = "icon";
    el.innerHTML = `${icon}<br>${label}`;
    el.onclick = action;

    desktop.appendChild(el);
}

// ================================
// BOOT
// ================================

window.addEventListener("DOMContentLoaded", () => {

    Session.check();
    Clock.start();
    setupStartMenu();

    addDesktopIcon("📁", "Files", () => Applications.files());
    addDesktopIcon("📝", "Notes", () => Applications.notes());
    addDesktopIcon("🛒", "Store", () => Applications.store());
    addDesktopIcon("💻", "System", () => Applications.system());
    addDesktopIcon("💬", "Chat", () => Applications.chat());

    renderDesktopApps();

    console.log("Emerald OS upgraded loaded");
});

// ==========================================
// GLOBAL BRIDGE (FIX HTML ONCLICK ERRORS)
// ==========================================

// File system functions (fix OS.html + File Explorer)
window.openFile = openFile;
window.loadFile = loadFile;
window.saveFile = saveFile;
window.createFile = createFile;

// App system (used by OS.html and start menu)
window.Applications = Applications;

// Direct app shortcuts (used in OS.html + start menu)
window.openAppStore = Applications.store;
window.openFileExplorer = Applications.files;
window.openNotes = Applications.notes;
window.openChat = Applications.chat;
window.openSystem = Applications.system;
