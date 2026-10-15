"use strict";

/* EmeraldOS Gold 1Q local continuity migration.
   This script runs before the desktop. It never writes Firestore. It merges
   every known local Gold namespace and blocks cloud autosave until the
   asynchronous cloud migration in gold1q-continuity.js has completed. */
(function EmeraldOSGold1QLocalMigration(){
  if(window.__EMERALDOS_GOLD_1Q_LOCAL_MIGRATION__) return;
  window.__EMERALDOS_GOLD_1Q_LOCAL_MIGRATION__=true;
  window.__GOLD1Q_MIGRATION_BLOCK_SAVES__=true;

  const PREFIX="gold1g_";
  const REPORT_KEY=PREFIX+"migration_1q_local_report";
  const now=()=>new Date().toISOString();
  const parse=(raw,fallback=null)=>{try{return raw==null?fallback:JSON.parse(raw)}catch{return fallback}};
  const read=(key,fallback=null)=>parse(localStorage.getItem(key),fallback);
  const readMaybe=key=>{const raw=localStorage.getItem(key);return raw===null?undefined:parse(raw,undefined)};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch(error){console.warn("Gold 1Q local migration write failed",key,error);return false}};
  const uid=()=>"migrated_"+Math.random().toString(36).slice(2,9)+Date.now().toString(36);

  function normalizeFile(raw,folderHint="Documents"){
    if(raw==null)return null;
    if(typeof raw==="string")raw={name:"Migrated File.txt",content:raw,type:"text"};
    if(typeof raw!=="object")return null;
    const name=String(raw.name||raw.filename||raw.title||raw.path?.split("/").pop()||"Migrated File").trim();
    if(!name)return null;
    const ext=(name.split(".").pop()||"").toLowerCase();
    let type=String(raw.type||raw.fileType||"").toLowerCase();
    if(!type||type.includes("/"))type=({txt:"text",note:"note",doc:"doc",edoc:"doc",sheet:"sheet",esheet:"sheet",slide:"slide",eslide:"slide",form:"form",png:"image",jpg:"image",jpeg:"image",gif:"image",webp:"image",svg:"image",mp3:"audio",wav:"audio",ogg:"audio",mp4:"video",webm:"video",js:"app",json:"text",html:"text",css:"text"})[ext]||"text";
    const folder=String(raw.folder||raw.directory||raw.parent||folderHint||"Documents").replace(/^\/+|\/+$/g,"")||"Documents";
    let content=raw.content??raw.data??raw.text??raw.body??raw.value??"";
    if(content&&typeof content==="object")try{content=JSON.stringify(content)}catch{content=String(content)}
    return {...raw,id:String(raw.id||raw.fileId||uid()),name,type,folder,content:String(content??""),created:raw.created||raw.createdAt||now(),updated:raw.updated||raw.updatedAt||now(),trash:Boolean(raw.trash||raw.deleted),migratedTo:"1Q"};
  }

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

  const fileSignature=file=>[String(file.name||"").toLowerCase(),String(file.folder||"").toLowerCase(),String(file.type||""),String(file.content||"")].join("|");
  function mergeFiles(...groups){
    const byId=new Map(),bySignature=new Map(),merged=[];
    groups.flat(Infinity).filter(Boolean).forEach(raw=>{
      const file=normalizeFile(raw,raw?.folder||"Documents");if(!file)return;
      const signature=fileSignature(file),sameContent=bySignature.get(signature),sameId=byId.get(file.id);
      if(sameContent){if(Date.parse(file.updated||0)>Date.parse(sameContent.updated||0))Object.assign(sameContent,{...sameContent,...file});return}
      if(sameId)file.id=`${file.id}_1q_${Math.random().toString(36).slice(2,8)}`;
      byId.set(file.id,file);bySignature.set(signature,file);merged.push(file);
    });
    return merged;
  }

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
    "gold1g_files","gold1h_files","gold1i_files","gold1j_files","gold1k_files","gold1l_files","gold1m_files","gold1n_files","gold1o_files","gold1p_files","gold1q_files",
    "gold1g_workspace","gold1h_workspace","gold1i_workspace","gold1j_workspace","gold1k_workspace","gold1l_workspace","gold1m_workspace","gold1n_workspace","gold1o_workspace","gold1p_workspace","gold1q_workspace",
    "emerald_session","emerald_workspace","emeraldos_workspace","fileSystem","filesystem","drive"
  ];
  const existingFiles=read(PREFIX+"files",[]);
  const fileGroups=[Array.isArray(existingFiles)?existingFiles:collectFiles(existingFiles)];
  fileKeys.forEach(key=>{const value=read(key,null);if(value!==null)fileGroups.push(collectFiles(value))});
  const mergedFiles=mergeFiles(...fileGroups);
  if(mergedFiles.length||Array.isArray(existingFiles))write(PREFIX+"files",mergedFiles);

  // Gold 1O stored window continuity in workspace metadata rather than a dedicated category.
  const previousSession=readMaybe(PREFIX+"session_state_1q")||readMaybe(PREFIX+"session_state_1p")||readMaybe(PREFIX+"session_state_1o");
  const previousMeta=readMaybe(PREFIX+"workspace_meta_1p")||readMaybe("gold1p_workspace_meta")||readMaybe(PREFIX+"workspace_meta_1o")||readMaybe("gold1o_workspace_meta");
  if(previousSession!==undefined)write(PREFIX+"session_state_1q",previousSession);
  else if(previousMeta?.openWindows)write(PREFIX+"session_state_1q",{version:"1O",updatedAt:previousMeta.savedAt||now(),windows:previousMeta.openWindows,openApps:[]});
  const previousNotificationPrefs=readMaybe(PREFIX+"notification_preferences_1q")||readMaybe(PREFIX+"notification_preferences_1p")||readMaybe(PREFIX+"notification_preferences_1o");
  if(previousNotificationPrefs!==undefined)write(PREFIX+"notification_preferences_1q",previousNotificationPrefs);
  const previousHomePreference=readMaybe(PREFIX+"home_1q_at_login")??readMaybe(PREFIX+"home_1p_at_login")??readMaybe(PREFIX+"home_1o_at_login")??readMaybe(PREFIX+"welcome_1n_at_login");
  if(previousHomePreference!==undefined)write(PREFIX+"home_1q_at_login",previousHomePreference);

  const categories=["prefs","folders","mail","notes","tasks","events","contacts","tickets","notifications","user_apps","remote_sessions","emergency_logs","vm_snapshots","custom_app_logos","app_verification_cache","elsus_original_state","elsus_shell_state","sticky_notes","voice_recordings","feedback_1q","routines_1q","accessibility_1q","home_1q_at_login","notification_preferences_1q","session_state_1q","account_history_1q","game_data_1q","calendar_preferences_1q"];
  const prefixes=["gold1a_","gold1b_","gold1c_","gold1d_","gold1e_","gold1f_","gold1h_","gold1i_","gold1j_","gold1k_","gold1l_","gold1m_","gold1n_","gold1o_","gold1p_","gold1q_","gold1g_"];
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
    ["calendar_preferences"]
  ].flat();
  const sourceVersions=["1h","1i","1j","1k","1l","1m","1n","1o","1p","1q"];
  versionedFamilies.forEach(family=>{
    let merged;
    sourceVersions.forEach(version=>{
      const value=readMaybe(`${PREFIX}${family}_${version}`);
      if(value===undefined)return;
      merged=merged===undefined?value:deepMerge(merged,value);
    });
    if(merged!==undefined)write(`${PREFIX}${family}_1q`,merged);
  });



  const report={completed:true,stage:"local",completedAt:now(),filesBefore:Array.isArray(existingFiles)?existingFiles.length:0,filesAfter:mergedFiles.length,localSourcesChecked:fileKeys,categorySourcesMerged:categoryResults,cloudMigrationPending:true,autosaveBlocked:true,firestoreReleasePointerChanged:false};
  write(REPORT_KEY,report);
  window.Gold1QLocalMigration={report,collectFiles,mergeFiles,deepMerge,mergeArray,normalizeFile};
})();
