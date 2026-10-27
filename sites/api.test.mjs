import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {handleApi} from './lib/api.js';
import {readFileSync,readdirSync} from 'node:fs';
function setup(){
 const raw=new DatabaseSync(':memory:');for(const file of readdirSync('drizzle').filter(x=>x.endsWith('.sql')))raw.exec(readFileSync('drizzle/'+file,'utf8'));
 const wrap=(sql,args=[])=>({bind(...values){return wrap(sql,values);},async first(){return raw.prepare(sql).get(...args)||null;},async all(){return {results:raw.prepare(sql).all(...args)};},async run(){const r=raw.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}};}});
 const objects=new Map();return {DB:{prepare:wrap,async batch(statements){raw.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());raw.exec('COMMIT');return result;}catch(e){raw.exec('ROLLBACK');throw e;}}},BUCKET:{async put(k,b,o){objects.set(k,{b,o});},async delete(keys){for(const k of Array.isArray(keys)?keys:[keys])objects.delete(k);}},objects,raw};
}
function req(path,method='GET',data,owner=false,origin='https://portfolio.test'){
 const headers={};if(method!=='GET'){headers.origin=origin;headers['content-type']='application/json';}if(owner){headers['oai-authenticated-user-id']='test-owner';headers['oai-authenticated-user-email']='podyma.marcin33@gmail.com';}
 return new Request('https://portfolio.test'+path,{method,headers,body:data===undefined?undefined:JSON.stringify(data)});
}

test('Page content: owner-only saves, R2 images, safe links and isolated page settings',async()=>{
 const env=setup();
 try {
  const home=await (await handleApi(req('/api/pages/home'),env)).json();
  const about=await (await handleApi(req('/api/pages/about'),env)).json();
  assert.equal((await handleApi(req('/api/pages/about','PUT',about),env)).status,401);
  const invalid=structuredClone(about);invalid.content.buttons[0].href='javascript:alert(1)';
  assert.equal((await handleApi(req('/api/pages/about','PUT',invalid,true),env)).status,400);
  const changed=structuredClone(about);changed.content.tags.reverse();changed.content.buttons[0].visible=false;
  const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aOioAAAAASUVORK5CYII=';
  const response=await handleApi(req('/api/pages/about','PUT',{...changed,image,thumbnail:image},true),env);
  assert.equal(response.status,200);const saved=await response.json();
  assert.match(saved.content.photo.src,/^\/media\//);assert.equal(env.objects.size,2);
  assert.deepEqual(saved.content.tags,changed.content.tags);
  assert.deepEqual(await (await handleApi(req('/api/pages/about'),env)).json(),saved);
  assert.deepEqual(await (await handleApi(req('/api/pages/home'),env)).json(),home);
 }finally{env.raw.close();}
});

test('project artwork is stored once, preserves existing photos and allows later removal',async()=>{
 const env=setup();
 const projects=await (await handleApi(req('/api/projects'),env)).json();
 for(const [i,name] of ['oop','database','matura'].entries()){
  const item=projects.find(p=>p.id==='projects-'+i);
  assert.equal(item.src.replace(/^\//,''),'assets/images/projects/illustrations/'+name+'.svg');
  assert.equal(item.thumbUrl,item.src);
 }
 const item=projects.find(p=>p.id==='projects-0');
 const update={section:item.section,title:item.title.pl,year:item.year,removeImage:true};
 assert.equal((await handleApi(req('/api/projects/'+item.id,'PUT',update,true),env)).status,200);
 assert.equal((await (await handleApi(req('/api/projects'),env)).json()).find(p=>p.id===item.id).src,'');
 env.raw.prepare('DELETE FROM settings WHERE key=?').run('project-illustrations-v1');
 env.raw.prepare("UPDATE records SET data=json_set(data,'$.src','/media/custom.jpg') WHERE id='projects-1'").run();
 const again=await (await handleApi(req('/api/projects'),env)).json();
 assert.equal(again.find(p=>p.id==='projects-1').src,'/media/custom.jpg');
 env.raw.close();
});
test('owner authorization, durable CRUD, images and contact inbox',async()=>{
 const env=setup();
 const home=await (await handleApi(req('/api/home'),env)).json();
 assert.equal((await handleApi(req('/api/home','PUT',home),env)).status,401);
 const changedHome={...home,featured:['achievements-1'],bio:{pl:'Nowy opis',en:'New bio'}};
 assert.equal((await handleApi(req('/api/home','PUT',changedHome,true),env)).status,200);
 assert.deepEqual(await (await handleApi(req('/api/home'),env)).json(),changedHome);
 assert.equal((await handleApi(req('/api/photos','POST',{},false),env)).status,401);
 assert.equal((await handleApi(req('/api/photos','POST',{},true,'https://evil.test'),env)).status,403);
 assert.equal((await handleApi(req('/api/messages'),env)).status,401);
 const first=await (await handleApi(req('/api/photos'),env)).json();assert.ok(first.length>0);
 const again=await (await handleApi(req('/api/photos'),env)).json();assert.equal(first.length,again.length);
 const payload={category:'nature',venue:'Warszawa',title:'Test zdjęcia',image:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlS8AAAAASUVORK5CYII='};
 const response=await handleApi(req('/api/photos','POST',payload,true),env);assert.equal(response.status,201);const item=await response.json();assert.ok(item.src.startsWith('/media/'));assert.equal(env.objects.size,1);
 const update=await handleApi(req('/api/photos/'+item.id,'PUT',{category:'nature',venue:'Kraków',title:'Zmienione'},true),env);assert.equal(update.status,200);
 assert.equal((await (await handleApi(req('/api/photos'),env)).json()).find(x=>x.id===item.id).venue,'Kraków');
 const projectResponse=await handleApi(req('/api/projects','POST',{section:'projects',title:'Projekt testowy',summary:'Opis',description:'Treść',year:2026},true),env);assert.equal(projectResponse.status,201);const project=await projectResponse.json();
 assert.equal((await handleApi(req('/api/projects/'+project.id,'DELETE',{},true),env)).status,200);
 assert.equal((await handleApi(req('/api/photos/'+item.id,'DELETE',{},true),env)).status,200);
 const requestId=crypto.randomUUID(),contact={requestId,email:'test@example.com',category:'it',details:'web',message:'Test zapisu wiadomości online.'};
 assert.equal((await handleApi(req('/api/contact','POST',contact),env)).status,201);
 assert.equal((await handleApi(req('/api/contact','POST',contact),env)).status,200);
 const inbox=await (await handleApi(req('/api/messages','GET',undefined,true),env)).json();assert.equal(inbox.items.length,1);assert.equal(inbox.unread,1);
 assert.equal((await handleApi(req('/api/messages/'+requestId,'PUT',{read:true},true),env)).status,200);
 assert.equal((await (await handleApi(req('/api/messages','GET',undefined,true),env)).json()).unread,0);
 for(let i=0;i<4;i++)assert.equal((await handleApi(req('/api/contact','POST',{...contact,requestId:crypto.randomUUID()}),env)).status,201);
 assert.equal((await handleApi(req('/api/contact','POST',{...contact,requestId:crypto.randomUUID()}),env)).status,429);
 env.raw.close();
});

test('Completed page editors: owner-only text and offer settings persist independently',async()=>{
 const env=setup();
 for(const page of ['projects','knowledge']){
  const url='/api/pages/'+page;
  const initial=await (await handleApi(req(url),env)).json();
  assert.ok(initial.editor.groups.length>0);
  assert.equal((await handleApi(req(url,'PUT',initial),env)).status,401);
  const changed=structuredClone(initial);changed.editor.groups[0].fields[0].value={pl:'Treść z bazy',en:'Database content'};
  const saved=await handleApi(req(url,'PUT',changed,true),env);assert.equal(saved.status,200);
  assert.deepEqual(await (await handleApi(req(url),env)).json(),changed);
  const invalid=structuredClone(changed);invalid.editor.groups[0].links[0].href='javascript:alert(1)';
  assert.equal((await handleApi(req(url,'PUT',invalid,true),env)).status,400);
 }
 env.raw.close();
});

test('Trash: owner-only archive, exact restore, duplicate protection and explicit permanent deletion', async () => {
 const env=setup();
 try {
  assert.equal((await handleApi(req('/api/trash'),env)).status,401);
  for(const kind of ['photos','projects']){
   const items=await (await handleApi(req('/api/'+kind,'GET',undefined,true),env)).json();
   const item=items[0],url='/api/'+kind+'/'+item.id,restore='/api/trash/'+kind+'/'+item.id+'/restore';
   assert.equal((await handleApi(req(url,'DELETE',undefined,true),env)).status,200);
   const archived=await (await handleApi(req('/api/trash','GET',undefined,true),env)).json();
   assert.deepEqual(archived.find(x=>x.id===item.id&&x.kind===kind).data,item);
   assert.ok(!(await (await handleApi(req('/api/'+kind),env)).json()).some(x=>x.id===item.id));
   assert.equal((await handleApi(req(restore,'POST'),env)).status,401);
   assert.equal((await handleApi(req(restore,'POST',undefined,true),env)).status,200);
   assert.equal((await handleApi(req(restore,'POST',undefined,true),env)).status,404);
   assert.deepEqual((await (await handleApi(req('/api/'+kind,'GET',undefined,true),env)).json()).find(x=>x.id===item.id),item);
   assert.equal((await handleApi(req(url+'?permanent=1','DELETE',{},true),env)).status,400);
   assert.equal((await handleApi(req(url,'DELETE',undefined,true),env)).status,200);
   const purge='/api/trash/'+kind+'/'+item.id;
   assert.equal((await handleApi(req(purge,'DELETE',{},true),env)).status,400);
   assert.equal((await handleApi(req(purge,'DELETE',{confirmId:item.id},true),env)).status,200);
   assert.equal((await handleApi(req(restore,'POST',undefined,true),env)).status,404);
  }
 } finally { env.raw.close(); }
});

test('Message folders: private spam/trash, exact restoration, counters and confirmed permanent removal',async()=>{
 const env=setup();try{
 const item={requestId:crypto.randomUUID(),email:'sample@example.com',category:'it',details:'web',message:'Wiadomość testowa folderów.'};
 assert.equal((await handleApi(req('/api/contact','POST',item),env)).status,201);
 const url='/api/messages/'+item.requestId;
 const get=async folder=>(await handleApi(req('/api/messages?folder='+folder,'GET',undefined,true),env)).json();
 assert.equal((await get('inbox')).unread,1);
 assert.equal((await handleApi(req(url,'PUT',{folder:'spam'}),env)).status,401);
 assert.equal((await handleApi(req(url,'PUT',{folder:'bad'},true),env)).status,400);
 assert.equal((await handleApi(req(url,'PUT',{folder:'spam'},true),env)).status,200);
 assert.equal((await get('inbox')).unread,0);assert.equal((await get('spam')).items[0].message,item.message);
 assert.equal((await handleApi(req('/api/messages?folder=spam'),env)).status,401);
 assert.equal((await handleApi(req(url,'DELETE',{confirmId:item.requestId},true),env)).status,409);
 assert.equal((await handleApi(req(url,'PUT',{folder:'inbox'},true),env)).status,200);
 assert.equal((await get('inbox')).unread,1);
 assert.equal((await handleApi(req(url,'PUT',{folder:'trash'},true),env)).status,200);
 assert.equal((await get('trash')).counts.trash,1);
 assert.equal((await handleApi(req(url,'DELETE',{},true),env)).status,400);
 assert.equal((await handleApi(req(url,'DELETE',{confirmId:item.requestId},true),env)).status,200);
 assert.equal((await get('trash')).items.length,0);
 const add=async(folder)=>{const row={...item,requestId:crypto.randomUUID()};assert.equal((await handleApi(req('/api/contact','POST',row),env)).status,201);if(folder!=='inbox')await handleApi(req('/api/messages/'+row.requestId,'PUT',{folder},true),env);};
 await add('inbox');await add('trash');const before=await get('trash');await add('trash');
 const payload={folder:'trash',confirmation:'EMPTY_TRASH',snapshot:before.snapshot};
 assert.equal((await handleApi(req('/api/messages','DELETE',payload,true),env)).status,409);
 payload.snapshot=(await get('trash')).snapshot;
 assert.equal((await handleApi(req('/api/messages','DELETE',payload),env)).status,401);
 const emptied=await handleApi(req('/api/messages','DELETE',payload,true),env);assert.equal(emptied.status,200);assert.equal((await emptied.json()).deleted,2);
 assert.equal((await get('trash')).items.length,0);assert.equal((await get('inbox')).items.length,1);
 }finally{env.raw.close();}
});

test('Project case study: authenticated bilingual edits and backward-compatible updates',async()=>{
 const env=setup();try{
 const caseStudy={enabled:true,title:{pl:'Swoją Drogą',en:'By the Way'},problem:{pl:'Problem',en:'Problem'},solution:{pl:'Rozwiązanie',en:'Solution'},contribution:{pl:'',en:''},result:{pl:'Wynik',en:'Outcome'}};
 const input={section:'achievements',title:'Hackathon',year:2026,caseStudy};
 assert.equal((await handleApi(req('/api/projects','POST',input),env)).status,401);
 assert.equal((await handleApi(req('/api/projects','POST',{...input,caseStudy:{enabled:true}},true),env)).status,400);
 const created=await (await handleApi(req('/api/projects','POST',input,true),env)).json();assert.deepEqual(created.caseStudy,caseStudy);
 const url='/api/projects/'+created.id;
 const legacy={section:'achievements',title:'Nowy tytuł',year:2026};
 assert.equal((await handleApi(req(url,'PUT',legacy,true),env)).status,200);
 let items=await (await handleApi(req('/api/projects'),env)).json();assert.deepEqual(items.find(x=>x.id===created.id).caseStudy,caseStudy);
 assert.equal((await handleApi(req(url,'DELETE',undefined,true),env)).status,200);
 assert.equal((await handleApi(req('/api/trash/projects/'+created.id+'/restore','POST',undefined,true),env)).status,200);
 items=await (await handleApi(req('/api/projects'),env)).json();assert.deepEqual(items.find(x=>x.id===created.id).caseStudy,caseStudy);
 }finally{env.raw.close();}
});
