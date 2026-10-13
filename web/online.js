/* Authoritative online co-op. No invites, room codes, bots or peer hosting.
 * Clients send only directions/buttons; the server owns all gameplay state.
 */
(()=>{
 'use strict';
 const cfg=window.ONLINE_CONFIG||{},VERSION=cfg.version||'0.6.2';
 const panel=document.getElementById('net-panel'),title=document.getElementById('net-title'),desc=document.getElementById('net-description'),detail=document.getElementById('net-detail'),retry=document.getElementById('net-retry'),cancel=document.getElementById('net-cancel'),leave=document.getElementById('net-leave'),label=document.getElementById('online-status'),urlInput=document.getElementById('online-url');
 let active=false,phase='idle',ws=null,token=null,intentional=false,slot=0,epoch=0,seq=0,lastTick=-1,lastSound=0,ready=[false,false],pauses=[false,false],rtt=0;
 let began=0,retryTimer=null,attempt=0,reconnectUntil=0,previous=null,latest=null,received=0,pingAt=0,lastFrame=0,statusPhase='',endpointUsed='',connectionUntil=0;
 const send=m=>{if(ws?.readyState===WebSocket.OPEN)ws.send(JSON.stringify(m));};
 try{urlInput.value=localStorage.getItem('vanna_online_url')||cfg.endpoint||'';}catch{urlInput.value=cfg.endpoint||'';}
 urlInput.addEventListener('change',()=>{if(active){urlInput.value=endpointUsed;return;}try{localStorage.setItem('vanna_online_url',urlInput.value.trim());}catch{}});
 function endpoint(){
  const explicit=urlInput.value.trim();if(explicit){const u=new URL(explicit);if(!['ws:','wss:'].includes(u.protocol)||u.username||u.password)throw Error('Укажите адрес сервера ws:// или wss://.');if(location.protocol==='https:'&&u.protocol!=='wss:')throw Error('Для HTTPS нужен защищённый сервер wss://.');return u.href;}
  if(cfg.autoEndpoint===false||!['http:','https:'].includes(location.protocol))throw Error('Онлайн требует опубликованного сервера. Откройте игру на сайте сервера или укажите его адрес в настройках.');
  return (location.protocol==='https:'?'wss://':'ws://')+location.host+'/online';
 }
 function status(text){if(label.textContent!==text)label.textContent=text;}
 function show(t,d,extra='',canRetry=false){panel.hidden=false;title.textContent=t;desc.textContent=d;detail.textContent=extra;retry.hidden=!canRetry;cancel.textContent=canRetry?'В МЕНЮ':'ОТМЕНА';}
 function setupUI(){document.body.classList.add('online');document.body.classList.remove('coop');leave.hidden=false;urlInput.disabled=true;resize();}
 function restoreUI(){document.body.classList.remove('online');leave.hidden=true;urlInput.disabled=false;document.querySelector('#pad .start').textContent='START';selectMode(2);resize();}
 function closeSocket(){intentional=true;clearTimeout(retryTimer);if(ws){ws.close();ws=null;}}
 function menu(){send({type:phase==='queued'||phase==='connecting'?'cancel':'leave'});active=false;phase='idle';closeSocket();panel.hidden=true;latest=previous=null;clearInput();stopMusic();setState('title');restoreUI();status('ОНЛАЙН: НЕ ПОДКЛЮЧЁН');cv.focus({preventScroll:true});}
 function join(){
  closeSocket();intentional=false;active=true;phase='connecting';began=Date.now();attempt=0;seq=0;lastTick=-1;lastSound=0;latest=previous=null;statusPhase='';clearInput();closeAudioPanel();stopMusic();setState('online');setupUI();
  show('ИЩЕМ НАПАРНИКА','Соединяемся с очередью. Матч начнётся автоматически, когда появится второй игрок.');status('ОНЛАЙН: ПОДКЛЮЧЕНИЕ');
  let ep;try{ep=endpoint();}catch(e){phase='error';show('НУЖЕН СЕРВЕР',e.message,'Одиночный и локальный режимы доступны без сервера.',true);status('ОНЛАЙН: СЕРВЕР НЕ НАСТРОЕН');return;}
  if(endpointUsed!==ep)token=null;endpointUsed=ep;connectionUntil=Date.now()+Math.max(10000,Math.min(120000,Number(cfg.connectTimeoutMs)||90000));connect();
 }
 function fail(text){phase='error';closeSocket();show('СЕРВЕР НЕДОСТУПЕН',text,'Это не очередь с ботами: для матча нужны два подключённых игрока.',true);status('ОНЛАЙН: НЕТ СОЕДИНЕНИЯ');}
 function connect(){
  intentional=false;let socket;try{socket=new WebSocket(endpointUsed);}catch(e){fail('Некорректный адрес сервера. Проверьте его в настройках.');return;}ws=socket;
  const watchdog=setTimeout(()=>{if(socket===ws&&socket.readyState===WebSocket.CONNECTING){socket.close();}},8000);
  socket.onopen=()=>{clearTimeout(watchdog);send({type:'hello',version:VERSION,token});};
  socket.onerror=()=>{};
  socket.onmessage=e=>{
   if(socket!==ws||!active)return;let m;try{m=JSON.parse(e.data);}catch{return;}
   if(m.type==='welcome'){token=m.token;attempt=0;seq=0;if(phase==='reconnecting'&&latest&&!m.resumed){phase='ended';clearInput();stopMusic();show('СЕРВЕР ПЕРЕЗАПУЩЕН','Предыдущий матч не сохранился.','Можно снова встать в очередь.',true);status('ОНЛАЙН: МАТЧ ЗАВЕРШЁН');return;}send({type:'join'});return;}
   if(m.type==='queue'){phase='queued';show('ИЩЕМ НАПАРНИКА','Вы в очереди. Как только подключится ещё один игрок, вы начнёте вместе.',`Игроков в очереди: ${m.waiting}`);status('ОНЛАЙН: ПОИСК НАПАРНИКА');return;}
   if(m.type==='matched'){
    phase='matched';slot=m.slot;seq=0;lastTick=-1;previous=null;latest=null;if(!m.resumed)lastSound=0;clearInput();coop=true;panel.hidden=true;document.querySelector('#pad .start').textContent='ГОТОВ';status(`ОНЛАЙН: ВЫ ${slot?'2P ФЁДОР':'1P ЗИНА'}`);if(document.hidden)send({type:'away',value:true});return;
   }
   if(m.type==='snapshot'){if(!Number.isSafeInteger(m.tick)||m.tick<lastTick)return;lastTick=m.tick;previous=latest;latest=m.data;received=performance.now();epoch=latest.epoch;ready=latest.ready;pauses=latest.pauses;apply(latest);
    if(m.disconnected?.some(Boolean)){phase='partner_wait';show('ПАРТНЁР ОТКЛЮЧИЛСЯ','Матч на паузе. Даём напарнику 20 секунд для возвращения.','Если он не вернётся, можно снова встать в очередь.');}
    else if(phase==='partner_wait'||phase==='matched'){phase='matched';panel.hidden=true;}
    return;
   }
   if(m.type==='partner_offline'){phase='partner_wait';clearInput();return;}
   if(m.type==='partner_back'){phase='matched';panel.hidden=true;return;}
   if(m.type==='pong'){if(Number.isFinite(m.at))rtt=Math.round(performance.now()-m.at);return;}
   if(m.type==='ended'){
    phase='ended';clearInput();stopMusic();const messages={partner_left:'Напарник вышел из матча.',partner_timeout:'Напарник не вернулся. Этот матч завершён.',completed:'Торт спасён! Кампания пройдена вдвоём.',idle_timeout:'Матч завершён из-за долгого простоя.',queue_timeout:'Время ожидания истекло.',server_restart:'Сервер перезапускается.',server_error:'Сервер завершил матч из-за ошибки.'};
    show(m.reason==='completed'?'ПОБЕДА!':'МАТЧ ЗАВЕРШЁН',messages[m.reason]||'Матч завершён.','Нажмите «В очередь» — найдём нового напарника.',true);status('ОНЛАЙН: МАТЧ ЗАВЕРШЁН');return;
   }
   if(m.type==='error'){fail(m.message||'Ошибка соединения с сервером.');return;}
   if(m.type==='cancelled')menu();
  };
  socket.onclose=e=>{
   clearTimeout(watchdog);if(socket!==ws||intentional||!active)return;ws=null;
   if(phase==='connecting'){const left=connectionUntil-Date.now();if(left<=0){fail('Сервер не ответил за 90 секунд. Проверьте публикацию и попробуйте ещё раз.');return;}show('ЗАПУСКАЕМ СЕРВЕР','Бесплатный сервер Render может просыпаться около минуты. Подключимся автоматически.','Ожидание можно отменить.');const delay=Math.min(4000,500*2**Math.min(4,attempt++));retryTimer=setTimeout(connect,Math.min(delay,left));return;}
   if(['ended','error','idle'].includes(phase))return;
   if(phase!=='reconnecting')reconnectUntil=Date.now()+19000;
   phase='reconnecting';clearInput();show('ВОССТАНАВЛИВАЕМ СВЯЗЬ','Матч временно остановлен. Пытаемся вернуть соединение.','Можно отменить и вернуться в меню.');status('ОНЛАЙН: ПЕРЕПОДКЛЮЧЕНИЕ');
   const delay=Math.min(4000,500*2**attempt++);if(Date.now()+delay>=reconnectUntil){phase='ended';token=null;show('СВЯЗЬ ПОТЕРЯНА','Не удалось вернуться в матч.','Можно снова встать в очередь.',true);return;}
   retryTimer=setTimeout(connect,delay);
  };
 }
 function musicFor(newState,oldState){
  if(newState===oldState)return;statusPhase=newState;
  if(newState==='pause'){pauseMusicClock();return;}if(oldState==='pause')resumeMusicClock();
  if(newState==='play')playLevelMusic(lvl);
  else if(newState==='curtain')playMusic(M_START,B_START,.13,false);
  else if(newState==='tally')playMusic(M_WIN,B_WIN,.12,false);
  else if(newState==='gameover')playMusic(M_OVER,B_OVER,.25,false);
  else if(newState==='credits')playMusic(M_END,B_END,.2,true);else stopMusic();
 }
 function apply(s){
  const oldState=state;state=s.state;document.querySelector('#pad .start').textContent=state==='cutscene'?'ПРОПУСК':['play','pause'].includes(state)?'ПАУЗА':'START';st=s.st;lvl=s.lvl;score=s.score;hiscore=s.hiscore;frame=s.frame;if(s.gridEncoding==='base64'){const raw=atob(s.G);for(let i=0;i<G.length;i++)G[i]=raw.charCodeAt(i);}else G.set(s.G);
  // Clone rendered objects: interpolation must never modify the last network snapshot.
  crew=s.crew.map(c=>({...c,tank:c.tank?{...c.tank}:null}));enemies=s.enemies.map(e=>({...e}));bullets=s.bullets.map(b=>({...b}));boss=s.boss?{...s.boss}:null;
  parts=s.parts;floats=s.floats;pastries=s.pastries;powerups=s.powerups;queue=s.queue;freeze=s.freeze;panT=s.panT;baseAlive=s.baseAlive;levelEnd=s.levelEnd;killed=s.killed;overT=s.overT;bossDie=s.bossDie;shake=s.shake;dlg=s.dlg;
  musicFor(state,oldState);for(const ev of s.sounds){if(ev.id<=lastSound)continue;lastSound=ev.id;if(typeof SFX[ev.name]==='function')SFX[ev.name](...(ev.args||[]));}
  if(s.score>0){try{localStorage.setItem((window.Platform?.storageKey('vanna_hi_online')||'vanna_hi_online'),String(Math.max(s.score,+localStorage.getItem((window.Platform?.storageKey('vanna_hi_online')||'vanna_hi_online'))||0)));}catch{}}
 }
 function direction(){if(touchDirs[0]>=0)return touchDirs[0];const map={...MAP_WASD,...MAP_ARROWS};for(let i=keyOrder.length-1;i>=0;i--)if(keys[keyOrder[i]]&&keyOrder[i] in map)return map[keyOrder[i]];return padInput[0]?.dir??-1;}
 function action(a){if(phase==='matched')send({type:'action',action:a,epoch});}
 function away(value){if(active&&ws?.readyState===WebSocket.OPEN){send({type:'away',value});send({type:'input',seq:seq++,dir:-1,fire:false});}}
 function update(){
  if(!active)return;
  if(pressed.Escape&&['connecting','queued','error','ended','reconnecting','partner_wait'].includes(phase)){menu();return;}
  if(phase!=='matched')return;
  if(pressed.KeyR)action('help');
  if(audioPanel.hidden){if(state==='cutscene'){if(pressed.Escape||pressed.Enter||pressed.PadConfirm)action('skip');}else if(pressed.Escape&&state==='pause'){menu();return;}else if(state==='play'||state==='pause'){if(pressed.Enter||pressed.KeyP)action('pause');}else if(confirmP())action('confirm');}
  // Snapshot interpolation: up to 100ms render delay, not untrusted client-side simulation.
  if(previous&&latest&&previous.epoch===latest.epoch&&state==='play'){
   const a=Math.max(0,Math.min(1,(performance.now()-received)/100));
   crew.forEach((c,id)=>{const p=previous.crew[id]?.tank,n=latest.crew[id]?.tank;if(c.tank&&p&&n&&Math.hypot(n.x-p.x,n.y-p.y)<8){c.tank.x=p.x+(n.x-p.x)*a;c.tank.y=p.y+(n.y-p.y)*a;}});
  }
 }
 function drawCutscene(){
  if(!dlg||!dlg.lines?.[dlg.i])return;
  const L=dlg.lines[dlg.i],age=Math.min(L.d,dlg.segmentT+(performance.now()-received)*.06);
  drawScene(L.s||dlg.scene||'town',dlg.t);if(L.s==='yard')ctx.drawImage(SPR.tub2[0][Math.floor(age/8)%2][1],126+Math.sin(age*.04)*2,99,40,40);
  // Letterboxed scene, animated cast, short full-text caption: no typing effect.
  ctx.fillStyle='#100c1b';ctx.fillRect(0,0,W,14);ctx.fillRect(0,146,W,94);
  txt('ОНЛАЙН · СЮЖЕТ',12,4,'#8fe9f1',1,OUT);txt((dlg.i+1)+'/'+dlg.lines.length,308,4,'#c8b8ff',1,OUT,'right');
  txt(dlg.label||'ДВЕ ВАННЫ',160,153,'#ffe14d',1,OUT,'center');
  const speaker=L.w?SPK[L.w]:null;let tx=16,n=47;
  if(speaker&&POR[L.w]){ctx.fillStyle=speaker.bg;ctx.fillRect(10,169,44,44);ctx.drawImage(POR[L.w],12,171,40,40);tx=65;n=40;txt(speaker.n,tx,171,speaker.c,1,OUT);}
  const lines=wrap(L.t,n);const y=speaker?185:181;for(let i=0;i<lines.length;i++)txt(lines[i],tx,y+i*12,'#fff',1,OUT);
  const localAge=Math.min(dlg.total,dlg.t+Math.max(0,age-dlg.segmentT)),left=Math.max(0,Math.ceil((dlg.total-localAge)/60));
  ctx.fillStyle='#322448';ctx.fillRect(12,219,296,2);ctx.fillStyle='#8fe9f1';ctx.fillRect(12,219,296*Math.max(0,1-localAge/dlg.total),2);
  txt('ESC / ENTER - ПРОПУСК',12,229,'#b5a8ce',1,OUT);txt(left+'С',308,229,'#8fe9f1',1,OUT,'right');
  const fade=Math.max(0,1-Math.min(age/12,(L.d-age)/12));if(fade>0){ctx.fillStyle='rgba(8,5,16,'+Math.min(.8,fade)+')';ctx.fillRect(0,14,W,132);}
 }
 function drawOnlineCredits(){
  drawScene('party',st);ctx.fillStyle='rgba(17,10,36,.48)';ctx.fillRect(0,0,W,H);
  txt('ТОРТ СПАСЁН!',160,24,['#fff6a8','#ffe14d','#ffd36b','#ffb000','#ff8c1a','#ff5f3a','#ff3b5c'],3,OUT,'center');
  txt('ЗИНА И ФЁДОР ЗАЩИТИЛИ ПРАЗДНИК',160,58,'#fff',1,OUT,'center');
  txt('ОБЩИЙ СЧЁТ: '+score,160,188,'#8fe9f1',2,OUT,'center');
 }
 function drawHUD(){
  if(!active||!latest||!['matched','partner_wait','reconnecting'].includes(phase))return;
  if(['play','pause','curtain'].includes(state)){
   ctx.fillStyle='#291541';ctx.fillRect(10,228,304,12);txt(`ВЫ ${slot+1}P ${slot?'ФЁДОР':'ЗИНА'}   ПРОБЕЛ - ОГОНЬ`,12,231,slot?'#8fe9f1':'#ff9ad5',1,OUT);txt(rtt+'MS',310,231,'#c8b8ff',1,OUT,'right');
  }
  if(['tally','gameover','credits'].includes(state)){
   ctx.fillStyle='#171026';ctx.fillRect(0,225,320,15);
   const left=Math.max(0,Math.ceil(((state==='gameover'?150:180)-st)/60));
   txt(state==='credits'?'ПОБЕДА! МАТЧ ЗАВЕРШИТСЯ ЧЕРЕЗ '+left+'С':state==='tally'?'СЛЕДУЮЩИЙ БОЙ ЧЕРЕЗ '+left+'С':'ЗАПАСНЫЕ ВАННЫ ЧЕРЕЗ '+left+'С',160,230,'#8fe9f1',1,OUT,'center');
  }
  if(state==='pause'){
   ctx.fillStyle='#25152be8';ctx.fillRect(FX+6,FY+106,FS-12,51);
   txt(pauses[slot]?'ВЫ ПРИОСТАНОВИЛИ МАТЧ':'ЖДЁМ НАПАРНИКА',FX+FS/2,FY+112,'#8fe9f1',1,OUT,'center');
   txt('ENTER - СНЯТЬ СВОЮ ПАУЗУ',FX+FS/2,FY+129,'#fff',1,OUT,'center');txt('ESC - ВЫЙТИ ИЗ МАТЧА',FX+FS/2,FY+143,'#ffd36b',1,OUT,'center');
  }
 }
 const pump=setInterval(()=>{
  if(!active)return;
  if(phase==='queued')detail.textContent=`Ожидание ${Math.floor((Date.now()-began)/1000)} с · матч запустится автоматически`;
  if(phase==='matched'){
   const blocked=document.hidden||!audioPanel.hidden||state!=='play';send({type:'input',seq:seq++,dir:blocked?-1:direction(),fire:!blocked&&!!(keys.Space||keys.KeyJ||keys.KeyZ||keys.ShiftRight||padInput[0]?.fire)});
   if(performance.now()-pingAt>2000){pingAt=performance.now();send({type:'ping',at:pingAt});}
   if(latest&&performance.now()-received>5000){ws?.close();}
  }
 },33);
 retry.addEventListener('click',join);cancel.addEventListener('click',menu);leave.addEventListener('click',()=>{menu();closeAudioPanel();});
 window.Online={join,menu,update,drawHUD,drawCutscene,drawCredits:drawOnlineCredits,away,action,get active(){return active;},get phase(){return phase;},get slot(){return slot;},get tick(){return lastTick;},get ready(){return ready;}};
})();
