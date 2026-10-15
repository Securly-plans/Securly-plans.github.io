"use strict";

/* EmeraldOS Gold 1M preboot compatibility layer.
   It runs before Gold 1G and prevents oversized workspace cache writes from
   crashing the VM. Primary VM data continues to use goldVM/current. */
(function installGold1MPreboot(){
  if(window.__EMERALDOS_GOLD_1M_PREBOOT__) return;
  window.__EMERALDOS_GOLD_1M_PREBOOT__=true;
  window.EMERALDOS_GOLD_VERSION="1M";
  window.EMERALDOS_GOLD_FOLDER="Gold_1M";

  const WORKSPACE_KEY="gold1g_workspace";
  const META_KEY="gold1g_workspace_meta_1m";
  const MAX_RECOVERY_BYTES=700000;
  const nativeSetItem=Storage.prototype.setItem;
  const nativeSetInterval=window.setInterval.bind(window);

  /* Gold 1G installs a monolithic 15-second autosave inside its private scope.
     Redirect only that recognizable timer to the split Gold 1M saver. */
  window.setInterval=function gold1IIntervalRouter(callback,delay,...args){
    const source=typeof callback==="function"?Function.prototype.toString.call(callback):"";
    if(Number(delay)===15000 && /saveWorkspaceNow/.test(source) && /cloudSync/.test(source)){
      return nativeSetInterval(function(){
        try{
          if(window.Gold1M?.saveWorkspaceNow) window.Gold1M.saveWorkspaceNow(false);
          else if(window.Gold50?.saveWorkspaceNow) window.Gold50.saveWorkspaceNow(false);
        }catch(error){console.warn("Gold 1M autosave failed",error)}
      },30000);
    }
    return nativeSetInterval(callback,delay,...args);
  };

  function byteLength(value){
    try{return new Blob([String(value)]).size}catch{return String(value).length*2}
  }

  function compactWorkspace(value){
    let parsed=null;
    try{parsed=JSON.parse(String(value))}catch{}
    const windows=Array.isArray(parsed?.openWindows)?parsed.openWindows.map(w=>({
      id:w?.id||"",title:w?.title||"",left:w?.left||"",top:w?.top||"",
      width:w?.width||"",height:w?.height||"",max:!!(w?.max||w?.maximized),
      min:!!(w?.min||w?.minimized)
    })).slice(0,40):[];
    return JSON.stringify({
      build:"EmeraldOS Gold 1M",
      version:"1M",
      savedAt:new Date().toISOString(),
      originalBytes:byteLength(value),
      recoveryOnly:true,
      openWindows:windows
    });
  }

  function clearReplaceableCaches(storage){
    const exact=[
      "gold1g_workspace",
      "gold1g_search_cache",
      "gold1g_thumbnail_cache",
      "gold1g_temp",
      "gold1g_runtime_cache"
    ];
    exact.forEach(k=>{try{storage.removeItem(k)}catch{}});
    try{
      Object.keys(storage).forEach(k=>{
        if(/^gold1g_(?:cache|temp|preview|thumbnail)_/i.test(k)) storage.removeItem(k);
      });
    }catch{}
  }

  try{
    const existing=localStorage.getItem(WORKSPACE_KEY);
    if(existing && byteLength(existing)>MAX_RECOVERY_BYTES){
      nativeSetItem.call(localStorage,META_KEY,compactWorkspace(existing));
      localStorage.removeItem(WORKSPACE_KEY);
    }
  }catch(error){console.warn("Gold 1M preboot cleanup skipped",error)}

  Storage.prototype.setItem=function gold1IQuotaSafeSetItem(key,value){
    const storage=this;
    const stringKey=String(key);
    const stringValue=String(value);

    if(storage===localStorage && stringKey===WORKSPACE_KEY && byteLength(stringValue)>MAX_RECOVERY_BYTES){
      try{
        nativeSetItem.call(storage,META_KEY,compactWorkspace(stringValue));
        return;
      }catch(error){
        clearReplaceableCaches(storage);
        try{nativeSetItem.call(storage,META_KEY,compactWorkspace(stringValue));return}catch{}
        console.warn("Gold 1M could not retain the compact local recovery cache",error);
        return;
      }
    }

    try{
      return nativeSetItem.call(storage,stringKey,stringValue);
    }catch(error){
      const quota=error?.name==="QuotaExceededError" || error?.code===22 || error?.code===1014;
      if(!quota) throw error;
      clearReplaceableCaches(storage);
      try{return nativeSetItem.call(storage,stringKey,stringValue)}catch(retryError){
        if(storage===localStorage && stringKey===WORKSPACE_KEY){
          try{nativeSetItem.call(storage,META_KEY,compactWorkspace(stringValue))}catch{}
          console.warn("Gold 1M skipped an oversized recovery-cache write after storage cleanup",retryError);
          return;
        }
        throw retryError;
      }
    }
  };
})();
