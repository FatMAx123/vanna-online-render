'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {WebSocketServer,WebSocket}=require('ws'),createSimulation=require('./simulation.cjs');
const VERSION='0.6.2',ROOT=path.resolve(__dirname,'../web');
const PORT=Number(process.env.PORT||8080),HOST=process.env.HOST||'0.0.0.0';
const MAX_ROOMS=Number(process.env.MAX_ROOMS||40),MAX_CLIENTS=Number(process.env.MAX_CLIENTS||200);
const MAX_PER_IP=Number(process.env.MAX_PER_IP||12);
const remoteIP=req=>process.env.TRUST_PROXY==='1'&&typeof req.headers['x-forwarded-for']==='string'?req.headers['x-forwarded-for'].split(',').at(-1).trim():req.socket.remoteAddress||'unknown';
const GRACE_MS=Number(process.env.GRACE_MS||20000),INPUT_TTL=450;
const allowedOrigins=(process.env.ALLOWED_ORIGINS||process.env.RENDER_EXTERNAL_URL||'').split(',').map(x=>x.trim()).filter(Boolean);
const snapshotEvery=Math.max(3,Math.round(60/Math.max(5,Math.min(20,Number(process.env.SNAPSHOT_HZ)||20))));
const sessions=new Map(),rooms=new Map(),queue=[],ipCount=new Map();
let shuttingDown=false;
function send(s,m){if(s?.ws?.readyState!==WebSocket.OPEN)return;if(s.ws.bufferedAmount>512*1024){s.ws.close(1013,'slow client');return;}if(s.ws.bufferedAmount<256*1024)s.ws.send(JSON.stringify(m));}
function removeQueue(s){let i;while((i=queue.indexOf(s))>=0)queue.splice(i,1);if(s.status==='queued')s.status='idle';}
function tellQueue(){queue.forEach((s,i)=>send(s,{type:'queue',position:i+1,waiting:queue.length}));}
function broadcast(room,m){room.players.forEach(s=>send(s,m));}
function publish(room){const data=room.sim.snapshot();data.G=Buffer.from(data.G).toString('base64');data.gridEncoding='base64';broadcast(room,{type:'snapshot',tick:room.tick,data,disconnected:room.players.map(s=>!s.ws)});}
function endRoom(room,reason){if(!rooms.has(room.id))return;rooms.delete(room.id);for(const s of room.players){s.room=null;s.status='idle';s.slot=null;clearTimeout(s.grace);send(s,{type:'ended',reason});if(!s.ws)sessions.delete(s.token);}matchQueue();}
function matchQueue(){
 if(shuttingDown)return;
 while(queue.length>=2&&rooms.size<MAX_ROOMS){
  const players=queue.splice(0,2);if(players.some(s=>!s.ws||s.status!=='queued')){for(const s of players)if(s.ws&&s.status==='queued')queue.unshift(s);continue;}
  let sim;try{sim=createSimulation();}catch(e){players.forEach(s=>{s.status='idle';send(s,{type:'error',code:'server',message:'Не удалось запустить матч. Попробуйте ещё раз.'});});console.error('Simulation initialization failed',e);continue;}
  const room={id:crypto.randomUUID(),players,sim,tick:0,publishedTick:-3,last:performance.now(),acc:0,created:Date.now(),lastActivity:Date.now(),away:[false,false],pendingPause:[false,false]};rooms.set(room.id,room);
  players.forEach((s,slot)=>{s.status='matched';s.slot=slot;s.room=room;s.lastSeq=-1;s.lastInput=0;send(s,{type:'matched',slot,version:VERSION});});publish(room);
 }
 tellQueue();
}
function enqueue(s){if(s.room||s.status==='queued')return;s.status='queued';s.queuedAt=Date.now();queue.push(s);send(s,{type:'queue',position:queue.length,waiting:queue.length});matchQueue();}
function disconnect(s,ws){if(s.ws!==ws)return;s.ws=null;removeQueue(s);if(s.room){const room=s.room;room.sim.input(s.slot,{dir:-1,fire:false});room.sim.setPaused(s.slot,true);room.pendingPause[s.slot]=true;broadcast(room,{type:'partner_offline',graceMs:GRACE_MS});publish(room);s.grace=setTimeout(()=>{if(!s.ws&&s.room===room)endRoom(room,'partner_timeout');if(!s.ws)sessions.delete(s.token);},GRACE_MS);}else{s.grace=setTimeout(()=>{if(!s.ws)sessions.delete(s.token);},GRACE_MS);matchQueue();}}
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://local');
 if(u.pathname==='/config.js'){const id=Number(process.env.VKPLAY_GMRID);res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end('window.VKPLAY_CONFIG=Object.freeze('+JSON.stringify({gmrid:Number.isSafeInteger(id)&&id>0?id:null,sdkTimeoutMs:10000})+');window.ONLINE_CONFIG=Object.freeze('+JSON.stringify({version:VERSION,endpoint:'',autoEndpoint:true,connectTimeoutMs:90000})+');');return;}
 if(u.pathname==='/health'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({ok:true,version:VERSION,queue:queue.length,matches:rooms.size}));return;}
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
 let decoded;try{decoded=decodeURIComponent(u.pathname);}catch{res.writeHead(400);res.end();return;}
 const file=path.resolve(ROOT,'.'+(decoded==='/'?'/index.html':decoded));
 if(!file.startsWith(ROOT+path.sep)){res.writeHead(403);res.end();return;}
 const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
 if(!types[path.extname(file)]){res.writeHead(404);res.end();return;}
 fs.stat(file,(err,stat)=>{if(err||!stat.isFile()){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':types[path.extname(file)],'Content-Length':stat.size,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res);});
});
const wss=new WebSocketServer({noServer:true,maxPayload:1024,perMessageDeflate:false});
server.on('upgrade',(req,socket,head)=>{
 let u;try{u=new URL(req.url,'http://local');}catch{socket.destroy();return;}
 const ip=remoteIP(req);
 if(u.pathname!=='/online'||shuttingDown||wss.clients.size>=MAX_CLIENTS||(ipCount.get(ip)||0)>=MAX_PER_IP||(allowedOrigins.length&&!allowedOrigins.includes(req.headers.origin))){socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');return;}
 wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req));
});
wss.on('connection',(ws,req)=>{
 const ip=remoteIP(req);ipCount.set(ip,(ipCount.get(ip)||0)+1);
 let session=null,rateCount=0,rateAt=Date.now(),bad=0;ws.alive=true;
 const helloTimer=setTimeout(()=>{if(!session)ws.close(1008,'hello required');},5000);
 ws.on('pong',()=>ws.alive=true);
 ws.on('message',(buf,isBinary)=>{
 if(isBinary){ws.close(1008,'text only');return;}
 const now=Date.now();if(now-rateAt>=1000){rateAt=now;rateCount=0;}if(++rateCount>90){ws.close(1008,'rate limit');return;}
 let m;try{m=JSON.parse(buf.toString());if(!m||typeof m!=='object'||Array.isArray(m))throw Error();}catch{if(++bad>=3)ws.close(1008,'invalid message');return;}
 if(!session){
  if(m.type!=='hello'||m.version!==VERSION){ws.send(JSON.stringify({type:'error',code:'version',message:'Обновите страницу: версия клиента не совпадает с сервером.'}));ws.close(1008,'version mismatch');return;}
  const resumed=typeof m.token==='string'&&sessions.get(m.token);
  if(!resumed&&sessions.size>=MAX_CLIENTS){ws.send(JSON.stringify({type:'error',code:'capacity',message:'Сервер заполнен. Попробуйте позже.'}));ws.close(1013,'capacity');return;}
  if(resumed?.ws){ws.close(1008,'session busy');return;}
  session=resumed||{token:crypto.randomBytes(32).toString('base64url'),status:'idle',room:null,slot:null,ws:null};
  session.ws=ws;clearTimeout(session.grace);session.grace=null;sessions.set(session.token,session);clearTimeout(helloTimer);
  send(session,{type:'welcome',token:session.token,version:VERSION,resumed:!!resumed});
  if(session.room){const room=session.room;room.pendingPause[session.slot]=false;room.away[session.slot]=false;room.sim.setPaused(session.slot,false);session.lastSeq=-1;session.lastInput=0;send(session,{type:'matched',slot:session.slot,version:VERSION,resumed:true});broadcast(room,{type:'partner_back'});publish(room);}
  return;
 }
 const s=session;if(s.ws!==ws)return;
 if(m.type==='join'){enqueue(s);return;}
 if(m.type==='cancel'){removeQueue(s);send(s,{type:'cancelled'});matchQueue();return;}
 if(m.type==='leave'){if(s.room)endRoom(s.room,'partner_left');else removeQueue(s);return;}
 if(m.type==='ping'){send(s,{type:'pong',at:m.at});return;}
 if(!s.room)return;
 const room=s.room,slot=s.slot;
 if(m.type==='input'){
  if(!Number.isSafeInteger(m.seq)||m.seq<0||m.seq<=s.lastSeq||!Number.isInteger(m.dir)||m.dir< -1||m.dir>3||typeof m.fire!=='boolean')return;
  s.lastSeq=m.seq;s.lastInput=now;
  if(!room.away[slot])room.sim.input(slot,{dir:m.dir,fire:m.fire});if(m.dir>=0||m.fire)room.lastActivity=now;return;
 }
 if(m.type==='away'&&typeof m.value==='boolean'){room.away[slot]=m.value;room.pendingPause[slot]=m.value;room.sim.setPaused(slot,m.value);return;}
 if(m.type==='action'&&['confirm','skip','pause','help'].includes(m.action)&&Number.isSafeInteger(m.epoch)){
  if(room.away[slot]||!room.players.every(p=>p.ws))return;
  room.sim.action(slot,m.action,m.epoch);room.lastActivity=now;publish(room);
 }
 });
 ws.on('close',()=>{clearTimeout(helloTimer);ipCount.set(ip,Math.max(0,(ipCount.get(ip)||1)-1));if(session)disconnect(session,ws);});
 ws.on('error',()=>{});
});
const ticker=setInterval(()=>{
 const now=performance.now(),wall=Date.now();
 for(const room of rooms.values()){
  if(wall-room.created>2*60*60*1000||wall-room.lastActivity>5*60*1000){endRoom(room,'idle_timeout');continue;}
  room.acc+=Math.min(100,now-room.last);room.last=now;
  try{while(room.acc>=1000/60){
   const state=room.sim.state;
   if(state==='play'||state==='pause')room.pendingPause.forEach((p,id)=>{if(p)room.sim.setPaused(id,true);});
   room.players.forEach(s=>{if(!s.ws||wall-s.lastInput>INPUT_TTL)room.sim.input(s.slot,{dir:-1,fire:false});});
   room.sim.tick();room.tick++;room.acc-=1000/60;
   if(room.sim.done){endRoom(room,'completed');break;}
  }
  if(rooms.has(room.id)&&room.tick-room.publishedTick>=snapshotEvery){room.publishedTick=room.tick;publish(room);}
  }catch(e){console.error('Match failed',e);endRoom(room,'server_error');}
 }
},1000/60);
const heartbeat=setInterval(()=>{
 for(const ws of wss.clients){if(!ws.alive){ws.terminate();continue;}ws.alive=false;ws.ping();}
 for(const s of sessions.values())if(s.status==='queued'&&Date.now()-s.queuedAt>15*60*1000){removeQueue(s);send(s,{type:'ended',reason:'queue_timeout'});}
 tellQueue();
},10000);
function shutdown(){if(shuttingDown)return;shuttingDown=true;clearInterval(ticker);clearInterval(heartbeat);for(const r of [...rooms.values()])endRoom(r,'server_restart');for(const s of sessions.values()){clearTimeout(s.grace);s.ws?.close(1001,'server shutting down');}server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),2000).unref();}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
server.listen(PORT,HOST,()=>console.log(`Vanna ${VERSION} listening on ${HOST}:${PORT}`));
