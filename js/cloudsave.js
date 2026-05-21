import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./firebase.js";

/* ================= SAVE ================= */

export async function saveCloudData() {

  const username = localStorage.getItem("username");

  if (!username) return;

  try {

    const saveData = {};

    // Save every localStorage key
    for (let i = 0; i < localStorage.length; i++) {

      const key = localStorage.key(i);

      saveData[key] = localStorage.getItem(key);
    }

    await setDoc(
      doc(db, "saves", username),
      {
        data: saveData,
        updatedAt: Date.now()
      },
      { merge: true }
    );

    console.log("Cloud save complete");

  } catch (err) {

    console.error("Cloud save failed:", err);

  }
}

/* ================= LOAD ================= */

export async function loadCloudData() {

  const username = localStorage.getItem("username");

  if (!username) return;

  try {

    const snap = await getDoc(
      doc(db, "saves", username)
    );

    if (!snap.exists()) {
      console.log("No cloud save found");
      return;
    }

    const saveData = snap.data().data || {};

    // Restore everything into localStorage
    Object.keys(saveData).forEach((key) => {

      localStorage.setItem(
        key,
        saveData[key]
      );

    });

    console.log("Cloud save restored");

  } catch (err) {

    console.error("Cloud load failed:", err);

  }
}
