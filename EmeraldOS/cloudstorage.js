"use strict";

/* =========================
   FIREBASE IMPORTS
========================= */

import {
    db,
    doc,
    setDoc,
    getDocs,
    collection,
    deleteDoc,
    getDoc
} from "./firebase.js";

import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

/* =========================
   USER HELPERS
========================= */

function getUsername() {
    return (
        localStorage.getItem("username") ||
        localStorage.getItem("os_session") ||
        null
    );
}

/* =========================
   USER ROOT DOC (emeraldOSUsers/{username})
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
   ENSURE USER EXISTS (IMPORTANT FIX)
========================= */

export async function ensureUser() {
    const username = getUsername();
    if (!username) return false;

    const ref = userDoc();
    if (!ref) return false;

    const snap = await getDoc(ref);

    if (!snap.exists()) {
        await setDoc(ref, {
            username,
            createdAt: Date.now(),
            locked: false
        });
    }

    return true;
}

/* =========================
   LOAD DRIVE (METADATA ONLY)
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
   CREATE FILE (META ONLY)
========================= */

export async function createFile(name = "New File", type = "text/plain") {
    const username = getUsername();
    if (!username) return null;

    const id = "file_" + Date.now();

    await setDoc(fileDoc(id), {
        name,
        type,
        storagePath: `emeraldOS/${username}/${id}`,
        createdAt: Date.now(),
        updatedAt: Date.now()
    });

    return id;
}

/* =========================
   SAVE TEXT FILE
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
   UPLOAD FILE (BINARY → STORAGE)
========================= */

export async function uploadToStorage(fileId, fileBlob) {
    const username = getUsername();
    if (!username) return null;

    const storage = getStorage();

    const storagePath = `emeraldOS/${username}/${fileId}`;
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, fileBlob);

    const url = await getDownloadURL(storageRef);

    await setDoc(fileDoc(fileId), {
        downloadURL: url,
        updatedAt: Date.now()
    }, { merge: true });

    return url;
}

/* =========================
   DELETE FILE (CLOUD + STORAGE)
========================= */

export async function deleteFile(fileId) {
    const username = getUsername();
    if (!username) return;

    const storage = getStorage();

    const storagePath = `emeraldOS/${username}/${fileId}`;
    const storageRef = ref(storage, storagePath);

    try {
        await deleteObject(storageRef);
    } catch (e) {
        // ignore if not in storage
    }

    await deleteDoc(fileDoc(fileId));
}

/* =========================
   DEBUG TOOL
========================= */

export async function debugDrive() {
    console.log("USERNAME:", getUsername());
    console.log("USER DOC:", await getDoc(userDoc()));
    console.log("DRIVE:", await loadDrive());
}
