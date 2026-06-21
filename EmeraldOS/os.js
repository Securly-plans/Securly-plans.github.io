let zIndexCounter = 100;
let activeDrag = null;

/* =========================
   SAFE STATE
========================= */

let db = null;
let authUser = null;

/* =========================
   BOOT SEQUENCE (SAFE)
========================= */

window.addEventListener("DOMContentLoaded", async () => {
    try {
        initClock();
        initStartMenu(); // now guaranteed safe
        exposeGlobals();  // will NOT crash boot
        await tryInitFirebase();
        await loadInstalledApps();
        renderDesktopApps();
    } catch (err) {
        console.error("OS boot failed safely:", err);
    }
});

/* =========================
   FIREBASE HOOK (SAFE)
========================= */

async function tryInitFirebase() {
    try {
        if (window.db || window.firebaseApp) {
            db = window.db;
            authUser = JSON.parse(localStorage.getItem("user") || "null");
        }
    } catch (e) {
        console.log("Firebase not active, using local mode");
    }
}

/* =========================
   START MENU (FIXED)
========================= */

function initStartMenu() {
    const startButton = document.getElementById("startButton");
    const startMenu = document.getElementById("startMenu");

    if (!startButton || !startMenu) return;

    startButton.addEventListener("click", (e) => {
        e.stopPropagation();
        startMenu.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
        if (!startMenu.contains(e.target) && e.target !== startButton) {
            startMenu.classList.remove("open");
        }
    });
}

/* =========================
   GLOBAL EXPORT (SAFE HARDENED)
========================= */

function exposeGlobals() {
    const safe = (fn) => (typeof fn === "function" ? fn : () => {});

    Object.assign(window, {
        openWindow: safe(openWindow),
        openNotes: safe(openNotes),
        openFileExplorer: safe(openFileExplorer),
        openAppStore: safe(openAppStore),
        saveNote: safe(saveNote),
        installApp: safe(installApp),
        uninstallApp: safe(uninstallApp),
        deleteFile: safe(deleteFile),
        renderFileExplorer: safe(renderFileExplorer),
        launchApp: safe(launchApp)
    });
}

/* =========================
   CLOCK
========================= */

function initClock() {
    const clock = document.getElementById("clock");
    if (!clock) return;

    setInterval(() => {
        clock.textContent = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    }, 1000);
}

/* =========================
   WINDOW SYSTEM
========================= */

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
        <div class="window-content">${html}</div>
    `;

    container.appendChild(win);

    const tab = document.createElement("div");
    tab.className = "taskbar-tab";
    tab.textContent = title;
    taskbar.appendChild(tab);

    tab.onclick = () => win.remove();
    win.querySelector(".close-btn").onclick = () => win.remove();

    win.querySelector(".title-bar").onmousedown = (e) => {
        activeDrag = {
            win,
            x: e.clientX,
            y: e.clientY,
            left: win.offsetLeft,
            top: win.offsetTop
        };
    };
}

/* =========================
   DRAG SYSTEM
========================= */

document.addEventListener("mousemove", (e) => {
    if (!activeDrag) return;

    activeDrag.win.style.left =
        activeDrag.left + (e.clientX - activeDrag.x) + "px";

    activeDrag.win.style.top =
        activeDrag.top + (e.clientY - activeDrag.y) + "px";
});

document.addEventListener("mouseup", () => activeDrag = null);

/* =========================
   HTML SAFE
========================= */

function escapeHTML(t) {
    return String(t)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

/* =========================
   FILE SYSTEM
========================= */

function saveFile(name, content) {
    localStorage.setItem("os_file_" + name, content);

    if (authUser?.uid && db) {
        db.collection("emeraldOSUsers")
            .doc(authUser.uid)
            .collection("files")
            .doc(name)
            .set({ content });
    }
}

function readFile(name) {
    return localStorage.getItem("os_file_" + name) || "";
}

function deleteFile(name) {
    localStorage.removeItem("os_file_" + name);
}

/* =========================
   NOTES
========================= */

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
        const el = document.getElementById("txt-" + id);
        if (el) el.value = readFile(filename);
    }, 50);
}

function saveNote(id) {
    const name = document.getElementById("fn-" + id).value;
    const content = document.getElementById("txt-" + id).value;
    saveFile(name, content);
    renderFileExplorer();
}

/* =========================
   FILE EXPLORER FIX (MISSING FUNCTION FIXED)
========================= */

function renderFileExplorer() {
    const el = document.getElementById("explorer");
    if (!el) return;

    const files = Object.keys(localStorage)
        .filter(k => k.startsWith("os_file_"))
        .map(k => k.replace("os_file_", ""));

    el.innerHTML = files.length
        ? files.map(f => `<div>📄 ${f}</div>`).join("")
        : "<div>No files found</div>";
}

/* =========================
   APPS
========================= */

const appCatalog = [
    {
        name: "Calculator.EOSas",
        icon: "🧮",
        content: `<div>Calculator working (you can extend)</div>`
    },
    {
        name: "Paint.EOSas",
        icon: "🎨",
        content: `<div>Paint coming soon</div>`
    }
];

/* =========================
   INSTALLED APPS
========================= */

async function loadInstalledApps() {
    let apps = [];

    if (authUser?.uid && db) {
        try {
            const snap = await db.collection("emeraldOSUsers")
                .doc(authUser.uid)
                .get();

            apps = snap.data()?.installedApps || [];
        } catch {}
    }

    localStorage.setItem("os_installed_apps", JSON.stringify(apps));
}

function saveInstalledApps(apps) {
    localStorage.setItem("os_installed_apps", JSON.stringify(apps));

    if (authUser?.uid && db) {
        db.collection("emeraldOSUsers")
            .doc(authUser.uid)
            .set({ installedApps: apps }, { merge: true });
    }
}

/* =========================
   DESKTOP RENDER
========================= */

function renderDesktopApps() {
    const zone = document.getElementById("installed-apps-zone");
    if (!zone) return;

    zone.innerHTML = "";

    const installed = JSON.parse(
        localStorage.getItem("os_installed_apps") || "[]"
    );

    installed.forEach(name => {
        const app = appCatalog.find(a => a.name === name);

        const icon = document.createElement("div");
        icon.className = "icon";
        icon.innerHTML = "📦<br>" + escapeHTML(name);

        icon.onclick = () => {
            if (!app) return openWindow("Error", "App not found");
            openWindow(app.name, app.content);
        };

        zone.appendChild(icon);
    });
}

/* =========================
   INSTALL / UNINSTALL
========================= */

function installApp(index) {
    const app = appCatalog[index];
    let installed = JSON.parse(localStorage.getItem("os_installed_apps") || "[]");

    if (!installed.includes(app.name)) installed.push(app.name);

    saveInstalledApps(installed);
    renderDesktopApps();
}

function uninstallApp(index) {
    const app = appCatalog[index];
    let installed = JSON.parse(localStorage.getItem("os_installed_apps") || "[]");

    installed = installed.filter(a => a !== app.name);

    saveInstalledApps(installed);
    renderDesktopApps();
}

/* =========================
   FILE EXPLORER WINDOW
========================= */

function openFileExplorer() {
    openWindow("File Explorer", `<div id="explorer"></div>`);
}

/* =========================
   APP STORE
========================= */

function openAppStore() {
    const installed = JSON.parse(localStorage.getItem("os_installed_apps") || "[]");

    const html = appCatalog.map((a, i) => `
        <div style="border:1px solid #000;padding:10px;margin:5px;">
            ${a.icon} <b>${a.name}</b><br><br>
            ${
                installed.includes(a.name)
                    ? `<button onclick="uninstallApp(${i})">Uninstall</button>`
                    : `<button onclick="installApp(${i})">Install</button>`
            }
        </div>
    `).join("");

    openWindow("App Store", html);
}

/* =========================
   LAUNCH FIX
========================= */

function launchApp(name) {
    const app = appCatalog.find(a => a.name === name);

    if (!app) return openWindow("Launching", "Launching " + name + "...");

    openWindow(app.name, app.content);
}
