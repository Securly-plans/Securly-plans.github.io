import { db, doc, getDoc, setDoc } from "../js/firebase.js";

export async function generateStaffId() {
  const metaRef = doc(db, "system", "meta");
  const snap = await getDoc(metaRef);

  let last = 0;

  if (snap.exists()) {
    last = snap.data().lastStaffId || 0;
  }

  const newId = last + 1;

  await setDoc(metaRef, {
    lastStaffId: newId
  }, { merge: true });

  return String(newId).padStart(3, "0");
}
