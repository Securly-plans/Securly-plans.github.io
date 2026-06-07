export default async function handler(req, res) {
  // CORS headers (THIS FIXES YOUR ERROR)
  res.setHeader("Access-Control-Allow-Origin", "https://securly-plans.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;

  return res.status(200).json({
    reply: "Backend working: " + message
  });
}
