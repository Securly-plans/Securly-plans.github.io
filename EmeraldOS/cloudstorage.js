"use strict";

import {
    db,
    doc,
    setDoc,
    getDoc,
    getDocs,
    collection,
    deleteDoc
} from "./firebase.js";

import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

/* =========================
   USER
========================= */

function getUsername() {
    return localStorage.getItem("username") || localStorage.getItem("os_session");
}

/* =========================
   PATHS
========================= */

function driveCollection() {
    const user = getUsername();
    if (!user) return null;
    return collection(db, "emeraldOSUsers", user, "drive");
}

function fileDoc(id) {
    const user = getUsername();
    if (!user) return null;
    return doc(db, "emeraldOSUsers", user, "drive", id);
}

/* =========================
   STORAGE INIT
========================= */

const storage = getStorage();

/* =========================
   LOAD DRIVE (metadata only)
========================= */

export async function loadDrive() {
    const col = driveCollection();
    if (!col) return {};

    const snap = await getDocs(col);
    const out = {};

    snap.forEach(d => {
        out[d.id] = d.data();
    });

    return out;
}

/* =========================
   CREATE FILE (TEXT DEFAULT)
========================= */

export async function createFile(name, content = "", type = "text/plain") {
    const id = "file_" + Date.now();

    await setDoc(fileDoc(id), {
        name,
        type,
        storagePath: null,
        content: type === "text/plain" ? content : null,
        createdAt: Date.now(),
        updatedAt: Date.now()
    });

    return id;
}

/* =========================
   UPLOAD BINARY FILES (IMAGES/VIDEO/WEBP)
========================= */

export async function uploadBinaryFile(file) {
    const user = getUsername();
    if (!user) return null;

    const id = "file_" + Date.now();
    const path = `${user}/${id}-${file.name}`;

    const storageRef = ref(storage, path);

    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    await setDoc(fileDoc(id), {
        name: file.name,
        type: file.type,
        storagePath: path,
        url,
        createdAt: Date.now(),
        updatedAt: Date.now()
    });

    return id;
}

/* =========================
   SAVE TEXT FILE
========================= */

export async function saveTextFile(id, content) {
    await setDoc(fileDoc(id), {
        content,
        updatedAt: Date.now()
    }, { merge: true });
}

/* =========================
   DELETE FILE
========================= */

export async function deleteFile(id) {
    const snap = await getDoc(fileDoc(id));

    if (snap.exists()) {
        const data = snap.data();

        // delete storage file if exists
        if (data.storagePath) {
            await deleteObject(ref(storage, data.storagePath)).catch(() => {});
        }
    }

    await deleteDoc(fileDoc(id));
}
