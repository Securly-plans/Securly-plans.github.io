/* =========================================================
   EMERALDOS 5.7 - SYSTEM SHELL
========================================================= */
import { SYSTEM_APPS, DEFAULT_SETTINGS, getApp, VERSION } from "./registry.js";
import { hasPermission } from "./permissions.js";
import { renderOffice, renderDocs, renderSheets, renderSlides } from "./emerald-office.js";
import { renderMail } from "./emerald-mail.js";
import { renderAppEditor } from "./developer.js";
import { renderUserAppstore } from "./appstore.js";
import { renderVirtueCreator, renderSystemCustomizer, launchStartupApps } from "./startup.js";

const WINDOWS = new Map();
let zIndexCounter = 100;
let dragState = null;
let resizeState = null;

const DEFAULT_APP_WINDOWS = {
    "emerald-mail": { width: 760, height: 520 },
    "emerald-office": { width: 760, height: 520 },
    "emerald-docs": { width: 790, height: 560 },
    "emerald-sheets": { width: 860, height: 560 },
    "emerald-slides": { width: 860, height: 580 },
    "app-editor": { width: 880, height: 620 },
    "user-appstore": { width: 760, height: 540 },
    "virtue-creator": { width: 760, height: 540 },
    "system-customizer": { width: 720, height: 500 }
};

const RENDERERS = {
    "emerald-mail": renderMail,
    "emerald-office": renderOffice,
    "emerald-docs": renderDocs,
    "emerald-sheets": renderSheets,
    "emerald-slides": renderSlides,
    "app-editor": renderAppEditor,
    "user-appstore": renderUserAppstore,
    "virtue-creator": renderVirtueCreator,
    "system-customizer": renderSystemCustomizer
};

function loadSettings() {
    try {
        return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem("emeraldos_57_settings")) || {}) };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

function saveSettings(settings) {
    localStorage.setItem("emeraldos_57_settings", JSON.stringify(settings));
}

function applySettings() {
    const settings = loadSettings();
    document.body.classList.toggle("theme-dark", settings.theme === "dark");
    document.body.classList.toggle("theme-emerald", settings.theme === "emerald");
    document.documentElement.style.setProperty("--icon-size", settings.iconSize || "medium");
}

function escapeHtml(value = "") {
    return String(value).replace(/[&<>'"]/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    }[char]));
}

function renderDesktop() {
    const desktop = document.getElementById("desktop");
    desktop.innerHTML = SYSTEM_APPS.map(app => `
        <button class="desktop-icon" data-os-action="open-app" data-app-id="${app.id}" title="${escapeHtml(app.description)}">
            <img src="${app.icon}" alt="">
            <span>${escapeHtml(app.name)}</span>
        </button>
    `).join("");
}

function renderStartMenu() {
    const startApps = document.getElementById("start-apps");
    startApps.innerHTML = SYSTEM_APPS.map(app => `
        <button class="start-item" data-os-action="open-app" data-app-id="${app.id}">
            <img src="${app.icon}" alt="">
            <span><strong>${escapeHtml(app.name)}</strong><br><small>${escapeHtml(app.category)}</small></span>
        </button>
    `).join("");
}

export function openApp(appId) {
    const app = getApp(appId);
    if (!app) return notify("Application not found", appId);

    const missing = (app.permissions || []).find(permission => !hasPermission(permission));
    if (missing) return notify("Permission blocked", `${app.name} requires ${missing}.`);

    const existing = WINDOWS.get(appId);
    if (existing) {
        existing.classList.remove("minimized");
        focusWindow(existing);
        return existing;
    }

    const renderer = RENDERERS[appId] || (() => `<div class="panel"><h2>${escapeHtml(app.name)}</h2><p>No renderer installed.</p></div>`);
    const size = DEFAULT_APP_WINDOWS[appId] || { width: 640, height: 460 };
    const bodyHtml = renderer({ app, os: window.EmeraldOS });
    return createWindow(app, bodyHtml, size);
}

export function createWindow(app, html, options = {}) {
    const win = document.createElement("section");
    win.className = "window";
    win.dataset.appId = app.id;
    win.style.width = `${options.width || 640}px`;
    win.style.height = `${options.height || 460}px`;
    win.style.left = `${options.left || 80 + WINDOWS.size * 28}px`;
    win.style.top = `${options.top || 42 + WINDOWS.size * 24}px`;
    win.innerHTML = `
        <header class="titlebar" data-window-role="drag">
            <div class="titlebar-title"><img src="${app.icon}" alt="">${escapeHtml(app.name)}</div>
            <div class="window-controls">
                <button class="window-control" title="Minimize" data-window-action="minimize">_</button>
                <button class="window-control" title="Maximize" data-window-action="maximize">□</button>
                <button class="window-control" title="Close" data-window-action="close">×</button>
            </div>
        </header>
        <main class="window-body">${html}</main>
        <div class="resize-handle" data-window-role="resize"></div>
    `;
    document.body.appendChild(win);
    WINDOWS.set(app.id, win);
    focusWindow(win);
    renderTaskbar();
    win.querySelector(".window-body").dispatchEvent(new CustomEvent("emeraldos:mounted", { bubbles: true, detail: { app } }));
    notify("Application opened", app.name);
    return win;
}

function focusWindow(win) {
    if (!win) return;
    win.style.zIndex = String(++zIndexCounter);
    document.querySelectorAll(".taskbar-button").forEach(btn => btn.classList.toggle("active", btn.dataset.appId === win.dataset.appId));
}

function closeWindow(win) {
    WINDOWS.delete(win.dataset.appId);
    win.remove();
    renderTaskbar();
}

function minimizeWindow(win) {
    win.classList.add("minimized");
    renderTaskbar();
}

function toggleMaximize(win) {
    win.classList.toggle("maximized");
}

function renderTaskbar() {
    const area = document.getElementById("taskbar-apps");
    area.innerHTML = [...WINDOWS.entries()].map(([appId, win]) => {
        const app = getApp(appId);
        const active = !win.classList.contains("minimized") ? "active" : "";
        return `<button class="taskbar-button ${active}" data-os-action="toggle-window" data-app-id="${appId}"><img src="${app.icon}" alt=""><span>${escapeHtml(app.name)}</span></button>`;
    }).join("");
}

function toggleWindow(appId) {
    const win = WINDOWS.get(appId);
    if (!win) return;
    if (win.classList.contains("minimized")) {
        win.classList.remove("minimized");
        focusWindow(win);
    } else {
        minimizeWindow(win);
    }
}

export function notify(title, message = "") {
    const item = { title, message, time: new Date().toLocaleString() };
    const all = getNotifications();
    all.unshift(item);
    localStorage.setItem("emeraldos_57_notifications", JSON.stringify(all.slice(0, 50)));
    renderNotifications();

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(message)}</span>`;
    document.getElementById("toast-area").appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
}

function getNotifications() {
    try { return JSON.parse(localStorage.getItem("emeraldos_57_notifications")) || []; }
    catch { return []; }
}

function renderNotifications() {
    const list = document.getElementById("notification-list");
    const items = getNotifications();
    list.innerHTML = items.length ? items.map(item => `
        <article class="notification-card">
            <strong>${escapeHtml(item.title)}</strong>
            <p>${escapeHtml(item.message)}</p>
            <small>${escapeHtml(item.time)}</small>
        </article>
    `).join("") : `<p>No notifications.</p>`;
}

function clearNotifications() {
    localStorage.setItem("emeraldos_57_notifications", "[]");
    renderNotifications();
}

function initClock() {
    const clock = document.getElementById("clock");
    const tick = () => clock.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    tick();
    setInterval(tick, 1000);
}

function initStartSearch() {
    const input = document.getElementById("start-search");
    input.addEventListener("input", () => {
        const q = input.value.trim().toLowerCase();
        document.querySelectorAll(".start-item").forEach(item => {
            item.style.display = item.textContent.toLowerCase().includes(q) ? "flex" : "none";
        });
    });
}

function initEvents() {
    document.getElementById("start-btn").addEventListener("click", event => {
        event.stopPropagation();
        document.getElementById("start-menu").classList.toggle("open");
    });

    document.getElementById("notification-btn").addEventListener("click", event => {
        event.stopPropagation();
        document.getElementById("notification-center").classList.toggle("open");
    });

    document.addEventListener("click", event => {
        const actionEl = event.target.closest("[data-os-action]");
        const windowActionEl = event.target.closest("[data-window-action]");
        const win = event.target.closest(".window");

        if (win) focusWindow(win);

        if (windowActionEl && win) {
            const action = windowActionEl.dataset.windowAction;
            if (action === "close") closeWindow(win);
            if (action === "minimize") minimizeWindow(win);
            if (action === "maximize") toggleMaximize(win);
            event.stopPropagation();
            return;
        }

        if (actionEl) {
            const action = actionEl.dataset.osAction;
            const appId = actionEl.dataset.appId;
            if (action === "open-app") {
                openApp(appId);
                document.getElementById("start-menu").classList.remove("open");
            }
            if (action === "toggle-window") toggleWindow(appId);
            if (action === "clear-notifications") clearNotifications();
            if (action === "restart") restartOS();
            event.stopPropagation();
            return;
        }

        if (!event.target.closest("#start-menu") && !event.target.closest("#start-btn")) {
            document.getElementById("start-menu").classList.remove("open");
        }
    });

    document.addEventListener("mousedown", event => {
        const win = event.target.closest(".window");
        if (!win) return;
        focusWindow(win);
        if (event.target.closest("[data-window-role='drag']") && !win.classList.contains("maximized")) {
            dragState = { win, x: event.clientX, y: event.clientY, left: win.offsetLeft, top: win.offsetTop };
            event.preventDefault();
        }
        if (event.target.closest("[data-window-role='resize']") && !win.classList.contains("maximized")) {
            resizeState = { win, x: event.clientX, y: event.clientY, width: win.offsetWidth, height: win.offsetHeight };
            event.preventDefault();
        }
    });

    document.addEventListener("mousemove", event => {
        if (dragState) {
            const left = dragState.left + (event.clientX - dragState.x);
            const top = dragState.top + (event.clientY - dragState.y);
            dragState.win.style.left = `${Math.max(0, left)}px`;
            dragState.win.style.top = `${Math.max(0, Math.min(top, window.innerHeight - 80))}px`;
        }
        if (resizeState) {
            resizeState.win.style.width = `${Math.max(310, resizeState.width + (event.clientX - resizeState.x))}px`;
            resizeState.win.style.height = `${Math.max(210, resizeState.height + (event.clientY - resizeState.y))}px`;
        }
    });

    document.addEventListener("mouseup", () => { dragState = null; resizeState = null; });
}

function restartOS() {
    [...WINDOWS.values()].forEach(win => win.remove());
    WINDOWS.clear();
    renderTaskbar();
    notify("EmeraldOS restarted", `Version ${VERSION} shell restarted.`);
}

function exposeApi() {
    window.EmeraldOS = {
        version: VERSION,
        apps: SYSTEM_APPS,
        openApp,
        notify,
        loadSettings,
        saveSettings: settings => { saveSettings(settings); applySettings(); },
        restart: restartOS,
        hasPermission
    };
}

window.addEventListener("DOMContentLoaded", () => {
    applySettings();
    exposeApi();
    renderDesktop();
    renderStartMenu();
    renderNotifications();
    initClock();
    initStartSearch();
    initEvents();
    launchStartupApps(window.EmeraldOS);
    notify("EmeraldOS 5.7 ready", "Developer tools, Office, Mail, and User Appstore are installed.");
});
