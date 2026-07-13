/* EmeraldOS Gold Firebase configuration.
   Option A: replace the object below with the same Firebase web config used by your existing EmeraldOS deployment.
   Option B: set localStorage.emerald_firebase_config to a JSON Firebase config object.
   Without a config, Gold 1H remains fully usable in local-only mode. */
const stored=(()=>{try{return JSON.parse(localStorage.getItem('emerald_firebase_config')||'null')}catch{return null}})();
export const firebaseConfig=stored||window.EMERALD_FIREBASE_CONFIG||{
  apiKey:"",
  authDomain:"",
  projectId:"",
  storageBucket:"",
  messagingSenderId:"",
  appId:""
};
export const firebaseConfigured=Boolean(firebaseConfig.apiKey&&firebaseConfig.projectId);
