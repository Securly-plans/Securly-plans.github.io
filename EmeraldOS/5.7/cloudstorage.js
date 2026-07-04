/* =========================================================
   EMERALDOS 5.7 - CLOUD STORAGE ADAPTER
   Default: localStorage-backed drive.
   Replace these methods with Firebase/Firestore calls when integrating
   with emeraldOSUsers/{username}/drive.
========================================================= */
const DRIVE_KEY = "emeraldos_57_drive";

function readDriveMap() {
    try { return JSON.parse(localStorage.getItem(DRIVE_KEY)) || {}; }
    catch { return {}; }
}

function writeDriveMap(map) {
    localStorage.setItem(DRIVE_KEY, JSON.stringify(map));
}

export function getUsername() {
    return localStorage.getItem("username") || localStorage.getItem("emeraldos_57_user") || "Wmonroe01";
}

export async function ensureUser() {
    const map = readDriveMap();
    const username = getUsername();
    if (!map[username]) {
        map[username] = { files: {} };
        writeDriveMap(map);
    }
    return { username };
}

export async function loadDrive() {
    await ensureUser();
    const map = readDriveMap();
    return Object.values(map[getUsername()].files || {}).sort((a, b) => (b.updated || 0) - (a.updated || 0));
}

export async function createFile(name, content = "", type = "text/plain") {
    await ensureUser();
    const map = readDriveMap();
    const username = getUsername();
    const id = `file_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    map[username].files[id] = { id, name, content, type, created: Date.now(), updated: Date.now() };
    writeDriveMap(map);
    return map[username].files[id];
}

export async function saveFile(id, updates = {}) {
    await ensureUser();
    const map = readDriveMap();
    const username = getUsername();
    if (!map[username].files[id]) throw new Error("File not found");
    map[username].files[id] = { ...map[username].files[id], ...updates, updated: Date.now() };
    writeDriveMap(map);
    return map[username].files[id];
}

export async function deleteFile(id) {
    await ensureUser();
    const map = readDriveMap();
    const username = getUsername();
    delete map[username].files[id];
    writeDriveMap(map);
    return true;
}
