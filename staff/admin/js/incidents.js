import { db } from "../../../js/firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function loadIncidents() {

  const box =
    document.getElementById("incidents");

  const snap =
    await getDocs(
      collection(db, "incidentReports")
    );

  let html = "";

  snap.forEach(doc => {

    const i = doc.data();

    html += `
      <div class="incident">
        <b>${i.title || "Untitled"}</b>
        <br>
        Severity:
        ${i.severity || "low"}
      </div>
    `;
  });

  box.innerHTML = html;
}
