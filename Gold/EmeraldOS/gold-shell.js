"use strict";
const SHELL_VERSION="1.0";
const DEFAULT_LATEST={product:"EmeraldOS Gold",latestVersion:"9.0",build:"9.0",folder:"Gold_9.0",entry:"OS.html",channel:"stable",status:"stable",required:false,enabled:true,setupMode:"continue",releaseTitle:"EmeraldOS Gold 9.0 Shell Update",summary:"Shell-managed EmeraldOS Gold update test built from Gold 8.0.",migrationFrom:["8.0","8.0.1"],migrationId:"gold8-to-gold9-shell",minShellVersion:"1.0",rollbackFolder:"Gold_9.0",rollbackVersion:"9.0",releasedAt:new Date().toISOString()};
let fb=null;let latest={...DEFAULT_LATEST};let currentFrameUrl="";
const $=id=>document.getElementById(id);
function status(msg,kind="good"){const s=$("shellStatus");if(s){s.textContent=msg;s.className="shell-status "+kind;}}
function safeFolder(folder){folder=String(folder||"");return /^[A-Za-z0-9_.-]+$/.test(folder)?folder:DEFAULT_LATEST.folder;}
function safeEntry(entry){entry=String(entry||"OS.html");return /^[A-Za-z0-9_.-]+\.html$/.test(entry)?entry:"OS.html";}
function username(){return localStorage.getItem("username")||localStorage.getItem("gold90_username")||localStorage.getItem("gold80_username")||"GoldUser";}
function read(k,f){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f));}catch{return f}}
function write(k,v){localStorage.setItem(k,JSON.stringify(v));return v}
async function initFirebase(){try{fb=await import("./firebase.js");return fb}catch(e){console.warn("Gold Shell Firebase unavailable",e);status("Firebase unavailable. Booting bundled Gold_9.0 fallback.","warn");return null}}
async function readLatest(){
  const f=fb||await initFirebase();
  if(!f){latest={...DEFAULT_LATEST};return latest;}
  try{
    const snap=await f.getDoc(f.doc(f.db,"system","emeraldGoldLatest"));
    latest=snap.exists()?{...DEFAULT_LATEST,...snap.data()}:{...DEFAULT_LATEST};
    if(latest.enabled===false){throw new Error("Latest version is disabled in Firebase.");}
    write("emeraldGoldShell_latest",latest);
    return latest;
  }catch(e){console.warn(e);latest={...DEFAULT_LATEST};status("Could not read system/emeraldGoldLatest. Booting bundled Gold_9.0 fallback.","warn");return latest;}
}
function bootUrl(manifest=latest){return `./${safeFolder(manifest.folder)}/${safeEntry(manifest.entry)}`;}
function frame(){return $("goldFrame");}
function localSnapshot(reason="manual"){
  const snapshot={reason,time:new Date().toISOString(),shellVersion:SHELL_VERSION,activeVersion:localStorage.getItem("emeraldGoldShell_activeVersion")||"",activeFolder:localStorage.getItem("emeraldGoldShell_activeFolder")||"",targetVersion:latest.latestVersion,targetFolder:latest.folder,username:username(),localStorage:{}};
  for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&(/^(gold80_|gold90_|emeraldGoldShell_|loggedIn|username|role)/).test(k)){snapshot.localStorage[k]=localStorage.getItem(k);}}
  localStorage.setItem("emeraldGoldShell_lastSnapshot",JSON.stringify(snapshot));
  return snapshot;
}
async function cloudWrite(pathSegments,data){if(!fb)return false;try{await fb.setDoc(fb.doc(fb.db,...pathSegments),data);return true}catch(e){console.warn("Cloud write failed",pathSegments,e);return false}}
async function migrateIfNeeded(manifest){
  const oldVersion=localStorage.getItem("emeraldGoldShell_activeVersion")||"";
  const oldFolder=localStorage.getItem("emeraldGoldShell_activeFolder")||"";
  if(oldVersion&&oldVersion===manifest.latestVersion&&oldFolder===manifest.folder)return;
  const snap=localSnapshot("before-update");
  const user=username();
  if(fb&&user){
    const id="update_"+Date.now();
    await cloudWrite(["emeraldOSUsers",user,"goldVM","current"],{activeVersion:manifest.latestVersion,activeFolder:manifest.folder,entry:manifest.entry,channel:manifest.channel||"stable",lastBoot:new Date().toISOString(),lastShellVersion:SHELL_VERSION,cloudSync:true});
    await cloudWrite(["emeraldOSUsers",user,"goldVMUpdateHistory",id],{from:oldVersion||"first-shell-boot",fromFolder:oldFolder,to:manifest.latestVersion,toFolder:manifest.folder,date:new Date().toISOString(),migrationId:manifest.migrationId||"",successful:true});
    await cloudWrite(["emeraldOSUsers",user,"goldVMSnapshots","snapshot_"+Date.now()],snap);
  }
  localStorage.setItem("emeraldGoldShell_activeVersion",manifest.latestVersion||"");
  localStorage.setItem("emeraldGoldShell_activeFolder",manifest.folder||"");
}
async function bootLatest(showDialog=false){
  const manifest=await readLatest();
  await migrateIfNeeded(manifest);
  currentFrameUrl=bootUrl(manifest);
  frame().src=currentFrameUrl;
  $("shellVersion").textContent=`Shell ${SHELL_VERSION} · ${manifest.latestVersion} · ${manifest.folder}`;
  status(`Booting ${manifest.releaseTitle||manifest.latestVersion} from ${manifest.folder}/${manifest.entry}`,"good");
  frame().addEventListener("load",()=>{try{frame().contentWindow.postMessage({type:"emeraldos-gold-latest",latest:manifest},"*")}catch{}},{once:true});
  if(showDialog)showUpdateDialog(manifest);
}
function showUpdateDialog(manifest){const d=$("updateDialog");if(!d)return;$("updateTitle").textContent=manifest.releaseTitle||"EmeraldOS Gold update";$("updateBody").textContent=manifest.summary||`Latest version: ${manifest.latestVersion}`;d.showModal();}
async function checkForUpdates(){
  const before=localStorage.getItem("emeraldGoldShell_activeVersion")||"";
  const manifest=await readLatest();
  if(before&&before!==manifest.latestVersion){status(`Update available: ${before} → ${manifest.latestVersion}.`,"warn");showUpdateDialog(manifest);}
  else status(`You are on the latest configured build: ${manifest.latestVersion}.`,"good");
  try{frame().contentWindow.postMessage({type:"emeraldos-gold-latest",latest:manifest},"*")}catch{}
}
function bootRollback(){const rb={...latest,folder:latest.rollbackFolder||"Gold_9.0",latestVersion:latest.rollbackVersion||"9.0",entry:latest.entry||"OS.html",releaseTitle:"Rollback boot"};frame().src=bootUrl(rb);status(`Rollback boot: ${rb.folder}/${rb.entry}`,'warn');}
window.addEventListener("message",async ev=>{
  const d=ev.data||{};
  if(d.type==="emeraldos-gold-live-state"){
    localStorage.setItem("emeraldGoldShell_liveState",JSON.stringify(d.state||{}));
    if(fb&&d.state&&d.state.user){await cloudWrite(["emeraldOSUsers",d.state.user,"goldVM","liveState"],{...d.state,receivedAt:new Date().toISOString()});}
  }
  if(d.type==="emeraldos-gold-check-update"){await checkForUpdates();}
});
window.addEventListener("DOMContentLoaded",async()=>{
  $("checkUpdateBtn").onclick=checkForUpdates;
  $("bootLatestBtn").onclick=()=>bootLatest(false);
  $("rollbackBtn").onclick=bootRollback;
  $("applyUpdateDialogBtn").onclick=()=>setTimeout(()=>bootLatest(false),60);
  await initFirebase();
  await bootLatest(false);
  if(fb?.onSnapshot){try{fb.onSnapshot(fb.doc(fb.db,"system","emeraldGoldLatest"),snap=>{if(snap.exists()){const incoming={...DEFAULT_LATEST,...snap.data()};const old=latest.latestVersion;latest=incoming;write("emeraldGoldShell_latest",latest);try{frame().contentWindow.postMessage({type:"emeraldos-gold-latest",latest},"*")}catch{};if(old&&old!==incoming.latestVersion){status(`Firebase update pointer changed: ${old} → ${incoming.latestVersion}. Click Boot latest to update.`,"warn");}}});}catch(e){console.warn(e)}}
});
