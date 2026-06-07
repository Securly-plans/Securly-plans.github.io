console.log("js/consolesuggest.js LOADED.");
const AI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

// ⚠️ TEMP ONLY (move to backend later)
const API_KEY = "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";

/**
 * Convert natural language → structured admin command
 */
export async function parseConsoleCommand(input) {
  const response = await fetch(AI_ENDPOINT, {
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
You are an AI command parser for an admin console.

Convert user input into ONLY valid JSON.

Allowed commands:
- user.ban { userId }
- user.banInactive { days }
- page.redirect { url }
- chat.send { message }

Rules:
- Output ONLY JSON
- No markdown
- No explanations
- No extra text

Example:
{
  "command": "user.banInactive",
  "args": { "days": 30 }
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

  const data = await response.json();

  // AI response text → JSON object
  const raw = data.choices?.[0]?.message?.content;

  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse AI response:", raw);
    return null;
  }
}
