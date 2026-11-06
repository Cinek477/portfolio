// Karty projektów i osiągnięć; zachowanie rozwinięcia i pomijanie identycznych danych.
window.portfolioPages ||= {};
window.portfolioPages['projects.js'] = () => {
  const pageScope = window.portfolioPageScope || {
    signal: new AbortController().signal,
    cleanup: () => {},
  };
  let projects = window.portfolioProjects || [];
  const rendered = new WeakMap();
  const expandedCards = new Set(history.state?.portfolioExpandedCards || []);
  const collapsedCards = new Set();
  const illustrations = {
    'projects-0': 'assets/images/projects/illustrations/oop.svg',
    'projects-1': 'assets/images/projects/illustrations/database.svg',
    'projects-2': 'assets/images/projects/illustrations/matura.svg',
    'achievements-1': 'assets/images/projects/illustrations/hackyeah.svg',
    'achievements-0': 'assets/images/projects/illustrations/krakhack.svg',
  };
  const local = (value) =>
    typeof value === 'string' ? value : value?.[document.documentElement.lang] || value?.pl || '';
  const translated = (pl, en) => (document.documentElement.lang === 'en' ? en : pl);
  function render() {
    for (const section of ['achievements', 'projects', 'featured-projects']) {
      const grid = document.querySelector(`#${section} .projects-grid`);
      if (!grid) continue;
      const items = section === 'featured-projects'
        ? (window.portfolioHome?.featured || ['achievements-1', 'projects-0', 'achievements-0']).map(id => projects.find(project => project.id === id && project.visible !== false)).filter(Boolean)
        : projects.filter((project) => project.section === section && project.visible !== false);
      const signature = JSON.stringify([document.documentElement.lang, items]);
      if (rendered.get(grid) === signature) continue;
      rendered.set(grid, signature);
      const focused = document.activeElement;
      const focusedKey = grid.contains(focused) && focused?.classList.contains('card-toggle')
        ? focused.getAttribute('aria-controls') : null;
      grid.replaceChildren();
      if (!items.length) {
        const empty = document.createElement('p');
        empty.textContent = translated(
          'Nowe projekty pojawią się wkrótce.',
          'New projects coming soon.',
        );
        grid.append(empty);
      }
      items.forEach((project, index) => {
        const card = document.createElement('article');
        card.className = 'card';
        card.setAttribute('data-project-id', project.id);
        if (section === 'featured-projects' && ['achievements-1', 'achievements-0'].includes(project.id)) card.classList.add('achievement-fade');
        const cardKey = `${section}:${project.id}`;
        if (expandedCards.has(cardKey)) card.classList.add('expanded');
        if (collapsedCards.has(cardKey)) card.classList.add('is-collapsed');
        card.addEventListener('pointerenter', (event) => {
          if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
            collapsedCards.delete(cardKey);
            card.classList.remove('is-collapsed');
            card.classList.add('is-hovered');
          }
        });
        card.addEventListener('pointerleave', () => card.classList.remove('is-hovered'));
        card.addEventListener('pointercancel', () => card.classList.remove('is-hovered'));
        const illustration = project.section === 'projects' && !project.src ? illustrations[project.id] : '';
        const savedIllustration = project.src && project.src.replace(/^\//, '') === illustrations[project.id];
        if (illustration || savedIllustration) {
          card.classList.add('project-illustration-card');
          const colors = { 'projects-0': '#c6a2de', 'projects-1': '#acd8d7', 'projects-2': '#b6d7f4', 'achievements-1': '#c6d6f5', 'achievements-0': '#b9e1e6' };
          card.style.setProperty('--project-art-bg', colors[project.id]);
        }
        const imageSrc = project.src || illustration;
        const thumbnail = project.src ? project.thumbUrl : illustration;
        let media;
        if (imageSrc) {
          card.classList.add('project-photo-card');
          media = document.createElement('div');
          media.className = 'project-media';
          const image = new Image();
          image.src = thumbnail || imageSrc;
          image.addEventListener(
            'error',
            () => {
              if (thumbnail) image.src = imageSrc;
            },
            { once: true },
          );
          image.decoding = 'async';
          image.alt = local(project.title);
          image.className = 'project-cover';
          image.loading = 'lazy';
          media.append(image);
        }
        const top = document.createElement('div');
        top.className = 'card-top';
        const number = document.createElement('span');
        number.className = 'card-number';
        number.textContent = String(project.year);
        const symbol = document.createElement('span');
        symbol.className = 'card-symbol';
        symbol.setAttribute('aria-hidden', 'true');
        symbol.textContent = (project.symbol && project.symbol !== '↗' && project.symbol !== '✎') ? project.symbol : (project.section === 'achievements' ? '#1' : '{ }');
        top.append(number, symbol);
        const title = document.createElement('h3');
        title.textContent = local(project.title);
        const summary = document.createElement('p');
        summary.className = 'card-summary';
        summary.textContent = local(project.summary);
        const toggle = document.createElement('button');
        toggle.className = 'card-toggle';
        toggle.type = 'button';
        toggle.setAttribute('aria-expanded', String(expandedCards.has(cardKey)));
        toggle.setAttribute(
          'aria-label',
          `${translated('Szczegóły', 'Details')}: ${local(project.title)}`,
        );
        const details = document.createElement('div');
        details.className = 'card-details';
        details.id = `${section}-detail-${project.id}`;
        toggle.setAttribute('aria-controls', details.id);
        const inner = document.createElement('div');
        if (local(project.description)) {
          const description = document.createElement('p');
          description.className = 'project-description';
          description.textContent = local(project.description);
          inner.append(description);
        }
        if (project.technologies) {
          const technologies = document.createElement('p');
          technologies.className = 'project-technologies';
          technologies.textContent = project.technologies;
          inner.append(technologies);
        }
        const actions = document.createElement('div');
        actions.className = 'project-card-actions';
        if (project.caseStudy?.enabled) {
          const pageLink = document.createElement('a');
          pageLink.href = 'project.html?id=' + encodeURIComponent(project.id);
          pageLink.textContent = translated('Poznaj projekt', 'Explore the project');
          actions.append(pageLink);
        }
        if (
          project.link &&
          (/^https?:\/\/[^\s]+$/i.test(project.link) ||
            /^(?:contact\.html|#projects)$/.test(project.link))
        ) {
          const link = document.createElement('a');
          link.href = project.link;
          link.textContent = project.caseStudy?.enabled ? translated('Repozytorium', 'Repository') : translated('Przejdź do projektu', 'View project');
          if (project.caseStudy?.enabled) link.className = 'project-repository-link';
          if (/^https?:/i.test(project.link)) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
          actions.append(link);
        }
        if (project.demoUrl && /^https?:\/\/[^\s]+$/i.test(project.demoUrl)) {
          const demo = document.createElement('a');
          demo.href = project.demoUrl;
          demo.textContent = translated('Demo wideo', 'Video demo');
          demo.className = 'project-repository-link';
          demo.target = '_blank';
          demo.rel = 'noopener noreferrer';
          actions.append(demo);
        }
        if (actions.children.length) inner.append(actions);
        details.append(inner);
        toggle.addEventListener('click', () => {
          const expanded = card.classList.toggle('expanded');
          if (expanded) {
            expandedCards.add(cardKey);
            collapsedCards.delete(cardKey);
            card.classList.remove('is-collapsed');
          } else {
            expandedCards.delete(cardKey);
            collapsedCards.add(cardKey);
            card.classList.add('is-collapsed');
          }
          toggle.setAttribute('aria-expanded', String(expanded));
          history.replaceState({ ...history.state, portfolioExpandedCards: [...expandedCards] }, '', location.href);
          if (!expanded && !matchMedia('(hover: hover)').matches) toggle.blur();
        });
        if (media) {
          const caption = document.createElement('div');
          caption.className = 'project-photo-caption';
          caption.append(title, summary);
          media.append(top, caption);
          card.append(media, toggle, details);
        } else card.append(top, title, summary, toggle, details);
        grid.append(card);
        if (focusedKey === details.id) toggle.focus({ preventScroll: true });
      });
    }
  }
  render();
  document.addEventListener('portfolio-language-change', render, { signal: pageScope.signal });
  document.addEventListener('portfolio-home-change', render, { signal: pageScope.signal });
  if (location.protocol !== 'file:')
    fetch('/api/projects', { signal: pageScope.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Brak lokalnego API');
        return response.json();
      })
      .then((data) => {
        if (!pageScope.signal.aborted && Array.isArray(data)) {
          projects = data;
          render();
        }
      })
      .catch(() => {});
};
if (!window.portfolioRouting) window.portfolioPages['projects.js']();
