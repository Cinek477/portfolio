// Nakładanie opublikowanych pól edytora CMS na istniejący HTML.
window.portfolioPages ||= {};
window.portfolioPages['content-editor.js'] = () => {
  const main = document.querySelector('main[data-cms-page]');
  if (!main) return;
  const page = main.dataset.cmsPage;
  const scope = window.portfolioPageScope || { signal: new AbortController().signal };
  let signature;
  function apply(record) {
    const editor = record?.content?.editor || record?.editor;
    if (!editor || scope.signal.aborted || !main.isConnected) return;
    const next = JSON.stringify(editor);
    if (next === signature) return;
    signature = next;
    const local = value => value[document.documentElement.lang] ?? value.pl;
    for (const group of editor.groups) {
      const section = [...main.querySelectorAll('[data-cms-group]')].find(el => el.dataset.cmsGroup === group.id);
      if (!section) continue;
      section.hidden = !group.visible;
      for (const item of group.fields) {
        const element = main.querySelector('[data-cms-text="' + group.id + '-' + item.id + '"]');
        if (!element) continue;
        const splitHeading = element.parentElement.classList.contains('tutoring-title-line') && element === element.parentElement.firstElementChild;
        element.dataset.pl = splitHeading ? item.value.pl.trimEnd() + ' ' : item.value.pl;
        element.dataset.en = splitHeading ? item.value.en.trimEnd() + ' ' : item.value.en;
        // Preserve the exact spacing in split headings.
        const text = local(item.value);
        element.textContent = splitHeading ? text.trimEnd() + ' ' : text;
      }
      for (const item of group.links) {
        const element = main.querySelector('[data-cms-link="' + group.id + '-' + item.id + '"]');
        if (element) {
          element.hidden = !item.visible;
          if (item.enabled === false) { element.removeAttribute('href'); element.setAttribute('aria-disabled', 'true'); }
          else { element.href = item.href; element.removeAttribute('aria-disabled'); }
        }
      }
    }
    const value = main.querySelector('.review-rating-value');
    if (value) {
      // Po wyrenderowaniu prawdziwej opinii element oceny nie ma już data-pl — wtedy czytamy jego tekst.
      const rating = Math.max(0, Math.min(5, parseFloat((value.dataset.pl ?? value.textContent ?? '').replace(',', '.'))));
      if (Number.isFinite(rating)) {
        const ratingBox = main.querySelector('.review-rating');
        if (ratingBox) {
          ratingBox.dataset.labelPl = 'Ocena: ' + String(rating).replace('.', ',') + ' na 5';
          ratingBox.dataset.labelEn = 'Rating: ' + rating + ' out of 5';
          ratingBox.setAttribute('aria-label', document.documentElement.lang === 'en' ? ratingBox.dataset.labelEn : ratingBox.dataset.labelPl);
        }
        const avatar = main.querySelector('.review-avatar');
        const author = main.querySelector('.review-author strong');
        if (avatar && author) avatar.textContent = author.textContent.trim().slice(0, 1).toUpperCase();
        const svgNS = 'http://www.w3.org/2000/svg';
        main.querySelectorAll('.review-stars svg').forEach((svg, i) => {
          const paths = svg.querySelectorAll('path');
          if (paths.length < 2) return;
          let defs = svg.querySelector('defs');
          if (!defs) { defs = document.createElementNS(svgNS, 'defs'); svg.prepend(defs); }
          defs.replaceChildren();
          const clip = document.createElementNS(svgNS, 'clipPath'); clip.id = 'review-rating-clip-' + i;
          const rect = document.createElementNS(svgNS, 'rect'); rect.setAttribute('width', String(24 * Math.max(0, Math.min(1, rating - i)))); rect.setAttribute('height', '24');
          clip.append(rect); defs.append(clip); paths[1].setAttribute('clip-path', 'url(#' + clip.id + ')');
        });
      }
    }
  }
  const cached = window.portfolioPageContent?.[page];
  apply(cached);
  fetch('/api/pages/' + page, { signal: scope.signal }).then(response => {
    if (!response.ok) throw Error('Brak treści strony');
    return response.json();
  }).then(apply).catch(() => {});
};
if (!window.portfolioRouting) window.portfolioPages['content-editor.js']();
