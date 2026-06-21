// ==========================================
// EMERALD OS - FINAL FIXED DROP-IN CORE
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
// SESSION
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
// WINDOW SYSTEM + RESIZE FIX
// ================================

const WindowManager = {
    highestZ: 100,
    activeResize: null,

    create(title, content, w = 500, h = 350) {

        const win = document.createElement("div");
        win.className = "window";

        win.style.width = w + "px";
        win.style.height = h + "px";
        win.style.top = (60 + Math.random() * 80) + "px";
        win.style.left = (60 + Math.random() * 80) + "px";
        win.style.zIndex = ++this.highestZ;

        win.innerHTML = `
            <div class="title-bar">
                <span>${title}</span>
                <button class="close">X</button>
            </div>

            <div class="window-content" style="height:calc(100% - 22px); overflow:auto;">
                ${content}
            </div>

            <div class="resize-handle"></div>
        `;

        document.getElementById("windows-container").appendChild(win);

        win.querySelector(".close").onclick = () => win.remove();

        this.makeDraggable(win);
        this.makeResizable(win);

        return win;
    },

    focus(win) {
        win.style.zIndex = ++this.highestZ;
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

        document.addEventListener("mousemove", (e) => {
            if (!dragging) return;
            win.style.left = (e.clientX - ox) + "px";
            win.style.top = (e.clientY - oy) + "px";
        });

        document.addEventListener("mouseup", () => dragging = false);
    },

    makeResizable(win) {

        const handle = win.querySelector(".resize-handle");

        let resizing = false;
        let startX, startY, startW, startH;

        handle.onmousedown = (e) => {
            resizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startW = win.offsetWidth;
            startH = win.offsetHeight;
            e.stopPropagation();
        };

        document.addEventListener("mousemove", (e) => {
            if (!resizing) return;

            win.style.width = Math.max(250, startW + (e.clientX - startX)) + "px";
            win.style.height = Math.max(150, startH + (e.clientY - startY)) + "px";
        });

        document.addEventListener("mouseup", () => resizing = false);
    }
};

// ================================
// START MENU (FIXED)
// ================================

function setupStartMenu() {

    const startBtn = document.getElementById("start-btn");
    const startMenu = document.getElementById("start-menu");

    if (!startBtn || !startMenu) return;

    startBtn.onclick = (e) => {
        e.stopPropagation();
        startMenu.classList.toggle("show");
    };

    document.addEventListener("click", (e) => {
        if (!startMenu.contains(e.target) && e.target !== startBtn) {
            startMenu.classList.remove("show");
        }
    });
}

// ================================
// FILE SYSTEM (NOTES)
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

function loadFile(id) {
    const fs = getFS();
    const file = fs.find(f => f.id === id);
    if (!file) return;

    currentFileId = id;

    const n = document.getElementById("file-name");
    const c = document.getElementById("file-content");

    if (n) n.value = file.name;
    if (c) c.value = file.content;
}

function saveFile() {
    const fs = getFS();
    const file = fs.find(f => f.id === currentFileId);
    if (!file) return;

    file.name = document.getElementById("file-name").value;
    file.content = document.getElementById("file-content").value;
    file.updated = Date.now();

    saveFS(fs);
}

// ================================
// STORE APPS
// ================================

const STORE_APPS = [
    {
        id: "calc",
        name: "Calculator",
        icon: "🧮",
        run: () => `
            <input id="calc" readonly style="width:100%;font-size:18px;">
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px;">
                ${"789/456*123-0.=+".split("").map(c =>
                    `<button onclick="calc('${c}')">${c}</button>`
                ).join("")}
            </div>
        `
    },

    {
        id: "paint",
        name: "Paint",
        icon: "🎨",
        run: () => `
            <canvas id="paintCanvas" width="450" height="250"
                style="background:white;width:100%;"></canvas>
        `
    },

    {
        id: "browser",
        name: "Browser",
        icon: "🌐",
        run: () => `
            <iframe src="https://example.com"
                style="width:100%;height:100%;border:none;"></iframe>
        `
    }
];

// ================================
// INSTALL SYSTEM (FIXED SINGLE SOURCE)
// ================================

function getInstalled() {
    return JSON.parse(localStorage.getItem("os_installed_apps") || "[]");
}

function saveInstalled(list) {
    localStorage.setItem("os_installed_apps", JSON.stringify(list));
}

function installApp(id) {
    const list = getInstalled();
    if (!list.includes(id)) list.push(id);
    saveInstalled(list);
    renderDesktopApps();
}

function uninstallApp(id) {
    let list = getInstalled().filter(x => x !== id);
    saveInstalled(list);
    renderDesktopApps();
}

// ================================
// APP STORE UI
// ================================

function getAppStoreHTML() {

    const installed = getInstalled();

    return `
        <div style="padding:10px;">
            ${STORE_APPS.map(a => `
                <div style="border:1px solid #000;padding:8px;margin:5px;">
                    <b>${a.icon} ${a.name}</b><br>
                    ${
                        installed.includes(a.id)
                            ? `<button onclick="uninstallApp('${a.id}')">Uninstall</button>`
                            : `<button onclick="installApp('${a.id}')">Install</button>`
                    }
                </div>
            `).join("")}
        </div>
    `;
}

// ================================
// DESKTOP APPS (NO DUPLICATES FIX)
// ================================

function renderDesktopApps() {

    const zone = document.getElementById("installed-apps-zone");
    if (!zone) return;

    zone.innerHTML = "";

    const installed = getInstalled();

    installed.forEach(id => {

        const app = STORE_APPS.find(a => a.id === id);
        if (!app) return;

        const el = document.createElement("div");
        el.className = "icon";

        el.innerHTML = `${app.icon}<br>${app.name}`;

        el.onclick = () => WindowManager.create(app.name, app.run());

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
// GLOBAL FIXES (IMPORTANT)
// ================================

window.openFile = openFile;
window.loadFile = loadFile;
window.saveFile = saveFile;
window.createFile = createFile;

window.installApp = installApp;
window.uninstallApp = uninstallApp;
window.getAppStoreHTML = getAppStoreHTML;

window.Applications = Applications;

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

    console.log("Emerald OS FINAL FIX loaded");
});
