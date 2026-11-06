// Publiczny widok Spotify: metadane utworów, odświeżanie i dekoracja winyla.
window.portfolioPages ||= {};
window.portfolioPages['spotify.js']=()=>{
 const section=document.querySelector('.hobby-music');if(!section)return;const scope=window.portfolioPageScope||{signal:new AbortController().signal,cleanup:()=>{}};
 const live=section.querySelector('.spotify-live'),current=section.querySelector('.spotify-current'),list=section.querySelector('.spotify-track-list'),top=section.querySelector('.spotify-top'),note=section.querySelector('.spotify-data-note');
 const art=section.querySelector('.music-art'),recordLabel=section.querySelector('.music-record-label'),originalLabel=recordLabel.innerHTML;
 art.querySelector('.music-wave')?.setAttribute('aria-hidden','true');
 function updateRecord(){
  const playing=!!(snapshot?.connected&&snapshot.current);
  art.classList.toggle('has-current-art',playing);art.classList.toggle('is-active',playing&&visible&&!document.hidden);
  // The entire decorative record can rotate because its centre contains no Spotify artwork.
  if(recordLabel.innerHTML!==originalLabel)recordLabel.innerHTML=originalLabel;
  recordLabel.closest('.music-record').setAttribute('aria-hidden','true');
 }

 let snapshot=null,visible=true,busy=false;
 const text=(pl,en)=>document.documentElement.lang==='en'?en:pl;
 const node=(tag,value,cls)=>{const el=document.createElement(tag);if(value)el.textContent=value;if(cls)el.className=cls;return el;};
 function track(item){const link=node('a',null,'spotify-track');link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label',item.name+' — '+item.artists+' (Spotify)');if(item.image){const image=new Image();image.src=item.image;image.alt=item.album;image.loading='lazy';image.width=image.height=64;image.addEventListener('error',()=>image.remove(),{once:true});link.append(image);}const info=node('div',null,'spotify-track-copy');info.append(node('strong',item.name),node('span',item.artists));link.append(info,node('span','›','spotify-track-arrow'));return link;}
 function render(){
  if(!snapshot||scope.signal.aborted)return;updateRecord();live.hidden=!snapshot.connected;current.hidden=false;current.replaceChildren();current.classList.toggle('is-playing',!!snapshot.current);list.replaceChildren();if(!snapshot.connected){current.setAttribute('aria-hidden','true');return;}current.removeAttribute('aria-hidden');
  if(snapshot.current){
   const item=snapshot.current,link=node('a',null,'spotify-sleeve-cover');link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label',item.name+' — '+item.artists+' (Spotify)');
   if(item.image){const image=new Image();image.src=item.image;image.alt=item.album||item.name;image.width=image.height=180;image.addEventListener('error',()=>image.remove(),{once:true});link.append(image);}
   const info=node('div',null,'spotify-sleeve-info');info.id='spotify-current-info';const textLink=node('a',null,'spotify-current-details');textLink.href=item.url;textLink.target='_blank';link.rel='noopener noreferrer';textLink.append(node('span','Spotify','spotify-current-source'),node('strong',item.name),node('span',item.artists),node('small',item.album),node('span',text('Otwórz w Spotify','Open in Spotify'),'spotify-current-open'));info.append(textLink);
   const toggle=node('button',text('Co gra?','What’s playing?'),'spotify-sleeve-toggle');toggle.type='button';toggle.setAttribute('aria-controls',info.id);toggle.setAttribute('aria-expanded','false');toggle.onclick=()=>{const open=current.classList.toggle('show-info');toggle.setAttribute('aria-expanded',String(open));};
   current.append(link,toggle,info);current.removeAttribute('aria-label');
  }else{current.classList.remove('show-info');current.setAttribute('aria-label',text('Spotify — teraz nic nie gra','Spotify — nothing playing'));}
  for(const item of snapshot.top||[]){const li=node('li');li.append(track(item));list.append(li);}top.hidden=!list.children.length;
  note.textContent=snapshot.stale?text('Lista z ostatniej udanej aktualizacji Spotify.','Showing the last successful Spotify update.'):snapshot.unavailable?text('Spotify ma chwilową przerwę — zajrzyj później lub otwórz mój profil.','Spotify is temporarily unavailable — check back later or visit my profile.'):!list.children.length?text('Lista pojawi się, gdy Spotify udostępni wystarczająco dużo danych.','The list will appear when Spotify has enough listening data.'):'';
 }

 async function refresh(){if(busy||!visible||document.hidden||scope.signal.aborted)return;busy=true;try{const response=await fetch('/api/spotify',{signal:AbortSignal.any([scope.signal,AbortSignal.timeout(15000)])});if(!response.ok)throw Error();snapshot=await response.json();render();}catch{}finally{busy=false;}}
 refresh();
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;updateRecord();if(visible)refresh();},{rootMargin:'150px'});observer.observe(section);const timer=setInterval(refresh,60000);
 document.addEventListener('visibilitychange',()=>{updateRecord();if(!document.hidden)refresh();},{signal:scope.signal});document.addEventListener('portfolio-language-change',render,{signal:scope.signal});scope.cleanup(()=>{observer.disconnect();clearInterval(timer);});
};
if(!window.portfolioRouting)window.portfolioPages['spotify.js']();
