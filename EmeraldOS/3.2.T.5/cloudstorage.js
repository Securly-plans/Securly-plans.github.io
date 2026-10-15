"use strict";

import {
    db,
    doc,
    setDoc,
    getDocs,
    getDoc,
    collection,
    deleteDoc
} from "./firebase.js";

/* =========================
   USER HELPERS
========================= */

function getUsername() {
    const username =
        localStorage.getItem("TestOSusername") ||
        localStorage.getItem("Testos_session");

    if (!username) {
        console.warn("No username found in localStorage");
        return null;
    }

    return username;
}

/* =========================
   FIRESTORE PATHS
========================= */

function userDoc() {
    const username = getUsername();
    if (!username) return null;

    return doc(db, "emeraldOSUsers", username);
}

function driveCol() {
    const username = getUsername();
    if (!username) return null;

    return collection(db, "emeraldOSUsers", username, "drive");
}

function fileDoc(fileId) {
    const username = getUsername();
    if (!username) return null;

    return doc(db, "emeraldOSUsers", username, "drive", fileId);
}

function settingsDoc() {
    const username = getUsername();
    if (!username) return null;

    return doc(db, "emeraldOSUsers", username, "settings", "testos");
}

/* =========================
   ENSURE USER EXISTS
========================= */

export async function ensureUser() {
    const username = getUsername();
    if (!username) return false;

    try {
        const ref = userDoc();
        if (!ref) return false;

        const snap = await getDoc(ref);

        if (!snap.exists()) {
            await setDoc(ref, {
                username,
                createdAt: Date.now()
            });
        }

        return true;
    } catch (err) {
        console.warn("ensureUser failed:", err);
        return false;
    }
}

/* =========================
   LOAD DRIVE
========================= */

export async function loadDrive() {
    const col = driveCol();
    if (!col) return {};

    try {
        const snap = await getDocs(col);

        const files = {};
        snap.forEach(d => {
            files[d.id] = d.data();
        });

        return files;
    } catch (err) {
        console.warn("loadDrive failed:", err);
        return {};
    }
}

/* =========================
   GET FILE
========================= */

export async function getFile(fileId) {
    const ref = fileDoc(fileId);
    if (!ref) return null;

    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
}

/* =========================
   CREATE FILE
========================= */

export async function createFile(name = "New File", content = "") {
    const username = getUsername();
    if (!username) return null;

    const id = "file_" + Date.now();

    try {
        await setDoc(fileDoc(id), {
            name,
            content,
            type: detectType(name, content),
            createdAt: Date.now(),
            updatedAt: Date.now()
        });

        return id;
    } catch (err) {
        console.warn("createFile failed:", err);
        return null;
    }
}

/* =========================
   SAVE FILE (FIXED EXPORT)
========================= */

export async function saveFile(fileId, data) {
    const ref = fileDoc(fileId);
    if (!ref) return;

    try {
        await setDoc(ref, {
            ...data,
            updatedAt: Date.now()
        }, { merge: true });
    } catch (err) {
        console.warn("saveFile failed:", err);
    }
}

/* =========================
   DELETE FILE
========================= */

export async function deleteFile(fileId) {
    const ref = fileDoc(fileId);
    if (!ref) return;

    try {
        await deleteDoc(ref);
    } catch (err) {
        console.warn("deleteFile failed:", err);
    }
}


/* =========================
   TESTOS USER SETTINGS
   Used for desktop layout, registry, and advanced preferences
========================= */

export async function loadUserSettings() {
    const ref = settingsDoc();
    if (!ref) return {};

    try {
        const snap = await getDoc(ref);
        return snap.exists() ? snap.data() : {};
    } catch (err) {
        console.warn("loadUserSettings failed:", err);
        return {};
    }
}

export async function saveUserSettings(data = {}) {
    const ref = settingsDoc();
    if (!ref) return false;

    try {
        await setDoc(ref, {
            ...data,
            updatedAt: Date.now()
        }, { merge: true });

        return true;
    } catch (err) {
        console.warn("saveUserSettings failed:", err);
        return false;
    }
}

/* =========================
   TYPE DETECTION
========================= */

function detectType(name = "", content = "") {
    if (!content) return "text/plain";

    if (content.startsWith("data:image")) return "image";
    if (content.startsWith("data:video")) return "video";

    if (name.match(/\.(png|jpg|jpeg|gif|webp)$/i)) return "image";
    if (name.match(/\.(mp4|webm|ogg)$/i)) return "video";

    return "text/plain";
}

/* =========================
   DEBUG
========================= */

export async function debugDrive() {
    console.log("USERNAME:", getUsername());
    console.log("DRIVE:", await loadDrive());
}
