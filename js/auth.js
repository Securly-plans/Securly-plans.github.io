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
  try {
    const msgUint8 = new TextEncoder().encode(password);

    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);

    const hashArray = Array.from(new Uint8Array(hashBuffer));

    return hashArray
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

  } catch (err) {
    console.error("Hashing failed:", err);
    throw err;
  }
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
      role: "user", // ✅ IMPORTANT DEFAULT ROLE
      created: Date.now()
    });

    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("username", username);
    localStorage.setItem("role", "user"); // ✅ FIX

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

    // ✅ GET USER DATA (THIS IS THE CRITICAL FIX)
    const userData = snapshot.docs[0].data();

    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("username", username);

    // 🔥 FIX: STORE ROLE FROM FIRESTORE
    localStorage.setItem("role", userData.role || "user");

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
  localStorage.removeItem("role"); // ✅ FIX
  window.location.href = "index.html";
}

/* ---------------- SAFE UI BINDING ---------------- */
function initAuthUI() {
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");

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

/* ---------------- START ---------------- */
window.addEventListener("DOMContentLoaded", initAuthUI);
