let zIndexCounter = 100;

export function focusWindow(win) {
    win.style.zIndex = ++zIndexCounter;
}

export function maximizeWindow(win) {
    if (win.dataset.maximized === "true") {
        win.style.left = win.dataset.left;
        win.style.top = win.dataset.top;
        win.style.width = win.dataset.width;
        win.style.height = win.dataset.height;

        win.dataset.maximized = "false";
    } else {
        win.dataset.left = win.style.left;
        win.dataset.top = win.style.top;
        win.dataset.width = win.style.width;
        win.dataset.height = win.style.height;

        win.style.left = "0";
        win.style.top = "0";
        win.style.width = "100vw";
        win.style.height = "calc(100vh - 40px)";

        win.dataset.maximized = "true";
    }
}

export function minimizeWindow(win) {
    win.style.display = "none";
}
