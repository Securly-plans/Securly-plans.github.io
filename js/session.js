import {
  getAuth,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { app } from "./firebase.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./firebase.js";

const auth = getAuth(app);

/* ================= CONFIG ================= */

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const CONFIG_CHECK_INTERVAL = 10 * 1000; // check system lock every 10s

/* ================= STATE ================= */

let inactivityTimer;
let lockCheckTimer;

/* ================= SYSTEM LOCK CHECK ================= */

async function checkGlobalLock() {
  try {
    const snap = await getDoc(doc(db, "system", "config"));

    if (!snap.exists()) return;

    const data = snap.data();

    // GLOBAL LOCK = immediate force logout
    if (data.globalLock === true) {
      await signOut(auth);
      localStorage.clear();

      alert("SYSTEM LOCKED — You have been logged out.");

      window.location.href = "login.html";
      return;
    }

    // Optional: if login disabled, only block new sessions (not active ones)
    if (data.loginDisabled === true) {
      localStorage.setItem("loginDisabled", "true");
    } else {
      localStorage.removeItem("loginDisabled");
    }

  } catch (err) {
    console.error("Lock check failed:", err);
  }
}

/* ================= RESET TIMER ================= */

function resetSessionTimer() {

  clearTimeout(inactivityTimer);

  localStorage.setItem("lastActivity", Date.now());

  inactivityTimer = setTimeout(async () => {

    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed:", err);
    }

    localStorage.clear();

    alert("You were logged out due to inactivity.");

    window.location.href = "login.html";

  }, SESSION_TIMEOUT);
}

/* ================= ACTIVITY EVENTS ================= */

[
  "mousemove",
  "mousedown",
  "click",
  "scroll",
  "keypress",
  "touchstart"
].forEach(event => {
  document.addEventListener(event, resetSessionTimer, true);
});

/* ================= CHECK EXISTING SESSION ================= */

async function checkSessionAge() {

  const lastActivity =
    Number(localStorage.getItem("lastActivity")) || Date.now();

  const now = Date.now();

  // quick global lock check before session restore
  await checkGlobalLock();

  if (now - lastActivity > SESSION_TIMEOUT) {

    await signOut(auth);

    localStorage.clear();

    alert("Session expired.");

    window.location.href = "home.html";
    return;
  }

  resetSessionTimer();
}

/* ================= INIT ================= */

checkSessionAge();

/* ================= LIVE LOCK WATCHER ================= */

lockCheckTimer = setInterval(() => {
  checkGlobalLock();
}, CONFIG_CHECK_INTERVAL);
