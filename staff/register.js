import {
  db,
  doc,
  getDoc,
  setDoc
} from "../js/firebase.js";

/* -----------------------------
   SHA-256 HASH
------------------------------*/
async function hash(str) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(str)
  );

  return [...new Uint8Array(buf)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/* -----------------------------
   FORMAT STAFF ID (001, 002...)
------------------------------*/
function formatId(num) {
  return String(num).padStart(3, "0");
}

/* -----------------------------
   GET NEXT STAFF ID (SAFE COUNTER)
------------------------------*/
export async function generateStaffId() {
  const ref = doc(db, "system", "meta");
  const snap = await getDoc(ref);

  let last = 0;

  if (snap.exists()) {
    last = snap.data().lastStaffId || 0;
  }

  const next = last + 1;

  await setDoc(ref, {
    lastStaffId: next
  }, { merge: true });

  return formatId(next);
}

/* -----------------------------
   ROLE → PERMISSION MAP
------------------------------*/
function getPermissionsFromURole(role) {
  if (role === "admin") {
    return {
      users: { view: true, edit: true, ban: true },
      chat: { monitor: true, delete: true },
      files: { read: true, write: true },
      system: { logs: true }
    };
  }

  if (role === "mod") {
    return {
      users: { view: true, edit: false, ban: true },
      chat: { monitor: true, delete: true },
      files: { read: true, write: false },
      system: { logs: false }
    };
  }

  return null;
}

/* -----------------------------
   MAIN CREATE STAFF FUNCTION
   (call from HTML)
------------------------------*/
export async function createStaffAccount() {
  const lastName = document.getElementById("lastName").value.trim();
  const firstName = document.getElementById("firstName").value.trim();
  const password = document.getElementById("password").value;

  if (!lastName || !firstName || !password) {
    alert("Fill in all fields");
    return;
  }

  const fullName = `${lastName}, ${firstName}`;

  // U ACCOUNT ROLE (from existing system)
  const userRole = localStorage.getItem("role");

  const permissions = getPermissionsFromURole(userRole);

  if (!permissions) {
    alert("You do not have permission to create staff accounts.");
    return;
  }

  const staffId = await generateStaffId();
  const passwordHash = await hash(password);

  await setDoc(doc(db, "staffAccounts", staffId), {
    staffId,
    fullName,
    passwordHash,
    role: userRole,
    permissions,
    sourceUserId: localStorage.getItem("userId"),
    createdAt: Date.now(),
    lastLogin: null
  });

  alert(`Staff account created: ${staffId}`);
}
