"use strict";

import {
    db,
    doc,
    setDoc,
    getDocs,
    collection,
    deleteDoc,
    getDoc
} from "./firebase.js";

/* =========================
   USER IDENTITY (USERNAME ONLY)
========================= */

function getUsername() {
    return localStorage.getItem("username");
}

/* =========================
   USER DOC (emeraldOSUsers/{username})
========================= */

function userDoc() {
    const username = getUsername();
    if (!username) return null;

    return doc(db, "emeraldOSUsers", username);
}

/* =========================
   DRIVE COLLECTION
========================= */

function driveCollection() {
    const username = getUsername();
    if (!username) return null;

    return collection(db, "emeraldOSUsers", username, "drive");
}

function fileDoc(fileId) {
    const username = getUsername();
    if (!username) return null;

    return doc(db, "emeraldOSUsers", username, "drive", fileId);
}

/* =========================
   ENSURE USER EXISTS
========================= */

export async function ensureUser() {
    const username = getUsername();
    if (!username) {
        console.warn("No username found in localStorage");
        return false;
    }

    const ref = userDoc();
    if (!ref) return false;

    try {
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            await setDoc(ref, {
                username,
                createdAt: Date.now(),
                locked: false
            });
        }

        return true;
    } catch (err) {
        console.error("ensureUser failed:", err);
        return false;
    }
}

/* =========================
   LOAD DRIVE (NORMALIZED)
========================= */

export async function loadDrive() {
    const col = driveCollection();
    if (!col) return {};

    try {
        const snap = await getDocs(col);

        const files = {};

        snap.forEach(d => {
            const data = d.data();

            files[d.id] = {
                name: data.name || "Untitled",
                content: data.content || "",
                type: data.type || "text", // text | image | video
                createdAt: data.createdAt || 0,
                updatedAt: data.updatedAt || 0
            };
        });

        return files;
    } catch (err) {
        console.error("loadDrive failed:", err);
        return {};
    }
}

/* =========================
   GET SINGLE FILE
========================= */

export async function getFile(fileId) {
    const ref = fileDoc(fileId);
    if (!ref) return null;

    try {
        const snap = await getDoc(ref);
        return snap.exists() ? snap.data() : null;
    } catch (err) {
        console.error("getFile failed:", err);
        return null;
    }
}

/* =========================
   CREATE FILE (TYPE SUPPORT)
========================= */

export async function createFile(
    name = "New File",
    content = "",
    type = "text"
) {
    const username = getUsername();
    if (!username) {
        console.warn("No username found");
        return null;
    }

    const id = "file_" + Date.now();

    try {
        await setDoc(fileDoc(id), {
            name,
            content,
            type, // IMPORTANT for media support
            createdAt: Date.now(),
            updatedAt: Date.now()
        });

        return id;
    } catch (err) {
        console.error("createFile failed:", err);
        return null;
    }
}

/* =========================
   SAVE FILE (MERGE SAFE)
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
        console.error("saveFile failed:", err);
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
        console.error("deleteFile failed:", err);
    }
}

/* =========================
   DEBUG TOOL
========================= */

export async function debugDrive() {
    console.log("USERNAME:", getUsername());

    try {
        console.log("USER DOC:", await getDoc(userDoc()));
        console.log("DRIVE:", await loadDrive());
    } catch (err) {
        console.error("debugDrive failed:", err);
    }
}
