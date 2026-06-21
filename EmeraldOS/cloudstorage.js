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
   USER IDENTITY
========================= */

function getUsername() {
    return localStorage.getItem("username");
}

/* =========================
   USER DOCUMENT (IMPORTANT FIX)
========================= */

function userDoc() {
    const username = getUsername();
    if (!username) return null;

    // document ID = username
    return doc(db, "emeraldOSUsers", username);
}

/* =========================
   DRIVE PATH
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
    if (!username) return false;

    const ref = userDoc();
    if (!ref) return false;

    const snap = await getDoc(ref);

    if (!snap.exists()) {
        await setDoc(ref, {
            username,            // stored field
            createdAt: Date.now(),
            locked: false
        });
    }

    return true;
}

/* =========================
   LOAD DRIVE
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

    await setDoc(fileDoc(id), {
        name,
        content,
        type: "text/plain",
        createdAt: Date.now(),
        updatedAt: Date.now()
    });

    return id;
}

/* =========================
   SAVE FILE
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
   DEBUG
========================= */

export async function debugDrive() {
    console.log("USERNAME:", getUsername());
    console.log("USER DOC:", await getDoc(userDoc()));
    console.log("DRIVE:", await loadDrive());
}
