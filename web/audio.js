'use strict';
// Original compositions inspired by the restrained NES sound palette.
// 2 pulse voices + triangle bass + soft noise; no sampled/copying game music.
let AC=null,masterBus=null,musicBus=null,sfxBus=null,music=null,noiseBuf=null;
let muted=false;
const audioPrefs={music:0.30,sfx:0.55,mode:'cues'};
try{muted=localStorage.getItem('vanna_muted')==='1';const p=JSON.parse(localStorage.getItem('vanna_audio_crt')||'null');if(p){for(const k of ['music','sfx'])if(Number.isFinite(p[k]))audioPrefs[k]=Math.max(0,Math.min(1,p[k]));if(['calm','cues','off'].includes(p.mode))audioPrefs.mode=p.mode;}}catch(e){}
const voices=new Set(),pulseWaves=new WeakMap();
const mf=m=>440*Math.pow(2,(m-69)/12);
function smooth(param,value,time=0.04){if(!AC)return;param.cancelScheduledValues(AC.currentTime);param.setTargetAtTime(value,AC.currentTime,time);}
function setupAudio(context){
 AC=context;voices.clear();noiseBuf=null;
 masterBus=AC.createGain();musicBus=AC.createGain();sfxBus=AC.createGain();
 const low=AC.createBiquadFilter();low.type='lowpass';low.frequency.value=2600;low.Q.value=0.55;
 const high=AC.createBiquadFilter();high.type='highpass';high.frequency.value=45;high.Q.value=0.55;
 const comp=AC.createDynamicsCompressor();comp.threshold.value=-20;comp.knee.value=14;comp.ratio.value=3;comp.attack.value=0.008;comp.release.value=0.15;
 musicBus.gain.value=audioPrefs.mode==='off'?0:audioPrefs.music;sfxBus.gain.value=audioPrefs.sfx;masterBus.gain.value=muted?0:0.65;
 musicBus.connect(masterBus);sfxBus.connect(masterBus);masterBus.connect(high);high.connect(low);low.connect(comp);comp.connect(AC.destination);
 const real=new Float32Array(13),imag=new Float32Array(13);
 // Rounded odd-harmonic pulse: warmer, less nasal than the old 25% wave.
 for(let h=1;h<13;h++){real[h]=0;imag[h]=h%2?1/Math.pow(h,1.65):0;}
 pulseWaves.set(AC,AC.createPeriodicWave(real,imag));
 noiseBuf=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const a=noiseBuf.getChannelData(0);let seed=1974;for(let i=0;i<a.length;i++){seed=(Math.imul(seed,1664525)+1013904223)|0;a[i]=((seed>>>0)/2147483648)-1;}
}
function audioInit(){
 if(!AC){try{setupAudio(new (window.AudioContext||window.webkitAudioContext)());}catch(e){return;}}
 if(AC.state==='suspended')AC.resume().catch(()=>{});
}
function audioApply(){if(!AC)return;smooth(masterBus.gain,muted?0:0.65);smooth(musicBus.gain,audioPrefs.mode==='off'?0:audioPrefs.music);smooth(sfxBus.gain,audioPrefs.sfx);}
function saveAudioPrefs(){try{localStorage.setItem('vanna_audio_crt',JSON.stringify(audioPrefs));localStorage.setItem('vanna_muted',muted?'1':'0');}catch(e){}}
function trackVoice(node,gain,end,family){const v={node,gain,end,family};voices.add(v);node.onended=()=>{voices.delete(v);node.disconnect();gain.disconnect();};return v;}
function cancelMusicVoices(){if(!AC)return;const t=AC.currentTime;for(const v of voices)if(v.family==='music'){try{v.gain.gain.cancelScheduledValues(t);v.gain.gain.setValueAtTime(t<v.end?Math.min(v.gain.gain.value,0.03):0,t);v.gain.gain.linearRampToValueAtTime(0,t+0.025);v.node.stop(t+0.035);}catch(e){}}}
function chipNote(f,d,type,v,bus,t,f2=null,family='sfx'){
 if(!AC||!bus)return;const o=AC.createOscillator(),g=AC.createGain();
 if(type==='pulse')o.setPeriodicWave(pulseWaves.get(AC));else o.type=type;
 o.frequency.setValueAtTime(Math.max(35,f),t);if(f2)o.frequency.exponentialRampToValueAtTime(Math.max(35,f2),t+d);
 const attack=Math.min(0.012,d*0.18),release=Math.min(0.055,d*0.38),end=t+d;
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+attack);g.gain.setValueAtTime(v,Math.max(t+attack,end-release));g.gain.linearRampToValueAtTime(0,end);
 o.connect(g);g.connect(bus);trackVoice(o,g,end,family);o.start(t);o.stop(end+0.005);
}
function tone(f,d,type='pulse',v=0.04,f2=null,delay=0){if(!AC||muted)return;chipNote(f,d,type==='square'||type==='sawtooth'?'pulse':type,v,sfxBus,AC.currentTime+0.006+delay,f2);}
function noiseNote(d,v,fr,bus,t,family='sfx'){
 if(!AC)return;const s=AC.createBufferSource();s.buffer=noiseBuf;const fl=AC.createBiquadFilter();fl.type='lowpass';fl.frequency.setValueAtTime(fr,t);fl.frequency.exponentialRampToValueAtTime(100,t+d);fl.Q.value=0.45;
 const g=AC.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+0.008);g.gain.exponentialRampToValueAtTime(0.0001,t+d);s.connect(fl);fl.connect(g);g.connect(bus);
 trackVoice(s,g,t+d,family);s.addEventListener('ended',()=>fl.disconnect());s.start(t);s.stop(t+d+0.005);
}
function noise(d,v=0.06,fr=1500,delay=0){if(!AC||muted)return;noiseNote(d,v,fr,sfxBus,AC.currentTime+0.006+delay);}
const sfxLast={};function limitSfx(k,seconds){if(!AC)return false;const t=AC.currentTime;if(t-(sfxLast[k]??-99)<seconds)return false;sfxLast[k]=t;return true;}
const SFX={
 shoot(){if(limitSfx('shoot',0.09))tone(480,0.055,'pulse',0.037,850);},
 pea(){if(limitSfx('pea',0.10))tone(260,0.055,'triangle',0.026,380);},
 hit(){if(limitSfx('hit',0.08))noise(0.065,0.05,1300);},
 steel(){if(limitSfx('steel',0.11))tone(880,0.06,'triangle',0.039,650);},
 boom(){if(limitSfx('boom',0.17)){noise(0.26,0.09,1350);tone(150,0.22,'triangle',0.068,48);}},
 pop(){tone(392,0.075,'pulse',0.035,523);tone(659,0.105,'triangle',0.041,null,0.075);},
 power(){[392,494,587,784].forEach((f,i)=>tone(f,0.13,'pulse',0.035,null,i*0.085));},
 bonus(){tone(659,0.085,'triangle',0.047);tone(880,0.11,'triangle',0.040,null,0.09);},
 die(){[440,392,330,262,196,131].forEach((f,i)=>tone(f,0.15,'pulse',0.030,null,i*0.12));},
 blip(p){if(limitSfx('blip',0.11))tone(Math.min(720,p),0.023,'triangle',0.014);},
 sel(){tone(659,0.06,'triangle',0.043);tone(880,0.10,'triangle',0.040,null,0.065);}
};
// Every bar is eight eighth-note ticks. MIDI 0 is a real rest.
const R=[[0,8]];
function bar(...events){const e=events.map(x=>Array.isArray(x)?x:[x,1]);if(e.reduce((a,x)=>a+x[1],0)!==8)throw Error('Invalid music bar');return e;}
function phrase(bars){return bars.flatMap(b=>b.map(e=>e.slice()));}
function transpose(bars,n){return bars.map(b=>b.map(([p,d])=>[p?p+n:0,d]));}
function bassBar(root,quiet=false){return quiet?[[root,2],[0,2],[root+7,2],[0,2]]:[[root,2],[0,1],[root+7,1],[root+12,1],[0,1],[root+7,1],[0,1]];}
function counterBar(root,minor=false){return [[0,2],[root+(minor?15:16),1],[0,1],[root+19,1],[0,1],[root+12,1],[0,1]];}
// NEW soundtrack: syncopated bass, short hooks, no previous march melodies.
const PATROL=[bar([57,1.5],[0,.5],[60,1],[62,1],[64,2],[0,2]),bar([67,1],[64,1],[62,1.5],[0,.5],[60,2],[0,2]),bar([57,2],[0,1],[60,1],[64,1.5],[62,.5],[0,2]),bar([59,1],[62,1],[64,2],[59,2],[0,2]),bar([60,1.5],[62,.5],[64,2],[67,1],[64,1],[0,2]),bar([65,2],[64,1],[62,1],[60,2],[0,2]),bar([59,1.5],[0,.5],[62,1],[64,1],[60,2],[0,2]),bar([57,3],[0,5])];
const CRUISE=[bar([62,1.5],[65,.5],[69,1],[0,1],[67,1.5],[65,.5],[0,2]),bar([64,1],[67,1],[69,2],[72,1],[69,1],[0,2]),bar([65,2],[62,1],[60,1],[62,2],[0,2]),bar([59,1.5],[62,.5],[67,2],[64,2],[0,2]),bar([62,1],[65,1],[69,1],[0,1],[72,2],[0,2]),bar([71,1.5],[69,.5],[67,2],[65,2],[0,2]),bar([64,2],[62,1],[60,1],[59,2],[0,2]),bar([62,3],[0,5])];
const MILK=[bar([65,3],[64,1],[60,2],[0,2]),bar([62,2],[65,1],[69,1],[67,2],[0,2]),bar([64,1.5],[0,.5],[67,2],[62,2],[0,2]),bar([60,4],[0,4]),bar([69,2],[67,1],[65,1],[64,2],[0,2]),bar([62,3],[60,1],[57,2],[0,2]),bar([59,2],[62,2],[64,2],[0,2]),bar([60,4],[0,4])];
const GUARD=[bar([55,2],[58,1],[0,1],[62,2],[0,2]),bar([65,1.5],[62,.5],[60,2],[58,2],[0,2]),bar([55,1],[0,1],[58,2],[60,1],[62,1],[0,2]),bar([57,2],[62,1.5],[0,.5],[54,2],[0,2]),bar([58,1.5],[60,.5],[62,2],[65,2],[0,2]),bar([63,2],[62,2],[60,2],[0,2]),bar([57,1],[58,1],[60,2],[54,2],[0,2]),bar([55,3],[0,5])];
const BARON=[bar([57,1],[0,1],[64,1],[0,1],[60,2],[0,2]),bar([62,1.5],[64,.5],[67,2],[64,2],[0,2]),bar([65,2],[64,1],[62,1],[60,2],[0,2]),bar([59,1],[0,1],[64,2],[56,2],[0,2]),bar([57,1.5],[60,.5],[64,1],[67,1],[69,2],[0,2]),bar([67,2],[65,1],[64,1],[62,2],[0,2]),bar([60,1],[62,1],[59,2],[56,2],[0,2]),bar([57,4],[0,4])];
function grooveBass(root,soft=false){return soft?[[root,2],[0,6]]:[[root,1.5],[0,.5],[root+7,1],[0,1],[root+12,1.5],[root+7,.5],[0,2]];}
function makeTheme(name,bars,roots,bpm,style='soft'){
 const reply=bars.map((b,i)=>i%2?R:b.map(([n,d])=>[n?Math.max(48,n-12):0,d]));
 const bridge=bars.slice(4).concat(bars.slice(0,4)).map((b,i)=>i===7?R:b);
 const lead=[...bars,...reply,...bridge,...Array.from({length:8},()=>R)];
 const bass=Array.from({length:32},(_,i)=>i>=28?R:grooveBass(roots[i%8],i>=24));
 return {name,bpm,lead:phrase(lead),bass:phrase(bass),counter:[[0,256]],ticks:256,loop:true,style,level:true};
}
const LEVEL_MUSIC=[
 makeTheme('Карамельный патруль',PATROL,[45,45,41,40,48,50,43,45],102),
 makeTheme('Морковный круиз 2.0',CRUISE,[38,40,41,43,38,43,40,38],110),
 makeTheme('Молочная ночь',MILK,[41,38,43,48,41,38,43,48],82,'float'),
 makeTheme('Тыквенный дозор',GUARD,[43,46,48,38,46,48,38,43],96),
 makeTheme('Брокколи после полуночи',BARON,[45,43,41,40,45,50,40,45],104,'boss')
];
function song(name,bpm,bars,bassBars,loop=false,style='cue'){
 const ticks=bars.flat().reduce((s,e)=>s+e[1],0);
 if(bassBars.flat().reduce((s,e)=>s+e[1],0)!==ticks)throw Error('Music durations differ: '+name);
 return {name,bpm,lead:phrase(bars),bass:phrase(bassBars),counter:[[0,ticks]],ticks,loop,style,level:false};
}
const M_TITLE=song('Канал восемь — карамельный эфир',108,[...PATROL,...CRUISE,R,R,R,R],[...Array.from({length:16},(_,i)=>grooveBass([45,45,41,40,48,50,43,45][i%8])),R,R,R,R],true,'title');
const M_START=song('Ванна, приём!',112,[bar([57,1],[64,.5],[0,.5],[60,1],[62,1],[57,2],[0,2])],[bar([45,2],[40,2],[45,2],[0,2])]);
const M_WIN=song('Пирожки на частоте восемь',108,[bar([60,1],[0,1],[64,1],[67,1],[62,2],[0,2]),bar([60,3],[0,5])],[grooveBass(48),bar([48,3],[0,5])]);
const M_OVER=song('Резервный торт',86,[bar([64,2],[60,2],[59,2],[0,2]),bar([57,3],[0,5])],[bar([45,2],[41,2],[40,2],[0,2]),bar([45,3],[0,5])]);
const M_END=song('Тёплый вечер в Плюшкино',84,[...MILK,...PATROL,R,R,R,R],[...Array.from({length:16},(_,i)=>grooveBass([41,38,43,48,41,38,43,48][i%8],true)),R,R,R,R],true,'ending');
const M_BOSS=LEVEL_MUSIC[4];
// Compatibility identifiers for existing scripted scene cues.
const B_TITLE=[],B_START=[],B_WIN=[],B_OVER=[],B_END=[],B_BOSS=[];
function playMusic(song,_bass,_step,_loop,_vol){
 stopMusic();if(!song||!AC)return;
 if(audioPrefs.mode==='off'||(audioPrefs.mode==='cues'&&song.level))return;
 const tick=60/song.bpm/2;
 music={song,tick,origin:AC.currentTime+0.04,tracks:[song.lead,song.bass,song.counter].map(notes=>({notes,index:0,cycle:0,offset:0})),drumTick:0};
}
function stopMusic(){cancelMusicVoices();music=null;}
function pauseMusicClock(){if(!AC||!music)return;music.pausedAt=AC.currentTime;cancelMusicVoices();}
function resumeMusicClock(){if(!AC||!music)return;const now=AC.currentTime;if(music.pausedAt!==undefined){music.origin+=now-music.pausedAt;delete music.pausedAt;}else if(music.origin+music.tick*music.song.ticks<now-1){music.origin=now+0.04;for(const tr of music.tracks){tr.index=0;tr.offset=0;tr.cycle=0;}music.drumTick=0;}}
function playLevelMusic(index){playMusic(LEVEL_MUSIC[index]||LEVEL_MUSIC[0]);}
function musicTick(now=AC?.currentTime){
 if(!music||!AC||music.pausedAt!==undefined)return;
 const m=music,{song,tick,origin}=m,ahead=now+0.12;
 for(let channel=0;channel<3;channel++){
  const tr=m.tracks[channel];let guard=0;
  while(guard++<1024){
   if(tr.index>=tr.notes.length){if(!song.loop)break;tr.index=0;tr.offset=0;tr.cycle++;}
   const t=origin+(tr.cycle*song.ticks+tr.offset)*tick;if(t>ahead)break;
   const [note,len]=tr.notes[tr.index++];tr.offset+=len;
   if(note&&t>=now-0.025&&!muted&&audioPrefs.mode!=='off'){
    const base=channel===0?0.12:channel===1?0.176:0.0352;
    const levelSoft=song.level?0.72:1;
    const variation=tr.cycle%2===1&&channel===0?0.88:1;
    chipNote(mf(note),Math.max(0.04,len*tick*(channel===1?0.64:0.86)),channel===1||song.style==='float'||song.style==='ending'?'triangle':'pulse',base*levelSoft*variation,musicBus,Math.max(now,t),null,'music');
   }
  }
 }
 // Short, dark snare only on selected bars, never a constant hiss.
 if(song.level&&song.style!=='float'){
  while(origin+m.drumTick*tick<ahead){
   const t=origin+m.drumTick*tick,b=m.drumTick%256;
   if(b<192&&b%16===12&&t>=now-0.025&&!muted&&audioPrefs.mode!=='off')noiseNote(0.04,0.008,700,musicBus,Math.max(now,t),'music');
   m.drumTick++;
  }
 }
}
