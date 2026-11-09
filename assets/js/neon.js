// Dekoracyjny obrys przycisków; jeden cykl animacji tylko dla widocznych elementów.
(() => {
  // Obejmujemy również drugorzędne CTA poza hero (CV, pakiety).
  // Zwykłe linki tekstowe i statyczny panel administratora pozostają bez smugi.
  // Link do Spotify (.music-link) jest celowo bez smugi — wygląda jak zwykły link z ikoną, nie przycisk.
  const selector = 'main a.primary, main a.secondary:not(.music-link), .hero-actions a, .instagram-cta, .course-preview, .contact-submit, .lightbox-instagram';
  const tracked = new Map();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const epoch = performance.now();
  const sampleCount = 1024;
  const steps = 48;
  // Płynne 60 klatek/s; ekrany 120–144 Hz nie rysują częściej niż co ~16,7 ms.
  const frameInterval = 1000 / 60;
  let lastPaint = -Infinity;
  // Ogon przechodzi w jaśniejszą „głowę” smugi. Na jasnym tle cyjan i biel znikają,
  // dlatego jasny motyw ma głęboki niebieski przechodzący w błękit.
  const palette = (tail, tip) => Array.from({ length: steps }, (_, index) => {
    const t = (index + 1) / steps;
    const head = Math.max(0, (t - 0.7) / 0.3);
    const channel = i => Math.round(tail[i] + (tip[i] - tail[i]) * head);
    return `rgba(${channel(0)},${channel(1)},${channel(2)},${Math.pow(t, 1.65).toFixed(3)})`;
  });
  const darkColors = palette([56, 189, 248], [224, 250, 255]);
  const lightColors = palette([29, 95, 224], [14, 165, 233]);
  // Wypełnione niebieskie przyciski jasnego motywu (oraz każdy z tej grupy po najechaniu, gdy też
  // robi się niebieski) dostają białą smugę — niebieska zlewała się z ich tłem.
  const whiteColors = palette([255, 255, 255], [255, 255, 255]);
  const filledSelector = '.hero-actions a:not(.secondary), .contact-submit, .instagram-cta';
  const hoverFilledSelector = ':is(.hero-actions a, .contact-submit, .instagram-cta):is(:hover, :focus-visible)';
  const isFilled = button => Boolean(button.matches?.(filledSelector) || button.matches?.(hoverFilledSelector));
  let frame = 0, scheduled = false;
  // Punkty obrysu zaokrąglonego prostokąta liczone wzorem, równo co do długości, zgodnie z ruchem wskazówek
  // zegara od lewego górnego rogu. Wcześniej robiło to SVG getPointAtLength: ok. 200 ms na przycisk,
  // co przy kilku przyciskach blokowało stronę na ponad sekundę w trakcie przejścia.
  function outlinePoints(w, h, r) {
    const straightX = Math.max(0, w - 2 * r), straightY = Math.max(0, h - 2 * r), arc = Math.PI * r / 2;
    // Odcinki: góra, róg, prawo, róg, dół, róg, lewo, róg (przesunięte o 1 px jak dawna ścieżka).
    const segments = [
      { length: straightX, at: t => [1 + r + straightX * t, 1] },
      { length: arc, at: t => [1 + w - r + r * Math.sin(t * Math.PI / 2), 1 + r - r * Math.cos(t * Math.PI / 2)] },
      { length: straightY, at: t => [1 + w, 1 + r + straightY * t] },
      { length: arc, at: t => [1 + w - r + r * Math.cos(t * Math.PI / 2), 1 + h - r + r * Math.sin(t * Math.PI / 2)] },
      { length: straightX, at: t => [1 + w - r - straightX * t, 1 + h] },
      { length: arc, at: t => [1 + r - r * Math.sin(t * Math.PI / 2), 1 + h - r + r * Math.cos(t * Math.PI / 2)] },
      { length: straightY, at: t => [1, 1 + h - r - straightY * t] },
      { length: arc, at: t => [1 + r - r * Math.cos(t * Math.PI / 2), 1 + r - r * Math.sin(t * Math.PI / 2)] },
    ];
    const total = segments.reduce((sum, segment) => sum + segment.length, 0) || 1;
    const points = new Float32Array(sampleCount * 2);
    let segment = 0, start = 0;
    for (let i = 0; i < sampleCount; i++) {
      const distance = total * i / sampleCount;
      while (segment < segments.length - 1 && distance > start + segments[segment].length) start += segments[segment++].length;
      const current = segments[segment];
      const [x, y] = current.at(current.length ? (distance - start) / current.length : 0);
      points[i * 2] = x;
      points[i * 2 + 1] = y;
    }
    return points;
  }
  function resize(button) {
    const item = tracked.get(button);
    if (!item || button.clientWidth < 3 || button.clientHeight < 3) return;
    const width = button.clientWidth, height = button.clientHeight;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    const radius = Math.min(parseFloat(getComputedStyle(button).borderTopLeftRadius) || 0, (width - 2) / 2, (height - 2) / 2);
    const key = `${width}:${height}:${radius}:${ratio}`;
    if (item.key === key) return;
    item.key = key;
    item.points = outlinePoints(width - 2, height - 2, Math.max(0.1, radius));
    item.width = width; item.height = height;
    item.canvas.width = Math.round(width * ratio);
    item.canvas.height = Math.round(height * ratio);
    item.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    item.context.lineWidth = 1.8;
    item.context.lineCap = 'round';
    item.context.lineJoin = 'round';
  }
  function position(points, progress, target) {
    const sample = ((progress % 1 + 1) % 1) * sampleCount;
    const index = Math.floor(sample), next = (index + 1) % sampleCount, part = sample - index;
    target[0] = points[index * 2] + (points[next * 2] - points[index * 2]) * part;
    target[1] = points[index * 2 + 1] + (points[next * 2 + 1] - points[index * 2 + 1]) * part;
  }
  const first = new Float32Array(2), second = new Float32Array(2);
  function animate(now) {
    frame = 0;
    if (document.hidden || reduced.matches || document.body.classList.contains('photo-view-open')) return;
    if (now - lastPaint < frameInterval - 1) {
      frame = requestAnimationFrame(animate);
      return;
    }
    lastPaint = now;
    const phase = ((now - epoch) % 4000) / 4000;
    let active = false;
    const dark = document.documentElement?.dataset?.theme === 'dark';
    for (const [button, item] of tracked) {
      if (!item.visible || !item.points || button.disabled || button.getAttribute('aria-disabled') === 'true') continue;
      active = true;
      const filled = !dark && isFilled(button);
      const colors = dark ? darkColors : filled ? whiteColors : lightColors;
      // Klasa przełącza poświatę canvasu (biała zamiast niebieskiej) — tylko gdy stan się zmienia.
      if (item.filled !== filled) { item.filled = filled; item.canvas.classList?.toggle('is-on-fill', filled); }
      const context = item.context;
      context.clearRect(0, 0, item.width, item.height);
      position(item.points, phase - 0.35, first);
      for (let i = 0; i < steps; i++) {
        position(item.points, phase - 0.35 + (i + 1) * 0.35 / steps, second);
        context.strokeStyle = colors[i];
        context.beginPath();
        context.moveTo(first[0], first[1]);
        context.lineTo(second[0], second[1]);
        context.stroke();
        first.set(second);
      }
    }
    if (active) frame = requestAnimationFrame(animate);
  }
  function resume() {
    if (!frame && !document.hidden && !reduced.matches) frame = requestAnimationFrame(animate);
  }
  const visibility = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const item = tracked.get(entry.target);
      if (item) item.visible = entry.isIntersecting;
    }
    resume();
  });
  const sizes = new ResizeObserver(entries => entries.forEach(entry => resize(entry.target)));
  function sync() {
    scheduled = false;
    for (const [button] of tracked) if (!button.isConnected) {
      sizes.unobserve(button); visibility.unobserve(button); tracked.delete(button);
    }
    document.querySelectorAll(selector).forEach(button => {
      if (button.querySelector(':scope > .control-neon')) return;
      const previous = tracked.get(button);
      const canvas = document.createElement('canvas');
      canvas.className = 'control-neon';
      canvas.setAttribute('aria-hidden', 'true');
      const context = canvas.getContext('2d');
      if (!context) return;
      canvases.add(canvas);
      button.append(canvas);
      // Zmiana tekstu PL/EN może usunąć canvas bez usuwania samego przycisku.
      // Zachowaj jego widoczność: obserwator nie musi ponownie zgłosić tego samego elementu.
      tracked.set(button, { canvas, context, visible: previous?.visible ?? false });
      if (!previous) { sizes.observe(button); visibility.observe(button); }
      resize(button);
    });
    resume();
  }
  // Pełne przeszukanie dokumentu tylko wtedy, gdy zmiana może dotyczyć przycisku z neonem.
  // Galeria, Spotify czy dopisanie samego canvasu nie uruchamiają ponownie querySelectorAll.
  const canvases = new WeakSet();
  const relevantAdded = node => node.nodeType === 1 && (node.matches(selector) || node.querySelector(selector));
  const relevantRemoved = node => canvases.has(node) || tracked.has(node)
    || (node.nodeType === 1 && node.querySelector('.control-neon'));
  function relevant(records) {
    for (const record of records) {
      if (record.type === 'attributes') {
        if (tracked.has(record.target)) resume();
        continue;
      }
      for (const node of record.removedNodes) if (relevantRemoved(node)) return true;
      for (const node of record.addedNodes) if (relevantAdded(node)) return true;
    }
    return false;
  }
  new MutationObserver(records => {
    if (scheduled || !relevant(records)) return;
    scheduled = true;
    requestAnimationFrame(sync);
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'aria-disabled'] });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else resume();
  });
  reduced.addEventListener('change', () => {
    if (reduced.matches) { cancelAnimationFrame(frame); frame = 0; } else resume();
  });
  document.addEventListener('portfolio-lightbox-state', () => { cancelAnimationFrame(frame); frame = 0; if (!document.body.classList.contains('photo-view-open')) resume(); });
  sync();
})();
