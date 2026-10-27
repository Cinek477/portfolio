const fs=require('node:fs'),path=require('node:path');
function check({root,pages,photos,projects}){
 const issues=[],seen=new Set();let checked=0,hasDownload=false;const media=new Map();
 const add=(where,message)=>{const key=where+message;if(!seen.has(key)){seen.add(key);issues.push({where,message});}};
 function resource(value,where){
  if(!value||/^(https?:|mailto:|tel:|#)/i.test(value))return;
  let file;try{file=decodeURIComponent(value.split(/[?#]/)[0]);}catch{add(where,'Niepoprawny adres pliku.');return;}
  const source=file.replace(/^\//,'');const target=path.resolve(root,/^[a-z0-9_-]+\.html$/i.test(source)?'pages/'+source:source);checked++;
  if(!target.startsWith(path.resolve(root)+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile())add(where,'Brak pliku: '+file);
  else if(/\.(jpg|jpeg|png|webp|avif)$/i.test(file)){const bytes=fs.statSync(target).size;media.set(file,{file,bytes,warning:bytes>(/800px|thumb/i.test(file)?300*1024:1500*1024)});}
 }
 function walk(value,where){
  if(!value||typeof value!=='object')return;
  if(value.download===true&&value.href)hasDownload=true;
  if(value.visible===false || value.enabled===false)return;
  if(Object.hasOwn(value,'pl')&&Object.hasOwn(value,'en')){checked++;if(value.pl?.trim()&&!value.en?.trim())add(where,'Brakuje tłumaczenia EN.');if(value.en?.trim()&&!value.pl?.trim())add(where,'Brakuje treści PL.');}
  for(const [key,item] of Object.entries(value)){
   if(['src','thumbUrl','href'].includes(key)&&typeof item==='string')resource(item,where+'.'+key);
   if(key==='href'&&typeof item==='string'&&!item.trim())add(where,'Przycisk nie ma adresu.');
   if(key==='label'&&item&&typeof item==='object'&&!item.pl?.trim())add(where,'Przycisk nie ma podpisu.');
   if(item&&typeof item==='object')walk(item,where+'.'+key);
  }
 }
 walk(pages,'Podstrony');walk(photos,'Galeria');walk(projects,'Projekty');
 for(const name of ['index.html','about.html']){const html=fs.readFileSync(path.join(root,'pages',name),'utf8');const links=[...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)].filter(match=>/download/i.test(match[0]));if(!links.length&&!(name==='index.html'&&hasDownload))add(name,'Brak linku pobierania CV.');for(const match of links)resource(match[1],name+' / CV');}
 return {checked,issues,media:[...media.values()].sort((a,b)=>b.bytes-a.bytes).slice(0,20),checkedAt:new Date().toISOString(),scope:'Zapisane treści publiczne i lokalne pliki. Szkice i dostępność zewnętrznych stron wymagają osobnego sprawdzenia.'};
}
module.exports={check};
