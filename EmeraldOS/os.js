console.log("os.js OPENED");

"use strict";

/* =========================
   STATE
========================= */

let zIndexCounter = 100;
let activeDrag = null;

/* =========================
   BOOT (SAFE)
========================= */

window.addEventListener("DOMContentLoaded", () => {
    initStartMenu();
    initClock();
    initDesktop();
    exposeGlobals();
    loadInstalledApps();
    renderDesktopApps();
    renderFileExplorer();
});

/* =========================
   START MENU (FIXED 100%)
========================= */

function initStartMenu() {
    const btn = document.getElementById("start-btn");
    const menu = document.getElementById("start-menu");

    if (!btn || !menu) {
        console.warn("Start menu missing elements", { btn, menu });
        return;
    }

    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
        if (!menu.contains(e.target) && e.target !== btn) {
            menu.classList.remove("open");
        }
    });
}

/* =========================
   DESKTOP
========================= */

function initDesktop() {
    const zone = document.getElementById("installed-apps-zone");
    if (zone) zone.innerHTML = "";
}

/* =========================
   GLOBAL EXPORTS (SAFE)
========================= */

function exposeGlobals() {
    const safe = (name, fn) => {
        if (typeof fn === "function") window[name] = fn;
    };

    safe("openWindow", openWindow);
    safe("openNotes", openNotes);
    safe("openFileExplorer", openFileExplorer);
    safe("openAppStore", openAppStore);

    safe("installApp", installApp);
    safe("uninstallApp", uninstallApp);
    safe("launchApp", launchApp);

    safe("saveNote", saveNote);
    safe("renderFileExplorer", renderFileExplorer);
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
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

/* =========================
   FILE SYSTEM (LOCAL ONLY)
========================= */

function saveFile(name, content) {
    localStorage.setItem("os_file_" + name, content);
}

function readFile(name) {
    return localStorage.getItem("os_file_" + name) || "";
}

function renderFileExplorer() {
    const el = document.getElementById("explorer");
    if (!el) return;

    const files = Object.keys(localStorage)
        .filter(k => k.startsWith("os_file_"))
        .map(k => k.replace("os_file_", ""));

    el.innerHTML = files.length
        ? files.map(f => `<div onclick="openNotes('${f}')">📄 ${f}</div>`).join("")
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

    requestAnimationFrame(() => {
        const el = document.getElementById("txt-" + id);
        if (el) el.value = readFile(filename);
    });
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
        name: "Calculator",
        icon: "🧮",
        content: calculatorApp()
    },
    {
        name: "Paint",
        icon: "🎨",
        content: paintApp()
    }
];

/* =========================
   CALCULATOR (SAFE)
========================= */

function calculatorApp() {
    const id = Math.random().toString(36).slice(2);

    requestAnimationFrame(() => {
        const input = document.getElementById("calc-" + id);
        if (!input) return;

        document.querySelectorAll(`[data-calc="${id}"]`).forEach(b => {
            b.onclick = () => {
                const v = b.dataset.val;

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
    });

    return `
        <input id="calc-${id}" style="width:100%;font-size:20px;"><br><br>
        ${["7","8","9","/","C","4","5","6","*","=","1","2","3","-","0",".","+"]
            .map(v => `<button data-calc="${id}" data-val="${v}">${v}</button>`)
            .join("")}
    `;
}

/* =========================
   PAINT (FIXED CRASH)
========================= */

function paintApp() {
    const id = Math.random().toString(36).slice(2);

    requestAnimationFrame(() => {
        const canvas = document.getElementById("paint-" + id);
        if (!canvas) return;

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

        const clear = document.getElementById("clear-" + id);
        if (clear) {
            clear.onclick = () => ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    });

    return `
        <button id="clear-${id}">Clear</button><br>
        <canvas id="paint-${id}" width="300" height="200"
            style="border:1px solid black;background:white;"></canvas>
    `;
}

/* =========================
   APP STORE
========================= */

function openAppStore() {
    const html = appCatalog.map((a, i) => `
        <div>
            ${a.icon} <b>${a.name}</b><br>
            <button onclick="launchApp(${i})">Launch</button>
        </div>
    `).join("");

    openWindow("App Store", html);
}

function launchApp(i) {
    const app = appCatalog[i];
    if (!app) return openWindow("Error", "Missing app");
    openWindow(app.name, app.content);
}

/* =========================
   FILE EXPLORER
========================= */

function openFileExplorer() {
    openWindow("File Explorer", `<div id="explorer"></div>`);
}

/* =========================
   INSTALL SYSTEM (SIMPLE FIXED)
========================= */

function loadInstalledApps() {
    if (!localStorage.getItem("os_installed_apps")) {
        localStorage.setItem("os_installed_apps", "[]");
    }
}

function installApp(i) {
    let list = JSON.parse(localStorage.getItem("os_installed_apps") || "[]");
    if (!list.includes(appCatalog[i].name)) {
        list.push(appCatalog[i].name);
    }
    localStorage.setItem("os_installed_apps", JSON.stringify(list));
    renderDesktopApps();
}

function uninstallApp(i) {
    let list = JSON.parse(localStorage.getItem("os_installed_apps") || "[]");
    list = list.filter(n => n !== appCatalog[i].name);
    localStorage.setItem("os_installed_apps", JSON.stringify(list));
    renderDesktopApps();
}

function renderDesktopApps() {
    const zone = document.getElementById("installed-apps-zone");
    if (!zone) return;

    const installed = JSON.parse(localStorage.getItem("os_installed_apps") || "[]");

    zone.innerHTML = "";

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

console.log("os.js RAN");
