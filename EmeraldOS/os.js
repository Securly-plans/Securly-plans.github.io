"use strict";

/* =========================
   STATE
========================= */

let zIndexCounter = 100;

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

    // IMPORTANT: legacy HTML support
    exposeLegacyAPI();
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
   LOAD APPS
========================= */

function loadInstalledApps() {
    try {
        installedApps = JSON.parse(localStorage.getItem("installedApps")) || [];
    } catch {
        installedApps = [];
    }

    // fallback apps if none exist
    if (installedApps.length === 0) {
        installedApps = [
            { id: "notes", name: "Notes", icon: "📄" },
            { id: "files", name: "File Explorer", icon: "📁" },
            { id: "store", name: "App Store", icon: "🛒" }
        ];
    }

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

        div.addEventListener("click", () => launchApp(app.id));

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

        item.addEventListener("click", () => launchApp(app.id));

        menu.appendChild(item);
    });
}

/* =========================
   APP LAUNCHER
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

    // FIX: always replace loading state
    setTimeout(() => {
        const content = win.querySelector(".content");
        content.innerHTML = getAppContent(app.id);
    }, 120);

    win.querySelector(".close").onclick = () => win.remove();
}

/* =========================
   APP CONTENT
========================= */

function getAppContent(id) {
    switch (id) {
        case "notes":
            return `<textarea style="width:100%;height:100%;border:none;outline:none;"></textarea>`;

        case "files":
            return `<div>File Explorer (WIP)</div>`;

        case "store":
            return `<div>App Store (WIP)</div>`;

        default:
            return `<div>App not implemented: ${id}</div>`;
    }
}

/* =========================
   LEGACY FIX (YOUR ERROR FIX)
========================= */

function exposeLegacyAPI() {
    // These fix your current HTML errors immediately

    window.openNotes = () => launchApp("notes");
    window.openFileExplorer = () => launchApp("files");
    window.openAppStore = () => launchApp("store");
}

/* =========================
   OPTIONAL GLOBAL ACCESS
========================= */

window.launchApp = launchApp;
