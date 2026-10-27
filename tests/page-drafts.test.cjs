const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createGalleryServer}=require('../server.cjs');
test('Private page drafts survive restart; publish, history cap and restore remain isolated',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'portfolio-drafts-'));
 const options={dataDir:dir,uploadDir:path.join(dir,'images'),exportFile:path.join(dir,'gallery.js')};
 let server,base,cookie='';
 const start=async()=>{server=createGalleryServer(options);await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;};
 const req=(url,method='GET',data,auth=true,origin=base)=>fetch(base+url,{method,headers:{Origin:origin,Cookie:auth?cookie:'','Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
 const auth=async(setup=false)=>{const r=await req('/api/auth/'+(setup?'setup':'login'),'POST',{username:'admin',password:'draft-test-password-2026'});assert.ok(r.ok);cookie=r.headers.get('set-cookie').split(';')[0];};
 await start();
 try {
  assert.equal((await req('/api/page-drafts/about')).status,401);
  await auth(true);
  const before=await(await req('/api/pages/about')).json();
  const changed=structuredClone(before);changed.content.heading={pl:'Prywatny szkic',en:'Private draft'};
  assert.equal((await req('/api/page-drafts/about','PUT',changed,true,'https://evil.test')).status,403);
  const invalid=structuredClone(changed);invalid.content.buttons[0].href='javascript:alert(1)';
  assert.equal((await req('/api/page-drafts/about','PUT',invalid)).status,400);
  assert.equal((await req('/api/page-drafts/about','PUT',changed)).status,200);
  assert.deepEqual(await(await req('/api/pages/about')).json(),before);
  assert.ok(!fs.readFileSync(path.join(dir,'pages-data.js'),'utf8').includes('Prywatny szkic'));
  await new Promise(r=>server.close(r));await start();await auth();
  assert.equal((await(await req('/api/page-drafts/about')).json()).data.content.heading.pl,'Prywatny szkic');
  assert.equal((await req('/api/page-drafts/about/publish','POST')).status,200);
  assert.equal((await(await req('/api/pages/about')).json()).content.heading.pl,'Prywatny szkic');
  assert.equal((await(await req('/api/page-drafts/about')).json()).data,null);
  let history=await(await req('/api/page-drafts/about/history')).json();assert.equal(history.length,1);
  assert.equal((await req('/api/page-drafts/about/restore','POST',{id:history[0].id})).status,200);
  assert.deepEqual((await(await req('/api/page-drafts/about')).json()).data,before);
  assert.equal((await(await req('/api/pages/about')).json()).content.heading.pl,'Prywatny szkic');
  for(let i=0;i<12;i++){
   changed.content.heading.pl='Wersja '+i;
   assert.equal((await req('/api/page-drafts/about','PUT',changed)).status,200);
   assert.equal((await req('/api/page-drafts/about/publish','POST')).status,200);
  }
  history=await(await req('/api/page-drafts/about/history')).json();assert.equal(history.length,10);
  assert.equal((await req('/api/page-drafts/about/history','GET',undefined,false)).status,401);
  for(const page of ['home','projects','knowledge','contact']){
   const publicPage=await(await req('/api/pages/'+page)).json();
   assert.equal((await req('/api/page-drafts/'+page,'PUT',publicPage)).status,200);
   assert.equal((await req('/api/page-drafts/'+page+'/publish','POST')).status,200);
   const count=(await(await req('/api/page-drafts/'+page+'/history')).json()).length;
   const normalized=await(await req('/api/pages/'+page)).json();
   await req('/api/page-drafts/'+page,'PUT',normalized); await req('/api/page-drafts/'+page+'/publish','POST');
   assert.equal((await(await req('/api/page-drafts/'+page+'/history')).json()).length,count);
  }
  assert.equal((await req('/api/page-drafts/about','DELETE')).status,200);
 } finally {await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true});}
});
