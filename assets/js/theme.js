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
  const update = () => {
    const icon = document.querySelector('link[data-theme-icon]');
    if (icon) icon.href = new URL(icon.dataset[root.dataset.theme], document.baseURI).href;
    root.style.removeProperty('background-color');
    root.style.removeProperty('color-scheme');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', root.dataset.theme === 'dark' ? '#091526' : '#edf6ff');
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
