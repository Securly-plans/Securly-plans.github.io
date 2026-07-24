"use strict";

/* EmeraldOS Gold 1V local continuity migration.
   This script runs before the desktop. It never writes Firestore. It merges
   every known local Gold namespace and blocks cloud autosave until the
   asynchronous cloud migration in gold1v-continuity.js has completed. */
(function EmeraldOSGold1VLocalMigration(){
  if(window.__EMERALDOS_GOLD_1V_LOCAL_MIGRATION__) return;
  window.__EMERALDOS_GOLD_1V_LOCAL_MIGRATION__=true;
  window.__GOLD1V_MIGRATION_BLOCK_SAVES__=true;

  const PREFIX="gold1g_";
  const REPORT_KEY=PREFIX+"migration_1v_local_report";
  const now=()=>new Date().toISOString();
  const parse=(raw,fallback=null)=>{try{return raw==null?fallback:JSON.parse(raw)}catch{return fallback}};
  const read=(key,fallback=null)=>parse(localStorage.getItem(key),fallback);
  const readMaybe=key=>{const raw=localStorage.getItem(key);return raw===null?undefined:parse(raw,undefined)};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch(error){console.warn("Gold 1V local migration write failed",key,error);return false}};
  const uid=()=>"migrated_"+Math.random().toString(36).slice(2,9)+Date.now().toString(36);

  function normalizeFile(raw,folderHint="Documents"){return window.GoldUniversalFS?.normalizeFile?.(raw,folderHint,{sourceVersion:"legacy"})||raw}


  function collectFiles(value,folderHint="Documents",out=[],seen=new WeakSet()){
    if(value==null)return out;
    if(typeof value==="object"){
      if(seen.has(value))return out;
      seen.add(value);
    }
    if(Array.isArray(value)){
      value.forEach(item=>{
        if(item&&typeof item==="object"&&(item.name||item.filename||item.content!==undefined||item.data!==undefined)){
          const file=normalizeFile(item,folderHint);if(file)out.push(file);
        }else collectFiles(item,folderHint,out,seen);
      });
      return out;
    }
    if(typeof value!=="object")return out;
    if(value.name||value.filename||value.content!==undefined||value.data!==undefined){const file=normalizeFile(value,folderHint);if(file)out.push(file);return out}
    ["files","fileSystem","filesystem","drive","workspace","cloudDrive","documents","items","entries","children"].forEach(key=>{if(value[key]!==undefined)collectFiles(value[key],folderHint,out,seen)});
    if(value.folders&&typeof value.folders==="object")Object.entries(value.folders).forEach(([folder,items])=>collectFiles(items,folder,out,seen));
    return out;
  }

  const fileSignature=file=>[String(file.name||"").toLowerCase(),String(file.folder||"").toLowerCase(),String(file.type||""),String(file.contentFingerprint||file.content||"")].join("|");
  function mergeFiles(...groups){return window.GoldUniversalFS?.mergeFiles?.(...groups)||groups.flat(Infinity).filter(Boolean)}


  function deepMerge(base,incoming){
    if(incoming===undefined||incoming===null)return base;
    if(Array.isArray(base)||Array.isArray(incoming))return mergeArray(Array.isArray(base)?base:[],Array.isArray(incoming)?incoming:[incoming]);
    if(typeof base==="object"&&base&&typeof incoming==="object"&&incoming){
      const result={...base};
      Object.entries(incoming).forEach(([key,value])=>{result[key]=key in result?deepMerge(result[key],value):value});
      return result;
    }
    return incoming;
  }
  function mergeArray(...groups){
    const result=[],seen=new Set();
    groups.flat(Infinity).filter(v=>v!==undefined&&v!==null).forEach(item=>{
      let signature;
      if(item&&typeof item==="object")signature=String(item.id||item.key||item.name||item.email||item.title||"")+"|"+JSON.stringify(item);
      else signature=typeof item+"|"+String(item);
      if(seen.has(signature))return;seen.add(signature);result.push(item);
    });
    return result;
  }

  const fileKeys=[
    "gold1g_files","gold1h_files","gold1i_files","gold1j_files","gold1k_files","gold1l_files","gold1m_files","gold1n_files","gold1o_files","gold1p_files","gold1q_files","gold1r_files","gold1s_files","gold1t_files","gold1u_files","gold1v_files",
    "gold1g_workspace","gold1h_workspace","gold1i_workspace","gold1j_workspace","gold1k_workspace","gold1l_workspace","gold1m_workspace","gold1n_workspace","gold1o_workspace","gold1p_workspace","gold1q_workspace","gold1r_workspace","gold1s_workspace","gold1t_workspace","gold1u_workspace","gold1v_workspace",
    "emerald_session","emerald_workspace","emeraldos_workspace","fileSystem","filesystem","drive"
  ];
  const existingRaw=localStorage.getItem(PREFIX+"files"),existingFiles=read(PREFIX+"files",[]);
  window.GoldUniversalFS?.captureAuthoritativeLocalSnapshot?.(Array.isArray(existingFiles)?existingFiles:[]);
  const historicalGroups=[];fileKeys.forEach(key=>{if(key===PREFIX+"files"||key==="gold1g_files")return;const value=read(key,null);if(value!==null)historicalGroups.push(collectFiles(value))});
  let mergedFiles;if(existingRaw!==null)mergedFiles=window.GoldUniversalFS?.prepareSave?.(Array.isArray(existingFiles)?existingFiles:collectFiles(existingFiles))||[];else mergedFiles=mergeFiles(...historicalGroups);
  write(PREFIX+"files",mergedFiles);
  const previousRecovery=read(PREFIX+"file_recovery_catalog",[]),recovery=window.GoldUniversalFS?.mergeRecovery?.(previousRecovery,...historicalGroups)||[];
  window.GoldUniversalFS?.saveRecovery?.(recovery);

  // Gold 1O stored window continuity in workspace metadata rather than a dedicated category.
  const previousSession=readMaybe(PREFIX+"session_state_1v")||readMaybe(PREFIX+"session_state_1u")||readMaybe(PREFIX+"session_state_1t")||readMaybe(PREFIX+"session_state_1s")||readMaybe(PREFIX+"session_state_1r")||readMaybe(PREFIX+"session_state_1q")||readMaybe(PREFIX+"session_state_1p")||readMaybe(PREFIX+"session_state_1o");
  const previousMeta=readMaybe(PREFIX+"workspace_meta_1p")||readMaybe("gold1p_workspace_meta")||readMaybe(PREFIX+"workspace_meta_1o")||readMaybe("gold1o_workspace_meta");
  if(previousSession!==undefined)write(PREFIX+"session_state_1v",previousSession);
  else if(previousMeta?.openWindows)write(PREFIX+"session_state_1v",{version:"1O",updatedAt:previousMeta.savedAt||now(),windows:previousMeta.openWindows,openApps:[]});
  const previousNotificationPrefs=readMaybe(PREFIX+"notification_preferences_1v")||readMaybe(PREFIX+"notification_preferences_1u")||readMaybe(PREFIX+"notification_preferences_1t")||readMaybe(PREFIX+"notification_preferences_1s")||readMaybe(PREFIX+"notification_preferences_1r")||readMaybe(PREFIX+"notification_preferences_1q")||readMaybe(PREFIX+"notification_preferences_1p")||readMaybe(PREFIX+"notification_preferences_1o");
  if(previousNotificationPrefs!==undefined)write(PREFIX+"notification_preferences_1v",previousNotificationPrefs);
  const previousHomePreference=readMaybe(PREFIX+"home_1v_at_login")??readMaybe(PREFIX+"home_1u_at_login")??readMaybe(PREFIX+"home_1t_at_login")??readMaybe(PREFIX+"home_1s_at_login")??readMaybe(PREFIX+"home_1r_at_login")??readMaybe(PREFIX+"home_1q_at_login")??readMaybe(PREFIX+"home_1p_at_login")??readMaybe(PREFIX+"home_1o_at_login")??readMaybe(PREFIX+"welcome_1n_at_login");
  if(previousHomePreference!==undefined)write(PREFIX+"home_1v_at_login",previousHomePreference);

  const categories=["prefs","folders","mail","notes","tasks","events","contacts","tickets","notifications","user_apps","remote_sessions","emergency_logs","vm_snapshots","custom_app_logos","app_verification_cache","elsus_original_state","elsus_shell_state","sticky_notes","voice_recordings","feedback_1v","routines_1v","accessibility_1v","home_1v_at_login","notification_preferences_1v","session_state_1v","account_history_1v","game_data_1v","calendar_preferences_1v","guide_preferences_1v","radio_stations_1v","radio_preferences_1v","file_tombstones","file_system_metadata","file_recovery_catalog","file_operations_1v","notification_app_permissions_1v","file_shares_1v","shared_files_cache_1v","privacy_audit_1v","personalization_profiles_1v","utility_history_1v"];
  const prefixes=["gold1a_","gold1b_","gold1c_","gold1d_","gold1e_","gold1f_","gold1h_","gold1i_","gold1j_","gold1k_","gold1l_","gold1m_","gold1n_","gold1o_","gold1p_","gold1q_","gold1r_","gold1s_","gold1t_","gold1u_","gold1v_","gold1g_"];
  const categoryResults={};
  categories.forEach(category=>{
    const values=[];
    prefixes.forEach(prefix=>{const value=readMaybe(prefix+category);if(value!==undefined)values.push(value)});
    if(!values.length)return;
    const merged=values.reduce((current,value)=>deepMerge(current,value),Array.isArray(values[0])?[]:{});
    write(PREFIX+category,merged);categoryResults[category]=values.length;
  });

  const versionedFamilies=[
    ["registry","registry_history"],
    ["clipboard_history"],
    ["startup_apps"],
    ["workspace_meta"],
    ["update_preferences"],
    ["update_history"],
    ["focus_sessions"],
    ["feedback"],
    ["routines"],
    ["accessibility"],
    ["account_history"],
    ["game_data"],
    ["calendar_preferences"],
    ["guide_preferences"],
    ["radio_stations"],
    ["radio_preferences"],
    ["file_operations"],
    ["notification_app_permissions"],
    ["file_shares"],
    ["shared_files_cache"],
    ["privacy_audit"]
    ,["personalization_profiles"]
    ,["utility_history"]
  ].flat();
  const sourceVersions=["1h","1i","1j","1k","1l","1m","1n","1o","1p","1q","1r","1s","1t","1u","1v"];
  versionedFamilies.forEach(family=>{
    let merged;
    sourceVersions.forEach(version=>{
      const value=readMaybe(`${PREFIX}${family}_${version}`);
      if(value===undefined)return;
      merged=merged===undefined?value:deepMerge(merged,value);
    });
    if(merged!==undefined)write(`${PREFIX}${family}_1v`,merged);
  });



  const report={completed:true,stage:"local",completedAt:now(),filesBefore:Array.isArray(existingFiles)?existingFiles.length:0,filesAfter:mergedFiles.length,localSourcesChecked:fileKeys,categorySourcesMerged:categoryResults,cloudMigrationPending:true,autosaveBlocked:true,firestoreReleasePointerChanged:false};
  write(REPORT_KEY,report);
  window.Gold1VLocalMigration={report,collectFiles,mergeFiles,deepMerge,mergeArray,normalizeFile};
})();
