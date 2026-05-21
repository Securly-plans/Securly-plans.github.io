import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./firebase.js";

/* SAVE */
export async function saveCloudData() {

  const username = localStorage.getItem("username");

  if (!username) return;

  const saveData = {
    gameProgress: localStorage.getItem("gameProgress"),
    updatedAt: Date.now()
  };

  await setDoc(
    doc(db, "saves", username),
    saveData,
    { merge: true }
  );

  console.log("Cloud save complete");
}

/* LOAD */
export async function loadCloudData() {

  const username = localStorage.getItem("username");

  if (!username) return;

  const snap = await getDoc(
    doc(db, "saves", username)
  );

  if (!snap.exists()) return;

  const data = snap.data();

  if (data.gameProgress) {
    localStorage.setItem(
      "gameProgress",
      data.gameProgress
    );
  }

  console.log("Cloud save restored");
}
