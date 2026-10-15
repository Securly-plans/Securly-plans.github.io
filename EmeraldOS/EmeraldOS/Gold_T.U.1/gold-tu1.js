(() => {
"use strict";
const GOLD_VERSION = "T.U.1";
const GOLD_FOLDER = "Gold_T.U.1";
const IS_TU2 = false;
let shellUser = {username: localStorage.getItem("goldShellUsername") || localStorage.getItem("username") || "Gold User", displayName:"Gold User", role:"user"};
let vm = {owner:shellUser.username, activeVersion:GOLD_VERSION, setup:{complete:false}, preferences:{accent:"#c99a2e", backgroundColor:"#e7edf4", iconSize:84, labels:true}, files:[], notes:[], tickets:[], userApps:[], windows:[], versionHistory:[]};
let z = 100;
let openWins = [];
const $ = id => document.getElementById(id);
const APPS = [
  {id:"welcome", name:"Welcome", icon:"welcome", open:openWelcome},
  {id:"office", name:"Gold Office", icon:"office", open:openOffice},
  {id:"explorer", name:"Explorer", icon:"explorer", open:openExplorer},
  {id:"settings", name:"Settings", icon:"settings", open:openSettings},
  {id:"theme", name:"Theme Studio", icon:"theme", open:openThemeStudio},
  {id:"support", name:"Support", icon:"support", open:openSupport},
  {id:"store", name:"User Appstore", icon:"store", open:openStore},
  {id:"lab", name:"App Lab", icon:"lab", open:openAppLab},
  {id:"vm", name:"VM Center", icon:"vm", open:openVmCenter},
  {id:"cloud", name:"Cloud Sync", icon:"cloud", open:openCloudSync},
  {id:"updates", name:"Updates", icon:"updates", open:openUpdates}
];
function iconSvg(name){
  const map={welcome:"◆",office:"▣",explorer:"▤",settings:"⚙",theme:"◈",support:"?",store:"▥",lab:"</>",vm:"▧",cloud:"☁",updates:"↻",notes:"✎"};
  const text=map[name]||"◆";
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#fff"/><rect x="5" y="5" width="54" height="54" rx="12" fill="#f8fbff" stroke="#c99a2e" stroke-width="3"/><circle cx="48" cy="16" r="7" fill="#c99a2e"/><text x="32" y="39" text-anchor="middle" font-family="Segoe UI,Arial" font-size="18" font-weight="700" fill="#12344d">${text}</text></svg>`)}`;
}
function send(type, payload={}){ try{ parent.postMessage({type, version:GOLD_VERSION, ...payload}, "*"); }catch{} }
function notify(message){
  send("gold-version:notify", {message});
  const t=document.createElement("div");t.className="toast";t.textContent=message;document.body.appendChild(t);setTimeout(()=>t.remove(),2400);
}
function save(reason="change"){
  vm.owner=shellUser.username; vm.activeVersion=GOLD_VERSION; vm.activeFolder=GOLD_FOLDER; vm.savedAt=new Date().toISOString(); vm.saveReason=reason;
  try{ localStorage.setItem(`gold_tu_vm_${shellUser.username}`, JSON.stringify(vm)); }catch{}
  send("gold-version:state", {vmState:vm});
}
function applyPrefs(){
  const p=vm.preferences||{};
  document.documentElement.style.setProperty("--accent", p.accent || "#c99a2e");
  document.documentElement.style.setProperty("--bg", p.backgroundColor || "#e7edf4");
  if(p.backgroundUrl) document.querySelector(".desktop").style.background=`linear-gradient(rgba(240,244,248,.62),rgba(240,244,248,.62)), url(${p.backgroundUrl}) center/cover`; else document.querySelector(".desktop").style.background="";
  renderIcons();
}
function renderIcons(){
  const wrap=$("icons"); if(!wrap) return; wrap.innerHTML="";
  const show = vm.preferences?.desktopApps || APPS.map(a=>a.id);
  APPS.filter(a=>show.includes(a.id)).forEach(app=>{
    const d=document.createElement("button"); d.className="icon"; d.style.width=(vm.preferences?.iconSize||84)+"px"; d.innerHTML=`<img src="${iconSvg(app.icon)}"><span>${app.name}</span>`; d.onclick=app.open; wrap.appendChild(d);
  });
}
function renderStart(){
  const menu=$("startMenu");
  menu.innerHTML=`<h2>EmeraldOS Gold ${GOLD_VERSION}</h2>`;
  APPS.forEach(app=>{ const b=document.createElement("button"); b.textContent=app.name; b.onclick=()=>{menu.classList.add("hidden"); app.open();}; menu.appendChild(b); });
}
function openWindow(title, html, opts={}){
  const w=document.createElement("section"); w.className="window"; w.style.left=(opts.left||80+openWins.length*22)+"px"; w.style.top=(opts.top||64+openWins.length*18)+"px"; w.style.width=(opts.width||650)+"px"; w.style.zIndex=++z;
  w.innerHTML=`<div class="titlebar"><strong>${title}</strong><div class="title-actions"><button data-min>—</button><button data-max>□</button><button data-close>×</button></div></div><div class="content">${html}</div>`;
  $("windows").appendChild(w); openWins.push({title, el:w}); wireWindow(w); renderRunning(); save("window-open"); return w;
}
function wireWindow(w){
  w.addEventListener("mousedown",()=>w.style.zIndex=++z);
  w.querySelector("[data-close]").onclick=()=>{w.remove(); openWins=openWins.filter(x=>x.el!==w); renderRunning(); save("window-close");};
  w.querySelector("[data-min]").onclick=()=>{w.style.display="none"; renderRunning(); save("window-minimize");};
  w.querySelector("[data-max]").onclick=()=>{ if(w.dataset.maxed){w.style.left=w.dataset.l;w.style.top=w.dataset.t;w.style.width=w.dataset.w;w.style.height=w.dataset.h;delete w.dataset.maxed;}else{w.dataset.l=w.style.left;w.dataset.t=w.style.top;w.dataset.w=w.style.width;w.dataset.h=w.style.height;w.style.left="8px";w.style.top="8px";w.style.width="calc(100% - 16px)";w.style.height="calc(100% - 60px)";w.dataset.maxed="1";} };
  const bar=w.querySelector(".titlebar"); let drag=null;
  bar.addEventListener("mousedown",e=>{ if(e.target.tagName==="BUTTON") return; drag={x:e.clientX,y:e.clientY,l:parseInt(w.style.left),t:parseInt(w.style.top)}; });
  document.addEventListener("mousemove",e=>{ if(!drag) return; w.style.left=Math.max(0,drag.l+e.clientX-drag.x)+"px"; w.style.top=Math.max(0,drag.t+e.clientY-drag.y)+"px"; });
  document.addEventListener("mouseup",()=>drag=null);
}
function renderRunning(){
  const r=$("running"); r.innerHTML=""; openWins.forEach(win=>{ const b=document.createElement("button"); b.textContent=win.title; b.onclick=()=>{win.el.style.display="flex"; win.el.style.zIndex=++z;}; r.appendChild(b); });
}
function openWelcome(){
  openWindow("Welcome", `<h2>Welcome to EmeraldOS Gold ${GOLD_VERSION}</h2><p>This test build is loaded through the permanent Gold Shell. Your VM data is owned by the shell and follows you when the shell points to a newer version folder.</p><div class="note">Current folder: <b>${GOLD_FOLDER}</b></div><button onclick="parent.postMessage({type:'gold-version:request-update-check'}, '*')">Check for shell update</button>`, {width:560});
}
function openOffice(){
  openWindow("Gold Office", `<h2>Gold Office</h2><p>Create documents, sheets, slides, and forms that save into the VM profile.</p><div class="toolbar"><button id="docBtn">New document</button><button id="sheetBtn">New sheet</button><button id="slideBtn">New slide deck</button><button id="formBtn">New form</button></div><div id="officeArea"></div>`, {width:760});
  const area=document.getElementById("officeArea");
  document.getElementById("docBtn").onclick=()=>{ area.innerHTML=`<h3>Gold Docs</h3><div class="toolbar"><button onclick="document.execCommand('bold')">Bold</button><button onclick="document.execCommand('italic')">Italic</button><button onclick="document.execCommand('underline')">Underline</button><button onclick="document.execCommand('insertUnorderedList')">List</button><button id="saveDoc">Save</button></div><div class="office-doc" contenteditable="true" id="docEditor"><h1>Untitled document</h1><p>Start writing...</p></div>`; setTimeout(()=>{document.getElementById("saveDoc").onclick=()=>{vm.files.push({type:"doc",name:"Gold document",content:document.getElementById("docEditor").innerHTML,created:new Date().toISOString()});save("office-doc");notify("Document saved to VM.");}},0); };
  document.getElementById("sheetBtn").onclick=()=>{ area.innerHTML=`<h3>Gold Sheets</h3><table class="sheet">${Array.from({length:5},(_,r)=>`<tr>${Array.from({length:4},(_,c)=>`<td><input placeholder="${String.fromCharCode(65+c)}${r+1}"></td>`).join("")}</tr>`).join("")}</table><div class="toolbar"><button id="saveSheet">Save sheet</button></div>`; setTimeout(()=>{document.getElementById("saveSheet").onclick=()=>{vm.files.push({type:"sheet",name:"Gold sheet",created:new Date().toISOString()});save("office-sheet");notify("Sheet saved to VM.");}},0); };
  document.getElementById("slideBtn").onclick=()=>{ area.innerHTML=`<h3>Gold Slides</h3><label class="field">Title<input id="slideTitle" value="Presentation"></label><label class="field">Slide body<textarea id="slideBody">Main idea</textarea></label><button id="saveSlides">Save slides</button>`; setTimeout(()=>{document.getElementById("saveSlides").onclick=()=>{vm.files.push({type:"slides",name:document.getElementById("slideTitle").value,content:document.getElementById("slideBody").value,created:new Date().toISOString()});save("office-slides");notify("Slides saved to VM.");}},0); };
  document.getElementById("formBtn").onclick=()=>{ area.innerHTML=`<h3>Gold Forms</h3><label class="field">Question<input id="formQ" value="What do you need?"></label><button id="saveForm">Save form</button>`; setTimeout(()=>{document.getElementById("saveForm").onclick=()=>{vm.files.push({type:"form",name:"Gold form",content:document.getElementById("formQ").value,created:new Date().toISOString()});save("office-form");notify("Form saved to VM.");}},0); };
}
function openExplorer(){
  const files=(vm.files||[]).map((f,i)=>`<div class="tile"><b>${f.name||'Untitled'}</b><br><span class="pill">${f.type||'file'}</span><p>${(f.content||'').replace(/<[^>]+>/g,'').slice(0,90)}</p><button data-del="${i}">Delete</button></div>`).join("") || `<p>No files yet. Create one in Gold Office.</p>`;
  const w=openWindow("Explorer", `<h2>Explorer</h2><div class="grid">${files}</div>`, {width:700});
  w.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{vm.files.splice(Number(b.dataset.del),1);save("delete-file");w.remove();openExplorer();});
}
function openSettings(){
  const p=vm.preferences||{};
  const w=openWindow("Settings", `<h2>Settings</h2><div class="grid"><label class="field">Accent color<input id="setAccent" type="color" value="${p.accent||'#c99a2e'}"></label><label class="field">Background color<input id="setBg" type="color" value="${p.backgroundColor||'#e7edf4'}"></label><label class="field">Background image URL<input id="setBgUrl" value="${p.backgroundUrl||''}" placeholder="https://..."></label><label class="field">Icon size<input id="setIcon" type="range" min="70" max="120" value="${p.iconSize||84}"></label></div><div class="toolbar"><button id="saveSettings">Apply settings</button><button id="resetSetup">Run setup again</button></div>`, {width:640});
  w.querySelector("#saveSettings").onclick=()=>{vm.preferences.accent=w.querySelector("#setAccent").value;vm.preferences.backgroundColor=w.querySelector("#setBg").value;vm.preferences.backgroundUrl=w.querySelector("#setBgUrl").value;vm.preferences.iconSize=Number(w.querySelector("#setIcon").value);applyPrefs();save("settings");notify("Settings saved.");};
  w.querySelector("#resetSetup").onclick=()=>{vm.setup.complete=false;save("setup-reset");showSetup();};
}
function openThemeStudio(){
  openWindow("Theme Studio", `<h2>Theme Studio</h2><p>Visual controls are stored in the cloud VM profile, not in the version folder.</p><button onclick="document.getElementById('setAccent')?.click()">Open Settings personalization</button><div class="note">Try changing to T.U.2 after customizing. Your colors and files should stay.</div>`, {width:560});
}
function openSupport(){
  const w=openWindow("Support", `<h2>Support Center</h2><label class="field">Category<select id="ticketCat"><option>Update issue</option><option>Setup help</option><option>Files issue</option><option>Other</option></select></label><label class="field">Message<textarea id="ticketText" placeholder="Describe the issue"></textarea></label><button id="submitTicket">Submit ticket</button><h3>My tickets</h3><div id="ticketList"></div>`, {width:650});
  const list=()=>{w.querySelector("#ticketList").innerHTML=(vm.tickets||[]).map(t=>`<div class="tile"><b>${t.category}</b><p>${t.message}</p><span class="pill">${t.status}</span></div>`).join("")||"<p>No tickets yet.</p>";};
  w.querySelector("#submitTicket").onclick=()=>{vm.tickets.unshift({category:w.querySelector("#ticketCat").value,message:w.querySelector("#ticketText").value,status:"Open",created:new Date().toISOString()});save("ticket");list();notify("Support ticket saved.");}; list();
}
function openStore(){
  const apps=(vm.userApps||[]).map(a=>`<div class="tile"><b>${a.name}</b><p>${a.description||''}</p><button onclick="alert('Test app opened: ${a.name}')">Open</button></div>`).join("") || `<p>No user apps installed.</p>`;
  openWindow("User Appstore", `<h2>User Appstore</h2><p>Install JS or packaged test apps. The shell keeps user apps in the cloud VM profile.</p><div class="toolbar"><button id="installDemo">Install demo app</button></div><div class="grid">${apps}</div>`, {width:680}).querySelector("#installDemo").onclick=()=>{vm.userApps.push({name:"Demo Shell App",description:"Installed in ${GOLD_VERSION}",installedAt:new Date().toISOString()});save("install-app");notify("Demo app installed.");};
}
function openAppLab(){
  const w=openWindow("App Lab", `<h2>App Lab</h2><p>Create a small JS-only user app package for testing.</p><label class="field">App name<input id="appName" value="My Gold App"></label><label class="field">Description<input id="appDesc" value="Created in App Lab"></label><label class="field">JavaScript<textarea id="appJs">api.write('&lt;h1&gt;Hello from my app&lt;/h1&gt;');</textarea></label><button id="saveApp">Save to Appstore</button>`, {width:700});
  w.querySelector("#saveApp").onclick=()=>{vm.userApps.push({name:w.querySelector("#appName").value,description:w.querySelector("#appDesc").value,js:w.querySelector("#appJs").value,installedAt:new Date().toISOString()});save("app-lab");notify("App saved to User Appstore.");};
}
function openVmCenter(){
  openWindow("VM Center", `<h2>Gold VM Center</h2><p>The shell stores VM data outside the version folder.</p><div class="grid"><div class="tile"><b>Version</b><p>${GOLD_VERSION}</p></div><div class="tile"><b>Files</b><p>${(vm.files||[]).length}</p></div><div class="tile"><b>User apps</b><p>${(vm.userApps||[]).length}</p></div><div class="tile"><b>Tickets</b><p>${(vm.tickets||[]).length}</p></div></div><div class="toolbar"><button onclick="parent.postMessage({type:'gold-version:state',vmState:window.goldGetState()}, '*')">Save now</button><button onclick="parent.postMessage({type:'gold-version:request-update-check'}, '*')">Check update</button></div>`, {width:650});
}
function openCloudSync(){ openWindow("Cloud Sync", `<h2>Cloud Sync</h2><p>Cloud Sync is handled by the permanent Gold Shell. This version sends state changes to the shell, and the shell saves to Firebase.</p><div class="note">Path: emeraldOSUsers/{username}/goldVM/current</div><button onclick="parent.postMessage({type:'gold-version:state',vmState:window.goldGetState()}, '*')">Send sync now</button>`, {width:560}); }
function openUpdates(){
  const history=(vm.versionHistory||[]).map(h=>`<div class="tile"><b>${h.from} → ${h.to}</b><p>${h.at}</p><span class="pill">${h.folder}</span></div>`).join("")||"<p>No version history yet.</p>";
  openWindow("Updates", `<h2>Updates</h2><p>This version was loaded from <b>${GOLD_FOLDER}</b>.</p>${IS_TU2?'<div class="note"><b>T.U.2 update active.</b> Your shell switched folders without losing VM data.</div>':''}<div class="toolbar"><button onclick="parent.postMessage({type:'gold-version:request-update-check'}, '*')">Check for newer version</button></div><h3>Version history</h3><div class="grid">${history}</div>`, {width:680});
}
function showSetup(){
  const setup=$("setup");
  const updateText=IS_TU2 && vm.updateIntroPending ? `<div class="note"><b>Update complete.</b> Your VM moved into T.U.2. Review the setup options below, then continue to the same desktop.</div>` : "";
  setup.innerHTML=`<div class="setup-card"><h1>Set up EmeraldOS Gold ${GOLD_VERSION}</h1><p>This setup customizes your cloud VM profile. It only needs to be completed once unless you reset it.</p>${updateText}<div class="grid"><label class="field">Display name<input id="setupName" value="${shellUser.displayName||shellUser.username}"></label><label class="field">Accent color<input id="setupAccent" type="color" value="${vm.preferences?.accent||'#c99a2e'}"></label><label class="field">Background color<input id="setupBg" type="color" value="${vm.preferences?.backgroundColor||'#e7edf4'}"></label><label class="field">Desktop icon size<select id="setupIcon"><option value="84">Comfortable</option><option value="72">Compact</option><option value="108">Large</option></select></label></div><div class="toolbar"><button id="finishSetup" class="primary">Finish setup</button><button id="skipSetup">Use defaults</button></div></div>`;
  setup.classList.remove("hidden");
  setup.querySelector("#finishSetup").onclick=finishSetup;
  setup.querySelector("#skipSetup").onclick=finishSetup;
}
function finishSetup(){
  const setup=$("setup");
  const accent=setup.querySelector("#setupAccent")?.value || "#c99a2e";
  const bg=setup.querySelector("#setupBg")?.value || "#e7edf4";
  const icon=Number(setup.querySelector("#setupIcon")?.value || 84);
  shellUser.displayName=setup.querySelector("#setupName")?.value || shellUser.displayName || shellUser.username;
  vm.preferences={...(vm.preferences||{}), accent, backgroundColor:bg, iconSize:icon};
  vm.setup={complete:true, completedAt:new Date().toISOString(), setupVersion:GOLD_VERSION};
  vm.updateIntroPending=false;
  setup.classList.add("hidden"); applyPrefs(); save("setup-complete"); notify("Setup complete. VM profile saved."); openWelcome();
}
function boot(){
  renderIcons(); renderStart(); applyPrefs();
  $("startBtn").onclick=()=>$("startMenu").classList.toggle("hidden");
  $("searchBtn").onclick=()=>openWindow("Search", `<h2>Search</h2><p>Search apps by opening the Start menu. Search across files is planned for a full production build.</p>`, {width:460});
  $("syncBtn").onclick=()=>{save("manual-sync");notify("VM save sent to shell.");};
  $("updateBtn").onclick=()=>send("gold-version:request-update-check");
  $("logoutBtn").onclick=()=>send("gold-version:logout");
  setInterval(()=>$("clock").textContent=new Date().toLocaleTimeString(),1000);
  document.addEventListener("keydown",e=>{ if(e.ctrlKey&&e.altKey&&e.key.toLowerCase()==="s") openSettings(); if(e.ctrlKey&&e.altKey&&e.key.toLowerCase()==="o") openOffice(); if(e.ctrlKey&&e.altKey&&e.key.toLowerCase()==="u") openUpdates(); });
  send("gold-version:ready", {version:GOLD_VERSION});
  setTimeout(()=>{ if(!vm.setup?.complete || (IS_TU2 && vm.updateIntroPending)) showSetup(); else openWelcome(); }, 250);
}
window.addEventListener("message", event=>{
  const msg=event.data||{}; if(msg.type!=="gold-shell:vm-state") return;
  shellUser=msg.user||shellUser;
  vm={...vm,...(msg.vmState||{})};
  vm.activeVersion=GOLD_VERSION; vm.activeFolder=GOLD_FOLDER;
  if(IS_TU2 && vm.previousVersion && vm.previousVersion!==GOLD_VERSION && !vm.tu2Welcomed){vm.updateIntroPending=true;vm.tu2Welcomed=true;}
  applyPrefs();
  const setupEl = document.getElementById("setup");
  if(setupEl && vm.setup?.complete && !(IS_TU2 && vm.updateIntroPending)) setupEl.classList.add("hidden");
  save("loaded-from-shell");
});
window.goldGetState=()=>vm;
window.openWelcome=openWelcome;window.openOffice=openOffice;window.openExplorer=openExplorer;window.openSettings=openSettings;window.openThemeStudio=openThemeStudio;window.openSupport=openSupport;window.openStore=openStore;window.openAppLab=openAppLab;window.openVmCenter=openVmCenter;window.openCloudSync=openCloudSync;window.openUpdates=openUpdates;
boot();
})();
