const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createGalleryServer}=require('../server.cjs');
test('Full backup: private snapshot, validated restore, safety copy, images and sessions',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'portfolio-full-backup-')),images=path.join(dir,'images');
 const server=createGalleryServer({dataDir:dir,uploadDir:images,exportFile:path.join(dir,'gallery.js'),mailDisabled:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;let cookie='';
 const req=(url,method='GET',data,origin=base)=>fetch(base+url,{method,headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
 const login=async(setup=false)=>{const r=await req('/api/auth/'+(setup?'setup':'login'),'POST',{username:'admin',password:'backup-test-password-2026'});assert.ok(r.ok);cookie=r.headers.get('set-cookie').split(';')[0];};
 try{
  assert.equal((await req('/api/backups')).status,401);assert.equal((await req('/api/admin/stats')).status,401);await login(true);
  fs.writeFileSync(path.join(images,'test-image.txt'),'original');
  const home=await(await req('/api/pages/home')).json();
  assert.equal((await req('/api/backups','POST',undefined,'https://evil.test')).status,403);
  const created=await req('/api/backups','POST');assert.equal(created.status,200);const copy=await created.json();assert.ok(copy.id);
  const changed=structuredClone(home);changed.bio.pl='Zmieniona treść po wykonaniu kopii.';await req('/api/pages/home','PUT',changed);fs.writeFileSync(path.join(images,'test-image.txt'),'changed');
  await req('/api/page-drafts/home','PUT',changed);assert.equal((await(await req('/api/admin/stats')).json()).drafts,1);
  assert.equal((await req('/api/backups/'+copy.id+'/restore','POST',{id:copy.id})).status,400);
  const restored=await req('/api/backups/'+copy.id+'/restore','POST',{id:copy.id,confirmation:'RESTORE'});const result=await restored.json();assert.equal(restored.status,200,JSON.stringify(result));assert.ok(result.safetyBackup);
  assert.equal((await(await req('/api/auth/status')).json()).authenticated,false);assert.deepEqual(await(await req('/api/pages/home')).json(),home);assert.equal(fs.readFileSync(path.join(images,'test-image.txt'),'utf8'),'original');
  await login();const list=await(await req('/api/backups')).json();assert.equal(list.items.length,2);assert.ok(list.items.some(item=>item.reason==='before-restore'));
  assert.equal((await(await req('/api/admin/stats')).json()).drafts,0);
  assert.equal((await req('/backups/project-snapshots/'+copy.id+'/gallery.sqlite')).status,404);
 }finally{await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true});}
});
test('Current work: backwards-compatible content and bounded bilingual fields',()=>{
 const {defaults,hydrateHome,normalizeHome}=require('../shared/home.cjs');
 const old=structuredClone(defaults);delete old.currentWork;assert.equal(hydrateHome(old).currentWork.title.pl,'Teraz tworzę');
 const changed=structuredClone(defaults);changed.currentWork.text.pl='Nowa aktualizacja';changed.currentWork.visible=false;
 const saved=normalizeHome(changed);assert.equal(saved.currentWork.visible,false);assert.equal(saved.currentWork.text.pl,'Nowa aktualizacja');
 const legacy=structuredClone(saved);delete legacy.currentWork;assert.deepEqual(normalizeHome(legacy,saved).currentWork,saved.currentWork);
 changed.currentWork.text.pl='x'.repeat(1001);assert.throws(()=>normalizeHome(changed));
});
