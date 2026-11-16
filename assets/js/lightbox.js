// Renderowanie modalu; nawigacja klawiaturą i cykl galerii pozostają w gallery.js.
window.portfolioPages ||= {};
window.portfolioPages['lightbox.js'] = () => {
  const pageScope = window.portfolioPageScope || {
    signal: new AbortController().signal,
    cleanup: () => {},
  };
  const dialog = document.querySelector('.photo-lightbox');
  const carousel = dialog.querySelector('.lightbox-carousel');
  const mobile = matchMedia('(max-width: 768px)');

  const information = dialog.querySelector('.lightbox-metadata');
  const counter = dialog.querySelector('.lightbox-counter');
  const pagination = document.createElement('div');
  pagination.className = 'lightbox-pagination';
  counter.replaceWith(pagination);
  const thumbs = document.createElement('div');
  thumbs.className = 'lightbox-thumbs';
  pagination.append(counter, thumbs);
  dialog.setAttribute('aria-labelledby', 'lightbox-title');
  // Znak wodny: wielki, konturowy napis za zdjęciem (nazwisko artysty albo tytuł zdjęcia).
  const watermark = document.createElement('span');
  watermark.className = 'lightbox-watermark';
  watermark.setAttribute('aria-hidden', 'true');
  // Podczas renderowania napis trafia do ramki, tuż obok lewego brzegu zdjęcia.
  dialog.prepend(watermark);
  // Kontur rysuje filtr SVG, a nie -webkit-text-stroke: czcionka zmienna ma nakładające się kształty liter
  // (E, F, D), które sam stroke pokazuje jako dodatkowe kreski w środku.
  if (document.createElementNS && document.body && !document.getElementById?.('lightbox-outline')) {
    const svgNs = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNs, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    svg.innerHTML = '<filter id="lightbox-outline" color-interpolation-filters="sRGB"><feMorphology in="SourceGraphic" operator="dilate" radius="1.3" result="wide"/><feComposite in="wide" in2="SourceGraphic" operator="out"/></filter>';
    document.body.append(svg);
  }

  const local = (value) =>
    typeof value === 'string' ? value : value?.[document.documentElement.lang] || '';
  const translate = (pl, en) => (document.documentElement.lang === 'en' ? en : pl);
  async function copyAlbumLink(value) {
    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(value); return; }
      catch { /* Lokalny adres HTTP lub odmowa dostępu: kopiowanie z gestu kliknięcia. */ }
    }
    // Pole musi być wewnątrz otwartego dialogu — reszta dokumentu jest nieaktywna.
    const field = document.createElement('textarea');
    field.value = value;
    field.readOnly = true;
    field.tabIndex = -1;
    field.setAttribute('aria-hidden', 'true');
    field.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;padding:0;border:0;opacity:0;font-size:16px;pointer-events:none;';
    const focused = document.activeElement;
    const selection = window.getSelection?.();
    const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index).cloneRange()) : [];
    dialog.append(field);
    try {
      field.focus({ preventScroll: true });
      field.select();
      field.setSelectionRange(0, value.length);
      if (!document.execCommand?.('copy')) throw new Error('Clipboard unavailable');
    } finally {
      field.remove();
      if (selection) { selection.removeAllRanges(); ranges.forEach(range => selection.addRange(range)); }
      focused?.focus({ preventScroll: true });
    }
  }
  // Telefon: panel z opisem da się zwinąć (przycisk-uchwyt albo przesunięcie palcem w dół),
  // wtedy zdjęcie zajmuje cały ekran, a na dole zostaje sam tytuł. Stan trzymamy między zdjęciami.
  const details = dialog.querySelector('.lightbox-details');
  if (details) {
    const sheetToggle = document.createElement('button');
    sheetToggle.type = 'button';
    sheetToggle.className = 'lightbox-sheet-toggle';
    const setSheet = collapsed => {
      dialog.classList.toggle('is-sheet-collapsed', collapsed);
      sheetToggle.setAttribute('aria-expanded', String(!collapsed));
      sheetToggle.setAttribute('aria-label', collapsed ? translate('Pokaż opis zdjęcia', 'Show photo details') : translate('Schowaj opis zdjęcia', 'Hide photo details'));
    };
    setSheet(false);
    const toggleSheet = collapsed => {
      if (collapsed === dialog.classList.contains('is-sheet-collapsed')) return;
      setSheet(collapsed);
      // Zdjęcie od razu dostaje nowy rozmiar, a krótkie przenikanie ukrywa przeskok kadru.
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        carousel.animate?.([{ opacity: 0.35 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
        details.animate?.([{ transform: collapsed ? 'translateY(-24px)' : 'translateY(24px)', opacity: 0.6 }, { transform: 'none', opacity: 1 }], { duration: 240, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
      }
    };
    sheetToggle.addEventListener('click', () => toggleSheet(!dialog.classList.contains('is-sheet-collapsed')), { signal: pageScope.signal });
    details.prepend(sheetToggle);
    let startY = null;
    details.addEventListener('touchstart', event => {
      // Gest tylko przy górze przewiniętego panelu, żeby nie kłócić się z przewijaniem treści.
      startY = details.scrollTop <= 0 ? event.touches[0].clientY : null;
    }, { passive: true, signal: pageScope.signal });
    details.addEventListener('touchend', event => {
      if (startY === null) return;
      const distance = event.changedTouches[0].clientY - startY;
      startY = null;
      if (distance > 50) toggleSheet(true);
      else if (distance < -50) toggleSheet(false);
    }, { passive: true, signal: pageScope.signal });
  }
  const iconPaths = {
    artist:
      '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/>',
    event: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/>',
    venue:
      '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    date: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 2v6M17 2v6M3 11h18M8 15h2M14 15h2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
    nature: '<path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15"/><path d="M5 19l7-7"/>',
    people: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    places: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  };
  function icon(type) {
    const wrapper = document.createElement('span');
    wrapper.className = 'lightbox-icon';
    wrapper.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[type]}</svg>`;
    return wrapper;
  }
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const loader = window.createPortfolioPhotoLoader({
    limit: 3,
    // Miniatura (800 px) tylko gdy naprawdę wystarcza: liczymy rozmiar zdjęcia w podglądzie
    // razy pełną gęstość ekranu (retina 2–3×) z zapasem na kadr. Oszczędzanie danych zawsze wybiera miniaturę.
    preferThumbnail: () => {
      if (navigator.connection?.saveData) return true;
      const size = mobile.matches ? innerWidth - 32 : Math.min(innerHeight * 0.68, 650, dialog.clientWidth * 0.5);
      return size * (devicePixelRatio || 1) <= 600;
    },
  });
  let prefetchTimer = 0;
  let renderVersion = 0;
  let pictureAnimation;
  let displayedPhoto;
  const loadStatus = document.createElement('p');
  loadStatus.className = 'lightbox-load-status';
  loadStatus.setAttribute('role', 'status');
  loadStatus.hidden = true;
  dialog.append(loadStatus);
  const preparePhoto = photo => loader.load(photo);
  function cancelRender() {
    renderVersion++;
    clearTimeout(prefetchTimer);
    loader.cancelPending();
    displayedPhoto = null;
    pictureAnimation?.cancel();
    loadStatus.hidden = true;
    carousel.removeAttribute('aria-busy');
  }
  dialog.addEventListener('close', cancelRender, { signal: pageScope.signal });
  dialog.addEventListener('lightbox-closing', cancelRender, { signal: pageScope.signal });
  pageScope.cleanup(() => { cancelRender(); loader.dispose(); });
  window.renderPortfolioLightbox = async (photo, collection, select, options = {}) => {
    const version = ++renderVersion;
    loader.cancelOthers(photo);
    pictureAnimation?.cancel();
    carousel.setAttribute('aria-busy', 'true');
    loadStatus.textContent = translate('Ładowanie zdjęcia…', 'Loading photo…');
    loadStatus.hidden = !photo.src || loader.has(photo);
    try {
      const prepared = await preparePhoto(photo);
      if (version !== renderVersion || pageScope.signal.aborted || !dialog.isConnected || !dialog.open) return;
      const animate = displayedPhoto && displayedPhoto.id !== photo.id && !mobile.matches && !reducedMotion.matches && carousel.animate;
      renderReadyPhoto(photo, collection, select, options, prepared);
      // Tekst wsuwa się delikatnie przy przejściu do kolejnego zdjęcia.
      if (animate && information.animate) information.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 280, easing: 'ease-out' });
      displayedPhoto = photo;
      if (animate) pictureAnimation = carousel.animate([{ opacity: .85 }, { opacity: 1 }], { duration: 140, easing: 'ease-out' });
      clearTimeout(prefetchTimer);
      // Decode just the next photograph after the visible frame has settled.
      if (collection.length > 1 && !navigator.connection?.saveData) {
        const nextPhoto = collection[(collection.indexOf(photo) + 1) % collection.length];
        prefetchTimer = setTimeout(() => {
          if (version === renderVersion && dialog.open && !pageScope.signal.aborted) preparePhoto(nextPhoto).catch(() => {});
        }, 180);
      }
    } catch (error) {
      if (version === renderVersion && !pageScope.signal.aborted && error?.name !== 'AbortError') {
        loadStatus.textContent = translate('Nie udało się wczytać zdjęcia. Spróbuj przejść do następnego.', 'Unable to load this photo. Try the next one.');
        loadStatus.hidden = false;
      }
    } finally {
      if (version === renderVersion) {
        carousel.removeAttribute('aria-busy');
        if (displayedPhoto === photo) loadStatus.hidden = true;
      }
    }
  };
  // Przycisk kadru leży na zdjęciu (prawy dolny róg). Kliknięcie w samo zdjęcie otwiera pełny ekran.
  const cropButton = document.createElement('button');
  cropButton.type = 'button';
  cropButton.className = 'lightbox-crop-toggle';
  cropButton.hidden = true;
  cropButton.addEventListener('click', event => {
    // Przycisk jest wewnątrz ramki zdjęcia — bez tego ramka przełączyłaby widok drugi raz.
    event.stopPropagation();
    toggleCrop();
  }, { signal: pageScope.signal });
  cropButton.addEventListener('keydown', event => event.stopPropagation(), { signal: pageScope.signal });
  function toggleCrop() {
    const frame = carousel.firstElementChild;
    if (!frame || frame.getAttribute('role') !== 'button') return;
    frame.classList.toggle('is-cropped');
    updateCropLabel(frame);
  }
  function updateCropLabel(frame) {
    const cropped = frame.classList.contains('is-cropped');
    const label = cropped ? translate('Pokaż całe zdjęcie', 'Show the whole photo') : translate('Pokaż kadr', 'Show the crop');
    frame.setAttribute('aria-label', translate('Pokaż zdjęcie na pełnym ekranie', 'Show the photo full screen'));
    cropButton.hidden = false;
    cropButton.setAttribute('aria-pressed', String(!cropped));
    cropButton.setAttribute('aria-label', label);
    cropButton.textContent = cropped ? translate('⤢ Całe zdjęcie', '⤢ Whole photo') : translate('⤡ Kadr', '⤡ Crop');
  }
  // Powiększenie: zdjęcie w całości na czarnym tle, w pełnej rozdzielczości, w obrębie okna strony
  // (bez trybu pełnoekranowego przeglądarki). Zamyka je kliknięcie, przycisk × lub Escape.
  const viewer = document.createElement('dialog');
  viewer.className = 'lightbox-fullscreen';
  const viewerImage = document.createElement('img');
  viewerImage.decoding = 'async';
  const viewerClose = document.createElement('button');
  viewerClose.type = 'button';
  viewerClose.className = 'lightbox-fullscreen-close';
  viewerClose.textContent = '×';
  viewer.append(viewerImage, viewerClose);
  let viewerReturn = null;
  function openViewer(frame) {
    const source = frame.dataset.fullSrc;
    if (!source) return;
    // Okno powiększenia trafia do strony dopiero przy pierwszym użyciu i znika razem z podstroną.
    if (!viewer.isConnected) {
      document.body.append(viewer);
      pageScope.cleanup?.(() => viewer.remove());
    }
    const preview = frame.querySelector('img');
    // Najpierw wczytany już podgląd, a po pobraniu pełna rozdzielczość.
    viewerImage.src = preview?.currentSrc || source;
    viewerImage.alt = preview?.alt || '';
    const full = new Image();
    full.onload = () => { if (viewer.open && viewerReturn === frame) viewerImage.src = full.src; };
    full.src = source;
    viewerClose.setAttribute('aria-label', translate('Zamknij pełny ekran', 'Close full screen'));
    viewerReturn = frame;
    if (!viewer.open) viewer.showModal();
    viewerClose.focus({ preventScroll: true });
  }
  function closeViewer() {
    if (viewer.open) viewer.close();
  }
  viewer.addEventListener('close', () => {
    viewerReturn?.focus({ preventScroll: true });
  }, { signal: pageScope.signal });
  viewer.addEventListener('click', closeViewer, { signal: pageScope.signal });
  dialog.addEventListener('close', closeViewer, { signal: pageScope.signal });
  function renderReadyPhoto(photo, collection, select, options, prepared) {
    dialog.classList.remove('is-loading-first');
    const previous=dialog.querySelector('.lightbox-prev'), next=dialog.querySelector('.lightbox-next');
    if(mobile.matches){if(previous.parentElement!==pagination)pagination.prepend(previous);if(next.parentElement!==pagination)pagination.append(next);}else{if(previous.parentElement!==dialog)dialog.append(previous);if(next.parentElement!==dialog)dialog.append(next);}
    // Własny kolor zdjęcia działa również przy file://, gdzie canvas jest blokowany.
    dialog.style.setProperty('--dynamic-glow-color', photo.glowColor || 'rgba(98, 115, 220, 0.6)');
    // One decoded image and one frame on both desktop and mobile.
    let frame = carousel.firstElementChild;
    if (!frame) {
      frame = document.createElement('div'); frame.className = 'lightbox-image is-active'; carousel.append(frame);
      // Zdjęcie otwiera się w kwadracie (kadr z panelu); kliknięcie pokazuje je na pełnym ekranie.
      const open = () => { if (frame.getAttribute('role') === 'button') openViewer(frame); };
      frame.addEventListener('click', open, { signal: pageScope.signal });
      frame.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault(); open();
      }, { signal: pageScope.signal });
    }
    if (prepared) {
      prepared.alt = local(photo.title); prepared.classList.add('is-ready'); prepared.draggable = false;
      if (frame.firstElementChild !== prepared) frame.replaceChildren(prepared);
      if (cropButton.parentElement !== frame) frame.append(cropButton);
      // Nowe zdjęcie zaczyna od kadru; zmiana języka czy trybu tego samego zdjęcia zachowuje wybór.
      if (frame.dataset.photoId !== String(photo.id)) { frame.dataset.photoId = String(photo.id); frame.classList.add('is-cropped'); }
      frame.style.setProperty('--crop-position', `${photo.crop?.x ?? 50}% ${photo.crop?.y ?? 50}%`);
      // Ramka dostaje szerokość z proporcji zdjęcia — inaczej rozciąga się na całą kolumnę
      // (pełna szerokość pliku) i plakietka kadru wychodzi poza zdjęcie.
      if (prepared.naturalWidth && prepared.naturalHeight) frame.style.setProperty('--photo-ratio', String(prepared.naturalWidth / prepared.naturalHeight));
      frame.dataset.fullSrc = photo.src;
      frame.setAttribute('role', 'button'); frame.tabIndex = 0;
      updateCropLabel(frame);
    } else {
      const placeholder = document.createElement('div'); placeholder.className = 'photo-placeholder';
      placeholder.textContent = translate('Miejsce na zdjęcie', 'Photo placeholder'); frame.replaceChildren(placeholder);
      frame.classList.remove('is-cropped'); delete frame.dataset.photoId;
      for (const name of ['role', 'tabindex', 'aria-pressed', 'aria-label', 'data-full-src']) frame.removeAttribute(name);
      cropButton.hidden = true;
    }
    // Panel informacji jest budowany od nowa przy każdym zdjęciu; zapamiętujemy przycisk z fokusem,
    // żeby po zmianie zdjęcia klawiatura nie wypadała na <body>.
    const activeElement = document.activeElement;
    const focusedClass = activeElement && information.contains?.(activeElement) ? activeElement.className : '';
    information.replaceChildren();
    const concert = photo.category === 'concerts';
    const categories = {
      concerts: ['Koncert', 'Concert', 'artist'],
      nature: ['Natura', 'Nature', 'nature'],
      people: ['Ludzie', 'People', 'people'],
      places: ['Miejsca', 'Places', 'places'],
    };
    const [categoryPl, categoryEn, categoryIcon] = categories[photo.category] || ['Fotografia', 'Photography', 'places'];
    // Znaczniki z ikonami: kategoria (w kolorze zdjęcia), miejsce i data. Ukryta etykieta mówi czytnikom, co to za pole.
    const tags = document.createElement('ul');
    tags.className = 'lightbox-tags';
    const tag = (iconName, label, value, className = '') => {
      if (!value) return;
      const item = document.createElement('li');
      item.className = ('lightbox-tag ' + className).trim();
      const hidden = document.createElement('span');
      hidden.className = 'visually-hidden';
      hidden.textContent = label + ': ';
      const text = document.createElement('span');
      text.textContent = value;
      item.append(icon(iconName), hidden, text);
      tags.append(item);
    };
    tag(categoryIcon, translate('Kategoria', 'Category'), translate(categoryPl, categoryEn), 'is-category');
    const place = concert
      ? [local(photo.venue) || local(photo.place), local(photo.city)].filter(Boolean).join(', ')
      : local(photo.place) || local(photo.venue);
    tag('venue', translate('Miejsce', 'Place'), place);
    tag('date', translate('Data', 'Date'), local(photo.date));
    const heading = document.createElement('h2');
    heading.id = 'lightbox-title';
    const photoTitle = local(photo.title);
    heading.textContent = concert ? local(photo.artist) || photoTitle : photoTitle || place;
    const gallerySettings = window.portfolioGallerySettings || {};
    watermark.textContent = gallerySettings.watermarkEnabled === false ? '' : photo.watermarkText || gallerySettings.watermarkText || heading.textContent;
    if (watermark.parentElement !== frame) frame.append(watermark);
    information.append(tags, heading);
    // Pod nazwiskiem artysty nazwa wydarzenia, mniejszą czcionką. Na telefonie dochodzi data (tam nie ma znacznika daty).
    const eventName = concert ? local(photo.event) : '';
    if (eventName || local(photo.date)) {
      const subtitle = document.createElement('p');
      subtitle.className = 'lightbox-subtitle';
      if (eventName) {
        const name = document.createElement('span');
        name.className = 'lightbox-subtitle-event';
        name.textContent = eventName;
        subtitle.append(name);
      }
      if (local(photo.date)) {
        const date = document.createElement('span');
        date.className = 'lightbox-subtitle-date';
        date.setAttribute('aria-hidden', 'true');
        date.textContent = (eventName ? ' · ' : '') + local(photo.date);
        subtitle.append(date);
      }
      information.append(subtitle);
    }
    if (photo.category === 'people' && /^[a-zA-Z0-9._]{1,30}$/.test(photo.instagram || '')) {
      const instagram = document.createElement('a');
      instagram.className = 'lightbox-instagram';
      instagram.href = `https://www.instagram.com/${photo.instagram}/`;
      instagram.target = '_blank';
      instagram.rel = 'noopener noreferrer';
      instagram.textContent = `@${photo.instagram}`;
      information.append(instagram);
    }
    if (concert || local(photo.description)) {
      const description = document.createElement('div');
      description.className = 'lightbox-description';
      const sentence = document.createElement('p');
      sentence.textContent = local(photo.description) || translate('Opis tego kadru pojawi się wkrótce.', 'More about this frame coming soon.');
      description.append(icon('info'), sentence);
      information.append(description);
    }

    const albumActions=document.createElement('div');albumActions.className='lightbox-album-actions';
    information.append(albumActions);
    if(options.albumShareUrl){
      const share=document.createElement('button');share.type='button';share.className='lightbox-album-action lightbox-share';
      share.textContent=translate('Kopiuj link do albumu','Copy album link');
      const feedback=document.createElement('p');feedback.className='lightbox-share-status';feedback.setAttribute('role','status');
      share.addEventListener('click',async()=>{
        share.disabled=true;
        try{await copyAlbumLink(options.albumShareUrl);feedback.textContent=translate('Link skopiowany — otworzy od razu ten album.','Link copied — it opens this album directly.');}
        catch{feedback.textContent=translate('Przeglądarka zablokowała kopiowanie. Spróbuj ponownie lub otwórz stronę przez HTTPS.','Your browser blocked copying. Try again or open the site over HTTPS.');}
        finally{share.disabled=false;}
      });
      albumActions.append(feedback,share);
    }
    if (options.albumAction) {
      const albumButton = document.createElement('button');
      albumButton.type = 'button'; albumButton.className = 'lightbox-album-action';
      albumButton.textContent = options.albumAction;
      albumButton.addEventListener('click', options.onAlbumAction);
      // Główna akcja stoi pierwsza, przed kopiowaniem linku.
      albumActions.prepend(albumButton);
    }
    if (focusedClass) {
      const again = [...information.querySelectorAll('a, button')].find(element => element.className === focusedClass);
      (again || dialog.querySelector('.lightbox-close'))?.focus({ preventScroll: true });
    }
    const index = collection.indexOf(photo);
    counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(collection.length).padStart(2, '0')}`;
    counter.setAttribute('aria-live', 'polite');
    // Pasek miniatur: widać, co jest dalej, i można przeskoczyć do zdjęcia. Tylko na komputerze;
    // przy dużych kolekcjach pasek przewija się w bok, a miniatury spoza widoku ładują się leniwie.
    const activeThumb = document.activeElement;
    const focusedThumb = thumbs.contains?.(activeThumb) ? [...thumbs.children].indexOf(activeThumb) : -1;
    thumbs.replaceChildren();
    thumbs.hidden = mobile.matches || collection.length < 2;
    thumbs.setAttribute('aria-label', translate('Zdjęcia w tej kolekcji', 'Photos in this collection'));
    if (!thumbs.hidden) collection.forEach((item, position) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'lightbox-thumb';
      button.setAttribute('aria-label', `${position + 1}: ${local(item.title) || local(item.place)}`);
      if (position === index) button.setAttribute('aria-current', 'true');
      const image = document.createElement('img');
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      image.src = item.thumbUrl || item.src;
      image.style.objectPosition = `${item.crop?.x ?? 50}% ${item.crop?.y ?? 50}%`;
      button.append(image);
      button.addEventListener('click', () => select(item));
      thumbs.append(button);
    });
    if (focusedThumb >= 0) thumbs.children[focusedThumb]?.focus({ preventScroll: true });
    // Bieżąca miniatura na środek paska (tylko w poziomie, bez przewijania całego okna).
    const currentThumb = thumbs.children[index];
    if (currentThumb && !thumbs.hidden) thumbs.scrollLeft = currentThumb.offsetLeft - (thumbs.clientWidth - currentThumb.offsetWidth) / 2;

  };

};
if (!window.portfolioRouting) window.portfolioPages['lightbox.js']();
