const pages={'index.html':'/','about.html':'/o-mnie','projects.html':'/projekty','knowledge.html':'/korepetycje','hobby.html':'/po-godzinach','contact.html':'/kontakt','admin.html':'/admin'};
const projects={'achievements-1':'swoja-droga','achievements-0':'krakhack'};
function resolve(url){
 const name=url.pathname.slice(1), query=new URLSearchParams(url.search);
 let target=pages[name];
 if(name==='project.html'&&query.has('id')){const id=query.get('id');target='/projekty/'+encodeURIComponent(projects[id]||id);query.delete('id');}
 if((name==='hobby.html'||name==='po-godzinach')&&query.has('album')){target='/album/'+encodeURIComponent(query.get('album'));query.delete('album');}
 if(target)return {redirect:target+(query.size?'?'+query:'')};
 for(const [file,path] of Object.entries(pages))if(url.pathname===path)return {file};
 const project=url.pathname.match(/^\/projekty\/([^/]+)$/);
 if(project){const slug=decodeURIComponent(project[1]);return {file:'project.html',id:Object.keys(projects).find(id=>projects[id]===slug)||slug};}
 const album=url.pathname.match(/^\/album\/([^/]+)$/);
 if(album)return {file:'hobby.html',album:decodeURIComponent(album[1])};
 return {};
}
function html(source){return source.replace(/<head([^>]*)>/i,'<head$1><base href="/">').replace(/(href|src|poster)="([^"#/:][^"]*)"/g,(all,attr,value)=>{if(/^[a-z]+:/i.test(value))return all;const url=new URL(value,'http://local/');const route=resolve(url);return attr+'="'+(attr==='href'&&route.redirect?route.redirect:'/'+value)+'"';});}
module.exports={resolve,html};
