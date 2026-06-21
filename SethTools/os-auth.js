// =======================================
// EmeraldOS Auth System (FULL FIXED)
// Location: /SethTools/os-auth.js
// =======================================

// IMPORTANT: must come from your firebase.js
import { db } from "../js/firebase.js";

import {
    doc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =======================================
// PASSWORD HASH (SHA-256)
// =======================================

async function hashPassword(password) {
    const encoder = new TextEncoder().encode(password);
    const buffer = await crypto.subtle.digest("SHA-256", encoder);

    return [...new Uint8Array(buffer)]
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}


// =======================================
// REGISTER USER
// =======================================

export async function registerOSUser(username, password) {

    if (!username || !password) {
        throw new Error("Missing username or password");
    }

    const passwordHash = await hashPassword(password);

    const userRef = doc(db, "emeraldOSUsers", username);

    const existing = await getDoc(userRef);

    if (existing.exists()) {
        throw new Error("User already exists");
    }

    await setDoc(userRef, {
        username,
        passwordHash,
        role: "user",
        created: Date.now(),
        lastLogin: null
    });

    console.log("[OS AUTH] Registered:", username);

    // ✅ redirect after register
    window.location.href = "../index.html";

    return true;
}


// =======================================
// LOGIN USER
// =======================================

export async function loginOSUser(username, password) {

    if (!username || !password) {
        throw new Error("Missing username or password");
    }

    const passwordHash = await hashPassword(password);

    const userRef = doc(db, "emeraldOSUsers", username);

    const snap = await getDoc(userRef);

    if (!snap.exists()) {
        throw new Error("User not found");
    }

    const data = snap.data();

    if (data.passwordHash !== passwordHash) {
        throw new Error("Incorrect password");
    }

    // update last login
    await setDoc(userRef, {
        ...data,
        lastLogin: Date.now()
    });

    // ==========================
    // OS SESSION STORAGE
    // ==========================

    localStorage.setItem("osLoggedIn", "true");
    localStorage.setItem("osUsername", username);
    localStorage.setItem("osRole", data.role);

    console.log("[OS AUTH] Login success:", username);

    // ✅ redirect after login
    window.location.href = "../OS.html";

    return data;
}


// =======================================
// LOGOUT
// =======================================

export function logoutOSUser() {

    localStorage.removeItem("osLoggedIn");
    localStorage.removeItem("osUsername");
    localStorage.removeItem("osRole");

    window.location.href = "../index.html";
}
