/* ===========================
   AdminOS Smart Suggest Module
   consolesuggest.js
   =========================== */

let smartSuggestEnabled = false;

/**
 * Toggle from console
 */
export function setSmartSuggest(state) {
  smartSuggestEnabled = state;
}

/**
 * Check status (optional helper)
 */
export function isSmartSuggestEnabled() {
  return smartSuggestEnabled;
}

/**
 * Main AI parser (only works when enabled)
 */
export async function aiParse(inputStr) {

  if (!smartSuggestEnabled) return null;

  if (!inputStr || typeof inputStr !== "string") return null;

  const text = inputStr.toLowerCase().trim();

  // =========================
  // USER COMMANDS
  // =========================

  if (text.includes("lock user") || text.includes("ban user") || text.startsWith("lock ")) {
    const name = lastWord(text);
    if (!name) return null;

    return {
      cmd: "user.lock",
      args: [name, "smart-suggest"]
    };
  }

  if (text.includes("unlock user") || text.includes("unban user")) {
    const name = lastWord(text);
    if (!name) return null;

    return {
      cmd: "user.unlock",
      args: [name]
    };
  }

  if (text.includes("delete user")) {
    const name = lastWord(text);
    if (!name) return null;

    return {
      cmd: "user.delete",
      args: [name]
    };
  }

  if (text.includes("show users") || text.includes("list users")) {
    return { cmd: "user.list", args: [] };
  }

  // =========================
  // CHAT COMMANDS
  // =========================

  if (text.includes("show chats") || text.includes("list chats")) {
    return { cmd: "chat.list", args: [] };
  }

  if (text.includes("clear chat")) {
    return { cmd: "chat.clear", args: [] };
  }

  if (text.includes("open chat")) {
    const id = lastWord(text);
    if (!id) return null;

    return {
      cmd: "chat.view",
      args: [id]
    };
  }

  if (text.includes("delete message")) {
    const num = lastNumber(text);
    if (num === null) return null;

    return {
      cmd: "chat.delete",
      args: [num]
    };
  }

  if (text.includes("server message")) {
    return {
      cmd: "chat.server",
      args: [afterKeyword(text, "message")]
    };
  }

  // =========================
  // SYSTEM
  // =========================

  if (text.includes("system status")) {
    return { cmd: "system.status", args: [] };
  }

  if (text.includes("reset system")) {
    return { cmd: "system.reset", args: [] };
  }

  if (text.includes("enable lockdown")) {
    return { cmd: "system.lockdown.enable", args: [] };
  }

  if (text.includes("disable lockdown")) {
    return { cmd: "system.lockdown.disable", args: [] };
  }

  // =========================
  // PAGE
  // =========================

  if (text.includes("open page")) {
    return {
      cmd: "page.open",
      args: [lastWord(text)]
    };
  }

  if (text.includes("redirect")) {
    return {
      cmd: "page.redirect",
      args: [lastWord(text)]
    };
  }

  if (text.includes("reload page")) {
    return { cmd: "page.reload", args: [] };
  }

  return null;
}

/* ===========================
   HELPERS
   =========================== */

function lastWord(text) {
  const parts = text.split(" ");
  return parts[parts.length - 1];
}

function lastNumber(text) {
  const m = text.match(/\d+/g);
  return m ? parseInt(m[m.length - 1]) : null;
}

function afterKeyword(text, keyword) {
  const i = text.indexOf(keyword);
  return i === -1 ? null : text.slice(i + keyword.length).trim();
}
