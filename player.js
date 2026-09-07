import {ensureFirebase,dbRef,onValue,get,update,currentUid,runTransaction} from "./firebase.js";
import {$,show,msg,numberText} from "./app-common.js";
import {clueLabel} from "./game-engine.js";

let myPlayerId=null,game={};
async function boot(){
  try{await ensureFirebase();$("#connection").textContent="Firebase 已連線";bind();await identify();onValue(dbRef("game"),s=>{game=s.val()||{};render();});}
  catch(e){$("#connection").textContent="Firebase 未連線";show("#setupMissing");msg(e.message,"error");}
}
function bind(){
  $("#showRecover").onclick=()=>{show("#loginCard",false);show("#recoverCard")};$("#backJoin").onclick=()=>{show("#recoverCard",false);show("#loginCard")};
  $("#joinForm").addEventListener("submit",join);$("#recoverForm").addEventListener("submit",recover);
}
async function identify(){
  const uid=currentUid();const snap=await get(dbRef(`game/ownerIndex/${uid}`));if(snap.exists()){myPlayerId=snap.val();return;}
  show("#loginCard");
}
async function join(e){
  e.preventDefault();const meta=(await get(dbRef("game/meta"))).val()||{};if(meta.joinLocked){msg("主持人已鎖定登入，請向主持人確認。","error");return;}
  const uid=currentUid();const tr=await runTransaction(dbRef("game/meta/nextNumber"),v=>(Number(v)||0)+1);const number=tr.snapshot.val();
  const playerId=uid;const p={number,name:$("#name").value.trim(),interest:$("#interest").value.trim(),color:$("#color").value.trim(),active:true,ownerUid:uid,joinedAt:Date.now()};
  await update(dbRef("game"),{[`players/${playerId}`]:p,[`numberIndex/${number}`]:playerId,[`ownerIndex/${uid}`]:playerId});myPlayerId=playerId;show("#loginCard",false);render();
}
async function recover(e){
  e.preventDefault();const number=Number($("#recoverNumber").value),code=$("#recoverCode").value.trim();const codeSnap=await get(dbRef(`game/recovery/${code}`));const rec=codeSnap.val();
  if(!rec||rec.number!==number||rec.used||rec.expiresAt<Date.now()){msg("恢復碼無效、已使用或已過期。","error");return;}
  const idx=(await get(dbRef(`game/numberIndex/${number}`))).val();if(!idx){msg("找不到這個玩家號碼。","error");return;}
  const uid=currentUid();const old=(await get(dbRef(`game/players/${idx}/ownerUid`))).val();const updates={};updates[`players/${idx}/ownerUid`]=uid;updates[`ownerIndex/${uid}`]=idx;if(old)updates[`ownerIndex/${old}`]=null;updates[`recovery/${code}/used`]=true;await update(dbRef("game"),updates);myPlayerId=idx;show("#recoverCard",false);msg("角色恢復成功！","ok");render();
}
function render(){
  if(!myPlayerId){if(!$("#recoverCard").classList.contains("hidden"))return;show("#loginCard");return;}
  const p=game.players?.[myPlayerId];if(!p)return;show("#loginCard",false);show("#recoverCard",false);show("#playerCard");
  $("#myNumber").textContent=numberText(p.number);$("#myName").textContent=p.name;$("#myInterest").textContent=p.interest;$("#myColor").textContent=p.color;
  const phase=game.meta?.phase||"lobby";let text="等待其他玩家登入…";
  if(phase==="intro"){const order=game.meta?.introOrder||[];const cur=order[game.meta?.introIndex||0];text=cur===myPlayerId?"🎤 輪到你自我介紹了！請站起來跟大家打招呼。":"👀 自我介紹進行中，記住大家的名字、興趣和顏色。";}
  if(phase==="round1"||phase==="round1_done")text="第一回合：走進人群、交換線索，找出你在真人矩陣中的位置。";
  if(phase==="round2"||phase==="round2_done")text="第二回合：名字消失了！用興趣或顏色重新找到彼此。";$("#phaseText").textContent=text;
  const rn=phase.startsWith("round2")?2:phase.startsWith("round1")?1:0;const clues=rn?game.rounds?.[rn]?.clues?.[myPlayerId]:null;
  if(clues){$("#clues").innerHTML=clues.map(c=>`<div class="clue"><span>${c.relation==="adjacent"?"↔️":c.relation==="row"?"↔":"↕"}</span><b>${clueLabel(c)}</b></div>`).join("");show("#clues");}else show("#clues",false);
}
boot();
