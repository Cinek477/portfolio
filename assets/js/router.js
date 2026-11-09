// Nawigacja bez przeładowania dokumentu oraz sprzątanie zasobów poprzedniej podstrony.
(() => {
  if (location.protocol === 'file:' || !document.querySelector('.navbar')) return;
  const root = document.documentElement;
  const initializers = (window.portfolioPages = {});
  let cleanup = [];
  let scope;
  function resetScope() {
    scope?.abort();
    cleanup.splice(0).forEach((dispose) => dispose());
    scope = new AbortController();
    window.portfolioPageScope = {
      signal: scope.signal,
      cleanup: (dispose) => cleanup.push(dispose),
    };
  }
  resetScope();
  const loaded = new Set([...document.scripts].map((script) => script.src));
  let current = new URL(location.href);
  let request;
  let transition;
  let updating = false;
  let pending;
  let scrollTimer;
  const savedScroll = history.state?.portfolioScroll;
  let restoring = Number.isFinite(savedScroll) && savedScroll > 0;
  let stopRestore = () => { restoring = false; };
  history.scrollRestoration = 'manual';
  const saveScroll = () => {
    clearTimeout(scrollTimer);
    scrollTimer = 0;
    if (!request && !restoring && history.state?.portfolioScroll !== scrollY)
      history.replaceState({ ...history.state, portfolioScroll: scrollY }, '', location.href);
  };
  if (!restoring) saveScroll();
  if (restoring) {
    const restore = () => {
      if (!restoring) return;
      scrollTo({ top: savedScroll, behavior: 'instant' });
    };
    const observer = new ResizeObserver(restore);
    const inputs = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
    let timer;
    stopRestore = () => {
      if (!restoring) return;
      restoring = false;
      observer.disconnect();
      clearTimeout(timer);
      inputs.forEach(type => removeEventListener(type, stopRestore));
      saveScroll();
    };
    observer.observe(document.querySelector('main'));
    inputs.forEach(type => addEventListener(type, stopRestore, { passive: true }));
    addEventListener('load', restore, { once: true });
    requestAnimationFrame(restore);
    timer = setTimeout(stopRestore, 3000);
  }
  addEventListener('pagehide', saveScroll);
  addEventListener('beforeunload', saveScroll);
  addEventListener(
    'scroll',
    () => {
      // Historia nie musi być przepisywana w każdej klatce przewijania.
      // pagehide/beforeunload oraz kliknięcie zapisują pozycję od razu.
      if (!scrollTimer) scrollTimer = setTimeout(saveScroll, 150);
    },
    { passive: true },
  );
  function publicPage(url) {
    const base = new URL(document.baseURI || '/', location.href).pathname;
    const pathname = base !== '/' && url.pathname.startsWith(base) ? '/' + url.pathname.slice(base.length) : url.pathname;
    return (
      url.origin === location.origin &&
      /^(?:\/(?:index|projects|project|about|hobby|contact|knowledge)\.html|\/|\/(?:o-mnie|projekty|korepetycje|po-godzinach|kontakt)|\/(?:projekty|album)\/[^/]+)\/?$/.test(pathname)
    );
  }
  async function loadScript(source) {
    if (loaded.has(source)) return;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = source;
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    });
    loaded.add(source);
  }
  // Wcześniejsze pobieranie: po najechaniu, fokusie lub dotknięciu linku strona pobiera się w tle,
  // więc po kliknięciu przejście rusza od razu. Wpis żyje 30 s; oszczędzanie danych wyłącza mechanizm.
  const prefetched = new Map();
  const pageKey = (url) => { const key = new URL(url); key.hash = ''; return key.href; };
  function fetchPage(url, signal) {
    return fetch(url.href, { signal, headers: { Accept: 'text/html' } }).then(async (response) => ({
      ok: response.ok && Boolean(response.headers.get('content-type')?.includes('text/html')),
      url: response.url,
      text: await response.text(),
    }));
  }
  function prefetch(link) {
    if (navigator.connection?.saveData) return;
    const url = new URL(link.href);
    if (!publicPage(url) || (url.pathname === current.pathname && url.search === current.search)) return;
    const key = pageKey(url);
    const cached = prefetched.get(key);
    if (cached && Date.now() - cached.time < 30000) return;
    const page = fetchPage(url, AbortSignal.timeout(10000));
    prefetched.set(key, { time: Date.now(), page });
    page.then(({ ok, text, url: finalUrl }) => {
      if (!ok) return prefetched.delete(key);
      // Style i skrypty nowej strony trafiają do pamięci przeglądarki, zanim będą potrzebne.
      const next = new DOMParser().parseFromString(text, 'text/html');
      const base = new URL(next.querySelector('base')?.getAttribute?.('href') || document.baseURI || finalUrl, finalUrl);
      for (const asset of next.querySelectorAll('link[rel="stylesheet"][href], script[src]')) {
        const href = new URL(asset.getAttribute('href') || asset.getAttribute('src'), base).href;
        if (loaded.has(href) || document.querySelector(`link[rel="prefetch"][href="${CSS.escape(href)}"]`)) continue;
        if ([...document.styleSheets].some((sheet) => sheet.href === href)) continue;
        const hint = document.createElement('link');
        hint.rel = 'prefetch';
        hint.href = href;
        document.head.append(hint);
      }
    }).catch(() => prefetched.delete(key));
  }
  let hoverTimer = 0;
  document.addEventListener('mouseover', (event) => {
    const link = event.target.closest?.('a[href]');
    clearTimeout(hoverTimer);
    // Krótka zwłoka: przejechanie kursorem przez menu nie pobiera wszystkich stron naraz.
    if (link) hoverTimer = setTimeout(() => prefetch(link), 65);
  }, { passive: true });
  document.addEventListener('focusin', (event) => {
    const link = event.target.closest?.('a[href]');
    if (link) prefetch(link);
  });
  document.addEventListener('touchstart', (event) => {
    const link = event.target.closest?.('a[href]');
    if (link) prefetch(link);
  }, { passive: true });

  // Pasek ładowania u góry: pojawia się dopiero, gdy przejście trwa dłużej niż 150 ms.
  // Przy dłuższym ładowaniu (ponad 600 ms) dochodzi nakładka z logo i paskiem — szybkie przejścia jej nie pokazują.
  // Oba elementy tworzone są przy pierwszym przejściu; to dekoracja, więc ich brak nie blokuje nawigacji.
  let progress = null;
  let loader = null;
  let progressTimer = 0;
  let loaderTimer = 0;
  function startProgress() {
    if (!progress) {
      try {
        progress = document.createElement('div');
        progress.className = 'route-progress';
        progress.setAttribute('aria-hidden', 'true');
        loader = document.createElement('div');
        loader.className = 'route-loader';
        loader.setAttribute('aria-hidden', 'true');
        const logo = document.createElement('span');
        logo.className = 'brand-wordmark';
        const bar = document.createElement('span');
        bar.className = 'route-loader-bar';
        loader.append(logo, bar);
        document.body.append(progress, loader);
      } catch { progress = loader = null; return; }
    }
    clearTimeout(progressTimer);
    clearTimeout(loaderTimer);
    progress.classList.remove('is-done');
    progressTimer = setTimeout(() => progress.classList.add('is-active'), 150);
    loaderTimer = setTimeout(() => loader.classList.add('is-active'), 600);
  }
  // Nakładka znika, zanim przeglądarka zrobi zrzuty do animacji przejścia.
  function hideLoader() {
    clearTimeout(loaderTimer);
    loader?.classList.remove('is-active');
  }
  function finishProgress() {
    hideLoader();
    clearTimeout(progressTimer);
    if (!progress?.classList.contains('is-active')) return;
    progress.classList.add('is-done');
    progressTimer = setTimeout(() => progress.classList.remove('is-active', 'is-done'), 350);
  }

  async function navigate(url, pop = false, scroll = 0) {
    stopRestore();
    if (updating) {
      pending = { url, pop, scroll };
      return;
    }
    request?.abort();
    const controller = new AbortController();
    request = controller;
    transition?.skipTransition();
    startProgress();
    try {
      const key = pageKey(url);
      const cached = prefetched.get(key);
      prefetched.delete(key);
      const page = cached && Date.now() - cached.time < 30000
        ? await cached.page.catch(() => fetchPage(url, AbortSignal.any([controller.signal, AbortSignal.timeout(10000)])))
        : await fetchPage(url, AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]));
      if (controller.signal.aborted) return;
      if (!page.ok) throw new Error('Nie udało się pobrać strony.');
      const requestedHash = url.hash;
      if (page.url) { url = new URL(page.url); url.hash = requestedHash; }
      const next = new DOMParser().parseFromString(page.text, 'text/html');
      const main = next.querySelector('main');
      if (!main || !next.querySelector('.navbar')) throw new Error('Brak zawartości strony.');
      const documentBase = new URL(next.querySelector('base')?.getAttribute?.('href') || document.baseURI || url.href, url.href);
      for (const link of next.querySelectorAll('link[rel="stylesheet"]')) {
        const href = new URL(link.getAttribute('href'), documentBase).href;
        if ([...document.styleSheets].some((sheet) => sheet.href === href)) continue;
        await new Promise((resolve, reject) => {
          const style = document.createElement('link');
          style.rel = 'stylesheet';
          style.href = href;
          style.onload = resolve;
          style.onerror = reject;
          // Eksport Pages dopisuje ?v=<skrót>, więc dopasowujemy nazwę pliku, a nie koniec adresu.
          document.head.insertBefore(style, document.querySelector('link[href*="/controls.css"], link[href^="controls.css"], link[href*="assets/css/controls.css"]'));
        });
      }
      if (controller.signal.aborted) return;
      updating = true;
      // Load modules while the current page is still live, before taking transition snapshots.
      window.portfolioRouting = true;
      try {
        for (const script of next.querySelectorAll('script[src]')) {
          const source = new URL(script.getAttribute('src'), documentBase).href;
          if (/\/(?:router|theme|portfolio)\.js(?:\?|$)/.test(source)) continue;
          await loadScript(source);
        }
      } finally { window.portfolioRouting = false; }
      if (controller.signal.aborted) return;
      const update = async () => {
        if (controller.signal.aborted) return;
        resetScope();
        document.querySelectorAll('dialog[open]').forEach((dialog) => dialog.close());
        document.body.style.overflow = '';
        document.querySelector('main').replaceWith(main);
        document
          .querySelectorAll('body > footer, body > .photo-lightbox, body > .contact-fab')
          .forEach((node) => node.remove());
        next
          .querySelectorAll('body > footer, body > .photo-lightbox, body > .contact-fab')
          .forEach((node) => document.body.append(node));
        document.querySelector('.navigation').innerHTML =
          next.querySelector('.navigation').innerHTML;
        document.querySelector('.navbar').classList.remove('menu-open');
        document.title = next.title;
        if (!pop) history.pushState({ portfolioScroll: 0 }, '', url.href);
        current = new URL(url);
        window.portfolioRouting = true;
        try {
          const pageSignal = scope.signal;
          for (const script of next.querySelectorAll('script[src]')) {
            const name = script.getAttribute('src').split('/').at(-1).split('?')[0];
            if (!initializers[name]) continue;
            // Moduły zaczynają pracę w kolejności HTML, ale ich żądania sieciowe
            // nie mogą zatrzymywać przejścia i blokować następnej nawigacji.
            const result = initializers[name]();
            if (result?.catch) result.catch(error => {
              if (!pageSignal.aborted) console.error(error);
            });
          }
        } finally {
          window.portfolioRouting = false;
        }
        window.refreshPortfolioPage?.();
        const target = url.hash
          ? document.getElementById(decodeURIComponent(url.hash.slice(1)))
          : null;
        if (target) target.scrollIntoView({ behavior: 'instant' });
        else scrollTo({ top: pop ? scroll : 0, behavior: 'instant' });
        main.setAttribute('tabindex', '-1');
        main.focus({ preventScroll: true });
      };
      hideLoader();
      if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        root.dataset.pageTransition = 'true';
        transition = document.startViewTransition(update);
        await transition.finished;
      } else await update();
    } catch (error) {
      if (!controller.signal.aborted) location.assign(url.href);
    } finally {
      if (request === controller) {
        request = null;
        transition = null;
        delete root.dataset.pageTransition;
        finishProgress();
      }
      updating = false;
      if (pending) {
        const next = pending;
        pending = null;
        navigate(next.url, next.pop, next.scroll);
      }
    }
  }
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (
      !link ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey ||
      link.hasAttribute('download') ||
      (link.target && link.target !== '_self')
    )
      return;
    const url = new URL(link.href);
    if (!publicPage(url) || (url.pathname === current.pathname && url.search === current.search))
      return;
    event.preventDefault();
    history.replaceState({ ...history.state, portfolioScroll: scrollY }, '', location.href);
    navigate(url);
  });
  addEventListener('popstate', (event) => {
    const url = new URL(location.href);
    if (!publicPage(url)) return location.reload();
    if (url.pathname === current.pathname && url.search === current.search) {
      current = url;
      scrollTo({ top: event.state?.portfolioScroll || 0, behavior: 'instant' });
    } else navigate(url, true, event.state?.portfolioScroll || 0);
  });
})();
