import { db, storage } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

class FileSystem {

    constructor() {
        this.username =
            localStorage.getItem("username") || "guest";
    }

    async saveTextFile(name, content) {

        return await addDoc(
            collection(db, "files"),
            {
                owner: this.username,
                name,
                type: "text",
                content,
                created: Date.now(),
                modified: Date.now()
            }
        );
    }

    async uploadFile(file) {

        const path =
            `users/${this.username}/${Date.now()}_${file.name}`;

        const storageRef =
            ref(storage, path);

        await uploadBytes(storageRef, file);

        const url =
            await getDownloadURL(storageRef);

        return await addDoc(
            collection(db, "files"),
            {
                owner: this.username,
                name: file.name,
                type: file.type,
                size: file.size,
                url,
                storagePath: path,
                created: Date.now(),
                modified: Date.now()
            }
        );
    }

    async listFiles() {

        const q = query(
            collection(db, "files"),
            where("owner", "==", this.username)
        );

        const snap = await getDocs(q);

        const files = [];

        snap.forEach(docSnap => {

            files.push({
                id: docSnap.id,
                ...docSnap.data()
            });

        });

        return files;
    }

    async renameFile(id, name) {

        await updateDoc(
            doc(db, "files", id),
            {
                name,
                modified: Date.now()
            }
        );
    }

    async saveText(id, content) {

        await updateDoc(
            doc(db, "files", id),
            {
                content,
                modified: Date.now()
            }
        );
    }

    async deleteFile(file) {

        if (file.storagePath) {

            try {
                await deleteObject(
                    ref(storage, file.storagePath)
                );
            }
            catch(e) {
                console.error(e);
            }
        }

        await deleteDoc(
            doc(db, "files", file.id)
        );
    }
}

window.fileSystem = new FileSystem();
