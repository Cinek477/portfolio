// Treści Start i O mnie: dane początkowe z eksportu, następnie aktualizacja przez API.
window.portfolioPages ||= {};
window.portfolioPages['page-content.js'] = () => {
  const main = document.querySelector('main[data-editable-page]');
  if (!main) return;
  const page = main.dataset.editablePage;
  const scope = window.portfolioPageScope || { signal: new AbortController().signal };
  const local = value => value?.[document.documentElement.lang] || value?.pl || '';
  const translated = (element, value) => {
    element.dataset.pl = value.pl;
    element.dataset.en = value.en;
    element.textContent = local(value);
  };
  let photoAlt;
  let signature;
  const updateAlt = () => {
    const image = main.querySelector(page === 'home' ? '.portrait img' : '.about-photo');
    if (image && photoAlt) image.alt = local(photoAlt);
  };
  document.addEventListener('portfolio-language-change', updateAlt, { signal: scope.signal });
  const apply = record => {
    if (scope.signal.aborted || !main.isConnected || !record?.content) return;
    const nextSignature = JSON.stringify([record.content, record.bio, record.featured, record.currentWork]);
    if (signature === nextSignature) return;
    signature = nextSignature;
    const content = record.content;
    for (const [key, value] of Object.entries(content.fields || {})) {
      const element = main.querySelector(`[data-page-field="${key}"]`);
      if (element) translated(element, value);
    }
    for (const [key, value] of Object.entries(content.links || {})) {
      const element = main.querySelector(`[data-page-link="${key}"]`);
      if (element) { element.href = value.href; element.hidden = !value.visible; }
    }
    if (page === 'home') {
      window.portfolioHome = record;
      const work=main.querySelector('.home-current-work');
      if(work){work.hidden=!record.currentWork?.visible;if(record.currentWork){translated(work.querySelector('h2'),record.currentWork.title);translated(work.querySelector('p'),record.currentWork.text);}}

      translated(main.querySelector('.hero-bio > p'), record.bio);
      const greeting = main.querySelector('.hero-heading .eyebrow');
      translated(greeting, content.greeting);
      greeting.hidden = !content.greeting.pl && !content.greeting.en;
      const heading = main.querySelector('.hero-heading h1');
      const base = document.createElement('span');
      base.className = 'page-heading-main';
      translated(base, content.heading);
      const accent = document.createElement('span');
      translated(accent, content.accent);
      accent.hidden = !content.accent.pl && !content.accent.en;
      heading.replaceChildren(base, document.createTextNode(' '), accent);
    } else {
      translated(main.querySelector('.about-greeting'), content.heading);
      translated(main.querySelector('.about-name'), content.accent);
      const story = main.querySelector('.about-story');
      story.querySelectorAll('.about-intro').forEach(element => element.remove());
      for (const paragraph of content.paragraphs) {
        const element = document.createElement('p');
        element.className = 'about-intro';
        translated(element, paragraph);
        story.append(element);
      }
      const sections = main.querySelector('.about-sections');
      sections.replaceChildren();
      for (const section of content.sections.filter(value => value.visible)) {
        const element = document.createElement('section');
        const skills = section.title.pl === 'Kompetencje' && !section.entries?.length;
        element.className = skills ? 'about-skills-section' : section.entries?.length ? 'about-timeline-section' : 'subpage-content';
        const heading = document.createElement('h2');
        translated(heading, section.title);
        element.append(heading);
        if (skills) {
          const grid = document.createElement('div');
          grid.className = 'about-skills-grid';
          const groups = Object.fromEntries(['pl', 'en'].map(lang => [lang, section.body[lang].split(/\n\s*\n/).filter(Boolean)]));
          groups.pl.forEach((group, index) => {
            const item = document.createElement('div');
            item.className = 'about-skill-group';
            const title = document.createElement('h3');
            const body = document.createElement('ul');
            const lines = Object.fromEntries(['pl', 'en'].map(lang => [lang, (groups[lang][index] || group).split('\n')]));
            translated(title, { pl: lines.pl[0], en: lines.en[0] });
            lines.pl.slice(1).filter(Boolean).forEach((line, itemIndex) => {
              const item = document.createElement('li');
              translated(item, { pl: line, en: lines.en[itemIndex + 1] || line });
              body.append(item);
            });
            item.append(title, body);
            grid.append(item);
          });
          element.append(grid);
        } else if (section.entries?.length) {
          const timeline = document.createElement('ol');
          timeline.className = 'about-timeline';
          for (const entry of section.entries) {
            const item = document.createElement('li');
            item.className = 'about-timeline-item';
            const date = document.createElement('p');
            date.className = 'about-timeline-date';
            translated(date, entry.date);
            const content = document.createElement('div');
            content.className = 'about-timeline-content';
            const title = document.createElement('h3');
            const body = document.createElement('p');
            translated(title, entry.title);
            translated(body, entry.body);
            content.append(title, body);
            item.append(date, content);
            timeline.append(item);
          }
          element.append(timeline);
        } else {
          const body = document.createElement('p');
          translated(body, section.body);
          element.append(body);
        }
        sections.append(element);
      }
      sections.hidden = !sections.children.length;
    }
    const tags = main.querySelector(page === 'home' ? '.hero-bio .tags' : '.about-focus');
    tags.replaceChildren();
    for (const tag of content.tags) {
      const element = document.createElement('span');
      translated(element, tag);
      tags.append(element);
    }
    tags.hidden = !content.tags.length;
    const actions = main.querySelector(page === 'home' ? '.hero-actions' : '.about-download');
    actions.replaceChildren();
    for (const [index, button] of content.buttons.filter(value => value.visible).entries()) {
      const link = document.createElement('a');
      link.className = page === 'home' && index === 0 ? 'primary' : 'secondary';
      link.href = button.href;
      if (button.download) link.setAttribute('download', 'Marcin-Podyma-CV.pdf');
      const label = document.createElement('span');
      translated(label, button.label);
      link.append(label);
      if (page === 'home' && button.href === '#featured-projects') {
        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        arrow.setAttribute('class', 'cta-arrow');
        arrow.setAttribute('viewBox', '0 0 24 24');
        arrow.setAttribute('fill', 'none');
        arrow.setAttribute('stroke', 'currentColor');
        arrow.setAttribute('stroke-width', '1.8');
        arrow.setAttribute('aria-hidden', 'true');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M12 4v16M5 13l7 7 7-7');
        arrow.append(path);
        link.append(arrow);
      }
      actions.append(link);
    }
    actions.hidden = !actions.children.length;
    const frame = main.querySelector(page === 'home' ? '.portrait' : '.about-photo-frame');
    const image = frame.querySelector('img');
    frame.hidden = !content.photo.visible;
    // srcset w HTML opisuje domyślne zdjęcie; inne źródło nie może dziedziczyć jego wariantów.
    // Serwer zapisuje src jako /assets/..., a dane jako assets/... — porównujemy pełne adresy.
    if (image.src !== new URL(content.photo.src, document.baseURI).href) {
      image.removeAttribute('srcset');
      image.src = content.photo.src;
    }
    photoAlt = content.photo.alt;
    updateAlt();
    window.refreshPortfolioPage?.();
    if (page === 'home') document.dispatchEvent(new CustomEvent('portfolio-home-change'));
  };
  const content = window.portfolioPageContent?.[page];
  if (content) apply(page === 'home' ? { ...window.portfolioHome, content } : { content });
  fetch(`/api/pages/${page}`, { signal: scope.signal }).then(response => {
    if (!response.ok) throw new Error('Nie udało się pobrać treści podstrony.');
    return response.json();
  }).then(apply).catch(() => {});
};
if (!window.portfolioRouting) window.portfolioPages['page-content.js']();
