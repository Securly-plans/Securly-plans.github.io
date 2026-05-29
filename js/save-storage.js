```javascript
import {
  doc,
  getDoc,
  setDoc,
  saveLocalStorage
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./js/firebase.js";

/* ================= CONFIG ================= */

const COLLECTION = "userStorage";

/* ================= GET USER ID ================= */
/* You MUST set this when logging in */

function getUserId(){
  return localStorage.getItem("userId") || null;
}

/* ================= SAVE LOCALSTORAGE ================= */

export async function saveLocalStorage(){

  const userId = getUserId();
  if(!userId) return;

  const data = {};

  for(let i = 0; i < localStorage.length; i++){
    const key = localStorage.key(i);
    data[key] = localStorage.getItem(key);
  }

  try{

    await setDoc(doc(db, COLLECTION, userId), {
      data,
      updatedAt: Date.now()
    });

  }catch(err){
    console.error("Failed to save localStorage:", err);
  }
}

/* ================= LOAD LOCALSTORAGE ================= */

export async function loadLocalStorage(){

  const userId = getUserId();
  if(!userId) return;

  try{

    const snap = await getDoc(doc(db, COLLECTION, userId));

    if(!snap.exists()) return;

    const data = snap.data().data;

    if(!data) return;

    Object.entries(data).forEach(([key, value])=>{
      localStorage.setItem(key, value);
    });

  }catch(err){
    console.error("Failed to load localStorage:", err);
  }
}

/* ================= AUTO SYNC (OPTIONAL) ================= */
/* Saves every 15 seconds if anything changes */

let lastSnapshot = "";

function snapshotStorage(){
  const obj = {};

  for(let i = 0; i < localStorage.length; i++){
    const key = localStorage.key(i);
    obj[key] = localStorage.getItem(key);
  }

  return JSON.stringify(obj);
}

export function startStorageSync(){

  setInterval(async ()=>{

    const current = snapshotStorage();

    if(current !== lastSnapshot){
      lastSnapshot = current;
      await saveLocalStorage();
    }

  }, 15000);
}

/* ================= AUTO INIT ================= */

if(getUserId()){
  loadLocalStorage();
  startStorageSync();
}
```
