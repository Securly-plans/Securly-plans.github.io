"use strict";

/* =========================================================
   EmeraldOS Gold 1V
   Quiet startup, cloud workspace resume, and UI polish.
========================================================= */
(function EmeraldOSGold1VPolish(){
  if(window.__EMERALDOS_GOLD_1V_POLISH__)return;
  window.__EMERALDOS_GOLD_1V_POLISH__=true;

  const VERSION="1V",PREFIX="gold1g_";
  const SESSION_KEY=PREFIX+"session_state_1v";
  const NOTIFICATION_PREFS_KEY=PREFIX+"notification_preferences_1v";
  const UNSAFE_RESTORE_APPS=new Set(["publisher","updatepublisher","livecontrol","staffcenter","appverification","compose","run","power","setup","shellv2test"]);
  const $=id=>document.getElementById(id);
  const qa=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const now=()=>new Date().toISOString();
  const read=(key,fallback)=>{try{const raw=localStorage.getItem(key);return raw===null?fallback:JSON.parse(raw)}catch{return fallback}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch(error){console.warn("Gold 1V continuity cache write failed",key,error);return false}};
  const api=()=>window.Gold50||window.Gold1V;
  const esc=value=>String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));

  function notificationPreferences(){
    return {...{quietStartup:true,startupQuietSeconds:18,showStartupSummary:true,updatePromptOnly:true,deduplicateSeconds:30},...read(NOTIFICATION_PREFS_KEY,{})};
  }
  function setNotificationPreferences(next){
    if(api()?.setNotificationPrefs)return api().setNotificationPrefs(next);
    const value={...notificationPreferences(),...next};write(NOTIFICATION_PREFS_KEY,value);return value;
  }

  function inferAppId(win){
    if(win?.dataset?.app)return win.dataset.app;
    let id=String(win?.id||"").replace(/^win_g1h_/,"").replace(/^win_/,"");
    if(id.startsWith("file_"))return "explorer";
    if(id.startsWith("userapp_"))return id;
    const known=api()?.APPS||[];
    const title=String(win?.dataset?.title||win?.title||"").toLowerCase();
    const titleMatch=known.find(app=>String(app.name||"").toLowerCase()===title);
    if(titleMatch)return titleMatch.id;
    return id.split("_")[0]||"";
  }

  function captureSessionState(){
    const windows=qa(".window").filter(win=>win.isConnected).map(win=>({
      id:win.id,
      app:inferAppId(win),
      title:win.dataset.title||win.querySelector(".title")?.textContent||"",
      left:win.style.left,top:win.style.top,width:win.style.width,height:win.style.height,
      minimized:win.classList.contains("minimized"),
      maximized:win.classList.contains("max")||win.classList.contains("gold1p-maximized"),
      active:win.classList.contains("active-window")
    })).slice(0,40);
    const openApps=[...new Set(windows.map(item=>item.app).filter(Boolean))];
    const active=windows.find(item=>item.active)||windows.at(-1)||null;
    const state={
      version:VERSION,
      updatedAt:now(),
      openApps,
      activeApp:active?.app||null,
      windows,
      virtualDesktop:read(PREFIX+"virtual_desktop_1v",read(PREFIX+"virtual_desktop_1o",1)),
      shellManaged:Boolean(window.EMERALDOS_GOLD_SHELL_MANAGED),
      cleanShutdown:false
    };
    write(SESSION_KEY,state);
    return state;
  }

  function markCleanShutdown(){
    const state=captureSessionState();state.cleanShutdown=true;state.updatedAt=now();write(SESSION_KEY,state);
  }

  function previousSessionState(){
    const direct=read(SESSION_KEY,null)||read(PREFIX+"session_state_1o",null);
    if(direct)return direct;
    const meta=read(PREFIX+"workspace_meta_1o",null)||read(PREFIX+"workspace_meta_1v",null);
    return meta?.openWindows?{version:meta.version||"1O",updatedAt:meta.savedAt||now(),windows:meta.openWindows,openApps:[]}:null;
  }

  function appFromWindowState(item){
    if(item.app)return item.app;
    const id=String(item.id||"").replace(/^win_g1h_/,"").replace(/^win_/,"");
    if(id.startsWith("file_"))return "explorer";
    const apps=api()?.APPS||[];
    const title=String(item.title||"").toLowerCase();
    return apps.find(app=>String(app.name||"").toLowerCase()===title)?.id||id.split("_")[0];
  }

  function safeRestoreApps(state){
    const fromWindows=(state?.windows||state?.openWindows||[]).map(appFromWindowState);
    return [...new Set([...(state?.openApps||[]),...fromWindows])]
      .filter(id=>id&&!UNSAFE_RESTORE_APPS.has(id)&&!String(id).startsWith("userapp_")&&api()?.APPS?.some(app=>app.id===id))
      .slice(0,8);
  }

  function applyWindowState(state){
    const saved=state?.windows||state?.openWindows||[];
    saved.forEach(item=>{
      const app=appFromWindowState(item);
      const win=qa(".window").find(candidate=>inferAppId(candidate)===app||candidate.id===item.id);
      if(!win)return;
      const numeric=(value,min,max)=>{const n=parseFloat(value);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):null};
      const width=numeric(item.width,360,innerWidth-8),height=numeric(item.height,240,innerHeight-48);
      const left=numeric(item.left,0,Math.max(0,innerWidth-(width||win.offsetWidth))),top=numeric(item.top,0,Math.max(0,innerHeight-48-(height||win.offsetHeight)));
      if(width!==null)win.style.width=width+"px";
      if(height!==null)win.style.height=height+"px";
      if(left!==null)win.style.left=left+"px";
      if(top!==null)win.style.top=top+"px";
      if(item.minimized&&api()?.prefs?.().restoreMinimizedWindows===true)win.classList.add("minimized");
    });
    const active=state?.activeApp;
    if(active){const win=qa(".window").find(candidate=>inferAppId(candidate)===active);win?.dispatchEvent(new MouseEvent("mousedown",{bubbles:true}))}
  }

  async function waitForMigration(){
    const started=Date.now(),maximumWait=Math.max(5,Math.min(60,Number(notificationPreferences().startupQuietSeconds)||18))*1000;
    while(window.__GOLD1V_MIGRATION_BLOCK_SAVES__===true&&Date.now()-started<maximumWait)await new Promise(resolve=>setTimeout(resolve,300));
  }

  async function restorePreviousWorkspace(){
    if(sessionStorage.getItem("gold1p_workspace_restore_attempted")==="true")return 0;
    sessionStorage.setItem("gold1p_workspace_restore_attempted","true");
    await waitForMigration();
    if(api()?.prefs?.().resumeWorkspace===false)return 0;
    if($("setupWizard")&&!$("setupWizard").classList.contains("hidden"))return 0;
    if($("gold1pUpdateSetup"))return 0;
    const state=previousSessionState();if(!state)return 0;
    const apps=safeRestoreApps(state);
    for(const id of apps){
      if(qa(".window").some(win=>inferAppId(win)===id))continue;
      try{api()?.openApp?.(id)}catch(error){console.debug("Gold 1V skipped workspace app",id,error?.message)}
      await new Promise(resolve=>setTimeout(resolve,75));
    }
    await new Promise(resolve=>setTimeout(resolve,350));
    applyWindowState(state);
    return apps.length;
  }

  function ensureDimmer(){
    let dimmer=$("gold1pDisplayDimmer");
    if(!dimmer){dimmer=document.createElement("div");dimmer.id="gold1pDisplayDimmer";dimmer.className="gold1p-display-dimmer";dimmer.setAttribute("aria-hidden","true");document.body.appendChild(dimmer)}
    return dimmer;
  }
  function applyDevicePreferences(){
    const prefs=api()?.prefs?.()||{};
    const brightness=Math.max(35,Math.min(100,Number(prefs.displayBrightness)||100));
    ensureDimmer().style.opacity=String((100-brightness)/100*.72);
    const volume=Math.max(0,Math.min(100,Number(prefs.systemVolume??80)))/100;
    document.querySelectorAll("audio,video").forEach(media=>{if(!media.dataset.gold1pVolumeApplied){media.volume=volume;media.dataset.gold1pVolumeApplied="true"}});
  }

  function openStartupContinuity(){
    const core=api();if(!core?.openWindow)return null;
    const n=notificationPreferences(),p=core.prefs?.()||{},state=previousSessionState();
    const html=`<div class="app-shell gold1p-continuity-settings"><div class="app-toolbar"><button id="continuitySave" class="button primary">Save workspace now</button><button id="continuityClear" class="button">Clear saved window layout</button></div><div class="app-body"><div class="gold1p-page-title"><div><h1>Startup &amp; Continuity</h1><p>Control quiet startup and the cloud-based pick-up-where-you-left-off experience.</p></div><span class="gold1p-status-chip good">Cloud VM</span></div><section class="card"><h2>Workspace resume</h2><div class="setting-row"><span><b>Resume my workspace</b><small>Reopen safe applications and restore window positions after the VM has migrated.</small></span><input id="continuityResume" type="checkbox" ${p.resumeWorkspace!==false?"checked":""}></div><div class="setting-row"><span><b>Restore minimized windows</b><small>Otherwise restored applications open normally so they are easy to find.</small></span><input id="continuityMinimized" type="checkbox" ${p.restoreMinimizedWindows===true?"checked":""}></div><p class="muted">Last saved workspace: ${state?.updatedAt?new Date(state.updatedAt).toLocaleString():"No saved layout"}</p></section><section class="card"><h2>Notification calm mode</h2><div class="setting-row"><span><b>Quiet startup</b><small>Store startup events in Action Center without showing repeated banners.</small></span><input id="continuityQuiet" type="checkbox" ${n.quietStartup!==false?"checked":""}></div><div class="setting-row"><span><b>One startup summary</b><small>Show one combined banner after restoration finishes.</small></span><input id="continuitySummary" type="checkbox" ${n.showStartupSummary!==false?"checked":""}></div><div class="setting-row"><span><b>Update prompt only</b><small>Do not show a second toast when the update dialog is already visible.</small></span><input id="continuityUpdateOnly" type="checkbox" ${n.updatePromptOnly!==false?"checked":""}></div><div class="setting-row"><span><b>Quiet-start period</b><small>How long noncritical startup banners remain quiet.</small></span><select id="continuityQuietSeconds"><option value="10" ${n.startupQuietSeconds===10?"selected":""}>10 seconds</option><option value="18" ${n.startupQuietSeconds===18?"selected":""}>18 seconds</option><option value="30" ${n.startupQuietSeconds===30?"selected":""}>30 seconds</option></select></div></section><section class="card"><h2>Continuity safeguards</h2><p>Gold 1V saves this session as a normal VM category. Migration remains blocked from cloud autosave until previous files, settings, preferences, Registry data, mail, apps, and session state are validated.</p></section></div></div>`;
    const win=core.openWindow("continuitysettings","Startup & Continuity",html,{width:900,height:690});
    const save=()=>{
      core.setPrefs?.({resumeWorkspace:win.querySelector("#continuityResume").checked,restoreMinimizedWindows:win.querySelector("#continuityMinimized").checked});
      setNotificationPreferences({quietStartup:win.querySelector("#continuityQuiet").checked,showStartupSummary:win.querySelector("#continuitySummary").checked,updatePromptOnly:win.querySelector("#continuityUpdateOnly").checked,startupQuietSeconds:Number(win.querySelector("#continuityQuietSeconds").value)});
      captureSessionState();
    };
    ["#continuityResume","#continuityMinimized","#continuityQuiet","#continuitySummary","#continuityUpdateOnly","#continuityQuietSeconds"].forEach(selector=>win.querySelector(selector)?.addEventListener("change",save));
    win.querySelector("#continuitySave").onclick=async()=>{save();await window.Gold1V?.saveWorkspaceNow?.(true)};
    win.querySelector("#continuityClear").onclick=()=>{if(confirm("Clear only the saved window layout? Files and application data will not be removed.")){localStorage.removeItem(SESSION_KEY);win.querySelector(".muted").textContent="Last saved workspace: Cleared"}};
    return win;
  }

  function registerApp(){
    const core=api();if(!core?.APPS)return false;
    if(!core.APPS.some(app=>app.id==="continuitysettings"))core.APPS.push({id:"continuitysettings",name:"Startup & Continuity",label:"SC",color:"#0078d7",group:"System",desc:"Quiet startup and cloud workspace resume preferences.",open:openStartupContinuity});
    core.renderStartMenu?.();core.renderDesktop?.();return true;
  }

  function patchAPI(){
    const core=api();if(!core||core.__gold1pPolishPatched)return false;
    core.__gold1pPolishPatched=true;
    const originalSetPrefs=core.setPrefs?.bind(core);
    if(originalSetPrefs)core.setPrefs=next=>{const value=originalSetPrefs(next);applyDevicePreferences();return value};
    const originalSave=window.Gold1V?.saveWorkspaceNow?.bind(window.Gold1V);
    if(originalSave&&!window.Gold1V.__gold1pSessionSavePatched){window.Gold1V.__gold1pSessionSavePatched=true;window.Gold1V.saveWorkspaceNow=async show=>{captureSessionState();return originalSave(show)}}
    Object.assign(window.Gold1V||core,{openStartupContinuity,captureSessionState,restorePreviousWorkspace,notificationPreferences,setNotificationPreferences});
    window.Gold50=core;return true;
  }

  function clampWindows(){
    qa(".window").forEach(win=>{
      const maxWidth=Math.max(360,innerWidth-8),maxHeight=Math.max(240,innerHeight-48);
      if(win.offsetWidth>maxWidth)win.style.width=maxWidth+"px";
      if(win.offsetHeight>maxHeight)win.style.height=maxHeight+"px";
      const left=Math.max(0,Math.min(parseFloat(win.style.left)||0,innerWidth-win.offsetWidth));
      const top=Math.max(0,Math.min(parseFloat(win.style.top)||0,innerHeight-48-win.offsetHeight));
      win.style.left=left+"px";win.style.top=top+"px";
    });
  }

  async function finishStartup(){
    const restored=await restorePreviousWorkspace();
    sessionStorage.setItem("gold1p_startup_notification_phase_complete","true");
    const suppressed=Number(sessionStorage.getItem("gold1p_startup_notifications_suppressed"))||0;
    const prefs=notificationPreferences();
    if(prefs.showStartupSummary!==false&&!$("gold1pActiveUpdatePrompt")&&!$("gold1pUpdateSetup")&&(restored||suppressed)){
      api()?.notify?.("Welcome back",`${restored?`${restored} application${restored===1?"":"s"} restored. `:""}${suppressed?`${suppressed} startup notice${suppressed===1?" was":"s were"} kept in Action Center.`:"Your cloud VM is ready."}`,"EmeraldOS Gold 1V");
    }
    captureSessionState();
  }

  function install(){
    if(!api()?.APPS){setTimeout(install,90);return}
    registerApp();patchAPI();applyDevicePreferences();
    const observer=new MutationObserver(()=>{applyDevicePreferences();clearTimeout(window.__gold1pClampTimer);window.__gold1pClampTimer=setTimeout(clampWindows,60)});
    observer.observe($("windowLayer")||document.body,{childList:true,subtree:true});
    setInterval(captureSessionState,20000);
    window.addEventListener("resize",clampWindows,{passive:true});
    window.addEventListener("pagehide",markCleanShutdown);
    window.addEventListener("beforeunload",markCleanShutdown);
    document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")captureSessionState()});
    document.addEventListener("keydown",event=>{if(event.metaKey&&event.key.toLowerCase()==="a"){event.preventDefault();$("actionBtn")?.click()}});
    setTimeout(finishStartup,2600);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
})();
