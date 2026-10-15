"use strict";

import {
    db,
    storage,
    doc,
    setDoc,
    getDocs,
    getDoc,
    collection,
    deleteDoc
} from "./firebase.js";

import {
    ref as storageRef,
    uploadString,
    getDownloadURL,
    getBlob,
    getBytes,
    deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

/* =========================
   EMERALDOS 5.4.6 CLOUD STORAGE
   Firestore metadata + Firebase Storage for files over 1 MB
   Includes safer large-file reads and audio/data URL restoration.
========================= */

const LARGE_FILE_LIMIT_BYTES = 1024 * 1024;

function getUsername() {
    const username =
        localStorage.getItem("40_username") ||
        localStorage.getItem("40_session");

    if (!username) {
        console.warn("No username found in localStorage");
        return null;
    }

    return username;
}

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
    return doc(db, "emeraldOSUsers", username, "settings", "40");
}

function fileBlobPath(fileId) {
    const username = getUsername();
    if (!username) return null;
    return `emeraldOSUsers/${username}/driveBlobs/${fileId}`;
}

function byteSize(value = "") {
    try {
        return new Blob([String(value)]).size;
    } catch {
        return String(value || "").length;
    }
}

function detectType(name = "", content = "") {
    const lower = String(name || "").toLowerCase();
    const data = String(content || "");

    if (data.startsWith("data:image")) return "image";
    if (data.startsWith("data:video")) return "video";
    if (data.startsWith("data:audio")) return "audio";
    if (lower.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) return "image";
    if (lower.match(/\.(mp4|webm|ogg|mov)$/i)) return "video";
    if (lower.match(/\.(mp3|wav|ogg|m4a)$/i)) return "audio";
    if (lower.match(/\.(html|htm)$/i)) return "text/html";
    if (lower.match(/\.(md|markdown)$/i)) return "text/markdown";
    if (lower.match(/\.(csv)$/i)) return "text/csv";
    if (lower.match(/\.(json)$/i)) return "application/json";
    if (!content) return "text/plain";
    return "text/plain";
}

function contentUploadFormat(content = "") {
    return String(content).startsWith("data:") ? "data_url" : "raw";
}

async function normalizeContentForFirestore(fileId, data = {}, existing = {}) {
    const out = { ...data };

    if (!Object.prototype.hasOwnProperty.call(out, "content")) {
        return out;
    }

    const content = String(out.content ?? "");
    const size = byteSize(content);
    const path = existing.storagePath || fileBlobPath(fileId);

    out.storageSize = size;
    out.storageThreshold = LARGE_FILE_LIMIT_BYTES;

    if (size > LARGE_FILE_LIMIT_BYTES && path && storage) {
        const ref = storageRef(storage, path);
        const format = contentUploadFormat(content);
        const contentType = out.mimeType || out.type || existing.mimeType || existing.type || "text/plain";

        await uploadString(ref, content, format, {
            contentType,
            customMetadata: {
                fileId,
                owner: getUsername() || "unknown",
                storageMode: "large-file",
                originalFormat: format
            }
        });

        out.content = "";
        out.hasStorageBlob = true;
        out.storagePath = path;
        out.storageMode = "firebase-storage";
        out.storageContentType = contentType;
        out.storageOriginalFormat = format;
        out.storageRequiresCors = true;
        return out;
    }

    if (existing.hasStorageBlob && existing.storagePath && storage) {
        try {
            await deleteObject(storageRef(storage, existing.storagePath));
        } catch (err) {
            console.warn("Old Firebase Storage blob cleanup skipped:", err);
        }
    }

    out.hasStorageBlob = false;
    out.storagePath = null;
    out.storageMode = "firestore";
    return out;
}

export async function ensureUser() {
    const username = getUsername();
    if (!username) return false;

    try {
        const ref = userDoc();
        if (!ref) return false;
        const snap = await getDoc(ref);
        if (!snap.exists()) {
            await setDoc(ref, { username, createdAt: Date.now() });
        }
        return true;
    } catch (err) {
        console.warn("ensureUser failed:", err);
        return false;
    }
}

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

export async function getFile(fileId) {
    const ref = fileDoc(fileId);
    if (!ref) return null;
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
}

function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function shouldReturnDataURL(file = {}) {
    const type = String(file.storageContentType || file.mimeType || file.type || "").toLowerCase();
    const name = String(file.name || "").toLowerCase();
    return (
        file.storageOriginalFormat === "data_url" ||
        type.startsWith("image") ||
        type.startsWith("audio") ||
        type.startsWith("video") ||
        /\.(png|jpg|jpeg|gif|webp|svg|mp3|wav|ogg|m4a|webm|mp4|mov)$/i.test(name)
    );
}

export async function getFileContent(fileId, cachedFile = null) {
    const file = cachedFile || await getFile(fileId);
    if (!file) return "";

    if (file.hasStorageBlob && file.storagePath && storage) {
        const ref = storageRef(storage, file.storagePath);

        try {
            if (shouldReturnDataURL(file)) {
                const blob = await getBlob(ref);
                return await blobToDataURL(blob);
            }

            const bytes = await getBytes(ref);
            return new TextDecoder().decode(bytes);
        } catch (sdkErr) {
            console.warn("Firebase Storage SDK read failed:", sdkErr);

            try {
                const url = await getDownloadURL(ref);
                const response = await fetch(url, { mode: "cors" });
                if (!response.ok) throw new Error("HTTP " + response.status);

                if (shouldReturnDataURL(file)) {
                    return await blobToDataURL(await response.blob());
                }

                return await response.text();
            } catch (fetchErr) {
                console.warn("Could not load Firebase Storage file content. Your bucket likely needs CORS configured:", fetchErr);
                return file.content || "";
            }
        }
    }

    return file.content || "";
}

export async function createFile(name = "New File", content = "") {
    const username = getUsername();
    if (!username) return null;

    const id = "file_" + Date.now();

    try {
        const initial = {
            name,
            content,
            type: detectType(name, content),
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        const normalized = await normalizeContentForFirestore(id, initial, {});
        await setDoc(fileDoc(id), normalized);
        return id;
    } catch (err) {
        console.warn("createFile failed:", err);
        return null;
    }
}

export async function saveFile(fileId, data = {}) {
    const ref = fileDoc(fileId);
    if (!ref) return;

    try {
        const snap = await getDoc(ref);
        const existing = snap.exists() ? snap.data() : {};
        const normalized = await normalizeContentForFirestore(fileId, {
            ...data,
            updatedAt: Date.now()
        }, existing);

        await setDoc(ref, normalized, { merge: true });
    } catch (err) {
        console.warn("saveFile failed:", err);
    }
}

export async function deleteFile(fileId) {
    const ref = fileDoc(fileId);
    if (!ref) return;

    try {
        const snap = await getDoc(ref);
        const data = snap.exists() ? snap.data() : null;

        if (data?.hasStorageBlob && data.storagePath && storage) {
            try {
                await deleteObject(storageRef(storage, data.storagePath));
            } catch (err) {
                console.warn("Firebase Storage blob delete skipped:", err);
            }
        }

        await deleteDoc(ref);
    } catch (err) {
        console.warn("deleteFile failed:", err);
    }
}

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
        await setDoc(ref, { ...data, updatedAt: Date.now() }, { merge: true });
        return true;
    } catch (err) {
        console.warn("saveUserSettings failed:", err);
        return false;
    }
}

export async function debugDrive() {
    return {
        username: getUsername(),
        files: await loadDrive(),
        largeFileLimitBytes: LARGE_FILE_LIMIT_BYTES
    };
}
