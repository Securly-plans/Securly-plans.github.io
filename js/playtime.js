import {
  doc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./firebase.js";

const userId = localStorage.getItem("userId");

if (!userId) {
  throw new Error("No user logged in.");
}

let sessionSeconds = 0;
let active = true;

// Count time only when tab is visible
document.addEventListener("visibilitychange", () => {
  active = !document.hidden;
});

setInterval(() => {
  if (active) {
    sessionSeconds++;
  }
}, 1000);

async function saveTime() {
  if (sessionSeconds <= 0) return;

  try {
    await updateDoc(doc(db, "users", userId), {
      siteTimeSeconds: increment(sessionSeconds),
      lastSeen: Date.now()
    });

    sessionSeconds = 0;

  } catch (err) {
    console.error("Playtime save failed:", err);
  }
}

// Save every 5 minutes
setInterval(saveTime, 300000);

// Save when leaving page
window.addEventListener("beforeunload", saveTime);

// Save when tab becomes hidden
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    saveTime();
  }
});
