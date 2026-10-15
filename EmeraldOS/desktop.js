"use strict";

/* =========================
   DESKTOP STATE
========================= */

let desktopState = {
    wallpaper: null,
    shortcuts: [],
    windows: []
};

/* =========================
   BOOT
========================= */

export function initDesktop() {
    loadDesktop();
    renderDesktop();
    restoreWindows();
}

/* =========================
   SAVE / LOAD
========================= */

function saveDesktop() {
    localStorage.setItem(
        "emerald_desktop",
        JSON.stringify(desktopState)
    );
}

function loadDesktop() {
    const saved = localStorage.getItem("emerald_desktop");

    if (!saved) return;

    try {
        desktopState = JSON.parse(saved);
    } catch {
        desktopState = {
            wallpaper: null,
            shortcuts: [],
            windows: []
        };
    }
}

/* =========================
   WALLPAPER
======================== */

export function setWallpaper(url) {
    desktopState.wallpaper = url;

    document.body.style.backgroundImage = `url(${url})`;
    document.body.style.backgroundSize = "cover";

    saveDesktop();
}

function applyWallpaper() {
    if (!desktopState.wallpaper) return;

    document.body.style.backgroundImage = `url(${desktopState.wallpaper})`;
    document.body.style.backgroundSize = "cover";
}

/* =========================
   SHORTCUTS (DESKTOP ICONS)
========================= */

export function createShortcut(id, name) {
    if (desktopState.shortcuts.some(s => s.id === id)) return;

    desktopState.shortcuts.push({
        id,
        name,
        x: 20,
        y: 20
    });

    saveDesktop();
    renderDesktop();
}

export function removeShortcut(id) {
    desktopState.shortcuts =
        desktopState.shortcuts.filter(s => s.id !== id);

    saveDesktop();
    renderDesktop();
}

/* =========================
   RENDER DESKTOP ICONS
========================= */

function renderDesktop() {
    applyWallpaper();

    const desktop = document.getElementById("desktop");
    if (!desktop) return;

    desktop.querySelectorAll(".desktop-icon").forEach(i => i.remove());

    desktopState.shortcuts.forEach(icon => {
        const div = document.createElement("div");

        div.className = "desktop-icon";

        div.style.position = "absolute";
        div.style.left = icon.x + "px";
        div.style.top = icon.y + "px";

        div.innerHTML = `
            <div style="font-size:32px;text-align:center;">📄</div>
            <div style="color:white;text-align:center;font-size:12px;margin-top:4px;">
                ${icon.name}
            </div>
        `;

        div.ondblclick = () => {
            if (window.openFile) {
                window.openFile(icon.id);
            }
        };

        enableDragging(div, icon);
        desktop.appendChild(div);
    });
}

/* =========================
   ICON DRAGGING
========================= */

function enableDragging(el, icon) {
    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    el.onmousedown = (e) => {
        dragging = true;

        offsetX = e.clientX - el.offsetLeft;
        offsetY = e.clientY - el.offsetTop;
    };

    document.addEventListener("mousemove", e => {
        if (!dragging) return;

        icon.x = e.clientX - offsetX;
        icon.y = e.clientY - offsetY;

        el.style.left = icon.x + "px";
        el.style.top = icon.y + "px";
    });

    document.addEventListener("mouseup", () => {
        if (!dragging) return;

        dragging = false;
        saveDesktop();
    });
}

/* =========================
   WINDOW SYSTEM (SESSION)
========================= */

export function registerWindow(data) {
    const exists = desktopState.windows.find(w => w.id === data.id);
    if (exists) return;

    desktopState.windows.push(data);
    saveDesktop();
}

export function unregisterWindow(id) {
    desktopState.windows =
        desktopState.windows.filter(w => w.id !== id);

    saveDesktop();
}

export function updateWindowState(id, changes) {
    const win = desktopState.windows.find(w => w.id === id);
    if (!win) return;

    Object.assign(win, changes);
    saveDesktop();
}

/* =========================
   RESTORE WINDOWS
========================= */

function restoreWindows() {

    if (!window.openWindow) return;

    desktopState.windows.forEach(win => {

        // ❌ skip broken/empty windows
        if (!win.html && !win.app) return;

        const w = window.openWindow(
            win.title,
            win.html || "",
            win.app || ""
        );

        w.style.left = (win.x || 80) + "px";
        w.style.top = (win.y || 80) + "px";
        w.style.width = (win.width || 500) + "px";
        w.style.height = (win.height || 350) + "px";
    });
}
/* =========================
   CLEAR SESSION
========================= */

export function clearDesktop() {
    desktopState.windows = [];
    saveDesktop();
}

/* =========================
   SHUTDOWN SCREEN
========================= */

export function shutdownDesktop() {
    saveDesktop();

    document.body.innerHTML = `
        <div style="
            position:fixed;
            inset:0;
            background:black;
            color:white;
            display:flex;
            justify-content:center;
            align-items:center;
            font-family:Tahoma;
            font-size:24px;
        ">
            Windows is shutting down...
        </div>
    `;
}
