const test = require('node:test');
const assert = require('node:assert/strict');
const { createPhotoLoader } = require('../assets/js/photo-loader.js');
const photo = id => ({ src: `large-${id}.jpg`, thumbUrl: `thumb-${id}.jpg` });
function fixture(options = {}) {
  const images = [];
  const loader = createPhotoLoader({
    createImage() { const image = { dataset: {}, naturalWidth: 800, decode: async () => {} }; images.push(image); return image; },
    ...options,
  });
  return { images, loader, async complete() { await images.at(-1).onload(); } };
}
test('Photo loader reuses decoded images, deduplicates requests and bounds its LRU cache', async () => {
  const f = fixture({ limit: 3 });
  try {
    const a = f.loader.load(photo(1));
    assert.equal(f.loader.load(photo(1)), a);
    assert.equal(f.images.length, 1);
    await f.complete(); await a;
    assert.equal(await f.loader.load(photo(1)), f.images[0]);
    for (const id of [2, 3]) { const task = f.loader.load(photo(id)); await f.complete(); await task; }
    await f.loader.load(photo(1));
    const task = f.loader.load(photo(4)); await f.complete(); await task;
    assert.equal(f.loader.has(photo(1)), true);
    assert.equal(f.loader.has(photo(2)), false);
    assert.equal(f.loader.has(photo(3)), true);
    assert.equal(f.loader.has(photo(4)), true);
  } finally { f.loader.dispose(); }
});
test('Photo loader adapts image size and retries only once on an unavailable source', async () => {
  let thumbnail = true;
  const f = fixture({ preferThumbnail: () => thumbnail });
  try {
    let task = f.loader.load(photo(1));
    assert.equal(f.images[0].src, 'thumb-1.jpg');
    f.images[0].onerror(); assert.equal(f.images[0].src, 'large-1.jpg');
    await f.complete(); await task;
    thumbnail = false;
    task = f.loader.load(photo(1));
    assert.equal(f.images.length, 2);
    assert.equal(f.images[1].src, 'large-1.jpg');
    const rejected = assert.rejects(task, /unavailable/);
    f.images[1].onerror(); f.images[1].onerror(); await rejected;
  } finally { f.loader.dispose(); }
});
test('Closing cancels pending loading, clears callbacks and permits reopening', async () => {
  const f = fixture();
  const task = f.loader.load(photo(1));
  const rejected = assert.rejects(task, { name: 'AbortError' });
  f.loader.cancelPending(); await rejected;
  assert.equal(f.images[0].onload, null);
  assert.equal(f.images[0].onerror, null);
  assert.equal(f.images[0].src, '');
  const reopened = f.loader.load(photo(1)); await f.complete(); await reopened;
  assert.equal(f.loader.has(photo(1)), true);
  f.loader.dispose(); assert.equal(f.loader.has(photo(1)), false);
});
