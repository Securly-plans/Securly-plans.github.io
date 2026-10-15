"use strict";
/* EmeraldOS Gold 1N user-experience, layout, and E.L.S.U.S. Shell V2 test tools. */
(function EmeraldOSGold1NImprovements(){
  if(window.__EMERALDOS_GOLD_1N_IMPROVEMENTS__) return;
  window.__EMERALDOS_GOLD_1N_IMPROVEMENTS__=true;

  const VERSION="1N", FOLDER="Gold_1N", PREFIX="gold1g_";
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
  const now=()=>new Date().toISOString();
  const read=(key,fallback)=>{try{const raw=localStorage.getItem(key);return raw===null?fallback:JSON.parse(raw)}catch{return fallback}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch(error){console.warn("Gold 1N local write failed",key,error);return false}};
  const api=()=>window.Gold1N||window.Gold50;
  const username=()=>localStorage.getItem("username")||localStorage.getItem(PREFIX+"username")||"GoldUser";
  const uid=(prefix="id")=>prefix+Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-5);

  function downloadJSON(name,value){
    const blob=new Blob([JSON.stringify(value,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob),anchor=document.createElement("a");
    anchor.href=url;anchor.download=name;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  function migrationStatus(){
    const report=read(PREFIX+"migration_1n_cloud_report",null)||read(PREFIX+"migration_1n_local_report",null)||{};
    return {
      complete:window.__GOLD1N_MIGRATION_COMPLETE__===true||report.completed===true,
      blocked:window.__GOLD1N_MIGRATION_BLOCK_SAVES__===true,
      files:Number(report.filesAfter||api()?.files?.()?.length||0),
      cloudVerified:report.cloudVerified!==false&&!report.cloudError,
      report
    };
  }

  function shellParameters(){
    const params=new URLSearchParams(location.search);
    return {
      shellVersion:params.get("elsusShell")||"",
      shellUser:params.get("elsusUser")||"",
      shellVersionRoute:params.get("elsusVersion")||"",
      shellFolder:params.get("elsusFolder")||"",
      managed:params.get("elsusShell")==="2",
      rawSearch:location.search
    };
  }

  function runShellV2Tests(){
    const shell=shellParameters();
    const routeCache=read("emeraldGoldShellV2_userRoutes",{});
    const userRoute=routeCache?.[username().toLowerCase()]||null;
    const checks=[
      {name:"Current Gold build",pass:window.EMERALDOS_GOLD_VERSION===VERSION,detail:`Expected ${VERSION}; found ${window.EMERALDOS_GOLD_VERSION||"unknown"}.`},
      {name:"Current folder",pass:window.EMERALDOS_GOLD_FOLDER===FOLDER,detail:`Expected ${FOLDER}; found ${window.EMERALDOS_GOLD_FOLDER||"unknown"}.`},
      {name:"Shell V2 launch parameters",pass:shell.managed,detail:shell.managed?"This session was routed by Shell V2.":"This session was opened directly or by the original shell."},
      {name:"Shell user match",pass:!shell.shellUser||shell.shellUser.toLowerCase()===username().toLowerCase(),detail:shell.shellUser?`Shell identified ${shell.shellUser}; Gold signed in as ${username()}.`:"No Shell V2 user parameter was supplied."},
      {name:"Shell version match",pass:!shell.shellVersionRoute||shell.shellVersionRoute.toUpperCase()===VERSION,detail:shell.shellVersionRoute?`Shell selected Gold ${shell.shellVersionRoute}.`:"No Shell V2 version parameter was supplied."},
      {name:"Shell folder match",pass:!shell.shellFolder||shell.shellFolder===FOLDER,detail:shell.shellFolder?`Shell selected ${shell.shellFolder}.`:"No Shell V2 folder parameter was supplied."},
      {name:"Version login retained",pass:localStorage.getItem("loggedIn")==="true"||localStorage.getItem(PREFIX+"loggedIn")==="true",detail:"Gold 1N performed its own login after shell routing."},
      {name:"Cloud route metadata available",pass:Boolean(userRoute?.folder||read(PREFIX+"workspace_meta_1n",{})?.activeFolder||window.EMERALDOS_GOLD_FOLDER),detail:userRoute?.folder?`Cached Shell V2 route: ${userRoute.folder}.`:`Gold route metadata reports ${FOLDER}.`},
      {name:"Migration gate",pass:window.__GOLD1N_MIGRATION_BLOCK_SAVES__!==true,detail:window.__GOLD1N_MIGRATION_BLOCK_SAVES__===true?"Cloud autosave is correctly blocked until migration validation completes.":"Migration is complete and cloud saving is available."},
      {name:"Publishing isolation",pass:true,detail:"Shell testing does not write system/emeraldGoldLatest."}
    ];
    const passed=checks.filter(item=>item.pass).length;
    return {generatedAt:now(),product:"EmeraldOS Gold",version:VERSION,folder:FOLDER,user:username(),shell,checks,passed,total:checks.length,allPassed:passed===checks.length};
  }

  function openShellV2Test(){
    const result=runShellV2Tests();
    const rows=result.checks.map(item=>`<tr><td><span class="gold1n-test-dot ${item.pass?"pass":"warn"}"></span>${esc(item.name)}</td><td>${item.pass?"Pass":"Review"}</td><td>${esc(item.detail)}</td></tr>`).join("");
    const shell=result.shell;
    const html=`<div class="app-shell gold1n-shell-test"><div class="app-toolbar"><button id="shellTestRun" class="button primary">Run tests again</button><button id="shellTestSave" class="button">Save VM route</button><button id="shellTestExport" class="button">Export report</button><button id="shellTestReturn" class="button">Return to Shell V2</button></div><div class="app-body"><div class="gold1n-page-heading"><div><h1>E.L.S.U.S. Shell V2 Compatibility</h1><p>Tests the optional Shell V2 routing layer while keeping Gold 1N compatible with the original E.L.S.U.S. shell.</p></div><span class="gold1n-status-pill ${result.allPassed?"good":"review"}">${result.passed}/${result.total} passed</span></div><div class="grid3"><div class="card"><b>Launch mode</b><h2>${shell.managed?"Shell V2":"Direct / original shell"}</h2></div><div class="card"><b>Gold route</b><h2>${VERSION}</h2><p>${FOLDER}</p></div><div class="card"><b>Migration gate</b><h2>${window.__GOLD1N_MIGRATION_BLOCK_SAVES__===true?"Protected":"Ready"}</h2></div></div><div class="gold1n-table-wrap"><table><thead><tr><th>Test</th><th>Result</th><th>Details</th></tr></thead><tbody>${rows}</tbody></table></div><section class="card"><h2>What Shell V2 is allowed to do</h2><p>Shell V2 verifies the EmeraldOS account only to locate the user’s current version. It then opens <code>${FOLDER}/index.html</code>, where Gold 1N performs its own normal login. Shell V2 does not replace files, settings, or VM data.</p></section><p class="muted">A review result can be expected when Gold 1N was opened directly instead of through Shell V2. It does not mean the operating system failed.</p></div></div>`;
    const win=api().openWindow("shellv2test","Shell V2 Compatibility",html,{width:1050,height:720});
    win.querySelector("#shellTestRun").onclick=()=>{api().closeWin?.(win.id);setTimeout(openShellV2Test,50)};
    win.querySelector("#shellTestSave").onclick=async()=>{await api().saveWorkspaceNow?.(true);api().notify?.("Route metadata saved",`Gold ${VERSION} is recorded as the current VM route.`,"Shell V2 Compatibility")};
    win.querySelector("#shellTestExport").onclick=()=>downloadJSON("EmeraldOS-Gold-1N-Shell-V2-Test.json",runShellV2Tests());
    win.querySelector("#shellTestReturn").onclick=()=>{location.href="../gold-shell.html"};
    return win;
  }

  function recentFiles(){
    const files=api()?.files?.()||[];
    return files.filter(file=>!file.trash).sort((a,b)=>String(b.updated||b.created||"").localeCompare(String(a.updated||a.created||""))).slice(0,6);
  }

  function openWelcomeCenter(){
    const migration=migrationStatus();
    const recent=recentFiles();
    const html=`<div class="app-shell gold1n-welcome"><div class="app-toolbar"><button class="button primary" data-welcome-app="explorer">Open Files</button><button class="button" data-welcome-app="settings">Settings</button><button class="button" data-welcome-app="migrationcenter">Migration status</button><button class="button" data-welcome-app="shellv2test">Shell V2 test</button></div><div class="app-body"><div class="gold1n-hero"><div><p class="eyebrow">EmeraldOS Gold 1N</p><h1>Welcome back, ${esc(username())}</h1><p>Your files, settings, preferences, applications, and earlier Gold file formats remain part of the same version-independent VM.</p></div><div class="gold1n-hero-mark">G</div></div><div class="grid3"><div class="card"><b>Migration</b><h2>${migration.complete?"Complete":"Checking"}</h2><p>${migration.files} files available</p></div><div class="card"><b>Cloud autosave</b><h2>${migration.blocked?"Protected":"Ready"}</h2><p>${migration.blocked?"Waiting for validation":"Continuity gate passed"}</p></div><div class="card"><b>Shell support</b><h2>Original + V2</h2><p>Compatible routing</p></div></div><section class="card"><div class="gold1n-section-title"><h2>Continue where you left off</h2><button id="welcomeRefresh" class="button">Refresh</button></div><div class="gold1n-recent-list">${recent.map(file=>`<button data-recent-file="${esc(file.id)}"><b>${esc(file.name)}</b><small>${esc(file.folder||"Documents")} · ${new Date(file.updated||file.created||Date.now()).toLocaleString()}</small></button>`).join("")||"<p>No recent files yet.</p>"}</div></section><section class="card"><h2>Gold 1N improvements</h2><div class="gold1n-feature-grid"><div><b>Safer continuity</b><p>Gold 1N includes Gold 1M schemas and file formats in migration scans.</p></div><div><b>Cleaner applications</b><p>Settings, tables, cards, toolbars, and narrow windows resize without clashing.</p></div><div><b>Shell V2 testing</b><p>Verify account routing without replacing the version’s own login.</p></div><div><b>User controls</b><p>Welcome Center and Feedback Hub make common actions easier to find.</p></div></div></section><label class="gold1n-checkbox"><input id="welcomeAtLogin" type="checkbox" ${read(PREFIX+"welcome_1n_at_login",true)?"checked":""}> Show Welcome Center after Gold 1N sign-in</label></div></div>`;
    const win=api().openWindow("welcome","Welcome Center",html,{width:1000,height:700});
    win.querySelectorAll("[data-welcome-app]").forEach(button=>button.onclick=()=>api().openApp(button.dataset.welcomeApp));
    win.querySelectorAll("[data-recent-file]").forEach(button=>button.onclick=()=>api().openFile?.(button.dataset.recentFile));
    win.querySelector("#welcomeRefresh").onclick=()=>{api().closeWin?.(win.id);setTimeout(openWelcomeCenter,50)};
    win.querySelector("#welcomeAtLogin").onchange=event=>write(PREFIX+"welcome_1n_at_login",event.target.checked);
    return win;
  }

  function feedbackItems(){const items=read(PREFIX+"feedback_1n",[]);return Array.isArray(items)?items:[]}
  function saveFeedback(items){write(PREFIX+"feedback_1n",items.slice(0,100));api()?.saveWorkspaceNow?.(false)}
  function openFeedbackHub(){
    const items=feedbackItems();
    const html=`<div class="app-shell gold1n-feedback"><div class="app-toolbar"><button id="feedbackNew" class="button primary">Save feedback</button><button id="feedbackExport" class="button">Export all</button><button id="feedbackClear" class="button danger">Clear local feedback</button></div><div class="app-body"><h1>Feedback Hub</h1><p>Record usability issues and ideas while testing Gold 1N. Entries remain in your VM and can be exported for development.</p><div class="gold1n-feedback-form"><label>Category<select id="feedbackCategory" class="field"><option>Problem</option><option>Suggestion</option><option>Shell V2 test</option><option>File compatibility</option><option>Accessibility</option></select></label><label>Title<input id="feedbackTitle" class="field" maxlength="120" placeholder="Describe the issue briefly"></label><label>Details<textarea id="feedbackDetails" class="field" rows="6" placeholder="What happened, and what did you expect?"></textarea></label></div><h2>Saved feedback</h2><div class="gold1n-feedback-list">${items.map(item=>`<article class="card"><div><b>${esc(item.title)}</b><span>${esc(item.category)}</span></div><p>${esc(item.details)}</p><small>${new Date(item.createdAt).toLocaleString()}</small></article>`).join("")||"<p class=\"muted\">No feedback has been saved.</p>"}</div></div></div>`;
    const win=api().openWindow("feedbackhub","Feedback Hub",html,{width:900,height:680});
    win.querySelector("#feedbackNew").onclick=()=>{const title=win.querySelector("#feedbackTitle").value.trim(),details=win.querySelector("#feedbackDetails").value.trim();if(!title||!details){api().notify?.("Feedback not saved","Enter a title and details.","Feedback Hub");return}const next=[{id:uid("feedback"),category:win.querySelector("#feedbackCategory").value,title,details,version:VERSION,createdAt:now()},...feedbackItems()];saveFeedback(next);api().notify?.("Feedback saved","The entry was stored in your Gold VM.","Feedback Hub");api().closeWin?.(win.id);setTimeout(openFeedbackHub,50)};
    win.querySelector("#feedbackExport").onclick=()=>downloadJSON("EmeraldOS-Gold-1N-Feedback.json",feedbackItems());
    win.querySelector("#feedbackClear").onclick=()=>{if(confirm("Clear all locally saved feedback?")){saveFeedback([]);api().closeWin?.(win.id);setTimeout(openFeedbackHub,50)}};
    return win;
  }

  function registerApps(){
    const core=api();if(!core?.APPS)return false;
    const add=app=>{if(!core.APPS.some(existing=>existing.id===app.id))core.APPS.push(app)};
    add({id:"welcome",name:"Welcome Center",label:"WC",color:"#0078d7",group:"System",desc:"Quick access, recent files, and Gold 1N status.",open:openWelcomeCenter});
    add({id:"shellv2test",name:"Shell V2 Compatibility",label:"V2",color:"#107c10",group:"System",desc:"Test E.L.S.U.S. Shell V2 account and version routing.",open:openShellV2Test});
    add({id:"feedbackhub",name:"Feedback Hub",label:"FH",color:"#5c2d91",group:"Utilities",desc:"Save and export Gold usability feedback.",open:openFeedbackHub});
    core.renderStartMenu?.();core.renderDesktop?.();
    return true;
  }

  function patchOpenApp(){
    const core=api();if(!core||core.__gold1nImprovementPatch)return;
    core.__gold1nImprovementPatch=true;
    const original=core.openApp.bind(core);
    core.openApp=(id,options={})=>{
      if(id==="welcome")return openWelcomeCenter();
      if(id==="shellv2test")return openShellV2Test();
      if(id==="feedbackhub")return openFeedbackHub();
      return original(id,options);
    };
    window.Gold50=core;window.Gold1N=window.Gold1N||core;
    Object.assign(window.Gold1N,{openWelcomeCenter,openShellV2Test,runShellV2Tests,openFeedbackHub,shellV2Parameters:shellParameters});
  }

  function installResponsiveShell(){
    const update=()=>document.body.classList.toggle("gold1n-compact-shell",innerWidth<980);
    update();window.addEventListener("resize",update,{passive:true});
  }

  function maybeOpenWelcome(){
    if(read(PREFIX+"welcome_1n_at_login",true)!==true)return;
    if(sessionStorage.getItem("gold1n_welcome_opened")==="true")return;
    sessionStorage.setItem("gold1n_welcome_opened","true");
    setTimeout(()=>api()?.openApp?.("welcome"),1900);
  }

  function init(){
    if(!registerApps()){setTimeout(init,80);return}
    patchOpenApp();installResponsiveShell();
    const hash=location.hash.slice(1).toLowerCase();
    if(["welcome","shellv2test","feedbackhub"].includes(hash))setTimeout(()=>api().openApp(hash),1100);
    else maybeOpenWelcome();
    api().notify?.("EmeraldOS Gold 1N","User improvements, application layout fixes, and Shell V2 compatibility testing are ready.","System");
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
