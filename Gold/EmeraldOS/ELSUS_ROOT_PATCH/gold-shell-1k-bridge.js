"use strict";

/* =========================================================
   EMERALDOS GOLD 1K — E.L.S.U.S. ROOT SHELL BRIDGE

   Add this script to the root E.L.S.U.S. gold-shell.html page.
   It does not publish or write system/emeraldGoldLatest.
========================================================= */
(function EmeraldGoldShell1KBridge(){
  if(window.__EMERALD_GOLD_SHELL_1K_BRIDGE__) return;
  window.__EMERALD_GOLD_SHELL_1K_BRIDGE__=true;

  const SHELL_VERSION="1.2";
  const SERVICE_PACK="E.L.S.U.S. Service Pack One";
  const SOURCE="emerald-gold-shell";
  const STATE_KEY="emeraldGoldShell_1k_bridge_state";
  const LATEST_KEY="emeraldGoldShell_latest";
  const ALLOWED_ENTRY=/^[a-z0-9._/-]+$/i;
  let childWindow=null;
  let childOrigin="*";
  let osFrame=null;

  const read=(key,fallback)=>{try{const raw=localStorage.getItem(key);return raw===null?fallback:JSON.parse(raw)}catch{return fallback}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}};
  const now=()=>new Date().toISOString();
  let state={connected:false,version:null,folder:null,entry:null,lastReady:null,lastHeartbeat:null,lastSave:null,lastVersionChange:null,...read(STATE_KEY,{})};

  function locateFrame(){
    return document.querySelector("iframe[data-elsus-os],#goldFrame,#osFrame,#versionFrame,#emeraldOSFrame,.gold-os-frame,iframe");
  }
  function saveState(){write(STATE_KEY,state);window.dispatchEvent(new CustomEvent("emeraldGoldShellState",{detail:{...state}}));}
  function post(type,payload={}){
    const target=childWindow||locateFrame()?.contentWindow;
    if(!target)return false;
    target.postMessage({source:SOURCE,type,payload,shellVersion:SHELL_VERSION,sentAt:now()},childOrigin||"*");
    return true;
  }
  function safeTarget(manifest={}){
    const folder=String(manifest.folder||"").trim();
    const entry=String(manifest.entry||"OS.html").trim();
    if(!folder||!ALLOWED_ENTRY.test(folder)||folder.includes(".."))throw new Error("The requested E.L.S.U.S. folder is invalid.");
    if(!entry||!ALLOWED_ENTRY.test(entry)||entry.includes(".."))throw new Error("The requested entry page is invalid.");
    return {folder,entry};
  }
  function buildSource(manifest,fromFolder=""){
    const {folder,entry}=safeTarget(manifest);
    const query=new URLSearchParams({goldShell:"1",elsus:"1",from:String(fromFolder||state.folder||"")});
    return `${folder}/${entry}?${query}`;
  }
  async function changeVersion(manifest,from={}){
    const frame=osFrame||locateFrame();
    if(!frame)throw new Error("No E.L.S.U.S. operating-system iframe was found.");
    post("elsus:save",{reason:"version-change",requestedAt:now()});
    await new Promise(resolve=>setTimeout(resolve,180));
    const src=buildSource(manifest,from.folder);
    state.lastVersionChange={at:now(),from,to:{version:manifest.latestVersion||manifest.build||null,folder:manifest.folder,entry:manifest.entry||"OS.html"}};
    state.connected=false;saveState();
    frame.src=src;
    return src;
  }
  function acknowledge(extra={}){
    const manifest=read(LATEST_KEY,null);return post("elsus:ack",{shellVersion:SHELL_VERSION,latestManifest:manifest,manifest,...extra});
  }

  window.addEventListener("message",async event=>{
    const message=event.data;
    if(!message||typeof message!=="object")return;
    const type=String(message.type||"").toLowerCase();
    const validSource=["emerald-gold-os","emeraldos-gold","elsus-os"].includes(message.source)||type.startsWith("elsus:");
    if(!validSource)return;
    childWindow=event.source;childOrigin=event.origin&&event.origin!=="null"?event.origin:"*";osFrame=locateFrame();
    const payload=message.payload||{};

    if(type==="elsus:ready"){
      state.connected=true;state.lastReady=now();state.version=payload.version||message.version||state.version;state.folder=payload.folder||message.folder||state.folder;state.entry=payload.entry||state.entry||"OS.html";saveState();
      acknowledge({servicePack:SERVICE_PACK,capabilities:["save","open-app","theme","staff-control","latest-manifest","active-update-notification","version-change","logout","navigate"]});
      return;
    }
    if(type==="elsus:heartbeat"){
      state.connected=true;state.lastHeartbeat=now();state.heartbeat=payload;saveState();post("elsus:pong",{receivedAt:now()});return;
    }
    if(type==="elsus:save-request"){
      post("elsus:save",{reason:"shell-request",requestedAt:now()});return;
    }
    if(type==="elsus:save-complete"){
      state.lastSave=payload.savedAt||now();saveState();return;
    }
    if(type==="elsus:latest-manifest"&&payload.manifest){
      write(LATEST_KEY,payload.manifest);state.latestManifest=payload.manifest;saveState();return;
    }
    if(type==="elsus:session"){
      state.session=payload;saveState();return;
    }
    if(type==="elsus:staff-control-applied"){
      state.liveControl=payload.control||null;saveState();return;
    }
    if(type==="elsus:request-version-change"){
      try{
        const src=await changeVersion(payload.manifest||{},payload.from||{});
        post("elsus:version-change-accepted",{src,acceptedAt:now()});
      }catch(error){post("elsus:version-change-rejected",{message:error.message,rejectedAt:now()});}
    }
  });

  osFrame=locateFrame();
  window.EmeraldGoldShell1K={
    version:SHELL_VERSION,
    state:()=>({...state}),
    acknowledge,
    save:()=>post("elsus:save",{reason:"manual",requestedAt:now()}),
    openApp:id=>post("elsus:open-app",{id:String(id)}),
    setTheme:theme=>post("elsus:theme",{theme:String(theme)}),
    applyStaffControl:control=>post("elsus:staff-control",{control}),
    deliverLatestManifest:manifest=>{write(LATEST_KEY,manifest);return post("elsus:latest-manifest",{manifest});},
    navigate:hash=>post("elsus:navigate",{hash:String(hash)}),
    logout:()=>post("elsus:logout",{}),
    changeVersion
  };
})();
