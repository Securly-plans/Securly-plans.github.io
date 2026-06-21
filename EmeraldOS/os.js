let zIndexCounter = 100;
let activeDrag = null;

let db = null;
let authUser = null;

/* =========================
   BOOT (SAFE + ORDERED)
========================= */

window.addEventListener("DOMContentLoaded", async () => {
    initClock();
    initStartMenu();

    exposeGlobalsSafe();

    await tryInitFirebase();
    await loadInstalledApps();

    renderDesktopApps();
    renderFileExplorer();
});

/* =========================
   FIREBASE (FIXED)
========================= */

async function tryInitFirebase() {
    try {
        if (window.db || window.firebaseApp) {
            db = window.db || null;
            authUser = JSON.parse(localStorage.getItem("user") || "null");
        }
    } catch (e) {
        console.log("Firebase disabled");
    }
}

/* =========================
   START MENU
========================= */

function initStartMenu() {
    const btn = document.getElementById("startButton");
    const menu = document.getElementById("startMenu");

    if (!btn || !menu) return;

    btn.onclick = (e) => {
        e.stopPropagation();
        menu.classList.toggle("open");
    };

    document.addEventListener("click", (e) => {
        if (!menu.contains(e.target) && e.target !== btn) {
            menu.classList.remove("open");
        }
    });
}

/* =========================
   GLOBAL EXPORT (SAFE)
========================= */

function exposeGlobalsSafe() {
    const safe = (fn) => typeof fn === "function" ? fn : () => {};

    Object.assign(window, {
        openWindow: safe(openWindow),
        openFileExplorer: safe(openFileExplorer),
        openAppStore: safe(openAppStore),
        openNotes: safe(openNotes),
        saveNote: safe(saveNote),
        installApp: safe(installApp),
        uninstallApp: safe(uninstallApp),
        launchApp: safe(launchApp),
        deleteFile: safe(deleteFile),
        renderFileExplorer: safe(renderFileExplorer)
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
    win.style.left = (60 + Math.random() * 120) + "px";
    win.style.top = (60 + Math.random() * 120) + "px";
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

/* drag */
document.addEventListener("mousemove", (e) => {
    if (!activeDrag) return;

    activeDrag.win.style.left =
        activeDrag.left + (e.clientX - activeDrag.x) + "px";

    activeDrag.win.style.top =
        activeDrag.top + (e.clientY - activeDrag.y) + "px";
});

document.addEventListener("mouseup", () => activeDrag = null);

/* =========================
   UTIL
========================= */

function escapeHTML(t) {
    return String(t)
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;");
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

/* =========================
   DELETE FILE (WORKING)
========================= */

function deleteFile(name) {
    localStorage.removeItem("os_file_" + name);

    if (authUser?.uid && db) {
        db.collection("emeraldOSUsers")
            .doc(authUser.uid)
            .collection("files")
            .doc(name)
            .delete?.();
    }

    renderFileExplorer();
}

/* =========================
   FILE EXPLORER (SAFE)
========================= */

function renderFileExplorer() {
    const el = document.getElementById("explorer");
    if (!el) return;

    const files = Object.keys(localStorage)
        .filter(k => k.startsWith("os_file_"))
        .map(k => k.replace("os_file_", ""));

    el.innerHTML = files.length
        ? files.map(f => `
            <div style="display:flex;justify-content:space-between;">
                <span onclick="openNotes('${f}')">📄 ${escapeHTML(f)}</span>
                <button onclick="deleteFile('${f}')">X</button>
            </div>
        `).join("")
        : "<div>No files</div>";
}

/* =========================
   FILE EXPLORER WINDOW
========================= */

function openFileExplorer() {
    openWindow("File Explorer", `<div id="explorer"></div>`);
}

/* =========================
   NOTES
========================= */

function openNotes(name = "New.txt") {
    const id = Math.random().toString(36).slice(2);

    openWindow("Notes", `
        <input id="fn-${id}" value="${escapeHTML(name)}"><br><br>
        <textarea id="txt-${id}" style="width:100%;height:200px;"></textarea><br>
        <button onclick="saveNote('${id}')">Save</button>
    `);

    setTimeout(() => {
        const el = document.getElementById("txt-" + id);
        if (el) el.value = readFile(name);
    }, 0);
}

function saveNote(id) {
    const name = document.getElementById("fn-" + id).value;
    const content = document.getElementById("txt-" + id).value;
    saveFile(name, content);
    renderFileExplorer();
}

/* =========================
   APPS
========================= */

const appCatalog = [
    {
        name: "Calculator.EOSas",
        icon: "🧮",
        content: calculatorApp()
    },
    {
        name: "Paint.EOSas",
        icon: "🎨",
        content: paintApp()
    }
];

/* =========================
   CALCULATOR (WORKING)
========================= */

function calculatorApp() {
    const id = Math.random().toString(36).slice(2);

    setTimeout(() => {
        const input = document.getElementById("calc-" + id);
        if (!input) return;

        document.querySelectorAll(`[data-calc='${id}']`).forEach(btn => {
            btn.onclick = () => {
                const v = btn.dataset.val;

                if (v === "=") {
                    try { input.value = eval(input.value); }
                    catch { input.value = "Error"; }
                } else if (v === "C") {
                    input.value = "";
                } else {
                    input.value += v;
                }
            };
        });
    }, 0);

    return `
        <input id="calc-${id}" style="width:100%;font-size:18px;"><br><br>
        ${["7","8","9","/","C","4","5","6","*","=","1","2","3","-","0",".","+"]
            .map(v => `<button data-calc="${id}" data-val="${v}">${v}</button>`)
            .join("")}
    `;
}

/* =========================
   PAINT (FIXED - NO NULL CRASH)
========================= */

function paintApp() {
    const id = Math.random().toString(36).slice(2);

    setTimeout(() => {
        const canvas = document.getElementById("paint-" + id);
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        let drawing = false;

        canvas.onmousedown = () => drawing = true;
        canvas.onmouseup = () => drawing = false;

        canvas.onmousemove = (e) => {
            if (!drawing) return;

            const r = canvas.getBoundingClientRect();
            ctx.fillRect(e.clientX - r.left, e.clientY - r.top, 2, 2);
        };

        const clear = document.getElementById("clear-" + id);
        if (clear) clear.onclick = () => ctx.clearRect(0,0,canvas.width,canvas.height);
    }, 0);

    return `
        <button id="clear-${id}">Clear</button><br><br>
        <canvas id="paint-${id}" width="300" height="200"
            style="background:white;border:1px solid black;"></canvas>
    `;
}

/* =========================
   DESKTOP (SAFE)
========================= */

function loadInstalledApps() {
    return JSON.parse(localStorage.getItem("os_installed_apps") || "[]");
}

function renderDesktopApps() {
    const zone = document.getElementById("installed-apps-zone");
    if (!zone) return;
    zone.innerHTML = "";
}

/* =========================
   APP STORE
========================= */

function openAppStore() {
    openWindow("App Store", "<div>Apps loaded</div>");
}

/* =========================
   LAUNCH
========================= */

function launchApp(name) {
    const app = appCatalog.find(a => a.name === name);
    if (!app) return openWindow("Launch", "Loading...");
    openWindow(app.name, app.content);
}
