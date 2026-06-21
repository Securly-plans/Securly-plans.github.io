console.log("os.js OPENED");

"use strict";

/* =========================
   STATE
========================= */

let zIndexCounter = 100;
let activeDrag = null;

let installedApps = [];
let appRegistry = {};

/* =========================
   BOOT
========================= */

window.addEventListener("DOMContentLoaded", () => {
    initStartMenu();
    initClock();
    initDesktop();
    loadInstalledApps();
    renderAllApps();
});

/* =========================
   START MENU
========================= */

function initStartMenu() {
    const btn = document.getElementById("startButton");
    const menu = document.getElementById("startMenu");

    if (!btn || !menu) return;

    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.classList.toggle("show");
    });

    document.addEventListener("click", () => {
        menu.classList.remove("show");
    });
}

/* =========================
   CLOCK
========================= */

function initClock() {
    const clock = document.getElementById("clock");
    if (!clock) return;

    const update = () => {
        const d = new Date();
        clock.textContent = d.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    update();
    setInterval(update, 1000);
}

/* =========================
   DESKTOP
========================= */

function initDesktop() {
    const desktop = document.getElementById("desktop");
    if (!desktop) return;

    desktop.addEventListener("click", () => {
        document.getElementById("startMenu")?.classList.remove("show");
    });
}

/* =========================
   APPS LOADING
========================= */

function loadInstalledApps() {
    try {
        installedApps = JSON.parse(localStorage.getItem("installedApps")) || [];
    } catch {
        installedApps = [];
    }

    // fallback demo apps if empty
    if (installedApps.length === 0) {
        installedApps = [
            { id: "notes", name: "Notes", icon: "📄" },
            { id: "browser", name: "Browser", icon: "🌐" }
        ];
    }

    // build registry
    appRegistry = {};
    installedApps.forEach(app => {
        appRegistry[app.id] = app;
    });
}

/* =========================
   RENDER APPS
========================= */

function renderAllApps() {
    renderDesktopApps();
    renderStartMenuApps();
}

function renderDesktopApps() {
    const desktop = document.getElementById("desktop");
    if (!desktop) return;

    desktop.querySelectorAll(".app-icon").forEach(el => el.remove());

    installedApps.forEach(app => {
        const div = document.createElement("div");
        div.className = "app-icon";
        div.innerHTML = `${app.icon}<br>${app.name}`;

        div.onclick = () => launchApp(app.id);

        desktop.appendChild(div);
    });
}

function renderStartMenuApps() {
    const menu = document.getElementById("startMenu");
    if (!menu) return;

    menu.innerHTML = "";

    installedApps.forEach(app => {
        const item = document.createElement("div");
        item.className = "start-item";
        item.textContent = `${app.icon} ${app.name}`;

        item.onclick = () => launchApp(app.id);

        menu.appendChild(item);
    });
}

/* =========================
   APP LAUNCHER (FIXED CORE)
========================= */

function launchApp(appId) {
    const app = appRegistry[appId];

    if (!app) {
        console.warn("App not found:", appId);
        return;
    }

    createWindow(app);
}

function createWindow(app) {
    const win = document.createElement("div");
    win.className = "window";
    win.style.zIndex = ++zIndexCounter;

    win.innerHTML = `
        <div class="titlebar">
            <span>${app.icon} ${app.name}</span>
            <button class="close">X</button>
        </div>
        <div class="content">
            <div class="loading">Launching ${app.name}...</div>
        </div>
    `;

    document.body.appendChild(win);

    // FIX: immediate render override (prevents "stuck launching")
    setTimeout(() => {
        const content = win.querySelector(".content");
        content.innerHTML = getAppContent(app.id);
    }, 150);

    win.querySelector(".close").onclick = () => win.remove();
}

/* =========================
   APP CONTENT ROUTER
========================= */

function getAppContent(id) {
    switch (id) {
        case "notes":
            return `<textarea style="width:100%;height:100%"></textarea>`;

        case "browser":
            return `<iframe src="https://example.com" style="width:100%;height:100%;border:0;"></iframe>`;

        default:
            return `<div>App not implemented: ${id}</div>`;
    }
}

/* =========================
   EXPOSE GLOBALS
========================= */

function exposeGlobals() {
    window.launchApp = launchApp;
}

console.log("os.js RAN");
