const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createGalleryServer}=require('../server.cjs');
test('Contact editor: private drafts, published texts and safe contact links',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'portfolio-contact-editor-'));const server=createGalleryServer({mailDisabled:true,dataDir:dir,uploadDir:path.join(dir,'images'),exportFile:path.join(dir,'gallery.js')});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;let cookie='';
 const req=(url,method='GET',data)=>fetch(base+url,{method,headers:{Origin:base,Cookie:cookie,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
 try{
 const before=await(await req('/api/pages/contact')).json();assert.ok(before.editor.groups.some(g=>g.id==='questions-photo'));
 assert.equal((await req('/api/pages/contact','PUT',before)).status,401);
 const auth=await req('/api/auth/setup','POST',{username:'admin',password:'contact-editor-test-2026'});cookie=auth.headers.get('set-cookie').split(';')[0];
 const changed=structuredClone(before);changed.editor.groups[0].fields[0].value={pl:'Nowy kontakt',en:'New contact'};
 assert.equal((await req('/api/page-drafts/contact','PUT',changed)).status,200);assert.deepEqual(await(await req('/api/pages/contact')).json(),before);
 assert.equal((await req('/api/page-drafts/contact/publish','POST')).status,200);
 const published=await(await req('/api/pages/contact')).json();assert.equal(published.editor.groups[0].fields[0].value.pl,'Nowy kontakt');
 assert.ok(fs.readFileSync(path.join(dir,'pages-data.js'),'utf8').includes('Nowy kontakt'));
 for(const details of ['basic','advanced','university','other']) assert.equal((await req('/api/contact','POST',{email:'test@example.com',category:'tutoring',details,message:'Test zapytania o aktualny zakres korepetycji.',requestId:require('node:crypto').randomUUID()})).status,201);
 changed.editor.groups[0].links[0].href='mailto:hello@example.com?bcc=evil@example.com';assert.equal((await req('/api/page-drafts/contact','PUT',changed)).status,400);
 }finally{await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true});}
});
