const $ = (id) => document.getElementById(id);

let fb = null;
let currentUser = null;
let currentVmState = null;
let currentVersionConfig = null;
let saveTimer = null;
let frameReady = false;

const LOCAL_USERS_KEY = "emerald_gold_shell_local_users";
const SESSION_KEY = "emerald_gold_shell_session";
const OVERRIDE_KEY = "emerald_gold_shell_override";
const LOG_KEY = "emerald_gold_shell_log";

const TU1 = {
  product: "EmeraldOS Gold",
  latestVersion: "T.U.1",
  folder: "Gold_T.U.1",
  entry: "OS.html",
  channel: "stable",
  status: "test",
  releaseTitle: "EmeraldOS Gold T.U.1 Shell Test",
  summary: "Initial shell-routed test build.",
  setupMode: "full",
  required: false
};

const TU2 = {
  product: "EmeraldOS Gold",
  latestVersion: "T.U.2",
  folder: "Gold_T.U.2",
  entry: "OS.html",
  channel: "stable",
  status: "test",
  releaseTitle: "EmeraldOS Gold T.U.2 Shell Update Test",
  summary: "Loads from the updated folder while keeping the cloud VM profile.",
  setupMode: "continue",
  required: false,
  migrationFrom: ["T.U.1"]
};

function log(message){
  const stamp = new Date().toLocaleTimeString();
  const line = `[${stamp}] ${message}`;
  const el = $("shellLog");
  if(el){ el.textContent = `${line}\n${el.textContent || ""}`.slice(0, 6000); }
  console.log(line);
  try{
    const history = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
    history.unshift(line);
    localStorage.setItem(LOG_KEY, JSON.stringify(history.slice(0,80)));
  }catch{}
}

function setStatus(text){ $("shellStatus").textContent = text; }
function show(el){ el.classList.remove("hidden"); }
function hide(el){ el.classList.add("hidden"); }
function toast(text){
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = text;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

async function sha256(text){
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,"0")).join("");
}

function cleanUsername(username){
  return String(username || "").trim().replace(/\//g,"_");
}

async function loadFirebase(){
  try{
    fb = await import("./firebase.js");
    log("Firebase module loaded.");
    return true;
  }catch(err){
    fb = null;
    log(`Firebase unavailable: ${err.message}`);
    return false;
  }
}

function localUsers(){
  try{return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "{}");}catch{return {};}
}
function saveLocalUsers(users){ localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users)); }

async function findFirebaseUser(username){
  if(!fb) return null;
  const id = cleanUsername(username);
  try{
    const snap = await fb.getDoc(fb.doc(fb.db,"users",id));
    if(snap.exists()) return {id, ...snap.data()};
  }catch(err){ log(`Direct user lookup failed: ${err.message}`); }
  try{
    const list = await fb.getDocs(fb.collection(fb.db,"users"));
    let found = null;
    list.forEach(d => {
      const data = d.data();
      if(String(data.username || d.id).toLowerCase() === String(username).toLowerCase()){
        found = {id:d.id, ...data};
      }
    });
    return found;
  }catch(err){
    log(`User collection scan failed: ${err.message}`);
    return null;
  }
}

async function signIn(){
  const username = cleanUsername($("loginUsername").value);
  const password = $("loginPassword").value;
  if(!username || !password){ $("loginMessage").textContent = "Enter a username and password."; return; }
  $("loginMessage").textContent = "Checking account...";
  const hash = await sha256(password);
  let user = null;
  const firebaseUser = await findFirebaseUser(username);
  if(firebaseUser && String(firebaseUser.passwordHash || "") === hash){
    user = {
      username: firebaseUser.username || username,
      displayName: firebaseUser.displayName || firebaseUser.username || username,
      role: firebaseUser.role || "user",
      source: "firebase"
    };
  }
  if(!user){
    const users = localUsers();
    if(users[username] && users[username].passwordHash === hash){
      user = {username, displayName: users[username].displayName || username, role: users[username].role || "user", source:"local"};
    }
  }
  if(!user){
    $("loginMessage").textContent = "Login failed. Create an account or check the password.";
    return;
  }
  startSession(user);
}

async function register(){
  const username = cleanUsername($("regUsername").value);
  const displayName = $("regDisplay").value.trim() || username;
  const password = $("regPassword").value;
  if(!username || !password){ $("registerMessage").textContent = "Username and password are required."; return; }
  if(password.length < 4){ $("registerMessage").textContent = "Use at least 4 characters for testing."; return; }
  const hash = await sha256(password);
  const users = localUsers();
  users[username] = {username, displayName, role:"user", passwordHash:hash, createdAt:new Date().toISOString()};
  saveLocalUsers(users);
  if(fb){
    try{
      await fb.setDoc(fb.doc(fb.db,"users",username), {
        username, displayName, role:"user", locked:false, passwordHash:hash,
        created:new Date().toISOString(), createdBy:"EmeraldOS Gold Shell T.U."
      }, {merge:true});
      $("registerMessage").textContent = "Account created in Firebase and local fallback.";
    }catch(err){
      $("registerMessage").textContent = "Account saved locally. Firebase write was blocked by rules.";
      log(`Firebase registration write failed: ${err.message}`);
    }
  }else{
    $("registerMessage").textContent = "Account saved locally for testing.";
  }
  $("loginUsername").value = username;
  $("loginPassword").value = password;
  setTimeout(() => { hide($("registerPanel")); show($("loginPanel")); }, 900);
}

function localPreview(){
  startSession({username:"gold-preview", displayName:"Gold Preview", role:"user", source:"local"});
}

function startSession(user){
  currentUser = user;
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  localStorage.setItem("goldShellUsername", user.username);
  localStorage.setItem("username", user.username);
  localStorage.setItem("loggedIn", "true");
  $("signedInName").textContent = user.displayName || user.username;
  $("signedInRole").textContent = `${user.role || "user"} · ${user.source || "session"}`;
  $("userAvatar").textContent = (user.displayName || user.username || "G").charAt(0).toUpperCase();
  hide($("loginPanel")); hide($("registerPanel")); show($("launcherPanel"));
  setStatus("Signed in. Checking latest version...");
  log(`Signed in as ${user.username}.`);
  checkAndLoadLatest();
}

function restoreSession(){
  try{
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if(saved && saved.username){ startSession(saved); return true; }
  }catch{}
  return false;
}

function logout(){
  saveVmStateNow("logout");
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("username");
  currentUser = null;
  currentVmState = null;
  currentVersionConfig = null;
  $("goldFrame").removeAttribute("src");
  hide($("launcherPanel")); show($("loginPanel"));
  setStatus("Signed out.");
  toast("Signed out of EmeraldOS Gold Shell.");
}

async function readLatestFromFirebase(){
  if(!fb) return null;
  try{
    const snap = await fb.getDoc(fb.doc(fb.db,"system","emeraldGoldLatest"));
    if(snap.exists()) return normalizeVersionConfig(snap.data());
  }catch(err){ log(`Latest version Firebase read failed: ${err.message}`); }
  try{
    const snap = await fb.getDoc(fb.doc(fb.db,"system","emeraldGoldChannels_stable"));
    if(snap.exists()) return normalizeVersionConfig(snap.data());
  }catch(err){ log(`Stable channel read failed: ${err.message}`); }
  return null;
}

function normalizeVersionConfig(data){
  const folder = data.folder || data.path || "Gold_T.U.1";
  return {
    product: data.product || "EmeraldOS Gold",
    latestVersion: data.latestVersion || data.version || "T.U.1",
    folder,
    entry: data.entry || "OS.html",
    channel: data.channel || "stable",
    status: data.status || "test",
    releaseTitle: data.releaseTitle || data.title || `EmeraldOS Gold ${data.latestVersion || "T.U.1"}`,
    summary: data.summary || "Shell routed version.",
    setupMode: data.setupMode || "continue",
    required: !!data.required,
    migrationFrom: Array.isArray(data.migrationFrom) ? data.migrationFrom : []
  };
}

function fallbackLatest(){
  const override = localStorage.getItem(OVERRIDE_KEY);
  if(override === "T.U.2") return TU2;
  if(override === "T.U.1") return TU1;
  return TU1;
}

async function getLatestConfig(){
  const override = localStorage.getItem(OVERRIDE_KEY);
  if(override){
    log(`Using local test override ${override}.`);
    return fallbackLatest();
  }
  const cloudLatest = await readLatestFromFirebase();
  if(cloudLatest){
    log(`Firebase latest points to ${cloudLatest.latestVersion} (${cloudLatest.folder}).`);
    return cloudLatest;
  }
  log("Using local fallback latest T.U.1. Use seed-update.html to set Firebase latest to T.U.2.");
  return TU1;
}

async function readVmState(){
  const localKey = `emerald_gold_vm_${currentUser.username}`;
  let local = null;
  try{ local = JSON.parse(localStorage.getItem(localKey) || "null"); }catch{}
  if(fb && currentUser.source === "firebase"){
    try{
      const snap = await fb.getDoc(fb.doc(fb.db,"emeraldOSUsers",currentUser.username,"goldVM","current"));
      if(snap.exists()){
        const cloud = snap.data();
        log("Loaded cloud VM state.");
        return cloud;
      }
    }catch(err){ log(`Cloud VM read failed: ${err.message}`); }
  }
  if(local){ log("Loaded local VM state."); return local; }
  return {
    owner: currentUser.username,
    activeVersion: "none",
    createdAt: new Date().toISOString(),
    setup: {complete:false},
    preferences: {},
    files: [],
    notes: [],
    tickets: [],
    userApps: [],
    versionHistory: []
  };
}

async function saveVmStateNow(reason="manual"){
  if(!currentUser || !currentVmState) return;
  currentVmState.owner = currentUser.username;
  currentVmState.lastSavedAt = new Date().toISOString();
  currentVmState.lastSaveReason = reason;
  const localKey = `emerald_gold_vm_${currentUser.username}`;
  localStorage.setItem(localKey, JSON.stringify(currentVmState));
  if(fb && currentUser.source === "firebase"){
    try{
      await fb.setDoc(fb.doc(fb.db,"emeraldOSUsers",currentUser.username,"goldVM","current"), currentVmState, {merge:true});
      $("syncState").textContent = "Cloud saved";
      log(`Cloud VM saved (${reason}).`);
      return;
    }catch(err){
      log(`Cloud VM save failed: ${err.message}`);
    }
  }
  $("syncState").textContent = "Local saved";
  log(`Local VM saved (${reason}).`);
}

function scheduleSave(reason){
  clearTimeout(saveTimer);
  $("syncState").textContent = "Saving...";
  saveTimer = setTimeout(() => saveVmStateNow(reason), 500);
}

async function saveSnapshot(label="snapshot"){
  if(!currentUser || !currentVmState) return;
  const snapshot = {
    ...currentVmState,
    snapshotLabel: label,
    snapshotAt: new Date().toISOString()
  };
  const key = `emerald_gold_vm_snapshots_${currentUser.username}`;
  let arr = [];
  try{ arr = JSON.parse(localStorage.getItem(key) || "[]"); }catch{}
  arr.unshift(snapshot);
  localStorage.setItem(key, JSON.stringify(arr.slice(0,10)));
  if(fb && currentUser.source === "firebase"){
    try{
      const sid = `${Date.now()}_${String(label).replace(/[^a-z0-9_-]/gi,"_")}`;
      await fb.setDoc(fb.doc(fb.db,"emeraldOSUsers",currentUser.username,"goldVM","snapshots",sid), snapshot, {merge:true});
      log(`Cloud snapshot saved: ${label}.`);
    }catch(err){ log(`Cloud snapshot failed: ${err.message}`); }
  }
  toast("VM snapshot saved.");
}

function migrateStateToVersion(state, config){
  const previous = state.activeVersion || "none";
  if(previous === config.latestVersion) return state;
  const history = Array.isArray(state.versionHistory) ? state.versionHistory : [];
  history.unshift({
    from: previous,
    to: config.latestVersion,
    folder: config.folder,
    at: new Date().toISOString(),
    reason: "shell-version-router"
  });
  state.versionHistory = history.slice(0,25);
  state.previousVersion = previous;
  state.activeVersion = config.latestVersion;
  state.activeFolder = config.folder;
  state.updateIntroPending = previous !== "none";
  state.setup = state.setup || {complete:false};
  state.migrations = Array.isArray(state.migrations) ? state.migrations : [];
  state.migrations.unshift(`Migrated from ${previous} to ${config.latestVersion}`);
  return state;
}

async function checkAndLoadLatest(){
  if(!currentUser) return;
  const config = await getLatestConfig();
  const state = await readVmState();
  const previous = state.activeVersion || "none";
  if(previous !== "none" && previous !== config.latestVersion){
    await saveSnapshot(`before-${config.latestVersion}`);
  }
  currentVmState = migrateStateToVersion(state, config);
  currentVersionConfig = config;
  await saveVmStateNow("version-check");
  loadVersion(config);
}

function loadVersion(config){
  frameReady = false;
  const src = `${config.folder}/${config.entry}`;
  $("loadedVersion").textContent = `${config.releaseTitle} · ${config.latestVersion}`;
  $("loadedFolder").textContent = src;
  $("channelState").textContent = config.channel || "stable";
  $("goldFrame").src = src;
  setStatus(`Loading ${config.latestVersion} from ${config.folder}`);
  log(`Loading frame: ${src}.`);
}

function postVmStateToFrame(){
  const frame = $("goldFrame");
  if(frame && frame.contentWindow && currentVmState && currentVersionConfig){
    frame.contentWindow.postMessage({
      type:"gold-shell:vm-state",
      user: currentUser,
      version: currentVersionConfig,
      vmState: currentVmState
    }, "*");
    log("VM state sent to loaded version.");
  }
}

window.addEventListener("message", (event) => {
  const msg = event.data || {};
  if(!msg || typeof msg !== "object") return;
  if(msg.type === "gold-version:ready"){
    frameReady = true;
    log(`${msg.version || "Version"} reported ready.`);
    postVmStateToFrame();
  }
  if(msg.type === "gold-version:state"){
    currentVmState = {
      ...(currentVmState || {}),
      ...(msg.vmState || {}),
      activeVersion: currentVersionConfig?.latestVersion || msg.version || "unknown",
      activeFolder: currentVersionConfig?.folder || "unknown"
    };
    scheduleSave("version-state-update");
  }
  if(msg.type === "gold-version:notify"){
    toast(msg.message || "EmeraldOS Gold notification");
  }
  if(msg.type === "gold-version:request-update-check"){
    checkAndLoadLatest();
  }
  if(msg.type === "gold-version:logout"){
    logout();
  }
});

function bind(){
  $("showRegisterBtn").onclick = () => { hide($("loginPanel")); show($("registerPanel")); };
  $("backToLoginBtn").onclick = () => { hide($("registerPanel")); show($("loginPanel")); };
  $("loginBtn").onclick = signIn;
  $("registerBtn").onclick = register;
  $("localPreviewBtn").onclick = localPreview;
  $("logoutBtn").onclick = logout;
  $("checkUpdateBtn").onclick = checkAndLoadLatest;
  $("loadLatestBtn").onclick = checkAndLoadLatest;
  $("saveSnapshotBtn").onclick = () => saveSnapshot("manual");
  $("openSeederBtn").onclick = () => window.open("seed-update.html", "_blank");
  $("forceTu1Btn").onclick = () => { localStorage.setItem(OVERRIDE_KEY,"T.U.1"); checkAndLoadLatest(); };
  $("forceTu2Btn").onclick = () => { localStorage.setItem(OVERRIDE_KEY,"T.U.2"); checkAndLoadLatest(); };
  $("clearOverrideBtn").onclick = () => { localStorage.removeItem(OVERRIDE_KEY); checkAndLoadLatest(); };
  $("goldFrame").addEventListener("load", () => setTimeout(postVmStateToFrame, 200));
  document.addEventListener("keydown", (e) => {
    if(e.ctrlKey && e.altKey && e.key.toLowerCase() === "u") checkAndLoadLatest();
    if(e.ctrlKey && e.altKey && e.key.toLowerCase() === "s") saveSnapshot("shortcut");
  });
  ["loginPassword","loginUsername"].forEach(id => $(id).addEventListener("keydown", e => { if(e.key === "Enter") signIn(); }));
}

async function init(){
  bind();
  await loadFirebase();
  setStatus(fb ? "Firebase ready." : "Firebase unavailable; local fallback ready.");
  const oldLog = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
  if(oldLog.length && $("shellLog")) $("shellLog").textContent = oldLog.slice(0,20).join("\n");
  if(!restoreSession()){
    show($("loginPanel"));
    setStatus("Ready to sign in.");
  }
}

init();
