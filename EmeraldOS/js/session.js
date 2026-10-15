export function saveSession() {
    const windows = [];

    document.querySelectorAll(".window").forEach(win => {
        windows.push({
            app: win.dataset.app,
            left: win.style.left,
            top: win.style.top,
            width: win.style.width,
            height: win.style.height
        });
    });

    localStorage.setItem(
        "emerald_session",
        JSON.stringify(windows)
    );
}

export function loadSession() {
    return JSON.parse(
        localStorage.getItem("emerald_session") || "[]"
    );
}
