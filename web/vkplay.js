/* VK Play Browser JS API. No VK Bridge, no private keys, no purchases.
 * Official API: https://documentation.vkplay.ru/f2p_vkp/f2pb_js_vkp
 */
(()=>{
 'use strict';
 const cfg=window.VKPLAY_CONFIG||{};
 const label=document.getElementById('platform-status');
 const button=document.getElementById('vk-account');
 let api=null,loginStatus=null,connecting=false,finished=false;
 let watchdog=null;
 const tell=(text)=>{label.textContent=text;label.title=text;};
 const showAccount=(text,disabled=false)=>{button.textContent=text;button.hidden=false;button.disabled=disabled;};
 const statusCallback=(data)=>{
   if(!data||data.status!=='ok'){tell('VK PLAY: СТАТУС НЕДОСТУПЕН');showAccount('ПОВТОРИТЬ');return;}
   loginStatus=Number(data.loginStatus);
   if(loginStatus===0){tell('VK PLAY · ГОСТЬ');showAccount('ВХОД VK PLAY');}
   else if(loginStatus===1){tell('VK PLAY · НУЖНА РЕГИСТРАЦИЯ');showAccount('ПОДКЛЮЧИТЬ');}
   else if(loginStatus===2||loginStatus===3){tell('VK PLAY · ПОДКЛЮЧЕНО');button.hidden=true;}
   else{tell('VK PLAY: НЕИЗВЕСТНЫЙ СТАТУС');showAccount('ПОВТОРИТЬ');}
 };
 const safeCall=(method)=>{
   if(!api||typeof api[method]!=='function'){tell('VK PLAY: МЕТОД НЕДОСТУПЕН');return false;}
   try{api[method]();return true;}catch(err){console.warn('[VK Play] Call failed:',method,err);tell('VK PLAY: ОШИБКА СВЯЗИ');return false;}
 };
 const fail=(err)=>{
   if(finished)return;finished=true;connecting=false;clearTimeout(watchdog);
   console.warn('[VK Play] SDK unavailable. Gameplay remains available.',err);
   tell('VK PLAY НЕДОСТУПЕН · ЛОКАЛЬНАЯ ИГРА');showAccount('ПОВТОРИТЬ SDK');
 };
 const handshake=()=>{
   if(finished)return;
   if(typeof window.iframeApi!=='function'){fail('iframeApi missing');return;}
   const noop=()=>{};
   const callbacks={
     appid:Number(cfg.gmrid),
     getLoginStatusCallback:statusCallback,
     // The current build intentionally does not request or store personal profile data.
     userInfoCallback:noop,userProfileCallback:noop,
     registerUserCallback:(info)=>{if(info&&info.status==='ok')safeCall('getLoginStatus');else{tell('VK PLAY: РЕГИСТРАЦИЯ НЕ ЗАВЕРШЕНА');showAccount('ПОДКЛЮЧИТЬ');}},
     confirmWindowClosedCallback:()=>{button.disabled=false;safeCall('getLoginStatus');},
     userConfirmCallback:()=>safeCall('getLoginStatus'),
     paymentFrameUrlCallback:noop,getAuthTokenCallback:noop,
     paymentReceivedCallback:noop,paymentWindowClosedCallback:noop,
     paymentFrameItem:noop,getGameInventoryItems:noop,
     getGameInventoryItemsCallback:noop,userFriendsCallback:noop,userSocialFriendsCallback:noop
   };
   try{
     Promise.resolve(window.iframeApi(callbacks)).then(value=>{
       if(finished)return;
       if(!value||typeof value.getLoginStatus!=='function'){fail('Invalid API');return;}
       api=value;finished=true;connecting=false;clearTimeout(watchdog);
       tell('VK PLAY · ПРОВЕРКА ВХОДА');showAccount('ПОВТОРИТЬ');safeCall('getLoginStatus');
     },fail);
   }catch(err){fail(err);}
 };
 const connect=()=>{
   if(connecting)return;
   if(!/^\d+$/.test(String(cfg.gmrid))||Number(cfg.gmrid)<=0){tell('ЛОКАЛЬНЫЙ ЭФИР');button.hidden=true;return;}
   if(window.self===window.top){tell('АВТОНОМНЫЙ ЗАПУСК · VK PLAY В IFRAME');button.hidden=true;return;}
   connecting=true;finished=false;button.hidden=true;tell('VK PLAY · ПОДКЛЮЧЕНИЕ');
   watchdog=setTimeout(()=>fail('Timeout'),Math.max(1000,Number(cfg.sdkTimeoutMs)||10000));
   if(typeof window.iframeApi==='function'){handshake();return;}
   document.getElementById('vkplay-sdk')?.remove();
   const sdk=document.createElement('script');sdk.id='vkplay-sdk';sdk.async=true;
   sdk.src='https://vkplay.ru/app/'+Number(cfg.gmrid)+'/static/mailru.core.js';
   sdk.onload=handshake;sdk.onerror=()=>fail('SDK load error');document.head.appendChild(sdk);
 };
 button.addEventListener('click',()=>{
   if(!api){connect();return;}
   if(loginStatus===0)safeCall('authUser');
   else if(loginStatus===1)safeCall('registerUser');
   else safeCall('getLoginStatus');
 });
 connect();
})();
