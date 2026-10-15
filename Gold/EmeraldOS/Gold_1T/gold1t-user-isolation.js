"use strict";
(function EmeraldOSGold1TUserIsolation(){
  if(window.Gold1TUserIsolation)return;
  const DB_NAME="EmeraldOSGoldPrivateCacheV1",STORE="users",ACTIVE="emeraldGoldActiveUserV1",AUTH_ID="emeraldGoldAuthenticatedUserId",AUTH_NAME="emeraldGoldAuthenticatedUsername";
  const normalize=v=>String(v||"").trim().toLowerCase().replace(/[^a-z0-9._-]/g,"_");
  const excluded=/(_loggedin|_username|_userid|_role2?$|staff_session|publisher_unlocked|last_login|latest_manifest|active_manifest|pending_manifest|shell_|users$|firebase)/i;
  const legacyExact=new Set(["emerald_session","emerald_workspace","emeraldos_workspace","fileSystem","filesystem","drive"]);
  function privateKey(key){return (legacyExact.has(key)||/^gold1[a-t]_/.test(key))&&!excluded.test(key)}
  function privateKeys(){return Object.keys(localStorage).filter(privateKey)}
  function collect(){const data={};for(const key of privateKeys())data[key]=localStorage.getItem(key);return data}
  function clear(){for(const key of privateKeys())localStorage.removeItem(key)}
  function openDB(){return new Promise((resolve,reject)=>{if(!indexedDB)return reject(new Error("IndexedDB unavailable"));const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:"id"})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error("Local cache could not open"))})}
  async function put(id,username,data){const db=await openDB();await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,"readwrite");tx.objectStore(STORE).put({id:normalize(id),username:String(username||""),data,updatedAt:new Date().toISOString(),schema:"emerald-gold-private-local-v1"});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close()}
  async function get(id){const db=await openDB();const value=await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,"readonly"),req=tx.objectStore(STORE).get(normalize(id));req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error)});db.close();return value}
  async function snapshotActiveSession(){const id=localStorage.getItem(AUTH_ID)||localStorage.getItem("userId")||localStorage.getItem(ACTIVE);if(!id)return false;try{await put(id,localStorage.getItem(AUTH_NAME)||localStorage.getItem("username")||"",collect());return true}catch(error){console.warn("Gold 1T private local snapshot failed",error);return false}}
  async function restore(id){const record=await get(id).catch(()=>null);if(!record?.data)return false;for(const [key,value] of Object.entries(record.data)){if(privateKey(key)&&value!==null)localStorage.setItem(key,value)}return true}
  async function switchToUser(id,username){const next=normalize(id||username);if(!next)throw new Error("A stable EmeraldOS account ID is required.");const previous=normalize(localStorage.getItem(ACTIVE));const hasLegacy=privateKeys().length>0;
    if(!previous&&hasLegacy){const legacyOwner=normalize(localStorage.getItem("userId")||localStorage.getItem("username")||localStorage.getItem("gold1g_username"));if(legacyOwner&&legacyOwner!==next){localStorage.setItem(ACTIVE,legacyOwner);localStorage.setItem(AUTH_ID,legacyOwner);localStorage.setItem(AUTH_NAME,localStorage.getItem("username")||legacyOwner);await snapshotActiveSession();clear()}else{localStorage.setItem(ACTIVE,next);localStorage.setItem(AUTH_ID,next);localStorage.setItem(AUTH_NAME,String(username||next));await snapshotActiveSession();return {claimedLegacy:true,restored:false}}}
    if(previous&&previous!==next){await snapshotActiveSession();clear()}
    let restored=false;if(previous!==next)restored=await restore(next);
    localStorage.setItem(ACTIVE,next);localStorage.setItem(AUTH_ID,next);localStorage.setItem(AUTH_NAME,String(username||next));return {claimedLegacy:false,restored}
  }
  async function sealLocalSession(){await snapshotActiveSession();clear();localStorage.removeItem(ACTIVE);localStorage.removeItem(AUTH_ID);localStorage.removeItem(AUTH_NAME);return true}
  function status(){return {activeUserId:localStorage.getItem(AUTH_ID)||"",activeUsername:localStorage.getItem(AUTH_NAME)||"",activePrivateKeys:privateKeys().length,database:DB_NAME,schema:"emerald-gold-private-local-v1"}}
  window.Gold1TUserIsolation={switchToUser,snapshotActiveSession,sealLocalSession,clearActiveData:clear,status,privateKey};
})();
