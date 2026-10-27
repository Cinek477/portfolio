const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {DatabaseSync,backup}=require('node:sqlite');
function createBackups({db,databaseFile,imagesDir,directory,json,body,authenticated,exportData,clearSessions,setBusy}){
 fs.mkdirSync(directory,{recursive:true});let busy=false;
 const valid=id=>typeof id==='string'&&/^\d{13}-[a-f0-9]{8}$/.test(id);
 async function scan(root){let bytes=0,files=0;for(const item of await fs.promises.readdir(root,{withFileTypes:true})){const name=path.join(root,item.name);if(item.isSymbolicLink())throw Error('Kopia nie może zawierać dowiązań.');if(item.isDirectory()){const sub=await scan(name);bytes+=sub.bytes;files+=sub.files;}else if(item.isFile()){bytes+=(await fs.promises.stat(name)).size;files++;}}return {bytes,files};}
 async function create(reason='manual'){
  const id=Date.now()+'-'+crypto.randomBytes(4).toString('hex'),folder=path.join(directory,id);await fs.promises.mkdir(folder);
  try{
   await backup(db,path.join(folder,'gallery.sqlite'));
   await scan(imagesDir);await fs.promises.cp(imagesDir,path.join(folder,'images'),{recursive:true});
   const size=await scan(folder),manifest={version:1,id,createdAt:new Date().toISOString(),reason,...size};
   await fs.promises.writeFile(path.join(folder,'manifest.json'),JSON.stringify(manifest,null,2));return manifest;
  }catch(error){await fs.promises.rm(folder,{recursive:true,force:true});throw error;}
 }
 async function list(){const result=[];for(const entry of await fs.promises.readdir(directory)){if(!valid(entry))continue;try{const data=JSON.parse(await fs.promises.readFile(path.join(directory,entry,'manifest.json'),'utf8'));if(data.version===1&&data.id===entry)result.push(data);}catch{}}return result.sort((a,b)=>b.id.localeCompare(a.id));}
 async function restore(id){
  const folder=path.join(directory,id);await scan(folder);
  const manifest=JSON.parse(await fs.promises.readFile(path.join(folder,'manifest.json'),'utf8'));if(manifest.id!==id||manifest.version!==1)throw Error('Niepoprawna kopia.');
  const source=new DatabaseSync(path.join(folder,'gallery.sqlite'),{readOnly:true});
  let safety;
  try{
   if(source.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('Baza w kopii jest uszkodzona.');
   for(const table of ['photos','projects','settings','messages','page_drafts','page_history'])if(!source.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table))throw Error('Kopia ma niezgodny format bazy.');
   safety=await create('before-restore');
   await fs.promises.cp(path.join(folder,'images'),imagesDir,{recursive:true});
   await backup(source,databaseFile);exportData();clearSessions();return {ok:true,safetyBackup:safety.id,requiresLogin:true};
  }catch(error){
   if(safety){const rollback=new DatabaseSync(path.join(directory,safety.id,'gallery.sqlite'),{readOnly:true});try{await fs.promises.cp(path.join(directory,safety.id,'images'),imagesDir,{recursive:true});await backup(rollback,databaseFile);exportData();}finally{rollback.close();}}
   throw error;
  }finally{source.close();}
 }
 async function automatic(){
  if(busy)throw Object.assign(Error('Trwa tworzenie kopii. Spróbuj ponownie.'),{status:503});
  busy=true;setBusy(true);
  try{const result=await create('automatic');const copies=(await list()).filter(item=>item.reason==='automatic');
   for(const item of copies.slice(5)){const target=path.resolve(directory,item.id);if(!valid(item.id)||path.dirname(target)!==path.resolve(directory))throw Error('Niepoprawna ścieżka kopii.');await scan(target);await fs.promises.rm(target,{recursive:true});}
   return result;
  }finally{busy=false;setBusy(false);}
 }
 return {automatic,isBusy:()=>busy,handle:async(req,res,pathname)=>{
  if(pathname!=='/api/backups'&&!pathname.startsWith('/api/backups/'))return false;
  if(!authenticated(req)){json(res,401,{error:'Zaloguj się do panelu administratora.'});return true;}
  if(busy){json(res,409,{error:'Operacja kopii jest już w toku.'});return true;}
  if(pathname==='/api/backups'&&req.method==='GET'){json(res,200,{items:await list(),location:directory});return true;}
  const restoreMatch=pathname.match(/^\/api\/backups\/(\d{13}-[a-f0-9]{8})\/restore$/);
  if(!(pathname==='/api/backups'&&req.method==='POST')&&!(restoreMatch&&req.method==='POST')){json(res,405,{error:'Niedozwolona operacja.'});return true;}
  if(restoreMatch){const input=await body(req);if(input.confirmation!=='RESTORE'||input.id!==restoreMatch[1]){json(res,400,{error:'Potwierdź przywrócenie wybranej kopii.'});return true;}}
  busy=true;setBusy(true);
  try{json(res,200,restoreMatch?await restore(restoreMatch[1]):await create());}
  catch(error){json(res,500,{error:'Operacja kopii nie powiodła się. '+error.message});}
  finally{busy=false;setBusy(false);}return true;
 }};
}
module.exports={createBackups};
