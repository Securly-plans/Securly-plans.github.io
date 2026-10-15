console.log("js/converter.js LOADED.");
// js/converter.js

import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ================================
   PUBLIC RESOLVER (USE THIS ONLY)
================================ */

export async function resolveUser(input) {
  if (!input) return null;

  const cleaned = input.toString().trim().replace("@", "");

  // 1. UID lookup (FASTEST PATH)
  const byId = await getUserByIdInternal(cleaned);
  if (byId) return byId;

  // 2. Exact username match
  const byUsername = await getUserByUsernameInternal(cleaned);
  if (byUsername) return byUsername;

  // 3. Partial username match (optional fallback)
  const byPartial = await getUserByPartialUsernameInternal(cleaned);
  if (byPartial) return byPartial;

  return null;
}

/* ================================
   INTERNAL: UID LOOKUP
================================ */

async function getUserByIdInternal(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));

    if (!snap.exists()) return null;

    return {
      id: snap.id,
      ...snap.data()
    };
  } catch (err) {
    console.error("getUserByIdInternal error:", err);
    return null;
  }
}

/* ================================
   INTERNAL: USERNAME LOOKUP
================================ */

async function getUserByUsernameInternal(username) {
  try {
    const q = query(
      collection(db, "users"),
      where("username", "==", username),
      limit(1)
    );

    const snap = await getDocs(q);

    if (snap.empty) return null;

    const docSnap = snap.docs[0];

    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  } catch (err) {
    console.error("getUserByUsernameInternal error:", err);
    return null;
  }
}

/* ================================
   INTERNAL: PARTIAL MATCH
================================ */

async function getUserByPartialUsernameInternal(text) {
  try {
    const q = query(
      collection(db, "users"),
      where("username", ">=", text),
      where("username", "<=", text + "\uf8ff"),
      limit(1)
    );

    const snap = await getDocs(q);

    if (snap.empty) return null;

    const docSnap = snap.docs[0];

    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  } catch (err) {
    console.error("getUserByPartialUsernameInternal error:", err);
    return null;
  }
}
