// ==========================================
// EMERALDOS CORE
// ==========================================

const EmeraldOS = {

    version: "2.0",

    highestZ: 100,

    windows: [],

    boot() {

        Session.check();

        Clock.start();

        StartMenu.initialize();

        Desktop.initialize();

        console.log(
            "EmeraldOS booted."
        );
    }
};

// ==========================================
// SESSION
// ==========================================

const Session = {

    check() {

        const siteLoggedIn =
            localStorage.getItem(
                "loggedIn"
            ) === "true";

        const osLoggedIn =
            localStorage.getItem(
                "osLoggedIn"
            ) === "true";

        if (!siteLoggedIn) {
            location.href =
                "../index.html";
            return;
        }

        if (!osLoggedIn) {
            location.href =
                "index.html";
        }
    },

    logout() {

        localStorage.removeItem(
            "osLoggedIn"
        );

        localStorage.removeItem(
            "osUsername"
        );

        localStorage.removeItem(
            "osAccountId"
        );

        location.href =
            "index.html";
    }
};

// ==========================================
// CLOCK
// ==========================================

const Clock = {

    start() {

        this.update();

        setInterval(
            () => this.update(),
            1000
        );
    },

    update() {

        const clock =
            document.getElementById(
                "clock"
            );

        if (!clock) return;

        clock.textContent =
            new Date().toLocaleTimeString(
                [],
                {
                    hour: "numeric",
                    minute: "2-digit"
                }
            );
    }
};

// ==========================================
// START MENU
// ==========================================

const StartMenu = {

    initialize() {

        const button =
            document.getElementById(
                "start-btn"
            );

        const menu =
            document.getElementById(
                "start-menu"
            );

        if (!button || !menu) return;

        button.onclick = () => {
            menu.classList.toggle(
                "show"
            );
        };

        document.addEventListener(
            "click",
            e => {

                if (
                    !menu.contains(e.target)
                    &&
                    e.target !== button
                ) {
                    menu.classList.remove(
                        "show"
                    );
                }
            }
        );
    }
};

// ==========================================
// WINDOW MANAGER
// ==========================================

const WindowManager = {

    create(
        title,
        content,
        width = 500,
        height = 350
    ) {

        const win =
            document.createElement(
                "div"
            );

        win.className =
            "window";

        win.style.width =
            width + "px";

        win.style.height =
            height + "px";

        win.style.top =
            50 +
            Math.random() * 100 +
            "px";

        win.style.left =
            50 +
            Math.random() * 100 +
            "px";

        win.style.zIndex =
            ++EmeraldOS.highestZ;

        win.innerHTML = `
            <div class="title-bar">

                <span>${title}</span>

                <button
                    class="close-btn">
                    X
                </button>

            </div>

            <div class="window-content">
                ${content}
            </div>
        `;

        document
            .getElementById(
                "windows-container"
            )
            .appendChild(win);

        this.makeDraggable(win);

        this.focus(win);

        win
            .querySelector(
                ".close-btn"
            )
            .onclick = () => {
                win.remove();
            };

        return win;
    },

    focus(win) {

        win.style.zIndex =
            ++EmeraldOS.highestZ;
    },

    makeDraggable(win) {

        const title =
            win.querySelector(
                ".title-bar"
            );

        let dragging =
            false;

        let offsetX = 0;
        let offsetY = 0;

        title.addEventListener(
            "mousedown",
            e => {

                dragging = true;

                offsetX =
                    e.clientX -
                    win.offsetLeft;

                offsetY =
                    e.clientY -
                    win.offsetTop;

                this.focus(win);
            }
        );

        document.addEventListener(
            "mousemove",
            e => {

                if (!dragging)
                    return;

                win.style.left =
                    (
                        e.clientX -
                        offsetX
                    ) + "px";

                win.style.top =
                    (
                        e.clientY -
                        offsetY
                    ) + "px";
            }
        );

        document.addEventListener(
            "mouseup",
            () => {
                dragging = false;
            }
        );
    }
};

// Compatibility

function openWindow(
    title,
    content
) {
    WindowManager.create(
        title,
        content
    );
}

// ==========================================
// APPLICATIONS
// ==========================================

const Applications = {

    notes() {

        WindowManager.create(
            "Notes",

            `
            <textarea
                id="note-text"
                style="
                    width:100%;
                    height:80%;
                ">
            </textarea>

            <button
                onclick="saveCurrentNote()">
                Save
            </button>
            `,

            500,
            400
        );
    },

    explorer() {

        WindowManager.create(
            "File Explorer",

            `
            <div id="explorer">
                Loading...
            </div>
            `,

            600,
            400
        );
    },

    appStore() {

        WindowManager.create(
            "App Store",

            `
            <h2>
                Emerald Store
            </h2>

            <p>
                Future applications
                will appear here.
            </p>
            `,

            500,
            350
        );
    },

    system() {

        WindowManager.create(

            "System Info",

            `
            <h2>
                EmeraldOS
            </h2>

            <p>
                Version:
                ${EmeraldOS.version}
            </p>

            <p>
                User:
                ${
                    localStorage.getItem(
                        "osUsername"
                    )
                }
            </p>
            `
        );
    }
};

// Compatibility

function openNotes() {
    Applications.notes();
}

function openFileExplorer() {
    Applications.explorer();
}

function openAppStore() {
    Applications.appStore();
}

// ==========================================
// BOOT
// ==========================================

window.addEventListener(
    "DOMContentLoaded",

    () => {

        EmeraldOS.boot();

    }
);
