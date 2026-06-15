import { db } from "../../../js/firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function loadChats() {

  const box =
    document.getElementById("chats");

  const snap =
    await getDocs(collection(db, "chats"));

  let html = "";

  snap.forEach(chat => {

    const data = chat.data();

    html += `
      <div class="chat">
        <b>${chat.id}</b>
        <br>
        ${data.lastMessage || ""}
      </div>
    `;
  });

  box.innerHTML = html;
}
