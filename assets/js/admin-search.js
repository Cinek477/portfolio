// Wspólne wyszukiwanie w panelu: PL/EN, polskie znaki i wiele słów naraz.
(() => {
  const normalize = value => String(value ?? '')
    .toLocaleLowerCase('pl')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ł/g, 'l');
  const words = query => normalize(query).trim().split(/\s+/).filter(Boolean);

  function flatten(value) {
    if (Array.isArray(value)) return value.map(flatten).join(' ');
    if (value && typeof value === 'object') return Object.values(value).map(flatten).join(' ');
    return String(value ?? '');
  }
  window.adminSearchText = (...values) => values.map(flatten).join(' ');
  window.adminSearchMatches = (value, query) => {
    const text = normalize(value);
    return words(query).every(word => text.includes(word));
  };

  window.createAdminSearch = (list, placeholder, onQuery = () => {}) => {
    const box = document.createElement('div');
    box.className = 'admin-search';
    const label = document.createElement('label');
    label.textContent = 'Szukaj na liście';
    const row = document.createElement('div');
    row.className = 'admin-search-row';
    const input = document.createElement('input');
    Object.assign(input, { type: 'search', placeholder, maxLength: 200, autocomplete: 'off' });
    const clear = document.createElement('button');
    Object.assign(clear, { type: 'button', className: 'subtle', textContent: 'Wyczyść', hidden: true });
    label.append(input);
    row.append(label, clear);
    const count = document.createElement('p');
    count.className = 'admin-hint';
    count.setAttribute('role', 'status');
    count.setAttribute('aria-live', 'polite');
    box.append(row, count);
    list.before(box);

    let timer;
    // Cache nie zatrzymuje usuniętych kart; zmiana tekstu unieważnia dany wpis.
    const normalizedCards = new WeakMap();
    function apply() {
      const query = input.value.trim();
      clear.hidden = !query;
      const terms = words(query);
      const cards = [...list.children].filter(card => card.hasAttribute('data-search-text'));
      let visible = 0;
      for (const card of cards) {
        const source = card.dataset.searchText;
        let cached = normalizedCards.get(card);
        if (!cached || cached.source !== source) {
          cached = { source, text: normalize(source) };
          normalizedCards.set(card, cached);
        }
        card.hidden = !terms.every(word => cached.text.includes(word));
        if (!card.hidden) visible++;
      }
      count.textContent = !query ? '' : visible
        ? `Wyniki: ${visible} / ${cards.length}`
        : 'Brak pasujących wpisów. Zmień frazę lub filtr.';
      onQuery(Boolean(query));
    }

    // Krótka zwłoka łączy szybkie naciśnięcia klawiszy w jedną filtrację.
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(apply, 100);
    });
    function reset() {
      clearTimeout(timer);
      input.value = '';
      apply();
    }
    clear.addEventListener('click', () => { reset(); input.focus(); });
    new MutationObserver(apply).observe(list, { childList: true });
    return { apply, clear: reset };
  };
})();
