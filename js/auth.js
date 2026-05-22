import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./firebase.js";

/* ---------------- PASSWORD HASH ---------------- */
async function hashPassword(password) {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/* ---------------- SIGNUP ---------------- */
async function signup(username, password) {
  if (!username || !password) return alert("Fill in both fields");

  try {
    const passwordHash = await hashPassword(password);

    await addDoc(collection(db, "users"), {
      username,
      passwordHash,
      role: "user",
      locked: false,
      created: Date.now(),
      lastUpdated: Date.now()
    });

    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("username", username);
    localStorage.setItem("role", "user");

    window.location.href = "home.html";

  } catch (err) {
    console.error(err);
    alert("Signup failed");
  }
}

/* ---------------- LOGIN ---------------- */
async function login(username, password) {
  if (!username || !password) return alert("Fill in both fields");

  try {
    const passwordHash = await hashPassword(password);

    const q = query(
      collection(db, "users"),
      where("username", "==", username),
      where("passwordHash", "==", passwordHash)
    );

    const snap = await getDocs(q);

    if (snap.empty) return alert("Invalid login");

    const userDoc = snap.docs[0];
    const data = userDoc.data();

    if (data.locked) return alert("Account locked");

    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("username", data.username);
    localStorage.setItem("role", data.role || "user");

    await updateDoc(doc(db, "users", userDoc.id), {
      lastLogin: Date.now()
    });

    window.location.href = "home.html";

  } catch (err) {
    console.error(err);
    alert("Login failed");
  }
}

/* ---------------- UI ---------------- */
function initAuthUI() {
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");

  if (!loginBtn || !signupBtn) return;

  loginBtn.onclick = () =>
    login(user.value, pass.value);

  signupBtn.onclick = () =>
    signup(user.value, pass.value);
}

window.addEventListener("DOMContentLoaded", initAuthUI);
