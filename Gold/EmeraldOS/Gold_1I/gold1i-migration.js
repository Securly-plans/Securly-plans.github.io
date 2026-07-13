"use strict";

/* EmeraldOS Gold 1I local migration bridge.
   Runs before the desktop initializes. It merges legacy files and data into
   the version-independent gold1g_* VM namespace without changing the shared
   E.L.S.U.S. Firestore release pointer. */
(function EmeraldOSGold1ILocalMigration(){
  if(window.__EMERALDOS_GOLD_1I_LOCAL_MIGRATION__) return;
  window.__EMERALDOS_GOLD_1I_LOCAL_MIGRATION__=true;

  const CANON_PREFIX="gold1g_";
  const REPORT_KEY=CANON_PREFIX+"migration_1i_report";
  const now=()=>new Date().toISOString();
  const parse=(raw,fallback=null)=>{try{return raw==null?fallback:JSON.parse(raw)}catch{return fallback}};
  const read=(key,fallback=null)=>parse(localStorage.getItem(key),fallback);
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch(error){console.warn("Gold 1I migration write failed",key,error);return false}};
  const id=()=>"migrated_"+Math.random().toString(36).slice(2,9)+Date.now().toString(36);

  function normalizeFile(raw,folderHint="Documents"){
    if(raw==null) return null;
    if(typeof raw==="string") raw={name:"Migrated File.txt",content:raw,type:"text"};
    if(typeof raw!=="object") return null;
    const name=String(raw.name||raw.filename||raw.title||raw.path?.split("/").pop()||"Migrated File").trim();
    if(!name) return null;
    const ext=(name.split(".").pop()||"").toLowerCase();
    let type=String(raw.type||raw.fileType||"").toLowerCase();
    if(!type||type.includes("/")){
      type=({txt:"text",note:"note",doc:"doc",edoc:"doc",sheet:"sheet",esheet:"sheet",slide:"slide",eslide:"slide",form:"form",png:"image",jpg:"image",jpeg:"image",gif:"image",webp:"image",svg:"image",mp3:"audio",wav:"audio",ogg:"audio",mp4:"video",webm:"video",js:"app"})[ext]||"text";
    }
    const folder=String(raw.folder||raw.directory||raw.parent||folderHint||"Documents").replace(/^\/+|\/+$/g,"")||"Documents";
    let content=raw.content??raw.data??raw.text??raw.body??raw.value??"";
    if(content instanceof Object && typeof content!=="string"){
      try{content=JSON.stringify(content)}catch{content=String(content)}
    }
    return {
      ...raw,
      id:String(raw.id||raw.fileId||id()),
      name,
      type,
      folder,
      content:String(content??""),
      created:raw.created||raw.createdAt||now(),
      updated:raw.updated||raw.updatedAt||now(),
      trash:Boolean(raw.trash||raw.deleted),
      migratedTo:"1I"
    };
  }

  function collectFiles(value,folderHint="Documents",out=[]){
    if(value==null) return out;
    if(Array.isArray(value)){
      value.forEach(item=>{
        if(item && typeof item==="object" && (item.name||item.filename||item.content!==undefined||item.data!==undefined)){
          const f=normalizeFile(item,folderHint);if(f)out.push(f);
        }else collectFiles(item,folderHint,out);
      });
      return out;
    }
    if(typeof value!=="object") return out;
    if(value.name||value.filename||value.content!==undefined||value.data!==undefined){const f=normalizeFile(value,folderHint);if(f)out.push(f);return out}
    if(value.files!==undefined)collectFiles(value.files,folderHint,out);
    if(value.fileSystem!==undefined)collectFiles(value.fileSystem,folderHint,out);
    if(value.drive!==undefined)collectFiles(value.drive,folderHint,out);
    if(value.workspace!==undefined)collectFiles(value.workspace,folderHint,out);
    if(value.folders && typeof value.folders==="object"){
      Object.entries(value.folders).forEach(([folder,items])=>collectFiles(items,folder,out));
    }
    const reserved=new Set(["files","fileSystem","drive","workspace","folders","prefs","mail","notes","events","tickets","notifications","user_apps","openWindows"]);
    Object.entries(value).forEach(([key,item])=>{
      if(reserved.has(key))return;
      if(item && typeof item==="object" && (item.name||item.filename||item.content!==undefined||item.data!==undefined)){
        collectFiles({...item,id:item.id||key},folderHint,out);
      }
    });
    return out;
  }

  function signature(file){
    return [String(file.name||"").toLowerCase(),String(file.folder||"").toLowerCase(),String(file.type||""),String(file.content||"").slice(0,250)].join("|");
  }
  function mergeFiles(...groups){
    const byId=new Map(),bySig=new Map(),merged=[];
    groups.flat().filter(Boolean).forEach(raw=>{
      const f=normalizeFile(raw,raw?.folder||"Documents");if(!f)return;
      const sig=signature(f),existing=byId.get(f.id)||bySig.get(sig);
      if(existing){
        const newer=Date.parse(f.updated||0)>Date.parse(existing.updated||0)?f:existing;
        Object.assign(existing,{...existing,...newer});return;
      }
      byId.set(f.id,f);bySig.set(sig,f);merged.push(f);
    });
    return merged;
  }

  const candidateKeys=[
    "gold1g_files","gold1h_files","gold1i_files","gold1f_files","gold1e_files","gold1d_files","gold1c_files","gold1b_files","gold1a_files",
    "gold1g_workspace","gold1h_workspace","gold1i_workspace","emerald_session","emerald_workspace","emeraldos_workspace","fileSystem","filesystem","drive"
  ];
  const fileGroups=[];
  candidateKeys.forEach(key=>{const value=read(key,null);if(value!==null)fileGroups.push(collectFiles(value))});
  const existing=read(CANON_PREFIX+"files",[]);
  const merged=mergeFiles(existing,...fileGroups);
  if(merged.length)write(CANON_PREFIX+"files",merged);

  const categoryNames=["prefs","mail","notes","tasks","events","contacts","tickets","notifications","user_apps","remote_sessions","emergency_logs","vm_snapshots","folders"];
  const legacyPrefixes=["gold1i_","gold1h_","gold1g_","gold1f_","gold1e_","gold1d_","gold1c_","gold1b_","gold1a_"];
  categoryNames.forEach(category=>{
    const canonical=CANON_PREFIX+category;
    if(localStorage.getItem(canonical)!==null)return;
    for(const prefix of legacyPrefixes){
      const key=prefix+category;if(localStorage.getItem(key)!==null){try{localStorage.setItem(canonical,localStorage.getItem(key));break}catch{}}
    }
  });

  const keyMigrations={
    "gold1g_registry_1h":"gold1g_registry_1i",
    "gold1g_registry_1h_history":"gold1g_registry_1i_history",
    "gold1g_clipboard_history_1h":"gold1g_clipboard_history_1i",
    "gold1g_startup_apps_1h":"gold1g_startup_apps_1i",
    "gold1g_workspace_meta_1h":"gold1g_workspace_meta_1i"
  };
  Object.entries(keyMigrations).forEach(([oldKey,newKey])=>{
    if(localStorage.getItem(newKey)===null && localStorage.getItem(oldKey)!==null){try{localStorage.setItem(newKey,localStorage.getItem(oldKey))}catch{}}
  });

  write(REPORT_KEY,{
    completed:true,
    completedAt:now(),
    filesBefore:Array.isArray(existing)?existing.length:0,
    filesAfter:merged.length,
    sourcesChecked:candidateKeys,
    firestoreReleasePointerChanged:false
  });
})();
