"use strict";

/* =========================================================
   EMERALDOS SILVER ADVANCED
   Separate Aero-modern Silver OS shell.
   Original UI and icons only. No Microsoft assets.
========================================================= */
(function(){
  if(window.EmeraldOSSilverAdvancedLoaded) return;
  window.EmeraldOSSilverAdvancedLoaded = true;

  const BUILD = {
    name: "EmeraldOS Silver Advanced",
    version: "Preview 1.0",
    platform: "EmeraldOS Platform 5.7 compatibility layer",
    prefix: "silver_advanced_",
    cloudPath: "silverAdvanced"
  };

  const LS = {
    prefs: BUILD.prefix + "prefs",
    notifications: BUILD.prefix + "notifications",
    drive: BUILD.prefix + "drive",
    docs: BUILD.prefix + "docs",
    sheets: BUILD.prefix + "sheets",
    slides: BUILD.prefix + "slides",
    forms: BUILD.prefix + "forms",
    notes: BUILD.prefix + "notes",
    tasks: BUILD.prefix + "tasks",
    mail: BUILD.prefix + "mail",
    contacts: BUILD.prefix + "contacts",
    session: BUILD.prefix + "session"
  };

  const ICONS = {
    home:["AD","home"], explorer:["EX","explorer"], office:["OF","office"], mail:["ML","mail"], chat:["CH","chat"], people:["PE","chat"], media:["MD","media"], store:["ST","store"], creator:["CR","creator"], settings:["SE","settings"], control:["CP","settings"], security:["SC","security"], restore:["RS","sync"], sync:["SY","sync"], search:["SR","search"], task:["TV","search"], notes:["NT","office"], calendar:["CA","office"], help:["?","settings"], drive:["DR","explorer"]
  };

  const APPS = [
    {id:"home", name:"Advanced Home", icon:"home", group:"Workspace", desktop:true, run:"openSilverAdvancedHome", desc:"Dashboard, recent work, quick actions, and status."},
    {id:"explorer", name:"Silver Explorer", icon:"explorer", group:"Drive + Office", desktop:true, run:"openSilverAdvancedExplorer", desc:"Consolidated files, folders, recent, starred, shared, and trash."},
    {id:"office", name:"Silver Office", icon:"office", group:"Drive + Office", desktop:true, run:"openSilverAdvancedOffice", desc:"Docs, Sheets, Slides, Forms, templates, and document vault."},
    {id:"mail", name:"Silver Mail", icon:"mail", group:"Communication", desktop:true, run:"openSilverAdvancedMail", desc:"Internal EmeraldOS mail with inbox, sent, drafts, and trash."},
    {id:"chat", name:"Silver Chat", icon:"chat", group:"Communication", run:"openSilverAdvancedChat", desc:"Direct messages, rooms, unread alerts, and reports."},
    {id:"people", name:"People", icon:"people", group:"Communication", run:"openSilverAdvancedPeople", desc:"Contacts, user directory, block list, mail, and chat actions."},
    {id:"media", name:"Media Center", icon:"media", group:"Media", run:"openSilverAdvancedMedia", desc:"Photos, media library, viewer, playlists, and presentation mode."},
    {id:"store", name:"Silver Store", icon:"store", group:"Creator", desktop:true, run:"openSilverAdvancedStore", desc:"User Appstore, installed apps, warnings, ratings, and publishing."},
    {id:"creator", name:"Creator Studio", icon:"creator", group:"Creator", desktop:true, run:"openSilverAdvancedCreator", desc:"Application Editor, Code Studio, snippets, API docs, and themes."},
    {id:"settings", name:"Settings", icon:"settings", group:"System", desktop:true, run:"openSilverAdvancedSettings", desc:"Personalization, desktop, taskbar, notifications, sync, and recovery."},
    {id:"control", name:"Control Panel", icon:"control", group:"System", run:"openSilverAdvancedControlPanel", desc:"Classic advanced management hub for devices, network, programs, and security."},
    {id:"action", name:"Action Center", icon:"security", group:"System", run:"openSilverAdvancedActionCenter", desc:"Universal notifications, quick actions, and system warnings."},
    {id:"restore", name:"Restore Center", icon:"restore", group:"System", desktop:true, run:"openSilverAdvancedRestoreCenter", desc:"Save, restore, reset, and sync your Silver Advanced workspace."},
    {id:"search", name:"Advanced Search", icon:"search", group:"Workspace", run:"openSilverAdvancedSearch", desc:"Search apps, settings, files, contacts, and documents."},
    {id:"taskview", name:"Task View", icon:"task", group:"Workspace", run:"openSilverAdvancedTaskView", desc:"View recent apps and restore open workspaces."},
    {id:"help", name:"Help and Support", icon:"help", group:"Support", run:"openSilverAdvancedHelp", desc:"Guides, shortcuts, troubleshooting, and product information."}
  ];

  let fbCache = null;
  let saveTimer = null;

  function esc(value){return String(value ?? "").replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));}
  function readJSON(key, fallback){try{return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));}catch{return fallback;}}
  function writeJSON(key, value){localStorage.setItem(key, JSON.stringify(value));}
  function username(){return localStorage.getItem("40_username") || localStorage.getItem("username") || localStorage.getItem("40_session") || "SilverUser";}
  function now(){return new Date().toISOString();}
  function displayTime(iso){try{return new Date(iso).toLocaleString();}catch{return "";}}

  function prefs(){return readJSON(LS.prefs,{desktopIcons:["home","explorer","office","mail","store","creator","settings","restore"], theme:"advanced", iconSize:"normal", density:"comfortable", restoreMode:"prompt", notifications:true, sidebar:true, accent:"blue"});}
  function setPrefs(next){writeJSON(LS.prefs,{...prefs(),...next});}
  function notifyList(){return readJSON(LS.notifications,[]);}
  function setNotifications(list){writeJSON(LS.notifications,list.slice(0,200)); updateBell(); scheduleSave();}
  function drive(){return readJSON(LS.drive, seedDrive());}
  function setDrive(items){writeJSON(LS.drive,items); scheduleSave();}
  function docs(){return readJSON(LS.docs, seedDocs());}
  function setDocs(items){writeJSON(LS.docs,items); scheduleSave();}
  function sheets(){return readJSON(LS.sheets, seedSheets());}
  function setSheets(items){writeJSON(LS.sheets,items); scheduleSave();}
  function slides(){return readJSON(LS.slides, seedSlides());}
  function setSlides(items){writeJSON(LS.slides,items); scheduleSave();}
  function forms(){return readJSON(LS.forms, []);}
  function setForms(items){writeJSON(LS.forms,items); scheduleSave();}
  function notes(){return readJSON(LS.notes, []);}
  function setNotes(items){writeJSON(LS.notes,items); scheduleSave();}
  function tasks(){return readJSON(LS.tasks, []);}
  function setTasks(items){writeJSON(LS.tasks,items); scheduleSave();}
  function mail(){return readJSON(LS.mail, seedMail());}
  function setMail(items){writeJSON(LS.mail,items); scheduleSave();}
  function contacts(){return readJSON(LS.contacts, seedContacts());}
  function setContacts(items){writeJSON(LS.contacts,items); scheduleSave();}
  function session(){return readJSON(LS.session,{openApps:[],recentApps:[],lastSavedAt:null,lastRestoredAt:null,device:navigator.userAgent.slice(0,80),product:BUILD.name});}
  function setSession(next){writeJSON(LS.session,{...session(),...next,product:BUILD.name});}

  function seedDrive(){return [
    {id:id(),type:"folder",name:"Documents",star:false,trash:false,created:now(),updated:now(),folder:"My Drive"},
    {id:id(),type:"folder",name:"Projects",star:true,trash:false,created:now(),updated:now(),folder:"My Drive"},
    {id:id(),type:"edoc",name:"Welcome to Silver Advanced.edoc",star:true,trash:false,created:now(),updated:now(),folder:"Documents",content:"Welcome to EmeraldOS Silver Advanced. This workspace is designed to feel separate, responsive, and cloud-resumable."}
  ];}
  function seedDocs(){return [{id:id(),name:"Welcome Document",content:"Welcome to EmeraldOS Silver Advanced.\n\nUse Silver Office to create documents, spreadsheets, slides, and forms. Use Restore Center to save and resume your workspace.",updated:now(),star:true}];}
  function seedSheets(){return [{id:id(),name:"Budget Sheet",cells:[["Item","Amount","Status"],["Hosting","0","OK"],["Storage","0","OK"]],updated:now()}];}
  function seedSlides(){return [{id:id(),name:"Silver Advanced Tour",slides:[{title:"EmeraldOS Silver Advanced",body:"A consolidated Aero-modern Silver OS line."},{title:"Drive + Office",body:"Create, save, and restore your work."}],updated:now()}];}
  function seedMail(){return [{id:id(),box:"inbox",from:"system@emeraldos.mail",to:username()+"@emeraldos.mail",subject:"Welcome to Silver Mail",body:"Silver Mail is ready in EmeraldOS Silver Advanced.",read:false,star:true,time:now()}];}
  function seedContacts(){return [{id:id(),name:"Emerald System",username:"system",mail:"system@emeraldos.mail",favorite:true,blocked:false,status:"Online"}];}
  function id(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8);}

  function iconHTML(icon, small=false){const d=ICONS[icon]||ICONS.home; return `<span class="adv-logo ${esc(d[1])} ${small?"small":""}"><span>${esc(d[0])}</span></span>`;}
  function header(icon,title,subtitle){return `<div class="adv-shell"><div class="adv-header">${iconHTML(icon)}<div><h2>${esc(title)}</h2><p>${esc(subtitle||BUILD.name)}</p></div></div>`;}
  function end(){return `</div>`;}
  function status(){return `<div class="adv-status"><div class="adv-status-card"><b>Product</b><span>${esc(BUILD.name)}</span></div><div class="adv-status-card"><b>User</b><span>${esc(username())}</span></div><div class="adv-status-card"><b>Session</b><span>${session().lastSavedAt?"Saved":"Local"}</span></div><div class="adv-status-card"><b>Notifications</b><span>${notifyList().filter(n=>!n.read).length} unread</span></div></div>`;}
  function card(app){return `<div class="adv-card" onclick="window['${esc(app.run)}']?.()">${iconHTML(app.icon)}<div><b>${esc(app.name)}</b><small>${esc(app.desc)}</small><div class="meta"><span class="adv-pill">${esc(app.group)}</span><span class="adv-pill">Advanced</span></div></div></div>`;}
  function appGrid(apps=APPS){return `<div class="adv-grid">${apps.map(card).join("")}</div>`;}
  function btn(text, fn){return `<button class="adv-btn" onclick="${fn}">${esc(text)}</button>`;}

  function open(title, html, appId){
    if(typeof window.openWindow === "function") window.openWindow(title, html, appId || title.replace(/\W+/g,""));
    else {
      const div = document.createElement("div"); div.className="adv-toast"; div.innerHTML=`<b>${esc(title)}</b><div>${html}</div>`; document.body.appendChild(div); setTimeout(()=>div.remove(),6000);
    }
    remember(appId || title.replace(/\W+/g,"").toLowerCase());
  }
  function remember(appId){
    if(!appId) return;
    const s=session();
    const recent=[appId,...(s.recentApps||[]).filter(x=>x!==appId)].slice(0,14);
    const openApps=[appId,...(s.openApps||[]).filter(x=>x!==appId)].slice(0,8);
    setSession({recentApps:recent,openApps,device:navigator.userAgent.slice(0,80)});
    scheduleSave();
  }
  function runAppId(id){const app=APPS.find(a=>a.id===id); if(app && typeof window[app.run]==="function") window[app.run]();}

  function notify(title, body, source="Silver Advanced", level="info"){
    const item={id:id(),title:String(title||"Notification"),body:String(body||""),source,level,read:false,time:now()};
    const list=notifyList(); list.unshift(item); setNotifications(list);
    if(prefs().notifications!==false){
      const div=document.createElement("div"); div.className="adv-toast"; div.innerHTML=`<b>${esc(title)}</b><div>${esc(body)}</div>`; document.body.appendChild(div); setTimeout(()=>div.remove(),4200);
    }
    return item.id;
  }
  window.silverAdvancedNotify = notify;

  function patchNotify(){
    if(window.__silverAdvancedNotifyPatched || typeof window.notify !== "function") return;
    window.__silverAdvancedNotifyPatched=true;
    const original=window.notify;
    window.notify=function(title,msg,timeout,type){ try{notify(title,msg,"Platform",type||"info");}catch{} return original(title,msg,timeout,type); };
  }
  function updateBell(){
    const count=notifyList().filter(n=>!n.read).length;
    const bell=document.getElementById("silver-advanced-bell");
    if(bell){bell.textContent=String(count); bell.classList.toggle("has-unread", count>0);}
  }
  function setSync(text, good){const el=document.getElementById("silver-advanced-sync"); if(el){el.textContent=text; el.classList.toggle("sync-good",!!good);}}

  async function firebase(){ if(fbCache) return fbCache; try{fbCache=await import("./firebase.js"); return fbCache;}catch{return null;} }
  async function saveCloud(){
    const fb=await firebase(); if(!fb || !fb.db || !fb.setDoc || !fb.doc){setSync("Local",false); return false;}
    try{
      setSync("Syncing",false);
      const payload={updatedAt:now(),user:username(),prefs:prefs(),session:session(),notifications:notifyList(),drive:drive(),docs:docs(),sheets:sheets(),slides:slides(),forms:forms(),notes:notes(),tasks:tasks(),mail:mail(),contacts:contacts()};
      await fb.setDoc(fb.doc(fb.db,"emeraldOSUsers",username(),BUILD.cloudPath,"current"),payload,{merge:true});
      setSession({lastSavedAt:now()}); setSync("Synced",true); return true;
    }catch(err){console.error(err); setSync("Sync Failed",false); notify("Sync Failed",err.message,"Sync","warning"); return false;}
  }
  async function loadCloud(){
    const fb=await firebase(); if(!fb || !fb.db || !fb.getDoc || !fb.doc){notify("Restore Center","Firebase is not available; using local session.","Restore","warning"); return false;}
    try{
      setSync("Loading",false);
      const snap=await fb.getDoc(fb.doc(fb.db,"emeraldOSUsers",username(),BUILD.cloudPath,"current"));
      if(!snap.exists()){notify("Restore Center","No cloud workspace was found for this user.","Restore","info"); setSync("Local",false); return false;}
      const d=snap.data();
      if(d.prefs) writeJSON(LS.prefs,d.prefs); if(d.session) writeJSON(LS.session,{...d.session,lastRestoredAt:now()}); if(d.notifications) writeJSON(LS.notifications,d.notifications);
      if(d.drive) writeJSON(LS.drive,d.drive); if(d.docs) writeJSON(LS.docs,d.docs); if(d.sheets) writeJSON(LS.sheets,d.sheets); if(d.slides) writeJSON(LS.slides,d.slides); if(d.forms) writeJSON(LS.forms,d.forms); if(d.notes) writeJSON(LS.notes,d.notes); if(d.tasks) writeJSON(LS.tasks,d.tasks); if(d.mail) writeJSON(LS.mail,d.mail); if(d.contacts) writeJSON(LS.contacts,d.contacts);
      updateBell(); renderDesktop(); setSync("Restored",true); notify("Workspace Restored","Your Silver Advanced workspace was restored from the cloud.","Restore","success"); return true;
    }catch(err){console.error(err); setSync("Restore Failed",false); notify("Restore Failed",err.message,"Restore","warning"); return false;}
  }
  function scheduleSave(){clearTimeout(saveTimer); saveTimer=setTimeout(saveCloud,1200);}

  function renderDesktop(){
    const desktop=document.getElementById("desktop"); if(!desktop) return;
    document.title=BUILD.name;
    document.body.classList.add("silver-advanced-shell");
    const p=prefs();
    const apps=APPS.filter(a=>(p.desktopIcons||[]).includes(a.id));
    desktop.innerHTML=apps.map(a=>`<div class="adv-desktop-icon icon" tabindex="0" onclick="window['${esc(a.run)}']?.(); setTimeout(()=>this.blur(),20);">${iconHTML(a.icon)}<label>${esc(a.name)}</label></div>`).join("") + `<div class="adv-desktop-watermark"><b>${BUILD.name}</b><span>${BUILD.version}</span></div>`;
  }

  function openBase(name, fallback){ if(typeof window[name]==="function") return window[name](); notify("Compatibility",fallback||`${name} is not available in this build.`,"Compatibility","warning"); }

  window.openSilverAdvancedHome=function(){
    const s=session(); const rec=(s.recentApps||[]).map(id=>APPS.find(a=>a.id===id)).filter(Boolean).slice(0,6);
    open("Silver Advanced Home", `${header("home","Silver Advanced Home","Your consolidated workspace dashboard")}${status()}<div class="adv-toolbar">${btn("Open Explorer","openSilverAdvancedExplorer()")}${btn("New Document","openSilverAdvancedDocEditor()")}${btn("Open Mail","openSilverAdvancedMail()")}${btn("Restore Center","openSilverAdvancedRestoreCenter()")}${btn("Settings","openSilverAdvancedSettings()")}</div><h3>Recent apps</h3>${rec.length?appGrid(rec):"<p>No recent apps yet.</p>"}<h3>Workspace hubs</h3>${appGrid(APPS.filter(a=>["Workspace","Drive + Office","Communication","Creator","System"].includes(a.group)).slice(0,10))}${end()}`,"home");
  };

  window.openSilverAdvancedExplorer=function(view="drive"){
    const items=drive();
    const filtered=items.filter(i=>view==="trash"?i.trash:!i.trash);
    open("Silver Explorer", `${header("explorer","Silver Explorer","Drive, files, folders, recent, starred, shared, and trash")}
      <div class="adv-two"><div class="adv-side"><h3>Locations</h3><div class="adv-list">
      ${["drive","recent","starred","shared","trash"].map(v=>`<button class="adv-btn" onclick="openSilverAdvancedExplorer('${v}')">${v[0].toUpperCase()+v.slice(1)}</button>`).join("")}
      </div><hr><button class="adv-btn" onclick="silverAdvNewFolder()">New Folder</button><button class="adv-btn" onclick="openSilverAdvancedDocEditor()">New Document</button><button class="adv-btn" onclick="silverAdvUploadTextFile()">Upload Text</button></div>
      <div class="adv-main"><div class="adv-toolbar"><input id="adv_file_search" placeholder="Search files" oninput="silverAdvFilterFiles(this.value)"><button onclick="silverAdvEmptyTrash()">Empty Trash</button><button onclick="saveSilverAdvancedWorkspace()">Sync Now</button></div><div id="adv_file_list" class="adv-list">${fileRows(filtered,view)}</div></div></div>${end()}`,"explorer");
  };
  function fileRows(items,view){
    const list = view==="recent" ? [...items].sort((a,b)=>String(b.updated).localeCompare(String(a.updated))).slice(0,20) : view==="starred" ? items.filter(i=>i.star) : items;
    return list.map(i=>`<div class="adv-row" data-file-name="${esc(i.name).toLowerCase()}"><div class="grow">${iconHTML(i.type==="folder"?"explorer":"office",true)} <b>${esc(i.name)}</b><br><small>${esc(i.type)} • ${esc(i.folder||"My Drive")} • ${esc(displayTime(i.updated||i.created))}</small></div><div>${i.trash?`<button onclick="silverAdvRestoreFile('${i.id}')">Restore</button><button onclick="silverAdvDeleteForever('${i.id}')">Delete Forever</button>`:`<button onclick="silverAdvOpenFile('${i.id}')">Open</button><button onclick="silverAdvStarFile('${i.id}')">${i.star?"Unstar":"Star"}</button><button onclick="silverAdvRenameFile('${i.id}')">Rename</button><button onclick="silverAdvTrashFile('${i.id}')">Trash</button>`}</div></div>`).join("") || "<p>No files in this view.</p>";
  }
  window.silverAdvFilterFiles=function(q){document.querySelectorAll("#adv_file_list [data-file-name]").forEach(el=>el.style.display=el.dataset.fileName.includes(String(q||"").toLowerCase())?"flex":"none");};
  window.silverAdvNewFolder=function(){const name=prompt("Folder name:","New Folder"); if(!name) return; const items=drive(); items.unshift({id:id(),type:"folder",name,folder:"My Drive",star:false,trash:false,created:now(),updated:now()}); setDrive(items); notify("Folder Created",name,"Explorer"); openSilverAdvancedExplorer();};
  window.silverAdvUploadTextFile=function(){const name=prompt("File name:","Imported Note.txt"); if(!name) return; const content=prompt("Text content:","")||""; const items=drive(); items.unshift({id:id(),type:"text",name,content,folder:"My Drive",star:false,trash:false,created:now(),updated:now()}); setDrive(items); notify("File Uploaded",name,"Explorer"); openSilverAdvancedExplorer();};
  window.silverAdvOpenFile=function(fid){const item=drive().find(i=>i.id===fid); if(!item) return; if(item.type==="edoc") return openSilverAdvancedDocEditor(item.id); open("File Preview", `${header("explorer",item.name,"Silver Explorer preview")}<pre>${esc(item.content||JSON.stringify(item,null,2))}</pre>${end()}`,"adv-file-preview");};
  window.silverAdvStarFile=function(fid){const items=drive().map(i=>i.id===fid?{...i,star:!i.star,updated:now()}:i); setDrive(items); openSilverAdvancedExplorer();};
  window.silverAdvRenameFile=function(fid){const items=drive(); const item=items.find(i=>i.id===fid); if(!item) return; const name=prompt("Rename file:",item.name); if(!name) return; item.name=name; item.updated=now(); setDrive(items); openSilverAdvancedExplorer();};
  window.silverAdvTrashFile=function(fid){setDrive(drive().map(i=>i.id===fid?{...i,trash:true,updated:now()}:i)); notify("Moved to Trash","File moved to trash.","Explorer"); openSilverAdvancedExplorer();};
  window.silverAdvRestoreFile=function(fid){setDrive(drive().map(i=>i.id===fid?{...i,trash:false,updated:now()}:i)); notify("File Restored","File restored from trash.","Explorer"); openSilverAdvancedExplorer("trash");};
  window.silverAdvDeleteForever=function(fid){if(!confirm("Delete forever?")) return; setDrive(drive().filter(i=>i.id!==fid)); openSilverAdvancedExplorer("trash");};
  window.silverAdvEmptyTrash=function(){if(!confirm("Empty trash?")) return; setDrive(drive().filter(i=>!i.trash)); openSilverAdvancedExplorer("trash");};

  window.openSilverAdvancedOffice=function(){
    open("Silver Office", `${header("office","Silver Office","Docs, Sheets, Slides, Forms, Templates, and Vault")}${status()}<div class="adv-grid">
    ${card({name:"Silver Docs",icon:"office",group:"Office",desc:"Create rich documents with autosave and export.",run:"openSilverAdvancedDocs"})}
    ${card({name:"Silver Sheets",icon:"office",group:"Office",desc:"Editable grid with CSV export and basic totals.",run:"openSilverAdvancedSheets"})}
    ${card({name:"Silver Slides",icon:"office",group:"Office",desc:"Slide decks with present mode and themes.",run:"openSilverAdvancedSlides"})}
    ${card({name:"Silver Forms",icon:"office",group:"Office",desc:"Form builder for simple questionnaires.",run:"openSilverAdvancedForms"})}
    ${card({name:"Templates",icon:"office",group:"Office",desc:"Letters, memos, reports, policies, and project templates.",run:"openSilverAdvancedTemplates"})}
    ${card({name:"Document Vault",icon:"drive",group:"Office",desc:"Saved Office files from Silver Drive.",run:"openSilverAdvancedExplorer"})}
    </div>${end()}`,"office");
  };
  window.openSilverAdvancedDocs=function(){const list=docs(); open("Silver Docs", `${header("office","Silver Docs","Documents saved into Silver Advanced workspace")}<div class="adv-toolbar"><button onclick="openSilverAdvancedDocEditor()">New Doc</button><button onclick="openSilverAdvancedTemplates()">Templates</button><button onclick="openSilverAdvancedExplorer('recent')">Recent Files</button></div><div class="adv-list">${list.map(d=>`<div class="adv-row"><div class="grow"><b>${esc(d.name)}</b><br><small>${esc(displayTime(d.updated))} • ${d.content.split(/\s+/).filter(Boolean).length} words</small></div><button onclick="openSilverAdvancedDocEditor('${d.id}')">Open</button><button onclick="silverAdvDeleteDoc('${d.id}')">Delete</button></div>`).join("")||"No documents."}</div>${end()}`,"adv-docs");};
  window.openSilverAdvancedDocEditor=function(docId){const list=docs(); const doc=list.find(d=>d.id===docId)||{id:id(),name:"Untitled Document",content:"",updated:now(),star:false}; open("Silver Docs Editor", `${header("office","Silver Docs Editor","Autosave, export, templates, and Drive integration")}<div class="adv-toolbar"><input id="adv_doc_name" value="${esc(doc.name)}"><button onclick="silverAdvSaveDoc('${doc.id}')">Save</button><button onclick="silverAdvExportDoc('${doc.id}','txt')">Export TXT</button><button onclick="silverAdvExportDoc('${doc.id}','html')">Export HTML</button><button onclick="silverAdvInsertDocTemplate()">Insert Template</button><span id="adv_doc_status" class="adv-pill">Ready</span></div><textarea id="adv_doc_content" class="adv-editor" oninput="silverAdvDocCount()">${esc(doc.content)}</textarea><div id="adv_doc_count" class="adv-pill">0 words</div>${end()}`,"adv-doc-editor"); setTimeout(()=>window.silverAdvDocCount?.(),50);};
  window.silverAdvDocCount=function(){const text=document.getElementById("adv_doc_content")?.value||""; const el=document.getElementById("adv_doc_count"); if(el) el.textContent=`${text.split(/\s+/).filter(Boolean).length} words • ${text.length} characters`;};
  window.silverAdvSaveDoc=function(docId){const name=document.getElementById("adv_doc_name")?.value||"Untitled Document"; const content=document.getElementById("adv_doc_content")?.value||""; let list=docs(); const existing=list.find(d=>d.id===docId); if(existing){existing.name=name; existing.content=content; existing.updated=now();} else list.unshift({id:docId,name,content,updated:now()}); setDocs(list); let files=drive(); const file=files.find(f=>f.docId===docId); if(file){file.name=name+".edoc"; file.content=content; file.updated=now();} else files.unshift({id:id(),docId,type:"edoc",name:name+".edoc",content,folder:"Documents",star:false,trash:false,created:now(),updated:now()}); setDrive(files); const s=document.getElementById("adv_doc_status"); if(s) s.textContent="Saved"; notify("Document Saved",name,"Silver Docs","success");};
  window.silverAdvDeleteDoc=function(docId){if(!confirm("Delete document?"))return; setDocs(docs().filter(d=>d.id!==docId)); openSilverAdvancedDocs();};
  window.silverAdvInsertDocTemplate=function(){const val="\n\nProject Summary\nPurpose:\nScope:\nNext Steps:\nOwner:\nDue Date:\n"; const ta=document.getElementById("adv_doc_content"); if(ta){ta.value += val; silverAdvDocCount();}};
  window.silverAdvExportDoc=function(docId,type){const name=document.getElementById("adv_doc_name")?.value||"Document"; const content=document.getElementById("adv_doc_content")?.value||""; const blob=new Blob([type==="html"?`<h1>${esc(name)}</h1><pre>${esc(content)}</pre>`:content],{type:type==="html"?"text/html":"text/plain"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=name.replace(/\W+/g,"_")+(type==="html"?".html":".txt"); a.click(); URL.revokeObjectURL(a.href);};
  window.openSilverAdvancedTemplates=function(){open("Silver Templates", `${header("office","Silver Templates","Start from a professional template")}<div class="adv-grid">${["Letter","Memo","Report","Policy","Meeting Notes","Project Proposal","Announcement","Resume"].map(t=>`<div class="adv-card" onclick="openSilverAdvancedDocEditor(); setTimeout(()=>{document.getElementById('adv_doc_name').value='${t}'; document.getElementById('adv_doc_content').value='${t}\n\nPrepared by: ${username()}\nDate: ${new Date().toLocaleDateString()}\n\n'; silverAdvDocCount();},100)">${iconHTML("office")}<div><b>${t}</b><small>Create a new ${t.toLowerCase()} document.</small></div></div>`).join("")}</div>${end()}`,"adv-templates");};

  window.openSilverAdvancedSheets=function(){const list=sheets(); const current=list[0]||seedSheets()[0]; open("Silver Sheets", `${header("office","Silver Sheets","Spreadsheet grid, totals, and CSV export")}<div class="adv-toolbar"><input id="adv_sheet_name" value="${esc(current.name)}"><button onclick="silverAdvAddSheetRow()">Add Row</button><button onclick="silverAdvSaveSheet('${current.id}')">Save</button><button onclick="silverAdvExportCSV('${current.id}')">Export CSV</button><button onclick="silverAdvSheetTotal()">Total Column B</button><span id="adv_sheet_status" class="adv-pill">Ready</span></div><table class="adv-sheet"><tbody id="adv_sheet_body">${sheetRows(current.cells)}</tbody></table>${end()}`,"adv-sheets");};
  function sheetRows(rows){return (rows||[]).map((r,ri)=>`<tr>${Array.from({length:Math.max(5,r.length)}).map((_,ci)=>`<td><input value="${esc((r||[])[ci]||"")}" data-r="${ri}" data-c="${ci}"></td>`).join("")}</tr>`).join("");}
  function collectSheet(){const rows=[]; document.querySelectorAll("#adv_sheet_body input").forEach(inp=>{const r=+inp.dataset.r,c=+inp.dataset.c; rows[r]=rows[r]||[]; rows[r][c]=inp.value;}); return rows;}
  window.silverAdvAddSheetRow=function(){const body=document.getElementById("adv_sheet_body"); const r=body.querySelectorAll("tr").length; body.insertAdjacentHTML("beforeend", `<tr>${Array.from({length:5}).map((_,c)=>`<td><input data-r="${r}" data-c="${c}" value=""></td>`).join("")}</tr>`);};
  window.silverAdvSaveSheet=function(sheetId){const name=document.getElementById("adv_sheet_name")?.value||"Untitled Sheet"; let list=sheets(); const ex=list.find(s=>s.id===sheetId); if(ex){ex.name=name; ex.cells=collectSheet(); ex.updated=now();} else list.unshift({id:sheetId,name,cells:collectSheet(),updated:now()}); setSheets(list); notify("Sheet Saved",name,"Silver Sheets","success");};
  window.silverAdvSheetTotal=function(){const rows=collectSheet(); const total=rows.slice(1).reduce((sum,r)=>sum+(parseFloat(r[1])||0),0); alert("Column B total: "+total);};
  window.silverAdvExportCSV=function(){const csv=collectSheet().map(r=>r.map(v=>`"${String(v||"").replaceAll('"','""')}"`).join(",")).join("\n"); const blob=new Blob([csv],{type:"text/csv"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="silver-sheet.csv"; a.click(); URL.revokeObjectURL(a.href);};

  window.openSilverAdvancedSlides=function(){const deck=slides()[0]||seedSlides()[0]; const list=deck.slides||[]; open("Silver Slides", `${header("office","Silver Slides","Create and present simple slide decks")}<div class="adv-two"><div class="adv-side"><button onclick="silverAdvAddSlide('${deck.id}')">Add Slide</button><button onclick="silverAdvSaveSlideDeck('${deck.id}')">Save Deck</button><button onclick="silverAdvPresentSlides('${deck.id}')">Present</button><hr>${list.map((s,i)=>`<button class="adv-btn" onclick="silverAdvEditSlide('${deck.id}',${i})">Slide ${i+1}: ${esc(s.title)}</button>`).join("")}</div><div class="adv-main"><input id="adv_slide_title" value="${esc(list[0]?.title||"")}" placeholder="Slide title"><textarea id="adv_slide_body" class="adv-editor">${esc(list[0]?.body||"")}</textarea><input type="hidden" id="adv_slide_index" value="0"><div class="adv-slide"><h1 id="adv_slide_preview_title">${esc(list[0]?.title||"")}</h1><p id="adv_slide_preview_body">${esc(list[0]?.body||"")}</p></div></div></div>${end()}`,"adv-slides");};
  window.silverAdvEditSlide=function(deckId,i){const deck=slides().find(d=>d.id===deckId); if(!deck)return; document.getElementById("adv_slide_index").value=i; document.getElementById("adv_slide_title").value=deck.slides[i]?.title||""; document.getElementById("adv_slide_body").value=deck.slides[i]?.body||"";};
  window.silverAdvSaveSlideDeck=function(deckId){let list=slides(); const deck=list.find(d=>d.id===deckId)||{id:deckId,name:"Untitled Deck",slides:[],updated:now()}; const i=+(document.getElementById("adv_slide_index")?.value||0); deck.slides[i]={title:document.getElementById("adv_slide_title")?.value||"Untitled",body:document.getElementById("adv_slide_body")?.value||""}; deck.updated=now(); if(!list.find(d=>d.id===deckId)) list.unshift(deck); setSlides(list); notify("Deck Saved",deck.name,"Silver Slides","success");};
  window.silverAdvAddSlide=function(deckId){let list=slides(); const deck=list.find(d=>d.id===deckId); if(deck){deck.slides.push({title:"New Slide",body:""}); setSlides(list); openSilverAdvancedSlides();}};
  window.silverAdvPresentSlides=function(deckId){const deck=slides().find(d=>d.id===deckId); open("Presentation", `${header("office",deck?.name||"Presentation","Silver Slides present mode")}${(deck?.slides||[]).map(s=>`<div class="adv-slide"><h1>${esc(s.title)}</h1><p>${esc(s.body)}</p></div><br>`).join("")}${end()}`,"adv-present");};
  window.openSilverAdvancedForms=function(){open("Silver Forms", `${header("office","Silver Forms","Simple form builder")}<div class="adv-toolbar"><input id="adv_form_title" placeholder="Form title"><button onclick="silverAdvSaveForm()">Save Form</button></div><textarea id="adv_form_questions" class="adv-editor" placeholder="Enter one question per line"></textarea><h3>Saved Forms</h3><div class="adv-list">${forms().map(f=>`<div class="adv-row"><b>${esc(f.title)}</b><button onclick="alert('${esc((f.questions||[]).join("\\n"))}')">Preview</button></div>`).join("")||"No forms."}</div>${end()}`,"adv-forms");};
  window.silverAdvSaveForm=function(){const title=document.getElementById("adv_form_title")?.value||"Untitled Form"; const questions=(document.getElementById("adv_form_questions")?.value||"").split("\n").filter(Boolean); const list=forms(); list.unshift({id:id(),title,questions,updated:now()}); setForms(list); notify("Form Saved",title,"Silver Forms"); openSilverAdvancedForms();};

  window.openSilverAdvancedMail=function(box="inbox"){
    const messages=mail().filter(m=>m.box===box);
    open("Silver Mail", `${header("mail","Silver Mail","Internal EmeraldOS mail for Silver Advanced")}<div class="adv-two"><div class="adv-side"><button onclick="openSilverAdvancedComposeMail()">Compose</button>${["inbox","sent","drafts","trash"].map(b=>`<button class="adv-btn" onclick="openSilverAdvancedMail('${b}')">${b[0].toUpperCase()+b.slice(1)}</button>`).join("")}</div><div class="adv-main"><div class="adv-list">${messages.map(m=>`<div class="adv-row"><div class="grow"><b>${m.read?"":"Unread • "}${esc(m.subject)}</b><br><small>From ${esc(m.from)} • ${esc(displayTime(m.time))}</small><p>${esc(m.body.slice(0,160))}</p></div><button onclick="silverAdvReadMail('${m.id}')">Open</button><button onclick="silverAdvTrashMail('${m.id}')">Trash</button></div>`).join("")||"<p>No messages.</p>"}</div></div></div>${end()}`,"mail");
  };
  window.openSilverAdvancedComposeMail=function(to="") { open("Compose Mail", `${header("mail","Compose Mail","Send internal EmeraldOS Silver mail")}<div class="adv-toolbar"><input id="adv_mail_to" placeholder="To username or address" value="${esc(to)}"><input id="adv_mail_subject" placeholder="Subject"></div><textarea id="adv_mail_body" class="adv-editor" placeholder="Write message"></textarea><div class="adv-toolbar"><button onclick="silverAdvSendMail()">Send</button><button onclick="silverAdvSaveDraft()">Save Draft</button></div>${end()}`,"adv-compose"); };
  window.silverAdvSendMail=function(){const to=document.getElementById("adv_mail_to")?.value||"system"; const subject=document.getElementById("adv_mail_subject")?.value||"No subject"; const body=document.getElementById("adv_mail_body")?.value||""; const list=mail(); list.unshift({id:id(),box:"sent",from:username()+"@emeraldos.mail",to:to.includes("@")?to:to+"@emeraldos.mail",subject,body,read:true,star:false,time:now()}); setMail(list); notify("Mail Sent",subject,"Silver Mail","success"); openSilverAdvancedMail("sent");};
  window.silverAdvSaveDraft=function(){const list=mail(); list.unshift({id:id(),box:"drafts",from:username()+"@emeraldos.mail",to:document.getElementById("adv_mail_to")?.value||"",subject:document.getElementById("adv_mail_subject")?.value||"Draft",body:document.getElementById("adv_mail_body")?.value||"",read:true,time:now()}); setMail(list); notify("Draft Saved","Mail draft saved.","Silver Mail"); openSilverAdvancedMail("drafts");};
  window.silverAdvReadMail=function(mid){let list=mail(); const msg=list.find(m=>m.id===mid); if(!msg)return; msg.read=true; setMail(list); open("Mail Message", `${header("mail",msg.subject,"From "+msg.from)}<p><b>To:</b> ${esc(msg.to)}</p><pre>${esc(msg.body)}</pre><div class="adv-toolbar"><button onclick="openSilverAdvancedComposeMail('${esc(msg.from)}')">Reply</button><button onclick="silverAdvTrashMail('${msg.id}')">Trash</button></div>${end()}`,"adv-mail-message");};
  window.silverAdvTrashMail=function(mid){setMail(mail().map(m=>m.id===mid?{...m,box:"trash"}:m)); openSilverAdvancedMail("inbox");};

  window.openSilverAdvancedCommunications=function(){open("Silver Communications", `${header("chat","Silver Communications","Mail, chat, people, contacts, and notifications")}<div class="adv-grid">${appGrid(APPS.filter(a=>a.group==="Communication"))}${card({name:"Action Center",icon:"security",group:"System",desc:"View unread messages, mail, and alerts.",run:"openSilverAdvancedActionCenter"})}</div>${end()}`,"adv-comms");};
  window.openSilverAdvancedChat=function(){open("Silver Chat", `${header("chat","Silver Chat","Integrated communication hub")}<p>This Advanced shell bridges to the EmeraldOS chat platform when available and keeps local quick chat notes.</p><div class="adv-toolbar"><input id="adv_chat_note" placeholder="Message note"><button onclick="silverAdvChatNote()">Save Note</button></div><div class="adv-list">${notes().filter(n=>n.type==="chat").map(n=>`<div class="adv-row"><b>${esc(n.text)}</b><small>${displayTime(n.time)}</small></div>`).join("")||"No chat notes."}</div>${end()}`,"chat");};
  window.silverAdvChatNote=function(){const text=document.getElementById("adv_chat_note")?.value; if(!text)return; const list=notes(); list.unshift({id:id(),type:"chat",text,time:now()}); setNotes(list); notify("Chat Note Saved",text,"Silver Chat"); openSilverAdvancedChat();};
  window.openSilverAdvancedPeople=function(){const list=contacts(); open("People", `${header("people","People","Contacts, users, blocking, mail, and chat actions")}<div class="adv-toolbar"><input id="adv_contact_name" placeholder="Name"><input id="adv_contact_user" placeholder="Username"><button onclick="silverAdvAddContact()">Add Contact</button></div><div class="adv-list">${list.map(c=>`<div class="adv-row"><div class="grow"><b>${esc(c.name)}</b><br><small>${esc(c.username)} • ${esc(c.mail)} • ${c.blocked?"Blocked":"Allowed"}</small></div><button onclick="openSilverAdvancedComposeMail('${esc(c.mail)}')">Mail</button><button onclick="silverAdvToggleBlock('${c.id}')">${c.blocked?"Unblock":"Block"}</button></div>`).join("")}</div>${end()}`,"people");};
  window.silverAdvAddContact=function(){const name=document.getElementById("adv_contact_name")?.value||"New Contact"; const user=document.getElementById("adv_contact_user")?.value||name.toLowerCase().replace(/\W+/g,""); const list=contacts(); list.unshift({id:id(),name,username:user,mail:user+"@emeraldos.mail",favorite:false,blocked:false,status:"Unknown"}); setContacts(list); openSilverAdvancedPeople();};
  window.silverAdvToggleBlock=function(cid){setContacts(contacts().map(c=>c.id===cid?{...c,blocked:!c.blocked}:c)); openSilverAdvancedPeople();};

  window.openSilverAdvancedStore=function(){open("Silver Store", `${header("store","Silver Store","User appstore, installed apps, ratings, and publishing")}<div class="adv-toolbar"><button onclick="silverAdvStoreWarning()">Open User Appstore</button><button onclick="openSilverAdvancedCreator()">Create App</button><button onclick="openSilverAdvancedSecurity()">App Safety</button></div><p>User-created applications may be unsafe. Silver Advanced runs custom apps through the EmeraldOS sandboxed app platform when available.</p><div class="adv-grid compact">${["Productivity","Education","Business","Utilities","Creative","Developer"].map(c=>`<div class="adv-card"><div>${iconHTML("store")}</div><div><b>${c}</b><small>Browse ${c.toLowerCase()} apps.</small></div></div>`).join("")}</div>${end()}`,"store");};
  window.silverAdvStoreWarning=function(){if(confirm("Warning! By using this feature, you expose yourself to risk of infection. Use at your own risk.\n\nAgree and continue?")){notify("User Appstore","Appstore warning accepted.","Silver Store"); if(typeof window.openEmeraldUserAppstore56==="function") window.openEmeraldUserAppstore56();}};
  window.openSilverAdvancedCreator=function(){open("Creator Studio", `${header("creator","Creator Studio","Application Editor, Code Studio, snippets, and API docs")}<div class="adv-grid">${["Application Editor","Code Studio","API Docs","Code Snippets","Theme Studio","Icon Studio","Publish Checklist","App Scanner"].map((n,i)=>`<div class="adv-card" onclick="silverAdvCreatorTool('${n}')">${iconHTML(i<4?"creator":"settings")}<div><b>${n}</b><small>Open ${n.toLowerCase()} tools.</small></div></div>`).join("")}</div>${end()}`,"creator");};
  window.silverAdvCreatorTool=function(name){ if(name==="Application Editor" && typeof window.openApplicationEditor54==="function") return window.openApplicationEditor54(); open(name, `${header("creator",name,"Silver Advanced Creator Studio")}<textarea class="adv-editor" placeholder="Code, notes, or configuration for ${esc(name)}"></textarea><div class="adv-toolbar"><button onclick="silverAdvancedNotify('${esc(name)}','Saved locally.')">Save</button><button>Preview</button><button>Export</button></div>${end()}`,"adv-creator-tool");};

  window.openSilverAdvancedSettings=function(){const p=prefs(); open("Settings", `${header("settings","Settings","Personalize Silver Advanced")}<div class="adv-two"><div class="adv-side"><button onclick="openSilverAdvancedSettings()">Personalization</button><button onclick="openSilverAdvancedRestoreCenter()">Sync & Restore</button><button onclick="openSilverAdvancedActionCenter()">Notifications</button><button onclick="openSilverAdvancedSecurity()">Security</button></div><div class="adv-main"><h3>Desktop</h3><label><input type="checkbox" id="adv_sidebar" ${p.sidebar?"checked":""}> Show sidebar gadgets</label><br><label>Icon size <select id="adv_icon_size"><option ${p.iconSize==="normal"?"selected":""}>normal</option><option ${p.iconSize==="large"?"selected":""}>large</option><option ${p.iconSize==="compact"?"selected":""}>compact</option></select></label><h3>Desktop icons</h3><div class="adv-grid compact">${APPS.map(a=>`<label class="adv-card"><input type="checkbox" value="${a.id}" ${p.desktopIcons.includes(a.id)?"checked":""}>${iconHTML(a.icon,true)} <b>${esc(a.name)}</b></label>`).join("")}</div><div class="adv-toolbar"><button onclick="silverAdvSaveSettings()">Save Settings</button><button onclick="silverAdvResetSettings()">Reset Defaults</button></div></div></div>${end()}`,"settings");};
  window.silverAdvSaveSettings=function(){const ids=[...document.querySelectorAll('.adv-card input[type="checkbox"][value]')].filter(x=>x.checked).map(x=>x.value); setPrefs({desktopIcons:ids,sidebar:document.getElementById("adv_sidebar")?.checked,iconSize:document.getElementById("adv_icon_size")?.value||"normal"}); renderDesktop(); notify("Settings Saved","Silver Advanced settings were saved.","Settings");};
  window.silverAdvResetSettings=function(){localStorage.removeItem(LS.prefs); renderDesktop(); openSilverAdvancedSettings();};
  window.openSilverAdvancedControlPanel=function(){open("Control Panel", `${header("control","Control Panel","Classic advanced management categories")}<div class="adv-grid">${["System and Security","Network and Sharing","Programs","Appearance","User Accounts","Clock and Region","Ease of Access","Recovery"].map(n=>`<div class="adv-card"><div>${iconHTML("control")}</div><div><b>${n}</b><small>Manage ${n.toLowerCase()} settings.</small></div></div>`).join("")}</div>${end()}`,"control");};
  window.openSilverAdvancedSecurity=function(){open("Security Center", `${header("security","Security Center","Privacy, blocking, app risk, and recovery")}<div class="adv-status"><div class="adv-status-card"><b>Blocked Contacts</b><span>${contacts().filter(c=>c.blocked).length}</span></div><div class="adv-status-card"><b>Appstore Warning</b><span>Enabled</span></div><div class="adv-status-card"><b>Safe Mode</b><span>${localStorage.getItem('silver_advanced_safe_mode')==='true'?'On':'Off'}</span></div></div><div class="adv-toolbar"><button onclick="localStorage.setItem('silver_advanced_safe_mode','true'); silverAdvancedNotify('Safe Mode','Safe mode will apply after restart.')">Enable Safe Mode</button><button onclick="localStorage.removeItem('silver_advanced_safe_mode'); silverAdvancedNotify('Safe Mode','Safe mode disabled.')">Disable Safe Mode</button><button onclick="openSilverAdvancedPeople()">Manage Blocking</button></div>${end()}`,"security");};

  window.openSilverAdvancedActionCenter=function(){const list=notifyList(); const html=`<div class="adv-action-center"><div class="adv-header">${iconHTML("security")}<div><h2>Action Center</h2><p>Universal Silver Advanced notifications</p></div></div><div class="adv-toolbar"><button onclick="silverAdvMarkAllRead()">Mark all read</button><button onclick="silverAdvClearNotifications()">Clear all</button><button onclick="openSilverAdvancedSettings()">Settings</button></div><div class="adv-list">${list.map(n=>`<div class="adv-row"><div class="grow"><b>${n.read?"":"Unread • "}${esc(n.title)}</b><br><small>${esc(n.source)} • ${esc(displayTime(n.time))}</small><p>${esc(n.body)}</p></div><button onclick="silverAdvReadNotification('${n.id}')">Read</button></div>`).join("")||"<p>No notifications.</p>"}</div></div>`; const old=document.querySelector(".adv-action-center"); if(old){old.remove(); return;} document.body.insertAdjacentHTML("beforeend",html);};
  window.silverAdvReadNotification=function(nid){setNotifications(notifyList().map(n=>n.id===nid?{...n,read:true}:n)); document.querySelector(".adv-action-center")?.remove(); openSilverAdvancedActionCenter();};
  window.silverAdvMarkAllRead=function(){setNotifications(notifyList().map(n=>({...n,read:true}))); document.querySelector(".adv-action-center")?.remove(); openSilverAdvancedActionCenter();};
  window.silverAdvClearNotifications=function(){setNotifications([]); document.querySelector(".adv-action-center")?.remove(); openSilverAdvancedActionCenter();};

  window.openSilverAdvancedSearch=function(){open("Advanced Search", `${header("search","Advanced Search","Search apps, files, settings, and contacts")}<input id="adv_search_q" class="adv-input" placeholder="Search Silver Advanced" oninput="silverAdvRunSearch(this.value)"><div id="adv_search_results" class="adv-grid" style="margin-top:14px">${appGrid(APPS.slice(0,6))}</div>${end()}`,"search");};
  window.silverAdvRunSearch=function(q){q=String(q||"").toLowerCase(); const appMatches=APPS.filter(a=>(a.name+a.group+a.desc).toLowerCase().includes(q)); const fileMatches=drive().filter(f=>f.name.toLowerCase().includes(q)).slice(0,8); const contactMatches=contacts().filter(c=>(c.name+c.username+c.mail).toLowerCase().includes(q)).slice(0,5); const html=[...appMatches.map(card),...fileMatches.map(f=>`<div class="adv-card" onclick="silverAdvOpenFile('${f.id}')">${iconHTML("explorer")}<div><b>${esc(f.name)}</b><small>File • ${esc(f.type)}</small></div></div>`),...contactMatches.map(c=>`<div class="adv-card" onclick="openSilverAdvancedComposeMail('${esc(c.mail)}')">${iconHTML("people")}<div><b>${esc(c.name)}</b><small>${esc(c.mail)}</small></div></div>`)].join("")||"<p>No results.</p>"; document.getElementById("adv_search_results").innerHTML=html;};
  window.openSilverAdvancedTaskView=function(){const s=session(); const recent=(s.recentApps||[]).map(id=>APPS.find(a=>a.id===id)).filter(Boolean); open("Task View", `${header("task","Task View","Recent and restorable Silver Advanced apps")}<div class="adv-toolbar"><button onclick="restoreSilverAdvancedSession()">Restore Last Apps</button><button onclick="silverAdvClearRecentApps()">Clear Recent</button></div>${recent.length?appGrid(recent):"<p>No recent apps.</p>"}${end()}`,"taskview");};
  window.silverAdvClearRecentApps=function(){setSession({recentApps:[],openApps:[]}); openSilverAdvancedTaskView();};

  window.openSilverAdvancedRestoreCenter=function(){const s=session(); open("Restore Center", `${header("restore","Restore Center","Cloud workspace save, restore, and recovery")}<div class="adv-status"><div class="adv-status-card"><b>Last saved</b><span>${esc(s.lastSavedAt?displayTime(s.lastSavedAt):"Not saved")}</span></div><div class="adv-status-card"><b>Last restored</b><span>${esc(s.lastRestoredAt?displayTime(s.lastRestoredAt):"Not restored")}</span></div><div class="adv-status-card"><b>Device</b><span>${esc((s.device||"").slice(0,34))}</span></div></div><div class="adv-toolbar"><button onclick="saveSilverAdvancedWorkspace()">Save Workspace Now</button><button onclick="loadSilverAdvancedWorkspace()">Load Cloud Workspace</button><button onclick="restoreSilverAdvancedSession()">Restore Open Apps</button><button onclick="resetSilverAdvancedLocal()">Reset Local Silver Advanced</button></div><h3>Saved open apps</h3>${appGrid((s.openApps||[]).map(id=>APPS.find(a=>a.id===id)).filter(Boolean))}${end()}`,"restore");};
  window.saveSilverAdvancedWorkspace=saveCloud;
  window.loadSilverAdvancedWorkspace=loadCloud;
  window.restoreSilverAdvancedSession=function(){const apps=(session().openApps||[]).map(id=>APPS.find(a=>a.id===id)).filter(Boolean); if(!apps.length){notify("Restore Center","No saved app session to restore.","Restore"); return;} apps.slice().reverse().forEach((a,i)=>setTimeout(()=>window[a.run]?.(),i*180)); notify("Workspace Restored",`${apps.length} apps reopened.`,"Restore","success");};
  window.resetSilverAdvancedLocal=function(){if(!confirm("Reset local Silver Advanced settings, notifications, documents, and session? Cloud data is not deleted."))return; Object.values(LS).forEach(k=>localStorage.removeItem(k)); renderDesktop(); updateBell(); notify("Local Reset","Silver Advanced local data was reset.","Recovery");};

  window.openSilverAdvancedMedia=function(){open("Media Center", `${header("media","Media Center","Photos, videos, presentation playback, and gallery tools")}<div class="adv-grid">${["Photo Gallery","Video Library","Music Library","Presentation Player","Screen Viewer","Media Settings"].map(n=>`<div class="adv-card">${iconHTML("media")}<div><b>${n}</b><small>Silver Advanced ${n.toLowerCase()}.</small></div></div>`).join("")}</div>${end()}`,"media");};
  window.openSilverAdvancedHelp=function(){open("Help and Support", `${header("help","Help and Support","Guides and troubleshooting")}<div class="adv-list">${["Getting started with Silver Advanced","Using Silver Explorer","Using Silver Office","Saving and restoring your workspace","Customizing the desktop","Using Action Center","Publishing apps safely","Troubleshooting Firebase sync"].map(t=>`<div class="adv-row"><b>${t}</b><button onclick="alert('${t.replaceAll("'","")}')">Open</button></div>`).join("")}</div>${end()}`,"help");};

  function installStartSearch(){const input=document.getElementById("start-search"); if(!input) return; input.addEventListener("input",()=>{const q=input.value.toLowerCase(); const results=document.getElementById("start-results"); if(!results)return; results.innerHTML=APPS.filter(a=>(a.name+a.desc+a.group).toLowerCase().includes(q)).slice(0,8).map(a=>`<div class="start-item" onclick="window['${a.run}']?.()">${esc(a.name)}</div>`).join("");});}
  function installDesktopMenu(){document.addEventListener("contextmenu",e=>{if(!e.target.closest("#desktop")) return; const cm=document.getElementById("context-menu"); if(!cm)return; setTimeout(()=>{cm.innerHTML=`<div onclick="openSilverAdvancedHome()">Open Advanced Home</div><div onclick="openSilverAdvancedSettings()">Personalize</div><div onclick="openSilverAdvancedExplorer()">Open Silver Explorer</div><div onclick="openSilverAdvancedRestoreCenter()">Restore Center</div><div onclick="renderSilverAdvancedDesktop()">Refresh Desktop</div>`;},0);});}
  function installShortcuts(){document.addEventListener("keydown",e=>{if(e.ctrlKey&&e.code==="Space"){e.preventDefault();openSilverAdvancedSearch();} if(e.ctrlKey&&e.shiftKey&&e.code==="KeyP"){e.preventDefault();openSilverAdvancedTaskView();} if(e.ctrlKey&&e.altKey&&e.code==="KeyS"){e.preventDefault();openSilverAdvancedSettings();}});}

  window.renderSilverAdvancedDesktop = renderDesktop;
  window.openSilverAdvancedApps = function(){open("All Silver Advanced Apps", `${header("home","All Silver Advanced Apps","Consolidated Silver Advanced app launcher")}<div class="adv-toolbar"><input placeholder="Filter apps" oninput="silverAdvFilterAppCards(this.value)"></div><div id="adv_apps_grid">${appGrid(APPS)}</div>${end()}`,"apps");};
  window.silverAdvFilterAppCards=function(q){q=String(q||"").toLowerCase(); document.querySelectorAll("#adv_apps_grid .adv-card").forEach(card=>card.style.display=card.textContent.toLowerCase().includes(q)?"flex":"none");};

  function init(){
    patchNotify();
    renderDesktop();
    updateBell();
    installStartSearch();
    installDesktopMenu();
    installShortcuts();
    setSync("Local",false);
    if(!localStorage.getItem(BUILD.prefix+"welcomed")){
      localStorage.setItem(BUILD.prefix+"welcomed","true");
      setTimeout(()=>{notify("Welcome to Silver Advanced","Use Advanced Home, Search, Action Center, and Restore Center to manage your workspace.","Welcome","success"); openSilverAdvancedHome();},900);
    }
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",()=>setTimeout(init,450)); else setTimeout(init,450);
})();
