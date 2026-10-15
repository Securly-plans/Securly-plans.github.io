console.log("js/auth.js LOADED."); 
import { collection, addDoc, query, where, getDocs, updateDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; 
import { db } from "./firebase.js"; 

/* ================= SYSTEM LOCK CHECK ================= */ 
async function getSystemConfig() { 
    try { 
        const snap = await getDoc(doc(db, "system", "config")); 
        if (!snap.exists()) { 
            return { loginDisabled: false, globalLock: false }; 
        } 
        return snap.data(); 
    } catch (err) { 
        console.error("System config fetch failed:", err); 
        // fail open (safer for uptime) 
        return { loginDisabled: false, globalLock: false }; 
    } 
} 

/* ---------------- PASSWORD HASH ---------------- */ 
async function hashPassword(password) { 
    const msgUint8 = new TextEncoder().encode(password); 
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8); 
    const hashArray = Array.from(new Uint8Array(hashBuffer)); 
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join(""); 
} 

/* ---------------- SIGNUP ---------------- */ 
async function signup(username, password) { 
    if (!username || !password) return alert("Fill in both fields"); 
    try { 
        const config = await getSystemConfig(); 
        // 🚫 GLOBAL LOCK BLOCK (highest priority) 
        if (config.globalLock === true) { 
            return alert("System is currently locked by administrators"); 
        } 
        // 🚫 LOGIN DISABLED BLOCK 
        if (config.loginDisabled === true) { 
            return alert("Login is currently disabled"); 
        } 
        const passwordHash = await hashPassword(password); 
        await addDoc(collection(db, "users"), { 
            username, 
            passwordHash, 
            role: "user", 
            locked: false, 
            created: Date.now(), 
            lastUpdated: Date.now() 
        }); 

        localStorage.setItem("loggedIn", "true"); 
        localStorage.setItem("username", username); 
        localStorage.setItem("role", "user"); 

        // Set specific userID based on username
        if (username === "Securly-plans") {
            localStorage.setItem("userID", "no3iltjq4tByBTz4WRdD");
        } else if (username === "Wmonroe01") {
            localStorage.setItem("userID", "M7ab5EUHvvkmERw9ZwvK");
        }

        window.location.href = "home.html"; 
    } catch (err) { 
        console.error(err); 
        alert("Signup failed"); 
    } 
} 

/* ---------------- LOGIN ---------------- */ 
async function login(username, password) { 
    if (!username || !password) return alert("Fill in both fields"); 
    try { 
        const config = await getSystemConfig(); 
        // 🔴 GLOBAL LOCK OVERRIDE 
        if (config.globalLock === true) { 
            return alert("System locked by administrators"); 
        } 
        // 🔒 LOGIN DISABLED CHECK 
        if (config.loginDisabled === true) { 
            return alert("Login is currently disabled by administrators"); 
        } 
        const passwordHash = await hashPassword(password); 
        const q = query( 
            collection(db, "users"), 
            where("username", "==", username), 
            where("passwordHash", "==", passwordHash) 
        ); 
        const snap = await getDocs(q); 
        if (snap.empty) return alert("Invalid login"); 
        const userDoc = snap.docs[0]; 
        const data = userDoc.data(); 
        if (data.locked) return alert("Account locked"); 

        localStorage.setItem("loggedIn", "true"); 
        localStorage.setItem("username", data.username); 
        localStorage.setItem("role", data.role || "user"); 

        // Set specific userID based on username
        if (data.username === "Securly-plans") {
            localStorage.setItem("userID", "no3iltjq4tByBTz4WRdD");
        } else if (data.username === "Wmonroe01") {
            localStorage.setItem("userID", "M7ab5EUHvvkmERw9ZwvK");
        }

        await updateDoc(doc(db, "users", userDoc.id), { lastLogin: Date.now() }); 
        window.location.href = "home.html"; 
    } catch (err) { 
        console.error(err); 
        alert("Login failed"); 
    } 
} 

/* ---------------- CHAT HELPERS ---------------- */ 
// Create or get DM chat 
export async function getOrCreateDM(otherUser) { 
    const me = localStorage.getItem("username"); 
    const q = query(collection(db, "chats")); 
    const snap = await getDocs(q); 
    let chat = null; 
    snap.forEach(d => { 
        const data = d.data(); 
        if ( 
            data.members?.includes(me) && 
            data.members?.includes(otherUser) && 
            data.members.length === 2 
        ) { 
            chat = { id: d.id, ...data }; 
        } 
    }); 
    if (chat) return chat.id; 
    const newChat = await addDoc(collection(db, "chats"), { 
        members: [me, otherUser], 
        isGroup: false, 
        createdAt: Date.now(), 
        lastMessage: "" 
    }); 
    return newChat.id; 
} 

// Send message 
export async function sendMessage(chatId, text) { 
    const sender = localStorage.getItem("username"); 
    await addDoc(collection(db, "messages"), { chatId, sender, text, time: Date.now() }); 
    await updateDoc(doc(db, "chats", chatId), { lastMessage: text }); 
} 

/* ---------------- UI ---------------- */ 
function initAuthUI() { 
    const loginBtn = document.getElementById("loginBtn"); 
    const signupBtn = document.getElementById("signupBtn"); 
    if (!loginBtn || !signupBtn) return; 
    loginBtn.onclick = () => login(user.value, pass.value); 
    signupBtn.onclick = () => signup(user.value, pass.value); 
} 
window.addEventListener("DOMContentLoaded", initAuthUI);
