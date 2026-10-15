"use strict";

/* =========================================================
   EmeraldOS Gold 1.0 Patch 1
   Experience, Settings, Restore, BIOS F12 and App Logic Fixes
========================================================= */
(function(){
  const PREFIX = "gold10_";
  const PATCH = {
    name: "EmeraldOS Gold 1.0 Patch 1",
    cloudPath: "gold10/current",
    workspaceKey: PREFIX + "patch1Workspace",
    patchPrefsKey: PREFIX + "patch1Prefs",
    setupDoneKey: PREFIX + "setupDone",
    prefsKey: PREFIX + "prefs",
    goldPrefsKey: PREFIX + "goldPrefs",
    openAppsKey: PREFIX + "patch1OpenApps",
    startSeenKey: PREFIX + "patch1Loaded"
  };

  const NEEDS_PATCH_SETUP = !localStorage.getItem(PATCH.setupDoneKey);
  if(NEEDS_PATCH_SETUP) localStorage.setItem(PATCH.setupDoneKey, "patch-pending");

  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s ?? "").replace(/[&<>'"]/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[m])); }
  function id(){ return Math.random().toString(36).slice(2,9) + Date.now().toString(36).slice(-4); }
  function now(){ return new Date().toISOString(); }
  function username(){ return localStorage.getItem("username") || "GoldUser"; }
  function readJSON(key, fallback){ try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } }
  function writeJSON(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
  function prefs(){ return readJSON(PATCH.prefsKey, {}); }
  function goldPrefs(){ return readJSON(PATCH.goldPrefsKey, {}); }
  function patchPrefs(){ return readJSON(PATCH.patchPrefsKey, {pinnedPatchApps:["setup","sticky","todo","snip","terminal"], searchSuggestions:true}); }
  function savePatchPrefs(next){ writeJSON(PATCH.patchPrefsKey, {...patchPrefs(), ...next}); }
  function logo(label, cls="blue"){
    return `<div class="app-logo logo-${cls} patch-logo"><span>${esc(label)}</span></div>`;
  }
  function header(label, title, sub, cls="blue"){
    return `<div class="app-shell"><div class="app-header patch-app-header">${logo(label,cls)}<div><h2>${esc(title)}</h2><p>${esc(sub)}</p></div></div>`;
  }
  function end(){ return `</div>`; }
  function notify(title, body, source="Gold Patch"){
    if(window.Gold10 && typeof Gold10.notify === "function") Gold10.notify(title, body, source);
  }
  function openWin(appId, title, html, opts={}){
    if(!window.Gold10 || typeof Gold10.openWindow !== "function") return alert(title + "\n\n" + html.replace(/<[^>]+>/g," "));
    return Gold10.openWindow(appId, title, html, opts);
  }
  function download(filename, content, type="text/plain"){
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([content],{type})); a.download=filename; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),500);
  }

  const PATCH_APPS = [
    {id:"setup", name:"Gold Setup", group:"System", label:"ST", color:"blue", desc:"Run first-boot setup again and choose your Gold workspace style.", open:openGoldSetupPatch},
    {id:"personalization", name:"Personalization", group:"Settings", label:"PR", color:"teal", desc:"Wallpaper, theme, accent, taskbar, Start, icons, and density.", open:openPersonalizationPatch},
    {id:"display", name:"Display", group:"Settings", label:"DP", color:"blue", desc:"Responsive screen mode, icon scale, app size and accessibility options.", open:openDisplayPatch},
    {id:"sticky", name:"Sticky Notes", group:"Built-in Apps", label:"SN", color:"yellow", desc:"Windows 10-style quick notes with autosave.", open:openStickyNotes},
    {id:"todo", name:"Gold To Do", group:"Built-in Apps", label:"TD", color:"green", desc:"Task list with status, due dates and local persistence.", open:openGoldTodo},
    {id:"snip", name:"Snip Board", group:"Built-in Apps", label:"SB", color:"orange", desc:"Capture notes, image placeholders and clipboard snippets.", open:openSnipBoard},
    {id:"voice", name:"Voice Recorder", group:"Built-in Apps", label:"VR", color:"red", desc:"Recording notes and browser audio recording when supported.", open:openVoiceRecorder},
    {id:"terminal", name:"Emerald DOS", group:"System", label:"ED", color:"green", desc:"DOS-like command panel inside Gold.", open:openGoldDOS},
    {id:"tips", name:"Gold Tips", group:"Support", label:"TP", color:"purple", desc:"Helpful tips for Start, Settings, BIOS, restore and apps.", open:openGoldTips}
  ];

  function openPatchApp(appId){
    const app = PATCH_APPS.find(a => a.id === appId || "patch:" + a.id === appId);
    if(app){ trackOpen(app.id); app.open(); return true; }
    return false;
  }

  function trackOpen(appId){
    const list = readJSON(PATCH.openAppsKey, []);
    writeJSON(PATCH.openAppsKey, [appId, ...list.filter(x=>x!==appId)].slice(0,24));
  }

  function installOpenAppPatch(){
    if(!window.Gold10 || Gold10.__patch1OpenApp) return;
    const originalOpenApp = Gold10.openApp;
    Gold10.openApp = function(appId){
      if(openPatchApp(appId)) return;
      if(appId === "settings") return openSettingsPatch();
      if(appId === "restore") return openRestorePatch();
      const result = originalOpenApp.call(Gold10, appId);
      trackOpen(appId);
      return result;
    };
    Gold10.openSettings = openSettingsPatch;
    Gold10.openRestore = openRestorePatch;
    Gold10.openGoldSetupPatch = openGoldSetupPatch;
    Gold10.openPatchApp = openPatchApp;
    Gold10.__patch1OpenApp = true;
  }

  function enhanceStart(){
    const results = $("start-results");
    if(results && !results.dataset.patch1){
      const html = PATCH_APPS.map(a => `<div class="start-result patch-start-result" onclick="Gold10.openPatchApp('${a.id}')">${logo(a.label,a.color)}<div><b>${esc(a.name)}</b><small>${esc(a.group)} — ${esc(a.desc)}</small></div></div>`).join("");
      results.insertAdjacentHTML("afterbegin", html);
      results.dataset.patch1 = "true";
    }
    const tiles = $("start-tiles-grid");
    if(tiles && !tiles.dataset.patch1){
      const pinned = patchPrefs().pinnedPatchApps || [];
      const html = PATCH_APPS.filter(a=>pinned.includes(a.id)).map(a => `<div class="tile patch-tile" onclick="Gold10.openPatchApp('${a.id}')">${logo(a.label,a.color)}<b>${esc(a.name)}</b></div>`).join("");
      tiles.insertAdjacentHTML("afterbegin", html);
      tiles.dataset.patch1 = "true";
    }
  }

  function enhanceDesktop(){
    const desktop = $("desktop");
    if(!desktop || desktop.dataset.patch1) return;
    const pins = patchPrefs().pinnedPatchApps || [];
    const html = PATCH_APPS.filter(a=>pins.includes(a.id)).map(a => `
      <div tabindex="0" class="desktop-icon patch-desktop-icon" ondblclick="Gold10.openPatchApp('${a.id}')" onclick="this.blur()" title="${esc(a.desc)}">
        ${logo(a.label,a.color)}
        <div class="icon-label">${esc(a.name)}</div>
      </div>`).join("");
    desktop.insertAdjacentHTML("beforeend", html);
    desktop.dataset.patch1 = "true";
  }

  function openSettingsPatch(){
    const p = prefs();
    const g = goldPrefs();
    const patch = patchPrefs();
    const desktopIcons = p.desktopIcons || [];
    const allIconIds = ["home","explorer","office","mail","chat","people","store","creator","settings","restore","calculator","notepad","photos","calendar","browser"];
    openWin("settings","Settings",`${header("SE","Settings","Windows 10-style settings with working personalization, system, apps, notifications, restore, BIOS and DOS options.","gray")}
      <div class="settings10-layout">
        <aside class="settings10-sidebar">
          ${["System","Personalization","Apps","Accounts","Time & language","Ease of Access","Privacy","Update & Security","BIOS & DOS"].map((x,i)=>`<button onclick="Gold10Patch1.showSettingsSection(${i})">${esc(x)}</button>`).join("")}
        </aside>
        <section class="settings10-main">
          <div class="settings10-section" data-sec="0"><h3>System</h3><div class="settings-grid">
            <label class="card"><h3>Desktop density</h3><select id="set_density" class="field"><option value="compact">Compact</option><option value="normal">Normal</option><option value="comfortable">Comfortable</option></select></label>
            <label class="card"><h3>Icon size</h3><select id="set_icon_size" class="field"><option value="small">Small</option><option value="normal">Normal</option><option value="large">Large</option></select></label>
            <label class="card"><h3>Taskbar labels</h3><input id="set_taskbar_labels" type="checkbox" ${p.taskbarLabels!==false?"checked":""}> Show taskbar labels</label>
            <label class="card"><h3>Show seconds</h3><input id="set_seconds" type="checkbox" ${p.showSeconds?"checked":""}> Show seconds on clock</label>
          </div></div>
          <div class="settings10-section hidden" data-sec="1"><h3>Personalization</h3><div class="settings-grid">
            <label class="card"><h3>Theme</h3><select id="set_theme" class="field"><option value="light">Gold Light</option><option value="dark">Gold Dark</option><option value="dark-windows">Dark Windows</option><option value="contrast">High Contrast</option></select></label>
            <label class="card"><h3>Accent color</h3><input id="set_accent" type="color" value="${esc(p.accent||'#0078d4')}"></label>
            <label class="card"><h3>Transparency</h3><input id="set_transparency" type="checkbox" ${g.transparency!==false?"checked":""}> Use translucent taskbar and Start</label>
            <label class="card"><h3>Wallpaper</h3><select id="set_wallpaper" class="field"><option value="gold-blue">Gold Blue</option><option value="light-beam">Light Beam</option><option value="emerald-field">Emerald Field</option><option value="plain">Plain Light</option></select></label>
          </div></div>
          <div class="settings10-section hidden" data-sec="2"><h3>Apps and desktop</h3><p class="muted">Choose which core apps appear on the desktop.</p><div class="settings-grid">${allIconIds.map(id=>`<label class="card"><input type="checkbox" class="iconToggle" value="${id}" ${desktopIcons.includes(id)?"checked":""}> <b>${esc(id)}</b></label>`).join("")}</div><h3>Patch apps pinned to desktop</h3><div class="settings-grid">${PATCH_APPS.map(a=>`<label class="card"><input type="checkbox" class="patchIconToggle" value="${a.id}" ${(patch.pinnedPatchApps||[]).includes(a.id)?"checked":""}> ${logo(a.label,a.color)} <b>${esc(a.name)}</b></label>`).join("")}</div></div>
          <div class="settings10-section hidden" data-sec="3"><h3>Accounts</h3><div class="settings-grid"><div class="card"><h3>${esc(username())}</h3><small>Signed-in local/Firebase username</small></div><div class="card"><h3>${esc(username().toLowerCase().replace(/[^a-z0-9._-]/g,'.'))}@gold.mail</h3><small>Gold Mail address</small></div></div></div>
          <div class="settings10-section hidden" data-sec="4"><h3>Time and language</h3><div class="settings-grid"><div class="card"><h3>${new Date().toLocaleTimeString()}</h3><small>Current time</small></div><div class="card"><h3>${new Date().toLocaleDateString()}</h3><small>Current date</small></div><label class="card"><h3>Clock seconds</h3><input id="set_seconds2" type="checkbox" ${p.showSeconds?"checked":""}> Show seconds</label></div></div>
          <div class="settings10-section hidden" data-sec="5"><h3>Ease of Access</h3><div class="settings-grid"><label class="card"><h3>Readable text</h3><input id="set_readable" type="checkbox" ${g.readableText?"checked":""}> Larger text and spacing</label><label class="card"><h3>Reduced motion</h3><input id="set_reduced_motion" type="checkbox" ${g.reducedMotion?"checked":""}> Reduce animations</label><label class="card"><h3>High contrast</h3><button class="btn" onclick="Gold10Patch1.quickContrast()">Use High Contrast</button></label></div></div>
          <div class="settings10-section hidden" data-sec="6"><h3>Privacy</h3><div class="settings-grid"><label class="card"><h3>Notifications</h3><input id="set_notifications" type="checkbox" ${p.notifications!==false?"checked":""}> Allow notifications</label><label class="card"><h3>Focus Assist</h3><input id="set_focus" type="checkbox" ${p.focusAssist?"checked":""}> Hide pop-up notifications</label><label class="card"><h3>Clear local cache</h3><button class="btn danger" onclick="Gold10Patch1.clearSafeCache()">Clear temporary cache</button></label></div></div>
          <div class="settings10-section hidden" data-sec="7"><h3>Update & Security</h3><div class="settings-grid"><div class="card"><h3>Restore Center</h3><button class="btn primary" onclick="Gold10.openApp('restore')">Open Restore Center</button></div><div class="card"><h3>Recovery</h3><button class="btn" onclick="Gold10Patch1.restoreDefaultDesktop()">Restore default desktop</button></div><div class="card"><h3>Setup</h3><button class="btn" onclick="Gold10Patch1.resetSetup()">Run setup next boot</button></div></div></div>
          <div class="settings10-section hidden" data-sec="8"><h3>BIOS & DOS</h3><div class="settings-grid"><div class="card"><h3>Emerald Systems BIOS A1</h3><small>Press F12 during startup or use the button below.</small><button class="btn primary" onclick="location.href='bios.html'">Open BIOS / DOS</button></div><div class="card"><h3>Emerald DOS</h3><small>Open DOS inside Gold without restarting.</small><button class="btn" onclick="Gold10.openPatchApp('terminal')">Open Emerald DOS</button></div></div></div>
          <div class="toolbar settings-actions"><button class="btn primary" onclick="Gold10Patch1.saveSettings()">Apply Settings</button><button class="btn" onclick="Gold10.openPatchApp('personalization')">Open Personalization</button><button class="btn" onclick="Gold10.openPatchApp('setup')">Run Setup</button></div>
        </section>
      </div>${end()}`,{width:1060,height:720});
    setTimeout(()=>{
      const set=(id,v)=>{const el=$(id); if(el) el.value=v;};
      set("set_theme", p.theme || "light"); set("set_density", p.density || "normal"); set("set_icon_size", p.iconSize || "normal"); set("set_wallpaper", g.wallpaper || "gold-blue");
    },30);
  }

  function saveSettingsPatch(){
    const coreIcons = [...document.querySelectorAll(".iconToggle:checked")].map(x=>x.value);
    const patchIcons = [...document.querySelectorAll(".patchIconToggle:checked")].map(x=>x.value);
    const showSeconds = !!($("set_seconds")?.checked || $("set_seconds2")?.checked);
    const nextPrefs = {
      ...prefs(),
      theme: $("set_theme")?.value || "light",
      accent: $("set_accent")?.value || "#0078d4",
      density: $("set_density")?.value || "normal",
      iconSize: $("set_icon_size")?.value || "normal",
      taskbarLabels: !!$("set_taskbar_labels")?.checked,
      showSeconds,
      notifications: !!$("set_notifications")?.checked,
      focusAssist: !!$("set_focus")?.checked,
      desktopIcons: coreIcons.length ? coreIcons : prefs().desktopIcons
    };
    const nextGold = {
      ...goldPrefs(),
      wallpaper: $("set_wallpaper")?.value || "gold-blue",
      transparency: !!$("set_transparency")?.checked,
      readableText: !!$("set_readable")?.checked,
      reducedMotion: !!$("set_reduced_motion")?.checked
    };
    writeJSON(PATCH.prefsKey, nextPrefs);
    writeJSON(PATCH.goldPrefsKey, nextGold);
    savePatchPrefs({pinnedPatchApps:patchIcons});
    notify("Settings applied", "Reloading Gold to apply your Windows 10-style settings.", "Settings");
    setTimeout(()=>location.reload(),500);
  }

  function showSettingsSection(i){
    document.querySelectorAll(".settings10-section").forEach((el,idx)=>el.classList.toggle("hidden",idx!==i));
  }
  function quickContrast(){ const p=prefs(); writeJSON(PATCH.prefsKey,{...p,theme:"contrast"}); location.reload(); }
  function clearSafeCache(){ [PREFIX+"patch1OpenApps"].forEach(k=>localStorage.removeItem(k)); notify("Cache cleared","Temporary Gold cache was cleared.","Settings"); }
  function restoreDefaultDesktop(){ writeJSON(PATCH.prefsKey,{...prefs(),desktopIcons:["home","explorer","office","mail","chat","people","store","creator","settings","restore","calculator","notepad","photos","calendar","browser"]}); savePatchPrefs({pinnedPatchApps:["setup","sticky","todo","snip","terminal"]}); location.reload(); }
  function resetSetup(){ localStorage.removeItem(PATCH.setupDoneKey); notify("Setup reset","Gold setup will run on the next boot.","Settings"); }

  function openPersonalizationPatch(){
    const p=prefs(), g=goldPrefs();
    openWin("patch-personalization","Personalization",`${header("PR","Personalization","Change Gold theme, wallpaper, taskbar, Start menu and desktop appearance.","teal")}
      <div class="settings-grid">
        <label class="card"><h3>Theme</h3><select id="personal_theme" class="field"><option value="light">Gold Light</option><option value="dark">Gold Dark</option><option value="dark-windows">Dark Windows</option><option value="contrast">High Contrast</option></select></label>
        <label class="card"><h3>Accent</h3><input id="personal_accent" type="color" value="${esc(p.accent||'#0078d4')}"></label>
        <label class="card"><h3>Wallpaper</h3><select id="personal_wallpaper" class="field"><option value="gold-blue">Gold Blue</option><option value="light-beam">Light Beam</option><option value="emerald-field">Emerald Field</option><option value="plain">Plain Light</option></select></label>
        <label class="card"><h3>Transparency</h3><input id="personal_transparency" type="checkbox" ${g.transparency!==false?"checked":""}> Use translucent UI</label>
      </div><div class="toolbar"><button class="btn primary" onclick="Gold10Patch1.savePersonalization()">Apply</button><button class="btn" onclick="Gold10.openApp('settings')">All Settings</button></div>${end()}`,{width:850,height:560});
    setTimeout(()=>{ if($("personal_theme")) $("personal_theme").value=p.theme||"light"; if($("personal_wallpaper")) $("personal_wallpaper").value=g.wallpaper||"gold-blue";},30);
  }
  function savePersonalization(){
    writeJSON(PATCH.prefsKey,{...prefs(),theme:$("personal_theme")?.value||"light",accent:$("personal_accent")?.value||"#0078d4"});
    writeJSON(PATCH.goldPrefsKey,{...goldPrefs(),wallpaper:$("personal_wallpaper")?.value||"gold-blue",transparency:!!$("personal_transparency")?.checked});
    notify("Personalization saved","Reloading to apply.","Personalization"); setTimeout(()=>location.reload(),500);
  }
  function openDisplayPatch(){ openWin("patch-display","Display",`${header("DP","Display","Responsive screen mode and accessibility scaling.","blue")}<div class="settings-grid"><div class="card"><h3>Screen</h3><small>${innerWidth} × ${innerHeight}</small></div><div class="card"><h3>Responsive mode</h3><small>${innerWidth<700?'Compact':innerWidth<1100?'Laptop':'Desktop'}</small></div><button class="card" onclick="Gold10.tileWindows()"><h3>Tile windows</h3><small>Arrange all windows.</small></button><button class="card" onclick="Gold10.cascadeWindows()"><h3>Cascade windows</h3><small>Stack open windows.</small></button></div>${end()}`); }

  function openGoldSetupPatch(){
    openWin("patch-setup","Gold Setup",`${header("ST","Welcome to EmeraldOS Gold","Choose a Windows 10-style Gold setup. This can be reopened anytime from Settings.","blue")}
      <div class="gold-setup-grid">
        <div class="gold-step"><b>1. Choose a mode</b><select id="p_setup_mode" class="field"><option value="balanced">Balanced</option><option value="productivity">Productivity</option><option value="creator">Creator</option><option value="simple">Simple</option></select></div>
        <div class="gold-step"><b>2. Theme</b><select id="p_setup_theme" class="field"><option value="light">Gold Light</option><option value="dark">Gold Dark</option><option value="dark-windows">Dark Windows</option></select></div>
        <div class="gold-step"><b>3. Accent</b><input id="p_setup_accent" class="field" type="color" value="#0078d4"></div>
        <div class="gold-step"><b>4. App layout</b><select id="p_setup_apps" class="field"><option value="default">Default apps</option><option value="minimal">Minimal desktop</option><option value="all">Pin more apps</option></select></div>
        <div class="gold-step"><b>5. Restore</b><label><input id="p_setup_restore" type="checkbox" checked> Restore workspace after login.</label></div>
        <div class="gold-step"><b>6. Notifications</b><label><input id="p_setup_notifications" type="checkbox" checked> Use Action Center notifications.</label></div>
      </div>
      <div class="toolbar"><button class="btn primary" onclick="Gold10Patch1.finishSetup()">Finish Setup</button><button class="btn" onclick="Gold10Patch1.setupRecommended()">Recommended</button><button class="btn" onclick="location.href='bios.html'">BIOS / DOS</button></div>${end()}`,{width:900,height:650,multi:true});
  }
  function setupRecommended(){ ["p_setup_theme","p_setup_mode","p_setup_apps"].forEach(id=>{const el=$(id); if(el) el.selectedIndex=0;}); if($("p_setup_theme")) $("p_setup_theme").value="light"; if($("p_setup_accent")) $("p_setup_accent").value="#0078d4"; }
  function finishSetup(){
    const apps = $("p_setup_apps")?.value || "default";
    const icons = apps==="minimal" ? ["home","explorer","office","settings","restore"] : apps==="all" ? ["home","explorer","office","mail","chat","people","store","creator","settings","restore","calculator","notepad","photos","calendar","browser","weather","alarms","feedback"] : ["home","explorer","office","mail","chat","people","store","creator","settings","restore","calculator","notepad","photos","calendar","browser"];
    writeJSON(PATCH.prefsKey,{...prefs(),theme:$("p_setup_theme")?.value||"light",accent:$("p_setup_accent")?.value||"#0078d4",desktopIcons:icons,restoreOnBoot:!!$("p_setup_restore")?.checked,notifications:!!$("p_setup_notifications")?.checked});
    writeJSON(PATCH.goldPrefsKey,{...goldPrefs(),setupComplete:true,layout:$("p_setup_mode")?.value||"balanced"});
    localStorage.setItem(PATCH.setupDoneKey,"true");
    notify("Setup complete","EmeraldOS Gold has been configured.","Gold Setup");
    setTimeout(()=>location.reload(),550);
  }

  function openStickyNotes(){
    const notes = readJSON(PREFIX+"stickyNotes",[{id:id(),title:"Welcome",body:"Use Sticky Notes for quick Gold reminders.",color:"yellow",updated:now()}]);
    openWin("patch-sticky","Sticky Notes",`${header("SN","Sticky Notes","Quick autosaved notes with Windows 10-style cards.","yellow")}
      <div class="toolbar"><input id="sticky_title" class="field" placeholder="Title"><select id="sticky_color" class="field"><option value="yellow">Yellow</option><option value="blue">Blue</option><option value="green">Green</option><option value="pink">Pink</option></select><button class="btn primary" onclick="Gold10Patch1.addSticky()">Add Note</button></div>
      <textarea id="sticky_body" class="editor" placeholder="Write note..."></textarea><div class="sticky-grid">${notes.map(n=>`<div class="sticky ${esc(n.color)}"><h3>${esc(n.title)}</h3><p>${esc(n.body)}</p><small>${esc(new Date(n.updated).toLocaleString())}</small><button class="btn danger" onclick="Gold10Patch1.deleteSticky('${n.id}')">Delete</button></div>`).join("")}</div>${end()}`,{width:880,height:650});
  }
  function addSticky(){ const arr=readJSON(PREFIX+"stickyNotes",[]); arr.unshift({id:id(),title:$("sticky_title")?.value||"Untitled",body:$("sticky_body")?.value||"",color:$("sticky_color")?.value||"yellow",updated:now()}); writeJSON(PREFIX+"stickyNotes",arr); notify("Sticky note added",arr[0].title,"Sticky Notes"); openStickyNotes(); }
  function deleteSticky(noteId){ const arr=readJSON(PREFIX+"stickyNotes",[]).filter(n=>n.id!==noteId); writeJSON(PREFIX+"stickyNotes",arr); openStickyNotes(); }

  function openGoldTodo(){
    const tasks=readJSON(PREFIX+"todo",[{id:id(),text:"Test EmeraldOS Gold Patch 1",due:"",done:false,priority:"Normal"}]);
    openWin("patch-todo","Gold To Do",`${header("TD","Gold To Do","Task lists with working add, complete, delete and filters.","green")}
      <div class="toolbar"><input id="todo_text" class="field" placeholder="Task"><input id="todo_due" class="field" type="date"><select id="todo_priority" class="field"><option>Low</option><option selected>Normal</option><option>High</option></select><button class="btn primary" onclick="Gold10Patch1.addTodo()">Add</button></div>
      <div>${tasks.map(t=>`<div class="list-item"><input type="checkbox" ${t.done?"checked":""} onchange="Gold10Patch1.toggleTodo('${t.id}')"><div style="flex:1"><b style="${t.done?'text-decoration:line-through':''}">${esc(t.text)}</b><small>${esc(t.priority)}${t.due?' · due '+esc(t.due):''}</small></div><button class="btn danger" onclick="Gold10Patch1.deleteTodo('${t.id}')">Delete</button></div>`).join("")||'<div class="notice">No tasks yet.</div>'}</div>${end()}`,{width:820,height:620});
  }
  function addTodo(){ const arr=readJSON(PREFIX+"todo",[]); arr.unshift({id:id(),text:$("todo_text")?.value||"Untitled task",due:$("todo_due")?.value||"",priority:$("todo_priority")?.value||"Normal",done:false}); writeJSON(PREFIX+"todo",arr); openGoldTodo(); }
  function toggleTodo(taskId){ const arr=readJSON(PREFIX+"todo",[]).map(t=>t.id===taskId?{...t,done:!t.done}:t); writeJSON(PREFIX+"todo",arr); openGoldTodo(); }
  function deleteTodo(taskId){ writeJSON(PREFIX+"todo",readJSON(PREFIX+"todo",[]).filter(t=>t.id!==taskId)); openGoldTodo(); }

  function openSnipBoard(){
    const clips=readJSON(PREFIX+"snips",[]);
    openWin("patch-snip","Snip Board",`${header("SB","Snip Board","A lightweight capture board for snippets, screenshots notes and copied text.","orange")}
      <div class="toolbar"><input id="snip_title" class="field" placeholder="Snip title"><button class="btn primary" onclick="Gold10Patch1.addSnip()">Save Snip</button><button class="btn" onclick="Gold10Patch1.exportSnips()">Export</button></div><textarea id="snip_body" class="editor" placeholder="Paste or describe your snip..."></textarea>
      <div class="grid">${clips.map(c=>`<div class="card"><h3>${esc(c.title)}</h3><p>${esc(c.body).slice(0,180)}</p><small>${esc(new Date(c.date).toLocaleString())}</small><button class="btn danger" onclick="Gold10Patch1.deleteSnip('${c.id}')">Delete</button></div>`).join("")||'<div class="notice">No snips saved yet.</div>'}</div>${end()}`);
  }
  function addSnip(){ const arr=readJSON(PREFIX+"snips",[]); arr.unshift({id:id(),title:$("snip_title")?.value||"Untitled snip",body:$("snip_body")?.value||"",date:now()}); writeJSON(PREFIX+"snips",arr); openSnipBoard(); }
  function deleteSnip(snipId){ writeJSON(PREFIX+"snips",readJSON(PREFIX+"snips",[]).filter(x=>x.id!==snipId)); openSnipBoard(); }
  function exportSnips(){ download("gold-snips.json",JSON.stringify(readJSON(PREFIX+"snips",[]),null,2),"application/json"); }

  function openVoiceRecorder(){
    openWin("patch-voice","Voice Recorder",`${header("VR","Voice Recorder","Audio recording when supported, plus reliable recording notes.","red")}
      <div class="toolbar"><button class="btn primary" onclick="Gold10Patch1.startVoiceNote()">Start Recording</button><button class="btn" onclick="Gold10Patch1.stopVoiceNote()">Stop</button><button class="btn" onclick="Gold10Patch1.saveVoiceNote()">Save Note</button></div>
      <textarea id="voice_note" class="editor" placeholder="Recording notes..."></textarea><div id="voice_status" class="notice">Ready. Browser microphone support depends on site permissions and HTTPS.</div>${end()}`);
  }
  let mediaRecorder=null, mediaChunks=[];
  async function startVoiceNote(){
    const status=$("voice_status");
    try{ const stream=await navigator.mediaDevices.getUserMedia({audio:true}); mediaChunks=[]; mediaRecorder=new MediaRecorder(stream); mediaRecorder.ondataavailable=e=>mediaChunks.push(e.data); mediaRecorder.start(); if(status) status.textContent="Recording..."; }
    catch(e){ if(status) status.textContent="Microphone unavailable: "+e.message; }
  }
  function stopVoiceNote(){ if(mediaRecorder && mediaRecorder.state!=="inactive"){ mediaRecorder.stop(); mediaRecorder.stream.getTracks().forEach(t=>t.stop()); const status=$("voice_status"); if(status) status.textContent="Recording stopped. Use Save Note to store notes."; }}
  function saveVoiceNote(){ const arr=readJSON(PREFIX+"voiceNotes",[]); arr.unshift({id:id(),note:$("voice_note")?.value||"Voice note",date:now(),audioChunks:mediaChunks.length}); writeJSON(PREFIX+"voiceNotes",arr); notify("Voice note saved","Saved note metadata locally.","Voice Recorder"); }

  function openGoldDOS(){
    const welcome = "Emerald DOS for Gold\nType HELP, VER, DIR, APPS, SETTINGS, RESTORE, SETUP, CLEAR, TIME, EXIT.";
    openWin("patch-dos","Emerald DOS",`${header("ED","Emerald DOS","Command prompt inside EmeraldOS Gold. Full BIOS/DOS is also available with F12 during startup.","green")}
      <div id="dos_screen" class="dos-screen">${esc(welcome)}</div><div class="cmd dos-cmd"><span>EDS&gt;</span><input id="dos_cmd" class="field" autofocus onkeydown="if(event.key==='Enter'){Gold10Patch1.runDOS(this.value);this.value=''}"></div>${end()}`,{width:820,height:560});
  }
  function runDOS(raw){ const cmd=String(raw||"").trim().toLowerCase(); const s=$("dos_screen"); if(!s||!cmd) return; const write=t=>{s.textContent += "\n" + t; s.scrollTop=s.scrollHeight;}; write("EDS> "+cmd); switch(cmd){case "help": write("Commands: HELP, VER, DIR, APPS, SETTINGS, RESTORE, SETUP, BIOS, CLEAR, TIME, EXIT"); break; case "ver": write("Emerald Systems BIOS A1\nEmerald DOS for Gold\nEmeraldOS Gold 1.0 Patch 1"); break; case "dir": write("OS.HTML\nGOLD10.JS\nGOLD10-PATCH1.JS\nGOLD10.CSS\nGOLD10-PATCH1.CSS\nBIOS.HTML"); break; case "apps": Gold10.openApp("store"); write("Opening Store."); break; case "settings": Gold10.openApp("settings"); write("Opening Settings."); break; case "restore": Gold10.openApp("restore"); write("Opening Restore Center."); break; case "setup": Gold10.openPatchApp("setup"); write("Opening Setup."); break; case "bios": location.href="bios.html"; break; case "clear": s.textContent=""; break; case "time": write(new Date().toString()); break; case "exit": Gold10.closeWindow(document.querySelector(".win.active")?.id || ""); break; default: write("Bad command or file name. Type HELP."); }}

  function openGoldTips(){
    openWin("patch-tips","Gold Tips",`${header("TP","Gold Tips","Quick help for the improved Gold experience.","purple")}<div class="grid">
      ${[
        ["F12 during startup","Opens Emerald Systems BIOS A1 and Emerald DOS options."],
        ["Settings","Use Settings to customize theme, desktop icons, patch apps, taskbar, notifications and recovery."],
        ["Restore Center","Save a full workspace locally or to Firebase, then restore on another device."],
        ["Start menu","Search apps and use tile-style pinned apps like a Windows 10-inspired desktop."],
        ["Action Center","Unread notifications stay in the taskbar button until cleared."],
        ["DOS","Open Emerald DOS inside Gold or from the BIOS page."]
      ].map(([t,b])=>`<div class="card"><h3>${esc(t)}</h3><small>${esc(b)}</small></div>`).join("")}</div>${end()}`);
  }

  function collectFullWorkspace(){
    const keys = Object.keys(localStorage).filter(k => k.startsWith(PREFIX) || ["username","loggedIn","role"].includes(k));
    const data = {product:PATCH.name, savedAt:now(), username:username(), localStorage:{}, patchOpenApps:readJSON(PATCH.openAppsKey,[])};
    keys.forEach(k => data.localStorage[k] = localStorage.getItem(k));
    data.windowTitles = [...document.querySelectorAll(".win .titlebar-title")].map(x=>x.textContent).slice(0,30);
    return data;
  }
  function applyFullWorkspace(data, reopen=true){
    if(!data || !data.localStorage) throw new Error("Invalid Gold workspace backup.");
    Object.entries(data.localStorage).forEach(([k,v])=>localStorage.setItem(k,v));
    localStorage.setItem(PREFIX+"lastPatchRestore", now());
    notify("Workspace restored", "Gold workspace data was restored.", "Restore Center");
    if(reopen){
      setTimeout(()=>{
        const apps = data.patchOpenApps || readJSON(PATCH.openAppsKey,[]);
        apps.slice(0,5).reverse().forEach(appId=>{ try{ Gold10.openApp(appId); }catch{} });
      },350);
    }
  }
  async function getFirebase(){ try{return await import("./firebase.js");}catch{return null;} }
  async function saveWorkspacePatch(show=true){
    const data=collectFullWorkspace();
    writeJSON(PATCH.workspaceKey,data);
    localStorage.setItem(PREFIX+"lastPatchSave", now());
    const sync=$("sync-button"); if(sync) sync.textContent="Saving";
    const fb=await getFirebase();
    if(fb?.db && fb?.doc && fb?.setDoc){
      try{ await fb.setDoc(fb.doc(fb.db,"emeraldOSUsers",username(),"gold10","current"),data,{merge:true}); if(sync) sync.textContent="Synced"; if(show) notify("Workspace saved","Saved locally and to Firebase.","Restore Center"); return true; }
      catch(e){ if(sync) sync.textContent="Local"; if(show) notify("Cloud save failed","Saved locally only: "+e.message,"Restore Center"); }
    }
    if(sync) sync.textContent="Local";
    if(show) notify("Workspace saved","Saved locally. Firebase was not available.","Restore Center");
    return false;
  }
  async function restoreCloudPatch(){
    const fb=await getFirebase();
    if(fb?.db && fb?.doc && fb?.getDoc){
      try{ const snap=await fb.getDoc(fb.doc(fb.db,"emeraldOSUsers",username(),"gold10","current")); if(snap.exists()){applyFullWorkspace(snap.data()); return true;} notify("No cloud workspace","No cloud workspace was found.","Restore Center"); }
      catch(e){ notify("Cloud restore failed",e.message,"Restore Center"); }
    } else notify("Firebase unavailable","Could not import firebase.js.","Restore Center");
    return false;
  }
  function restoreLocalPatch(){ const data=readJSON(PATCH.workspaceKey,null) || readJSON(PREFIX+"lastWorkspace",null); if(data){ applyFullWorkspace(data); } else notify("No local workspace","Nothing has been saved yet.","Restore Center"); }
  function openRestorePatch(){
    const lastSave = localStorage.getItem(PREFIX+"lastPatchSave") || "Not saved yet";
    const lastRestore = localStorage.getItem(PREFIX+"lastPatchRestore") || "Not restored yet";
    openWin("restore","Restore Center",`${header("RS","Restore Center","Improved workspace restore with local backup, Firebase cloud save, import/export and app reopening.","teal")}
      <div class="grid"><div class="card"><h3>Last saved</h3><small>${esc(lastSave)}</small></div><div class="card"><h3>Last restored</h3><small>${esc(lastRestore)}</small></div><div class="card"><h3>Cloud path</h3><small>emeraldOSUsers/${esc(username())}/gold10/current</small></div><div class="card"><h3>Tracked apps</h3><small>${readJSON(PATCH.openAppsKey,[]).slice(0,6).join(', ') || 'None yet'}</small></div></div>
      <div class="toolbar"><button class="btn primary" onclick="Gold10Patch1.saveWorkspace()">Save Workspace Now</button><button class="btn" onclick="Gold10Patch1.restoreCloud()">Restore from Cloud</button><button class="btn" onclick="Gold10Patch1.restoreLocal()">Restore Local</button><button class="btn" onclick="Gold10Patch1.exportWorkspace()">Export Backup</button><button class="btn" onclick="Gold10Patch1.importWorkspace()">Import Backup</button><button class="btn" onclick="Gold10Patch1.reopenTrackedApps()">Reopen Tracked Apps</button><button class="btn danger" onclick="Gold10Patch1.factoryResetConfirm()">Factory Reset</button></div>
      <p class="notice">Patch 1 stores the full Gold local workspace and can reopen recently used apps after restore.</p>${end()}`,{width:920,height:610});
  }
  function exportWorkspace(){ download("emeraldos-gold-patch1-workspace.json",JSON.stringify(collectFullWorkspace(),null,2),"application/json"); }
  function importWorkspace(){ const text=prompt("Paste Gold workspace backup JSON"); if(!text) return; try{applyFullWorkspace(JSON.parse(text));}catch(e){alert("Invalid backup: "+e.message);} }
  function reopenTrackedApps(){ readJSON(PATCH.openAppsKey,[]).slice(0,6).reverse().forEach(x=>{try{Gold10.openApp(x)}catch{}}); }
  function factoryResetConfirm(){ if(confirm("Reset EmeraldOS Gold local data? This cannot be undone.")){ Object.keys(localStorage).filter(k=>k.startsWith(PREFIX)).forEach(k=>localStorage.removeItem(k)); location.reload(); } }

  function installBootMenu(){
    window.Gold10BootMenu = function(){
      if($("gold-boot-menu")) return;
      const d=document.createElement("div"); d.id="gold-boot-menu"; d.innerHTML=`<div class="boot-menu-card"><h1>Emerald Systems BIOS A1</h1><p>Startup options</p><button onclick="location.href='bios.html'">Open BIOS / Emerald DOS</button><button onclick="document.getElementById('gold-boot-menu').remove()">Continue Boot</button><button onclick="localStorage.removeItem('gold10_setupDone');location.reload()">Run First Boot Setup</button></div>`; document.body.appendChild(d);
    };
  }

  function install(){
    installOpenAppPatch(); installBootMenu(); enhanceStart(); enhanceDesktop();
    const originalRenderStart = Gold10.renderStart;
    if(!Gold10.__patch1RenderStart){
      Gold10.renderStart = function(q){ const r=originalRenderStart.call(Gold10,q); setTimeout(enhanceStart,0); return r; };
      Gold10.__patch1RenderStart = true;
    }
    Gold10.saveWorkspaceNow = () => saveWorkspacePatch(true);
    Gold10.saveWorkspace = saveWorkspacePatch;
    Gold10.loadCloudWorkspace = restoreCloudPatch;
    Gold10.loadLocalWorkspace = restoreLocalPatch;
    setTimeout(()=>{
      enhanceStart(); enhanceDesktop();
      if(localStorage.getItem(PATCH.setupDoneKey)==="patch-pending") openGoldSetupPatch();
      if(!localStorage.getItem(PATCH.startSeenKey)){localStorage.setItem(PATCH.startSeenKey,"true"); notify("Gold Patch 1 loaded","Settings, restore, startup and built-in app fixes are active.","System");}
    },900);
  }

  window.Gold10Patch1 = {
    PATCH, PATCH_APPS, showSettingsSection, saveSettings:saveSettingsPatch, quickContrast, clearSafeCache, restoreDefaultDesktop, resetSetup,
    savePersonalization, openGoldSetupPatch, setupRecommended, finishSetup, addSticky, deleteSticky, addTodo, toggleTodo, deleteTodo,
    addSnip, deleteSnip, exportSnips, startVoiceNote, stopVoiceNote, saveVoiceNote, runDOS,
    saveWorkspace:()=>saveWorkspacePatch(true), restoreCloud:restoreCloudPatch, restoreLocal:restoreLocalPatch, exportWorkspace, importWorkspace, reopenTrackedApps, factoryResetConfirm
  };

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", install); else install();
})();
