window.portfolioPages ||= {};
window.portfolioPages['project-detail.js'] = async () => {
  const main = document.querySelector('.project-detail-page');
  if (!main) return;
  const signal = window.portfolioPageScope?.signal || new AbortController().signal;
  const slug = decodeURIComponent(location.pathname.split('/').pop());
  const id = new URL(location.href).searchParams.get('id') || ({'swoja-droga':'achievements-1','krakhack':'achievements-0'}[slug] || slug);
  const local = value => typeof value === 'string' ? value : value?.[document.documentElement.lang] || value?.pl || '';
  const title = main.querySelector('#project-detail-title');
  const summary = main.querySelector('#project-detail-summary');
  const repository = main.querySelector('#project-detail-repository');
  const demo = main.querySelector('#project-detail-demo');
  const demoSection = main.querySelector('#project-demo');
  const demoIframe = main.querySelector('#project-demo-iframe');
  const demoExternal = main.querySelector('#project-demo-external');
  const image = main.querySelector('#project-detail-image');
  let project;
  function text(element, value) {
    element.dataset.pl = typeof value === 'string' ? value : value?.pl || '';
    element.dataset.en = typeof value === 'string' ? value : value?.en || value?.pl || '';
    element.textContent = local(value);
  }
  function render() {
    if (!project || signal.aborted || !main.isConnected) return;
    const related=main.querySelector('.related-projects'),grid=related.querySelector('.related-projects-grid');grid.replaceChildren();
    const candidates=projects.filter(item=>item.id!==id&&item.visible!==false&&item.caseStudy?.enabled).sort((a,b)=>Number(b.section===project.section)-Number(a.section===project.section)).slice(0,2);
    related.hidden=!candidates.length;
    const illustrations={'projects-0':'assets/images/projects/illustrations/oop.svg','projects-1':'assets/images/projects/illustrations/database.svg','projects-2':'assets/images/projects/illustrations/matura.svg','achievements-1':'assets/images/projects/illustrations/hackyeah.svg','achievements-0':'assets/images/projects/illustrations/krakhack.svg'};
    const colors={'projects-0':'#c6a2de','projects-1':'#acd8d7','projects-2':'#b6d7f4','achievements-1':'#c6d6f5','achievements-0':'#b9e1e6'};
    for(const item of candidates){
      const card=document.createElement('article');card.className='card';card.setAttribute('data-project-id',item.id);
      card.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'||e.pointerType==='pen'){card.classList.remove('is-collapsed');card.classList.add('is-hovered');}});
      card.addEventListener('pointerleave',()=>card.classList.remove('is-hovered'));
      card.addEventListener('pointercancel',()=>card.classList.remove('is-hovered'));
      const illustration=item.section==='projects'&&!item.src?illustrations[item.id]:'';
      const savedIllustration=item.src&&item.src.replace(/^\//,'')===illustrations[item.id];
      if(illustration||savedIllustration){card.classList.add('project-illustration-card');card.style.setProperty('--project-art-bg',colors[item.id]);}
      const imageSrc=item.src||illustration,thumbnail=item.src?item.thumbUrl:illustration;
      let media;
      if(imageSrc){
        card.classList.add('project-photo-card');media=document.createElement('div');media.className='project-media';
        const picture=new Image();picture.src=thumbnail||imageSrc;
        picture.addEventListener('error',()=>{if(thumbnail)picture.src=imageSrc;},{once:true});
        picture.decoding='async';picture.alt=local(item.title);picture.className='project-cover';picture.loading='lazy';
        media.append(picture);
      }
      const top=document.createElement('div');top.className='card-top';
      const number=document.createElement('span');number.className='card-number';number.textContent=String(item.year);
      const symbol=document.createElement('span');symbol.className='card-symbol';symbol.setAttribute('aria-hidden','true');
      symbol.textContent=(item.symbol&&item.symbol!=='↗'&&item.symbol!=='✎')?item.symbol:(item.section==='achievements'?'#1':'{ }');
      top.append(number,symbol);
      const heading=document.createElement('h3');heading.textContent=local(item.title);
      const cardSummary=document.createElement('p');cardSummary.className='card-summary';cardSummary.textContent=local(item.summary);
      const toggle=document.createElement('button');toggle.className='card-toggle';toggle.type='button';
      toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label',`${local({pl:'Szczegóły',en:'Details'})}: ${local(item.title)}`);
      const details=document.createElement('div');details.className='card-details';details.id=`related-detail-${item.id}`;
      toggle.setAttribute('aria-controls',details.id);
      const inner=document.createElement('div');
      if(local(item.description)){const desc=document.createElement('p');desc.className='project-description';desc.textContent=local(item.description);inner.append(desc);}
      if(item.technologies){const tech=document.createElement('p');tech.className='project-technologies';tech.textContent=item.technologies;inner.append(tech);}
      const actions=document.createElement('div');actions.className='project-card-actions';
      const pageLink=document.createElement('a');pageLink.href='project.html?id='+encodeURIComponent(item.id);pageLink.textContent=local({pl:'Poznaj projekt',en:'Explore the project'});actions.append(pageLink);
      if(item.link&&(/^https?:\/\/[^\s]+$/i.test(item.link)||/^(?:contact\.html|#projects)$/.test(item.link))){
        const repoLink=document.createElement('a');repoLink.href=item.link;repoLink.textContent=local({pl:'Repozytorium',en:'Repository'});repoLink.className='project-repository-link';
        if(/^https?:/i.test(item.link)){repoLink.target='_blank';repoLink.rel='noopener noreferrer';}
        actions.append(repoLink);
      }
      if(item.demoUrl&&/^https?:\/\/[^\s]+$/i.test(item.demoUrl)){
        const demoLink=document.createElement('a');demoLink.href=item.demoUrl;demoLink.textContent=local({pl:'Demo wideo',en:'Video demo'});demoLink.className='project-repository-link';demoLink.target='_blank';demoLink.rel='noopener noreferrer';
        actions.append(demoLink);
      }
      inner.append(actions);details.append(inner);
      toggle.addEventListener('click',()=>{const expanded=card.classList.toggle('expanded');card.classList.toggle('is-collapsed',!expanded);toggle.setAttribute('aria-expanded',String(expanded));});
      if(media){const caption=document.createElement('div');caption.className='project-photo-caption';caption.append(heading,cardSummary);media.append(top,caption);card.append(media,toggle,details);}
      else card.append(top,heading,cardSummary,toggle,details);
      grid.append(card);
    }
    const page = project.caseStudy;
    main.querySelector('.hero-actions').hidden = false;
    text(title, page.title);
    document.title = local(page.title) + ' — Marcin Podyma';
    text(summary, project.summary);
    const award = main.querySelector('.case-outcome');
    award.hidden = project.section !== 'achievements' || !local(project.summary);
    text(main.querySelector('#case-outcome-text'), project.summary);
    summary.hidden = !local(project.summary) || !award.hidden;
    const cycling = project.id === 'achievements-0';
    main.querySelector('.case-explainer').hidden = !cycling && project.id !== 'achievements-1';
    text(main.querySelector('#case-explainer-title'), cycling
      ? { pl: 'Od danych do lepszej infrastruktury', en: 'From data to better infrastructure' }
      : { pl: 'Od potrzeb do własnej drogi', en: 'From needs to a personal route' });
    const flow = cycling ? [
      [{ pl: 'Dane miejskie', en: 'City data' }, { pl: 'OpenStreetMap, ścieżki i liczniki rowerowe', en: 'OpenStreetMap, cycle paths and traffic counters' }],
      [{ pl: 'Symulacja ruchu', en: 'Traffic simulation' }, { pl: 'Wirtualni rowerzyści i scenariusze wzrostu', en: 'Virtual cyclists and growth scenarios' }],
      [{ pl: 'Mapa wąskich gardeł', en: 'Bottleneck map' }, { pl: 'Przeciążenia, opóźnienia i porównanie wyników', en: 'Congestion, delays and scenario comparisons' }]
    ] : [
      [{ pl: 'Twoje potrzeby', en: 'Your needs' }, { pl: 'Tempo, odpoczynek i dostępność', en: 'Pace, rest and accessibility' }],
      [{ pl: 'Dane + AI', en: 'Data + AI' }, { pl: 'Miasto, mapa i zgłoszenia użytkowników', en: 'City data, maps and user reports' }],
      [{ pl: 'Dopasowana trasa', en: 'A tailored route' }, { pl: 'Kraków zgodnie z Twoimi potrzebami', en: 'Kraków, around your needs' }]
    ];
    main.querySelectorAll('.case-flow-node').forEach((node, index) => {
      text(node.querySelector('h3'), flow[index][0]); text(node.querySelector('p'), flow[index][1]);
    });
    text(main.querySelector('#project-detail-meta'), project.title);
    for (const key of ['problem', 'solution', 'contribution', 'result']) {
      const section = main.querySelector('[data-story="' + key + '"]');
      const value = page[key];
      section.hidden = !local(value).trim();
      text(section.querySelector('.project-story-text'), value);
    }
    const tags = main.querySelector('#project-detail-tags'); tags.replaceChildren();
    for (const technology of (project.technologies || '').split(',').map(s => s.trim()).filter(Boolean)) {
      const tile = document.createElement('div'); tile.className = 'project-tech-tile';
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      icon.setAttribute('viewBox', '0 0 32 32'); icon.setAttribute('aria-hidden', 'true');
      const paths = {
        python: 'M16 4H10a5 5 0 0 0-5 5v7h11v3H8v4a5 5 0 0 0 5 5h9a5 5 0 0 0 5-5V12H16V9h8a5 5 0 0 0-5-5h-3ZM11 8h.01M22 24h.01',
        fastapi: 'M18 3 6 18h9l-1 11 12-16h-9l1-10Z',
        react: 'M16 14v4m-2-2h4M29 16c0 4-26 4-26 0s26-4 26 0ZM22.5 27.3c-3.5 2-16.5-20.6-13-22.6s16.5 20.6 13 22.6ZM9.5 27.3c-3.5-2 9.5-24.6 13-22.6s-9.5 24.6-13 22.6Z',
        sqlite: 'M5 8c0-6 22-6 22 0s-22 6-22 0Zm0 0v16c0 6 22 6 22 0V8M5 16c0 6 22 6 22 0',
        ai: 'm16 3 3.5 9.5L29 16l-9.5 3.5L16 29l-3.5-9.5L3 16l9.5-3.5L16 3Z',
        generic: 'm10 8-8 8 8 8m12-16 8 8-8 8M19 4l-6 24'
      };
      const key = technology.toLowerCase();
      if (key === 'typescript') {
        const label = document.createElementNS(icon.namespaceURI, 'text');
        label.setAttribute('x', '16'); label.setAttribute('y', '22'); label.setAttribute('text-anchor', 'middle'); label.textContent = 'TS'; icon.append(label);
      } else {
        const path = document.createElementNS(icon.namespaceURI, 'path'); path.setAttribute('d', paths[key] || paths.generic); icon.append(path);
      }
      const name = document.createElement('span'); name.textContent = technology;
      tile.append(icon, name); tags.append(tile);
    }
    main.querySelector('.project-detail-tech').hidden = !tags.children.length;
    repository.hidden = !/^https?:\/\/[^\s]+$/i.test(project.link || '');
    if (!repository.hidden) repository.href = project.link;
    if (demo) {
      demo.hidden = !/^https?:\/\/[^\s]+$/i.test(project.demoUrl || '');
      if (!demo.hidden) demo.href = project.demoUrl;
    }
    if (demoSection && demoIframe) {
      const ytMatch = (project.demoUrl || '').match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
      const embedUrl = ytMatch ? `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0` : '';
      demoSection.hidden = !embedUrl;
      if (demoExternal && project.demoUrl) demoExternal.href = project.demoUrl;
      if (embedUrl && demoIframe.getAttribute('src') !== embedUrl) demoIframe.src = embedUrl;
    }
    const src = project.src || project.thumbUrl;
    image.closest('figure').hidden = !src;
    main.classList.toggle('without-cover', !src);
    main.style.setProperty('--case-art-bg', project.src?.includes('hackyeah.svg') ? '#c6d6f5' : project.src?.includes('krakhack.svg') ? '#b9e1e6' : 'var(--card)');
    if (src) { if (image.getAttribute('src') !== src) image.src = src; image.alt = local(page.title); }
    main.querySelector('#project-story').hidden = false;
    main.setAttribute('aria-busy', 'false');
  }
  function unavailable() {
    text(title, { pl: 'Projekt niedostępny', en: 'Project unavailable' });
    text(summary, { pl: 'Ten opis nie został jeszcze opublikowany lub projekt został ukryty. Wróć do listy, aby zobaczyć dostępne realizacje.', en: 'This story has not been published yet, or the project is hidden. Return to the list to explore available work.' });
    main.querySelector('#project-story').hidden = true;
    main.querySelector('.case-outcome').hidden = true;
    main.querySelector('.case-explainer').hidden = true;
    if (demoSection) demoSection.hidden = true;
    main.querySelector('.hero-actions').hidden = true;
    main.querySelector('.project-detail-cover').hidden = true;
    main.classList.add('without-cover'); main.setAttribute('aria-busy', 'false');
    document.title = local({ pl: 'Projekt niedostępny', en: 'Project unavailable' }) + ' — Marcin Podyma';
  }
  document.addEventListener('portfolio-language-change', () => project ? render() : unavailable(), { signal });
  image.addEventListener('error', () => {
    if (project?.thumbUrl && image.getAttribute('src') !== project.thumbUrl) image.src = project.thumbUrl;
    else image.closest('figure').hidden = true;
  }, { signal });
  let projects = window.portfolioProjects || [];
  if (location.protocol !== 'file:') {
    try {
      const response = await fetch('/api/projects', { signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) });
      if (!response.ok) throw new Error('Project list unavailable');
      projects = await response.json();
    } catch { if (signal.aborted) return; }
  }
  if (signal.aborted) return;
  project = projects.find(item => item.id === id && item.visible !== false && item.caseStudy?.enabled);
  project ? render() : unavailable();
};
if (!window.portfolioRouting) window.portfolioPages['project-detail.js']();
