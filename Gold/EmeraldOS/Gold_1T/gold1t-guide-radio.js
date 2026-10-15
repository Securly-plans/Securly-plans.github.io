"use strict";
(function EmeraldOSGold1TGuideAndRadio(){
  if(window.__EMERALDOS_GOLD_1T_GUIDE_RADIO__)return;
  window.__EMERALDOS_GOLD_1T_GUIDE_RADIO__=true;
  const VERSION="1T",PREFIX="gold1g_",GUIDE_PREFS=PREFIX+"guide_preferences_1t",RADIO_STATIONS=PREFIX+"radio_stations_1t",RADIO_PREFS=PREFIX+"radio_preferences_1t",PIN_KEY=PREFIX+"guide_default_pins_1t";
  const esc=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const read=(key,fallback)=>{try{const raw=localStorage.getItem(key);return raw===null?fallback:JSON.parse(raw)}catch{return fallback}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return value}catch(error){console.warn("Gold 1T data write failed",key,error);return value}};
  const now=()=>new Date().toISOString();
  const core=()=>window.Gold50||window.Gold1T;
  const notify=(title,body,app="Complete Guide")=>core()?.notify?.(title,body,app);
  const saveVM=()=>{if(window.__GOLD1T_MIGRATION_BLOCK_SAVES__===true)return;setTimeout(()=>window.Gold1T?.saveWorkspaceNow?.(false),0)};
  const openApp=id=>core()?.openApp?.(id);

  const topics=[
    {id:"start",title:"Getting started",group:"Basics",keywords:"first boot update setup guide welcome login shell",summary:"Start the VM, understand the two-stage Shell V2 login, and find your way around.",steps:[
      "Open the Gold Shell and sign in so E.L.S.U.S. can locate your current VM version.",
      "Complete the selected Gold version's own login page. The shell identification does not bypass version authentication.",
      "Use the Start button for every installed application, Search to find apps and files, or the Complete Guide button on the taskbar.",
      "Your files, settings, application data, Registry data, and safe workspace state belong to the version-independent cloud VM."
    ],links:[['settings','Open Settings'],['continuitysettings','Startup & Continuity'],['shellv2test','Shell V2 test']]},
    {id:"desktop",title:"Desktop, Start, taskbar, and Search",group:"Basics",keywords:"desktop start taskbar search pin icons notification clock",summary:"Use the main shell and find applications quickly.",steps:[
      "Double-click a desktop application or file to open it.",
      "Open Start to browse the alphabetical application list and common tiles.",
      "Press F3 or use the taskbar search box to search applications and files without losing keyboard focus.",
      "Use Task View to switch between open windows, and the far-right taskbar strip to show the desktop.",
      "The Complete Guide is pinned to the desktop and taskbar by default."
    ],links:[['home','Gold Home'],['commandpalette','Command Palette'],['settings','Personalization']]},
    {id:"windows",title:"Windows and workspace management",group:"Basics",keywords:"windows move resize minimize maximize snap alt tab task view workspace resume",summary:"Move, resize, snap, switch, and restore application windows.",steps:[
      "Drag a title bar to move a window and drag the lower-right handle to resize it.",
      "Use the title-bar buttons to minimize, maximize, restore, or close a window.",
      "Double-click a title bar to toggle maximize. Use Alt+Tab or Task View to switch windows.",
      "Use Meta/Windows+Arrow where supported to snap the active window.",
      "Enable Resume my workspace in Startup & Continuity to reopen safe applications and restore window positions. Sensitive authentication windows are never restored."
    ],links:[['continuitysettings','Startup & Continuity'],['workspace','My Workspace'],['taskmanager','Task Manager']]},
    {id:"files",title:"Files, folders, and universal compatibility",group:"Files and data",keywords:"files folders explorer compatibility universal id extensions old versions",summary:"Create, organize, open, and migrate files across Gold versions.",steps:[
      "Open File Explorer to browse Desktop, Documents, Downloads, Pictures, Music, Videos, Office, and Recycle Bin.",
      "Create files with File Explorer or Gold Office. Gold 1T normalizes records to the universal Gold file format while retaining legacy IDs and source metadata.",
      "Files from earlier Gold releases remain readable. Conflicting files with different contents are preserved separately instead of overwritten.",
      "Use File Compatibility Center for older formats and Universal File System for normalization, deletion records, and historical recovery."
    ],links:[['explorer','File Explorer'],['compatibility','File Compatibility Center'],['filesystemcenter','Universal File System']]},
    {id:"privacysharing",title:"Privacy, separate user VMs, and file sharing",group:"Files and data",keywords:"privacy separate users share file permissions owner access cloud isolation",summary:"Keep every account private and share only selected files.",steps:[
      "Gold 1T keys cloud storage to the authenticated account ID and marks VM categories private to that owner.",
      "On a shared browser, Gold seals one user's active local cache before another account is restored.",
      "Open Files & Sharing, select one or more exact files, enter the recipient's EmeraldOS username, and create the share.",
      "The recipient can import an independent copy. They cannot browse the owner's folders, preferences, or other VM categories.",
      "Revoke a share from Shared by me. Production Firebase rules must enforce the same owner and recipient checks on the server."
    ],links:[["privacycenter","Privacy & User Isolation"],["filesharing","Files & Sharing"],["notificationpermissions","Notification permissions"]]},
    {id:"delete",title:"Recycle Bin and permanent deletion",group:"Files and data",keywords:"delete trash recycle bin permanent tombstone restore resurrection",summary:"Delete safely without older backups bringing files back.",steps:[
      "Deleting a normal file moves it to Recycle Bin.",
      "Restore a Recycle Bin item to return it to an active folder.",
      "Permanent Delete writes a cloud-compatible deletion tombstone before removing the file.",
      "Tombstones prevent restarts, migrations, older backups, and later updates from silently restoring the deleted item.",
      "Files found only in an old backup are placed in Historical Recovery, where you decide whether to restore them."
    ],links:[['explorer','Open Recycle Bin'],['filesystemcenter','Deletion records'],['backupcenter','Backup & Sync']]},
    {id:"office",title:"Gold Office",group:"Productivity",keywords:"office documents sheets slides forms text editor spreadsheet",summary:"Create and edit VM documents and productivity files.",steps:[
      "Open Gold Office and choose a document, spreadsheet, slide deck, or form.",
      "Save regularly. Office files use Gold-compatible formats stored in the universal file system.",
      "Use File Explorer to move, rename, duplicate, delete, restore, or export Office files.",
      "Use Backup & Sync before major edits when you want an additional restore point."
    ],links:[['office','Gold Office'],['explorer','File Explorer'],['backupcenter','Backup & Sync']]},
    {id:"calendar",title:"Interactive Calendar",group:"Productivity",keywords:"calendar month week agenda events reminders drag reschedule ics",summary:"Schedule events with month, week, and agenda views.",steps:[
      "Open Calendar and choose Month, Week, or Agenda.",
      "Select New event, or double-click a day, to enter a title, date, times, location, description, color, and reminder.",
      "Drag an event to another date in Month view to reschedule it.",
      "Edit or delete an event from its event window. Export Calendar creates a standard ICS file.",
      "Calendar events and view preferences migrate with the cloud VM."
    ],links:[['calendar','Calendar'],['clockapp','Clock'],['focussessions','Focus Sessions']]},
    {id:"communication",title:"Mail, People, and communication",group:"Communication",keywords:"mail people contacts compose support communication",summary:"Use local Gold communication and contact tools.",steps:[
      "Gold Mail stores inbox, sent, draft, and trash data in the VM.",
      "Use People to manage VM contacts and quickly address communication.",
      "Use Support Center to create a support ticket. Availability depends on staff availability.",
      "Emerald Mail and external communication integrations may require their configured services and network access."
    ],links:[['mail','Gold Mail'],['people','People'],['support','Support Center']]},
    {id:"games",title:"Emerald Games",group:"Entertainment",keywords:"games snake mines minesweeper memory scores game mode",summary:"Play built-in games whose progress follows your cloud VM.",steps:[
      "Open Emerald Games from Start, Search, or the default desktop shortcut.",
      "Emerald Snake uses Arrow keys or WASD. Collect gems and avoid the walls and your own trail.",
      "Emerald Mines uses left-click to reveal and right-click to place a flag.",
      "Memory Match tracks moves and completion time.",
      "High scores, wins, and best times are stored with the VM. Game Mode can reduce animations while playing."
    ],links:[['games','Emerald Games'],['snake','Emerald Snake'],['minesweeper','Emerald Mines'],['memory','Memory Match']]},
    {id:"radio",title:"Gold Radio",group:"Entertainment",keywords:"radio fm am internet stream station audio tuner",summary:"Listen to internet streams published by FM or AM stations.",steps:[
      "Open Gold Radio and enter a direct internet audio stream URL supplied by a station.",
      "Choose FM or AM and enter the station frequency as a label so the saved preset is easy to recognize.",
      "Select Play. Browser support depends on the stream format, HTTPS availability, and the station server.",
      "Save working stations as presets; favorites and volume settings follow the cloud VM.",
      "A web browser cannot directly receive over-the-air FM or AM signals without radio hardware. Gold Radio plays internet simulcasts instead."
    ],links:[['radio','Gold Radio'],['media','Media Player'],['settings','Sound settings']]},
    {id:"browser",title:"Browser, media, photos, and capture",group:"Entertainment",keywords:"browser proxy media player photos snipping voice recorder screen",summary:"Open web, media, image, capture, and recording tools.",steps:[
      "Emerald Browser uses the configured proxy/browser service. Some websites may block embedded or proxied use.",
      "Media Player opens supported audio and video sources.",
      "Photos displays image files stored in the VM.",
      "Snipping Tool and Voice Recorder require browser permissions. Permission prompts are controlled by the browser and site security settings."
    ],links:[['browser','Emerald Browser'],['media','Media Player'],['photos','Photos'],['snipping','Snipping Tool'],['voicerecorder','Voice Recorder']]},
    {id:"quick",title:"Quick Settings and notifications",group:"Settings",keywords:"quick settings brightness volume focus assist night light wifi notifications action center",summary:"Control common settings without opening the full Settings app.",steps:[
      "Open Quick Settings from the taskbar.",
      "Adjust brightness and volume, toggle Focus Assist, Night Light, dark mode, transparency, quiet startup, and update alerts.",
      "Only updates, support, security, emergency, and critical notices can notify by default. Use Notification Permissions to grant Can-Notify access to other apps.",
      "Action Center stores allowed notifications even when startup calm mode suppresses banners.",
      "Critical security, migration, account, emergency, and failure alerts are never hidden by calm mode."
    ],links:[['continuitysettings','Startup & Continuity'],['settings','Settings'],['focussessions','Focus Sessions']]},
    {id:"settings",title:"Settings and personalization",group:"Settings",keywords:"settings personalization theme accent wallpaper taskbar display sound mouse keyboard apps accounts",summary:"Customize appearance, input, applications, account, and system behavior.",steps:[
      "Open Settings and use the left navigation to select a category.",
      "Personalization controls theme, accent, wallpaper, transparency, taskbar labels, search mode, and taskbar location.",
      "System controls display, sound, power, and other VM behavior. Apps controls defaults, startup, and custom logos.",
      "Account pages provide password change and Account History. Settings are saved with the cloud VM."
    ],links:[['settings','Settings'],['accessibility','Accessibility Center'],['continuitysettings','Startup & Continuity']]},
    {id:"accessibility",title:"Accessibility",group:"Settings",keywords:"accessibility text scale contrast motion cursor focus keyboard",summary:"Adjust Gold for easier reading and interaction.",steps:[
      "Open Accessibility Center or Settings > Accessibility.",
      "Adjust text scale, high contrast, reduced motion, focus indicators, cursor size, and larger pointer targets.",
      "Changes apply to the VM interface and migrate with your account.",
      "Browser zoom and operating-system accessibility features can be used alongside Gold's controls."
    ],links:[['accessibility','Accessibility Center'],['settings','Settings']]},
    {id:"account",title:"Password, account security, and history",group:"Account and security",keywords:"password change login history account logs security history",summary:"Change credentials and review account activity.",steps:[
      "Open Settings > Accounts > Change password.",
      "Enter the current password, then enter and confirm a new password of at least eight characters.",
      "Gold verifies the current credential and writes only the SHA-256 password hash. Passwords are not added to history.",
      "Open Account History to review login, update, security, VM startup, password, and general account events.",
      "Export history as JSON when you need a portable audit record."
    ],links:[['passwordchange','Change password'],['accounthistory','Account History'],['security','Security Center']]},
    {id:"cloud",title:"Cloud VM and pick-up-where-you-left-off",group:"Files and data",keywords:"cloud vm pickup where left off save restore sync workspace continuity",summary:"Understand how the same workspace follows the signed-in user.",steps:[
      "Gold stores the shared VM under emeraldOSUsers/{user}/goldVM/current when Firebase is configured.",
      "Migration reads previous supported schemas before the new release is allowed to save over the shared VM.",
      "The VM includes files, folders, preferences, Registry data, app data, mail, Calendar, games, guide settings, radio presets, deletion records, and safe workspace state.",
      "Use Save workspace now before signing out or changing devices when you want an immediate cloud checkpoint.",
      "Startup & Continuity controls whether safe windows reopen."
    ],links:[['continuitysettings','Startup & Continuity'],['backupcenter','Backup & Sync'],['migrationcenter','Migration & Continuity']]},
    {id:"updates",title:"E.L.S.U.S. updates and rollback",group:"System administration",keywords:"elsus update shell latest version optional rollback publisher",summary:"Check and install staff-published versions without losing the VM.",steps:[
      "Open System Update to read the shared staff-published release pointer.",
      "When an update is available, choose Update now, View details, or Later. Optional updates are never installed automatically.",
      "Gold saves the VM and returns control to the original E.L.S.U.S. shell, which routes to the selected version.",
      "Update Setup describes new features and offers to open the Complete Guide.",
      "Rollback is limited and should be used only when necessary because newer data formats may not be fully understood by older releases."
    ],links:[['updateshell','System Update'],['updatehistory','Update History'],['elsusstatus','E.L.S.U.S. Status']]},
    {id:"backups",title:"Backups, restore points, and recovery",group:"Files and data",keywords:"backup restore import export snapshots recovery historical",summary:"Create backups and recover data without unsafe replacement.",steps:[
      "Use Backup & Sync to create a restore point or download a VM backup.",
      "Imports use merge behavior so current data is not blindly erased.",
      "Use Restore Center for VM-level recovery and Universal File System for historical file candidates.",
      "Deletion tombstones remain authoritative so a backup cannot restore a file you permanently deleted after that backup was created."
    ],links:[['backupcenter','Backup & Sync'],['restore','Restore Center'],['filesystemcenter','Historical Recovery']]},
    {id:"developer",title:"Developer tools, Store, and user applications",group:"Applications",keywords:"developer user apps javascript store verify logos startup",summary:"Create, install, verify, and manage VM applications.",steps:[
      "Use Developer tools to create supported user applications.",
      "Use Gold Store to browse or install available applications.",
      "Only install code you trust; user applications can read or change VM data available to them.",
      "Staff app verification records reviewed applications. Custom application logos are saved with the VM.",
      "Startup applications can be disabled by booting Safe Mode."
    ],links:[['developer','Developer'],['store','Gold Store'],['appverification','App Verification']]},
    {id:"registry",title:"Registry, Control Panel, and system tools",group:"System administration",keywords:"registry hkey control panel terminal task manager system info",summary:"Use advanced virtual system-management tools.",steps:[
      "Registry Editor changes EmeraldOS virtual configuration only; it cannot access the host computer's Windows Registry.",
      "HKEY_LOCAL_MACHINE changes require verified Staff Edition.",
      "Control Panel provides classic access to system categories. Task Manager shows running Gold applications.",
      "Terminal provides supported virtual commands. System Information and System Health report VM status."
    ],links:[['regedit','Registry Editor'],['control','Control Panel'],['taskmanager','Task Manager'],['terminal','Terminal'],['systemhealth','System Health']]},
    {id:"support",title:"Support and live staff control",group:"Support",keywords:"support ticket live staff control screen desktop remote permission",summary:"Request help and understand staff-control permissions.",steps:[
      "Open Support Center and submit a ticket with clear reproduction steps.",
      "Live Staff Control requires a verified staff session and user permission.",
      "The live-control banner indicates when viewing or control is active.",
      "Do not approve remote control unless you recognize the support session and understand what will be accessed.",
      "Support availability depends on staff availability."
    ],links:[['support','Support Center'],['livecontrol','Live Staff Control'],['staffcenter','Staff Center']]},
    {id:"staff",title:"Staff Edition and publishing",group:"System administration",keywords:"staff edition emerald mail verification publisher pin publish latest",summary:"Understand protected staff-only functions.",steps:[
      "Open Staff Edition with F9 or the taskbar Staff button and complete the required verification.",
      "Staff Center includes authorized support, live-control, app-verification, and administrative tools.",
      "Publishing a version requires a verified Staff Edition session, Emerald Mail verification, the correct publisher PIN, and an explicit click on Publish this Version.",
      "Boot, login, migration, query strings, first boot, normal update checks, and Shell V2 cannot publish a release."
    ],links:[['staffcenter','Staff Center'],['appverification','App Verification'],['updatepublisher','Update Publisher Manager']]},
    {id:"shortcuts",title:"Keyboard shortcuts",group:"Basics",keywords:"keyboard shortcuts f1 f3 f9 f12 alt tab win r win v ctrl shift esc",summary:"Use faster keyboard navigation.",steps:[
      "F1 opens the Complete Guide. F3 opens Search. F9 opens Staff Edition. F12 opens BIOS/DOS.",
      "Alt+Tab switches applications. Ctrl+Shift+Esc opens Task Manager.",
      "Meta/Windows+R opens Run. Meta/Windows+V opens Clipboard Manager.",
      "Ctrl+Space opens Command Palette. Ctrl+Alt+L signs out.",
      "Escape closes open shell panels."
    ],links:[['commandpalette','Command Palette'],['taskmanager','Task Manager']]},
    {id:"troubleshooting",title:"Troubleshooting",group:"Support",keywords:"troubleshoot app not open missing files migration offline quota browser permissions",summary:"Resolve common VM, browser, cloud, and application problems.",steps:[
      "If an app does not open, close duplicate windows, refresh the VM, and check System Health.",
      "If cloud data is missing, do not create replacement files immediately. Open Migration & Continuity and Universal File System first.",
      "If storage is full, export large files, clear temporary data, and use Storage settings. Do not manually remove tombstone data.",
      "If media, radio, microphone, screen capture, or proxy content fails, check HTTPS, browser permissions, CORS, stream format, and the external service status.",
      "Use Safe Mode if a user startup application prevents normal boot, then disable that startup app."
    ],links:[['systemhealth','System Health'],['migrationcenter','Migration & Continuity'],['storage','Storage'],['support','Support Center']]}
  ];

  function guidePrefs(){return {lastTopic:"start",favorites:[],showAtUpdate:true,showAtFirstBoot:true,...read(GUIDE_PREFS,{})}}
  function setGuidePrefs(next){const value={...guidePrefs(),...next};write(GUIDE_PREFS,value);saveVM();return value}
  function topicById(id){return topics.find(t=>t.id===id)||topics[0]}
  function renderTopic(topic){return `<article class="gold1t-guide-article"><div class="gold1t-guide-heading"><div><small>${esc(topic.group)}</small><h1>${esc(topic.title)}</h1><p>${esc(topic.summary)}</p></div><button class="button" id="guideFavorite">${guidePrefs().favorites.includes(topic.id)?"Remove favorite":"Add favorite"}</button></div><ol>${topic.steps.map(step=>`<li>${esc(step)}</li>`).join("")}</ol>${topic.links?.length?`<section class="card"><h2>Open related tools</h2><div class="button-row">${topic.links.map(([id,label])=>`<button class="button" data-guide-app="${esc(id)}">${esc(label)}</button>`).join("")}</div></section>`:""}</article>`}
  function openGuide(startTopic){
    const initial=topicById(startTopic||guidePrefs().lastTopic);
    const html=`<div class="app-shell gold1t-guide"><div class="app-toolbar"><input id="guideSearch" class="field" placeholder="Search the complete guide" aria-label="Search the complete guide"><button id="guideHome" class="button">Getting started</button><button id="guideExport" class="button">Export guide index</button></div><div class="gold1t-guide-layout"><nav id="guideNav" aria-label="Guide topics"></nav><main id="guideContent"></main></div></div>`;
    const win=core().openWindow("guide","EmeraldOS Gold Complete Guide",html,{width:1080,height:720});
    const nav=win.querySelector("#guideNav"),content=win.querySelector("#guideContent"),search=win.querySelector("#guideSearch");
    let selected=initial.id;
    const renderNav=(query="")=>{const q=query.trim().toLowerCase(),groups=[...new Set(topics.map(t=>t.group))];nav.innerHTML=groups.map(group=>{const matches=topics.filter(t=>t.group===group&&(!q||`${t.title} ${t.summary} ${t.keywords} ${t.steps.join(" ")}`.toLowerCase().includes(q)));return matches.length?`<section><h3>${esc(group)}</h3>${matches.map(t=>`<button data-guide-topic="${t.id}" class="${selected===t.id?"active":""}"><b>${esc(t.title)}</b><small>${esc(t.summary)}</small></button>`).join("")}</section>`:""}).join("")||'<p class="muted">No guide topics matched.</p>';nav.querySelectorAll("[data-guide-topic]").forEach(button=>button.onclick=()=>show(button.dataset.guideTopic));};
    const show=id=>{selected=topicById(id).id;setGuidePrefs({lastTopic:selected});content.innerHTML=renderTopic(topicById(selected));renderNav(search.value);content.scrollTop=0;content.querySelectorAll("[data-guide-app]").forEach(button=>button.onclick=()=>openApp(button.dataset.guideApp));content.querySelector("#guideFavorite").onclick=()=>{const p=guidePrefs(),set=new Set(p.favorites);set.has(selected)?set.delete(selected):set.add(selected);setGuidePrefs({favorites:[...set]});show(selected)}};
    search.oninput=()=>renderNav(search.value);search.onkeydown=e=>{if(e.key==="Enter")nav.querySelector("[data-guide-topic]")?.click()};win.querySelector("#guideHome").onclick=()=>show("start");win.querySelector("#guideExport").onclick=()=>core().saveText?.("EmeraldOS-Gold-1T-Complete-Guide-Index.txt",topics.map(t=>`${t.group} - ${t.title}\n${t.summary}\n${t.steps.map((s,i)=>`${i+1}. ${s}`).join("\n")}\n`).join("\n"));renderNav();show(selected);return win;
  }

  function defaultStations(){return []}
  function stations(){const value=read(RADIO_STATIONS,null);return Array.isArray(value)?value:defaultStations()}
  function saveStations(value){write(RADIO_STATIONS,value);saveVM();return value}
  function radioPrefs(){return {volume:.75,lastStationId:"",band:"FM",frequency:"",...read(RADIO_PREFS,{})}}
  function setRadioPrefs(next){const value={...radioPrefs(),...next};write(RADIO_PREFS,value);saveVM();return value}
  function stationLabel(station){return `${station.band||"FM"}${station.frequency?` ${station.frequency}`:""} — ${station.name||"Saved station"}`}
  function openRadio(){
    const p=radioPrefs(),list=stations();
    const html=`<div class="app-shell gold1t-radio"><div class="app-toolbar"><button id="radioPlay" class="button primary">Play</button><button id="radioStop" class="button">Stop</button><span id="radioStatus">Stopped</span><span class="spacer"></span><label>Volume <input id="radioVolume" type="range" min="0" max="1" step="0.01" value="${Number(p.volume)||.75}"></label></div><div class="app-body"><div class="gold1t-page-title"><div><h1>Gold Radio</h1><p>Listen to internet simulcasts from FM and AM stations, or any compatible direct audio stream.</p></div><span class="gold1t-radio-badge">Internet radio</span></div><div class="grid2"><section class="card"><h2>Tuner</h2><div class="grid2"><label>Band<select id="radioBand"><option value="FM" ${p.band!=="AM"?"selected":""}>FM</option><option value="AM" ${p.band==="AM"?"selected":""}>AM</option><option value="Internet" ${p.band==="Internet"?"selected":""}>Internet</option></select></label><label>Frequency or channel<input id="radioFrequency" class="field" value="${esc(p.frequency||"")}" placeholder="101.1 or 880"></label></div><label>Station name<input id="radioName" class="field" placeholder="Station name"></label><label>Direct HTTPS audio stream URL<input id="radioUrl" class="field" type="url" placeholder="https://station.example/live.mp3"></label><div class="button-row"><button id="radioTune" class="button primary">Tune</button><button id="radioSave" class="button">Save preset</button></div><p class="muted">The browser cannot receive over-the-air radio without hardware. Use a direct internet stream provided by the station. Some streams may fail because of unsupported formats, HTTP-only links, CORS, geographic restrictions, or station downtime.</p></section><section class="card"><h2>Saved stations</h2><div id="radioStations" class="gold1t-radio-stations"></div></section></div><section class="card"><h2>Now playing</h2><div id="radioNowPlaying">No station selected.</div><audio id="radioAudio" preload="none"></audio></section></div></div>`;
    const win=core().openWindow("radio","Gold Radio",html,{width:940,height:680}),audio=win.querySelector("#radioAudio"),status=win.querySelector("#radioStatus"),nowPlaying=win.querySelector("#radioNowPlaying");let currentUrl="",currentId="";
    audio.volume=Math.max(0,Math.min(1,Number(p.volume)||.75));
    const render=()=>{const current=stations();win.querySelector("#radioStations").innerHTML=current.map(st=>`<div class="gold1t-radio-station ${st.id===currentId?"active":""}"><button data-radio-load="${esc(st.id)}"><b>${esc(stationLabel(st))}</b><small>${esc(st.url)}</small></button><button data-radio-delete="${esc(st.id)}" class="button danger">Delete</button></div>`).join("")||'<p class="muted">No saved stations. Enter a direct stream URL and save it as a preset.</p>';win.querySelectorAll("[data-radio-load]").forEach(button=>button.onclick=()=>loadStation(button.dataset.radioLoad,true));win.querySelectorAll("[data-radio-delete]").forEach(button=>button.onclick=()=>{const item=stations().find(x=>x.id===button.dataset.radioDelete);if(item&&confirm(`Delete preset ${item.name}?`)){saveStations(stations().filter(x=>x.id!==item.id));if(currentId===item.id)stop();render()}})};
    const updateFields=station=>{win.querySelector("#radioBand").value=station.band||"Internet";win.querySelector("#radioFrequency").value=station.frequency||"";win.querySelector("#radioName").value=station.name||"";win.querySelector("#radioUrl").value=station.url||""};
    const loadStation=(id,playNow=false)=>{const item=stations().find(x=>x.id===id);if(!item)return;currentId=item.id;currentUrl=item.url;updateFields(item);nowPlaying.innerHTML=`<b>${esc(stationLabel(item))}</b><br><small>${esc(item.url)}</small>`;setRadioPrefs({lastStationId:item.id,band:item.band,frequency:item.frequency});render();if(playNow)play()};
    const tune=()=>{const url=win.querySelector("#radioUrl").value.trim();if(!/^https:\/\//i.test(url)){notify("A secure stream URL is required","Gold Radio accepts direct HTTPS audio stream URLs.","Gold Radio");return false}currentUrl=url;currentId="";const station={band:win.querySelector("#radioBand").value,frequency:win.querySelector("#radioFrequency").value.trim(),name:win.querySelector("#radioName").value.trim()||"Unsaved station",url};nowPlaying.innerHTML=`<b>${esc(stationLabel(station))}</b><br><small>${esc(url)}</small>`;setRadioPrefs({band:station.band,frequency:station.frequency});render();return true};
    const play=async()=>{if(!currentUrl&&!tune())return;try{if(audio.src!==currentUrl)audio.src=currentUrl;status.textContent="Connecting…";await audio.play();status.textContent="Playing"}catch(error){status.textContent="Could not play";notify("Radio stream could not play",error.message||"Check the stream URL and browser support.","Gold Radio")}};
    const stop=()=>{audio.pause();audio.removeAttribute("src");audio.load();status.textContent="Stopped"};
    win.querySelector("#radioTune").onclick=()=>{if(tune())play()};win.querySelector("#radioPlay").onclick=play;win.querySelector("#radioStop").onclick=stop;win.querySelector("#radioVolume").oninput=e=>{audio.volume=Number(e.target.value);setRadioPrefs({volume:audio.volume})};win.querySelector("#radioSave").onclick=()=>{if(!tune())return;const item={id:`station_${Date.now().toString(36)}`,name:win.querySelector("#radioName").value.trim()||"Saved station",band:win.querySelector("#radioBand").value,frequency:win.querySelector("#radioFrequency").value.trim(),url:currentUrl,createdAt:now(),favorite:true};saveStations([...stations(),item]);currentId=item.id;setRadioPrefs({lastStationId:item.id});render();notify("Station saved",stationLabel(item),"Gold Radio")};audio.addEventListener("playing",()=>status.textContent="Playing");audio.addEventListener("waiting",()=>status.textContent="Buffering…");audio.addEventListener("error",()=>status.textContent="Stream error");if(p.lastStationId)loadStation(p.lastStationId,false);render();return win;
  }

  function ensureApp(app){const apps=core()?.APPS;if(!Array.isArray(apps))return false;const existing=apps.find(item=>item.id===app.id);if(existing)Object.assign(existing,app);else apps.push(app);return true}
  function ensureGames(){
    const api=window.Gold1T||core();
    ensureApp({id:"games",name:"Emerald Games",label:"GM",color:"#107c10",group:"Games",desc:"Open built-in EmeraldOS games and view saved scores.",open:()=>api.openGameCenter?.()});
    // The experience module owns the individual game implementations. These entries are
    // retained when already registered and are only repaired if another release omitted them.
    const aliases={snake:"Emerald Snake",minesweeper:"Emerald Mines",memory:"Memory Match"};
    Object.entries(aliases).forEach(([id,name])=>{const existing=core().APPS.find(app=>app.id===id);if(existing)return;ensureApp({id,name,label:name.split(" ").map(x=>x[0]).join("").slice(0,2),color:id==="snake"?"#107c10":id==="minesweeper"?"#d83b01":"#5c2d91",group:"Games",desc:"Built-in EmeraldOS Gold game.",open:()=>api.openGameCenter?.()})});
  }
  function applyDefaultPins(){
    if(localStorage.getItem(PIN_KEY)==="true")return;
    const p=core().prefs?.()||{},desktop=Array.isArray(p.desktopApps)?[...p.desktopApps]:["explorer","office","mail","settings","updateshell","support"];
    for(const id of ["guide","games"])if(!desktop.includes(id))desktop.push(id);
    core().setPrefs?.({...p,desktopApps:desktop});localStorage.setItem(PIN_KEY,"true");
  }
  function bindTaskbar(){const button=document.getElementById("guideTaskbarBtn");if(button){button.onclick=()=>openGuide();button.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();openGuide()}}}}
  function init(){
    if(!core()?.APPS){setTimeout(init,80);return}
    ensureApp({id:"guide",name:"Complete Guide",label:"GD",color:"#0067b8",group:"System",desc:"Searchable instructions for every EmeraldOS Gold VM feature.",open:openGuide});
    ensureApp({id:"radio",name:"Gold Radio",label:"RA",color:"#744da9",group:"Media",desc:"Play saved internet simulcasts from FM and AM stations.",open:openRadio});
    ensureGames();
    Object.assign(window.Gold1T||core(),{openGuide,openCompleteGuide:openGuide,openRadio,guideTopics:topics,radioStations:stations});
    window.Gold1T=window.Gold1T||core();
    applyDefaultPins();bindTaskbar();core().renderStartMenu?.();core().renderDesktop?.();
    const hash=location.hash.slice(1).toLowerCase();if(["guide","helpguide","radio","games"].includes(hash))setTimeout(()=>openApp(hash==="helpguide"?"guide":hash),1300);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
