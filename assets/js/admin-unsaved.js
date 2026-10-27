(() => {
 const forms=new Set(['photo-form','project-form','review-form']),dirty=new Set();
 window.markAdminClean=form=>{if(form)dirty.delete(form.id);};
 for(const type of ['input','change'])document.addEventListener(type,event=>{const form=event.target.closest('form');if(forms.has(form?.id))dirty.add(form.id);});
 addEventListener('beforeunload',event=>{if(dirty.size){event.preventDefault();event.returnValue='';}});
 document.addEventListener('click',event=>{
  const target=event.target.closest('button,a');if(!target||!dirty.size)return;
  const form=target.closest('form');
  const navigation=target.matches('[data-panel],#logout,a[href]')||target.matches('#cancel,#project-cancel,#review-reset')||(!form&&target.textContent.trim()==='Edytuj');
  if(!navigation)return;
  if(!confirm('Masz niezapisane zmiany. Odrzucić je i kontynuować?')){event.preventDefault();event.stopImmediatePropagation();return;}
  for(const id of dirty){const current=document.getElementById(id);current?.dispatchEvent(new Event('admin-discard'));}dirty.clear();
 },true);
})();
