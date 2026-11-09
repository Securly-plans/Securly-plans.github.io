// Loads the game, installs the prepared resources and the player's saved
// files in its virtual filesystem, then starts it and keeps saving the
// player's files in the browser's storage (OPFS). A service worker (sw.js)
// keeps the large files for later visits. The offline page (web/package.py)
// sets globalThis.horizonOffline, which hands over the files it holds instead.
import "./audio.js"; // before the game's glue, which keeps the AudioContext it finds

const ROOT = ".local/horizon-client/26.3";
const status = document.getElementById("status");

const BROWSERS = `It runs in:
Chrome and Edge 113 or later on Windows, macOS and ChromeOS
Chrome 121 or later on Android
Safari 26 on macOS, iOS and iPadOS
Firefox 141 or later on Windows
On Linux, Chrome, Edge and Brave need WebGPU switched on:
--enable-unsafe-webgpu --enable-features=Vulkan`;

// Whether this browser can draw the game; says why not on the page.
async function webgpu() {
    if (!navigator.gpu) {
        status.textContent = `Horizon needs WebGPU, which this browser doesn't offer.\n\n${BROWSERS}`;
        return false;
    }
    if (!(await navigator.gpu.requestAdapter().catch(() => null))) {
        status.textContent = "Horizon needs WebGPU, and this browser offers it but found no GPU to use " +
            `(it may be switched off, or the graphics driver not supported).\n\n${BROWSERS}`;
        return false;
    }
    return true;
}

// Starts the service worker and, on a first visit, waits briefly for it to
// take over the page, so the large files it fetches are kept.
// A host that sends no isolation headers (a static host) gets them from the
// service worker: once it controls the page, a reload makes it isolated.
async function cacheWorker() {
    const workers = navigator.serviceWorker;
    if (!workers) return;
    try {
        await workers.register("sw.js");
        if (!workers.controller) {
            await Promise.race([
                new Promise((resolve) => workers.addEventListener("controllerchange", resolve, { once: true })),
                new Promise((resolve) => setTimeout(resolve, 3000)),
            ]);
        }
    } catch (e) {
        console.warn(`Horizon: no service worker, files won't be kept for later visits: ${e}`);
        return;
    }
    if (!window.crossOriginIsolated && workers.controller && !sessionStorage.getItem("horizon-isolating")) {
        sessionStorage.setItem("horizon-isolating", "1");
        location.reload();
        await new Promise(() => {});
    }
    sessionStorage.removeItem("horizon-isolating");
}

// The large files' addresses with their content hash (build.json), which the
// service worker keeps them by. A page that can't share memory (not cross-origin
// isolated) runs the single-threaded build when the folder has it (pkg-st/).
async function versioned() {
    const files = await fetch("build.json", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : {}))
        .catch(() => ({}));
    const at = (path) => (files[path] ? `${path}?v=${files[path]}` : path);
    const pkg = !window.crossOriginIsolated && files["pkg-st/horizon-client_bg.wasm"] ? "pkg-st" : "pkg";
    return { pkg, wasm: at(`${pkg}/horizon-client_bg.wasm`), boot: at("fs/boot.tar.gz") };
}

async function download(url, label) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${url}: ${response.status} ${response.statusText}`);
    const total = Number(response.headers.get("Content-Length")) || 0;
    let received = 0;
    const counted = response.body.pipeThrough(new TransformStream({
        transform(chunk, controller) {
            received += chunk.length;
            if (total) status.textContent = `${label} ${Math.round((received / total) * 100)}%`;
            controller.enqueue(chunk);
        },
    }));
    return counted;
}

// The player's files (options, saves) live under this folder of the
// origin's private file system, laid out as in the virtual filesystem. Where
// that is refused (a file:// page: the offline file), in IndexedDB instead,
// one record per path.
async function savedRoot() {
    try {
        return await (await navigator.storage.getDirectory()).getDirectoryHandle("horizon", { create: true });
    } catch (e) {
        try {
            return await idbOpen();
        } catch (e2) {
            console.warn(`Horizon: no browser storage, nothing will be saved: ${e}; ${e2}`);
            return null;
        }
    }
}

function idbRequest(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function idbOpen() {
    const request = indexedDB.open("horizon", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("files");
    return idbRequest(request);
}

// A path's record: { data, modified } for a file, { data: null } for a folder.
async function idbLoad(glue, db) {
    const files = db.transaction("files").objectStore("files");
    const [paths, records] = await Promise.all([idbRequest(files.getAllKeys()), idbRequest(files.getAll())]);
    // In key order: a folder before what it holds.
    paths.forEach((path, i) => {
        const { data, modified } = records[i];
        if (data) glue.horizon_install_saved_file(path, data, modified);
        else glue.horizon_install_saved_dir(path);
    });
    return records.filter((r) => r.data).length;
}

async function idbApply(db, path, kind, data) {
    const transaction = db.transaction("files", "readwrite");
    const files = transaction.objectStore("files");
    if (kind !== "dir") files.delete(IDBKeyRange.bound(`${path}/`, `${path}/\uffff`));
    if (kind === "gone") files.delete(path);
    else files.put(kind === "file" ? { data, modified: Date.now() } : { data: null }, path);
    await new Promise((resolve, reject) => {
        transaction.oncomplete = resolve;
        transaction.onerror = transaction.onabort = () => reject(transaction.error);
    });
}

async function loadSaved(glue, dir, path) {
    if (dir instanceof IDBDatabase) return idbLoad(glue, dir);
    let files = 0;
    for await (const [name, handle] of dir.entries()) {
        const at = `${path}/${name}`;
        if (handle.kind === "directory") {
            glue.horizon_install_saved_dir(at);
            files += await loadSaved(glue, handle, at);
        } else {
            const file = await handle.getFile();
            glue.horizon_install_saved_file(at, new Uint8Array(await file.arrayBuffer()), file.lastModified);
            files += 1;
        }
    }
    return files;
}

// The folder holding `parts`, made when `create`; null when it's missing.
async function folder(root, parts, create) {
    let dir = root;
    for (const part of parts) {
        try {
            dir = await dir.getDirectoryHandle(part, { create });
        } catch (e) {
            if (create && e.name === "TypeMismatchError") {
                // A file where a folder goes now.
                await dir.removeEntry(part);
                dir = await dir.getDirectoryHandle(part, { create });
            } else if (e.name === "NotFoundError") {
                return null;
            } else {
                throw e;
            }
        }
    }
    return dir;
}

async function apply(root, path, kind, data) {
    if (root instanceof IDBDatabase) return idbApply(root, path, kind, data);
    const parts = path.split("/").filter(Boolean);
    if (kind === "gone") {
        const dir = await folder(root, parts.slice(0, -1), false);
        await dir?.removeEntry(parts.at(-1), { recursive: true }).catch((e) => {
            if (e.name !== "NotFoundError") throw e;
        });
    } else if (kind === "file") {
        const dir = await folder(root, parts.slice(0, -1), true);
        const name = parts.at(-1);
        let handle;
        try {
            handle = await dir.getFileHandle(name, { create: true });
        } catch (e) {
            if (e.name !== "TypeMismatchError") throw e;
            // A folder where a file goes now.
            await dir.removeEntry(name, { recursive: true });
            handle = await dir.getFileHandle(name, { create: true });
        }
        // Written to a scratch file and swapped in on close: never half a file.
        const writable = await handle.createWritable();
        await writable.write(data);
        await writable.close();
    } else {
        if (kind === "cleardir") {
            const dir = await folder(root, parts.slice(0, -1), false);
            await dir?.removeEntry(parts.at(-1), { recursive: true }).catch(() => {});
        }
        await folder(root, parts, true);
    }
}

// Saves what the game changed since the last time, one batch at a time.
let saving = null;
function saveChanges(glue, root) {
    saving ??= (async () => {
        for (const [path, kind, data] of glue.horizon_take_changes()) {
            try {
                await apply(root, path, kind, data);
            } catch (e) {
                console.error(`Horizon: could not save ${path}: ${e}`);
            }
        }
    })().finally(() => {
        saving = null;
    });
    return saving;
}

// The game's glue, its module and the resources, from the server.
async function served() {
    await cacheWorker();
    const files = await versioned();
    status.textContent = "Loading the game…";
    const glue = await import(`./${files.pkg}/horizon-client.js`);
    // Runs the game's main, which only registers the game to start.
    await glue.default({ module_or_path: files.wasm });
    const gz = await download(files.boot, "Downloading resources");
    const tar = new Uint8Array(
        await new Response(gz.pipeThrough(new DecompressionStream("gzip"))).arrayBuffer());
    const manifest = await (await fetch("fs/manifest.txt")).text();
    return { glue, tar, manifest, base: "fs/res/" };
}

async function main() {
    if (!(await webgpu())) return;
    const { glue, tar, manifest, base } = await (globalThis.horizonOffline ?? served)();
    status.textContent = "Installing resources…";
    const t0 = performance.now();
    const installed = glue.horizon_install_tar(ROOT, tar);
    glue.horizon_install_manifest(ROOT, base, manifest);
    console.log(`Horizon: ${installed} files installed in ${Math.round(performance.now() - t0)} ms`);

    const root = await savedRoot();
    if (root) {
        const t1 = performance.now();
        const saved = await loadSaved(glue, root, "");
        console.log(`Horizon: ${saved} saved files loaded in ${Math.round(performance.now() - t1)} ms`);
        setInterval(() => saveChanges(glue, root), 2000);
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) saveChanges(glue, root);
        });
        addEventListener("pagehide", () => saveChanges(glue, root));
    }

    status.textContent = "Loading resources…";
    // Let the status paint before the game blocks the page while it loads.
    await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
    status.textContent = "";
    // The game's command-line arguments, from the address: ?args=--world%20T
    const args = (new URLSearchParams(location.search).get("args") ?? "").split(" ").filter(Boolean);
    try {
        glue.horizon_start(args);
    } catch (e) {
        // winit leaves Rust's stack by throwing once its event loop is set up.
        if (!String(e).includes("Using exceptions for control flow")) throw e;
    }
}

main().catch((e) => {
    console.error(e);
    // The threaded build shares memory between workers, which browsers allow
    // only on a cross-origin isolated page.
    const isolation = window.crossOriginIsolated ? "" :
        "\n\nThe page isn't cross-origin isolated: its server must send " +
        "Cross-Origin-Opener-Policy: same-origin and Cross-Origin-Embedder-Policy: require-corp.";
    status.textContent = `Horizon could not start:\n${e}${isolation}`;
});
