import { normalize, normalizeProject } from './normalize.js';
import seed from './seed.json' with {type:'json'};
import { defaults as homeDefaults, normalizeHome, hydrateHome } from './home.js';
import { pageDefaults, normalizeContent, normalizeOffers, normalizeEditor } from './page-content.js';
const owner='podyma.marcin33@gmail.com';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
export function isAdmin(request){return !!request.headers.get('oai-authenticated-user-id')&&request.headers.get('oai-authenticated-user-email')?.toLowerCase()===owner;}
async function body(request,limit=32*1024*1024){
 if(!request.headers.get('content-type')?.startsWith('application/json'))fail('Wymagany JSON.',415);
 const reader=request.body?.getReader();if(!reader)fail('Brak danych.');let size=0,chunks=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();fail('Plik jest za duży.',413);}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 try{return JSON.parse(new TextDecoder().decode(bytes));}catch{fail('Niepoprawny JSON.');}
}
async function seedDb(db){
 if(await db.prepare("SELECT value FROM settings WHERE key='seed-v1'").first())return;
 const statements=[];
 for(const kind of ['photos','projects'])seed[kind].forEach((item,position)=>statements.push(db.prepare('INSERT INTO records (id,kind,data,position) SELECT ?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key=?)').bind(item.id,kind,JSON.stringify(item),position,'seed-v1')));
 statements.push(db.prepare("INSERT OR IGNORE INTO settings (key,value) VALUES ('seed-v1','1')"));
 await db.batch(statements);
}
async function addProjectIllustrations(db){
 const key='project-illustrations-v1';
 if(await db.prepare('SELECT value FROM settings WHERE key=?').bind(key).first())return;
 const statements=['oop','database','matura'].map((name,index)=>{
  const src='/assets/images/projects/illustrations/'+name+'.svg';
  return db.prepare("UPDATE records SET data=json_set(data,'$.src',?,'$.thumbUrl',?) WHERE id=? AND kind='projects' AND json_extract(data,'$.section')='projects' AND COALESCE(json_extract(data,'$.src'),'')='' AND NOT EXISTS (SELECT 1 FROM settings WHERE key=?)").bind(src,src,'projects-'+index,key);
 });
 statements.push(db.prepare('INSERT OR IGNORE INTO settings (key,value) VALUES (?,?)').bind(key,'1'));
 await db.batch(statements);
}
function image(data,key){
 const m=typeof data==='string'&&data.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);if(!m)fail('Dozwolone obrazy: JPG, PNG, WebP.');
 const bytes=Uint8Array.from(atob(m[2]),c=>c.charCodeAt(0));
 const valid=m[1]==='jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:m[1]==='png'?[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v):new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP';
 if(!valid||bytes.length>20*1024*1024)fail('Niepoprawny obraz lub plik większy niż 20 MB.');
 return {key:key+'.'+(m[1]==='jpeg'?'jpg':m[1]),bytes,type:'image/'+m[1]};
}
async function upload(input,bucket){
 const id=crypto.randomUUID(),main=image(input.image,id),thumb=input.thumbnail?image(input.thumbnail,id+'_thumb'):null;
 const files=[main,thumb].filter(Boolean);let saved=[];
 try{for(const file of files){await bucket.put(file.key,file.bytes,{httpMetadata:{contentType:file.type}});saved.push(file.key);}}catch(e){await bucket.delete(saved);throw e;}
 return {src:'/media/'+main.key,thumbUrl:thumb?'/media/'+thumb.key:'',keys:saved};
}
async function messageTrashSnapshot(db){
 const rows=await db.prepare("SELECT id FROM messages WHERE folder='trash' ORDER BY id").all(),ids=rows.results.map(row=>row.id);
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(ids)));
 return {ids,snapshot:Array.from(new Uint8Array(bytes),byte=>byte.toString(16).padStart(2,'0')).join('')};
}
export async function handleApi(request,env){
 try{
 const path=new URL(request.url).pathname,method=request.method,admin=isAdmin(request),db=env.DB;
 if(method!=='GET'&&method!=='HEAD'&&request.headers.get('origin')!==new URL(request.url).origin)fail('Nieprawidłowe pochodzenie żądania.',403);
 if(path==='/api/auth/status')return json({authenticated:admin,requiresSetup:false});
 if(path.startsWith('/api/auth/'))fail('Użyj logowania przez ChatGPT.',405);
 if((path.startsWith('/api/messages')||path.startsWith('/api/trash')||!['GET','HEAD'].includes(method)&&path!=='/api/contact')&&!admin)fail('Zaloguj się kontem właściciela portfolio.',401);
 if(!db)fail('Baza online jest niedostępna.',503);
 await seedDb(db);
 await addProjectIllustrations(db);
 if(path==='/api/trash'||path.startsWith('/api/trash/')) {
  if(path==='/api/trash'&&method==='GET'){const rows=await db.prepare('SELECT * FROM trash ORDER BY deleted_at DESC').all();return json(rows.results.map(row=>({...row,data:JSON.parse(row.data)})));}
  const permanent=path.match(/^\/api\/trash\/(photos|projects)\/([\w-]+)$/);
  if(permanent&&method==='DELETE'){
   if((await body(request))?.confirmId!==permanent[2])fail('Potwierdź trwałe usunięcie wybranego wpisu.');
   const result=await db.prepare('DELETE FROM trash WHERE kind=? AND id=?').bind(permanent[1],permanent[2]).run();
   if(!result.meta.changes)fail('Wpis nie znajduje się już w koszu.',404);return json({ok:true});
  }
  const restore=path.match(/^\/api\/trash\/(photos|projects)\/([\w-]+)\/restore$/);
  if(!restore||method!=='POST')fail('Niedozwolona operacja.',405);
  const [,kind,id]=restore;
  if(!await db.prepare('SELECT id FROM trash WHERE kind=? AND id=?').bind(kind,id).first())fail('Wpis nie znajduje się już w koszu.',404);
  if(await db.prepare('SELECT id FROM records WHERE kind=? AND id=?').bind(kind,id).first())fail('Wpis o tym identyfikatorze już istnieje. Nie nadpisano danych.',409);
  await db.batch([
   db.prepare('INSERT INTO records (id,kind,data,position) SELECT id,kind,data,position FROM trash WHERE kind=? AND id=?').bind(kind,id),
   db.prepare('DELETE FROM trash WHERE kind=? AND id=?').bind(kind,id)
  ]);
  return json({ok:true});
 }
 if(path==='/api/pages/projects') {
  const old={...pageDefaults.projects,...JSON.parse((await db.prepare('SELECT value FROM settings WHERE key=?').bind('page-projects').first())?.value||'{}')};
  if(method==='GET')return json(old);
  if(method!=='PUT')fail('Niedozwolona metoda.',405);
  const input=await body(request),page={editor:normalizeEditor(input.editor,old.editor)};
  await db.prepare('INSERT INTO settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind('page-projects',JSON.stringify(page)).run();return json(page);
 }
 if(path==='/api/pages/knowledge') {
  if(method==='GET')return json({...pageDefaults.knowledge,...JSON.parse((await db.prepare('SELECT value FROM settings WHERE key=?').bind('page-knowledge').first())?.value||'{}')});
  if(method!=='PUT')fail('Niedozwolona metoda.',405);
  const old={...pageDefaults.knowledge,...JSON.parse((await db.prepare('SELECT value FROM settings WHERE key=?').bind('page-knowledge').first())?.value||'{}')};
  const offers=normalizeOffers(await body(request),old);
  await db.prepare('INSERT INTO settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind('page-knowledge',JSON.stringify(offers)).run();
  return json(offers);
 }
 if(['/api/home','/api/pages/home','/api/pages/about'].includes(path)) {
  const homePage=path!=='/api/pages/about',key=homePage?'home':'page-about';
  const saved=(await db.prepare('SELECT value FROM settings WHERE key=?').bind(key).first())?.value;
  const old=homePage?{...(saved?JSON.parse(saved):homeDefaults)}:{content:saved?JSON.parse(saved):pageDefaults.about};
  const previous=homePage?hydrateHome(old):old;
  if(method==='GET')return json(previous);
  if(method==='PUT') {
   const input=await body(request),page=homePage?normalizeHome(input,previous):{content:normalizeContent(input.content,previous.content)};
   if(homePage)for(const id of page.featured)if(!await db.prepare("SELECT id FROM records WHERE id=? AND kind='projects'").bind(id).first())fail('Wybrany projekt lub osiągnięcie już nie istnieje.');
   const uploaded=input.image?await upload(input,env.BUCKET):null;
   if(uploaded)Object.assign(page.content.photo,{src:uploaded.src,thumbUrl:uploaded.thumbUrl});
   try{await db.prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(key,JSON.stringify(homePage?page:page.content)).run();}
   catch(error){if(uploaded)await env.BUCKET.delete(uploaded.keys);throw error;}
   return json(page);
  }
  fail('Niedozwolona metoda.',405);
 }
 if(path==='/api/contact'&&method==='POST'){
  const input=await body(request,32768),categories={it:['web','hackathon','other'],photo:['concert','portrait','event'],tutoring:['basic','advanced','university','other','programming','maths'],other:['other']};
  const email=typeof input?.email==='string'?input.email.trim():'',message=typeof input?.message==='string'?input.message.trim():'';
  if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!Object.hasOwn(categories,input?.category)||!categories[input.category].includes(input.details)||message.length<10||message.length>5000||!/^([a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12})$/i.test(input.requestId||''))fail('Sprawdź e-mail, temat i treść wiadomości.');
  if(await db.prepare('SELECT id FROM messages WHERE id=?').bind(input.requestId).first())return json({ok:true});
  const sender=request.headers.get('cf-connecting-ip')||request.headers.get('oai-authenticated-user-id')||'anonymous';
  const created=new Date().toISOString(),cutoff=new Date(Date.now()-900000).toISOString();
  const result=await db.prepare('INSERT OR IGNORE INTO messages (id,email,category,details,message,created,sender) SELECT ?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM messages WHERE sender=? AND created>?)<5').bind(input.requestId,email,input.category,input.details,message,created,sender,sender,cutoff).run();
  if(!result.meta.changes)fail('Poczekaj chwilę przed wysłaniem kolejnej wiadomości.',429);
  return json({ok:true},201);
 }
 if(path==='/api/messages'&&method==='GET'){
  const folder=new URL(request.url).searchParams.get('folder')||'inbox';if(!['inbox','spam','trash'].includes(folder))fail('Niepoprawny folder.');
  const rows=await db.prepare('SELECT id,email,category,details,message,created,is_read,mail_status,folder FROM messages WHERE folder=? ORDER BY created DESC LIMIT 100').bind(folder).all();
  const count=await db.prepare("SELECT COUNT(*) AS count FROM messages WHERE is_read=0 AND folder='inbox'").first();
  const counts={};for(const name of ['inbox','spam','trash'])counts[name]=(await db.prepare('SELECT COUNT(*) AS count FROM messages WHERE folder=?').bind(name).first()).count;
  return json({items:rows.results,unread:count.count,counts,mailConfigured:false,snapshot:folder==='trash'?(await messageTrashSnapshot(db)).snapshot:undefined});
 }
 if(path==='/api/messages'&&method==='DELETE'){
  const input=await body(request,1024);
  if(input?.folder!=='trash'||input.confirmation!=='EMPTY_TRASH')fail('Potwierdź opróżnienie kosza wiadomości.');
  const current=await messageTrashSnapshot(db);
  if(input.snapshot!==current.snapshot)fail('Zawartość kosza zmieniła się. Sprawdź ją i potwierdź ponownie.',409);
  const result=await db.prepare("DELETE FROM messages WHERE folder='trash' AND id IN (SELECT value FROM json_each(?))").bind(JSON.stringify(current.ids)).run();
  return json({ok:true,deleted:result.meta.changes});
 }
 const msg=path.match(/^\/api\/messages\/([\da-f-]+)(\/notify)?$/i);
 if(msg){
  if(msg[2])fail('Powiadomienia e-mail nie są skonfigurowane.',409);
  if(!['PUT','DELETE'].includes(method))fail('Niedozwolona operacja.',405);
  const input=await body(request,1024);
  if(method==='DELETE'){
   if(input?.confirmId!==msg[1])fail('Potwierdź trwałe usunięcie wiadomości.');
   const result=await db.prepare("DELETE FROM messages WHERE id=? AND folder='trash'").bind(msg[1]).run();
   if(!result.meta.changes)fail('Wiadomość nie znajduje się w koszu.',409);return json({ok:true});
  }
  let result;
  if(input?.folder!==undefined){if(!['inbox','spam','trash'].includes(input.folder))fail('Niepoprawny folder.');result=await db.prepare('UPDATE messages SET folder=? WHERE id=?').bind(input.folder,msg[1]).run();}
  else {if(typeof input?.read!=='boolean')fail('Niepoprawny status.');result=await db.prepare('UPDATE messages SET is_read=? WHERE id=?').bind(Number(input.read),msg[1]).run();}
  if(!result.meta.changes)fail('Nie znaleziono wiadomości.',404);return json({ok:true});
 }
 const match=path.match(/^\/api\/(photos|projects)(?:\/([\w-]+))?$/);
 if(!match)fail('Nieznany adres API.',404);
 const [,kind,id]=match;
 if(method==='GET'&&!id){const rows=await db.prepare('SELECT data FROM records WHERE kind=? ORDER BY position').bind(kind).all();return json(rows.results.map(row=>JSON.parse(row.data)).filter(item=>kind!=='projects'||admin||item.visible!==false));}
 if(!['POST','PUT','DELETE'].includes(method)||method==='POST'&&id||method!=='POST'&&!id)fail('Niedozwolona operacja.',405);
 const row=id?await db.prepare('SELECT data FROM records WHERE id=? AND kind=?').bind(id,kind).first():null;
 if(id&&!row)fail('Nie znaleziono wpisu.',404);
 if(method==='DELETE'){
  if(new URL(request.url).searchParams.get('permanent')==='1'){
   if((await body(request))?.confirmId!==id)fail('Potwierdź trwałe usunięcie wybranego wpisu.');
   await db.prepare('DELETE FROM records WHERE id=? AND kind=?').bind(id,kind).run();return json({ok:true});
  }
  await db.batch([
   db.prepare('INSERT INTO trash (kind,id,data,position,deleted_at) SELECT kind,id,data,position,? FROM records WHERE id=? AND kind=?').bind(new Date().toISOString(),id,kind),
   db.prepare('DELETE FROM records WHERE id=? AND kind=?').bind(id,kind)
  ]);return json({ok:true});
 }
 const input=await body(request),old=row?JSON.parse(row.data):{},item=kind==='photos'?normalize(input,old):normalizeProject(input,old);item.id=id||crypto.randomUUID();
 let uploaded;
 if(input.image){if(!env.BUCKET)fail('Magazyn zdjęć niedostępny.',503);uploaded=await upload(input,env.BUCKET);item.src=uploaded.src;item.thumbUrl=uploaded.thumbUrl;}
 else if(kind==='photos'&&!id)fail('Wybierz zdjęcie.');
 try{
  if(id)await db.prepare('UPDATE records SET data=? WHERE id=? AND kind=?').bind(JSON.stringify(item),id,kind).run();
  else await db.prepare('INSERT INTO records (id,kind,data,position) VALUES (?,?,?,(SELECT COALESCE(MAX(position),-1)+1 FROM records WHERE kind=?))').bind(item.id,kind,JSON.stringify(item),kind).run();
 }catch(e){if(uploaded)await env.BUCKET.delete(uploaded.keys);throw e;}
 return json(item,id?200:201);
 }catch(error){if(!error.status)console.error('Portfolio API failed:',error.message);return json({error:error.status?error.message:'Błąd serwera online. Spróbuj ponownie.'},error.status||500);}
}
