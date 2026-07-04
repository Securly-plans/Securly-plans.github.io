/* =========================================================
   EMERALDOS 5.7 - USER APPSTORE
========================================================= */
import { readUserApps, writeUserApps } from "./developer.js";

const STORE_KEY = "emeraldos_57_store_apps";

function readStore() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || seedStore(); }
    catch { return seedStore(); }
}

function writeStore(apps) {
    localStorage.setItem(STORE_KEY, JSON.stringify(apps));
}

function seedStore() {
    const apps = [
        { id: "store-notepad-plus", title: "Notepad Plus", author: "Emerald Systems", description: "A simple sample text app for User Appstore testing.", version: "1.0.0", installed: false, verified: true },
        { id: "store-clock-panel", title: "Clock Panel", author: "Emerald Systems", description: "A small dashboard app concept for EmeraldOS windows.", version: "1.0.0", installed: false, verified: true }
    ];
    writeStore(apps);
    return apps;
}

function escapeHtml(value = "") {
    return String(value).replace(/[&<>'"]/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    }[char]));
}

export function renderUserAppstore({ os }) {
    setTimeout(() => bindAppstore(os), 0);
    return `
        <div class="app-layout appstore-app">
            <aside class="app-sidebar">
                <h3>User Appstore</h3>
                <button data-store-tab="featured">Featured Apps</button>
                <button data-store-tab="created">My Created Apps</button>
                <button data-store-publish>Publish Drafts</button>
            </aside>
            <main class="app-main">
                <div id="appstore-view"></div>
            </main>
        </div>
    `;
}

function bindAppstore(os) {
    const root = document.querySelector(".appstore-app");
    if (!root || root.dataset.bound) return;
    root.dataset.bound = "true";
    const view = root.querySelector("#appstore-view");

    const renderFeatured = () => {
        const apps = readStore();
        view.innerHTML = `<div class="toolbar"><strong>Featured User Apps</strong></div><div class="grid-list">${apps.map(app => `
            <article class="list-row">
                <div>
                    <strong>${escapeHtml(app.title)} ${app.verified ? "Verified" : ""}</strong>
                    <small>By ${escapeHtml(app.author)} - v${escapeHtml(app.version)}</small>
                    <p>${escapeHtml(app.description)}</p>
                </div>
                <button data-store-install="${app.id}">${app.installed ? "Uninstall" : "Install"}</button>
            </article>
        `).join("")}</div>`;
    };

    const renderCreated = () => {
        const apps = readUserApps();
        view.innerHTML = `<div class="toolbar"><strong>My Created Apps</strong></div><div class="grid-list">${apps.length ? apps.map(app => `
            <article class="list-row">
                <div>
                    <strong>${escapeHtml(app.title)}</strong>
                    <small>${app.published ? "Published" : "Draft"}</small>
                    <p>${escapeHtml(app.html).slice(0, 140)}</p>
                </div>
                <button data-store-publish-one="${app.id}">Publish</button>
            </article>
        `).join("") : `<p>No created apps yet. Use App Editor first.</p>`}</div>`;
    };

    root.addEventListener("click", event => {
        const tab = event.target.closest("[data-store-tab]");
        if (tab && tab.dataset.storeTab === "featured") renderFeatured();
        if (tab && tab.dataset.storeTab === "created") renderCreated();

        const install = event.target.closest("[data-store-install]");
        if (install) {
            const apps = readStore().map(app => app.id === install.dataset.storeInstall ? { ...app, installed: !app.installed } : app);
            writeStore(apps);
            os.notify("Appstore updated", "The app installation status changed.");
            renderFeatured();
        }

        const publishOne = event.target.closest("[data-store-publish-one]");
        if (publishOne) {
            const userApps = readUserApps().map(app => app.id === publishOne.dataset.storePublishOne ? { ...app, published: true } : app);
            writeUserApps(userApps);
            os.notify("App published", "Your app was marked as published.");
            renderCreated();
        }

        if (event.target.closest("[data-store-publish]")) {
            const userApps = readUserApps().map(app => ({ ...app, published: true }));
            writeUserApps(userApps);
            os.notify("Drafts published", "All created apps were marked as published.");
            renderCreated();
        }
    });

    renderFeatured();
}
