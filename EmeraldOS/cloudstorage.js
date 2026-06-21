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
   INTERNAL PATH HELPER
========================= */

function driveCollection() {
    const username = getUsername();
    if (!username) return null;

    return collection(db, "cloudUsers", username, "drive");
}

function fileDoc(fileId) {
    const username = getUsername();
    if (!username) return null;

    return doc(db, "cloudUsers", username, "drive", fileId);
}

/* =========================
   LOAD ALL FILES (DRIVE MOUNT)
========================= */

export async function loadDrive() {
    const col = driveCollection();
    if (!col) return {};

    const snap = await getDocs(col);

    const files = {};

    snap.forEach(d => {
        files[d.id] = d.data();
    });

    return files;
}

/* =========================
   GET SINGLE FILE
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

    await setDoc(fileDoc(id), {
        name,
        content,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        type: "text/plain"
    });

    return id;
}

/* =========================
   SAVE / UPDATE FILE
========================= */

export async function saveFile(fileId, data) {
    const ref = fileDoc(fileId);
    if (!ref) return;

    await setDoc(ref, {
        ...data,
        updatedAt: Date.now()
    }, { merge: true });
}

/* =========================
   DELETE FILE
========================= */

export async function deleteFile(fileId) {
    const ref = fileDoc(fileId);
    if (!ref) return;

    await deleteDoc(ref);
}

/* =========================
   UPSERT (SAFE SAVE)
========================= */

export async function upsertFile(fileId, data) {
    return saveFile(fileId, data);
}

/* =========================
   DEBUG HELPERS
========================= */

export async function debugDrive() {
    console.log("USERNAME:", getUsername());
    console.log("DRIVE:", await loadDrive());
}
