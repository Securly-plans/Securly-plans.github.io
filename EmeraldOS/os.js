// ==========================================
// EMERALD OS (LOGIN PATCH ONLY)
// ==========================================

// ================================
// SESSION CHECK (ADDED ONLY)
// ================================

function ensureLogin() {
    if (localStorage.getItem("loggedIn") !== "true") {
        window.location.href = "OS.html";
    }
}

// ================================
// CLOCK
// ================================

function updateClock() {
    const clock = document.getElementById("clock");
    if (!clock) return;

    clock.textContent = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}

setInterval(updateClock, 1000);

// ================================
// START MENU
// ================================

const startBtn = document.getElementById("start-btn");
const startMenu = document.getElementById("start-menu");

if (startBtn && startMenu) {
    startBtn.addEventListener("click", e => {
        e.stopPropagation();
        startMenu.classList.toggle("show");
    });

    document.addEventListener("click", e => {
        if (startMenu && !startMenu.contains(e.target)) {
            startMenu.classList.remove("show");
        }
    });
}

// ================================
// WINDOW SYSTEM (UNCHANGED)
// ================================

let zIndexCounter = 100;
let activeDrag = null;

function openWindow(title, contentHTML) {

    const container = document.getElementById("windows-container");
    const taskbarApps = document.getElementById("taskbar-apps");

    if (!container) return;

    const win = document.createElement("div");
    win.className = "window";

    win.style.zIndex = ++zIndexCounter;
    win.style.left = Math.floor(50 + Math.random() * 80) + "px";
    win.style.top = Math.floor(50 + Math.random() * 80) + "px";

    win.innerHTML = `
        <div class="title-bar">
            <span>${title}</span>
            <button class="close-btn">X</button>
        </div>
        <div class="window-content">${contentHTML}</div>
    `;

    container.appendChild(win);

    win.querySelector(".close-btn").onclick = () => win.remove();

    const bar = win.querySelector(".title-bar");

    bar.addEventListener("mousedown", e => {
        activeDrag = {
            window: win,
            startX: e.clientX,
            startY: e.clientY,
            left: win.offsetLeft,
            top: win.offsetTop
        };
    });

    document.onmousemove = e => {
        if (!activeDrag) return;

        win.style.left = activeDrag.left + (e.clientX - activeDrag.startX) + "px";
        win.style.top = activeDrag.top + (e.clientY - activeDrag.startY) + "px";
    };

    document.onmouseup = () => activeDrag = null;

    return win;
}

// ================================
// BOOT PATCH (LOGIN ONLY)
// ================================

window.addEventListener("DOMContentLoaded", () => {
    ensureLogin();
    updateClock();
});
