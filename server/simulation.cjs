'use strict';
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const script=new vm.Script(fs.readFileSync(path.join(__dirname,'sim-source.js'),'utf8'),{filename:'sim-source.js'});
module.exports=function createSimulation(){const context=vm.createContext({},{codeGeneration:{strings:false,wasm:false}});script.runInContext(context,{timeout:2000});return context.SIM;};
