// Zmiana motywu z zapisem preferencji i opcjonalnym przejściem wizualnym.
(() => {
  const root = document.documentElement;
  const button = document.querySelector('.theme');
  let stored;
  try {
    stored = localStorage.getItem('portfolio-theme');
  } catch {}
  root.dataset.theme = ['light', 'dark'].includes(stored)
    ? stored
    : matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  // Ilustracje projektów mają ciemne warianty (*-dark.svg, scripts/make-dark-illustrations.cjs).
  // Moduły ustawiają obraz przez portfolioThemedImage, a zmiana motywu podmienia src.
  const darkVariant = source => /illustrations\/(?:oop|database|matura|hackyeah|krakhack)\.svg$/.test(source || '')
    ? source.replace(/\.svg$/, '-dark.svg') : '';
  const preloaded = new Set();
  window.portfolioThemedImage = (image, source) => {
    const dark = darkVariant(source);
    if (!dark) {
      delete image.dataset.lightSrc; delete image.dataset.darkSrc;
      if (image.getAttribute('src') !== source) image.src = source;
      return;
    }
    image.dataset.lightSrc = source; image.dataset.darkSrc = dark;
    const current = root.dataset.theme === 'dark' ? dark : source;
    if (image.getAttribute('src') !== current) image.src = current;
    // Drugi wariant w pamięci podręcznej, by przejście motywu nie pokazało pustej ramki.
    const other = current === dark ? source : dark;
    if (!preloaded.has(other)) { preloaded.add(other); new Image().src = other; }
  };
  const syncThemedImages = () => document.querySelectorAll('img[data-dark-src]').forEach(image => {
    const next = root.dataset.theme === 'dark' ? image.dataset.darkSrc : image.dataset.lightSrc;
    if (image.getAttribute('src') !== next) image.src = next;
  });
  const update = () => {
    syncThemedImages();
    const icon = document.querySelector('link[data-theme-icon]');
    if (icon) icon.href = new URL(icon.dataset[root.dataset.theme], document.baseURI).href;
    root.style.removeProperty('background-color');
    root.style.removeProperty('color-scheme');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', root.dataset.theme === 'dark' ? '#091526' : '#eef4fc');
    button.setAttribute('aria-pressed', String(root.dataset.theme === 'dark'));
  };
  update();
  let running = false;
  button.addEventListener('click', async () => {
    if (running || root.dataset.pageTransition || root.dataset.languageTransition) return;
    const change = () => {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      update();
      try {
        localStorage.setItem('portfolio-theme', root.dataset.theme);
      } catch {}
    };
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      change();
      return;
    }
    running = true;
    const transition = document.startViewTransition(change);
    try {
      await transition.ready;
      await root.animate(
        {
          clipPath: [
            'circle(0% at 50% 0%)',
            // Percentages follow the actual transition snapshot, including mobile viewport changes.
            // 150% of its normalized diagonal covers every corner from the top centre.
            'circle(150% at 50% 0%)',
          ],
        },
        {
          duration: 1100,
          easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
          pseudoElement: '::view-transition-new(root)',
          fill: 'forwards',
        },
      ).finished;
    } catch {
      transition.skipTransition();
    } finally {
      await transition.finished.catch(() => {});
      running = false;
    }
  });
})();
