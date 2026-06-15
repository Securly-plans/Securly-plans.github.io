import { db } from "../../../js/firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function loadUsers() {

  const container =
    document.getElementById("users");

  container.innerHTML = "Loading...";

  const snap =
    await getDocs(collection(db, "users"));

  let html = "";

  snap.forEach(doc => {

    const user = doc.data();

    html += `
      <div class="user">
        <b>${user.username || "Unknown"}</b>
        <br>
        Role: ${user.role || "user"}
      </div>
    `;
  });

  container.innerHTML = html;
}
