import {ensureFirebase,dbRef,onValue,get,set,update,currentUid,sha256} from "./firebase.js";
export {ensureFirebase,dbRef,onValue,get,set,update,currentUid,sha256};
export const $=s=>document.querySelector(s);
export const $$=s=>[...document.querySelectorAll(s)];
export function show(el,yes=true){if(typeof el==="string")el=$(el);el?.classList.toggle("hidden",!yes);}
export function msg(text,type=""){const box=$("#message");if(!box)return;box.textContent=text;box.className=`notice ${type}`;show(box,true);}
export function escapeHtml(v=""){return String(v).replace(/[&<>'"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[m]));}
export function numberText(n){return String(Number(n)||0).padStart(2,"0");}
export async function loadGame(){const snap=await get(dbRef("game"));return snap.val()||{};}
export function listenGame(cb){return onValue(dbRef("game"),snap=>cb(snap.val()||{}));}
export function activePlayers(game){return Object.entries(game.players||{}).map(([id,p])=>({id,...p})).filter(p=>p.active!==false).sort((a,b)=>a.number-b.number);}
export function renderMatrix(el,size,holes,content={},results={}){
  const hs=new Set(holes||[]);el.style.gridTemplateColumns=`repeat(${size},auto)`;el.innerHTML="";
  for(let r=0;r<size;r++)for(let c=0;c<size;c++){
    const k=`${r},${c}`,d=document.createElement("div");d.className="cell";d.dataset.cell=k;
    if(hs.has(k)){d.classList.add("hole");d.textContent="✦";}else{const value=content[k];if(value)d.textContent=value.label||value;if(value?.playerId&&results[value.playerId])d.classList.add(results[value.playerId].ok?"blue":"red");}
    el.appendChild(d);
  }
}
export function phaseName(p){return ({lobby:"玩家登入",intro:"自我介紹",round1:"第一回合",round1_done:"第一回合完成",round2:"第二回合",round2_done:"遊戲完成"})[p]||p||"尚未開始";}
export function setConnection(ok,text=""){const el=$("#connection");if(el){el.textContent=text||(ok?"Firebase 已連線":"Firebase 未連線");el.className=`status-pill ${ok?"":"error"}`;}}
