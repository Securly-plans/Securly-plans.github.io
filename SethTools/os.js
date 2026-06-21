// ==========================================
// EMERALD OS - STABLE DROP-IN BUILD
// FIXED GLOBALS + STORE + DESKTOP + FILES
// ==========================================

/* ================================
   SAFE GLOBAL ERROR HANDLING
================================ */
window.addEventListener("error", (e) => {
    console.warn("[OS ERROR]", e.message);
});

/* ================================
   FILE SYSTEM
================================ */
const FS_KEY = "emerald_fs";

function getFS() {
    return JSON.parse(localStorage.getItem(FS_KEY) || "[]");
}

function saveFS(fs) {
    localStorage.setItem(FS_KEY, JSON.stringify(fs));
}

/* ================================
   SESSION
================================ */
const Session = {
    check() {
        if (localStorage.getItem("loggedIn") !== "true") {
            location.href = "../index.html";
        }
    }
};

/* ================================
   CLOCK
================================ */
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

/* ================================
   WINDOW MANAGER (STABLE)
================================ */
const WindowManager = {
    z: 100,

    create(title, content, w = 520, h = 360) {

        const win = document.createElement("div");
        win.className = "window";

        win.style.width = w + "px";
        win.style.height = h + "px";
        win.style.left = (50 + Math.random() * 120) + "px";
        win.style.top = (50 + Math.random() * 120) + "px";
        win.style.zIndex = ++this.z;

        win.innerHTML = `
            <div class="title-bar">
                <span>${title}</span>
                <button class="close">X</button>
            </div>
            <div class="window-content">${content}</div>
        `;

        document.getElementById("windows-container")?.appendChild(win);

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
        win.style.zIndex = ++this.z;
    }
};

/* ================================
   START MENU
================================ */
function setupStartMenu() {
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

/* ================================
   FILE SYSTEM OPS
================================ */
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

    document.getElementById("file-name").value = file.name;
    document.getElementById("file-content").value = file.content;
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

function openFile(id) {
    const fs = getFS();
    const file = fs.find(f => f.id === id);
    if (!file) return;

    WindowManager.create(
        file.name,
        `<pre style="white-space:pre-wrap;">${file.content}</pre>`
    );
}

/* ================================
   APPS (BUILT-IN)
================================ */
const Applications = {

    notes(openId = null) {

        const fs = getFS();
        const notes = fs.filter(f => f.type === "note");

        WindowManager.create(
            "Notes",
            `
            <div style="display:flex;height:100%;">

                <div style="width:35%;border-right:1px solid #333;padding:6px;overflow:auto;">
                    <button onclick="createFile('note')">+ New</button>

                    ${notes.map(n => `
                        <div style="cursor:pointer;padding:4px;"
                             onclick="loadFile('${n.id}')">
                            📄 ${n.name}
                        </div>
                    `).join("")}
                </div>

                <div style="flex:1;display:flex;flex-direction:column;padding:10px;">
                    <input id="file-name" style="margin-bottom:8px;">
                    <textarea id="file-content" style="flex:1;"></textarea>
                    <button onclick="saveFile()">Save</button>
                </div>

            </div>
            `,
            750,
            450
        );

        if (openId) setTimeout(() => loadFile(openId), 50);
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
        WindowManager.create("App Store", getAppStoreHTML(), 520, 420);
    },

    system() {
        WindowManager.create(
            "System",
            `<h3>EmeraldOS</h3>
             <p>User: ${localStorage.getItem("osUsername") || "Guest"}</p>`
        );
    },

    chat() {
        WindowManager.create("Chat", "<p>Coming soon</p>");
    }
};

/* ================================
   STORE APPS
================================ */
const STORE_APPS = [
    {
        id: "calc",
        name: "Calculator",
        icon: "🧮",
        run: () => `
            <div>
                <h3>Calculator</h3>
                <input id="calc-display" style="width:100%;font-size:18px;">
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-top:10px;">
                    ${"789/456*123-0.=+".split("").map(c =>
                        `<button onclick="calcPress('${c}')">${c}</button>`
                    ).join("")}
                </div>
            </div>
        `
    },

    {
        id: "paint",
        name: "Paint",
        icon: "🎨",
        run: () => `<canvas id="paint-canvas" width="450" height="250" style="background:white;"></canvas>`
    },

    {
        id: "browser",
        name: "Browser",
        icon: "🌐",
        run: () => `<iframe src="https://example.com" style="width:100%;height:100%;border:none;"></iframe>`
    }
];

/* ================================
   STORE SYSTEM
================================ */
function getInstalledApps() {
    return JSON.parse(localStorage.getItem("os_installed_apps") || "[]");
}

function saveInstalledApps(list) {
    localStorage.setItem("os_installed_apps", JSON.stringify(list));
}

function installApp(id) {
    const list = getInstalledApps();
    if (!list.includes(id)) list.push(id);
    saveInstalledApps(list);
    renderDesktopApps();
}

function uninstallApp(id) {
    let list = getInstalledApps().filter(a => a !== id);
    saveInstalledApps(list);
    renderDesktopApps();
}

function getAppStoreHTML() {

    const installed = getInstalledApps();

    return `
        <div style="padding:10px;">
            ${STORE_APPS.map(app => `
                <div style="border:1px solid #000;padding:8px;margin:5px;">
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

/* ================================
   DESKTOP RENDER
================================ */
function renderDesktopApps() {

    const zone = document.getElementById("installed-apps-zone");
    if (!zone) return;

    zone.innerHTML = "";

    getInstalledApps().forEach(id => {

        const app = STORE_APPS.find(a => a.id === id);
        if (!app) return;

        const el = document.createElement("div");
        el.className = "icon";

        el.innerHTML = `${app.icon}<br>${app.name}`;

        el.onclick = () => WindowManager.create(app.name, app.run());

        el.oncontextmenu = (e) => {
            e.preventDefault();
            uninstallApp(id);
        };

        zone.appendChild(el);
    });
}

/* ================================
   DESKTOP ICONS
================================ */
function addDesktopIcon(icon, label, action) {
    const desktop = document.getElementById("desktop-icons");
    if (!desktop) return;

    const el = document.createElement("div");
    el.className = "icon";
    el.innerHTML = `${icon}<br>${label}`;
    el.onclick = action;

    desktop.appendChild(el);
}

/* ================================
   BOOT
================================ */
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

    console.log("Emerald OS stable loaded");
});

/* ================================
   GLOBAL EXPORT FIX (IMPORTANT)
================================ */
window.Applications = Applications;
window.openFile = openFile;
window.loadFile = loadFile;
window.saveFile = saveFile;
window.createFile = createFile;
window.renderDesktopApps = renderDesktopApps;
window.WindowManager = WindowManager;
window.installApp = installApp;
window.uninstallApp = uninstallApp;
