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
  let activePhoto;
  let activeCollection = [];
  let selectPhoto;
  let collectionKey = '';

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
  const pendingImages = new Map();
  const readyImages = new Map();
  let renderVersion = 0;
  let pictureAnimation;
  let displayedPhoto;
  const loadStatus = document.createElement('p');
  loadStatus.className = 'lightbox-load-status';
  loadStatus.setAttribute('role', 'status');
  loadStatus.hidden = true;
  dialog.append(loadStatus);
  function preparePhoto(photo) {
    if (!photo.src) return Promise.resolve();
    if (readyImages.has(photo.src)) return Promise.resolve(readyImages.get(photo.src));
    if (pendingImages.has(photo.src)) return pendingImages.get(photo.src);
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      if (location.protocol !== 'file:') image.crossOrigin = 'anonymous';
      let settled = false, fallback = false;
      const timeout = setTimeout(() => finish(new Error('Image load timed out')), 15000);
      function finish(error) {
        if (settled) return;
        settled = true; clearTimeout(timeout);
        image.onload = image.onerror = null;
        if (error) { reject(error); return; }
        image.dataset.loadedSource = image.src;
        readyImages.set(photo.src, image);
        if (readyImages.size > (mobile.matches ? 2 : 6)) readyImages.delete(readyImages.keys().next().value);
        resolve(image);
      }
      image.onload = async () => {
        try { await image.decode(); } catch { /* A loaded image can still be displayed. */ }
        finish(image.naturalWidth ? null : new Error('Empty image'));
      };
      const primarySource=mobile.matches && photo.thumbUrl ? photo.thumbUrl : photo.src;
      image.onerror = () => {
        const alternate=primarySource===photo.src?photo.thumbUrl:photo.src;
        if(!fallback && alternate && alternate!==primarySource){fallback=true;image.src=alternate;}
        else finish(new Error('Image unavailable'));
      };
      image.src = primarySource;
    });
    pendingImages.set(photo.src, promise);
    promise.finally(() => pendingImages.delete(photo.src)).catch(() => {});
    return promise;
  }
  function cancelRender() {
    renderVersion++;
    pictureAnimation?.cancel();
    loadStatus.hidden = true;
    carousel.removeAttribute('aria-busy');
  }
  dialog.addEventListener('close', cancelRender, { signal: pageScope.signal });
  dialog.addEventListener('lightbox-closing', cancelRender, { signal: pageScope.signal });
  pageScope.cleanup(cancelRender);
  window.renderPortfolioLightbox = async (photo, collection, select, options = {}) => {
    const version = ++renderVersion;
    pictureAnimation?.cancel();
    carousel.setAttribute('aria-busy', 'true');
    loadStatus.textContent = translate('Ładowanie zdjęcia…', 'Loading photo…');
    loadStatus.hidden = !photo.src || readyImages.has(photo.src);
    try {
      const prepared = await preparePhoto(photo);
      if (version !== renderVersion || pageScope.signal.aborted || !dialog.isConnected || !dialog.open) return;
      const animate = displayedPhoto && displayedPhoto.id !== photo.id && !mobile.matches && !reducedMotion.matches && carousel.animate;
      if (animate) {
        pictureAnimation = carousel.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: 'ease-in', fill: 'forwards' });
        await pictureAnimation.finished;
        if (version !== renderVersion || pageScope.signal.aborted || !dialog.open) return;
      }
      const outgoing = pictureAnimation;
      renderReadyPhoto(photo, collection, select, options, prepared);
      displayedPhoto = photo;
      if (animate) {
        pictureAnimation = carousel.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });
        outgoing?.cancel();
      }
      const index = collection.indexOf(photo);
      if (collection.length > 1) {
        for (const offset of [-1, 1]) preparePhoto(collection[(index + offset + collection.length) % collection.length]).catch(() => {});
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
  const colorCache = new Map();

  function sampleGlow(image) {
    if (colorCache.has(image.src)) return colorCache.get(image.src);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 48;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, 48, 48);
    const { data } = context.getImageData(0, 0, 48, 48);
    const buckets = new Map();
    for (let i = 0; i < data.length; i += 4) {
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      const high = Math.max(r, g, b),
        low = Math.min(r, g, b);
      if (data[i + 3] < 128 || high < 35 || low > 235) continue;
      const saturation = (high - low) / high;
      if (saturation < 0.3) continue;
      const difference = high - low;
      let hue =
        high === r
          ? ((g - b) / difference) % 6
          : high === g
            ? (b - r) / difference + 2
            : (r - g) / difference + 4;
      hue = (hue * 60 + 360) % 360;
      const key = Math.floor(hue / 15);
      const bucket = buckets.get(key) || { weight: 0, r: 0, g: 0, b: 0 };
      const weight = saturation ** 2 * Math.sqrt(high / 255);
      bucket.weight += weight;
      bucket.r += r * weight;
      bucket.g += g * weight;
      bucket.b += b * weight;
      buckets.set(key, bucket);
    }
    const dominant = [...buckets.values()].sort((a, b) => b.weight - a.weight)[0];
    if (!dominant) return 'rgba(98, 115, 220, 0.6)';
    const channels = [dominant.r, dominant.g, dominant.b].map((value) => value / dominant.weight);
    const boost = Math.min(2.2, 190 / Math.max(...channels));
    const color = `rgba(${channels.map((value) => Math.round(Math.min(255, value * boost))).join(', ')}, 0.65)`;
    colorCache.set(image.src, color);
    return color;
  }

  function fitText() {
    if(mobile.matches)return;
    information.querySelectorAll('.lightbox-value').forEach((value) => {
      value.style.fontSize = '';
      let size = parseFloat(getComputedStyle(value).fontSize);
      // Kafelki mogą rosnąć w pionie: nic nie jest ucinane ani zastępowane wielokropkiem.
      while (value.scrollWidth > value.clientWidth + 1 && size > 12) {
        size -= 0.5;
        value.style.fontSize = `${size}px`;
      }
    });
  }
  const observer = new ResizeObserver(() => requestAnimationFrame(fitText));
  observer.observe(information);
  pageScope.cleanup(() => {
    observer.disconnect();
  });

  function renderReadyPhoto(photo, collection, select, options, prepared) {
    dialog.classList.remove('is-loading-first');
    activePhoto = photo;
    activeCollection = collection;
    selectPhoto = select;
    const previous=dialog.querySelector('.lightbox-prev'), next=dialog.querySelector('.lightbox-next');
    if(mobile.matches){if(previous.parentElement!==pagination)pagination.prepend(previous);if(next.parentElement!==pagination)pagination.append(next);}else{if(previous.parentElement!==dialog)dialog.append(previous);if(next.parentElement!==dialog)dialog.append(next);}
    // Własny kolor zdjęcia działa również przy file://, gdzie canvas jest blokowany.
    dialog.style.setProperty('--dynamic-glow-color', photo.glowColor || 'rgba(98, 115, 220, 0.6)');
    if(mobile.matches){
      let frame=carousel.firstElementChild;
      if(!frame){frame=document.createElement('div');frame.className='lightbox-image is-active';carousel.append(frame);}
      frame.style.setProperty('--dynamic-glow-color',photo.glowColor||'rgba(98,115,220,.4)');
      const image=prepared;
      if(image){image.alt=local(photo.title);image.classList.add('is-ready');image.draggable=false;if(frame.firstElementChild!==image)frame.replaceChildren(image);}
      collectionKey='';
    }else{
    const key = JSON.stringify([mobile.matches, collection.map((item) => [item.id, item.src])]);
    if (key !== collectionKey) {
      collectionKey = key;
      carousel.replaceChildren();
      collection.forEach((item) => {
        const imageFrame = document.createElement('div');
        imageFrame.className = 'lightbox-image';
        imageFrame.style.setProperty(
          '--dynamic-glow-color',
          item.glowColor || 'rgba(98, 115, 220, 0.6)',
        );
        carousel.append(imageFrame);
        if (item.src) {
          const image = new Image();
          image.alt = local(item.title);
          image.decoding = 'async';
          image.loading = 'lazy';
          if (location.protocol !== 'file:') image.crossOrigin = 'anonymous';
          image.addEventListener(
            'load',
            () => {
              try {
                const color = sampleGlow(image);
                imageFrame.style.setProperty('--dynamic-glow-color', color);
                if (activePhoto === item) dialog.style.setProperty('--dynamic-glow-color', color);
              } catch {
                // Zachowaj kolor zapisany dla zdjęcia, zamiast wymuszać niebieską poświatę.
              }
            },
            { once: true },
          );
          image.src = image.dataset.loadedSource || item.src;
          imageFrame.append(image);
          const reveal = () => {
            if (pageScope.signal.aborted) return;
            image.classList.add('is-ready');
          };
          if (image.complete && image.naturalWidth) reveal();
          else image.addEventListener('load', async () => { try { await image.decode(); } catch {} reveal(); }, { once: true });
        } else {
          const placeholder = document.createElement('div');
          placeholder.className = 'photo-placeholder';
          placeholder.textContent = translate('Miejsce na zdjęcie', 'Photo placeholder');
          imageFrame.append(placeholder);
        }
      });
    }
    const selectedIndex = collection.indexOf(photo);
    [...carousel.children].forEach((frame, index) => {
      frame.classList.toggle('is-active', index === selectedIndex);
      const image = frame.querySelector('img');
      if (image) {
        image.alt = local(collection[index].title);
        image.loading = index === selectedIndex ? 'eager' : 'lazy';
      }
    });
    const selectedFrame = carousel.children[selectedIndex];

    if (selectedFrame) {
      const prepared = readyImages.get(photo.src);
      if (prepared) {
        const previous = selectedFrame.querySelector('img');
        if (previous !== prepared) { if (previous) previous.replaceWith(prepared); else selectedFrame.append(prepared); }
        prepared.alt = local(photo.title);
        prepared.classList.add('is-ready');
        try { selectedFrame.style.setProperty('--dynamic-glow-color', sampleGlow(prepared)); } catch {}
      }
      dialog.style.setProperty(
        '--dynamic-glow-color',
        selectedFrame.style.getPropertyValue('--dynamic-glow-color'),
      );

    }

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
    collection.forEach((item, position) => {
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
    requestAnimationFrame(fitText);
  };

};
if (!window.portfolioRouting) window.portfolioPages['lightbox.js']();
