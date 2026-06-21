// ==========================================
// EMERALD OS - FULL MERGED CORE
// ==========================================

// ================================
// FILE SYSTEM (os-storage.js)
// ================================

const FS_KEY = "emerald_fs";

function getFS() {
    return JSON.parse(localStorage.getItem(FS_KEY) || "[]");
}

function saveFS(fs) {
    localStorage.setItem(FS_KEY, JSON.stringify(fs));
}

// ================================
// SESSION
// ================================

const Session = {

    check() {
        if (localStorage.getItem("loggedIn") !== "true") {
            location.href = "../index.html";
        }
    },

    logout() {
        localStorage.removeItem("osLoggedIn");
        location.href = "index.html";
    }
};

// ================================
// CLOCK
// ================================

const Clock = {

    start() {
        this.update();
        setInterval(() => this.update(), 1000);
    },

    update() {
        const el = document.getElementById("clock");
        if (!el) return;

        el.textContent = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    }
};

// ================================
// WINDOW SYSTEM
// ================================

const WindowManager = {

    highestZ: 100,

    create(title, content, w = 500, h = 350) {

        const win = document.createElement("div");
        win.className = "window";

        win.style.width = w + "px";
        win.style.height = h + "px";
        win.style.top = (50 + Math.random() * 120) + "px";
        win.style.left = (50 + Math.random() * 120) + "px";
        win.style.zIndex = ++this.highestZ;

        win.innerHTML = `
            <div class="title-bar">
                <span>${title}</span>
                <button class="close">X</button>
            </div>
            <div class="window-content">${content}</div>
        `;

        document.getElementById("windows-container").appendChild(win);

        win.querySelector(".close").onclick = () => win.remove();

        this.makeDraggable(win);

        return win;
    },

    makeDraggable(win) {

        const bar = win.querySelector(".title-bar");

        let dragging = false;
        let ox = 0, oy = 0;

        bar.onmousedown = (e) => {
            dragging = true;
            ox = e.clientX - win.offsetLeft;
            oy = e.clientY - win.offsetTop;
            this.focus(win);
        };

        document.onmousemove = (e) => {
            if (!dragging) return;

            win.style.left = (e.clientX - ox) + "px";
            win.style.top = (e.clientY - oy) + "px";
        };

        document.onmouseup = () => dragging = false;
    },

    focus(win) {
        win.style.zIndex = ++this.highestZ;
    }
};

// ================================
// GLOBAL FILE STATE
// ================================

let currentFileId = null;

// ================================
// FILE HELPERS
// ================================

function createFile(type = "note") {

    const fs = getFS();

    const file = {
        id: crypto.randomUUID(),
        name: "Untitled",
        type,
        content: "",
        created: Date.now(),
        updated: Date.now()
    };

    fs.push(file);
    saveFS(fs);

    Applications.notes(file.id);
}

// ================================
// APPLICATIONS
// ================================

const Applications = {

    // ================= NOTES =================

    notes(openId = null) {

        const fs = getFS();
        const notes = fs.filter(f => f.type === "note");

        WindowManager.create(
            "Notes",
            `
            <div style="display:flex; height:100%;">

                <!-- SIDEBAR -->
                <div style="width:35%; border-right:1px solid #333; padding:6px; overflow:auto;">

                    <button onclick="createFile('note')">+ New Note</button>

                    ${notes.map(n => `
                        <div style="padding:5px; cursor:pointer;"
                            onclick="loadFile('${n.id}')">
                            📄 ${n.name}
                        </div>
                    `).join("")}

                </div>

                <!-- EDITOR -->
                <div style="flex:1; display:flex; flex-direction:column; padding:10px;">

                    <input id="file-name" placeholder="File name"
                        style="margin-bottom:10px; padding:5px;">

                    <textarea id="file-content"
                        style="flex:1; resize:none; padding:6px;"></textarea>

                    <button onclick="saveFile()">Save</button>

                </div>

            </div>
            `,
            750,
            450
        );

        if (openId) {
            setTimeout(() => loadFile(openId), 80);
        }
    },

    // ================= FILE EXPLORER =================

    files() {

        const fs = getFS();

        WindowManager.create(
            "File Explorer",
            `
            <div style="padding:10px;">

                ${fs.length === 0
                    ? "<p>No files found</p>"
                    : fs.map(f => `
                        <div style="cursor:pointer; padding:4px;"
                            onclick="openFile('${f.id}')">
                            📄 ${f.name} (${f.type})
                        </div>
                    `).join("")
                }

            </div>
            `,
            500,
            400
        );
    },

    // ================= APP STORE =================

    store() {

        WindowManager.create(
            "App Store",
            `
            <h3>Emerald Store</h3>
            <p>Apps coming soon...</p>

            <ul>
                <li>Notes</li>
                <li>Files</li>
                <li>Calculator</li>
                <li>Paint</li>
                <li>Browser</li>
            </ul>
            `,
            400,
            300
        );
    },

    // ================= SYSTEM =================

    system() {

        WindowManager.create(
            "System Info",
            `
            <h3>EmeraldOS</h3>
            <p>Version: 2.0</p>
            <p>User: ${localStorage.getItem("osUsername") || "Guest"}</p>
            `
        );
    },

    // ================= CHAT =================

    chat() {

        WindowManager.create(
            "Chat",
            `<p>Chat system coming soon...</p>`
        );
    }
};

// ================================
// FILE OPERATIONS
// ================================

function loadFile(id) {

    const fs = getFS();
    const file = fs.find(f => f.id === id);

    if (!file) return;

    currentFileId = id;

    const name = document.getElementById("file-name");
    const content = document.getElementById("file-content");

    if (name) name.value = file.name;
    if (content) content.value = file.content;
}

function saveFile() {

    const fs = getFS();
    const file = fs.find(f => f.id === currentFileId);

    if (!file) return;

    file.name = document.getElementById("file-name").value;
    file.content = document.getElementById("file-content").value;
    file.updated = Date.now();

    saveFS(fs);

    alert("Saved");
}

function openFile(id) {

    const fs = getFS();
    const file = fs.find(f => f.id === id);

    if (!file) return;

    WindowManager.create(
        file.name,
        `<pre style="white-space:pre-wrap;">${file.content}</pre>`
    );
}

// ================================
// DESKTOP SHORTCUTS
// ================================

function addDesktopIcon(icon, label, action) {

    const desktop = document.getElementById("desktop-icons");
    if (!desktop) return;

    const el = document.createElement("div");
    el.className = "icon";
    el.innerHTML = `${icon}<br>${label}`;
    el.onclick = action;

    desktop.appendChild(el);
}

// ================================
// BOOT
// ================================

window.addEventListener("DOMContentLoaded", () => {

    Session.check();
    Clock.start();

    addDesktopIcon("📁", "Files", () => Applications.files());
    addDesktopIcon("📝", "Notes", () => Applications.notes());
    addDesktopIcon("🛒", "Store", () => Applications.store());
    addDesktopIcon("💻", "System", () => Applications.system());
    addDesktopIcon("💬", "Chat", () => Applications.chat());

    console.log("Emerald OS fully loaded");
});
