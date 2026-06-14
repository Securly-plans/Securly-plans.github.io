// js/playtime.js

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./firebase.js";

console.log("playtime.js LOADED.");

const username = localStorage.getItem("username");

if (!username) {
  console.warn("Playtime tracking disabled: no username found.");
} else {

  let userDocId = null;
  let sessionSeconds = 0;
  let active = true;

  async function initPlaytime() {
    try {
      console.log("Looking up user:", username);

      const q = query(
        collection(db, "users"),
        where("username", "==", username)
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        console.error("User not found:", username);
        return;
      }

      userDocId = snap.docs[0].id;

      console.log("Playtime tracking active for:", username);
      console.log("User Doc ID:", userDocId);

      startTracking();

    } catch (err) {
      console.error("Playtime initialization failed:", err);
    }
  }

  function startTracking() {

    document.addEventListener("visibilitychange", () => {
      active = !document.hidden;

      if (document.hidden) {
        saveTime();
      }
    });

    setInterval(() => {
      if (active) {
        sessionSeconds++;
      }
    }, 1000);

    setInterval(saveTime, 300000);

    window.addEventListener("beforeunload", () => {
      saveTime();
    });
  }

  async function saveTime() {

    if (!userDocId) return;
    if (sessionSeconds <= 0) return;

    const timeToSave = sessionSeconds;

    sessionSeconds = 0;

    try {

      await updateDoc(
        doc(db, "users", userDocId),
        {
          siteTimeSeconds: increment(timeToSave),
          lastSeen: Date.now()
        }
      );

      console.log(`Saved ${timeToSave} seconds of site time`);

    } catch (err) {

      sessionSeconds += timeToSave;

      console.error("Failed to save playtime:", err);
    }
  }

  initPlaytime();
}
