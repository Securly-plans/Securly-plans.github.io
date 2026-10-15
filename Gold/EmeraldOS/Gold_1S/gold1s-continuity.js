"use strict";

/* EmeraldOS Gold 1S cloud continuity and migration gate.
   Reads every supported split schema, version-specific category backup,
   legacy drive location, and recoverable orphaned chunk before permitting
   Gold 1S to save over the shared VM. This module never writes the shared
   system/emeraldGoldLatest release pointer. */
(function EmeraldOSGold1SContinuity(){
  if(window.__EMERALDOS_GOLD_1S_CONTINUITY__)return;
  window.__EMERALDOS_GOLD_1S_CONTINUITY__=true;

  const VERSION="1S",PREFIX="gold1g_",REPORT_KEY=PREFIX+"migration_1s_cloud_report";
  const now=()=>new Date().toISOString();
  const read=(key,fallback)=>{try{const raw=localStorage.getItem(key);return raw===null?fallback:JSON.parse(raw)}catch{return fallback}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch(error){console.warn("Gold 1S continuity local write failed",key,error);return false}};
  const helper=()=>window.Gold1SLocalMigration||{};
  const normalizeFile=(raw,folder)=>helper().normalizeFile?.(raw,folder)||raw;
  const collectFiles=(value,folder="Documents")=>helper().collectFiles?.(value,folder,[])||[];
  const mergeFiles=(...groups)=>helper().mergeFiles?.(...groups)||groups.flat();
  const deepMerge=(a,b)=>helper().deepMerge?.(a,b)??b;
  const mergeArray=(...groups)=>helper().mergeArray?.(...groups)||groups.flat();
  const categoryAliases={
    registry_1h:"registry_1s",registry_1i:"registry_1s",registry_1j:"registry_1s",registry_1k:"registry_1s",registry_1l:"registry_1s",registry_1m:"registry_1s",registry_1n:"registry_1s",registry_1o:"registry_1s",registry_1p:"registry_1s",registry_1s:"registry_1s",
    registry_1h_history:"registry_1s_history",registry_1i_history:"registry_1s_history",registry_1j_history:"registry_1s_history",registry_1k_history:"registry_1s_history",registry_1l_history:"registry_1s_history",registry_1m_history:"registry_1s_history",registry_1n_history:"registry_1s_history",registry_1o_history:"registry_1s_history",registry_1p_history:"registry_1s_history",registry_1s_history:"registry_1s_history",
    clipboard_history_1h:"clipboard_history_1s",clipboard_history_1i:"clipboard_history_1s",clipboard_history_1j:"clipboard_history_1s",clipboard_history_1k:"clipboard_history_1s",clipboard_history_1l:"clipboard_history_1s",clipboard_history_1m:"clipboard_history_1s",clipboard_history_1n:"clipboard_history_1s",clipboard_history_1o:"clipboard_history_1s",clipboard_history_1p:"clipboard_history_1s",clipboard_history_1s:"clipboard_history_1s",
    startup_apps_1h:"startup_apps_1s",startup_apps_1i:"startup_apps_1s",startup_apps_1j:"startup_apps_1s",startup_apps_1k:"startup_apps_1s",startup_apps_1l:"startup_apps_1s",startup_apps_1m:"startup_apps_1s",startup_apps_1n:"startup_apps_1s",startup_apps_1o:"startup_apps_1s",startup_apps_1p:"startup_apps_1s",startup_apps_1s:"startup_apps_1s",
    update_preferences_1k:"update_preferences_1s",update_preferences_1l:"update_preferences_1s",update_preferences_1m:"update_preferences_1s",update_preferences_1n:"update_preferences_1s",update_preferences_1o:"update_preferences_1s",update_preferences_1p:"update_preferences_1s",update_preferences_1s:"update_preferences_1s",
    update_history_1k:"update_history_1s",update_history_1l:"update_history_1s",update_history_1m:"update_history_1s",update_history_1n:"update_history_1s",update_history_1o:"update_history_1s",update_history_1p:"update_history_1s",update_history_1s:"update_history_1s",
    focus_sessions_1k:"focus_sessions_1s",focus_sessions_1l:"focus_sessions_1s",focus_sessions_1m:"focus_sessions_1s",focus_sessions_1n:"focus_sessions_1s",focus_sessions_1o:"focus_sessions_1s",focus_sessions_1p:"focus_sessions_1s",focus_sessions_1s:"focus_sessions_1s",
    feedback_1n:"feedback_1s",feedback_1o:"feedback_1s",feedback_1p:"feedback_1s",feedback_1s:"feedback_1s",routines_1n:"routines_1s",routines_1o:"routines_1s",routines_1p:"routines_1s",routines_1s:"routines_1s",accessibility_1n:"accessibility_1s",accessibility_1o:"accessibility_1s",accessibility_1p:"accessibility_1s",accessibility_1s:"accessibility_1s",welcome_1n_at_login:"home_1s_at_login",home_1o_at_login:"home_1s_at_login",home_1p_at_login:"home_1s_at_login",home_1s_at_login:"home_1s_at_login",notification_preferences_1o:"notification_preferences_1s",notification_preferences_1p:"notification_preferences_1s",notification_preferences_1s:"notification_preferences_1s",session_state_1o:"session_state_1s",session_state_1p:"session_state_1s",session_state_1s:"session_state_1s",account_history_1p:"account_history_1s",account_history_1s:"account_history_1s",game_data_1p:"game_data_1s",game_data_1s:"game_data_1s",calendar_preferences_1p:"calendar_preferences_1s",calendar_preferences_1s:"calendar_preferences_1s"
    ,registry_1q:"registry_1s",registry_1q_history:"registry_1s_history",clipboard_history_1q:"clipboard_history_1s",startup_apps_1q:"startup_apps_1s",update_preferences_1q:"update_preferences_1s",update_history_1q:"update_history_1s",focus_sessions_1q:"focus_sessions_1s",feedback_1q:"feedback_1s",routines_1q:"routines_1s",accessibility_1q:"accessibility_1s",home_1q_at_login:"home_1s_at_login",notification_preferences_1q:"notification_preferences_1s",session_state_1q:"session_state_1s",account_history_1q:"account_history_1s",game_data_1q:"game_data_1s",calendar_preferences_1q:"calendar_preferences_1s",registry_1r:"registry_1s",registry_1r_history:"registry_1s_history",clipboard_history_1r:"clipboard_history_1s",startup_apps_1r:"startup_apps_1s",update_preferences_1r:"update_preferences_1s",update_history_1r:"update_history_1s",focus_sessions_1r:"focus_sessions_1s",feedback_1r:"feedback_1s",routines_1r:"routines_1s",accessibility_1r:"accessibility_1s",home_1r_at_login:"home_1s_at_login",notification_preferences_1r:"notification_preferences_1s",session_state_1r:"session_state_1s",account_history_1r:"account_history_1s",game_data_1r:"game_data_1s",calendar_preferences_1r:"calendar_preferences_1s",file_operations_1r:"file_operations_1s",guide_preferences_1s:"guide_preferences_1s",radio_stations_1s:"radio_stations_1s",radio_preferences_1s:"radio_preferences_1s",guide_preferences_1r:"guide_preferences_1s",radio_stations_1r:"radio_stations_1s",radio_preferences_1r:"radio_preferences_1s"
  };
  const canonical=category=>categoryAliases[category]||category;
  const knownVersions=["1H","1I","1J","1K","1L","1M","1N","1O","1P","1Q","1R","1S"];
  const knownSchemas=new Set([
    "gold1h-split-v1","gold1h-split-v2","gold1i-split-v1","gold1i-split-v2","gold1j-split-v1","gold1j-split-v2",
    "gold1k-split-v1","gold1k-split-v2","gold1l-split-v1","gold1l-split-v2","gold1m-split-v1","gold1m-split-v2","gold1n-split-v1","gold1n-split-v2","gold1o-split-v1","gold1o-split-v2","gold1p-split-v1","gold1p-split-v2","gold1q-split-v1","gold1q-split-v2","gold1r-split-v1","gold1r-split-v2","gold1s-split-v1","gold1s-split-v2"
  ]);
  const baseCategories=["file_tombstones","file_system_metadata","files","file_recovery_catalog","folders","tickets","mail","notes","tasks","events","contacts","notifications","user_apps","remote_sessions","emergency_logs","vm_snapshots","custom_app_logos","app_verification_cache","elsus_original_state","elsus_shell_state","sticky_notes","voice_recordings","feedback_1s","routines_1s","accessibility_1s","home_1s_at_login","notification_preferences_1s","session_state_1s","account_history_1s","game_data_1s","calendar_preferences_1s","guide_preferences_1s","radio_stations_1s","radio_preferences_1s","file_operations_1s"];
  const targetCategories=[...baseCategories,"registry_1s","registry_1s_history","clipboard_history_1s","startup_apps_1s","update_preferences_1s","update_history_1s","focus_sessions_1s","account_history_1s","game_data_1s","calendar_preferences_1s","guide_preferences_1s","radio_stations_1s","radio_preferences_1s","file_operations_1s"];
  const sourceMap=new Map();
  const addSource=(category,value,label)=>{
    if(value===undefined||value===null)return;
    const target=canonical(category);
    if(!sourceMap.has(target))sourceMap.set(target,[]);
    sourceMap.get(target).push({value,label,sourceCategory:category});
  };

  function localKeyFor(category){
    if(category==="registry_1s")return PREFIX+"registry_1s";
    if(category==="registry_1s_history")return PREFIX+"registry_1s_history";
    if(category==="clipboard_history_1s")return PREFIX+"clipboard_history_1s";
    if(category==="startup_apps_1s")return PREFIX+"startup_apps_1s";
    if(category==="update_preferences_1s")return PREFIX+"update_preferences_1s";
    if(category==="update_history_1s")return PREFIX+"update_history_1s";
    if(category==="focus_sessions_1s")return PREFIX+"focus_sessions_1s";
    if(category==="notification_preferences_1s")return PREFIX+"notification_preferences_1s";
    if(category==="session_state_1s")return PREFIX+"session_state_1s";
    if(category==="account_history_1s")return PREFIX+"account_history_1s";
    if(category==="game_data_1s")return PREFIX+"game_data_1s";
    if(category==="calendar_preferences_1s")return PREFIX+"calendar_preferences_1s";
    if(category==="guide_preferences_1s")return PREFIX+"guide_preferences_1s";
    if(category==="radio_stations_1s")return PREFIX+"radio_stations_1s";
    if(category==="radio_preferences_1s")return PREFIX+"radio_preferences_1s";
    return PREFIX+category;
  }

  function mergeCategory(category,sources){
    const localValue=read(localKeyFor(category),undefined);
    const values=sources.map(item=>item.value);
    if(localValue!==undefined)values.push(localValue);
    if(category==="file_tombstones")return window.GoldUniversalFS?.mergeTombstones?.(...values)||mergeArray(...values);
    if(category==="files"){const metadata=read(PREFIX+"file_system_metadata",{}),localFiles=Array.isArray(localValue)?collectFiles(localValue):[],cloudSavedAt=Date.parse(window.__GOLD1S_CLOUD_SUMMARY_SAVED_AT__||0)||0,localSavedAt=Date.parse(metadata.authoritativeDataSavedAt||0)||0;if(metadata.authoritativeLocalSnapshot===true&&(!cloudSavedAt||localSavedAt>=cloudSavedAt)){const historical=values.filter(value=>value!==localValue).map(value=>collectFiles(value));window.GoldUniversalFS?.saveRecovery?.(window.GoldUniversalFS?.mergeRecovery?.(window.GoldUniversalFS?.recoveryCatalog?.()||[],...historical)||[]);return mergeFiles(localFiles)}return mergeFiles(...values.map(value=>collectFiles(value)))}
    if(category==="file_recovery_catalog")return window.GoldUniversalFS?.mergeRecovery?.(...values.map(value=>collectFiles(value)))||mergeFiles(...values.map(value=>collectFiles(value)));
    const arrayCategory=["tickets","notes","tasks","events","contacts","notifications","user_apps","remote_sessions","emergency_logs","vm_snapshots","sticky_notes","voice_recordings","registry_1s_history","clipboard_history_1s","startup_apps_1s","update_history_1s","account_history_1s","file_tombstones","file_recovery_catalog","radio_stations_1s","file_operations_1s"].includes(category);
    if(arrayCategory)return mergeArray(...values.map(value=>Array.isArray(value)?value:[value]));
    return values.reduce((current,value)=>current===undefined?value:deepMerge(current,value),undefined);
  }

  async function readStoredDocument(docSnap,fb,chunkCollection="goldVMVersionChunks",vmUser=currentUser()){
    if(!docSnap?.exists?.())return undefined;
    const data=docSnap.data();
    if(data.format==="json")return JSON.parse(data.json||"null");
    if(data.format==="chunks"){
      const parts=[];
      for(let index=0;index<Number(data.count||0);index++){
        const id=`${docSnap.id}__${String(index).padStart(4,"0")}`;
        const part=await fb.getDoc(fb.doc(fb.db,"emeraldOSUsers",vmUser,chunkCollection,id));
        if(!part.exists())throw new Error(`Missing migration backup chunk ${id}`);
        parts.push(part.data().data||"");
      }
      return JSON.parse(parts.join(""));
    }
    return data.value;
  }

  function currentUser(){return localStorage.getItem("userId")||localStorage.getItem(PREFIX+"userId")||localStorage.getItem("username")||localStorage.getItem(PREFIX+"username")||"GoldUser"}
  function userCandidates(){
    const values=[localStorage.getItem("userId"),localStorage.getItem(PREFIX+"userId"),localStorage.getItem("username"),localStorage.getItem(PREFIX+"username")];
    return [...new Set(values.flatMap(value=>value?[String(value),String(value).toLowerCase()]:[]).filter(Boolean))];
  }

  async function readCanonicalCategory(fb,category,vmUser=currentUser()){
    const snap=await fb.getDoc(fb.doc(fb.db,"emeraldOSUsers",vmUser,"goldVMData",category));
    if(!snap.exists())return undefined;
    const meta=snap.data();
    if(meta.format==="json")return JSON.parse(meta.json||"null");
    if(meta.format==="chunks"){
      const parts=[];
      for(let index=0;index<Number(meta.count||0);index++){
        const chunk=await fb.getDoc(fb.doc(fb.db,"emeraldOSUsers",vmUser,"goldVMChunks",`${category}__${String(index).padStart(4,"0")}`));
        if(!chunk.exists())throw new Error(`Missing cloud chunk ${category} ${index}`);
        parts.push(chunk.data().data||"");
      }
      return JSON.parse(parts.join(""));
    }
    return meta.value;
  }

  async function collectOrphanedChunks(fb,vmUser=currentUser()){
    try{
      const snapshot=await fb.getDocs(fb.collection(fb.db,"emeraldOSUsers",vmUser,"goldVMChunks"));
      const groups=new Map();
      snapshot.docs.forEach(docSnap=>{
        const data=docSnap.data(),category=data.category||docSnap.id.split("__")[0];
        if(!groups.has(category))groups.set(category,[]);
        groups.get(category).push({index:Number(data.index??docSnap.id.split("__").pop()),data:String(data.data||"")});
      });
      for(const [category,parts] of groups){
        parts.sort((a,b)=>a.index-b.index);
        try{const value=JSON.parse(parts.map(part=>part.data).join(""));addSource(category,value,"orphaned cloud chunks")}catch{}
      }
    }catch(error){console.debug("Gold 1S orphaned chunk recovery unavailable",error?.message)}
  }

  async function archiveSourceCategory(fb,version,category,value,vmUser=currentUser()){
    if(value===undefined)return;
    const safeVersion=String(version||"UNKNOWN").toUpperCase().replace(/[^0-9A-Z_-]/g,"_");
    const id=`${safeVersion}__${category}`,json=JSON.stringify(value??null),base={version:safeVersion,category,updatedAt:now(),source:"Gold 1S pre-migration archive"};
    if(new Blob([json]).size<650000){
      await fb.setDoc(fb.doc(fb.db,"emeraldOSUsers",vmUser,"goldVMVersionData",id),{...base,format:"json",json},{merge:true});return;
    }
    const size=450000,chunks=[];for(let offset=0;offset<json.length;offset+=size)chunks.push(json.slice(offset,offset+size));
    await fb.setDoc(fb.doc(fb.db,"emeraldOSUsers",vmUser,"goldVMVersionData",id),{...base,format:"chunks",count:chunks.length},{merge:true});
    await Promise.all(chunks.map((data,index)=>fb.setDoc(fb.doc(fb.db,"emeraldOSUsers",vmUser,"goldVMVersionChunks",`${id}__${String(index).padStart(4,"0")}`),{version:safeVersion,category,index,data,updatedAt:now()},{merge:true})));
  }

  async function collectCloudSources(fb){
    let newestSummary=null,sourceVersion="none";
    for(const vmUser of userCandidates()){
      let summary=null;
      try{
        const current=await fb.getDoc(fb.doc(fb.db,"emeraldOSUsers",vmUser,"goldVM","current"));
        summary=current.exists()?current.data():null;
      }catch(error){console.debug("Gold 1S VM summary source skipped",vmUser,error?.message)}
      const candidateVersion=String(summary?.version||summary?.activeVersion||"UNKNOWN").toUpperCase();
      if(summary&&!newestSummary){newestSummary=summary;sourceVersion=candidateVersion}if(summary?.savedAt){const prior=Date.parse(window.__GOLD1S_CLOUD_SUMMARY_SAVED_AT__||0)||0;if(Date.parse(summary.savedAt)>prior)window.__GOLD1S_CLOUD_SUMMARY_SAVED_AT__=summary.savedAt}
      if(summary){
        if(summary.openWindows)addSource("session_state_1s",{version:candidateVersion,updatedAt:summary.savedAt||now(),windows:summary.openWindows,openApps:[]},`goldVM/current window summary at ${vmUser}`);
        if(knownSchemas.has(summary.schema)){
          for(const category of summary.categories||[]){
            try{
              const value=await readCanonicalCategory(fb,category,vmUser);
              addSource(category,value,`current split VM ${summary.schema} at ${vmUser}`);
              await archiveSourceCategory(fb,candidateVersion,category,value,currentUser());
            }catch(error){console.warn("Gold 1S category migration skipped",category,error)}
          }
        }else{
          Object.entries(summary).forEach(([category,value])=>addSource(category,value,`legacy goldVM/current at ${vmUser}`));
        }
      }

      try{
        const allCurrent=await fb.getDocs(fb.collection(fb.db,"emeraldOSUsers",vmUser,"goldVMData"));
        for(const docSnap of allCurrent.docs){try{addSource(docSnap.id,await readCanonicalCategory(fb,docSnap.id,vmUser),`goldVMData scan at ${vmUser}`)}catch{}}
      }catch(error){console.debug("Gold 1S category scan unavailable",vmUser,error?.message)}

      try{
        const versions=await fb.getDocs(fb.collection(fb.db,"emeraldOSUsers",vmUser,"goldVMVersionData"));
        for(const docSnap of versions.docs){
          const match=docSnap.id.match(/^([^_]+(?:_[^_]+)?)__(.+)$/),category=docSnap.data().category||match?.[2];
          if(!category)continue;
          try{const value=await readStoredDocument(docSnap,fb,"goldVMVersionChunks",vmUser);addSource(category==="files"?"file_recovery_catalog":category,value,`version backup ${docSnap.data().version||match?.[1]||"unknown"} at ${vmUser}`)}catch{}
        }
      }catch(error){console.debug("Gold 1S version backup scan unavailable",vmUser,error?.message)}

      const legacyPaths=[
        ["emeraldOSUsers",vmUser],
        ["emeraldOSUsers",vmUser,"drive","root"],
        ["emeraldOSUsers",vmUser,"drive","files"],
        ["emeraldOSUsers",vmUser,"cloudDrive","current"]
      ];
      for(const path of legacyPaths){
        try{const snap=await fb.getDoc(fb.doc(fb.db,...path));if(snap.exists()){addSource("file_recovery_catalog",collectFiles(snap.data()),`legacy ${path.join("/")}`);Object.entries(snap.data()).forEach(([key,value])=>{if(key!=="files")addSource(key,value,`legacy ${path.join("/")}`)})}}catch{}
      }
      await collectOrphanedChunks(fb,vmUser);
    }
    return {summary:newestSummary,sourceVersion};
  }

  function collectLocalSources(){
    targetCategories.forEach(category=>{
      const candidates=new Set([localKeyFor(category)]);
      knownVersions.forEach(version=>{
        const lower=version.toLowerCase();
        candidates.add(`gold${lower}_${category}`);
        candidates.add(`${PREFIX}${category.replace(/_1s$/,`_${lower}`)}`);
      });
      candidates.forEach(key=>{const value=read(key,undefined);if(value!==undefined)addSource(category,value,`local ${key}`)});
    });
    ["gold1g_workspace","gold1h_workspace","gold1i_workspace","gold1j_workspace","gold1k_workspace","gold1l_workspace","gold1m_workspace","gold1n_workspace","gold1o_workspace","gold1p_workspace","gold1s_workspace","emerald_session","emerald_workspace","emeraldos_workspace"].forEach(key=>{const value=read(key,undefined);if(value!==undefined){addSource("file_recovery_catalog",collectFiles(value),`local workspace ${key}`);Object.entries(value||{}).forEach(([category,data])=>{if(category!=="files")addSource(category,data,`local workspace ${key}`)})}});
  }

  function applyMergedState(){
    const report={completed:false,stage:"merge",startedAt:now(),sourceCounts:{},categoryCounts:{},filesBefore:(read(PREFIX+"files",[])||[]).length,firestoreReleasePointerChanged:false};
    for(const category of targetCategories){
      const sources=sourceMap.get(category)||[];if(!sources.length)continue;
      const merged=mergeCategory(category,sources);if(merged===undefined)continue;
      if(category==="file_tombstones")window.GoldUniversalFS?.saveTombstones?.(merged);else if(category==="file_recovery_catalog")window.GoldUniversalFS?.saveRecovery?.(merged);else write(localKeyFor(category),merged);
      report.sourceCounts[category]=sources.length;
      report.categoryCounts[category]=Array.isArray(merged)?merged.length:Object.keys(merged||{}).length;
    }
    const protectedFiles=window.GoldUniversalFS?.prepareSave?.(read(PREFIX+"files",[]))||read(PREFIX+"files",[]);write(PREFIX+"files",protectedFiles);const files=protectedFiles;report.filesAfter=Array.isArray(files)?files.length:0;
    report.completed=true;report.stage="merged";report.completedAt=now();return report;
  }

  function refreshDesktop(){
    try{window.Gold50?.setPrefs?.(read(PREFIX+"prefs",{}));window.Gold50?.saveFiles?.(read(PREFIX+"files",[]));window.Gold50?.renderDesktop?.();window.Gold50?.renderStartMenu?.();window.Gold50?.renderNotificationBadge?.()}catch(error){console.debug("Gold 1S UI refresh after migration skipped",error?.message)}
  }

  function openMigrationCenter(){
    const report=read(REPORT_KEY,{stage:"not run"}),local=read(PREFIX+"migration_1s_local_report",{}),files=read(PREFIX+"files",[]);
    const rows=Object.entries(report.categoryCounts||{}).map(([category,count])=>`<tr><td>${category}</td><td>${count}</td><td>${report.sourceCounts?.[category]||0}</td></tr>`).join("");
    const html=`<div class="app-shell migration-center"><div class="app-toolbar"><button id="migrationRunAgain" class="button primary">Scan and merge again</button><button id="migrationSaveNow" class="button">Save protected VM</button><button id="migrationExport" class="button">Export report</button></div><div class="app-body"><h1>Migration &amp; Continuity</h1><p>Gold 1S merges files, settings, preferences, registry data, mail, apps, and other VM categories before cloud autosave is enabled.</p><div class="grid3"><div class="card"><b>Status</b><h2>${report.completed?"Complete":"Pending"}</h2></div><div class="card"><b>Files available</b><h2>${Array.isArray(files)?files.length:0}</h2></div><div class="card"><b>Autosave gate</b><h2>${window.__GOLD1S_MIGRATION_BLOCK_SAVES__?"Blocked":"Open"}</h2></div></div><div class="migration-table"><table><thead><tr><th>Category</th><th>Items / fields</th><th>Sources merged</th></tr></thead><tbody>${rows||'<tr><td colspan="3">No migration report is available yet.</td></tr>'}</tbody></table></div><p class="muted">Local migration: ${local.completed?"complete":"pending"}. Firestore latest-version pointer changed: no.</p></div></div>`;
    const win=window.Gold50?.openWindow?.("migrationcenter","Migration & Continuity",html,{width:900,height:650});
    win?.querySelector("#migrationRunAgain")?.addEventListener("click",()=>runMigration(true));
    win?.querySelector("#migrationSaveNow")?.addEventListener("click",()=>window.Gold1S?.saveWorkspaceNow?.(true));
    win?.querySelector("#migrationExport")?.addEventListener("click",()=>{const blob=new Blob([JSON.stringify({local,cloud:report},null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="EmeraldOS-Gold-1S-Migration-Report.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
    return win;
  }

  function registerMigrationApp(){
    const apps=window.Gold50?.APPS;if(!Array.isArray(apps)||apps.some(app=>app.id==="migrationcenter"))return;
    apps.push({id:"migrationcenter",name:"Migration & Continuity",label:"MC",color:"#0078d7",group:"System",desc:"Verify files and VM data carried forward from previous Gold versions.",open:openMigrationCenter});
    window.Gold50?.renderDesktop?.();window.Gold50?.renderStartMenu?.();
  }

  function withTimeout(promise,milliseconds,label){
    return Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error(label||"Operation timed out")),milliseconds))]);
  }

  async function runMigration(show=false){
    if(window.__GOLD1S_MIGRATION_RUNNING__)return window.__GOLD1S_MIGRATION_PROMISE__;
    window.__GOLD1S_MIGRATION_RUNNING__=true;
    sourceMap.clear();collectLocalSources();
    const promise=(async()=>{
      let cloudInfo={summary:null,sourceVersion:"none"},cloudError=null;
      try{const fb=await withTimeout(import("./firebase.js"),20000,"Firebase migration connection timed out");if(fb.db)cloudInfo=await withTimeout(collectCloudSources(fb),30000,"Cloud migration scan timed out");else cloudError="Firebase is not configured"}catch(error){cloudError=error.message;console.warn("Gold 1S cloud migration continued locally",error)}
      const report=applyMergedState();report.cloudSourceVersion=cloudInfo.sourceVersion;report.cloudSchema=cloudInfo.summary?.schema||"none";report.cloudError=cloudError;report.autosaveBlockedDuringMigration=true;
      const cloudTemporarilyUnverified=Boolean(cloudError&&cloudError!=="Firebase is not configured");
      if(cloudTemporarilyUnverified){
        report.completed=false;report.stage="waiting-for-cloud";report.autosaveStillBlocked=true;report.retryRecommended=true;
        write(REPORT_KEY,report);refreshDesktop();
        window.__GOLD1S_MIGRATION_BLOCK_SAVES__=true;window.__GOLD1S_MIGRATION_COMPLETE__=false;
        localStorage.setItem(PREFIX+"cloud_status","migration waiting for cloud verification");
        if(show)window.Gold1S?.notify?.("Cloud migration not verified","Gold 1S kept cloud autosave blocked so older files cannot be overwritten. Reconnect and run the migration scan again.","Migration & Continuity");
        return report;
      }
      report.autosaveUnblockedAt=now();report.autosaveStillBlocked=false;
      write(REPORT_KEY,report);refreshDesktop();
      window.__GOLD1S_MIGRATION_BLOCK_SAVES__=false;window.__GOLD1S_MIGRATION_COMPLETE__=true;
      try{window.__GOLD1S_MIGRATION_COMMITTING__=true;await window.Gold1S?.saveWorkspaceNow?.(false)}catch(error){console.warn("Gold 1S post-migration save deferred",error)}finally{window.__GOLD1S_MIGRATION_COMMITTING__=false}
      const noticeKey=PREFIX+"migration_1s_notice_shown";
      if(show||localStorage.getItem(noticeKey)!=="true"){
        window.Gold1S?.notify?.("Migration complete",`${report.filesAfter||0} files and all available VM categories were merged before cloud autosave was enabled.`,"Migration & Continuity");
        localStorage.setItem(noticeKey,"true");
      }
      return report;
    })().finally(()=>{window.__GOLD1S_MIGRATION_RUNNING__=false});
    window.__GOLD1S_MIGRATION_PROMISE__=promise;return promise;
  }

  function install(){
    registerMigrationApp();
    const api=window.Gold1S||{};api.runMigration=runMigration;api.openMigrationCenter=openMigrationCenter;api.migrationReport=()=>read(REPORT_KEY,null);window.Gold1S=api;
    if(window.Gold50){window.Gold50.openMigrationCenter=openMigrationCenter;window.Gold50.runMigration=runMigration}
    runMigration(false);
    window.addEventListener("online",()=>{if(window.__GOLD1S_MIGRATION_BLOCK_SAVES__===true)setTimeout(()=>runMigration(false),1000)});
    setInterval(()=>{if(window.__GOLD1S_MIGRATION_BLOCK_SAVES__===true&&navigator.onLine)runMigration(false)},60000);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(install,500),{once:true});else setTimeout(install,500);
})();
