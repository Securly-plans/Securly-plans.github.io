"use strict";
/* EmeraldOS Gold 1T flagship experience.
   Adds user-facing productivity, safety, compatibility, accessibility, and
   reliability tools without changing the protected E.L.S.U.S. publishing flow. */
(function EmeraldOSGold1TFlagship(){
  if(window.__EMERALDOS_GOLD_1T_FLAGSHIP__) return;
  window.__EMERALDOS_GOLD_1T_FLAGSHIP__=true;

  const VERSION="1T",FOLDER="Gold_1T",PREFIX="gold1g_";
  const $=id=>document.getElementById(id);
  const api=()=>window.Gold50||window.Gold1T;
  const esc=value=>String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
  const now=()=>new Date().toISOString();
  const uid=(prefix="id")=>`${prefix}_${Math.random().toString(36).slice(2,9)}_${Date.now().toString(36)}`;
  const read=(key,fallback)=>{try{const raw=localStorage.getItem(key);return raw===null?fallback:JSON.parse(raw)}catch{return fallback}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch(error){console.warn("Gold 1T write failed",key,error);return false}};
  const user=()=>localStorage.getItem("username")||localStorage.getItem(PREFIX+"username")||"GoldUser";
  const files=()=>Array.isArray(api()?.files?.())?api().files():[];
  const tasks=()=>{const value=read(PREFIX+"tasks",[]);return Array.isArray(value)?value:[]};
  const saveTasks=value=>{write(PREFIX+"tasks",value);api()?.saveWorkspaceNow?.(false)};
  const fmtBytes=bytes=>{let n=Number(bytes)||0,i=0;const units=["B","KB","MB","GB"];while(n>=1024&&i<units.length-1){n/=1024;i++}return `${n.toFixed(i?1:0)} ${units[i]}`};
  const localBytes=()=>Object.keys(localStorage).reduce((sum,key)=>sum+new Blob([key,localStorage.getItem(key)||""]).size,0);
  const download=(name,data,type="application/json")=>{const blob=new Blob([typeof data==="string"?data:JSON.stringify(data,null,2)],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1200)};

  function notification(title,body,app="Gold 1T"){api()?.notify?.(title,body,app)}
  function closeWindow(win){if(win?.id)api()?.closeWin?.(win.id)}

  function healthReport(){
    const fs=files(),ids=new Map(),duplicateIds=[];
    fs.forEach(file=>{const id=String(file.id||"");if(ids.has(id))duplicateIds.push(id);else ids.set(id,true)});
    const migration=read(PREFIX+"migration_1t_cloud_report",read(PREFIX+"migration_1t_local_report",{}));
    const checks=[
      {name:"Gold shell initialized",pass:Boolean(api()?.APPS),detail:`${api()?.APPS?.length||0} applications registered.`},
      {name:"User session",pass:localStorage.getItem("loggedIn")==="true"||localStorage.getItem(PREFIX+"loggedIn")==="true",detail:`Signed in as ${user()}.`},
      {name:"Migration protection",pass:window.__GOLD1T_MIGRATION_BLOCK_SAVES__!==true,detail:window.__GOLD1T_MIGRATION_BLOCK_SAVES__===true?"Cloud saves remain blocked until migration is verified.":"Migration gate is open."},
      {name:"File identifiers",pass:duplicateIds.length===0,detail:duplicateIds.length?`${duplicateIds.length} reused identifiers are preserved as separate files.`:"No duplicate file identifiers detected."},
      {name:"File names",pass:fs.every(file=>String(file.name||"").trim()),detail:`${fs.filter(file=>!String(file.name||"").trim()).length} unnamed files.`},
      {name:"Local VM storage",pass:localBytes()<4.5*1024*1024,detail:`${fmtBytes(localBytes())} currently used.`},
      {name:"Previous-format compatibility",pass:Boolean(window.Gold1TFileCompatibility),detail:"Gold 1T compatibility registry is active."},
      {name:"Publishing isolation",pass:true,detail:"Health checks never write system/emeraldGoldLatest."}
    ];
    return {product:"EmeraldOS Gold",version:VERSION,folder:FOLDER,user:user(),generatedAt:now(),files:fs.length,apps:api()?.APPS?.length||0,storageBytes:localBytes(),migration,checks,passed:checks.filter(x=>x.pass).length,total:checks.length};
  }

  function recentFiles(limit=6){return files().filter(f=>!f.trash).sort((a,b)=>Date.parse(b.updated||b.created||0)-Date.parse(a.updated||a.created||0)).slice(0,limit)}

  function openHome(){
    const report=healthReport(),openTasks=tasks().filter(t=>!t.done).slice(0,5),recent=recentFiles();
    const html=`<div class="app-shell gold1p-home"><div class="app-toolbar"><button class="button primary" data-home-action="command">Command Palette</button><button class="button" data-home-action="newdoc">New document</button><button class="button" data-home-action="backup">Back up now</button><button class="button" data-home-action="settings">Settings</button></div><div class="app-body"><section class="gold1p-hero"><div><p class="eyebrow">EMERALDOS GOLD 1T</p><h1>Welcome back, ${esc(user())}</h1><p>Your files, applications, settings, and earlier Gold formats stay together in one E.L.S.U.S. cloud VM.</p></div><div class="gold1p-health-ring" aria-label="${report.passed} of ${report.total} system checks passed"><b>${report.passed}/${report.total}</b><span>checks passed</span></div></section><div class="grid4 gold1p-stat-grid"><button class="card" data-open-app="explorer"><b>Files</b><h2>${files().filter(f=>!f.trash).length}</h2><span>available</span></button><button class="card" data-open-app="workspace"><b>Tasks</b><h2>${tasks().filter(t=>!t.done).length}</h2><span>open</span></button><button class="card" data-open-app="systemhealth"><b>VM storage</b><h2>${fmtBytes(localBytes())}</h2><span>local cache</span></button><button class="card" data-open-app="updateshell"><b>Version</b><h2>Gold ${VERSION}</h2><span>E.L.S.U.S. ready</span></button></div><div class="gold1p-dashboard-grid"><section class="card"><div class="section-heading"><h2>Recent files</h2><button class="link-button" data-open-app="explorer">View all</button></div><div class="gold1p-list">${recent.map(file=>`<button data-home-file="${esc(file.id)}"><span class="gold1p-file-badge">${esc(String(file.type||"file").slice(0,3).toUpperCase())}</span><span><b>${esc(file.name)}</b><small>${esc(file.folder||"Documents")} · ${new Date(file.updated||file.created||Date.now()).toLocaleString()}</small></span></button>`).join("")||'<p class="muted">No recent files yet.</p>'}</div></section><section class="card"><div class="section-heading"><h2>My day</h2><button class="link-button" data-open-app="workspace">Open workspace</button></div><div class="gold1p-list">${openTasks.map(task=>`<button data-home-task="${esc(task.id||"")}"><span class="gold1p-check"></span><span><b>${esc(task.title||task.text||"Task")}</b><small>${task.due?`Due ${new Date(task.due).toLocaleDateString()}`:"No due date"}</small></span></button>`).join("")||'<p class="muted">You are caught up.</p>'}</div></section></div><section class="card gold1p-quick-launch"><div class="section-heading"><h2>Quick launch</h2><span class="muted">Ctrl + Space opens Command Palette</span></div><div class="gold1p-quick-grid">${["office","mail","calendar","stickynotes","focussessions","backupcenter","compatibility","accessibility"].map(id=>{const app=api()?.APPS?.find(a=>a.id===id);return app?`<button data-open-app="${id}"><span>${esc(app.label||app.name.slice(0,2))}</span><b>${esc(app.name)}</b></button>`:""}).join("")}</div></section></div></div>`;
    const win=api().openWindow("home","Gold Home",html,{width:1060,height:720});
    win.querySelectorAll("[data-open-app]").forEach(button=>button.onclick=()=>api().openApp(button.dataset.openApp));
    win.querySelectorAll("[data-home-file]").forEach(button=>button.onclick=()=>api().openFile?.(button.dataset.homeFile));
    win.querySelectorAll("[data-home-task]").forEach(button=>button.onclick=()=>{const list=tasks(),task=list.find(t=>String(t.id)===button.dataset.homeTask);if(task){task.done=true;task.completedAt=now();saveTasks(list);closeWindow(win);setTimeout(openHome,40)}});
    win.querySelector("[data-home-action='command']").onclick=openCommandPalette;
    win.querySelector("[data-home-action='newdoc']").onclick=()=>api().openApp("office");
    win.querySelector("[data-home-action='backup']").onclick=()=>api().openApp("backupcenter");
    win.querySelector("[data-home-action='settings']").onclick=()=>api().openApp("settings");
    return win;
  }

  const commandActions=[
    {id:"save",name:"Save cloud VM now",detail:"Save files and settings",run:()=>api()?.saveWorkspaceNow?.(true)},
    {id:"newdoc",name:"Create a document",detail:"Open Gold Office",run:()=>api()?.openApp?.("office")},
    {id:"newnote",name:"Create a sticky note",detail:"Open Sticky Notes",run:()=>api()?.openApp?.("stickynotes")},
    {id:"settings",name:"Open Settings",detail:"Personalization and system settings",run:()=>api()?.openApp?.("settings")},
    {id:"health",name:"Run system health checks",detail:"Open System Health",run:()=>api()?.openApp?.("systemhealth")},
    {id:"backup",name:"Create a VM backup",detail:"Open Backup & Sync",run:()=>api()?.openApp?.("backupcenter")},
    {id:"focus",name:"Start a focus session",detail:"Open Focus Sessions",run:()=>api()?.openApp?.("focussessions")},
    {id:"update",name:"Check for updates",detail:"Open System Update",run:()=>api()?.openApp?.("updateshell")}
  ];
  function commandResults(query=""){
    const q=query.trim().toLowerCase(),results=[];
    (api()?.APPS||[]).forEach(app=>{if(!q||`${app.name} ${app.desc} ${app.group}`.toLowerCase().includes(q))results.push({kind:"app",name:app.name,detail:`${app.group} · ${app.desc}`,run:()=>api().openApp(app.id)})});
    files().filter(f=>!f.trash).forEach(file=>{if(!q||`${file.name} ${file.folder} ${file.type}`.toLowerCase().includes(q))results.push({kind:"file",name:file.name,detail:`${file.folder} · ${file.type}`,run:()=>api().openFile?.(file.id)})});
    commandActions.forEach(action=>{if(!q||`${action.name} ${action.detail}`.toLowerCase().includes(q))results.push({kind:"action",...action})});
    return results.slice(0,24);
  }
  function closeCommandPalette(){$("gold1pCommandPalette")?.remove()}
  function openCommandPalette(initial=""){
    closeCommandPalette();
    const overlay=document.createElement("div");overlay.id="gold1pCommandPalette";overlay.className="gold1p-command-overlay";overlay.innerHTML=`<section class="gold1p-command-dialog" role="dialog" aria-modal="true" aria-label="Command Palette"><div class="gold1p-command-input"><span>⌕</span><input id="gold1pCommandInput" value="${esc(initial)}" placeholder="Search apps, files, settings, and actions" autocomplete="off" spellcheck="false"><kbd>Esc</kbd></div><div id="gold1pCommandResults" class="gold1p-command-results" aria-live="polite"></div><footer><span>↑ ↓ select</span><span>Enter open</span><span>Ctrl + Space toggle</span></footer></section>`;document.body.appendChild(overlay);
    const input=$("gold1pCommandInput"),holder=$("gold1pCommandResults");let selected=0,current=[];
    const render=()=>{current=commandResults(input.value);selected=Math.min(selected,Math.max(0,current.length-1));holder.innerHTML=current.map((item,index)=>`<button data-command-index="${index}" class="${index===selected?"selected":""}"><span class="kind">${item.kind==="app"?"APP":item.kind==="file"?"FILE":"GO"}</span><span><b>${esc(item.name)}</b><small>${esc(item.detail)}</small></span></button>`).join("")||'<p class="muted">No results found.</p>';holder.querySelectorAll("[data-command-index]").forEach(button=>{button.onmouseenter=()=>{selected=Number(button.dataset.commandIndex);holder.querySelectorAll("[data-command-index]").forEach((row,index)=>row.classList.toggle("selected",index===selected))};button.onclick=()=>{const item=current[Number(button.dataset.commandIndex)];closeCommandPalette();item?.run?.()}})};
    input.addEventListener("input",()=>{selected=0;render()});
    input.addEventListener("keydown",event=>{if(event.key==="ArrowDown"){event.preventDefault();selected=Math.min(current.length-1,selected+1);render()}if(event.key==="ArrowUp"){event.preventDefault();selected=Math.max(0,selected-1);render()}if(event.key==="Enter"){event.preventDefault();const item=current[selected];closeCommandPalette();item?.run?.()}if(event.key==="Escape")closeCommandPalette()});
    overlay.addEventListener("mousedown",event=>{if(event.target===overlay)closeCommandPalette()});render();setTimeout(()=>{input.focus();input.select()},0);return overlay;
  }

  function clipboardItems(){
    const source=read(PREFIX+"clipboard_history_1t",read(PREFIX+"clipboard_history_1n",[]));
    if(!Array.isArray(source))return [];
    return source.map(item=>typeof item==="string"?{id:uid("clip"),text:item,createdAt:now(),pinned:false}:item).filter(item=>item&&String(item.text??item.content??"").length).map(item=>({...item,text:String(item.text??item.content??"")}));
  }
  function saveClipboard(items){write(PREFIX+"clipboard_history_1t",items.slice(0,100));api()?.saveWorkspaceNow?.(false)}
  function openClipboardManager(){
    const items=clipboardItems();
    const html=`<div class="app-shell gold1p-clipboard"><div class="app-toolbar"><button class="button primary" id="clipRead">Capture clipboard</button><button class="button" id="clipAdd">Add text</button><button class="button danger" id="clipClear">Clear unpinned</button></div><div class="app-body"><div class="gold1p-page-title"><div><h1>Clipboard Manager</h1><p>Keep, pin, search, and reuse copied text across your Gold VM.</p></div><input id="clipSearch" class="field" placeholder="Search clipboard"></div><div id="clipList" class="gold1p-clipboard-grid"></div></div></div>`;
    const win=api().openWindow("clipboardmanager","Clipboard Manager",html,{width:900,height:650});
    const render=()=>{const q=win.querySelector("#clipSearch").value.trim().toLowerCase(),filtered=clipboardItems().filter(item=>!q||item.text.toLowerCase().includes(q)).sort((a,b)=>Number(Boolean(b.pinned))-Number(Boolean(a.pinned))||Date.parse(b.createdAt||0)-Date.parse(a.createdAt||0));win.querySelector("#clipList").innerHTML=filtered.map(item=>`<article class="card"><div class="gold1p-clip-head"><span>${item.pinned?"Pinned":"Clipboard"}</span><small>${new Date(item.createdAt||Date.now()).toLocaleString()}</small></div><pre>${esc(item.text)}</pre><div class="button-row"><button data-copy="${esc(item.id)}" class="button primary">Copy</button><button data-pin="${esc(item.id)}" class="button">${item.pinned?"Unpin":"Pin"}</button><button data-remove="${esc(item.id)}" class="button danger">Delete</button></div></article>`).join("")||'<p class="muted">Clipboard history is empty.</p>';win.querySelectorAll("[data-copy]").forEach(button=>button.onclick=async()=>{const item=clipboardItems().find(x=>String(x.id)===button.dataset.copy);try{await navigator.clipboard.writeText(item?.text||"");notification("Copied", "Clipboard text is ready to paste.","Clipboard Manager")}catch{prompt("Copy this text",item?.text||"")}});win.querySelectorAll("[data-pin]").forEach(button=>button.onclick=()=>{const list=clipboardItems(),item=list.find(x=>String(x.id)===button.dataset.pin);if(item)item.pinned=!item.pinned;saveClipboard(list);render()});win.querySelectorAll("[data-remove]").forEach(button=>button.onclick=()=>{saveClipboard(clipboardItems().filter(x=>String(x.id)!==button.dataset.remove));render()})};
    win.querySelector("#clipSearch").oninput=render;
    win.querySelector("#clipRead").onclick=async()=>{try{const text=await navigator.clipboard.readText();if(!text)return;saveClipboard([{id:uid("clip"),text,createdAt:now(),pinned:false},...clipboardItems()]);render()}catch{notification("Clipboard permission unavailable","Use Add text to save an item manually.","Clipboard Manager")}};
    win.querySelector("#clipAdd").onclick=()=>{const text=prompt("Text to save in Clipboard Manager");if(text){saveClipboard([{id:uid("clip"),text,createdAt:now(),pinned:false},...clipboardItems()]);render()}};
    win.querySelector("#clipClear").onclick=()=>{if(confirm("Clear all unpinned clipboard entries?")){saveClipboard(clipboardItems().filter(item=>item.pinned));render()}};render();return win;
  }

  function fullVMExport(){
    const storage={};Object.keys(localStorage).filter(key=>key.startsWith(PREFIX)||key.startsWith("emeraldGold")||["username","userId","role","role2"].includes(key)).forEach(key=>storage[key]=localStorage.getItem(key));
    return {format:"EmeraldOS-Gold-VM-Backup",formatVersion:2,product:"EmeraldOS Gold",version:VERSION,folder:FOLDER,user:user(),createdAt:now(),workspace:{files:files(),prefs:api()?.prefs?.()||{},mail:api()?.mail?.()||{},tasks:tasks()},localStorage:storage};
  }
  function mergeImportedFiles(incoming=[]){
    const current=files(),signatures=new Set(current.map(f=>`${String(f.name).toLowerCase()}|${String(f.folder).toLowerCase()}|${String(f.type)}|${String(f.content)}`)),ids=new Set(current.map(f=>String(f.id))),merged=[...current];
    incoming.forEach(raw=>{if(!raw||typeof raw!=="object")return;const file={...raw,id:String(raw.id||uid("import")),name:String(raw.name||"Imported File"),folder:String(raw.folder||"Documents"),type:String(raw.type||"text"),content:String(raw.content??""),updated:raw.updated||now(),created:raw.created||now(),trash:Boolean(raw.trash)};const signature=`${file.name.toLowerCase()}|${file.folder.toLowerCase()}|${file.type}|${file.content}`;if(signatures.has(signature))return;if(ids.has(file.id))file.id=`${file.id}_1t_${Math.random().toString(36).slice(2,7)}`;ids.add(file.id);signatures.add(signature);merged.push(file)});return merged;
  }
  function snapshots(){const value=read(PREFIX+"vm_snapshots",[]);return Array.isArray(value)?value:[]}
  function saveSnapshots(value){write(PREFIX+"vm_snapshots",value.slice(0,8));api()?.saveWorkspaceNow?.(false)}
  function openBackupCenter(){
    const list=snapshots();
    const html=`<div class="app-shell gold1p-backup"><div class="app-toolbar"><button class="button primary" id="backupCreate">Create restore point</button><button class="button" id="backupDownload">Download full backup</button><button class="button" id="backupImport">Import and merge backup</button><button class="button" id="backupCloud">Save cloud VM now</button></div><div class="app-body"><div class="gold1p-page-title"><div><h1>Backup &amp; Sync</h1><p>Create recovery points and merge backups without deleting newer or conflicting files.</p></div><span class="gold1p-status-pill good">Migration-safe</span></div><div class="grid3"><div class="card"><b>Files protected</b><h2>${files().length}</h2></div><div class="card"><b>Restore points</b><h2>${list.length}</h2></div><div class="card"><b>Local VM cache</b><h2>${fmtBytes(localBytes())}</h2></div></div><h2>Restore points</h2><div class="gold1p-snapshot-list">${list.map(item=>`<article class="card"><div><b>${esc(item.name||"Restore point")}</b><small>${new Date(item.createdAt).toLocaleString()} · ${item.fileCount||0} files</small></div><div class="button-row"><button class="button" data-snapshot-download="${esc(item.id)}">Download</button><button class="button primary" data-snapshot-merge="${esc(item.id)}">Merge restore point</button><button class="button danger" data-snapshot-delete="${esc(item.id)}">Delete</button></div></article>`).join("")||'<p class="muted">No restore points have been created.</p>'}</div><section class="card gold1p-safety-note"><h3>Safe restore policy</h3><p>Gold 1T merges files and settings. It does not delete current files simply because they are absent from an older backup.</p></section></div></div>`;
    const win=api().openWindow("backupcenter","Backup & Sync",html,{width:960,height:680});
    const refresh=()=>{closeWindow(win);setTimeout(openBackupCenter,40)};
    win.querySelector("#backupCreate").onclick=()=>{const data=fullVMExport(),item={id:uid("snapshot"),name:`Gold ${VERSION} restore point`,createdAt:now(),fileCount:files().length,data};saveSnapshots([item,...snapshots()]);notification("Restore point created",`${files().length} files and VM settings were captured.`,"Backup & Sync");refresh()};
    win.querySelector("#backupDownload").onclick=()=>download(`EmeraldOS-Gold-${VERSION}-${user()}-Full-Backup.json`,fullVMExport());
    win.querySelector("#backupCloud").onclick=()=>api()?.saveWorkspaceNow?.(true);
    win.querySelector("#backupImport").onclick=()=>{const input=document.createElement("input");input.type="file";input.accept="application/json,.json";input.onchange=async()=>{try{const data=JSON.parse(await input.files[0].text()),incoming=data.workspace?.files||data.files||[];api().saveFiles(mergeImportedFiles(incoming));if(data.workspace?.prefs)api().setPrefs?.({...api().prefs(),...data.workspace.prefs});notification("Backup merged",`${incoming.length} backup files were checked and merged safely.`,"Backup & Sync");refresh()}catch(error){notification("Backup import failed",error.message,"Backup & Sync")}};input.click()};
    win.querySelectorAll("[data-snapshot-download]").forEach(button=>button.onclick=()=>{const item=snapshots().find(x=>String(x.id)===button.dataset.snapshotDownload);if(item)download(`EmeraldOS-${item.id}.json`,item.data)});
    win.querySelectorAll("[data-snapshot-merge]").forEach(button=>button.onclick=()=>{const item=snapshots().find(x=>String(x.id)===button.dataset.snapshotMerge);if(!item)return;api().saveFiles(mergeImportedFiles(item.data?.workspace?.files||[]));if(item.data?.workspace?.prefs)api().setPrefs?.({...api().prefs(),...item.data.workspace.prefs});notification("Restore point merged","Current files were preserved while older data was restored.","Backup & Sync");refresh()});
    win.querySelectorAll("[data-snapshot-delete]").forEach(button=>button.onclick=()=>{if(confirm("Delete this local restore point?")){saveSnapshots(snapshots().filter(x=>String(x.id)!==button.dataset.snapshotDelete));refresh()}});return win;
  }

  const extensionTypes={txt:"text",note:"note",doc:"doc",edoc:"doc",sheet:"sheet",esheet:"sheet",slide:"slide",eslide:"slide",form:"form",json:"text",html:"text",css:"text",js:"app",png:"image",jpg:"image",jpeg:"image",gif:"image",webp:"image",svg:"image",mp3:"audio",wav:"audio",ogg:"audio",mp4:"video",webm:"video"};
  function compatibilityScan(){
    const results=files().map(file=>{const ext=String(file.name||"").split(".").pop().toLowerCase(),expected=extensionTypes[ext]||file.type||"text",issues=[];if(!file.name)issues.push("Missing file name");if(!file.id)issues.push("Missing file identifier");if(!file.type)issues.push("Missing file type");if(file.type&&expected&&file.type!==expected&&!(["text","note","doc"].includes(file.type)&&["text","note","doc"].includes(expected)))issues.push(`Type is ${file.type}; extension suggests ${expected}`);return {file,ext,expected,issues,status:issues.length?"Review":"Compatible"}});
    return {generatedAt:now(),version:VERSION,total:results.length,compatible:results.filter(x=>!x.issues.length).length,review:results.filter(x=>x.issues.length).length,results};
  }
  function openCompatibilityCenter(){
    const scan=compatibilityScan();
    const html=`<div class="app-shell gold1p-compat"><div class="app-toolbar"><button class="button primary" id="compatScan">Scan again</button><button class="button" id="compatRepair">Repair safe metadata</button><button class="button" id="compatExport">Export report</button></div><div class="app-body"><div class="gold1p-page-title"><div><h1>File Compatibility Center</h1><p>Checks files from previous EmeraldOS Gold versions without changing their contents.</p></div><span class="gold1p-status-pill ${scan.review?"review":"good"}">${scan.compatible}/${scan.total} compatible</span></div><div class="gold1p-table-wrap"><table><thead><tr><th>File</th><th>Folder</th><th>Type</th><th>Compatibility</th><th></th></tr></thead><tbody>${scan.results.map(row=>`<tr><td><b>${esc(row.file.name||"Unnamed file")}</b><small>${esc(row.ext||"no extension")}</small></td><td>${esc(row.file.folder||"Documents")}</td><td>${esc(row.file.type||"unknown")}</td><td><span class="gold1p-status-pill ${row.issues.length?"review":"good"}">${esc(row.status)}</span>${row.issues.length?`<small>${esc(row.issues.join("; "))}</small>`:""}</td><td><button class="button" data-compat-open="${esc(row.file.id)}">Open</button></td></tr>`).join("")||'<tr><td colspan="5">No files were found.</td></tr>'}</tbody></table></div><section class="card"><h3>Backward-compatibility policy</h3><p>Gold 1T preserves earlier file identifiers, content, folders, metadata, and conflicting copies. Safe repair only adds missing metadata; it does not rewrite file content.</p></section></div></div>`;
    const win=api().openWindow("compatibility","File Compatibility Center",html,{width:1020,height:680});
    const refresh=()=>{closeWindow(win);setTimeout(openCompatibilityCenter,40)};
    win.querySelector("#compatScan").onclick=refresh;
    win.querySelector("#compatExport").onclick=()=>download("EmeraldOS-Gold-1T-File-Compatibility.json",compatibilityScan());
    win.querySelector("#compatRepair").onclick=()=>{const repaired=files().map(file=>{const ext=String(file.name||"").split(".").pop().toLowerCase();return {...file,id:String(file.id||uid("file")),name:String(file.name||"Recovered File"),folder:String(file.folder||"Documents"),type:String(file.type||extensionTypes[ext]||"text"),formatVersion:file.formatVersion||"gold-compatible-v1",compatibilityCheckedAt:now()}});api().saveFiles(repaired);notification("Compatibility metadata repaired","Missing identifiers, folders, and types were restored without changing contents.","File Compatibility Center");refresh()};
    win.querySelectorAll("[data-compat-open]").forEach(button=>button.onclick=()=>api().openFile?.(button.dataset.compatOpen));return win;
  }
  window.Gold1TFileCompatibility={scan:compatibilityScan,extensionTypes};

  function openSystemHealth(){
    const report=healthReport();
    const html=`<div class="app-shell gold1p-health"><div class="app-toolbar"><button class="button primary" id="healthRun">Run checks again</button><button class="button" id="healthSave">Save VM now</button><button class="button" id="healthExport">Export diagnostics</button><button class="button danger" id="healthCleanup">Clear safe caches</button></div><div class="app-body"><div class="gold1p-page-title"><div><h1>System Health</h1><p>Clear status and repair guidance for your Gold virtual machine.</p></div><span class="gold1p-status-pill ${report.passed===report.total?"good":"review"}">${report.passed}/${report.total} passed</span></div><div class="grid4"><div class="card"><b>Files</b><h2>${report.files}</h2></div><div class="card"><b>Applications</b><h2>${report.apps}</h2></div><div class="card"><b>Local storage</b><h2>${fmtBytes(report.storageBytes)}</h2></div><div class="card"><b>Migration</b><h2>${window.__GOLD1T_MIGRATION_BLOCK_SAVES__===true?"Protected":"Ready"}</h2></div></div><div class="gold1p-health-list">${report.checks.map(check=>`<article class="card ${check.pass?"pass":"review"}"><span class="gold1p-health-icon">${check.pass?"✓":"!"}</span><div><b>${esc(check.name)}</b><p>${esc(check.detail)}</p></div></article>`).join("")}</div></div></div>`;
    const win=api().openWindow("systemhealth","System Health",html,{width:940,height:680});const refresh=()=>{closeWindow(win);setTimeout(openSystemHealth,40)};
    win.querySelector("#healthRun").onclick=refresh;win.querySelector("#healthSave").onclick=()=>api()?.saveWorkspaceNow?.(true);win.querySelector("#healthExport").onclick=()=>download("EmeraldOS-Gold-1T-Diagnostics.json",healthReport());
    win.querySelector("#healthCleanup").onclick=()=>{if(!confirm("Clear only replaceable Gold caches and temporary keys? Files and settings are preserved."))return;const removed=[];Object.keys(localStorage).forEach(key=>{const safe=/(^|_)(cache|temp|thumbnail|diagnostic_cache|search_cache)(_|$)/i.test(key),protectedData=/(files|workspace|mail|registry|prefs|notes|tasks|events|user_apps|snapshot|migration)/i.test(key);if(safe&&!protectedData){removed.push(key);localStorage.removeItem(key)}});notification("Safe cleanup complete",`${removed.length} replaceable cache keys were removed.`,"System Health");refresh()};return win;
  }

  function accessibility(){return {...{highContrast:false,reduceMotion:false,largeText:false,underlineLinks:false,focusRings:true,largeCursor:false,compact:false},...read(PREFIX+"accessibility_1t",{})}}
  function applyAccessibility(settings=accessibility()){
    document.body.classList.toggle("gold1p-high-contrast",settings.highContrast);document.body.classList.toggle("gold1p-reduce-motion",settings.reduceMotion);document.body.classList.toggle("gold1p-large-text",settings.largeText);document.body.classList.toggle("gold1p-underline-links",settings.underlineLinks);document.body.classList.toggle("gold1p-strong-focus",settings.focusRings);document.body.classList.toggle("gold1p-large-cursor",settings.largeCursor);document.body.classList.toggle("gold1p-compact",settings.compact);
  }
  function saveAccessibility(settings){write(PREFIX+"accessibility_1t",settings);applyAccessibility(settings);api()?.setPrefs?.({accessibility1T:settings});api()?.saveWorkspaceNow?.(false)}
  function openAccessibility(){
    const settings=accessibility(),options=[
      ["highContrast","High contrast","Increase contrast across the desktop and apps."],["reduceMotion","Reduce motion","Disable nonessential transitions and animations."],["largeText","Larger text","Increase interface text size without zooming the browser."],["underlineLinks","Underline interactive text","Make links and text buttons easier to identify."],["focusRings","Strong keyboard focus","Show a clear outline while navigating with the keyboard."],["largeCursor","Large pointer","Use a larger pointer inside EmeraldOS."],["compact","Compact spacing","Fit more information into application windows."]
    ];
    const html=`<div class="app-shell gold1p-accessibility"><div class="app-toolbar"><button class="button" id="accessReset">Restore defaults</button><button class="button" id="accessSettings">Open Windows-style Settings</button></div><div class="app-body"><div class="gold1p-page-title"><div><h1>Accessibility Center</h1><p>Adjust visibility, motion, pointer, and keyboard behavior with live previews.</p></div><span class="gold1p-status-pill good">Applied instantly</span></div><div class="gold1p-setting-list">${options.map(([id,title,detail])=>`<label class="card gold1p-setting-row"><span><b>${esc(title)}</b><small>${esc(detail)}</small></span><input type="checkbox" data-accessibility="${id}" ${settings[id]?"checked":""}></label>`).join("")}</div><section class="card gold1p-access-preview"><h2>Preview</h2><p>This sample shows readable text, <a href="#" onclick="return false">an interactive link</a>, and keyboard focus.</p><button class="button primary">Sample action</button> <input class="field" value="Sample text field"></section></div></div>`;
    const win=api().openWindow("accessibility","Accessibility Center",html,{width:860,height:680});win.querySelectorAll("[data-accessibility]").forEach(input=>input.onchange=()=>{const next=accessibility();next[input.dataset.accessibility]=input.checked;saveAccessibility(next)});win.querySelector("#accessReset").onclick=()=>{saveAccessibility({highContrast:false,reduceMotion:false,largeText:false,underlineLinks:false,focusRings:true,largeCursor:false,compact:false});closeWindow(win);setTimeout(openAccessibility,40)};win.querySelector("#accessSettings").onclick=()=>api().openApp("settings");return win;
  }

  function openWorkspace(){
    const list=tasks(),events=read(PREFIX+"events",[]),recent=recentFiles(8);
    const html=`<div class="app-shell gold1p-workspace"><div class="app-toolbar"><button class="button primary" id="workspaceAddTask">Add task</button><button class="button" data-workspace-open="calendar">Calendar</button><button class="button" data-workspace-open="focussessions">Focus session</button><button class="button" data-workspace-open="office">New document</button></div><div class="app-body"><div class="gold1p-page-title"><div><h1>My Workspace</h1><p>Tasks, upcoming events, and recent work in one focused view.</p></div><span class="gold1p-status-pill good">${list.filter(t=>!t.done).length} open tasks</span></div><div class="gold1p-dashboard-grid"><section class="card"><h2>Tasks</h2><div class="gold1p-task-list">${list.map(task=>`<label class="gold1p-task ${task.done?"done":""}"><input type="checkbox" data-task-toggle="${esc(task.id)}" ${task.done?"checked":""}><span><b>${esc(task.title||task.text||"Task")}</b><small>${task.due?new Date(task.due).toLocaleDateString():"No due date"}</small></span><button data-task-delete="${esc(task.id)}" aria-label="Delete task">×</button></label>`).join("")||'<p class="muted">No tasks yet.</p>'}</div></section><section class="card"><h2>Upcoming</h2><div class="gold1p-list">${(Array.isArray(events)?events:[]).sort((a,b)=>Date.parse(a.date||a.start||0)-Date.parse(b.date||b.start||0)).slice(0,6).map(event=>`<button data-workspace-open="calendar"><span class="gold1p-date-badge">${new Date(event.date||event.start||Date.now()).getDate()}</span><span><b>${esc(event.title||"Event")}</b><small>${new Date(event.date||event.start||Date.now()).toLocaleString()}</small></span></button>`).join("")||'<p class="muted">No upcoming events.</p>'}</div></section></div><section class="card"><h2>Recent work</h2><div class="gold1p-recent-strip">${recent.map(file=>`<button data-workspace-file="${esc(file.id)}"><span>${esc(String(file.type||"F").slice(0,2).toUpperCase())}</span><b>${esc(file.name)}</b><small>${esc(file.folder)}</small></button>`).join("")||'<p class="muted">No recent files.</p>'}</div></section></div></div>`;
    const win=api().openWindow("workspace","My Workspace",html,{width:980,height:680}),refresh=()=>{closeWindow(win);setTimeout(openWorkspace,40)};
    win.querySelector("#workspaceAddTask").onclick=()=>{const title=prompt("Task name");if(!title)return;const due=prompt("Optional due date (YYYY-MM-DD)","");saveTasks([{id:uid("task"),title,due:due||null,done:false,createdAt:now()},...tasks()]);refresh()};
    win.querySelectorAll("[data-task-toggle]").forEach(input=>input.onchange=()=>{const data=tasks(),task=data.find(x=>String(x.id)===input.dataset.taskToggle);if(task){task.done=input.checked;task.completedAt=input.checked?now():null;saveTasks(data);refresh()}});
    win.querySelectorAll("[data-task-delete]").forEach(button=>button.onclick=event=>{event.preventDefault();saveTasks(tasks().filter(x=>String(x.id)!==button.dataset.taskDelete));refresh()});
    win.querySelectorAll("[data-workspace-open]").forEach(button=>button.onclick=()=>api().openApp(button.dataset.workspaceOpen));win.querySelectorAll("[data-workspace-file]").forEach(button=>button.onclick=()=>api().openFile?.(button.dataset.workspaceFile));return win;
  }

  function routines(){const value=read(PREFIX+"routines_1t",[]);return Array.isArray(value)?value:[]}
  function saveRoutines(value){write(PREFIX+"routines_1t",value);api()?.saveWorkspaceNow?.(false)}
  function runRoutine(routine){if(!routine)return;switch(routine.action){case"open-app":api().openApp(routine.value||"home");break;case"notify":notification(routine.name,routine.value||"Routine completed.","Routines");break;case"focus":api().setPrefs?.({focusAssist:true});notification("Focus Assist enabled",routine.name,"Routines");break;case"save":api().saveWorkspaceNow?.(true);break}routine.lastRun=now();saveRoutines(routines().map(item=>item.id===routine.id?routine:item))}
  function openRoutines(){
    const list=routines();
    const html=`<div class="app-shell gold1p-routines"><div class="app-toolbar"><button class="button primary" id="routineNew">Create routine</button><button class="button" id="routineRunLogin">Run login routines now</button></div><div class="app-body"><div class="gold1p-page-title"><div><h1>Routines</h1><p>Automate safe, local actions such as opening an app, enabling focus, saving the VM, or showing a reminder.</p></div><span class="gold1p-status-pill good">Local only</span></div><div class="gold1p-routine-list">${list.map(item=>`<article class="card"><div><b>${esc(item.name)}</b><small>${esc(item.trigger==="login"?"At sign-in":"Manual")} · ${esc(item.action)}</small><p>${esc(item.value||"")}</p></div><div class="button-row"><button class="button primary" data-routine-run="${esc(item.id)}">Run</button><button class="button" data-routine-toggle="${esc(item.id)}">${item.enabled===false?"Enable":"Disable"}</button><button class="button danger" data-routine-delete="${esc(item.id)}">Delete</button></div></article>`).join("")||'<p class="muted">No routines have been created.</p>'}</div></div></div>`;
    const win=api().openWindow("routines","Routines",html,{width:860,height:640}),refresh=()=>{closeWindow(win);setTimeout(openRoutines,40)};
    win.querySelector("#routineNew").onclick=()=>{const name=prompt("Routine name","My routine");if(!name)return;const trigger=prompt("Trigger: manual or login","manual").toLowerCase()==="login"?"login":"manual";const action=prompt("Action: open-app, notify, focus, or save","open-app");if(!["open-app","notify","focus","save"].includes(action)){notification("Routine not created","Choose a supported action.","Routines");return}const value=action==="open-app"?prompt("Application ID (for example office, mail, home)","home"):action==="notify"?prompt("Reminder text","Routine completed."):"";saveRoutines([{id:uid("routine"),name,trigger,action,value,enabled:true,createdAt:now()},...routines()]);refresh()};
    win.querySelector("#routineRunLogin").onclick=()=>routines().filter(item=>item.trigger==="login"&&item.enabled!==false).forEach(runRoutine);
    win.querySelectorAll("[data-routine-run]").forEach(button=>button.onclick=()=>runRoutine(routines().find(item=>String(item.id)===button.dataset.routineRun)));
    win.querySelectorAll("[data-routine-toggle]").forEach(button=>button.onclick=()=>{const data=routines(),item=data.find(x=>String(x.id)===button.dataset.routineToggle);if(item)item.enabled=item.enabled===false;saveRoutines(data);refresh()});
    win.querySelectorAll("[data-routine-delete]").forEach(button=>button.onclick=()=>{saveRoutines(routines().filter(x=>String(x.id)!==button.dataset.routineDelete));refresh()});return win;
  }

  function addApps(){
    const core=api();if(!core?.APPS)return false;
    const definitions=[
      {id:"home",name:"Gold Home",label:"GH",color:"#0078d7",group:"Core",desc:"A personalized dashboard for files, tasks, health, and quick actions.",open:openHome},
      {id:"commandpalette",name:"Command Palette",label:"CP",color:"#4b53bc",group:"Core",desc:"Open apps, files, settings, and actions from one keyboard-first search.",open:openCommandPalette},
      {id:"workspace",name:"My Workspace",label:"MW",color:"#008272",group:"Productivity",desc:"Tasks, events, recent files, and focus tools in one view.",open:openWorkspace},
      {id:"clipboardmanager",name:"Clipboard Manager",label:"CB",color:"#8764b8",group:"Productivity",desc:"Search, pin, copy, and manage clipboard history.",open:openClipboardManager},
      {id:"backupcenter",name:"Backup & Sync",label:"BS",color:"#107c10",group:"System",desc:"Create restore points and safely merge full VM backups.",open:openBackupCenter},
      {id:"compatibility",name:"File Compatibility Center",label:"FC",color:"#0078d7",group:"System",desc:"Validate and safely repair files from previous Gold versions.",open:openCompatibilityCenter},
      {id:"systemhealth",name:"System Health",label:"SH",color:"#107c10",group:"System",desc:"Run VM, migration, storage, and compatibility diagnostics.",open:openSystemHealth},
      {id:"accessibility",name:"Accessibility Center",label:"AC",color:"#5c2d91",group:"Settings",desc:"Visibility, motion, pointer, text, and keyboard controls.",open:openAccessibility},
      {id:"routines",name:"Routines",label:"RT",color:"#e66c00",group:"Productivity",desc:"Automate safe local actions at sign-in or on demand.",open:openRoutines}
    ];
    definitions.forEach(app=>{if(!core.APPS.some(existing=>existing.id===app.id))core.APPS.push(app)});core.renderStartMenu?.();core.renderDesktop?.();return true;
  }
  function patchOpenApp(){
    const core=api();if(!core||core.__gold1pFlagshipPatch)return;core.__gold1pFlagshipPatch=true;const original=core.openApp.bind(core),handlers={home:openHome,commandpalette:openCommandPalette,workspace:openWorkspace,clipboardmanager:openClipboardManager,backupcenter:openBackupCenter,compatibility:openCompatibilityCenter,systemhealth:openSystemHealth,accessibility:openAccessibility,routines:openRoutines};core.openApp=(id,options={})=>handlers[id]?handlers[id](options):original(id,options);window.Gold50=core;window.Gold1T=window.Gold1T||core;Object.assign(window.Gold1T,{openHome,openCommandPalette,openWorkspace,openClipboardManager,openBackupCenter,openCompatibilityCenter,openSystemHealth,openAccessibility,openRoutines,healthReport,fullVMExport});
  }
  function installShortcuts(){document.addEventListener("keydown",event=>{if((event.ctrlKey||event.metaKey)&&event.code==="Space"){event.preventDefault();$("gold1pCommandPalette")?closeCommandPalette():openCommandPalette()}if(event.key==="Escape"&&$("gold1pCommandPalette"))closeCommandPalette()});}
  function installShellPolish(){
    document.body.dataset.flagship="1T";const update=()=>{document.body.classList.toggle("gold1p-narrow",innerWidth<820);document.body.classList.toggle("gold1p-medium",innerWidth<1120)};update();window.addEventListener("resize",update,{passive:true});
    if(!$("gold1pCommandTaskBtn")){const button=document.createElement("button");button.id="gold1pCommandTaskBtn";button.className="task-btn gold1p-command-task";button.title="Command Palette (Ctrl + Space)";button.setAttribute("aria-label","Open Command Palette");button.textContent="⌕";button.onclick=()=>openCommandPalette();$("taskViewBtn")?.after(button)}
  }
  function runLoginRoutines(){if(sessionStorage.getItem("gold1p_login_routines_ran")==="true")return;sessionStorage.setItem("gold1p_login_routines_ran","true");setTimeout(()=>routines().filter(item=>item.trigger==="login"&&item.enabled!==false).forEach(runRoutine),2600)}
  function ensureDefaultHomePreference(){if(localStorage.getItem(PREFIX+"home_1t_at_login")===null)write(PREFIX+"home_1t_at_login",true)}
  function maybeOpenHome(){if(read(PREFIX+"home_1t_at_login",true)!==true)return;if(sessionStorage.getItem("gold1p_home_opened")==="true")return;sessionStorage.setItem("gold1p_home_opened","true");setTimeout(()=>api()?.openApp?.("home"),2100)}
  function init(){
    if(!addApps()){setTimeout(init,80);return}patchOpenApp();installShortcuts();installShellPolish();ensureDefaultHomePreference();applyAccessibility();runLoginRoutines();
    const hash=location.hash.slice(1).toLowerCase();if(["home","commandpalette","workspace","clipboardmanager","backupcenter","compatibility","systemhealth","accessibility","routines"].includes(hash))setTimeout(()=>api().openApp(hash),1100);else maybeOpenHome();
    notification("EmeraldOS Gold 1T ready","Gold Home, Command Palette, compatibility, backup, accessibility, and system health tools are available.","System");
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
