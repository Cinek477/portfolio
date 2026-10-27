const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm');
const {createGalleryServer}=require('../server.cjs');
test('Photo management: atomic album moves, private hidden photos, exact ordering and restart',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'portfolio-photo-manager-'));
 const options={dataDir:dir,uploadDir:path.join(dir,'images'),exportFile:path.join(dir,'gallery.js')};
 let server,base,cookie='';const start=async()=>{server=createGalleryServer(options);await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;};
 const req=(url,method='GET',data,auth=true,origin=base)=>fetch(base+url,{method,headers:{Origin:origin,Cookie:auth?cookie:'','Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
 const login=async(setup=false)=>{const r=await req('/api/auth/'+(setup?'setup':'login'),'POST',{username:'admin',password:'photo-manager-test-2026'});cookie=r.headers.get('set-cookie').split(';')[0];};
 await start();try{
  const original=await(await req('/api/photos')).json(),ids=original.map(p=>p.id),pair=ids.slice(0,2);assert.equal(pair.length,2);
  assert.equal((await req('/api/photo-management','POST',{ids:pair,album:'Test'},false)).status,401);
  await login(true);
  assert.equal((await req('/api/photo-management','POST',{ids:pair,album:'Test'},true,'https://evil.test')).status,403);
  assert.equal((await req('/api/photo-management','POST',{ids:[pair[0],'missing'],album:'Wrong'})).status,409);
  assert.equal((await req('/api/photo-management','POST',{ids:pair,album:'Test album'})).status,200);
  assert.equal((await req('/api/album-cover','POST',{id:pair[0]},false)).status,401);
  assert.equal((await req('/api/album-cover','POST',{id:pair[0]},true,'https://evil.test')).status,403);
  assert.equal((await req('/api/album-cover','POST',{id:pair[0]})).status,200);
  assert.equal((await req('/api/album-cover','POST',{id:pair[1]})).status,200);
  const covers=await(await req('/api/photos')).json();assert.equal(covers.filter(p=>p.albumCover).length,1);assert.equal(covers.find(p=>p.id===pair[1]).albumCover,true);
  assert.equal((await req('/api/photo-management','POST',{ids:[pair[0]],galleryVisible:false})).status,200);
  assert.ok((await(await req('/api/photos','GET',undefined,false)).json()).some(p=>p.id===pair[0]&&p.galleryVisible===false));
  assert.equal((await req('/api/photo-management','POST',{ids:[pair[0]],visible:false})).status,200);
  assert.ok(!(await(await req('/api/photos','GET',undefined,false)).json()).some(p=>p.id===pair[0]));
  assert.ok((await(await req('/api/photos')).json()).some(p=>p.id===pair[0]&&p.visible===false));
  const exported={window:{}};vm.runInNewContext(fs.readFileSync(options.exportFile,'utf8'),exported);assert.ok(!exported.window.portfolioPhotos.some(p=>p.id===pair[0]));
  assert.equal((await req('/api/photo-order','PUT',{ids:ids.slice(1)})).status,409);
  assert.equal((await req('/api/photo-order','PUT',{ids:[...ids].reverse()})).status,200);
  await new Promise(r=>server.close(r));await start();await login();
  const after=await(await req('/api/photos')).json();assert.deepEqual(after.map(p=>p.id),[...ids].reverse());assert.equal(after.find(p=>p.id===pair[0]).album,'Test album');
  assert.equal((await req('/api/photo-management','POST',{ids:[pair[0]],visible:true})).status,200);
  assert.ok((await(await req('/api/photos','GET',undefined,false)).json()).some(p=>p.id===pair[0]));
 }finally{await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true});}
});
