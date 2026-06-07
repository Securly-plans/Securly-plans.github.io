console.log("js/consolesuggest.js LOADED."); 
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "./firebase.js";

/* ================= STATE ================= */

let smartSuggestEnabled = false;
let apiKeyCache = null;

/* ================= SMART TOGGLE ================= */

export function setSmartSuggest(state) {
  smartSuggestEnabled = !!state;
}

export function isSmartSuggestEnabled() {
  return smartSuggestEnabled;
}

/* ================= COMMAND REGISTRY ================= */

let commandRegistry = {};

export function setCommandRegistry(cmds) {
  commandRegistry = cmds || {};
}

/* ================= ALIASES ================= */

const aliases = {
  lock: "system.lockdown.enable",
  unlock: "system.lockdown.disable",
  restart: "system.reset",
  clear: "debug.console.clear",
  users: "user.list",
  ban: "user.lock",
  unban: "user.unlock",
  notify: "user.notify",
  chat: "chat.list",
  open: "page.open",
  redirect: "page.redirect"
};

/* ================= FUZZY MATCH ================= */

function levenshtein(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function findClosestCommand(input) {
  let best = null;
  let bestScore = Infinity;

  Object.keys(commandRegistry).forEach(cmd => {
    const score = levenshtein(input, cmd);
    if (score < bestScore) {
      bestScore = score;
      best = cmd;
    }
  });

  if (bestScore <= 3) {
    return { cmd: best, score: 0.8 };
  }

  return null;
}

/* ================= FIRESTORE KEY ================= */

async function getAPIKey() {
  if (apiKeyCache) return apiKeyCache;

  try {
    const snap = await getDoc(doc(db, "system", "consoleAutoSuggest"));

    if (!snap.exists()) return null;

    apiKeyCache = snap.data()?.API || null;
    return apiKeyCache;

  } catch (err) {
    console.error("API key fetch failed:", err);
    return null;
  }
}

/* ================= AI PARSER ================= */

export async function aiParse(input) {

  if (!smartSuggestEnabled) return null;

  const key = await getAPIKey();
  if (!key) return null;

  try {

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: `
Return ONLY JSON:

{
  "cmd": "",
  "args": []
}

Only choose from known admin commands.
No explanation.
`
          },
          {
            role: "user",
            content: input
          }
        ],
        temperature: 0.2
      })
    });

    if (!res.ok) return null;

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content;

    if (!raw) return null;

    return JSON.parse(raw);

  } catch (err) {
    console.error("AI parse error:", err);
    return null;
  }
}

/* ================= CORE RESOLVER ================= */

export async function resolveCommand(input) {

  const raw = input.trim().toLowerCase();
  const parts = raw.split(" ");
  const base = parts[0];

  let args = parts.slice(1);

  /* 1. EXACT MATCH */
  if (commandRegistry[base]) {
    return {
      cmd: base,
      args,
      source: "exact",
      confidence: 1.0
    };
  }

  /* 2. ALIAS MATCH */
  if (aliases[base]) {
    return {
      cmd: aliases[base],
      args,
      source: "alias",
      confidence: 0.95
    };
  }

  /* 3. FUZZY MATCH */
  const fuzzy = findClosestCommand(base);
  if (fuzzy && commandRegistry[fuzzy.cmd]) {
    return {
      cmd: fuzzy.cmd,
      args,
      source: "fuzzy",
      confidence: fuzzy.score
    };
  }

  /* 4. AI MATCH */
  const ai = await aiParse(input);

  if (ai?.cmd && commandRegistry[ai.cmd]) {
    return {
      cmd: ai.cmd,
      args: ai.args || [],
      source: "ai",
      confidence: 0.85
    };
  }

  return null;
}
