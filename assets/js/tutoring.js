// Wykresy matematyczne; zatrzymanie timerów i animacji przy ukrytej sekcji.
window.portfolioPages ||= {};
window.portfolioPages['tutoring.js'] = () => {
  const board = document.querySelector('.tutoring-page .math-board');
  if (!board) return;
  const scope = window.portfolioPageScope;
  const controller = new AbortController();
  const { signal } = controller;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const equation = board.querySelector('.math-equation');
  const note = board.querySelector('.math-function-note');
  const paths = [...board.querySelectorAll('.math-curve')];
  const tracers = [...board.querySelectorAll('.math-tracer, .math-tracer-halo')];
  const functions = [
    { label: 'f(x) = x²', note: 'x ∈ ℝ', fn: x => x * x, scale: 12, segments: [[-2.8, 2.8]] },
    { label: 'f(x) = sin(x)', note: '−1 ≤ sin(x) ≤ 1', fn: Math.sin, scale: 54, segments: [[-3.5, 3.5]] },
    { label: 'f(x) = 1/x', note: 'x ≠ 0', fn: x => 1 / x, scale: 38, segments: [[-3.5, -.42], [.42, 3.5]] },
  ];
  let index = 0, timer = 0, swapTimer = 0, frame = 0, phase = 0, lastTime = 0;
  let visible = false, changing = false;
  const point = x => ({ x: 160 + 40 * x, y: 105 - functions[index].scale * functions[index].fn(x) });
  function draw() {
    const current = functions[index];
    equation.textContent = current.label;
    note.textContent = current.note;
    paths.forEach((path, segment) => {
      const range = current.segments[segment];
      path.setAttribute('d', range ? Array.from({ length: 100 }, (_, i) => {
        const p = point(range[0] + (range[1] - range[0]) * i / 99);
        return `${i ? 'L' : 'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
      }).join(' ') : '');
    });
    placeTracer();
  }
  function placeTracer() {
    // The reciprocal's two branches remain separate; never draw through its asymptote.
    const range = functions[index].segments[0];
    const x = range[0] + (range[1] - range[0]) * (.5 - .5 * Math.cos(phase));
    const p = point(x);
    tracers.forEach(dot => { dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y); });
  }
  function tick(time) {
    if (lastTime && !changing) phase += Math.min(time - lastTime, 50) / 1800;
    lastTime = time;
    placeTracer();
    frame = requestAnimationFrame(tick);
  }
  function schedule() {
    timer = setTimeout(() => {
      changing = true;
      board.classList.add('is-changing');
      swapTimer = setTimeout(() => {
        index = (index + 1) % functions.length;
        phase = 0;
        draw();
        board.classList.remove('is-changing');
        changing = false;
        schedule();
      }, 380);
    }, 5200);
  }
  function stop() {
    clearTimeout(timer); clearTimeout(swapTimer); cancelAnimationFrame(frame);
    timer = swapTimer = frame = lastTime = 0;
    changing = false;
    board.classList.remove('is-changing');
  }
  function sync() {
    stop();
    if (!signal.aborted && visible && !document.hidden && !reduced.matches) {
      schedule();
      frame = requestAnimationFrame(tick);
    }
  }
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    sync();
  });
  draw();
  observer.observe(board);
  document.addEventListener('visibilitychange', sync, { signal });
  reduced.addEventListener('change', sync, { signal });
  const cleanup = () => { controller.abort(); observer.disconnect(); stop(); };
  if (scope) scope.cleanup(cleanup);
  else window.addEventListener('pagehide', cleanup, { once: true, signal });
};
if (!window.portfolioRouting) window.portfolioPages['tutoring.js']();
