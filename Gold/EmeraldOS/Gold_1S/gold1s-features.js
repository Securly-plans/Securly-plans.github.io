"use strict";

/* =========================================================
   EMERALDOS GOLD 1S
   ORIGINAL E.L.S.U.S. + STAFF CENTER + VERIFIED USER APPS
   + CUSTOM LOGOS + WINDOWS 10 FEATURE PACK
========================================================= */
(function EmeraldOSGold1SFeatures(){
  if(window.__EMERALDOS_GOLD_1S_FEATURES__) return;
  window.__EMERALDOS_GOLD_1S_FEATURES__=true;

  const VERSION="1S";
  const FOLDER="Gold_1S";
  const PREFIX="gold1g_";
  const APP_COLLECTION="emeraldGoldAppSubmissions";
  const SESSION_COLLECTION="emeraldGoldSessions";
  const STAFF_LOG_COLLECTION="emeraldGoldStaffLogs";
  const CONTROL_DOC=["system","emeraldGoldLiveControl"];
  const CUSTOM_LOGO_KEY=PREFIX+"custom_app_logos";
  const APP_CACHE_KEY=PREFIX+"app_verification_cache";
  const LIVE_CONTROL_KEY=PREFIX+"live_staff_control";
  const ELSUS_STATE_KEY=PREFIX+"elsus_original_state";
  const STICKY_KEY=PREFIX+"sticky_notes";
  const VDESK_KEY=PREFIX+"virtual_desktops_1j";

  const $=id=>document.getElementById(id);
  const qa=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const now=()=>new Date().toISOString();
  const esc=value=>String(value??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const uid=(prefix="id")=>prefix+Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-6);
  const read=(key,fallback)=>{try{const raw=localStorage.getItem(key);return raw===null?fallback:JSON.parse(raw)}catch{return fallback}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch(error){console.warn("Gold 1S local write failed",key,error);return false}};
  const userName=()=>localStorage.getItem("username")||localStorage.getItem(PREFIX+"username")||"GoldUser";
  const normalizeUser=value=>String(value||"GoldUser").toLowerCase().replace(/[^a-z0-9._-]/g,"_");
  const isOnline=()=>navigator.onLine;
  const api=()=>window.Gold50||window.Gold1S;
  const notify=(title,body,app="EmeraldOS Gold 1S")=>api()?.notify?.(title,body,app)||console.info(`[${app}] ${title}: ${body}`);
  const hashText=async text=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(String(text))))).map(b=>b.toString(16).padStart(2,"0")).join("");
  const saveText=(name,text,type="text/plain")=>api()?.saveText?.(name,text,type);

  let elsusState={mode:"original",managed:new URLSearchParams(location.search).has("goldShell"),latestManifest:null,lastCheck:null,lastRoute:null};
  let liveControl={enabled:true,maintenanceMode:false,supportOnlyMode:false,userAppsDisabled:false,developerDisabled:false,mailDisabled:false,forceFocusAssist:false,announcement:"",emergencyMessage:"",revision:0,updatedAt:null,updatedBy:null};
  let controlUnsubscribers=[];
  let sessionTimer=null;
  let desktopObserver=null;
  let currentDesktop=1;
  let desktopCount=1;
  let originalOpenApp=null;
  let appVerificationUnsubscribe=null;
  let forcedFocusPrevious=null;

  function staffSession(){
    for(const key of [PREFIX+"staff_session","gold1s_staff_session","gold1j_staff_session"]){
      const session=read(key,null);
      if(!session||session.verified!==true||!session.mail) continue;
      if(session.expiresAt&&Date.parse(session.expiresAt)<=Date.now()){localStorage.removeItem(key);continue;}
      return session;
    }
    return null;
  }
  function isStaff(){return Boolean(staffSession())}
  window.Gold1SIsStaff=isStaff;

  function openWindow(id,title,html,options={}){
    const core=api();
    if(!core?.openWindow) throw new Error("The Gold desktop window service is not ready.");
    return core.openWindow(id,title,html,options);
  }
  function appById(id){return api()?.APPS?.find(app=>app.id===id)||null}
  function ensureApp(definition){
    const apps=api()?.APPS;
    if(!Array.isArray(apps)) return null;
    const existing=apps.find(app=>app.id===definition.id);
    if(existing){Object.assign(existing,definition);return existing;}
    apps.push(definition);return definition;
  }
  function removeApps(predicate){
    const apps=api()?.APPS;if(!Array.isArray(apps))return;
    for(let index=apps.length-1;index>=0;index--)if(predicate(apps[index]))apps.splice(index,1);
  }
  function refreshShellUI(){
    try{api()?.renderDesktop?.();api()?.renderStartMenu?.();}catch(error){console.debug(error)}
    applyCustomLogoDOM();
  }

  /* ------------------------- Custom application logos ------------------------- */
  function customLogos(){return read(CUSTOM_LOGO_KEY,{})}
  function setCustomLogo(appId,source){
    const logos=customLogos();
    if(source)logos[appId]=source;else delete logos[appId];
    write(CUSTOM_LOGO_KEY,logos);refreshShellUI();
    window.Gold1S?.saveWorkspaceNow?.(false);
  }
  function logoFor(app){return customLogos()[app.id]||app.icon||app.logo||`app-logos/${app.id}.svg`}
  function logoMarkup(app,size=32){
    const fallback=esc(app.label||String(app.name||"AP").slice(0,2).toUpperCase());
    return `<span class="gold1p-logo-wrap" style="width:${size}px;height:${size}px"><img class="gold1p-custom-logo" src="${esc(logoFor(app))}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="fallback-icon" style="display:none">${fallback}</span></span>`;
  }
  function applyCustomLogoDOM(){
    qa("img[data-app-logo]").forEach(img=>{const id=img.dataset.appLogo,source=customLogos()[id];if(source&&img.getAttribute("src")!==source)img.setAttribute("src",source)});
  }
  function readImageFile(file,maxBytes=260000){
    return new Promise((resolve,reject)=>{
      if(!file)return reject(new Error("No image was selected."));
      if(file.size>maxBytes)return reject(new Error(`The logo must be smaller than ${Math.round(maxBytes/1024)} KB.`));
      if(!/^image\//i.test(file.type))return reject(new Error("Choose an image file."));
      const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(reader.error||new Error("The image could not be read."));reader.readAsDataURL(file);
    });
  }

  /* ------------------------- User app verification ------------------------- */
  function normalizeUserApp(raw={}){
    const owner=raw.owner||raw.submittedBy||raw.author||userName();
    let status=raw.verificationStatus||raw.status;
    if(!status)status=raw.verified===true?"approved":raw.code?"legacy-review":"draft";
    return {
      id:String(raw.id||`user_${normalizeUser(owner)}_${uid("app_")}`),
      name:String(raw.name||"Unnamed application"),
      description:String(raw.description||"User-created EmeraldOS application."),
      code:String(raw.code||""),
      iconData:raw.iconData||raw.icon||"",
      owner:String(owner),
      submittedBy:String(raw.submittedBy||owner),
      createdAt:raw.createdAt||raw.installedAt||now(),
      updatedAt:raw.updatedAt||raw.installedAt||now(),
      submittedAt:raw.submittedAt||null,
      verificationStatus:String(status),
      verified:Boolean(raw.verified||status==="approved"),
      verifiedBy:raw.verifiedBy||null,
      verifiedAt:raw.verifiedAt||null,
      staffNotes:raw.staffNotes||"",
      codeHash:raw.codeHash||"",
      requestedPermissions:Array.isArray(raw.requestedPermissions)?raw.requestedPermissions:[],
      installed:raw.installed!==false,
      startup:Boolean(raw.startup),
      source:raw.source||"local",
      cloudDocumentId:raw.cloudDocumentId||raw.id||null
    };
  }
  function userApps(){return read(PREFIX+"user_apps",[]).map(normalizeUserApp)}
  function saveUserApps(apps){
    const normalized=apps.map(normalizeUserApp);
    if(api()?.saveUserApps)api().saveUserApps(normalized);else write(PREFIX+"user_apps",normalized);
    syncUserAppRegistry();
    return normalized;
  }
  function updateLocalApp(app){
    const apps=userApps(),index=apps.findIndex(item=>item.id===app.id);
    if(index>=0)apps[index]=normalizeUserApp({...apps[index],...app,updatedAt:now()});else apps.push(normalizeUserApp(app));
    saveUserApps(apps);return apps.find(item=>item.id===app.id);
  }
  function statusLabel(status){return ({approved:"Staff verified",pending:"Pending staff review",rejected:"Rejected",draft:"Draft","legacy-review":"Needs staff review"})[status]||status}
  function statusClass(status){return status==="approved"?"approved":status==="rejected"?"rejected":status==="pending"?"pending":"draft"}
  function analyzeCode(code){
    const rules=[
      [/\beval\s*\(/i,"Uses eval()"],[/\bFunction\s*\(/,"Creates dynamic functions"],[/\bfetch\s*\(/i,"Makes network requests"],
      [/XMLHttpRequest/i,"Uses XMLHttpRequest"],[/localStorage|sessionStorage/i,"Requests browser storage"],[/document\.cookie/i,"Reads cookies"],
      [/window\.open/i,"Opens external windows"],[/navigator\.mediaDevices/i,"Requests microphone/camera/screen access"],[/innerHTML\s*=/i,"Writes HTML content"]
    ];
    return rules.filter(([pattern])=>pattern.test(code)).map(([,message])=>message);
  }
  async function submitAppForVerification(app){
    const normalized=normalizeUserApp(app);
    normalized.verificationStatus="pending";normalized.verified=false;normalized.submittedAt=now();normalized.updatedAt=now();normalized.submittedBy=userName();normalized.owner=normalized.owner||userName();normalized.codeHash=await hashText(normalized.code);
    updateLocalApp(normalized);
    try{
      const fb=await import("./firebase.js");
      if(!fb.db)throw new Error("Firebase is not configured.");
      await fb.setDoc(fb.doc(fb.db,APP_COLLECTION,normalized.id),{...normalized,product:"EmeraldOS Gold",targetVersion:VERSION,folder:FOLDER,serverUpdatedAt:fb.serverTimestamp()},{merge:true});
      notify("Submitted for staff verification",`${normalized.name} is now in the Staff Center review queue.`,"Application Editor");
    }catch(error){
      notify("Saved to the local review queue",`Cloud submission was unavailable: ${error.message}`,"Application Editor");
    }
    return normalized;
  }
  async function launchUserApp(app,{preview=false}={}){
    if(!app)return null;
    if(!preview){
      if(app.verificationStatus!=="approved"){
        notify("Staff verification required",`${app.name} cannot run from the Appstore until a staff member approves it.`,"User Appstore");
        return null;
      }
      const actualHash=await hashText(String(app.code||""));
      if(!app.codeHash||actualHash!==app.codeHash){
        const apps=userApps(),index=apps.findIndex(item=>item.id===app.id);
        if(index>=0){
          apps[index]={...apps[index],verificationStatus:"draft",verified:false,verifiedBy:"",verifiedAt:"",codeHash:actualHash,updatedAt:now()};
          saveUserApps(apps);syncUserAppRegistry();
        }
        notify("Verification invalidated","The app source changed after approval. It has returned to Draft and must be reviewed again.","Application Security");
        return null;
      }
    }
    return sandboxUserApp(app,{preview,hashVerified:!preview});
  }
  function sandboxUserApp(app,{preview=false,hashVerified=false}={}){
    if(!preview&&(!hashVerified||app.verificationStatus!=="approved")){
      notify("Staff verification required",`${app.name} cannot run from the Appstore until a staff member approves it.`,"User Appstore");return null;
    }
    if(liveControl.userAppsDisabled&&!isStaff()){
      notify("User applications temporarily disabled","Live Staff Control has paused user applications.","Staff Control");return null;
    }
    const token=uid("sandbox_");
    const frameId=`userSandbox_${token}`;
    const html=`<div class="gold1p-user-app-host"><iframe id="${frameId}" sandbox="allow-scripts allow-forms allow-modals allow-downloads" title="${esc(app.name)}"></iframe><div class="gold1p-sandbox-note">${preview?"Developer preview":"Staff-verified sandbox"} · ${esc(app.owner)}</div></div>`;
    const win=openWindow(`userapp_${app.id}`,app.name,html,{width:820,height:600,singleton:false});
    const iframe=win.querySelector(`#${frameId}`),storeKey=PREFIX+"user_app_data_"+app.id,initialData=read(storeKey,{});
    const code=JSON.stringify(app.code).replace(/<\/script/gi,"<\\/script");
    const initial=JSON.stringify(initialData).replace(/<\/script/gi,"<\\/script");
    iframe.srcdoc=`<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;height:100%;font-family:Segoe UI,Arial,sans-serif;background:#fff;color:#111}*{box-sizing:border-box}button,input,select,textarea{font:inherit}</style></head><body><div id="app"></div><script>const TOKEN=${JSON.stringify(token)};let DATA=${initial};const send=(type,payload={})=>parent.postMessage({source:'emerald-gold-user-app',token:TOKEN,type,payload},'*');const api={setTitle:t=>send('title',{title:String(t)}),setContent:h=>document.getElementById('app').innerHTML=String(h),notify:(t,b)=>send('notify',{title:String(t),body:String(b)}),save:(k,v)=>{DATA[k]=v;send('save',{key:String(k),value:v})},load:(k,f=null)=>Object.prototype.hasOwnProperty.call(DATA,k)?DATA[k]:f,on:(selector,event,fn)=>document.querySelector(selector)?.addEventListener(event,fn),close:()=>send('close'),download:(name,text,type='text/plain')=>{const a=document.createElement('a');a.download=String(name);a.href=URL.createObjectURL(new Blob([text],{type}));a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}};try{Function('api','"use strict";\\n'+${code})(api)}catch(error){document.getElementById('app').innerHTML='<div style="padding:24px"><h2>Application error</h2><pre style="white-space:pre-wrap"></pre></div>';document.querySelector('pre').textContent=error.stack||error.message;send('error',{message:error.message})}<\/script></body></html>`;
    const handler=event=>{
      if(event.source!==iframe.contentWindow||event.data?.source!=="emerald-gold-user-app"||event.data?.token!==token)return;
      const {type,payload={}}=event.data;
      if(type==="title"){win.dataset.title=payload.title;win.querySelector(".title").textContent=payload.title;}
      if(type==="notify")notify(payload.title,payload.body,app.name);
      if(type==="save"){const data=read(storeKey,{});data[payload.key]=payload.value;write(storeKey,data);}
      if(type==="close")api()?.closeWin?.(win.id);
      if(type==="error")notify("User application error",payload.message,app.name);
    };
    window.addEventListener("message",handler);
    const observer=new MutationObserver(()=>{if(!win.isConnected){window.removeEventListener("message",handler);observer.disconnect();}});observer.observe(document.body,{childList:true,subtree:true});
    return win;
  }
  function syncUserAppRegistry(){
    const apps=api()?.APPS;if(!Array.isArray(apps))return;
    removeApps(app=>app.goldUserApp===true);
    userApps().filter(app=>app.installed&&app.verificationStatus==="approved").forEach(app=>{
      apps.push({id:`verified_${app.id}`,name:app.name,label:String(app.name).slice(0,2).toUpperCase(),color:"#107c10",group:"Verified user apps",desc:app.description,icon:app.iconData||"app-logos/store.svg",goldUserApp:true,userAppId:app.id,open:()=>launchUserApp(app)});
    });
    api()?.renderStartMenu?.();api()?.renderDesktop?.();
  }
  function openUserAppStore(){
    const local=userApps(),catalog=read(APP_CACHE_KEY,[]).map(normalizeUserApp).filter(app=>app.verificationStatus==="approved");
    const installed=local.filter(app=>app.installed);
    const card=app=>`<article class="gold1p-app-card"><div class="gold1p-app-card-head">${logoMarkup({id:`verified_${app.id}`,name:app.name,label:"UA",icon:app.iconData||"app-logos/store.svg"},44)}<div><h3>${esc(app.name)}</h3><span class="verification-badge ${statusClass(app.verificationStatus)}">${esc(statusLabel(app.verificationStatus))}</span></div></div><p>${esc(app.description)}</p><small>By ${esc(app.owner)}${app.verifiedBy?` · Verified by ${esc(app.verifiedBy)}`:""}</small><div class="actions">${app.verificationStatus==="approved"?`<button class="button primary" data-user-open="${esc(app.id)}">Open</button>`:`<button class="button" data-user-preview="${esc(app.id)}">Developer preview</button>`}<button class="button" data-user-edit="${esc(app.id)}">Edit</button><button class="button danger" data-user-remove="${esc(app.id)}">Uninstall</button></div></article>`;
    const catalogCard=app=>`<article class="gold1p-app-card"><div class="gold1p-app-card-head">${logoMarkup({id:`verified_${app.id}`,name:app.name,label:"UA",icon:app.iconData||"app-logos/store.svg"},44)}<div><h3>${esc(app.name)}</h3><span class="verification-badge approved">Staff verified</span></div></div><p>${esc(app.description)}</p><small>By ${esc(app.owner)}</small><div class="actions"><button class="button primary" data-catalog-install="${esc(app.id)}">Install</button></div></article>`;
    const html=`<div class="app-shell"><div class="app-toolbar"><b>User Appstore</b><button id="appStoreRefresh" class="button">Refresh verified catalog</button><button id="appStoreDeveloper" class="button primary">Application Editor</button></div><div class="app-body"><div class="gold1p-info-banner">Applications must pass Staff Center verification before they can run normally. Developer previews remain available to the app owner.</div><h2>Installed and submitted</h2><div class="gold1p-app-grid">${installed.map(card).join("")||'<p>No user applications are installed.</p>'}</div><h2>Verified catalog</h2><div class="gold1p-app-grid">${catalog.filter(app=>!local.some(x=>x.id===app.id&&x.installed)).map(catalogCard).join("")||'<p>Refresh the catalog to load staff-verified applications.</p>'}</div></div></div>`;
    const win=openWindow("store","User Appstore",html,{width:1040,height:700});
    win.querySelector("#appStoreDeveloper").onclick=()=>openApplicationEditor();
    win.querySelector("#appStoreRefresh").onclick=()=>refreshVerifiedCatalog(true);
    win.querySelectorAll("[data-user-open]").forEach(button=>button.onclick=()=>launchUserApp(userApps().find(app=>app.id===button.dataset.userOpen)));
    win.querySelectorAll("[data-user-preview]").forEach(button=>{button.onclick=()=>{const app=userApps().find(item=>item.id===button.dataset.userPreview);if(app&&normalizeUser(app.owner)===normalizeUser(userName()))launchUserApp(app,{preview:true});else notify("Preview unavailable","Only the app owner can preview an unverified application.","User Appstore")}});
    win.querySelectorAll("[data-user-edit]").forEach(button=>button.onclick=()=>openApplicationEditor(button.dataset.userEdit));
    win.querySelectorAll("[data-user-remove]").forEach(button=>button.onclick=()=>{if(confirm("Uninstall this application from your Gold VM?")){saveUserApps(userApps().filter(app=>app.id!==button.dataset.userRemove));openUserAppStore();}});
    win.querySelectorAll("[data-catalog-install]").forEach(button=>button.onclick=()=>{const app=catalog.find(item=>item.id===button.dataset.catalogInstall);if(app){updateLocalApp({...app,installed:true,source:"verified-catalog"});notify("Application installed",app.name,"User Appstore");openUserAppStore();}});
    return win;
  }
  async function refreshVerifiedCatalog(show=true){
    try{
      const fb=await import("./firebase.js");if(!fb.db)throw new Error("Firebase is not configured.");
      const snap=await fb.getDocs(fb.collection(fb.db,APP_COLLECTION));
      const remote=snap.docs.map(doc=>normalizeUserApp({...doc.data(),cloudDocumentId:doc.id}));
      const approved=remote.filter(app=>app.verificationStatus==="approved");
      write(APP_CACHE_KEY,approved);
      const local=userApps(),map=new Map(local.map(app=>[app.id,app]));let changed=false;
      remote.forEach(app=>{
        const previous=map.get(app.id);
        const belongsToUser=normalizeUser(app.owner)===normalizeUser(userName());
        if(previous||belongsToUser){
          if(previous?.verificationStatus!==app.verificationStatus&&show)notify("Application review updated",`${app.name}: ${statusLabel(app.verificationStatus)}.`,"User Appstore");
          map.set(app.id,normalizeUserApp({...previous,...app,installed:previous?.installed!==false}));changed=true;
        }
      });
      if(changed)saveUserApps([...map.values()]);
      if(show)notify("Verified catalog refreshed",`${approved.length} staff-verified applications are available.`,"User Appstore");
      if($("win_store"))openUserAppStore();return approved;
    }catch(error){if(show)notify("Catalog refresh unavailable",error.message,"User Appstore");return read(APP_CACHE_KEY,[])}
  }
  async function listenUserAppReviewUpdates(){
    try{
      const fb=await import("./firebase.js");if(!fb.db)return;
      appVerificationUnsubscribe=fb.onSnapshot(fb.collection(fb.db,APP_COLLECTION),snapshot=>{
        const remote=snapshot.docs.map(doc=>normalizeUserApp({...doc.data(),cloudDocumentId:doc.id}));
        write(APP_CACHE_KEY,remote.filter(app=>app.verificationStatus==="approved"));
        const local=userApps(),map=new Map(local.map(app=>[app.id,app]));let changed=false;
        remote.forEach(app=>{
          const previous=map.get(app.id),belongsToUser=normalizeUser(app.owner)===normalizeUser(userName());
          if(!previous&&!belongsToUser)return;
          if(previous&&previous.verificationStatus!==app.verificationStatus)notify("Application review updated",`${app.name}: ${statusLabel(app.verificationStatus)}.`,"User Appstore");
          map.set(app.id,normalizeUserApp({...previous,...app,installed:previous?.installed!==false}));changed=true;
        });
        if(changed)saveUserApps([...map.values()]);
      },error=>console.debug("User app verification listener unavailable",error.message));
    }catch(error){console.debug("User app verification is using manual refresh",error)}
  }
  function openApplicationEditor(appId=null){
    const existing=appId?userApps().find(app=>app.id===appId):null;
    const sample=`api.setTitle("My Gold App");\napi.setContent(\`\n  <div style="padding:24px">\n    <h1>Hello from EmeraldOS Gold 1S</h1>\n    <p>This app runs in the verified user-app sandbox.</p>\n    <button id="helloBtn">Show notification</button>\n  </div>\n\`);\napi.on("#helloBtn","click",()=>api.notify("Hello","Your app is working."));`;
    const app=existing||normalizeUserApp({id:`user_${normalizeUser(userName())}_${uid("app_")}`,name:"My Gold App",description:"A user-created EmeraldOS application.",code:sample,owner:userName(),verificationStatus:"draft",installed:true});
    const html=`<div class="app-shell"><div class="app-toolbar"><button id="devPreview" class="button primary">Preview</button><button id="devSaveDraft" class="button">Save draft</button><button id="devSubmit" class="button">Submit for staff verification</button><button id="devExport" class="button">Export package</button></div><div class="app-body"><div class="gold1p-editor-meta"><div class="gold1p-logo-editor"><img id="devIconPreview" src="${esc(app.iconData||"app-logos/developer.svg")}" alt=""><button id="devChooseIcon" class="button">Choose custom logo</button><button id="devClearIcon" class="button">Reset logo</button><input id="devIconFile" type="file" accept="image/*" hidden></div><div class="grid2" style="flex:1"><label>Application name<input id="devName" class="field" value="${esc(app.name)}"></label><label>Application ID<input id="devId" class="field" value="${esc(app.id)}" readonly></label><label style="grid-column:1/-1">Description<input id="devDescription" class="field" value="${esc(app.description)}"></label></div></div><fieldset><legend>Requested capabilities</legend>${["persistent-storage","notifications","downloads","clipboard","network","media-devices"].map(permission=>`<label class="check-row"><input type="checkbox" data-dev-permission="${permission}" ${app.requestedPermissions.includes(permission)?"checked":""}> ${permission}</label>`).join("")}</fieldset><h3>JavaScript</h3><textarea id="devCode" class="field code-editor">${esc(app.code)}</textarea><div id="devRisk" class="gold1p-code-analysis"></div><p class="muted">The normal Appstore launch path is enabled only after Staff Center approval. Preview runs in a sandboxed frame.</p></div></div>`;
    const win=openWindow("developer","Application Editor",html,{width:1080,height:740});
    const code=win.querySelector("#devCode"),preview=win.querySelector("#devIconPreview"),fileInput=win.querySelector("#devIconFile");
    let iconData=app.iconData||"";
    const collect=()=>normalizeUserApp({...app,name:win.querySelector("#devName").value.trim(),description:win.querySelector("#devDescription").value.trim(),code:code.value,iconData,requestedPermissions:qa("[data-dev-permission]:checked",win).map(input=>input.dataset.devPermission),owner:app.owner||userName(),installed:true,updatedAt:now()});
    const updateRisk=()=>{const risks=analyzeCode(code.value);win.querySelector("#devRisk").innerHTML=risks.length?`<b>Review indicators</b><ul>${risks.map(risk=>`<li>${esc(risk)}</li>`).join("")}</ul>`:'<b>No common high-risk patterns detected.</b>';};
    code.addEventListener("input",updateRisk);updateRisk();
    win.querySelector("#devChooseIcon").onclick=()=>fileInput.click();
    fileInput.onchange=async()=>{try{iconData=await readImageFile(fileInput.files[0]);preview.src=iconData}catch(error){notify("Logo not changed",error.message,"Application Editor")}};
    win.querySelector("#devClearIcon").onclick=()=>{iconData="";preview.src="app-logos/developer.svg"};
    win.querySelector("#devPreview").onclick=()=>{const value=collect();if(!value.name||!value.code)return notify("App incomplete","Enter a name and JavaScript code.","Application Editor");launchUserApp(value,{preview:true})};
    win.querySelector("#devSaveDraft").onclick=()=>{const value=collect();if(!value.name||!value.code)return notify("App incomplete","Enter a name and JavaScript code.","Application Editor");if(value.verificationStatus==="approved"&&value.code!==app.code){value.verificationStatus="draft";value.verified=false;value.staffNotes="Code changed after approval; resubmission is required.";}updateLocalApp(value);notify("Draft saved",value.name,"Application Editor")};
    win.querySelector("#devSubmit").onclick=async()=>{const value=collect();if(!value.name||!value.code)return notify("App incomplete","Enter a name and JavaScript code.","Application Editor");if(!confirm("Submit this application and its source code to Staff Center for verification?"))return;await submitAppForVerification(value);openApplicationEditor(value.id)};
    win.querySelector("#devExport").onclick=async()=>{const value=collect();value.codeHash=await hashText(value.code);saveText(`${value.name.replace(/[^a-z0-9_-]+/gi,"-")||"gold-app"}.egapp.json`,JSON.stringify(value,null,2),"application/json")};
    return win;
  }

  /* ------------------------- Original E.L.S.U.S. routing ------------------------- */
  function saveELSUSState(){write(ELSUS_STATE_KEY,{...elsusState,savedAt:now()})}
  function updateELSUSButton(){
    const button=$("shellStatusBtn");if(!button)return;
    button.textContent="E.L.S.U.S.";
    button.title="Open E.L.S.U.S. System Update";
    button.classList.remove("connected","waiting");
  }
  async function loadLatestManifest(){
    const cached=elsusState.latestManifest||read("emeraldGoldShell_latest",null);
    try{
      const fb=await import("./firebase.js");
      if(fb.db){
        const snap=await fb.getDoc(fb.doc(fb.db,"system","emeraldGoldLatest"));
        if(snap.exists()){
          const manifest={...(cached||{}),...snap.data()};
          elsusState.latestManifest=manifest;elsusState.lastCheck=now();
          write("emeraldGoldShell_latest",manifest);saveELSUSState();return manifest;
        }
      }
    }catch(error){console.debug("Gold 1S update lookup used local cache",error?.message||error)}
    return cached||{latestVersion:VERSION,build:VERSION,folder:FOLDER,entry:"OS.html",releaseTitle:"EmeraldOS Gold 1S",summary:"Current release"};
  }
  function versionParts(value){return String(value||"").toUpperCase().match(/\d+|[A-Z]+/g)||[]}
  function compareVersions(a,b){const aa=versionParts(a),bb=versionParts(b),length=Math.max(aa.length,bb.length);for(let i=0;i<length;i++){const x=aa[i]||"",y=bb[i]||"";const nx=/^\d+$/.test(x),ny=/^\d+$/.test(y);const result=nx&&ny?Number(x)-Number(y):x.localeCompare(y);if(result)return result>0?1:-1;}return 0}
  async function requestVersionChange(manifest){
    await window.Gold1S?.saveWorkspaceNow?.(false);
    write("emeraldGoldShell_pendingManifest",manifest);
    localStorage.setItem("emeraldGoldShell_forceCheck","true");
    localStorage.setItem("emeraldGoldShell_returnedFromVersion",FOLDER);
    elsusState.lastRoute={manifest,requestedAt:now(),fromVersion:VERSION,fromFolder:FOLDER};saveELSUSState();
    notify("Opening E.L.S.U.S.","Your cloud VM was saved. The original E.L.S.U.S. shell will apply the selected version.","System Update");
    location.href="../gold-shell.html?force=1";
    return true;
  }
  async function openEnhancedUpdateCenter(){
    const latest=await loadLatestManifest(),latestVersion=latest.latestVersion||latest.build||VERSION,newer=compareVersions(latestVersion,VERSION)>0;
    const html=`<div class="app-body"><div class="gold1p-page-title"><div><h1>System Update</h1><p>The original E.L.S.U.S. preserves the version-independent Gold VM and changes versions only after you choose to update.</p></div><button id="updateCheckAgain" class="button primary">Check again</button></div><div class="gold1p-settings-cards"><div class="card"><h3>This VM</h3><p><b>EmeraldOS Gold 1S</b><br>Gold_1S / OS.html</p></div><div class="card"><h3>Configured release</h3><p><b>${esc(latest.releaseTitle||`EmeraldOS Gold ${latestVersion}`)}</b><br>${esc(latest.folder||"")} / ${esc(latest.entry||"OS.html")}</p></div><div class="card"><h3>E.L.S.U.S. mode</h3><p>Original Gold shell routing from Gold 1I</p></div><div class="card"><h3>Status</h3><p>${newer?"A newer version is available.":"This VM is on the latest configured version."}</p></div></div><div class="card"><h3>Release information</h3><p>${esc(latest.summary||"No release notes were supplied.")}</p></div><div class="actions"><button id="updateSave" class="button">Save cloud VM</button><button id="updateApply" class="button primary" ${newer?"":"disabled"}>Update this VM now</button><button id="updateOpenELSUS" class="button">E.L.S.U.S. status</button>${isStaff()?'<button id="updatePublisher" class="button">Publisher Manager</button>':""}</div><p class="muted">This page only reads <code>system/emeraldGoldLatest</code>. Only the guarded Publish this Version action writes that document.</p></div>`;
    const win=openWindow("updateshell","System Update",html,{width:980,height:680});
    win.querySelector("#updateCheckAgain").onclick=()=>openEnhancedUpdateCenter();
    win.querySelector("#updateSave").onclick=()=>window.Gold1S?.saveWorkspaceNow?.(true);
    win.querySelector("#updateApply").onclick=()=>requestVersionChange(latest);
    win.querySelector("#updateOpenELSUS").onclick=openELSUSStatus;
    win.querySelector("#updatePublisher")?.addEventListener("click",()=>window.Gold1S?.openPublisherManager?.());
    return win;
  }
  function openELSUSStatus(){
    const latest=elsusState.latestManifest||read("emeraldGoldShell_latest",null);
    const html=`<div class="app-body"><h1>E.L.S.U.S.</h1><p>Gold 1S uses the original E.L.S.U.S. implementation from Gold 1I.</p><div class="gold1p-settings-cards"><div class="card"><h3>Routing</h3><p>Save VM → write pending manifest → open root <code>gold-shell.html</code></p></div><div class="card"><h3>Cloud VM</h3><p><code>emeraldOSUsers/${esc(userName())}/goldVM/current</code></p></div><div class="card"><h3>Latest manifest</h3><p>${esc(latest?.releaseTitle||"Not checked yet")}</p></div><div class="card"><h3>Publishing</h3><p>Manual Staff Edition and publisher-PIN workflow only.</p></div></div><div class="actions"><button id="elsusCheck" class="button primary">Check for updates</button><button id="elsusSave" class="button">Save VM</button><button id="elsusRoot" class="button">Open root E.L.S.U.S.</button></div><p class="muted">Gold 1S uses the direct, original E.L.S.U.S. route and requires no additional shell patch.</p></div>`;
    const win=openWindow("elsusstatus","E.L.S.U.S.",html,{width:820,height:590});
    win.querySelector("#elsusCheck").onclick=()=>openEnhancedUpdateCenter();
    win.querySelector("#elsusSave").onclick=()=>window.Gold1S?.saveWorkspaceNow?.(true);
    win.querySelector("#elsusRoot").onclick=()=>location.href="../gold-shell.html?force=1";
    return win;
  }
  function initOriginalELSUS(){
    elsusState={...elsusState,...read(ELSUS_STATE_KEY,{})};
    $("shellStatusBtn")?.addEventListener("click",openEnhancedUpdateCenter);
    updateELSUSButton();saveELSUSState();
    window.EmeraldELSUS={mode:"original",state:()=>({...elsusState}),requestVersionChange,openStatus:openELSUSStatus};
  }

  /* ------------------------- Live Staff Control ------------------------- */
  function normalizeControl(value={}){
    return {...liveControl,...value,
      maintenanceMode:Boolean(value.maintenanceMode??value.goldMaintenanceMode??value.globalLock??false),
      supportOnlyMode:Boolean(value.supportOnlyMode??false),
      userAppsDisabled:Boolean(value.userAppsDisabled??value.goldUserAppsDisabled??false),
      developerDisabled:Boolean(value.developerDisabled??value.goldDeveloperDisabled??false),
      mailDisabled:Boolean(value.mailDisabled??value.goldMailDisabled??value.chatDisabled??false),
      forceFocusAssist:Boolean(value.forceFocusAssist??false),
      announcement:String(value.announcement?.body??value.announcement?.text??value.announcement??""),
      emergencyMessage:String(value.emergencyMessage??value.emergency?.body??value.emergency?.text??value.emergency??""),
      revision:Number(value.revision||0)
    };
  }
  function applyLiveControl(value,{source="cloud"}={}){
    liveControl=normalizeControl(value);write(LIVE_CONTROL_KEY,liveControl);
    document.body.classList.toggle("gold1p-maintenance",liveControl.maintenanceMode);
    document.body.classList.toggle("gold1p-support-only",liveControl.supportOnlyMode);
    document.body.classList.toggle("gold1p-live-focus",liveControl.forceFocusAssist);
    const currentPrefs=api()?.prefs?.()||{};
    if(liveControl.forceFocusAssist&&forcedFocusPrevious===null){forcedFocusPrevious=Boolean(currentPrefs.focusAssist);api()?.setPrefs?.({focusAssist:true});}
    if(!liveControl.forceFocusAssist&&forcedFocusPrevious!==null){api()?.setPrefs?.({focusAssist:forcedFocusPrevious});forcedFocusPrevious=null;}
    const banner=$("liveControlBanner"),message=liveControl.emergencyMessage||liveControl.announcement;
    if(banner){banner.classList.toggle("hidden",!message);banner.classList.toggle("emergency",Boolean(liveControl.emergencyMessage));banner.innerHTML=message?`<b>${liveControl.emergencyMessage?"Emergency notice":"Staff announcement"}</b><span>${esc(message)}</span><button type="button" aria-label="Dismiss">×</button>`:"";banner.querySelector("button")?.addEventListener("click",()=>banner.classList.add("hidden"));}
    window.dispatchEvent(new CustomEvent("emeraldGoldLiveControl",{detail:liveControl}));
  }
  function appBlockedReason(id){
    if(isStaff())return "";
    if(liveControl.maintenanceMode&&!['support','updateshell','settings','systeminfo','help','elsusstatus'].includes(id))return "EmeraldOS Gold is in maintenance mode.";
    if(liveControl.supportOnlyMode&&!['support','updateshell','settings','systeminfo','help'].includes(id))return "Support-only mode is active.";
    if(liveControl.userAppsDisabled&&(id.startsWith("verified_")||id==="store"))return "User applications are temporarily disabled.";
    if(liveControl.developerDisabled&&id==="developer")return "Application Editor is temporarily disabled.";
    if(liveControl.mailDisabled&&id==="mail")return "Mail is temporarily disabled.";
    return "";
  }
  function guardedOpenApp(id,options={}){
    const reason=appBlockedReason(String(id));if(reason){notify("Application unavailable",reason,"Live Staff Control");return false;}
    return originalOpenApp?.(id,options);
  }
  async function listenLiveStaffControl(){
    applyLiveControl(read(LIVE_CONTROL_KEY,{}),{source:"local-cache"});
    try{
      const fb=await import("./firebase.js");if(!fb.db)return;
      const add=(reference,mapper=data=>data)=>{const unsub=fb.onSnapshot(reference,snapshot=>{if(snapshot.exists())applyLiveControl(mapper(snapshot.data()),{source:"firestore"})},error=>console.debug("Live staff control listener unavailable",error.message));controlUnsubscribers.push(unsub)};
      add(fb.doc(fb.db,...CONTROL_DOC));
      add(fb.doc(fb.db,"system","config"),data=>({globalLock:data.globalLock,announcement:data.goldAnnouncement||"",userAppsDisabled:data.goldUserAppsDisabled,developerDisabled:data.goldDeveloperDisabled,mailDisabled:data.goldMailDisabled}));
      add(fb.doc(fb.db,"system","announcement"),data=>({announcement:data.body||data.text||data.message||""}));
      add(fb.doc(fb.db,"system","emergency"),data=>({emergencyMessage:data.body||data.text||data.message||""}));
    }catch(error){console.debug("Gold 1S live control is using local fallback",error)}
  }
  async function saveLiveControl(next){
    if(!isStaff())throw new Error("A verified Staff Edition session is required.");
    const session=staffSession(),control=normalizeControl({...liveControl,...next,revision:Number(liveControl.revision||0)+1,updatedAt:now(),updatedBy:session?.username||userName()});
    applyLiveControl(control,{source:"staff-local"});
    try{
      const fb=await import("./firebase.js");if(!fb.db)throw new Error("Firebase is not configured.");
      await fb.setDoc(fb.doc(fb.db,...CONTROL_DOC),{...control,serverUpdatedAt:fb.serverTimestamp()},{merge:true});
      await fb.addDoc(fb.collection(fb.db,STAFF_LOG_COLLECTION),{action:"live-control-update",version:VERSION,folder:FOLDER,by:control.updatedBy,revision:control.revision,control,createdAt:fb.serverTimestamp()});
      notify("Live Staff Control updated",`Revision ${control.revision} is live.`,"Staff Center");return control;
    }catch(error){notify("Control saved locally",`Cloud update failed: ${error.message}`,"Staff Center");return control;}
  }

  /* ------------------------- Staff Center ------------------------- */
  async function fetchStaffData(){
    const result={submissions:userApps().filter(app=>["pending","legacy-review"].includes(app.verificationStatus)),sessions:[],logs:[],cloud:false};
    try{
      const fb=await import("./firebase.js");if(!fb.db)return result;
      const [appsSnap,sessionsSnap,logsSnap]=await Promise.all([
        fb.getDocs(fb.collection(fb.db,APP_COLLECTION)),fb.getDocs(fb.collection(fb.db,SESSION_COLLECTION)),fb.getDocs(fb.query(fb.collection(fb.db,STAFF_LOG_COLLECTION),fb.orderBy("createdAt","desc"),fb.limit(50))).catch(()=>null)
      ]);
      const cloudApps=appsSnap.docs.map(doc=>normalizeUserApp({...doc.data(),cloudDocumentId:doc.id}));
      const map=new Map(result.submissions.map(app=>[app.id,app]));cloudApps.forEach(app=>map.set(app.id,app));result.submissions=[...map.values()];
      result.sessions=sessionsSnap.docs.map(doc=>({id:doc.id,...doc.data()}));result.logs=logsSnap?.docs?.map(doc=>({id:doc.id,...doc.data()}))||[];result.cloud=true;
      return result;
    }catch(error){result.error=error.message;return result}
  }
  function staffNav(tab){return `<aside class="staff-center-nav"><h2>Staff Center</h2>${[["overview","Overview"],["control","Live control"],["apps","App verification"],["sessions","Live sessions"],["logs","Activity log"],["elsus","E.L.S.U.S."]].map(([id,label])=>`<button class="${tab===id?"active":""}" data-staff-tab="${id}">${label}</button>`).join("")}</aside>`}
  async function renderStaffCenter(win,tab="overview"){
    const content=win.querySelector("#staffCenterContent");if(!content)return;
    content.innerHTML='<div class="gold1p-loading">Loading Staff Center…</div>';
    const data=await fetchStaffData(),pending=data.submissions.filter(app=>["pending","legacy-review"].includes(app.verificationStatus));
    if(tab==="overview")content.innerHTML=`<h1>Staff Center</h1><p class="muted">Live administration for EmeraldOS Gold 1S.</p><div class="gold1p-settings-cards"><button class="card staff-card" data-staff-jump="control"><h3>Live control</h3><strong>${liveControl.maintenanceMode?"Maintenance active":"Normal operations"}</strong><p>Revision ${liveControl.revision||0}</p></button><button class="card staff-card" data-staff-jump="apps"><h3>App verification</h3><strong>${pending.length} pending</strong><p>Review user applications and permissions.</p></button><button class="card staff-card" data-staff-jump="sessions"><h3>Live sessions</h3><strong>${data.sessions.length} reported</strong><p>Gold VM heartbeat records.</p></button><button class="card staff-card" data-staff-jump="elsus"><h3>E.L.S.U.S.</h3><strong>Original routing</strong><p>Original Gold 1I update routing and publisher safety.</p></button></div>${data.error?`<div class="gold1p-warning">Cloud data is unavailable: ${esc(data.error)}. Local Staff Center controls remain usable.</div>`:""}`;
    if(tab==="control")content.innerHTML=`<h1>Live Staff Control</h1><p>Changes are delivered to running Gold 1S sessions through Firestore listeners.</p><div class="setting-row"><span><b>Maintenance mode</b><small>Limits non-staff users to support and update tools.</small></span><input id="staffMaintenance" type="checkbox" ${liveControl.maintenanceMode?"checked":""}></div><div class="setting-row"><span><b>Support-only mode</b><small>Restricts most applications without showing a full lock screen.</small></span><input id="staffSupportOnly" type="checkbox" ${liveControl.supportOnlyMode?"checked":""}></div><div class="setting-row"><span><b>Disable user applications</b></span><input id="staffDisableApps" type="checkbox" ${liveControl.userAppsDisabled?"checked":""}></div><div class="setting-row"><span><b>Disable Application Editor</b></span><input id="staffDisableDeveloper" type="checkbox" ${liveControl.developerDisabled?"checked":""}></div><div class="setting-row"><span><b>Disable Gold Mail</b></span><input id="staffDisableMail" type="checkbox" ${liveControl.mailDisabled?"checked":""}></div><div class="setting-row"><span><b>Force Focus Assist</b></span><input id="staffForceFocus" type="checkbox" ${liveControl.forceFocusAssist?"checked":""}></div><label>Announcement<textarea id="staffAnnouncement" class="field" rows="3">${esc(liveControl.announcement)}</textarea></label><label>Emergency notice<textarea id="staffEmergency" class="field" rows="3">${esc(liveControl.emergencyMessage)}</textarea></label><div class="actions"><button id="staffControlSave" class="button primary">Apply live control</button><button id="staffControlClear" class="button">Clear messages</button></div>`;
    if(tab==="apps")content.innerHTML=`<div class="gold1p-page-title"><div><h1>Staff App Verification</h1><p>Inspect code, requested capabilities, and review indicators before approval.</p></div><button id="staffAppsRefresh" class="button">Refresh</button></div><div class="gold1p-app-grid">${data.submissions.map(app=>{const risks=analyzeCode(app.code);return `<article class="gold1p-app-card"><div class="gold1p-app-card-head">${logoMarkup({id:`verified_${app.id}`,name:app.name,label:"UA",icon:app.iconData||"app-logos/store.svg"},44)}<div><h3>${esc(app.name)}</h3><span class="verification-badge ${statusClass(app.verificationStatus)}">${esc(statusLabel(app.verificationStatus))}</span></div></div><p>${esc(app.description)}</p><small>Owner: ${esc(app.owner)} · SHA-256: ${esc((app.codeHash||"not calculated").slice(0,18))}${app.codeHash?"…":""}</small><p><b>Capabilities:</b> ${esc(app.requestedPermissions.join(", ")||"None declared")}</p><p><b>Review indicators:</b> ${esc(risks.join(", ")||"None")}</p><div class="actions"><button class="button" data-app-inspect="${esc(app.id)}">Inspect code</button>${app.verificationStatus!=="approved"?`<button class="button primary" data-app-approve="${esc(app.id)}">Approve</button>`:""}${app.verificationStatus!=="rejected"?`<button class="button danger" data-app-reject="${esc(app.id)}">Reject</button>`:""}</div></article>`}).join("")||'<p>No app submissions were found.</p>'}</div>`;
    if(tab==="sessions")content.innerHTML=`<h1>Live Gold Sessions</h1><p class="muted">A session is considered current when its browser continues sending heartbeats.</p><table><thead><tr><th>User</th><th>Version</th><th>Shell</th><th>Staff</th><th>Last reported</th></tr></thead><tbody>${data.sessions.map(session=>`<tr><td>${esc(session.username||session.id)}</td><td>${esc(session.version||"")}</td><td>${session.shellManaged?"Managed":"Standalone"}</td><td>${session.staff?"Yes":"No"}</td><td>${esc(formatFirestoreTime(session.lastSeen||session.lastSeenISO))}</td></tr>`).join("")||'<tr><td colspan="5">No cloud session records are available.</td></tr>'}</tbody></table>`;
    if(tab==="logs")content.innerHTML=`<h1>Staff Activity Log</h1><table><thead><tr><th>Action</th><th>Staff</th><th>Version</th><th>Time</th></tr></thead><tbody>${data.logs.map(log=>`<tr><td>${esc(log.action||"")}</td><td>${esc(log.by||"")}</td><td>${esc(log.version||"")}</td><td>${esc(formatFirestoreTime(log.createdAt))}</td></tr>`).join("")||'<tr><td colspan="4">No cloud activity records are available.</td></tr>'}</tbody></table>`;
    if(tab==="elsus")content.innerHTML=`<h1>E.L.S.U.S. Administration</h1><div class="gold1p-settings-cards"><div class="card"><h3>Compatibility mode</h3><p>Original E.L.S.U.S. routing from Gold 1I</p><button id="staffELSUSOpen" class="button">E.L.S.U.S. status</button></div><div class="card"><h3>Update Publisher</h3><p>Publishing still requires the publisher PIN and a direct click.</p><button id="staffPublisherOpen" class="button primary">Publisher Manager</button></div><div class="card"><h3>Current pointer safety</h3><p>Staff Center does not write <code>system/emeraldGoldLatest</code>.</p></div><div class="card"><h3>Cloud VM</h3><p>Save all user categories before administrative maintenance.</p><button id="staffSaveVM" class="button">Save this VM</button></div></div>`;
    win.querySelectorAll("[data-staff-tab]").forEach(button=>button.onclick=()=>{win.querySelector("#staffCenterNav").innerHTML=staffNav(button.dataset.staffTab);wireStaffNav(win);renderStaffCenter(win,button.dataset.staffTab)});
    wireStaffContent(win,tab,data);
  }
  function wireStaffNav(win){win.querySelectorAll("[data-staff-tab]").forEach(button=>button.onclick=()=>{win.querySelector("#staffCenterNav").innerHTML=staffNav(button.dataset.staffTab);wireStaffNav(win);renderStaffCenter(win,button.dataset.staffTab)})}
  function wireStaffContent(win,tab,data){
    win.querySelectorAll("[data-staff-jump]").forEach(button=>button.onclick=()=>{const next=button.dataset.staffJump;win.querySelector("#staffCenterNav").innerHTML=staffNav(next);wireStaffNav(win);renderStaffCenter(win,next)});
    if(tab==="control"){
      win.querySelector("#staffControlSave").onclick=async()=>{await saveLiveControl({maintenanceMode:win.querySelector("#staffMaintenance").checked,supportOnlyMode:win.querySelector("#staffSupportOnly").checked,userAppsDisabled:win.querySelector("#staffDisableApps").checked,developerDisabled:win.querySelector("#staffDisableDeveloper").checked,mailDisabled:win.querySelector("#staffDisableMail").checked,forceFocusAssist:win.querySelector("#staffForceFocus").checked,announcement:win.querySelector("#staffAnnouncement").value.trim(),emergencyMessage:win.querySelector("#staffEmergency").value.trim()});renderStaffCenter(win,"control")};
      win.querySelector("#staffControlClear").onclick=async()=>{await saveLiveControl({announcement:"",emergencyMessage:""});renderStaffCenter(win,"control")};
    }
    if(tab==="apps"){
      win.querySelector("#staffAppsRefresh")?.addEventListener("click",()=>renderStaffCenter(win,"apps"));
      win.querySelectorAll("[data-app-inspect]").forEach(button=>button.onclick=()=>{const app=data.submissions.find(item=>item.id===button.dataset.appInspect);if(app)openAppInspection(app)});
      win.querySelectorAll("[data-app-approve]").forEach(button=>button.onclick=()=>reviewApp(data.submissions.find(item=>item.id===button.dataset.appApprove),"approved",win));
      win.querySelectorAll("[data-app-reject]").forEach(button=>button.onclick=()=>reviewApp(data.submissions.find(item=>item.id===button.dataset.appReject),"rejected",win));
    }
    if(tab==="elsus"){
      win.querySelector("#staffELSUSOpen")?.addEventListener("click",openELSUSStatus);
      win.querySelector("#staffPublisherOpen")?.addEventListener("click",()=>window.Gold1S?.openPublisherManager?.());
      win.querySelector("#staffSaveVM")?.addEventListener("click",()=>window.Gold1S?.saveWorkspaceNow?.(true));
    }
  }
  function formatFirestoreTime(value){
    try{if(!value)return "Unknown";if(typeof value.toDate==="function")return value.toDate().toLocaleString();if(value.seconds)return new Date(value.seconds*1000).toLocaleString();return new Date(value).toLocaleString()}catch{return "Unknown"}
  }
  function openAppInspection(app){
    const risks=analyzeCode(app.code);return openWindow(`inspect_${app.id}`,`Inspect: ${app.name}`,`<div class="app-body"><h1>${esc(app.name)}</h1><p>${esc(app.description)}</p><div class="gold1p-settings-cards"><div class="card"><b>Owner</b><p>${esc(app.owner)}</p></div><div class="card"><b>Status</b><p>${esc(statusLabel(app.verificationStatus))}</p></div><div class="card"><b>Capabilities</b><p>${esc(app.requestedPermissions.join(", ")||"None")}</p></div><div class="card"><b>Review indicators</b><p>${esc(risks.join(", ")||"None")}</p></div></div><h2>Source code</h2><pre class="gold1p-source-view">${esc(app.code)}</pre></div>`,{width:980,height:700,singleton:false});
  }
  async function reviewApp(app,status,staffWin){
    if(!app)return;if(!isStaff())return notify("Staff verification required","Open Staff Edition first.","Staff Center");
    const notes=prompt(status==="approved"?"Approval notes (optional)":"Reason for rejection",app.staffNotes||"");if(notes===null)return;
    const reviewed=normalizeUserApp({...app,verificationStatus:status,verified:status==="approved",verifiedBy:staffSession()?.username||userName(),verifiedAt:now(),staffNotes:notes,codeHash:await hashText(String(app.code||"")),updatedAt:now()});
    updateLocalApp(reviewed);
    try{
      const fb=await import("./firebase.js");if(!fb.db)throw new Error("Firebase is not configured.");
      await fb.setDoc(fb.doc(fb.db,APP_COLLECTION,reviewed.cloudDocumentId||reviewed.id),{...reviewed,serverUpdatedAt:fb.serverTimestamp()},{merge:true});
      await fb.addDoc(fb.collection(fb.db,STAFF_LOG_COLLECTION),{action:`user-app-${status}`,appId:reviewed.id,appName:reviewed.name,by:reviewed.verifiedBy,version:VERSION,createdAt:fb.serverTimestamp()});
      notify(`Application ${status}`,reviewed.name,"Staff Center");
    }catch(error){notify("Review saved locally",`Cloud update failed: ${error.message}`,"Staff Center")}
    syncUserAppRegistry();renderStaffCenter(staffWin,"apps");
  }
  function openStaffCenter(tab="overview"){
    if(!isStaff()){
      notify("Staff verification required","Sign in through Gold Staff Edition and verify Emerald Mail.","Staff Center");location.href="staff.html";return null;
    }
    const html=`<div class="staff-center-shell"><div id="staffCenterNav">${staffNav(tab)}</div><main id="staffCenterContent" class="staff-center-content"></main></div>`;
    const win=openWindow("staffcenter","Staff Center",html,{width:1120,height:720});wireStaffNav(win);renderStaffCenter(win,tab);return win;
  }

  /* ------------------------- Session heartbeat ------------------------- */
  async function sendSessionHeartbeat(){
    const record={username:userName(),normalizedUser:normalizeUser(userName()),version:VERSION,folder:FOLDER,entry:"OS.html",elsusMode:"original",staff:isStaff(),online:navigator.onLine,lastSeenISO:now(),openWindows:qa(".window").length,userAgent:navigator.userAgent.slice(0,300)};
    write(PREFIX+"session_heartbeat",record);
    try{const fb=await import("./firebase.js");if(fb.db)await fb.setDoc(fb.doc(fb.db,SESSION_COLLECTION,normalizeUser(userName())),{...record,lastSeen:fb.serverTimestamp()},{merge:true})}catch(error){console.debug("Gold 1S session heartbeat cloud write skipped",error.message)}
  }

  /* ------------------------- Windows 10-style Settings ------------------------- */
  const SETTINGS_SECTIONS=[
    ["system","System","Display, notifications, power"],["devices","Devices","Mouse, keyboard, input"],["network","Network & Internet","Status and data usage"],
    ["personalization","Personalization","Background, colors, taskbar"],["apps","Apps","Defaults, startup, custom logos"],["accounts","Accounts","Profile and Staff Edition"],
    ["time","Time & Language","Clock and regional format"],["gaming","Gaming","Game Mode and performance"],["accessibility","Ease of Access","Display and interaction"],
    ["search","Search","Search behavior and history"],["privacy","Privacy","Clipboard and diagnostics"],["update","Update & Security","E.L.S.U.S. and recovery"],["migration","Migration & Recovery","Files, backups, and continuity"],
    ["shell","E.L.S.U.S.","Original E.L.S.U.S. update routing"],["shellv2","Shell V2","Account routing and compatibility testing"]
  ];
  function prefs(){return api()?.prefs?.()||read(PREFIX+"prefs",{})}
  function setPrefs(next){api()?.setPrefs?.(next);setTimeout(applyExtendedPrefs,30)}
  function settingToggle(id,label,description,checked){return `<div class="setting-row"><span><b>${esc(label)}</b><small>${esc(description)}</small></span><input id="${id}" type="checkbox" ${checked?"checked":""}></div>`}
  function settingsContent(section){
    const p=prefs(),defaults=p.defaultApps||{web:"browser",mail:"mail",text:"notepad",photos:"photos",music:"media",video:"media"};
    if(section==="system")return `<h1>System</h1>${settingToggle("setNotifications","Notifications","Show app and system notification banners.",p.notifications!==false)}${settingToggle("setFocusAssist","Focus assist","Suppress notification banners while enabled.",Boolean(p.focusAssist))}${settingToggle("setNightLight","Night light","Use a warmer display tone.",Boolean(p.nightLight))}<div class="setting-row"><span><b>Display scaling</b><small>Scale app text and controls.</small></span><input id="setTextScale" type="range" min="80" max="170" value="${Number(p.textScale)||100}"></div><div class="setting-row"><span><b>Power mode</b><small>Choose a balance between animations and responsiveness.</small></span><select id="setPowerMode"><option value="balanced" ${p.powerMode!=="performance"?"selected":""}>Balanced</option><option value="performance" ${p.powerMode==="performance"?"selected":""}>Best performance</option></select></div><div class="actions"><button class="button" data-open-app="storage">Storage</button><button class="button" data-open-tool="clipboard">Clipboard history</button><button class="button" data-open-app="systeminfo">About</button></div>`;
    if(section==="devices")return `<h1>Devices</h1><div class="setting-row"><span><b>Mouse pointer speed</b><small>Controls pointer-related UI sensitivity inside EmeraldOS.</small></span><input id="setPointerSpeed" type="range" min="1" max="20" value="${Number(p.pointerSpeed)||10}"></div>${settingToggle("setSingleClick","Single-click to open items","Use one click instead of double-click for desktop files.",Boolean(p.singleClickOpen))}${settingToggle("setTouchMode","Tablet-friendly controls","Increase touch targets and spacing.",Boolean(p.touchMode))}${settingToggle("setKeyboardHints","Keyboard shortcut hints","Show shortcut labels in menus.",p.keyboardHints!==false)}`;
    if(section==="network")return `<h1>Network & Internet</h1><div class="gold1p-settings-cards"><div class="card"><h3>Status</h3><p>${navigator.onLine?"Connected":"Offline"}</p></div><div class="card"><h3>E.L.S.U.S.</h3><p>Original Gold 1I routing</p></div></div>${settingToggle("setMetered","Metered connection","Reduce optional cloud refresh operations.",Boolean(p.meteredConnection))}${settingToggle("setOfflineFallback","Offline fallback","Keep local VM features available when cloud services are offline.",p.offlineFallback!==false)}<div class="actions"><button class="button" data-open-tool="elsus">E.L.S.U.S. status</button><button class="button" id="networkTest">Run connection test</button></div>`;
    if(section==="personalization")return `<h1>Personalization</h1><div class="setting-row"><span><b>Theme</b><small>Choose the Windows 10-style light, dark, or high-contrast appearance.</small></span><select id="setTheme"><option value="light" ${p.theme==="light"?"selected":""}>Light</option><option value="dark" ${p.theme==="dark"?"selected":""}>Dark</option><option value="highcontrast" ${p.theme==="highcontrast"?"selected":""}>High contrast</option></select></div><div class="setting-row"><span><b>Accent color</b></span><input id="setAccent" type="color" value="${esc(p.accent||"#0078d7")}"></div><label>Custom wallpaper URL<input id="setWallpaper" class="field" value="${esc(p.customWallpaper||"")}"></label>${settingToggle("setTransparency","Transparency effects","Use acrylic-style shell surfaces.",p.transparency!==false)}${settingToggle("setLabels","Taskbar button labels","Show application names on the taskbar.",p.showLabels!==false)}${settingToggle("setSmallTaskbar","Use small taskbar buttons","Make the taskbar more compact.",Boolean(p.smallTaskbar))}<div class="setting-row"><span><b>Search on taskbar</b></span><select id="setSearchMode"><option value="box" ${p.searchMode!=="icon"&&p.searchMode!=="hidden"?"selected":""}>Search box</option><option value="icon" ${p.searchMode==="icon"?"selected":""}>Search icon</option><option value="hidden" ${p.searchMode==="hidden"?"selected":""}>Hidden</option></select></div><div class="setting-row"><span><b>Taskbar location</b></span><select id="setTaskbarPosition"><option value="bottom" ${p.taskbarPosition!=="top"?"selected":""}>Bottom</option><option value="top" ${p.taskbarPosition==="top"?"selected":""}>Top</option></select></div>`;
    if(section==="apps")return `<h1>Apps</h1><h2>Default apps</h2>${Object.entries({web:"Web browser",mail:"Email",text:"Text editor",photos:"Photo viewer",music:"Music player",video:"Video player"}).map(([key,label])=>`<div class="setting-row"><span><b>${label}</b></span><select data-default-app="${key}">${api().APPS.filter(app=>!app.staffOnly&&!app.goldUserApp).map(app=>`<option value="${esc(app.id)}" ${defaults[key]===app.id?"selected":""}>${esc(app.name)}</option>`).join("")}</select></div>`).join("")}<h2>Custom app logos</h2><div class="setting-row"><span><b>Application</b><small>Choose any built-in or verified application.</small></span><select id="logoAppSelect">${api().APPS.map(app=>`<option value="${esc(app.id)}">${esc(app.name)}</option>`).join("")}</select></div><div class="actions"><button id="logoChoose" class="button">Choose logo</button><button id="logoReset" class="button">Reset selected logo</button><button id="logoResetAll" class="button danger">Reset all custom logos</button><input id="logoFile" type="file" accept="image/*" hidden></div><h2>Startup</h2><p>Manage user apps that launch after sign-in from the User Appstore.</p><button class="button" data-open-app="store">Open User Appstore</button>`;
    if(section==="accounts")return `<h1>Accounts</h1><div class="card"><h2>${esc(userName())}</h2><p>EmeraldOS Gold cloud VM user</p><p>Staff Edition: ${isStaff()?"Verified":"Not verified"}</p><div class="actions"><button class="button" onclick="location.href='staff.html'">Staff Edition sign-in</button>${isStaff()?'<button class="button primary" data-open-app="staffcenter">Staff Center</button>':""}</div></div>`;
    if(section==="time")return `<h1>Time & Language</h1><div class="setting-row"><span><b>Clock format</b></span><select id="setTimeFormat"><option value="12h" ${p.timeFormat!=="24h"?"selected":""}>12-hour</option><option value="24h" ${p.timeFormat==="24h"?"selected":""}>24-hour</option></select></div>${settingToggle("setClockSeconds","Show seconds","Display seconds in the taskbar clock.",Boolean(p.clockSeconds))}<div class="setting-row"><span><b>Regional locale</b><small>Used for dates and numbers.</small></span><select id="setLocale"><option value="en-US" ${p.locale!=="en-GB"?"selected":""}>English (United States)</option><option value="en-GB" ${p.locale==="en-GB"?"selected":""}>English (United Kingdom)</option></select></div><div class="card"><b>Current browser time zone</b><p>${esc(Intl.DateTimeFormat().resolvedOptions().timeZone||"Unknown")}</p></div>`;
    if(section==="gaming")return `<h1>Gaming</h1>${settingToggle("setGameMode","Game Mode","Reduce shell effects while games and media are active.",Boolean(p.gameMode))}${settingToggle("setDisableAnimationsGame","Disable animations in Game Mode","Prefer responsiveness over visual transitions.",p.disableAnimationsInGameMode!==false)}${settingToggle("setCaptureHints","Capture hints","Show Snipping Tool and recording suggestions.",p.captureHints!==false)}<button class="button" data-open-app="snipping">Open Snipping Tool</button>`;
    if(section==="accessibility")return `<h1>Ease of Access</h1><div class="setting-row"><span><b>Text size</b></span><input id="setAccessTextScale" type="range" min="80" max="170" value="${Number(p.textScale)||100}"></div>${settingToggle("setReducedMotion","Reduce animations","Turn off most shell transitions.",Boolean(p.reducedMotion))}${settingToggle("setHighContrastAuto","High contrast shortcut","Allow Alt+Shift+Print Screen to toggle high contrast.",p.highContrastShortcut!==false)}${settingToggle("setLargePointer","Large pointer targets","Increase resize handles and title controls.",Boolean(p.largePointerTargets))}`;
    if(section==="search")return `<h1>Search</h1>${settingToggle("setSearchApps","Search applications","Include built-in and verified apps.",p.searchApps!==false)}${settingToggle("setSearchFiles","Search files","Include files in the Gold VM.",p.searchFiles!==false)}${settingToggle("setSearchSettings","Search settings","Include Windows-style settings categories.",p.searchSettings!==false)}${settingToggle("setSearchHistory","Search history","Keep recent search terms locally.",p.searchHistory!==false)}<button id="clearSearchHistory" class="button">Clear search history</button>`;
    if(section==="privacy")return `<h1>Privacy</h1>${settingToggle("setClipboardHistory","Clipboard history","Store copied text in this Gold VM.",p.clipboardHistory!==false)}${settingToggle("setDiagnostics","Optional diagnostics","Include non-sensitive environment details in support tickets.",p.optionalDiagnostics!==false)}${settingToggle("setSessionHeartbeat","Live session heartbeat","Report this Gold VM to Staff Center while signed in.",p.sessionHeartbeat!==false)}<div class="actions"><button class="button" data-open-tool="clipboard">Clipboard history</button><button class="button" id="clearLocalCaches">Clear replaceable caches</button></div>`;
    if(section==="update")return `<h1>Update & Security</h1><div class="gold1p-settings-cards"><div class="card"><h3>System Update</h3><p>Check the configured E.L.S.U.S. release without changing the Firestore pointer.</p><button class="button primary" data-open-app="updateshell">Open System Update</button></div><div class="card"><h3>Security Center</h3><button class="button" data-open-app="security">Open Security Center</button></div><div class="card"><h3>Migration status</h3><p>Verify that files and VM categories were preserved before cloud autosave.</p><button class="button" data-open-app="migrationcenter">Open Migration & Continuity</button></div></div>`;
    if(section==="migration")return `<h1>Migration & Recovery</h1><p>Gold 1S does not permit cloud autosave until previous-version data has been merged and validated.</p><div class="gold1p-settings-cards"><div class="card"><h3>Migration & Continuity</h3><p>Review sources, item counts, and the autosave gate.</p><button class="button primary" data-open-app="migrationcenter">Open migration report</button></div><div class="card"><h3>Restore Center</h3><p>Restore the current cloud VM or import a local backup.</p><button class="button" data-open-app="restore">Open Restore Center</button></div><div class="card"><h3>Storage Manager</h3><p>Inspect local VM categories without deleting user files.</p><button class="button" data-open-app="storage">Open Storage Manager</button></div></div>`;
    if(section==="shell")return `<h1>E.L.S.U.S.</h1><div class="gold1p-settings-cards"><div class="card"><h3>Compatibility</h3><p>Original E.L.S.U.S. implementation from Gold 1I</p></div><div class="card"><h3>Version switching</h3><p>The VM is saved before control returns to the root shell.</p></div><div class="card"><h3>Publishing</h3><p>Manual Staff Edition and publisher PIN only.</p></div></div><div class="actions"><button class="button" data-open-tool="elsus">Open E.L.S.U.S. status</button><button id="openRootELSUS" class="button">Open root E.L.S.U.S.</button></div>`;
    if(section==="shellv2")return `<h1>E.L.S.U.S. Shell V2</h1><p>Shell V2 can identify the user’s current Gold route before opening this version’s own login page. Gold 1S remains compatible with the original shell.</p><div class="gold1p-settings-cards"><div class="card"><h3>Two-step login</h3><p>The shell identifies the VM; Gold 1S still authenticates the operating-system session.</p></div><div class="card"><h3>Data isolation</h3><p>The shell reads routing metadata and does not replace files or settings.</p></div><div class="card"><h3>Compatibility test</h3><p>Review routing parameters, version metadata, and migration safeguards.</p></div></div><button class="button primary" data-open-app="shellv2test">Open Shell V2 Compatibility</button>`;
    return `<h1>Settings</h1>`;
  }
  function openEnhancedSettings(section="system"){
    const sections=[...SETTINGS_SECTIONS,...(isStaff()?[["staff","Staff Center","Live administration"]]:[])];
    const content=section==="staff"?`<h1>Staff Center</h1><p>Open live controls, app verification, sessions, and E.L.S.U.S. administration.</p><button class="button primary" data-open-app="staffcenter">Open Staff Center</button>`:settingsContent(section);
    const html=`<div class="settings-layout gold1p-settings"><aside class="settings-nav"><h2>Settings</h2><input id="settingsSearch" class="field" placeholder="Find a setting">${sections.map(([id,label,description])=>`<button class="${section===id?"active":""}" data-settings-section="${id}" data-setting-words="${esc((label+" "+description).toLowerCase())}"><b>${esc(label)}</b><small>${esc(description)}</small></button>`).join("")}</aside><main class="settings-content">${content}</main></div>`;
    const win=openWindow("settings","Settings",html,{width:1080,height:720});wireEnhancedSettings(win,section);return win;
  }
  function wireEnhancedSettings(win,section){
    win.querySelectorAll("[data-settings-section]").forEach(button=>button.onclick=()=>openEnhancedSettings(button.dataset.settingsSection));
    win.querySelector("#settingsSearch")?.addEventListener("input",event=>{const query=event.target.value.toLowerCase();win.querySelectorAll("[data-settings-section]").forEach(button=>button.hidden=query&&!button.dataset.settingWords.includes(query))});
    win.querySelectorAll("[data-open-app]").forEach(button=>button.onclick=()=>api().openApp(button.dataset.openApp));
    win.querySelectorAll("[data-open-tool]").forEach(button=>button.onclick=()=>({clipboard:window.Gold1S?.openClipboardHistory,elsus:openELSUSStatus}[button.dataset.openTool]?.()));
    const bind=(id,key,type="checkbox")=>{const element=win.querySelector(`#${id}`);if(!element)return;element.addEventListener(type==="range"?"input":"change",()=>setPrefs({[key]:type==="checkbox"?element.checked:type==="number"||type==="range"?Number(element.value):element.value}))};
    [["setNotifications","notifications"],["setFocusAssist","focusAssist"],["setNightLight","nightLight"],["setSingleClick","singleClickOpen"],["setTouchMode","touchMode"],["setKeyboardHints","keyboardHints"],["setMetered","meteredConnection"],["setOfflineFallback","offlineFallback"],["setTransparency","transparency"],["setLabels","showLabels"],["setSmallTaskbar","smallTaskbar"],["setClockSeconds","clockSeconds"],["setGameMode","gameMode"],["setDisableAnimationsGame","disableAnimationsInGameMode"],["setCaptureHints","captureHints"],["setReducedMotion","reducedMotion"],["setHighContrastAuto","highContrastShortcut"],["setLargePointer","largePointerTargets"],["setSearchApps","searchApps"],["setSearchFiles","searchFiles"],["setSearchSettings","searchSettings"],["setSearchHistory","searchHistory"],["setClipboardHistory","clipboardHistory"],["setDiagnostics","optionalDiagnostics"],["setSessionHeartbeat","sessionHeartbeat"]].forEach(([id,key])=>bind(id,key));
    [["setTextScale","textScale","range"],["setAccessTextScale","textScale","range"],["setPointerSpeed","pointerSpeed","range"],["setTheme","theme","select"],["setAccent","accent","select"],["setWallpaper","customWallpaper","select"],["setPowerMode","powerMode","select"],["setSearchMode","searchMode","select"],["setTaskbarPosition","taskbarPosition","select"],["setTimeFormat","timeFormat","select"],["setLocale","locale","select"]].forEach(([id,key,type])=>bind(id,key,type));
    win.querySelectorAll("[data-default-app]").forEach(select=>select.onchange=()=>{const current=prefs().defaultApps||{};setPrefs({defaultApps:{...current,[select.dataset.defaultApp]:select.value}})});
    win.querySelector("#networkTest")?.addEventListener("click",()=>notify("Connection test",navigator.onLine?"Browser network status is online.":"Browser network status is offline.","Settings"));
    win.querySelector("#clearSearchHistory")?.addEventListener("click",()=>{localStorage.removeItem(PREFIX+"search_history");notify("Search history cleared","Local search history was removed.","Settings")});
    win.querySelector("#clearLocalCaches")?.addEventListener("click",()=>{Object.keys(localStorage).filter(key=>/cache|thumbnail|temp/i.test(key)).forEach(key=>localStorage.removeItem(key));notify("Caches cleared","Replaceable caches were removed.","Settings")});
    const file=win.querySelector("#logoFile"),select=win.querySelector("#logoAppSelect");
    win.querySelector("#logoChoose")?.addEventListener("click",()=>file.click());
    file?.addEventListener("change",async()=>{try{setCustomLogo(select.value,await readImageFile(file.files[0]));notify("App logo changed",appById(select.value)?.name||select.value,"Settings");openEnhancedSettings("apps")}catch(error){notify("Logo not changed",error.message,"Settings")}});
    win.querySelector("#logoReset")?.addEventListener("click",()=>{setCustomLogo(select.value,null);openEnhancedSettings("apps")});
    win.querySelector("#logoResetAll")?.addEventListener("click",()=>{if(confirm("Reset every custom application logo?")){write(CUSTOM_LOGO_KEY,{});refreshShellUI();openEnhancedSettings("apps")}});
    win.querySelector("#openRootELSUS")?.addEventListener("click",()=>location.href="../gold-shell.html?force=1");
  }
  function applyExtendedPrefs(){
    const p=prefs(),body=document.body,taskbar=$("taskbar"),search=$("searchBtn");
    body.classList.toggle("gold1p-night-light",Boolean(p.nightLight));body.classList.toggle("gold1p-no-transparency",p.transparency===false);body.classList.toggle("gold1p-touch",Boolean(p.touchMode));body.classList.toggle("gold1p-game-mode",Boolean(p.gameMode));body.classList.toggle("gold1p-large-targets",Boolean(p.largePointerTargets));body.classList.toggle("no-motion",Boolean(p.reducedMotion||p.gameMode&&p.disableAnimationsInGameMode));body.classList.toggle("taskbar-top",p.taskbarPosition==="top");
    taskbar?.classList.toggle("small-buttons",Boolean(p.smallTaskbar));taskbar?.classList.toggle("hide-labels",p.showLabels===false);
    if(search){const mode=p.searchMode||"box";search.style.display=mode==="hidden"?"none":"";search.classList.toggle("search-wide",mode==="box");search.textContent=mode==="icon"?"⌕":"Type here to search";search.title="Search";}
    document.documentElement.style.setProperty("--pointer-scale",String(Math.max(.7,Math.min(1.5,(Number(p.pointerSpeed)||10)/10))));
    applyCustomLogoDOM();
  }
  function tickEnhancedClock(){const clock=$("clock");if(!clock)return;const p=prefs(),locale=p.locale||"en-US",hour12=p.timeFormat!=="24h",date=new Date();clock.innerHTML=`${date.toLocaleTimeString(locale,{hour:"2-digit",minute:"2-digit",second:p.clockSeconds?"2-digit":undefined,hour12})}<br>${date.toLocaleDateString(locale,{month:"numeric",day:"numeric",year:"numeric"})}`}

  /* ------------------------- Windows 10 virtual desktops ------------------------- */
  function loadVirtualDesktops(){const state=read(VDESK_KEY,{current:1,count:1});currentDesktop=Math.max(1,Number(state.current)||1);desktopCount=Math.max(currentDesktop,Number(state.count)||1)}
  function saveVirtualDesktops(){write(VDESK_KEY,{current:currentDesktop,count:desktopCount,updatedAt:now()})}
  function assignWindowDesktop(win){if(!win.dataset.virtualDesktop)win.dataset.virtualDesktop=String(currentDesktop);applyVirtualDesktopVisibility()}
  function applyVirtualDesktopVisibility(){
    qa(".window").forEach(win=>{const desktop=Number(win.dataset.virtualDesktop||1);win.classList.toggle("virtual-hidden",desktop!==currentDesktop);const task=document.querySelector(`[data-window="${CSS.escape(win.id)}"],#gold1p_task_${CSS.escape(win.id)}`);if(task)task.hidden=desktop!==currentDesktop;});
    enhanceTaskViewDesktops();saveVirtualDesktops();
  }
  function switchVirtualDesktop(number){currentDesktop=Math.max(1,Math.min(desktopCount,Number(number)||1));applyVirtualDesktopVisibility();notify("Virtual desktop",`Desktop ${currentDesktop}`,"Task View")}
  function newVirtualDesktop(){desktopCount+=1;currentDesktop=desktopCount;applyVirtualDesktopVisibility()}
  function closeVirtualDesktop(number=currentDesktop){if(desktopCount<=1)return;qa(`.window[data-virtual-desktop="${number}"]`).forEach(win=>win.dataset.virtualDesktop=String(number===1?2:number-1));desktopCount-=1;if(currentDesktop>desktopCount)currentDesktop=desktopCount;qa(".window").forEach(win=>{const value=Number(win.dataset.virtualDesktop||1);if(value>number)win.dataset.virtualDesktop=String(value-1)});applyVirtualDesktopVisibility()}
  function moveWindowToDesktop(win,number){if(!win)return;win.dataset.virtualDesktop=String(number);applyVirtualDesktopVisibility()}
  function enhanceTaskViewDesktops(){
    const panel=$("taskView");if(!panel||panel.classList.contains("hidden"))return;
    let bar=panel.querySelector(".gold1p-desktop-bar");if(!bar){bar=document.createElement("div");bar.className="gold1p-desktop-bar";panel.prepend(bar)}
    bar.innerHTML=`${Array.from({length:desktopCount},(_,i)=>i+1).map(number=>`<button class="${number===currentDesktop?"active":""}" data-vdesk="${number}">Desktop ${number}</button>`).join("")}<button data-vdesk-new>+ New desktop</button>${desktopCount>1?'<button data-vdesk-close>Close current</button>':""}`;
    bar.querySelectorAll("[data-vdesk]").forEach(button=>button.onclick=()=>switchVirtualDesktop(button.dataset.vdesk));bar.querySelector("[data-vdesk-new]")?.addEventListener("click",newVirtualDesktop);bar.querySelector("[data-vdesk-close]")?.addEventListener("click",()=>closeVirtualDesktop());
    qa("[data-task-window]",panel).forEach(card=>{const win=$(card.dataset.taskWindow);if(win&&Number(win.dataset.virtualDesktop||1)!==currentDesktop)card.hidden=true});
  }
  function initVirtualDesktops(){
    loadVirtualDesktops();qa(".window").forEach(assignWindowDesktop);
    desktopObserver=new MutationObserver(records=>{records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType!==1)return;if(node.matches?.(".window"))assignWindowDesktop(node);node.querySelectorAll?.(".window").forEach(assignWindowDesktop)}));enhanceTaskViewDesktops();applyCustomLogoDOM();});
    desktopObserver.observe(document.body,{childList:true,subtree:true});applyVirtualDesktopVisibility();
    document.addEventListener("keydown",event=>{
      if(event.ctrlKey&&event.metaKey&&event.key.toLowerCase()==="d"){event.preventDefault();newVirtualDesktop();}
      if(event.ctrlKey&&event.metaKey&&event.key==="ArrowRight"){event.preventDefault();switchVirtualDesktop(Math.min(desktopCount,currentDesktop+1));}
      if(event.ctrlKey&&event.metaKey&&event.key==="ArrowLeft"){event.preventDefault();switchVirtualDesktop(Math.max(1,currentDesktop-1));}
      if(event.ctrlKey&&event.metaKey&&event.key==="F4"){event.preventDefault();closeVirtualDesktop();}
      if(event.altKey&&event.shiftKey&&event.key==="PrintScreen"&&prefs().highContrastShortcut!==false){event.preventDefault();setPrefs({theme:prefs().theme==="highcontrast"?"light":"highcontrast"});}
    });
  }

  /* ------------------------- Windows utilities ------------------------- */
  function stickyNotes(){return read(STICKY_KEY,[])}
  function saveStickyNotes(notes){write(STICKY_KEY,notes);window.Gold1S?.saveWorkspaceNow?.(false)}
  function openStickyNotes(){
    const notes=stickyNotes();const html=`<div class="app-shell"><div class="app-toolbar"><button id="stickyNew" class="button primary">New note</button></div><div class="app-body"><div class="gold1p-sticky-grid">${notes.map(note=>`<article class="gold1p-sticky" style="--note-color:${esc(note.color||"#fff2ab")}"><textarea data-sticky-text="${esc(note.id)}">${esc(note.text)}</textarea><div><input type="color" data-sticky-color="${esc(note.id)}" value="${esc(note.color||"#fff2ab")}"><button data-sticky-delete="${esc(note.id)}">Delete</button></div></article>`).join("")||'<p>No sticky notes yet.</p>'}</div></div></div>`;
    const win=openWindow("stickynotes","Sticky Notes",html,{width:850,height:620});
    win.querySelector("#stickyNew").onclick=()=>{saveStickyNotes([{id:uid("note_"),text:"New note",color:"#fff2ab",createdAt:now()},...stickyNotes()]);openStickyNotes()};
    win.querySelectorAll("[data-sticky-text]").forEach(area=>area.oninput=()=>{const list=stickyNotes(),item=list.find(note=>note.id===area.dataset.stickyText);if(item){item.text=area.value;item.updatedAt=now();saveStickyNotes(list)}});
    win.querySelectorAll("[data-sticky-color]").forEach(input=>input.oninput=()=>{const list=stickyNotes(),item=list.find(note=>note.id===input.dataset.stickyColor);if(item){item.color=input.value;saveStickyNotes(list);input.closest(".gold1p-sticky").style.setProperty("--note-color",input.value)}});
    win.querySelectorAll("[data-sticky-delete]").forEach(button=>button.onclick=()=>{if(confirm("Delete this sticky note?")){saveStickyNotes(stickyNotes().filter(note=>note.id!==button.dataset.stickyDelete));openStickyNotes()}});return win;
  }
  function openSnippingTool(){
    const html=`<div class="app-shell"><div class="app-toolbar"><button id="snipNew" class="button primary">New screen capture</button><button id="snipDownload" class="button" disabled>Save PNG</button><button id="snipCopy" class="button" disabled>Copy image</button></div><div class="app-body gold1p-snip-body"><p id="snipStatus">Choose New screen capture, then select a browser tab, window, or screen.</p><canvas id="snipCanvas"></canvas></div></div>`;
    const win=openWindow("snipping","Snipping Tool",html,{width:940,height:680}),canvas=win.querySelector("#snipCanvas"),ctx=canvas.getContext("2d");let hasImage=false;
    win.querySelector("#snipNew").onclick=async()=>{try{if(!navigator.mediaDevices?.getDisplayMedia)throw new Error("Screen capture is not supported by this browser.");const stream=await navigator.mediaDevices.getDisplayMedia({video:true,audio:false}),video=document.createElement("video");video.srcObject=stream;await video.play();await new Promise(resolve=>setTimeout(resolve,150));canvas.width=video.videoWidth;canvas.height=video.videoHeight;ctx.drawImage(video,0,0);stream.getTracks().forEach(track=>track.stop());hasImage=true;win.querySelector("#snipStatus").textContent=`Captured ${canvas.width} × ${canvas.height}`;win.querySelector("#snipDownload").disabled=false;win.querySelector("#snipCopy").disabled=false;}catch(error){notify("Screen capture failed",error.message,"Snipping Tool")}};
    win.querySelector("#snipDownload").onclick=()=>{if(!hasImage)return;const a=document.createElement("a");a.download=`EmeraldOS-Snip-${Date.now()}.png`;a.href=canvas.toDataURL("image/png");a.click()};
    win.querySelector("#snipCopy").onclick=async()=>{if(!hasImage)return;try{const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/png"));await navigator.clipboard.write([new ClipboardItem({"image/png":blob})]);notify("Image copied","The screen capture is on the clipboard.","Snipping Tool")}catch(error){notify("Copy unavailable",error.message,"Snipping Tool")}};return win;
  }
  function openVoiceRecorder(){
    const html=`<div class="app-shell"><div class="app-toolbar"><button id="recordStart" class="button primary">Start recording</button><button id="recordStop" class="button" disabled>Stop</button><button id="recordSave" class="button" disabled>Download recording</button></div><div class="app-body"><div class="gold1p-recorder"><div id="recordTime">00:00</div><p id="recordStatus">Ready</p><audio id="recordPlayback" controls></audio></div></div></div>`;
    const win=openWindow("voicerecorder","Voice Recorder",html,{width:620,height:430});let recorder=null,chunks=[],url="",started=0,timer=null;
    const update=()=>{const seconds=Math.floor((Date.now()-started)/1000);win.querySelector("#recordTime").textContent=`${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`};
    win.querySelector("#recordStart").onclick=async()=>{try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});chunks=[];recorder=new MediaRecorder(stream);recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};recorder.onstop=()=>{stream.getTracks().forEach(track=>track.stop());const blob=new Blob(chunks,{type:recorder.mimeType||"audio/webm"});if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(blob);win.querySelector("#recordPlayback").src=url;win.querySelector("#recordSave").disabled=false;win.querySelector("#recordSave").onclick=()=>{const a=document.createElement("a");a.href=url;a.download=`EmeraldOS-Recording-${Date.now()}.webm`;a.click()};win.querySelector("#recordStatus").textContent="Recording complete"};recorder.start();started=Date.now();timer=setInterval(update,250);win.querySelector("#recordStart").disabled=true;win.querySelector("#recordStop").disabled=false;win.querySelector("#recordStatus").textContent="Recording…"}catch(error){notify("Microphone unavailable",error.message,"Voice Recorder")}};
    win.querySelector("#recordStop").onclick=()=>{if(recorder&&recorder.state!=="inactive")recorder.stop();clearInterval(timer);win.querySelector("#recordStart").disabled=false;win.querySelector("#recordStop").disabled=true};return win;
  }

  /* ------------------------- App registration and API patching ------------------------- */
  function installApps(){
    ensureApp({id:"stickynotes",name:"Sticky Notes",label:"SN",color:"#f5c400",group:"Productivity",desc:"Create persistent desktop notes.",open:openStickyNotes});
    ensureApp({id:"snipping",name:"Snipping Tool",label:"ST",color:"#d13438",group:"Utilities",desc:"Capture and save a browser tab, window, or screen.",open:openSnippingTool});
    ensureApp({id:"voicerecorder",name:"Voice Recorder",label:"VR",color:"#d13438",group:"Utilities",desc:"Record audio with browser microphone permission.",open:openVoiceRecorder});
    ensureApp({id:"elsusstatus",name:"E.L.S.U.S.",label:"ES",color:"#0078d7",group:"System",desc:"View original E.L.S.U.S. update and VM-routing status.",open:openELSUSStatus});
    if(isStaff()){
      ensureApp({id:"staffcenter",name:"Staff Center",label:"SC",color:"#5c2d91",group:"Staff",desc:"Live controls, app verification, sessions, and E.L.S.U.S. administration.",staffOnly:true,open:()=>openStaffCenter("overview")});
      ensureApp({id:"livecontrol",name:"Live Staff Control",label:"LC",color:"#d13438",group:"Staff",desc:"Apply live Gold controls and announcements.",staffOnly:true,open:()=>openStaffCenter("control")});
      ensureApp({id:"appverification",name:"Staff App Verification",label:"AV",color:"#107c10",group:"Staff",desc:"Approve or reject user-created applications.",staffOnly:true,open:()=>openStaffCenter("apps")});
    }
    const replacements={settings:()=>openEnhancedSettings("system"),store:openUserAppStore,developer:openApplicationEditor,updateshell:openEnhancedUpdateCenter};
    Object.entries(replacements).forEach(([id,open])=>{const app=appById(id);if(app)app.open=open});
    syncUserAppRegistry();refreshShellUI();
  }
  function patchOpenApp(){
    const core=api();if(!core)return;
    originalOpenApp=core.openApp.bind(core);
    core.openApp=(id,options={})=>{
      const value=String(id||"");
      if(value==="staffcenter")return openStaffCenter("overview");if(value==="livecontrol")return openStaffCenter("control");if(value==="appverification")return openStaffCenter("apps");
      const reason=appBlockedReason(value);if(reason){notify("Application unavailable",reason,"Live Staff Control");return false;}
      return originalOpenApp(value,options);
    };
    window.Gold1G=core;
    Object.assign(window.Gold1S||{}, {
      openApp:core.openApp,openSettings:openEnhancedSettings,openStaffCenter,openLiveStaffControl:()=>openStaffCenter("control"),openAppVerification:()=>openStaffCenter("apps"),
      openUserAppStore,openApplicationEditor,runVerifiedUserApp:id=>{const app=userApps().find(item=>item.id===id);return app&&launchUserApp(app)},
      openUpdateCenter:openEnhancedUpdateCenter,openELSUSStatus,requestVersionChange,setCustomLogo,customLogos,liveControl:()=>({...liveControl}),elsusState:()=>({...elsusState}),
      virtualDesktops:{switchTo:switchVirtualDesktop,newDesktop:newVirtualDesktop,closeDesktop:closeVirtualDesktop,moveWindow:moveWindowToDesktop,state:()=>({current:currentDesktop,count:desktopCount})}
    });
    window.Gold1S=window.Gold1S||core;
  }
  function patchDeepLinks(){
    const hash=location.hash.slice(1).toLowerCase();
    const map={staff:"staffcenter",staffcenter:"staffcenter",livecontrol:"livecontrol",appverification:"appverification",shell:"elsusstatus",elsus:"elsusstatus",stickynotes:"stickynotes",snipping:"snipping",voicerecorder:"voicerecorder"};
    if(map[hash])setTimeout(()=>api().openApp(map[hash]),900);
  }
  function patchTaskView(){const observer=new MutationObserver(()=>enhanceTaskViewDesktops());const panel=$("taskView");if(panel)observer.observe(panel,{childList:true,subtree:true});$("taskViewBtn")?.addEventListener("click",()=>setTimeout(enhanceTaskViewDesktops,30))}
  function init(){
    document.body.classList.toggle("staff-session",isStaff());
    if(!api()?.APPS){setTimeout(init,50);return;}
    patchOpenApp();installApps();applyExtendedPrefs();initOriginalELSUS();listenLiveStaffControl();listenUserAppReviewUpdates();initVirtualDesktops();patchTaskView();patchDeepLinks();
    sendSessionHeartbeat();sessionTimer=setInterval(()=>{if(prefs().sessionHeartbeat!==false)sendSessionHeartbeat()},60000);
    setInterval(tickEnhancedClock,500);tickEnhancedClock();
    window.addEventListener("online",()=>notify("Network connected","Cloud services can resume.","Network"));window.addEventListener("offline",()=>notify("Working offline","Local VM features remain available.","Network"));
    window.addEventListener("beforeunload",()=>{saveELSUSState();saveVirtualDesktops();controlUnsubscribers.forEach(unsub=>{try{unsub()}catch{}});if(appVerificationUnsubscribe)try{appVerificationUnsubscribe()}catch{}});
    notify("EmeraldOS Gold 1S","E.L.S.U.S., Staff Center, verified user apps, custom logos, and Windows 10 features are ready.","System");
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
