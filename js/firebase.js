import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getStorage
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

import {
  getAuth
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* ================= FIREBASE CONFIG ================= */

const firebaseConfig = {
  apiKey: "AIzaSyBLghWLth0syJhARDMWiJ7xNwyJAh7MWjQ",
  authDomain: "securly-plans-main.firebaseapp.com",
  projectId: "securly-plans-main",
  storageBucket: "securly-plans-main.firebasestorage.app",
  messagingSenderId: "613499545769",
  appId: "1:613499545769:web:baa071714434c4814de1b8"
};

/* ================= INITIALIZE APP ================= */

export const app = initializeApp(firebaseConfig);

/* ================= FIREBASE SERVICES ================= */

export const db = getFirestore(app);

export const storage = getStorage(app);

export const auth = getAuth(app);
