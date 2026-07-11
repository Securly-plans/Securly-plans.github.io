"use strict";

/* =========================================================
   EmeraldOS Gold 1.0
   Independent Windows 10-inspired EmeraldOS Gold model.
   No dependency on EmeraldOS Silver shell files.
========================================================= */
(function(){
  const BUILD = {
    name: "EmeraldOS Gold 1.0",
    version: "Gold Release 1.0",
    prefix: "gold10_",
    cloudPath: "gold10"
  };

  const LS = {
    prefs: BUILD.prefix + "prefs",
    files: BUILD.prefix + "files",
    docs: BUILD.prefix + "docs",
    sheets: BUILD.prefix + "sheets",
    slides: BUILD.prefix + "slides",
    forms: BUILD.prefix + "forms",
    mail: BUILD.prefix + "mail",
    chat: BUILD.prefix + "chat",
    people: BUILD.prefix + "people",
    apps: BUILD.prefix + "userApps",
    notifications: BUILD.prefix + "notifications",
    session: BUILD.prefix + "session",
    activity: BUILD.prefix + "activity",
    virtualDesktops: BUILD.prefix + "virtualDesktops",
    setupDone: BUILD.prefix + "setupDone"
  };

  const ICONS = {
    home:["HM","logo-blue"], explorer:["EX","logo-blue"], office:["OF","logo-green"], docs:["DC","logo-green"], sheets:["SH","logo-green"], slides:["SL","logo-orange"], forms:["FM","logo-purple"], mail:["ML","logo-teal"], chat:["CH","logo-purple"], people:["PE","logo-pink"], store:["ST","logo-blue"], creator:["CR","logo-purple"], settings:["SE","logo-gray"], control:["CP","logo-gray"], action:["AC","logo-orange"], taskview:["TV","logo-blue"], search:["SR","logo-blue"], widgets:["WG","logo-teal"], timeline:["TL","logo-blue"], restore:["RS","logo-teal"], update:["UP","logo-blue"], device:["DL","logo-teal"], security:["SC","logo-red"], media:["MD","logo-orange"], help:["?","logo-gray"], profile:["US","logo-pink"], calculator:["CA","logo-blue"], notepad:["NP","logo-teal"], photos:["PH","logo-orange"], calendar:["CL","logo-purple"], weather:["WE","logo-teal"], alarms:["AL","logo-red"], browser:["BR","logo-blue"], camera:["CM","logo-gray"], feedback:["FB","logo-green"], maps:["MP","logo-green"], news:["NW","logo-orange"], app:["AP","logo-purple"]
  };

  const APPS = [
    {id:"home",name:"Gold Home",group:"Workspace",icon:"home",desktop:true,tile:true,desc:"Dashboard, quick actions, status, and recent activity.",open:()=>openHome()},
    {id:"explorer",name:"File Explorer",group:"Core",icon:"explorer",desktop:true,tile:true,desc:"Folders, documents, recent files, starred files, trash, and previews.",open:()=>openExplorer()},
    {id:"office",name:"Gold Office",group:"Productivity",icon:"office",desktop:true,tile:true,desc:"Docs, Sheets, Slides, Forms, templates, and Drive-style workspace.",open:()=>openOffice()},
    {id:"mail",name:"Gold Mail",group:"Communication",icon:"mail",desktop:true,tile:true,desc:"Inbox, sent, drafts, trash, compose, and unread notifications.",open:()=>openMail()},
    {id:"chat",name:"Gold Chat",group:"Communication",icon:"chat",desktop:true,desc:"Rooms, direct messages, unread alerts, and chat history.",open:()=>openChat()},
    {id:"people",name:"People",group:"Communication",icon:"people",desktop:true,desc:"Contacts, user directory, favorites, and blocking.",open:()=>openPeople()},
    {id:"store",name:"Store",group:"Apps",icon:"store",desktop:true,tile:true,desc:"User apps, installable packages, app warnings, and library.",open:()=>openStore()},
    {id:"creator",name:"Creator Studio",group:"Apps",icon:"creator",desktop:true,desc:"Application Editor, Code Studio, app templates, and user app publishing.",open:()=>openCreator()},
    {id:"settings",name:"Settings",group:"System",icon:"settings",desktop:true,tile:true,desc:"Modern settings for account, system, personalization, apps, and privacy.",open:()=>openSettings()},
    {id:"control",name:"Control Panel",group:"System",icon:"control",desc:"Classic management shortcuts and advanced system tools.",open:()=>openControlPanel()},
    {id:"action",name:"Action Center",group:"System",icon:"action",desc:"Universal notifications and quick settings.",open:()=>openActionCenterWindow()},
    {id:"taskview",name:"Task View",group:"System",icon:"taskview",desc:"Open windows, virtual desktops, and timeline.",open:()=>openTaskViewWindow()},
    {id:"search",name:"Gold Search",group:"System",icon:"search",desc:"Search apps, settings, files, people, mail, and documents.",open:()=>openSearchWindow()},
    {id:"widgets",name:"Widgets",group:"System",icon:"widgets",desc:"Clock, notes, storage, calendar, status, and quick cards.",open:()=>openWidgetsWindow()},
    {id:"timeline",name:"Timeline",group:"System",icon:"timeline",desc:"Recently opened apps and actions.",open:()=>openTimeline()},
    {id:"restore",name:"Restore Center",group:"System",icon:"restore",desktop:true,tile:true,desc:"Save and restore your cloud workspace across devices.",open:()=>openRestore()},
    {id:"update",name:"Update Center",group:"System",icon:"update",desc:"Version notes, update checks, and maintenance tools.",open:()=>openUpdateCenter()},
    {id:"device",name:"Device Link",group:"System",icon:"device",desc:"Device info, browser details, and sync identity.",open:()=>openDeviceLink()},
    {id:"security",name:"Security Center",group:"System",icon:"security",desc:"Privacy, app warnings, blocked users, and safe mode controls.",open:()=>openSecurity()},
    {id:"media",name:"Media Center",group:"Media",icon:"media",desc:"Media library, gallery, playlists, and viewer.",open:()=>openMedia()},
    {id:"profile",name:"User Profile",group:"Account",icon:"profile",desc:"Profile, username, mail address, and status.",open:()=>openProfile()},
    {id:"calculator",name:"Gold Calculator",group:"Built-in Apps",icon:"calculator",desktop:true,tile:true,desc:"A clean desktop calculator styled like a built-in Gold app.",open:()=>openGoldCalculator()},
    {id:"notepad",name:"Gold Notepad",group:"Built-in Apps",icon:"notepad",desktop:true,tile:true,desc:"Fast notes, autosave, export, and simple editing.",open:()=>openGoldNotepad()},
    {id:"photos",name:"Gold Photos",group:"Built-in Apps",icon:"photos",desktop:true,tile:true,desc:"Photo gallery, album cards, and image preview workspace.",open:()=>openGoldPhotos()},
    {id:"calendar",name:"Gold Calendar",group:"Built-in Apps",icon:"calendar",desktop:true,tile:true,desc:"Calendar, agenda, event list, and reminders.",open:()=>openGoldCalendar()},
    {id:"weather",name:"Gold Weather",group:"Built-in Apps",icon:"weather",desc:"Weather-style dashboard with saved locations and notes.",open:()=>openGoldWeather()},
    {id:"alarms",name:"Gold Alarms & Clock",group:"Built-in Apps",icon:"alarms",desc:"Clock, alarms, timers, and reminders.",open:()=>openGoldAlarms()},
    {id:"browser",name:"Gold Browser",group:"Built-in Apps",icon:"browser",desktop:true,tile:true,desc:"Safe internal browser launcher and web shortcut manager.",open:()=>openGoldBrowser()},
    {id:"camera",name:"Gold Camera",group:"Built-in Apps",icon:"camera",desc:"Camera placeholder, capture notes, and media records.",open:()=>openGoldCamera()},
    {id:"feedback",name:"Feedback Hub",group:"Support",icon:"feedback",desc:"Send bugs, ideas, ratings, and system feedback.",open:()=>openGoldFeedback()},
    {id:"maps",name:"Gold Maps",group:"Built-in Apps",icon:"maps",desc:"Saved places and route notes workspace.",open:()=>openGoldMaps()},
    {id:"news",name:"Gold News",group:"Built-in Apps",icon:"news",desc:"Local announcement and update reader.",open:()=>openGoldNews()},
    {id:"help",name:"Help and Support",group:"Support",icon:"help",desc:"Guides, keyboard shortcuts, troubleshooting, and about Gold 1.0.",open:()=>openHelp()}
  ];

  const state = { z: 1000, windows: [], activeId: null, firebase: null, warningAccepted:false };

  function $(id){return document.getElementById(id);}
  function esc(v){return String(v ?? "").replace(/[&<>'"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));}
  function id(){return "id_" + Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4);}
  function username(){return localStorage.getItem("username") || localStorage.getItem("40_username") || "GoldUser";}
  function mailAddress(){return username().toLowerCase().replace(/[^a-z0-9._-]/g,".") + "@gold.mail";}
  function now(){return new Date().toISOString();}
  function fmt(iso){try{return new Date(iso).toLocaleString();}catch{return "";}}
  function readJSON(key,fallback){try{return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));}catch{return fallback;}}
  function writeJSON(key,val){localStorage.setItem(key,JSON.stringify(val));}

  function prefs(){return readJSON(LS.prefs,{theme:"dark",accent:"#0078d4",desktopIcons:["home","explorer","office","mail","chat","people","store","creator","settings","restore","calculator","notepad","photos","calendar","browser"],iconSize:"normal",density:"normal",wallpaper:"default",taskbarLabels:true,restoreOnBoot:true,notifications:true,focusAssist:false,widgets:true,showSeconds:false});}
  function setPrefs(next){const p={...prefs(),...next}; writeJSON(LS.prefs,p); applyPrefs(); scheduleSave();}
  function files(){return readJSON(LS.files,seedFiles());}
  function setFiles(v){writeJSON(LS.files,v); scheduleSave();}
  function docs(){return readJSON(LS.docs,seedDocs());}
  function setDocs(v){writeJSON(LS.docs,v); scheduleSave();}
  function sheets(){return readJSON(LS.sheets,seedSheets());}
  function setSheets(v){writeJSON(LS.sheets,v); scheduleSave();}
  function slides(){return readJSON(LS.slides,seedSlides());}
  function setSlides(v){writeJSON(LS.slides,v); scheduleSave();}
  function forms(){return readJSON(LS.forms,seedForms());}
  function setForms(v){writeJSON(LS.forms,v); scheduleSave();}
  function mail(){return readJSON(LS.mail,seedMail());}
  function setMail(v){writeJSON(LS.mail,v); scheduleSave();}
  function chat(){return readJSON(LS.chat,seedChat());}
  function setChat(v){writeJSON(LS.chat,v); scheduleSave();}
  function people(){return readJSON(LS.people,seedPeople());}
  function setPeople(v){writeJSON(LS.people,v); scheduleSave();}
  function userApps(){return readJSON(LS.apps,seedApps());}
  function setUserApps(v){writeJSON(LS.apps,v); scheduleSave();}
  function notifications(){return readJSON(LS.notifications,[]);}
  function setNotifications(v){writeJSON(LS.notifications,v.slice(0,250)); updateActionButton(); scheduleSave();}
  function activity(){return readJSON(LS.activity,[]);}
  function setActivity(v){writeJSON(LS.activity,v.slice(0,200)); scheduleSave();}
  function session(){return readJSON(LS.session,{lastSaved:null,lastRestored:null,openApps:[],recentApps:[],device:navigator.userAgent.slice(0,100),product:BUILD.name});}
  function setSession(v){writeJSON(LS.session,{...session(),...v,product:BUILD.name});}

  function seedFiles(){return [
    {id:id(),name:"Documents",type:"folder",parent:null,star:false,trash:false,created:now(),updated:now()},
    {id:id(),name:"Pictures",type:"folder",parent:null,star:false,trash:false,created:now(),updated:now()},
    {id:id(),name:"Welcome to Gold 1.0.txt",type:"text",parent:null,star:true,trash:false,content:"Welcome to EmeraldOS Gold 1.0. This is an independent Windows 10-inspired EmeraldOS model with its own shell, settings, apps, restore system, and local/cloud workspace.",created:now(),updated:now()},
    {id:id(),name:"Getting Started.edoc",type:"edoc",parent:null,star:false,trash:false,content:"Gold 1.0 Getting Started\n\nOpen Start, Search, Task View, Action Center, File Explorer, Office, Mail, Chat, Store, and Creator Studio.",created:now(),updated:now()}
  ];}
  function seedDocs(){return [{id:id(),name:"Project Notes.edoc",content:"Project Notes\n\nUse Gold Office to edit documents, sheets, slides, and forms.",updated:now(),star:true},{id:id(),name:"Announcement Draft.edoc",content:"Announcement\n\nEmeraldOS Gold 1.0 is ready for testing.",updated:now(),star:false}];}
  function seedSheets(){return [{id:id(),name:"Budget.esheet",cells:[["Item","Cost","Status"],["Hosting","0","Free"],["Storage","0","Testing"]],updated:now()}];}
  function seedSlides(){return [{id:id(),name:"Gold 1.0 Overview.eslide",slides:[{title:"EmeraldOS Gold 1.0",body:"Independent shell, modern taskbar, Action Center, Task View, Settings, Explorer, Office, Mail, and Restore."}],updated:now()}];}
  function seedForms(){return [{id:id(),name:"Feedback Form.eform",questions:["What works well?","What should be improved?"],responses:[],updated:now()}];}
  function seedMail(){return [
    {id:id(),folder:"inbox",from:"system@gold.mail",to:mailAddress(),subject:"Welcome to Gold Mail",body:"This internal mail app supports inbox, sent, drafts, trash, reply, unread status, and notifications.",read:false,date:now()},
    {id:id(),folder:"sent",from:mailAddress(),to:"demo@gold.mail",subject:"Test Sent Message",body:"This is a sample sent email.",read:true,date:now()}
  ];}
  function seedChat(){return {rooms:[{id:"general",name:"General",messages:[{id:id(),from:"System",body:"Welcome to Gold Chat.",date:now()}]}],active:"general"};}
  function seedPeople(){return [{id:id(),username:username(),displayName:username(),favorite:true,blocked:false,status:"Available",mail:mailAddress()},{id:id(),username:"system",displayName:"Gold System",favorite:true,blocked:false,status:"Online",mail:"system@gold.mail"},{id:id(),username:"demo",displayName:"Demo User",favorite:false,blocked:false,status:"Away",mail:"demo@gold.mail"}];}
  function seedApps(){return [{id:id(),name:"Sample Dashboard",label:"DASH",description:"A sample installed user app.",code:"api.setTitle('Sample Dashboard'); api.write('<h2>Sample Dashboard</h2><p>This is an installed Gold 1.0 user app.</p>'); api.button('Notify',()=>api.notify('Sample Dashboard','Custom app notification works.'));",installed:now(),permissions:["notifications","localStorage"]}];}

  function logoHTML(iconKey,cls=""){
    const [txt,color]=ICONS[iconKey] || ICONS.app;
    return `<div class="app-logo ${color} ${cls}"><span>${esc(txt)}</span></div>`;
  }
  function appById(appId){return APPS.find(a=>a.id===appId);} 
  function addActivity(title,details=""){const list=activity(); list.unshift({id:id(),title,details,date:now()}); setActivity(list);}
  function notify(title,body,source="Gold 1.0",level="info"){
    if(!prefs().notifications || prefs().focusAssist) return;
    const list=notifications();
    const n={id:id(),title,body,source,level,read:false,date:now()};
    list.unshift(n); setNotifications(list);
    const toast=document.createElement("div"); toast.className="toast"; toast.innerHTML=`<b>${esc(title)}</b><span>${esc(body)}</span>`; document.body.appendChild(toast); setTimeout(()=>toast.remove(),4200);
  }
  function updateActionButton(){const unread=notifications().filter(n=>!n.read).length; const btn=$("action-button"); if(btn){btn.textContent=unread; btn.classList.toggle("has-unread",unread>0);} }

  function applyPrefs(){
    const p=prefs();
    document.documentElement.style.setProperty("--accent",p.accent||"#0078d4");
    document.body.classList.toggle("light",p.theme==="light");
    document.body.classList.toggle("high-contrast",p.theme==="contrast");
    document.body.classList.toggle("dark-windows",p.theme==="dark-windows");
    renderDesktop(); renderStart();
  }

  function renderDesktop(){
    const p=prefs();
    const desk=$("desktop"); if(!desk) return;
    desk.innerHTML = APPS.filter(a=>p.desktopIcons.includes(a.id)).map(a=>`
      <div tabindex="0" class="desktop-icon" ondblclick="Gold10.openApp('${a.id}')" onclick="this.blur()" title="${esc(a.desc)}">
        ${logoHTML(a.icon)}
        <div class="icon-label">${esc(a.name)}</div>
      </div>`).join("");
  }
  function renderStart(query=""){
    const q=String(query||"").toLowerCase();
    const startResults=$("start-results");
    const matches=[...APPS,...userApps().map(a=>({id:"u:"+a.id,name:a.name,group:"User apps",icon:"app",desc:a.description||"User application",open:()=>runUserApp(a.id)}))].filter(a=>!q || [a.name,a.group,a.desc].join(" ").toLowerCase().includes(q));
    if(startResults) startResults.innerHTML = matches.map(a=>`<div class="start-result" onclick="Gold10.openApp('${a.id}')">${logoHTML(a.icon)}<div><b>${esc(a.name)}</b><small>${esc(a.group)} — ${esc(a.desc)}</small></div></div>`).join("");
    const tileGrid=$("start-tiles-grid");
    if(tileGrid) tileGrid.innerHTML = APPS.filter(a=>a.tile).map(a=>`<div class="tile" onclick="Gold10.openApp('${a.id}')">${logoHTML(a.icon)}<b>${esc(a.name)}</b></div>`).join("");
  }
  function toggleStart(){closeFlyouts("start"); $("start-menu")?.classList.toggle("hidden"); const input=$("start-search"); if(input && !$("start-menu").classList.contains("hidden")){setTimeout(()=>input.focus(),60);} }
  function closeStart(){ $("start-menu")?.classList.add("hidden"); }
  function closeFlyouts(except=""){
    if(except!=="start") closeStart();
    if(except!=="search") $("search-panel")?.classList.add("hidden");
    if(except!=="task") $("task-view")?.classList.add("hidden");
    if(except!=="widgets") $("widgets-panel")?.classList.add("hidden");
    if(except!=="action") $("action-center")?.classList.add("hidden");
  }

  function openApp(appId){
    if(appId.startsWith("u:")) return runUserApp(appId.slice(2));
    const app=appById(appId); if(!app) return notify("App not found",appId,"System","warning");
    closeFlyouts(); app.open(); addActivity("Opened " + app.name,app.desc); const s=session(); setSession({recentApps:[appId,...(s.recentApps||[]).filter(x=>x!==appId)].slice(0,16)});
  }
  function openWindow(appId,title,html,opts={}){
    let existing=state.windows.find(w=>w.appId===appId && !opts.multi);
    if(existing){restoreWindow(existing.id); const c=$(existing.id)?.querySelector(".content"); if(c) c.innerHTML=html; return existing.id;}
    const winId="win_"+id(); const layer=$("window-layer");
    const app=appById(appId) || {icon:"app",name:title};
    const idx=state.windows.length;
    const w=opts.width || Math.min(920, Math.max(460, window.innerWidth-80));
    const h=opts.height || Math.min(640, Math.max(330, window.innerHeight-112));
    const left=Math.max(8, Math.min(40+idx*24, window.innerWidth-w-16));
    const top=Math.max(8, Math.min(26+idx*24, window.innerHeight-h-64));
    const el=document.createElement("section");
    el.className="win"; el.id=winId; el.style.cssText=`left:${left}px;top:${top}px;width:${w}px;height:${h}px;z-index:${++state.z}`;
    el.innerHTML=`
      <div class="titlebar" data-drag="${winId}">${logoHTML(app.icon)}<div class="titlebar-title">${esc(title)}</div><div class="win-controls"><button onclick="Gold10.minimizeWindow('${winId}')">—</button><button onclick="Gold10.maximizeWindow('${winId}')">□</button><button class="close" onclick="Gold10.closeWindow('${winId}')">×</button></div></div>
      <div class="content">${html}</div><div class="resize-grip" data-resize="${winId}"></div>`;
    layer.appendChild(el);
    const rec={id:winId,appId,title,min:false,max:false,icon:app.icon}; state.windows.push(rec); focusWindow(winId); bindWindow(el); renderTaskbarApps();
    return winId;
  }
  function focusWindow(winId){state.activeId=winId; document.querySelectorAll(".win").forEach(w=>w.classList.toggle("active",w.id===winId)); const el=$(winId); if(el){el.style.zIndex=++state.z; el.classList.remove("min"); const rec=state.windows.find(w=>w.id===winId); if(rec) rec.min=false;} renderTaskbarApps();}
  function minimizeWindow(winId){const el=$(winId); const rec=state.windows.find(w=>w.id===winId); if(el&&rec){rec.min=true; el.classList.add("min"); renderTaskbarApps();}}
  function restoreWindow(winId){const el=$(winId); const rec=state.windows.find(w=>w.id===winId); if(el&&rec){rec.min=false; el.classList.remove("min"); focusWindow(winId);}}
  function maximizeWindow(winId){const el=$(winId); const rec=state.windows.find(w=>w.id===winId); if(!el||!rec) return; rec.max=!rec.max; el.classList.toggle("max",rec.max); focusWindow(winId);}
  function closeWindow(winId){$(winId)?.remove(); state.windows=state.windows.filter(w=>w.id!==winId); if(state.activeId===winId) state.activeId=state.windows.at(-1)?.id || null; renderTaskbarApps();}
  function renderTaskbarApps(){const bar=$("taskbar-apps"); if(!bar) return; bar.innerHTML=state.windows.map(w=>`<button class="taskbar-app ${w.id===state.activeId?'active':''} ${w.min?'minimized':''}" onclick="Gold10.restoreWindow('${w.id}')" title="${esc(w.title)}">${esc(w.title)}</button>`).join("");}
  function bindWindow(el){
    el.addEventListener("mousedown",()=>focusWindow(el.id));
    const title=el.querySelector(".titlebar");
    title.addEventListener("dblclick",()=>maximizeWindow(el.id));
    title.addEventListener("mousedown",ev=>{ if(ev.target.closest("button")) return; const rec=state.windows.find(w=>w.id===el.id); if(rec?.max) return; const sx=ev.clientX, sy=ev.clientY, startL=el.offsetLeft, startT=el.offsetTop; function move(e){el.style.left=Math.max(0, Math.min(window.innerWidth-80, startL+e.clientX-sx))+"px"; el.style.top=Math.max(0, Math.min(window.innerHeight-90, startT+e.clientY-sy))+"px";} function up(){document.removeEventListener("mousemove",move);document.removeEventListener("mouseup",up);} document.addEventListener("mousemove",move);document.addEventListener("mouseup",up); });
    const grip=el.querySelector(".resize-grip");
    grip.addEventListener("mousedown",ev=>{ev.preventDefault(); const rec=state.windows.find(w=>w.id===el.id); if(rec?.max) return; const sx=ev.clientX,sy=ev.clientY,sw=el.offsetWidth,sh=el.offsetHeight; function move(e){el.style.width=Math.max(320, Math.min(window.innerWidth-el.offsetLeft, sw+e.clientX-sx))+"px"; el.style.height=Math.max(220, Math.min(window.innerHeight-48-el.offsetTop, sh+e.clientY-sy))+"px";} function up(){document.removeEventListener("mousemove",move);document.removeEventListener("mouseup",up);} document.addEventListener("mousemove",move);document.addEventListener("mouseup",up);});
  }

  function header(icon,title,subtitle){return `<div class="app-shell"><div class="app-header">${logoHTML(icon)}<div><h2>${esc(title)}</h2><p>${esc(subtitle)}</p></div></div>`;}
  function end(){return `</div>`;}
  function card(appId,title,body,icon="app"){return `<div class="card" onclick="Gold10.openApp('${appId}')">${logoHTML(icon)}<h3>${esc(title)}</h3><small>${esc(body)}</small></div>`;}

  function openHome(){
    const recent=session().recentApps || []; const unread=notifications().filter(n=>!n.read).length; const f=files().filter(x=>!x.trash);
    openWindow("home","Gold Home",`${header("home","Gold Home","Your independent Gold 1.0 cloud desktop.")}
      <div class="grid">
        <div class="card"><h3>Welcome, ${esc(username())}</h3><small>${esc(BUILD.name)} — ${esc(BUILD.version)}</small></div>
        <div class="card"><h3>${f.length}</h3><small>Files in Explorer</small></div>
        <div class="card"><h3>${unread}</h3><small>Unread notifications</small></div>
        <div class="card"><h3>${state.windows.length}</h3><small>Open windows</small></div>
      </div>
      <div class="toolbar"><button class="btn primary" onclick="Gold10.openApp('explorer')">Open Explorer</button><button class="btn" onclick="Gold10.openApp('office')">Open Office</button><button class="btn" onclick="Gold10.openApp('mail')">Open Mail</button><button class="btn" onclick="Gold10.openApp('settings')">Open Settings</button><button class="btn" onclick="Gold10.saveWorkspaceNow()">Save Workspace</button></div>
      <h3>Recent apps</h3><div class="grid">${recent.slice(0,6).map(id=>{const a=appById(id); return a?card(a.id,a.name,a.desc,a.icon):""}).join("") || `<div class="notice">No recent apps yet.</div>`}</div>
      <h3>Recommended</h3><div class="grid">${["explorer","office","action","restore","store","creator"].map(i=>{const a=appById(i); return card(a.id,a.name,a.desc,a.icon)}).join("")}</div>${end()}`);
  }

  function openExplorer(filter="all"){
    const data=files();
    const visible=data.filter(x=>filter==="trash"?x.trash:filter==="starred"?x.star&&!x.trash:filter==="recent"?!x.trash:!x.trash);
    openWindow("explorer","File Explorer",`${header("explorer","File Explorer","Independent file workspace with folders, previews, stars, trash, and restore.")}
      <div class="toolbar"><button class="btn primary" onclick="Gold10.newFile()">New Text File</button><button class="btn" onclick="Gold10.newFolder()">New Folder</button><button class="btn" onclick="Gold10.openExplorer('all')">My Files</button><button class="btn" onclick="Gold10.openExplorer('recent')">Recent</button><button class="btn" onclick="Gold10.openExplorer('starred')">Starred</button><button class="btn" onclick="Gold10.openExplorer('trash')">Trash</button><input id="fileSearch" placeholder="Search files" oninput="Gold10.filterFiles(this.value)"></div>
      <div class="split"><aside class="sidebar"><b>Quick access</b><div class="list-item" onclick="Gold10.openExplorer('all')">My Files</div><div class="list-item" onclick="Gold10.openExplorer('starred')">Starred</div><div class="list-item" onclick="Gold10.openExplorer('trash')">Trash</div><hr><button class="btn" onclick="Gold10.exportBackup()">Export Backup</button><button class="btn" onclick="Gold10.openApp('restore')">Restore Center</button></aside><section><div id="fileList">${fileListHTML(visible)}</div></section></div>${end()}`,{width:980,height:640});
  }
  function fileListHTML(list){return list.length?list.map(f=>`<div class="list-item file-row" data-name="${esc(f.name.toLowerCase())}">${logoHTML(f.type==="folder"?"explorer":f.type==="edoc"?"docs":"office")}<div style="flex:1"><b>${esc(f.name)}</b><small>${esc(f.type)} · updated ${fmt(f.updated)}</small></div><button class="btn" onclick="Gold10.previewFile('${f.id}')">Open</button><button class="btn" onclick="Gold10.renameFile('${f.id}')">Rename</button><button class="btn" onclick="Gold10.toggleStar('${f.id}')">${f.star?'Unstar':'Star'}</button>${f.trash?`<button class="btn" onclick="Gold10.restoreFile('${f.id}')">Restore</button><button class="btn danger" onclick="Gold10.deleteForever('${f.id}')">Delete Forever</button>`:`<button class="btn danger" onclick="Gold10.trashFile('${f.id}')">Trash</button>`}</div>`).join(""):`<div class="notice">No files here yet.</div>`;}
  function filterFiles(q){document.querySelectorAll(".file-row").forEach(r=>r.style.display=r.dataset.name.includes(String(q).toLowerCase())?"flex":"none");}
  function newFile(){const name=prompt("File name","Untitled.txt"); if(!name) return; const list=files(); list.unshift({id:id(),name,type:name.endsWith(".edoc")?"edoc":"text",parent:null,star:false,trash:false,content:"",created:now(),updated:now()}); setFiles(list); notify("File created",name,"Explorer"); openExplorer();}
  function newFolder(){const name=prompt("Folder name","New Folder"); if(!name) return; const list=files(); list.unshift({id:id(),name,type:"folder",parent:null,star:false,trash:false,created:now(),updated:now()}); setFiles(list); openExplorer();}
  function previewFile(fid){const f=files().find(x=>x.id===fid); if(!f) return; if(f.type==="folder") return notify("Folder opened",f.name,"Explorer"); openWindow("preview_"+fid,f.name,`${header(f.type==="edoc"?"docs":"office",f.name,"File preview and editor")}
    <div class="toolbar"><button class="btn primary" onclick="Gold10.savePreviewFile('${fid}')">Save</button><button class="btn" onclick="Gold10.downloadText('${esc(f.name)}',document.getElementById('preview_content').value)">Download</button></div><textarea id="preview_content" class="editor">${esc(f.content||"")}</textarea>${end()}`,{multi:true,width:780,height:560});}
  function savePreviewFile(fid){const list=files(); const f=list.find(x=>x.id===fid); if(!f) return; f.content=$("preview_content")?.value||""; f.updated=now(); setFiles(list); notify("File saved",f.name,"Explorer","success");}
  function renameFile(fid){const list=files(); const f=list.find(x=>x.id===fid); if(!f) return; const name=prompt("Rename file",f.name); if(!name) return; f.name=name; f.updated=now(); setFiles(list); openExplorer();}
  function toggleStar(fid){const list=files(); const f=list.find(x=>x.id===fid); if(f){f.star=!f.star;f.updated=now();setFiles(list);openExplorer();}}
  function trashFile(fid){const list=files(); const f=list.find(x=>x.id===fid); if(f){f.trash=true;f.updated=now();setFiles(list);openExplorer();}}
  function restoreFile(fid){const list=files(); const f=list.find(x=>x.id===fid); if(f){f.trash=false;f.updated=now();setFiles(list);openExplorer("trash");}}
  function deleteForever(fid){if(!confirm("Delete forever?")) return; setFiles(files().filter(x=>x.id!==fid)); openExplorer("trash");}

  function openOffice(tab="home"){
    openWindow("office","Gold Office",`${header("office","Gold Office","Drive-style Docs, Sheets, Slides, Forms, templates, and vault.")}
      <div class="toolbar"><button class="btn primary" onclick="Gold10.openDocEditor()">New Doc</button><button class="btn" onclick="Gold10.openSheets()">Sheets</button><button class="btn" onclick="Gold10.openSlides()">Slides</button><button class="btn" onclick="Gold10.openForms()">Forms</button><button class="btn" onclick="Gold10.openTemplates()">Templates</button><button class="btn" onclick="Gold10.openExplorer()">Open Drive</button></div>
      <h3>Recent documents</h3><div class="grid">${docs().map(d=>`<div class="card"><h3>${esc(d.name)}</h3><small>Updated ${fmt(d.updated)}</small><div class="toolbar"><button class="btn" onclick="Gold10.openDocEditor('${d.id}')">Open</button><button class="btn" onclick="Gold10.copyDocToFiles('${d.id}')">Save to Explorer</button></div></div>`).join("")}</div>
      <h3>Office tools</h3><div class="grid">${[card("office_docs","Docs","Rich document editor with export and templates","docs"),card("office_sheets","Sheets","Spreadsheet grid and CSV export","sheets"),card("office_slides","Slides","Presentation editor and present mode","slides"),card("office_forms","Forms","Form builder and response storage","forms")].join("")}</div>${end()}`,{width:980,height:650});
  }
  function openDocEditor(docId=""){const d=docs().find(x=>x.id===docId)||{id:id(),name:"Untitled Document.edoc",content:"",updated:now()};
    openWindow("doc_"+d.id,d.name,`${header("docs","Gold Docs","Document editor with autosave, export, templates, print, and word count.")}
      <div class="toolbar"><input id="doc_name" value="${esc(d.name)}"><button class="btn primary" onclick="Gold10.saveDoc('${d.id}')">Save</button><button class="btn" onclick="Gold10.insertDocTemplate()">Template</button><button class="btn" onclick="Gold10.insertDate('doc_content')">Date</button><button class="btn" onclick="Gold10.downloadText((document.getElementById('doc_name').value||'document')+'.txt',document.getElementById('doc_content').value)">Export TXT</button><button class="btn" onclick="Gold10.exportDocHTML()">Export HTML</button><button class="btn" onclick="window.print()">Print</button><span class="pill" id="doc_count">0 words</span></div>
      <div class="doc-page"><textarea id="doc_content" class="editor" oninput="Gold10.docCount()">${esc(d.content)}</textarea></div>${end()}`,{multi:true,width:900,height:690}); setTimeout(docCount,30);}
  function saveDoc(docId){let list=docs(); let d=list.find(x=>x.id===docId); const name=$("doc_name")?.value||"Untitled Document.edoc"; const content=$("doc_content")?.value||""; if(d){d.name=name;d.content=content;d.updated=now();} else {d={id:docId,name,content,updated:now(),star:false}; list.unshift(d);} setDocs(list); notify("Document saved",name,"Gold Office","success");}
  function docCount(){const text=$("doc_content")?.value||""; const words=(text.trim().match(/\S+/g)||[]).length; const chars=text.length; const el=$("doc_count"); if(el) el.textContent=`${words} words · ${chars} chars`;}
  function insertDocTemplate(){const t="Report Title\n\nPrepared by: "+username()+"\nDate: "+new Date().toLocaleDateString()+"\n\nSummary\n\nDetails\n\nConclusion\n"; const area=$("doc_content"); if(area){area.value=t; docCount();}}
  function insertDate(target){const a=$(target); if(a){a.value += "\n"+new Date().toLocaleString()+"\n";}}
  function exportDocHTML(){const name=($("doc_name")?.value||"document")+".html"; const body=esc($("doc_content")?.value||"").replace(/\n/g,"<br>"); downloadText(name,`<!doctype html><title>${esc(name)}</title><body style="font-family:Segoe UI,Arial;padding:40px">${body}</body>`);}
  function copyDocToFiles(docId){const d=docs().find(x=>x.id===docId); if(!d) return; const list=files(); list.unshift({id:id(),name:d.name,type:"edoc",parent:null,star:false,trash:false,content:d.content,created:now(),updated:now()}); setFiles(list); notify("Saved to Explorer",d.name,"Office","success");}
  function openSheets(){const s=sheets()[0]; openWindow("sheets","Gold Sheets",`${header("sheets","Gold Sheets","Editable spreadsheet grid with totals and CSV export.")}
    <div class="toolbar"><input id="sheet_name" value="${esc(s.name)}"><button class="btn" onclick="Gold10.addSheetRow()">Add Row</button><button class="btn primary" onclick="Gold10.saveSheet('${s.id}')">Save</button><button class="btn" onclick="Gold10.sheetTotal()">Total Col B</button><button class="btn" onclick="Gold10.exportCSV('${s.id}')">Export CSV</button></div><table class="sheet"><tbody id="sheet_body">${sheetRows(s.cells)}</tbody></table>${end()}`,{width:820,height:560});}
  function sheetRows(rows){return rows.map((r,ri)=>`<tr>${Array.from({length:Math.max(5,r.length)}).map((_,ci)=>`<td><input data-r="${ri}" data-c="${ci}" value="${esc(r[ci]||"")}"></td>`).join("")}</tr>`).join("");}
  function collectSheet(){const rows=[]; document.querySelectorAll("#sheet_body input").forEach(inp=>{const r=+inp.dataset.r,c=+inp.dataset.c; rows[r]=rows[r]||[]; rows[r][c]=inp.value;}); return rows;}
  function addSheetRow(){const body=$("sheet_body"); const r=body.querySelectorAll("tr").length; body.insertAdjacentHTML("beforeend",`<tr>${Array.from({length:5}).map((_,c)=>`<td><input data-r="${r}" data-c="${c}" value=""></td>`).join("")}</tr>`);}
  function saveSheet(sid){const list=sheets(); const s=list.find(x=>x.id===sid)||{id:sid}; s.name=$("sheet_name")?.value||"Sheet.esheet"; s.cells=collectSheet(); s.updated=now(); if(!list.find(x=>x.id===sid)) list.unshift(s); setSheets(list); notify("Sheet saved",s.name,"Sheets");}
  function sheetTotal(){const rows=collectSheet(); const total=rows.slice(1).reduce((sum,r)=>sum+(parseFloat(r[1])||0),0); notify("Total",`Column B total: ${total}`,"Sheets");}
  function exportCSV(sid){const s=sheets().find(x=>x.id===sid); const rows=collectSheet(); downloadText((s?.name||"sheet")+".csv",rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n"));}
  function openSlides(){const deck=slides()[0]; const sl=deck.slides[0]; openWindow("slides","Gold Slides",`${header("slides","Gold Slides","Presentation editor with slide preview and export.")}
    <div class="toolbar"><input id="slide_title" value="${esc(sl.title)}"><button class="btn primary" onclick="Gold10.saveSlide('${deck.id}')">Save</button><button class="btn" onclick="Gold10.presentSlide()">Present</button></div><textarea id="slide_body" class="editor">${esc(sl.body)}</textarea><div class="slide-preview"><div><h1>${esc(sl.title)}</h1><p>${esc(sl.body)}</p></div></div>${end()}`,{width:900,height:660});}
  function saveSlide(deckId){const list=slides(); const d=list.find(x=>x.id===deckId); if(d){d.slides[0].title=$("slide_title")?.value||"Slide"; d.slides[0].body=$("slide_body")?.value||""; d.updated=now(); setSlides(list); notify("Slides saved",d.name,"Slides");}}
  function presentSlide(){const title=$("slide_title")?.value||"Slide"; const body=$("slide_body")?.value||""; openWindow("present","Present Mode",`<div class="slide-preview" style="height:100%"><div><h1>${esc(title)}</h1><p>${esc(body)}</p></div></div>`,{multi:true,width:900,height:600});}
  function openForms(){const f=forms()[0]; openWindow("forms","Gold Forms",`${header("forms","Gold Forms","Build simple forms and store responses locally.")}
    <div class="toolbar"><input id="form_name" value="${esc(f.name)}"><button class="btn primary" onclick="Gold10.saveForm('${f.id}')">Save Form</button><button class="btn" onclick="Gold10.previewForm('${f.id}')">Preview</button></div><textarea id="form_questions" class="editor">${esc(f.questions.join("\n"))}</textarea>${end()}`);}
  function saveForm(fid){const list=forms(); const f=list.find(x=>x.id===fid); if(f){f.name=$("form_name")?.value||"Form"; f.questions=($("form_questions")?.value||"").split("\n").filter(Boolean); f.updated=now(); setForms(list); notify("Form saved",f.name,"Forms");}}
  function previewForm(fid){const f=forms().find(x=>x.id===fid); if(!f) return; openWindow("formprev_"+fid,"Form Preview",`${header("forms",f.name,"Preview form")}${f.questions.map((q,i)=>`<label>${esc(q)}<input class="field" id="form_resp_${i}" style="width:100%;margin:6px 0 12px"></label>`).join("")}<button class="btn primary" onclick="Gold10.submitForm('${fid}')">Submit response</button>${end()}`,{multi:true});}
  function submitForm(fid){const list=forms(); const f=list.find(x=>x.id===fid); if(f){f.responses.push({id:id(),date:now(),answers:f.questions.map((_,i)=>$("form_resp_"+i)?.value||"")}); setForms(list); notify("Response saved",f.name,"Forms");}}
  function openTemplates(){openWindow("templates","Templates",`${header("office","Templates","Start from a formatted document template.")}<div class="grid">${["Letter","Memo","Report","Policy","Meeting Notes","Proposal","Announcement","Resume"].map(t=>`<div class="card" onclick="Gold10.openDocEditor();setTimeout(()=>{document.getElementById('doc_name').value='${t}.edoc';document.getElementById('doc_content').value='${t}\n\nPrepared by ${username()}\n\n';Gold10.docCount();},80)"><h3>${t}</h3><small>Create a ${t.toLowerCase()} document.</small></div>`).join("")}</div>${end()}`);}

  function openMail(folder="inbox"){
    const messages=mail().filter(m=>m.folder===folder);
    openWindow("mail","Gold Mail",`${header("mail","Gold Mail",`${mailAddress()} · Inbox, sent, drafts, trash, compose, and reply.`)}
      <div class="toolbar"><button class="btn primary" onclick="Gold10.composeMail()">Compose</button><button class="btn" onclick="Gold10.openMail('inbox')">Inbox</button><button class="btn" onclick="Gold10.openMail('sent')">Sent</button><button class="btn" onclick="Gold10.openMail('drafts')">Drafts</button><button class="btn" onclick="Gold10.openMail('trash')">Trash</button></div>
      <div class="split"><aside class="sidebar"><b>Folders</b>${["inbox","sent","drafts","trash"].map(f=>`<div class="list-item" onclick="Gold10.openMail('${f}')">${f[0].toUpperCase()+f.slice(1)} <span class="pill">${mail().filter(m=>m.folder===f&&!m.read).length}</span></div>`).join("")}</aside><section>${messages.map(m=>`<div class="list-item"><div style="flex:1"><b>${m.read?'':'● '} ${esc(m.subject)}</b><small>From ${esc(m.from)} · ${fmt(m.date)}</small></div><button class="btn" onclick="Gold10.readMail('${m.id}')">Open</button><button class="btn danger" onclick="Gold10.deleteMail('${m.id}')">Delete</button></div>`).join("") || `<div class="notice">No mail in ${folder}.</div>`}</section></div>${end()}`,{width:930,height:630});
  }
  function composeMail(to="",subject="",body="") {openWindow("compose_"+id(),"Compose Mail",`${header("mail","Compose Mail","Send internal Gold Mail.")}<div class="toolbar"><input id="mail_to" placeholder="To" value="${esc(to)}"><input id="mail_subject" placeholder="Subject" value="${esc(subject)}"></div><textarea id="mail_body" class="editor">${esc(body)}</textarea><div class="toolbar"><button class="btn primary" onclick="Gold10.sendMail()">Send</button><button class="btn" onclick="Gold10.saveDraftMail()">Save Draft</button></div>${end()}`,{multi:true,width:760,height:560});}
  function sendMail(){const list=mail(); const to=$("mail_to")?.value||"user@gold.mail"; const subject=$("mail_subject")?.value||"No subject"; const body=$("mail_body")?.value||""; list.unshift({id:id(),folder:"sent",from:mailAddress(),to,subject,body,read:true,date:now()}); setMail(list); notify("Mail sent",subject,"Mail"); openMail("sent");}
  function saveDraftMail(){const list=mail(); const subject=$("mail_subject")?.value||"Draft"; list.unshift({id:id(),folder:"drafts",from:mailAddress(),to:$("mail_to")?.value||"",subject,body:$("mail_body")?.value||"",read:true,date:now()}); setMail(list); notify("Draft saved",subject,"Mail");}
  function readMail(mid){const list=mail(); const m=list.find(x=>x.id===mid); if(!m) return; m.read=true; setMail(list); openWindow("mail_"+mid,m.subject,`${header("mail",m.subject,`From ${m.from} to ${m.to}`)}<p class="muted">${fmt(m.date)}</p><div class="card" style="white-space:pre-wrap">${esc(m.body)}</div><div class="toolbar"><button class="btn primary" onclick="Gold10.composeMail('${esc(m.from)}','Re: ${esc(m.subject)}','\n\n--- Original ---\n${esc(m.body).replace(/\n/g,"\\n")}')">Reply</button><button class="btn danger" onclick="Gold10.deleteMail('${mid}')">Delete</button></div>${end()}`,{multi:true}); openMail(m.folder);}
  function deleteMail(mid){const list=mail(); const m=list.find(x=>x.id===mid); if(m){m.folder=m.folder==="trash"?"trash":"trash";m.read=true;setMail(list);openMail("trash");}}

  function openChat(){const data=chat(); const room=data.rooms.find(r=>r.id===data.active)||data.rooms[0]; openWindow("chat","Gold Chat",`${header("chat","Gold Chat","Rooms, direct messages, unread alerts, and chat history.")}
    <div class="split"><aside class="sidebar"><button class="btn primary" onclick="Gold10.newChatRoom()">New Room</button>${data.rooms.map(r=>`<div class="list-item" onclick="Gold10.setChatRoom('${r.id}')">${esc(r.name)}</div>`).join("")}</aside><section><h3>${esc(room.name)}</h3><div id="chat_messages" style="height:300px;overflow:auto;border:1px solid #dce5ef;padding:8px;background:#fff">${room.messages.map(m=>`<div class="list-item"><b>${esc(m.from)}</b><span>${esc(m.body)}</span><small>${fmt(m.date)}</small></div>`).join("")}</div><div class="toolbar"><input id="chat_input" placeholder="Message"><button class="btn primary" onclick="Gold10.sendChat()">Send</button></div></section></div>${end()}`,{width:860,height:590});}
  function newChatRoom(){const name=prompt("Room name","New Room"); if(!name) return; const data=chat(); const rid=id(); data.rooms.unshift({id:rid,name,messages:[]}); data.active=rid; setChat(data); openChat();}
  function setChatRoom(rid){const data=chat(); data.active=rid; setChat(data); openChat();}
  function sendChat(){const msg=$("chat_input")?.value; if(!msg) return; const data=chat(); const room=data.rooms.find(r=>r.id===data.active); room.messages.push({id:id(),from:username(),body:msg,date:now()}); setChat(data); notify("New chat message",msg,"Chat"); openChat();}

  function openPeople(){const list=people(); openWindow("people","People",`${header("people","People","Contacts, user directory, favorites, and blocking.")}<div class="toolbar"><button class="btn primary" onclick="Gold10.addContact()">Add Contact</button><input id="peopleSearch" placeholder="Search people" oninput="Gold10.filterPeople(this.value)"></div><div>${list.map(p=>`<div class="list-item person-row" data-name="${esc((p.username+p.displayName+p.mail).toLowerCase())}">${logoHTML("people")}<div style="flex:1"><b>${esc(p.displayName)}</b><small>${esc(p.username)} · ${esc(p.status)} · ${esc(p.mail)}</small></div><button class="btn" onclick="Gold10.composeMail('${esc(p.mail)}')">Mail</button><button class="btn" onclick="Gold10.toggleFavorite('${p.id}')">${p.favorite?'Unfavorite':'Favorite'}</button><button class="btn danger" onclick="Gold10.toggleBlock('${p.id}')">${p.blocked?'Unblock':'Block'}</button></div>`).join("")}</div>${end()}`);}
  function addContact(){const u=prompt("Username","newuser"); if(!u) return; const list=people(); list.push({id:id(),username:u,displayName:u,favorite:false,blocked:false,status:"Unknown",mail:u+"@gold.mail"}); setPeople(list); openPeople();}
  function filterPeople(q){document.querySelectorAll(".person-row").forEach(r=>r.style.display=r.dataset.name.includes(String(q).toLowerCase())?"flex":"none");}
  function toggleFavorite(pid){const list=people(); const p=list.find(x=>x.id===pid); if(p) p.favorite=!p.favorite; setPeople(list); openPeople();}
  function toggleBlock(pid){const list=people(); const p=list.find(x=>x.id===pid); if(p) p.blocked=!p.blocked; setPeople(list); openPeople();}

  function openStore(){
    const accepted=localStorage.getItem(BUILD.prefix+"storeWarningAccepted")==="true";
    if(!accepted) return openWindow("storeWarning","Store Security Notice",`${header("store","Store Security Notice","User applications can be risky.")}<div class="notice"><b>Warning! By using this feature, you expose yourself to risk of infection. Use at your own risk.</b><br><br>User-created applications may contain unsafe or unstable code. Only install apps from users you trust.</div><div class="toolbar"><button class="btn primary" onclick="localStorage.setItem('${BUILD.prefix}storeWarningAccepted','true');Gold10.openApp('store')">Agree and Continue</button><button class="btn" onclick="Gold10.closeWindow('storeWarning')">Cancel</button></div>${end()}`);
    const apps=userApps();
    openWindow("store","Store",`${header("store","Store","User apps, installed packages, publishing, and app safety.")}<div class="toolbar"><button class="btn primary" onclick="Gold10.openApp('creator')">Create App</button><button class="btn" onclick="Gold10.installDemoApp()">Install Demo App</button><button class="btn" onclick="localStorage.removeItem('${BUILD.prefix}storeWarningAccepted');Gold10.openApp('store')">Reset Warning</button></div><div class="grid">${apps.map(a=>`<div class="card"><h3>${esc(a.name)}</h3><small>${esc(a.description||"User application")}</small><p><span class="pill">${(a.permissions||[]).join(", ")||"No permissions"}</span></p><button class="btn primary" onclick="Gold10.runUserApp('${a.id}')">Run</button><button class="btn" onclick="Gold10.exportUserApp('${a.id}')">Export .eapp</button><button class="btn danger" onclick="Gold10.deleteUserApp('${a.id}')">Uninstall</button></div>`).join("")}</div>${end()}`,{width:920,height:620});
  }
  function openCreator(){openWindow("creator","Creator Studio",`${header("creator","Creator Studio","Application Editor, Code Studio, templates, API docs, and .eapp packages.")}<div class="toolbar"><input id="app_name" placeholder="Application name" value="My Gold App"><input id="app_label" placeholder="Icon label" value="APP"><button class="btn" onclick="Gold10.loadAppTemplate()">Template</button><button class="btn primary" onclick="Gold10.saveCustomApp()">Save App</button><button class="btn" onclick="Gold10.previewCustomApp()">Run Preview</button></div><textarea id="app_code" class="editor" style="font-family:Consolas,monospace;min-height:320px">api.setTitle('My Gold App');\napi.write('<h2>Hello from Gold 1.0</h2><p>This app was created in Creator Studio.</p>');\napi.button('Send Notification',()=>api.notify('My Gold App','Notifications work from custom apps.'));</textarea><details open><summary>Custom App API</summary><pre>api.write(html)\napi.button(label, handler)\napi.notify(title, message)\napi.save(key, data)\napi.load(key)\napi.download(filename, content)\napi.prompt(message)\napi.confirm(message)\napi.getUsername()</pre></details>${end()}`,{width:940,height:720});}
  function loadAppTemplate(){const code=`api.setTitle('Task Board');\nlet tasks = api.load('tasks') || [];\nfunction render(){\n  api.write('<h2>Task Board</h2><div id="tasklist">'+tasks.map((t,i)=>'<p><b>'+t+'</b> <button onclick="removeTask('+i+')">Done</button></p>').join('')+'</div>');\n  api.button('Add Task',()=>{ const t=api.prompt('Task'); if(t){tasks.push(t); api.save('tasks',tasks); render();}});\n}\nwindow.removeTask = i => { tasks.splice(i,1); api.save('tasks',tasks); render(); };\nrender();`; const area=$("app_code"); if(area) area.value=code;}
  function saveCustomApp(){const list=userApps(); const name=$("app_name")?.value||"Custom App"; const label=$("app_label")?.value||"APP"; const code=$("app_code")?.value||""; list.unshift({id:id(),name,label,description:"Created in Gold 1.0 Creator Studio",code,permissions:["notifications","localStorage"],installed:now()}); setUserApps(list); notify("App saved",name,"Creator Studio"); openStore();}
  function previewCustomApp(){const tmp={id:"preview",name:$("app_name")?.value||"Preview",code:$("app_code")?.value||""}; runAppObject(tmp,true);}
  function runUserApp(appId){const app=userApps().find(a=>a.id===appId); if(app) runAppObject(app,false);}
  function runAppObject(app,preview=false){const wid=openWindow("userapp_"+app.id,app.name,`<div id="uapp_${app.id}" class="app-shell"></div>`,{multi:true,width:760,height:560}); const root=$(wid)?.querySelector(`#uapp_${CSS.escape(app.id)}`)||$(wid)?.querySelector(".content"); const storageKey=BUILD.prefix+"appdata_"+app.id+"_"; const api={setTitle:t=>{$(wid).querySelector(".titlebar-title").textContent=t;},write:html=>{root.innerHTML=html;},button:(label,handler)=>{const b=document.createElement("button");b.className="btn";b.textContent=label;b.onclick=handler;root.appendChild(b);},notify:(t,m)=>notify(t,m,app.name),save:(k,d)=>localStorage.setItem(storageKey+k,JSON.stringify(d)),load:k=>readJSON(storageKey+k,null),download:downloadText,prompt:window.prompt.bind(window),confirm:window.confirm.bind(window),getUsername:username}; try{new Function("api",app.code)(api);}catch(e){root.innerHTML=`<div class="notice"><b>Application error</b><br>${esc(e.message)}</div>`;}}
  function exportUserApp(appId){const app=userApps().find(a=>a.id===appId); if(app) downloadText(app.name.replace(/\s+/g,"_")+".eapp",JSON.stringify(app,null,2));}
  function deleteUserApp(appId){if(!confirm("Uninstall app?")) return; setUserApps(userApps().filter(a=>a.id!==appId)); openStore();}
  function installDemoApp(){const list=userApps(); list.unshift({id:id(),name:"Quick Notes Utility",label:"NOTE",description:"A simple note-taking user app.",code:"api.setTitle('Quick Notes Utility'); let note=api.load('note')||''; api.write('<h2>Quick Notes</h2><textarea id=noteBox style=\"width:100%;height:220px\">'+note+'</textarea><br>'); api.button('Save',()=>{api.save('note',document.getElementById('noteBox').value);api.notify('Quick Notes','Saved.');});",permissions:["localStorage","notifications"],installed:now()}); setUserApps(list); notify("Demo app installed","Quick Notes Utility","Store"); openStore();}

  function openSettings(){const p=prefs(); openWindow("settings","Settings",`${header("settings","Settings","Modern Gold 1.0 settings for system, personalization, apps, and privacy.")}<div class="split"><aside class="sidebar"><b>Settings</b>${["System","Personalization","Apps","Accounts","Time & language","Ease of Access","Privacy","Update & Security"].map(x=>`<div class="list-item">${x}</div>`).join("")}</aside><section><h3>Personalization</h3><div class="toolbar"><label>Theme <select id="set_theme"><option value="dark">Dark</option><option value="light">Light</option><option value="dark-windows">Dark Windows</option><option value="contrast">High Contrast</option></select></label><label>Accent <input id="set_accent" type="color" value="${esc(p.accent)}"></label><button class="btn primary" onclick="Gold10.saveSettings()">Apply</button></div><h3>Desktop icons</h3><div class="grid">${APPS.map(a=>`<label class="card"><input type="checkbox" class="iconToggle" value="${a.id}" ${p.desktopIcons.includes(a.id)?"checked":""}> ${logoHTML(a.icon)} <b>${esc(a.name)}</b><br><small>${esc(a.group)}</small></label>`).join("")}</div><h3>System</h3><div class="toolbar"><button class="btn" onclick="Gold10.openGoldPersonalization()">Gold Personalization</button><button class="btn" onclick="Gold10.openApp('restore')">Restore Center</button><button class="btn" onclick="Gold10.openApp('security')">Security Center</button><button class="btn" onclick="Gold10.resetDesktop()">Reset Desktop</button></div></section></div>${end()}`,{width:980,height:690}); setTimeout(()=>{$("set_theme").value=p.theme;},10);}
  function saveSettings(){const icons=[...document.querySelectorAll(".iconToggle:checked")].map(x=>x.value); setPrefs({theme:$("set_theme")?.value||"dark",accent:$("set_accent")?.value||"#0078d4",desktopIcons:icons}); notify("Settings applied","Gold 1.0 personalization updated.","Settings");}
  function resetDesktop(){if(confirm("Restore default desktop icons?")){setPrefs({desktopIcons:["home","explorer","office","mail","chat","people","store","creator","settings","restore","calculator","notepad","photos","calendar","browser"]});}}
  function openControlPanel(){openWindow("control","Control Panel",`${header("control","Control Panel","Classic Gold 1.0 management shortcuts.")}<div class="grid">${["settings","security","restore","update","device","explorer","store","creator"].map(i=>{const a=appById(i);return card(a.id,a.name,a.desc,a.icon)}).join("")}</div>${end()}`);}
  function openActionCenterWindow(){openWindow("action","Action Center",actionHTML());}
  function actionHTML(){const list=notifications(); return `${header("action","Action Center","Universal notifications and quick actions.")}<div class="quick-grid"><button onclick="Gold10.toggleFocusAssist()">Focus Assist: ${prefs().focusAssist?'On':'Off'}</button><button onclick="Gold10.openApp('settings')">All Settings</button><button onclick="Gold10.openApp('restore')">Sync</button><button onclick="Gold10.openApp('security')">Security</button></div><div class="toolbar"><button class="btn" onclick="Gold10.markAllRead()">Mark all read</button><button class="btn danger" onclick="Gold10.clearNotifications()">Clear all</button></div>${list.map(n=>`<div class="list-item"><div style="flex:1"><b>${n.read?'':'● '} ${esc(n.title)}</b><small>${esc(n.source)} · ${fmt(n.date)}</small><p>${esc(n.body)}</p></div><button class="btn" onclick="Gold10.markNotification('${n.id}')">Read</button></div>`).join("") || `<div class="notice">No notifications.</div>`}${end()}`;}
  function openActionCenter(){closeFlyouts("action"); const ac=$("action-center"); ac.innerHTML=actionHTML(); ac.classList.toggle("hidden");}
  function markNotification(nid){const list=notifications(); const n=list.find(x=>x.id===nid); if(n) n.read=true; setNotifications(list); openActionCenter();}
  function markAllRead(){const list=notifications().map(n=>({...n,read:true})); setNotifications(list); openActionCenter();}
  function clearNotifications(){setNotifications([]); openActionCenter();}
  function toggleFocusAssist(){setPrefs({focusAssist:!prefs().focusAssist}); openActionCenter();}

  function openSearch(){closeFlyouts("search"); const sp=$("search-panel"); sp.innerHTML=`<div class="panel-title"><h2>Search</h2><button class="panel-btn" onclick="Gold10.closeFlyouts()">Close</button></div><input class="field" style="width:100%" placeholder="Search apps, files, documents, people, mail" oninput="Gold10.doGlobalSearch(this.value)"><div id="global_results"></div>`; sp.classList.toggle("hidden");}
  function openSearchWindow(){openWindow("search","Gold Search",`${header("search","Gold Search","Search apps, files, documents, people, and mail.")}<input class="field" style="width:100%" placeholder="Search" oninput="Gold10.doGlobalSearch(this.value,'window_results')"><div id="window_results"></div>${end()}`);}
  function doGlobalSearch(q,target="global_results"){const query=String(q||"").toLowerCase(); const results=[]; APPS.forEach(a=>{if((a.name+a.desc+a.group).toLowerCase().includes(query)) results.push({type:"App",name:a.name,sub:a.desc,action:`Gold10.openApp('${a.id}')`,icon:a.icon});}); files().forEach(f=>{if((f.name+(f.content||"")).toLowerCase().includes(query)) results.push({type:"File",name:f.name,sub:f.type,action:`Gold10.previewFile('${f.id}')`,icon:"explorer"});}); docs().forEach(d=>{if((d.name+d.content).toLowerCase().includes(query)) results.push({type:"Document",name:d.name,sub:"Gold Docs",action:`Gold10.openDocEditor('${d.id}')`,icon:"docs"});}); people().forEach(p=>{if((p.username+p.displayName+p.mail).toLowerCase().includes(query)) results.push({type:"Person",name:p.displayName,sub:p.mail,action:`Gold10.openApp('people')`,icon:"people"});}); const el=$(target); if(el) el.innerHTML = query? results.slice(0,40).map(r=>`<div class="list-item" onclick="${r.action}">${logoHTML(r.icon)}<div><b>${esc(r.name)}</b><small>${esc(r.type)} · ${esc(r.sub)}</small></div></div>`).join("") || `<div class="notice">No results.</div>` : `<div class="notice">Start typing to search.</div>`;}
  function openTaskView(){closeFlyouts("task"); const tv=$("task-view"); tv.innerHTML=taskViewHTML(); tv.classList.toggle("hidden");}
  function openTaskViewWindow(){openWindow("taskview","Task View",taskViewHTML());}
  function taskViewHTML(){return `<div class="panel-title"><h2>Task View</h2><button class="panel-btn" onclick="Gold10.closeAllWindows()">Close all</button></div><h3>Open windows</h3>${state.windows.map(w=>`<div class="list-item"><div style="flex:1"><b>${esc(w.title)}</b><small>${w.min?'Minimized':'Open'}</small></div><button class="btn" onclick="Gold10.restoreWindow('${w.id}')">Open</button><button class="btn danger" onclick="Gold10.closeWindow('${w.id}')">Close</button></div>`).join("") || `<div class="notice">No open windows.</div>`}<h3>Virtual desktops</h3><div class="grid"><div class="card"><h3>Desktop 1</h3><small>Main workspace</small></div><div class="card"><h3>Desktop 2</h3><small>Planned workspace</small></div></div>`;}
  function openWidgets(){closeFlyouts("widgets"); const wp=$("widgets-panel"); wp.innerHTML=widgetsHTML(); wp.classList.toggle("hidden");}
  function openWidgetsWindow(){openWindow("widgets","Widgets",widgetsHTML());}
  function widgetsHTML(){return `<div class="panel-title"><h2>Widgets</h2><button class="panel-btn" onclick="Gold10.openApp('settings')">Settings</button></div><div class="grid"><div class="card"><h3>${new Date().toLocaleTimeString()}</h3><small>Clock</small></div><div class="card"><h3>${files().filter(f=>!f.trash).length}</h3><small>Files</small></div><div class="card"><h3>${notifications().filter(n=>!n.read).length}</h3><small>Unread notifications</small></div><div class="card"><h3>${mail().filter(m=>m.folder==='inbox'&&!m.read).length}</h3><small>Unread mail</small></div></div><h3>Quick notes</h3><textarea class="editor" id="widget_note" oninput="localStorage.setItem('${BUILD.prefix}quickNote',this.value)">${esc(localStorage.getItem(BUILD.prefix+"quickNote")||"")}</textarea>`;}

  function openTimeline(){openWindow("timeline","Timeline",`${header("timeline","Timeline","Recent activity and app usage.")}${activity().map(a=>`<div class="list-item"><div><b>${esc(a.title)}</b><small>${fmt(a.date)} · ${esc(a.details)}</small></div></div>`).join("") || `<div class="notice">No activity yet.</div>`}${end()}`);}
  async function getFirebase(){if(state.firebase!==null) return state.firebase; try{state.firebase=await import("./firebase.js"); return state.firebase;}catch(e){state.firebase=false; return false;}}
  function collectWorkspace(){return {prefs:prefs(),files:files(),docs:docs(),sheets:sheets(),slides:slides(),forms:forms(),mail:mail(),chat:chat(),people:people(),apps:userApps(),notifications:notifications(),activity:activity(),session:{...session(),lastSaved:now(),openApps:state.windows.map(w=>w.appId)},product:BUILD.name,version:BUILD.version};}
  function applyWorkspace(data){if(!data) return; if(data.prefs) writeJSON(LS.prefs,data.prefs); if(data.files) writeJSON(LS.files,data.files); if(data.docs) writeJSON(LS.docs,data.docs); if(data.sheets) writeJSON(LS.sheets,data.sheets); if(data.slides) writeJSON(LS.slides,data.slides); if(data.forms) writeJSON(LS.forms,data.forms); if(data.mail) writeJSON(LS.mail,data.mail); if(data.chat) writeJSON(LS.chat,data.chat); if(data.people) writeJSON(LS.people,data.people); if(data.apps) writeJSON(LS.apps,data.apps); if(data.notifications) writeJSON(LS.notifications,data.notifications); if(data.activity) writeJSON(LS.activity,data.activity); setSession({lastRestored:now()}); applyPrefs(); updateActionButton();}
  let saveTimer=null; function scheduleSave(){clearTimeout(saveTimer); saveTimer=setTimeout(()=>saveWorkspace(false),900);}
  async function saveWorkspace(show=true){const data=collectWorkspace(); localStorage.setItem(BUILD.prefix+"lastWorkspace",JSON.stringify(data)); setSession({lastSaved:now()}); const fb=await getFirebase(); if(fb && fb.db && fb.doc && fb.setDoc){try{await fb.setDoc(fb.doc(fb.db,"emeraldOSUsers",username(),BUILD.cloudPath,"current"),data,{merge:true}); $("sync-button").textContent="Synced"; if(show) notify("Workspace saved","Saved locally and to Firebase.","Restore Center","success"); return true;}catch(e){if(show) notify("Cloud save failed","Saved locally only: "+e.message,"Restore Center","warning");}}
    if(show) notify("Workspace saved","Saved locally. Firebase was not available.","Restore Center"); return false;}
  async function loadCloudWorkspace(){const fb=await getFirebase(); if(fb && fb.db && fb.doc && fb.getDoc){try{const snap=await fb.getDoc(fb.doc(fb.db,"emeraldOSUsers",username(),BUILD.cloudPath,"current")); if(snap.exists()){applyWorkspace(snap.data()); notify("Workspace restored","Loaded from Firebase.","Restore Center","success"); openHome(); return true;} notify("No cloud workspace","No saved cloud workspace was found.","Restore Center");}catch(e){notify("Cloud restore failed",e.message,"Restore Center","warning");}} return false;}
  function loadLocalWorkspace(){const data=readJSON(BUILD.prefix+"lastWorkspace",null); if(data){applyWorkspace(data); notify("Workspace restored","Loaded local saved workspace.","Restore Center"); openHome();} else notify("No local workspace","Nothing has been saved yet.","Restore Center");}
  function openRestore(){const s=session(); openWindow("restore","Restore Center",`${header("restore","Restore Center","Save, restore, export, import, and repair your Gold 1.0 workspace.")}<div class="grid"><div class="card"><h3>Last saved</h3><small>${s.lastSaved?fmt(s.lastSaved):"Not saved yet"}</small></div><div class="card"><h3>Last restored</h3><small>${s.lastRestored?fmt(s.lastRestored):"Not restored yet"}</small></div><div class="card"><h3>Cloud path</h3><small>emeraldOSUsers/${esc(username())}/${BUILD.cloudPath}/current</small></div></div><div class="toolbar"><button class="btn primary" onclick="Gold10.saveWorkspaceNow()">Save Workspace Now</button><button class="btn" onclick="Gold10.loadCloudWorkspace()">Restore from Cloud</button><button class="btn" onclick="Gold10.loadLocalWorkspace()">Restore Local</button><button class="btn" onclick="Gold10.exportBackup()">Export Backup</button><button class="btn" onclick="Gold10.importBackupPrompt()">Import Backup</button><button class="btn danger" onclick="Gold10.resetAllGold10()">Factory Reset</button></div>${end()}`,{width:870,height:560});}
  function exportBackup(){downloadText("emeraldos-gold10-backup.json",JSON.stringify(collectWorkspace(),null,2));}
  function importBackupPrompt(){const text=prompt("Paste backup JSON"); if(!text) return; try{applyWorkspace(JSON.parse(text)); notify("Backup imported","Workspace restored from pasted backup.","Restore Center");}catch(e){alert("Invalid JSON: "+e.message);}}
  function resetAllGold10(){if(!confirm("Reset all Gold 1.0 local data?")) return; Object.values(LS).forEach(k=>localStorage.removeItem(k)); location.reload();}
  function openUpdateCenter(){openWindow("update","Update Center",`${header("update","Update Center","Maintenance, version notes, and update checks.")}<div class="card"><h3>${BUILD.name}</h3><small>${BUILD.version}</small><p>Independent Gold 1.0 shell with modern desktop, settings, Explorer, Office, Mail, Chat, Store, Creator Studio, Action Center, Task View, Widgets, Restore, and cloud workspace.</p></div><button class="btn primary" onclick="Gold10.notify('System up to date','No updates available in this local package.','Update Center')">Check for updates</button>${end()}`);}
  function openDeviceLink(){openWindow("device","Device Link",`${header("device","Device Link","Device, browser, account, and sync identity.")}<div class="grid"><div class="card"><h3>Username</h3><small>${esc(username())}</small></div><div class="card"><h3>Mail</h3><small>${esc(mailAddress())}</small></div><div class="card"><h3>Device</h3><small>${esc(navigator.platform)}</small></div><div class="card"><h3>Browser</h3><small>${esc(navigator.userAgent.slice(0,90))}</small></div></div>${end()}`);}
  function openSecurity(){openWindow("security","Security Center",`${header("security","Security Center","Privacy, risky apps, blocked users, and safe-mode controls.")}<div class="grid"><div class="card"><h3>Blocked users</h3><small>${people().filter(p=>p.blocked).length} blocked</small></div><div class="card"><h3>User apps</h3><small>${userApps().length} installed</small></div><div class="card"><h3>Focus Assist</h3><small>${prefs().focusAssist?'Enabled':'Disabled'}</small></div></div><div class="toolbar"><button class="btn" onclick="Gold10.openApp('people')">Manage Blocked Users</button><button class="btn" onclick="Gold10.openApp('store')">Review User Apps</button><button class="btn danger" onclick="Gold10.disableUserApps()">Disable User Apps</button></div>${end()}`);}
  function disableUserApps(){if(confirm("Remove all installed user apps?")){setUserApps([]); notify("User apps disabled","All custom apps were removed.","Security Center");}}
  function openMedia(){openWindow("media","Media Center",`${header("media","Media Center","Gallery, playlists, viewer, and presentation mode.")}<div class="grid"><div class="card"><h3>Gallery</h3><small>Image placeholders and visual library.</small></div><div class="card"><h3>Playlists</h3><small>Organize media records.</small></div><div class="card"><h3>Presentation Mode</h3><small>Launch slides in full-screen style.</small></div></div>${end()}`);}
  function openProfile(){openWindow("profile","User Profile",`${header("profile","User Profile","Account identity and Gold 1.0 status.")}<div class="grid"><div class="card"><h3>${esc(username())}</h3><small>Username</small></div><div class="card"><h3>${esc(mailAddress())}</h3><small>Gold Mail address</small></div><div class="card"><h3>${esc(BUILD.name)}</h3><small>${esc(BUILD.version)}</small></div></div>${end()}`);}
  function openHelp(){openWindow("help","Help and Support",`${header("help","Help and Support","Guides, shortcuts, troubleshooting, and about Gold 1.0.")}<div class="grid"><div class="card"><h3>Start</h3><small>Use Start to open apps, settings, and power tools.</small></div><div class="card"><h3>Explorer</h3><small>Create, rename, preview, star, trash, restore, and export files.</small></div><div class="card"><h3>Restore</h3><small>Save workspace locally or to Firebase and resume across devices.</small></div><div class="card"><h3>Shortcuts</h3><small>Ctrl+Space Search · Ctrl+Shift+P Start · Alt+Tab Task View</small></div></div><p class="notice">This is a Windows 10-inspired original EmeraldOS model. It does not use Microsoft assets.</p>${end()}`);}



  /* ===================== GOLD 1.0 FIRST BOOT + BUILT-IN APPS ===================== */
  function goldPrefs(){return readJSON(BUILD.prefix+"goldPrefs",{setupComplete:false,layout:"balanced",tileSize:"medium",taskbarMode:"standard",transparency:true,wallpaper:"gold-blue",appStyle:"modern",showDesktopApps:true});}
  function setGoldPrefs(next){writeJSON(BUILD.prefix+"goldPrefs",{...goldPrefs(),...next});}
  function openGoldSetup(){
    openWindow("goldsetup","Gold First Boot Setup",`${header("settings","Welcome to EmeraldOS Gold 1.0","First boot setup only appears once on this device. You can reopen customization from Settings.")}
      <div class="gold-setup-grid">
        <div class="gold-step"><b>1. Desktop layout</b><select id="gold_setup_layout" class="field"><option value="balanced">Balanced</option><option value="productivity">Productivity</option><option value="minimal">Minimal</option><option value="creator">Creator</option></select></div>
        <div class="gold-step"><b>2. Accent color</b><input id="gold_setup_accent" class="field" type="color" value="${esc(prefs().accent||'#0078d4')}"></div>
        <div class="gold-step"><b>3. Visual style</b><select id="gold_setup_theme" class="field"><option value="dark">Gold Dark</option><option value="light">Gold Light</option><option value="dark-windows">Dark Windows</option><option value="contrast">High Contrast</option></select></div>
        <div class="gold-step"><b>4. Workspace resume</b><label><input id="gold_setup_resume" type="checkbox" checked> Save and restore my workspace across devices when Firebase is available.</label></div>
        <div class="gold-step"><b>5. Notifications</b><label><input id="gold_setup_notify" type="checkbox" checked> Enable Action Center notifications.</label></div>
        <div class="gold-step"><b>6. Density</b><select id="gold_setup_density" class="field"><option value="normal">Normal</option><option value="compact">Compact</option><option value="comfortable">Comfortable</option></select></div>
      </div>
      <div class="toolbar"><button class="btn primary" onclick="Gold10.finishGoldSetup()">Finish Setup</button><button class="btn" onclick="Gold10.applyRecommendedGoldSetup()">Use Recommended</button></div>
      <p class="notice">EmeraldOS Gold 1.0 is a Windows 10-inspired original EmeraldOS product. It uses original EmeraldOS styling and assets.</p>${end()}`,{width:880,height:620,multi:true});
  }
  function finishGoldSetup(){
    const layout=$("gold_setup_layout")?.value||"balanced";
    const accent=$("gold_setup_accent")?.value||"#0078d4";
    const theme=$("gold_setup_theme")?.value||"dark";
    const density=$("gold_setup_density")?.value||"normal";
    const restoreOnBoot=!!$("gold_setup_resume")?.checked;
    const notifications=!!$("gold_setup_notify")?.checked;
    setGoldPrefs({setupComplete:true,layout,density});
    setPrefs({accent,theme,density,restoreOnBoot,notifications});
    localStorage.setItem(LS.setupDone,"true");
    closeWindow(state.activeId);
    notify("Setup complete","EmeraldOS Gold 1.0 is ready.","First Boot","success");
    openHome();
  }
  function applyRecommendedGoldSetup(){
    if($("gold_setup_layout")) $("gold_setup_layout").value="balanced";
    if($("gold_setup_theme")) $("gold_setup_theme").value="dark";
    if($("gold_setup_density")) $("gold_setup_density").value="normal";
    if($("gold_setup_accent")) $("gold_setup_accent").value="#0078d4";
    if($("gold_setup_resume")) $("gold_setup_resume").checked=true;
    if($("gold_setup_notify")) $("gold_setup_notify").checked=true;
  }
  function openGoldPersonalization(){
    const g=goldPrefs(), p=prefs();
    openWindow("goldpersonalization","Gold Personalization",`${header("settings","Gold Personalization","Customize the Gold desktop, taskbar, Start menu, windows, and built-in apps.")}
      <div class="split"><aside class="sidebar"><b>Personalization</b><div class="list-item">Themes</div><div class="list-item">Desktop</div><div class="list-item">Start</div><div class="list-item">Taskbar</div><div class="list-item">Apps</div></aside>
      <section><div class="grid">
        <label class="card"><h3>Accent</h3><input id="gold_acc" type="color" value="${esc(p.accent||'#0078d4')}"></label>
        <label class="card"><h3>Theme</h3><select id="gold_theme" class="field"><option value="dark">Gold Dark</option><option value="light">Gold Light</option><option value="dark-windows">Dark Windows</option><option value="contrast">High Contrast</option></select></label>
        <label class="card"><h3>Desktop layout</h3><select id="gold_layout" class="field"><option value="balanced">Balanced</option><option value="productivity">Productivity</option><option value="minimal">Minimal</option><option value="creator">Creator</option></select></label>
        <label class="card"><h3>Tile size</h3><select id="gold_tile" class="field"><option value="small">Small</option><option value="medium">Medium</option><option value="wide">Wide</option></select></label>
        <label class="card"><h3>Density</h3><select id="gold_density" class="field"><option value="compact">Compact</option><option value="normal">Normal</option><option value="comfortable">Comfortable</option></select></label>
        <label class="card"><h3>Taskbar</h3><select id="gold_taskbar" class="field"><option value="standard">Standard</option><option value="compact">Compact</option><option value="labels">Labels</option></select></label>
      </div><div class="toolbar"><button class="btn primary" onclick="Gold10.saveGoldPersonalization()">Apply</button><button class="btn" onclick="Gold10.openGoldSetup()">Run Setup Again</button><button class="btn" onclick="Gold10.resetGoldSetup()">Reset First Boot</button></div></section></div>${end()}`,{width:980,height:680});
    setTimeout(()=>{["gold_theme","gold_layout","gold_tile","gold_density","gold_taskbar"].forEach(k=>{const el=$(k); if(!el)return; const key=k.replace('gold_',''); el.value = key==='theme'?p.theme:(g[key]||el.value);});},20);
  }
  function saveGoldPersonalization(){
    setGoldPrefs({layout:$("gold_layout")?.value||"balanced",tileSize:$("gold_tile")?.value||"medium",taskbarMode:$("gold_taskbar")?.value||"standard"});
    setPrefs({accent:$("gold_acc")?.value||"#0078d4",theme:$("gold_theme")?.value||"dark",density:$("gold_density")?.value||"normal"});
    notify("Personalization saved","Your Gold theme settings were applied.","Settings");
  }
  function resetGoldSetup(){localStorage.removeItem(LS.setupDone); setGoldPrefs({setupComplete:false}); notify("First boot reset","Reload to run Gold setup again.","Settings","warning");}

  function openGoldCalculator(){openWindow("calculator","Gold Calculator",`${header("calculator","Gold Calculator","Built-in calculator styled for Gold 1.0.")}<div class="gold-calc"><input id="gold_calc_display" value="0" readonly>${["7","8","9","/","4","5","6","*","1","2","3","-","0",".","=","+"].map(x=>`<button onclick="Gold10.calcPress('${x}')">${x}</button>`).join("")}<button onclick="Gold10.calcClear()" class="wide">Clear</button></div>${end()}`,{width:360,height:520});}
  function calcPress(v){const d=$("gold_calc_display"); if(!d)return; if(v==="="){try{d.value=String(Function('return ('+d.value.replace(/[^0-9+\-*/(). ]/g,'')+')')());}catch{d.value="Error";}return;} d.value=(d.value==="0"||d.value==="Error"?"":d.value)+v;}
  function calcClear(){const d=$("gold_calc_display"); if(d)d.value="0";}
  function openGoldNotepad(){openWindow("notepad","Gold Notepad",`${header("notepad","Gold Notepad","Quick notes with autosave and export.")}<div class="toolbar"><button class="btn primary" onclick="Gold10.saveNotepad()">Save</button><button class="btn" onclick="Gold10.exportNotepad()">Export TXT</button></div><textarea id="gold_notepad" class="editor" oninput="localStorage.setItem('${BUILD.prefix}notepadDraft',this.value)">${esc(localStorage.getItem(BUILD.prefix+'notepadDraft')||'')}</textarea>${end()}`,{width:760,height:580});}
  function saveNotepad(){localStorage.setItem(BUILD.prefix+'notepadDraft',$("gold_notepad")?.value||''); notify("Notepad saved","Your note was saved locally.","Gold Notepad");}
  function exportNotepad(){downloadText('gold-notepad.txt',$("gold_notepad")?.value||'');}
  function openGoldPhotos(){openWindow("photos","Gold Photos",`${header("photos","Gold Photos","Gallery-style media workspace.")}<div class="grid">${["Screenshots","Wallpapers","Profile Pictures","Uploads","Favorites","Albums"].map((x,i)=>`<div class="card gold-photo-card"><h3>${x}</h3><small>${i+2} items</small><button class="btn" onclick="Gold10.notify('Gold Photos','${x} opened.','Photos')">Open</button></div>`).join('')}</div>${end()}`,{width:880,height:590});}
  function openGoldCalendar(){const events=readJSON(BUILD.prefix+'events',[{title:'Welcome to Gold 1.0',date:new Date().toLocaleDateString()}]);openWindow("calendar","Gold Calendar",`${header("calendar","Gold Calendar","Agenda and event planner.")}<div class="toolbar"><input id="gold_event_title" placeholder="Event title"><input id="gold_event_date" type="date"><button class="btn primary" onclick="Gold10.addCalendarEvent()">Add Event</button></div><div id="gold_events">${events.map((e,i)=>`<div class="list-item"><div><b>${esc(e.title)}</b><small>${esc(e.date)}</small></div><button class="btn danger" onclick="Gold10.deleteCalendarEvent(${i})">Delete</button></div>`).join('')||'<div class="notice">No events yet.</div>'}</div>${end()}`,{width:720,height:560});}
  function addCalendarEvent(){const arr=readJSON(BUILD.prefix+'events',[]); arr.unshift({title:$("gold_event_title")?.value||'Untitled event',date:$("gold_event_date")?.value||new Date().toLocaleDateString()}); writeJSON(BUILD.prefix+'events',arr); notify('Event added',arr[0].title,'Calendar'); openGoldCalendar();}
  function deleteCalendarEvent(i){const arr=readJSON(BUILD.prefix+'events',[]); arr.splice(i,1); writeJSON(BUILD.prefix+'events',arr); openGoldCalendar();}
  function openGoldWeather(){openWindow("weather","Gold Weather",`${header("weather","Gold Weather","Weather-style dashboard for saved locations.")}<div class="grid"><div class="card"><h3>Local</h3><small>Weather provider not connected.</small><p>Use this as a placeholder for a future weather API.</p></div><div class="card"><h3>Cloud Status</h3><small>Workspace sync: ${session().lastSaved?'Saved':'Not saved yet'}</small></div></div>${end()}`);}
  function openGoldAlarms(){openWindow("alarms","Gold Alarms & Clock",`${header("alarms","Gold Alarms & Clock","Clock, timer, and reminders.")}<div class="grid"><div class="card"><h3>${new Date().toLocaleTimeString()}</h3><small>Current time</small></div><div class="card"><h3>Timer</h3><input id="gold_timer_min" class="field" type="number" value="5"><button class="btn" onclick="Gold10.notify('Timer set','Timer placeholder saved.','Alarms')">Set Timer</button></div></div>${end()}`);}
  function openGoldBrowser(){openWindow("browser","Gold Browser",`${header("browser","Gold Browser","Internal shortcuts and safe web launcher.")}<div class="toolbar"><input id="gold_url" placeholder="https://example.com"><button class="btn primary" onclick="Gold10.openGoldUrl()">Open in new tab</button></div><div class="grid">${['EmeraldOS Home','Docs','Mail','Store','Settings'].map(x=>`<div class="card"><h3>${x}</h3><small>Shortcut</small></div>`).join('')}</div>${end()}`);}
  function openGoldUrl(){let u=$("gold_url")?.value||''; if(u && !/^https?:\/\//i.test(u)) u='https://'+u; if(u) window.open(u,'_blank','noopener');}
  function openGoldCamera(){openWindow("camera","Gold Camera",`${header("camera","Gold Camera","Camera records and capture notes.")}<div class="notice">Browser camera capture is not enabled in this package. This app stores capture notes for future media features.</div><textarea class="editor" oninput="localStorage.setItem('${BUILD.prefix}cameraNotes',this.value)">${esc(localStorage.getItem(BUILD.prefix+'cameraNotes')||'')}</textarea>${end()}`);}
  function openGoldFeedback(){openWindow("feedback","Feedback Hub",`${header("feedback","Feedback Hub","Send bugs, ideas, ratings, and system feedback.")}<div class="toolbar"><select id="gold_feedback_type" class="field"><option>Bug</option><option>Suggestion</option><option>Rating</option></select><button class="btn primary" onclick="Gold10.saveFeedback()">Submit</button></div><textarea id="gold_feedback_body" class="editor" placeholder="Describe your feedback..."></textarea>${end()}`);}
  function saveFeedback(){const arr=readJSON(BUILD.prefix+'feedback',[]); arr.unshift({type:$("gold_feedback_type")?.value||'Feedback',body:$("gold_feedback_body")?.value||'',date:now()}); writeJSON(BUILD.prefix+'feedback',arr); notify('Feedback saved','Stored locally for review.','Feedback Hub');}
  function openGoldMaps(){openWindow("maps","Gold Maps",`${header("maps","Gold Maps","Saved places and route notes.")}<div class="grid">${['Headquarters','School','Home','Event Location'].map(x=>`<div class="card"><h3>${x}</h3><small>Saved place placeholder</small></div>`).join('')}</div>${end()}`);}
  function openGoldNews(){openWindow("news","Gold News",`${header("news","Gold News","Announcements and update reader.")}<div class="grid"><div class="card"><h3>EmeraldOS Gold 1.0</h3><small>Now includes first-boot setup, BIOS A1, DOS, personalization, and built-in apps.</small></div><div class="card"><h3>Workspace Restore</h3><small>Use Restore Center to save or restore your Gold workspace.</small></div></div>${end()}`);}

  function downloadText(filename,content){const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([content],{type:"text/plain"})); a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),500);}
  function closeAllWindows(){state.windows.slice().forEach(w=>closeWindow(w.id));}
  function tileWindows(){const wins=state.windows.map(w=>$(w.id)).filter(Boolean); const cols=Math.ceil(Math.sqrt(wins.length||1)); const rows=Math.ceil((wins.length||1)/cols); const w=(window.innerWidth)/cols; const h=(window.innerHeight-48)/rows; wins.forEach((el,i)=>{el.classList.remove("max","min"); const c=i%cols,r=Math.floor(i/cols); Object.assign(el.style,{left:c*w+"px",top:r*h+"px",width:w+"px",height:h+"px"});});}
  function cascadeWindows(){state.windows.forEach((w,i)=>{const el=$(w.id); if(el){el.classList.remove("max","min");Object.assign(el.style,{left:30+i*26+"px",top:20+i*26+"px",width:"760px",height:"520px"});}});}
  function restart(){location.href="loading.html";}

  function tickClock(){const c=$("clock"); if(c){const d=new Date(); c.innerHTML=`${d.toLocaleTimeString([],prefs().showSeconds?{}:{hour:'numeric',minute:'2-digit'})}<br>${d.toLocaleDateString([], {month:'numeric',day:'numeric',year:'2-digit'})}`;}}
  function initShortcuts(){document.addEventListener("keydown",e=>{if(e.ctrlKey&&e.code==="Space"){e.preventDefault();openSearch();} if(e.ctrlKey&&e.shiftKey&&e.code==="KeyP"){e.preventDefault();toggleStart();} if(e.altKey&&e.code==="Tab"){e.preventDefault();openTaskView();} if(e.key==="Escape") closeFlyouts();}); document.addEventListener("mousedown",e=>{if(!e.target.closest("#start-menu,#start-button,#search-panel,#task-view,#widgets-panel,#action-center,.flyout")) closeFlyouts();});}
  function init(){applyPrefs(); updateActionButton(); renderDesktop(); renderStart(); tickClock(); setInterval(tickClock,1000); initShortcuts(); setTimeout(()=>$("boot-shade")?.classList.add("done"),550); setTimeout(()=>{ if(!localStorage.getItem(LS.setupDone)){ openGoldSetup(); } else { openHome(); if(prefs().restoreOnBoot) notify("Welcome back to Gold 1.0","Your workspace is ready.","System"); } },650);}

  window.Gold10 = {BUILD,openApp,toggleStart,renderStart,closeFlyouts,openSearch,openTaskView,openWidgets,openActionCenter,openWindow,focusWindow,minimizeWindow,restoreWindow,maximizeWindow,closeWindow,closeAllWindows,tileWindows,cascadeWindows,restart,notify,openExplorer,filterFiles,newFile,newFolder,previewFile,savePreviewFile,renameFile,toggleStar,trashFile,restoreFile,deleteForever,openOffice,openDocEditor,saveDoc,docCount,insertDocTemplate,insertDate,exportDocHTML,copyDocToFiles,openSheets,addSheetRow,saveSheet,sheetTotal,exportCSV,openSlides,saveSlide,presentSlide,openForms,saveForm,previewForm,submitForm,openTemplates,openMail,composeMail,sendMail,saveDraftMail,readMail,deleteMail,openChat,newChatRoom,setChatRoom,sendChat,openPeople,addContact,filterPeople,toggleFavorite,toggleBlock,openStore,openCreator,loadAppTemplate,saveCustomApp,previewCustomApp,runUserApp,exportUserApp,deleteUserApp,installDemoApp,openSettings,saveSettings,resetDesktop,openControlPanel,markNotification,markAllRead,clearNotifications,toggleFocusAssist,doGlobalSearch,openTaskViewWindow,openWidgetsWindow,openActionCenterWindow,openSearchWindow,openTimeline,saveWorkspaceNow:()=>saveWorkspace(true),saveWorkspace,loadCloudWorkspace,loadLocalWorkspace,openRestore,exportBackup,importBackupPrompt,resetAllGold10,openUpdateCenter,openDeviceLink,openSecurity,disableUserApps,openMedia,openProfile,openHelp,downloadText,openGoldSetup,finishGoldSetup,applyRecommendedGoldSetup,openGoldPersonalization,saveGoldPersonalization,resetGoldSetup,openGoldCalculator,calcPress,calcClear,openGoldNotepad,saveNotepad,exportNotepad,openGoldPhotos,openGoldCalendar,addCalendarEvent,deleteCalendarEvent,openGoldWeather,openGoldAlarms,openGoldBrowser,openGoldUrl,openGoldCamera,openGoldFeedback,saveFeedback,openGoldMaps,openGoldNews};
  window.addEventListener("load",init);
})();
