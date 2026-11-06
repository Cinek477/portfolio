// Współdzielone ładowanie zdjęć, dekodowanie, anulowanie i mały cache LRU.
(function (host) {
  function createPhotoLoader({ createImage = () => new Image(), preferThumbnail = () => false, limit = 3, timeoutMs = 15000 } = {}) {
    const ready = new Map(), pending = new Map();
    const key = photo => preferThumbnail() && photo.thumbUrl ? photo.thumbUrl : photo.src;
    const failure = (message, name = 'Error') => Object.assign(new Error(message), { name });
    function load(photo) {
      if (!photo?.src) return Promise.resolve(null);
      const source = key(photo);
      if (ready.has(source)) {
        const image = ready.get(source); ready.delete(source); ready.set(source, image);
        return Promise.resolve(image);
      }
      if (pending.has(source)) return pending.get(source).promise;
      const image = createImage();
      image.decoding = 'async';
      let finish, timer, settled = false, fallback = false;
      const promise = new Promise((resolve, reject) => {
        finish = error => {
          if (settled) return;
          settled = true; clearTimeout(timer); image.onload = image.onerror = null;
          if (error) { reject(error); return; }
          image.dataset.loadedSource = image.src;
          ready.set(source, image);
          while (ready.size > limit) ready.delete(ready.keys().next().value);
          resolve(image);
        };
        image.onload = async () => {
          try { await image.decode(); } catch { /* A loaded image can still be displayed. */ }
          finish(image.naturalWidth ? null : failure('Empty image'));
        };
        image.onerror = () => {
          const alternate = source === photo.src ? photo.thumbUrl : photo.src;
          if (!fallback && alternate && alternate !== source) { fallback = true; image.src = alternate; }
          else finish(failure('Image unavailable'));
        };
        timer = setTimeout(() => {
          finish(failure('Image load timed out'));
          image.src = '';
        }, timeoutMs);
      });
      pending.set(source, { promise, cancel() { finish(failure('Image loading cancelled', 'AbortError')); image.src = ''; } });
      promise.finally(() => { if (pending.get(source)?.promise === promise) pending.delete(source); }).catch(() => {});
      image.src = source;
      return promise;
    }
    function cancelPending() { for (const item of pending.values()) item.cancel(); pending.clear(); }
    return { load, cancelOthers(photo) { const keep = key(photo); for (const [source, item] of pending) if (source !== keep) { item.cancel(); pending.delete(source); } }, has: photo => ready.has(key(photo)), cancelPending, dispose() { cancelPending(); ready.clear(); } };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { createPhotoLoader };
  else host.createPortfolioPhotoLoader = createPhotoLoader;
})(typeof window === 'undefined' ? globalThis : window);
