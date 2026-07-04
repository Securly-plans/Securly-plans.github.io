/* =========================================================
   EMERALDOS 5.7 - APP EDITOR
========================================================= */
const USER_APPS_KEY = "emeraldos_57_user_apps";

function readUserApps() {
    try { return JSON.parse(localStorage.getItem(USER_APPS_KEY)) || []; }
    catch { return []; }
}

function writeUserApps(apps) {
    localStorage.setItem(USER_APPS_KEY, JSON.stringify(apps));
}

function defaultHtml() {
    return `<main style="font-family:Arial;padding:20px">
  <h1>My EmeraldOS App</h1>
  <p>This app was created in App Editor.</p>
  <button onclick="alert('Hello from EmeraldOS 5.7')">Test Button</button>
</main>`;
}

function escapeHtml(value = "") {
    return String(value).replace(/[&<>'"]/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    }[char]));
}

export function renderAppEditor({ os }) {
    setTimeout(() => bindAppEditor(os), 0);
    return `
        <section class="app-editor-app">
            <div class="toolbar">
                <input id="app-title" value="My App" style="min-width:190px">
                <button data-editor-preview>Preview</button>
                <button data-editor-save>Save App</button>
                <button data-editor-export>Export HTML</button>
            </div>
            <div class="app-layout">
                <aside class="app-sidebar">
                    <h3>Custom App API</h3>
                    <p><small>Available global: <strong>window.EmeraldOS</strong></small></p>
                    <ul>
                        <li>EmeraldOS.notify(title, body)</li>
                        <li>EmeraldOS.openApp(appId)</li>
                        <li>EmeraldOS.version</li>
                    </ul>
                </aside>
                <main class="app-main">
                    <label>HTML</label>
                    <textarea id="app-html" class="code-editor">${escapeHtml(defaultHtml())}</textarea>
                    <h3>Preview</h3>
                    <iframe id="app-preview" class="preview-frame" sandbox="allow-scripts allow-forms allow-modals"></iframe>
                </main>
            </div>
        </section>
    `;
}

function bindAppEditor(os) {
    const root = document.querySelector(".app-editor-app");
    if (!root || root.dataset.bound) return;
    root.dataset.bound = "true";
    const title = root.querySelector("#app-title");
    const html = root.querySelector("#app-html");
    const preview = root.querySelector("#app-preview");

    const updatePreview = () => {
        preview.srcdoc = html.value;
    };

    root.addEventListener("click", event => {
        if (event.target.closest("[data-editor-preview]")) updatePreview();
        if (event.target.closest("[data-editor-save]")) {
            const apps = readUserApps();
            const app = { id: `user_${Date.now()}`, title: title.value.trim() || "Untitled App", html: html.value, created: Date.now(), published: false };
            apps.unshift(app);
            writeUserApps(apps);
            os.notify("App saved", `${app.title} was saved to User Apps.`);
        }
        if (event.target.closest("[data-editor-export]")) {
            const blob = new Blob([html.value], { type: "text/html" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `${(title.value || "emeraldos-app").replace(/[^a-z0-9-_]+/gi, "-")}.html`;
            link.click();
            URL.revokeObjectURL(link.href);
        }
    });

    updatePreview();
}

export { readUserApps, writeUserApps };
