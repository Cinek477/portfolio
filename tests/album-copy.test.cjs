const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../assets/js/lightbox.js'),'utf8');
const start=source.indexOf('  async function copyAlbumLink(value)');
const end=source.indexOf('  // Telefon:',start);
function setup(clipboard,result=true){
 const calls=[];
 const field={style:{},setAttribute(){},focus(){calls.push('field focus');},select(){calls.push('select');},setSelectionRange(a,b){calls.push([a,b]);},remove(){calls.push('remove');}};
 const context={navigator:{clipboard},window:{},document:{activeElement:{focus(){calls.push('restore focus');}},createElement:()=>field,execCommand:command=>{calls.push(command);return result;}},dialog:{append(){calls.push('append');}}};
 vm.runInNewContext(source.slice(start,end)+'\nglobalThis.copy=copyAlbumLink;',context);
 return {copy:context.copy,calls,field};
}
test('Album link: modern clipboard and local HTTP fallback',async()=>{
 const link='http://10.0.0.2:3001/po-godzinach?album=concert-2';
 const values=[];const modern=setup({writeText:async value=>values.push(value)});
 await modern.copy(link);assert.deepEqual(values,[link]);assert.deepEqual(modern.calls,[]);
 for(const clipboard of [undefined,{writeText:async()=>{throw Error('denied');}}]){
  const fallback=setup(clipboard);await fallback.copy(link);
  assert.equal(fallback.field.value,link);assert.ok(fallback.calls.includes('copy'));
  assert.deepEqual(fallback.calls.slice(-2),['remove','restore focus']);
 }
 const blocked=setup(undefined,false);await assert.rejects(blocked.copy(link));
 assert.deepEqual(blocked.calls.slice(-2),['remove','restore focus']);
});
