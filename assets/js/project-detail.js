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
    for(const item of candidates){const link=document.createElement('a');link.className='related-project';link.href='project.html?id='+encodeURIComponent(item.id);if(item.thumbUrl||item.src){const picture=new Image();picture.src=item.thumbUrl||item.src;picture.alt='';picture.loading='lazy';link.append(picture);}const heading=document.createElement('h3');heading.textContent=local(item.caseStudy.title||item.title);const cta=document.createElement('span');cta.textContent=local({pl:'Poznaj projekt',en:'Explore the project'});link.append(heading,cta);grid.append(link);}
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
