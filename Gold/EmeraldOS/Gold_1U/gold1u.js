"use strict";

/* =========================================================
   EmeraldOS Gold 1U
   Windows 10-inspired usability layer for the Gold 1G base.

   This file intentionally lives in a single guarded IIFE. It does not
   redeclare Gold 1G constants in the global scope, which prevents the
   duplicate-declaration SyntaxError that affected earlier builds.
========================================================= */
(function EmeraldOSGold1U(){
  if(window.__EMERALDOS_GOLD_1U_LOADED__) return;
  window.__EMERALDOS_GOLD_1U_LOADED__=true;

  const VERSION="1U";
  const FOLDER="Gold_1U";
  const PREFIX="gold1g_";
  const PUBLISHER_PIN="093013";
  const REGISTRY_KEY=PREFIX+"registry_1u";
  const REGISTRY_HISTORY_KEY=PREFIX+"registry_1u_history";
  const CLIPBOARD_KEY=PREFIX+"clipboard_history_1u";
  const STARTUP_KEY=PREFIX+"startup_apps_1u";
  const CLOUD_CATEGORIES=["file_tombstones","file_system_metadata","files","file_recovery_catalog","folders","tickets","mail","notes","tasks","events","contacts","notifications","user_apps","remote_sessions","emergency_logs","vm_snapshots","registry_1u","registry_1u_history","clipboard_history_1u","startup_apps_1u","custom_app_logos","app_verification_cache","elsus_original_state","elsus_shell_state","sticky_notes","voice_recordings","feedback_1u","routines_1u","accessibility_1u","home_1u_at_login","update_preferences_1u","update_history_1u","focus_sessions_1u","notification_preferences_1u","session_state_1u","account_history_1u","game_data_1u","calendar_preferences_1u","file_operations_1u","notification_app_permissions_1u","file_shares_1u","shared_files_cache_1u","privacy_audit_1u"];
  const customWindows=new Map();
  const expandedRegistryPaths=new Set(["HKEY_CLASSES_ROOT","HKEY_CURRENT_USER","HKEY_LOCAL_MACHINE","HKEY_USERS","HKEY_CURRENT_CONFIG","HKEY_CURRENT_USER\\Software","HKEY_CURRENT_USER\\Software\\Emerald Systems","HKEY_CURRENT_USER\\Software\\Emerald Systems\\EmeraldOS Gold"]);
  let registrySelection=["HKEY_CURRENT_USER","Software","Emerald Systems","EmeraldOS Gold"];
  let registrySelectedValue=null;
  let zCounter=5000;
  let altTabIndex=0;
  let altTabWindows=[];
  let startEnhancing=false;
  let actionEnhancing=false;
  let publisherClickAuthorizedUntil=0;

  const $=(id)=>document.getElementById(id);
  const qa=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const esc=(value)=>String(value??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const now=()=>new Date().toISOString();
  const userName=()=>localStorage.getItem("username")||localStorage.getItem(PREFIX+"username")||"GoldUser";
  const vmUserId=()=>localStorage.getItem("emeraldGoldAuthenticatedUserId")||localStorage.getItem("userId")||localStorage.getItem(PREFIX+"userId")||userName();
  const normalizeUser=(v)=>String(v||"GoldUser").toLowerCase().replace(/[^a-z0-9._-]/g,"_");
  const readJSON=(key,fallback)=>{try{const v=localStorage.getItem(key);return v===null?fallback:JSON.parse(v)}catch{return fallback}};
  const writeJSON=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch(error){console.warn("Gold 1U local write failed",key,error);return false}};
  const byteLength=(value)=>{try{return new Blob([String(value)]).size}catch{return String(value).length*2}};
  const safeText=(value,max=160)=>String(value??"").slice(0,max);

  function notify(title,body,app="EmeraldOS Gold 1U"){
    try{
      if(window.Gold50?.notify) return window.Gold50.notify(title,body,app);
    }catch{}
    console.info(`[${app}] ${title}: ${body}`);
  }

  function isStaff(){
    /* Gold 1U protected tools require a Staff Edition session that passed
       both EmeraldOS role verification and Emerald Mail verification. */
    for(const key of [PREFIX+"staff_session","gold1u_staff_session"]){
      const value=readJSON(key,null);
      if(!value || value.verified!==true || !value.mail) continue;
      if(value.expiresAt && Date.parse(value.expiresAt)<=Date.now()){
        localStorage.removeItem(key);
        continue;
      }
      return true;
    }
    return false;
  }

  function currentWindow(){
    return qa(".window:not(.minimized)").sort((a,b)=>(Number.parseInt(b.style.zIndex)||0)-(Number.parseInt(a.style.zIndex)||0))[0]||null;
  }

  function focusAnyWindow(win){
    if(!win) return;
    qa(".window").forEach(w=>w.classList.remove("active-window"));
    win.classList.remove("minimized");
    win.style.zIndex=String(++zCounter);
    win.classList.add("active-window");
    const button=$("gold1p_task_"+win.id);
    qa(".gold1p-task-button").forEach(b=>b.classList.remove("active"));
    if(button) button.classList.add("active");
  }

  function taskButtonFor(win){
    const taskApps=$("taskApps");
    if(!taskApps || $("gold1p_task_"+win.id)) return;
    const button=document.createElement("button");
    button.id="gold1p_task_"+win.id;
    button.className="gold1p-task-button active";
    button.title=win.dataset.title||"EmeraldOS Gold 1U";
    button.innerHTML=`<span>${esc((win.dataset.icon||"▦").slice(0,2))}</span><span class="task-label">${esc(win.dataset.title||"Window")}</span>`;
    button.addEventListener("click",()=>{
      if(win.classList.contains("minimized")){win.classList.remove("minimized");focusAnyWindow(win);}
      else if(win.classList.contains("active-window")){win.classList.add("minimized");button.classList.remove("active");}
      else focusAnyWindow(win);
    });
    taskApps.appendChild(button);
  }

  function saveCustomWindowState(){
    const state=qa(".gold1p-window").map(w=>({
      id:w.id,title:w.dataset.title,left:w.style.left,top:w.style.top,width:w.style.width,height:w.style.height,
      minimized:w.classList.contains("minimized"),maximized:w.classList.contains("gold1p-maximized")
    }));
    writeJSON(PREFIX+"window_state_1j",state);
  }

  function open1IWindow(id,title,html,options={}){
    const winId="win_g1h_"+String(id).replace(/[^a-z0-9_-]/gi,"_");
    let win=$(winId);
    if(win && options.singleton!==false){
      win.classList.remove("minimized");
      const content=win.querySelector(".win-content");
      if(content && options.refresh!==false) content.innerHTML=html;
      focusAnyWindow(win);
      return win;
    }
    win=document.createElement("section");
    win.id=options.singleton===false?winId+"_"+Date.now():winId;
    win.className="window gold1p-window";
    win.dataset.title=title;
    win.dataset.app=id;
    win.dataset.icon=options.icon||"▦";
    const width=Math.min(options.width||900,Math.max(340,innerWidth-24));
    const height=Math.min(options.height||620,Math.max(240,innerHeight-54));
    win.style.width=width+"px";
    win.style.height=height+"px";
    win.style.left=Math.max(0,Math.min(innerWidth-width,options.left??(50+Math.random()*100)))+"px";
    win.style.top=Math.max(0,Math.min(innerHeight-height-40,options.top??(35+Math.random()*70)))+"px";
    win.style.zIndex=String(++zCounter);
    win.innerHTML=`
      <div class="win-title" data-g1h-drag="1">
        <span aria-hidden="true">${esc(options.icon||"▦")}</span>
        <span class="title">${esc(title)}</span>
        <div class="win-actions">
          <button type="button" title="Minimize" data-g1h-action="min">—</button>
          <button type="button" title="Maximize" data-g1h-action="max">□</button>
          <button type="button" class="close" title="Close" data-g1h-action="close">×</button>
        </div>
      </div>
      <div class="win-content">${html}</div>
      <div class="resize-handle" data-g1h-resize="1"></div>`;
    ($("windowLayer")||document.body).appendChild(win);
    customWindows.set(win.id,win);
    wireCustomWindow(win);
    taskButtonFor(win);
    focusAnyWindow(win);
    saveCustomWindowState();
    return win;
  }

  function wireCustomWindow(win){
    const title=win.querySelector(".win-title");
    let drag=null;
    let resize=null;
    win.addEventListener("pointerdown",()=>focusAnyWindow(win));
    title?.addEventListener("dblclick",e=>{if(!e.target.closest("button")) maximizeWindow(win.id)});
    title?.addEventListener("pointerdown",e=>{
      if(e.target.closest("button")||win.classList.contains("gold1p-maximized")) return;
      drag={x:e.clientX,y:e.clientY,left:parseFloat(win.style.left)||0,top:parseFloat(win.style.top)||0};
      title.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    });
    win.querySelector("[data-g1h-resize]")?.addEventListener("pointerdown",e=>{
      if(win.classList.contains("gold1p-maximized")) return;
      resize={x:e.clientX,y:e.clientY,width:win.offsetWidth,height:win.offsetHeight};
      e.target.setPointerCapture?.(e.pointerId);e.preventDefault();
    });
    win.addEventListener("pointermove",e=>{
      if(drag){
        win.style.left=Math.max(-win.offsetWidth+80,Math.min(innerWidth-80,drag.left+e.clientX-drag.x))+"px";
        win.style.top=Math.max(0,Math.min(innerHeight-70,drag.top+e.clientY-drag.y))+"px";
        showSnapPreview(e.clientX,e.clientY);
      }
      if(resize){
        win.style.width=Math.max(360,Math.min(innerWidth-(parseFloat(win.style.left)||0),resize.width+e.clientX-resize.x))+"px";
        win.style.height=Math.max(240,Math.min(innerHeight-40-(parseFloat(win.style.top)||0),resize.height+e.clientY-resize.y))+"px";
      }
    });
    win.addEventListener("pointerup",e=>{
      if(drag){applyEdgeSnap(win,e.clientX,e.clientY);drag=null;hideSnapPreview();saveCustomWindowState();}
      if(resize){resize=null;saveCustomWindowState();}
    });
    win.querySelector('[data-g1h-action="min"]')?.addEventListener("click",()=>minimizeWindow(win.id));
    win.querySelector('[data-g1h-action="max"]')?.addEventListener("click",()=>maximizeWindow(win.id));
    win.querySelector('[data-g1h-action="close"]')?.addEventListener("click",()=>closeWindow(win.id));
  }

  function minimizeWindow(id){
    const win=$(id);if(!win)return;
    win.classList.add("minimized");
    $("gold1p_task_"+id)?.classList.remove("active");
    saveCustomWindowState();
  }

  function maximizeWindow(id){
    const win=$(id);if(!win)return;
    if(win.classList.contains("gold1p-maximized")){
      const restore=readJSON(PREFIX+"restore_"+id,null);
      win.classList.remove("gold1p-maximized","gold1p-snapped");
      if(restore) Object.assign(win.style,restore);
    }else{
      writeJSON(PREFIX+"restore_"+id,{left:win.style.left,top:win.style.top,width:win.style.width,height:win.style.height});
      win.classList.add("gold1p-maximized");
    }
    focusAnyWindow(win);saveCustomWindowState();
  }

  function closeWindow(id){
    const win=$(id);if(!win)return;
    $("gold1p_task_"+id)?.remove();
    customWindows.delete(id);win.remove();saveCustomWindowState();
  }

  function snapWindow(win,zone){
    if(!win)return;
    if(win.classList.contains("gold1p-maximized")) win.classList.remove("gold1p-maximized");
    const taskbar=40,w=innerWidth,h=innerHeight-taskbar;
    if(!win.dataset.g1hRestore) win.dataset.g1hRestore=JSON.stringify({left:win.style.left,top:win.style.top,width:win.style.width,height:win.style.height});
    win.classList.add("gold1p-snapped");
    const map={
      left:{left:0,top:0,width:w/2,height:h},right:{left:w/2,top:0,width:w/2,height:h},
      top:{left:0,top:0,width:w,height:h},bottom:{left:0,top:h/2,width:w,height:h/2},
      topLeft:{left:0,top:0,width:w/2,height:h/2},topRight:{left:w/2,top:0,width:w/2,height:h/2},
      bottomLeft:{left:0,top:h/2,width:w/2,height:h/2},bottomRight:{left:w/2,top:h/2,width:w/2,height:h/2}
    };
    const r=map[zone];if(!r)return;
    Object.assign(win.style,{left:r.left+"px",top:r.top+"px",width:r.width+"px",height:r.height+"px"});
    focusAnyWindow(win);saveCustomWindowState();
  }

  function applyEdgeSnap(win,x,y){
    const margin=18;
    if(y<=margin && x<=innerWidth*.25) return snapWindow(win,"topLeft");
    if(y<=margin && x>=innerWidth*.75) return snapWindow(win,"topRight");
    if(y<=margin) return snapWindow(win,"top");
    if(x<=margin) return snapWindow(win,"left");
    if(x>=innerWidth-margin) return snapWindow(win,"right");
  }

  function showSnapPreview(x,y){
    let zone=null;
    if(y<18&&x<innerWidth*.25)zone="topLeft";else if(y<18&&x>innerWidth*.75)zone="topRight";
    else if(y<18)zone="top";else if(x<18)zone="left";else if(x>innerWidth-18)zone="right";
    let preview=$("gold1pSnapPreview");
    if(!zone){preview?.remove();return}
    if(!preview){preview=document.createElement("div");preview.id="gold1pSnapPreview";preview.className="gold1p-snap-preview";document.body.appendChild(preview)}
    const w=innerWidth,h=innerHeight-40;
    const map={left:[0,0,w/2,h],right:[w/2,0,w/2,h],top:[0,0,w,h],topLeft:[0,0,w/2,h/2],topRight:[w/2,0,w/2,h/2]};
    const r=map[zone];Object.assign(preview.style,{left:r[0]+"px",top:r[1]+"px",width:r[2]+"px",height:r[3]+"px"});
  }
  function hideSnapPreview(){$("gold1pSnapPreview")?.remove()}

  /* ------------------------- Registry ------------------------- */
  function defaultRegistry(){
    const username=userName();
    return {
      HKEY_CLASSES_ROOT:{
        _values:{"(Default)":{type:"REG_SZ",data:"EmeraldOS file associations"}},
        ".doc":{_values:{"(Default)":{type:"REG_SZ",data:"EmeraldOS.Document"}}},
        ".note":{_values:{"(Default)":{type:"REG_SZ",data:"EmeraldOS.Note"}}},
        "EmeraldOS.Document":{shell:{open:{command:{_values:{"(Default)":{type:"REG_SZ",data:"office.exe %1"}}}}}},
        "emerald":{_values:{"URL Protocol":{type:"REG_SZ",data:""}},shell:{open:{command:{_values:{"(Default)":{type:"REG_SZ",data:"emerald://%1"}}}}}}
      },
      HKEY_CURRENT_USER:{
        _values:{"(Default)":{type:"REG_SZ",data:username}},
        Software:{"Emerald Systems":{"EmeraldOS Gold":{
          _values:{Version:{type:"REG_SZ",data:VERSION}},
          Personalization:{_values:{AccentColor:{type:"REG_SZ",data:"#0078d7"},Theme:{type:"REG_SZ",data:"light"},Transparency:{type:"REG_BOOL",data:true}}},
          Explorer:{_values:{ShowFileExtensions:{type:"REG_BOOL",data:true},OpenFoldersInNewWindow:{type:"REG_BOOL",data:false}}},
          Taskbar:{_values:{SearchMode:{type:"REG_SZ",data:"box"},CombineButtons:{type:"REG_BOOL",data:true},ShowTaskView:{type:"REG_BOOL",data:true}}},
          Accessibility:{_values:{TextScale:{type:"REG_DWORD",data:100},HighContrast:{type:"REG_BOOL",data:false}}}
        }}},
        ControlPanel:{Desktop:{_values:{WallpaperStyle:{type:"REG_SZ",data:"Fill"}}}}
      },
      HKEY_LOCAL_MACHINE:{
        _values:{"(Default)":{type:"REG_SZ",data:"EmeraldOS Gold virtual machine"}},
        SOFTWARE:{"Emerald Systems":{"EmeraldOS Gold":{_values:{InstallFolder:{type:"REG_SZ",data:FOLDER},Version:{type:"REG_SZ",data:VERSION},CloudVMPath:{type:"REG_SZ",data:"emeraldOSUsers/{username}/goldVM/current"}}}}},
        SYSTEM:{CurrentControlSet:{Control:{_values:{SafeMode:{type:"REG_BOOL",data:false},CloudBoot:{type:"REG_BOOL",data:true}}}}}
      },
      HKEY_USERS:{[normalizeUser(username)]:{_values:{ProfileName:{type:"REG_SZ",data:username}}}},
      HKEY_CURRENT_CONFIG:{_values:{DisplayWidth:{type:"REG_DWORD",data:innerWidth},DisplayHeight:{type:"REG_DWORD",data:innerHeight},DevicePixelRatio:{type:"REG_SZ",data:String(devicePixelRatio||1)}}}
    };
  }

  function registryData(){
    const data=readJSON(REGISTRY_KEY,null);
    if(data&&typeof data==="object") return data;
    const seeded=defaultRegistry();writeJSON(REGISTRY_KEY,seeded);return seeded;
  }
  function saveRegistry(data,reason="Registry changed"){
    snapshotRegistry(reason);
    writeJSON(REGISTRY_KEY,data);
    applyRegistryEffects(data);
    saveWorkspaceDebounced1I();
  }
  function snapshotRegistry(reason){
    const current=readJSON(REGISTRY_KEY,null);if(!current)return;
    const history=readJSON(REGISTRY_HISTORY_KEY,[]);
    history.unshift({id:crypto?.randomUUID?.()||String(Date.now()),time:now(),reason,data:current});
    writeJSON(REGISTRY_HISTORY_KEY,history.slice(0,20));
  }
  function getRegistryNode(path,create=false){
    let node=registryData();
    for(const part of path){
      if(!node||typeof node!=="object")return null;
      if(!Object.prototype.hasOwnProperty.call(node,part)){
        if(!create)return null;node[part]={_values:{}};
      }
      node=node[part];
    }
    if(create&&!node._values)node._values={};
    return node;
  }
  const pathText=(path)=>path.join("\\");
  const pathToken=(path)=>encodeURIComponent(JSON.stringify(path));
  const tokenPath=(token)=>{try{return JSON.parse(decodeURIComponent(token))}catch{return []}};
  function canWriteRegistry(path){
    const hive=path[0];
    return hive==="HKEY_CURRENT_USER"||hive==="HKEY_CLASSES_ROOT"||isStaff();
  }
  function registryChildren(node){return Object.keys(node||{}).filter(k=>k!=="_values").sort((a,b)=>a.localeCompare(b));}
  function registryTreeHTML(node,path=[],depth=0){
    return registryChildren(node).map(name=>{
      const next=[...path,name],key=pathText(next),child=node[name],hasChildren=registryChildren(child).length>0;
      const expanded=expandedRegistryPaths.has(key),selected=pathText(registrySelection)===key;
      return `<div class="gold1p-tree-row ${selected?"selected":""}" data-reg-path="${esc(pathToken(next))}" style="padding-left:${depth*15}px">
        <span class="gold1p-tree-caret" data-reg-toggle="${esc(pathToken(next))}">${hasChildren?(expanded?"▼":"▶"):""}</span>
        <span class="gold1p-tree-folder">▰</span><span>${esc(name)}</span>
      </div>${hasChildren&&expanded?registryTreeHTML(child,next,depth+1):""}`;
    }).join("");
  }
  function registryValueDisplay(value){
    if(value?.type==="REG_BOOL")return value.data?"true":"false";
    if(value?.type==="REG_MULTI_SZ")return Array.isArray(value.data)?value.data.join(" · "):String(value.data??"");
    if(value?.type==="REG_JSON")return JSON.stringify(value.data);
    return String(value?.data??"");
  }
  function registryHTML(){
    const data=registryData(),node=getRegistryNode(registrySelection)||{_values:{}},values=node._values||{};
    const locked=!canWriteRegistry(registrySelection);
    return `<div class="gold1p-app gold1p-registry">
      <div class="gold1p-commandbar">
        <button data-reg-command="newKey">New Key</button><button data-reg-command="newValue">New Value</button>
        <button data-reg-command="editValue">Edit</button><button data-reg-command="rename">Rename</button>
        <button data-reg-command="delete">Delete</button><button data-reg-command="export">Export</button>
        <button data-reg-command="import">Import</button><button data-reg-command="restore">Restore Point</button>
        <input id="gold1pRegistryPath" class="gold1p-field gold1p-reg-path gold1p-code" value="${esc(pathText(registrySelection))}" aria-label="Registry path">
        ${locked?'<span class="gold1p-reg-lock">Read-only without Staff Edition</span>':""}
      </div>
      <div class="gold1p-reg-body">
        <div class="gold1p-reg-tree">${registryTreeHTML(data)}</div>
        <div class="gold1p-reg-values">
          <table class="gold1p-reg-table"><thead><tr><th style="width:32%">Name</th><th style="width:19%">Type</th><th>Data</th></tr></thead>
          <tbody>${Object.entries(values).map(([name,value])=>`<tr data-reg-value="${esc(encodeURIComponent(name))}" class="${registrySelectedValue===name?"selected":""}"><td>${esc(name)}</td><td>${esc(value.type||"REG_SZ")}</td><td>${esc(registryValueDisplay(value))}</td></tr>`).join("")||'<tr><td colspan="3" class="gold1p-empty">This key has no values.</td></tr>'}</tbody></table>
        </div>
      </div>
      <div class="gold1p-statusbar"><span>${esc(pathText(registrySelection))}</span><span>${Object.keys(values).length} value(s)</span><span>${locked?"Protected hive":"Editable"}</span></div>
    </div>`;
  }
  function openRegistryEditor(){
    const win=open1IWindow("regedit","Emerald Registry Editor",registryHTML(),{width:1050,height:700,icon:"▦",refresh:true});
    wireRegistryUI(win);return win;
  }
  function renderRegistry(){const win=$("win_g1h_regedit");if(!win)return;const c=win.querySelector(".win-content");if(c)c.innerHTML=registryHTML();wireRegistryUI(win)}
  function wireRegistryUI(win){
    win.querySelectorAll("[data-reg-path]").forEach(row=>{
      row.addEventListener("click",()=>{registrySelection=tokenPath(row.dataset.regPath);registrySelectedValue=null;renderRegistry()});
      row.addEventListener("dblclick",()=>{const key=pathText(tokenPath(row.dataset.regPath));expandedRegistryPaths.has(key)?expandedRegistryPaths.delete(key):expandedRegistryPaths.add(key);renderRegistry()});
    });
    win.querySelectorAll("[data-reg-toggle]").forEach(caret=>caret.addEventListener("click",e=>{
      e.stopPropagation();const key=pathText(tokenPath(caret.dataset.regToggle));expandedRegistryPaths.has(key)?expandedRegistryPaths.delete(key):expandedRegistryPaths.add(key);renderRegistry();
    }));
    win.querySelectorAll("[data-reg-value]").forEach(row=>{
      row.addEventListener("click",()=>{registrySelectedValue=decodeURIComponent(row.dataset.regValue);renderRegistry()});
      row.addEventListener("dblclick",()=>{registrySelectedValue=decodeURIComponent(row.dataset.regValue);editRegistryValue()});
    });
    win.querySelectorAll("[data-reg-command]").forEach(button=>button.addEventListener("click",()=>registryCommand(button.dataset.regCommand)));
    const pathInput=$("gold1pRegistryPath");pathInput?.addEventListener("keydown",e=>{if(e.key==="Enter")navigateRegistry(pathInput.value)});
  }
  function navigateRegistry(text){
    const path=String(text||"").split(/[\\/]+/).filter(Boolean);
    if(!getRegistryNode(path)){notify("Registry path not found",text,"Registry Editor");return}
    registrySelection=path;let partial=[];path.forEach(p=>{partial.push(p);expandedRegistryPaths.add(pathText(partial))});registrySelectedValue=null;renderRegistry();
  }
  function registryCommand(command){
    const map={newKey:newRegistryKey,newValue:newRegistryValue,editValue:editRegistryValue,rename:renameRegistryItem,delete:deleteRegistryItem,export:exportRegistry,import:importRegistry,restore:restoreRegistry};
    map[command]?.();
  }
  function requireRegistryWrite(){
    if(canWriteRegistry(registrySelection))return true;
    notify("Protected registry hive","Open Gold Staff Edition to modify HKEY_LOCAL_MACHINE, HKEY_USERS, or HKEY_CURRENT_CONFIG.","Registry Editor");return false;
  }
  function newRegistryKey(){
    if(!requireRegistryWrite())return;
    const name=prompt("New key name","New Key");if(!name)return;
    if(name==="_values"||/[\\/]/.test(name)){notify("Invalid key name","Key names cannot contain slashes.","Registry Editor");return}
    const data=registryData(),node=getNodeFrom(data,registrySelection);if(node[name]){notify("Key already exists",name,"Registry Editor");return}
    node[name]={_values:{}};saveRegistry(data,"Created "+pathText([...registrySelection,name]));expandedRegistryPaths.add(pathText(registrySelection));renderRegistry();
  }
  function parseRegistryValue(type,input){
    if(type==="REG_DWORD"||type==="REG_QWORD"){const n=Number(input);if(!Number.isFinite(n))throw new Error("Enter a valid number.");return n}
    if(type==="REG_BOOL")return /^(true|1|yes|on)$/i.test(String(input).trim());
    if(type==="REG_MULTI_SZ")return String(input).split(/\r?\n|;/).map(s=>s.trim()).filter(Boolean);
    if(type==="REG_JSON")return JSON.parse(input);
    return String(input);
  }
  function newRegistryValue(){
    if(!requireRegistryWrite())return;
    const name=prompt("Value name","New Value");if(name===null||name==="")return;
    const type=(prompt("Value type: REG_SZ, REG_DWORD, REG_QWORD, REG_MULTI_SZ, REG_JSON, REG_BOOL","REG_SZ")||"REG_SZ").toUpperCase();
    const allowed=["REG_SZ","REG_DWORD","REG_QWORD","REG_MULTI_SZ","REG_JSON","REG_BOOL"];if(!allowed.includes(type)){notify("Unsupported value type",type,"Registry Editor");return}
    const input=prompt("Value data",type==="REG_BOOL"?"true":"");if(input===null)return;
    try{const data=registryData(),node=getNodeFrom(data,registrySelection);node._values=node._values||{};node._values[name]={type,data:parseRegistryValue(type,input)};saveRegistry(data,"Created value "+name);registrySelectedValue=name;renderRegistry()}catch(error){notify("Invalid registry data",error.message,"Registry Editor")}
  }
  function editRegistryValue(){
    if(!registrySelectedValue){notify("Select a value","Select a registry value before editing.","Registry Editor");return}
    if(!requireRegistryWrite())return;
    const data=registryData(),node=getNodeFrom(data,registrySelection),value=node?._values?.[registrySelectedValue];if(!value)return;
    const input=prompt(`Edit ${registrySelectedValue} (${value.type})`,value.type==="REG_JSON"?JSON.stringify(value.data,null,2):value.type==="REG_MULTI_SZ"?(value.data||[]).join("\n"):String(value.data));if(input===null)return;
    try{value.data=parseRegistryValue(value.type,input);saveRegistry(data,"Edited value "+registrySelectedValue);renderRegistry()}catch(error){notify("Invalid registry data",error.message,"Registry Editor")}
  }
  function renameRegistryItem(){
    if(!requireRegistryWrite())return;
    if(registrySelectedValue){
      const name=prompt("Rename value",registrySelectedValue);if(!name||name===registrySelectedValue)return;
      const data=registryData(),node=getNodeFrom(data,registrySelection);if(node._values[name])return notify("Value already exists",name,"Registry Editor");
      node._values[name]=node._values[registrySelectedValue];delete node._values[registrySelectedValue];registrySelectedValue=name;saveRegistry(data,"Renamed registry value");renderRegistry();return;
    }
    if(registrySelection.length<=1)return notify("Hive cannot be renamed","Select a subkey.","Registry Editor");
    const old=registrySelection.at(-1),name=prompt("Rename key",old);if(!name||name===old)return;
    const data=registryData(),parent=getNodeFrom(data,registrySelection.slice(0,-1));if(parent[name])return notify("Key already exists",name,"Registry Editor");
    parent[name]=parent[old];delete parent[old];registrySelection=[...registrySelection.slice(0,-1),name];saveRegistry(data,"Renamed registry key");renderRegistry();
  }
  function deleteRegistryItem(){
    if(!requireRegistryWrite())return;
    const data=registryData();
    if(registrySelectedValue){
      if(!confirm(`Delete registry value “${registrySelectedValue}”?`))return;
      const node=getNodeFrom(data,registrySelection);delete node._values[registrySelectedValue];registrySelectedValue=null;saveRegistry(data,"Deleted registry value");renderRegistry();return;
    }
    if(registrySelection.length<=1)return notify("Hive cannot be deleted","Select a subkey.","Registry Editor");
    if(!confirm(`Delete registry key “${pathText(registrySelection)}” and all subkeys?`))return;
    const parent=getNodeFrom(data,registrySelection.slice(0,-1));delete parent[registrySelection.at(-1)];registrySelection=registrySelection.slice(0,-1);saveRegistry(data,"Deleted registry key");renderRegistry();
  }
  function getNodeFrom(root,path){let node=root;for(const part of path){if(!node?.[part])return null;node=node[part]}return node}
  function exportRegistry(){
    const data=registryData(),payload={product:"EmeraldOS Gold",version:VERSION,exportedAt:now(),path:pathText(registrySelection),data:getNodeFrom(data,registrySelection)};
    saveText(`emeraldos-gold-1h-registry-${registrySelection.at(-1)}.json`,JSON.stringify(payload,null,2),"application/json");
  }
  function importRegistry(){
    if(!requireRegistryWrite())return;
    const input=document.createElement("input");input.type="file";input.accept="application/json,.json";
    input.onchange=async()=>{const file=input.files?.[0];if(!file)return;try{const payload=JSON.parse(await file.text());const imported=payload.data||payload;if(!imported||typeof imported!=="object")throw new Error("The file did not contain a registry object.");const data=registryData();if(registrySelection.length===1&&payload.path===registrySelection[0])data[registrySelection[0]]=imported;else{const parent=getNodeFrom(data,registrySelection.slice(0,-1));parent[registrySelection.at(-1)]=imported}saveRegistry(data,"Imported registry file");renderRegistry();notify("Registry imported",file.name,"Registry Editor")}catch(error){notify("Registry import failed",error.message,"Registry Editor")}};
    input.click();
  }
  function restoreRegistry(){
    const history=readJSON(REGISTRY_HISTORY_KEY,[]);if(!history.length)return notify("No restore points","Registry restore points are created before changes.","Registry Editor");
    const lines=history.slice(0,10).map((h,i)=>`${i+1}. ${new Date(h.time).toLocaleString()} — ${h.reason}`).join("\n");
    const pick=Number(prompt("Choose a registry restore point:\n"+lines,"1"));const item=history[pick-1];if(!item)return;
    if(!confirm(`Restore the registry to ${new Date(item.time).toLocaleString()}?`))return;
    snapshotRegistry("Before restoring registry");writeJSON(REGISTRY_KEY,item.data);applyRegistryEffects(item.data);renderRegistry();notify("Registry restored",item.reason,"Registry Editor");
  }
  function registryValueAt(data,path,name,fallback){return getNodeFrom(data,path)?._values?.[name]?.data??fallback}
  function applyRegistryEffects(data=registryData()){
    const root=document.documentElement;
    const personal=["HKEY_CURRENT_USER","Software","Emerald Systems","EmeraldOS Gold","Personalization"];
    const task=["HKEY_CURRENT_USER","Software","Emerald Systems","EmeraldOS Gold","Taskbar"];
    const access=["HKEY_CURRENT_USER","Software","Emerald Systems","EmeraldOS Gold","Accessibility"];
    const accent=String(registryValueAt(data,personal,"AccentColor","#0078d7"));if(/^#[0-9a-f]{3,8}$/i.test(accent)){root.style.setProperty("--g1h-blue",accent);root.style.setProperty("--accent",accent)}
    const theme=String(registryValueAt(data,personal,"Theme","light"));document.body.classList.toggle("dark",theme==="dark");
    document.body.classList.toggle("gold1p-no-transparency",registryValueAt(data,personal,"Transparency",true)===false);
    const searchMode=String(registryValueAt(data,task,"SearchMode","box"));const search=$("searchBtn");if(search){search.style.display=searchMode==="hidden"?"none":"";search.classList.toggle("search-wide",searchMode==="box")}
    const showTaskView=registryValueAt(data,task,"ShowTaskView",true)!==false;if($("taskViewBtn"))$("taskViewBtn").style.display=showTaskView?"":"none";
    const scale=Number(registryValueAt(data,access,"TextScale",100));root.style.fontSize=Math.max(80,Math.min(170,scale))+"%";
    document.body.classList.toggle("high-contrast",registryValueAt(data,access,"HighContrast",false)===true);
  }

  /* ------------------------- Task Manager ------------------------- */
  function processRows(){
    const windows=qa(".window");
    return windows.map((w,index)=>({
      id:w.id,title:w.dataset.title||w.querySelector(".title")?.textContent||"Application",
      app:w.dataset.app||"system",status:w.classList.contains("minimized")?"Suspended":"Running",
      memory:Math.max(8,Math.round((w.innerHTML.length/1024)+12+(index%7)*3)),win:w
    }));
  }
  function taskManagerHTML(tab="processes"){
    return `<div class="gold1p-app gold1p-taskmgr">
      <div class="gold1p-tabs"><button class="${tab==="processes"?"active":""}" data-task-tab="processes">Processes</button><button class="${tab==="performance"?"active":""}" data-task-tab="performance">Performance</button><button class="${tab==="startup"?"active":""}" data-task-tab="startup">Startup</button><button class="${tab==="details"?"active":""}" data-task-tab="details">Details</button></div>
      <div class="gold1p-taskmgr-content">${taskManagerPage(tab)}</div>
      <div class="gold1p-statusbar"><span>${processRows().length} apps and windows</span><span>EmeraldOS Gold 1U</span><span class="gold1p-muted">Virtual process manager</span></div>
    </div>`;
  }
  function taskManagerPage(tab){
    if(tab==="performance"){
      const localBytes=Object.keys(localStorage).reduce((n,k)=>n+byteLength(k)+byteLength(localStorage.getItem(k)||""),0);
      const max=5*1024*1024,percent=Math.min(100,Math.round(localBytes/max*100));
      return `<div class="gold1p-performance-grid"><div class="gold1p-performance-card"><h3>CPU</h3><h1>${Math.min(94,8+processRows().length*4)}%</h1><div class="gold1p-meter"><span style="width:${Math.min(94,8+processRows().length*4)}%"></span></div><p class="gold1p-muted">Browser-hosted virtual CPU activity estimate.</p></div><div class="gold1p-performance-card"><h3>Memory</h3><h1>${percent}%</h1><div class="gold1p-meter"><span style="width:${percent}%"></span></div><p>${(localBytes/1024/1024).toFixed(2)} MB local VM storage in use.</p></div><div class="gold1p-performance-card"><h3>Cloud VM</h3><h2>${esc(localStorage.getItem(PREFIX+"cloud_status")||"Ready")}</h2><p>Path: emeraldOSUsers/${esc(userName())}/goldVM/current</p></div><div class="gold1p-performance-card"><h3>Uptime</h3><h2>${formatUptime(performance.now())}</h2><p>${navigator.onLine?"Network connected":"Offline"}</p></div></div>`;
    }
    if(tab==="startup"){
      const startup=readJSON(STARTUP_KEY,[{id:"cloudsync",name:"Cloud VM Sync",enabled:true,impact:"Low"},{id:"notifications",name:"Notification Service",enabled:true,impact:"Low"},{id:"updatecheck",name:"E.L.S.U.S. Update Check",enabled:true,impact:"Medium"}]);
      return `<table class="gold1p-process-table"><thead><tr><th>Name</th><th>Status</th><th>Startup impact</th><th></th></tr></thead><tbody>${startup.map((a,i)=>`<tr><td>${esc(a.name)}</td><td>${a.enabled?"Enabled":"Disabled"}</td><td>${esc(a.impact||"Not measured")}</td><td><button class="gold1p-button" data-startup-toggle="${i}">${a.enabled?"Disable":"Enable"}</button></td></tr>`).join("")}</tbody></table>`;
    }
    const rows=processRows();
    return `<table class="gold1p-process-table"><thead><tr><th>Name</th><th>Status</th><th>App ID</th><th>Memory</th><th></th></tr></thead><tbody>${rows.map(p=>`<tr><td>${esc(p.title)}</td><td>${esc(p.status)}</td><td class="gold1p-code">${esc(p.app)}</td><td>${p.memory} MB</td><td><button class="gold1p-button" data-end-task="${esc(p.id)}">End task</button></td></tr>`).join("")||'<tr><td colspan="5" class="gold1p-empty">No applications are running.</td></tr>'}</tbody></table>`;
  }
  function formatUptime(ms){const total=Math.floor(ms/1000),h=Math.floor(total/3600),m=Math.floor(total%3600/60),s=total%60;return `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`}
  function openTaskManager(tab="processes"){
    const win=open1IWindow("taskmanager","Task Manager",taskManagerHTML(tab),{width:860,height:590,icon:"▤",refresh:true});wireTaskManager(win);return win;
  }
  function wireTaskManager(win){
    win.querySelectorAll("[data-task-tab]").forEach(b=>b.addEventListener("click",()=>{win.querySelector(".win-content").innerHTML=taskManagerHTML(b.dataset.taskTab);wireTaskManager(win)}));
    win.querySelectorAll("[data-end-task]").forEach(b=>b.addEventListener("click",()=>{const id=b.dataset.endTask;if(id.startsWith("win_g1h_"))closeWindow(id);else{try{window.Gold50?.closeWin?.(id)}catch{}$(id)?.remove()}win.querySelector(".win-content").innerHTML=taskManagerHTML("processes");wireTaskManager(win)}));
    win.querySelectorAll("[data-startup-toggle]").forEach(b=>b.addEventListener("click",()=>{const list=readJSON(STARTUP_KEY,[]),i=Number(b.dataset.startupToggle);if(list[i])list[i].enabled=!list[i].enabled;writeJSON(STARTUP_KEY,list);win.querySelector(".win-content").innerHTML=taskManagerHTML("startup");wireTaskManager(win)}));
  }

  /* ------------------------- Control Panel ------------------------- */
  const CONTROL_ITEMS=[
    ["System and Security","System information, cloud VM, recovery, and E.L.S.U.S.","⚙","system"],
    ["Network and Internet","Connection status and browser network tools.","⌁","network"],
    ["Hardware and Sound","Display, volume, input, and device options.","▣","hardware"],
    ["Programs","Installed apps, default apps, and startup programs.","▦","programs"],
    ["User Accounts","Current EmeraldOS account and profile controls.","◉","accounts"],
    ["Appearance and Personalization","Wallpaper, colors, taskbar, Start, and accessibility.","▧","personalization"],
    ["Clock and Region","Date, time, calendar, and locale information.","◷","clock"],
    ["Ease of Access","Text scale, high contrast, focus indicators, and keyboard help.","◎","accessibility"],
    ["Emerald Registry Editor","Edit the EmeraldOS virtual HKEY registry.","▥","regedit"],
    ["Administrative Tools","Task Manager, diagnostics, BIOS, and publisher tools.","▤","admin"]
  ];
  function controlPanelHTML(){return `<div class="gold1p-app gold1p-control-shell"><div class="gold1p-control-header"><h2>Control Panel</h2><p class="gold1p-muted">Adjust your computer's settings.</p><input id="gold1pControlSearch" class="gold1p-field" style="width:min(420px,100%)" placeholder="Search Control Panel"></div><div class="gold1p-control-grid">${CONTROL_ITEMS.map(item=>`<button class="gold1p-control-item" data-control="${item[3]}" data-control-text="${esc((item[0]+" "+item[1]).toLowerCase())}"><span class="icon">${item[2]}</span><span><b>${esc(item[0])}</b><small>${esc(item[1])}</small></span></button>`).join("")}</div></div>`}
  function openControlPanel(){const win=open1IWindow("control","Control Panel",controlPanelHTML(),{width:920,height:650,icon:"⚙",refresh:true});wireControlPanel(win);return win}
  function wireControlPanel(win){
    win.querySelectorAll("[data-control]").forEach(b=>b.addEventListener("click",()=>openControlItem(b.dataset.control)));
    $("gold1pControlSearch")?.addEventListener("input",e=>{const q=e.target.value.toLowerCase();win.querySelectorAll("[data-control]").forEach(b=>b.style.display=b.dataset.controlText.includes(q)?"":"none")});
  }
  function openControlItem(id){
    const base=id=>{try{return window.Gold50?.openApp?.(id)}catch{return null}};
    if(id==="regedit")return openRegistryEditor();if(id==="clock")return toggleClockFlyout();if(id==="admin")return openTaskManager();
    if(id==="personalization")return base("themestudio")||base("settings");if(id==="accessibility")return base("accessibility")||base("settings");
    if(id==="programs")return base("store")||base("settings");if(id==="accounts")return base("settings");if(id==="system")return openSystemInformation();
    if(id==="network")return openSimplePanel("Network and Internet",`<h2>Network status</h2><p>${navigator.onLine?"Connected to the Internet":"Offline"}</p><div class="gold1p-control-grid"><button class="gold1p-control-item" onclick="Gold1U.runCommand('settings')"><span class="icon">⌁</span><span><b>Network settings</b><small>Open EmeraldOS Settings.</small></span></button></div>`);
    if(id==="hardware")return base("settings");
  }
  function openSimplePanel(id,html){return open1IWindow(id.toLowerCase().replace(/\W/g,"_"),id,`<div class="gold1p-app" style="padding:18px;overflow:auto">${html}</div>`,{width:760,height:520,icon:"⚙",refresh:true})}
  function openSystemInformation(){
    const storage=Object.keys(localStorage).reduce((n,k)=>n+byteLength(k)+byteLength(localStorage.getItem(k)||""),0);
    return openSimplePanel("System",`<h1>EmeraldOS Gold 1U</h1><p>Emerald Systems virtual operating environment</p><hr><div class="gold1p-control-grid"><div class="gold1p-performance-card"><b>Edition</b><p>EmeraldOS Gold 1U</p></div><div class="gold1p-performance-card"><b>User</b><p>${esc(userName())}</p></div><div class="gold1p-performance-card"><b>Browser platform</b><p>${esc(navigator.platform||"Web platform")}</p></div><div class="gold1p-performance-card"><b>Display</b><p>${innerWidth} × ${innerHeight} @ ${devicePixelRatio||1}x</p></div><div class="gold1p-performance-card"><b>Local VM storage</b><p>${(storage/1024/1024).toFixed(2)} MB</p></div><div class="gold1p-performance-card"><b>Cloud VM</b><p>emeraldOSUsers/${esc(userName())}/goldVM/current</p></div></div>`);
  }

  /* ------------------------- Run and Clipboard ------------------------- */
  function openRunDialog(){
    const html=`<div class="gold1p-app"><div class="gold1p-run"><div class="gold1p-run-icon">▦</div><div><p>Type the name of a program, folder, document, or EmeraldOS command, and Gold will open it for you.</p><div class="gold1p-run-row"><label for="gold1pRunInput">Open:</label><input id="gold1pRunInput" class="gold1p-field" autocomplete="off"></div></div></div><div class="gold1p-run-buttons"><button class="gold1p-button primary" id="gold1pRunOK">OK</button><button class="gold1p-button" onclick="Gold1U.closeWin('win_g1h_run')">Cancel</button><button class="gold1p-button" onclick="Gold1U.runCommand('explorer')">Browse...</button></div></div>`;
    const win=open1IWindow("run","Run",html,{width:520,height:255,icon:"▦",refresh:true});
    const input=$("gold1pRunInput");setTimeout(()=>input?.focus(),0);input?.addEventListener("keydown",e=>{if(e.key==="Enter")runCommand(input.value)});$("gold1pRunOK")?.addEventListener("click",()=>runCommand(input?.value||""));return win;
  }
  function runCommand(raw){
    const command=String(raw||"").trim();if(!command)return;
    const lower=command.toLowerCase();
    const close=()=>closeWindow("win_g1h_run");
    if(["regedit","hkey","registry"].includes(lower)){close();return openRegistryEditor()}
    if(["taskmgr","task manager"].includes(lower)){close();return openTaskManager()}
    if(["control","control panel"].includes(lower)){close();return openControlPanel()}
    if(["settings","ms-settings:","ms-settings"].includes(lower)){close();return window.Gold50?.openApp?.("settings")}
    if(["explorer","explorer.exe","files"].includes(lower)){close();return window.Gold50?.openApp?.("explorer")}
    if(["cmd","terminal","emerald dos","dos"].includes(lower)){close();return window.Gold50?.openApp?.("terminal")||window.Gold50?.openApp?.("bios")}
    if(["winver","about"].includes(lower)){close();return openSystemInformation()}
    if(["clipboard","clip","win+v"].includes(lower)){close();return openClipboardHistory()}
    if(["update","windowsupdate","elsus"].includes(lower)){close();return window.Gold50?.openApp?.("updateshell")}
    if(["publisher","updatepublisher"].includes(lower)){close();return openPublisherManager()}
    if(lower.startsWith("http://")||lower.startsWith("https://")){close();window.open(command,"_blank","noopener");return}
    try{const result=window.Gold50?.openApp?.(lower);if(result!==undefined){close();return result}}catch{}
    notify("EmeraldOS cannot find '"+safeText(command,70)+"'","Check the spelling and try again.","Run");
  }
  function clipboardHistory(){return readJSON(CLIPBOARD_KEY,[])}
  function saveClipboardText(text){
    text=String(text||"").trim();if(!text||text.length>100000)return;
    let items=clipboardHistory().filter(x=>x.text!==text);items.unshift({id:String(Date.now()),text,time:now(),pinned:false});writeJSON(CLIPBOARD_KEY,items.slice(0,25));
  }
  function openClipboardHistory(){
    const items=clipboardHistory();
    const html=`<div class="gold1p-app"><div class="gold1p-commandbar"><b>Clipboard</b><span class="gold1p-muted">Win + V</span><span style="flex:1"></span><button id="gold1pClipboardClear">Clear all</button></div><div class="gold1p-clipboard-list">${items.map(item=>`<div class="gold1p-clipboard-item" data-clip-id="${esc(item.id)}" title="Click to copy">${esc(item.text)}</div>`).join("")||'<div class="gold1p-empty"><h2>Your clipboard is empty</h2><p>Copy text to add it to clipboard history.</p></div>'}</div></div>`;
    const win=open1IWindow("clipboard","Clipboard history",html,{width:410,height:540,icon:"▤",refresh:true});
    win.querySelectorAll("[data-clip-id]").forEach(el=>el.addEventListener("click",async()=>{const item=items.find(x=>x.id===el.dataset.clipId);if(!item)return;try{await navigator.clipboard.writeText(item.text);notify("Copied to clipboard",safeText(item.text,70),"Clipboard")}catch{notify("Clipboard unavailable","Your browser blocked clipboard access.","Clipboard")}}));
    $("gold1pClipboardClear")?.addEventListener("click",()=>{writeJSON(CLIPBOARD_KEY,[]);openClipboardHistory()});return win;
  }

  /* ------------------------- Clock and Calendar ------------------------- */
  function calendarHTML(date=new Date()){
    const y=date.getFullYear(),m=date.getMonth(),first=new Date(y,m,1),last=new Date(y,m+1,0),start=first.getDay(),today=new Date();
    const labels=["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=>`<span class="gold1p-muted">${d}</span>`);
    const days=[];for(let i=0;i<start;i++){const d=new Date(y,m,1-start+i);days.push(`<span class="muted">${d.getDate()}</span>`)}
    for(let d=1;d<=last.getDate();d++){const isToday=y===today.getFullYear()&&m===today.getMonth()&&d===today.getDate();days.push(`<span class="${isToday?"today":""}">${d}</span>`)}
    while(days.length<42){days.push(`<span class="muted">${days.length-start-last.getDate()+1}</span>`)}
    return `<div class="gold1p-calendar-head"><b>${date.toLocaleString(undefined,{month:"long",year:"numeric"})}</b><span>Today</span></div><div class="gold1p-calendar-grid">${labels.join("")}${days.join("")}</div>`;
  }
  function toggleClockFlyout(){
    const existing=$("gold1pClockFlyout");if(existing){existing.remove();return}
    const date=new Date(),fly=document.createElement("section");fly.id="gold1pClockFlyout";fly.className="gold1p-clock-flyout";
    fly.innerHTML=`<div class="gold1p-clock-time">${date.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div><div class="gold1p-clock-date">${date.toLocaleDateString([],{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</div>${calendarHTML(date)}`;
    document.body.appendChild(fly);
  }

  /* ------------------------- E.L.S.U.S. Update Center ------------------------- */
  function versionRank(value){
    const v=String(value||"").trim().toUpperCase();
    const m=v.match(/^(\d+)(?:\.(\d+))?([A-Z])?$/);
    if(!m)return 0;
    return Number(m[1])*1000000+Number(m[2]||0)*1000+(m[3]?m[3].charCodeAt(0)-64:0);
  }
  async function fetchLatestManifest(){
    const fallback=readJSON("emeraldGoldShell_latest",releaseManifest());
    try{
      const fbm=await import("./firebase.js");
      const snap=await fbm.getDoc(fbm.doc(fbm.db,"system","emeraldGoldLatest"));
      const latest=snap.exists()?Object.assign({},fallback,snap.data()):fallback;
      writeJSON("emeraldGoldShell_latest",latest);return latest;
    }catch(error){console.warn("Gold 1U update check used local manifest",error);return fallback}
  }
  async function openUpdateCenter(latestManifest=null){
    const latest=latestManifest||await fetchLatestManifest();
    const latestVersion=latest.latestVersion||latest.build||"Unknown";
    const newer=versionRank(latestVersion)>versionRank(VERSION);
    const html=`<div class="gold1p-app" style="padding:20px;overflow:auto"><div style="display:flex;align-items:start;justify-content:space-between;gap:12px"><div><h1>System Update</h1><p class="gold1p-muted">E.L.S.U.S. changes this VM only after you choose to update.</p></div><button id="gold1pCheckUpdates" class="gold1p-button primary">Check for updates</button></div><div class="gold1p-performance-grid"><div class="gold1p-performance-card"><h3>This VM</h3><p><b>EmeraldOS Gold 1U</b></p><p>Gold_1U / OS.html</p></div><div class="gold1p-performance-card"><h3>Latest configured release</h3><p><b>${esc(latest.releaseTitle||`EmeraldOS Gold ${latestVersion}`)}</b></p><p>${esc(latest.folder||"")} / ${esc(latest.entry||"OS.html")}</p></div><div class="gold1p-performance-card"><h3>Status</h3><p>${newer?"A newer release is available.":"This VM is on the latest configured release."}</p></div><div class="gold1p-performance-card"><h3>VM continuity</h3><p>Files, apps, settings, registry, and workspace data remain in the version-independent Gold VM.</p></div></div><h3>Release information</h3><p>${esc(latest.summary||"No release information is available.")}</p><div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:18px"><button id="gold1pSaveBeforeUpdate" class="gold1p-button">Save cloud VM</button><button id="gold1pApplyUpdate" class="gold1p-button primary" ${newer?"":"disabled"}>Update this VM now</button><button class="gold1p-button" onclick="Gold1U.openPublisherManager()">Update Publisher Manager</button></div></div>`;
    const win=open1IWindow("updateshell","System Update",html,{width:980,height:680,icon:"↻",refresh:true});
    $("gold1pCheckUpdates")?.addEventListener("click",async()=>openUpdateCenter(await fetchLatestManifest()));
    $("gold1pSaveBeforeUpdate")?.addEventListener("click",()=>saveWorkspaceNow1I(true));
    $("gold1pApplyUpdate")?.addEventListener("click",()=>applyConfiguredUpdate(latest));return win;
  }
  async function applyConfiguredUpdate(manifest){
    const latestVersion=manifest?.latestVersion||manifest?.build||"";
    if(versionRank(latestVersion)<=versionRank(VERSION))return notify("No newer update","EmeraldOS Gold 1U is already current.","System Update");
    await saveWorkspaceNow1I(false);
    writeJSON("emeraldGoldShell_pendingManifest",manifest);
    localStorage.setItem("emeraldGoldShell_forceCheck","true");
    localStorage.setItem("emeraldGoldShell_returnedFromVersion",FOLDER);
    location.href="../gold-shell.html?force=1";
  }

  /* ------------------------- Publisher ------------------------- */
  function releaseManifest(){return {product:"EmeraldOS Gold",latestVersion:VERSION,build:VERSION,folder:FOLDER,entry:"OS.html",channel:"stable",status:"stable",required:false,enabled:true,setupMode:"manualUpdateSetup",releaseTitle:"EmeraldOS Gold 1U",activeUpdateNotifications:true,elsusMode:"original",shellV2Compatible:true,summary:"EmeraldOS Gold 1U separates each user's cloud and local VM data, adds explicit per-file sharing, and introduces application Can-Notify permissions while preserving Gold 1U features and UI.",migrationFrom:["1U","1R","1Q","1P","1O","1N","1M","1L","1K","1J","1I","1H","1G","1F","1E","1D","1C","1B","1A"],migrationId:"gold-1u-to-1u-private-vm-sharing-notifications",minShellVersion:"1.0",rollbackFolder:"Gold_1U",rollbackVersion:"1U",releasedAt:"2026-07-14T00:00:00.000Z"}}
  function publisherUnlocked(){return isStaff()&&localStorage.getItem(PREFIX+"publisher_unlocked")==="true"}
  function openPublisherManager(){
    if(!isStaff()){
      notify("Staff verification required","Sign into Gold Staff Edition before opening Update Publisher Manager.","E.L.S.U.S.");
      return openSimplePanel("Staff verification required",`<h2>Update Publisher Manager</h2><p>Publishing is available only from a verified Gold Staff Edition session.</p><button class="gold1p-button primary" onclick="location.href='staff.html'">Open Gold Staff Edition</button>`);
    }
    const unlocked=publisherUnlocked();
    const html=`<div class="gold1p-app" style="padding:20px;overflow:auto"><h1>Update Publisher Manager</h1><p>Publish <b>EmeraldOS Gold 1U</b> to <code>system/emeraldGoldLatest</code>.</p><div class="gold1p-performance-card"><b>Security status</b><p>${unlocked?"Publisher PIN accepted for this staff session.":"Locked. Enter the publisher PIN."}</p>${unlocked?"":'<label>Publisher PIN <input id="gold1pPublisherPin" type="password" class="gold1p-field"></label> <button id="gold1pUnlockPublisher" class="gold1p-button">Unlock</button>'}</div><div class="gold1p-performance-card"><b>Release target</b><p>Gold_1U / OS.html</p><p>Release title: EmeraldOS Gold 1U</p></div><div style="display:flex;gap:8px;margin-top:18px"><button id="gold1pPublishVersion" class="gold1p-button primary" ${unlocked?"":"disabled"}>Publish this Version</button><button id="gold1pExportManifest" class="gold1p-button">Export manifest</button></div><p class="gold1p-muted">Gold 1U never publishes from a query string or during first boot.</p></div>`;
    const win=open1IWindow("publisher","Update Publisher Manager",html,{width:720,height:540,icon:"UP",refresh:true});
    $("gold1pUnlockPublisher")?.addEventListener("click",()=>unlockPublisher($("gold1pPublisherPin")?.value||""));
    $("gold1pPublishVersion")?.addEventListener("click",()=>{publisherClickAuthorizedUntil=Date.now()+3000;publishLatest()});
    $("gold1pExportManifest")?.addEventListener("click",()=>saveText("FIREBASE_EMERALDGOLDLATEST_1U.json",JSON.stringify(releaseManifest(),null,2),"application/json"));return win;
  }
  function unlockPublisher(pin){
    if(!isStaff())return false;
    if(String(pin)!==PUBLISHER_PIN){notify("Incorrect PIN","The Update Publisher Manager PIN was not accepted.","E.L.S.U.S.");return false}
    localStorage.setItem(PREFIX+"publisher_unlocked","true");notify("Publisher unlocked","Update Publisher Manager is available for this staff session.","E.L.S.U.S.");openPublisherManager();return true;
  }
  async function publishLatest(){
    if(!publisherUnlocked()){openPublisherManager();return false}
    if(Date.now()>publisherClickAuthorizedUntil){
      notify("Publish button required","Open Update Publisher Manager and click Publish this Version. Gold 1U cannot publish from startup, a URL, or a console call.","System Update");
      return false;
    }
    publisherClickAuthorizedUntil=0;
    try{const fbm=await import("./firebase.js");await fbm.setDoc(fbm.doc(fbm.db,"system","emeraldGoldLatest"),releaseManifest(),{merge:true});writeJSON("emeraldGoldShell_latest",releaseManifest());localStorage.setItem(PREFIX+"latest_manifest_published_1u","true");notify("E.L.S.U.S. updated","system/emeraldGoldLatest now points to Gold_1U.","System Update");return true}catch(error){console.warn(error);notify("Publish failed",error.message,"System Update");return false}
  }

  /* ------------------------- Split Cloud VM ------------------------- */
  function localCategoryValue(category){
    if(category==="registry_1u")return registryData();
    if(category==="registry_1u_history")return readJSON(REGISTRY_HISTORY_KEY,[]);
    if(category==="clipboard_history_1u")return clipboardHistory();
    if(category==="startup_apps_1u")return readJSON(STARTUP_KEY,[]);
    const objectCategories=new Set(["prefs","folders","mail","app_verification_cache","elsus_original_state","elsus_shell_state","accessibility_1u","home_1u_at_login","update_preferences_1u","focus_sessions_1u","notification_preferences_1u","session_state_1u","file_system_metadata","notification_app_permissions_1u"]);
    return readJSON(PREFIX+category,objectCategories.has(category)?{}:[]);
  }
  async function cloudWriteCategory(fbm,category,value){
    const json=JSON.stringify(value??null),base={category,updatedAt:now(),version:VERSION};
    const versionId=`${VERSION}__${category}`;
    if(byteLength(json)<650000){
      const payload={...base,format:"json",json};
      await fbm.setDoc(fbm.doc(fbm.db,"emeraldOSUsers",vmUserId(),"goldVMData",category),payload,{merge:true});
      await fbm.setDoc(fbm.doc(fbm.db,"emeraldOSUsers",vmUserId(),"goldVMVersionData",versionId),payload,{merge:true});
      return {category,format:"json",bytes:byteLength(json)};
    }
    const chunkSize=450000,chunks=[];for(let i=0;i<json.length;i+=chunkSize)chunks.push(json.slice(i,i+chunkSize));
    const payload={...base,format:"chunks",count:chunks.length,bytes:byteLength(json)};
    await fbm.setDoc(fbm.doc(fbm.db,"emeraldOSUsers",vmUserId(),"goldVMData",category),payload,{merge:true});
    await fbm.setDoc(fbm.doc(fbm.db,"emeraldOSUsers",vmUserId(),"goldVMVersionData",versionId),payload,{merge:true});
    await Promise.all(chunks.flatMap((chunk,i)=>[
      fbm.setDoc(fbm.doc(fbm.db,"emeraldOSUsers",vmUserId(),"goldVMChunks",`${category}__${String(i).padStart(4,"0")}`),{category,index:i,data:chunk,updatedAt:now()},{merge:true}),
      fbm.setDoc(fbm.doc(fbm.db,"emeraldOSUsers",vmUserId(),"goldVMVersionChunks",`${versionId}__${String(i).padStart(4,"0")}`),{version:VERSION,category,index:i,data:chunk,updatedAt:now()},{merge:true})
    ]));
    return {category,format:"chunks",count:chunks.length,bytes:byteLength(json)};
  }
  async function cloudReadCategory(fbm,category){
    const snap=await fbm.getDoc(fbm.doc(fbm.db,"emeraldOSUsers",vmUserId(),"goldVMData",category));if(!snap.exists())return undefined;
    const meta=snap.data();if(meta.ownerId&&String(meta.ownerId)!==String(vmUserId()))throw new Error("Cloud category owner mismatch");if(meta.format==="json")return JSON.parse(meta.json||"null");
    if(meta.format==="chunks"){
      const parts=[];for(let i=0;i<Number(meta.count||0);i++){const cs=await fbm.getDoc(fbm.doc(fbm.db,"emeraldOSUsers",vmUserId(),"goldVMChunks",`${category}__${String(i).padStart(4,"0")}`));if(!cs.exists())throw new Error(`Missing cloud chunk ${category} ${i}`);parts.push(cs.data().data||"")}
      return JSON.parse(parts.join(""));
    }
    return meta.value;
  }
  function currentWindowState(){return qa(".window").map(w=>({id:w.id,title:w.dataset.title||"",left:w.style.left,top:w.style.top,width:w.style.width,height:w.style.height,minimized:w.classList.contains("minimized"),maximized:w.classList.contains("max")||w.classList.contains("gold1p-maximized")})).slice(0,80)}
  async function saveWorkspaceNow1I(show=true){
    const summary={product:"EmeraldOS Gold",version:VERSION,build:VERSION,activeVersion:VERSION,activeFolder:FOLDER,schema:"gold1u-split-v2",user:userName(),ownerId:vmUserId(),ownerUsername:userName(),visibility:"private",aclVersion:"emerald-gold-owner-v1",savedAt:now(),categories:CLOUD_CATEGORIES,openWindows:currentWindowState(),cloudPath:"emeraldOSUsers/{authenticatedUserId}/goldVM/current"};
    if(window.__GOLD1U_MIGRATION_BLOCK_SAVES__===true && window.__GOLD1U_MIGRATION_COMMITTING__!==true){
      writeJSON(PREFIX+"workspace_meta_1u",{...summary,saveDeferred:true,deferredReason:"migration-in-progress"});
      if(show)notify("Save deferred","Gold 1U is still merging data from previous versions. Cloud save will run automatically after migration completes.","Migration & Continuity");
      return summary;
    }
    writeJSON(PREFIX+"workspace_meta_1u",summary);
    try{
      const fbm=await import("./firebase.js");
      const results=[];for(const category of CLOUD_CATEGORIES)results.push(await cloudWriteCategory(fbm,category,localCategoryValue(category)));
      await fbm.setDoc(fbm.doc(fbm.db,"emeraldOSUsers",vmUserId(),"goldVM","current"),{...summary,categoryIndex:results,migrationValidated:true,migrationReportKey:"migration_1u_cloud_report"},{merge:true});
      await window.Gold1UUserIsolation?.snapshotActiveSession?.();
      await fbm.setDoc(fbm.doc(fbm.db,"emeraldOSUsers",vmUserId(),"goldVMVersions",VERSION),{...summary,categoryIndex:results,migrationValidated:true},{merge:true});
      localStorage.setItem(PREFIX+"cloud_status","saved");localStorage.setItem(PREFIX+"cloud_last_save",now());
      if(show)notify("Cloud VM saved","Gold 1U saved the complete split, quota-safe VM state to the cloud.","Gold VM");return summary;
    }catch(error){
      console.warn("Gold 1U split cloud save failed",error);localStorage.setItem(PREFIX+"cloud_status","save failed: "+error.message);if(show)notify("Saved locally","Cloud sync will retry when Firebase is available.","Gold VM");return summary;
    }
  }
  function canonicalCloudCategory(category){
    return ({
      registry_1r:"registry_1u",registry_1u:"registry_1u",registry_1r_history:"registry_1u_history",registry_1u_history:"registry_1u_history",
      clipboard_history_1r:"clipboard_history_1u",clipboard_history_1u:"clipboard_history_1u",startup_apps_1r:"startup_apps_1u",startup_apps_1u:"startup_apps_1u",
      update_preferences_1r:"update_preferences_1u",update_preferences_1u:"update_preferences_1u",update_history_1r:"update_history_1u",update_history_1u:"update_history_1u",
      focus_sessions_1r:"focus_sessions_1u",focus_sessions_1u:"focus_sessions_1u",feedback_1r:"feedback_1u",feedback_1u:"feedback_1u",routines_1r:"routines_1u",routines_1u:"routines_1u",
      accessibility_1r:"accessibility_1u",accessibility_1u:"accessibility_1u",home_1r_at_login:"home_1u_at_login",home_1u_at_login:"home_1u_at_login",
      notification_preferences_1r:"notification_preferences_1u",notification_preferences_1u:"notification_preferences_1u",session_state_1r:"session_state_1u",session_state_1u:"session_state_1u",
      account_history_1r:"account_history_1u",account_history_1u:"account_history_1u",game_data_1r:"game_data_1u",game_data_1u:"game_data_1u",calendar_preferences_1r:"calendar_preferences_1u",calendar_preferences_1u:"calendar_preferences_1u",
      guide_preferences_1r:"guide_preferences_1u",guide_preferences_1u:"guide_preferences_1u",radio_stations_1r:"radio_stations_1u",radio_stations_1u:"radio_stations_1u",radio_preferences_1r:"radio_preferences_1u",radio_preferences_1u:"radio_preferences_1u",file_operations_1r:"file_operations_1u",file_operations_1u:"file_operations_1u",
      registry_1h:"registry_1u",registry_1i:"registry_1u",registry_1j:"registry_1u",registry_1k:"registry_1u",registry_1l:"registry_1u",registry_1m:"registry_1u",registry_1n:"registry_1u",registry_1o:"registry_1u",registry_1q:"registry_1u",registry_1u:"registry_1u",
      registry_1h_history:"registry_1u_history",registry_1i_history:"registry_1u_history",registry_1j_history:"registry_1u_history",registry_1k_history:"registry_1u_history",registry_1l_history:"registry_1u_history",registry_1m_history:"registry_1u_history",registry_1n_history:"registry_1u_history",registry_1o_history:"registry_1u_history",registry_1q_history:"registry_1u_history",registry_1u_history:"registry_1u_history",
      clipboard_history_1h:"clipboard_history_1u",clipboard_history_1i:"clipboard_history_1u",clipboard_history_1j:"clipboard_history_1u",clipboard_history_1k:"clipboard_history_1u",clipboard_history_1l:"clipboard_history_1u",clipboard_history_1m:"clipboard_history_1u",clipboard_history_1n:"clipboard_history_1u",clipboard_history_1o:"clipboard_history_1u",clipboard_history_1q:"clipboard_history_1u",clipboard_history_1u:"clipboard_history_1u",
      startup_apps_1h:"startup_apps_1u",startup_apps_1i:"startup_apps_1u",startup_apps_1j:"startup_apps_1u",startup_apps_1k:"startup_apps_1u",startup_apps_1l:"startup_apps_1u",startup_apps_1m:"startup_apps_1u",startup_apps_1n:"startup_apps_1u",startup_apps_1o:"startup_apps_1u",startup_apps_1q:"startup_apps_1u",startup_apps_1u:"startup_apps_1u",
      update_preferences_1k:"update_preferences_1u",update_preferences_1l:"update_preferences_1u",update_preferences_1m:"update_preferences_1u",update_preferences_1n:"update_preferences_1u",update_preferences_1o:"update_preferences_1u",update_preferences_1q:"update_preferences_1u",update_preferences_1u:"update_preferences_1u",
      update_history_1k:"update_history_1u",update_history_1l:"update_history_1u",update_history_1m:"update_history_1u",update_history_1n:"update_history_1u",update_history_1o:"update_history_1u",update_history_1q:"update_history_1u",update_history_1u:"update_history_1u",
      focus_sessions_1k:"focus_sessions_1u",focus_sessions_1l:"focus_sessions_1u",focus_sessions_1m:"focus_sessions_1u",focus_sessions_1n:"focus_sessions_1u",focus_sessions_1o:"focus_sessions_1u",focus_sessions_1q:"focus_sessions_1u",focus_sessions_1u:"focus_sessions_1u",
      feedback_1n:"feedback_1u",feedback_1o:"feedback_1u",feedback_1q:"feedback_1u",feedback_1u:"feedback_1u",
      routines_1n:"routines_1u",routines_1o:"routines_1u",routines_1q:"routines_1u",routines_1u:"routines_1u",
      accessibility_1n:"accessibility_1u",accessibility_1o:"accessibility_1u",accessibility_1q:"accessibility_1u",accessibility_1u:"accessibility_1u",
      welcome_1n_at_login:"home_1u_at_login",home_1o_at_login:"home_1u_at_login",home_1q_at_login:"home_1u_at_login",home_1u_at_login:"home_1u_at_login",
      notification_preferences_1o:"notification_preferences_1u",notification_preferences_1q:"notification_preferences_1u",notification_preferences_1u:"notification_preferences_1u",
      session_state_1o:"session_state_1u",session_state_1q:"session_state_1u",session_state_1u:"session_state_1u",account_history_1q:"account_history_1u",account_history_1u:"account_history_1u",game_data_1q:"game_data_1u",game_data_1u:"game_data_1u",calendar_preferences_1q:"calendar_preferences_1u",calendar_preferences_1u:"calendar_preferences_1u"
    })[category]||category;
  }
  function normalizeMigratedFile(raw,folder="Documents"){return window.GoldUniversalFS?.normalizeFile?.(raw,folder,{sourceVersion:"legacy"})||raw}

  function collectMigratedFiles(value,folder="Documents",out=[]){
    if(value==null)return out;
    if(Array.isArray(value)){value.forEach(x=>{if(x&&typeof x==="object"&&(x.name||x.filename||x.content!==undefined||x.data!==undefined)){const f=normalizeMigratedFile(x,folder);if(f)out.push(f)}else collectMigratedFiles(x,folder,out)});return out}
    if(typeof value!=="object")return out;
    if(value.name||value.filename||value.content!==undefined||value.data!==undefined){const f=normalizeMigratedFile(value,folder);if(f)out.push(f);return out}
    ["files","fileSystem","drive","workspace","cloudDrive"].forEach(key=>{if(value[key]!==undefined)collectMigratedFiles(value[key],folder,out)});
    if(value.folders&&typeof value.folders==="object")Object.entries(value.folders).forEach(([name,items])=>collectMigratedFiles(items,name,out));
    return out;
  }
  function mergeMigratedFiles(...groups){return window.GoldUniversalFS?.mergeFiles?.(...groups)||groups.flat(Infinity).filter(Boolean)}

  async function readLegacyCloudFiles(fbm){
    const groups=[];
    const paths=[
      ["emeraldOSUsers",vmUserId()],
      ["emeraldOSUsers",vmUserId(),"drive","root"],
      ["emeraldOSUsers",vmUserId(),"drive","files"],
      ["emeraldOSUsers",vmUserId(),"cloudDrive","current"]
    ];
    for(const path of paths){try{const snap=await fbm.getDoc(fbm.doc(fbm.db,...path));if(snap.exists())groups.push(collectMigratedFiles(snap.data()))}catch(error){console.debug("Gold 1U legacy cloud source skipped",path.join("/"),error?.message)}}
    return groups.flat();
  }
  async function restoreWorkspace1I(show=true){
    try{
      const fbm=await import("./firebase.js");
      if(!fbm.db)throw new Error("Firebase is not configured");
      const snap=await fbm.getDoc(fbm.doc(fbm.db,"emeraldOSUsers",vmUserId(),"goldVM","current"));
      const localFiles=readJSON(PREFIX+"files",[]),fileGroups=[Array.isArray(localFiles)?localFiles:[]];
      let summary=snap.exists()?snap.data():null;if(summary?.ownerId&&String(summary.ownerId)!==String(vmUserId()))throw new Error("Cloud VM owner mismatch");
      const localFileMetadata=readJSON(PREFIX+"file_system_metadata",{}),localFilesAuthoritative=localFileMetadata.authoritativeLocalSnapshot===true&&(!(Date.parse(summary?.savedAt||0)||0)||(Date.parse(localFileMetadata.authoritativeDataSavedAt||0)||0)>=(Date.parse(summary?.savedAt||0)||0));
      const restoredCategories={};
      if(summary){
        const splitSchemas=new Set(["gold1h-split-v1","gold1h-split-v2","gold1i-split-v1","gold1i-split-v2","gold1j-split-v1","gold1j-split-v2","gold1k-split-v1","gold1k-split-v2","gold1l-split-v1","gold1l-split-v2","gold1m-split-v1","gold1m-split-v2","gold1n-split-v1","gold1n-split-v2","gold1o-split-v1","gold1o-split-v2","gold1p-split-v1","gold1p-split-v2","gold1q-split-v1","gold1q-split-v2","gold1r-split-v1","gold1r-split-v2","gold1u-split-v1","gold1u-split-v2","gold1u-split-v1","gold1u-split-v2"]);
        if(splitSchemas.has(summary.schema)){
          for(const sourceCategory of summary.categories||CLOUD_CATEGORIES){
            const value=await cloudReadCategory(fbm,sourceCategory);if(value===undefined)continue;
            const category=canonicalCloudCategory(sourceCategory);restoredCategories[category]=value;
            if(category==="file_tombstones")window.GoldUniversalFS?.mergeAndSaveTombstones?.(value);
            else if(category==="file_recovery_catalog")window.GoldUniversalFS?.saveRecovery?.(window.GoldUniversalFS?.mergeRecovery?.(window.GoldUniversalFS?.recoveryCatalog?.()||[],value)||value);
            else if(category==="files"){const incoming=collectMigratedFiles(value);if(localFilesAuthoritative)window.GoldUniversalFS?.saveRecovery?.(window.GoldUniversalFS?.mergeRecovery?.(window.GoldUniversalFS?.recoveryCatalog?.()||[],incoming)||incoming);else fileGroups.push(incoming)}
            else{
              const key=category==="registry_1u"?REGISTRY_KEY:category==="clipboard_history_1u"?CLIPBOARD_KEY:category==="startup_apps_1u"?STARTUP_KEY:PREFIX+category;
              writeJSON(key,value);
            }
          }
        }else{
          fileGroups.push(collectMigratedFiles(summary));
          const legacyMap={"prefs":"prefs","files":"files","folders":"folders","mail":"mail","notes":"notes","tasks":"tasks","events":"events","contacts":"contacts","tickets":"tickets","notifications":"notifications","user_apps":"user_apps","remote_sessions":"remote_sessions","emergency_logs":"emergency_logs","vm_snapshots":"vm_snapshots","custom_app_logos":"custom_app_logos","app_verification_cache":"app_verification_cache","elsus_original_state":"elsus_original_state","elsus_shell_state":"elsus_shell_state","sticky_notes":"sticky_notes","voice_recordings":"voice_recordings","registry_1h":"registry_1u","registry_1h_history":"registry_1u_history","clipboard_history_1h":"clipboard_history_1u","startup_apps_1h":"startup_apps_1u","registry_1i":"registry_1u","registry_1i_history":"registry_1u_history","clipboard_history_1i":"clipboard_history_1u","startup_apps_1i":"startup_apps_1u","registry_1j":"registry_1u","registry_1j_history":"registry_1u_history","clipboard_history_1j":"clipboard_history_1u","startup_apps_1j":"startup_apps_1u","registry_1k":"registry_1u","registry_1k_history":"registry_1u_history","clipboard_history_1k":"clipboard_history_1u","startup_apps_1k":"startup_apps_1u","registry_1l":"registry_1u","registry_1l_history":"registry_1u_history","clipboard_history_1l":"clipboard_history_1u","startup_apps_1l":"startup_apps_1u","registry_1m":"registry_1u","registry_1m_history":"registry_1u_history","clipboard_history_1m":"clipboard_history_1u","startup_apps_1m":"startup_apps_1u","registry_1n":"registry_1u","registry_1n_history":"registry_1u_history","clipboard_history_1n":"clipboard_history_1u","startup_apps_1n":"startup_apps_1u","registry_1o":"registry_1u","registry_1o_history":"registry_1u_history","clipboard_history_1o":"clipboard_history_1u","startup_apps_1o":"startup_apps_1u","registry_1q":"registry_1u","registry_1u":"registry_1u","registry_1q_history":"registry_1u_history","registry_1u_history":"registry_1u_history","clipboard_history_1q":"clipboard_history_1u","clipboard_history_1u":"clipboard_history_1u","startup_apps_1q":"startup_apps_1u","startup_apps_1u":"startup_apps_1u","update_preferences_1k":"update_preferences_1u","update_history_1k":"update_history_1u","focus_sessions_1k":"focus_sessions_1u","update_preferences_1l":"update_preferences_1u","update_history_1l":"update_history_1u","focus_sessions_1l":"focus_sessions_1u","update_preferences_1m":"update_preferences_1u","update_history_1m":"update_history_1u","focus_sessions_1m":"focus_sessions_1u","update_preferences_1n":"update_preferences_1u","update_history_1n":"update_history_1u","focus_sessions_1n":"focus_sessions_1u","update_preferences_1o":"update_preferences_1u","update_history_1o":"update_history_1u","focus_sessions_1o":"focus_sessions_1u","update_preferences_1q":"update_preferences_1u","update_preferences_1u":"update_preferences_1u","update_history_1q":"update_history_1u","update_history_1u":"update_history_1u","focus_sessions_1q":"focus_sessions_1u","focus_sessions_1u":"focus_sessions_1u","feedback_1n":"feedback_1u","routines_1n":"routines_1u","accessibility_1n":"accessibility_1u","feedback_1o":"feedback_1u","routines_1o":"routines_1u","accessibility_1o":"accessibility_1u","feedback_1q":"feedback_1u","feedback_1u":"feedback_1u","routines_1q":"routines_1u","routines_1u":"routines_1u","accessibility_1q":"accessibility_1u","accessibility_1u":"accessibility_1u","welcome_1n_at_login":"home_1u_at_login","home_1o_at_login":"home_1u_at_login","home_1q_at_login":"home_1u_at_login","home_1u_at_login":"home_1u_at_login","notification_preferences_1o":"notification_preferences_1u","notification_preferences_1q":"notification_preferences_1u","notification_preferences_1u":"notification_preferences_1u","session_state_1o":"session_state_1u","session_state_1q":"session_state_1u","session_state_1u":"session_state_1u"};
          Object.entries(legacyMap).forEach(([source,category])=>{if(summary[source]===undefined)return;const key=category==="registry_1u"?REGISTRY_KEY:category==="clipboard_history_1u"?CLIPBOARD_KEY:category==="startup_apps_1u"?STARTUP_KEY:PREFIX+category;writeJSON(key,summary[source])});
        }
      }
      const legacyRecovery=await readLegacyCloudFiles(fbm);window.GoldUniversalFS?.saveRecovery?.(window.GoldUniversalFS?.mergeRecovery?.(window.GoldUniversalFS?.recoveryCatalog?.()||[],legacyRecovery)||legacyRecovery);
      const mergedFiles=mergeMigratedFiles(...fileGroups);
      if(mergedFiles.length)writeJSON(PREFIX+"files",mergedFiles);
      applyRegistryEffects();
      localStorage.setItem(PREFIX+"cloud_status",summary?"restored and migrated":"legacy sources checked");
      localStorage.setItem(PREFIX+"cloud_last_restore",now());
      writeJSON(PREFIX+"migration_1u_cloud_report",{completed:true,completedAt:now(),sourceSchema:summary?.schema||"none",filesBefore:Array.isArray(localFiles)?localFiles.length:0,filesAfter:mergedFiles.length,firestoreReleasePointerChanged:false});
      try{window.Gold50?.setPrefs?.(readJSON(PREFIX+"prefs",{}));window.Gold50?.saveFiles?.(mergedFiles)}catch{}
      if(show)notify("Cloud VM migration complete",`${mergedFiles.length} files are available in Gold 1U. The E.L.S.U.S. release pointer was not changed.`,"Gold VM");
      return summary||{schema:"legacy-migration",files:mergedFiles.length};
    }catch(error){console.warn("Gold 1U cloud restore failed",error);if(show)notify("Restore failed",error.message,"Gold VM");return null}
  }
  let saveDebounce=null;function saveWorkspaceDebounced1I(){clearTimeout(saveDebounce);saveDebounce=setTimeout(()=>saveWorkspaceNow1I(false),1200)}

  /* ------------------------- Shell enhancements ------------------------- */
  function customToolButtons(){return `
    <button class="gold1p-start-tile" onclick="Gold1U.openRegistryEditor()"><span>▥</span><b>Registry Editor</b></button>
    <button class="gold1p-start-tile" onclick="Gold1U.openTaskManager()"><span>▤</span><b>Task Manager</b></button>
    <button class="gold1p-start-tile" onclick="Gold1U.openControlPanel()"><span>⚙</span><b>Control Panel</b></button>
    <button class="gold1p-start-tile" onclick="Gold1U.openRun()"><span>▦</span><b>Run</b></button>
    <button class="gold1p-start-tile" onclick="Gold1U.openClipboardHistory()"><span>▧</span><b>Clipboard</b></button>
    <button class="gold1p-start-tile" onclick="Gold50.openApp('converter')"><span>⇄</span><b>Converter</b></button>
    <button class="gold1p-start-tile" onclick="Gold50.openApp('storage')"><span>◫</span><b>Storage</b></button>
    ${isStaff()?'<button class="gold1p-start-tile" onclick="Gold1U.openPublisherManager()"><span>UP</span><b>Publisher</b></button>':''}` }
  function enhanceStartMenu(){
    const menu=$("startMenu");if(!menu||startEnhancing)return;
    const tileColumn=menu.querySelector(".start-tiles");
    if(!tileColumn||tileColumn.querySelector(".gold1p-start-tools-inline"))return;
    startEnhancing=true;
    const section=document.createElement("section");
    section.className="gold1p-start-tools-inline";
    section.innerHTML=`<h3>System tools</h3><div class="gold1p-start-tool-grid">${customToolButtons()}</div>`;
    tileColumn.appendChild(section);
    startEnhancing=false;
  }
  function enhanceActionCenter(){
    const panel=$("actionCenter");if(!panel||actionEnhancing||panel.querySelector(".gold1p-quick-actions"))return;
    actionEnhancing=true;
    panel.insertAdjacentHTML("afterbegin",`<div class="gold1p-quick-actions"><button class="gold1p-quick-action" data-quick="focus"><span>☾</span>Focus assist</button><button class="gold1p-quick-action" data-quick="night"><span>◐</span>Night light</button><button class="gold1p-quick-action" data-quick="settings"><span>⚙</span>All settings</button><button class="gold1p-quick-action" data-quick="save"><span>☁</span>Cloud save</button><button class="gold1p-quick-action" data-quick="safe"><span>!</span>Safe mode</button><button class="gold1p-quick-action" data-quick="registry"><span>▥</span>Registry</button><button class="gold1p-quick-action" data-quick="task"><span>▤</span>Task Manager</button><button class="gold1p-quick-action" data-quick="control"><span>▦</span>Control Panel</button></div>`);
    panel.querySelectorAll("[data-quick]").forEach(b=>b.addEventListener("click",()=>quickAction(b.dataset.quick,b)));
    actionEnhancing=false;
  }
  function quickAction(action,button){
    if(action==="focus"){document.body.classList.toggle("gold1p-focus");button.classList.toggle("active");return}
    if(action==="night"){document.body.classList.toggle("gold1p-night");button.classList.toggle("active");document.body.style.filter=document.body.classList.contains("gold1p-night")?"sepia(.22) brightness(.92)":"";return}
    if(action==="settings")return runCommand("settings");if(action==="save")return saveWorkspaceNow1I(true);if(action==="registry")return openRegistryEditor();if(action==="task")return openTaskManager();if(action==="control")return openControlPanel();
    if(action==="safe"&&confirm("Restart EmeraldOS Gold 1U in Safe Mode?")){localStorage.setItem(PREFIX+"safemode","true");location.reload()}
  }
  function enhanceSearch(){
    const panel=$("searchPanel");if(!panel||panel.querySelector(".gold1p-search-tools"))return;
    const box=document.createElement("div");box.className="gold1p-search-tools";box.innerHTML=`<h3>System tools</h3><div class="gold1p-start-tool-grid">${customToolButtons()}</div>`;panel.appendChild(box);
  }
  function enhanceDesktop(){
    const desktop=$("desktop");if(!desktop)return;
    const tools=[{id:"regedit",name:"Registry Editor",icon:"▥",open:openRegistryEditor},{id:"control",name:"Control Panel",icon:"⚙",open:openControlPanel}];
    tools.forEach(tool=>{if(desktop.querySelector(`[data-gold1p-shortcut="${tool.id}"]`))return;const button=document.createElement("button");button.className="desktop-icon gold1p-system-shortcut";button.dataset.gold1pShortcut=tool.id;button.innerHTML=`<span class="app-icon">${tool.icon}</span><span>${esc(tool.name)}</span>`;button.addEventListener("dblclick",tool.open);button.addEventListener("click",()=>{qa(".desktop-icon").forEach(x=>x.classList.remove("selected"));button.classList.add("selected")});desktop.appendChild(button)});
  }
  function showPowerMenu(){
    open1IWindow("power","Power",`<div class="gold1p-app" style="padding:20px"><h2>Power</h2><div class="gold1p-control-grid"><button class="gold1p-control-item" onclick="location.reload()"><span class="icon">↻</span><span><b>Restart</b><small>Restart EmeraldOS Gold 1U.</small></span></button><button class="gold1p-control-item" onclick="Gold1U.saveWorkspaceNow(true)"><span class="icon">☁</span><span><b>Save cloud VM</b><small>Save before leaving.</small></span></button><button class="gold1p-control-item" onclick="Gold50.logoutGold?.()"><span class="icon">⇥</span><span><b>Sign out</b><small>Close this user session.</small></span></button></div></div>`,{width:540,height:400,icon:"⏻",refresh:true});
  }
  function showDesktop(){
    const windows=qa(".window");const anyVisible=windows.some(w=>!w.classList.contains("minimized"));windows.forEach(w=>w.classList.toggle("minimized",anyVisible));qa(".gold1p-task-button").forEach(b=>b.classList.toggle("active",!anyVisible));
  }
  function installClock(){
    const clock=$("clock");if(!clock)return;
    const tick=()=>{const d=new Date();clock.innerHTML=`${d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}<br>${d.toLocaleDateString([],{month:"numeric",day:"numeric",year:"numeric"})}`};tick();setInterval(tick,30000);
    clock.addEventListener("click",toggleClockFlyout);clock.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" ")toggleClockFlyout()});
    $("showDesktopBtn")?.addEventListener("click",showDesktop);
  }
  function patchBaseWindow(win){
    if(!win||win.dataset.g1hPatched)return;win.dataset.g1hPatched="true";
    const title=win.querySelector(".win-title");title?.addEventListener("dblclick",e=>{if(!e.target.closest("button")){try{window.Gold50?.maximizeWin?.(win.id)}catch{win.classList.toggle("max")}}});
    win.addEventListener("mousedown",()=>focusAnyWindow(win));
  }
  function showAltTab(){
    altTabWindows=qa(".window").filter(w=>w.isConnected);if(!altTabWindows.length)return;
    altTabIndex=(altTabIndex+1)%altTabWindows.length;
    let overlay=$("gold1pAltTab");if(!overlay){overlay=document.createElement("div");overlay.id="gold1pAltTab";overlay.className="gold1p-alt-tab";document.body.appendChild(overlay)}
    overlay.innerHTML=`<div class="gold1p-alt-tab-inner">${altTabWindows.map((w,i)=>`<div class="gold1p-alt-tab-item ${i===altTabIndex?"active":""}"><span>${esc(w.dataset.icon||"▦")}</span><b>${esc(w.dataset.title||"Application")}</b><small>${w.classList.contains("minimized")?"Minimized":"Running"}</small></div>`).join("")}</div>`;
  }
  function commitAltTab(){
    $("gold1pAltTab")?.remove();const win=altTabWindows[altTabIndex];if(win){win.classList.remove("minimized");focusAnyWindow(win)}
  }
  function installHotkeys(){
    document.addEventListener("keydown",e=>{
      const key=e.key.toLowerCase();
      if(e.altKey&&key==="tab"){e.preventDefault();showAltTab();return}
      if((e.metaKey||e.key==="Meta")&&key==="r"){e.preventDefault();openRunDialog();return}
      if(e.ctrlKey&&e.shiftKey&&key==="escape"){e.preventDefault();openTaskManager();return}
      if((e.metaKey||e.key==="Meta")&&key==="v"){e.preventDefault();openClipboardHistory();return}
      if(e.key==="F3"){e.preventDefault();$("searchBtn")?.click();return}
      if(e.metaKey&&["arrowleft","arrowright","arrowup","arrowdown"].includes(key)){
        e.preventDefault();const win=currentWindow();if(!win)return;
        const zone=key==="arrowleft"?"left":key==="arrowright"?"right":key==="arrowup"?"top":"bottom";snapWindow(win,zone);
      }
    });
    document.addEventListener("keyup",e=>{if(e.key==="Alt")commitAltTab()});
    document.addEventListener("copy",()=>{setTimeout(()=>{const text=String(document.getSelection()?.toString()||"");if(text)saveClipboardText(text)},0)});
  }

  /* ------------------------- Update setup ------------------------- */
  function updateSetupKey(){return `emeraldos_gold_1u_update_setup_done_${normalizeUser(userName())}`}
  function elsusFirstSetupKey(){return `emeraldos_gold_elsus_first_setup_done_${normalizeUser(userName())}`}
  function elsusLastVersionKey(){return `emeraldos_gold_elsus_last_version_${normalizeUser(userName())}`}
  async function finishUpdateSetup(){
    localStorage.setItem(updateSetupKey(),"true");
    localStorage.setItem(elsusLastVersionKey(),VERSION);
    localStorage.setItem("emeraldos_gold_elsus_last_version",VERSION);
    $("gold1pUpdateSetup")?.remove();
    try{const fbm=await import("./firebase.js");await fbm.setDoc(fbm.doc(fbm.db,"emeraldOSUsers",vmUserId(),"goldVM","setup"),{firstBootCompleted:true,firstBootScope:"global-elsus-user",lastCompletedVersion:VERSION,lastUpdateSetupVersion:VERSION,lastSetupType:"update",licenseAccepted:true,licenseVersion:"Gold_1U",folder:FOLDER,updatedAt:now()},{merge:true})}catch(error){console.warn("Gold 1U update setup cloud save failed",error)}
    notify("EmeraldOS Gold 1U is ready","Your existing cloud VM data and preferences were preserved.","Setup");
  }
  function maybeShowUpdateSetup(){
    if(localStorage.getItem(updateSetupKey())==="true")return;
    const globalSetup=localStorage.getItem(elsusFirstSetupKey())==="true"||localStorage.getItem("emeraldos_gold_elsus_first_setup_done")==="true";
    if(!globalSetup)return;
    const baseSetup=$("setupWizard");if(baseSetup&&!baseSetup.classList.contains("hidden"))return;
    const overlay=document.createElement("section");overlay.id="gold1pUpdateSetup";overlay.className="gold1p-update-setup";overlay.innerHTML=`<div class="gold1p-update-card"><h1>Welcome to EmeraldOS Gold 1U</h1><p>Your existing E.L.S.U.S. cloud VM is being preserved while Gold 1U restores your previous workspace quietly and improves everyday usability.</p><ul><li>Complete searchable guide pinned to desktop and taskbar</li><li>Emerald Games restored with cloud-saved progress</li><li>Gold Radio for compatible internet station streams</li><li>Universal file system and deletion protection retained</li><li>Quiet startup with one consolidated status banner</li><li>Cloud workspace resume and safer session continuity</li><li>Backup &amp; Sync with safe merge restore</li><li>File Compatibility Center for previous Gold file versions</li><li>System Health and Accessibility Center</li><li>Original E.L.S.U.S. and Shell V2 compatibility</li><li>Staff Center, verified user apps, custom logos, and less intrusive update prompts</li><li>Settings, toolbar, table, card, and narrow-window collision fixes</li></ul><p>Files, folders, settings, preferences, Registry data, applications, mail, and all available VM categories are merged and validated before cloud autosave can begin.</p><div class="actions"><button class="gold1p-button" onclick="document.getElementById('gold1pUpdateSetup').remove()">Remind me later</button><button class="gold1p-button" onclick="Gold1U.openGuide?.()">Open Complete Guide</button><button class="gold1p-button primary" onclick="Gold1U.finishUpdateSetup().then?.(()=>Gold1U.openGuide?.())||setTimeout(()=>Gold1U.openGuide?.(),300)">Continue and open guide</button><button class="gold1p-button primary" onclick="Gold1U.finishUpdateSetup()">Continue</button></div></div>`;document.body.appendChild(overlay);
  }

  function saveText(filename,text,type="text/plain"){
    try{if(window.Gold50?.saveText)return window.Gold50.saveText(filename,text,type)}catch{}
    const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  function patchGoldAPI(){
    const api=window.Gold50;if(!api)return false;
    if(!api.__gold1pOriginalOpenApp)api.__gold1pOriginalOpenApp=api.openApp?.bind(api);
    api.openApp=function gold1IOpenApp(id){
      const custom={regedit:openRegistryEditor,registry:openRegistryEditor,taskmanager:openTaskManager,control:openControlPanel,controlpanel:openControlPanel,run:openRunDialog,clipboard:openClipboardHistory,updateshell:openUpdateCenter,update:openUpdateCenter,updatepublisher:openPublisherManager,filesystemcenter:()=>window.GoldUniversalFS?.openCenter?.()};
      if(custom[id])return custom[id]();return api.__gold1pOriginalOpenApp?.(id);
    };
    api.saveWorkspaceNow=saveWorkspaceNow1I;api.restoreWorkspace=restoreWorkspace1I;
    Object.assign(api,{openRegistryEditor1I:openRegistryEditor,openTaskManager1I:openTaskManager,openControlPanel1I:openControlPanel,openRun1I:openRunDialog,openClipboardHistory1I:openClipboardHistory,openUpdatePublisherManager1I:openPublisherManager,openRegistryEditor1N:openRegistryEditor,openTaskManager1N:openTaskManager,openControlPanel1N:openControlPanel,openRun1N:openRunDialog,openClipboardHistory1N:openClipboardHistory,openUpdatePublisherManager1N:openPublisherManager,openRegistryEditor1U:openRegistryEditor,openTaskManager1U:openTaskManager,openControlPanel1U:openControlPanel,openRun1U:openRunDialog,openClipboardHistory1U:openClipboardHistory,openUpdatePublisherManager1U:openPublisherManager,gold1pPublishLatest:publishLatest,gold1pManifest:releaseManifest});
    window.Gold1G=api;window.Gold1U=publicAPI;return true;
  }

  function refreshEnhancements(){enhanceStartMenu();enhanceActionCenter();enhanceSearch();enhanceDesktop();qa(".window").forEach(patchBaseWindow)}
  function installObserver(){
    const observer=new MutationObserver(()=>{clearTimeout(window.__gold1pRefreshTimer);window.__gold1pRefreshTimer=setTimeout(refreshEnhancements,40)});observer.observe(document.body,{childList:true,subtree:true});
  }
  function branding(){
    document.title="EmeraldOS Gold 1U";document.body.classList.add("gold1p","gold1p-shell");document.body.dataset.build=VERSION;
    qa("h1,h2,p,span").forEach(el=>{if(el.children.length===0&&el.textContent?.includes("EmeraldOS Gold 1G"))el.textContent=el.textContent.replaceAll("EmeraldOS Gold 1G","EmeraldOS Gold 1U")});
  }

  const publicAPI={
    version:VERSION,folder:FOLDER,openWindow:open1IWindow,closeWin:closeWindow,minimizeWin:minimizeWindow,maximizeWin:maximizeWindow,snapWindow,
    openRegistryEditor,openTaskManager,openControlPanel,openRun:openRunDialog,runCommand,openClipboardHistory,toggleClockFlyout,
    openUpdateCenter,openPublisherManager,unlockPublisher,publishLatest,manifest:releaseManifest,saveWorkspaceNow:saveWorkspaceNow1I,restoreWorkspace:restoreWorkspace1I,
    finishUpdateSetup,showPowerMenu,showDesktop,notify
  };
  window.Gold1U=publicAPI;

  function init(){
    branding();applyRegistryEffects();installClock();installHotkeys();installObserver();refreshEnhancements();
    const patchTimer=setInterval(()=>{if(patchGoldAPI())clearInterval(patchTimer)},120);
    setTimeout(()=>{patchGoldAPI();refreshEnhancements()},1700);
    setTimeout(maybeShowUpdateSetup,4200);
    setInterval(()=>{if(window.__GOLD1U_MIGRATION_BLOCK_SAVES__!==true)saveWorkspaceNow1I(false)},60000);
    window.addEventListener("beforeunload",()=>{writeJSON(PREFIX+"workspace_meta_1u",{version:VERSION,folder:FOLDER,savedAt:now(),openWindows:currentWindowState()})});
    window.addEventListener("resize",()=>{const cfg=registryData();const node=getNodeFrom(cfg,["HKEY_CURRENT_CONFIG"]);if(node){node._values.DisplayWidth={type:"REG_DWORD",data:innerWidth};node._values.DisplayHeight={type:"REG_DWORD",data:innerHeight};writeJSON(REGISTRY_KEY,cfg)}});
    setTimeout(()=>{$("boot")?.classList.add("hidden")},850);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
