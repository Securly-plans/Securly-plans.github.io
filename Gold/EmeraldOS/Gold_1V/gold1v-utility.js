"use strict";

/* EmeraldOS Gold 1V user utility and customization layer.
   This module adds applications without replacing Gold 1U shell layouts. */
(function EmeraldOSGold1VUtility(){
  if(window.__EMERALDOS_GOLD_1V_UTILITY__)return;
  window.__EMERALDOS_GOLD_1V_UTILITY__=true;

  const PREFIX="gold1g_",VERSION="1V";
  const PROFILE_KEY=PREFIX+"personalization_profiles_1v";
  const HISTORY_KEY=PREFIX+"utility_history_1v";
  const esc=value=>String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
  const read=(key,fallback)=>{try{const raw=localStorage.getItem(key);return raw===null?fallback:JSON.parse(raw)}catch{return fallback}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return value}catch(error){console.warn("Gold 1V utility write failed",key,error);return value}};
  const core=()=>window.Gold50||window.Gold1V;
  const now=()=>new Date().toISOString();
  const uid=prefix=>`${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;
  const saveVM=()=>{if(window.__GOLD1V_MIGRATION_BLOCK_SAVES__!==true)setTimeout(()=>window.Gold1V?.saveWorkspaceNow?.(false),0)};
  const notify=(title,body,app)=>core()?.notify?.(title,body,app);

  const WALLPAPERS={
    default:"",
    gold:wallpaper("#b07b20","#17120a","#f4d47a"),
    emerald:wallpaper("#007a52","#05251d","#64d8ad"),
    blue:wallpaper("#1267a8","#071a31","#75bfff"),
    violet:wallpaper("#6545a4","#170f2d","#bba4ff"),
    slate:wallpaper("#53616f","#111820","#a9bac8")
  };
  function wallpaper(accent,dark,light){
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop stop-color="${dark}"/><stop offset=".55" stop-color="${accent}"/><stop offset="1" stop-color="${light}"/></linearGradient><radialGradient id="r"><stop stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="1600" height="900" fill="url(#g)"/><circle cx="1250" cy="140" r="620" fill="url(#r)"/><path d="M0 730 C380 520 600 920 970 650 C1210 475 1370 570 1600 410 V900 H0Z" fill="#000" opacity=".18"/></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }
  const profiles=()=>{const value=read(PROFILE_KEY,[]);return Array.isArray(value)?value:[]};
  function saveProfiles(value){write(PROFILE_KEY,value.slice(0,20));saveVM();return value}
  const history=()=>{const value=read(HISTORY_KEY,[]);return Array.isArray(value)?value:[]};
  function record(tool,result){write(HISTORY_KEY,[{id:uid("util"),tool,result:String(result).slice(0,300),time:now()},...history()].slice(0,30));saveVM()}

  function renderTaskbarPins(){
    const holder=document.getElementById("taskApps");if(!holder)return;
    let pins=document.getElementById("gold1vTaskbarPins");
    if(!pins){pins=document.createElement("div");pins.id="gold1vTaskbarPins";pins.className="gold1v-taskbar-pins";holder.parentNode.insertBefore(pins,holder)}
    const prefs=core()?.prefs?.()||{},ids=Array.isArray(prefs.taskbarPinnedApps)?prefs.taskbarPinnedApps:[];
    pins.innerHTML=ids.map(id=>{const app=core()?.APPS?.find(item=>item.id===id);return app?`<button data-taskbar-pin="${esc(id)}" title="${esc(app.name)}"><img src="${esc(app.icon||app.logo||`app-logos/${app.id}.svg`)}" alt=""><span>${esc(app.name)}</span></button>`:""}).join("");
    pins.querySelectorAll("[data-taskbar-pin]").forEach(button=>button.onclick=()=>core()?.openApp?.(button.dataset.taskbarPin));
  }

  function appChecklist(selected,name){
    const chosen=new Set(selected||[]);
    return `<div class="gold1v-app-picker">${(core()?.APPS||[]).filter(app=>!app.goldUserApp).sort((a,b)=>a.name.localeCompare(b.name)).map(app=>`<label><input type="checkbox" name="${name}" value="${esc(app.id)}" ${chosen.has(app.id)?"checked":""}><img src="${esc(app.icon||app.logo||`app-logos/${app.id}.svg`)}" alt=""><span>${esc(app.name)}</span></label>`).join("")}</div>`;
  }
  const checked=(win,name)=>[...win.querySelectorAll(`input[name="${name}"]:checked`)].map(input=>input.value);
  function customizationSnapshot(name){
    const p=core()?.prefs?.()||{};
    return {id:uid("profile"),name,createdAt:now(),prefs:{theme:p.theme,accent:p.accent,customWallpaper:p.customWallpaper,wallpaper:p.wallpaper,iconSize:p.iconSize,textScale:p.textScale,showSearch:p.showSearch,showLabels:p.showLabels,transparency:p.transparency,clockSeconds:p.clockSeconds,desktopApps:[...(p.desktopApps||[])],startPinnedApps:[...(p.startPinnedApps||[])],taskbarPinnedApps:[...(p.taskbarPinnedApps||[])]}};
  }
  function applyProfile(profile){
    if(!profile?.prefs)return;
    core()?.setPrefs?.({...core().prefs(),...profile.prefs});
    syncShellPreferences();renderTaskbarPins();
    notify("Profile applied",`${profile.name} is now active.`,"Personalization Studio");
  }
  function openPersonalizationStudio(){
    const p=core().prefs(),saved=profiles();
    const wallpaperName=Object.entries(WALLPAPERS).find(([,value])=>value===p.customWallpaper)?.[0]||"custom";
    const html=`<div class="app-shell gold1v-customization"><div class="app-toolbar"><button id="customApply" class="button primary">Apply changes</button><button id="customSaveProfile" class="button">Save as profile</button><button id="customReset" class="button">Restore defaults</button></div><div class="app-body"><div class="gold1v-page-title"><div><h1>Personalization Studio</h1><p>Customize the desktop, Start, taskbar, wallpaper, color, scale, and saved visual profiles.</p></div><span class="gold1v-version-chip">Gold ${VERSION}</span></div><div class="gold1v-custom-grid"><section class="card"><h2>Appearance</h2><label>Theme<select id="customTheme" class="field"><option value="light" ${p.theme==="light"?"selected":""}>Light</option><option value="dark" ${p.theme==="dark"?"selected":""}>Dark</option><option value="highcontrast" ${p.theme==="highcontrast"?"selected":""}>High contrast</option></select></label><label>Accent color<input id="customAccent" type="color" value="${esc(p.accent||"#0078d7")}"></label><div class="gold1v-accent-swatches">${["#0078d7","#008272","#107c10","#8764b8","#d83b01","#c79000","#d13438","#555555"].map(color=>`<button data-accent="${color}" style="background:${color}" title="${color}"></button>`).join("")}</div><label>Wallpaper preset<select id="customWallpaperPreset" class="field">${["default","gold","emerald","blue","violet","slate","custom"].map(id=>`<option value="${id}" ${wallpaperName===id?"selected":""}>${id[0].toUpperCase()+id.slice(1)}</option>`).join("")}</select></label><label>Custom wallpaper URL<input id="customWallpaperUrl" class="field" value="${wallpaperName==="custom"?esc(p.customWallpaper||""):""}" placeholder="https://..."></label></section><section class="card"><h2>Display and shell</h2><label>Desktop icon size <output id="customIconOut">${Number(p.iconSize)||48}px</output><input id="customIconSize" type="range" min="34" max="72" value="${Number(p.iconSize)||48}"></label><label>Text scale <output id="customTextOut">${Number(p.textScale)||100}%</output><input id="customTextScale" type="range" min="80" max="170" value="${Number(p.textScale)||100}"></label><label class="gold1v-check"><input id="customSearch" type="checkbox" ${p.showSearch!==false?"checked":""}> Show taskbar Search</label><label class="gold1v-check"><input id="customLabels" type="checkbox" ${p.showLabels!==false?"checked":""}> Show desktop and taskbar labels</label><label class="gold1v-check"><input id="customTransparency" type="checkbox" ${p.transparency!==false?"checked":""}> Use transparency effects</label><label class="gold1v-check"><input id="customSeconds" type="checkbox" ${p.clockSeconds?"checked":""}> Show seconds in taskbar clock</label></section></div><section class="card"><h2>Desktop applications</h2><p class="muted">Checked applications appear on the desktop.</p>${appChecklist(p.desktopApps,"desktopPin")}</section><section class="card"><h2>Start tiles</h2><p class="muted">Checked applications appear in Life at a glance.</p>${appChecklist(p.startPinnedApps,"startPin")}</section><section class="card"><h2>Taskbar shortcuts</h2><p class="muted">Choose up to eight permanent taskbar shortcuts.</p>${appChecklist(p.taskbarPinnedApps,"taskbarPin")}</section><section class="card"><div class="gold1v-section-heading"><h2>Saved profiles</h2><span>${saved.length}/20</span></div><div class="gold1v-profile-list">${saved.map(item=>`<article><div><b>${esc(item.name)}</b><small>${new Date(item.createdAt).toLocaleString()}</small></div><button class="button primary" data-profile-apply="${esc(item.id)}">Apply</button><button class="button danger" data-profile-delete="${esc(item.id)}">Delete</button></article>`).join("")||'<p class="muted">No profiles saved.</p>'}</div></section></div></div>`;
    const win=core().openWindow("themestudio","Personalization Studio",html,{width:1040,height:730});
    const apply=()=>{
      const preset=win.querySelector("#customWallpaperPreset").value;
      const customWallpaper=preset==="custom"?win.querySelector("#customWallpaperUrl").value.trim():(WALLPAPERS[preset]||"");
      const taskPins=checked(win,"taskbarPin").slice(0,8);
      core().setPrefs({...core().prefs(),theme:win.querySelector("#customTheme").value,accent:win.querySelector("#customAccent").value,customWallpaper,wallpaper:preset,iconSize:Number(win.querySelector("#customIconSize").value),textScale:Number(win.querySelector("#customTextScale").value),showSearch:win.querySelector("#customSearch").checked,showLabels:win.querySelector("#customLabels").checked,transparency:win.querySelector("#customTransparency").checked,clockSeconds:win.querySelector("#customSeconds").checked,desktopApps:checked(win,"desktopPin"),startPinnedApps:checked(win,"startPin"),taskbarPinnedApps:taskPins});
      syncShellPreferences();renderTaskbarPins();notify("Personalization applied","Your Gold VM preferences were updated.","Personalization Studio");
    };
    win.querySelector("#customApply").onclick=apply;
    win.querySelector("#customSaveProfile").onclick=()=>{apply();const name=prompt("Profile name",`My profile ${saved.length+1}`)?.trim();if(!name)return;saveProfiles([customizationSnapshot(name),...profiles()]);core().closeWin?.(win.id);setTimeout(openPersonalizationStudio,50)};
    win.querySelector("#customReset").onclick=()=>{if(!confirm("Restore Gold customization defaults? Files and application data are not affected."))return;core().setPrefs({...core().prefs(),theme:"light",accent:"#0078d7",customWallpaper:"",wallpaper:"default",iconSize:48,textScale:100,showSearch:true,showLabels:true,transparency:true,clockSeconds:false,desktopApps:["explorer","office","mail","settings","updateshell","support","guide","games"],startPinnedApps:["explorer","office","mail","settings","store","support","guide","games","updateshell","calculator","calendar"],taskbarPinnedApps:["explorer","office","calendar"]});syncShellPreferences();renderTaskbarPins();core().closeWin?.(win.id);setTimeout(openPersonalizationStudio,50)};
    win.querySelectorAll("[data-accent]").forEach(button=>button.onclick=()=>{win.querySelector("#customAccent").value=button.dataset.accent});
    win.querySelector("#customIconSize").oninput=event=>win.querySelector("#customIconOut").textContent=`${event.target.value}px`;
    win.querySelector("#customTextScale").oninput=event=>win.querySelector("#customTextOut").textContent=`${event.target.value}%`;
    win.querySelectorAll("[data-profile-apply]").forEach(button=>button.onclick=()=>applyProfile(profiles().find(item=>item.id===button.dataset.profileApply)));
    win.querySelectorAll("[data-profile-delete]").forEach(button=>button.onclick=()=>{saveProfiles(profiles().filter(item=>item.id!==button.dataset.profileDelete));core().closeWin?.(win.id);setTimeout(openPersonalizationStudio,50)});
    return win;
  }

  async function copyText(value){try{await navigator.clipboard.writeText(String(value));notify("Copied","The result is on the clipboard.","Utility Center")}catch{prompt("Copy this value",String(value))}}
  function randomPassword(length,upper,lower,digits,symbols){
    let chars=(upper?"ABCDEFGHJKLMNPQRSTUVWXYZ":"")+(lower?"abcdefghijkmnopqrstuvwxyz":"")+(digits?"23456789":"")+(symbols?"!@#$%&*+-=?":"");
    if(!chars)chars="abcdefghijkmnopqrstuvwxyz23456789";
    const data=new Uint32Array(Math.max(4,length));crypto.getRandomValues(data);
    return [...data].slice(0,length).map(value=>chars[value%chars.length]).join("");
  }
  function openUtilityCenter(){
    const html=`<div class="app-shell gold1v-utility"><div class="app-toolbar"><button id="utilityClearHistory" class="button">Clear history</button><button id="utilityExportHistory" class="button">Export history</button></div><div class="app-body"><div class="gold1v-page-title"><div><h1>Utility Center</h1><p>Generate secure values, format data, encode text, and calculate time without sending input to a server.</p></div><span class="gold1v-local-chip">Runs locally</span></div><div class="gold1v-utility-grid"><section class="card"><h2>Password and ID generator</h2><label>Length <output id="utilityLengthOut">20</output><input id="utilityLength" type="range" min="8" max="64" value="20"></label><div class="gold1v-inline-checks"><label><input id="utilityUpper" type="checkbox" checked> A-Z</label><label><input id="utilityLower" type="checkbox" checked> a-z</label><label><input id="utilityDigits" type="checkbox" checked> 0-9</label><label><input id="utilitySymbols" type="checkbox" checked> Symbols</label></div><textarea id="utilityGenerated" class="field" rows="3" readonly></textarea><div class="button-row"><button id="utilityPassword" class="button primary">Generate password</button><button id="utilityUUID" class="button">Generate UUID</button><button class="button" data-copy-from="utilityGenerated">Copy</button></div></section><section class="card"><h2>JSON formatter</h2><textarea id="utilityJSON" class="field" rows="8" placeholder='{"example":true}'></textarea><div id="utilityJSONStatus" class="muted"></div><div class="button-row"><button id="utilityFormat" class="button primary">Format</button><button id="utilityMinify" class="button">Minify</button><button class="button" data-copy-from="utilityJSON">Copy</button></div></section><section class="card"><h2>Text encoding</h2><textarea id="utilityText" class="field" rows="6" placeholder="Enter text or an encoded value"></textarea><div class="button-row"><button id="utilityUrlEncode" class="button">URL encode</button><button id="utilityUrlDecode" class="button">URL decode</button><button id="utilityBase64Encode" class="button">Base64 encode</button><button id="utilityBase64Decode" class="button">Base64 decode</button><button class="button" data-copy-from="utilityText">Copy</button></div></section><section class="card"><h2>Date and time calculator</h2><div class="grid2"><label>Start<input id="utilityStart" class="field" type="datetime-local"></label><label>End<input id="utilityEnd" class="field" type="datetime-local"></label></div><textarea id="utilityTimeResult" class="field" rows="4" readonly></textarea><div class="button-row"><button id="utilityDifference" class="button primary">Calculate difference</button><button id="utilityNow" class="button">Insert current time</button><button class="button" data-copy-from="utilityTimeResult">Copy</button></div></section></div><section class="card"><h2>Recent utility results</h2><div id="utilityHistory" class="gold1v-utility-history"></div></section></div></div>`;
    const win=core().openWindow("utilitycenter","Utility Center",html,{width:1080,height:730});
    const renderHistory=()=>{win.querySelector("#utilityHistory").innerHTML=history().map(item=>`<button data-history-copy="${esc(item.id)}"><b>${esc(item.tool)}</b><span>${esc(item.result)}</span><small>${new Date(item.time).toLocaleString()}</small></button>`).join("")||'<p class="muted">No utility history.</p>';win.querySelectorAll("[data-history-copy]").forEach(button=>button.onclick=()=>copyText(history().find(item=>item.id===button.dataset.historyCopy)?.result||""))};
    const generated=win.querySelector("#utilityGenerated");
    win.querySelector("#utilityLength").oninput=event=>win.querySelector("#utilityLengthOut").textContent=event.target.value;
    win.querySelector("#utilityPassword").onclick=()=>{generated.value=randomPassword(Number(win.querySelector("#utilityLength").value),win.querySelector("#utilityUpper").checked,win.querySelector("#utilityLower").checked,win.querySelector("#utilityDigits").checked,win.querySelector("#utilitySymbols").checked);record("Password generated",`Secure ${generated.value.length}-character password`);renderHistory()};
    win.querySelector("#utilityUUID").onclick=()=>{generated.value=crypto.randomUUID?.()||uid("uuid");record("UUID",generated.value);renderHistory()};
    const changeJSON=space=>{try{const value=JSON.stringify(JSON.parse(win.querySelector("#utilityJSON").value),null,space);win.querySelector("#utilityJSON").value=value;win.querySelector("#utilityJSONStatus").textContent="Valid JSON";record(space?"JSON formatted":"JSON minified",value);renderHistory()}catch(error){win.querySelector("#utilityJSONStatus").textContent=`Invalid JSON: ${error.message}`}};
    win.querySelector("#utilityFormat").onclick=()=>changeJSON(2);win.querySelector("#utilityMinify").onclick=()=>changeJSON(0);
    const transform=(name,fn)=>{try{const area=win.querySelector("#utilityText");area.value=fn(area.value);record(name,area.value);renderHistory()}catch(error){notify(`${name} failed`,error.message,"Utility Center")}};
    win.querySelector("#utilityUrlEncode").onclick=()=>transform("URL encoded",encodeURIComponent);win.querySelector("#utilityUrlDecode").onclick=()=>transform("URL decoded",decodeURIComponent);
    win.querySelector("#utilityBase64Encode").onclick=()=>transform("Base64 encoded",value=>btoa(unescape(encodeURIComponent(value))));win.querySelector("#utilityBase64Decode").onclick=()=>transform("Base64 decoded",value=>decodeURIComponent(escape(atob(value))));
    win.querySelector("#utilityDifference").onclick=()=>{const a=new Date(win.querySelector("#utilityStart").value),b=new Date(win.querySelector("#utilityEnd").value);if(!Number.isFinite(a.getTime())||!Number.isFinite(b.getTime()))return notify("Dates required","Choose both a start and end date.","Utility Center");const ms=b-a,abs=Math.abs(ms),days=Math.floor(abs/86400000),hours=Math.floor(abs%86400000/3600000),minutes=Math.floor(abs%3600000/60000),seconds=Math.floor(abs%60000/1000),result=`${ms<0?"End is before start by":"Difference"}: ${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds\nMilliseconds: ${ms}`;win.querySelector("#utilityTimeResult").value=result;record("Date difference",result);renderHistory()};
    win.querySelector("#utilityNow").onclick=()=>{const date=new Date(),local=new Date(date-date.getTimezoneOffset()*60000).toISOString().slice(0,16);win.querySelector("#utilityStart").value=local;win.querySelector("#utilityTimeResult").value=`ISO: ${date.toISOString()}\nUnix seconds: ${Math.floor(date.getTime()/1000)}\nLocal: ${date.toString()}`};
    win.querySelectorAll("[data-copy-from]").forEach(button=>button.onclick=()=>copyText(win.querySelector(`#${button.dataset.copyFrom}`)?.value||""));
    win.querySelector("#utilityClearHistory").onclick=()=>{if(confirm("Clear Utility Center history?")){write(HISTORY_KEY,[]);saveVM();renderHistory()}};
    win.querySelector("#utilityExportHistory").onclick=()=>core().saveText?.("EmeraldOS-Gold-1V-Utility-History.json",JSON.stringify(history(),null,2),"application/json");
    renderHistory();return win;
  }

  function openFileFinder(){
    const all=()=>core().files().filter(file=>!file.trash);
    const folders=()=>[...new Set(all().map(file=>file.folder||"Documents"))].sort();
    const html=`<div class="app-shell gold1v-file-finder"><div class="app-toolbar"><input id="finderQuery" class="field" placeholder="Search file name or contents"><select id="finderFolder" class="field"><option value="">All folders</option>${folders().map(folder=>`<option>${esc(folder)}</option>`).join("")}</select><select id="finderType" class="field"><option value="">All types</option>${[...new Set(all().map(file=>file.type||"file"))].sort().map(type=>`<option>${esc(type)}</option>`).join("")}</select><label class="gold1v-check"><input id="finderStarred" type="checkbox"> Starred only</label></div><div class="app-body"><div class="gold1v-page-title"><div><h1>File Finder</h1><p>Search the active private VM by file name, folder, type, and text content.</p></div><span id="finderCount" class="gold1v-version-chip"></span></div><div id="finderResults" class="gold1v-finder-results"></div></div></div>`;
    const win=core().openWindow("filefinder","File Finder",html,{width:940,height:680});
    const render=()=>{const query=win.querySelector("#finderQuery").value.trim().toLowerCase(),folder=win.querySelector("#finderFolder").value,type=win.querySelector("#finderType").value,starred=win.querySelector("#finderStarred").checked;const found=all().filter(file=>(!folder||(file.folder||"Documents")===folder)&&(!type||(file.type||"file")===type)&&(!starred||file.star===true)&&(!query||`${file.name} ${file.folder} ${typeof file.content==="string"?file.content:""}`.toLowerCase().includes(query))).sort((a,b)=>String(b.updated||b.created||"").localeCompare(String(a.updated||a.created||"")));win.querySelector("#finderCount").textContent=`${found.length} result${found.length===1?"":"s"}`;win.querySelector("#finderResults").innerHTML=found.map(file=>`<article class="card"><div><b>${esc(file.name)}</b><small>${esc(file.folder||"Documents")} · ${esc(file.type||"file")} · ${new Date(file.updated||file.created||Date.now()).toLocaleString()}</small><p>${esc(String(file.content||"").replace(/<[^>]*>/g," ").slice(0,180))}</p></div><div class="button-row"><button class="button primary" data-finder-open="${esc(file.id)}">Open</button><button class="button" data-finder-star="${esc(file.id)}">${file.star?"Unstar":"Star"}</button></div></article>`).join("")||'<p class="muted">No files matched.</p>';win.querySelectorAll("[data-finder-open]").forEach(button=>button.onclick=()=>core().openFile?.(button.dataset.finderOpen));win.querySelectorAll("[data-finder-star]").forEach(button=>button.onclick=()=>{const files=core().files(),file=files.find(item=>String(item.id)===button.dataset.finderStar);if(file)file.star=!file.star;core().saveFiles(files);render()})};
    ["finderQuery","finderFolder","finderType","finderStarred"].forEach(id=>win.querySelector(`#${id}`).addEventListener(id==="finderQuery"?"input":"change",render));render();return win;
  }

  function syncShellPreferences(){
    const p=core()?.prefs?.()||{};
    document.body.classList.toggle("gold1v-no-transparency",p.transparency===false);
    document.body.classList.toggle("gold1v-hide-desktop-labels",p.showLabels===false);
  }
  function applyDefaultDiscoveryPins(){
    const key=PREFIX+"gold1v_discovery_pins_applied";
    if(localStorage.getItem(key)==="true")return;
    const p=core()?.prefs?.()||{},start=[...(p.startPinnedApps||[])];
    for(const id of ["themestudio","utilitycenter","filefinder"])if(!start.includes(id))start.push(id);
    core()?.setPrefs?.({...p,startPinnedApps:start});
    localStorage.setItem(key,"true");
  }
  function addGuideTopics(){
    const topics=window.Gold1V?.guideTopics;if(!Array.isArray(topics)||topics.some(topic=>topic.id==="personalization1v"))return;
    topics.push(
      {id:"personalization1v",title:"Personalization Studio and app pins",group:"Settings and personalization",keywords:"customization theme wallpaper accent profile desktop start taskbar pin",summary:"Create a VM appearance and choose where applications are pinned.",steps:["Open Personalization Studio from Start or Settings.","Choose a theme, accent, wallpaper preset, icon size, text scale, and shell options.","Select applications for the desktop, Start tiles, and permanent taskbar shortcuts.","Save the complete arrangement as a reusable profile. Profiles follow the private cloud VM."],links:[["themestudio","Personalization Studio"],["settings","Settings"]]},
      {id:"utility1v",title:"Utility Center",group:"Applications",keywords:"password uuid json url base64 date time calculator utility",summary:"Use local everyday developer and account utilities.",steps:["Generate a password or UUID and copy it.","Format or minify JSON and review validation errors.","Encode or decode URL and Base64 text.","Calculate the exact difference between two dates. Utility input remains in the browser."],links:[["utilitycenter","Utility Center"]]},
      {id:"filefinder1v",title:"Finding files quickly",group:"Files and data",keywords:"file finder search content folder type starred",summary:"Search the private VM by metadata and text contents.",steps:["Open File Finder and enter a name or phrase.","Narrow results by folder, file type, or starred status.","Open a result in its normal EmeraldOS application.","Star frequently used files so they can be filtered later."],links:[["filefinder","File Finder"],["explorer","File Explorer"]]}
    );
  }
  function registerApps(){
    const api=core();if(!api?.APPS)return false;
    const add=app=>{const existing=api.APPS.find(item=>item.id===app.id);if(existing)Object.assign(existing,app);else api.APPS.push(app)};
    add({id:"themestudio",name:"Personalization Studio",label:"PS",color:"#8764b8",group:"System",desc:"Customize appearance, desktop, Start, taskbar, and saved profiles.",open:openPersonalizationStudio});
    add({id:"utilitycenter",name:"Utility Center",label:"UT",color:"#008272",group:"Utilities",desc:"Password, ID, JSON, encoding, and date-time tools.",open:openUtilityCenter});
    add({id:"filefinder",name:"File Finder",label:"FF",color:"#0078d7",group:"Utilities",desc:"Search private VM files by name, contents, folder, type, and star.",open:openFileFinder});
    Object.assign(window.Gold1V||api,{openPersonalizationStudio,openUtilityCenter,openFileFinder,renderTaskbarPins});
    window.Gold1V=window.Gold1V||api;api.renderStartMenu?.();api.renderDesktop?.();return true;
  }
  function shortcuts(event){
    if(event.defaultPrevented||event.target?.matches?.("input,textarea,select,[contenteditable=true]"))return;
    if(event.metaKey&&event.key.toLowerCase()==="e"){event.preventDefault();core()?.openApp?.("explorer")}
    if(event.metaKey&&event.key.toLowerCase()==="i"){event.preventDefault();core()?.openApp?.("settings")}
    if(event.ctrlKey&&event.altKey&&event.key.toLowerCase()==="u"){event.preventDefault();openUtilityCenter()}
  }
  function init(){
    if(!registerApps()){setTimeout(init,80);return}
    applyDefaultDiscoveryPins();syncShellPreferences();renderTaskbarPins();addGuideTopics();
    document.addEventListener("keydown",shortcuts);
    const observer=new MutationObserver(()=>{clearTimeout(window.__gold1vPinRender);window.__gold1vPinRender=setTimeout(renderTaskbarPins,80)});
    const taskbar=document.getElementById("taskbar");if(taskbar)observer.observe(taskbar,{childList:true});
    const hash=location.hash.slice(1).toLowerCase();if(["themestudio","utilitycenter","filefinder"].includes(hash))setTimeout(()=>core().openApp(hash),1200);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
