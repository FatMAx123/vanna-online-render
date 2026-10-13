// Share offline gameplay rules; use a short server-timed cinematic track online.
const fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../web/game.js'),'utf8');
const section=(a,b)=>{const i=source.indexOf(a),j=source.indexOf(b);if(i<0||j<i)throw Error('Missing rules section: '+a);return source.slice(i,j);};
const story=section('// ====== СЮЖЕТ И УРОВНИ ======','// ====== ВВОД:');
const world=section('// ====== МИР ======','// ====== ОТРИСОВКА ======');
const cuts=JSON.parse(fs.readFileSync(path.join(__dirname,'../server/cutscenes.json'),'utf8'));
for(const c of [cuts.intro,...cuts.pre,...cuts.transitions,cuts.retry,cuts.ending]){
 if(!c.frames.length||c.frames.length>3||c.frames.some(f=>!f.t||f.t.length>70||!Number.isInteger(f.d)||f.d<60||f.d>240))throw Error('Invalid short cinematic');
 if(c.frames.reduce((n,f)=>n+f.d,0)>480)throw Error('Cinematic exceeds eight seconds');
}
const pre=`'use strict';
const FS=208,FX=16,FY=16,coop=true;let state='title',st=0,epoch=0,dlg=null;
const CUTS=${JSON.stringify(cuts)};
const pressed={},controls=[{dir:-1,fire:false},{dir:-1,fire:false}];
const curDir=id=>controls[id].dir,fireHeld=id=>controls[id].fire;
const localStorage={getItem:()=>null,setItem:()=>{}};
let soundId=0,soundEvents=[];
const SFX=new Proxy({}, {get:(_,name)=>(...args)=>{soundEvents.push({id:++soundId,name,args});if(soundEvents.length>128)soundEvents.shift();}});
const stopMusic=()=>{},playMusic=()=>{},M_END=0,B_END=0,M_WIN=0,B_WIN=0,M_OVER=0,B_OVER=0;
function setState(s){state=s;st=0;epoch++;}
function runCutscene(c,done){
 dlg={lines:c.frames,label:c.label,i:0,segmentT:0,t:0,total:c.frames.reduce((n,f)=>n+f.d,0),done,scene:c.frames[0].s};
 for(const id of [0,1])controls[id]={dir:-1,fire:false};setState('cutscene');
}
function finishCutscene(){if(!dlg)return;const fn=dlg.done;dlg=null;fn();}
function runDialog(lines,done){runCutscene(lines===ENDING?CUTS.ending:CUTS.retry,done);}
function enterBattle(i){loadLevel(i);pauses=[false,false];setState('play');}
function startLevel(i){runCutscene(CUTS.pre[i],()=>enterBattle(i));}
function nextAfterTally(){runCutscene(CUTS.transitions[lvl],()=>enterBattle(lvl+1));}
function retryBattle(){runCutscene(CUTS.retry,()=>{resetCrew();score=Math.floor(score/2);enterBattle(lvl);});}
`;
const post=`
let ready=[false,false],pauses=[false,false],done=false;
function action(id,a,e){
 if(e!==epoch)return;
 if(a==='help'&&state==='play'){pressed.KeyR=true;return;}
 if(a==='pause'&&(state==='play'||state==='pause')){setPaused(id,!pauses[id]);return;}
 // One player's skip advances the same server-controlled scene for BOTH clients.
 if((a==='skip'||a==='confirm')&&state==='cutscene'){finishCutscene();return;}
 if((a==='skip'||a==='confirm')&&state==='credits'){done=true;}
}
function setPaused(id,value){
 controls[id]={dir:-1,fire:false};if(state!=='play'&&state!=='pause')return;
 pauses[id]=!!value;if(pauses.some(Boolean)&&state==='play')setState('pause');
 else if(!pauses.some(Boolean)&&state==='pause')setState('play');
}
function input(id,c){controls[id]={dir:c.dir,fire:c.fire};}
function tick(){
 if(done)return;
 if(state==='cutscene'){
  dlg.t++;dlg.segmentT++;
  if(dlg.segmentT>=dlg.lines[dlg.i].d){dlg.i++;dlg.segmentT=0;if(dlg.i>=dlg.lines.length)finishCutscene();}
 }else if(state==='play')updPlay();
 else if(state==='tally'){if(++st>=180)nextAfterTally();}
 else if(state==='gameover'){if(++st>=150)retryBattle();}
 else if(state==='credits'){if(++st>=180)done=true;}
 else st++;
 for(const k in pressed)delete pressed[k];
}
function snapshot(){
 return {state,st,epoch,lvl,score,hiscore,frame,G:Array.from(G),crew,enemies,
 bullets:bullets.map(({from,...b})=>b),parts,floats,pastries,powerups,queue,
 freeze,panT,baseAlive,levelEnd,boss,killed,overT,bossDie,shake,
 dlg:dlg?{lines:dlg.lines,label:dlg.label,i:dlg.i,segmentT:dlg.segmentT,scene:dlg.scene,t:dlg.t,total:dlg.total}:null,
 ready,pauses,done,sounds:soundEvents};
}
// No long prologue, pre-level dialogue or curtain after the opening cinematic.
score=0;resetCrew();runCutscene(CUTS.intro,()=>enterBattle(0));
globalThis.SIM={tick,snapshot,input,action,setPaused,get done(){return done;},get state(){return state;}};
`;
fs.writeFileSync(path.join(__dirname,'../server/sim-source.js'),pre+story+world+post);
console.log('Shared rules and automatic online cinematics built');
