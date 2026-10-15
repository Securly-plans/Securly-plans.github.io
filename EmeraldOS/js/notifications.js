export function notify(title, message) {
    const container = document.getElementById("notifications");

    if (!container) return;

    const note = document.createElement("div");
    note.className = "notification";

    note.innerHTML = `
        <strong>${title}</strong><br>
        ${message}
    `;

    container.appendChild(note);

    setTimeout(() => {
        note.remove();
    }, 4000);
}
