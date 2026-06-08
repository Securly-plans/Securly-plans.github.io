// js/consolesuggest.js

import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "./firebase.js";

/* =========================
   STATE
========================= */

let smartSuggestEnabled = true;

export function setSmartSuggest(state) {
  smartSuggestEnabled = !!state;
}

export function isSmartSuggestEnabled() {
  return smartSuggestEnabled;
}

/* =========================
   FIRESTORE API KEY (YOUR STRUCTURE)
========================= */

async function getApiKey() {
  try {
    const snap = await getDoc(
      doc(db, "system", "consoleAutoSuggest")
    );

    if (!snap.exists()) return null;

    return snap.data()?.API || null;

  } catch (err) {
    console.error("Failed to load API key:", err);
    return null;
  }
}

/* =========================
   BACKEND AI CALL (REQUIRED FIX)
========================= */
/*
IMPORTANT:
You CANNOT call OpenAI directly from browser.
This must be a backend endpoint you control.
*/

async function callAI(input) {
  const res = await fetch("https://securly-plans-github-io.vercel.app/api/aiParse", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ input })
  });

  if (!res.ok) {
    throw new Error("AI backend failed: " + res.status);
  }

  return await res.json();
}

/* =========================
   SMART LOCAL FALLBACK (IMPORTANT)
========================= */

function fallbackMatch(input) {
  const raw = input.trim();
  const t = raw.toLowerCase();

  if (t.startsWith("ban ")) {
    return {
      cmd: "user.ban",
      args: [raw.slice(4).trim()]
    };
  }

  if (t.startsWith("unban ")) {
    return {
      cmd: "user.unban",
      args: [raw.slice(6).trim()]
    };
  }

  if (t.startsWith("kick ")) {
    return {
      cmd: "user.kick",
      args: [raw.slice(5).trim()]
    };
  }

  if (t.includes("lock user") || t === "lock") {
    return { cmd: "user.lock", args: [] };
  }

  if (t.includes("unlock user")) {
    return { cmd: "user.unlock", args: [] };
  }

  if (t.includes("delete user")) {
    return { cmd: "user.delete", args: [] };
  }

  if (t.includes("list users") || t === "users") {
    return { cmd: "user.list", args: [] };
  }

  if (t.includes("system reset")) {
    return { cmd: "system.reset", args: [] };
  }

  if (t.includes("chat")) {
    return { cmd: "chat.list", args: [] };
  }

  return null;
}

export async function aiParse(input) {
  if (!smartSuggestEnabled) {
    return null;
  }

  try {
    const result = await callAI(input);

    console.log("AI RESULT:", result);

    if (
      result &&
      typeof result.cmd === "string" &&
      result.cmd.trim().length > 0
    ) {
      return {
        cmd: result.cmd.trim(),
        args: Array.isArray(result.args)
          ? result.args
          : []
      };
    }

    return fallbackMatch(input);

  } catch (err) {
    console.error("AI parse error:", err);
    return fallbackMatch(input);
  }
}
