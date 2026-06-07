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
  const t = input.toLowerCase();

  // direct intent mapping (fast + reliable)

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

/* =========================
   MAIN AI PARSER
========================= */

export async function aiParse(input) {
  if (!smartSuggestEnabled) return null;

  try {
    const apiKey = await getApiKey();

    // debug safety check
    if (apiKey && apiKey.startsWith("sk-")) {
      console.warn(
        "⚠ OpenAI key detected in Firestore. Do NOT use in frontend. Use backend proxy."
      );
    }

    /**
     * If no backend exists, immediately fallback
     * (prevents your current CORS + 401 errors)
     */
    if (!apiKey) {
      return fallbackMatch(input);
    }

    // SAFE ROUTE: backend only
    const result = await callAI(input);

    if (!result || !result.cmd) {
      return fallbackMatch(input);
    }

    return {
      cmd: result.cmd,
      args: Array.isArray(result.args) ? result.args : []
    };

  } catch (err) {
    console.error("AI parse error:", err);

    // ALWAYS fallback instead of breaking console
    return fallbackMatch(input);
  }
}
