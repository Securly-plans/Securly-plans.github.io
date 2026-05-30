import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./firebase.js";

/* ================= CONFIG ================= */

const COLLECTION = "userStorage";

/* ================= GET USER ID ================= */

function getUserId() {
  return localStorage.getItem("userId") || null;
}

/* ================= SAVE LOCALSTORAGE ================= */

export async function saveLocalStorage() {

  const userId = getUserId();

  if (!userId) {
    console.warn("No userId found in localStorage.");
    return;
  }

  const data = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    data[key] = localStorage.getItem(key);
  }

  try {

    await setDoc(
      doc(db, COLLECTION, userId),
      {
        data,
        updatedAt: Date.now()
      }
    );

    console.log("localStorage saved.");

  } catch (err) {

    console.error(
      "Failed to save localStorage:",
      err
    );
  }
}

/* ================= LOAD LOCALSTORAGE ================= */

export async function loadLocalStorage() {

  const userId = getUserId();

  if (!userId) {
    return;
  }

  try {

    const snap = await getDoc(
      doc(db, COLLECTION, userId)
    );

    if (!snap.exists()) {
      return;
    }

    const data = snap.data().data;

    if (!data) {
      return;
    }

    Object.entries(data).forEach(
      ([key, value]) => {

        localStorage.setItem(
          key,
          String(value)
        );
      }
    );

    console.log("localStorage restored.");

  } catch (err) {

    console.error(
      "Failed to load localStorage:",
      err
    );
  }
}

/* ================= AUTO SYNC ================= */

let lastSnapshot = "";

function snapshotStorage() {

  const obj = {};

  for (let i = 0; i < localStorage.length; i++) {

    const key = localStorage.key(i);

    obj[key] = localStorage.getItem(key);
  }

  return JSON.stringify(obj);
}

export function startStorageSync() {

  lastSnapshot = snapshotStorage();

  setInterval(async () => {

    const current = snapshotStorage();

    if (current !== lastSnapshot) {

      lastSnapshot = current;

      await saveLocalStorage();
    }

  }, 15000);
}

/* ================= AUTO INIT ================= */

if (getUserId()) {

  loadLocalStorage()
    .then(() => {
      startStorageSync();
    });
}
