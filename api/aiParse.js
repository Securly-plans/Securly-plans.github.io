console.log("api/aiParse.js LOADED.");

export default async function handler(req, res) {
  // CORS
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://securly-plans.github.io"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { input } = req.body;

    const text = String(input || "").trim();

    if (!text) {
      return res.status(200).json({
        cmd: null,
        args: []
      });
    }

    const parts = text.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (command) {

      case "ban":
        return res.status(200).json({
          cmd: "user.ban",
          args
        });

      case "unban":
        return res.status(200).json({
          cmd: "user.unban",
          args
        });

      case "kick":
        return res.status(200).json({
          cmd: "user.kick",
          args
        });

      case "lock":
        return res.status(200).json({
          cmd: "user.lock",
          args
        });

      case "unlock":
        return res.status(200).json({
          cmd: "user.unlock",
          args
        });

      case "delete":
        return res.status(200).json({
          cmd: "user.delete",
          args
        });

      case "users":
        return res.status(200).json({
          cmd: "user.list",
          args: []
        });

      case "chat":
        return res.status(200).json({
          cmd: "chat.list",
          args: []
        });

      case "reset":
        return res.status(200).json({
          cmd: "system.reset",
          args: []
        });

      default:
        return res.status(200).json({
          cmd: null,
          args: [],
          message: "AI could not map command"
        });
    }
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
}
