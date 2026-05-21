import {
  collection,
  addDoc,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./firebase.js";

/* ---------------- PASSWORD HASH ---------------- */
async function hashPassword(password) {
  const msgUint8 = new TextEncoder().encode(password);A
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/* ---------------- SIGNUP ---------------- */
async function signup(username, password) {
  if (!username || !password) {
    alert("Fill in both fields");
    return;
  }

  try {
    const passwordHash = await hashPassword(password);

    await addDoc(collection(db, "users"), {
      username,
      passwordHash,
      created: Date.now()
    });

    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("username", username);

    window.location.href = "home.html";

  } catch (err) {
    console.error("Signup error:", err);
    alert("Signup failed");
  }
}

/* ---------------- LOGIN ---------------- */
async function login(username, password) {
  if (!username || !password) {
    alert("Fill in both fields");
    return;
  }

  try {
    const passwordHash = await hashPassword(password);

    const q = query(
      collection(db, "users"),
      where("username", "==", username),
      where("passwordHash", "==", passwordHash)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      alert("Invalid login");
      return;
    }

    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("username", username);

    window.location.href = "home.html";

  } catch (err) {
    console.error("Login error:", err);
    alert("Login failed");
  }
}

/* ---------------- LOGOUT ---------------- */
function logout() {
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("username");
  window.location.href = "index.html";
}

/* ---------------- SAFE UI BINDING ---------------- */
function initAuthUI() {
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");

  // Only run if UI exists
  if (!loginBtn || !signupBtn) return;

  loginBtn.addEventListener("click", () => {
    login(
      document.getElementById("user").value,
      document.getElementById("pass").value
    );
  });

  signupBtn.addEventListener("click", () => {
    signup(
      document.getElementById("user").value,
      document.getElementById("pass").value
    );
  });
}

/* ---------------- START ONLY WHEN READY ---------------- */
window.addEventListener("DOMContentLoaded", initAuthUI);
