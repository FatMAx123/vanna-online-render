'use strict';
// ====== БАТЛ ГРЭННИ: БАБУЛЯ ПРОТИВ БРОККОЛИ ======
const W=320,H=240,FX=16,FY=16,FS=208;
const cv=document.getElementById('c'),ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;
function resize(){
 const stage=document.getElementById('stage'),tv=document.getElementById('tv'),picture=document.querySelector('.tube-bezel'),glass=document.getElementById('glass'),hardware=document.querySelector('.hardware');
 const shell=getComputedStyle(tv),bezel=getComputedStyle(picture),row=getComputedStyle(document.querySelector('.tv-body'));
 const edgeX=parseFloat(shell.paddingLeft)+parseFloat(shell.paddingRight)+parseFloat(shell.borderLeftWidth)+parseFloat(shell.borderRightWidth)+parseFloat(bezel.paddingLeft)+parseFloat(bezel.paddingRight)+parseFloat(bezel.borderLeftWidth)+parseFloat(bezel.borderRightWidth);
 const edgeY=parseFloat(shell.paddingTop)+parseFloat(shell.paddingBottom)+parseFloat(shell.borderTopWidth)+parseFloat(shell.borderBottomWidth)+parseFloat(bezel.paddingTop)+parseFloat(bezel.paddingBottom)+parseFloat(bezel.borderTopWidth)+parseFloat(bezel.borderBottomWidth)+document.querySelector('.tv-foot').offsetHeight;
 const hw=getComputedStyle(hardware).display==='none'?0:hardware.offsetWidth+parseFloat(row.columnGap);
 // Fractional fitting replaces the old integer floor that wasted screen space.
 const k=Math.max(0.15,Math.min((stage.clientWidth-edgeX-hw-4)/W,(stage.clientHeight-edgeY-4)/H));
 glass.style.width=(W*k)+'px';glass.style.height=(H*k)+'px';cv.style.width='100%';cv.style.height='100%';
 window.resizeCRT?.();
}
addEventListener('resize',resize);resize();
function mk(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.imageSmoothingEnabled=false;return [c,x];}
function hex(c){c=c.replace('#','');return [parseInt(c.substr(0,2),16),parseInt(c.substr(2,2),16),parseInt(c.substr(4,2),16)];}
function painter(w,h){const [c,x]=mk(w,h);return {c,x,w,h,
 p(a,b,col){x.fillStyle=col;x.fillRect(Math.floor(a),Math.floor(b),1,1);},
 r(a,b,ww,hh,col){x.fillStyle=col;x.fillRect(Math.floor(a),Math.floor(b),Math.round(ww),Math.round(hh));},
 e(cx,cy,rx,ry,col){x.fillStyle=col;for(let yy=Math.floor(cy-ry-1);yy<=Math.ceil(cy+ry);yy++)for(let xx=Math.floor(cx-rx-1);xx<=Math.ceil(cx+rx);xx++){const dx=(xx+0.5-cx)/rx,dy=(yy+0.5-cy)/ry;if(dx*dx+dy*dy<=1)x.fillRect(xx,yy,1,1);}},
 ce(cx,cy,rx,ry){for(let yy=Math.floor(cy-ry-1);yy<=Math.ceil(cy+ry);yy++)for(let xx=Math.floor(cx-rx-1);xx<=Math.ceil(cx+rx);xx++){const dx=(xx+0.5-cx)/rx,dy=(yy+0.5-cy)/ry;if(dx*dx+dy*dy<=1)x.clearRect(xx,yy,1,1);}},
 tri(x1,y1,x2,y2,x3,y3,col){const minx=Math.floor(Math.min(x1,x2,x3)),maxx=Math.ceil(Math.max(x1,x2,x3)),miny=Math.floor(Math.min(y1,y2,y3)),maxy=Math.ceil(Math.max(y1,y2,y3));x.fillStyle=col;
  const s=(ax,ay,bx,by,px,py)=>(bx-ax)*(py-ay)-(by-ay)*(px-ax);for(let yy=miny;yy<=maxy;yy++)for(let xx=minx;xx<=maxx;xx++){const px=xx+0.5,py=yy+0.5;const a=s(x1,y1,x2,y2,px,py),b=s(x2,y2,x3,y3,px,py),c2=s(x3,y3,x1,y1,px,py);if((a>=0&&b>=0&&c2>=0)||(a<=0&&b<=0&&c2<=0))x.fillRect(xx,yy,1,1);}},
 outline(col){const id=x.getImageData(0,0,w,h),d=id.data,src=new Uint8ClampedArray(d);const [R,G,B]=hex(col);
  for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){const i=(yy*w+xx)*4;if(src[i+3])continue;let n=false;
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const X=xx+dx,Y=yy+dy;if(X>=0&&Y>=0&&X<w&&Y<h&&src[(Y*w+X)*4+3]>0){n=true;break;}}
   if(n){d[i]=R;d[i+1]=G;d[i+2]=B;d[i+3]=255;}}x.putImageData(id,0,0);return this;}
};}
function rot(src,dir){const [c,x]=mk(src.width,src.height);x.translate(src.width/2,src.height/2);x.rotate(dir*Math.PI/2);x.drawImage(src,-src.width/2,-src.height/2);return c;}
function dirs4(src){return [0,1,2,3].map(d=>rot(src,d));}
let seedV=1;function srand(s){seedV=s;}function rnd(){seedV=(seedV*16807)%2147483647;return seedV/2147483647;}
const OUT='#1a1030';

// ====== ШРИФТ 5x7 ======
const GLYPHS=`
А .###. #...# #...# ##### #...# #...# #...#
Б ##### #.... #.... ####. #...# #...# ####.
В ####. #...# #...# ####. #...# #...# ####.
Г ##### #.... #.... #.... #.... #.... #....
Д ..##. .#.#. .#.#. .#.#. #...# ##### #...#
Е ##### #.... #.... ####. #.... #.... #####
Ё .#.#. ##### #.... ####. #.... #.... #####
Ж #.#.# #.#.# .###. ..#.. .###. #.#.# #.#.#
З .###. #...# ....# ..##. ....# #...# .###.
И #...# #...# #..## #.#.# ##..# #...# #...#
Й .###. #...# #..## #.#.# ##..# #...# #...#
К #...# #..#. #.#.. ##... #.#.. #..#. #...#
Л ..### .#..# .#..# .#..# .#..# .#..# #...#
М #...# ##.## #.#.# #.#.# #...# #...# #...#
Н #...# #...# #...# ##### #...# #...# #...#
О .###. #...# #...# #...# #...# #...# .###.
П ##### #...# #...# #...# #...# #...# #...#
Р ####. #...# #...# ####. #.... #.... #....
С .###. #...# #.... #.... #.... #...# .###.
Т ##### ..#.. ..#.. ..#.. ..#.. ..#.. ..#..
У #...# #...# #...# .#### ....# #...# .###.
Ф ..#.. .###. #.#.# #.#.# #.#.# .###. ..#..
Х #...# #...# .#.#. ..#.. .#.#. #...# #...#
Ц #..#. #..#. #..#. #..#. #..#. ##### ....#
Ч #...# #...# #...# .#### ....# ....# ....#
Ш #.#.# #.#.# #.#.# #.#.# #.#.# #.#.# #####
Щ #.#.# #.#.# #.#.# #.#.# #.#.# ##### ....#
Ъ ##... .#... .#... .###. .#..# .#..# .###.
Ы #...# #...# #...# ##..# #.#.# #.#.# ##..#
Ь #.... #.... #.... ####. #...# #...# ####.
Э .###. #...# ....# .#### ....# #...# .###.
Ю #..#. #.#.# #.#.# ###.# #.#.# #.#.# #..#.
Я .#### #...# #...# .#### ..#.# .#..# #...#
0 .###. #...# #..## #.#.# ##..# #...# .###.
1 ..#.. .##.. ..#.. ..#.. ..#.. ..#.. .###.
2 .###. #...# ....# ...#. ..#.. .#... #####
3 ##### ...#. ..#.. ...#. ....# #...# .###.
4 ...#. ..##. .#.#. #..#. ##### ...#. ...#.
5 ##### #.... ####. ....# ....# #...# .###.
6 ..##. .#... #.... ####. #...# #...# .###.
7 ##### ....# ...#. ..#.. .#... .#... .#...
8 .###. #...# #...# .###. #...# #...# .###.
9 .###. #...# #...# .#### ....# ...#. .##..
. ..... ..... ..... ..... ..... .##.. .##..
, ..... ..... ..... ..... .##.. ..#.. .#...
! ..#.. ..#.. ..#.. ..#.. ..#.. ..... ..#..
? .###. #...# ....# ...#. ..#.. ..... ..#..
: ..... .##.. .##.. ..... .##.. .##.. .....
- ..... ..... ..... .###. ..... ..... .....
" .#.#. .#.#. ..... ..... ..... ..... .....
' ..#.. ..#.. ..... ..... ..... ..... .....
( ...#. ..#.. .#... .#... .#... ..#.. ...#.
) .#... ..#.. ...#. ...#. ...#. ..#.. .#...
/ ....# ...#. ...#. ..#.. .#... .#... #....
+ ..... ..#.. ..#.. ##### ..#.. ..#.. .....
* ..... #...# .#.#. ..#.. .#.#. #...# .....
> .#... ..#.. ...#. ....# ...#. ..#.. .#...
< ...#. ..#.. .#... #.... .#... ..#.. ...#.
W #...# #...# #...# #.#.# #.#.# ##.## #...#
S .#### #.... #.... .###. ....# ....# ####.
D ####. #...# #...# #...# #...# #...# ####.
N #...# ##..# #.#.# #..## #...# #...# #...#
R ####. #...# #...# ####. #.#.. #..#. #...#
I .###. ..#.. ..#.. ..#.. ..#.. ..#.. .###.
L #.... #.... #.... #.... #.... #.... #####
G .###. #...# #.... #.### #...# #...# .###.
F ##### #.... #.... ####. #.... #.... #....
U #...# #...# #...# #...# #...# #...# .###.
V #...# #...# #...# #...# #...# .#.#. ..#..
Z ##### ....# ...#. ..#.. .#... #.... #####
Q .###. #...# #...# #...# #.#.# #..#. .##.#
J ..### ...#. ...#. ...#. ...#. #..#. .##..
♥ ..... .#.#. ##### ##### .###. ..#.. .....
▼ ..... ..... ##### .###. ..#.. ..... .....
`;
const FONT={};GLYPHS.trim().split('\n').forEach(l=>{const parts=l.split(' ');FONT[parts[0]]=parts.slice(1);});
const ALIAS={A:'А',B:'В',C:'С',E:'Е',H:'Н',K:'К',M:'М',O:'О',P:'Р',T:'Т',X:'Х',Y:'У','«':'"','»':'"','—':'-','–':'-','×':'*'};
function glyph(ch){ch=ch.toUpperCase();if(FONT[ch])return FONT[ch];if(ALIAS[ch])return FONT[ALIAS[ch]];return null;}
function textW(s,sc=1){return s.length*6*sc-sc;}
function txt(s,x,y,col='#fff',sc=1,sh=OUT,align='left',c=ctx){s=String(s);if(align==='center')x=Math.round(x-textW(s,sc)/2);else if(align==='right')x=Math.round(x-textW(s,sc));
 const pass=(ox,oy,cl)=>{for(let i=0;i<s.length;i++){const g=glyph(s[i]);if(!g)continue;for(let r=0;r<7;r++){c.fillStyle=Array.isArray(cl)?cl[r]:cl;const row=g[r];for(let k=0;k<5;k++)if(row[k]==='#')c.fillRect(x+ox+(i*6+k)*sc,y+oy+r*sc,sc,sc);}}};
 if(sh){pass(sc,sc,sh);if(sc>1){pass(-1,0,sh);pass(0,-1,sh);pass(sc,0,sh);pass(0,sc,sh);}}pass(0,0,col);}
function wrap(s,n){const words=s.split(' ');const lines=[];let cur='';for(const w of words){if((cur+' '+w).trim().length>n){lines.push(cur.trim());cur=w;}else cur+=' '+w;}if(cur.trim())lines.push(cur.trim());return lines;}

// Audio engine and original soundtrack are loaded from audio.js.
// ====== СПРАЙТЫ ======
const SPR={};
function tracks(P,frame,y0,len,col,lite,dark){for(const sx of [1,12]){P.r(sx,y0,3,len,col);P.r(sx,y0,1,len,lite);for(let y=y0+frame;y<y0+len;y+=2)P.r(sx,y,3,1,dark);}}
function mkTub(frame,stars){const P=painter(16,16);
 tracks(P,frame,2,13,'#6a5a90','#9a88c8','#3a2e58');
 for(const [fx,fy] of [[3,3],[12,3],[3,13],[12,13]])P.p(fx,fy,'#ffd36b');
 P.e(8,9,4.9,6.1,'#b8bcd8');P.e(7.7,8.7,4.5,5.7,'#ffffff');
 P.e(8,9.4,3.3,4.4,'#2a9ee0');P.e(7.7,9.1,2.8,3.8,'#5fd0ff');
 for(const [bx,by] of [[5,6],[10,7],[6,13],[10,12],[5,10],[11,10]])P.p(bx,by,'#ffffff');
 P.e(8,9.6,2.5,2.5,'#ff6fbf');P.p(7,8,'#ffffff');P.p(9,10,'#ffffff');P.p(7,11,'#ffd1ea');P.p(9,8,'#ffd1ea');
 P.r(7,7,2,1,'#f2c49b');
 P.r(4,12,2,2,'#ffe14d');P.p(4,11,'#ffe14d');P.p(3,11,'#ff8c1a');
 const cl=[['#ff3b5c','#ffffff'],['#ff3b5c','#ffe14d'],['#3bd16f','#ffffff'],['#ffd700','#ff3bd1']][stars];
 for(let y=1;y<6;y++)P.r(7,y,2,1,cl[y%2]);P.r(6,0,4,2,cl[0]);P.p(6,0,cl[1]);
 return P.outline(OUT).c;}
function mkCabbage(frame){const P=painter(16,16);tracks(P,frame,3,12,'#2e5a2e','#4f8a4f','#173017');
 P.e(8,9.5,5.7,5.5,'#2f8a3a');P.e(7.6,9,5.1,4.9,'#7ed957');P.e(7,8.3,3,2.8,'#a6ec7a');
 P.p(4,11,'#2f8a3a');P.p(5,12,'#2f8a3a');P.p(11,11,'#2f8a3a');P.p(10,12,'#2f8a3a');P.p(8,13,'#2f8a3a');
 P.r(5,7,2,2,'#fff');P.r(9,7,2,2,'#fff');P.p(6,8,OUT);P.p(9,8,OUT);P.p(4,6,OUT);P.p(5,6,OUT);P.p(6,7,OUT);P.p(11,6,OUT);P.p(10,6,OUT);P.p(9,7,OUT);
 P.r(7,11,2,1,'#1e5a1e');P.r(7,0,2,5,'#e8f0c0');P.r(7,0,2,1,'#a8b880');return P.outline(OUT).c;}
function mkCarrot(frame){const P=painter(16,16);
 for(const [wx,wy] of [[2,4],[12,4],[2,10],[12,10]]){P.r(wx,wy,2,4,'#3a2a3a');P.p(wx,wy+1+frame,'#8a7a9a');P.p(wx+1,wy+2+frame,'#8a7a9a');}
 for(let y=0;y<=12;y++){const hw=0.5+y*0.34;for(let x=0;x<16;x++){const d=x+0.5-8;if(Math.abs(d)<=hw){P.p(x,y,d<-hw+1.2?'#ffc070':d>hw-1.2?'#d9600e':'#ff8c1a');}}}
 for(const y of [3,6,9,11])P.r(7,y,2,1,'#d9600e');P.p(6,6,'#d9600e');
 P.r(5,7,6,1,OUT);P.p(6,7,'#8fd3ff');P.p(9,7,'#8fd3ff');P.p(6,8,'#fff');P.p(9,8,'#fff');
 P.r(7,13,2,3,'#2f9a4f');P.p(6,13,'#3bd16f');P.p(5,14,'#3bd16f');P.p(9,13,'#3bd16f');P.p(10,14,'#3bd16f');P.p(4,15,'#3bd16f');P.p(11,15,'#3bd16f');
 return P.outline(OUT).c;}
function mkOnion(frame){const P=painter(16,16);tracks(P,frame,4,11,'#4a2060','#7a4a9a','#2a1038');
 P.e(8,10,5.5,5,'#7a2a9a');P.e(7.6,9.6,4.9,4.5,'#c06ae0');P.e(6.3,8.4,1.4,2,'#eab8ff');
 for(let y=6;y<14;y++)P.p(8,y,'#9a4abc');P.p(10,7,'#9a4abc');P.p(11,9,'#9a4abc');P.p(10,12,'#9a4abc');
 P.tri(6,6,10,6,8,2,'#c06ae0');P.r(7,0,2,3,'#7ed957');P.p(6,0,'#7ed957');
 P.p(6,9,OUT);P.p(9,9,OUT);P.p(6,8,OUT);P.p(9,8,OUT);P.p(5,7,OUT);P.p(10,7,OUT);
 P.p(5,10,'#4fc3f7');P.p(5,11,'#4fc3f7');P.p(10,10,'#4fc3f7');P.p(10,11,'#8fd3ff');P.r(7,12,2,1,'#5a1a6a');
 P.p(7,15,'#f0e0c0');P.p(9,15,'#f0e0c0');P.p(8,14,'#f0e0c0');return P.outline(OUT).c;}
function mkPumpkin(frame){const P=painter(16,16);tracks(P,frame,3,12,'#4a3020','#7a5a3a','#2a1a10');
 P.e(8,9.5,6.5,5.6,'#b8500a');P.e(8,9.2,6,5.1,'#ff9a1f');P.r(5,5,1,9,'#d9700e');P.r(10,5,1,9,'#d9700e');P.r(3,8,1,3,'#ffc070');P.p(7,5,'#ffc070');
 for(const [x,y] of [[5,8],[4,9],[5,9],[6,9],[10,8],[9,9],[10,9],[11,9]])P.p(x,y,'#ffe66b');
 P.r(5,12,6,1,'#ffe66b');P.p(5,11,'#ffe66b');P.p(8,11,'#ffe66b');P.p(10,11,'#ffe66b');P.p(7,12,'#7a3a0a');P.p(9,12,'#7a3a0a');
 P.r(7,0,2,5,'#6b8a2a');P.p(9,2,'#3bd16f');P.p(10,1,'#3bd16f');return P.outline(OUT).c;}
function mkBoss(frame){const P=painter(32,32);
 for(const sx of [1,27]){P.r(sx,10,4,20,'#2a4a1a');P.r(sx,10,1,20,'#4a7a3a');for(let y=10+frame*2;y<30;y+=4)P.r(sx,y,4,2,'#142a0a');}
 P.e(16,20,9,9,'#7ab44a');P.e(15.5,19.5,8.4,8.4,'#c4e89a');P.e(13,17,4,3,'#dcf5b8');
 for(const [x,y,r] of [[8,9,5],[16,7,6],[24,9,5],[11,4,4],[21,4,4],[4.5,14,3.5],[27.5,14,3.5],[16,12,3]]){P.e(x,y,r,r,'#1e6a2e');P.e(x-0.7,y-0.7,r-1,r-1,'#3aa040');P.p(x-1.5,y-2,'#8fe07a');P.p(x+1,y-1,'#5ac85a');}
 P.r(12,0,8,4,'#1a1a2a');P.r(12,3,8,1,'#c43aff');P.r(10,4,12,1,'#1a1a2a');P.p(13,1,'#4a4a6a');
 P.r(10,15,4,3,'#fff');P.r(11,16,2,2,'#ff2a2a');P.p(11,16,OUT);
 P.e(20.5,16.5,2.8,2.8,'#ffd36b');P.e(20.5,16.5,2,2,'#bfe9ff');P.r(20,16,2,2,'#ff2a2a');P.p(20,16,OUT);for(let y=19;y<24;y++)P.p(23,y,'#ffd36b');
 P.p(9,13,OUT);P.p(10,13,OUT);P.p(11,14,OUT);P.p(12,14,OUT);P.p(13,15,OUT);P.p(22,13,OUT);P.p(21,13,OUT);P.p(20,14,OUT);
 P.r(11,21,10,2,OUT);P.p(10,20,OUT);P.p(9,19,OUT);P.p(21,20,OUT);P.p(22,19,OUT);P.p(16,20,OUT);P.p(15,20,OUT);
 P.r(12,24,8,2,'#fff');P.p(14,24,'#c0c0c0');P.p(17,24,'#c0c0c0');P.p(12,25,'#c0c0c0');
 P.r(6,22,3,2,'#ffd36b');P.r(23,22,3,2,'#ffd36b');P.p(6,24,'#ffd36b');P.p(8,24,'#ffd36b');P.p(23,24,'#ffd36b');P.p(25,24,'#ffd36b');
 for(const px of [8,15,22]){P.r(px,27,3,5,'#3bd16f');P.r(px,31,3,1,'#1e6a2e');P.p(px,27,'#8fe07a');}
 return P.outline(OUT).c;}
function mkCake(dead){const P=painter(16,16);
 if(!dead){P.r(0,14,16,2,'#e0e0f0');P.r(1,14,14,1,'#ffffff');
  P.r(1,9,14,5,'#ff5fa8');P.r(1,9,14,2,'#ffffff');P.p(3,11,'#ffffff');P.p(7,11,'#ffffff');P.p(12,11,'#ffffff');P.p(5,12,'#ffd36b');P.p(10,12,'#4fc3f7');P.p(13,13,'#3bd16f');P.p(2,13,'#ff3b5c');
  P.r(4,5,8,4,'#ffb3dc');P.r(4,5,8,1,'#ffffff');P.p(5,6,'#ffffff');P.p(9,6,'#ffffff');P.p(7,7,'#ff3b5c');
  for(const cx of [5,8,11]){P.r(cx-1+ (cx===8?0:0),2,1,3,'#8fd3ff');P.p(cx-1,3,'#ffffff');}
 }else{P.e(8,12,7,3.5,'#ff5fa8');P.e(8,11.5,5,2,'#ffb3dc');P.p(3,11,'#fff');P.p(12,13,'#fff');P.p(6,10,'#fff');P.r(4,8,1,3,'#8fd3ff');P.r(11,9,3,1,'#8fd3ff');
  P.p(6,12,OUT);P.p(9,12,OUT);P.r(7,13,2,1,OUT);}
 return P.outline(OUT).c;}
function mkPastry(kind){const P=painter(16,16);
 if(kind==='pie'){P.e(8,10,6.5,4,'#a8601e');P.e(8,9.5,6,3.4,'#e8a94c');P.e(6,8.5,3,1.4,'#f7d08a');for(let x=3;x<13;x+=2)P.p(x,7+(x%4===1?0:1),'#c97a2e');
  P.p(6,10,OUT);P.p(10,10,OUT);P.p(5,9,OUT);P.p(7,9,OUT);P.p(9,9,OUT);P.p(11,9,OUT);P.r(7,11,2,1,'#7a3a0a');P.p(4,11,'#ff8fa8');P.p(12,11,'#ff8fa8');}
 else if(kind==='ring'){P.e(8,9,6.5,5,'#c47a2e');P.e(7.6,8.6,6,4.5,'#e8b05c');P.ce(8,9,2.4,1.8);for(const [x,y] of [[3,7],[6,5],[11,6],[12,10],[5,12],[9,13]])P.p(x,y,'#7a3a0a');for(const [x,y,c] of [[4,9,'#ff3b5c'],[10,5,'#4fc3f7'],[12,8,'#ffe14d'],[7,12,'#3bd16f']])P.p(x,y,c);}
 else if(kind==='tart'){P.e(8,10,6.5,4,'#a8601e');P.e(8,9.5,5.6,3,'#ff9a1f');P.e(6.5,8.6,2.5,1.2,'#ffc070');P.e(8,7,2.4,1.8,'#ffffff');P.p(8,5,'#ffffff');P.p(7,6,'#e0e0f0');}
 else if(kind==='choco'){for(const [x,y,r] of [[5,6,3.5],[11,6,3.5],[8,4,3.5],[8,8,3]]){P.e(x,y,r,r,'#4a2410');P.e(x-0.5,y-0.5,r-1,r-1,'#7a4220');P.p(x-1,y-1.5,'#c08050');}P.r(6,9,4,6,'#7a4220');P.r(6,9,1,6,'#a86030');for(const [x,y,c] of [[4,4,'#ff3b5c'],[10,5,'#4fc3f7'],[8,2,'#ffe14d'],[12,7,'#fff']])P.p(x,y,c);}
 else{const fr=kind==='cupcake'?'#ffb070':'#ff8fd0';P.tri(3,9,13,9,11,15,'#4fc3f7');P.tri(3,9,5,15,11,15,'#4fc3f7');for(let x=4;x<12;x+=2)P.r(x,10,1,5,'#2a9ee0');
  P.e(8,8,5.5,2.6,fr);P.e(8,5.5,3.4,2,fr);P.e(8,3.5,1.6,1.2,fr);P.p(6,7,'#ffffff');P.p(7,5,'#ffffff');
  if(kind==='cupcake'){P.r(9,0,1,3,'#ff8c1a');P.p(10,0,'#3bd16f');}else P.e(8,1.5,1.4,1.4,'#ff2a4a');
  P.p(6,9,OUT);P.p(10,9,OUT);}
 return P.outline(OUT).c;}
function mkPower(kind){const P=painter(16,16);
 if(kind==='star'){P.r(1,5,1,6,'#ffd36b');P.r(2,6,1,4,'#ffd36b');P.r(3,7,1,2,'#ffb000');P.r(14,5,1,6,'#ffd36b');P.r(13,6,1,4,'#ffd36b');P.r(12,7,1,2,'#ffb000');
  P.e(8,8,4.3,3.8,'#ff3b5c');P.p(6,6,'#fff');P.p(7,7,'#fff');P.p(8,8,'#fff');P.p(9,9,'#fff');P.p(10,8,'#ffd1ea');P.p(6,9,'#ffd1ea');P.p(8,1,'#fff');P.r(7,2,3,1,'#fff');P.p(8,3,'#fff');}
 if(kind==='bomb'){P.r(2,8,12,6,'#ff5fa8');P.r(2,8,12,2,'#fff');P.p(4,10,'#fff');P.p(9,10,'#fff');P.p(12,10,'#fff');P.r(2,14,12,1,'#d0d0e0');P.r(7,3,2,5,'#ff2a2a');P.r(7,5,2,1,'#ffd36b');P.p(9,2,'#8a7a6a');P.p(10,1,'#ffe14d');P.p(11,0,'#fff');P.p(11,2,'#ff8c1a');}
 if(kind==='shield'){P.r(2,5,12,6,'#ff6fbf');P.r(2,5,12,1,'#ffb3dc');for(let x=3;x<14;x+=3)P.p(x,8,'#b03a80');P.r(1,4,1,8,'#ffd1ea');P.r(14,4,1,8,'#ffd1ea');P.r(3,11,10,1,'#d0d0e0');P.r(5,3,6,1,'#d0d0e0');P.p(4,12,'#d0d0e0');}
 if(kind==='clock'){P.e(4,3.5,2.4,2.4,'#ffd36b');P.e(12,3.5,2.4,2.4,'#ffd36b');P.e(8,9,5.6,5.6,'#ff3b5c');P.e(8,9,4.2,4.2,'#fff');P.r(8,6,1,3,OUT);P.r(8,9,3,1,OUT);P.p(4,14,OUT);P.p(12,14,OUT);P.p(8,5,'#ff3b5c');}
 if(kind==='pan'){P.r(10,10,5,2,'#8a5a32');P.p(14,10,'#c98a4b');P.e(7,7,5.8,5.8,'#2a2a3a');P.e(7,7,4.6,4.6,'#4a4a60');P.e(7,7,2.8,2.4,'#fff');P.e(7.5,7.5,1.2,1.2,'#ffd700');P.p(4,4,'#9a9ab5');}
 if(kind==='life'){P.e(8,6.5,6,3,'#ff6f8f');P.r(2,6,12,3,'#fff');for(let x=4;x<13;x+=2)P.p(x,7,'#d0d0e0');P.e(8,11.5,6,2.6,'#ff6f8f');P.r(3,9,10,2,'#fff');for(let x=5;x<12;x+=2)P.p(x,10,'#d0d0e0');P.p(6,8,'#ffd700');P.p(6,7,'#ffd700');}
 return P.outline(OUT).c;}
function mkCandy(i){const cols=['#ff3b5c','#ffe14d','#3bd16f','#4fc3f7','#ff6fbf'];const P=painter(8,8);P.e(4,4,2.2,1.7,cols[i]);P.p(3,3,'#fff');P.p(1,3,'#fff');P.p(1,5,'#fff');P.p(2,4,'#fff');P.p(6,3,'#fff');P.p(6,5,'#fff');P.p(5,4,cols[i]);return P.outline(OUT).c;}
function mkPea(col,lite,r){const s=Math.ceil(r*2)+2;const P=painter(s,s);P.e(s/2,s/2,r,r,col);P.p(s/2-1,s/2-1,lite);return P.outline('#0f2a0f').c;}
function mkMini(){const P=painter(8,8);P.e(4,4,3,3,'#7ed957');P.p(3,3,'#fff');P.p(5,3,'#fff');P.p(4,1,'#e8f0c0');return P.outline(OUT).c;}
function mkMiniTub(){const P=painter(9,8);P.e(4.5,4.5,3.8,2.8,'#fff');P.e(4.5,4,2.6,1.6,'#5fd0ff');P.e(4.5,3,1.3,1.3,'#ff6fbf');P.p(1,7,'#ffd36b');P.p(7,7,'#ffd36b');return P.outline(OUT).c;}
function mkFlag(){const P=painter(12,12);P.r(2,1,1,10,'#c0c0d0');P.r(3,1,7,5,'#ff3b5c');P.r(3,1,7,1,'#ffd1ea');P.p(5,3,'#fff');P.p(7,3,'#fff');P.r(1,11,3,1,'#c0c0d0');return P.outline(OUT).c;}
function buildSprites(){
 SPR.tub=[0,1,2,3].map(s=>[0,1].map(f=>dirs4(mkTub(f,s))));
 const E={cabbage:mkCabbage,carrot:mkCarrot,onion:mkOnion,pumpkin:mkPumpkin};SPR.en={};for(const k in E)SPR.en[k]=[0,1].map(f=>dirs4(E[k](f)));
 SPR.boss=[mkBoss(0),mkBoss(1)];SPR.cake=mkCake(false);SPR.cakeDead=mkCake(true);
 SPR.pastry={};for(const k of ['pie','cupcake','ring','tart','choco','muffin'])SPR.pastry[k]=mkPastry(k);
 SPR.pow={};for(const k of ['star','bomb','shield','clock','pan','life'])SPR.pow[k]=mkPower(k);
 SPR.candy=[0,1,2,3,4].map(i=>dirs4(mkCandy(i)));SPR.pea=mkPea('#5ae05a','#c8ffb0',1.6);SPR.tear=mkPea('#4fc3f7','#e0f8ff',1.6);SPR.bigpea=mkPea('#3bd16f','#c8ffb0',2.6);
 SPR.mini=mkMini();SPR.miniTub=mkMiniTub();SPR.flag=mkFlag();
 // тайлы
 let P=painter(16,16);for(let y=0;y<16;y+=4)for(let x=0;x<16;x+=4){const L='#ffd890',M='#eaa84a',D='#b06a24',B='#cf8a36';P.r(x,y,4,4,M);P.r(x,y,3,1,L);P.r(x,y,1,3,L);P.r(x+3,y,1,4,D);P.r(x,y+3,4,1,D);P.p(x+3,y,B);P.p(x,y+3,B);}
 for(let x=0;x<16;x++){P.p(x,7,'#8a4a1a');P.p(x,15,'#8a4a1a');}SPR.wafer=P.c;
 P=painter(16,16);for(let y=0;y<16;y+=8)for(let x=0;x<16;x+=8){P.r(x,y,8,8,'#4a4a64');P.r(x,y,8,1,'#8a8aa8');P.r(x,y,1,8,'#8a8aa8');P.r(x+7,y,1,8,'#20202e');P.r(x,y+7,8,1,'#20202e');P.r(x+2,y+2,4,4,'#3a3a50');P.p(x+2,y+2,'#c0c0dc');P.p(x+3,y+2,'#9a9ab8');P.p(x+2,y+3,'#9a9ab8');}SPR.pan=P.c;
 SPR.milk=[0,1].map(f=>{const P=painter(16,16);P.r(0,0,16,16,'#dff2ff');for(let y=0;y<16;y+=4)for(let x=0;x<16;x++){if(((x+y+f*2)>>1)%4===0)P.p(x,y+((x>>2)%2),'#9fd4f5');}P.p((3+f*5)%16,2,'#fff');P.p((11+f*3)%16,10,'#fff');P.p((7+f*7)%16,13,'#b8e4ff');return P.c;});
 P=painter(16,16);srand(42);for(let i=0;i<9;i++){const x=rnd()*16,y=rnd()*16,r=2.5+rnd()*2.5;P.e(x,y,r,r,'#ff7fc8');}for(let i=0;i<9;i++){const x=rnd()*16,y=rnd()*16,r=1.5+rnd()*2;P.e(x,y,r,r,'#ffb3e0');}for(let i=0;i<8;i++)P.p(rnd()*16,rnd()*16,'#ffffff');for(let i=0;i<6;i++)P.p(rnd()*16,rnd()*16,'#e04aa8');SPR.cotton=P.c;
 P=painter(16,16);P.r(0,0,16,16,'#d9781e');for(let y=0;y<16;y++)for(let x=0;x<16;x++){if((x+y*2)%11===0)P.p(x,y,'#f5a840');if((x*3+y)%17===0)P.p(x,y,'#b85a10');}P.r(2,3,3,1,'#ffe0a0');P.r(10,11,2,1,'#ffe0a0');P.p(12,4,'#fff');SPR.syrup=P.c;
 buildPortraits();}
// ====== ПОРТРЕТЫ 48x48 ======
const POR={};
function eyes(P,lx,rx,y,col=OUT){P.r(lx,y,2,2,col);P.r(rx,y,2,2,col);P.p(lx,y,'#fff');P.p(rx,y,'#fff');}
function buildPortraits(){let P;
 // Баба Зина
 P=painter(48,48);P.e(24,52,21,13,'#9b5de5');for(const [x,y] of [[8,44],[15,46],[33,45],[40,44],[24,47],[12,41],[37,41]])P.e(x,y,1.5,1.5,'#ffd1ea');
 P.r(20,33,8,6,'#e0a880');P.e(24,40,8,2.6,'#ffffff');for(let i=0;i<9;i++)P.p(16+i*2,41+Math.round(Math.sin(i/8*Math.PI)*2),'#fff8e0');
 P.e(24,22,15.5,14,'#a8a8c0');for(let a=0;a<12;a++){const an=Math.PI+a/11*Math.PI*1.1-0.05;P.e(24+Math.cos(an)*14.5,22+Math.sin(an)*12.5,3.2,3.2,'#c8c8dc');}
 P.e(24,6,6.5,5,'#a8a8c0');P.e(23,5,4.5,3,'#d8d8ea');P.r(28,2,5,1,'#ff3b5c');P.p(33,1,'#ff3b5c');
 P.e(24,26,11,12,'#e0a880');P.e(23,25,10,11,'#f2c49b');
 P.e(24,14.5,11,4,'#c8c8dc');for(const x of [15,20,25,30])P.e(x,16,2.4,2,'#d8d8ea');
 for(const cx of [18.5,29.5]){P.e(cx,25,4.6,4,'#5a2a7a');P.e(cx,25,3.5,3,'#d8f4ff');}P.r(22,24,4,1,'#5a2a7a');P.r(12,24,2,1,'#5a2a7a');P.r(34,24,2,1,'#5a2a7a');
 P.r(18,25,2,2,OUT);P.r(29,25,2,2,OUT);P.p(17,23,'#fff');P.p(28,23,'#fff');
 P.r(15,19,6,1,'#8a8aa0');P.r(27,19,6,1,'#8a8aa0');P.p(14,20,'#8a8aa0');P.p(33,20,'#8a8aa0');
 P.e(15,31,2.5,1.6,'#ff8fa8');P.e(33,31,2.5,1.6,'#ff8fa8');P.r(23,27,2,4,'#d99a70');P.p(22,30,'#d99a70');P.p(25,30,'#c88860');
 P.r(20,34,8,1,'#b0402a');P.p(28,33,'#b0402a');P.p(19,33,'#d99a70');P.p(12,27,'#d99a70');P.p(36,27,'#d99a70');
 P.e(12.5,31.5,1.4,1.4,'#ffd36b');P.e(35.5,31.5,1.4,1.4,'#ffd36b');POR.zina=P.outline(OUT).c;
 // Барон Брокколи
 P=painter(48,48);P.e(24,54,22,14,'#c43a3a');P.r(4,42,8,3,'#ffd36b');P.r(36,42,8,3,'#ffd36b');for(let x=5;x<12;x+=2)P.r(x,45,1,2,'#ffd36b');for(let x=37;x<44;x+=2)P.r(x,45,1,2,'#ffd36b');
 P.r(23,41,2,7,'#ffd36b');P.e(24,44,2,2,'#ffe14d');
 P.e(24,30,12,13,'#8ac45a');P.e(23,29,11,12,'#c4e89a');P.e(19,25,4,4,'#dcf5b8');
 for(const [x,y,r] of [[11,15,7],[24,12,9],[37,15,7],[16,6,5],[32,6,5],[6,22,4.5],[42,22,4.5],[24,19,4]]){P.e(x,y,r,r,'#1e6a2e');P.e(x-1,y-1,r-1.4,r-1.4,'#3aa040');P.e(x-2,y-2.5,1.5,1.2,'#8fe07a');P.p(x+2,y,'#5ac85a');P.p(x-3,y+2,'#2a8a3a');}
 P.r(16,0,16,6,'#1a1a2a');P.r(16,5,16,2,'#c43aff');P.r(12,7,24,2,'#1a1a2a');P.r(18,1,1,4,'#4a4a6a');
 P.r(13,24,8,1,OUT);P.p(20,25,OUT);P.r(27,25,8,1,OUT);P.p(27,24,OUT);P.p(28,24,OUT);
 P.r(15,26,4,3,'#fff');P.r(16,27,2,2,'#e01a1a');P.e(30.5,28,4.4,4.4,'#ffd36b');P.e(30.5,28,3.4,3.4,'#d8f4ff');P.r(29,27,3,3,'#fff');P.r(30,28,2,2,'#e01a1a');for(let y=32;y<41;y++)P.p(34+(y%2),y,'#ffd36b');
 P.r(18,30,6,3,'#a8d87a');P.r(15,34,18,3,OUT);P.r(12,32,3,2,OUT);P.r(33,32,3,2,OUT);P.p(11,31,OUT);P.p(36,31,OUT);P.p(11,30,OUT);P.p(37,30,OUT);
 P.r(17,38,14,3,'#fff');for(let x=19;x<31;x+=3)P.p(x,38,'#c0c0c0');P.r(17,40,14,1,'#c0c0c0');POR.baron=P.outline(OUT).c;
 // Дед Фёдор
 P=painter(48,48);P.e(24,54,21,14,'#ffffff');for(let y=40;y<48;y+=3)P.r(4,y,40,1,'#2a5ac8');P.r(20,34,8,6,'#e0a880');
 P.e(24,26,11,12,'#e0a880');P.e(23,25,10,11,'#f2c49b');
 P.e(24,12,15,9,'#7a4a2a');P.e(23,10,13,7,'#a86a3a');for(let x=12;x<37;x+=3)P.p(x,8+(x%2),'#c88a5a');P.r(9,14,6,16,'#7a4a2a');P.r(33,14,6,16,'#7a4a2a');P.r(10,15,3,13,'#a86a3a');P.r(34,15,3,13,'#a86a3a');P.e(24,5,3,2,'#ff3b3b');P.r(23,5,2,1,'#ffd36b');
 P.r(16,22,6,2,'#ffffff');P.r(27,22,6,2,'#ffffff');eyes(P,18,29,25);P.p(17,24,'#f2c49b');
 P.e(24,30,3,2.6,'#ff6f6f');P.p(23,29,'#ffb0b0');P.e(18,34,6,2.6,'#ffffff');P.e(30,34,6,2.6,'#ffffff');P.e(24,33,3,2,'#ffffff');P.p(11,34,'#ffffff');P.p(37,34,'#ffffff');P.e(24,38,2,1,'#b0402a');POR.ded=P.outline(OUT).c;
 // Кочан-сержант
 P=painter(48,48);P.e(24,28,20,18,'#2f8a3a');P.e(23,27,18.5,16.5,'#7ed957');P.e(19,22,9,7,'#a6ec7a');for(const [x,y] of [[8,32],[10,38],[38,32],[36,38],[24,44],[16,42],[32,42]])P.e(x,y,3,2,'#3aa040');
 P.e(24,10,16,7,'#4a6a2a');P.r(8,12,32,3,'#3a5a1a');P.e(24,6,4,3,'#6a8a3a');P.r(20,8,8,3,'#ffd36b');P.p(24,9,'#ff3b3b');
 P.r(14,22,6,5,'#fff');P.r(28,22,6,5,'#fff');P.r(16,24,3,3,OUT);P.r(29,24,3,3,OUT);P.r(13,20,8,2,OUT);P.r(27,20,8,2,OUT);P.p(20,22,OUT);P.p(27,22,OUT);
 P.r(18,34,12,3,'#1e5a1e');P.r(19,34,10,1,'#fff');POR.cabbage=P.outline(OUT).c;
 // Морковь-гонщица
 P=painter(48,48);for(let y=8;y<48;y++){const hw=4+(48-y)*0.32;if(y>40){}P.r(24-hw,y,hw*2,1,'#ff8c1a');P.r(24-hw,y,2,1,'#ffc070');P.r(24+hw-2,y,2,1,'#d9600e');}
 for(let i=0;i<7;i++){P.e(14+i*3.3,6-Math.abs(i-3)*0.6,1.6,6,i%2?'#3bd16f':'#2f9a4f');}for(const y of [18,30,40])P.r(16,y,16,1,'#d9600e');
 P.r(10,20,28,4,OUT);P.e(17,22,4,3.2,'#8fd3ff');P.e(31,22,4,3.2,'#8fd3ff');P.p(15,21,'#fff');P.p(29,21,'#fff');P.r(16,22,2,2,OUT);P.r(30,22,2,2,OUT);
 P.r(18,30,12,2,'#7a2a0a');P.p(17,29,'#7a2a0a');P.p(30,29,'#7a2a0a');P.r(26,30,2,2,'#fff');POR.carrot=P.outline(OUT).c;
 // Лук-плакса
 P=painter(48,48);P.e(24,30,18,16,'#7a2a9a');P.e(23,29,16.5,14.5,'#c06ae0');P.e(17,23,4,6,'#eab8ff');for(const x of [16,24,32])P.r(x,18,1,24,'#9a4abc');
 P.tri(15,18,33,18,24,2,'#c06ae0');P.r(22,0,4,6,'#7ed957');P.r(26,0,2,3,'#3bd16f');for(const x of [20,24,28])P.r(x,45,1,3,'#f0e0c0');
 P.r(14,24,6,5,'#fff');P.r(28,24,6,5,'#fff');P.r(16,26,3,3,OUT);P.r(29,26,3,3,OUT);P.r(14,22,3,1,OUT);P.r(17,21,3,1,OUT);P.r(28,21,3,1,OUT);P.r(31,22,3,1,OUT);
 for(let y=29;y<44;y+=2){P.r(14,y,2,2,'#4fc3f7');P.r(33,y,2,2,'#4fc3f7');}P.p(14,29,'#e0f8ff');P.e(24,36,4,2.4,'#4a1a5a');P.r(22,35,4,1,'#fff');POR.onion=P.outline(OUT).c;
 // Тыква-паладин
 P=painter(48,48);P.e(24,28,22,17,'#b8500a');P.e(24,27.5,21,16,'#ff9a1f');for(const x of [12,24,36])P.r(x-1,12,2,31,'#d9700e');P.r(6,22,2,10,'#ffc070');P.r(22,4,4,9,'#6b8a2a');P.e(30,6,4,2,'#3bd16f');
 P.tri(10,26,20,26,15,18,'#ffe66b');P.tri(28,26,38,26,33,18,'#ffe66b');P.tri(21,31,27,31,24,26,'#ffe66b');
 P.r(10,34,28,5,'#ffe66b');for(let x=12;x<38;x+=5){P.r(x,34,2,2,'#7a3a0a');P.r(x+2,37,2,2,'#7a3a0a');}P.p(14,22,'#fff8c0');P.p(32,22,'#fff8c0');POR.pumpkin=P.outline(OUT).c;
 // Пирожок (бывший кочан)
 P=painter(48,48);P.e(24,30,21,13,'#a8601e');P.e(23,29,20,12,'#e8a94c');P.e(16,24,8,4,'#f7d08a');for(let x=6;x<42;x+=4)P.e(x,18+Math.abs(x-24)*0.1,2,1.5,'#c97a2e');
 P.r(15,27,3,1,OUT);P.p(14,28,OUT);P.p(18,28,OUT);P.r(30,27,3,1,OUT);P.p(29,28,OUT);P.p(33,28,OUT);P.e(11,33,3,2,'#ff8fa8');P.e(37,33,3,2,'#ff8fa8');
 P.e(24,34,4,3,'#7a2a0a');P.e(24,35,2.4,1.4,'#ff6f8f');P.r(37,8,2,6,'#7ed957');P.p(39,8,'#3bd16f');POR.pie=P.outline(OUT).c;
}
// ====== ФОНЫ СЦЕН 320x150 ======
const BAY=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
function gradSky(P,cols,h){const n=cols.length;for(let y=0;y<h;y++){const f=y/h*(n-1);const i=Math.floor(f),fr=f-i;for(let x=0;x<P.w;x++){const th=BAY[y%4][x%4]/16;P.p(x,y,cols[Math.min(n-1,i+(fr>th?1:0))]);}}}
function house(P,x,y,w,h,wall,roof,shop){P.r(x,y,w,h,wall);P.r(x+w-3,y,3,h,'rgba(0,0,0,0.15)');P.tri(x-4,y,x+w+4,y,x+w/2,y-h*0.55,roof);for(let r=0;r<h*0.5;r+=3)P.r(x+w/2-(h*0.55-r)*((w+8)/2)/(h*0.55),y-r-1,((h*0.55-r)*((w+8))/(h*0.55)),1,'rgba(0,0,0,0.12)');
 const cols=Math.floor((w-6)/10);for(let i=0;i<cols;i++)for(let j=0;j<Math.floor((h-14)/12);j++){const wx=x+5+i*10,wy=y+5+j*12;P.r(wx,wy,6,7,'#5a3a7a');P.r(wx+1,wy+1,4,5,'#ffe66b');P.r(wx+3,wy+1,1,5,'#5a3a7a');P.r(wx-1,wy+7,8,1,'#fff');}
 P.r(x+w/2-3,y+h-11,6,11,'#7a3a2a');P.r(x+w/2-2,y+h-10,4,10,'#a85a3a');P.p(x+w/2+1,y+h-5,'#ffd36b');}
function lolli(P,x,y,c){P.r(x,y,1,22,'#fff');P.e(x+0.5,y,6,6,c);P.e(x+0.5,y,4,4,'#fff');P.e(x+0.5,y,2.5,2.5,c);P.p(x-2,y-3,'#fff');}
function buildBackdrops(){const B={};let P;
 P=painter(320,150);gradSky(P,['#3aa8f0','#5fc4ff','#8fd8ff','#bfeaff','#e6f8ff'],110);
 P.e(270,28,14,14,'#fff6a8');P.e(270,28,11,11,'#ffe14d');
 srand(5);for(let x=0;x<320;x++){const h=96-Math.sin(x*0.02)*10-Math.sin(x*0.051)*6;P.r(x,h,1,150,'#7fd060');P.p(x,h,'#a6ec7a');}
 for(let x=0;x<320;x++){const h=104-Math.sin(x*0.03+2)*7;P.r(x,h,1,150,'#5fb04f');}
 const pal=['#ff9ad5','#ffd36b','#8fd3ff','#b8f08a','#ffb38a','#d4a8ff'],rf=['#c43a5a','#b05a2a','#3a5ac8','#c43aff','#8a3a1a','#e04a8a'];
 let hx=2;for(let i=0;hx<320;i++){const w=34+((i*7)%3)*6,h=34+((i*5)%4)*7;if(i===3){P.r(hx,128-48,52,48,'#fff0f8');P.r(hx,128-48,52,6,'#ff5fa8');for(let k=0;k<52;k+=6)P.r(hx+k,128-42,3,4,'#ff5fa8');
   P.r(hx+6,128-30,40,16,'#5a3a7a');P.r(hx+7,128-29,38,14,'#ffe6f4');P.r(hx+20,128-14,12,14,'#7a3a2a');for(let k=0;k<5;k++)P.e(hx+12+k*7,128-23,2.5,2.5,['#ff3b5c','#ffd36b','#3bd16f','#4fc3f7','#ff6fbf'][k]);
   P.r(hx+8,128-70,36,18,'#ff5fa8');P.r(hx+8,128-70,36,4,'#fff');P.r(hx+14,128-82,24,12,'#ffb3dc');P.r(hx+14,128-82,24,3,'#fff');for(const k of [18,26,34])P.r(hx+k-1,128-90,2,8,'#8fd3ff');hx+=58;continue;}
  house(P,hx,128-h,w,h,pal[i%6],rf[i%6]);hx+=w+10;}
 for(const [x,c] of [[48,'#ff3b5c'],[150,'#3bd16f'],[232,'#c43aff'],[300,'#ff8c1a']])lolli(P,x,108,c);
 for(let y=128;y<150;y++)for(let x=0;x<320;x++){const n=((x>>3)+(y>>2))%2;P.p(x,y,((x+(y>>2)*4)%8===0||y%4===0)?'#a8907a':n?'#d8c4a8':'#c8b498');}
 P.r(6,112,2,16,'#7a4a2a');P.r(0,104,60,10,'#a86a3a');P.r(1,105,58,8,'#c88a5a');B.town=P;
 // огород зла
 P=painter(320,150);gradSky(P,['#120a24','#1e1238','#2d1a50','#40246a','#5a2e7a'],120);
 P.e(60,30,13,13,'#ff6a5a');P.e(64,27,11,11,'#120a24');srand(9);for(let i=0;i<40;i++)P.p(rnd()*320,rnd()*70,'#c0a0ff');
 for(let x=0;x<320;x++){const h=104-Math.abs(Math.sin(x*0.025))*14;P.r(x,h,1,50,'#2a1a3a');}
 const cx=210;P.r(cx-10,40,20,70,'#2a5a2a');P.r(cx-30,70,10,40,'#2a5a2a');P.r(cx+20,70,10,40,'#2a5a2a');
 for(const [x,y,r] of [[cx,30,22],[cx-22,40,15],[cx+22,40,15],[cx-12,18,12],[cx+12,18,12],[cx-25,64,10],[cx+25,64,10],[cx,8,9]]){P.e(x,y,r,r,'#103a1a');P.e(x-2,y-2,r-3,r-3,'#1e6a2e');P.e(x-r*0.4,y-r*0.4,r*0.25,r*0.2,'#3aa040');}
 for(const [x,y] of [[cx-4,55],[cx+2,55],[cx-26,80],[cx+24,80],[cx-1,80]]){P.r(x,y,4,6,'#ff2a2a');P.p(x+1,y+1,'#ffb0a0');}P.r(cx-4,92,8,18,'#0a1a0a');
 for(let y=112;y<150;y++){const c=(y%6<3)?'#5a3a1e':'#4a2e14';P.r(0,y,320,1,c);}
 for(let row=0;row<3;row++)for(let x=8+row*7;x<320;x+=26){const y=118+row*11;P.e(x,y,6,4.5,'#2f8a3a');P.e(x-0.5,y-0.5,5,3.8,'#7ed957');P.p(x-2,y-1,'#fff');P.p(x+1,y-1,'#fff');P.p(x-2,y,OUT);P.p(x+1,y,OUT);P.p(x-3,y-2,OUT);P.p(x+2,y-2,OUT);}
 B.garden=P;
 // праздник
 P=painter(320,150);gradSky(P,['#140a38','#24145a','#3a1e7a','#5a2a8a','#8a3a8a'],150);srand(3);for(let i=0;i<70;i++)P.p(rnd()*320,rnd()*90,['#fff','#ffe14d','#8fd3ff'][i%3]);
 for(let x=0;x<320;x++){const y=10+Math.sin(x/320*Math.PI*3)*-6+6;P.p(x,y,'#3a2a5a');if(x%14===0){P.e(x,y+3,2,2.5,['#ff3b5c','#ffe14d','#3bd16f','#4fc3f7','#ff6fbf'][(x/14)%5]);}}
 P.r(0,112,320,38,'#3a7a3a');for(let x=0;x<320;x+=3)P.p(x,112+(x%2),'#5fb04f');
 P.r(30,104,260,10,'#ff9ad5');P.r(30,104,260,2,'#ffd1ea');for(let x=30;x<290;x+=10){P.tri(x,114,x+10,114,x+5,119,'#ff9ad5');}P.r(40,119,3,14,'#7a4a2a');P.r(277,119,3,14,'#7a4a2a');
 B.party=P;
 BG.town=B.town.c;BG.garden=B.garden.c;BG.party=B.party.c;}
const BG={};
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
 {s:'yard',t:'ТАК НАЧАЛАСЬ БИТВА ЗА СЛАДКОЕ. ЗАЩИТИ ТОРТ. ПРЕВРАТИ ОВОЩИ В ПИРОЖКИ. НЕ РАСПЛЕСКАЙ ВОДУ.'},
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

// ====== ВВОД: ЛОКАЛЬНЫЙ КООПЕРАТИВ ======
let coop=false,modeCursor=0,menuLastDir=-1;
try{modeCursor=Math.max(0,Math.min(2,(+localStorage.getItem('vanna_players')||1)-1));coop=modeCursor>0;}catch(e){}
const keys={},pressed={};let keyOrder=[],touchDirs=[-1,-1];
const MAP_WASD={KeyW:0,KeyD:1,KeyS:2,KeyA:3},MAP_ARROWS={ArrowUp:0,ArrowRight:1,ArrowDown:2,ArrowLeft:3};
const padSlots=[null,null],padPrevious=[{fire:false,start:false,help:false},{fire:false,start:false,help:false}];
let padInput=[{dir:-1,fire:false},{dir:-1,fire:false}];
function pressKey(k){if(!keys[k])pressed[k]=true;keys[k]=true;keyOrder=keyOrder.filter(x=>x!==k);keyOrder.push(k);}
function releaseKey(k){keys[k]=false;keyOrder=keyOrder.filter(x=>x!==k);}
addEventListener('keydown',e=>{
 if(e.target.closest&&e.target.closest('button,input,select'))return;
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftRight','Numpad0','F1'].includes(e.code))e.preventDefault();
 audioInit();if(!e.repeat)pressKey(e.code);
 if(e.code==='KeyM'&&!e.repeat)toggleSound();
});
addEventListener('keyup',e=>releaseKey(e.code));
cv.addEventListener('pointerdown',e=>{cv.focus({preventScroll:true});audioInit();if(state==='title'){
 const r=cv.getBoundingClientRect(),y=(e.clientY-r.top)/r.height*H;
 if(y>=167&&y<=214){selectMode(Math.min(2,Math.floor((y-167)/16)));pressed.Enter=true;return;}
 }pressed.Click=true;
});
function curDir(id=0){
 if(touchDirs[id]>=0)return touchDirs[id];
 const map=coop?(id===0?MAP_WASD:MAP_ARROWS):{...MAP_WASD,...MAP_ARROWS};
 for(let i=keyOrder.length-1;i>=0;i--)if(keys[keyOrder[i]]&&keyOrder[i] in map)return map[keyOrder[i]];
 return padInput[id]?.dir??-1;
}
function fireHeld(id){return (id===0?(keys.Space||(!coop&&(keys.KeyJ||keys.KeyZ))):(keys.ShiftRight||keys.Numpad0))||padInput[id]?.fire;}
const confirmP=()=>pressed.Enter||pressed.Space||pressed.Click||pressed.NumpadEnter||pressed.ShiftRight||pressed.PadConfirm;
function pollGamepads(){
 let gp=[];try{gp=Array.from(navigator.getGamepads?.()||[]).filter(Boolean);}catch(e){}
 for(let id=0;id<2;id++)if(!gp.some(p=>p.index===padSlots[id])){padSlots[id]=null;padPrevious[id]={fire:false,start:false,help:false};}
 for(const p of gp)if(!padSlots.includes(p.index)){const id=padSlots.indexOf(null);if(id>=0)padSlots[id]=p.index;}
 padInput=[0,1].map(id=>{
  const p=gp.find(p=>p.index===padSlots[id]);if(!p)return {dir:-1,fire:false};
  const btn=i=>!!p.buttons[i]?.pressed;let dir=-1;const x=p.axes[0]||0,y=p.axes[1]||0;
  if(Math.max(Math.abs(x),Math.abs(y))>.28)dir=Math.abs(x)>Math.abs(y)?(x>0?1:3):(y>0?2:0);
  if(btn(12))dir=0;else if(btn(13))dir=2;else if(btn(14))dir=3;else if(btn(15))dir=1;
  const fire=btn(0)||btn(7),start=btn(9),help=btn(8),prev=padPrevious[id];
  if(fire&&!prev.fire)pressed.PadConfirm=true;if(start&&!prev.start)pressed.Enter=true;if(help&&!prev.help)pressed.KeyR=true;
  padPrevious[id]={fire,start,help};return {dir,fire};
 });
}
const touchUI=matchMedia('(pointer:coarse)').matches;
document.body.classList.toggle('touch',touchUI);document.body.classList.toggle('coop',modeCursor===1);resize();
document.querySelectorAll('#pad [data-k],#coop-pad [data-k]').forEach(b=>{
 const k=b.dataset.k;const release=e=>{e.preventDefault();releaseKey(k);b.classList.remove('held');};
 b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);audioInit();pressKey(k);b.classList.add('held');});
 ['pointerup','pointercancel','lostpointercapture'].forEach(event=>b.addEventListener(event,release));
});
document.querySelectorAll('.coop-stick').forEach(stick=>{
 const id=Number(stick.dataset.player),thumb=stick.querySelector('span');
 const move=e=>{const r=stick.getBoundingClientRect(),dx=(e.clientX-r.left-r.width/2)/(r.width/2),dy=(e.clientY-r.top-r.height/2)/(r.height/2);const mag=Math.hypot(dx,dy),m=Math.min(1,mag);touchDirs[id]=mag<.18?-1:Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0);thumb.style.transform=`translate(${mag?dx/mag*m*24:0}px,${mag?dy/mag*m*24:0}px)`;};
 let pointer=null;stick.addEventListener('pointerdown',e=>{e.preventDefault();audioInit();pointer=e.pointerId;stick.setPointerCapture(pointer);move(e);});
 stick.addEventListener('pointermove',e=>{if(pointer===e.pointerId)move(e);});
 const off=e=>{if(e.pointerId!==pointer)return;pointer=null;touchDirs[id]=-1;thumb.style.transform='';};
 ['pointerup','pointercancel','lostpointercapture'].forEach(event=>stick.addEventListener(event,off));
});
// ====== МИР ======
const ET={cabbage:{sp:0.5,hp:1,bs:2,fire:0.012,pts:100,pastry:'pie'},carrot:{sp:1.15,hp:1,bs:2.3,fire:0.012,pts:200,pastry:'cupcake'},onion:{sp:0.6,hp:1,bs:3.2,fire:0.03,pts:300,pastry:'ring'},pumpkin:{sp:0.45,hp:4,bs:2.6,fire:0.016,pts:400,pastry:'tart'}};
const POWERS={star:'КАРАМЕЛЬ+',bomb:'ТОРТ-БОМБА!',shield:'БИГУДИ-ЩИТ',clock:'ТИХИЙ ЧАС',pan:'СКОВОРОДКИ',life:'ВСТАВНАЯ ЧЕЛЮСТЬ'};
const G=new Uint8Array(52*52);
let lvl=0,score=0,hiscore=0,enemies=[],bullets=[],parts=[],floats=[],pastries=[],powerups=[];
let crew=[];
function scoreKey(){const key=coop?'vanna_hi_2p':'vanna_hi';return typeof window!=='undefined'&&window.Platform?window.Platform.storageKey(key):key;}
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
// ====== ОТРИСОВКА ======
const [tintC,tintX]=mk(32,32);
function drawTint(img,x,y,col,a){tintX.clearRect(0,0,32,32);tintX.globalCompositeOperation='source-over';tintX.drawImage(img,0,0);tintX.globalCompositeOperation='source-atop';tintX.globalAlpha=a;tintX.fillStyle=col;tintX.fillRect(0,0,32,32);tintX.globalAlpha=1;tintX.globalCompositeOperation='source-over';ctx.drawImage(tintC,0,0,img.width,img.height,x,y,img.width,img.height);}
const [frameC,frameX]=mk(W,H);
function buildFrame(){const P={x:frameX};for(let y=0;y<H;y++)for(let x=0;x<W;x++){frameX.fillStyle=((x+y)>>3)%2?'#6a2a9a':'#7a34ac';frameX.fillRect(x,y,1,1);}
 srand(77);for(let i=0;i<220;i++){frameX.fillStyle=SPRINK[i%7];const x=rnd()*W|0,y=rnd()*H|0;frameX.fillRect(x,y,2,1);}
 for(let i=-3;i<FS+6;i++){for(let k=0;k<3;k++){const c=((i>>1)%2)?'#ff5fa8':'#ffffff';frameX.fillStyle=c;frameX.fillRect(FX+i,FY-3+k,1,1);frameX.fillRect(FX+i,FY+FS+k,1,1);frameX.fillRect(FX-3+k,FY+i,1,1);frameX.fillRect(FX+FS+k,FY+i,1,1);}}
 frameX.fillStyle=OUT;frameX.fillRect(FX-4,FY-4,FS+8,1);frameX.fillRect(FX-4,FY+FS+3,FS+8,1);frameX.fillRect(FX-4,FY-4,1,FS+8);frameX.fillRect(FX+FS+3,FY-4,1,FS+8);
 frameX.fillStyle='#2a1050';frameX.fillRect(236,12,78,216);frameX.fillStyle='#ffd36b';frameX.fillRect(236,12,78,1);frameX.fillRect(236,227,78,1);frameX.fillRect(236,12,1,216);frameX.fillRect(313,12,1,216);
 frameX.fillStyle='#1d1530';frameX.fillRect(FX,FY,FS,FS);for(let ty=0;ty<13;ty++)for(let tx=0;tx<13;tx++)if((tx+ty)%2){frameX.fillStyle='#211a38';frameX.fillRect(FX+tx*16,FY+ty*16,16,16);}
 for(let ty=0;ty<13;ty++)for(let tx=0;tx<13;tx++){frameX.fillStyle='#2a2248';frameX.fillRect(FX+tx*16+8,FY+ty*16+8,1,1);}}
function drawCells(layer){const mf=SPR.milk[Math.floor(frame/30)%2];for(let cy=0;cy<52;cy++)for(let cx=0;cx<52;cx++){const t=G[cy*52+cx];if(!t||t===6)continue;let img=null;
 if(layer===0){if(t===1)img=SPR.wafer;else if(t===2)img=SPR.pan;else if(t===3)img=mf;else if(t===5)img=SPR.syrup;}else if(t===4)img=SPR.cotton;
 if(img)ctx.drawImage(img,(cx*4)%16,(cy*4)%16,4,4,FX+cx*4,FY+cy*4,4,4);}
 if(layer===0)for(let cy=0;cy<52;cy++)for(let cx=0;cx<52;cx++){if(G[cy*52+cx]===3&&(cy===0||G[(cy-1)*52+cx]!==3)){ctx.fillStyle='#ffffff';ctx.fillRect(FX+cx*4,FY+cy*4,4,1);}}}
function drawStar(x,y,t){const s=[1,2,3,4,3,2][Math.floor(t/5)%6];ctx.fillStyle=['#ffffff','#ffe14d','#ff9ad5'][Math.floor(t/3)%3];ctx.fillRect(x+8-s,y+7,s*2,2);ctx.fillRect(x+7,y+8-s,2,s*2);ctx.fillStyle='#fff';ctx.fillRect(x+7,y+7,2,2);if(s>2){ctx.fillRect(x+8-s-1,y+7,1,1);ctx.fillRect(x+8+s,y+8,1,1);}}
function drawHeart(x,y,c){ctx.fillStyle=c;ctx.fillRect(x,y,1,1);ctx.fillRect(x+2,y,1,1);ctx.fillRect(x,y+1,3,1);ctx.fillRect(x+1,y+2,1,1);}
function drawField(){ctx.drawImage(frameC,0,0);ctx.save();if(shake>0)ctx.translate(Math.round((Math.random()-0.5)*shake*0.6),Math.round((Math.random()-0.5)*shake*0.6));
 ctx.beginPath();ctx.rect(FX,FY,FS,FS);ctx.clip();drawCells(0);
 const bx=FX+96,by=FY+192;if(baseAlive){ctx.drawImage(SPR.cake,bx,by);const fl=['#ffe14d','#ff8c1a','#fff'];for(const [i,cx] of [[0,4],[1,7],[2,10]]){ctx.fillStyle=fl[(Math.floor(frame/6)+i)%3];ctx.fillRect(bx+cx,by+((Math.floor(frame/8)+i)%2),1,1);ctx.fillStyle='#ffe14d';ctx.fillRect(bx+cx,by+1,1,1);}}else ctx.drawImage(SPR.cakeDead,bx,by);
 for(const p of powerups){if(p.l<180&&Math.floor(frame/6)%2)continue;if(Math.floor(frame/10)%2===0)drawTint(SPR.pow[p.k],FX+p.x,FY+p.y,'#ffffff',0.35);else ctx.drawImage(SPR.pow[p.k],FX+p.x,FY+p.y);}
 for(const e of enemies){if(e.dead)continue;const x=FX+Math.round(e.x),y=FY+Math.round(e.y);if(e.spawn>0){drawStar(x,y,e.spawn);continue;}const img=SPR.en[e.kind][Math.floor(e.anim/4)%2][e.dir];
  if(e.flash)drawTint(img,x,y,'#ffffff',0.8);else if(e.bonus&&Math.floor(frame/8)%2)drawTint(img,x,y,'#ff3bd1',0.6);else if(e.kind==='pumpkin'&&e.hp<4)drawTint(img,x,y,['#ff2a2a','#c43aff','#ffffff'][e.hp-1],0.35);else ctx.drawImage(img,x,y);
  if(freeze>0){txt('Z',x+12,y-6-Math.floor(frame/10)%4,'#8fd3ff',1,OUT);}}
 if(boss){const img=SPR.boss[Math.floor(frame/8)%2];const x=FX+Math.round(boss.x),y=FY+Math.round(boss.y);if(boss.flash)drawTint(img,x,y,'#ffffff',0.8);else if(boss.phase===2&&Math.floor(frame/10)%2)drawTint(img,x,y,'#ff2a2a',0.25);else ctx.drawImage(img,x,y);}
 for(const c of crew){const t=c.tank;if(!c.active||!t)continue;
  const x=FX+Math.round(t.x),y=FY+Math.round(t.y),img=(c.id?SPR.tub2:SPR.tub)[c.stars][Math.floor(t.anim/4)%2][t.dir];
  ctx.drawImage(img,x,y);if(coop)txt(String(c.id+1),x+8,Math.max(FY,y-12),c.color,1,OUT,'center');
  if(t.shield>0&&(t.shield>60||Math.floor(frame/4)%2))for(let i=0;i<5;i++){const a=frame*.08+i*Math.PI*2/5;drawHeart(x+7+Math.round(Math.cos(a)*11),y+7+Math.round(Math.sin(a)*11),c.id?'#8fe9f1':i%2?'#ff6fbf':'#ffd1ea');}
  if(t.shield>420){ctx.globalAlpha=.2;ctx.fillStyle=c.color;ctx.beginPath();ctx.arc(x+8,y+8,10,0,7);ctx.fill();ctx.globalAlpha=1;}
 }
 for(const b of bullets){if(b.owner==='p'){const img=SPR.candy[b.kind][(b.dir+3)%4];ctx.drawImage(img,FX+Math.round(b.x)-4,FY+Math.round(b.y)-4);}else{const img=SPR[b.kind];ctx.drawImage(img,FX+Math.round(b.x-img.width/2),FY+Math.round(b.y-img.height/2));}}
 drawCells(1);
 for(const p of pastries){const img=SPR.pastry[p.k];if(p.big){ctx.drawImage(img,FX+p.x-8,FY+p.y-8,32,32);}else{if(p.l<20&&Math.floor(p.l/3)%2)continue;ctx.drawImage(img,FX+Math.round(p.x),FY+Math.round(p.y));}}
 for(const p of parts){if(p.ring){ctx.strokeStyle=p.c;ctx.globalAlpha=p.l/14;ctx.lineWidth=1;ctx.beginPath();ctx.arc(FX+p.x,FY+p.y,p.r,0,7);ctx.stroke();ctx.globalAlpha=1;continue;}ctx.fillStyle=p.c;ctx.fillRect(Math.round(FX+p.x),Math.round(FY+p.y),p.s,p.s);}
 for(const f of floats)txt(f.t,FX+Math.min(Math.max(f.x,textW(f.t)/2+2),FS-textW(f.t)/2-2),FY+f.y,Math.floor(f.l/4)%2?f.c:'#ffffff',1,OUT,'center');
 if(freeze>0)txt('ТИХИЙ ЧАС',FX+FS/2,FY+4,'#8fd3ff',1,OUT,'center');
 ctx.restore();drawHUD();}
function drawHUD(){const x0=240,lives=crew[0].lives,stars=crew[0].stars;txt(boss||bossDie?'БАРОН':'ВРАГИ',x0+35,18,'#ffd36b',1,OUT,'center');
 if(LEVELS[lvl].boss){const hp=boss?boss.hp/boss.max:0;ctx.fillStyle=OUT;ctx.fillRect(x0+2,29,68,8);ctx.fillStyle='#3a1a2a';ctx.fillRect(x0+3,30,66,6);ctx.fillStyle=hp<0.5?'#ff4d6d':'#7ed957';ctx.fillRect(x0+3,30,Math.round(66*hp),6);ctx.fillStyle='#fff';ctx.fillRect(x0+3,30,Math.round(66*hp),1);
  ctx.drawImage(SPR.boss[0],x0+19,42);txt('ГОРОШНИЦА',x0+35,80,'#c8ffb0',1,OUT,'center');}
 else{const n=queue.length;for(let i=0;i<n;i++)ctx.drawImage(SPR.mini,x0+4+(i%4)*17,28+Math.floor(i/4)*10);}
 if(coop){
  for(const c of crew){const y=c.id?135:90;txt((c.id+1)+'P '+c.name,x0+35,y,c.color,1,OUT,'center');ctx.drawImage((c.id?SPR.tub2:SPR.tub)[c.stars][0][0],x0+9,y+11,12,12);txt('*'+c.lives,x0+30,y+14,'#fff');
   txt(c.lives===0?'R - ПОМОЩЬ':'КАРАМЕЛЬ '+c.stars,x0+35,y+29,c.lives===0?'#ffa18c':'#ffe14d',1,OUT,'center');
  }
  txt('УРОВЕНЬ '+(lvl+1),x0+35,180,'#8fd3ff',1,OUT,'center');txt('ОЧКИ',x0+35,194,'#7ed957',1,OUT,'center');txt(String(score).padStart(6,'0'),x0+35,205,'#fff',1,OUT,'center');txt('РЕК '+String(Math.max(hiscore,score)).padStart(6,'0'),x0+35,219,'#ffd36b',1,OUT,'center');
  txt('1P WASD ПРОБЕЛ',FX,FY+FS+8,'#ff9ad5',1,OUT);txt('2P СТРЕЛКИ SHIFT',FX+FS,FY+FS+8,'#8fe9f1',1,OUT,'right');return;
 }
 txt('БАБУЛЯ',x0+35,96,'#ff9ad5',1,OUT,'center');ctx.drawImage(SPR.miniTub,x0+18,107);txt('*'+Math.max(0,lives),x0+31,108,'#fff');
 txt('КАРАМЕЛЬ',x0+35,124,'#ffe14d',1,OUT,'center');for(let i=0;i<3;i++){if(i<stars)ctx.drawImage(SPR.candy[i][0],x0+16+i*14,134);else{ctx.fillStyle='#4a2a70';ctx.fillRect(x0+19+i*14,137,3,3);}}
 txt('УРОВЕНЬ',x0+35,152,'#8fd3ff',1,OUT,'center');ctx.drawImage(SPR.flag,x0+18,161);txt(String(lvl+1),x0+34,164,'#fff',1);
 txt('ОЧКИ',x0+35,182,'#7ed957',1,OUT,'center');txt(String(score).padStart(6,'0'),x0+35,192,'#fff',1,OUT,'center');
 txt('РЕКОРД',x0+35,206,'#ff8c1a',1,OUT,'center');txt(String(Math.max(hiscore,score)).padStart(6,'0'),x0+35,216,'#fff',1,OUT,'center');
 txt('M - ЗВУК '+(muted?'ВЫКЛ':'ВКЛ'),FX,FY+FS+8,'#e0c8ff',1,OUT);txt('ENTER - ПАУЗА',FX+FS,FY+FS+8,'#e0c8ff',1,OUT,'right');}
// ====== ДИАЛОГИ ======
let dlg=null;
function runDialog(lines,done,scene){stopMusic();dlg={lines,i:0,ch:0,done,scene:scene||lines[0].s||'town',t:0};setState('dialog');}
function drawScene(s,t){if(s==='yard'){ctx.drawImage(BG.town,0,0);ctx.drawImage(SPR.tub[0][Math.floor(t/8)%2][1],70,104,48,48);ctx.drawImage(SPR.cake,180,122,24,24);
  ctx.drawImage(SPR.pow.star,130,120+Math.round(Math.sin(t*0.1)*2));}
 else ctx.drawImage(BG[s],0,0);
 if(s==='town'||s==='yard'){for(const [cx,cy,sp] of [[30,20,0.15],[150,34,0.1],[230,14,0.12]]){const x=((cx+t*sp)%380)-40;ctx.fillStyle='#ffffff';ctx.fillRect(x,cy,26,5);ctx.fillRect(x+5,cy-3,14,3);ctx.fillRect(x+3,cy+5,22,2);ctx.fillStyle='#d8eeff';ctx.fillRect(x+3,cy+6,22,1);}}
 if(s==='garden'){if(t%180<6&&t%180!=2){ctx.fillStyle='rgba(255,255,255,0.35)';ctx.fillRect(0,0,W,150);ctx.fillStyle='#fff';let x=80+((t/180|0)*67)%160,y=0;while(y<90){const nx=x+(Math.random()*10-5),ny=y+6;ctx.fillRect(Math.min(x,nx),y,2,6);x=nx;y=ny;}}
  ctx.drawImage(SPR.boss[Math.floor(t/10)%2],194,30+Math.round(Math.sin(t*0.05)*3),32,32);for(let i=0;i<4;i++){const img=SPR.en[['cabbage','carrot','onion','pumpkin'][i]][Math.floor(t/8)%2][2];ctx.drawImage(img,40+i*34,92+((i+Math.floor(t/20))%2),16,16);}}
 if(s==='party'){ctx.drawImage(SPR.cake,128,56,64,64);for(const [k,x] of [['pie',40],['cupcake',64],['ring',230],['tart',254]])ctx.drawImage(SPR.pastry[k],x,88+(Math.floor((t+x)/12)%2),16,16);
  ctx.drawImage(SPR.tub[3][0][1],80,118,32,32);ctx.drawImage(SPR.pastry.choco,208,114,32,32);
  for(let i=0;i<3;i++){const ph=(t+i*70)%210;const fx=60+i*100,fy=50-i*8;if(ph<60){const r=ph*0.6;for(let k=0;k<14;k++){const a=k/14*Math.PI*2;ctx.fillStyle=SPRINK[(k+i)%7];ctx.fillRect(Math.round(fx+Math.cos(a)*r),Math.round(fy+Math.sin(a)*r+ph*0.1),2,2);}}else if(ph>180){ctx.fillStyle='#fff';ctx.fillRect(fx,fy+(210-ph)*2,1,3);}}}}
function drawDialog(){const L=dlg.lines[dlg.i];const sc=L.s||dlg.scene;dlg.scene=sc;drawScene(sc,dlg.t);
 ctx.fillStyle=OUT;ctx.fillRect(0,150,W,90);ctx.fillStyle='#2a1050';ctx.fillRect(4,154,312,82);ctx.fillStyle='#ffd36b';ctx.fillRect(4,154,312,1);ctx.fillRect(4,235,312,1);ctx.fillRect(4,154,1,82);ctx.fillRect(315,154,1,82);ctx.fillStyle='#ff6fbf';ctx.fillRect(6,156,308,1);
 const sp=L.w?SPK[L.w]:null;let tx=14,n=48;
 if(sp){ctx.fillStyle=OUT;ctx.fillRect(10,166,54,54);ctx.fillStyle=sp.bg;ctx.fillRect(11,167,52,52);for(let y=167;y<219;y+=4){ctx.fillStyle='rgba(255,255,255,0.06)';ctx.fillRect(11,y,52,2);}ctx.drawImage(POR[L.w],13,170);
  tx=72;n=39;
  txt(sp.n,tx,161,sp.c,1,OUT);}
 const lines=wrap(L.t,n);let left=Math.floor(dlg.ch);const y0=sp?174:166;
 for(let i=0;i<lines.length;i++){const s=lines[i].substr(0,Math.max(0,left));left-=lines[i].length+1;txt(s,tx,y0+i*10,'#ffffff',1,OUT);}
 if(dlg.ch>=L.t.length&&Math.floor(dlg.t/15)%2)txt('▼',304,226,'#ffd36b',1,OUT);
 txt((dlg.i+1)+'/'+dlg.lines.length,310,140,'#ffffff',1,OUT,'right');txt('ESC - ПРОПУСК',10,140,'#ffffff',1,OUT);}
function updDialog(){dlg.t++;const L=dlg.lines[dlg.i];if(dlg.ch<L.t.length){const prev=Math.floor(dlg.ch);dlg.ch+=0.8;if(Math.floor(dlg.ch)!==prev&&prev%6===0&&L.t[prev]!==' ')SFX.blip(L.w?SPK[L.w].p*(0.9+Math.random()*0.2):520);}
 if(pressed.Escape){const d=dlg.done;dlg=null;d();return;}
 if(confirmP()){if(dlg.ch<L.t.length)dlg.ch=L.t.length;else{dlg.i++;dlg.ch=0;SFX.sel();if(dlg.i>=dlg.lines.length){const d=dlg.done;dlg=null;d();}}}}
function buildPartnerSprites(){
 const colors={'255,111,191':[83,211,221],'255,209,234':[188,255,240],'184,188,216':[196,162,99],'255,255,255':[255,240,199],'95,208,255':[140,227,186],'42,158,224':[41,124,123],'106,90,144':[102,82,54],'154,136,200':[179,149,96]};
 SPR.tub2=SPR.tub.map(stars=>stars.map(anim=>anim.map(img=>{const [c,x]=mk(16,16);x.drawImage(img,0,0);const d=x.getImageData(0,0,16,16);for(let i=0;i<d.data.length;i+=4){const col=colors[[d.data[i],d.data[i+1],d.data[i+2]].join(',')];if(col){d.data[i]=col[0];d.data[i+1]=col[1];d.data[i+2]=col[2];}}x.putImageData(d,0,0);return c;})));
}
const INTRO_COOP=[...INTRO.slice(0,-1),
 {s:'yard',w:'ded',t:'Я ТОЖЕ ЕДУ! НАШЁЛ ВТОРУЮ ВАННУ НА ДАЧЕ. У НЕЁ ПРОБЕГ - ТРИ ВЕДРА.'},
 {s:'yard',w:'zina',t:'ДЕРЖИСЬ СПРАВА, ФЁДОР. И НЕ ПУТАЙ КАРАМЕЛЬ С ТАБЛЕТКАМИ ОТ ДАВЛЕНИЯ.'},
 {s:'yard',t:'ДВЕ ВАННЫ. ОДИН ТОРТ. НОЛЬ САНТЕХНИКОВ. ЗАЩИТИТЕ ТОРТ ВМЕСТЕ.'}
];
function selectMode(n){n=Math.max(0,Math.min(2,n));modeCursor=n;coop=n>0;document.body.classList.toggle('coop',n===1);try{localStorage.setItem('vanna_players',String(n+1));}catch(e){}resize();}
function newRun(){if(modeCursor===2){window.Online?.join();return;}score=0;resetCrew();readRecord();clearInput();SFX.sel();runDialog(coop?INTRO_COOP:INTRO,()=>{stopMusic();startLevel(0);});}
// ====== СОСТОЯНИЯ ======
let state='title',st=0;function setState(s){if(s==='pause'&&state!=='pause')pauseMusicClock();if(state==='pause'&&s==='play')resumeMusicClock();state=s;st=0;}
function startLevel(i){runDialog(LEVELS[i].pre,()=>{loadLevel(i);setState('curtain');stopMusic();});}
function nextAfterTally(){runDialog(LEVELS[lvl].post.length?LEVELS[lvl].post:[{t:'...'}],()=>{startLevel(lvl+1);});}
function drawTitle(){ctx.drawImage(BG.party,0,-20,W,H+20);ctx.fillStyle='rgba(20,10,56,0.35)';ctx.fillRect(0,0,W,H);
 const grad=['#fff6a8','#ffe14d','#ffd36b','#ffb000','#ff8c1a','#ff5f3a','#ff3b5c'];const bob=Math.round(Math.sin(st*0.06)*2);
 txt('БАТЛ',W/2,24+bob,grad,4,OUT,'center');txt('ГРЭННИ',W/2,58+bob,grad,4,OUT,'center');
 txt('БАБУЛЯ ПРОТИВ БРОККОЛИ',W/2,94,['#ffd1ea','#ffb3dc','#ff9ad5','#ff6fbf','#ff6fbf','#e04aa8','#c43a8a'],1,OUT,'center');
 const tx=30+((st*0.5)%40);ctx.drawImage(SPR.tub[0][Math.floor(st/6)%2][1],coop?30:40,118,coop?40:48,coop?40:48);if(coop)ctx.drawImage(SPR.tub2[0][Math.floor(st/6)%2][1],80,118,40,40);
 for(let i=0;i<4;i++){const x=92+((st*2+i*45)%150);ctx.drawImage(SPR.candy[i][0],x,138);}
 ctx.drawImage(SPR.boss[Math.floor(st/10)%2],238,112+Math.round(Math.sin(st*0.08)*3),56,56);
 
 const labels=['1 ИГРОК - БАБА ЗИНА','2 ИГРОКА НА ОДНОМ ЭКРАНЕ','ОНЛАЙН - ПОИСК НАПАРНИКА'];
 for(let i=0;i<3;i++){const y=170+i*16;if(modeCursor===i){ctx.fillStyle='#35204fcc';ctx.fillRect(57,y-3,206,14);txt('>',63,y,'#fff6a8',1,OUT);}txt(labels[i],W/2,y,modeCursor===i?(i===2?'#8fe9f1':'#fff6a8'):'#c8b8ff',1,OUT,'center');}
 txt('W/S ИЛИ СТРЕЛКИ - ВЫБОР  ENTER - СТАРТ',W/2,220,'#c8b8ff',1,OUT,'center');
 txt(modeCursor===2?'АВТОПОДБОР 2 ИГРОКОВ БЕЗ ПРИГЛАШЕНИЙ':modeCursor===1?'1P WASD+ПРОБЕЛ  2P СТРЕЛКИ+SHIFT':'WASD/СТРЕЛКИ + ПРОБЕЛ   F - ВЕСЬ ЭКРАН',W/2,231,modeCursor===2?'#8fe9f1':'#c8b8ff',1,OUT,'center');}

function drawCurtain(){drawField();const t=st;let c;if(t<30)c=t/30;else if(t<120)c=1;else c=Math.max(0,1-(t-120)/30);const h=Math.round(c*120);
 for(let y=0;y<h;y++){ctx.fillStyle=((y>>2)%2)?'#ff5fa8':'#ffd1ea';ctx.fillRect(0,y,W,1);ctx.fillRect(0,H-1-y,W,1);}
 if(c===1){txt('УРОВЕНЬ '+(lvl+1),W/2,96,['#fff','#fff','#fff6a8','#ffe14d','#ffd36b','#ff8c1a','#ff5f3a'],3,OUT,'center');txt(LEVELS[lvl].name,W/2,130,'#ffffff',2,OUT,'center');}}
function drawTally(){ctx.fillStyle='#1d1530';ctx.fillRect(0,0,W,H);ctx.drawImage(frameC,0,0,W,12,0,0,W,12);ctx.drawImage(frameC,0,228,W,12,0,228,W,12);
 txt('УРОВЕНЬ '+(lvl+1)+' ПРОЙДЕН!',W/2,24,['#fff6a8','#ffe14d','#ffd36b','#ffb000','#ff8c1a','#ff5f3a','#ff3b5c'],2,OUT,'center');txt('ОВОЩИ, ПРЕВРАЩЁННЫЕ В ВЫПЕЧКУ:',W/2,50,'#ff9ad5',1,OUT,'center');
 const ks=['cabbage','carrot','onion','pumpkin'];let tot=0;ks.forEach((k,i)=>{const show=st>20+i*30;const y=68+i*30;ctx.drawImage(SPR.en[k][0][1],70,y);txt('>',94,y+5,'#fff');ctx.drawImage(SPR.pastry[ET[k].pastry],106,y);
  if(show){txt(killed[k]+' *'+ET[k].pts,140,y+5,'#fff');txt('= '+(killed[k]*ET[k].pts),210,y+5,'#ffe14d');}tot+=killed[k];});
 if(st>150){txt('ВСЕГО ПИРОЖКОВ: '+tot,W/2,192,'#7ed957',1,OUT,'center');if(!window.Online?.active&&Math.floor(st/25)%2)txt('НАЖМИ ENTER',W/2,212,'#fff',1,OUT,'center');}}
function drawOver(){drawField();ctx.fillStyle='rgba(20,10,40,'+Math.min(0.6,st/100)+')';ctx.fillRect(0,0,W,H);const y=Math.max(80,H-st*1.5);
 txt(baseAlive?(coop?'ВАННЫ ПАЛИ!':'ВАННА ПАЛА!'):'ТОРТ ПАЛ!',W/2,y,['#fff','#ffd1ea','#ff9ad5','#ff6fbf','#ff3b5c','#c42a4a','#8a1a3a'],3,OUT,'center');if(st>120){txt('ИГРА ОКОНЧЕНА',W/2,y+36,'#fff',1,OUT,'center');if(!window.Online?.active&&Math.floor(st/25)%2)txt('ENTER - ПРОДОЛЖИТЬ',W/2,y+56,'#ffe14d',1,OUT,'center');}}
let credY=0;const CRED=['БАТЛ ГРЭННИ','','В РОЛЯХ:','БАБА ЗИНА - САМА СЕБЯ','ДЕД ФЁДОР - ИНЖЕНЕР И УЧЁНЫЙ','БАРОН БРОККОЛИ - ЗЛОДЕЙ НА ПЕНСИИ','КОЧАНЫ, МОРКОВКИ, ЛУК, ТЫКВЫ - ПИРОЖКИ','','ВАННА - ЧУГУН, 1974 Г.','КАРАМЕЛЬКИ - ВЫДАНЫ ПО ТАЛОНАМ','','НИ ОДИН ОВОЩ НЕ ПОСТРАДАЛ.','ВСЕ ОНИ СТАЛИ ВКУСНЕЕ.','','СПАСИБО ЗА ИГРУ!','','КОНЕЦ'];
function drawCredits(){drawScene('party',st);ctx.fillStyle='rgba(20,10,56,0.55)';ctx.fillRect(0,0,W,H);CRED.forEach((s,i)=>{const y=H+10+i*14-st*0.4;if(y>-10&&y<H)txt(s,W/2,y,i===0||i===CRED.length-1?['#fff6a8','#ffe14d','#ffd36b','#ffb000','#ff8c1a','#ff5f3a','#ff3b5c']:(i===2?'#ff9ad5':'#fff'),i===0||i===CRED.length-1?2:1,OUT,'center');});
 txt('ОЧКИ: '+score,W/2,8,'#ffe14d',1,OUT,'center');}
function update(){pollGamepads();if(window.Online?.active){window.Online.update();if(state!=='pause')musicTick();for(const k in pressed)delete pressed[k];return;}if(state!=='pause')musicTick();if(!audioPanel.hidden){if(state==='title'&&!music&&AC)playMusic(M_TITLE);for(const k in pressed)delete pressed[k];return;}switch(state){
 case 'title':st++;if(!music&&AC)playMusic(M_TITLE);if(pressed.ArrowUp||pressed.KeyW)selectMode((modeCursor+2)%3);if(pressed.ArrowDown||pressed.KeyS)selectMode((modeCursor+1)%3);{const d=padInput.find(p=>p.dir===0||p.dir===2)?.dir??touchDirs.find(d=>d===0||d===2)??-1;if(d!==menuLastDir&&d>=0)selectMode((modeCursor+(d===0?2:1))%3);menuLastDir=d;}if(pressed.Digit1)selectMode(0);if(pressed.Digit2)selectMode(1);if(pressed.Digit3)selectMode(2);if(confirmP())newRun();break;
 case 'dialog':updDialog();break;
 case 'curtain':st++;frame++;if(st===1)playMusic(M_START,B_START,0.13,false);if(st>=150){setState('play');playLevelMusic(lvl);}break;
 case 'play':updPlay();break;
 case 'pause':st++;if(pressed.Escape){stopMusic();setState('title');clearInput();}else if(pressed.Enter||pressed.KeyP||pressed.Click)setState('play');break;
 case 'tally':st++;if(st>150&&confirmP()){stopMusic();nextAfterTally();}else if(confirmP())st=151;break;
 case 'gameover':st++;if(st>120&&confirmP()){runDialog(GAMEOVER_DLG,()=>{resetCrew();score=Math.floor(score/2);loadLevel(lvl);setState('curtain');});}break;
 case 'credits':st++;if(st>CRED.length*35+700||(st>60&&confirmP())){stopMusic();setState('title');}break;}
 for(const k in pressed)delete pressed[k];}
function draw(){ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);switch(state){
 case 'online':drawTitle();break;case 'title':drawTitle();break;case 'cutscene':window.Online?.drawCutscene();break;case 'dialog':if(dlg)drawDialog();break;case 'curtain':drawCurtain();break;case 'play':drawField();break;
 case 'pause':drawField();ctx.fillStyle='rgba(20,10,40,0.5)';ctx.fillRect(FX,FY,FS,FS);if(Math.floor(st/20)%2)txt('ПАУЗА',FX+FS/2,FY+90,['#fff','#fff','#ffd1ea','#ff9ad5','#ff6fbf','#e04aa8','#c43a8a'],2,OUT,'center');txt(coop?'ЗИНА И ФЁДОР ПЬЮТ ЧАЙ':'БАБУЛЯ ПЬЁТ ЧАЙ',FX+FS/2,FY+116,'#fff',1,OUT,'center');txt('ENTER - ИГРАТЬ  ESC - МЕНЮ',FX+FS/2,FY+134,'#ffe14d',1,OUT,'center');break;
 case 'tally':drawTally();break;case 'gameover':drawOver();break;case 'credits':if(window.Online?.active)window.Online.drawCredits();else drawCredits();break;}window.Online?.drawHUD();}
// ====== ЗАПУСК ======
buildSprites();buildPartnerSprites();buildBackdrops();buildFrame();
let last=performance.now(),acc=0;function loop(now){if(lifecycleBlocked){last=now;acc=0;draw();window.renderCRT?.(cv);requestAnimationFrame(loop);return;}acc+=Math.min(100,now-last);last=now;while(acc>=1000/60){update();acc-=1000/60;}draw();window.renderCRT?.(cv);requestAnimationFrame(loop);}requestAnimationFrame(loop);

// ====== ЖИЗНЕННЫЙ ЦИКЛ БРАУЗЕРНОЙ СБОРКИ ======
let lifecycleBlocked=document.hidden;
function clearInput(){for(const k in keys)delete keys[k];for(const k in pressed)delete pressed[k];keyOrder=[];touchDirs=[-1,-1];document.querySelectorAll('#pad .held,#coop-pad .held').forEach(b=>b.classList.remove('held'));document.querySelectorAll('.coop-stick span').forEach(s=>s.style.transform='');}
function syncSoundButton(){const b=document.getElementById('sound');b.textContent=muted?'ЗВУК: ВЫКЛ':'ЗВУК: ВКЛ';b.setAttribute('aria-pressed',String(!muted));}
function toggleSound(){muted=!muted;try{localStorage.setItem('vanna_muted',muted?'1':'0');}catch(e){}audioApply();saveAudioPrefs();syncSoundButton();}
function suspendGame(){clearInput();lifecycleBlocked=true;pauseMusicClock();if(window.Online?.active)window.Online.away(true);else if(state==='play')setState('pause');if(AC&&AC.state==='running')AC.suspend().catch(()=>{});}
function resumeLifecycle(){lifecycleBlocked=document.hidden;if(window.Online?.active&&!document.hidden)window.Online.away(false);if(!lifecycleBlocked&&state!=='pause')resumeMusicClock();last=performance.now();acc=0;}
addEventListener('blur',suspendGame);
addEventListener('focus',resumeLifecycle);
document.addEventListener('visibilitychange',()=>{if(document.hidden)suspendGame();else resumeLifecycle();});
addEventListener('pagehide',suspendGame);
addEventListener('pageshow',resumeLifecycle);
document.getElementById('sound').addEventListener('click',()=>{audioInit();toggleSound();cv.focus({preventScroll:true});});
document.getElementById('pause').addEventListener('click',()=>{audioInit();if(window.Online?.active){window.Online.action('pause');clearInput();cv.focus({preventScroll:true});return;}if(state==='play')setState('pause');else if(state==='pause')setState('play');clearInput();cv.focus({preventScroll:true});});
syncSoundButton();

// ====== АУДИОНАСТРОЙКИ ======
const audioPanel=document.getElementById('audio-panel'),audioToggle=document.getElementById('audio-toggle');
function refreshAudioUI(){
 document.getElementById('music-volume').value=Math.round(audioPrefs.music*100);
 document.getElementById('sfx-volume').value=Math.round(audioPrefs.sfx*100);
 document.getElementById('music-value').textContent=Math.round(audioPrefs.music*100)+'%';
 document.getElementById('sfx-value').textContent=Math.round(audioPrefs.sfx*100)+'%';
 document.getElementById('music-mode').value=audioPrefs.mode;
}
function closeAudioPanel(){audioPanel.hidden=true;audioToggle.setAttribute('aria-expanded','false');}
audioToggle.addEventListener('click',()=>{audioInit();audioPanel.hidden=!audioPanel.hidden;if(!audioPanel.hidden&&state==='play'){clearInput();if(!window.Online?.active)setState('pause');}audioToggle.setAttribute('aria-expanded',String(!audioPanel.hidden));});
document.getElementById('audio-close').addEventListener('click',()=>{closeAudioPanel();cv.focus({preventScroll:true});});
document.addEventListener('pointerdown',e=>{if(!audioPanel.hidden&&!audioPanel.contains(e.target)&&!audioToggle.contains(e.target))closeAudioPanel();});
addEventListener('keydown',e=>{if(e.code==='Escape'&&!audioPanel.hidden){closeAudioPanel();clearInput();cv.focus({preventScroll:true});}});
for(const [id,key] of [['music-volume','music'],['sfx-volume','sfx']])document.getElementById(id).addEventListener('input',e=>{audioInit();audioPrefs[key]=Number(e.target.value)/100;audioApply();saveAudioPrefs();refreshAudioUI();});
document.getElementById('music-mode').addEventListener('change',e=>{
 audioInit();audioPrefs.mode=e.target.value;audioApply();saveAudioPrefs();
 if(state==='play'||state==='pause'){playLevelMusic(lvl);if(state==='pause')pauseMusicClock();}
 else if(state==='title')playMusic(M_TITLE);
 else if(state==='credits')playMusic(M_END);
 else if(audioPrefs.mode==='off')stopMusic();
 cv.focus({preventScroll:true});
});
refreshAudioUI();

new ResizeObserver(()=>resize()).observe(document.getElementById('stage'));

addEventListener('keydown',e=>{
 if(e.repeat||e.target.closest?.('input,select'))return;
 if(e.code==='KeyF')document.getElementById('fullscreen').click();
 if(e.code==='KeyC')document.getElementById('crt-toggle').click();
 if(e.code==='KeyO'||e.code==='F1'){e.preventDefault();audioToggle.click();}
});

// Recover focus after fullscreen/embedded-frame transitions on a fresh gesture.
for(const event of ['pointerdown','keydown'])document.addEventListener(event,()=>{if(lifecycleBlocked&&!document.hidden)resumeLifecycle();},{capture:true});

audioToggle.addEventListener('click',()=>{document.getElementById('share-life').disabled=!coop||!!overT||!crew.some(c=>c.active&&c.lives===0)||!crew.some(c=>c.active&&c.tank&&c.lives>1);});
document.getElementById('share-life').addEventListener('click',()=>{if(window.Online?.active)window.Online.action('help');else shareLife();closeAudioPanel();cv.focus({preventScroll:true});});
