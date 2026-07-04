/* =========================================================
   EMERALDOS 5.7 - EMERALD OFFICE
========================================================= */
import { createFile, loadDrive, saveFile } from "./cloudstorage.js";

function escapeHtml(value = "") {
    return String(value).replace(/[&<>'"]/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    }[char]));
}

async function saveOfficeFile(os, name, content, type) {
    await createFile(name, content, type);
    os.notify("File saved", `${name} was saved to EmeraldOS Files.`);
}

export function renderOffice({ os }) {
    setTimeout(() => bindOffice(os), 0);
    return `
        <div class="app-main office-home">
            <div class="panel">
                <h2>Emerald Office</h2>
                <p>Emerald Office includes Docs, Sheets, and Slides, all styled for EmeraldOS 5.7.</p>
            </div>
            <div class="grid-list">
                <button class="list-row" data-office-open="emerald-docs"><strong>Emerald Docs</strong><span>Create and edit documents</span></button>
                <button class="list-row" data-office-open="emerald-sheets"><strong>Emerald Sheets</strong><span>Create spreadsheets</span></button>
                <button class="list-row" data-office-open="emerald-slides"><strong>Emerald Slides</strong><span>Create presentations</span></button>
            </div>
        </div>
    `;
}

function bindOffice(os) {
    const root = document.querySelector(".office-home");
    if (!root || root.dataset.bound) return;
    root.dataset.bound = "true";
    root.addEventListener("click", event => {
        const btn = event.target.closest("[data-office-open]");
        if (btn) os.openApp(btn.dataset.officeOpen);
    });
}

export function renderDocs({ os }) {
    setTimeout(() => bindDocs(os), 0);
    return `
        <section class="docs-app">
            <div class="toolbar">
                <button data-doc-command="bold">Bold</button>
                <button data-doc-command="italic">Italic</button>
                <button data-doc-command="underline">Underline</button>
                <button data-doc-save>Save .doc</button>
                <input id="doc-name" value="Untitled Document.doc" style="min-width:220px">
            </div>
            <div id="doc-editor" class="office-editor" contenteditable="true">
                <h1>Untitled Document</h1><p>Start typing your Emerald Docs document here.</p>
            </div>
        </section>
    `;
}

function bindDocs(os) {
    const root = document.querySelector(".docs-app");
    if (!root || root.dataset.bound) return;
    root.dataset.bound = "true";
    root.addEventListener("click", async event => {
        const command = event.target.closest("[data-doc-command]");
        if (command) document.execCommand(command.dataset.docCommand, false, null);
        if (event.target.closest("[data-doc-save]")) {
            const name = root.querySelector("#doc-name").value.trim() || "Untitled Document.doc";
            const content = root.querySelector("#doc-editor").innerHTML;
            await saveOfficeFile(os, name.endsWith(".doc") ? name : `${name}.doc`, content, "application/x-emerald-doc");
        }
    });
}

export function renderSheets({ os }) {
    setTimeout(() => bindSheets(os), 0);
    const cols = "ABCDEFGH".split("");
    const rows = Array.from({ length: 16 }, (_, i) => i + 1);
    return `
        <section class="sheets-app">
            <div class="toolbar">
                <button data-sheet-save>Save .sheet</button>
                <input id="sheet-name" value="Untitled Spreadsheet.sheet" style="min-width:240px">
            </div>
            <div class="sunken" style="overflow:auto">
                <table class="sheet-grid">
                    <thead><tr><th></th>${cols.map(c => `<th>${c}</th>`).join("")}</tr></thead>
                    <tbody>${rows.map(r => `<tr><th>${r}</th>${cols.map(c => `<td contenteditable="true" data-cell="${c}${r}"></td>`).join("")}</tr>`).join("")}</tbody>
                </table>
            </div>
        </section>
    `;
}

function bindSheets(os) {
    const root = document.querySelector(".sheets-app");
    if (!root || root.dataset.bound) return;
    root.dataset.bound = "true";
    root.addEventListener("click", async event => {
        if (event.target.closest("[data-sheet-save]")) {
            const data = {};
            root.querySelectorAll("td[data-cell]").forEach(cell => { data[cell.dataset.cell] = cell.textContent; });
            const name = root.querySelector("#sheet-name").value.trim() || "Untitled Spreadsheet.sheet";
            await saveOfficeFile(os, name.endsWith(".sheet") ? name : `${name}.sheet`, JSON.stringify(data, null, 2), "application/x-emerald-sheet");
        }
    });
}

export function renderSlides({ os }) {
    setTimeout(() => bindSlides(os), 0);
    return `
        <section class="slides-app">
            <div class="toolbar">
                <button data-slide-theme="classic">Classic</button>
                <button data-slide-theme="emerald">Emerald</button>
                <button data-slide-save>Save .slide</button>
                <input id="slide-name" value="Untitled Presentation.slide" style="min-width:250px">
            </div>
            <article id="slide-canvas" class="slide-canvas" contenteditable="true">
                <h1>EmeraldOS 5.7</h1>
                <p>Click and edit this slide.</p>
            </article>
        </section>
    `;
}

function bindSlides(os) {
    const root = document.querySelector(".slides-app");
    if (!root || root.dataset.bound) return;
    root.dataset.bound = "true";
    root.addEventListener("click", async event => {
        const theme = event.target.closest("[data-slide-theme]");
        if (theme) {
            const canvas = root.querySelector("#slide-canvas");
            canvas.style.background = theme.dataset.slideTheme === "emerald" ? "#e9fff8" : "#fff";
        }
        if (event.target.closest("[data-slide-save]")) {
            const name = root.querySelector("#slide-name").value.trim() || "Untitled Presentation.slide";
            await saveOfficeFile(os, name.endsWith(".slide") ? name : `${name}.slide`, root.querySelector("#slide-canvas").innerHTML, "application/x-emerald-slide");
        }
    });
}
