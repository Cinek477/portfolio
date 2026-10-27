(() => {
  const normalize=value=>String(value??'').toLocaleLowerCase('pl').normalize('NFD').replace(/\p{M}/gu,'').replace(/ł/g,'l');
  const flatten=value=>Array.isArray(value)?value.map(flatten).join(' '):value&&typeof value==='object'?Object.values(value).map(flatten).join(' '):String(value??'');
  window.adminSearchText=(...values)=>values.map(flatten).join(' ');
  window.adminSearchMatches=(value,query)=>normalize(query).trim().split(/\s+/).filter(Boolean).every(word=>normalize(value).includes(word));
  window.createAdminSearch=(list,placeholder,onQuery=()=>{})=>{
    const box=document.createElement('div');box.className='admin-search';
    const label=document.createElement('label');label.textContent='Szukaj na liście';
    const row=document.createElement('div');row.className='admin-search-row';
    const input=document.createElement('input');input.type='search';input.placeholder=placeholder;input.maxLength=200;input.autocomplete='off';
    const clear=document.createElement('button');clear.type='button';clear.className='subtle';clear.textContent='Wyczyść';clear.hidden=true;
    label.append(input);row.append(label,clear);
    const count=document.createElement('p');count.className='admin-hint';count.setAttribute('role','status');count.setAttribute('aria-live','polite');
    box.append(row,count);list.before(box);
    let timer;
    function apply(){
      const query=input.value.trim();clear.hidden=!query;let visible=0;
      const cards=[...list.children].filter(card=>card.hasAttribute('data-search-text'));
      for(const card of cards){card.hidden=!window.adminSearchMatches(card.dataset.searchText,query);if(!card.hidden)visible++;}
      count.textContent=query?visible?'Wyniki: '+visible+' / '+cards.length:'Brak pasujących wpisów. Zmień frazę lub filtr.':'';
      onQuery(Boolean(query));
    }
    input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(apply,100);});
    clear.addEventListener('click',()=>{clearTimeout(timer);input.value='';apply();input.focus();});
    new MutationObserver(apply).observe(list,{childList:true});
    return {apply,clear:()=>{input.value='';apply();}};
  };
})();
