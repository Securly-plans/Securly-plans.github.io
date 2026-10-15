console.log("js/consolesuggest.js LOADED.");

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./firebase.js";
import { COMMAND_INDEX } from "./commandIndex.js";

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
   FIRESTORE API KEY (optional system config hook)
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
   BACKEND AI CALL
========================= */

async function callAI(input) {
  const res = await fetch(
    "https://securly-plans-github-io.vercel.app/api/aiParse",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ input })
    }
  );

  if (!res.ok) {
    throw new Error("AI backend failed: " + res.status);
  }

  return await res.json();
}

/* =========================
   PHRASE BOOSTING (HIGH ACCURACY LAYER)
========================= */

const PHRASE_BOOST = {
  "delete user": "user.delete",
  "remove user": "user.delete",
  "ban user": "user.lock",
  "lock user": "user.lock",
  "unban user": "user.unlock",
  "unlock user": "user.unlock",

  "list users": "user.list",
  "show users": "user.list",

  "system reset": "system.reset",
  "reset system": "system.reset",

  "clear chat": "chat.clear",
  "list chats": "chat.list",
  "open chat": "chat.view",

  "send announcement": "announce.set",
  "make announcement": "announce.set",

  "redirect page": "page.redirect",
  "open page": "page.open"
};

/* =========================
   INTENT SCORING ENGINE
========================= */

const INTENTS = [
  { cmd: "user.lock", weight: { lock: 3, ban: 3, disable: 1, user: 2 } },
  { cmd: "user.unlock", weight: { unlock: 3, unban: 3, enable: 1, user: 2 } },
  { cmd: "user.delete", weight: { delete: 3, remove: 2, user: 2 } },
  { cmd: "user.list", weight: { list: 3, show: 2, users: 3 } },

  { cmd: "chat.list", weight: { chat: 3, list: 2 } },
  { cmd: "chat.view", weight: { chat: 3, open: 2, view: 2 } },
  { cmd: "chat.clear", weight: { chat: 3, clear: 3 } },

  { cmd: "system.reset", weight: { reset: 3, system: 2 } },

  { cmd: "announce.set", weight: { announce: 3, broadcast: 2, message: 2 } },

  { cmd: "page.redirect", weight: { redirect: 3, go: 1, page: 2 } },
  { cmd: "page.open", weight: { open: 3, page: 2 } }
];

function scoreIntent(input, intent) {
  const tokens = input
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .split(" ");

  let score = 0;

  for (const token of tokens) {
    if (intent.weight[token]) {
      score += intent.weight[token];
    }
  }

  return score;
}

/* =========================
   LOCAL FALLBACK ENGINE (SMART)
========================= */

function fallbackMatch(input) {

  const raw = input.trim();
  const t = raw.toLowerCase();

  /* -------------------------
     1. PHRASE BOOST (HIGHEST PRIORITY)
  ------------------------- */

  for (const phrase in PHRASE_BOOST) {
    if (t.includes(phrase)) {
      return {
        cmd: PHRASE_BOOST[phrase],
        args: raw.split(" ").slice(1)
      };
    }
  }

  /* -------------------------
     2. DIRECT COMMAND MATCH
  ------------------------- */

  for (const cmd in COMMAND_INDEX) {
    if (t === cmd || t.startsWith(cmd + " ")) {
      return {
        cmd,
        args: raw.split(" ").slice(1)
      };
    }
  }

  /* -------------------------
     3. INTENT SCORING (FUZZY AI-LIKE MATCH)
  ------------------------- */

  let best = null;
  let bestScore = 0;

  for (const intent of INTENTS) {
    const score = scoreIntent(raw, intent);

    if (score > bestScore) {
      bestScore = score;
      best = intent.cmd;
    }
  }

  // threshold prevents garbage matches
  if (bestScore >= 3) {
    return {
      cmd: best,
      args: raw.split(" ").slice(1)
    };
  }

  return null;
}

/* =========================
   MAIN AI PARSER
========================= */

export async function aiParse(input) {

  if (!smartSuggestEnabled) return null;

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
