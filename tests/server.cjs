'use strict';
const assert=require('node:assert/strict'),{spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const WebSocket=require('ws'),PORT=8086,BASE=`http://127.0.0.1:${PORT}`,VERSION='0.6.2',checks=[];
const proc=spawn(process.execPath,[path.join(__dirname,'../server/server.cjs')],{env:{...process.env,HOST:'127.0.0.1',PORT:String(PORT),GRACE_MS:'700',MAX_ROOMS:'2',ALLOWED_ORIGINS:BASE},stdio:['ignore','pipe','pipe']});
let serverErrors='';proc.stderr.on('data',d=>serverErrors+=d);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,timeout=4000){const t=Date.now();while(Date.now()-t<timeout){const x=await fn();if(x)return x;await sleep(15);}throw Error('Timeout');}
const clients=[];
async function client(token,version=VERSION){
 const ws=new WebSocket(`ws://127.0.0.1:${PORT}/online`,{origin:BASE});const c={ws,messages:[],send:x=>ws.send(JSON.stringify(x)),find:t=>c.messages.find(m=>m.type===t),latest:t=>c.messages.filter(m=>m.type===t).at(-1)};
 clients.push(c);ws.on('message',d=>c.messages.push(JSON.parse(d)));ws.on('error',()=>{});await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j)});c.send({type:'hello',version,token});await until(()=>c.find('welcome')||c.find('error'));return c;
}
const health=async()=>await(await fetch(BASE+'/health')).json();
(async()=>{
 await until(async()=>{try{return (await health()).ok;}catch{return false;}});
 const a=await client();a.send({type:'join'});await until(()=>a.find('queue'));assert.equal(a.find('matched'),undefined);checks.push('One player waits in queue; server never invents a partner');
 for(let i=0;i<20;i++)a.send({type:'join'});await sleep(80);assert.equal((await health()).queue,1);checks.push('Duplicate join does not duplicate queue membership');
 a.send({type:'cancel'});await until(()=>a.find('cancelled'));assert.equal((await health()).queue,0);a.send({type:'join'});
 const b=await client();b.send({type:'join'});await until(()=>a.find('matched')&&b.find('matched'));assert.deepEqual([a.find('matched').slot,b.find('matched').slot],[0,1]);checks.push('FIFO auto-pair assigns distinct authoritative slots');
 const c=await client(),d=await client();c.send({type:'join'});d.send({type:'join'});await until(()=>d.find('matched'));assert.equal((await health()).matches,2);checks.push('Two parallel matches are isolated');
 const e=await client(),f=await client();e.send({type:'join'});f.send({type:'join'});await sleep(100);assert.equal((await health()).queue,2);assert.equal(e.find('matched'),undefined);checks.push('When room capacity is full, players stay in queue instead of failing');
 const snap=await until(()=>a.latest('snapshot'));let ep=snap.data.epoch;
 assert.equal(snap.data.state,'cutscene');
 a.send({type:'action',action:'skip',epoch:ep-1});await sleep(80);assert.equal(a.latest('snapshot').data.state,'cutscene');checks.push('Stale cinematic skip rejected');
 a.send({type:'action',action:'skip',epoch:ep});await until(()=>a.latest('snapshot').data.state==='play');await until(()=>b.latest('snapshot').data.state==='play');checks.push('One player skips the cinematic for both clients; no two-player vote');
 const initial=a.latest('snapshot').data.crew.map(c=>c.tank.y);a.send({type:'input',seq:1,dir:0,fire:true,pid:1,x:99999,score:99999,lives:999});await sleep(150);
 const s=a.latest('snapshot').data;assert.ok(s.crew[0].tank.y<initial[0]);assert.equal(s.crew[1].tank.y,initial[1]);assert.equal(s.crew[0].lives,3);assert.ok(s.score<99999);checks.push('Client can control only assigned player: injected score, lives and coordinates ignored');
 a.send({type:'input',seq:0,dir:2,fire:false});await sleep(90);assert.ok(a.latest('snapshot').data.crew[0].tank.y<s.crew[0].tank.y);checks.push('Out-of-order input sequence cannot overwrite newer controls');
 await sleep(700);const stopped=a.latest('snapshot').data.crew[0].tank.y;await sleep(150);assert.equal(a.latest('snapshot').data.crew[0].tank.y,stopped);checks.push('Missing input automatically neutralizes held movement/fire');
 const token=b.find('welcome').token;b.ws.terminate();await until(()=>a.find('partner_offline'));assert.equal(a.latest('snapshot').data.state,'pause');
 const resumed=await client(token);await until(()=>resumed.find('matched'));assert.equal(resumed.find('welcome').resumed,true);assert.equal(resumed.find('matched').slot,1);await until(()=>a.latest('snapshot').data.state==='play');checks.push('Reconnect bearer token restores the same player and room during grace');
 resumed.ws.terminate();await until(()=>a.find('ended'));assert.equal(a.find('ended').reason,'partner_timeout');await until(()=>e.find('matched'));assert.equal((await health()).queue,0);checks.push('Disconnect timeout ends old room and immediately pairs waiting players');
 c.send({type:'leave'});await until(()=>d.find('ended'));assert.equal(d.find('ended').reason,'partner_left');checks.push('Explicit leave notifies partner; no forced auto-requeue');
 const bad=await client(undefined,'obsolete');assert.equal(bad.find('error').code,'version');checks.push('Version mismatch rejected before matchmaking');
 const invalid=await client();for(let i=0;i<3;i++)invalid.ws.send('{not json');await until(()=>invalid.ws.readyState===WebSocket.CLOSED);checks.push('Malformed JSON is contained and connection is closed');
 const oversized=await client();oversized.ws.send('x'.repeat(2000));await until(()=>oversized.ws.readyState===WebSocket.CLOSED);checks.push('Oversized packets rejected by WebSocket maxPayload');
 assert.equal(serverErrors,'');checks.push('No server exceptions during tests');
 fs.writeFileSync(path.join(__dirname,'../docs/server-results.json'),JSON.stringify({checks,errors:serverErrors,limitations:'Local test. Guest session tokens are reconnect credentials, NOT verified VK Play identities. No production DDoS, load or moderation test.'},null,2));console.log({checks:checks.length,errors:serverErrors});
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{for(const c of clients)c.ws.terminate();proc.kill('SIGTERM');});
