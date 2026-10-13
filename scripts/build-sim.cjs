// Extract the non-rendering rules used by the browser. Run after game rule edits.
const fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../web/game.js'),'utf8');
const section=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b));
const story=section('// ====== СЮЖЕТ И УРОВНИ ======','// ====== ВВОД:');
const world=section('// ====== МИР ======','// ====== ОТРИСОВКА ======');
const intro=section('const INTRO_COOP=','function selectMode(');
const pre=`'use strict';
const FS=208,FX=16,FY=16,coop=true;let state='title',st=0,epoch=0,dlg=null;
const pressed={},controls=[{dir:-1,fire:false},{dir:-1,fire:false}];
const curDir=id=>controls[id].dir,fireHeld=id=>controls[id].fire;
const localStorage={getItem:()=>null,setItem:()=>{}};
let soundId=0,soundEvents=[];
const SFX=new Proxy({}, {get:(_,name)=>(...args)=>{soundEvents.push({id:++soundId,name,args});if(soundEvents.length>128)soundEvents.shift();}});
const stopMusic=()=>{},playMusic=()=>{},M_END=0,B_END=0,M_WIN=0,B_WIN=0,M_OVER=0,B_OVER=0;
function setState(s){state=s;st=0;epoch++;}
function runDialog(lines,done,scene){dlg={lines,i:0,ch:0,done,scene:scene||lines[0].s||'town',t:0};setState('dialog');}
function startLevel(i){runDialog(LEVELS[i].pre,()=>{loadLevel(i);setState('curtain');});}
function nextAfterTally(){runDialog(LEVELS[lvl].post,()=>startLevel(lvl+1));}
`;
const post=`
let ready=[false,false],skip=[false,false],pauses=[false,false],done=false;
function resetVotes(){ready=[false,false];skip=[false,false];}
function advance(){
 if(state==='dialog'&&dlg){
  if(skip.every(Boolean)){const fn=dlg.done;dlg=null;resetVotes();fn();return;}
  dlg.i++;dlg.ch=0;epoch++;resetVotes();if(dlg.i>=dlg.lines.length){const fn=dlg.done;dlg=null;fn();}
 }else if(state==='tally'){resetVotes();nextAfterTally();}
 else if(state==='gameover'){resetVotes();runDialog(GAMEOVER_DLG,()=>{resetCrew();score=Math.floor(score/2);loadLevel(lvl);setState('curtain');});}
 else if(state==='credits'){done=true;}
}
function action(id,a,e){
 if(e!==epoch)return;
 if(a==='help'&&state==='play'){pressed.KeyR=true;return;}
 if(a==='pause'&&(state==='play'||state==='pause')){setPaused(id,!pauses[id]);return;}
 if(!['confirm','skip'].includes(a)||!['dialog','tally','gameover','credits'].includes(state))return;
 ready[id]=true;skip[id]=a==='skip';if(ready.every(Boolean))advance();
}
function setPaused(id,value){
 controls[id]={dir:-1,fire:false};
 if(state!=='play'&&state!=='pause')return;
 pauses[id]=!!value;if(pauses.some(Boolean)&&state==='play')setState('pause');
 else if(!pauses.some(Boolean)&&state==='pause')setState('play');
}
function input(id,c){controls[id]={dir:c.dir,fire:c.fire};}
function tick(){
 if(done)return;
 if(state==='dialog'){dlg.t++;dlg.ch=Math.min(dlg.lines[dlg.i].t.length,dlg.ch+0.8);}
 else if(state==='curtain'){st++;frame++;if(st>=150)setState('play');}
 else if(state==='play')updPlay();else st++;
 for(const k in pressed)delete pressed[k];
}
function snapshot(){
 return {state,st,epoch,lvl,score,hiscore,frame,G:Array.from(G),crew,enemies,
 bullets:bullets.map(({from,...b})=>b),parts,floats,pastries,powerups,queue,
 freeze,panT,baseAlive,levelEnd,boss,killed,overT,bossDie,shake,
 dlg:dlg?{lines:dlg.lines,i:dlg.i,ch:dlg.ch,scene:dlg.scene,t:dlg.t}:null,
 ready,pauses,done,sounds:soundEvents};
}
// IDs are assigned by the server, never by client packets.
score=0;resetCrew();runDialog(INTRO_COOP,()=>startLevel(0));
globalThis.SIM={tick,snapshot,input,action,setPaused,get done(){return done;},get state(){return state;}};
`;
fs.writeFileSync(path.join(__dirname,'../server/sim-source.js'),pre+story+world+intro+post);
console.log('Shared authoritative rules built');
