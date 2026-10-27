(() => {
 const form=document.querySelector('#review-form'),list=document.querySelector('#review-list'),message=document.querySelector('#review-status');
 let editing=null;
 const node=(tag,text)=>{const el=document.createElement(tag);el.textContent=text;return el;};
 const reset=()=>{editing=null;form.reset();window.markAdminClean?.(form);};
 const save=async item=>api('/api/reviews'+(item.id?'/'+item.id:''),{method:item.id?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(item)});
 window.loadAdminReviews=async()=>{const items=await api('/api/reviews');list.replaceChildren();if(!items.length)list.append(node('p','Nie dodano jeszcze opinii.'));
 for(const item of items){const card=node('article','');card.className='admin-panel';card.append(node('h3',item.author+' · '+item.rating+'/5'),node('p',item.text),node('p',item.archived?'Archiwum':item.visible?'Widoczna na stronie':'Ukryta'));const actions=node('div','');actions.className='form-actions';
 for(const [label,action] of [['Edytuj',()=>{editing=item;for(const key of ['author','text','context','textEn','contextEn','rating'])form.elements[key].value=item[key];form.elements.visible.checked=item.visible;window.markAdminClean?.(form);form.scrollIntoView({block:'start',behavior:'smooth'});}], [item.visible?'Ukryj':'Pokaż',async()=>{await save({...item,visible:!item.visible});await window.loadAdminReviews();}], [item.archived?'Przywróć z archiwum':'Archiwizuj',async()=>{if(!item.archived&&!confirm('Przenieść opinię „'+item.author+'” do archiwum? Możesz ją później przywrócić.'))return;await save({...item,archived:!item.archived});if(editing?.id===item.id)reset();await window.loadAdminReviews();}]]){const button=node('button',label);button.type='button';button.className='subtle';button.onclick=async()=>{button.disabled=true;try{await action();}catch(error){message.textContent=error.message;}finally{button.disabled=false;}};actions.append(button);}card.append(actions);list.append(card);}
 };
 form.onsubmit=async event=>{event.preventDefault();const button=form.querySelector('[type=submit]');button.disabled=true;try{const item={id:editing?.id,archived:editing?.archived||false,visible:form.elements.visible.checked,rating:Number(form.elements.rating.value)};for(const key of ['author','text','context','textEn','contextEn'])item[key]=form.elements[key].value;await save(item);reset();await window.loadAdminReviews();message.textContent='Zapisano opinię.';}catch(error){message.textContent=error.message;}finally{button.disabled=false;}};
 form.addEventListener('admin-discard',reset);
 document.querySelector('#review-reset').onclick=reset;
})();
