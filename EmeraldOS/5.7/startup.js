/* =========================================================
   EMERALDOS 5.7 - STARTUP + SYSTEM CUSTOMIZATION
========================================================= */
import { SYSTEM_APPS } from "./registry.js";

function getSettings(os) {
    return os.loadSettings();
}

function setSettings(os, settings) {
    os.saveSettings(settings);
}

function escapeHtml(value = "") {
    return String(value).replace(/[&<>'"]/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    }[char]));
}

export function launchStartupApps(os) {
    const settings = os.loadSettings();
    (settings.startupApps || []).forEach(appId => setTimeout(() => os.openApp(appId), 350));
}

export function renderSystemCustomizer({ os }) {
    setTimeout(() => bindSystemCustomizer(os), 0);
    const settings = getSettings(os);
    return `
        <section class="system-customizer-app">
            <div class="toolbar"><strong>System Customizer</strong></div>
            <div class="app-layout">
                <aside class="app-sidebar">
                    <h3>Settings</h3>
                    <button data-customizer-panel="appearance">Appearance</button>
                    <button data-customizer-panel="startup">Startup Apps</button>
                    <button data-customizer-panel="registry">Registry</button>
                </aside>
                <main class="app-main" id="customizer-view">
                    <div class="panel">
                        <h2>Appearance</h2>
                        <label>Theme</label><br>
                        <select id="customizer-theme">
                            <option value="classic" ${settings.theme === "classic" ? "selected" : ""}>Classic Win95</option>
                            <option value="emerald" ${settings.theme === "emerald" ? "selected" : ""}>Emerald</option>
                            <option value="dark" ${settings.theme === "dark" ? "selected" : ""}>Dark Emerald</option>
                        </select>
                        <br><br>
                        <button data-customizer-save-appearance>Apply Appearance</button>
                    </div>
                </main>
            </div>
        </section>
    `;
}

function bindSystemCustomizer(os) {
    const root = document.querySelector(".system-customizer-app");
    if (!root || root.dataset.bound) return;
    root.dataset.bound = "true";
    const view = root.querySelector("#customizer-view");

    const renderStartup = () => {
        const settings = getSettings(os);
        view.innerHTML = `<div class="panel"><h2>Startup Apps</h2><p>Choose apps to open automatically after EmeraldOS starts.</p>
            ${SYSTEM_APPS.map(app => `
                <label style="display:block;margin:5px 0">
                    <input type="checkbox" data-startup-app="${app.id}" ${(settings.startupApps || []).includes(app.id) ? "checked" : ""}>
                    ${escapeHtml(app.name)}
                </label>
            `).join("")}
            <button data-customizer-save-startup>Save Startup Apps</button>
        </div>`;
    };

    const renderRegistry = () => {
        view.innerHTML = `<div class="panel"><h2>Registry Preview</h2><p>This is a safe settings preview stored in localStorage.</p><textarea class="code-editor" readonly>${escapeHtml(JSON.stringify(getSettings(os), null, 2))}</textarea></div>`;
    };

    root.addEventListener("click", event => {
        const panel = event.target.closest("[data-customizer-panel]");
        if (panel && panel.dataset.customizerPanel === "startup") renderStartup();
        if (panel && panel.dataset.customizerPanel === "registry") renderRegistry();
        if (panel && panel.dataset.customizerPanel === "appearance") {
            const settings = getSettings(os);
            view.innerHTML = `<div class="panel"><h2>Appearance</h2><label>Theme</label><br><select id="customizer-theme"><option value="classic" ${settings.theme === "classic" ? "selected" : ""}>Classic Win95</option><option value="emerald" ${settings.theme === "emerald" ? "selected" : ""}>Emerald</option><option value="dark" ${settings.theme === "dark" ? "selected" : ""}>Dark Emerald</option></select><br><br><button data-customizer-save-appearance>Apply Appearance</button></div>`;
        }
        if (event.target.closest("[data-customizer-save-appearance]")) {
            const settings = getSettings(os);
            settings.theme = root.querySelector("#customizer-theme").value;
            setSettings(os, settings);
            os.notify("Appearance applied", `Theme changed to ${settings.theme}.`);
        }
        if (event.target.closest("[data-customizer-save-startup]")) {
            const settings = getSettings(os);
            settings.startupApps = [...root.querySelectorAll("[data-startup-app]:checked")].map(input => input.dataset.startupApp);
            setSettings(os, settings);
            os.notify("Startup apps saved", `${settings.startupApps.length} startup app(s) selected.`);
        }
    });
}

export function renderVirtueCreator({ os }) {
    setTimeout(() => bindVirtueCreator(os), 0);
    return `
        <section class="virtue-creator-app">
            <div class="toolbar"><strong>Virtue Creator</strong></div>
            <div class="app-main">
                <div class="panel">
                    <h2>Creator Mode</h2>
                    <p>Virtue Creator adds advanced publishing and customization tools for EmeraldOS developers.</p>
                    <button data-virtue-open="app-editor">Open App Editor</button>
                    <button data-virtue-open="user-appstore">Open User Appstore</button>
                    <button data-virtue-open="system-customizer">Open System Customizer</button>
                </div>
                <div class="panel">
                    <h3>5.7 Creator Features</h3>
                    <ul>
                        <li>Custom app previews</li>
                        <li>User Appstore publishing flow</li>
                        <li>Startup and theme customization</li>
                        <li>Local storage API starter layer</li>
                    </ul>
                </div>
            </div>
        </section>
    `;
}

function bindVirtueCreator(os) {
    const root = document.querySelector(".virtue-creator-app");
    if (!root || root.dataset.bound) return;
    root.dataset.bound = "true";
    root.addEventListener("click", event => {
        const open = event.target.closest("[data-virtue-open]");
        if (open) os.openApp(open.dataset.virtueOpen);
    });
}
