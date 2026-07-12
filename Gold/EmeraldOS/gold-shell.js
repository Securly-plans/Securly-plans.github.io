"use strict";
/* EmeraldOS Gold Shell 4.0
   Purpose: invisible update router.
   It checks Firebase for the latest approved build, but it does NOT force each user
   to update. Each user keeps an active version until they accept an update in
   System Update inside EmeraldOS Gold. */

const SHELL_VERSION = "4.0";
const DEFAULT_LATEST = {
  product: "EmeraldOS Gold",
  latestVersion: "10.0",
  build: "10.0",
  folder: "Gold_10.0",
  entry: "OS.html",
  channel: "stable",
  status: "stable",
  required: false,
  enabled: true,
  setupMode: "continue",
  releaseTitle: "EmeraldOS Gold 10.0",
  summary: "Manual user-controlled update architecture. The shell reads the latest build from Firebase, but users choose when to switch their VM to it.",
  migrationFrom: ["8.0", "8.0.1", "9.0"],
  migrationId: "gold8-gold9-to-gold10-manual-update",
  minShellVersion: "4.0",
  rollbackFolder: "Gold_9.0",
  rollbackVersion: "9.0",
  releasedAt: "2026-07-12T00:00:00.000Z"
};

let fb = null;
const $ = id => document.getElementById(id);
const now = () => new Date().toISOString();

function setStatus(message){ const n=$("bootStatus"); if(n) n.textContent = message; }
function showFallback(){ const c=document.querySelector('.boot-card'); if(c) c.hidden=false; }
function readJSON(key, fallback){ try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback));}catch{return fallback;} }
function writeJSON(key, value){ localStorage.setItem(key, JSON.stringify(value)); return value; }
function username(){ return localStorage.getItem('username') || localStorage.getItem('gold100_username') || localStorage.getItem('gold80_username') || ''; }
function safeFolder(folder){ folder=String(folder||DEFAULT_LATEST.folder); return /^[A-Za-z0-9_.-]+$/.test(folder) ? folder : DEFAULT_LATEST.folder; }
function safeEntry(entry){ entry=String(entry||'OS.html'); return /^[A-Za-z0-9_.-]+\.html$/.test(entry) ? entry : 'OS.html'; }
function manifestFromStored(folder, version, entry='OS.html'){
  return {...DEFAULT_LATEST, latestVersion: version || folder?.replace(/^Gold_/, '') || DEFAULT_LATEST.latestVersion, build: version || folder?.replace(/^Gold_/, '') || DEFAULT_LATEST.build, folder: folder || DEFAULT_LATEST.folder, entry};
}
function targetUrl(manifest){
  const url = new URL(`./${safeFolder(manifest.folder)}/${safeEntry(manifest.entry)}`, location.href);
  url.searchParams.set('goldShell', '1');
  url.searchParams.set('runningVersion', manifest.latestVersion || manifest.build || '10.0');
  url.searchParams.set('shell', SHELL_VERSION);
  return url.href;
}
async function loadFirebase(){
  try{ fb = await import('./firebase.js'); return fb; }
  catch(error){ console.warn('EmeraldOS Gold shell Firebase unavailable', error); return null; }
}
async function readLatest(){
  const firebase = fb || await loadFirebase();
  if(!firebase) return {...DEFAULT_LATEST, firebaseUnavailable: true};
  try{
    const snap = await firebase.getDoc(firebase.doc(firebase.db, 'system', 'emeraldGoldLatest'));
    const latest = snap.exists() ? {...DEFAULT_LATEST, ...snap.data()} : {...DEFAULT_LATEST};
    if(latest.enabled === false) throw new Error('The latest EmeraldOS Gold build is disabled.');
    writeJSON('emeraldGoldShell_latest', latest);
    return latest;
  }catch(error){
    console.warn('Could not read system/emeraldGoldLatest', error);
    const cached = readJSON('emeraldGoldShell_latest', null);
    return cached ? {...DEFAULT_LATEST, ...cached, firebaseReadFailed: true} : {...DEFAULT_LATEST, firebaseReadFailed: true, errorMessage: error.message};
  }
}
async function cloudGetCurrent(user){
  if(!fb || !user) return null;
  try{
    const snap = await fb.getDoc(fb.doc(fb.db, 'emeraldOSUsers', user, 'goldVM', 'current'));
    return snap.exists() ? snap.data() : null;
  }catch(error){ console.warn('Could not read user active Gold VM version', error); return null; }
}
async function cloudSetCurrent(user, data){
  if(!fb || !user) return false;
  try{ await fb.setDoc(fb.doc(fb.db, 'emeraldOSUsers', user, 'goldVM', 'current'), data, {merge:true}); return true; }
  catch(error){ console.warn('Could not write user Gold VM version', error); return false; }
}
async function cloudAddSnapshot(user, snapshot){
  if(!fb || !user) return false;
  try{ await fb.setDoc(fb.doc(fb.db, 'emeraldOSUsers', user, 'goldVMSnapshots', `snapshot_${Date.now()}`), snapshot); return true; }
  catch(error){ console.warn('Could not write Gold VM snapshot', error); return false; }
}
async function cloudAddHistory(user, history){
  if(!fb || !user) return false;
  try{ await fb.setDoc(fb.doc(fb.db, 'emeraldOSUsers', user, 'goldVMUpdateHistory', `update_${Date.now()}`), history); return true; }
  catch(error){ console.warn('Could not write Gold update history', error); return false; }
}
function createSnapshot(reason, fromManifest, toManifest){
  const snapshot = {product:'EmeraldOS Gold', reason, time:now(), shellVersion:SHELL_VERSION, user:username(), from:fromManifest||null, to:toManifest||null, storage:{}};
  for(let i=0;i<localStorage.length;i++){
    const key = localStorage.key(i);
    if(key && /^(gold|emeraldGoldShell_|emeraldOS|loggedIn|username|role|Emerald)/.test(key)) snapshot.storage[key] = localStorage.getItem(key);
  }
  writeJSON('emeraldGoldShell_lastSnapshot', snapshot);
  return snapshot;
}
function getLocalActive(){
  const manifest = readJSON('emeraldGoldShell_activeManifest', null);
  if(manifest && manifest.folder) return {...DEFAULT_LATEST, ...manifest};
  const folder = localStorage.getItem('emeraldGoldShell_activeFolder');
  const version = localStorage.getItem('emeraldGoldShell_activeVersion');
  const entry = localStorage.getItem('emeraldGoldShell_activeEntry') || 'OS.html';
  if(folder) return manifestFromStored(folder, version, entry);
  return null;
}
function saveActive(manifest){
  const active = {...DEFAULT_LATEST, ...manifest, folder:safeFolder(manifest.folder), entry:safeEntry(manifest.entry)};
  writeJSON('emeraldGoldShell_activeManifest', active);
  localStorage.setItem('emeraldGoldShell_activeVersion', active.latestVersion || active.build || '');
  localStorage.setItem('emeraldGoldShell_activeFolder', active.folder);
  localStorage.setItem('emeraldGoldShell_activeEntry', active.entry);
  localStorage.setItem('emeraldGoldShell_lastBoot', now());
  return active;
}
async function decideActive(latest){
  const params = new URLSearchParams(location.search);
  const applyRequested = params.get('applyUpdate') === '1' || localStorage.getItem('emeraldGoldShell_applyUpdate') === 'true';
  const forceLatest = params.get('forceLatest') === '1';
  const user = username();
  let active = getLocalActive();

  const cloudCurrent = await cloudGetCurrent(user);
  if(!active && cloudCurrent?.activeFolder){
    active = manifestFromStored(cloudCurrent.activeFolder, cloudCurrent.activeVersion || cloudCurrent.version, cloudCurrent.entry || 'OS.html');
  }

  if(!active) active = {...latest};

  const latestVersion = latest.latestVersion || latest.build || '';
  const activeVersion = active.latestVersion || active.build || '';
  const updateAvailable = safeFolder(latest.folder) !== safeFolder(active.folder) || latestVersion !== activeVersion;
  writeJSON('emeraldGold_updateAvailable', {available:updateAvailable, latest, active, checkedAt:now()});

  if((applyRequested || forceLatest || latest.required === true) && updateAvailable){
    const from = active;
    const to = latest;
    setStatus(`Applying EmeraldOS Gold ${latestVersion} for this user...`);
    const snapshot = createSnapshot('before-manual-user-update', from, to);
    localStorage.removeItem('emeraldGoldShell_applyUpdate');
    active = saveActive(to);
    await cloudAddSnapshot(user, snapshot);
    await cloudAddHistory(user, {from:from.latestVersion||from.build||'', fromFolder:from.folder||'', to:to.latestVersion||to.build||'', toFolder:to.folder||'', manual:true, required:!!latest.required, date:now(), successful:true});
    await cloudSetCurrent(user, {activeVersion:active.latestVersion||active.build||'', activeFolder:active.folder, entry:active.entry, channel:active.channel||'stable', lastManualUpdate:now(), lastShellVersion:SHELL_VERSION, cloudSync:true});
    writeJSON('emeraldGold_updateNotice', {from:from.latestVersion||from.build||'', to:active.latestVersion||active.build||'', title:active.releaseTitle||`EmeraldOS Gold ${active.latestVersion||active.build}`, summary:active.summary||'Update applied.', time:now()});
    return active;
  }

  active = saveActive(active);
  await cloudSetCurrent(user, {activeVersion:active.latestVersion||active.build||'', activeFolder:active.folder, entry:active.entry, channel:active.channel||'stable', latestKnownVersion:latestVersion, latestKnownFolder:safeFolder(latest.folder), updateAvailable, lastShellBoot:now(), lastShellVersion:SHELL_VERSION, cloudSync:true});
  return active;
}
async function boot(){
  try{
    setStatus('Checking EmeraldOS Gold update pointer...');
    const latest = await readLatest();
    setStatus('Checking your selected EmeraldOS Gold version...');
    const active = await decideActive(latest);
    setStatus(`Starting ${active.releaseTitle || active.latestVersion || active.build || 'EmeraldOS Gold'}...`);
    setTimeout(()=>location.replace(targetUrl(active)), 120);
  }catch(error){
    console.error(error);
    showFallback();
    setStatus('The EmeraldOS Gold update router could not continue.');
    const f=$("bootFallback"); if(f) f.hidden=false;
  }
}
window.addEventListener('DOMContentLoaded',()=>{
  $("bootFallbackBtn")?.addEventListener('click',()=>location.href=targetUrl(getLocalActive() || DEFAULT_LATEST));
  $("bootLatestBtn")?.addEventListener('click',()=>{localStorage.setItem('emeraldGoldShell_applyUpdate','true');location.href='gold-shell.html?applyUpdate=1';});
  $("retryBtn")?.addEventListener('click',()=>location.reload());
  setTimeout(showFallback, 1800);
  boot();
});
