// Local contract tests with the REAL vendored SDK and a mocked platform parent.
// These do not claim real VK / OK approval or production handshake validation.
const assert=require('node:assert/strict'),{chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const root=path.resolve(__dirname,'../web');
 const server=http.createServer((req,res)=>{
  let file;try{const pathname=decodeURIComponent(new URL(req.url,'http://test').pathname);file=pathname==='/test-parent.html'?path.join(__dirname,'fixtures/platform-parent.html'):path.resolve(root,'.'+pathname);if(pathname!=='/test-parent.html'&&!file.startsWith(root+path.sep))throw Error();}catch{res.writeHead(400);res.end();return;}
  fs.readFile(file,(e,data)=>{if(e){res.writeHead(404);res.end();return;}const type={'.html':'text/html','.js':'application/javascript','.css':'text/css'}[path.extname(file)]||'application/octet-stream';res.writeHead(200,{'Content-Type':type});res.end(data);});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/local/bin/chromium',headless:true,args:['--no-sandbox']});
 const results=[];const check=(name,value)=>{assert(value,name);results.push(name);};
 try{
  for(const client of ['vk','ok']){
   const page=await browser.newPage({viewport:{width:1280,height:800}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/test-parent.html?client='+client);
   const f=page.frames()[1];await f.waitForFunction(()=>window.Platform?.initialized);
   check(client+' initializes real SDK',await f.evaluate(()=>Platform.phase==='ready'));
   check(client+' Init exactly once',await page.evaluate(()=>events.length===1&&events[0]==='VKWebAppInit'));
   check(client+' separate score namespace',await f.evaluate(c=>Platform.storageKey('score')==='vanna_'+c+'_score',client));
   await f.evaluate(()=>{selectMode(0);resetCrew();loadLevel(0);setState('play');});
   await page.evaluate(()=>document.querySelector('iframe').contentWindow.postMessage({type:'VKWebAppViewHide',data:{}},location.origin));
   await f.waitForFunction(()=>Platform.hidden&&state==='pause');check(client+' native hide pauses game',await f.evaluate(()=>lifecycleBlocked));
   await page.evaluate(()=>document.querySelector('iframe').contentWindow.postMessage({type:'VKWebAppViewRestore',data:{}},location.origin));
   await f.waitForFunction(()=>!Platform.hidden&&!lifecycleBlocked);check(client+' restore clears lifecycle block',true);
   check(client+' no page errors',errors.length===0);await page.close();
  }
  const standalone=await browser.newPage();await standalone.goto(base+'/index.html');
  check('Standalone keeps legacy record keys',await standalone.evaluate(()=>Platform.network==='standalone'&&Platform.storageKey('score')==='score'));
  check('Standalone makes no platform handshake',await standalone.evaluate(()=>Platform.phase==='standalone'&&!Platform.initialized));await standalone.close();
  for(const mode of ['reject','timeout']){
   const page=await browser.newPage();await page.route('**/config.js',route=>route.fulfill({contentType:'text/javascript',body:"window.VK_CONFIG={appId:54821348,sdkTimeoutMs:1000};window.ONLINE_CONFIG={version:'0.6.2'};"}));
   await page.goto(base+'/test-parent.html?mode='+mode);const f=page.frames()[1];await f.waitForFunction(()=>Platform.phase==='failed');
   check(mode+' shown honestly',await f.evaluate(()=>!Platform.initialized&&!document.getElementById('vk-account').hidden));
   check(mode+' no repeated Init',await page.evaluate(()=>events.length===1));
   check(mode+' game remains available',await f.evaluate(()=>state==='title'&&typeof loadLevel==='function'));await page.close();
  }
  console.log(JSON.stringify({passed:results.length,checks:results,scope:'Real SDK + mock platform parents; not real VK/OK deployment'},null,2));
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exit(1);});
