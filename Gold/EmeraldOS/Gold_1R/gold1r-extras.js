"use strict";

/* =========================================================
   EMERALDOS GOLD 1R
   ACTIVE UPDATE NOTIFICATIONS + FOCUS SESSIONS + QUICK SETTINGS

   This module reads system/emeraldGoldLatest but never writes it.
   Updates are offered to the user and require an explicit click.
========================================================= */
(function EmeraldOSGold1RExtras(){
  if(window.__EMERALDOS_GOLD_1R_EXTRAS__) return;
  window.__EMERALDOS_GOLD_1R_EXTRAS__=true;

  const VERSION="1R";
  const FOLDER="Gold_1R";
  const UPDATE_SERVICE="Original E.L.S.U.S.";
  const PREFIX="gold1g_";
  const PREFS_KEY=PREFIX+"update_preferences_1r";
  const HISTORY_KEY=PREFIX+"update_history_1r";
  const SNOOZE_KEY=PREFIX+"update_snooze_1r";
  const LAST_PROMPT_KEY=PREFIX+"update_last_prompt_1r";
  const LAST_CHECK_KEY=PREFIX+"update_last_check_1r";
  const FOCUS_STATE_KEY=PREFIX+"focus_sessions_1r";
  const LAST_NOTIFIED_VERSION_KEY=PREFIX+"update_last_notified_version_1r";
  const MANIFEST_CACHE_KEY="emeraldGoldShell_latest";
  const DEFAULT_UPDATE_PREFS={activeNotifications:true,checkIntervalMinutes:30,snoozeHours:6,notifyOnSameVersion:false,allowLiveListener:true};

  const $=id=>document.getElementById(id);
  const qa=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const esc=value=>String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
  const now=()=>new Date().toISOString();
  const read=(key,fallback)=>{try{const raw=localStorage.getItem(key);return raw===null?fallback:JSON.parse(raw)}catch{return fallback}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch(error){console.warn("Gold 1R local write failed",key,error);return false}};
  const api=()=>window.Gold50||window.Gold1R;
  const updatePrefs=()=>({...DEFAULT_UPDATE_PREFS,...read(PREFS_KEY,{})});
  const setUpdatePrefs=next=>{const value={...updatePrefs(),...next};write(PREFS_KEY,value);return value};
  const notify=(title,body,app="System Update")=>api()?.notify?.(title,body,app)||console.info(`[${app}] ${title}: ${body}`);

  let latestManifest=null;
  let updateAvailable=false;
  let liveUnsubscribe=null;
  let checkTimer=null;
  let focusTimer=null;
  const savedFocus=read(FOCUS_STATE_KEY,{remaining:25*60,running:false,endsAt:0});
  let focusRemaining=Math.max(0,Number(savedFocus.remaining)||25*60);
  let focusRunning=Boolean(savedFocus.running&&Number(savedFocus.endsAt)>Date.now());
  let focusEndsAt=focusRunning?Number(savedFocus.endsAt):0;

  function versionParts(value){
    return String(value||"").trim().toUpperCase().match(/\d+|[A-Z]+/g)||[];
  }
  function compareVersions(a,b){
    const left=versionParts(a),right=versionParts(b),length=Math.max(left.length,right.length);
    for(let index=0;index<length;index++){
      const x=left[index]||"",y=right[index]||"";
      const xNumber=/^\d+$/.test(x),yNumber=/^\d+$/.test(y);
      const result=xNumber&&yNumber?Number(x)-Number(y):x.localeCompare(y);
      if(result!==0)return result>0?1:-1;
    }
    return 0;
  }
  function manifestVersion(manifest){return String(manifest?.latestVersion||manifest?.build||"").trim()}
  function isNewer(manifest){return Boolean(manifest?.enabled!==false&&compareVersions(manifestVersion(manifest),VERSION)>0)}
  function history(){return read(HISTORY_KEY,[])}
  function addHistory(type,manifest={},details=""){
    const item={id:`uh_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,type,version:manifestVersion(manifest)||VERSION,title:manifest.releaseTitle||`EmeraldOS Gold ${manifestVersion(manifest)||VERSION}`,details,time:now()};
    const items=[item,...history()].slice(0,100);write(HISTORY_KEY,items);return item;
  }
  function snoozed(){return Number(localStorage.getItem(SNOOZE_KEY)||0)>Date.now()}
  function snooze(hours=updatePrefs().snoozeHours){localStorage.setItem(SNOOZE_KEY,String(Date.now()+Math.max(1,Number(hours)||6)*3600000))}

  async function fetchLatestManifest(source="manual"){
    let manifest=read(MANIFEST_CACHE_KEY,null);
    try{
      const firebase=await import("./firebase.js");
      if(firebase.db){
        const snapshot=await firebase.getDoc(firebase.doc(firebase.db,"system","emeraldGoldLatest"));
        if(snapshot.exists())manifest={...(manifest||{}),...snapshot.data()};
      }
    }catch(error){
      console.debug("Gold 1R update check used local manifest cache",error?.message||error);
    }
    localStorage.setItem(LAST_CHECK_KEY,now());
    if(manifest){
      write(MANIFEST_CACHE_KEY,manifest);
      latestManifest=manifest;
      updateAvailable=isNewer(manifest);
      updateTaskbarStatus();
      addHistory("check",manifest,updateAvailable?`New version detected by ${source}.`:`No newer version detected by ${source}.`);
    }
    return manifest;
  }

  function updateButton(){
    let button=$("gold1pUpdateStatusBtn");
    if(button)return button;
    const taskbar=$("taskbar"),anchor=$("quickSettingsBtn")||$("shellStatusBtn");
    if(!taskbar||!anchor)return null;
    button=document.createElement("button");
    button.id="gold1pUpdateStatusBtn";
    button.className="task-btn gold1p-update-status hidden";
    button.title="System Update";
    button.setAttribute("aria-label","System Update");
    button.innerHTML='<span aria-hidden="true">↻</span><span class="gold1p-update-dot" aria-hidden="true"></span>';
    button.addEventListener("click",()=>latestManifest&&isNewer(latestManifest)?showUpdatePrompt(latestManifest,true):openUpdateStatus());
    taskbar.insertBefore(button,anchor);
    return button;
  }
  function updateTaskbarStatus(){
    const button=updateButton();if(!button)return;
    button.classList.toggle("hidden",!updateAvailable);
    button.classList.toggle("required",Boolean(latestManifest?.required));
    button.title=updateAvailable?`${latestManifest?.releaseTitle||"A newer EmeraldOS Gold version"} is available`:`EmeraldOS Gold ${VERSION} is current`;
  }

  function removeUpdatePrompt(){
    $("gold1pActiveUpdatePrompt")?.remove();
    document.body.classList.remove("gold1p-update-prompt-open");
  }
  function showUpdatePrompt(manifest,force=false){
    if(!isNewer(manifest))return false;
    const prefs=updatePrefs();
    if(!force&&(!prefs.activeNotifications||snoozed())&&!manifest.required)return false;
    const firstSetup=$("setupWizard"),updateSetup=$("gold1pUpdateSetup");
    const setupVisible=Boolean(updateSetup||(firstSetup&&!firstSetup.classList.contains("hidden")));
    if(!force&&setupVisible){setTimeout(()=>showUpdatePrompt(manifest,false),10000);return false;}
    removeUpdatePrompt();
    const prompt=document.createElement("aside");
    prompt.id="gold1pActiveUpdatePrompt";
    prompt.className=`gold1p-active-update-prompt${manifest.required?" required":""}`;
    prompt.setAttribute("role","dialog");
    prompt.setAttribute("aria-labelledby","gold1pUpdatePromptTitle");
    const version=manifestVersion(manifest),title=manifest.releaseTitle||`EmeraldOS Gold ${version}`;
    prompt.innerHTML=`
      <div class="gold1p-update-prompt-head">
        <span class="gold1p-update-prompt-icon" aria-hidden="true">↻</span>
        <div><b id="gold1pUpdatePromptTitle">${esc(title)} is ready</b><small>E.L.S.U.S. update</small></div>
        <button id="gold1pUpdatePromptClose" aria-label="Close update notification">×</button>
      </div>
      <p>${esc(manifest.summary||"A newer EmeraldOS Gold release is available. Your cloud VM will be saved before switching versions.")}</p>
      <div class="gold1p-update-prompt-meta"><span>Current: ${VERSION}</span><span>Available: ${esc(version)}</span><span>${manifest.required?"Required update":"Optional update"}</span></div>
      <div class="gold1p-update-prompt-actions">
        <button id="gold1pUpdateNow" class="button primary">Update now</button>
        <button id="gold1pUpdateDetails" class="button">View details</button>
        <button id="gold1pUpdateLater" class="button">Later</button>
      </div>`;
    document.body.appendChild(prompt);
    document.body.classList.add("gold1p-update-prompt-open");
    localStorage.setItem(LAST_PROMPT_KEY,now());
    addHistory("prompt",manifest,"The active update prompt was displayed.");
    $("gold1pUpdateNow").onclick=()=>beginUserUpdate(manifest);
    $("gold1pUpdateDetails").onclick=()=>{removeUpdatePrompt();openUpdateStatus(manifest)};
    $("gold1pUpdateLater").onclick=()=>{snooze();removeUpdatePrompt();addHistory("snoozed",manifest,`Snoozed for ${updatePrefs().snoozeHours} hours.`);api()?.renderNotificationBadge?.()};
    $("gold1pUpdatePromptClose").onclick=()=>{if(!manifest.required)snooze(1);removeUpdatePrompt()};
    return true;
  }

  async function beginUserUpdate(manifest){
    removeUpdatePrompt();
    addHistory("accepted",manifest,"The user selected Update now.");
    notify("Preparing update","Saving the cloud VM before returning control to the original E.L.S.U.S. shell","System Update");
    try{
      if(window.Gold1R?.requestVersionChange){await window.Gold1R.requestVersionChange(manifest);return true}
      if(window.Gold1R?.saveWorkspaceNow)await window.Gold1R.saveWorkspaceNow(false);
      window.Gold1R?.openUpdateCenter?.();
      return true;
    }catch(error){
      addHistory("failed",manifest,error.message||String(error));
      notify("Update could not start",error.message||String(error),"System Update");
      return false;
    }
  }

  async function checkForUpdates(options={}){
    const manifest=await fetchLatestManifest(options.source||"scheduled check");
    if(!manifest)return null;
    if(isNewer(manifest)){
      updateAvailable=true;updateTaskbarStatus();
      const version=manifestVersion(manifest),alreadyNotified=localStorage.getItem(LAST_NOTIFIED_VERSION_KEY)===version;
      const promptShown=showUpdatePrompt(manifest,Boolean(options.forcePrompt));
      if(!alreadyNotified||options.forcePrompt){
        if(!promptShown)notify("Update available",`${manifest.releaseTitle||`EmeraldOS Gold ${version}`} is ready. Open System Update when you are ready.`,"System Update");
        localStorage.setItem(LAST_NOTIFIED_VERSION_KEY,version);
      }
    }else if(options.showCurrent){
      notify("You're up to date",`EmeraldOS Gold ${VERSION} is the latest configured release.`,"System Update");
    }
    return manifest;
  }

  async function startLiveListener(){
    if(!updatePrefs().allowLiveListener||liveUnsubscribe)return;
    try{
      const firebase=await import("./firebase.js");
      if(!firebase.db||typeof firebase.onSnapshot!=="function")return;
      liveUnsubscribe=firebase.onSnapshot(firebase.doc(firebase.db,"system","emeraldGoldLatest"),snapshot=>{
        if(!snapshot.exists())return;
        const manifest=snapshot.data();
        const oldVersion=manifestVersion(latestManifest);
        latestManifest=manifest;write(MANIFEST_CACHE_KEY,manifest);
        updateAvailable=isNewer(manifest);updateTaskbarStatus();
        if(updateAvailable&&manifestVersion(manifest)!==oldVersion){
          addHistory("live-detected",manifest,"A staff-published release was detected by the active listener.");
          showUpdatePrompt(manifest,false);
        }
      },error=>console.debug("Gold 1R live update listener unavailable",error?.message||error));
    }catch(error){console.debug("Gold 1R live update listener skipped",error?.message||error)}
  }

  function openUpdateStatus(manifest=latestManifest){
    const core=api();if(!core?.openWindow)return window.Gold1R?.openUpdateCenter?.(manifest);
    const prefs=updatePrefs(),items=history();
    const currentManifest=manifest||read(MANIFEST_CACHE_KEY,null);
    const newer=isNewer(currentManifest),version=manifestVersion(currentManifest)||VERSION;
    const rows=items.slice(0,40).map(item=>`<tr><td>${new Date(item.time).toLocaleString()}</td><td>${esc(item.type)}</td><td>${esc(item.version)}</td><td>${esc(item.details)}</td></tr>`).join("");
    const html=`<div class="app-shell"><div class="app-toolbar"><button id="spCheckNow" class="button primary">Check now</button><button id="spOpenUpdateCenter" class="button">System Update</button><button id="spClearHistory" class="button">Clear history</button></div><div class="app-body gold1p-service-page"><div class="gold1p-service-heading"><div><h1>Update notifications</h1><p>The original E.L.S.U.S. update service checks for staff-published releases and asks before changing this VM.</p></div><span class="gold1p-update-chip">E.L.S.U.S.</span></div><div class="grid3"><div class="card"><b>This VM</b><h2>Gold ${VERSION}</h2></div><div class="card"><b>Configured release</b><h2>Gold ${esc(version)}</h2></div><div class="card"><b>Status</b><h2>${newer?"Update available":"Up to date"}</h2></div></div><section class="card"><h2>Notification preferences</h2><div class="setting-row"><span><b>Active update notifications</b><small>Ask when a newer staff-published release is detected.</small></span><input id="spActiveNotifications" type="checkbox" ${prefs.activeNotifications?"checked":""}></div><div class="setting-row"><span><b>Live update listener</b><small>Receive a prompt shortly after staff publishes a release.</small></span><input id="spLiveListener" type="checkbox" ${prefs.allowLiveListener?"checked":""}></div><div class="setting-row"><span><b>Scheduled check interval</b><small>Used when the live listener is unavailable.</small></span><select id="spInterval"><option value="15" ${prefs.checkIntervalMinutes===15?"selected":""}>15 minutes</option><option value="30" ${prefs.checkIntervalMinutes===30?"selected":""}>30 minutes</option><option value="60" ${prefs.checkIntervalMinutes===60?"selected":""}>1 hour</option><option value="180" ${prefs.checkIntervalMinutes===180?"selected":""}>3 hours</option></select></div><div class="setting-row"><span><b>Remind me later</b><small>How long the Later button snoozes an optional update.</small></span><select id="spSnooze"><option value="1" ${prefs.snoozeHours===1?"selected":""}>1 hour</option><option value="6" ${prefs.snoozeHours===6?"selected":""}>6 hours</option><option value="12" ${prefs.snoozeHours===12?"selected":""}>12 hours</option><option value="24" ${prefs.snoozeHours===24?"selected":""}>1 day</option></select></div></section><section class="card"><h2>Update history</h2><div class="gold1p-history-table"><table><thead><tr><th>Time</th><th>Event</th><th>Version</th><th>Details</th></tr></thead><tbody>${rows||'<tr><td colspan="4">No update activity has been recorded.</td></tr>'}</tbody></table></div></section><p class="muted">This service only reads <code>system/emeraldGoldLatest</code>. It cannot publish a version and cannot install an update without your selection.</p></div></div>`;
    const win=core.openWindow("updatehistory","Update Notifications & History",html,{width:1000,height:700});
    win.querySelector("#spCheckNow").onclick=()=>checkForUpdates({source:"manual check",forcePrompt:true,showCurrent:true});
    win.querySelector("#spOpenUpdateCenter").onclick=()=>window.Gold1R?.openUpdateCenter?.(currentManifest);
    win.querySelector("#spClearHistory").onclick=()=>{write(HISTORY_KEY,[]);openUpdateStatus(currentManifest)};
    const savePrefs=()=>{setUpdatePrefs({activeNotifications:win.querySelector("#spActiveNotifications").checked,allowLiveListener:win.querySelector("#spLiveListener").checked,checkIntervalMinutes:Number(win.querySelector("#spInterval").value),snoozeHours:Number(win.querySelector("#spSnooze").value)});scheduleChecks();if(updatePrefs().allowLiveListener)startLiveListener()};
    ["#spActiveNotifications","#spLiveListener","#spInterval","#spSnooze"].forEach(selector=>win.querySelector(selector)?.addEventListener("change",savePrefs));
    return win;
  }

  function quickSettingsPanel(){
    let panel=$("gold1pQuickSettingsPanel");
    if(panel){panel.remove();return null}
    const prefs=api()?.prefs?.()||{},notificationPrefs=api()?.notificationPrefs?.()||{quietStartup:true};
    ["startMenu","searchPanel","taskView","actionCenter"].forEach(id=>$(id)?.classList.add("hidden"));
    panel=document.createElement("section");panel.id="gold1pQuickSettingsPanel";panel.className="gold1p-quick-settings";
    panel.innerHTML=`<header><div><b>Quick Settings</b><small>EmeraldOS Gold 1R</small></div><button id="quickSettingsClose" aria-label="Close Quick Settings">×</button></header><div class="gold1p-quick-grid"><button data-quick="focus" class="${prefs.focusAssist?"active":""}"><span>☾</span><b>Focus assist</b></button><button data-quick="night" class="${prefs.nightLight?"active":""}"><span>◐</span><b>Night light</b></button><button data-quick="dark" class="${prefs.theme==="dark"?"active":""}"><span>◑</span><b>Dark mode</b></button><button data-quick="transparent" class="${prefs.transparency!==false?"active":""}"><span>▧</span><b>Transparency</b></button><button data-quick="quiet" class="${notificationPrefs.quietStartup!==false?"active":""}"><span>◌</span><b>Quiet startup</b></button><button data-quick="updates" class="${updatePrefs().activeNotifications?"active":""}"><span>↻</span><b>Update alerts</b></button></div><div class="gold1p-quick-sliders"><label><span>Display</span><input id="quickBrightness" type="range" min="35" max="100" value="${Number(prefs.displayBrightness)||100}"><output>${Number(prefs.displayBrightness)||100}%</output></label><label><span>Volume</span><input id="quickVolume" type="range" min="0" max="100" value="${Number(prefs.systemVolume??80)}"><output>${Number(prefs.systemVolume??80)}%</output></label></div><footer><span class="gold1p-connectivity"><i class="${navigator.onLine?"online":"offline"}"></i>${navigator.onLine?"Connected":"Offline"}</span><div><button id="quickOpenUpdate">${updateAvailable?"Update available":"Up to date"}</button><button id="quickOpenSettings">All settings</button></div></footer>`;
    document.body.appendChild(panel);
    const refresh=()=>{panel.remove();quickSettingsPanel()};
    panel.querySelector("#quickSettingsClose").onclick=()=>panel.remove();
    panel.querySelector('[data-quick="focus"]').onclick=()=>{api()?.setPrefs?.({focusAssist:!prefs.focusAssist});refresh()};
    panel.querySelector('[data-quick="night"]').onclick=()=>{api()?.setPrefs?.({nightLight:!prefs.nightLight});refresh()};
    panel.querySelector('[data-quick="dark"]').onclick=()=>{api()?.setPrefs?.({theme:prefs.theme==="dark"?"light":"dark"});refresh()};
    panel.querySelector('[data-quick="transparent"]').onclick=()=>{api()?.setPrefs?.({transparency:prefs.transparency===false});refresh()};
    panel.querySelector('[data-quick="quiet"]').onclick=()=>{api()?.setNotificationPrefs?.({quietStartup:notificationPrefs.quietStartup===false});refresh()};
    panel.querySelector('[data-quick="updates"]').onclick=()=>{setUpdatePrefs({activeNotifications:!updatePrefs().activeNotifications});refresh()};
    panel.querySelector("#quickBrightness").oninput=event=>{const value=Number(event.target.value);event.target.nextElementSibling.value=`${value}%`;api()?.setPrefs?.({displayBrightness:value})};
    panel.querySelector("#quickVolume").oninput=event=>{const value=Number(event.target.value);event.target.nextElementSibling.value=`${value}%`;api()?.setPrefs?.({systemVolume:value});document.querySelectorAll("audio,video").forEach(media=>media.volume=value/100)};
    panel.querySelector("#quickOpenSettings").onclick=()=>{panel.remove();api()?.openApp?.("settings")};
    panel.querySelector("#quickOpenUpdate").onclick=()=>{panel.remove();openUpdateStatus()};
    return panel;
  }

  function saveFocusState(){write(FOCUS_STATE_KEY,{remaining:focusRemaining,running:focusRunning,endsAt:focusEndsAt,updatedAt:now()})}
  function formatFocusTime(seconds){return `${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(Math.max(0,seconds%60)).padStart(2,"0")}`}
  function tickFocusSession(){
    if(focusRunning){focusRemaining=Math.max(0,Math.ceil((focusEndsAt-Date.now())/1000));if(focusRemaining<=0){focusRunning=false;clearInterval(focusTimer);focusTimer=null;saveFocusState();notify("Focus session complete","Your focus session has finished.","Focus Sessions");addHistory("focus-complete",{latestVersion:VERSION,releaseTitle:"Focus Sessions"},"Focus timer completed.")}}
    qa("[data-focus-time]").forEach(element=>element.textContent=formatFocusTime(focusRemaining));
    qa("[data-focus-state]").forEach(element=>element.textContent=focusRunning?"Focusing":"Ready");
  }
  function openFocusSessions(){
    const core=api();if(!core?.openWindow)return null;
    const html=`<div class="app-shell"><div class="app-toolbar"><b>Focus Sessions</b><span style="flex:1"></span><button id="focusSettings" class="button">Settings</button></div><div class="app-body gold1p-focus-app"><div class="gold1p-focus-clock" data-focus-time>${formatFocusTime(focusRemaining)}</div><h2 data-focus-state>${focusRunning?"Focusing":"Ready"}</h2><p>Use a distraction-free timer with Focus Assist and Gold notifications.</p><div class="gold1p-focus-controls"><button id="focusStart" class="button primary">${focusRunning?"Pause":"Start"}</button><button id="focusReset" class="button">Reset</button></div><div class="gold1p-focus-presets"><button data-focus-minutes="15">15 minutes</button><button data-focus-minutes="25">25 minutes</button><button data-focus-minutes="45">45 minutes</button><button data-focus-minutes="60">60 minutes</button></div><label class="gold1p-focus-option"><input id="focusAssistDuringSession" type="checkbox" checked> Turn on Focus Assist while the timer is running</label></div></div>`;
    const win=core.openWindow("focussessions","Focus Sessions",html,{width:650,height:560});
    win.querySelector("#focusStart").onclick=()=>{
      if(focusRunning){focusRemaining=Math.max(0,Math.ceil((focusEndsAt-Date.now())/1000));focusRunning=false;clearInterval(focusTimer);focusTimer=null;win.querySelector("#focusStart").textContent="Start";saveFocusState()}
      else{focusRunning=true;focusEndsAt=Date.now()+focusRemaining*1000;focusTimer=setInterval(tickFocusSession,250);win.querySelector("#focusStart").textContent="Pause";if(win.querySelector("#focusAssistDuringSession").checked)api()?.setPrefs?.({focusAssist:true});saveFocusState()}
      tickFocusSession();
    };
    win.querySelector("#focusReset").onclick=()=>{focusRunning=false;clearInterval(focusTimer);focusTimer=null;focusRemaining=25*60;focusEndsAt=0;win.querySelector("#focusStart").textContent="Start";saveFocusState();tickFocusSession()};
    win.querySelectorAll("[data-focus-minutes]").forEach(button=>button.onclick=()=>{focusRunning=false;clearInterval(focusTimer);focusTimer=null;focusRemaining=Number(button.dataset.focusMinutes)*60;focusEndsAt=0;win.querySelector("#focusStart").textContent="Start";saveFocusState();tickFocusSession()});
    win.querySelector("#focusSettings").onclick=()=>api()?.openApp?.("settings");
    tickFocusSession();return win;
  }

  function registerApps(){
    const core=api();if(!core?.APPS)return false;
    if(!core.APPS.some(app=>app.id==="updatehistory"))core.APPS.push({id:"updatehistory",name:"Update Notifications",label:"UN",color:"#0078d7",group:"System",desc:"Active update alerts, history, and preferences.",open:openUpdateStatus});
    if(!core.APPS.some(app=>app.id==="focussessions"))core.APPS.push({id:"focussessions",name:"Focus Sessions",label:"FS",color:"#0078d7",group:"Productivity",desc:"A distraction-free focus timer with Focus Assist.",open:openFocusSessions});
    core.renderStartMenu?.();core.renderDesktop?.();return true;
  }

  function addOriginalELSUSLabel(){
    document.body.dataset.elsusMode="original";
  }

  function scheduleChecks(){
    clearInterval(checkTimer);
    const minutes=Math.max(15,Number(updatePrefs().checkIntervalMinutes)||30);
    checkTimer=setInterval(()=>{if(document.visibilityState==="visible"&&navigator.onLine)checkForUpdates({source:"scheduled check"})},minutes*60000);
  }

  function installEvents(){
    $("quickSettingsBtn")?.addEventListener("click",event=>{event.stopPropagation();quickSettingsPanel()});
    document.addEventListener("click",event=>{if(!event.target.closest("#gold1pQuickSettingsPanel")&&!event.target.closest("#quickSettingsBtn"))$("gold1pQuickSettingsPanel")?.remove()});
    window.addEventListener("online",()=>checkForUpdates({source:"network reconnect"}));
    document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"){const last=Date.parse(localStorage.getItem(LAST_CHECK_KEY)||0)||0;if(Date.now()-last>15*60000)checkForUpdates({source:"resume check"})}});
    window.addEventListener("beforeunload",()=>{saveFocusState();try{liveUnsubscribe?.()}catch{}clearInterval(checkTimer);clearInterval(focusTimer)});
  }

  function patchPublicAPI(){
    window.Gold1R=window.Gold1R||api()||{};
    Object.assign(window.Gold1R,{elsusMode:"original",checkForUpdates,showUpdatePrompt,openUpdateStatus,openUpdatePreferences:openUpdateStatus,openFocusSessions,quickSettings:quickSettingsPanel,latestManifest:()=>latestManifest,updatePreferences:updatePrefs});
  }

  function init(){
    if(!api()?.APPS){setTimeout(init,80);return}
    patchPublicAPI();registerApps();addOriginalELSUSLabel();installEvents();updateButton();scheduleChecks();startLiveListener();if(focusRunning){focusRemaining=Math.max(0,Math.ceil((focusEndsAt-Date.now())/1000));focusTimer=setInterval(tickFocusSession,250)}
    setTimeout(()=>checkForUpdates({source:"startup check"}),5500);
    notify("EmeraldOS Gold 1R","Update checks, Focus Sessions, and Quick Settings loaded.","System");
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
