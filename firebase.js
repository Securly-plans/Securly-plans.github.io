import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBLghWLth0syJhARDMWiJ7xNwyJAh7MWjQ",
  authDomain: "securly-plans-main.firebaseapp.com",
  projectId: "securly-plans-main",
  storageBucket: "securly-plans-main.firebasestorage.app",
  messagingSenderId: "613499545769",
  appId: "1:613499545769:web:baa071714434c4814de1b8"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
