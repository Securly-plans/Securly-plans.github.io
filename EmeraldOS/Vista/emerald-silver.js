"use strict";

/* =========================================================
   EMERALDOS SILVER
   Vista-inspired interface layer
========================================================= */

(function () {
    if (window.EmeraldOSSilverLoaded) return;
    window.EmeraldOSSilverLoaded = true;

    const BUILD = {
        product: "EmeraldOS Silver",
        displayName: "EmeraldOS Silver",
        codename: "Silver Experience Design",
        base: "EmeraldOS 5.7"
    };

    function safeText(value) {
        return String(value ?? "").replace(/[&<>'"]/g, ch => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "'": "&#39;",
            '"': "&quot;"
        }[ch]));
    }

    function getUsername() {
        return localStorage.getItem("40_username") || localStorage.getItem("username") || "EmeraldOS User";
    }

    function getEdition() {
        return localStorage.getItem("40_edition") || localStorage.getItem("emerald_edition") || "Virtue";
    }

    function forceSilverTheme() {
        try {
            localStorage.setItem("40_theme", "silver");
            if (typeof window.setTheme === "function") {
                window.setTheme("silver");
            } else {
                document.body.dataset.theme = "silver";
            }
        } catch {
            document.body.dataset.theme = "silver";
        }
    }

    function tuneShellLabels() {
        document.title = BUILD.displayName;
        const start = document.getElementById("start-btn");
        if (start) start.textContent = "Silver";

        const editionBadge = document.getElementById("emerald40-edition-badge");
        if (editionBadge) editionBadge.textContent = BUILD.displayName;

        const buildBadge = document.getElementById("emerald40-build-badge");
        if (buildBadge) buildBadge.textContent = "Silver";

        const side = document.querySelector(".start-side");
        if (side) side.textContent = "EmeraldOS Silver";
    }

    function installSilverSidebar() {
        if (document.getElementById("silver-sidebar")) return;

        const sidebar = document.createElement("div");
        sidebar.id = "silver-sidebar";
        sidebar.innerHTML = `
            <div class="silver-gadget">
                <h4>Silver Clock</h4>
                <div class="big" id="silver-clock-time">--:--</div>
                <small id="silver-clock-date"></small>
            </div>
            <div class="silver-gadget">
                <h4>User</h4>
                <div>${safeText(getUsername())}</div>
                <small>${safeText(getEdition())} edition</small>
            </div>
            <div class="silver-gadget">
                <h4>Quick Access</h4>
                <button onclick="openSilverWelcome()">Welcome Center</button>
                <button onclick="openSilverPersonalization()">Personalization</button>
            </div>
        `;
        document.body.appendChild(sidebar);

        const update = () => {
            const now = new Date();
            const time = document.getElementById("silver-clock-time");
            const date = document.getElementById("silver-clock-date");
            if (time) time.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            if (date) date.textContent = now.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
        };
        update();
        setInterval(update, 1000);
    }

    function addSilverDesktopBadge() {
        if (document.getElementById("silver-desktop-badge")) return;
        const badge = document.createElement("div");
        badge.id = "silver-desktop-badge";
        badge.style.cssText = `
            position:fixed;left:18px;bottom:64px;z-index:800;color:white;
            font-family:Segoe UI,Tahoma,Arial,sans-serif;text-shadow:0 1px 4px rgba(0,0,0,.75);
            pointer-events:none;opacity:.86;
        `;
        badge.innerHTML = `<div style="font-size:22px;font-weight:600;letter-spacing:.2px">EmeraldOS Silver</div><div style="font-size:12px">Vista-inspired experience layer</div>`;
        document.body.appendChild(badge);
    }

    window.openSilverWelcome = function () {
        const html = `
            <div class="silver-hero">
                <h2>EmeraldOS Silver</h2>
                <p>EmeraldOS Silver is a glass-style desktop design based on the feel of late-2000s desktop operating systems, while keeping EmeraldOS branding and original assets.</p>
                <div class="silver-grid">
                    <div class="silver-tile"><b>Glass shell</b>Translucent taskbar, rounded windows, and layered desktop gradients.</div>
                    <div class="silver-tile"><b>Silver Start</b>A larger glossy Start menu with smoother app selection.</div>
                    <div class="silver-tile"><b>Sidebar gadgets</b>Clock, account card, and quick access tools.</div>
                    <div class="silver-tile"><b>5.7 base</b>Assistant, Creator tools, Emerald Office, and Emerald Mail remain included.</div>
                </div>
                <hr>
                <button onclick="openSilverPersonalization()">Open Personalization</button>
                <button onclick="openExperienceCenter57?.()">Open Experience Center</button>
                <button onclick="openEmeraldMail57?.()">Open Emerald Mail</button>
            </div>
        `;
        window.openWindow?.("EmeraldOS Silver Welcome Center", html, "silverWelcome");
    };

    window.openSilverPersonalization = function () {
        const html = `
            <div class="silver-hero">
                <h2>Silver Personalization</h2>
                <p>Use these controls to keep the Silver look or jump back to another EmeraldOS theme.</p>
                <div class="silver-grid">
                    <div class="silver-tile"><b>Silver</b><button onclick="setTheme?.('silver')">Apply Silver</button></div>
                    <div class="silver-tile"><b>Classic</b><button onclick="setTheme?.('classic')">Apply Classic</button></div>
                    <div class="silver-tile"><b>Dark</b><button onclick="setTheme?.('dark')">Apply Dark</button></div>
                    <div class="silver-tile"><b>Light</b><button onclick="setTheme?.('light')">Apply Light</button></div>
                </div>
                <hr>
                <p><b>Design note:</b> this package is Vista-inspired only. It does not include Microsoft logos, icons, wallpapers, or other proprietary assets.</p>
            </div>
        `;
        window.openWindow?.("Silver Personalization", html, "silverPersonalization");
    };

    window.openSilverDesignNotes = function () {
        const html = `
            <div class="silver-hero">
                <h2>Silver Design Notes</h2>
                <ul>
                    <li>Rounded glass windows with active-window shine.</li>
                    <li>Glossy taskbar with orb-style Emerald start button.</li>
                    <li>Silver-blue background gradients.</li>
                    <li>Cleaner form fields, buttons, menus, notifications, and panels.</li>
                    <li>Desktop gadget sidebar for quick status and shortcuts.</li>
                </ul>
            </div>
        `;
        window.openWindow?.("Silver Design Notes", html, "silverNotes");
    };

    function patchThemeCommands() {
        const originalSetTheme = window.setTheme;
        if (typeof originalSetTheme === "function" && !originalSetTheme.__silverPatched) {
            const patched = function (name) {
                originalSetTheme(name);
                if (name === "silver") {
                    document.body.dataset.theme = "silver";
                    tuneShellLabels();
                }
            };
            patched.__silverPatched = true;
            window.setTheme = patched;
        }
    }

    function installSilverShortcuts() {
        window.addEventListener("keydown", event => {
            if (event.ctrlKey && event.altKey && event.key.toLowerCase() === "s") {
                event.preventDefault();
                window.openSilverWelcome();
            }
        });
    }

    function bootSilver() {
        patchThemeCommands();
        forceSilverTheme();
        tuneShellLabels();
        installSilverSidebar();
        addSilverDesktopBadge();
        installSilverShortcuts();

        setTimeout(() => {
            forceSilverTheme();
            tuneShellLabels();
        }, 800);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bootSilver);
    } else {
        bootSilver();
    }
})();
