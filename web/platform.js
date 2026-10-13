/* Shared VK / OK adapter. Official VK Bridge SDK is served from our own origin.
 * Launch parameters choose presentation/storage namespace, NOT authenticated identity.
 * No private keys, profile data, purchases, notifications or social permissions.
 */
(()=>{
 'use strict';
 const params=new URLSearchParams(location.search),sdk=window.vkBridge,cfg=window.VK_CONFIG||{};
 const embedded=!!(sdk?.isEmbedded?.()||params.has('vk_app_id')||params.has('vk_platform'));
 const network=embedded?(params.get('vk_client')==='ok'?'ok':'vk'):'standalone';
 const name=network==='ok'?'ОК':'ВК',label=document.getElementById('platform-status'),button=document.getElementById('vk-account');
 let initialized=false,phase=embedded?'connecting':'standalone',platformHidden=false;
 const status=text=>{if(label){label.textContent=text;label.title=text;}};
 const lifecycle=hidden=>{
  platformHidden=hidden;
  const fn=hidden?window.suspendGame:window.resumeLifecycle;
  if(typeof fn==='function')fn();
 };
 const failure=()=>{phase='failed';status(name+' · BRIDGE НЕ ПОДКЛЮЧЁН');if(button){button.hidden=false;button.textContent='ПЕРЕЗАГРУЗИТЬ';button.disabled=false;}};
 const storageKey=key=>network==='standalone'?key:'vanna_'+network+'_'+key;
 let ready=Promise.resolve(false);
 // The API is published before the gameplay scripts execute.
 window.Platform={network,embedded,storageKey,get ready(){return ready;},get initialized(){return initialized;},get phase(){return phase;},get hidden(){return platformHidden;}};
 if(button){button.hidden=true;button.addEventListener('click',()=>{if(phase==='failed')location.reload();});}
 if(!embedded){status('АВТОНОМНЫЙ ЗАПУСК');return;}
 if(!sdk||typeof sdk.send!=='function'){failure();return;}
 status(name+' · ПОДКЛЮЧАЕМ BRIDGE');
 sdk.subscribe(event=>{
  const type=event?.detail?.type;
  if(type==='VKWebAppViewHide')lifecycle(true);
  if(type==='VKWebAppViewRestore')lifecycle(false);
 });
 document.addEventListener('DOMContentLoaded',()=>{if(platformHidden)lifecycle(true);},{once:true});
 // Init is the FIRST Bridge event, invoked before game/audio/sprite resources.
 // Never retry Init in the same instance: web platforms only process its first call.
 let timer;
 const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Bridge timeout')),Math.max(1000,Number(cfg.sdkTimeoutMs)||10000));});
 try{
  ready=Promise.race([Promise.resolve(sdk.send('VKWebAppInit',{})),timeout]).then(data=>{
   if(data?.result!==true)throw Error('Initialization rejected');
   initialized=true;phase='ready';status(name+' · BRIDGE ПОДКЛЮЧЁН');return true;
  }).catch(()=>{failure();return false;}).finally(()=>clearTimeout(timer));
 }catch{clearTimeout(timer);failure();ready=Promise.resolve(false);}
})();
