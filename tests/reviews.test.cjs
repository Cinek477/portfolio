const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createGalleryServer}=require('../server.cjs');
test('Reviews: authentication, validation, edit without duplicate, visibility, archive, export and restart',async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'portfolio-reviews-'));let server,base,cookie='';
 const start=async()=>{server=createGalleryServer({dataDir:directory,uploadDir:path.join(directory,'images'),exportFile:path.join(directory,'gallery.js')});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;};
 const request=(method,url,input,origin=base)=>fetch(base+url,{method,headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify(input)});
 await start();try{
 const input={author:'Ala',text:'Bardzo dobre zajęcia.',context:'Matura',textEn:'',contextEn:'',rating:4.5,visible:true,archived:false};
 assert.deepEqual(await(await fetch(base+'/api/reviews')).json(),[]);
 assert.equal((await request('POST','/api/reviews',input)).status,401);
 const auth=await request('POST','/api/auth/setup',{username:'admin',password:'reviews-password-2026'});cookie=auth.headers.get('set-cookie').split(';')[0];
 assert.equal((await request('POST','/api/reviews',input,'https://evil.test')).status,403);
 for(const bad of [{rating:5.5},{rating:4.3},{author:''},{text:'x'.repeat(2001)},{visible:'yes'}])assert.equal((await request('POST','/api/reviews',{...input,...bad})).status,400);
 const created=await request('POST','/api/reviews',input);assert.equal(created.status,201);const item=await created.json();
 item.text='Poprawiona opinia';assert.equal((await request('PUT','/api/reviews/'+item.id,item)).status,200);
 assert.equal((await(await fetch(base+'/api/reviews')).json()).length,1);
 item.archived=true;await request('PUT','/api/reviews/'+item.id,item);assert.deepEqual(await(await fetch(base+'/api/reviews')).json(),[]);
 assert.equal((await(await fetch(base+'/api/reviews',{headers:{Cookie:cookie}})).json()).length,1);
 assert.ok(!fs.readFileSync(path.join(directory,'pages-data.js'),'utf8').includes('Poprawiona opinia'));
 item.archived=false;item.visible=false;await request('PUT','/api/reviews/'+item.id,item);assert.deepEqual(await(await fetch(base+'/api/reviews')).json(),[]);
 item.visible=true;await request('PUT','/api/reviews/'+item.id,item);assert.ok(fs.readFileSync(path.join(directory,'pages-data.js'),'utf8').includes('Poprawiona opinia'));
 await new Promise(r=>server.close(r));await start();assert.deepEqual(await(await fetch(base+'/api/reviews')).json(),[item]);
 }finally{await new Promise(r=>server.close(r));fs.rmSync(directory,{recursive:true,force:true});}
});
