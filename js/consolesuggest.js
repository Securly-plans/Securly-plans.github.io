import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "./firebase.js";

let smartSuggestEnabled = false;
let cachedKey = null;

/* ================= TOGGLE ================= */

export function setSmartSuggest(state) {
  smartSuggestEnabled = !!state;
}

export function isSmartSuggestEnabled() {
  return smartSuggestEnabled;
}

/* ================= LOAD API KEY (FIRESTORE) ================= */

async function getAPIKey() {

  if (cachedKey) return cachedKey;

  try {
    const snap = await getDoc(doc(db, "system", "consoleAutoSuggest"));

    if (!snap.exists()) {
      console.error("consoleAutoSuggest doc missing");
      return null;
    }

    cachedKey = snap.data()?.API || null;

    return cachedKey;

  } catch (err) {
    console.error("Failed to load API key:", err);
    return null;
  }
}

/* ================= AI PARSER ================= */

export async function aiParse(input) {

  if (!smartSuggestEnabled) return null;

  const key = await getAPIKey();

  if (!key) {
    console.error("AI key not found in Firestore");
    return null;
  }

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
You are an admin console command parser.

Return ONLY JSON.

Allowed format:
{
  "cmd": "command.name",
  "args": []
}

Rules:
- ONLY JSON
- NO explanation
- If unsure return null
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

    if (!res.ok) {
      console.error("OpenAI error:", await res.text());
      return null;
    }

    const data = await res.json();

    const raw = data?.choices?.[0]?.message?.content;

    if (!raw) return null;

    return JSON.parse(raw);

  } catch (err) {
    console.error("AI parse failed:", err);
    return null;
  }
}
