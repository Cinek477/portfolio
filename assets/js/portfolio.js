const root = document.documentElement;
const navbar = document.querySelector('.navbar');
const menu = document.querySelector('.logo');
const themeButton = document.querySelector('.theme');
let language = 'pl';
function readPreference(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function savePreference(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}
function applyLanguage(value) {
  language = value === 'en' ? 'en' : 'pl';
  root.lang = language;
  document.querySelectorAll('[data-pl]').forEach((element) => {
    const text = element.dataset[language];
    if (text !== undefined && element.textContent !== text) element.textContent = text;
  });
  document.querySelectorAll('[data-label-pl]').forEach((element) => {
    const label = element.dataset[language === 'pl' ? 'labelPl' : 'labelEn'];
    if (label !== undefined && element.getAttribute('aria-label') !== label) element.setAttribute('aria-label', label);
  });
  document.querySelector('.language').innerHTML =
    `<span class="${language === 'pl' ? '' : 'inactive'}">PL</span> / <span class="${language === 'en' ? '' : 'inactive'}">EN</span>`;
  themeButton.setAttribute('aria-label', language === 'pl' ? 'Zmień motyw' : 'Change theme');
  const pageTitle = document.querySelector('[data-page-title]');
  document.title = `${pageTitle ? pageTitle.dataset[language] : 'Portfolio'} — Marcin Podyma`;
  savePreference('portfolio-language', language);
  updateLogoLabel();
  document.dispatchEvent(new CustomEvent('portfolio-language-change'));
}
document.querySelector('.language').addEventListener('click', async () => {
  if (root.dataset.languageTransition || root.dataset.pageTransition) return;
  const next = language === 'pl' ? 'en' : 'pl';
  const targets = [...document.querySelectorAll('main, .navigation, footer')];
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !targets.every(element => element.animate)) {
    applyLanguage(next);
    return;
  }
  const button = document.querySelector('.language');
  root.dataset.languageTransition = 'true';
  button.setAttribute('aria-busy', 'true');
  const animations = [];
  let changed = false;
  try {
    const outgoing = targets.map(element => element.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: 100, easing: 'ease-in', fill: 'forwards' },
    ));
    animations.push(...outgoing);
    await Promise.all(outgoing.map(animation => animation.finished));
    applyLanguage(next);
    changed = true;
    const incoming = targets.filter(element => element.isConnected).map(element => element.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: 180, easing: 'ease-out' },
    ));
    animations.push(...incoming);
    outgoing.forEach(animation => animation.cancel());
    await Promise.all(incoming.map(animation => animation.finished));
  } catch {
    if (!changed) applyLanguage(next);
  } finally {
    animations.forEach(animation => animation.cancel());
    delete root.dataset.languageTransition;
    button.removeAttribute('aria-busy');
  }
});
applyLanguage(readPreference('portfolio-language') || 'pl');
function updateLogoLabel() {
  const mobile = matchMedia('(max-width: 760px)').matches;
  const label = language === 'pl' ? 'Otwórz menu' : 'Open menu';
  menu.setAttribute('aria-label', label);
  menu.title = label;
  if (mobile) menu.setAttribute('aria-expanded', String(navbar.classList.contains('menu-open')));
  else menu.removeAttribute('aria-expanded');
}
function closeMenu() {
  navbar.classList.remove('menu-open');
  updateLogoLabel();
}
menu.addEventListener('click', () => {
  if (!matchMedia('(max-width: 760px)').matches) return;
  const open = navbar.classList.toggle('menu-open');
  menu.setAttribute('aria-expanded', String(open));
});
document.querySelector('.navigation').addEventListener('click', (event) => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});
document.addEventListener('click', (event) => {
  if (!navbar.contains(event.target)) closeMenu();
});
function updateScroll() {
  const compact = navbar.classList.contains('scrolled');
  navbar.classList.toggle('scrolled', scrollY > (compact ? 70 : 100));
}
addEventListener('scroll', updateScroll, { passive: true });
updateScroll();
matchMedia('(max-width: 760px)').addEventListener('change', closeMenu);
window.refreshPortfolioPage = () => {
  applyLanguage(language);
  updateScroll();
};
