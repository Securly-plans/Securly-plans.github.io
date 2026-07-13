/* EmeraldOS Gold 1I Firebase configuration.
   The default below matches the existing EmeraldOS / Emerald Mail Firebase project.
   A deployment may override it by setting either:
     window.EMERALD_FIREBASE_CONFIG
   or:
     localStorage.emerald_firebase_config = JSON.stringify({...})
*/
const storedConfig = (() => {
  try {
    const value = JSON.parse(localStorage.getItem("emerald_firebase_config") || "null");
    return value && typeof value === "object" ? value : null;
  } catch {
    return null;
  }
})();

const defaultConfig = {
  apiKey: "AIzaSyBLghWLth0syJhARDMWiJ7xNwyJAh7MWjQ",
  authDomain: "securly-plans-main.firebaseapp.com",
  projectId: "securly-plans-main",
  storageBucket: "securly-plans-main.firebasestorage.app",
  messagingSenderId: "613499545769",
  appId: "1:613499545769:web:baa071714434c4814de1b8"
};

export const firebaseConfig =
  storedConfig ||
  window.EMERALD_FIREBASE_CONFIG ||
  defaultConfig;

export const firebaseConfigured = Boolean(
  firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId
);
