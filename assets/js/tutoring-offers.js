window.portfolioPages ||= {};
window.portfolioPages['tutoring-offers.js'] = () => {
  const main = document.querySelector('.tutoring-page');
  if (!main) return;
  const scope = window.portfolioPageScope || { signal: new AbortController().signal };
  function apply(data) {
    if (scope.signal.aborted || !main.isConnected || !Array.isArray(data?.offers)) return;
    const faq = main.querySelector('.tutoring-faq-list');
    if (faq && Array.isArray(data.faq)) {
      const openQuestions = new Set([...faq.querySelectorAll('details[open] summary')].map(el => el.dataset.pl));
      faq.replaceChildren();
      const local = value => value[document.documentElement.lang] || value.pl;
      for (const entry of data.faq.filter(entry => entry.visible !== false)) {
        const item = document.createElement('details');
        const summary = document.createElement('summary');
        const answer = document.createElement('p');
        for (const [el, value] of [[summary, entry.question], [answer, entry.answer]]) {
          el.dataset.pl = value.pl; el.dataset.en = value.en || value.pl; el.textContent = local(value);
        }
        item.open = openQuestions.has(entry.question.pl);
        item.append(summary, answer); faq.append(item);
      }
      main.querySelector('.tutoring-faq').hidden = !faq.children.length;
    }
    for (const offer of data.offers) {
      const card = [...main.querySelectorAll('[data-offer-id]')].find(card => card.dataset.offerId === offer.id);
      if (!card) continue;
      card.querySelector('.offer-discount')?.remove();
      card.classList.remove('has-discount');
      if (!offer.enabled || !offer.text?.pl?.trim()) continue;
      const badge = document.createElement('span');
      badge.className = 'offer-discount';
      badge.dataset.pl = offer.text.pl;
      badge.dataset.en = offer.text.en || offer.text.pl;
      badge.textContent = badge.dataset[document.documentElement.lang] || offer.text.pl;
      card.append(badge);
      card.classList.add('has-discount');
    }
  }
  apply(window.portfolioPageContent?.knowledge);
  fetch('/api/pages/knowledge', { signal: scope.signal }).then(response => {
    if (!response.ok) throw Error('Brak ustawień ofert');
    return response.json();
  }).then(apply).catch(() => {});
};
if (!window.portfolioRouting) window.portfolioPages['tutoring-offers.js']();
