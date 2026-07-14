import {initializeApp,getApps} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getFirestore,doc,getDoc,setDoc,addDoc,updateDoc,deleteDoc,collection,getDocs,query,where,orderBy,limit,onSnapshot,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {firebaseConfig,firebaseConfigured} from "./firebase-config.js";
let app=null,db=null;
if(firebaseConfigured){app=getApps()[0]||initializeApp(firebaseConfig);db=getFirestore(app)}
export {app,db,firebaseConfigured,doc,getDoc,setDoc,addDoc,updateDoc,deleteDoc,collection,getDocs,query,where,orderBy,limit,onSnapshot,serverTimestamp};
