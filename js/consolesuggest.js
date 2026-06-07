// js/consolesuggest.js

const API_ENDPOINT = "https://api.openai.com/v1/chat/completions";

// ⚠️ TEMP ONLY (move to backend later for security)
const API_KEY = "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";

let smartSuggestEnabled = false;

/* ================= TOGGLE ================= */

export function setSmartSuggest(state) {
  smartSuggestEnabled = !!state;
}

export function isSmartSuggestEnabled() {
  return smartSuggestEnabled;
}

/* ================= AI PARSER ================= */

export async function aiParse(input) {
  if (!smartSuggestEnabled) return null;

  try {
    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: `
You are an admin console command mapper.

Return ONLY valid JSON.

Available commands:
- user.ban { userId }
- user.banInactive { days }
- page.redirect { url }
- chat.send { message }
- system.status
- announce.set { text }

Rules:
- Output ONLY JSON
- No markdown
- No explanation
- If unsure, return null

Example:
{
  "cmd": "user.banInactive",
  "args": [30]
}
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

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content;

    if (!raw) return null;

    return JSON.parse(raw);

  } catch (err) {
    console.error("AI parse error:", err);
    return null;
  }
}
