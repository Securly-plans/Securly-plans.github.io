console.log("js/session.js LOADED.");

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

/* ================= IMMUNE USERS ================= */

const IMMUNE_USERS = [
  {
    username: "Securly-plans",
    userId: "no3iltjq4tByBTz4WRdD"
  },
  {
    username: "Wmonroe01",
    userId: "M7ab5EUHvvkmERw9ZwvK"
  }
];

function isImmuneUser() {
  const username = localStorage.getItem("username");
  const userId = localStorage.getItem("userId");

  return IMMUNE_USERS.some(u =>
    u.username === username && u.userId === userId
  );
}

/* ================= CONFIG ================= */

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const CONFIG_CHECK_INTERVAL = 10 * 1000;

/* ================= STATE ================= */

let inactivityTimer;
let lockCheckTimer;

let cachedConfig = {};

/* ================= CURRENT PAGE ================= */

function getPage() {
  const path = window.location.pathname.toLowerCase();

  if (path.includes("chat")) return "chat";
  if (path.includes("video")) return "video";
  if (path.includes("admin") || path.includes("console")) return "admin";

  return "other";
}

/* ================= PAGE RESTRICTIONS ================= */

function checkPageRestrictions(config) {
  if (isImmuneUser()) return;

  const page = getPage();

  if (page === "chat" && config.chatDisabled === true) {
    window.location.href = "home.html";
    return;
  }

  if (page === "video" && config.videoDisabled === true) {
    window.location.href = "home.html";
    return;
  }

  if (page === "admin" && config.adminDisabled === true) {
    window.location.href = "home.html";
    return;
  }
}

/* ================= SYSTEM LOCK CHECK ================= */

async function checkGlobalLock() {
  if (isImmuneUser()) return;

  try {
    const snap = await getDoc(doc(db, "system", "config"));

    if (!snap.exists()) return;

    const data = snap.data();
    cachedConfig = data;

    if (data.globalLock === true) {
      await signOut(auth);
      localStorage.clear();

      alert("SYSTEM LOCKED — You have been logged out.");
      window.location.href = "index.html";
      return;
    }

    if (data.loginDisabled === true) {
      localStorage.setItem("loginDisabled", "true");
    } else {
      localStorage.removeItem("loginDisabled");
    }

    checkPageRestrictions(data);

  } catch (err) {
    console.error("Lock check failed:", err);
  }
}

/* ================= RESET TIMER ================= */

function resetSessionTimer() {

  if (isImmuneUser()) return;

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

/* ================= CHECK SESSION ================= */

async function checkSessionAge() {

  if (isImmuneUser()) {
    resetSessionTimer();
    return;
  }

  const lastActivity =
    Number(localStorage.getItem("lastActivity")) || Date.now();

  const now = Date.now();

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

/* ================= LIVE WATCHER ================= */

lockCheckTimer = setInterval(() => {
  checkGlobalLock();
}, CONFIG_CHECK_INTERVAL);
