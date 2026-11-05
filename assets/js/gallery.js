window.portfolioPages ||= {};
window.portfolioPages['gallery.js'] = async () => {
  const pageScope = window.portfolioPageScope || {
    signal: new AbortController().signal,
    cleanup: () => {},
  };
  let photos = window.portfolioPhotos;
  if (location.protocol !== 'file:') {
    try {
      const response = await fetch('/api/photos', { signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        photos = await response.json();
        window.portfolioPhotos = photos;
        document.querySelector('.hobby-note').hidden = true;
      }
    } catch {
      // Statyczny hosting nadal może używać danych zapisanych w pliku.
    }
  }
  if (pageScope.signal.aborted) return;
  photos = (photos || []).filter(photo => photo.visible !== false);
  const track = document.querySelector('.gallery-track');
  const dialog = document.querySelector('.photo-lightbox');
  const focusButton=document.createElement('button');focusButton.type='button';focusButton.className='lightbox-focus';focusButton.setAttribute('aria-pressed','false');
  const updateFocusLabel=()=>{focusButton.textContent=document.documentElement.lang==='en'?(dialog.classList.contains('is-focused')?'Show information':'Photo only'):(dialog.classList.contains('is-focused')?'Pokaż informacje':'Samo zdjęcie');};
  focusButton.addEventListener('click',()=>{dialog.classList.toggle('is-focused');focusButton.setAttribute('aria-pressed',String(dialog.classList.contains('is-focused')));updateFocusLabel();if(dialog.open&&selectedPhoto)renderLightbox();},{signal:pageScope.signal});dialog.append(focusButton);updateFocusLabel();
  document.addEventListener('portfolio-language-change',updateFocusLabel,{signal:pageScope.signal});
  dialog.addEventListener('close',()=>{dialog.classList.remove('is-focused');focusButton.setAttribute('aria-pressed','false');updateFocusLabel();},{signal:pageScope.signal});
  const mobileQuery = matchMedia('(max-width: 768px)');
  let filteredPhotos = photos.filter(photo => photo.galleryVisible !== false);
  let selectedPhoto = null;
  let albumMode = false;
  let albumReturnPhoto = null;
  let scrollFrame = 0;
  let returnFocus = null;
  const text = (value) =>
    typeof value === 'string' ? value : value?.[document.documentElement.lang] || '';
  const translated = (pl, en) => (document.documentElement.lang === 'en' ? en : pl);

  function visual(photo) {
    if (photo.src) {
      const image = document.createElement('img');
      image.src = photo.thumbUrl || photo.src;
      image.addEventListener(
        'error',
        () => {
          if (photo.thumbUrl) image.src = photo.src;
        },
        { once: true },
      );
      image.addEventListener('load', async () => {
        try { await image.decode(); } catch {}
        if (!pageScope.signal.aborted) image.classList.add('is-ready');
      }, { once: true });
      if (image.complete && image.naturalWidth) image.classList.add('is-ready');
      image.decoding = 'async';
      image.alt = text(photo.title);
      image.loading = 'lazy';
      image.draggable = false;
      image.style.objectPosition=(photo.crop?.x??50)+'% '+(photo.crop?.y??50)+'%';
      return image;
    }
    const placeholder = document.createElement('div');
    placeholder.className = 'photo-placeholder';
    placeholder.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M3 6h4l2-3h6l2 3h4v14H3Z"/><circle cx="12" cy="13" r="4"/></svg><span></span>';
    placeholder.querySelector('span').textContent = translated(
      'Miejsce na Twoje zdjęcie',
      'Your photo goes here',
    );
    return placeholder;
  }

  function selectPhoto(photo) {
    selectedPhoto = photo;
    if (!dialog.open) track.querySelectorAll('.photo-card').forEach((card) => {
      const active = card.dataset.photoId === photo.id;
      card.classList.toggle('selected', active);
      card.setAttribute('aria-pressed', String(active));
    });
    if (dialog.open) renderLightbox();
  }

  function albumPhotos(photo) {
    const album = photo?.album?.trim().normalize('NFC').toLocaleLowerCase('pl');
    return album ? photos.filter(item => item.album?.trim().normalize('NFC').toLocaleLowerCase('pl') === album).sort((a,b)=>Number(b.albumCover===true)-Number(a.albumCover===true)) : photo ? [photo] : [];
  }
  function renderLightbox() {
    const collection = albumMode ? albumPhotos(selectedPhoto) : filteredPhotos;
    const album = albumPhotos(selectedPhoto);
    const photo = selectedPhoto;
    dialog.querySelector('.lightbox-prev').hidden = collection.length < 2;
    dialog.querySelector('.lightbox-next').hidden = collection.length < 2;
    window.renderPortfolioLightbox(selectedPhoto, collection, selectPhoto, {
      albumAction: albumMode ? translated('Wróć do wszystkich zdjęć', 'Back to all photos') : album.length > 1
        ? photo.category === 'concerts' ? translated('Zobacz więcej zdjęć z wydarzenia', 'See more photos from this event')
        : photo.category === 'people' ? translated('Zobacz więcej zdjęć z sesji', 'See more photos from this session')
        : translated('Zobacz więcej zdjęć z albumu', 'See more photos from this album') : '',
      albumShareUrl: photo.album ? (() => { const url=new URL('/po-godzinach',location.origin);url.searchParams.set('album',album[0].id);return url.href; })() : '',
      onAlbumAction: () => { if (!albumMode) { albumReturnPhoto = selectedPhoto; albumMode = true; selectPhoto(albumPhotos(selectedPhoto)[0]); } else { albumMode = false; const target=filteredPhotos.includes(albumReturnPhoto)?albumReturnPhoto:filteredPhotos[0]; if(target)selectPhoto(target);else closePhoto(); } }
    });
  }

  function openPhoto(photo, button, asAlbum = false) {
    albumMode = asAlbum;
    albumReturnPhoto = filteredPhotos.includes(photo) ? photo : filteredPhotos[0];
    selectPhoto(photo);
    returnFocus = button;
    if(mobileQuery.matches) dialog.style.setProperty('--mobile-photo-height', Math.round(innerHeight*.55)+'px');
    dialog.classList.add('is-loading-first');
    dialog.showModal();
    document.body.classList.add('photo-view-open');
    document.dispatchEvent(new Event('portfolio-lightbox-state'));
    dialog.scrollTop = 0;
    renderLightbox();
    document.body.style.overflow = 'hidden';
  }

  function renderGallery() {
    track.replaceChildren();
    if (!filteredPhotos.length) {
      const empty = document.createElement('p');
      empty.className = 'gallery-empty';
      empty.textContent = translated(
        'W tej kategorii nie ma jeszcze zdjęć.',
        'No photographs in this category yet.',
      );
      track.append(empty);
      selectedPhoto = null;
      return;
    }
    // Trzy identyczne cykle pozwalają przewijać w obie strony bez końca.
    for (let cycle = 0; cycle < (mobileQuery.matches ? 1 : 3); cycle++) {
      const group = document.createElement('div');
      group.className = 'gallery-cycle';
      filteredPhotos.forEach((photo) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `photo-card ${photo.shape}`;
        button.dataset.photoId = photo.id;
        button.setAttribute('aria-label', text(photo.title));
        button.setAttribute('aria-pressed', 'false');
        button.tabIndex = mobileQuery.matches || cycle === 1 ? 0 : -1;
        const caption = document.createElement('span');
        caption.className = 'photo-caption';
        caption.textContent = text(photo.title) || text(photo.place);
        button.append(visual(photo), caption);
        button.addEventListener('click', () => openPhoto(photo, button));
        group.append(button);
      });
      track.append(group);
    }
    track.scrollLeft = mobileQuery.matches ? 0 : cycleWidth();
    if (selectedPhoto && filteredPhotos.includes(selectedPhoto)) selectPhoto(selectedPhoto);
    else {
      selectedPhoto = null;
    }
    selectCentralPhoto();
  }

  function cycleWidth() {
    if (!filteredPhotos.length) return 0;
    return (
      track.firstElementChild.getBoundingClientRect().width +
      parseFloat(getComputedStyle(track).gap)
    );
  }

  function selectCentralPhoto() {
    if (dialog.open) return;
    if (dialog.open || !mobileQuery.matches || !filteredPhotos.length) return;
    const bounds = track.getBoundingClientRect();
    const center = bounds.left + bounds.width / 2;
    const buttons = [...track.querySelectorAll('.photo-card')];
    const closest = buttons.reduce((best, button) => {
      const box = button.getBoundingClientRect();
      const distance = Math.abs(box.left + box.width / 2 - center);
      return !best || distance < best.distance ? { button, distance } : best;
    }, null);
    if (!closest) return;
    // Przy tej samej pozycji zachowaj rząd zdjęcia wybranego dotknięciem.
    const current = buttons.find((button) => {
      const box = button.getBoundingClientRect();
      return (
        button.dataset.photoId === selectedPhoto?.id &&
        Math.abs(box.left + box.width / 2 - center) < closest.distance + 3
      );
    });
    const id = (current || closest.button).dataset.photoId;
    if (id !== selectedPhoto?.id) selectPhoto(filteredPhotos.find((photo) => photo.id === id));
  }

  track.addEventListener(
    'scroll',
    () => {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        if (mobileQuery.matches) { selectCentralPhoto(); return; }
        const width = cycleWidth();
        if (!width) return;
        if (track.scrollLeft < width * 0.5) track.scrollLeft += width;
        else if (track.scrollLeft > width * 1.5) track.scrollLeft -= width;
        selectCentralPhoto();
      });
    },
    { passive: true },
  );

  document.querySelectorAll('.gallery-filter').forEach((button) =>
    button.addEventListener('click', () => {
      document
        .querySelectorAll('.gallery-filter')
        .forEach((filter) => filter.setAttribute('aria-pressed', String(filter === button)));
      filteredPhotos = photos.filter(
        (photo) => photo.galleryVisible !== false && (button.dataset.filter === 'all' || photo.category === button.dataset.filter),
      );
      renderGallery();
    }),
  );

  document.querySelectorAll('[data-gallery-direction]').forEach((button) =>
    button.addEventListener('click', () => {
      track.scrollBy({
        left: Number(button.dataset.galleryDirection) * (mobileQuery.matches ? (track.querySelector('.photo-card')?.offsetWidth || track.clientWidth) + 16 : track.clientWidth * 0.65),
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      });
    }),
  );

  let closingTimer = 0;
  function finishClosing() {
    clearTimeout(closingTimer);
    if (dialog.open) dialog.close();
    dialog.classList.remove('is-closing');
  }
  function closePhoto() {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    dialog.dispatchEvent(new Event('lightbox-closing'));
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finishClosing();
      return;
    }
    dialog.classList.add('is-closing');
    closingTimer = setTimeout(finishClosing, 280);
  }
  dialog.addEventListener('animationend', (event) => {
    if (event.target === dialog && event.animationName === 'lightbox-out') finishClosing();
  }, { signal: pageScope.signal });
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closePhoto();
  }, { signal: pageScope.signal });
  pageScope.cleanup(() => {
    clearTimeout(closingTimer);
    dialog.classList.remove('is-closing');
    document.body.classList.remove('photo-view-open');
    document.dispatchEvent(new Event('portfolio-lightbox-state'));
  });

  function movePhoto(direction) {
    const collection = albumMode ? albumPhotos(selectedPhoto) : filteredPhotos;
    if (collection.length < 2 || dialog.classList.contains('is-closing')) return;
    const index = collection.indexOf(selectedPhoto);
    selectPhoto(collection[(index + direction + collection.length) % collection.length]);
  }
  dialog.querySelector('.lightbox-prev').addEventListener('click', () => movePhoto(-1));
  dialog.querySelector('.lightbox-next').addEventListener('click', () => movePhoto(1));
  dialog.querySelector('.lightbox-close').addEventListener('click', closePhoto);
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    const outside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;
    if (outside) closePhoto();
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      movePhoto(-1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      movePhoto(1);
    }
  });
  dialog.addEventListener('close', () => {
    clearTimeout(closingTimer);
    dialog.classList.remove('is-closing');
    document.body.style.overflow = '';
    document.body.classList.remove('photo-view-open');
    document.dispatchEvent(new Event('portfolio-lightbox-state'));
    const focusTarget = returnFocus?.isConnected
      ? returnFocus
      : track.querySelector(`[data-photo-id="${CSS.escape(selectedPhoto?.id || '')}"]`);
    focusTarget?.focus({ preventScroll: true });
  });
  function translateGallery() {
    const byId = new Map(filteredPhotos.map(photo => [photo.id, photo]));
    track.querySelectorAll('.photo-card').forEach(card => {
      const photo = byId.get(card.dataset.photoId);
      if (!photo) return;
      const title = text(photo.title);
      card.setAttribute('aria-label', title);
      const image = card.querySelector('img');
      if (image) image.alt = title;
      const caption = card.querySelector('.photo-caption');
      if (caption) caption.textContent = title || text(photo.place);
      const placeholder = card.querySelector('.photo-placeholder span');
      if (placeholder) placeholder.textContent = translated('Miejsce na Twoje zdjęcie', 'Your photo goes here');
    });
    const empty = track.querySelector('.gallery-empty');
    if (empty) empty.textContent = translated('W tej kategorii nie ma jeszcze zdjęć.', 'No photographs in this category yet.');
    if (dialog.open && selectedPhoto) renderLightbox();
  }
  document.addEventListener('portfolio-language-change', translateGallery, {
    signal: pageScope.signal,
  });
  mobileQuery.addEventListener('change', renderGallery, { signal:pageScope.signal });
  let previousWidth = innerWidth;
  addEventListener(
    'resize',
    () => {
      if (innerWidth === previousWidth) return;
      previousWidth = innerWidth;
      if (dialog.open) renderLightbox();
      if (!mobileQuery.matches) track.scrollLeft = cycleWidth();
      selectCentralPhoto();
    },
    { signal: pageScope.signal },
  );
  pageScope.cleanup(() => cancelAnimationFrame(scrollFrame));
  renderGallery();
  const sharedAlbum=new URL(location.href).searchParams.get('album') || (location.pathname.startsWith('/album/') ? decodeURIComponent(location.pathname.slice(7)) : null);
  if(sharedAlbum){
    const linked=photos.find(photo=>photo.id===sharedAlbum&&photo.album);
    const first=linked ? albumPhotos(linked)[0] : null;
    if(first) openPhoto(first,track.querySelector('.photo-card'),true);
    else {const note=document.createElement('p');note.className='gallery-empty';note.setAttribute('role','status');note.dataset.pl='Ten album jest obecnie niedostępny. Zobacz pozostałe zdjęcia.';note.dataset.en='This album is currently unavailable. Explore the other photographs.';note.textContent=translated(note.dataset.pl,note.dataset.en);track.before(note);}
  }
};
if (!window.portfolioRouting) window.portfolioPages['gallery.js']().catch(console.error);
