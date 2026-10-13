'use strict';
(()=>{
 const source=document.getElementById('c'),display=document.getElementById('crt-display'),glass=document.getElementById('glass');
 const toggle=document.getElementById('crt-toggle'),full=document.getElementById('fullscreen');
 let enabled=true,gpuReady=false,gl=null,program=null,texture=null,sizeUniform=null;
 try{enabled=localStorage.getItem('vanna_crt_screen')!=='0';}catch(e){}
 const vs='attribute vec2 a_pos; varying vec2 v_uv; void main(){v_uv=(a_pos+1.0)*0.5;gl_Position=vec4(a_pos,0.0,1.0);}';
 const fs=`precision mediump float;
 varying vec2 v_uv; uniform sampler2D u_image; uniform vec2 u_size;
 void main(){
  vec2 p=v_uv*2.0-1.0;
  // Barrel geometry: actual bowed image, not just rounded CSS corners.
  vec2 q=p*(1.0+0.042*p.yx*p.yx);q=q*0.5+0.5;
  if(q.x<0.0||q.y<0.0||q.x>1.0||q.y>1.0){gl_FragColor=vec4(0.012,0.014,0.016,1.0);return;}
  vec2 texel=vec2(1.0/320.0,1.0/240.0);
  vec3 c=texture2D(u_image,q).rgb;
  vec3 soft=(texture2D(u_image,q+vec2(texel.x,0.)).rgb+texture2D(u_image,q-vec2(texel.x,0.)).rgb+texture2D(u_image,q+vec2(0.,texel.y)).rgb+texture2D(u_image,q-vec2(0.,texel.y)).rgb)*0.25;
  // A very small phosphor halo; glyphs remain sharp and legible.
  c=mix(c,soft,0.065);
  float scan=0.967+0.033*cos(q.y*240.0*6.2831853);
  float mask=0.992+0.008*cos(gl_FragCoord.x*2.0943951);
  float vignette=1.0-0.095*pow(length(p)/1.4142,3.0);
  c=pow(max(c,vec3(0.)),vec3(0.97))*scan*mask*vignette;
  c*=vec3(1.035,1.01,0.985);
  gl_FragColor=vec4(c,1.0);
 }`;
 function shader(type,code){const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
 try{
  gl=display.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:false});
  if(!gl)throw Error('WebGL not available');
  const v=shader(gl.VERTEX_SHADER,vs),f=shader(gl.FRAGMENT_SHADER,fs);program=gl.createProgram();gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.deleteShader(v);gl.deleteShader(f);gl.useProgram(program);
  const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const pos=gl.getAttribLocation(program,'a_pos');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.uniform1i(gl.getUniformLocation(program,'u_image'),0);sizeUniform=gl.getUniformLocation(program,'u_size');gpuReady=true;
 }catch(e){console.warn('[CRT] Using CSS fallback:',e.message);gpuReady=false;}
 function apply(){
  document.body.classList.toggle('crt-off',!enabled);document.body.classList.toggle('crt-gpu',enabled&&gpuReady);document.body.classList.toggle('crt-fallback',enabled&&!gpuReady);
  toggle.textContent=enabled?'ЭЛТ: ВКЛ':'ЭЛТ: ВЫКЛ';toggle.setAttribute('aria-pressed',String(enabled));document.getElementById('audio-panel').hidden=true;document.getElementById('audio-toggle').setAttribute('aria-expanded','false');
 }
 window.resizeCRT=()=>{const r=glass.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1),w=Math.max(1,Math.round(r.width*dpr)),h=Math.max(1,Math.round(r.height*dpr));if(display.width!==w||display.height!==h){display.width=w;display.height=h;}if(gpuReady){gl.viewport(0,0,w,h);gl.uniform2f(sizeUniform,w,h);}};
 window.renderCRT=()=>{if(!enabled||!gpuReady)return;gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);};
 display.addEventListener('webglcontextlost',e=>{e.preventDefault();gpuReady=false;apply();});
 toggle.addEventListener('click',()=>{enabled=!enabled;try{localStorage.setItem('vanna_crt_screen',enabled?'1':'0');}catch(e){}apply();source.focus({preventScroll:true});});
 full.addEventListener('click',async()=>{
  try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else throw Error('Fullscreen unavailable');}
  catch(e){const old=full.textContent;full.textContent='ОТКРОЙ HTML';full.title='Полный экран недоступен в этом окне. Открой HTML-файл отдельно в браузере.';setTimeout(()=>{full.textContent=old;},3500);}
  document.getElementById('audio-panel').hidden=true;document.getElementById('audio-toggle').setAttribute('aria-expanded','false');source.focus({preventScroll:true});
 });
 document.addEventListener('fullscreenchange',()=>{full.textContent=document.fullscreenElement?'СВЕРНУТЬ':'ВЕСЬ ЭКРАН';resize();});
 apply();window.resizeCRT();window.renderCRT();
})();
