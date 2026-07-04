/* =========================================================
   EMERALDOS 5.7 - EMERALD MAIL
========================================================= */
const MAIL_KEY = "emeraldos_57_mail";

function currentUser() {
    return localStorage.getItem("username") || localStorage.getItem("emeraldos_57_user") || "Wmonroe01";
}

function readMail() {
    try { return JSON.parse(localStorage.getItem(MAIL_KEY)) || []; }
    catch { return []; }
}

function writeMail(items) {
    localStorage.setItem(MAIL_KEY, JSON.stringify(items));
}

function escapeHtml(value = "") {
    return String(value).replace(/[&<>'"]/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    }[char]));
}

function sendMail({ to, subject, body }) {
    const now = Date.now();
    const from = currentUser();
    const mail = readMail();
    const id = `mail_${now}_${Math.random().toString(36).slice(2, 8)}`;
    mail.unshift({ id, from, to, subject, body, folder: "sent", created: now, read: true });
    mail.unshift({ id: `${id}_inbox`, from, to, subject, body, folder: "inbox", created: now, read: false });
    writeMail(mail);
    return id;
}

function saveDraft({ to, subject, body }) {
    const mail = readMail();
    mail.unshift({ id: `draft_${Date.now()}`, from: currentUser(), to, subject, body, folder: "drafts", created: Date.now(), read: true });
    writeMail(mail);
}

function folderItems(folder) {
    const user = currentUser();
    return readMail().filter(item => {
        if (folder === "sent") return item.folder === "sent" && item.from === user;
        if (folder === "drafts") return item.folder === "drafts" && item.from === user;
        if (folder === "trash") return item.folder === "trash" && (item.from === user || item.to === user);
        return item.folder === "inbox" && item.to === user;
    });
}

export function renderMail({ os }) {
    setTimeout(() => bindMail(os), 0);
    return `
        <div class="app-layout mail-app">
            <aside class="app-sidebar">
                <h3>Emerald Mail</h3>
                <button data-mail-folder="inbox">Inbox</button>
                <button data-mail-folder="sent">Sent</button>
                <button data-mail-folder="drafts">Drafts</button>
                <button data-mail-folder="trash">Trash</button>
                <hr>
                <button data-mail-compose>Compose</button>
                <p><small>Signed in as ${escapeHtml(currentUser())}</small></p>
            </aside>
            <main class="app-main">
                <div id="mail-view"></div>
            </main>
        </div>
    `;
}

function bindMail(os) {
    const root = document.querySelector(".mail-app");
    if (!root || root.dataset.bound) return;
    root.dataset.bound = "true";
    const view = root.querySelector("#mail-view");

    const renderFolder = folder => {
        const items = folderItems(folder);
        view.innerHTML = `
            <div class="toolbar"><strong>${folder[0].toUpperCase() + folder.slice(1)}</strong><button data-mail-compose>Compose</button></div>
            <div class="grid-list">
                ${items.length ? items.map(item => `
                    <article class="list-row" data-mail-id="${item.id}">
                        <div>
                            <strong>${escapeHtml(item.subject || "No subject")}</strong>
                            <small>${escapeHtml(item.from)} to ${escapeHtml(item.to)} - ${new Date(item.created).toLocaleString()}</small>
                            <p>${escapeHtml(item.body).slice(0, 180)}</p>
                        </div>
                        <button data-mail-trash="${item.id}">Delete</button>
                    </article>
                `).join("") : `<p>No mail in this folder.</p>`}
            </div>
        `;
    };

    const renderCompose = () => {
        view.innerHTML = `
            <div class="toolbar"><strong>Compose Mail</strong></div>
            <div class="panel">
                <label>To</label><br>
                <input id="mail-to" style="width:100%" placeholder="EmeraldOS username"><br><br>
                <label>Subject</label><br>
                <input id="mail-subject" style="width:100%"><br><br>
                <label>Message</label><br>
                <textarea id="mail-body" class="mail-message-body"></textarea><br><br>
                <button data-mail-send>Send</button>
                <button data-mail-draft>Save Draft</button>
            </div>
        `;
    };

    root.addEventListener("click", event => {
        const folderBtn = event.target.closest("[data-mail-folder]");
        if (folderBtn) renderFolder(folderBtn.dataset.mailFolder);
        if (event.target.closest("[data-mail-compose]")) renderCompose();
        if (event.target.closest("[data-mail-send]")) {
            const to = root.querySelector("#mail-to").value.trim();
            const subject = root.querySelector("#mail-subject").value.trim();
            const body = root.querySelector("#mail-body").value.trim();
            if (!to || !body) return os.notify("Mail not sent", "Recipient and message are required.");
            sendMail({ to, subject, body });
            os.notify("Mail sent", `Message sent to ${to}.`);
            renderFolder("sent");
        }
        if (event.target.closest("[data-mail-draft]")) {
            saveDraft({
                to: root.querySelector("#mail-to").value.trim(),
                subject: root.querySelector("#mail-subject").value.trim(),
                body: root.querySelector("#mail-body").value.trim()
            });
            os.notify("Draft saved", "The mail draft was saved.");
            renderFolder("drafts");
        }
        const trash = event.target.closest("[data-mail-trash]");
        if (trash) {
            const mail = readMail().map(item => item.id === trash.dataset.mailTrash ? { ...item, folder: "trash" } : item);
            writeMail(mail);
            os.notify("Mail moved to Trash", "The selected message was moved.");
            renderFolder("inbox");
        }
    });

    renderFolder("inbox");
}
