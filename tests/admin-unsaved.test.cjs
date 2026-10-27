const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
test('Unsaved guard preserves edits when cancelled, discards through editor reset and clears after save',()=>{
 const listeners={},globalListeners={};let accepted=false,resets=0;const form={id:'photo-form',dispatchEvent:()=>resets++};const window={};
 vm.runInNewContext(fs.readFileSync('assets/js/admin-unsaved.js','utf8'),{window,document:{addEventListener:(name,fn)=>listeners[name]=fn,getElementById:()=>form},addEventListener:(name,fn)=>globalListeners[name]=fn,confirm:()=>accepted,Event:class{}});
 listeners.input({target:{closest:()=>form}});let blocked=false,stopped=false;const target={closest:()=>null,matches:pattern=>pattern.includes('[data-panel]'),textContent:'Galeria'};
 listeners.click({target:{closest:()=>target},preventDefault:()=>blocked=true,stopImmediatePropagation:()=>stopped=true});assert.ok(blocked&&stopped);assert.equal(resets,0);
 let unload=false;globalListeners.beforeunload({preventDefault:()=>unload=true});assert.equal(unload,true);
 accepted=true;listeners.click({target:{closest:()=>target},preventDefault:()=>{},stopImmediatePropagation:()=>{}});assert.equal(resets,1);
 unload=false;globalListeners.beforeunload({preventDefault:()=>unload=true});assert.equal(unload,false);
 listeners.input({target:{closest:()=>form}});window.markAdminClean(form);globalListeners.beforeunload({preventDefault:()=>unload=true});assert.equal(unload,false);
});
