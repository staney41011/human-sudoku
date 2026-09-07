import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, setPersistence, browserSessionPersistence, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getDatabase, ref, get, set, update, onValue, runTransaction, remove } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

export function configReady(){
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.databaseURL &&
    !firebaseConfig.apiKey.includes("PASTE_") &&
    !firebaseConfig.databaseURL.includes("PASTE_")
  );
}

let app=null,auth=null,db=null;
export async function ensureFirebase(){
  if(!configReady()) throw new Error("Firebase Web App 已設定，但 Realtime Database URL 尚未填入 firebase-config.js。");
  if(!app){
    app=initializeApp(firebaseConfig);
    auth=getAuth(app);
    db=getDatabase(app);
    await setPersistence(auth,browserSessionPersistence);
  }
  if(!auth.currentUser) await signInAnonymously(auth);
  return {app,auth,db};
}
export function currentUid(){return auth?.currentUser?.uid||null;}
export function dbRef(path){return ref(db,path);}
export {ref,get,set,update,onValue,runTransaction,remove,onAuthStateChanged};

export async function sha256(text){
  const bytes=new TextEncoder().encode(text);
  const digest=await crypto.subtle.digest("SHA-256",bytes);
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");
}

export function gamePath(suffix=""){
  return suffix?`game/${suffix}`:"game";
}
