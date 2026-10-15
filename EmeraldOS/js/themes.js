export function setTheme(theme) {
    document.body.dataset.theme = theme;
    localStorage.setItem("theme", theme);
}

export function loadTheme() {
    const theme =
        localStorage.getItem("theme") ||
        "classic";

    document.body.dataset.theme = theme;
}
