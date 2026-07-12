"use strict";

/* =========================================================
   EmeraldOS Gold 1.1
   Staff Edition, personalization, lighter Windows-10-inspired UI, and app logic
========================================================= */
(function(){
  const PREFIX = "gold10_";
  const BUILD = {
    name: "EmeraldOS Gold 1.1",
    version: "1.1",
    cloudPath: "gold10/v11/current",
    prefsKey: PREFIX + "gold11Prefs",
    staffKey: PREFIX + "staffEditionSession",
    setupKey: PREFIX + "gold11SetupDone",
    notesKey: PREFIX + "gold11Notes",
    todoKey: PREFIX + "gold11Todo",
    clipsKey: PREFIX + "gold11Clips",
    devicesKey: PREFIX + "gold11Devices",
    appsKey: PREFIX + "gold11PatchApps",
    layoutKey: PREFIX + "gold11Layout",
    staffLogsKey: PREFIX + "gold11StaffLogs"
  };

  // Gold 1.1 replaces the older Gold first-boot panel with its own setup.
  if(!localStorage.getItem(PREFIX + 'setupDone')) localStorage.setItem(PREFIX + 'setupDone','true');

  const PATCH_APPS = [
    {id:"gold11-settings", name:"Gold Settings", group:"System", label:"ST", color:"#0078d4", desc:"Windows 10-style settings, personalization, privacy, update, BIOS, and Staff Edition controls."},
    {id:"gold11-personalization", name:"Personalization", group:"System", label:"PR", color:"#b87900", desc:"Theme, accent, wallpaper, Start menu, taskbar, desktop and lock screen settings."},
    {id:"gold11-apps", name:"Apps & Features", group:"System", label:"AP", color:"#107c10", desc:"Manage, launch, pin, hide, reset and review built-in apps."},
    {id:"gold11-staff", name:"Gold Staff Center", group:"Staff", label:"SF", color:"#5c2d91", desc:"Staff Edition controls, audits, sync, app review, and system management."},
    {id:"gold11-control", name:"Control Panel", group:"System", label:"CP", color:"#2b579a", desc:"Classic tools collected into one bigger app."},
    {id:"gold11-system", name:"System Monitor", group:"System", label:"SY", color:"#00a2ed", desc:"Workspace, storage, browser, session, and local data status."},
    {id:"gold11-update", name:"Gold Update", group:"System", label:"UP", color:"#0078d4", desc:"Check build status, patch notes and maintenance controls."},
    {id:"gold11-network", name:"Network Center", group:"System", label:"NW", color:"#008272", desc:"Cloud connection status, Firebase paths, and sync diagnostics."},
    {id:"gold11-paint", name:"Gold Paint", group:"Creative", label:"PT", color:"#e81123", desc:"A working canvas drawing app."},
    {id:"gold11-whiteboard", name:"Whiteboard", group:"Creative", label:"WB", color:"#ff8c00", desc:"Quick visual notes and planning board."},
    {id:"gold11-clipboard", name:"Clipboard", group:"Utilities", label:"CL", color:"#4b5563", desc:"Temporary clipboard, saved snippets, copy and export."},
    {id:"gold11-focus", name:"Focus Assist", group:"System", label:"FA", color:"#744da9", desc:"Silence notifications and control taskbar alerts."},
    {id:"gold11-sound", name:"Sound Center", group:"System", label:"SO", color:"#3b82f6", desc:"Gold sound, notification and volume preferences."},
    {id:"gold11-tips", name:"Get Started", group:"Help", label:"GS", color:"#059669", desc:"Guided tour and tips for the Gold desktop."},
    {id:"gold11-dos", name:"Emerald DOS", group:"System", label:"ED", color:"#065f46", desc:"Open an in-OS Emerald DOS console."},
    {id:"gold11-lock", name:"Lock Screen", group:"System", label:"LK", color:"#111827", desc:"Preview and configure the Gold lock screen."}
  ];

  function $(id){return document.getElementById(id);}
  function esc(s){return String(s ?? "").replace(/[&<>'"]/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[m]));}
  function rid(){return Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4);}
  function now(){return new Date().toISOString();}
  function username(){return localStorage.getItem("username") || "GoldUser";}
  function readJSON(key,fallback){try{return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));}catch{return fallback;}}
  function writeJSON(key,value){localStorage.setItem(key, JSON.stringify(value)); return value;}
  function basePrefs(){return readJSON(PREFIX+"prefs",{});} 
  function prefs(){return readJSON(BUILD.prefsKey, defaultPrefs());}
  function savePrefs(next){writeJSON(BUILD.prefsKey,{...prefs(),...next}); applyPrefs(); return prefs();}
  function defaultPrefs(){return {theme:"light",accent:"#0078d4",wallpaper:"gold-bloom",startStyle:"tiles",taskbarStyle:"light",iconSize:"normal",desktopDensity:"comfortable",showWidgets:true,showSearch:true,showTaskView:true,showClockSeconds:false,transparency:true,rounded:false,readableText:false,reducedMotion:false,lockMessage:"Welcome to EmeraldOS Gold",notifications:true,focusAssist:false,desktopApps:["gold11-settings","gold11-personalization","gold11-apps","gold11-staff","gold11-control","gold11-system","gold11-update","gold11-paint"]};}
  function staffSession(){return readJSON(BUILD.staffKey,null);} 
  function staffVerified(){const s=staffSession(); return !!(s && (s.verified || s.preview) && s.expiresAt && Date.now()<s.expiresAt);}
  function staffMode(){const s=staffSession(); return staffVerified() ? s : null;}
  function staffLog(action,target="System",reason=""){const arr=readJSON(BUILD.staffLogsKey,[]); arr.unshift({id:rid(),date:now(),staff:staffMode()?.username || username(),mail:staffMode()?.mail || "",action,target,reason}); writeJSON(BUILD.staffLogsKey,arr.slice(0,250));}
  function logo(label,color){return `<div class="gold11-logo" style="background:linear-gradient(135deg,${color || 'var(--gold-accent)'},#0f172a)">${esc(label)}</div>`;}
  function notify(title,body,source="Gold 1.1",level="info"){try{ if(window.Gold10?.notify) return Gold10.notify(title,body,source,level); }catch{} console.log(title,body);}
  function openWin(id,title,html,opts={}){ if(window.Gold10?.openWindow) return Gold10.openWindow(id,title,html,opts); const d=document.createElement('div'); d.className='win'; d.innerHTML=html; document.body.appendChild(d); return d; }
  function header(label,title,desc,color){return `<div class="gold11-app-head" style="display:flex;gap:12px;align-items:center;margin-bottom:14px">${logo(label,color)}<div><h2 style="margin:0">${esc(title)}</h2><p class="muted" style="margin:3px 0 0">${esc(desc)}</p></div></div>`;}
  function end(){return ``;}
  function download(name,content,type="text/plain"){const blob=new Blob([content],{type}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),500);}

  function applyPrefs(){
    const p=prefs();
    document.body.classList.remove("gold11-light","gold11-soft","gold11-warm","gold11-dark","gold11-contrast","gold11-readable","gold11-compact","gold11-large-icons","gold11-square");
    document.body.classList.add(`gold11-${p.theme || 'light'}`);
    if(p.readableText) document.body.classList.add("gold11-readable");
    if(p.desktopDensity==="compact") document.body.classList.add("gold11-compact");
    if(p.iconSize==="large") document.body.classList.add("gold11-large-icons");
    if(p.rounded===false) document.body.classList.add("gold11-square");
    document.documentElement.style.setProperty("--gold-accent", p.accent || "#0078d4");
    document.body.dataset.goldWallpaper = p.wallpaper || "gold-bloom";
    const searchBtn=document.querySelector('.taskbar-search'); if(searchBtn) searchBtn.style.display = p.showSearch===false ? 'none' : '';
    const taskView=[...document.querySelectorAll('.taskbar-tool')].find(b=>/task view/i.test(b.textContent||'')); if(taskView) taskView.style.display = p.showTaskView===false ? 'none' : '';
  }

  function appById(id){return PATCH_APPS.find(a=>a.id===id);}
  function patchApps(){return readJSON(BUILD.appsKey, PATCH_APPS.map(a=>({...a,pinned:(prefs().desktopApps||[]).includes(a.id),hidden:false})));}
  function savePatchApps(apps){return writeJSON(BUILD.appsKey,apps);}

  function installOpenPatch(){
    if(!window.Gold10 || Gold10.__gold11Patched) return;
    const originalOpen = Gold10.openApp;
    const originalRenderStart = Gold10.renderStart;
    Gold10.openApp = function(appId){
      if(appId==="settings") return openSettings();
      if(appId==="staff" || appId==="gold-staff") return openStaffCenter();
      if(appById(appId)) return openPatchApp(appId);
      return originalOpen.call(Gold10,appId);
    };
    Gold10.openGold11App = openPatchApp;
    Gold10.renderStart = function(q){const r=originalRenderStart.call(Gold10,q); setTimeout(enhanceStart,0); return r;};
    Gold10.__gold11Patched = true;
  }

  function enhanceStart(){
    const results=$("start-results");
    const tiles=$("start-tiles-grid");
    if(!results || results.dataset.gold11) return;
    const rows=PATCH_APPS.map(a=>`<div class="start-result" onclick="Gold10.openGold11App('${a.id}')">${logo(a.label,a.color)}<div><b>${esc(a.name)}</b><small>${esc(a.group)} — ${esc(a.desc)}</small></div></div>`).join("");
    results.insertAdjacentHTML("beforeend", rows);
    results.dataset.gold11="true";
    if(tiles && !tiles.dataset.gold11){
      tiles.insertAdjacentHTML("afterbegin", PATCH_APPS.slice(0,8).map(a=>`<div class="tile" onclick="Gold10.openGold11App('${a.id}')">${logo(a.label,a.color)}<b>${esc(a.name)}</b></div>`).join(""));
      tiles.dataset.gold11="true";
    }
  }

  function enhanceDesktop(){
    const desktop=$("desktop"); if(!desktop) return;
    desktop.querySelectorAll(".gold11-desktop-icon").forEach(x=>x.remove());
    const apps=patchApps().filter(a=>a.pinned && !a.hidden);
    const html=apps.map(a=>`<div tabindex="0" class="desktop-icon gold11-desktop-icon" ondblclick="Gold10.openGold11App('${a.id}')" onclick="this.blur()" title="${esc(a.desc)}">${logo(a.label,a.color)}<div class="icon-label">${esc(a.name)}</div></div>`).join("");
    desktop.insertAdjacentHTML("beforeend",html);
  }

  function openPatchApp(id){
    const map={
      "gold11-settings":openSettings,"gold11-personalization":openPersonalization,"gold11-apps":openAppCenter,"gold11-staff":openStaffCenter,"gold11-control":openControlPanel,"gold11-system":openSystemMonitor,"gold11-update":openUpdateCenter,"gold11-network":openNetworkCenter,"gold11-paint":openPaint,"gold11-whiteboard":openWhiteboard,"gold11-clipboard":openClipboard,"gold11-focus":openFocusAssist,"gold11-sound":openSoundCenter,"gold11-tips":openTips,"gold11-dos":openDOS,"gold11-lock":openLockScreen
    };
    return (map[id]||openTips)();
  }

  function sectionNav(items){return `<aside class="gold11-nav">${items.map((x,i)=>`<button class="${i===0?'active':''}" onclick="Gold10Patch2.showSection(this,${i})">${esc(x)}</button>`).join("")}</aside>`;}
  function showSection(btn,i){const root=btn.closest('.gold11-settings'); root.querySelectorAll('.gold11-nav button').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); root.querySelectorAll('.gold11-section').forEach((s,idx)=>s.classList.toggle('active',idx===i));}

  function openSettings(){
    const p=prefs(); const s=staffMode();
    openWin("settings","Gold Settings",`${header("ST","Settings","A larger Windows 10-style settings app with real working personalization, apps, privacy, recovery and Staff Edition controls.","#0078d4")}
      <div class="gold11-settings">
        ${sectionNav(["System","Personalization","Apps","Accounts","Time & language","Ease of Access","Privacy","Update & Security","BIOS & DOS","Staff Edition"])}
        <main class="gold11-main">
          <section class="gold11-section active"><h3>System</h3><div class="gold11-two">
            <label class="card"><h3>Display scale</h3><select id="g11_icon" class="field"><option value="small">Small icons</option><option value="normal">Normal icons</option><option value="large">Large icons</option></select></label>
            <label class="card"><h3>Desktop density</h3><select id="g11_density" class="field"><option value="compact">Compact</option><option value="comfortable">Comfortable</option></select></label>
            <label class="card"><h3>Taskbar Search</h3><input type="checkbox" id="g11_search" ${p.showSearch!==false?'checked':''}> Show search box</label>
            <label class="card"><h3>Task View</h3><input type="checkbox" id="g11_taskview" ${p.showTaskView!==false?'checked':''}> Show task view button</label>
            <label class="card"><h3>Clock seconds</h3><input type="checkbox" id="g11_seconds" ${p.showClockSeconds?'checked':''}> Show seconds</label>
            <label class="card"><h3>Transparency</h3><input type="checkbox" id="g11_transparency" ${p.transparency!==false?'checked':''}> Use acrylic panels</label>
          </div></section>
          <section class="gold11-section"><h3>Personalization</h3><div class="gold11-two">
            <label class="card"><h3>Theme</h3><select id="g11_theme" class="field"><option value="light">Gold Light</option><option value="soft">Soft Light</option><option value="warm">Warm Gold</option><option value="dark">Dark</option><option value="contrast">High Contrast</option></select></label>
            <label class="card"><h3>Accent color</h3><input id="g11_accent" type="color" value="${esc(p.accent)}"><div><span class="gold11-accent-chip" style="background:#0078d4" onclick="Gold10Patch2.setColor('#0078d4')"></span><span class="gold11-accent-chip" style="background:#107c10" onclick="Gold10Patch2.setColor('#107c10')"></span><span class="gold11-accent-chip" style="background:#5c2d91" onclick="Gold10Patch2.setColor('#5c2d91')"></span><span class="gold11-accent-chip" style="background:#b87900" onclick="Gold10Patch2.setColor('#b87900')"></span></div></label>
            <label class="card"><h3>Wallpaper</h3><select id="g11_wallpaper" class="field"><option value="gold-bloom">Gold Bloom</option><option value="soft-cloud">Soft Cloud</option><option value="emerald-beam">Emerald Beam</option><option value="plain-light">Plain Light</option></select></label>
            <label class="card"><h3>Window corners</h3><input type="checkbox" id="g11_rounded" ${p.rounded!==false?'checked':''}> Rounded app windows</label>
            <label class="card"><h3>Lock screen message</h3><input id="g11_lockmsg" class="field" value="${esc(p.lockMessage)}"></label>
          </div><div class="gold11-preview"><b>Preview</b><p>This preview changes after you click Apply.</p><div class="gold11-live-grid"><div class="gold11-live-tile">Start</div><div class="gold11-live-tile green">Apps</div><div class="gold11-live-tile gold">Office</div></div></div></section>
          <section class="gold11-section"><h3>Apps</h3><p class="muted">Choose which Gold 1.1 apps stay on the desktop. Apps remain available through Start.</p><div>${patchApps().map(a=>`<label class="gold11-app-row"><span>${logo(a.label,a.color)}</span><span><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></span><span><input class="g11_pin" type="checkbox" value="${a.id}" ${a.pinned?'checked':''}> Desktop</span></label>`).join("")}</div></section>
          <section class="gold11-section"><h3>Accounts</h3><div class="gold11-three"><div class="card"><h3>${esc(username())}</h3><small>EmeraldOS username</small></div><div class="card"><h3>${esc((username().toLowerCase().replace(/[^a-z0-9._-]/g,'.')||'user')+'@gold.mail')}</h3><small>Gold Mail identity</small></div><div class="card"><h3>${s? 'Staff verified':'Standard'}</h3><small>Staff Edition status</small></div></div></section>
          <section class="gold11-section"><h3>Time & language</h3><div class="gold11-three"><div class="card"><h3>${new Date().toLocaleTimeString()}</h3><small>Current time</small></div><div class="card"><h3>${new Date().toLocaleDateString()}</h3><small>Current date</small></div><div class="card"><h3>${Intl.DateTimeFormat().resolvedOptions().timeZone}</h3><small>Browser time zone</small></div></div></section>
          <section class="gold11-section"><h3>Ease of Access</h3><div class="gold11-two"><label class="card"><h3>Readable text</h3><input id="g11_readable" type="checkbox" ${p.readableText?'checked':''}> Larger text and spacing</label><label class="card"><h3>Reduced motion</h3><input id="g11_motion" type="checkbox" ${p.reducedMotion?'checked':''}> Reduce motion effects</label><label class="card"><h3>High contrast</h3><button class="btn" onclick="Gold10Patch2.quickTheme('contrast')">Use High Contrast</button></label><label class="card"><h3>Reset visual settings</h3><button class="btn" onclick="Gold10Patch2.resetVisuals()">Reset</button></label></div></section>
          <section class="gold11-section"><h3>Privacy</h3><div class="gold11-two"><label class="card"><h3>Notifications</h3><input id="g11_notifications" type="checkbox" ${p.notifications!==false?'checked':''}> Allow system notifications</label><label class="card"><h3>Focus Assist</h3><input id="g11_focus" type="checkbox" ${p.focusAssist?'checked':''}> Hide notification popups</label><div class="card"><h3>Clear temporary data</h3><button class="btn danger" onclick="Gold10Patch2.clearTemporaryData()">Clear Temporary Data</button></div><div class="card"><h3>Export preferences</h3><button class="btn" onclick="Gold10Patch2.exportPrefs()">Export Settings</button></div></div></section>
          <section class="gold11-section"><h3>Update & Security</h3><div class="gold11-two"><div class="card"><h3>Restore Center</h3><button class="btn primary" onclick="Gold10.openApp('restore')">Open Restore Center</button></div><div class="card"><h3>Gold Update</h3><button class="btn" onclick="Gold10.openGold11App('gold11-update')">Open Update</button></div><div class="card"><h3>Recovery</h3><button class="btn danger" onclick="Gold10Patch2.restoreDefaults()">Restore Gold Defaults</button></div><div class="card"><h3>Workspace backup</h3><button class="btn" onclick="Gold10Patch2.exportWorkspaceLite()">Export Backup</button></div></div></section>
          <section class="gold11-section"><h3>BIOS & DOS</h3><div class="gold11-two"><div class="card"><h3>Emerald Systems BIOS A1</h3><button class="btn primary" onclick="location.href='bios.html'">Open BIOS / DOS</button><small>Press F12 during startup.</small></div><div class="card"><h3>Staff Edition boot</h3><button class="btn" onclick="location.href='staff.html'">Open Staff Login</button><small>BIOS command: STAFF</small></div><div class="card"><h3>Emerald DOS</h3><button class="btn" onclick="Gold10.openGold11App('gold11-dos')">Open In-OS DOS</button></div></div></section>
          <section class="gold11-section"><h3>Staff Edition</h3>${staffVerified()?`<div class="staff-card"><span class="staff-badge">Verified Staff</span><h3>${esc(s.username)} · ${esc(s.mail)}</h3><p>Role: ${esc(s.role||'staff')}</p><button class="btn primary" onclick="Gold10.openGold11App('gold11-staff')">Open Staff Center</button><button class="btn danger" onclick="Gold10Patch2.staffLogout()">Sign out of Staff Edition</button></div>`:`<div class="staff-warning"><b>Staff Edition is not active.</b><p>Use the BIOS STAFF command or open the Staff Edition login page. Staff Edition requires EmeraldOS credentials and an Emerald Mail account.</p><button class="btn primary" onclick="location.href='staff.html'">Open Staff Login</button></div>`}</section>
          <div class="toolbar" style="position:sticky;bottom:0;background:var(--gold-card-soft);padding:12px 0"><button class="btn primary" onclick="Gold10Patch2.saveSettings()">Apply</button><button class="btn" onclick="Gold10.openGold11App('gold11-personalization')">Personalization</button><button class="btn" onclick="Gold10.openGold11App('gold11-apps')">Apps & Features</button></div>
        </main>
      </div>`,{width:1120,height:760});
    setTimeout(()=>{["theme","icon","density","wallpaper"].forEach(k=>{const el=$("g11_"+k); if(el) el.value=p[k]||defaultPrefs()[k];});},30);
  }

  function saveSettings(){
    const pinned=[...document.querySelectorAll('.g11_pin:checked')].map(x=>x.value);
    const next={
      theme:$("g11_theme")?.value || prefs().theme,
      accent:$("g11_accent")?.value || prefs().accent,
      wallpaper:$("g11_wallpaper")?.value || prefs().wallpaper,
      iconSize:$("g11_icon")?.value || prefs().iconSize,
      desktopDensity:$("g11_density")?.value || prefs().desktopDensity,
      showSearch:!!$("g11_search")?.checked,
      showTaskView:!!$("g11_taskview")?.checked,
      showClockSeconds:!!$("g11_seconds")?.checked,
      transparency:!!$("g11_transparency")?.checked,
      rounded:!!$("g11_rounded")?.checked,
      readableText:!!$("g11_readable")?.checked,
      reducedMotion:!!$("g11_motion")?.checked,
      notifications:!!$("g11_notifications")?.checked,
      focusAssist:!!$("g11_focus")?.checked,
      lockMessage:$("g11_lockmsg")?.value || prefs().lockMessage,
      desktopApps:pinned.length?pinned:prefs().desktopApps
    };
    savePrefs(next);
    const apps=patchApps().map(a=>({...a,pinned:next.desktopApps.includes(a.id)})); savePatchApps(apps);
    enhanceDesktop(); notify("Settings applied","Gold 1.1 personalization settings were saved.","Settings");
  }
  function setColor(c){const el=$("g11_accent"); if(el) el.value=c;}
  function quickTheme(t){savePrefs({theme:t}); location.reload();}
  function resetVisuals(){writeJSON(BUILD.prefsKey,{...prefs(),theme:"light",accent:"#0078d4",wallpaper:"gold-bloom",iconSize:"normal",desktopDensity:"comfortable",rounded:false,readableText:false,reducedMotion:false}); location.reload();}

  function openPersonalization(){
    const p=prefs();
    openWin("gold11-personalization","Personalization",`${header("PR","Personalization","Customize Gold visuals, taskbar, Start menu, lock screen, desktop and app appearance.","#b87900")}
      <div class="gold11-three"><div class="card"><h3>Theme</h3><select id="p_theme" class="field"><option value="light">Gold Light</option><option value="soft">Soft Light</option><option value="warm">Warm Gold</option><option value="dark">Dark</option><option value="contrast">High Contrast</option></select></div><div class="card"><h3>Accent</h3><input id="p_accent" type="color" value="${esc(p.accent)}"></div><div class="card"><h3>Wallpaper</h3><select id="p_wallpaper" class="field"><option value="gold-bloom">Gold Bloom</option><option value="soft-cloud">Soft Cloud</option><option value="emerald-beam">Emerald Beam</option><option value="plain-light">Plain Light</option></select></div></div>
      <h3>Desktop layout</h3><div class="gold11-three"><label class="card"><input id="p_search" type="checkbox" ${p.showSearch!==false?'checked':''}> Search box on taskbar</label><label class="card"><input id="p_taskview" type="checkbox" ${p.showTaskView!==false?'checked':''}> Task View button</label><label class="card"><input id="p_widgets" type="checkbox" ${p.showWidgets!==false?'checked':''}> Widgets button</label><label class="card"><input id="p_readable" type="checkbox" ${p.readableText?'checked':''}> Readable text</label><label class="card"><input id="p_round" type="checkbox" ${p.rounded!==false?'checked':''}> Rounded windows</label><label class="card"><input id="p_motion" type="checkbox" ${p.reducedMotion?'checked':''}> Reduced motion</label></div>
      <h3>Live preview</h3><div class="gold11-preview"><div class="gold11-live-grid"><div class="gold11-live-tile">Mail<br><small>2 unread</small></div><div class="gold11-live-tile alt">Office<br><small>Recent docs</small></div><div class="gold11-live-tile green">Settings<br><small>Ready</small></div><div class="gold11-live-tile gold">Staff<br><small>${staffVerified()?'Verified':'Standard'}</small></div></div></div>
      <div class="toolbar"><button class="btn primary" onclick="Gold10Patch2.savePersonalization()">Apply Personalization</button><button class="btn" onclick="Gold10Patch2.resetVisuals()">Reset Visuals</button></div>`,{width:960,height:650});
    setTimeout(()=>{const p=prefs(); if($("p_theme")) $("p_theme").value=p.theme; if($("p_wallpaper")) $("p_wallpaper").value=p.wallpaper;},30);
  }
  function savePersonalization(){savePrefs({theme:$("p_theme")?.value||"light",accent:$("p_accent")?.value||"#0078d4",wallpaper:$("p_wallpaper")?.value||"gold-bloom",showSearch:!!$("p_search")?.checked,showTaskView:!!$("p_taskview")?.checked,showWidgets:!!$("p_widgets")?.checked,readableText:!!$("p_readable")?.checked,rounded:!!$("p_round")?.checked,reducedMotion:!!$("p_motion")?.checked}); notify("Personalization saved","Your Gold appearance was updated.","Personalization");}

  function openAppCenter(){
    openWin("gold11-apps","Apps & Features",`${header("AP","Apps & Features","Launch, pin, hide, reset and review Gold apps from one consolidated app.","#107c10")}
      <input class="field" id="app_filter" placeholder="Search apps" oninput="Gold10Patch2.renderApps(this.value)"><div id="gold11_app_rows"></div>
      <div class="toolbar"><button class="btn primary" onclick="Gold10Patch2.pinDefaultApps()">Pin recommended apps</button><button class="btn" onclick="Gold10Patch2.hideAllPatchApps()">Remove Gold 1.1 apps from desktop</button><button class="btn" onclick="Gold10Patch2.restorePatchApps()">Restore Gold 1.1 apps</button></div>`,{width:980,height:690});
    setTimeout(()=>renderApps(""),20);
  }
  function renderApps(q=""){
    const el=$("gold11_app_rows"); if(!el) return;
    const query=String(q||"").toLowerCase();
    const rows=patchApps().filter(a=>!query || (a.name+a.group+a.desc).toLowerCase().includes(query)).map(a=>`<div class="gold11-app-row"><span>${logo(a.label,a.color)}</span><span><b>${esc(a.name)}</b><small>${esc(a.group)} · ${esc(a.desc)}</small></span><span class="toolbar"><button class="btn primary" onclick="Gold10.openGold11App('${a.id}')">Open</button><button class="btn" onclick="Gold10Patch2.togglePin('${a.id}')">${a.pinned?'Remove':'Pin'}</button><button class="btn" onclick="Gold10Patch2.toggleHide('${a.id}')">${a.hidden?'Show':'Hide'}</button></span></div>`).join("");
    el.innerHTML=rows || `<div class="notice">No apps found.</div>`;
  }
  function togglePin(id){const apps=patchApps().map(a=>a.id===id?{...a,pinned:!a.pinned}:a); savePatchApps(apps); savePrefs({desktopApps:apps.filter(a=>a.pinned).map(a=>a.id)}); enhanceDesktop(); renderApps($("app_filter")?.value||"");}
  function toggleHide(id){const apps=patchApps().map(a=>a.id===id?{...a,hidden:!a.hidden}:a); savePatchApps(apps); enhanceDesktop(); renderApps($("app_filter")?.value||"");}
  function pinDefaultApps(){const ids=["gold11-settings","gold11-personalization","gold11-apps","gold11-staff","gold11-control","gold11-system","gold11-paint","gold11-update"]; const apps=patchApps().map(a=>({...a,pinned:ids.includes(a.id),hidden:false})); savePatchApps(apps); savePrefs({desktopApps:ids}); enhanceDesktop(); renderApps();}
  function hideAllPatchApps(){const apps=patchApps().map(a=>({...a,pinned:false})); savePatchApps(apps); savePrefs({desktopApps:[]}); enhanceDesktop(); renderApps();}
  function restorePatchApps(){localStorage.removeItem(BUILD.appsKey); savePrefs({desktopApps:defaultPrefs().desktopApps}); enhanceDesktop(); renderApps();}

  function openStaffCenter(){
    const s=staffMode();
    if(!s) return openWin("gold11-staff-login","Gold Staff Edition",`${header("SF","Gold Staff Edition","Staff Edition requires EmeraldOS credentials and an Emerald Mail account.","#5c2d91")}<div class="staff-warning"><b>Staff Edition is locked.</b><p>Open the secure Staff Edition login page from BIOS or the button below.</p><div class="toolbar"><button class="btn primary" onclick="location.href='staff.html'">Open Staff Login</button><button class="btn" onclick="location.href='bios.html'">Open BIOS / DOS</button></div></div>`,{width:720,height:420});
    const logs=readJSON(BUILD.staffLogsKey,[]).slice(0,8);
    openWin("gold11-staff","Gold Staff Center",`${header("SF","Gold Staff Center","Staff Edition control surface for EmeraldOS Gold.","#5c2d91")}
      <div class="gold11-three"><div class="staff-card"><span class="staff-badge">Verified</span><h3>${esc(s.username)}</h3><small>${esc(s.mail)}</small></div><div class="card"><h3>${esc(s.role||'staff')}</h3><small>Access role</small></div><div class="card"><h3>${new Date(s.expiresAt).toLocaleString()}</h3><small>Session expires</small></div></div>
      <h3>Staff controls</h3><div class="gold11-three"><button class="card" onclick="Gold10Patch2.staffAction('save workspace','current device')"><h3>Save workspace</h3><small>Force local/cloud workspace save</small></button><button class="card" onclick="Gold10Patch2.staffAction('restore defaults','desktop')"><h3>Restore desktop defaults</h3><small>Repair Gold layout</small></button><button class="card" onclick="Gold10Patch2.staffAction('open security','security center')"><h3>Security review</h3><small>Open security tools</small></button><button class="card" onclick="Gold10Patch2.staffAction('open apps','app center')"><h3>App control</h3><small>Open app manager</small></button><button class="card" onclick="Gold10Patch2.staffAction('open network','network center')"><h3>Network diagnostics</h3><small>Check sync path and browser state</small></button><button class="card" onclick="Gold10Patch2.staffAction('export audit','staff logs')"><h3>Export staff audit</h3><small>Download log JSON</small></button></div>
      <h3>Staff notes</h3><textarea id="staff_notes" class="editor" oninput="localStorage.setItem('${PREFIX}staffNotes',this.value)">${esc(localStorage.getItem(PREFIX+'staffNotes')||'')}</textarea>
      <h3>Recent staff actions</h3><table class="gold11-table"><thead><tr><th>Date</th><th>Action</th><th>Target</th><th>Reason</th></tr></thead><tbody>${logs.map(l=>`<tr><td>${esc(new Date(l.date).toLocaleString())}</td><td>${esc(l.action)}</td><td>${esc(l.target)}</td><td>${esc(l.reason||'')}</td></tr>`).join('') || `<tr><td colspan="4">No staff actions yet.</td></tr>`}</tbody></table>
      <div class="toolbar"><button class="btn" onclick="location.href='staff.html'">Staff Login Page</button><button class="btn danger" onclick="Gold10Patch2.staffLogout()">End Staff Session</button></div>`,{width:1080,height:760});
  }
  function staffAction(action,target){staffLog(action,target,"Gold Staff Center"); if(action==='save workspace' && Gold10.saveWorkspaceNow) Gold10.saveWorkspaceNow(); if(action==='restore defaults') restoreDefaults(); if(action==='open security') Gold10.openApp('security'); if(action==='open apps') openAppCenter(); if(action==='open network') openNetworkCenter(); if(action==='export audit') download('gold-staff-audit.json',JSON.stringify(readJSON(BUILD.staffLogsKey,[]),null,2),'application/json'); notify('Staff action recorded',`${action} → ${target}`,'Gold Staff');}
  function staffLogout(){localStorage.removeItem(BUILD.staffKey); notify('Staff signed out','Gold Staff Edition session ended.','Gold Staff'); setTimeout(()=>location.reload(),400);}

  function openControlPanel(){openWin("gold11-control","Control Panel",`${header("CP","Control Panel","Classic grouped tools for deeper Gold control.","#2b579a")}<div class="gold11-three">${[
    ["System","gold11-system"],["Network","gold11-network"],["Personalization","gold11-personalization"],["Sound","gold11-sound"],["Focus Assist","gold11-focus"],["Apps","gold11-apps"],["Update","gold11-update"],["Staff Edition","gold11-staff"],["BIOS/DOS","gold11-dos"]
  ].map(([n,id])=>`<button class="card" onclick="Gold10.openGold11App('${id}')"><h3>${esc(n)}</h3><small>Open ${esc(n)}</small></button>`).join("")}</div>`,{width:920,height:600});}
  function openSystemMonitor(){const keys=Object.keys(localStorage).filter(k=>k.startsWith(PREFIX)); openWin("gold11-system","System Monitor",`${header("SY","System Monitor","Live workspace, browser, storage and app status.","#00a2ed")}<div class="gold11-three"><div class="card"><h3>${keys.length}</h3><small>Gold local keys</small></div><div class="card"><h3>${patchApps().length}</h3><small>Gold 1.1 apps</small></div><div class="card"><h3>${navigator.onLine?'Online':'Offline'}</h3><small>Browser connection</small></div><div class="card"><h3>${window.innerWidth} × ${window.innerHeight}</h3><small>Viewport</small></div><div class="card"><h3>${staffVerified()?'Staff':'Standard'}</h3><small>Session mode</small></div><div class="card"><h3>${new Date().toLocaleString()}</h3><small>Current time</small></div></div><h3>System details</h3><pre class="gold11-dosline">${esc(navigator.userAgent)}\nCloud path: emeraldOSUsers/${esc(username())}/${BUILD.cloudPath}\nProduct: ${BUILD.name}</pre>`,{width:900,height:620});}
  function openUpdateCenter(){openWin("gold11-update","Gold Update",`${header("UP","Gold Update","Build status, update notes and maintenance options.","#0078d4")}<div class="gold11-three"><div class="card"><h3>EmeraldOS Gold 1.1</h3><small>Installed</small></div><div class="card"><h3>Settings Update</h3><small>Active</small></div><div class="card"><h3>Staff Edition</h3><small>${staffVerified()?'Signed in':'Available'}</small></div></div><div class="notice"><b>No online update service is connected yet.</b><br>This app tracks local build status and update actions.</div><div class="toolbar"><button class="btn" onclick="Gold10Patch2.exportPrefs()">Export settings</button><button class="btn" onclick="Gold10.openApp('restore')">Restore Center</button><button class="btn" onclick="Gold10Patch2.openTips()">What is new</button></div>`,{width:820,height:520});}
  function openNetworkCenter(){openWin("gold11-network","Network Center",`${header("NW","Network Center","Connection, Firebase, and cloud workspace diagnostics.","#008272")}<div class="gold11-three"><div class="card"><h3>${navigator.onLine?'Online':'Offline'}</h3><small>Browser network</small></div><div class="card"><h3>${esc(username())}</h3><small>Workspace user</small></div><div class="card"><h3>${BUILD.cloudPath}</h3><small>Gold cloud path</small></div></div><div class="toolbar"><button class="btn primary" onclick="Gold10Patch2.testFirebase()">Test Firebase Import</button><button class="btn" onclick="Gold10.saveWorkspaceNow && Gold10.saveWorkspaceNow()">Save Workspace</button><button class="btn" onclick="Gold10.loadCloudWorkspace && Gold10.loadCloudWorkspace()">Restore Cloud</button></div><div id="net_result" class="notice">Run a test to check Firebase availability.</div>`,{width:820,height:520});}
  async function testFirebase(){const el=$("net_result"); try{const fb=await import('./firebase.js'); el.textContent = fb.db ? 'Firebase module loaded. Firestore database object is available.' : 'Firebase module loaded, but db export was not found.';}catch(e){el.textContent='Firebase import failed: '+e.message;}}

  function openPaint(){openWin("gold11-paint","Gold Paint",`${header("PT","Gold Paint","A working pre-installed-style canvas drawing app.","#e81123")}<div class="toolbar"><label>Color <input id="paint_color" type="color" value="#0078d4"></label><label>Size <input id="paint_size" type="range" min="1" max="28" value="5"></label><button class="btn" onclick="Gold10Patch2.clearPaint()">Clear</button><button class="btn" onclick="Gold10Patch2.exportPaint()">Export PNG</button></div><canvas id="gold_paint_canvas" width="900" height="420" style="width:100%;height:420px;background:white;border:1px solid var(--gold-border);touch-action:none"></canvas>`,{width:960,height:620}); setTimeout(initPaint,50);}
  let paintDown=false;
  function initPaint(){const c=$("gold_paint_canvas"); if(!c)return; const ctx=c.getContext('2d'); ctx.lineCap='round'; function pos(e){const r=c.getBoundingClientRect(); const t=e.touches?e.touches[0]:e; return {x:(t.clientX-r.left)*c.width/r.width,y:(t.clientY-r.top)*c.height/r.height};} function start(e){paintDown=true; const p=pos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); e.preventDefault();} function move(e){if(!paintDown)return; const p=pos(e); ctx.strokeStyle=$("paint_color")?.value||'#0078d4'; ctx.lineWidth=Number($("paint_size")?.value||5); ctx.lineTo(p.x,p.y); ctx.stroke(); e.preventDefault();} function end(){paintDown=false;} c.onmousedown=start; c.onmousemove=move; window.addEventListener('mouseup',end); c.ontouchstart=start; c.ontouchmove=move; c.ontouchend=end;}
  function clearPaint(){const c=$("gold_paint_canvas"); if(c)c.getContext('2d').clearRect(0,0,c.width,c.height);} function exportPaint(){const c=$("gold_paint_canvas"); if(!c)return; const a=document.createElement('a'); a.href=c.toDataURL('image/png'); a.download='gold-paint.png'; a.click();}
  function openWhiteboard(){openWin("gold11-whiteboard","Whiteboard",`${header("WB","Whiteboard","A quick functional planning board.","#ff8c00")}<div class="toolbar"><input id="wb_text" class="field" placeholder="Idea or sticky note"><button class="btn primary" onclick="Gold10Patch2.addBoardNote()">Add</button><button class="btn" onclick="Gold10Patch2.clearBoard()">Clear</button></div><div id="wb_board" class="grid"></div>`,{width:880,height:600}); renderBoard();}
  function board(){return readJSON(BUILD.notesKey,[]);} function saveBoard(x){writeJSON(BUILD.notesKey,x); renderBoard();} function renderBoard(){const el=$("wb_board"); if(el) el.innerHTML=board().map(n=>`<div class="card"><h3>${esc(n.text)}</h3><small>${new Date(n.date).toLocaleString()}</small><br><button class="btn danger" onclick="Gold10Patch2.deleteBoardNote('${n.id}')">Delete</button></div>`).join('') || '<div class="notice">No board notes yet.</div>';}
  function addBoardNote(){const v=$("wb_text")?.value.trim(); if(!v)return; saveBoard([{id:rid(),text:v,date:now()},...board()]); $("wb_text").value='';} function deleteBoardNote(id){saveBoard(board().filter(n=>n.id!==id));} function clearBoard(){if(confirm('Clear whiteboard?')) saveBoard([]);}
  function openClipboard(){const clips=readJSON(BUILD.clipsKey,[]); openWin("gold11-clipboard","Clipboard",`${header("CL","Clipboard","Save reusable snippets, copy text, and export notes.","#4b5563")}<div class="toolbar"><input id="clip_text" class="field" placeholder="Text to save"><button class="btn primary" onclick="Gold10Patch2.addClip()">Save Clip</button><button class="btn" onclick="Gold10Patch2.exportClips()">Export</button></div><div id="clip_list">${clips.map(c=>`<div class="list-item"><div style="flex:1"><b>${esc(c.text.slice(0,60))}</b><small>${new Date(c.date).toLocaleString()}</small></div><button class="btn" onclick="navigator.clipboard&&navigator.clipboard.writeText('${esc(c.text).replace(/'/g,'\\&#39;')}')">Copy</button><button class="btn danger" onclick="Gold10Patch2.deleteClip('${c.id}')">Delete</button></div>`).join('') || '<div class="notice">No clips saved.</div>'}</div>`,{width:850,height:560});}
  function addClip(){const v=$("clip_text")?.value.trim(); if(!v)return; const arr=readJSON(BUILD.clipsKey,[]); arr.unshift({id:rid(),text:v,date:now()}); writeJSON(BUILD.clipsKey,arr); openClipboard();} function deleteClip(id){writeJSON(BUILD.clipsKey,readJSON(BUILD.clipsKey,[]).filter(c=>c.id!==id)); openClipboard();} function exportClips(){download('gold-clips.json',JSON.stringify(readJSON(BUILD.clipsKey,[]),null,2),'application/json');}
  function openFocusAssist(){const p=prefs(); openWin("gold11-focus","Focus Assist",`${header("FA","Focus Assist","Control alerts and notification popups.","#744da9")}<div class="gold11-two"><label class="card"><h3>Focus Assist</h3><input id="focus_toggle" type="checkbox" ${p.focusAssist?'checked':''}> Hide pop-up notifications</label><label class="card"><h3>Notifications</h3><input id="notify_toggle" type="checkbox" ${p.notifications!==false?'checked':''}> Allow notifications</label></div><button class="btn primary" onclick="Gold10Patch2.saveFocus()">Apply</button>`,{width:700,height:420});}
  function saveFocus(){savePrefs({focusAssist:!!$("focus_toggle")?.checked,notifications:!!$("notify_toggle")?.checked}); notify('Focus settings saved','Focus Assist preferences updated.','Focus Assist');}
  function openSoundCenter(){const p=prefs(); openWin("gold11-sound","Sound Center",`${header("SO","Sound Center","Gold sound and alert preferences.","#3b82f6")}<div class="gold11-two"><label class="card"><h3>Notification sound</h3><input id="sound_notify" type="checkbox" ${p.soundNotify?'checked':''}> Enable subtle notification sound</label><label class="card"><h3>Volume</h3><input id="sound_volume" type="range" min="0" max="100" value="${p.volume ?? 60}"></label></div><div class="toolbar"><button class="btn primary" onclick="Gold10Patch2.saveSound()">Apply</button><button class="btn" onclick="Gold10Patch2.testSound()">Test Sound</button></div>`,{width:720,height:430});}
  function saveSound(){savePrefs({soundNotify:!!$("sound_notify")?.checked,volume:Number($("sound_volume")?.value||60)}); notify('Sound settings saved','Gold sound preferences updated.','Sound');}
  function testSound(){try{const ac=new (window.AudioContext||window.webkitAudioContext)(); const o=ac.createOscillator(); const g=ac.createGain(); o.connect(g); g.connect(ac.destination); o.frequency.value=660; g.gain.value=.05; o.start(); setTimeout(()=>{o.stop();ac.close();},160);}catch{notify('Sound unavailable','Browser audio test could not run.','Sound');}}
  function openTips(){openWin("gold11-tips","Get Started",`${header("GS","Get Started","Tips for the improved EmeraldOS Gold desktop.","#059669")}<div class="gold11-three">${[
    ['First boot setup','Setup appears once and can be reset from Settings.'],['F12 startup','Press F12 during loading for Emerald Systems BIOS A1 and Emerald DOS.'],['Staff Edition','Type STAFF in BIOS or open the Staff login page.'],['Personalization','Change themes, accent color, icons, taskbar, wallpaper and lock screen.'],['Apps & Features','Remove desktop apps without deleting them.'],['Restore Center','Save and restore your workspace locally or with Firebase.']
  ].map(([a,b])=>`<div class="card"><h3>${esc(a)}</h3><small>${esc(b)}</small></div>`).join('')}</div>`,{width:900,height:600});}
  function openDOS(){openWin("gold11-dos","Emerald DOS",`${header("ED","Emerald DOS","In-OS command prompt. BIOS also has command STAFF for Staff Edition.","#065f46")}<pre id="g11_dos_screen" class="gold11-dosline" style="min-height:320px;overflow:auto">Emerald DOS Gold 1.1\nType HELP, STAFF, SETTINGS, APPS, BIOS, CLEAR, TIME, EXIT.</pre><div class="cmd"><span>EDS&gt;</span><input id="g11_dos_cmd" class="field" autofocus onkeydown="if(event.key==='Enter'){Gold10Patch2.runDOS(this.value);this.value=''}"></div>`,{width:820,height:560});}
  function runDOS(raw){const cmd=String(raw||'').trim().toLowerCase(); const s=$("g11_dos_screen"); if(!s||!cmd)return; const w=t=>{s.textContent += '\n' + t; s.scrollTop=s.scrollHeight;}; w('EDS> '+cmd); switch(cmd){case 'help':w('Commands: HELP, VER, STAFF, SETTINGS, APPS, BIOS, RESTORE, CLEAR, TIME, EXIT');break;case 'ver':w('EmeraldOS Gold 1.1\nEmerald Systems BIOS A1\nEmerald DOS Gold 1.1');break;case 'staff':location.href='staff.html';break;case 'settings':openSettings();break;case 'apps':openAppCenter();break;case 'bios':location.href='bios.html';break;case 'restore':Gold10.openApp('restore');break;case 'clear':s.textContent='';break;case 'time':w(new Date().toString());break;case 'exit':Gold10.closeWindow&&Gold10.closeWindow('gold11-dos');break;default:w('Bad command or file name. Type HELP.');}}
  function openLockScreen(){const p=prefs(); const d=document.createElement('div'); d.className='gold-lock-screen'; d.innerHTML=`<div class="gold-lock-card"><h1>${esc(p.lockMessage||'EmeraldOS Gold')}</h1><p>${new Date().toLocaleString()}</p><p class="muted">${esc(username())}</p><button class="btn primary" onclick="this.closest('.gold-lock-screen').remove()">Unlock</button></div>`; document.body.appendChild(d);}

  function clearTemporaryData(){[BUILD.layoutKey].forEach(k=>localStorage.removeItem(k)); notify('Temporary data cleared','Gold temporary layout data was cleared.','Settings');}
  function exportPrefs(){download('emeraldos-gold-1.1-settings.json',JSON.stringify(prefs(),null,2),'application/json');}
  function exportWorkspaceLite(){const data={product:BUILD.name,username:username(),prefs:prefs(),patchApps:patchApps(),staff:staffMode(),savedAt:now()}; download('emeraldos-gold-1.1-workspace-lite.json',JSON.stringify(data,null,2),'application/json');}
  function restoreDefaults(){if(confirm('Restore Gold 1.1 defaults?')){localStorage.removeItem(BUILD.prefsKey); localStorage.removeItem(BUILD.appsKey); location.reload();}}

  function installFirstBoot(){
    if(localStorage.getItem(BUILD.setupKey)) return;
    setTimeout(()=>{openWin('gold11-firstboot','Gold 1.1 Setup',`${header('G1','Welcome to EmeraldOS Gold 1.1','Finish setup once, then Gold will remember your preferences.','#0078d4')}<div class="gold11-two"><label class="card"><h3>Choose theme</h3><select id="fb_theme" class="field"><option value="light">Gold Light</option><option value="soft">Soft Light</option><option value="warm">Warm Gold</option><option value="dark">Dark</option></select></label><label class="card"><h3>Desktop mode</h3><select id="fb_density" class="field"><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label><label class="card"><h3>Staff tools</h3><input id="fb_staff" type="checkbox" checked> Show Staff Edition shortcut</label><label class="card"><h3>Search</h3><input id="fb_search" type="checkbox" checked> Show search on taskbar</label></div><div class="toolbar"><button class="btn primary" onclick="Gold10Patch2.finishFirstBoot()">Finish Setup</button><button class="btn" onclick="Gold10Patch2.recommendedSetup()">Use Recommended</button></div>`,{width:820,height:560});},1200);
  }
  function finishFirstBoot(){savePrefs({theme:$("fb_theme")?.value||'light',desktopDensity:$("fb_density")?.value||'comfortable',showSearch:!!$("fb_search")?.checked,desktopApps:$("fb_staff")?.checked?defaultPrefs().desktopApps:defaultPrefs().desktopApps.filter(x=>x!=='gold11-staff')}); localStorage.setItem(BUILD.setupKey,'true'); notify('Setup complete','EmeraldOS Gold 1.1 setup is complete.','Setup'); setTimeout(()=>location.reload(),350);} function recommendedSetup(){savePrefs(defaultPrefs()); localStorage.setItem(BUILD.setupKey,'true'); location.reload();}

  function installBootMenu(){window.Gold10BootMenu=function(){if($("gold-boot-menu"))return; const d=document.createElement('div'); d.id='gold-boot-menu'; d.innerHTML=`<div class="boot-menu-card"><h1>Emerald Systems BIOS A1</h1><p>Startup options</p><button onclick="location.href='bios.html'">Open BIOS / Emerald DOS</button><button onclick="location.href='staff.html'">EmeraldOS Gold Staff Edition</button><button onclick="document.getElementById('gold-boot-menu').remove()">Continue Boot</button><button onclick="localStorage.removeItem('gold10_gold11SetupDone');localStorage.removeItem('gold10_setupDone');location.reload()">Run First Boot Setup</button></div>`; document.body.appendChild(d);};}

  function install(){installOpenPatch(); applyPrefs(); installBootMenu(); setTimeout(()=>{enhanceStart(); enhanceDesktop(); installFirstBoot(); if(!localStorage.getItem(PREFIX+'gold11Loaded')){localStorage.setItem(PREFIX+'gold11Loaded','true'); notify('EmeraldOS Gold 1.1 loaded','Personalization, apps, settings and Staff Edition controls are active.','System');}},950);}

  window.Gold10Patch2={BUILD,PATCH_APPS,showSection,setColor,saveSettings,quickTheme,resetVisuals,savePersonalization,renderApps,togglePin,toggleHide,pinDefaultApps,hideAllPatchApps,restorePatchApps,staffAction,staffLogout,testFirebase,clearPaint,exportPaint,addBoardNote,deleteBoardNote,clearBoard,addClip,deleteClip,exportClips,saveFocus,saveSound,testSound,openTips,runDOS,clearTemporaryData,exportPrefs,exportWorkspaceLite,restoreDefaults,finishFirstBoot,recommendedSetup};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install();
})();
