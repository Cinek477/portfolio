const pageDefaults = require('./page-defaults.json');
const invalid = message => { throw Object.assign(new Error(message), { status: 400 }); };
function text(value, limit = 500, optional = false) {
  if (typeof value !== 'string' || value.length > limit || (!optional && !value.trim())) invalid('Uzupełnij tekst i sprawdź jego długość.');
  return value.trim();
}
function bilingual(value, limit = 500, optional = false) {
  if (!value || typeof value !== 'object') invalid('Uzupełnij wersje PL i EN.');
  return { pl: text(value.pl, limit, optional), en: text(value.en, limit, optional) };
}
function flag(value, fallback = true) {
  if (value !== undefined && typeof value !== 'boolean') invalid('Niepoprawna widoczność.');
  return value ?? fallback;
}
function safeHref(value) {
  const href = text(value, 2000);
  if (/\s|\\|[\u0000-\u001f\u007f]/.test(href) || href.startsWith('//')) invalid('Podaj bezpieczny link.');
  if (/^https?:\/\//i.test(href)) {
    try { const url = new URL(href); if (url.username || url.password || !url.hostname) invalid('Niepoprawny link.'); }
    catch { invalid('Podaj poprawny link HTTP/HTTPS.'); }
  } else if (/^mailto:[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(href)) {
    // Single contact address, without query headers.
  } else if (!/^#[\w-]+$/.test(href) && !/^(?:\/?[a-zA-Z0-9_-]+\.html(?:\?[^#\s]*)?(?:#[\w-]+)?|\/?assets\/[a-zA-Z0-9_./%() -]+)$/.test(href)) invalid('Użyj linku HTTP/HTTPS, podstrony, kotwicy lub pliku w assets/.');
  if (href.split('/').includes('..') || /%2e|%2f|%5c/i.test(href)) invalid('Niepoprawna ścieżka linku.');
  return href;
}
function list(value, max, mapper) {
  if (!Array.isArray(value) || value.length > max) invalid(`Lista może zawierać maksymalnie ${max} elementów.`);
  return value.map(mapper);
}
function normalizeEditor(input, old) {
  if (!old) return undefined;
  if (input === undefined) return structuredClone(old);
  if (!input || !Array.isArray(input.groups) || input.groups.length !== old.groups.length) invalid('Niepoprawne sekcje podstrony.');
  return { groups: old.groups.map(group => {
    const matches = input.groups.filter(item => item?.id === group.id);
    if (matches.length !== 1) invalid('Niepoprawna sekcja.');
    const value = matches[0];
    if (!Array.isArray(value.fields) || value.fields.length !== group.fields.length || !Array.isArray(value.links) || value.links.length !== group.links.length) invalid('Niepoprawne pola sekcji.');
    return { ...group, visible: flag(value.visible), fields: group.fields.map(field => {
      const values = value.fields.filter(item => item?.id === field.id);
      if (values.length !== 1) invalid('Niepoprawny tekst.');
      bilingual(values[0].value, 5000, true);
      if (field.kind === 'rating' && ['pl', 'en'].some(lang => {
        const rating = Number(values[0].value[lang].split('/')[0].trim().replace(',', '.'));
        return !Number.isFinite(rating) || rating < 0 || rating > 5;
      })) invalid('Ocena musi mieścić się w zakresie od 0 do 5.');
      return { ...field, value: { pl: values[0].value.pl, en: values[0].value.en } };
    }), links: group.links.map(link => {
      const values = value.links.filter(item => item?.id === link.id);
      if (values.length !== 1) invalid('Niepoprawny przycisk.');
      return { ...link, href: safeHref(values[0].href), visible: flag(values[0].visible), ...(typeof link.enabled === 'boolean' ? { enabled: flag(values[0].enabled, false) } : {}) };
    }) };
  }) };
}
function normalizeContent(input, old) {
  if (!input || typeof input !== 'object' || !input.photo) invalid('Niepoprawne dane podstrony.');
  return {
    editor: normalizeEditor(input.editor, old.editor),
    greeting: bilingual(input.greeting, 120, true), heading: bilingual(input.heading, 160), accent: bilingual(input.accent, 160, true),
    paragraphs: list(input.paragraphs, 8, value => bilingual(value, 5000)),
    tags: list(input.tags, 12, value => bilingual(value, 80)),
    buttons: list(input.buttons, 4, value => {
      if (!value || typeof value !== 'object') invalid('Niepoprawny przycisk.');
      return { label: bilingual(value.label, 80), href: safeHref(value.href), visible: flag(value.visible), download: flag(value.download, false) };
    }),
    photo: { src: old.photo.src, thumbUrl: old.photo.thumbUrl || '', visible: flag(input.photo.visible), alt: bilingual(input.photo.alt, 300) },
    sections: list(input.sections, 12, value => {
      if (!value || typeof value !== 'object') invalid('Niepoprawna sekcja.');
      const entries = list(value.entries || [], 20, entry => {
        if (!entry || typeof entry !== 'object') invalid('Niepoprawny wpis osi czasu.');
        return { title: bilingual(entry.title, 300), date: bilingual(entry.date, 160, true), body: bilingual(entry.body, 5000) };
      });
      return { title: bilingual(value.title, 160), body: bilingual(value.body, 5000, entries.length > 0), visible: flag(value.visible), entries };
    }),
    fields: Object.fromEntries(Object.entries(old.fields || {}).map(([key, value]) => [key, bilingual(input.fields?.[key] ?? value, 2000)])),
    links: Object.fromEntries(Object.entries(old.links || {}).map(([key, value]) => {
      const link = input.links?.[key] || value;
      return [key, { href: safeHref(link.href), visible: flag(link.visible) }];
    })),
  };
}
function normalizeOffers(input, old = pageDefaults.knowledge) {
  if (!input || !Array.isArray(input.offers) || input.offers.length !== 4) invalid('Niepoprawna lista ofert.');
  const ids = ['start', 'single', 'regular', 'matura'];
  return { editor: normalizeEditor(input.editor, old.editor), offers: ids.map(id => {
    const matches = input.offers.filter(offer => offer?.id === id);
    if (matches.length !== 1) invalid('Niepoprawny identyfikator oferty.');
    const offer = matches[0];
    const enabled = flag(offer.enabled, false);
    const label = bilingual(offer.text, 100, !enabled);
    return { id, enabled, text: label };
  }), faq: list(input.faq ?? pageDefaults.knowledge.faq, 20, entry => {
    if (!entry || typeof entry !== 'object') invalid('Niepoprawne pytanie FAQ.');
    return { question: bilingual(entry.question, 300), answer: bilingual(entry.answer, 3000), visible: flag(entry.visible) };
  }) };
}
module.exports = { pageDefaults, normalizeContent, normalizeOffers, normalizeEditor };
