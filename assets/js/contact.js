window.portfolioPages ||= {};
window.portfolioPages['contact.js'] = async () => {
  const scope = window.portfolioPageScope || { signal:new AbortController().signal };
  const form = document.querySelector('#contact-form');
  const steps = [...form.querySelectorAll('.wizard-step')];
  const email = form.elements.email, message = form.elements.message;
  const status = document.querySelector('#contact-status');
  const detailOptions = document.querySelector('#wizard-details');
  const questions = document.querySelector('#wizard-questions');
  const summary = document.querySelector('#wizard-summary');
  const offer = document.querySelector('#wizard-offer');
  let config = window.portfolioPageContent?.contact;
  try { const response=await fetch('/api/pages/contact',{signal:scope.signal}); if(response.ok) config=await response.json(); } catch { if(scope.signal.aborted)return; }
  if(scope.signal.aborted || !form.isConnected)return;
  const english=()=>document.documentElement.lang==='en';
  const text=(pl,en)=>english()?en:pl;
  const fields=new Map((config?.editor?.groups||[]).flatMap(group=>group.fields.map(field=>[group.id+'-'+field.id,field.value])));
  const label=(key,pair)=>{const value=fields.get(key);return value ? value[english()?'en':'pl']||value.pl : text(...pair);};
  for(const group of config?.editor?.groups||[]) {
    for(const field of group.fields) {
      const el=form.closest('main').querySelector('[data-cms-text="'+group.id+'-'+field.id+'"]');
      if(el){el.dataset.pl=field.value.pl;el.dataset.en=field.value.en||field.value.pl;el.textContent=el.dataset[document.documentElement.lang]||el.dataset.pl;}
    }
    for(const link of group.links){const el=document.querySelector('[data-cms-link="'+group.id+'-'+link.id+'"]');if(el){el.href=link.href;el.hidden=!link.visible;}}
  }
  const categories={it:['Projekt IT','IT project'],photo:['Fotografia','Photography'],tutoring:['Korepetycje','Tutoring'],other:['Inne','Other']};
  const details={it:[['web','Aplikacja webowa','Web application'],['hackathon','Hackathon','Hackathon'],['other','Inny pomysł','Another idea']],photo:[['concert','Koncert','Concert'],['portrait','Portret / Plener','Portrait / Outdoor'],['event','Impreza / Event','Celebration / Event']],tutoring:[['basic','Matematyka podstawowa','Basic mathematics'],['advanced','Matematyka rozszerzona','Advanced mathematics'],['university','Matematyka akademicka','University mathematics'],['other','Inny zakres','Another subject']],other:[['other','Inna sprawa','Something else']]};
  const questionSets={
    tutoring:[['topic','Jaki temat chcesz przećwiczyć?','What topic would you like to work on?'],['frequency','Jak chcesz się spotykać?','How would you like to meet?',['Jednorazowe zajęcia','One-off lesson'],['Regularne spotkania','Regular lessons']]],
    photo:[['place','Gdzie planujesz sesję lub wydarzenie?','Where is the session or event?'],['timing','Jaki termin masz na myśli?','What date do you have in mind?']],
    it:[['idea','Co chcesz stworzyć lub usprawnić?','What would you like to build or improve?'],['timing','Czy masz planowany termin?','Do you have a timeline?']],
    other:[['topic','Czego dotyczy Twoja sprawa?','What would you like to discuss?']]
  };
  const packages={start:['START — lekcja pokazowa','START — introductory lesson'],single:['Jedno spotkanie','One-off lesson'],regular:['Regularna nauka','Regular learning'],matura:['Przygotowanie do matury','Matura preparation']};
  function renderTopics(){
    form.querySelectorAll('[name="category"]').forEach(radio=>{const el=form.querySelector('label[for="'+radio.id+'"]'); const value=fields.get('topics-'+radio.value); if(value){el.dataset.pl=value.pl;el.dataset.en=value.en||value.pl;} el.textContent=label('topics-'+radio.value,categories[radio.value]);});
  }
  renderTopics();
  const query=new URLSearchParams(location.search);
  let category=Object.hasOwn(categories,query.get('category'))?query.get('category'):'';
  const initialCategory=category;
  const packageId=category==='tutoring'&&Object.hasOwn(packages,query.get('package'))?query.get('package'):'';
  const collaboration=category==='photo'&&['paid','accreditation'].includes(query.get('collaboration'))?query.get('collaboration'):'';
  const answers={it:{},photo:{},tutoring:{},other:{}};
  if(category){const requested=query.get('details')||(collaboration==='paid'?'portrait':collaboration?'concert':'');if(details[category].some(([id])=>id===requested))answers[category].detail=requested;}
  let currentStep=1,sending=false,submitted=false,requestId='',requestKey='';
  function offerText(){if(category!==initialCategory)return '';if(packageId)return label('packages-'+packageId,packages[packageId]);if(collaboration)return label('photo-offers-'+collaboration,collaboration==='paid'?['Sesja lub impreza prywatna','Session or private celebration']:['Akredytacja na koncert / event','Concert / event accreditation']);return '';}
  function updateOffer(){const value=offerText();offer.hidden=!value;offer.textContent=value?text('Wybrana oferta: ','Selected offer: ')+value:'';}
  function detailLabel(id){const option=details[category].find(item=>item[0]===id);return option?label('details-'+category+'-'+id,option.slice(1)):'';}
  function renderQuestions(){
    detailOptions.replaceChildren();questions.replaceChildren();
    if(category==='other')answers.other.detail='other';
    for(const [id,pl,en] of details[category]){
      const radio=document.createElement('input');radio.type='radio';radio.name='details';radio.value=id;radio.id='detail-'+id;radio.className='contact-radio';radio.checked=answers[category].detail===id;
      radio.addEventListener('change',()=>{answers[category].detail=id;status.textContent='';});
      const caption=document.createElement('label');caption.htmlFor=radio.id;caption.textContent=label('details-'+category+'-'+id,[pl,en]);detailOptions.append(radio,caption);
    }
    detailOptions.closest('fieldset').hidden=category==='other';
    for(const [id,pl,en,...choices] of questionSets[category]){
      const wrapper=document.createElement(choices.length?'fieldset':'label');wrapper.className=choices.length?'contact-choice-field':'contact-field';
      const caption=document.createElement(choices.length?'legend':'span');caption.textContent=label('questions-'+category+'-'+id,[pl,en]);wrapper.append(caption);
      if(choices.length){
        const options=document.createElement('div');options.className='contact-topic-options';
        [[null,['Do ustalenia','To discuss']],...choices.map((pair,index)=>[String(index),pair])].forEach(([value,pair])=>{
          const radio=document.createElement('input');radio.type='radio';radio.name='question-'+id;radio.id='question-'+id+'-'+(value??'none');radio.className='contact-radio';radio.value=value??'';radio.checked=(answers[category][id]||'')===radio.value;
          radio.addEventListener('change',()=>{answers[category][id]=radio.value;});
          const option=document.createElement('label');option.htmlFor=radio.id;option.textContent=value===null?text(...pair):label('choices-'+category+'-'+id+'-option-'+value,pair);options.append(radio,option);
        });wrapper.append(options);
      }else{
        const input=document.createElement('input');input.name='question-'+id;input.type='text';input.maxLength=250;input.placeholder=text('Opcjonalnie','Optional');input.value=answers[category][id]||'';input.addEventListener('input',()=>{answers[category][id]=input.value;});wrapper.append(input);
      }
      questions.append(wrapper);
    }
  }
  function summaryLines(){
    const lines=[text('Temat: ','Topic: ')+label('topics-'+category,categories[category])];
    if(offerText())lines.push(text('Oferta: ','Offer: ')+offerText());
    if(category!=='other')lines.push(text('Zakres: ','Subject: ')+detailLabel(answers[category].detail));
    for(const [id,pl,en,...choices] of questionSets[category]){
      const value=answers[category][id];if(!value)continue;
      lines.push(text(...({topic:['Temat','Topic'],frequency:['Spotkania','Lessons'],place:['Miejsce','Location'],timing:['Termin','Timing'],idea:['Pomysł','Idea']}[id]||[pl,en]))+': '+(choices.length?label('choices-'+category+'-'+id+'-option-'+value,choices[Number(value)]):value.trim()));
    }
    return lines;
  }
  function renderSummary(){
    summary.replaceChildren();const list=document.createElement('dl');
    for(const line of summaryLines()){
      const separator=line.indexOf(': '),row=document.createElement('div'),term=document.createElement('dt'),value=document.createElement('dd');
      term.textContent=line.slice(0,separator);value.textContent=line.slice(separator+2);row.append(term,value);list.append(row);
    }summary.append(list);
  }
  function renderSuccess(){
    steps.forEach(step=>{step.hidden=true;step.classList.remove('active');});offer.hidden=true;status.textContent='';
    let panel=form.querySelector('.contact-success');if(!panel){panel=document.createElement('section');panel.className='contact-success';panel.tabIndex=-1;panel.setAttribute('role','status');form.append(panel);}
    panel.replaceChildren();const icon=document.createElement('span');icon.className='contact-success-icon';icon.textContent='✓';icon.setAttribute('aria-hidden','true');
    const heading=document.createElement('h3');heading.textContent=text('Wiadomość wysłana','Message sent');const body=document.createElement('p');body.textContent=text('Dzięki za kontakt! Odpowiem na podany adres:','Thanks for reaching out! I will reply to:');
    const address=document.createElement('strong');address.textContent=email.value;panel.append(icon,heading,body,address);requestAnimationFrame(()=>panel.focus({preventScroll:true}));
  }
  function showStep(number,focus=true){
    currentStep=number;if(number===2)renderQuestions();if(number===3)renderSummary();updateOffer();
    steps.forEach((step,index)=>{step.hidden=index+1!==number;step.classList.toggle('active',index+1===number);});
    document.querySelector('#wizard-progress').textContent=String(number).padStart(2,'0')+' / 03';
    form.querySelectorAll('.wizard-progress-track span').forEach((segment,index)=>segment.classList.toggle('current',index<number));status.textContent='';
    if(focus){
      const heading=steps[number-1].querySelector('h3');heading.focus({preventScroll:true});
      if(matchMedia('(max-width:768px)').matches)requestAnimationFrame(()=>{
        if(scope.signal.aborted)return;
        const bounds=heading.getBoundingClientRect();
        if(bounds.top<100 || bounds.bottom>innerHeight-60)heading.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
      });
    }
  }
  function next(){
    if(currentStep===1&&!category){status.textContent=text('Wybierz temat, żeby przejść dalej.','Choose a topic to continue.');form.querySelector('[name="category"]').focus();return;}
    if(currentStep===2&&!answers[category].detail){status.textContent=text('Wybierz rodzaj zapytania.','Choose the type of enquiry.');detailOptions.querySelector('input')?.focus();return;}
    if(currentStep<3)showStep(currentStep+1);
  }
  form.querySelectorAll('[name="category"]').forEach(radio=>{radio.checked=radio.value===category;radio.addEventListener('change',()=>{category=radio.value;updateOffer();status.textContent='';});});
  form.querySelectorAll('.wizard-next').forEach(button=>button.addEventListener('click',next));
  form.querySelectorAll('.wizard-back').forEach(button=>button.addEventListener('click',()=>showStep(currentStep-1)));
  message.placeholder=text('Dodaj pytanie lub ważne informacje…','Add a question or anything else I should know…');
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(sending||submitted)return;if(currentStep<3){next();return;}
    email.value=email.value.trim();if(!email.reportValidity()||!message.reportValidity())return;
    const bodyMessage=text('Cześć Marcin!','Hi Marcin!')+'\n\n'+summaryLines().join('\n')+(message.value.trim()?'\n\n'+message.value.trim():'');
    const payload={email:email.value,category,details:answers[category].detail,message:bodyMessage};
    const key=JSON.stringify(payload);if(requestKey!==key){requestId=crypto.randomUUID();requestKey=key;}
    sending=true;form.inert=true;status.textContent=text('Wysyłanie…','Sending…');
    try{
      const response=await fetch('/api/contact',{method:'POST',signal:scope.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,requestId})});
      const result=await response.json();if(!response.ok)throw new Error(result.error||text('Nie udało się wysłać wiadomości.','Could not send your message.'));
      submitted=true;email.readOnly=true;message.readOnly=true;form.querySelectorAll('button').forEach(button=>button.disabled=true);
      renderSuccess();
    }catch(error){if(scope.signal.aborted)return;status.textContent=text('Nie udało się wysłać. Twoje odpowiedzi zostały zachowane. ','Could not send. Your answers are still here. ')+(error instanceof SyntaxError?'':error.message);}
    finally{sending=false;form.inert=false;}
  });
  document.addEventListener('portfolio-language-change',()=>{if(submitted){renderSuccess();return;}renderTopics();updateOffer();if(currentStep===2)renderQuestions();if(currentStep===3)renderSummary();message.placeholder=text('Dodaj pytanie lub ważne informacje…','Add a question or anything else I should know…');},{signal:scope.signal});
  showStep(category?2:1,false);
};
if(!window.portfolioRouting)window.portfolioPages['contact.js']();
