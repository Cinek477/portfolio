const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'); const os=require('node:os'); const path=require('node:path');
const {createGalleryServer}=require('../server.cjs');
test('Offer badges: protected save, validation, public export and persistence',async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'portfolio-offers-'));
 let server,base;
 const start=async()=>{server=createGalleryServer({dataDir:directory,uploadDir:path.join(directory,'images'),exportFile:path.join(directory,'gallery.js')});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;};
 await start();let cookie='';
 const put=(input,origin=base)=>fetch(base+'/api/pages/knowledge',{method:'PUT',headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify(input)});
 try{
  const initial=await (await fetch(base+'/api/pages/knowledge')).json();
  assert.equal(initial.offers.length,4);assert.equal(initial.offers[0].id,'start');assert.equal(initial.offers[0].enabled,true);assert.ok(initial.offers.slice(1).every(o=>!o.enabled));
  assert.equal((await put(initial)).status,401);
  const auth=await fetch(base+'/api/auth/setup',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({username:'admin',password:'offer-test-password-2026'})});
  cookie=auth.headers.get('set-cookie').split(';')[0];
  assert.equal((await put(initial,'https://evil.test')).status,403);
  const changed=structuredClone(initial);changed.offers[2]={id:'regular',enabled:true,text:{pl:'−10% regularnie',en:'−10% regular lessons'}};
  changed.editor.groups[0].fields[0].value={pl:'Test wstępu',en:'Intro test'};
  const invalidEditor=structuredClone(changed); invalidEditor.editor.groups[0].links[0].href='javascript:alert(1)'; assert.equal((await put(invalidEditor)).status,400);
  changed.faq.reverse(); changed.faq[0].answer.pl = 'Test zapisu odpowiedzi'; changed.faq[1].visible = false;
  assert.equal((await put(changed)).status,200);
  const invalidFaq=structuredClone(changed); invalidFaq.faq[0].question.pl=''; assert.equal((await put(invalidFaq)).status,400);
  const bad=structuredClone(changed);bad.offers[2].text.pl='';assert.equal((await put(bad)).status,400);
  bad.offers[2].text.pl='x'.repeat(101);assert.equal((await put(bad)).status,400);
  bad.offers[2].id='single';assert.equal((await put(bad)).status,400);
  const projectPage=await (await fetch(base+'/api/pages/projects')).json();
  projectPage.editor.groups[0].fields[0].value={pl:'Moje realizacje',en:'My work'};
  const saveProjects=(data)=>fetch(base+'/api/pages/projects',{method:'PUT',headers:{Origin:base,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify(data)});
  assert.equal((await saveProjects(projectPage)).status,200);
  assert.deepEqual(await (await fetch(base+'/api/pages/knowledge')).json(),changed);
  const badProject=structuredClone(projectPage);badProject.editor.groups[0].links[0].href='//evil.test';assert.equal((await saveProjects(badProject)).status,400);
  assert.ok(fs.readFileSync(path.join(directory,'pages-data.js'),'utf8').includes('−10% regularnie'));
  await new Promise(r=>server.close(r));await start();
  assert.deepEqual(await (await fetch(base+'/api/pages/knowledge')).json(),changed);
  assert.deepEqual(await (await fetch(base+'/api/pages/projects')).json(),projectPage);
 }finally{await new Promise(r=>server.close(r));fs.rmSync(directory,{recursive:true,force:true});}
});
