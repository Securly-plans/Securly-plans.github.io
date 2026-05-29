import {
  getAuth,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { app } from ".js/firebase.js";

const auth = getAuth(app);

/* ================= CONFIG ================= */

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

/* ================= STATE ================= */

let inactivityTimer;

/* ================= RESET TIMER ================= */

function resetSessionTimer(){

  clearTimeout(inactivityTimer);

  localStorage.setItem("lastActivity", Date.now());

  inactivityTimer = setTimeout(async ()=>{

    try{

      await signOut(auth);

    }catch(err){

      console.error("Logout failed:", err);
    }

    localStorage.clear();

    alert("You were logged out due to inactivity.");

    window.location.href = "login.html";

  }, SESSION_TIMEOUT);
}

/* ================= ACTIVITY EVENTS ================= */

[
  "mousemove",
  "mousedown",
  "click",
  "scroll",
  "keypress",
  "touchstart"
].forEach(event=>{

  document.addEventListener(event, resetSessionTimer, true);
});

/* ================= CHECK EXISTING SESSION ================= */

function checkSessionAge(){

  const lastActivity =
    Number(localStorage.getItem("lastActivity")) || Date.now();

  const now = Date.now();

  if(now - lastActivity > SESSION_TIMEOUT){

    signOut(auth).finally(()=>{

      localStorage.clear();

      alert("Session expired.");

      window.location.href = "login.html";
    });

    return;
  }

  resetSessionTimer();
}

/* ================= INIT ================= */

checkSessionAge();
