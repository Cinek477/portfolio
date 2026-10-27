const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function socialMeta(source,{url,base,photos,projects}){
 const local=value=>typeof value==='string'?value:value?.pl||'';
 let title=(source.match(/<title>([^<]*)<\/title>/i)||[])[1]||'Marcin Podyma',description=(source.match(/<meta\s+name="description"\s+content="([^"]*)"/i)||[])[1]||'Projekty, fotografia i korepetycje Marcina Podymy.',image='';
 const canonical=new URL(url.pathname,base);
 if((url.pathname.endsWith('/project.html')||url.pathname.startsWith('/projekty/'))){
  const item=projects.find(item=>item.id===url.searchParams.get('id')&&item.visible!==false&&item.caseStudy?.enabled);
  if(item){title=local(item.caseStudy.title||item.title)+' — Marcin Podyma';description=local(item.summary||item.caseStudy.solution).slice(0,240);image=item.thumbUrl||item.src;canonical.searchParams.set('id',item.id);}
 }
 if((url.pathname.endsWith('/hobby.html')||url.pathname.startsWith('/album/'))&&url.searchParams.has('album')){
  const item=photos.find(item=>item.id===url.searchParams.get('album')&&item.visible!==false&&item.album);
  if(item){const key=value=>value?.normalize('NFC').trim().toLocaleLowerCase('pl');const album=photos.filter(photo=>photo.visible!==false&&key(photo.album)===key(item.album));const cover=album.find(photo=>photo.albumCover)||album[0];title=item.album+' — Marcin Podyma';description='Album fotograficzny · '+album.length+' zdjęć · Marcin Podyma';image=cover.thumbUrl||cover.src;canonical.searchParams.set('album',item.id);}
 }
 if(image?.endsWith('.svg')){image=image.replace(/\.svg$/,'-social.png');if(!require('node:fs').existsSync(require('node:path').join(__dirname,'..',image)))image='';}
 const tags=[['og:type','website'],['og:site_name','Marcin Podyma'],['og:locale','pl_PL'],['og:title',title],['og:description',description],['og:url',canonical.href],['twitter:card',image?'summary_large_image':'summary'],['twitter:title',title],['twitter:description',description]];
 if(image && /^(?:assets\/|https?:\/\/)/.test(image)){const absolute=new URL(image,base).href;tags.push(['og:image',absolute],['og:image:alt',title],['twitter:image',absolute]);}
 const markup=tags.map(([key,value])=>'<meta '+(key.startsWith('og:')?'property':'name')+'="'+key+'" content="'+escape(value)+'">').join('\n')+'\n<link rel="canonical" href="'+escape(canonical.href)+'">';
 return source.replace(/<meta\b[^>]*(?:property|name)="(?:og:|twitter:)[^"]*"[^>]*>/gi,'').replace(/<link\b[^>]*rel="canonical"[^>]*>/gi,'').replace('</head>',markup+'\n</head>');
}
module.exports={socialMeta};
