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
  const dots = document.createElement('div');
  dots.className = 'lightbox-dots';
  dots.setAttribute('role', 'group');
  const pagination = document.createElement('div');
  pagination.className = 'lightbox-pagination';
  counter.replaceWith(pagination);
  pagination.append(counter, dots);
  dialog.setAttribute('aria-labelledby', 'lightbox-title');

  const local = (value) =>
    typeof value === 'string' ? value : value?.[document.documentElement.lang] || '';
  const translate = (pl, en) => (document.documentElement.lang === 'en' ? en : pl);
  const iconPaths = {
    artist:
      '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/>',
    event: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/>',
    venue:
      '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    date: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 2v6M17 2v6M3 11h18M8 15h2M14 15h2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
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
  function updateCropLabel(frame) {
    const cropped = frame.classList.contains('is-cropped');
    frame.setAttribute('aria-pressed', String(!cropped));
    frame.setAttribute('aria-label', cropped ? translate('Pokaż całe zdjęcie', 'Show the whole photo') : translate('Pokaż kadr', 'Show the crop'));
    frame.dataset.hint = cropped ? translate('Całe zdjęcie', 'Whole photo') : translate('Kadr', 'Crop');
  }
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
      // Zdjęcie otwiera się w kwadracie (kadr z panelu), kliknięcie pokazuje całość i z powrotem.
      const toggle = () => { if (frame.getAttribute('role') !== 'button') return; frame.classList.toggle('is-cropped'); updateCropLabel(frame); };
      frame.addEventListener('click', toggle, { signal: pageScope.signal });
      frame.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault(); toggle();
      }, { signal: pageScope.signal });
    }
    if (prepared) {
      prepared.alt = local(photo.title); prepared.classList.add('is-ready'); prepared.draggable = false;
      if (frame.firstElementChild !== prepared) frame.replaceChildren(prepared);
      // Nowe zdjęcie zaczyna od kadru; zmiana języka czy trybu tego samego zdjęcia zachowuje wybór.
      if (frame.dataset.photoId !== String(photo.id)) { frame.dataset.photoId = String(photo.id); frame.classList.add('is-cropped'); }
      frame.style.setProperty('--crop-position', `${photo.crop?.x ?? 50}% ${photo.crop?.y ?? 50}%`);
      frame.setAttribute('role', 'button'); frame.tabIndex = 0;
      updateCropLabel(frame);
    } else {
      const placeholder = document.createElement('div'); placeholder.className = 'photo-placeholder';
      placeholder.textContent = translate('Miejsce na zdjęcie', 'Photo placeholder'); frame.replaceChildren(placeholder);
      frame.classList.remove('is-cropped'); delete frame.dataset.photoId;
      for (const name of ['role', 'tabindex', 'aria-pressed', 'aria-label', 'data-hint']) frame.removeAttribute(name);
    }
    information.replaceChildren();
    const badges = document.createElement('div');
    badges.className = 'lightbox-badges';
    const categories = {
      concerts: ['Koncert', 'Concert'],
      nature: ['Natura', 'Nature'],
      people: ['Ludzie', 'People'],
      places: ['Miejsca', 'Places'],
    };
    const category = categories[photo.category] || ['Fotografia', 'Photography'];
    [translate(...category), photo.category === 'concerts' ? local(photo.city) : '']
      .filter(Boolean)
      .forEach((label) => {
        const badge = document.createElement('span');
        badge.textContent = label;
        badges.append(badge);
      });
    if (photo.album) {
      const album = document.createElement('span'); album.className = 'lightbox-album';
      album.textContent = photo.album; album.setAttribute('aria-label', translate('Album: ', 'Album: ') + photo.album); badges.append(album);
    }
    const heading = document.createElement('h2');
    heading.id = 'lightbox-title';
    const concert = photo.category === 'concerts';
    if (!concert) heading.className = 'visually-hidden';
    heading.textContent = concert
      ? local(photo.artist) || local(photo.title)
      : local(photo.place) || local(photo.venue);
    const grid = document.createElement('dl');
    grid.className = 'lightbox-info-grid';
    if (!concert) grid.classList.add('is-simple');
    const fields = concert
      ? [
          ['artist', 'Artysta', 'Artist'],
          ['event', 'Wydarzenie', 'Event'],
          ['venue', 'Miejsce', 'Venue'],
          ['date', 'Data', 'Date'],
        ]
      : [['venue', 'Miejsce', 'Venue']];
    fields.forEach(([key, pl, en]) => {
      const tile = document.createElement('div');
      tile.className = 'lightbox-info-tile';
      const label = document.createElement('dt');
      label.className = 'visually-hidden';
      label.textContent = translate(pl, en);
      const value = document.createElement('dd');
      value.className = 'lightbox-value';
      value.textContent =
        local(
          !concert
            ? photo.place || photo.venue
            : photo[key] || (key === 'venue' ? photo.place : ''),
        ) || '—';
      tile.append(label, icon(key), value);
      grid.append(tile);
    });
    const description = document.createElement('div');
    description.className = 'lightbox-description';
    const sentence = document.createElement('p');
    sentence.textContent =
      local(photo.description) ||
      translate('Opis tego kadru pojawi się wkrótce.', 'More about this frame coming soon.');
    description.append(icon('info'), sentence);
    if (concert) information.append(badges, heading, grid, description);
    else {
      information.append(badges, heading, grid);
      if (photo.category === 'people' && /^[a-zA-Z0-9._]{1,30}$/.test(photo.instagram || '')) {
        const instagram = document.createElement('a');
        instagram.className = 'lightbox-instagram';
        instagram.href = `https://www.instagram.com/${photo.instagram}/`;
        instagram.target = '_blank';
        instagram.rel = 'noopener noreferrer';
        instagram.textContent = `@${photo.instagram}`;
        information.append(instagram);
      }
      if (local(photo.description)) information.append(description);
    }

    const albumActions=document.createElement('div');albumActions.className='lightbox-album-actions';
    information.append(albumActions);
    if(options.albumShareUrl){
      const share=document.createElement('button');share.type='button';share.className='lightbox-album-action lightbox-share';
      share.textContent=translate('Kopiuj link do albumu','Copy album link');
      const feedback=document.createElement('p');feedback.className='lightbox-share-status';feedback.setAttribute('role','status');
      share.addEventListener('click',async()=>{
        share.disabled=true;
        try{if(!navigator.clipboard?.writeText)throw Error();await navigator.clipboard.writeText(options.albumShareUrl);feedback.textContent=translate('Link skopiowany — otworzy od razu ten album.','Link copied — it opens this album directly.');}
        catch{feedback.textContent=translate('Skopiuj poniższy link:','Copy the link below:');let field=information.querySelector('.lightbox-share-url');if(!field){field=document.createElement('input');field.className='lightbox-share-url';field.readOnly=true;field.setAttribute('aria-label',translate('Link do albumu','Album link'));information.append(field);}field.value=options.albumShareUrl;field.focus();field.select();}
        finally{share.disabled=false;}
      });
      albumActions.append(share);information.append(feedback);
    }
    if (options.albumAction) {
      const albumButton = document.createElement('button');
      albumButton.type = 'button'; albumButton.className = 'lightbox-album-action';
      albumButton.textContent = options.albumAction;
      albumButton.addEventListener('click', options.onAlbumAction);
      albumActions.append(albumButton);
    }
    const index = collection.indexOf(photo);
    counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(collection.length).padStart(2, '0')}`;
    counter.setAttribute('aria-live', 'polite');
    dots.setAttribute('aria-label', translate('Wybierz zdjęcie', 'Choose a photo'));
    dots.replaceChildren();
    if (!mobile.matches && collection.length <= 30) collection.forEach((item, position) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'lightbox-dot';
      dot.setAttribute('aria-label', `${position + 1}: ${local(item.title)}`);
      dot.setAttribute('aria-pressed', String(position === index));
      dot.addEventListener('click', () => {
        select(item);
        dots.children[position]?.focus();
      });
      dots.append(dot);
    });

  };

};
if (!window.portfolioRouting) window.portfolioPages['lightbox.js']();
