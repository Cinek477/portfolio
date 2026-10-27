const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {createGalleryServer}=require('../server.cjs');
test('Case notes stay private; automatic retention preserves manual copies; preflight is protected',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'portfolio-cases-'));let server,base,cookie='';
 const start=async()=>{server=createGalleryServer({dataDir:dir,uploadDir:path.join(dir,'images'),exportFile:path.join(dir,'gallery.js'),automaticBackups:true,mailDisabled:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;};
 const request=(url,method='GET',data,auth=true)=>fetch(base+url,{method,headers:{Origin:base,Cookie:auth?cookie:'','Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
 const login=async setup=>{const response=await request('/api/auth/'+(setup?'setup':'login'),'POST',{username:'admin',password:'cases-password-2026'});cookie=response.headers.get('set-cookie').split(';')[0];};
 await start();try{
 assert.equal((await request('/api/preflight')).status,401);await login(true);
 const id=crypto.randomUUID();assert.equal((await request('/api/contact','POST',{email:'test@example.com',category:'other',details:'other',message:'Testowa wiadomość',requestId:id},false)).status,201);
 assert.equal((await request('/api/messages/'+id,'PUT',{caseStatus:'done',privateNote:'Tylko administrator'},false)).status,401);
 assert.equal((await request('/api/messages/'+id,'PUT',{caseStatus:'wrong'})).status,400);
 assert.equal((await request('/api/messages/'+id,'PUT',{caseStatus:'agreed',privateNote:'Tylko administrator'})).status,200);
 assert.equal((await(await request('/api/messages')).json()).items[0].case_status,'agreed');
 assert.equal((await request('/api/messages', 'GET',undefined,false)).status,401);
 const manual=await(await request('/api/backups','POST')).json();const home=await(await request('/api/pages/home')).json();
 for(let i=0;i<7;i++){const response=await request('/api/pages/home','PUT',home);assert.equal(response.status,200);}
 const copies=(await(await request('/api/backups')).json()).items;assert.equal(copies.filter(item=>item.reason==='automatic').length,5);assert.ok(copies.some(item=>item.id===manual.id));
 assert.ok(!fs.readFileSync(path.join(dir,'pages-data.js'),'utf8').includes('Tylko administrator'));
 const report=await request('/api/preflight');assert.equal(report.status,200);assert.ok((await report.json()).checked>0);
 await new Promise(r=>server.close(r));await start();await login(false);assert.equal((await(await request('/api/messages')).json()).items[0].private_note,'Tylko administrator');
 }finally{await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true});}
});
test('Preflight reports local missing resources and bilingual gaps without checking remote URLs',()=>{
 const {check}=require('../server/preflight.cjs');const result=check({root:path.resolve(__dirname,'..'),pages:{home:{title:{pl:'Tytuł',en:''},button:{href:'assets/not-here.pdf'}}},photos:[],projects:[]});assert.ok(result.issues.some(item=>item.message.includes('tłumaczenia')));assert.ok(result.issues.some(item=>item.message.includes('not-here.pdf')));
});
