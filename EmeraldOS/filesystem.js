// filesystem.js

import { db, storage } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    doc,
    query,
    where
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const username =
    localStorage.getItem("username");

/* ================= CREATE FOLDER ================= */

export async function createFolder(
    name,
    parent = "Desktop"
){

    await addDoc(
        collection(db,"folders"),
        {
            owner: username,
            name,
            parent,
            created: Date.now()
        }
    );
}

/* ================= CREATE TEXT FILE ================= */

export async function createFile(
    name,
    content = "",
    folder = "Desktop"
){

    await addDoc(
        collection(db,"files"),
        {
            owner: username,
            name,
            extension:
                name.split(".").pop(),

            type: "text",

            folder,

            content,

            created: Date.now(),

            modified: Date.now()
        }
    );
}

/* ================= UPLOAD FILE ================= */

export async function uploadFile(
    file,
    folder = "Desktop"
){

    const path =
        `users/${username}/${Date.now()}-${file.name}`;

    const storageRef =
        ref(storage,path);

    await uploadBytes(
        storageRef,
        file
    );

    const url =
        await getDownloadURL(
            storageRef
        );

    await addDoc(
        collection(db,"files"),
        {
            owner: username,

            name: file.name,

            extension:
                file.name
                .split(".")
                .pop(),

            folder,

            type: file.type,

            size: file.size,

            url,

            storagePath: path,

            created: Date.now(),

            modified: Date.now()
        }
    );
}

/* ================= LOAD FOLDER ================= */

export async function loadFolder(folder){

    const q = query(
        collection(db,"files"),
        where("owner","==",username),
        where("folder","==",folder)
    );

    const snap =
        await getDocs(q);

    const files = [];

    snap.forEach(docSnap=>{

        files.push({
            id:docSnap.id,
            ...docSnap.data()
        });

    });

    return files;
}

/* ================= RENAME ================= */

export async function renameFile(
    id,
    name
){

    await updateDoc(
        doc(db,"files",id),
        {
            name,
            modified: Date.now()
        }
    );
}

/* ================= DELETE ================= */

export async function deleteFile(id){

    await updateDoc(
        doc(db,"files",id),
        {
            deleted:true,
            deletedDate:Date.now()
        }
    );
}

/* ================= RESTORE ================= */

export async function restoreFile(id){

    await updateDoc(
        doc(db,"files",id),
        {
            deleted:false
        }
    );
}

/* ================= PERMANENT DELETE ================= */

export async function destroyFile(
    id,
    path
){

    if(path){

        await deleteObject(
            ref(storage,path)
        );
    }

    await deleteDoc(
        doc(db,"files",id)
    );
}

/* ================= OPEN FILE ================= */

export function getApplication(file){

    const ext =
        file.extension
        .toLowerCase();

    const apps = {

        txt: "notepad.html",

        md: "notepad.html",

        json: "notepad.html",

        js: "editor.html",

        html: "editor.html",

        css: "editor.html",

        png: "mediaplayer.html",

        jpg: "mediaplayer.html",

        jpeg: "mediaplayer.html",

        gif: "mediaplayer.html",

        webp: "mediaplayer.html",

        mp3: "mediaplayer.html",

        wav: "mediaplayer.html",

        ogg: "mediaplayer.html",

        mp4: "mediaplayer.html",

        webm: "mediaplayer.html",

        pdf: "viewer.html"
    };

    return apps[ext] || "unknown.html";
}

export function openFile(file){

    const app =
        getApplication(file);

    window.location =
        `${app}?file=${file.id}`;
}
