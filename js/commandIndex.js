console.log("js/commandIndex.js LOADED.");

export const COMMAND_INDEX = {

  /* ================= SYSTEM ================= */

  "system.status": {
    desc: "View full system configuration state",
    usage: "system.status",
    args: 0,
    category: "system"
  },

  "system.reset": {
    desc: "Reset all system flags (lockdown, chat, login, admin)",
    usage: "system.reset",
    args: 0,
    category: "system"
  },

  "system.lockdown.enable": {
    desc: "Begin global system lockdown flow",
    usage: "system.lockdown.enable",
    args: 0,
    category: "system"
  },

  "system.lockdown.disable": {
    desc: "Disable global system lockdown flow",
    usage: "system.lockdown.disable",
    args: 0,
    category: "system"
  },


  /* ================= USERS ================= */

  "user.list": {
    desc: "List all registered users in database",
    usage: "user.list",
    args: 0,
    category: "users"
  },

  "user.delete": {
    desc: "Delete a user permanently",
    usage: "user.delete [user]",
    args: 1,
    category: "users"
  },

  "user.role": {
    desc: "Change a user's role (user/mod/admin)",
    usage: "user.role [user] [role]",
    args: 2,
    category: "users"
  },

  "user.lock": {
    desc: "Lock a user account with optional reason",
    usage: "user.lock [user] [reason]",
    args: 1,
    category: "users"
  },

  "user.unlock": {
    desc: "Unlock a locked user account",
    usage: "user.unlock [user]",
    args: 1,
    category: "users"
  },

  "user.info": {
    desc: "View detailed user profile info",
    usage: "user.info [user]",
    args: 1,
    category: "users"
  },

  "user.notify": {
    desc: "Send notification to a user",
    usage: "user.notify [user] [message]",
    args: 2,
    category: "users"
  },


  /* ================= CHAT ================= */

  "chat.list": {
    desc: "List all chats in database",
    usage: "chat.list",
    args: 0,
    category: "chat"
  },

  "chat.view": {
    desc: "Open and load a chat session",
    usage: "chat.view [chatId]",
    args: 1,
    category: "chat"
  },

  "chat.delete": {
    desc: "Delete a message in current chat",
    usage: "chat.delete [index]",
    args: 1,
    category: "chat"
  },

  "chat.clear": {
    desc: "Clear all messages in current chat",
    usage: "chat.clear",
    args: 0,
    category: "chat"
  },

  "chat.export": {
    desc: "Export chat as JSON file",
    usage: "chat.export",
    args: 0,
    category: "chat"
  },

  "chat.server": {
    desc: "Send system/server message into chat",
    usage: "chat.server [message]",
    args: 1,
    category: "chat"
  },


  /* ================= ANNOUNCEMENTS ================= */

  "announce.set": {
    desc: "Set global announcement message",
    usage: "announce.set [text]",
    args: 1,
    category: "system"
  },

  "announce.enable": {
    desc: "Enable announcements",
    usage: "announce.enable",
    args: 0,
    category: "system"
  },

  "announce.disable": {
    desc: "Disable announcements",
    usage: "announce.disable",
    args: 0,
    category: "system"
  },

  "announce.color": {
    desc: "Set announcement color style",
    usage: "announce.color [color]",
    args: 1,
    category: "system"
  },


  "announce.emergency.set": {
    desc: "Enable emergency broadcast system",
    usage: "announce.emergency.set [text]",
    args: 1,
    category: "system"
  },

  "announce.emergency.disable": {
    desc: "Disable emergency broadcast",
    usage: "announce.emergency.disable",
    args: 0,
    category: "system"
  },

  "announce.emergency.view": {
    desc: "View emergency broadcast state",
    usage: "announce.emergency.view",
    args: 0,
    category: "system"
  },


  /* ================= PAGE CONTROL ================= */

  "page.redirect": {
    desc: "Redirect browser to a URL",
    usage: "page.redirect [url]",
    args: 1,
    category: "page"
  },

  "page.open": {
    desc: "Open URL in new tab",
    usage: "page.open [url]",
    args: 1,
    category: "page"
  },

  "page.reload": {
    desc: "Reload current page",
    usage: "page.reload",
    args: 0,
    category: "page"
  },

  "page.back": {
    desc: "Go back in browser history",
    usage: "page.back",
    args: 0,
    category: "page"
  },

  "page.forward": {
    desc: "Go forward in browser history",
    usage: "page.forward",
    args: 0,
    category: "page"
  },

  "page.info": {
    desc: "Show current page info",
    usage: "page.info",
    args: 0,
    category: "page"
  },


  /* ================= DEBUG ================= */

  "debug.db.test": {
    desc: "Test Firestore connection",
    usage: "debug.db.test",
    args: 0,
    category: "debug"
  },

  "debug.config.view": {
    desc: "View system config (sensitive fields hidden)",
    usage: "debug.config.view",
    args: 0,
    category: "debug"
  },

  "debug.latency": {
    desc: "Measure database response time",
    usage: "debug.latency",
    args: 0,
    category: "debug"
  },

  "debug.console.clear": {
    desc: "Clear console output",
    usage: "debug.console.clear",
    args: 0,
    category: "debug"
  },

  "debug.log": {
    desc: "View admin debug logs",
    usage: "debug.log",
    args: 0,
    category: "debug"
  },

  "debug.log.clear": {
    desc: "Delete all debug logs",
    usage: "debug.log.clear",
    args: 0,
    category: "debug"
  }

};
