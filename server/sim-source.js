'use strict';
const FS=208,FX=16,FY=16,coop=true;let state='title',st=0,epoch=0,dlg=null;
const CUTS={"intro":{"label":"ДВЕ ВАННЫ. ОДИН ТОРТ.","frames":[{"s":"town","t":"БАРОН БРОККОЛИ ЗАПРЕТИЛ СЛАДКОЕ.","d":150},{"s":"garden","w":"baron","t":"ПОСЛЕДНИЙ ТОРТ БУДЕТ МОИМ!","d":150},{"s":"yard","w":"zina","t":"ФЁДОР, В ВАННУ! ЗАЩИТИМ ТОРТ ВМЕСТЕ.","d":180}]},"pre":[{"label":"КАПУСТНЫЕ ПОЛЯ","frames":[{"s":"garden","w":"cabbage","t":"КОЧАНЫ ИДУТ В АТАКУ!","d":150},{"s":"yard","w":"zina","t":"СЕЙЧАС БУДУТ ПИРОЖКИ.","d":150}]},{"label":"МОРКОВНЫЙ АВТОБАН","frames":[{"s":"garden","w":"carrot","t":"МОРКОВНЫЙ СПЕЦНАЗ НА ВЫЕЗДЕ!","d":150},{"s":"yard","w":"ded","t":"ЗИНА, НЕ РАСПЛЕСКАЙ СИРОП!","d":150}]},{"label":"МОЛОЧНЫЕ РЕКИ","frames":[{"s":"garden","w":"onion","t":"МЫ ЗАСТАВИМ ВАС ПЛАКАТЬ!","d":150},{"s":"yard","w":"zina","t":"ВАННА НЕ ПЛАВАЕТ. ДЕРЖИСЬ БЕРЕГА.","d":150}]},{"label":"ТЫКВЕННАЯ КРЕПОСТЬ","frames":[{"s":"garden","w":"pumpkin","t":"НАША БРОНЯ СЛАДКОЕ НЕ ПРОПУСТИТ!","d":150},{"s":"yard","w":"zina","t":"ЗНАЧИТ, ДОБАВИМ КАРАМЕЛИ.","d":150}]},{"label":"БАРОН БРОККОЛИ","frames":[{"s":"garden","w":"baron","t":"Я САМ ЗАБЕРУ ВАШ ТОРТ!","d":180},{"s":"yard","w":"ded","t":"ДВЕ ВАННЫ ПРОТИВ ОДНОЙ БРОККОЛИ!","d":180}]}],"transitions":[{"label":"УРОВЕНЬ 2 · МОРКОВНЫЙ АВТОБАН","frames":[{"s":"yard","w":"zina","t":"КАПУСТА СТАЛА ПИРОЖКАМИ.","d":150},{"s":"garden","w":"carrot","t":"МОРКОВНЫЙ СПЕЦНАЗ, НА ВЫЕЗД!","d":150}]},{"label":"УРОВЕНЬ 3 · МОЛОЧНЫЕ РЕКИ","frames":[{"s":"yard","w":"zina","t":"МОРКОВНЫЕ КЕКСЫ ГОТОВЫ.","d":150},{"s":"garden","w":"onion","t":"МОЛОЧНАЯ РЕКА ПОД НАШИМ КОНТРОЛЕМ!","d":150}]},{"label":"УРОВЕНЬ 4 · ТЫКВЕННАЯ КРЕПОСТЬ","frames":[{"s":"yard","w":"ded","t":"ЛУКОВЫЕ КОЛЬЦА! ОСТАЛИСЬ ТЫКВЫ.","d":150},{"s":"garden","w":"pumpkin","t":"ПОПРОБУЙТЕ ПРОБИТЬ НАШУ БРОНЮ!","d":150}]},{"label":"ФИНАЛ · БАРОН БРОККОЛИ","frames":[{"s":"yard","w":"zina","t":"ТЫКВЕННЫЙ ПИРОГ ГОТОВ. ГДЕ БАРОН?","d":150},{"s":"garden","w":"baron","t":"Я ЗДЕСЬ! ТОРТ ВСЁ ЕЩЁ БУДЕТ МОИМ!","d":210}]}],"retry":{"label":"ЗАПАСНЫЕ ВАННЫ","frames":[{"s":"yard","w":"zina","t":"ФЁДОР, НЕСИ ЗАПАСНЫЕ ВАННЫ.","d":120},{"s":"yard","w":"ded","t":"И ВТОРОЙ ТОРТ! МЫ ЕЩЁ ПОВОЮЕМ.","d":120}]},"ending":{"label":"ТОРТ СПАСЁН!","frames":[{"s":"garden","w":"baron","t":"Я ПРОСТО ХОТЕЛ КУСОЧЕК...","d":150},{"s":"party","w":"zina","t":"САДИСЬ ЗА СТОЛ. ТОРТА ХВАТИТ ВСЕМ.","d":150},{"s":"party","t":"ДВЕ ВАННЫ СПАСЛИ ПРАЗДНИК. С ДНЁМ РОЖДЕНИЯ, ЗИНА!","d":180}]}};
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
// ====== СЮЖЕТ И УРОВНИ ======
const SPK={zina:{n:'БАБА ЗИНА',c:'#ff6fbf',bg:'#ffe6f4',p:740},baron:{n:'БАРОН БРОККОЛИ',c:'#7ed957',bg:'#1e3a2a',p:180},ded:{n:'ДЕД ФЁДОР',c:'#8fd3ff',bg:'#24406a',p:300},
 cabbage:{n:'КОЧАН-СЕРЖАНТ',c:'#7ed957',bg:'#2a4a2a',p:260},carrot:{n:'МОРКОВЬ-ГОНЩИЦА',c:'#ff8c1a',bg:'#4a2a1a',p:520},onion:{n:'ЛУК-ПЛАКСА',c:'#c06ae0',bg:'#3a1a4a',p:420},
 pumpkin:{n:'ТЫКВА-ПАЛАДИН',c:'#ff9a1f',bg:'#3a1a0a',p:150},pie:{n:'БЫВШИЙ КОЧАН',c:'#ffd36b',bg:'#5a3a1a',p:600}};
const INTRO=[
 {s:'town',t:'ГОРОД ПЛЮШКИНО. ЗДЕСЬ ТРИСТА ЛЕТ НЕ БЫЛО НИ ОДНОЙ ДИЕТЫ. ДАЖЕ МЭР ВЕСИЛ КАК ДВА МЭРА.'},
 {s:'town',t:'ГЛАВНАЯ ГОРДОСТЬ ГОРОДА - БАБА ЗИНА. ЗАВТРА ЕЙ 90, И ДЛЯ НЕЁ ИСПЕЧЁН ПОСЛЕДНИЙ В ГОРОДЕ ТОРТ.'},
 {s:'garden',t:'НО НОЧЬЮ С ОГОРОДА НА ХОЛМЕ ПОДНЯЛАСЬ ЗЕЛЁНАЯ УГРОЗА...'},
 {s:'garden',w:'baron',t:'ГРАЖДАНЕ ПЛЮШКИНО! Я - БАРОН БРОККОЛИ! ОТНЫНЕ ВСЕ СЛАДОСТИ ЗАПРЕЩЕНЫ!'},
 {s:'garden',w:'baron',t:'НА ЗАВТРАК - ПАРОВАЯ КАПУСТА. НА ОБЕД - ПАРОВАЯ КАПУСТА. НА УЖИН - ЛЕКЦИЯ О ПОЛЬЗЕ ПАРОВОЙ КАПУСТЫ!'},
 {s:'garden',w:'baron',t:'А МОЯ ОВОЩНАЯ БРОНЕДИВИЗИЯ ЗАХВАТИТ ПОСЛЕДНИЙ ТОРТ! МУА-ХА-ХА! КХЕ. КХЕ. СЕЛЬДЕРЕЙ НЕ В ТО ГОРЛО ПОШЁЛ.'},
 {s:'yard',w:'zina',t:'ЭТО ЧТО ЖЕ, КАКОЙ-ТО КУСТ БУДЕТ ЕСТЬ МОЙ ТОРТ? НА МОЙ ДЕНЬ РОЖДЕНИЯ?'},
 {s:'yard',w:'zina',t:'ФЁДОР! ВЫКАТЫВАЙ ВАННУ. И ЗАРЯЖАЙ КАРАМЕЛЬКИ.'},
 {s:'yard',w:'ded',t:'ЗИНА, ОНА ЖЕ ЧУГУННАЯ, С 1974 ГОДА! В НЕЙ ДАЖЕ ВОДА ЕЩЁ ТА, СОВЕТСКАЯ!'},
 {s:'yard',w:'zina',t:'ВОТ И ОТЛИЧНО. ЗНАЧИТ БРОНЯ. А ПУШКУ ПРИКРУТИ ОТ САМОВАРА.'},
 {s:'yard',w:'ded',t:'УЧЕНЫЕ ДОКАЗАЛИ: ОВОЩИ ОТ САХАРА ПРЕВРАЩАЮТСЯ В ВЫПЕЧКУ. ОДНА КАРАМЕЛЬКА - И КАПУСТА СТАНЕТ ПИРОЖКОМ!'},
 {s:'yard',w:'zina',t:'КАКИЕ ЕЩЁ УЧЁНЫЕ?'},
 {s:'yard',w:'ded',t:'Я. ВЧЕРА. НА КУХНЕ. НЕ СПРАШИВАЙ.'},
 {s:'yard',t:'ТАК НАЧАЛАСЬ ВАННА ВОЙНЫ. ЗАЩИТИ ТОРТ. ПРЕВРАТИ ОВОЩИ В ПИРОЖКИ. НЕ РАСПЛЕСКАЙ ВОДУ.'},
];
const ROWS=[
`.............
.W.W.W.W.W.W.
.W.W.W.W.W.W.
.W.W.WPW.W.W.
.W.W..C..W.W.
.....W.W.....
P.WW.....WW.P
.....W.W.....
.W.W.WWW.W.W.
.W.W.W.W.W.W.
.W.W.....W.W.
.W.W.....W.W.
.............`,
`.....C...C...
.WWW.C.P.C.WW
.....SSSSS...
.P.WWW.WWW.P.
.S.........S.
.S.WW.P.WW.S.
CC.WW...WW.CC
.S....S....S.
.S.WWWSWWW.S.
.P.........P.
...WW...WW...
.W.W.....W.W.
.W.W.....W.W.`,
`.............
.WW.MMMMM.WW.
.WW.M...M.WW.
....M.P.M....
CC..M...M..CC
CMMMM.W.MMMMC
.....WWW.....
CMMMM.W.MMMMC
CC.........CC
..WW.MMM.WW..
..WW.....WW..
.P.W.....W.P.
...W.....W...`,
`..P.......P..
..P.WWWWW.P..
....W.C.W....
PP..W...W..PP
....WW.WW....
.C.........C.
WWW.PP.PP.WWW
.....S.S.....
.WW.SSSSS.WW.
.WW.......WW.
.P..WW.WW..P.
...W.....W...
.C.W.....W.C.`,
`.............
.............
.............
P...C...C...P
..WW.W.W.WW..
..W.......W..
CC..PP.PP..CC
..W.......W..
..WW.W.W.WW..
.S.........S.
.SWW.....WWS.
...W.....W...
...W.....W...`];
function Q(...a){const q=[];for(let i=0;i<a.length;i+=2)for(let k=0;k<a[i+1];k++)q.push(a[i]);for(let i=q.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[q[i],q[j]]=[q[j],q[i]];}return q;}
const LEVELS=[
 {name:'КАПУСТНЫЕ ПОЛЯ',q:()=>Q('cabbage',12,'carrot',2),
  pre:[{s:'garden',w:'baron',t:'ВПЕРЁД, МОИ КОЧАНЫ! ОНА ВСЕГО ЛИШЬ БАБУШКА!'},{s:'garden',w:'cabbage',t:'ТАК ТОЧНО, БАРОН! РАЗРЕШИТЕ ВОПРОС: А ЧТО ТАКОЕ БАБУШКА?'},{s:'yard',w:'zina',t:'ЭТО КОГДА ТЕБЯ КОРМЯТ, ПОКА НЕ ЛОПНЕШЬ. СЕЙЧАС УЗНАЕШЬ, МИЛОК.'}],
  post:[{s:'garden',w:'pie',t:'МЫ... ПРЕВРАТИЛИСЬ... В ПИРОЖКИ С КАПУСТОЙ... И НАМ ЭТО НРАВИТСЯ!'},{s:'garden',w:'baron',t:'ПРЕДАТЕЛИ! КАПУСТА ВНУТРИ - ЭТО НЕ ОПРАВДАНИЕ! МОРКОВНЫЙ СПЕЦНАЗ, НА ВЫЕЗД!'}]},
 {name:'МОРКОВНЫЙ АВТОБАН',q:()=>Q('carrot',10,'cabbage',6),
  pre:[{s:'garden',w:'carrot',t:'Я ЕДУ 200 ГРЯДОК В ЧАС! МНЕ ДАЖЕ ЗАЙЦЫ УСТУПАЮТ ДОРОГУ!'},{s:'garden',w:'baron',t:'ОНА БЫСТРЕЕ ТЕБЯ, ЗИНАИДА! У ТЕБЯ ЖЕ РАДИКУЛИТ!'},{s:'yard',w:'zina',t:'РАДИКУЛИТ У МЕНЯ С 1987-ГО. А ВОДИТЬ ВАННУ Я НАУЧИЛАСЬ ЕЩЁ В 1965-М. ОСТОРОЖНО, СИРОП СКОЛЬЗКИЙ.'}],
  post:[{s:'yard',w:'zina',t:'МОРКОВНЫЕ КЕКСЫ. ПОЛЕЗНО И ВКУСНО. ФЁДОР, ЗАПИШИ РЕЦЕПТ.'},{s:'yard',w:'ded',t:'ЗИНА! ОНИ ПЕРЕКРЫЛИ МОЛОЧНУЮ РЕКУ! ИДУТ ЛУКОВЫЕ ВОЙСКА!'}]},
 {name:'МОЛОЧНЫЕ РЕКИ',q:()=>Q('onion',8,'cabbage',4,'carrot',4),
  pre:[{s:'garden',w:'onion',t:'МЫ ЗАСТАВИМ ТЕБЯ ПЛАКАТЬ, СТАРУХА! У-У-У... ВОТ, УЖЕ САМИ ПЛАЧЕМ...'},{s:'yard',w:'zina',t:'Я ПОСМОТРЕЛА ВСЕ 400 СЕРИЙ "ПРОСТО МАРИИ". МЕНЯ СЛЕЗАМИ НЕ ПРОБЬЁШЬ.'},{s:'yard',w:'ded',t:'ВАННА НЕ ПЛАВАЕТ ПО МОЛОКУ, ЗИНА! ЕЗЖАЙ ПО БЕРЕЖКУ. А КАРАМЕЛЬ ЛЕТИТ ХОТЬ КУДА.'}],
  post:[{s:'garden',w:'onion',t:'ЛУКОВЫЕ КОЛЬЦА... В КАРАМЕЛИ... Я ПЛАЧУ, НО ТЕПЕРЬ ОТ СЧАСТЬЯ!'},{s:'garden',w:'baron',t:'ДОВОЛЬНО! ВЫПУСКАЙТЕ ТЫКВЕННУЮ ГВАРДИЮ! ИХ НЕ БЕРЁТ ДАЖЕ ХЭЛЛОУИН!'}]},
 {name:'ТЫКВЕННАЯ КРЕПОСТЬ',q:()=>Q('pumpkin',6,'onion',4,'carrot',4,'cabbage',4),
  pre:[{s:'garden',w:'pumpkin',t:'Я - ТЫКВА-ПАЛАДИН. ЧЕТЫРЕ СЛОЯ КОРКИ. НОЛЬ ЧУВСТВА ЮМОРА.'},{s:'yard',w:'ded',t:'ЗИНА, ДЕРЖИ ИРИСКИ "КИС-КИС". ОНИ ПРОБИВАЮТ ДАЖЕ ЗУБНЫЕ ПРОТЕЗЫ. ПРОВЕРЕНО.'},{s:'yard',w:'zina',t:'ФЁДОР, ТАК ВОТ КУДА ДЕЛАСЬ ТВОЯ ЧЕЛЮСТЬ. ЛАДНО. ПОЕХАЛИ ЧИСТИТЬ ТЫКВЫ.'}],
  post:[{s:'garden',w:'pumpkin',t:'Я... ТЫКВЕННЫЙ ПИРОГ. С КОРИЦЕЙ. ВНЕЗАПНО У МЕНЯ ПОЯВИЛОСЬ ЧУВСТВО ЮМОРА.'},{s:'garden',w:'baron',t:'ВСЁ САМОМУ ПРИХОДИТСЯ ДЕЛАТЬ! ЗИНАИДА, Я ИДУ ЛИЧНО! НА МЕГАБРОККОЛИ!'}]},
 {name:'ОГОРОД ЗЛА',boss:true,q:()=>[],
  pre:[{s:'garden',w:'baron',t:'ЗИНАИДА! ДАВАЙ РЕШИМ ЭТО КАК ОВОЩИ: ЧЕСТНО, ОТКРЫТО И БЕЗ СОУСА!'},{s:'yard',w:'zina',t:'ДАВАЙ, ЗЕЛЁНЫЙ. ТОЛЬКО ШАПОЧКУ НЕ СНИМАЙ - ПРОСТУДИШЬСЯ.'},{s:'garden',w:'baron',t:'ЭТО НЕ ШАПОЧКА! ЭТО МОЯ ГОЛОВА! И ЦИЛИНДР! ОГОНЬ ГОРОШКОМ!'}],
  post:[]},
];
const ENDING=[
 {s:'garden',w:'baron',t:'ЧТО ЭТО?.. СЛАДКО?.. Я... В ШОКОЛАДЕ?.. ЭТО... ВКУСНО?'},
 {s:'garden',w:'baron',t:'МНЕ В ДЕТСТВЕ НИКОГДА НЕ ДАВАЛИ ДЕСЕРТ. МАМА ВСЕГДА ГОВОРИЛА: "СНАЧАЛА ДОЕШЬ БРОККОЛИ".'},
 {s:'garden',w:'baron',t:'А Я И ЕСТЬ БРОККОЛИ! Я ТАК И НЕ СМОГ СЕБЯ ДОЕСТЬ! ПОЭТОМУ И ЗАПРЕТИЛ СЛАДКОЕ ВСЕМ!'},
 {s:'garden',w:'zina',t:'ОХ, ГОРЕ ТЫ ЗЕЛЁНОЕ. НУ ВСЁ, ВСЁ, НЕ РЕВИ. САДИСЬ ЗА СТОЛ. ПЕРВЫЙ КУСОК - ТЕБЕ.'},
 {s:'party',t:'ТОРТ ПОДЕЛИЛИ НА ВЕСЬ ГОРОД. ДАЖЕ НА ПИРОЖКИ, КОТОРЫЕ УТРОМ БЫЛИ КАПУСТОЙ.'},
 {s:'party',w:'ded',t:'ЗИНА, С ДНЁМ РОЖДЕНИЯ! Я ТЕБЕ ПОДАРОК ПРИГОТОВИЛ - НОВУЮ ВАННУ. АКРИЛОВУЮ.'},
 {s:'party',w:'zina',t:'ОСТАВЬ АКРИЛ ДЛЯ МИРНОГО ВРЕМЕНИ, ФЁДОР. В ОГОРОДЕ ЕЩЁ ОСТАЛИСЬ КАБАЧКИ.'},
 {s:'party',t:'БАРОН ОТКРЫЛ КАФЕ "ПОЛЕЗНЫЙ ДЕСЕРТ". ФИРМЕННОЕ БЛЮДО - БРОККОЛИ В ШОКОЛАДЕ. ЕГО НИКТО НЕ ЕСТ. НО ВСЕ ХВАЛЯТ.'},
 {s:'party',t:'А В ПЛЮШКИНО С ТЕХ ПОР ЕСТЬ ЗАКОН: КАЖДЫЙ ОВОЩ ИМЕЕТ ПРАВО НА ДЕСЕРТ. КОНЕЦ.'},
];
const GAMEOVER_DLG=[{s:'garden',w:'baron',t:'ТОРТ МОЙ! МУА-ХА-ХА! ВСЕМ ПАРОВАЯ КАПУСТА ДО КОНЦА ВРЕМЁН!'},{s:'yard',w:'zina',t:'ФЁДОР. НЕСИ ЗАПАСНУЮ ВАННУ. И ВТОРОЙ ТОРТ ИЗ МОРОЗИЛКИ.'},{s:'yard',w:'ded',t:'ТАК ТОЧНО! А ОН ТАМ ОТКУДА?'},{s:'yard',w:'zina',t:'БАБУШКА ВСЕГДА ГОТОВА, ФЁДОР.'}];

// ====== МИР ======
const ET={cabbage:{sp:0.5,hp:1,bs:2,fire:0.012,pts:100,pastry:'pie'},carrot:{sp:1.15,hp:1,bs:2.3,fire:0.012,pts:200,pastry:'cupcake'},onion:{sp:0.6,hp:1,bs:3.2,fire:0.03,pts:300,pastry:'ring'},pumpkin:{sp:0.45,hp:4,bs:2.6,fire:0.016,pts:400,pastry:'tart'}};
const POWERS={star:'КАРАМЕЛЬ+',bomb:'ТОРТ-БОМБА!',shield:'БИГУДИ-ЩИТ',clock:'ТИХИЙ ЧАС',pan:'СКОВОРОДКИ',life:'ВСТАВНАЯ ЧЕЛЮСТЬ'};
const G=new Uint8Array(52*52);
let lvl=0,score=0,hiscore=0,enemies=[],bullets=[],parts=[],floats=[],pastries=[],powerups=[];
let crew=[];
function scoreKey(){return coop?'vanna_hi_2p':'vanna_hi';}
function readRecord(){try{hiscore=+localStorage.getItem(scoreKey())||0;}catch(e){hiscore=0;}}
function resetCrew(){crew=[0,1].map(id=>({id,name:id?'ФЁДОР':'ЗИНА',color:id?'#8fe9f1':'#ff9ad5',active:id===0||coop,lives:3,stars:0,tank:null,respawnT:0}));}
function livingTanks(){return crew.filter(s=>s.active&&s.tank).map(s=>s.tank);}
function nearestTarget(x,y){return livingTanks().sort((a,b)=>(a.x-x)**2+(a.y-y)**2-((b.x-x)**2+(b.y-y)**2))[0]||null;}
resetCrew();
let queue=[],spawnT=0,spawnIdx=0,freeze=0,panT=0,baseAlive=true,levelEnd=0,boss=null,killed={},spawnedCount=0,overT=0,bossDie=0,shake=0,frame=0;
readRecord();
const solidM=t=>t===1||t===2||t===3||t===6,solidB=t=>t===1||t===2||t===6;
function setBaseWalls(t){for(let cy=46;cy<52;cy++)for(let cx=22;cx<30;cx++){if(cx>=24&&cx<28&&cy>=48)continue;G[cy*52+cx]=t;}}
function loadLevel(i){lvl=i;const rows=ROWS[i].split('\n');G.fill(0);const map={'.':0,W:1,P:2,M:3,C:4,S:5};
 for(let ty=0;ty<13;ty++)for(let tx=0;tx<13;tx++){const t=map[rows[ty][tx]]||0;for(let j=0;j<4;j++)for(let k=0;k<4;k++)G[(ty*4+j)*52+tx*4+k]=t;}
 for(let cy=46;cy<52;cy++)for(let cx=22;cx<30;cx++)G[cy*52+cx]=0;setBaseWalls(1);for(let cy=48;cy<52;cy++)for(let cx=24;cx<28;cx++)G[cy*52+cx]=6;
 for(let cy=48;cy<52;cy++)for(const bx of [16,32])for(let cx=bx;cx<bx+4;cx++)G[cy*52+cx]=0;
 enemies=[];bullets=[];parts=[];floats=[];pastries=[];powerups=[];queue=LEVELS[i].q();spawnT=60;spawnIdx=0;freeze=0;panT=0;baseAlive=true;levelEnd=0;killed={cabbage:0,carrot:0,onion:0,pumpkin:0};spawnedCount=0;overT=0;bossDie=0;
 boss=LEVELS[i].boss?{x:88,y:2,w:32,h:32,hp:coop?69:46,max:coop?69:46,vx:0.45,fireT:120,flash:0,phase:1,minionT:200}:null;for(const c of crew){c.tank=null;c.respawnT=0;}for(const c of crew)if(c.active&&c.lives>0)spawnPlayer(c.id);}
function spawnPlayer(id=0){
 const c=crew[id];if(!c?.active||c.lives<=0)return false;
 const starts=id?[128,144,160,176,192,64,48,32,16,0]:[64,48,32,16,0,128,144,160,176,192];
 for(const x of starts){const t={pid:id,x,y:192,w:16,h:16,dir:0,anim:0,shield:180,bul:0,slide:0,fireT:0};
  if(livingTanks().some(o=>ov(t,o))||enemies.some(e=>!e.dead&&ov(t,e)))continue;
  if(!canMove(t,x,192))continue;c.tank=t;c.respawnT=0;return true;
 }
 c.respawnT=15;return false;
}
function cellAt(x,y){if(x<0||y<0||x>=FS||y>=FS)return 255;return G[Math.floor(y/4)*52+Math.floor(x/4)];}
const ov=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function canMove(t,nx,ny){if(nx<0||ny<0||nx>FS-t.w||ny>FS-t.h)return false;
 for(let cy=Math.floor(ny/4);cy<=Math.floor((ny+t.h-0.01)/4);cy++)for(let cx=Math.floor(nx/4);cx<=Math.floor((nx+t.w-0.01)/4);cx++)if(solidM(G[cy*52+cx]))return false;
 const nb={x:nx,y:ny,w:t.w,h:t.h};const others=enemies.filter(e=>!e.dead).concat(livingTanks());for(const o of others){if(o===t)continue;if(ov(nb,o)&&!ov(t,o))return false;}
 if(boss&&t.pid!==undefined&&ov(nb,boss)&&!ov(t,boss))return false;return true;}
function moveTank(t,dir,sp){if(dir!==t.dir){if(dir%2!==t.dir%2){if(dir%2===0){const sx=Math.round(t.x/8)*8;if(canMove(t,sx,t.y))t.x=sx;}else{const sy=Math.round(t.y/8)*8;if(canMove(t,t.x,sy))t.y=sy;}}t.dir=dir;}
 const dx=[0,1,0,-1][dir],dy=[-1,0,1,0][dir];for(let s=sp;s>0.01;s-=0.25){if(canMove(t,t.x+dx*s,t.y+dy*s)){t.x+=dx*s;t.y+=dy*s;t.anim++;return true;}}return false;}
function fire(t,owner){const dx=[0,1,0,-1][t.dir],dy=[-1,0,1,0][t.dir];const cx=t.x+t.w/2+dx*8,cy=t.y+t.h/2+dy*8;
 const power=owner==='p'?crew[t.pid].stars:0;const sp=owner==='p'?(power>=1?4.5:3):ET[t.kind].bs;bullets.push({x:cx,y:cy,vx:dx*sp,vy:dy*sp,dir:t.dir,owner,from:t,pid:t.pid,power,kind:owner==='p'?Math.floor(Math.random()*5):(t.kind==='onion'?'tear':'pea'),alive:true});t.bul++;if(owner==='p')SFX.shoot();}
function addParts(x,y,n,cols,spd=1.5,life=40,grav=0.04){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=Math.random()*spd+0.3;parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-0.4,c:cols[i%cols.length],l:life*(0.5+Math.random()*0.5),g:grav,s:Math.random()<0.3?2:1});}}
const SPRINK=['#ff4d6d','#ffd36b','#63c74d','#4fc3f7','#c43aff','#ffffff','#ff8c1a'];
function floatT(x,y,t,c='#fff'){floats.push({x,y,t,c,l:70});}
function boomAt(x,y,big){addParts(x,y,big?40:24,SPRINK,big?2.4:1.6,big?60:40);parts.push({ring:1,x,y,r:2,l:14,c:'#fff'});shake=big?8:3;}
function killEnemy(e){e.dead=true;killed[e.kind]++;score+=ET[e.kind].pts;boomAt(e.x+8,e.y+8);pastries.push({x:e.x,y:e.y,vy:-1.6,k:ET[e.kind].pastry,l:90});floatT(e.x+8,e.y-4,'+'+ET[e.kind].pts,'#ffe14d');SFX.boom();SFX.pop();}
function spawnPower(){const types=Object.keys(POWERS);let t=types[Math.floor(Math.random()*types.length)];if(boss&&t==='clock'&&Math.random()<0.5)t='star';powerups.push({k:t,x:8+Math.floor(Math.random()*22)*8,y:16+Math.floor(Math.random()*18)*8,l:900});SFX.bonus();}
function applyPower(p,id=0){const c=crew[id];if(!c?.active)return;score+=500;floatT(p.x+8,p.y,POWERS[p.k],'#ff9ad5');SFX.power();
 if(p.k==='star')c.stars=Math.min(3,c.stars+1);if(p.k==='shield'&&c.tank)c.tank.shield=600;if(p.k==='clock')freeze=480;if(p.k==='life')c.lives++;
 if(p.k==='pan'){setBaseWalls(2);panT=900;}
 if(p.k==='bomb'){for(const e of enemies)if(!e.spawn&&!e.dead)killEnemy(e);if(boss&&!bossDie){boss.hp-=6;boss.flash=10;if(boss.phase===1&&boss.hp<=boss.max/2)boss.phase=2;if(boss.hp<=0){boss.hp=0;bossDie=1;}}shake=10;}}
function hitPlayer(id=0){
 const c=crew[id],t=c?.tank;if(!t||t.shield>0)return;
 boomAt(t.x+8,t.y+8,true);SFX.die();addParts(t.x+8,t.y+8,20,[c.color,'#ffffff','#ffe14d'],2,50);
 c.tank=null;c.stars=0;c.lives=Math.max(0,c.lives-1);c.respawnT=c.lives>0?90:0;
 if(crew.filter(c=>c.active).every(c=>c.lives<=0))overT=1;
}
function shareLife(){
 if(!coop||overT)return;const out=crew.find(c=>c.active&&c.lives===0),donor=crew.find(c=>c.active&&c.tank&&c.lives>1);
 if(!out||!donor)return;donor.lives--;out.lives=1;out.respawnT=1;floatT(donor.tank.x+8,donor.tank.y-8,'ЗАПАСНАЯ ВАННА!',out.color);SFX.power();
}
function destroyBase(){if(!baseAlive)return;baseAlive=false;boomAt(104,200,true);addParts(104,200,40,['#ff5fa8','#ffffff','#ffb3dc','#8fd3ff'],3,70);SFX.die();overT=1;}
function wallHit(b){const hw=8;let any=false,ping=false;const brk=(cx,cy)=>{if(cx<0||cy<0||cx>=52||cy>=52)return;const i=cy*52+cx;if(G[i]===1){G[i]=0;any=true;addParts(cx*4+2+FX-FX,cy*4+2,2,['#eaa84a','#ffd890','#8a4a1a'],1,25,0.08);}else if(G[i]===2){if(b.power>=3){G[i]=0;any=true;}else ping=true;}};
 if(b.vx===0||b.vy===0){if(b.vy!==0){const cy=Math.floor((b.y+(b.vy<0?-2:1.99))/4);for(let cx=Math.floor((b.x-hw)/4);cx<=Math.floor((b.x+hw-0.01)/4);cx++){brk(cx,cy);if(b.power>=3)brk(cx,cy+(b.vy<0?-1:1));}}
  else{const cx=Math.floor((b.x+(b.vx<0?-2:1.99))/4);for(let cy=Math.floor((b.y-hw)/4);cy<=Math.floor((b.y+hw-0.01)/4);cy++){brk(cx,cy);if(b.power>=3)brk(cx+(b.vx<0?-1:1),cy);}}}
 else{const cx=Math.floor(b.x/4),cy=Math.floor(b.y/4);for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)brk(cx+i,cy+j);}
 if(b.owner==='p'){if(any)SFX.hit();else if(ping)SFX.steel();}addParts(b.x,b.y,4,['#fff','#ffe14d'],0.8,12,0);}
function updBullet(b){const sp=Math.hypot(b.vx,b.vy);const n=Math.ceil(sp);for(let s=0;s<n&&b.alive;s++){b.x+=b.vx/n;b.y+=b.vy/n;
  if(b.x<1||b.y<1||b.x>FS-1||b.y>FS-1){b.alive=false;if(b.owner==='p')SFX.steel();addParts(b.x,b.y,4,['#fff','#ffe14d'],0.8,12,0);break;}
  let hitBase=false,hitWall=false;for(const [ox,oy] of [[-2,-2],[1.9,-2],[-2,1.9],[1.9,1.9]]){const t=cellAt(b.x+ox,b.y+oy);if(t===6)hitBase=true;else if(solidB(t))hitWall=true;}
  if(hitBase){b.alive=false;if(b.owner==='e')destroyBase();break;}if(hitWall){b.alive=false;wallHit(b);break;}
  const bb={x:b.x-2,y:b.y-2,w:4,h:4};
  if(b.owner==='p'){for(const e of enemies){if(e.dead||e.spawn)continue;if(ov(bb,e)){b.alive=false;if(e.bonus){e.bonus=false;spawnPower();}e.hp--;if(e.hp<=0)killEnemy(e);else{e.flash=8;SFX.steel();addParts(b.x,b.y,6,['#ffe66b','#fff'],1,15);}break;}}
   if(b.alive&&boss&&boss.hp>0&&ov(bb,boss)){b.alive=false;if(bossDie)break;boss.hp-=b.power>=2?2:1;boss.flash=6;SFX.hit();addParts(b.x,b.y,6,['#7ed957','#fff','#ffe14d'],1.2,18);if(boss.phase===1&&boss.hp<=boss.max/2){boss.phase=2;floatT(boss.x+16,boss.y+40,'ТЫ МЕНЯ РАЗОЗЛИЛА!','#ff4d6d');}if(boss.hp<=0){boss.hp=0;bossDie=1;}}
   if(b.alive)for(const o of bullets){if(o.owner==='e'&&o.alive&&Math.abs(o.x-b.x)<4&&Math.abs(o.y-b.y)<4){o.alive=false;b.alive=false;addParts(b.x,b.y,8,SPRINK,1,15);break;}}}
  else for(const t of livingTanks())if(ov(bb,t)){b.alive=false;hitPlayer(t.pid);break;}}
 if(!b.alive&&b.from)b.from.bul=Math.max(0,b.from.bul-1);}
function updEnemy(e){if(e.spawn>0){e.spawn--;return;}if(e.flash)e.flash--;if(freeze>0)return;
 const aligned=Math.abs(e.x/8-Math.round(e.x/8))<0.07&&Math.abs(e.y/8-Math.round(e.y/8))<0.07;e.turnT--;
 const moved=moveTank(e,e.dir,ET[e.kind].sp*(boss&&boss.phase===2?1.2:1));
 if(!moved||(e.turnT<=0&&aligned)){const r=Math.random(),target=nearestTarget(e.x,e.y);let d;
  if(r<0.35)d=2;else if(r<0.55&&target){const dx=target.x-e.x,dy=target.y-e.y;d=Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0);}else if(r<0.72){const dx=96-e.x;d=Math.abs(dx)>16?(dx>0?1:3):2;}else d=Math.floor(Math.random()*4);
  if(!moved&&Math.random()<0.5&&e.bul===0)fire(e,'e');e.dir=d===e.dir&&!moved?(d+1+Math.floor(Math.random()*3))%4:d;e.turnT=50+Math.random()*120;}
 if(e.bul===0&&Math.random()<ET[e.kind].fire*(1+lvl*0.15)){fire(e,'e');}}
function updBoss(){if(!boss)return;if(boss.flash)boss.flash--;
 if(bossDie){bossDie++;if(bossDie%6===0){boomAt(boss.x+Math.random()*32,boss.y+Math.random()*32,bossDie%18===0);SFX.boom();}
  if(bossDie===150){for(const e of enemies)if(!e.spawn&&!e.dead)killEnemy(e);pastries.push({x:boss.x+8,y:boss.y+8,vy:-1,k:'choco',l:9999,big:true});score+=5000;floatT(boss.x+16,boss.y,'+5000','#ffe14d');boss=null;levelEnd=1;stopMusic();}return;}
 if(freeze>0){return;}const sp=boss.phase===2?0.8:0.45;boss.x+=boss.vx>0?sp:-sp;if(boss.x<0){boss.x=0;boss.vx=1;}if(boss.x>176){boss.x=176;boss.vx=-1;}if(Math.random()<0.004)boss.vx*=-1;boss.y=2+Math.sin(frame*0.03)*2;
 if(--boss.fireT<=0){const n=boss.phase===2?5:3;for(let i=0;i<n;i++){const a=(i-(n-1)/2)*0.35;bullets.push({x:boss.x+16+(i-(n-1)/2)*5,y:boss.y+32,vx:Math.sin(a)*1.8,vy:Math.cos(a)*1.8,owner:'e',kind:'bigpea',power:0,alive:true});}
  const target=nearestTarget(boss.x,boss.y);if(target&&Math.random()<0.5){const dx=target.x+8-(boss.x+16),dy=target.y+8-(boss.y+32),d=Math.max(1,Math.hypot(dx,dy));bullets.push({x:boss.x+16,y:boss.y+32,vx:dx/d*2.4,vy:dy/d*2.4,owner:'e',kind:'pea',power:0,alive:true});}
  SFX.pea();boss.fireT=boss.phase===2?55:85;}
 if(--boss.minionT<=0){const alive=enemies.filter(e=>!e.dead).length;if(alive<(boss.phase===2?3:2)){const ks=['cabbage','carrot','onion','pumpkin'];queue.push(ks[Math.floor(Math.random()*4)]);}boss.minionT=260;}}
function spawnEnemy(){const pts=boss?[[0,0],[192,0]]:[[96,0],[192,0],[0,0]];for(let k=0;k<pts.length;k++){const [x,y]=pts[(spawnIdx+k)%pts.length];const box={x,y,w:16,h:16};
  if(enemies.some(e=>ov(e,box))||livingTanks().some(t=>ov(t,box)))continue;spawnIdx++;const kind=queue.shift();spawnedCount++;
  enemies.push({kind,x,y,w:16,h:16,dir:2,anim:0,hp:ET[kind].hp,bul:0,turnT:60,spawn:60,flash:0,bonus:!boss&&[4,11,17].includes(spawnedCount)});return true;}return false;}
function updPlay(){frame++;
 for(const c of crew){if(!c.active)continue;const t=c.tank;
  if(t){const d=curDir(c.id);if(t.shield>0)t.shield--;if(t.fireT>0)t.fireT--;
   const syrup=cellAt(t.x+8,t.y+8)===5;
   if(d>=0){moveTank(t,d,1.05);t.slide=syrup?14:0;}else if(t.slide>0){t.slide--;moveTank(t,t.dir,.9);}
   if(fireHeld(c.id)&&t.fireT===0&&t.bul<(c.stars>=2?2:1)){fire(t,'p');t.fireT=12;}
   for(const p of powerups)if(!p.taken&&ov(t,{x:p.x,y:p.y,w:16,h:16})){p.taken=true;applyPower(p,c.id);}
  }else if(c.respawnT>0&&--c.respawnT===0)spawnPlayer(c.id);
 }
 if(pressed.KeyR)shareLife();
 if(queue.length&&--spawnT<=0){const alive=enemies.filter(e=>!e.dead).length;if(alive<(boss?3:4)){if(spawnEnemy())spawnT=boss?90:Math.max(70,150-lvl*15);}else spawnT=20;}
 for(const e of enemies)if(!e.dead)updEnemy(e);enemies=enemies.filter(e=>!e.dead);updBoss();
 for(const b of bullets)if(b.alive)updBullet(b);bullets=bullets.filter(b=>b.alive);
 if(freeze>0)freeze--;if(panT>0){panT--;if(panT===0)setBaseWalls(1);else if(panT<180)setBaseWalls(Math.floor(panT/15)%2?2:1);}
 powerups=powerups.filter(p=>!p.taken&&--p.l>0);
 for(const p of parts){if(p.ring){p.r+=1.6;p.l--;continue;}p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;p.vx*=0.97;p.l--;}parts=parts.filter(p=>p.l>0);
 for(const f of floats){f.y-=0.35;f.l--;}floats=floats.filter(f=>f.l>0);
 for(const p of pastries){p.y+=p.vy;p.vy=Math.min(p.vy+0.08,0);p.l--;}pastries=pastries.filter(p=>p.l>0);if(shake>0)shake--;
 if(!boss&&!LEVELS[lvl].boss&&queue.length===0&&enemies.length===0&&!levelEnd&&!overT)levelEnd=1;
 if(levelEnd&&++levelEnd>150){if(score>hiscore){hiscore=score;try{localStorage.setItem(scoreKey(),hiscore);}catch(e){}}
  if(LEVELS[lvl].boss){runDialog(ENDING,()=>{setState('credits');playMusic(M_END,B_END,0.2,true);},'party');playMusic(M_END,B_END,0.2,true);}else{setState('tally');playMusic(M_WIN,B_WIN,0.12,false);}}
 if(overT&&++overT>150){stopMusic();setState('gameover');playMusic(M_OVER,B_OVER,0.25,false);}
 if(pressed.Enter||pressed.KeyP){setState('pause');}}

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
