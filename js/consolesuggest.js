/* ===========================
   AdminOS AI Command Layer
   consolesuggest.js
   =========================== */

/**
 * Converts natural language → structured command
 * Returns:
 *   { cmd: string, args: array } OR null
 */

export async function aiParse(inputStr) {

  if (!inputStr || typeof inputStr !== "string") return null;

  const text = inputStr.toLowerCase().trim();

  // =========================
  // USER MANAGEMENT INTENTS
  // =========================

  if (
    text.includes("lock user") ||
    text.includes("ban user") ||
    text.startsWith("ban ") ||
    text.startsWith("lock ")
  ) {
    const name = extractLastWord(text);
    if (!name) return null;

    return {
      cmd: "user.lock",
      args: [name, "ai-generated lock"]
    };
  }

  if (
    text.includes("unlock user") ||
    text.includes("unban user")
  ) {
    const name = extractLastWord(text);
    if (!name) return null;

    return {
      cmd: "user.unlock",
      args: [name]
    };
  }

  if (text.includes("delete user")) {
    const name = extractLastWord(text);
    if (!name) return null;

    return {
      cmd: "user.delete",
      args: [name]
    };
  }

  if (text.includes("show users") || text.includes("list users")) {
    return {
      cmd: "user.list",
      args: []
    };
  }

  // =========================
  // CHAT INTENTS
  // =========================

  if (text.includes("show chats") || text.includes("list chats")) {
    return {
      cmd: "chat.list",
      args: []
    };
  }

  if (text.includes("open chat")) {
    const id = extractLastWord(text);
    if (!id) return null;

    return {
      cmd: "chat.view",
      args: [id]
    };
  }

  if (text.includes("clear chat")) {
    return {
      cmd: "chat.clear",
      args: []
    };
  }

  if (text.includes("delete message")) {
    const index = extractLastNumber(text);
    if (index === null) return null;

    return {
      cmd: "chat.delete",
      args: [index]
    };
  }

  if (text.includes("send server message")) {
    const msg = extractAfter(text, "message");
    if (!msg) return null;

    return {
      cmd: "chat.server",
      args: [msg]
    };
  }

  // =========================
  // SYSTEM INTENTS
  // =========================

  if (text.includes("system status")) {
    return {
      cmd: "system.status",
      args: []
    };
  }

  if (text.includes("reset system")) {
    return {
      cmd: "system.reset",
      args: []
    };
  }

  if (text.includes("enable lockdown")) {
    return {
      cmd: "system.lockdown.enable",
      args: []
    };
  }

  if (text.includes("disable lockdown")) {
    return {
      cmd: "system.lockdown.disable",
      args: []
    };
  }

  // =========================
  // ANNOUNCEMENTS
  // =========================

  if (text.includes("set announcement")) {
    const msg = extractAfter(text, "announcement");
    if (!msg) return null;

    return {
      cmd: "announce.set",
      args: [msg]
    };
  }

  if (text.includes("emergency broadcast")) {
    const msg = extractAfter(text, "broadcast");
    if (!msg) return null;

    return {
      cmd: "announce.emergency.set",
      args: [msg]
    };
  }

  // =========================
  // PAGE CONTROL
  // =========================

  if (text.includes("open page")) {
    const url = extractLastWord(text);
    if (!url) return null;

    return {
      cmd: "page.open",
      args: [url]
    };
  }

  if (text.includes("redirect to")) {
    const url = extractLastWord(text);
    if (!url) return null;

    return {
      cmd: "page.redirect",
      args: [url]
    };
  }

  if (text.includes("reload page")) {
    return {
      cmd: "page.reload",
      args: []
    };
  }

  if (text.includes("go back")) {
    return {
      cmd: "page.back",
      args: []
    };
  }

  if (text.includes("go forward")) {
    return {
      cmd: "page.forward",
      args: []
    };
  }

  // =========================
  // DEBUG INTENTS
  // =========================

  if (text.includes("show logs")) {
    return {
      cmd: "debug.log",
      args: []
    };
  }

  if (text.includes("clear logs")) {
    return {
      cmd: "debug.log.clear",
      args: []
    };
  }

  if (text.includes("check database")) {
    return {
      cmd: "debug.db.test",
      args: []
    };
  }

  // =========================
  // NO MATCH
  // =========================

  return null;
}

/* ===========================
   HELPERS
   =========================== */

function extractLastWord(text) {
  const parts = text.trim().split(" ");
  return parts.length ? parts[parts.length - 1] : null;
}

function extractLastNumber(text) {
  const match = text.match(/\d+/g);
  if (!match) return null;
  return parseInt(match[match.length - 1]);
}

function extractAfter(text, keyword) {
  const index = text.indexOf(keyword);
  if (index === -1) return null;
  return text.slice(index + keyword.length).trim();
}
