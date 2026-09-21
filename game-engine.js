export const PHASES={LOBBY:"lobby",INTRO:"intro",ROUND1:"round1",ROUND1_DONE:"round1_done",ROUND2:"round2",ROUND2_DONE:"round2_done"};
const key=(r,c)=>`${r},${c}`;
const parseKey=k=>k.split(",").map(Number);
export const shuffle=a=>{const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]];}return x;};

export function matrixSizeFor(n){return Math.max(2,Math.ceil(Math.sqrt(Math.max(1,n))));}
function degree(r,c,s,holes){return [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].filter(([rr,cc])=>rr>=0&&cc>=0&&rr<s&&cc<s&&!holes.has(key(rr,cc))).length;}
function connected(s,holes){const cells=[];for(let r=0;r<s;r++)for(let c=0;c<s;c++)if(!holes.has(key(r,c)))cells.push(key(r,c));if(!cells.length)return true;const seen=new Set([cells[0]]),q=[cells[0]];while(q.length){const [r,c]=parseKey(q.shift());for(const [rr,cc] of [[r-1,c],[r+1,c],[r,c-1],[r,c+1]]){const k=key(rr,cc);if(rr>=0&&cc>=0&&rr<s&&cc<s&&!holes.has(k)&&!seen.has(k)){seen.add(k);q.push(k);}}}return seen.size===cells.length;}
function validHoleSet(s,holes){for(let r=0;r<s;r++)for(let c=0;c<s;c++)if(!holes.has(key(r,c))&&degree(r,c,s,holes)<2)return false;return connected(s,holes);}

export function makeCentralHoles(size,count){
  if(count<=0)return [];
  const center=(size-1)/2;
  const all=[];
  for(let r=0;r<size;r++)for(let c=0;c<size;c++)all.push({r,c,k:key(r,c),score:(r-center)**2+(c-center)**2});
  all.sort((a,b)=>a.score-b.score||a.r-b.r||a.c-b.c);
  if(size<=4){
    let best=null,bestScore=Infinity;
    const chosen=[];
    function dfs(idx,left){
      if(left===0){const holes=new Set(chosen);if(validHoleSet(size,holes)){const sc=chosen.reduce((sum,k)=>{const [r,c]=parseKey(k);return sum+(r-center)**2+(c-center)**2;},0);if(sc<bestScore){best=[...chosen];bestScore=sc;}}return;}
      if(all.length-idx<left)return;
      for(let i=idx;i<=all.length-left;i++){chosen.push(all[i].k);dfs(i+1,left-1);chosen.pop();}
    }
    dfs(0,count);
    return best||[];
  }
  const holes=new Set();
  for(const p of all){
    if(holes.size>=count)break;
    holes.add(p.k);
    if(!validHoleSet(size,holes))holes.delete(p.k);
  }
  return [...holes];
}

export function activeCells(size,holes){const hs=new Set(holes);const out=[];for(let r=0;r<size;r++)for(let c=0;c<size;c++)if(!hs.has(key(r,c)))out.push({r,c,k:key(r,c)});return out;}
export function neighborsOf(cell,size,holes){const hs=new Set(holes);return [[cell.r-1,cell.c],[cell.r+1,cell.c],[cell.r,cell.c-1],[cell.r,cell.c+1]].filter(([r,c])=>r>=0&&c>=0&&r<size&&c<size&&!hs.has(key(r,c))).map(([r,c])=>key(r,c));}

function chooseOther(candidates,exclude=new Set()){const pool=candidates.filter(x=>!exclude.has(x));return pool.length?pool[Math.floor(Math.random()*pool.length)]:candidates[Math.floor(Math.random()*candidates.length)];}

function chooseAnchorCells(cells,size,requestedCount){
  const byRow=Array.from({length:size},()=>[]);
  const activeCols=new Set();
  for(const cell of cells){byRow[cell.r].push(cell);activeCols.add(cell.c);}
  const rows=byRow.map((x,i)=>x.length?i:null).filter(x=>x!==null);
  const matchCol=new Map();
  function augment(r,seen){
    for(const cell of shuffle(byRow[r])){
      if(seen.has(cell.c))continue;
      seen.add(cell.c);
      const prev=matchCol.get(cell.c);
      if(!prev||augment(prev.r,seen)){matchCol.set(cell.c,cell);return true;}
    }
    return false;
  }
  let perfect=true;
  for(const r of rows){if(!augment(r,new Set())){perfect=false;break;}}
  const selected=new Set();
  if(perfect&&matchCol.size===rows.length&&rows.length===activeCols.size){
    for(const cell of matchCol.values())selected.add(cell.k);
  }else{
    const coveredCols=new Set();
    for(const r of rows){
      const preferred=byRow[r].find(c=>!coveredCols.has(c.c))||byRow[r][0];
      if(preferred){selected.add(preferred.k);coveredCols.add(preferred.c);}
    }
    for(const c of activeCols){
      if(coveredCols.has(c))continue;
      const cell=cells.find(x=>x.c===c);
      if(cell){selected.add(cell.k);coveredCols.add(c);}
    }
  }
  const desired=Math.max(requestedCount,selected.size);
  for(const cell of shuffle(cells)){if(selected.size>=desired)break;selected.add(cell.k);}
  return [...selected];
}

function uniqueAnchorDescriptor(targetId,playerMap,anchorIds){
  const target=playerMap[targetId];
  const kinds=shuffle(["interest","color"]);
  for(const kind of kinds){
    const count=anchorIds.filter(id=>playerMap[id]?.[kind]===target[kind]).length;
    if(count===1)return {kind,value:target[kind]};
  }
  const pair=`${target.interest}＋${target.color}`;
  const pairCount=anchorIds.filter(id=>`${playerMap[id]?.interest}＋${playerMap[id]?.color}`===pair).length;
  if(pairCount===1)return {kind:"profile",value:pair};
  return {kind:"playerNumber",value:`#${String(target.number).padStart(2,"0")}`};
}

export function buildRound(players,size,holes,roundNo){
  const cells=activeCells(size,holes);
  if(players.length!==cells.length)throw new Error("玩家數與可用格數不一致");
  const shuffledPlayers=shuffle(players);
  const placement={};const byCell={};
  cells.forEach((cell,i)=>{placement[shuffledPlayers[i].id]=cell.k;byCell[cell.k]=shuffledPlayers[i].id;});
  const playerMap=Object.fromEntries(players.map(p=>[p.id,p]));

  const requestedAnchors=Math.max(1,Math.ceil(players.length/5));
  const anchorCells=chooseAnchorCells(cells,size,requestedAnchors);
  const anchors={};
  for(const cellKey of anchorCells){const pid=byCell[cellKey];if(pid)anchors[pid]=cellKey;}
  const anchorIds=Object.keys(anchors);
  const anchorSet=new Set(anchorIds);

  const rowAnchors=Array.from({length:size},()=>[]);
  const colAnchors=Array.from({length:size},()=>[]);
  for(const pid of anchorIds){
    const [r,c]=parseKey(anchors[pid]);
    rowAnchors[r].push(pid);colAnchors[c].push(pid);
  }
  for(const cell of cells){
    if(!rowAnchors[cell.r].length||!colAnchors[cell.c].length)throw new Error("固定定位點未覆蓋所有列欄，請重新產生題目。");
  }

  const makeExact=(relation,targetId)=>{
    const target=playerMap[targetId];
    const duplicate=players.filter(x=>x.name===target.name).length>1;
    return {relation,kind:"player",value:duplicate?`${target.name}（#${String(target.number).padStart(2,"0")}）`:target.name,targetId};
  };
  const makeLoose=(relation,targetId)=>{
    const target=playerMap[targetId];
    const kind=Math.random()<.5?"interest":"color";
    return {relation,kind,value:target[kind],targetId};
  };
  const makeAnchorClue=(relation,targetId)=>{
    if(roundNo===1)return {...makeExact(relation,targetId),scope:"anchor"};
    const d=uniqueAnchorDescriptor(targetId,playerMap,anchorIds);
    return {relation,kind:d.kind,value:d.value,targetId,scope:"anchor"};
  };

  const clues={};
  for(const p of players){
    const cellKey=placement[p.id],[r,c]=parseKey(cellKey),cell={r,c};
    const neighborIds=neighborsOf(cell,size,holes).map(k=>byCell[k]).filter(Boolean);
    if(neighborIds.length<2)throw new Error("盤面存在不足兩名緊鄰玩家的位置，請重新產生空格。");
    const two=shuffle(neighborIds).slice(0,2);
    const rowIds=cells.filter(x=>x.r===r&&x.k!==cellKey).map(x=>byCell[x.k]).filter(Boolean);
    const colIds=cells.filter(x=>x.c===c&&x.k!==cellKey).map(x=>byCell[x.k]).filter(Boolean);
    let rowClue,colClue;
    if(anchorSet.has(p.id)){
      const exclude=new Set(two);
      const rowTarget=chooseOther(rowIds,exclude)||chooseOther(rowIds);
      const colTarget=chooseOther(colIds,exclude)||chooseOther(colIds);
      rowClue=roundNo===1?makeExact("row",rowTarget):makeLoose("row",rowTarget);
      colClue=roundNo===1?makeExact("column",colTarget):makeLoose("column",colTarget);
    }else{
      const rowTarget=chooseOther(rowAnchors[r])||rowAnchors[r][0];
      const colTarget=chooseOther(colAnchors[c])||colAnchors[c][0];
      rowClue=makeAnchorClue("row",rowTarget);
      colClue=makeAnchorClue("column",colTarget);
    }
    clues[p.id]=[
      roundNo===1?makeExact("adjacent",two[0]):makeLoose("adjacent",two[0]),
      roundNo===1?makeExact("adjacent",two[1]):makeLoose("adjacent",two[1]),
      colClue,rowClue
    ];
  }
  return {
    roundNo,size,holes,placement,anchors,
    requestedAnchorCount:requestedAnchors,
    actualAnchorCount:anchorIds.length,
    uniqueSolution:true,
    uniquenessMethod:"fixed-anchors-row-column-intersection",
    clues,createdAt:Date.now(),submission:null,result:null
  };
}

function matchesClue(player,clue,anchorSet){
  if(!player)return false;
  if(clue.scope==="anchor"&&!anchorSet.has(player.id))return false;
  if(clue.kind==="player")return player.id===clue.targetId;
  if(clue.kind==="playerNumber")return player.id===clue.targetId;
  if(clue.kind==="name")return player.name===clue.value;
  if(clue.kind==="interest")return player.interest===clue.value;
  if(clue.kind==="color")return player.color===clue.value;
  if(clue.kind==="profile")return `${player.interest}＋${player.color}`===clue.value;
  return false;
}

function hasDistinctMatches(clues,candidatePlayers,anchorSet){
  if(clues.length===0)return true;
  const used=new Set();
  function dfs(i){
    if(i===clues.length)return true;
    for(const p of candidatePlayers){if(used.has(p.id)||!matchesClue(p,clues[i],anchorSet))continue;used.add(p.id);if(dfs(i+1))return true;used.delete(p.id);}return false;
  }
  return dfs(0);
}

export function evaluateSubmission(players,round,submission){
  const byId=Object.fromEntries(players.map(p=>[p.id,p]));
  const anchorSet=new Set(Object.keys(round.anchors||{}));
  const byCell={};Object.entries(submission||{}).forEach(([cell,pid])=>{if(pid)byCell[cell]=pid;});
  const results={};let correct=0;
  for(const p of players){
    const entry=Object.entries(byCell).find(([,pid])=>pid===p.id);
    if(!entry){results[p.id]={ok:false,failed:["missing"]};continue;}
    const cellKey=entry[0],[r,c]=parseKey(cellKey);const clues=round.clues[p.id]||[];
    const failed=[];
    const fixed=round.anchors?.[p.id];
    if(fixed&&fixed!==cellKey)failed.push("fixed");
    const adjClues=clues.filter(x=>x.relation==="adjacent");
    const adjPlayers=neighborsOf({r,c},round.size,round.holes).map(k=>byId[byCell[k]]).filter(Boolean);
    if(!hasDistinctMatches(adjClues,adjPlayers,anchorSet))failed.push("adjacent");
    const rowClue=clues.find(x=>x.relation==="row");
    const rowPlayers=Object.entries(byCell).filter(([k])=>parseKey(k)[0]===r&&k!==cellKey).map(([,pid])=>byId[pid]).filter(Boolean);
    if(rowClue&&!rowPlayers.some(x=>matchesClue(x,rowClue,anchorSet)))failed.push("row");
    const colClue=clues.find(x=>x.relation==="column");
    const colPlayers=Object.entries(byCell).filter(([k])=>parseKey(k)[1]===c&&k!==cellKey).map(([,pid])=>byId[pid]).filter(Boolean);
    if(colClue&&!colPlayers.some(x=>matchesClue(x,colClue,anchorSet)))failed.push("column");
    const ok=failed.length===0;results[p.id]={ok,failed};if(ok)correct++;
  }
  return {byPlayer:results,correct,total:players.length,allCorrect:correct===players.length,checkedAt:Date.now()};
}

export function clueLabel(c){
  const rel=c.relation==="adjacent"?"緊鄰":c.relation==="row"?"同列":"同欄";
  const icon=c.kind==="color"?"🎨":c.kind==="interest"?"🎯":c.kind==="profile"?"🧩":c.kind==="playerNumber"?"🔢":"👤";
  const anchor=c.scope==="anchor"?"⭐ 已定位玩家｜":"";
  return `${icon} ${rel}：${anchor}${c.value}`;
}
