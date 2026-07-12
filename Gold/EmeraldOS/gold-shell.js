"use strict";

const SHELL_VERSION = "2.0";
const DEFAULT_LATEST = {
  product: "EmeraldOS Gold",
  latestVersion: "9.0",
  build: "9.0",
  folder: "Gold_9.0",
  entry: "OS.html",
  channel: "stable",
  status: "stable",
  required: false,
  enabled: true,
  setupMode: "continue",
  releaseTitle: "EmeraldOS Gold 9.0",
  summary: "EmeraldOS Gold update-system build.",
  migrationFrom: ["8.0", "8.0.1"],
  migrationId: "gold8-to-gold9-direct-shell",
  minShellVersion: "1.0",
  rollbackFolder: "Gold_9.0",
  rollbackVersion: "9.0"
};

let fb = null;
const $ = id => document.getElementById(id);
const now = () => new Date().toISOString();

function setStatus(message){
  const node = $("bootStatus");
  if(node) node.textContent = message;
}
function readJSON(key, fallback){
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
function writeJSON(key, value){
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}
function safeFolder(folder){
  folder = String(folder || DEFAULT_LATEST.folder);
  return /^[A-Za-z0-9_.-]+$/.test(folder) ? folder : DEFAULT_LATEST.folder;
}
function safeEntry(entry){
  entry = String(entry || "OS.html");
  return /^[A-Za-z0-9_.-]+\.html$/.test(entry) ? entry : "OS.html";
}
function username(){
  return localStorage.getItem("username") ||
         localStorage.getItem("gold90_username") ||
         localStorage.getItem("gold80_username") ||
         "GoldUser";
}
function targetUrl(manifest){
  const url = new URL(`./${safeFolder(manifest.folder)}/${safeEntry(manifest.entry)}`, location.href);
  url.searchParams.set("goldShell", "1");
  url.searchParams.set("version", manifest.latestVersion || manifest.build || "9.0");
  url.searchParams.set("shell", SHELL_VERSION);
  return url.href;
}
async function loadFirebase(){
  try {
    fb = await import("./firebase.js");
    return fb;
  } catch (error) {
    console.warn("EmeraldOS Gold updater Firebase unavailable", error);
    return null;
  }
}
async function readLatest(){
  const firebase = fb || await loadFirebase();
  if(!firebase) return {...DEFAULT_LATEST, firebaseUnavailable: true};
  try {
    const ref = firebase.doc(firebase.db, "system", "emeraldGoldLatest");
    const snap = await firebase.getDoc(ref);
    const manifest = snap.exists() ? {...DEFAULT_LATEST, ...snap.data()} : {...DEFAULT_LATEST};
    if(manifest.enabled === false) throw new Error("Latest EmeraldOS Gold build is disabled.");
    writeJSON("emeraldGoldShell_latest", manifest);
    return manifest;
  } catch (error) {
    console.warn("Could not read system/emeraldGoldLatest", error);
    return {...DEFAULT_LATEST, firebaseReadFailed: true, errorMessage: error.message};
  }
}
function createLocalSnapshot(reason, manifest){
  const snapshot = {
    product: "EmeraldOS Gold",
    reason,
    time: now(),
    shellVersion: SHELL_VERSION,
    user: username(),
    fromVersion: localStorage.getItem("emeraldGoldShell_activeVersion") || "",
    fromFolder: localStorage.getItem("emeraldGoldShell_activeFolder") || "",
    toVersion: manifest.latestVersion || manifest.build || "",
    toFolder: manifest.folder || "",
    storage: {}
  };
  for(let i = 0; i < localStorage.length; i++){
    const key = localStorage.key(i);
    if(key && /^(gold|emeraldGoldShell_|emeraldOS|loggedIn|username|role|Emerald)/.test(key)){
      snapshot.storage[key] = localStorage.getItem(key);
    }
  }
  writeJSON("emeraldGoldShell_lastSnapshot", snapshot);
  return snapshot;
}
async function cloudWrite(path, value){
  if(!fb) return false;
  try {
    await fb.setDoc(fb.doc(fb.db, ...path), value);
    return true;
  } catch (error) {
    console.warn("Gold updater cloud write failed", path, error);
    return false;
  }
}
async function prepareUpdate(manifest){
  const oldVersion = localStorage.getItem("emeraldGoldShell_activeVersion") || "";
  const oldFolder = localStorage.getItem("emeraldGoldShell_activeFolder") || "";
  const newVersion = manifest.latestVersion || manifest.build || "9.0";
  const newFolder = safeFolder(manifest.folder);

  if(oldVersion !== newVersion || oldFolder !== newFolder || new URLSearchParams(location.search).has("force")){
    setStatus(`Preparing EmeraldOS Gold ${newVersion}...`);
    const snapshot = createLocalSnapshot("before-version-boot", manifest);
    const user = username();
    await cloudWrite(["emeraldOSUsers", user, "goldVM", "current"], {
      activeVersion: newVersion,
      activeFolder: newFolder,
      entry: safeEntry(manifest.entry),
      channel: manifest.channel || "stable",
      setupMode: manifest.setupMode || "continue",
      lastUpdateBoot: now(),
      lastShellVersion: SHELL_VERSION,
      cloudSync: true
    });
    await cloudWrite(["emeraldOSUsers", user, "goldVMSnapshots", `snapshot_${Date.now()}`], snapshot);
    await cloudWrite(["emeraldOSUsers", user, "goldVMUpdateHistory", `update_${Date.now()}`], {
      from: oldVersion || "first-shell-boot",
      fromFolder: oldFolder || "",
      to: newVersion,
      toFolder: newFolder,
      migrationId: manifest.migrationId || "",
      required: !!manifest.required,
      successful: true,
      date: now()
    });
  }

  localStorage.setItem("emeraldGoldShell_activeVersion", newVersion);
  localStorage.setItem("emeraldGoldShell_activeFolder", newFolder);
  localStorage.setItem("emeraldGoldShell_activeEntry", safeEntry(manifest.entry));
  localStorage.setItem("emeraldGoldShell_lastBoot", now());
  localStorage.setItem("emeraldGold_updateJustApplied", oldVersion && oldVersion !== newVersion ? "true" : "false");
  writeJSON("emeraldGold_updateNotice", {
    from: oldVersion,
    to: newVersion,
    title: manifest.releaseTitle || `EmeraldOS Gold ${newVersion}`,
    summary: manifest.summary || "EmeraldOS Gold has been updated.",
    time: now()
  });
}
async function boot(){
  try {
    setStatus("Checking latest EmeraldOS Gold version...");
    const manifest = await readLatest();
    await prepareUpdate(manifest);
    const url = targetUrl(manifest);
    setStatus(`Starting ${manifest.releaseTitle || manifest.latestVersion}...`);
    setTimeout(() => location.replace(url), 250);
  } catch (error) {
    console.error(error);
    setStatus("The automatic update boot could not continue.");
    const fallback = $("bootFallback");
    if(fallback) fallback.hidden = false;
  }
}
window.addEventListener("DOMContentLoaded", () => {
  $("bootFallbackBtn")?.addEventListener("click", () => location.href = targetUrl(DEFAULT_LATEST));
  $("retryBtn")?.addEventListener("click", () => location.reload());
  boot();
});
