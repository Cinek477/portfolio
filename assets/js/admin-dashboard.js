// Pulpit panelu: statystyki, kontrola publikacji i zarządzanie kopiami bezpieczeństwa.
(() => {
 window.runAdminPreflight=async()=>{const button=document.querySelector('#preflight-run'),status=document.querySelector('#preflight-status'),list=document.querySelector('#preflight-list');button.disabled=true;status.textContent='Sprawdzanie…';list.replaceChildren();try{const result=await api('/api/preflight');status.textContent='Sprawdzono '+result.checked+' elementów. Uwagi: '+result.issues.length+'. '+result.scope;for(const issue of result.issues){const li=document.createElement('li');li.textContent=issue.where+' — '+issue.message;list.append(li);}const heading=document.createElement('li');heading.textContent='Waga zdjęć — do 20 największych (orientacyjne progi: miniatura 300 KB, pełne zdjęcie 1,5 MB):';list.append(heading);for(const item of result.media||[]){const li=document.createElement('li');li.textContent=(item.warning?'Do optymalizacji: ':'')+item.file+' — '+Math.round(item.bytes/1024)+' KB';list.append(li);}}catch(error){status.textContent=error.message;}finally{button.disabled=false;}};
 document.querySelector('#preflight-run').onclick=()=>window.runAdminPreflight();
 const stats=document.querySelector('#admin-stats'),list=document.querySelector('#backup-list'),state=document.querySelector('#backup-status'),create=document.querySelector('#backup-create');
 const node=(tag,text,className)=>{const el=document.createElement(tag);if(text)el.textContent=text;if(className)el.className=className;return el;};
 window.loadAdminStats=async()=>{
  if(stats.hidden)return;
  try{const data=await api('/api/admin/stats');if(stats.hidden)return;stats.replaceChildren();
   for(const [key,label]of [['drafts','Zapisane szkice'],['hiddenPhotos','Ukryte zdjęcia'],['albumOnly','Tylko w albumach'],['unread','Nowe wiadomości']]){const card=node('div',null,'admin-stat');card.append(node('strong',String(data[key]||0)),node('span',label));stats.append(card);}
  }catch(error){if(!stats.hidden)stats.textContent='Nie udało się odświeżyć wskaźników.';}
 };
 let timer;document.addEventListener('portfolio-admin-data-change',()=>{clearTimeout(timer);timer=setTimeout(()=>window.loadAdminStats(),150);});
 async function confirmRestore(item){return new Promise(resolve=>{
  const dialog=node('dialog',null,'admin-delete-dialog');dialog.append(node('h2','Przywrócić tę kopię?'),node('p','Baza zostanie zastąpiona: treści, wiadomości, szkice i konto administratora wrócą do stanu z '+new Date(item.createdAt).toLocaleString('pl-PL')+'. Najpierw utworzymy kopię obecnego stanu. Po operacji zalogujesz się ponownie hasłem z przywróconej kopii.'));
  const label=node('label','Wpisz PRZYWRÓĆ, aby potwierdzić');const input=node('input');input.autocomplete='off';label.append(input);const actions=node('div',null,'form-actions'),cancel=node('button','Anuluj','subtle'),ok=node('button','Przywróć kopię','danger');cancel.type=ok.type='button';ok.disabled=true;
  let accepted=false;input.addEventListener('input',()=>ok.disabled=input.value.trim()!=='PRZYWRÓĆ');cancel.onclick=()=>dialog.close();ok.onclick=()=>{accepted=true;dialog.close();};actions.append(cancel,ok);dialog.append(label,actions);dialog.addEventListener('close',()=>{dialog.remove();resolve(accepted);},{once:true});document.body.append(dialog);dialog.showModal();input.focus();
 });}
 window.loadAdminBackups=async()=>{
  const data=await api('/api/backups');list.replaceChildren();document.querySelector('#backup-location').textContent='Folder kopii: '+data.location;
  if(!data.items.length)list.append(node('p','Nie masz jeszcze pełnej kopii.'));
  for(const item of data.items){const card=node('article',null,'backup-entry');const info=node('div');info.append(node('strong',new Date(item.createdAt).toLocaleString('pl-PL')),node('p',(item.bytes/1024/1024).toFixed(1)+' MB · '+item.files+' plików'+(item.reason==='before-restore'?' · zabezpieczenie przed przywróceniem':item.reason==='automatic'?' · automatyczna':' · ręczna'),'admin-hint'));
   const restore=node('button','Przywróć','subtle');restore.type='button';restore.onclick=async()=>{
    if(!await confirmRestore(item))return;restore.disabled=true;create.disabled=true;state.textContent='Tworzenie kopii bezpieczeństwa i przywracanie… Nie zamykaj serwera.';
    try{await api('/api/backups/'+item.id+'/restore',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:item.id,confirmation:'RESTORE'})});state.textContent='Przywrócono. Zaloguj się ponownie hasłem z kopii.';await refreshAuth();status('Przywrócono kopię. Zaloguj się ponownie.');}
    catch(error){state.textContent=error.message;restore.disabled=false;}finally{create.disabled=false;}
   };card.append(info,restore);list.append(card);
  }
 };
 create.onclick=async()=>{create.disabled=true;state.textContent='Tworzenie kopii bazy i zdjęć…';try{await api('/api/backups',{method:'POST'});await window.loadAdminBackups();state.textContent='Kopia gotowa — baza i zdjęcia zapisane razem.';}catch(error){state.textContent=error.message;}finally{create.disabled=false;}};
 document.querySelector('#backup-refresh').onclick=()=>window.loadAdminBackups().catch(error=>state.textContent=error.message);
 if(!stats.hidden)window.loadAdminStats();
})();
