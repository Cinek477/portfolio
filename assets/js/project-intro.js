// Uruchamianie animacji ilustracji projektów tylko przy widocznej sekcji.
window.portfolioPages ||= {};
window.portfolioPages['project-intro.js'] = () => {
  const board = document.querySelector('.project-lab');
  if (!board) return;
  const controller = new AbortController();
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  const update = () => board.classList.toggle('is-animating', visible && !document.hidden && !motion.matches);
  const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); }, { threshold: .1 });
  observer.observe(board);
  document.addEventListener('visibilitychange', update, { signal: controller.signal });
  motion.addEventListener('change', update, { signal: controller.signal });
  window.portfolioPageScope?.cleanup(() => { controller.abort(); observer.disconnect(); board.classList.remove('is-animating'); });
};
if (!window.portfolioRouting) window.portfolioPages['project-intro.js']();
