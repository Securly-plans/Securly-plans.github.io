let zIndexCounter = 100;
let activeDrag = null;

let db = null;
let authUser = null;

/* =========================
   BOOT
========================= */

window.addEventListener("DOMContentLoaded", async () => {
    initClock();
    initStartMenu();
    initDesktop();
    exposeGlobalsSafe();

    await tryInitFirebase();
    await loadInstalledApps();
    renderDesktopApps();
    renderFileExplorer();
});

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
   DESKTOP INIT
========================= */

function initDesktop() {
    const zone = document.getElementById("installed-apps-zone");
    if (!zone) return;
    zone.innerHTML = "";
}

/* =========================
   GLOBALS SAFE
========================= */

function exposeGlobalsSafe() {
    window.openWindow = openWindow;
    window.openAppStore = openAppStore;
    window.openFileExplorer = openFileExplorer;
    window.openNotes = openNotes;
    window.saveNote = saveNote;
    window.installApp = installApp;
    window.uninstallApp = uninstallApp;
    window.launchApp = launchApp;
    window.renderFileExplorer = renderFileExplorer;
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
    win.style.left = 60 + Math.random() * 120 + "px";
    win.style.top = 60 + Math.random() * 120 + "px";
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
    return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

/* =========================
   FILE SYSTEM (FIXED)
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

/* IMPORTANT FIX: always renders correctly */
function renderFileExplorer() {
    const el = document.getElementById("explorer");
    if (!el) return;

    const files = Object.keys(localStorage)
        .filter(k => k.startsWith("os_file_"))
        .map(k => k.replace("os_file_", ""));

    el.innerHTML = files.length
        ? files.map(f => `
            <div onclick="openNotes('${f}')">📄 ${f}</div>
        `).join("")
        : "<div>No files</div>";
}

/* =========================
   NOTES
========================= */

function openNotes(filename = "New.txt") {
    const id = Math.random().toString(36).slice(2);

    openWindow("Notes", `
        <input id="fn-${id}" value="${escapeHTML(filename)}"><br><br>
        <textarea id="txt-${id}" style="width:100%;height:200px;"></textarea><br>
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
   APP SYSTEM
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
        const buttons = document.querySelectorAll("[data-calc='" + id + "']");

        buttons.forEach(b => {
            b.onclick = () => {
                const val = b.dataset.val;

                if (val === "=") {
                    try {
                        input.value = eval(input.value);
                    } catch {
                        input.value = "Error";
                    }
                } else if (val === "C") {
                    input.value = "";
                } else {
                    input.value += val;
                }
            };
        });
    }, 50);

    return `
        <input id="calc-${id}" style="width:100%;font-size:20px;"><br><br>

        <div>
            ${["7","8","9","/","C",
               "4","5","6","*","=",
               "1","2","3","-",
               "0",".","+"]
            .map(v => `
                <button data-calc="${id}" data-val="${v}" style="width:40px;height:40px;">${v}</button>
            `).join("")}
        </div>
    `;
}

/* =========================
   PAINT (SIMPLE MS PAINT COPY)
========================= */

function paintApp() {
    const id = Math.random().toString(36).slice(2);

    setTimeout(() => {
        const canvas = document.getElementById("paint-" + id);
        const ctx = canvas.getContext("2d");

        let drawing = false;

        canvas.onmousedown = () => drawing = true;
        canvas.onmouseup = () => drawing = false;
        canvas.onmousemove = (e) => {
            if (!drawing) return;

            const rect = canvas.getBoundingClientRect();
            ctx.fillStyle = "black";
            ctx.fillRect(e.clientX - rect.left, e.clientY - rect.top, 2, 2);
        };

        document.getElementById("clear-" + id).onclick = () => {
            ctx.clearRect(0,0,canvas.width,canvas.height);
        };
    }, 50);

    return `
        <button id="clear-${id}">Clear</button><br>
        <canvas id="paint-${id}" width="300" height="200"
            style="border:1px solid black;background:white;"></canvas>
    `;
}

/* =========================
   INSTALL SYSTEM
========================= */

function installApp(i) {
    let installed = JSON.parse(localStorage.getItem("os_installed_apps") || "[]");
    if (!installed.includes(appCatalog[i].name)) {
        installed.push(appCatalog[i].name);
    }
    localStorage.setItem("os_installed_apps", JSON.stringify(installed));
    renderDesktopApps();
}

function uninstallApp(i) {
    let installed = JSON.parse(localStorage.getItem("os_installed_apps") || "[]");
    installed = installed.filter(a => a !== appCatalog[i].name);
    localStorage.setItem("os_installed_apps", JSON.stringify(installed));
    renderDesktopApps();
}

/* =========================
   DESKTOP
========================= */

function loadInstalledApps() {
    let apps = JSON.parse(localStorage.getItem("os_installed_apps") || "[]");
    localStorage.setItem("os_installed_apps", JSON.stringify(apps));
}

function renderDesktopApps() {
    const zone = document.getElementById("installed-apps-zone");
    if (!zone) return;

    zone.innerHTML = "";

    const installed = JSON.parse(localStorage.getItem("os_installed_apps") || "[]");

    installed.forEach(name => {
        const app = appCatalog.find(a => a.name === name);
        const div = document.createElement("div");

        div.className = "icon";
        div.innerHTML = "📦<br>" + escapeHTML(name);

        div.onclick = () => {
            if (!app) return openWindow("Error", "Missing app");
            openWindow(app.name, app.content);
        };

        zone.appendChild(div);
    });
}

/* =========================
   APP STORE
========================= */

function openAppStore() {
    const installed = JSON.parse(localStorage.getItem("os_installed_apps") || "[]");

    const html = appCatalog.map((a,i) => `
        <div>
            ${a.icon} <b>${a.name}</b><br>
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
   FILE EXPLORER
========================= */

function openFileExplorer() {
    openWindow("File Explorer", `<div id="explorer"></div>`);
}

/* =========================
   LAUNCH
========================= */

function launchApp(name) {
    const app = appCatalog.find(a => a.name === name);
    if (!app) return openWindow("Launching", "Loading " + name);
    openWindow(app.name, app.content);
}
