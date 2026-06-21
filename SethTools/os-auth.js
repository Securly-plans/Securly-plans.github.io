// =======================================
// EmeraldOS Auth (SethTools) - FIXED
// =======================================

import { db } from "../js/firebase.js";

import {
    doc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ===============================
// HASH PASSWORD
// ===============================

async function hashPassword(password) {
    const enc = new TextEncoder().encode(password);
    const buf = await crypto.subtle.digest("SHA-256", enc);

    return [...new Uint8Array(buf)]
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}


// ===============================
// REGISTER USER
// ===============================

async function registerOSUser(username, password) {

    const ref = doc(db, "emeraldOSUsers", username);
    const existing = await getDoc(ref);

    if (existing.exists()) {
        throw new Error("User already exists");
    }

    const passwordHash = await hashPassword(password);

    await setDoc(ref, {
        username,
        passwordHash,
        role: "user",
        created: Date.now(),
        lastLogin: null
    });

    return true;
}


// ===============================
// LOGIN USER (FIXED - WAS MISSING)
// ===============================

async function loginOSUser(username, password) {

    const ref = doc(db, "emeraldOSUsers", username);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        throw new Error("User does not exist");
    }

    const data = snap.data();

    const hashed = await hashPassword(password);

    if (data.passwordHash !== hashed) {
        throw new Error("Incorrect password");
    }

    // update last login
    await setDoc(ref, {
        ...data,
        lastLogin: Date.now()
    });

    // optional: session storage
    localStorage.setItem("osUser", username);
    localStorage.setItem("osLoggedIn", "true");

    return true;
}


// ===============================
// UI WRAPPER (REGISTER)
// ===============================

window.registerOS = async function () {

    const username = document.getElementById("os-user").value.trim();
    const pass1 = document.getElementById("os-pass").value;
    const pass2 = document.getElementById("os-pass2").value;

    if (!username || !pass1) {
        alert("Please fill in all fields");
        return;
    }

    if (pass1 !== pass2) {
        alert("Passwords do not match");
        return;
    }

    try {
        await registerOSUser(username, pass1);

        alert("Account created successfully!");
        window.location.href = "../index.html";

    } catch (err) {
        alert(err.message);
    }
};


// ===============================
// EXPORTS (THIS FIXES YOUR ERROR)
// ===============================

export {
    registerOSUser,
    loginOSUser,
    hashPassword
};
